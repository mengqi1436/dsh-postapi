/**
 * mssql 官方驱动 glue（mssql / tedious，ConnectionPool）。
 * - 连接：server=host / user / password / database / port（缺省由 tedious 决定 1433）；
 *   encrypt 语义：ssl:true → options.encrypt=true + trustServerCertificate=true（自签证书可用）；
 *   ssl:false → options.encrypt=false（明文）；未配置 → 维持 mssql 默认（encrypt:true）。
 *   open() 显式 await pool.connect()（tedious 池不会隐式建连），认证失败（ELOGIN）在此暴露。
 * - 参数：? 按出现顺序改写为 @p0..@pn（sqltext 引号/注释保护），逐个 req.input('p'+i, v)。
 *   Request 用完无需手动 close（mssql v12 在结果消费完成后自动回收）。
 * - ping：pool.request().query('SELECT 1')。
 * - 结果映射：recordsets[0] → 行集（columns 取首行键；无行 → []）；rowsAffected 求和 → changes；
 *   lastInsertRowid 恒为 null（TDS 无独立 insert id 语义）。
 * - 错误归一在 db.js；formatError 附带 err.code（EREQUEST/ELOGIN 等）与 err.number（TDS 错误号）。
 * - mapMssqlSelect/mapMssqlExec 导出为纯函数（测试直测映射规则）。
 */
import sql from 'mssql'
import { rewritePlaceholders, rethrowInvalid } from './sqltext.js'

/** ? → @p0.. 改写，扫描器 INVALID_ARGUMENT → DbError。 */
function rewriteSafe(ctx, statement) {
  try {
    return rewritePlaceholders(statement, '@p')
  } catch (err) {
    rethrowInvalid(err, ctx.DbError)
  }
}

/** 行集映射（纯函数）：recordsets[0] → { columns, rows, rowCount, truncated }。 */
export function mapMssqlSelect(result, normalizeCell, maxRows) {
  const recordsets = result && Array.isArray(result.recordsets) ? result.recordsets : []
  const recordset = recordsets.length ? recordsets[0] : []
  const list = Array.isArray(recordset) ? recordset : []
  const rows = list.slice(0, maxRows).map((row) => {
    const out = {}
    for (const [k, v] of Object.entries(row || {})) out[k] = normalizeCell(v)
    return out
  })
  return {
    columns: rows.length ? Object.keys(rows[0]) : [],
    rows,
    rowCount: list.length,
    truncated: list.length > maxRows,
  }
}

/** 写语句映射（纯函数）：rowsAffected 各段求和 → changes。 */
export function mapMssqlExec(result) {
  const affected = result && Array.isArray(result.rowsAffected) ? result.rowsAffected : []
  const changes = affected.reduce((sum, n) => sum + (Number(n) || 0), 0)
  return { changes, lastInsertRowid: null }
}

export function createMssqlDriver(ctx) {
  return {
    key: 'mssql',
    /** mssql 原始错误 → formatError 结构（附带 code 与 number）。 */
    formatError(err) {
      const message = err && err.message ? err.message : String(err)
      const parts = []
      if (err && err.code != null) parts.push(String(err.code))
      if (err && err.number != null) parts.push('number ' + err.number)
      return {
        message: parts.length ? parts.join(' ') + ': ' + message : message,
        errno: err && err.number != null ? Number(err.number) : undefined,
      }
    },
    /** 打开：校验 host/user → 建池并显式 connect（认证失败在此抛出）。 */
    async open(config) {
      const host = String(config && config.host ? config.host : '').trim()
      if (host === '') throw new ctx.DbError('INVALID_ARGUMENT', 'mssql 连接缺少 host')
      const user = config && config.user != null ? String(config.user) : ''
      if (user === '') throw new ctx.DbError('INVALID_ARGUMENT', 'mssql 连接缺少 user')
      const options = {}
      if (config.ssl === true) {
        options.encrypt = true
        options.trustServerCertificate = true
      } else if (config.ssl === false) {
        options.encrypt = false
      }
      const pool = new sql.ConnectionPool({
        server: host,
        port: Number(config.port) > 0 ? Number(config.port) : undefined,
        user,
        password: config && config.password != null ? String(config.password) : undefined,
        database: config && config.database != null && String(config.database) !== '' ? String(config.database) : undefined,
        options,
      })
      await pool.connect()
      return { pool }
    },
    /** 探活：SELECT 1。 */
    async ping(handle) {
      const req = handle.pool.request()
      await req.query('SELECT 1')
    },
    /** 行集：? → @pn 改写 + input 绑定；recordsets[0] → 行集。 */
    async select(handle, statement, params) {
      const rewritten = rewriteSafe(ctx, statement)
      const req = handle.pool.request()
      params.forEach((v, i) => req.input('p' + i, v === undefined ? null : v))
      const result = await req.query(rewritten.sql)
      return mapMssqlSelect(result, ctx.normalizeCell, ctx.maxRows)
    },
    /** 写语句：rowsAffected 求和 → changes。 */
    async exec(handle, statement, params) {
      const rewritten = rewriteSafe(ctx, statement)
      const req = handle.pool.request()
      params.forEach((v, i) => req.input('p' + i, v === undefined ? null : v))
      const result = await req.query(rewritten.sql)
      return mapMssqlExec(result)
    },
    /** 关闭：结束连接池。 */
    async close(handle) {
      await handle.pool.close()
    },
  }
}
