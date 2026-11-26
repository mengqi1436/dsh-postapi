/**
 * GaussDB 官方驱动 glue（gaussdb-node，华为云 HuaweiCloudDeveloper/gaussdb-node 官方发布，
 * node-postgres 官方适配分支：在 PG v3 wire protocol 上支持 GaussDB/openGauss 的 sha256 认证）。
 * - 连接：host / port（默认 5432；GaussDB DWS 常见 8000，按服务实际端口填）/ user（必填）/
 *   password / database（必填）/ ssl:true → { rejectUnauthorized: false }。Pool 惰性建连。
 * - 参数：? 按出现顺序改写为 $1..$n（sqltext.rewritePlaceholders，单引号字符串/注释/美元引用内
 *   的 ? 不改写，无法安全改写抛 INVALID_ARGUMENT）；SQL 已含 $n 时原样透传直接绑定。
 * - 结果映射：行集（fields 名 / 首行键 + rowCount 截断前总数）；写语句 → changes（rowCount），
 *   lastInsertRowid 恒为 null。
 * - 错误归一在 db.js；formatError 组装「severity SQLSTATE: 原始 message」（同 pg 形态）。
 */
import gaussdb from 'gaussdb-node'
import { rewritePlaceholders, rethrowInvalid } from './sqltext.js'

/** ? → $1..$n 改写，扫描器 INVALID_ARGUMENT → DbError。 */
function rewriteSafe(ctx, sql) {
  try {
    return rewritePlaceholders(sql, '$')
  } catch (err) {
    rethrowInvalid(err, ctx.DbError)
  }
}

export function createGaussdbDriver(ctx) {
  return {
    key: 'gaussdb',
    /** gaussdb-node 原始错误 → formatError 结构（附带 sqlState = 5 位 SQLSTATE）。 */
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
    /** 打开：建池（不建连）；host/user/database 缺失 → INVALID_ARGUMENT。 */
    async open(config) {
      const host = String(config && config.host ? config.host : '').trim()
      if (host === '') throw new ctx.DbError('INVALID_ARGUMENT', 'gaussdb 连接缺少 host')
      const user = config && config.user != null ? String(config.user) : ''
      if (user === '') throw new ctx.DbError('INVALID_ARGUMENT', 'gaussdb 连接缺少 user')
      const database = config && config.database != null ? String(config.database) : ''
      if (database === '') throw new ctx.DbError('INVALID_ARGUMENT', 'gaussdb 连接缺少 database（GaussDB/openGauss 数据库名）')
      const port = Number(config.port) > 0 ? Number(config.port) : 5432
      const options = {
        host,
        port,
        user,
        password: config && config.password != null ? String(config.password) : undefined,
        database,
      }
      if (config && config.ssl === true) options.ssl = { rejectUnauthorized: false }
      return { pool: new gaussdb.Pool(options) }
    },
    /** 探活：SELECT 1（复用池内空闲连接）。 */
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
    /** 写语句：CommandComplete 行数 → changes；lastInsertRowid null。 */
    async exec(handle, sql, params) {
      const rewritten = rewriteSafe(ctx, sql)
      const result = params.length
        ? await handle.pool.query(rewritten.sql, params)
        : await handle.pool.query(rewritten.sql)
      return { changes: Number(result && result.rowCount) || 0, lastInsertRowid: null }
    },
    /** 关闭：结束池内全部连接。 */
    async close(handle) {
      await handle.pool.end()
    },
  }
}
