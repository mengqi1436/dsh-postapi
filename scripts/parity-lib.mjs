/**
 * 复测/压测共享 helper：本地目标服务（HTTP + WS echo）与小工具。
 * 供 scripts/parity-retest.mjs 与 scripts/stress-test.mjs 复用。
 */
import http from 'node:http'
import crypto from 'node:crypto'

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** 多帧感知的 WS echo：文本帧回显（支持一包多帧与扩展长度），close 帧应答。 */
function wsHandle(socket) {
  let buf = Buffer.alloc(0)
  socket.on('data', (chunk) => {
    buf = Buffer.concat([buf, chunk])
    for (;;) {
      if (buf.length < 2) return
      const opcode = buf[0] & 0x0f
      let len = buf[1] & 0x7f
      let offset = 2
      if (len === 126) {
        if (buf.length < 4) return
        len = buf.readUInt16BE(2)
        offset = 4
      } else if (len === 127) {
        if (buf.length < 10) return
        len = Number(buf.readBigUInt64BE(2))
        offset = 10
      }
      const masked = (buf[1] & 0x80) !== 0
      const maskLen = masked ? 4 : 0
      if (buf.length < offset + maskLen + len) return
      if (opcode === 0x8) {
        socket.write(Buffer.from([0x88, 0x00]))
        socket.destroy()
        return
      }
      if (opcode === 0x1 || opcode === 0x2) {
        const mask = buf.slice(offset, offset + maskLen)
        const out = Buffer.from(buf.slice(offset + maskLen, offset + maskLen + len))
        for (let i = 0; i < out.length && masked; i += 1) out[i] ^= mask[i % 4]
        const header = out.length < 126
          ? Buffer.from([0x81, out.length])
          : Buffer.concat([Buffer.from([0x81, 126]), (() => { const b = Buffer.alloc(2); b.writeUInt16BE(out.length); return b })()])
        socket.write(Buffer.concat([header, out]))
      }
      buf = buf.slice(offset + maskLen + len)
    }
  })
}

function sendJson(res, status, payload) {
  const text = JSON.stringify(payload)
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(text) })
  res.end(text)
}

/** 本地目标服务：固定 HTTP 路由（/hello /users/7 /echo /graphql /status/500 /delay/N /big /huge /redirect）+ WS 升级回显 + 请求观察器。 */
export async function startTarget() {
  const seen = []
  const conns = new Set()
  const server = http.createServer((req, res) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8')
      seen.push({ method: req.method, url: req.url, headers: { ...req.headers }, body })
      const u = new URL(req.url, 'http://target.local')
      if (u.pathname === '/hello') return sendJson(res, 200, { ok: true, msg: 'hello' })
      if (u.pathname === '/users/7') return sendJson(res, 200, { id: 7, name: 'seven' })
      if (u.pathname === '/echo') {
        return sendJson(res, 200, { method: req.method, contentType: req.headers['content-type'] || '', auth: req.headers.authorization || '', xHeader: req.headers['x-test'] || '', body })
      }
      if (u.pathname === '/graphql') {
        let parsed = {}
        try { parsed = JSON.parse(body) } catch { /* 保持空对象 */ }
        return sendJson(res, 200, { query: parsed.query || '', variables: parsed.variables || null })
      }
      if (u.pathname === '/status/500') return sendJson(res, 500, { err: true })
      if (u.pathname.startsWith('/delay/')) {
        const ms = Number(u.pathname.split('/')[2]) || 0
        return setTimeout(() => sendJson(res, 200, { delayed: ms }), ms)
      }
      if (u.pathname === '/big') {
        const payload = 'x'.repeat(3 * 1024 * 1024)
        res.writeHead(200, { 'Content-Type': 'text/plain', 'Content-Length': Buffer.byteLength(payload) })
        return res.end(payload)
      }
      if (u.pathname === '/huge') {
        const payload = 'y'.repeat(20 * 1024 * 1024)
        res.writeHead(200, { 'Content-Type': 'text/plain', 'Content-Length': Buffer.byteLength(payload) })
        return res.end(payload)
      }
      if (u.pathname === '/redirect') {
        res.writeHead(302, { Location: '/hello' })
        return res.end()
      }
      sendJson(res, 404, { notFound: true })
    })
  })
  server.on('connection', (c) => { conns.add(c); c.on('close', () => conns.delete(c)) })
  server.on('upgrade', (req, socket) => {
    conns.add(socket)
    socket.on('close', () => conns.delete(socket))
    const accept = crypto.createHash('sha1')
      .update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
      .digest('base64')
    socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n')
    seen.push({ method: 'WSUPGRADE', url: req.url, headers: { ...req.headers }, body: '' })
    wsHandle(socket)
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const base = 'http://127.0.0.1:' + server.address().port
  const wsBase = 'ws://127.0.0.1:' + server.address().port + '/ws'
  return {
    base, wsBase, seen,
    last: () => seen[seen.length - 1],
    close: () => {
      for (const c of conns) c.destroy()
      server.closeAllConnections()
      try { server.close() } catch { /* 已停则忽略 */ }
    },
  }
}
