/**
 * oracle 官方驱动 glue（oracledb thin 模式，createPool → getConnection）。
 * - 连接：user / password / database 必填（database 即 service name，缺省 INVALID_ARGUMENT）；
 *   connectString = `${host}:${port || 1521}/${database}`。
 *   池参数：poolMin:0 / poolMax:4 / poolIncrement:1 —— 惰性建连，按需扩容。
 * - query：从池取 connection → execute(改写 SQL, binds, { outFormat: OUT_FORMAT_OBJECT })
 *   → 用完必须 await connection.close() 归还池（finally 保证）。
 * - 参数：? 按出现顺序改写为 :1..:n（sqltext 引号/注释保护）；binds 用位置数组；
 *   null bind 需要显式类型（oracledb 约定），统一 { val:null, dir: BIND_IN, type: STRING }。
 * - ping：SELECT 1 FROM DUAL。
 * - 结果映射：result.rows（OUT_FORMAT_OBJECT 已是对象数组）→ 行集（columns 取首行键）；
 *   写语句 result.rowsAffected → changes，lastInsertRowid 恒为 null。
 * - 错误归一在 db.js；formatError 附带 err.errorNum（ORA-xxxxx 数字），message 原样含 ORA 前缀。
 * - mapOracleSelect/mapOracleExec 导出为纯函数（测试直测映射规则）。
 */
import oracledb from 'oracledb'
import { rewritePlaceholders, rethrowInvalid } from './sqltext.js'

/** ? → :1..:n 改写，扫描器 INVALID_ARGUMENT → DbError。 */
function rewriteSafe(ctx, statement) {
  try {
    return rewritePlaceholders(statement, ':')
  } catch (err) {
    rethrowInvalid(err, ctx.DbError)
  }
}

/** 位置 binds：undefined → null；null 需显式 STRING 类型（oracledb 对 NULL bind 的要求）。 */
function oracleBinds(params) {
  return params.map((v) => {
    if (v === undefined) return null
    if (v === null) return { val: null, dir: oracledb.BIND_IN, type: oracledb.STRING }
    return v
  })
}

/** 行集映射（纯函数）：result.rows → { columns, rows, rowCount, truncated }。 */
export function mapOracleSelect(result, normalizeCell, maxRows) {
  const list = result && Array.isArray(result.rows) ? result.rows : []
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

/** 写语句映射（纯函数）：rowsAffected → changes。 */
export function mapOracleExec(result) {
  return { changes: Number(result && result.rowsAffected) || 0, lastInsertRowid: null }
}

export function createOracleDriver(ctx) {
  /** 从池取连接执行并在 finally 归还。 */
  async function withConnection(handle, fn) {
    const conn = await handle.pool.getConnection()
    try {
      return await fn(conn)
    } finally {
      try { await conn.close() } catch { /* 已断开忽略 */ }
    }
  }
  return {
    key: 'oracle',
    /** oracledb 原始错误 → formatError 结构（附带 errorNum）。 */
    formatError(err) {
      return {
        message: err && err.message ? err.message : String(err),
        errno: err && err.errorNum != null ? Number(err.errorNum) : undefined,
      }
    },
    /** 打开：user/password/database(service name) 必填 → 建池（惰性，不建连）。 */
    async open(config) {
      const host = String(config && config.host ? config.host : '').trim()
      if (host === '') throw new ctx.DbError('INVALID_ARGUMENT', 'oracle 连接缺少 host')
      const user = config && config.user != null ? String(config.user) : ''
      if (user === '') throw new ctx.DbError('INVALID_ARGUMENT', 'oracle 连接缺少 user')
      const password = config && config.password != null ? String(config.password) : ''
      if (password === '') throw new ctx.DbError('INVALID_ARGUMENT', 'oracle 连接缺少 password')
      const database = config && config.database != null ? String(config.database) : ''
      if (database === '') throw new ctx.DbError('INVALID_ARGUMENT', 'oracle 连接缺少 database（service name）')
      const port = Number(config.port) > 0 ? Number(config.port) : 1521
      const pool = await oracledb.createPool({
        user,
        password,
        connectString: `${host}:${port}/${database}`,
        poolMin: 0,
        poolMax: 4,
        poolIncrement: 1,
      })
      return { pool }
    },
    /** 探活：SELECT 1 FROM DUAL。 */
    async ping(handle) {
      await withConnection(handle, async (conn) => {
        await conn.execute('SELECT 1 FROM DUAL')
      })
    },
    /** 行集：? → :n 改写 + binds；result.rows（对象数组）→ 行集。 */
    async select(handle, statement, params) {
      const rewritten = rewriteSafe(ctx, statement)
      const binds = oracleBinds(params)
      const result = await withConnection(handle, async (conn) => {
        return conn.execute(rewritten.sql, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT })
      })
      return mapOracleSelect(result, ctx.normalizeCell, ctx.maxRows)
    },
    /** 写语句：rowsAffected → changes。 */
    async exec(handle, statement, params) {
      const rewritten = rewriteSafe(ctx, statement)
      const binds = oracleBinds(params)
      const result = await withConnection(handle, async (conn) => {
        return conn.execute(rewritten.sql, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT })
      })
      return mapOracleExec(result)
    },
    /** 关闭：结束连接池。 */
    async close(handle) {
      await handle.pool.close()
    },
  }
}
