/**
 * postgresql 官方驱动 glue（pg，new Pool）。旧手写 wire-protocol 客户端已删除，由本文件接替。
 * - 连接：host / port（默认 5432）/ user（必填）/ password / database（必填）/ ssl:true →
 *   { rejectUnauthorized: false }。pg 的 Pool 惰性建连：new Pool 不建连，首条命令时建连。
 * - 参数：? 按出现顺序改写为 $1..$n（sqltext.rewritePlaceholders，单引号字符串/注释内的 ?
 *   不改写，无法安全改写抛 INVALID_ARGUMENT）；SQL 已含 $n 时原样透传，params 直接绑定。
 *   无参数走简单查询协议（COM Q），有参数 pg 自动走扩展协议（Parse/Bind/Describe/Execute/Sync）。
 * - ping：pool.query('SELECT 1')。
 * - 结果映射：SELECT/RETURNING（command + rowCount + rows）→ 行集（columns 取 fields 名）；
 *   写语句 CommandComplete tag（INSERT oid n / UPDATE n / DELETE n，pg 已把行数解析进 rowCount）
 *   → changes（rowCount null，如 CREATE TABLE → 0），lastInsertRowid 恒为 null。
 * - 错误归一在 db.js；formatError 组装「severity SQLSTATE: 原始 message」并把 5 位 SQLSTATE
 *   挂为 sqlState 属性（网络错误 ECONNREFUSED 等原样透传 message）。
 */
import pg from 'pg'
import { rewritePlaceholders, rethrowInvalid } from './sqltext.js'

/** ? → $1..$n 改写，扫描器 INVALID_ARGUMENT → DbError。 */
function rewriteSafe(ctx, sql) {
  try {
    return rewritePlaceholders(sql, '$')
  } catch (err) {
    rethrowInvalid(err, ctx.DbError)
  }
}

export function createPgDriver(ctx) {
  return {
    key: 'postgresql',
    /** pg 原始错误 → formatError 结构（附带 sqlState = 5 位 SQLSTATE）。 */
    formatError(err) {
      const message = err && err.message ? err.message : String(err)
      const code = err && typeof err.code === 'string' && /^[0-9A-Z]{5}$/.test(err.code) ? err.code : null
      const severity = err && err.severity ? String(err.severity) : null
      const parts = []
      if (severity) parts.push(severity)
      if (code) parts.push(code)
      return {
        message: parts.length ? parts.join(' ') + ': ' + message : message,
        sqlState: code || undefined,
      }
    },
    /** 打开：建池（不建连）；user/database 缺失 → INVALID_ARGUMENT。 */
    async open(config) {
      const host = String(config && config.host ? config.host : '').trim()
      if (host === '') throw new ctx.DbError('INVALID_ARGUMENT', 'postgresql 连接缺少 host')
      const user = config && config.user != null ? String(config.user) : ''
      if (user === '') throw new ctx.DbError('INVALID_ARGUMENT', 'postgresql 连接缺少 user')
      const database = config && config.database != null ? String(config.database) : ''
      if (database === '') throw new ctx.DbError('INVALID_ARGUMENT', 'postgresql 连接缺少 database')
      const port = Number(config.port) > 0 ? Number(config.port) : 5432
      const options = {
        host,
        port,
        user,
        password: config && config.password != null ? String(config.password) : undefined,
        database,
      }
      if (config && config.ssl === true) options.ssl = { rejectUnauthorized: false }
      return { pool: new pg.Pool(options) }
    },
    /** 探活：SELECT 1（简单查询，复用池内空闲连接）。 */
    async ping(handle) {
      await handle.pool.query('SELECT 1')
    },
    /** 行集：有参数先改写 ? → $n；columns 取 fields 名；rowCount 为截断前总行数。 */
    async select(handle, sql, params) {
      const rewritten = rewriteSafe(ctx, sql)
      const result = params.length
        ? await handle.pool.query(rewritten.sql, params)
        : await handle.pool.query(rewritten.sql)
      const list = Array.isArray(result.rows) ? result.rows : []
      const rows = list.slice(0, ctx.maxRows).map((row) => {
        const out = {}
        for (const [k, v] of Object.entries(row || {})) out[k] = ctx.normalizeCell(v)
        return out
      })
      const fields = Array.isArray(result.fields) ? result.fields : null
      const columns = fields && fields.length
        ? fields.map((f) => String(f && f.name))
        : rows.length ? Object.keys(rows[0]) : []
      return { columns, rows, rowCount: list.length, truncated: list.length > ctx.maxRows }
    },
    /** 写语句：CommandComplete 行数（pg 解析进 rowCount）→ changes；INSERT 无独立 oid 语义。 */
    async exec(handle, sql, params) {
      const rewritten = rewriteSafe(ctx, sql)
      const result = params.length
        ? await handle.pool.query(rewritten.sql, params)
        : await handle.pool.query(rewritten.sql)
      return { changes: Number(result && result.rowCount) || 0, lastInsertRowid: null }
    },
    /** 关闭：结束池内全部连接（每连接发 Terminate 'X'）。 */
    async close(handle) {
      await handle.pool.end()
    },
  }
}
