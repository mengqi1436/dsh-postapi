/**
 * redis 官方驱动 glue（redis 官方包 v6，createClient）。
 * - 连接：createClient({ socket: { host, port || 6379 }, password?, database? })，
 *   database 为 db 序号（number）。惰性 connect：open 只建 client 不连，
 *   首条命令（ping/query）前 ensureConnected() —— 认证失败（WRONGPASS）在 connect 时暴露。
 * - query：sql 为单条命令行，按空白切参（splitRedisCommandLine：双/单引号包裹含空格参数，
 *   同引号可反斜杠转义；未闭合/空命令 → INVALID_ARGUMENT）→ client.sendCommand(args)。
 * - 返回值：{ driver:'redis', output: <归一值> }（db.js 包装 output）；
 *   normalizeRedisValue：Buffer→utf8 字符串、数组/Set→逐项归一（字符串数组）、Map→对象、
 *   number/boolean/string/bigint 原样或字符串化、null 保持 null。
 * - ping：PING 命令。
 * - close：client.disconnect()（未连接时跳过）。
 * - 错误归一在 db.js（connect/认证 → CONNECTION_ERROR；sendCommand 执行错 → SQL_ERROR）。
 */
import { createClient } from 'redis'
import { splitRedisCommandLine, normalizeRedisValue, rethrowInvalid } from './sqltext.js'

export function createRedisDriver(ctx) {
  return {
    key: 'redis',
    /** redis 原始错误 → formatError 结构。 */
    formatError(err) {
      return { message: err && err.message ? err.message : String(err) }
    },
    /** 打开：host 必填；建 client（惰性连接，不 connect）。 */
    async open(config) {
      const host = String(config && config.host ? config.host : '').trim()
      if (host === '') throw new ctx.DbError('INVALID_ARGUMENT', 'redis 连接缺少 host')
      const port = Number(config.port) > 0 ? Number(config.port) : 6379
      const socket = { host, port }
      const options = { socket }
      const password = config && config.password != null && String(config.password) !== '' ? String(config.password) : null
      if (password) options.password = password
      const database = Number(config && config.database) > 0 ? Math.trunc(Number(config.database)) : null
      if (database != null) options.database = database
      return { client: createClient(options) }
    },
    /** 惰性 connect：未连接时建立连接（含 AUTH/SELECT db），失败 → 连接类错误。 */
    async ensureConnected(handle) {
      if (!handle.client.isOpen) await handle.client.connect()
    },
    /** 探活：PING。 */
    async ping(handle) {
      await this.ensureConnected(handle)
      await handle.client.sendCommand(['PING'])
    },
    /** 命令行执行：切参 → sendCommand → 值归一。db.js 包装为 { driver:'redis', output }。 */
    async command(handle, statement) {
      await this.ensureConnected(handle)
      let args
      try {
        args = splitRedisCommandLine(statement)
      } catch (err) {
        rethrowInvalid(err, ctx.DbError)
      }
      const value = await handle.client.sendCommand(args)
      return normalizeRedisValue(value)
    },
    /** 关闭：disconnect（硬断开，不等待积压回复）。 */
    async close(handle) {
      if (handle.client.isOpen) await handle.client.disconnect()
    },
  }
}
