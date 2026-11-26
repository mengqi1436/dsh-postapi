/**
 * 数据库操作（feature-matrix 域 9：sqlite/mysql/postgresql 三驱动全部真实现）。
 * - sqlite：node:sqlite 内置模块；mysql/postgresql：src/host/db-drivers/ 下自实现 wire protocol
 *   （node:net/node:tls/node:crypto，零 npm 依赖）。
 * - 连接按配置指纹复用：query 反复执行不重开；acquire 时轻量存活探测（sqlite SELECT 1、
 *   mysql COM_PING、postgresql SELECT 1），失败丢弃重开一次；close 丢弃并断开；closeAll 收尾。
 * - query：SELECT/PRAGMA/WITH → { driver, columns, rows, rowCount, truncated? }（上限 MAX_ROWS）；
 *   写语句 → { driver, changes, lastInsertRowid|null }（mysql 取 OK 包 affected/insert id，
 *   postgresql 解析 CommandComplete tag）。
 * - UNSUPPORTED_DRIVER 保留给未知 type（已知三驱动不再报该错）。
 */
import { DatabaseSync } from 'node:sqlite'
import { createHash } from 'node:crypto'
import { createMysqlDriver } from './db-drivers/mysql.js'
import { createPgDriver } from './db-drivers/pg.js'

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

export const SUPPORTED_DRIVERS = ['sqlite', 'mysql', 'postgresql']

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

const SELECT_RE = /^\s*(select|pragma|with)\b/i

/** sqlite 驱动：node:sqlite 同步 API 包装（原实现路径，行为不变）。 */
function createSqliteDriver(ctx) {
  return {
    key: 'sqlite',
    open(config) {
      const file = String(config.path || '').trim()
      if (file === '') throw new ctx.DbError('INVALID_ARGUMENT', 'sqlite 连接缺少 path（数据库文件路径，可用 :memory:）')
      return { db: new DatabaseSync(file) }
    },
    async ping(handle) {
      handle.db.prepare('SELECT 1').get()
    },
    async select(handle, sql, params) {
      const raw = handle.db.prepare(sql).all(...params)
      const rows = raw.slice(0, ctx.maxRows).map((row) => {
        const out = {}
        for (const [k, v] of Object.entries(row || {})) out[k] = ctx.normalizeCell(v)
        return out
      })
      return { columns: rows.length ? Object.keys(rows[0]) : [], rows, rowCount: raw.length, truncated: raw.length > ctx.maxRows }
    },
    async exec(handle, sql, params) {
      const info = handle.db.prepare(sql).run(...params)
      return {
        changes: Number(info && info.changes) || 0,
        lastInsertRowid: info && info.lastInsertRowid != null ? Number(info.lastInsertRowid) : null,
      }
    },
    async close(handle) {
      handle.db.close()
    },
  }
}

/** 驱动注册表：统一 open/ping/select/exec/close 接口。ctx 注入 DbError/上限/归一（避免循环依赖）。 */
const DRIVER_CONTEXT = { DbError, maxRows: MAX_ROWS, normalizeCell }
const DRIVERS = {
  sqlite: createSqliteDriver(DRIVER_CONTEXT),
  mysql: createMysqlDriver(DRIVER_CONTEXT),
  postgresql: createPgDriver(DRIVER_CONTEXT),
}

/** 按 type 解析驱动；未知 type → UNSUPPORTED_DRIVER（400）。 */
function resolveDriver(config) {
  const type = String(config && config.type ? config.type : 'sqlite').toLowerCase()
  const driver = DRIVERS[type]
  if (!driver) {
    throw new DbError('UNSUPPORTED_DRIVER', `暂未内置 ${type || '未知'} 驱动（当前支持：${SUPPORTED_DRIVERS.join('、')}）`)
  }
  return { type, driver }
}

