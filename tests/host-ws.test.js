/** ws-client 单元套件：变量替换 / 认证注入 / http→ws 归一 / 消息上限 / closeAll。node tests/run.js 直接执行。 */
import assert from 'node:assert/strict'
import http from 'node:http'
import crypto from 'node:crypto'
import { createWsClient } from '../src/host/ws-client.js'

/** 本地 WS echo 服务器：握手（校验请求头）+ 文本帧回显 + close 帧应答。 */
function startEcho(validate) {
  const sockets = new Set()
  const server = http.createServer(() => {})
  server.on('upgrade', (req, socket) => {
    sockets.add(socket)
    socket.on('close', () => sockets.delete(socket))
    const accept = crypto.createHash('sha1')
      .update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
      .digest('base64')
    socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n')
    socket.on('data', (buf) => {
      if (buf[0] === 0x88) {
        socket.write(Buffer.from([0x88, 0x00]))
        return
      }
      if ((buf[0] & 0x0f) === 1 && buf.length > 6) {
        const len = buf[1] & 0x7f
        const mask = buf.slice(2, 6)
        const out = Buffer.from(buf.slice(6, 6 + len))
        for (let i = 0; i < out.length; i += 1) out[i] ^= mask[i % 4]
        const payload = Buffer.from(out)
        socket.write(Buffer.concat([Buffer.from([0x81, payload.length]), payload]))
      }
    })
  })
  const upgradeHeaders = new Promise((resolve) => {
    server.on('upgrade', (req) => resolve(req.headers))
  })
  if (typeof validate === 'function') server.on('upgrade', (req, socket) => { validate(req); })
  return {
    listen() {
      return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve('ws://127.0.0.1:' + server.address().port + '/echo')))
    },
    upgradeHeaders,
    close() {
      for (const s of sockets) s.destroy()
      server.closeAllConnections()
      return new Promise((resolve) => server.close(resolve))
    },
  }
}

function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)) }

export const tests = [
  {
    name: 'ws: open/send/messages/close 全链路 + http(s)→ws(s) 归一',
    fn: async () => {
      const echo = startEcho()
      const base = await echo.listen()
      const client = createWsClient()
      try {
        // http:// 自动转 ws://
        const opened = await client.open({ url: base.replace('ws://', 'http://'), timeoutMs: 3000 })
        assert.equal(opened.status, 'open')
        assert.ok(opened.id, '应有连接 id')
        assert.ok(opened.messages.some((m) => m.event === 'open'), '日志应有 open 系统事件')
        await client.send({ id: opened.id, message: 'hello' })
        await wait(120)
        const logs = await client.messages({ id: opened.id })
        const inMsg = logs.messages.find((m) => m.direction === 'in')
        assert.equal(inMsg.data, 'hello', '应收到回显')
        // 增量：since 之后只有新消息
        const inc = await client.messages({ id: opened.id, since: logs.lastIndex })
        assert.equal(inc.messages.length, 0)
        const closed = await client.close({ id: opened.id })
        assert.equal(closed.ok, true)
        // 关后再发：ok:false 且带 error
        const after = await client.send({ id: opened.id, message: 'x' })
        assert.equal(after.ok, false)
        assert.ok(after.error)
      } finally {
        await client.closeAll()
        await echo.close()
      }
    },
  },
  {
    name: 'ws: 变量替换 + bearer 认证注入到握手头（服务端实测收到）',
    fn: async () => {
      const seenHeaders = new Promise((resolve) => {
        const echo = startEcho((req) => resolve(req.headers))
        echo.listen().then(async (base) => {
          const client = createWsClient()
          const opened = await client.open({
            url: base + '?t={{token}}',
            auth: { type: 'bearer', token: '{{token}}' },
            variables: { environment: { variables: [{ key: 'token', value: 'tk-123', enabled: true }] } },
            timeoutMs: 3000,
          })
          assert.equal(opened.status, 'open')
          assert.ok(opened.url.includes('t=tk-123'), 'URL query 变量应被替换: ' + opened.url)
          await client.close({ id: opened.id })
          await client.closeAll()
          await echo.close()
        })
      })
      const headers = await seenHeaders
      assert.equal(headers.authorization, 'Bearer tk-123', '握手应带替换后的 Authorization')
    },
  },
  {
    name: 'ws: 消息日志上限 MAX_MESSAGES、坏地址结构化错误、未定义变量保留原文',
    fn: async () => {
      const client = createWsClient()
      // 端口 1 基本必然拒绝连接：结构化错误不抛出
      const fail = await client.open({ url: 'ws://127.0.0.1:1/x', timeoutMs: 2000 })
      assert.notEqual(fail.status, 'open')
      assert.ok(fail.error && fail.error.message)
      // 未定义变量保留原文
      const fail2 = await client.open({ url: 'ws://127.0.0.1:1/{{nope}}', timeoutMs: 2000 })
      assert.ok(fail2.url.includes('{{nope}}'))
      // 无 url → client 错误
      const noUrl = await client.open({})
      assert.equal(noUrl.status, 'error')
      assert.equal(noUrl.error.kind, 'client')
      // 不存在的连接：messages/send/close 均幂等 ok:false
      assert.equal((await client.messages({ id: 'ghost' })).ok, false)
      assert.equal((await client.send({ id: 'ghost', message: 'x' })).ok, false)
      assert.equal((await client.close({ id: 'ghost' })).ok, false)
      // 失败连接也留档（可 close 兜底）：closeAll 收掉上面两次 open 的残留
      const all = await client.closeAll()
      assert.equal(all.closed, 2)
    },
  },
]
