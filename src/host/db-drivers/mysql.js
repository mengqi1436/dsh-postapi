/**
 * mysql 官方驱动 glue（mysql2/promise，createPool）。旧手写 wire-protocol 客户端已删除，由本文件接替。
 * - 连接：host / port（默认 3306）/ user / password / database / connectionLimit:4；
 *   ssl:true → { rejectUnauthorized: false }；supportBigNumbers:true —— int8 超过安全整数
 *   自动降级为字符串（精度不丢），小整数仍为 number（mysql2 默认 supportBigNumbers:false 会丢精度）。
 * - query：pool.query(sql, params)（text protocol，mysql2 内置引号/注释感知的 ? 替换与转义）。
 *   mysql2 的 pool 是惰性连接池：createPool 不建连，首条命令/ping 时建连。
 * - ping：从池中取连接发 COM_PING（conn.ping()），用完 release 归还。
 * - 结果映射：返回数组 → 行集（columns 取 fields 名，空行集回退首行键）；
 *   ResultSetHeader → { changes: affectedRows, lastInsertRowid: insertId || null }。
 * - 契约保留（沿用旧驱动语义）：Buffer/Uint8Array 参数 → INVALID_ARGUMENT；
 *   SQL 内 ? 个数必须与 params 个数一致（mysql2 默认静默忽略多余/保留缺失 ?，这里收紧为显式校验）。
 * - 错误归一在 db.js（open/ping → CONNECTION_ERROR；select/exec → SQL_ERROR）；
 *   formatError 提取 errno/sqlState 组装「SQLSTATE errno N: 原始 message」，并把 errno/sqlState
 *   作为附加属性挂到 DbError 上（与旧驱动错误断言兼容）。
 */
import { createPool } from 'mysql2/promise'
import { countPlaceholders, rethrowInvalid } from './sqltext.js'

/** 旧契约校验：Buffer 参数拒绝 + ? 占位符个数与参数个数严格一致。 */
function assertLegacyParams(ctx, sql, params) {
  for (const v of params) {
    if (v instanceof Uint8Array) {
      throw new ctx.DbError('INVALID_ARGUMENT', 'mysql 参数不支持 Buffer/Uint8Array（请先转字符串或十六进制字面量）')
    }
  }
  let count
  try {
    count = countPlaceholders(sql)
  } catch (err) {
    rethrowInvalid(err, ctx.DbError)
  }
  if (count !== params.length) {
    throw new ctx.DbError('INVALID_ARGUMENT', `SQL 内 ? 占位符 ${count} 个与参数 ${params.length} 个不一致`)
  }
}

export function createMysqlDriver(ctx) {
  return {
    key: 'mysql',
    /** mysql2 原始错误 → formatError 结构（message 含 SQLSTATE/errno，附带 errno/sqlState 属性）。 */
    formatError(err) {
      const errno = err && err.errno
      const sqlState = err && err.sqlState
      const message = err && err.message ? err.message : String(err)
      const parts = []
      if (sqlState != null) parts.push(String(sqlState))
      if (errno != null) parts.push('errno ' + errno)
      return {
        message: parts.length ? parts.join(' ') + ': ' + message : message,
        errno: errno != null ? Number(errno) : undefined,
        sqlState: sqlState != null ? String(sqlState) : undefined,
      }
    },
    /** 打开：建池（不建连）；参数缺失 → INVALID_ARGUMENT，连接/认证失败由 db.js 归一。 */
    async open(config) {
      const host = String(config && config.host ? config.host : '').trim()
      if (host === '') throw new ctx.DbError('INVALID_ARGUMENT', 'mysql 连接缺少 host')
      const user = config && config.user != null ? String(config.user) : ''
      if (user === '') throw new ctx.DbError('INVALID_ARGUMENT', 'mysql 连接缺少 user')
      const port = Number(config.port) > 0 ? Number(config.port) : 3306
      const options = {
        host,
        port,
        user,
        password: config && config.password != null ? String(config.password) : '',
        database: config && config.database != null ? String(config.database) : '',
        connectionLimit: 4,
        supportBigNumbers: true,
      }
      if (config && config.ssl === true) options.ssl = { rejectUnauthorized: false }
      return { pool: createPool(options) }
    },
    /** 探活：取池内连接发 COM_PING，用完归还。 */
    async ping(handle) {
      const conn = await handle.pool.getConnection()
      try {
        await conn.ping()
      } finally {
        conn.release()
      }
    },
    /** 行集：columns 取 fields 名（空行集仍可得列名），rows 归一，rowCount 为截断前总数。 */
    async select(handle, sql, params) {
      assertLegacyParams(ctx, sql, params)
      const [raw, fields] = await handle.pool.query(sql, params)
      const list = Array.isArray(raw) ? raw : []
      const rows = list.slice(0, ctx.maxRows).map((row) => {
        const out = {}
        for (const [k, v] of Object.entries(row || {})) out[k] = ctx.normalizeCell(v)
        return out
      })
      let columns
      if (Array.isArray(fields) && fields.length) columns = fields.map((f) => String(f && f.name))
      else columns = rows.length ? Object.keys(rows[0]) : []
      return { columns, rows, rowCount: list.length, truncated: list.length > ctx.maxRows }
    },
    /** 写语句：ResultSetHeader → changes/lastInsertRowid（insertId 0 → null）。 */
    async exec(handle, sql, params) {
      assertLegacyParams(ctx, sql, params)
      const [raw] = await handle.pool.query(sql, params)
      const info = Array.isArray(raw) ? raw[0] : raw
      return {
        changes: Number(info && info.affectedRows) || 0,
        lastInsertRowid: info && info.insertId ? Number(info.insertId) : null,
      }
    },
    /** 关闭：池内全部连接 COM_QUIT 后结束。 */
    async close(handle) {
      await handle.pool.end()
    },
  }
}