export function createDbService() {
  const pool = new Map()

  /** 取（或复用）连接；句柄失效（探测失败）时丢弃重开一次。 */
  async function acquire(config) {
    const key = connectionKey(config)
    const cached = pool.get(key)
    if (cached) {
      try {
        await cached.driverImpl.ping(cached.handle)
        return cached
      } catch {
        pool.delete(key)
        try { await cached.driverImpl.close(cached.handle) } catch { /* 已断开忽略 */ }
      }
    }
    const resolved = resolveDriver(config)
    const handle = await resolved.driver.open(config)
    const entry = { key, driver: resolved.type, driverImpl: resolved.driver, handle }
    pool.set(key, entry)
    return entry
  }

  return {
    /**
     * test({ connection })：开连接跑探测（sqlite SELECT 1 / mysql COM_PING / pg SELECT 1）后关闭
     * （只验证，不留连接）。→ { ok, driver, message }；失败 { ok:false, error:{code,message} }，不抛出。
     */
    async test({ connection } = {}) {
      const config = connection && typeof connection === 'object' ? connection : {}
      try {
        const resolved = resolveDriver(config)
        const handle = await resolved.driver.open(config)
        try {
          await resolved.driver.ping(handle)
        } finally {
          try { await resolved.driver.close(handle) } catch { /* 已关忽略 */ }
        }
        return { ok: true, driver: resolved.type, message: '连接成功' }
      } catch (err) {
        return {
          ok: false,
          error: { code: err && err.code ? err.code : 'DB_ERROR', message: err && err.message ? err.message : String(err) },
        }
      }
    },

    /**
     * query({ connection, sql, params=[] })：
     * SELECT/PRAGMA/WITH → { driver, columns, rows, rowCount, truncated }（上限 1000 行）；
     * 其余语句 → { driver, changes, lastInsertRowid|null }。
     * mysql：text protocol + 客户端参数转义；postgresql：无参数 Simple Query、有参数扩展协议。
     */
    async query({ connection, sql, params } = {}) {
      const statement = String(sql == null ? '' : sql).trim()
      if (statement === '') throw new DbError('INVALID_ARGUMENT', 'sql 不能为空')
      // 结尾分号是正常 SQL；只有中间出现分号（多语句）才拒绝
      const bare = statement.replace(/;+\s*$/, '')
      if (bare.includes(';')) {
        throw new DbError('INVALID_ARGUMENT', '一次只执行一条语句（多语句请拆分）')
      }
      const list = Array.isArray(params) ? params : []
      const entry = await acquire(connection && typeof connection === 'object' ? connection : {})
      try {
        if (SELECT_RE.test(statement)) {
          const r = await entry.driverImpl.select(entry.handle, statement, list)
          return {
            driver: entry.driver,
            columns: r.columns,
            rows: r.rows,
            rowCount: r.rowCount,
            truncated: r.truncated,
          }
        }
        const r = await entry.driverImpl.exec(entry.handle, statement, list)
        return {
          driver: entry.driver,
          changes: r.changes,
          lastInsertRowid: r.lastInsertRowid,
        }
      } catch (err) {
        if (err instanceof DbError) throw err
        throw new DbError('SQL_ERROR', err && err.message ? err.message : String(err))
      }
    },

    /** close({ connection })：丢弃池内连接并断开。 */
    async close({ connection } = {}) {
      const key = connectionKey(connection && typeof connection === 'object' ? connection : {})
      const entry = pool.get(key)
      if (!entry) return { ok: true, closed: false }
      pool.delete(key)
      try { await entry.driverImpl.close(entry.handle) } catch { /* 已断开忽略 */ }
      return { ok: true, closed: true }
    },

    /** closeAll()：插件卸载收尾。 */
    async closeAll() {
      const entries = [...pool.values()]
      pool.clear()
      for (const entry of entries) {
        try { await entry.driverImpl.close(entry.handle) } catch { /* 已断开忽略 */ }
      }
      return { closed: entries.length }
    },
  }
}
