/**
 * 数据库操作（feature-matrix 域 9：七驱动全部真实现，全部走 npm 官方驱动）。
 * - sqlite：node:sqlite 内置模块（原实现路径与行为一字不改）。
 * - mysql：mysql2/promise；postgresql：pg；mssql：mssql(tedious)；oracle：oracledb(thin)；
 *   mongodb：mongodb；redis：redis —— 均为 package.json dependencies 中的官方包，
 *   在 src/host/db-drivers/ 各 glue 文件模块顶部静态 import（宿主端 Node 环境加载；打包只涉及 client）。
 *   旧手写 wire-protocol 客户端（db-drivers/mysql.js、pg.js 协议实现）已删除，由官方驱动接替。
 * - 连接按配置指纹复用：query 反复执行不重开；acquire 指纹命中时先轻量存活探测
 *   （sqlite SELECT 1 / mysql COM_PING / pg·mssql·oracle SELECT 1 / mongo command({ping:1}) / redis PING），
 *   失败丢弃重开一次；close 丢弃并断开；closeAll 收尾。password 参与指纹但不回传。
 * - query：SQL 型驱动（sqlite/mysql/postgresql/mssql/oracle）
 *   SELECT/PRAGMA/WITH → { driver, columns, rows, rowCount, truncated? }（上限 MAX_ROWS=1000）；
 *   写语句 → { driver, changes, lastInsertRowid|null }。
 *   命令型驱动：mongodb（命令文档 JSON）→ { driver:'mongodb', output }；redis（命令行）→
 *   { driver:'redis', output }。命令型驱动不受「中间分号多语句拒绝」约束（该约束只保留给 SQL 型驱动）。
 * - SQL 型驱动保留「中间分号多语句拒绝、结尾分号合法、空 sql INVALID_ARGUMENT」。
 * - 错误归一 DbError（带 status 400）：open/ping 失败（含认证失败、网络不可达）→ CONNECTION_ERROR；
 *   select/exec/command 执行错 → SQL_ERROR（带驱动原始 message，formatError 可附带 errno/sqlState）；
 *   INVALID_ARGUMENT 保留给参数校验（空 sql、多语句、缺必填配置、? 改写不安全等）；
 *   UNSUPPORTED_DRIVER 只给未知 type。
 * - createDbService({ drivers })：可选注入缝（只增）——按 type 覆盖默认驱动工厂，测试注入 fake 用。
 *   驱动内部接口：{ key, open(config), ping(handle), select?(handle,sql,params),
 *   exec?(handle,sql,params), command?(handle,statement,params), close(handle), formatError?(err) }。
 *   SQL 型驱动实现 select/exec；命令型实现 command；formatError 可选（返回 { message, errno?, sqlState? }）。
 */
import { DatabaseSync } from 'node:sqlite'
import { createHash } from 'node:crypto'
import { createMysqlDriver } from './db-drivers/mysql.js'
import { createPgDriver } from './db-drivers/pg.js'
import { createGaussdbDriver } from './db-drivers/gaussdb.js'
import { createMssqlDriver } from './db-drivers/mssql.js'
import { createOracleDriver } from './db-drivers/oracle.js'
import { createMongodbDriver } from './db-drivers/mongodb.js'
import { createRedisDriver } from './db-drivers/redis.js'

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

export const SUPPORTED_DRIVERS = ['sqlite', 'mysql', 'postgresql', 'mssql', 'oracle', 'mongodb', 'redis', 'gaussdb']

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

/** 驱动注册表：统一 open/ping/select/exec/command/close 接口。ctx 注入 DbError/上限/归一（避免循环依赖）。 */
const DRIVER_CONTEXT = { DbError, maxRows: MAX_ROWS, normalizeCell }
const DRIVER_FACTORIES = {
  sqlite: createSqliteDriver,
  mysql: createMysqlDriver,
  postgresql: createPgDriver,
  gaussdb: createGaussdbDriver,
  mssql: createMssqlDriver,
  oracle: createOracleDriver,
  mongodb: createMongodbDriver,
  redis: createRedisDriver,
}

/** 按 type 解析驱动；未知 type → UNSUPPORTED_DRIVER（400），已知七驱动不报该错。 */
function resolveDriver(registry, config) {
  const type = String(config && config.type ? config.type : 'sqlite').toLowerCase()
  const driver = registry[type]
  if (!driver) {
    throw new DbError('UNSUPPORTED_DRIVER', `暂未内置 ${type || '未知'} 驱动（当前支持：${SUPPORTED_DRIVERS.join('、')}）`)
  }
  return { type, driver }
}

