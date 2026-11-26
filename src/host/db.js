/**
 * 数据库操作（feature-matrix 域 9：数据库操作由 P2 占位提升为 P1 真实现）。
 * 当前驱动：sqlite（node:sqlite 内置模块，零依赖）；mysql/postgresql 未内置驱动，
 * 显式报 UNSUPPORTED_DRIVER（400），不做假实现。
 * 连接按配置指纹复用：query 反复执行不重开；close/closeAll 收尾。
 */
import { DatabaseSync } from 'node:sqlite'
import { createHash } from 'node:crypto'

const MAX_ROWS = 1000

/** 带状态码的 DB 错误：bridge 外层 catch 按 status/code 转 JSON 封套（ duck-typing BridgeError）。 */
export class DbError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'DbError'
    this.code = code
    this.status = 400
  }
}

export const SUPPORTED_DRIVERS = ['sqlite']

/** 连接配置指纹：同配置复用连接。password 参与指纹但不回传。 */
function connectionKey(config) {
  const norm = {}
  for (const k of ['type', 'path', 'host', 'port', 'user', 'password', 'database']) {
    norm[k] = config && config[k] != null ? String(config[k]) : ''
  }
  return createHash('sha1').update(JSON.stringify(norm)).digest('hex').slice(0, 16)
}

/** JSON 安全化：bigint → 字符串（精度不丢），BLOB(Uint8Array) → base64，其余原样。 */
function normalizeCell(value) {
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Uint8Array) return Buffer.from(value).toString('base64')
  return value
}

function openConnection(config) {
  const type = String(config && config.type ? config.type : 'sqlite').toLowerCase()
  if (SUPPORTED_DRIVERS.includes(type)) {
    const file = String((config && config.path) || '').trim()
    if (file === '') throw new DbError('INVALID_ARGUMENT', 'sqlite 连接缺少 path（数据库文件路径，可用 :memory:）')
    return { db: new DatabaseSync(file), driver: 'sqlite' }
  }
  throw new DbError('UNSUPPORTED_DRIVER', `暂未内置 ${type || '未知'} 驱动（当前支持：sqlite；mysql/postgresql 需独立驱动包，插件不捆绑）`)
}

const SELECT_RE = /^\s*(select|pragma|with)\b/i

export function createDbService() {
  const pool = new Map()

  /** 取（或复用）连接；句柄失效时重开一次。 */
  function acquire(config) {
    const key = connectionKey(config)
    const cached = pool.get(key)
    if (cached) {
      try {
        cached.db.prepare('SELECT 1').get()
        return cached
      } catch {
        pool.delete(key)
      }
    }
    const opened = openConnection(config)
    const entry = { ...opened, key }
    pool.set(key, entry)
    return entry
  }

  return {
    /**
     * test({ connection })：开连接跑 SELECT 1 后关闭（只验证，不留连接）。
     * → { ok, driver, message }；失败 { ok:false, error:{code,message} }，不抛出。
     */
    async test({ connection } = {}) {
      const config = connection && typeof connection === 'object' ? connection : {}
      try {
        const opened = openConnection(config)
        try {
          opened.db.prepare('SELECT 1').get()
        } finally {
          try { opened.db.close() } catch { /* 已关忽略 */ }
        }
        return { ok: true, driver: opened.driver, message: '连接成功' }
      } catch (err) {
        return {
          ok: false,
          error: { code: err && err.code ? err.code : 'DB_ERROR', message: err && err.message ? err.message : String(err) },
        }
      }
    },

    /**
     * query({ connection, sql, params=[] })：
     * SELECT/PRAGMA/WITH → { columns, rows, rowCount }（上限 1000 行）；
     * 其余语句 → { changes, lastInsertRowid }。
     */
    async query({ connection, sql, params } = {}) {
      const statement = String(sql == null ? '' : sql).trim()
      if (statement === '') throw new DbError('INVALID_ARGUMENT', 'sql 不能为空')
      // 结尾分号是正常 SQL；只有中间出现分号（多语句）才拒绝
      const bare = statement.replace(/;+\s*$/, '')
      if (bare.includes(';')) {
        throw new DbError('INVALID_ARGUMENT', '一次只执行一条语句（多语句请拆分）')
      }
      const opened = acquire(connection && typeof connection === 'object' ? connection : {})
      const list = Array.isArray(params) ? params : []
      try {
        if (SELECT_RE.test(statement)) {
          const stmt = opened.db.prepare(statement)
          const raw = stmt.all(...list)
          const rows = raw.slice(0, MAX_ROWS).map((row) => {
            const out = {}
            for (const [k, v] of Object.entries(row || {})) out[k] = normalizeCell(v)
            return out
          })
          return {
            driver: opened.driver,
            columns: rows.length ? Object.keys(rows[0]) : [],
            rows,
            rowCount: raw.length,
            truncated: raw.length > MAX_ROWS,
          }
        }
        const stmt = opened.db.prepare(statement)
        const info = stmt.run(...list)
        return {
          driver: opened.driver,
          changes: Number(info && info.changes) || 0,
          lastInsertRowid: info && info.lastInsertRowid != null ? Number(info.lastInsertRowid) : null,
        }
      } catch (err) {
        throw new DbError('SQL_ERROR', err && err.message ? err.message : String(err))
      }
    },

    /** close({ connection })：丢弃池内连接并关闭。 */
    async close({ connection } = {}) {
      const key = connectionKey(connection && typeof connection === 'object' ? connection : {})
      const entry = pool.get(key)
      if (!entry) return { ok: true, closed: false }
      pool.delete(key)
      try { entry.db.close() } catch { /* 已关忽略 */ }
      return { ok: true, closed: true }
    },

    /** closeAll()：插件卸载收尾。 */
    async closeAll() {
      const entries = [...pool.values()]
      pool.clear()
      for (const entry of entries) {
        try { entry.db.close() } catch { /* 已关忽略 */ }
      }
      return { closed: entries.length }
    },
  }
}
