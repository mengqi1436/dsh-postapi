/** T3 请求服务测试：契约 §2 §7。node:http 本地 echo server，不依赖外网。 */
import assert from 'node:assert/strict'
import http from 'node:http'
import { once } from 'node:events'
import { createRequestService } from '../src/host/request.js'

function startEchoServer() {
  const server = http.createServer((req, res) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString()
      if (req.url.startsWith('/hang')) {
        // 挂起不响应，供超时 abort 用例；unref 定时器兜底销毁防连接泄漏
        const t = setTimeout(() => req.socket.destroy(), 2000)
        t.unref()
        return
      }
      if (req.url.startsWith('/status/500')) {
        res.writeHead(500, { 'Content-Type': 'text/plain' })
        res.end('boom')
        return
      }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ method: req.method, url: req.url, headers: req.headers, body }))
    })
  })
  server.listen(0, '127.0.0.1')
  return { server, listening: once(server, 'listening') }
}

async function withEchoServer(fn) {
  const { server, listening } = startEchoServer()
  await listening
  const port = server.address().port
  const base = `http://127.0.0.1:${port}`
  try {
    return await fn(createRequestService(), base)
  } finally {
    server.close()
    await once(server, 'close')
  }
}

export const tests = [
  {
    name: 'request: 前置脚本 pm.variables.set 的变量参与请求模板替换（Apifox 语义）',
    fn: () => withEchoServer(async (svc, base) => {
      const res = await svc.send({
        method: 'GET',
        url: `${base}/echo?uid={{myId}}`,
        preScript: 'pm.variables.set("myId", "42")',
      })
      assert.equal(res.status, 200)
      const echoed = JSON.parse(res.body)
      assert.ok(echoed.url.includes('uid=42'), `前置脚本变量应替换占位符: ${echoed.url}`)
      assert.equal(res.variables.myId, '42')
    }),
  },
  {
    name: 'request: params 拼 query，enabled=false 不拼',
    fn: () => withEchoServer(async (svc, base) => {
      const res = await svc.send({
        method: 'GET', url: `${base}/echo`,
        params: [
          { key: 'a', value: '1', enabled: true },
          { key: 'b', value: '2', enabled: false },
        ],
      })
      assert.equal(res.status, 200)
      const echoed = JSON.parse(res.body)
      assert.ok(echoed.url.startsWith('/echo?'), `query 未拼接: ${echoed.url}`)
      assert.ok(echoed.url.includes('a=1'))
      assert.ok(!echoed.url.includes('b=2'))
    }),
  },
  {
    name: 'request: POST json body 原样发送 + 默认 Content-Type + 响应字段完整',
    fn: () => withEchoServer(async (svc, base) => {
      const res = await svc.send({
        method: 'POST', url: `${base}/echo`,
        body: { type: 'json', content: '{"x":1}' },
      })
      assert.equal(res.status, 200)
      assert.equal(res.statusText, 'OK')
      assert.ok(res.headers['content-type'])
      assert.ok(res.bodySize > 0)
      assert.ok(res.timeMs >= 0)
      const echoed = JSON.parse(res.body)
      assert.equal(echoed.method, 'POST')
      assert.equal(echoed.body, '{"x":1}')
      assert.match(echoed.headers['content-type'], /application\/json/)
    }),
  },
  {
    name: 'request: header 透传 + bearer/basic auth 注入 Authorization',
    fn: () => withEchoServer(async (svc, base) => {
      const r1 = await svc.send({
        method: 'GET', url: `${base}/echo`,
        headers: { 'X-Trace': 'trace-1' },
        auth: { type: 'bearer', token: 'tk-123' },
      })
      let echoed = JSON.parse(r1.body)
      assert.equal(echoed.headers['x-trace'], 'trace-1')
      assert.equal(echoed.headers['authorization'], 'Bearer tk-123')

      const r2 = await svc.send({
        method: 'GET', url: `${base}/echo`,
        auth: { type: 'basic', username: 'u1', password: 'p1' },
      })
      echoed = JSON.parse(r2.body)
      assert.equal(echoed.headers['authorization'], `Basic ${Buffer.from('u1:p1').toString('base64')}`)
    }),
  },
  {
    name: 'request: 超时 abort 返回 timeout 错误结构',
    fn: () => withEchoServer(async (svc, base) => {
      const res = await svc.send({ method: 'GET', url: `${base}/hang`, timeoutMs: 100 })
      assert.equal(res.status, 0)
      assert.equal(res.error.kind, 'timeout')
      assert.ok(res.error.message)
      assert.ok(res.timeMs >= 80, `耗时异常: ${res.timeMs}ms`)
    }),
  },
  {
    name: 'request: 非 2xx 原样返回 status，无 error 字段',
    fn: () => withEchoServer(async (svc, base) => {
      const res = await svc.send({ method: 'GET', url: `${base}/status/500` })
      assert.equal(res.status, 500)
      assert.equal(res.body, 'boom')
      assert.equal(res.error, undefined)
    }),
  },
  {
    name: 'request: 连接失败错误结构化为 network',
    fn: async () => {
      const svc = createRequestService()
      // 本机 discard 端口 9 无监听，立即 ECONNREFUSED，不依赖外网
      const res = await svc.send({ method: 'GET', url: 'http://127.0.0.1:9/echo', timeoutMs: 1000 })
      assert.equal(res.status, 0)
      assert.equal(res.error.kind, 'network')
      assert.ok(res.error.message)
    },
  },
]