/**
 * 驱动错误归一：kind 'conn'（open/ping，含认证失败）→ CONNECTION_ERROR；
 * kind 'sql'（select/exec/command 执行）→ SQL_ERROR。驱动 formatError 可覆盖 message
 * 并附带 errno/sqlState；DbError 原样透传（INVALID_ARGUMENT 等校验错误不改码）。
 */
function wrapDriverError(driver, err, kind) {
  if (err instanceof DbError) return err
  const code = kind === 'conn' ? 'CONNECTION_ERROR' : 'SQL_ERROR'
  let message = err && err.message ? err.message : String(err)
  const extra = {}
  if (driver && typeof driver.formatError === 'function') {
    const formatted = driver.formatError(err)
    if (formatted) {
      if (formatted.message) message = String(formatted.message)
      if (formatted.errno != null) extra.errno = Number(formatted.errno)
      if (formatted.sqlState != null) extra.sqlState = String(formatted.sqlState)
    }
  }
  const wrapped = new DbError(code, message)
  Object.assign(wrapped, extra)
  return wrapped
}

export function createDbService({ drivers } = {}) {
  /** 组装注册表：drivers[type] 覆盖默认官方驱动工厂（测试注入 fake 用）。 */
  const registry = {}
  for (const type of SUPPORTED_DRIVERS) {
    const factory = drivers && drivers[type] ? drivers[type] : DRIVER_FACTORIES[type]
    registry[type] = factory(DRIVER_CONTEXT)
  }
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
    const resolved = resolveDriver(registry, config)
    let handle
    try {
      handle = await resolved.driver.open(config)
    } catch (err) {
      throw wrapDriverError(resolved.driver, err, 'conn')
    }
    const entry = { key, driver: resolved.type, driverImpl: resolved.driver, handle }
    pool.set(key, entry)
    return entry
  }

  return {
    /**
     * test({ connection })：开连接跑探测（sqlite SELECT 1 / mysql COM_PING / pg·mssql·oracle SELECT 1 /
     * mongo command({ping:1}) / redis PING）后关闭（只验证，不留池）。→ { ok, driver, message }；
     * 失败 { ok:false, error:{code,message} }，不抛出。
     */
    async test({ connection } = {}) {
      const config = connection && typeof connection === 'object' ? connection : {}
      try {
        const resolved = resolveDriver(registry, config)
        let handle
        try {
          handle = await resolved.driver.open(config)
        } catch (err) {
          throw wrapDriverError(resolved.driver, err, 'conn')
        }
        try {
          await resolved.driver.ping(handle)
        } catch (err) {
          throw wrapDriverError(resolved.driver, err, 'conn')
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
     * SQL 型驱动：SELECT/PRAGMA/WITH → { driver, columns, rows, rowCount, truncated }（上限 1000 行）；
     * 其余语句 → { driver, changes, lastInsertRowid|null }。
     * 命令型驱动（mongodb/redis）：sql 为命令文档/命令行 → { driver, output }。
     */
    async query({ connection, sql, params } = {}) {
      const config = connection && typeof connection === 'object' ? connection : {}
      const statement = String(sql == null ? '' : sql).trim()
      if (statement === '') throw new DbError('INVALID_ARGUMENT', 'sql 不能为空')
      const resolved = resolveDriver(registry, config)
      const driver = resolved.driver
      // 中间分号多语句拒绝只保留给 SQL 型驱动（mongo/redis 命令文本可含分号）
      const isSqlCommand = typeof driver.select === 'function' || typeof driver.exec === 'function'
      if (isSqlCommand) {
        const bare = statement.replace(/;+\s*$/, '')
        if (bare.includes(';')) {
          throw new DbError('INVALID_ARGUMENT', '一次只执行一条语句（多语句请拆分）')
        }
      }
      const list = Array.isArray(params) ? params : []
      const entry = await acquire(config)
      try {
        if (typeof driver.command === 'function') {
          const output = await driver.command(entry.handle, statement, list)
          return { driver: entry.driver, output }
        }
        if (SELECT_RE.test(statement)) {
          const r = await driver.select(entry.handle, statement, list)
          return {
            driver: entry.driver,
            columns: r.columns,
            rows: r.rows,
            rowCount: r.rowCount,
            truncated: r.truncated,
          }
        }
        const r = await driver.exec(entry.handle, statement, list)
        return {
          driver: entry.driver,
          changes: r.changes,
          lastInsertRowid: r.lastInsertRowid,
        }
      } catch (err) {
        throw wrapDriverError(driver, err, 'sql')
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
