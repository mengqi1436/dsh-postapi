/**
 * mongodb 官方驱动 glue（mongodb 官方包，MongoClient）。
 * - 连接：config.url 存在则优先使用；否则由 host / port（默认 27017）/ user / password 拼串
 *   `mongodb://[user:pass@]host:port`（user/password URL 编码）。database 必填
 *   （缺省 INVALID_ARGUMENT —— 命令都要挂在具体 db 上）。
 * - query：sql 必须是 JSON 对象文档（parseMongoCommand：解析失败/非对象 → INVALID_ARGUMENT，
 *   提示「MongoDB 需要命令文档 JSON，如 {"find":"users","filter":{},"limit":10}」）
 *   → client.db(database).command(doc) → jsonSafeMongoOutput(result)（bigint→字符串、
 *   Buffer→base64、Date→ISO 字符串，循环引用标记 [Circular]）。
 *   db.js 统一包装为 { driver:'mongodb', output }；命令型驱动无多语句限制。
 * - ping：db.command({ ping: 1 })。
 * - close：client.close()。
 * - 错误归一在 db.js（connect/认证失败发生在 open/ping → CONNECTION_ERROR；command 失败 → SQL_ERROR）。
 */
import { MongoClient } from 'mongodb'
import { parseMongoCommand, jsonSafeMongoOutput, rethrowInvalid } from './sqltext.js'

export function createMongodbDriver(ctx) {
  return {
    key: 'mongodb',
    /** mongodb 原始错误 → formatError 结构。 */
    formatError(err) {
      return { message: err && err.message ? err.message : String(err) }
    },
    /** 打开：database 必填；url 优先，否则按 host/port/user/password 拼串并 connect。 */
    async open(config) {
      const database = config && config.database != null ? String(config.database) : ''
      if (database === '') throw new ctx.DbError('INVALID_ARGUMENT', 'mongodb 连接缺少 database')
      let url = config && typeof config.url === 'string' && config.url.trim() !== '' ? config.url.trim() : ''
      if (url === '') {
        const host = String(config && config.host ? config.host : '').trim()
        if (host === '') throw new ctx.DbError('INVALID_ARGUMENT', 'mongodb 连接缺少 host（或直接提供 url）')
        const port = Number(config.port) > 0 ? Number(config.port) : 27017
        const user = config && config.user != null ? String(config.user) : ''
        const userinfo = user !== ''
          ? encodeURIComponent(user) + ':' + encodeURIComponent(config.password != null ? String(config.password) : '') + '@'
          : ''
        url = `mongodb://${userinfo}${host}:${port}`
      }
      const client = new MongoClient(url)
      await client.connect()
      return { client, database }
    },
    /** 探活：db.command({ ping: 1 })。 */
    async ping(handle) {
      await handle.client.db(handle.database).command({ ping: 1 })
    },
    /**
     * 命令文档执行：JSON 文档 → db.command → JSON 安全化对象。
     * db.js 包装为 { driver:'mongodb', output }。
     */
    async command(handle, statement) {
      let doc
      try {
        doc = parseMongoCommand(statement)
      } catch (err) {
        rethrowInvalid(err, ctx.DbError)
      }
      const result = await handle.client.db(handle.database).command(doc)
      return jsonSafeMongoOutput(result)
    },
    /** 关闭：断开 MongoClient。 */
    async close(handle) {
      await handle.client.close()
    },
  }
}
