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
  {
    name: 'request: 全局 query / header 合并——同名时接口参数与接口头优先',
    fn: () => withEchoServer(async (svc, base) => {
      const res = await svc.send({
        method: 'GET',
        url: `${base}/echo`,
        params: [{ key: 'page', value: '2', enabled: true }],
        headers: [{ key: 'X-Common', value: 'local', enabled: true }],
        globalParams: {
          query: [
            { key: 'page', value: '1', enabled: true },
            { key: 'src', value: 'global', enabled: true },
            { key: 'off', value: 'x', enabled: false }, // enabled=false 不参与合并
          ],
          headers: [
            { key: 'X-Common', value: 'global', enabled: true },
            { key: 'X-Only-Global', value: 'g', enabled: true },
          ],
          cookies: [],
        },
      })
      assert.equal(res.status, 200)
      const echoed = JSON.parse(res.body)
      assert.ok(echoed.url.includes('page=2'), `接口同名 query 应覆盖全局: ${echoed.url}`)
      assert.ok(echoed.url.includes('src=global'), `全局 query 应追加: ${echoed.url}`)
      assert.ok(!echoed.url.includes('off='), 'enabled=false 的全局 query 不应出现')
      assert.equal(echoed.headers['x-common'], 'local')
      assert.equal(echoed.headers['x-only-global'], 'g')
    }),
  },
  {
    name: 'request: cookies 合并 Cookie 头（接口 cookies 在前、全局 cookies 在后；显式 Cookie 头优先）',
    fn: () => withEchoServer(async (svc, base) => {
      const r1 = await svc.send({
        method: 'GET',
        url: `${base}/echo`,
        cookies: [
          { key: 'session', value: 'ep-1', enabled: true },
          { key: 'off', value: 'x', enabled: false },
        ],
        globalParams: { query: [], headers: [], cookies: [{ key: 'gp', value: '2', enabled: true }] },
      })
      let echoed = JSON.parse(r1.body)
      assert.equal(echoed.headers.cookie, 'session=ep-1; gp=2', `Cookie 合并顺序不符: ${echoed.headers.cookie}`)

      // 接口已显式带 Cookie 头：遵循同名接口头优先，不再覆盖
      const r2 = await svc.send({
        method: 'GET',
        url: `${base}/echo`,
        headers: [{ key: 'Cookie', value: 'explicit=1', enabled: true }],
        cookies: [{ key: 'session', value: 'ep-1', enabled: true }],
        globalParams: { query: [], headers: [], cookies: [{ key: 'gp', value: '2', enabled: true }] },
      })
      echoed = JSON.parse(r2.body)
      assert.equal(echoed.headers.cookie, 'explicit=1', '显式 Cookie 头应优先于 cookies 合并结果')
    }),
  },
  {
    name: 'request: globalAuth 兜底——接口 auth.type=none 才生效，接口自带认证不覆盖',
    fn: () => withEchoServer(async (svc, base) => {
      // 接口 none：全局 bearer 兜底注入
      const r1 = await svc.send({
        method: 'GET', url: `${base}/echo`,
        auth: { type: 'none', token: '', username: '', password: '', key: '', value: '', addTo: 'header' },
        globalAuth: { type: 'bearer', token: 'g-tk', username: '', password: '', key: '', value: '', addTo: 'header' },
      })
      let echoed = JSON.parse(r1.body)
      assert.equal(echoed.headers.authorization, 'Bearer g-tk')

      // 接口缺 auth 字段：同样兜底
      const r2 = await svc.send({
        method: 'GET', url: `${base}/echo`,
        globalAuth: { type: 'basic', token: '', username: 'u', password: 'p', key: '', value: '', addTo: 'header' },
      })
      echoed = JSON.parse(r2.body)
      assert.equal(echoed.headers.authorization, `Basic ${Buffer.from('u:p').toString('base64')}`)

      // 接口自带 bearer：全局认证不覆盖
      const r3 = await svc.send({
        method: 'GET', url: `${base}/echo`,
        auth: { type: 'bearer', token: 'ep-tk', username: '', password: '', key: '', value: '', addTo: 'header' },
        globalAuth: { type: 'bearer', token: 'g-tk', username: '', password: '', key: '', value: '', addTo: 'header' },
      })
      echoed = JSON.parse(r3.body)
      assert.equal(echoed.headers.authorization, 'Bearer ep-tk')

      // 接口 none + 全局也是 none：不注入
      const r4 = await svc.send({
        method: 'GET', url: `${base}/echo`,
        auth: { type: 'none' },
        globalAuth: { type: 'none', token: '', username: '', password: '', key: '', value: '', addTo: 'header' },
      })
      echoed = JSON.parse(r4.body)
      assert.equal(echoed.headers.authorization, undefined)
    }),
  },
  {
    name: 'request: 项目级前后置脚本先于/后于接口脚本执行，日志前缀与 request 改写生效',
    fn: () => withEchoServer(async (svc, base) => {
      const res = await svc.send({
        method: 'GET', url: `${base}/echo`,
        projectPreScript: 'console.log("project-pre"); pm.request.headers["X-From-Project-Pre"] = "1"',
        preScript: 'console.log("ep-pre"); pm.request.url = pm.request.url + "?fromPre=1"',
        postScript: 'console.log("ep-post")',
        projectPostScript: 'console.log("project-post"); pm.variables.set("projVar", "v1")',
      })
      assert.equal(res.status, 200)
      // 顺序：项目前置 → 接口前置 → 接口后置 → 项目后置
      assert.deepStrictEqual(res.logs, [
        'project pre log: project-pre',
        'pre log: ep-pre',
        'post log: ep-post',
        'project post log: project-post',
      ], `脚本执行顺序/日志前缀不符: ${JSON.stringify(res.logs)}`)
      const echoed = JSON.parse(res.body)
      // 项目前置脚本改的 header 与接口前置脚本改的 url 都生效（同一 request 上下文链式传递）
      assert.equal(echoed.headers['x-from-project-pre'], '1')
      assert.ok(echoed.url.includes('fromPre=1'), `接口前置脚本的 url 改写丢失: ${echoed.url}`)
      assert.equal(res.variables.projVar, 'v1')
    }),
  },
  {
    name: 'request: 回归——不传全局合并字段时行为与原先完全一致（无 Cookie 注入 / 无全局参数 / 日志为空）',
    fn: () => withEchoServer(async (svc, base) => {
      const res = await svc.send({
        method: 'GET',
        url: `${base}/echo`,
        params: [{ key: 'a', value: '1', enabled: true }],
        headers: [{ key: 'X-Trace', value: 't1', enabled: true }],
      })
      assert.equal(res.status, 200)
      const echoed = JSON.parse(res.body)
      assert.ok(echoed.url.includes('a=1'))
      assert.ok(!echoed.url.includes('src='), '无 globalParams.query 时不应出现全局参数')
      assert.equal(echoed.headers.cookie, undefined, '无 cookies 字段时不应注入 Cookie 头')
      assert.equal(echoed.headers.authorization, undefined, '无 auth/globalAuth 时不应注入 Authorization')
      assert.equal(echoed.headers['x-trace'], 't1')
      assert.deepStrictEqual(res.logs, [], '无脚本时日志应为空')
      // 全局字段为 undefined / 空对象时同样零副作用
      const res2 = await svc.send({
        method: 'GET', url: `${base}/echo?a=1`,
        globalParams: { headers: [], query: [], cookies: [] },
        globalAuth: undefined,
        projectPreScript: '', projectPostScript: '',
      })
      const echoed2 = JSON.parse(res2.body)
      assert.equal(echoed2.headers.cookie, undefined)
      assert.deepStrictEqual(res2.logs, [])
    }),
  },
]
