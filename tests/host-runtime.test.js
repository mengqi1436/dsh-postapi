/**
 * host-runtime 套件：变量解析 / 脚本沙箱 / 请求管线 / Mock 服务 / 自动化测试执行。
 * 端到端全部用本地 node:http echo server，不依赖外网。
 */
import assert from 'node:assert/strict'
import http from 'node:http'
import { once } from 'node:events'
import { createVariableResolver, DYNAMIC_VARS, normalizeVariables } from '../src/host/variables.js'
import { runScript } from '../src/host/script-sandbox.js'
import { createRequestService, pickValue } from '../src/host/request.js'
import { createMockServer } from '../src/host/mock-server.js'
import { createTestRunner } from '../src/host/test-runner.js'

/* ------------------------------------------------------------------ 测试设施 */

function startEchoServer() {
  const server = http.createServer((req, res) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString()
      if (req.url.startsWith('/hang')) {
        const t = setTimeout(() => req.socket.destroy(), 2000)
        t.unref()
        return
      }
      if (req.url.startsWith('/login')) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ token: 'tk-abc', user: { id: 7, name: 'neo' } }))
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

/** storage 桩：只提供 runner 需要的 getProject（不触碰 src/host/storage.js）。 */
function stubStorage(project) {
  return { getProject: async () => project }
}

function makeProject(base) {
  return {
    id: 'proj_a',
    endpoints: [
      {
        id: 'ep_echo',
        name: 'echo',
        method: 'GET',
        url: `${base}/echo`,
        params: [],
        headers: [],
        body: { type: 'none', content: '' },
        auth: { type: 'none' },
        responses: [],
        preProcessors: [],
        postProcessors: [],
      },
      {
        id: 'ep_login',
        name: 'login',
        method: 'GET',
        url: `${base}/login`,
        params: [],
        headers: [],
        body: { type: 'none', content: '' },
        auth: { type: 'none' },
        responses: [],
        preProcessors: [],
        postProcessors: [],
      },
      {
        id: 'ep_var',
        name: 'var',
        method: 'GET',
        url: `${base}/echo?t={{token}}`,
        params: [],
        headers: [],
        body: { type: 'none', content: '' },
        auth: { type: 'none' },
        responses: [],
        preProcessors: [],
        postProcessors: [],
      },
    ],
    environments: [{ id: 'env_1', name: 'dev', baseUrl: base, isDefault: true, variables: [{ key: 'who', value: 'env-user', enabled: true }] }],
    globals: { variables: [{ key: 'who', value: 'global-user', enabled: true }, { key: 'ver', value: 'v2', enabled: true }] },
    settings: { requestTimeoutMs: 3000, mockPort: 4010 },
    testCases: [
      {
        id: 'tc_1',
        name: 'echo 200',
        endpointId: 'ep_echo',
        assertions: [{ source: 'status', op: 'eq', value: '200', message: '状态码 200' }],
        extractors: [{ name: 'method', source: 'body', path: 'method' }],
      },
    ],
    testScenarios: [
      {
        id: 'ts_1',
        name: '登录后带 token 调接口',
        steps: [
          { id: 'stp_1', name: '登录', endpointId: 'ep_login', extract: [{ name: 'token', source: 'body', path: 'token' }] },
          { id: 'stp_2', name: '带 token 请求', endpointId: 'ep_var' },
        ],
      },
    ],
  }
}

/* ------------------------------------------------------------------ 变量解析 */

const variableTests = [
  {
    name: 'variables: local > environment > globals 优先级，未定义保留原文',
    fn: () => {
      const r = createVariableResolver({
        globals: { variables: [{ key: 'who', value: 'g' }, { key: 'only_global', value: 'G' }] },
        environment: { baseUrl: 'http://env.local', variables: [{ key: 'who', value: 'e' }] },
        local: { who: 'l' },
      })
      assert.equal(r.resolve('{{who}}'), 'l')
      assert.equal(r.resolve('{{only_global}}'), 'G')
      assert.equal(r.resolve('{{baseUrl}}/x'), 'http://env.local/x')
      // 未定义保留原文（契约 §4）
      assert.equal(r.resolve('{{nope}}'), '{{nope}}')
      assert.equal(r.resolve('a-{{ nope }}'), 'a-{{ nope }}')
      // 非字符串原样返回
      assert.equal(r.resolve(undefined), undefined)
      assert.equal(r.resolve(''), '')
    },
  },
  {
    name: 'variables: explain 报 missing 且 resolved 与 resolve 一致',
    fn: () => {
      const r = createVariableResolver({ globals: { variables: [{ key: 'a', value: '1' }] } })
      const out = r.explain('{{a}}/{{b}}/{{$timestamp}}')
      assert.deepEqual(out.missing, ['b'])
      assert.match(out.resolved, /^1\/\{\{b\}\}\/\d+$/)
    },
  },
  {
    name: 'variables: enabled=false 的变量不参与替换，数组/对象两种形态都能吃',
    fn: () => {
      const r = createVariableResolver({ globals: { variables: [{ key: 'off', value: 'x', enabled: false }, { key: 'on', value: 'y', enabled: true }] } })
      assert.equal(r.resolve('{{off}}-{{on}}'), '{{off}}-y')
      assert.deepEqual(normalizeVariables({ a: 1, b: null, c: { skip: 1 } }), { a: '1', b: '' })
    },
  },
  {
    name: 'variables: 11 个动态变量齐备且格式正确',
    fn: () => {
      const names = Object.keys(DYNAMIC_VARS)
      assert.deepEqual(names.sort(), [
        '$date', '$datetime', '$isoTimestamp', '$randomBoolean', '$randomEmail', '$randomFloat',
        '$randomInt', '$randomPhone', '$randomString', '$timestamp', '$uuid',
      ].sort())
      const r = createVariableResolver({})
      const one = (k) => r.resolve(`{{${k}}}`)
      assert.match(one('$timestamp'), /^\d{10}$/)
      assert.match(one('$isoTimestamp'), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      assert.match(one('$randomInt'), /^\d{1,4}$/)
      assert.match(one('$randomString'), /^[0-9a-f]{12}$/)
      assert.match(one('$uuid'), /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
      assert.match(one('$randomEmail'), /^user_[0-9a-f]{6}@example\.com$/)
      assert.match(one('$randomPhone'), /^1[3-9]\d{9}$/)
      assert.match(one('$randomBoolean'), /^(true|false)$/)
      assert.match(one('$randomFloat'), /^\d\.\d{6}$/)
      assert.match(one('$datetime'), /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
      assert.match(one('$date'), /^\d{4}-\d{2}-\d{2}$/)
      // 动态变量每次求值不同（$timestamp 同秒可能相同，用 $uuid 校验）
      assert.notEqual(one('$uuid'), one('$uuid'))
    },
  },
]

/* ------------------------------------------------------------------ 脚本沙箱 */

const sandboxTests = [
  {
    name: 'script: pm.test 通过 + pm.expect 链式断言 + 日志 + exports',
    fn: () => {
      const out = runScript(
        [
          'pm.test("status 200", function () { pm.expect(pm.response.code).to.equal(200) })',
          'pm.test("body 字段", function () {',
          '  var d = pm.response.json()',
          '  pm.expect(d).to.eql({ ok: true, n: 3 })',
          '  pm.expect(d.n).to.be.above(2)',
          '  pm.expect(d.n).to.be.below(4)',
          '  pm.expect(pm.response.text()).to.include("ok")',
          '  pm.expect("abc").to.match(/^a.c$/)',
          '  pm.expect(true).to.be.true',
          '  pm.expect(false).to.be.false',
          '  pm.expect(1).to.not.equal(2)',
          '  pm.expect("xyz").to.not.include("q")',
          '})',
          'console.log("hi", 1)',
          'module.exports = { tag: "done" }',
        ].join('\n'),
        { context: { response: { status: 200, headers: { a: '1' }, body: '{"ok":true,"n":3}', timeMs: 5 } } },
      )
      assert.equal(out.ok, true, out.error && out.error.message)
      assert.equal(out.tests.length, 2)
      assert.deepEqual(out.tests.map((t) => t.passed), [true, true])
      assert.deepEqual(out.logs, ['log: hi 1'])
      assert.deepEqual(out.exports, { tag: 'done' })
    },
  },
  {
    name: 'script: pm.test 断言失败记为 failed 且不中断后续用例',
    fn: () => {
      const out = runScript(
        [
          'pm.test("会失败", function () { pm.expect(pm.response.code).to.equal(201) })',
          'pm.test("会通过", function () { pm.expect(pm.response.code).to.equal(200) })',
        ].join('\n'),
        { context: { response: { status: 200, headers: {}, body: '{}', timeMs: 1 } } },
      )
      assert.equal(out.ok, true)
      assert.equal(out.tests[0].passed, false)
      assert.match(out.tests[0].error, /to equal 201/)
      assert.equal(out.tests[1].passed, true)
    },
  },
  {
    name: 'script: pm.environment/globals/variables set 收集进 variables，get 按 local>env>global',
    fn: () => {
      const out = runScript(
        [
          'pm.test("变量作用域", function () {',
          '  pm.expect(pm.environment.get("a")).to.equal("env-a")',
          '  pm.expect(pm.globals.get("g")).to.equal("glob-g")',
          '  pm.expect(pm.variables.get("a")).to.equal("local-a")',
          '  pm.expect(pm.variables.get("g")).to.equal("glob-g")',
          '})',
          'pm.environment.set("token", "tk-1")',
          'pm.globals.set("gid", 42)',
          'pm.variables.set("tmp", true)',
        ].join('\n'),
        { context: { env: { a: 'env-a' }, globals: { g: 'glob-g' }, variables: { a: 'local-a' } } },
      )
      assert.equal(out.ok, true, out.error && out.error.message)
      assert.deepEqual(out.tests.map((t) => t.passed), [true])
      assert.deepEqual(out.variables, { token: 'tk-1', gid: 42, tmp: true })
    },
  },
  {
    name: 'script: 死循环按 timeoutMs 中断，返回 timeout 错误',
    fn: () => {
      const started = Date.now()
      const out = runScript('while (true) {}', { timeoutMs: 120 })
      const cost = Date.now() - started
      assert.equal(out.ok, false)
      assert.equal(out.error.kind, 'timeout')
      assert.ok(cost < 2000, `超时未生效，耗时 ${cost}ms`)
    },
  },
  {
    name: 'script: 禁 require/process/fs/setTimeout，eval 被禁',
    fn: () => {
      const r1 = runScript('require("fs")')
      assert.equal(r1.ok, false)
      assert.match(r1.error.message, /require is not defined/)

      const r2 = runScript('process.exit(0)')
      assert.equal(r2.ok, false)
      assert.match(r2.error.message, /process is not defined/)

      const r3 = runScript('pm.test("无全局", function () { pm.expect(typeof fs).to.equal("undefined") })')
      assert.equal(r3.tests[0].passed, true, r3.tests[0].error)

      const r4 = runScript('setTimeout(function(){}, 1)')
      assert.equal(r4.ok, false)
      assert.match(r4.error.message, /setTimeout is not available/)

      const r5 = runScript('eval("1+1")')
      assert.equal(r5.ok, false)
      assert.match(r5.error.message, /code generation from strings disallowed|EvalError/i)
    },
  },
  {
    name: 'script: 脚本抛错返回 script 错误且保留已记录的 tests',
    fn: () => {
      const out = runScript('pm.test("先过", function () { pm.expect(1).to.equal(1) })\nthrow new Error("boom")')
      assert.equal(out.ok, false)
      assert.equal(out.error.kind, 'script')
      assert.match(out.error.message, /boom/)
      assert.deepEqual(out.tests.map((t) => t.passed), [true])
    },
  },
  {
    name: 'script: 空脚本 ok 且无副作用',
    fn: () => {
      const out = runScript('')
      assert.equal(out.ok, true)
      assert.deepEqual(out.logs, [])
      assert.deepEqual(out.tests, [])
      assert.deepEqual(out.variables, {})
      assert.deepEqual(out.exports, {})
    },
  },
]

/* ------------------------------------------------------------------ 请求管线 */

const requestTests = [
  {
    name: 'request: variables 替换 url/params/headers/body/auth，返回 request 快照',
    fn: () => withEchoServer(async (svc, base) => {
      const res = await svc.send({
        method: 'POST',
        url: '{{base}}/echo',
        params: [{ key: 'q', value: '{{q}}' }],
        headers: { 'X-Who': '{{who}}' },
        body: { type: 'json', content: '{"v":"{{ver}}"}' },
        auth: { type: 'bearer', token: '{{token}}' },
        variables: {
          globals: { variables: [{ key: 'ver', value: 'v2' }, { key: 'token', value: 'tk-g' }] },
          environment: { baseUrl: base, variables: [{ key: 'base', value: base }, { key: 'q', value: 'qq' }] },
          local: { who: 'local-who' },
        },
      })
      assert.equal(res.status, 200, res.error && res.error.message)
      const echoed = JSON.parse(res.body)
      assert.equal(echoed.url, '/echo?q=qq')
      assert.equal(echoed.headers['x-who'], 'local-who')
      assert.equal(echoed.headers['authorization'], 'Bearer tk-g')
      assert.equal(echoed.body, '{"v":"v2"}')
      // 返回体 request 为实际发出的请求
      assert.equal(res.request.method, 'POST')
      assert.match(res.request.url, /\/echo\?q=qq$/)
      // Headers 会小写化 key，实际发出的 header 名按 HTTP 语义为小写
      assert.equal(res.request.headers['x-who'], 'local-who')
      assert.equal(res.request.body, '{"v":"v2"}')
      assert.deepEqual(res.tests, [])
      assert.deepEqual(res.logs, [])
    }),
  },
  {
    name: 'request: auth apikey 支持 header 与 query 两种注入位',
    fn: () => withEchoServer(async (svc, base) => {
      const h = await svc.send({ method: 'GET', url: `${base}/echo`, auth: { type: 'apikey', key: 'X-Api-Key', value: 'k1', addTo: 'header' } })
      assert.equal(JSON.parse(h.body).headers['x-api-key'], 'k1')

      const q = await svc.send({ method: 'GET', url: `${base}/echo`, auth: { type: 'apikey', key: 'api_key', value: 'k2', addTo: 'query' } })
      const echoed = JSON.parse(q.body)
      assert.ok(echoed.url.includes('api_key=k2'), `query 未注入: ${echoed.url}`)
      assert.equal(echoed.headers['api_key'], undefined)
    }),
  },
  {
    name: 'request: preScript 可改 url/headers，postScript 提取变量并合并 tests',
    fn: () => withEchoServer(async (svc, base) => {
      const res = await svc.send({
        method: 'GET',
        url: `${base}/echo`,
        preScript: 'pm.request.url = pm.request.url + "?from=pre"\npm.request.headers["X-Pre"] = "yes"',
        postScript: [
          'pm.test("状态 200", function () { pm.expect(pm.response.code).to.equal(200) })',
          'pm.environment.set("seenMethod", pm.response.json().method)',
        ].join('\n'),
      })
      assert.equal(res.status, 200, res.error && res.error.message)
      const echoed = JSON.parse(res.body)
      assert.ok(echoed.url.includes('from=pre'), `preScript 未改 url: ${echoed.url}`)
      assert.equal(echoed.headers['x-pre'], 'yes')
      assert.deepEqual(res.tests.map((t) => [t.name, t.passed]), [['状态 200', true]])
      assert.deepEqual(res.variables, { seenMethod: 'GET' })
      assert.ok(res.logs.length === 0)
    }),
  },
  {
    name: 'request: preScript 抛错短路发送并结构化 error',
    fn: () => withEchoServer(async (svc, base) => {
      const res = await svc.send({ method: 'GET', url: `${base}/echo`, preScript: 'throw new Error("pre bad")' })
      assert.equal(res.status, 0)
      assert.equal(res.error.phase, 'preScript')
      assert.match(res.error.message, /pre bad/)
    }),
  },
  {
    name: 'request: postScript 抛错记一条失败 test，响应本身仍返回',
    fn: () => withEchoServer(async (svc, base) => {
      const res = await svc.send({ method: 'GET', url: `${base}/echo`, postScript: 'throw new Error("post bad")' })
      assert.equal(res.status, 200)
      assert.equal(res.tests.length, 1)
      assert.equal(res.tests[0].passed, false)
      assert.match(res.tests[0].error, /post bad/)
    }),
  },
  {
    name: 'request: 内置断言 9 种 op 全通过',
    fn: () => withEchoServer(async (svc, base) => {
      const res = await svc.send({
        method: 'POST',
        url: `${base}/echo`,
        body: { type: 'json', content: '{"a":1,"s":"hello"}' },
        // echo server 把请求体回显在 body 字段，响应结构为 { method, url, headers, body }
        assertions: [
          { source: 'status', op: 'eq', value: '200' },
          { source: 'status', op: 'neq', value: '500' },
          { source: 'time', op: 'gt', value: '-1' },
          { source: 'time', op: 'lt', value: '60000' },
          { source: 'body', path: 'body', op: 'contains', value: 'hello' },
          { source: 'body', path: 'body', op: 'notContains', value: 'zzz' },
          { source: 'body', path: 'method', op: 'exists' },
          { source: 'body', path: 'missing.deep', op: 'notExists' },
          { source: 'header', path: 'Content-Type', op: 'regex', value: 'application/json' },
        ],
      })
      assert.equal(res.tests.length, 9)
      assert.deepEqual(res.tests.filter((t) => !t.passed), [], JSON.stringify(res.tests.filter((t) => !t.passed)))
    }),
  },
  {
    name: 'request: 内置断言失败带可读 error，未知 op 记失败',
    fn: () => withEchoServer(async (svc, base) => {
      const res = await svc.send({
        method: 'GET',
        url: `${base}/echo`,
        assertions: [
          { source: 'status', op: 'eq', value: '201', message: '应为 201' },
          { source: 'body', path: 'nope', op: 'bogus' },
        ],
      })
      assert.equal(res.tests[0].passed, false)
      assert.equal(res.tests[0].name, '应为 201')
      assert.match(res.tests[0].error, /200 eq 201/)
      assert.equal(res.tests[1].passed, false)
      assert.match(res.tests[1].error, /unknown op: bogus/)
    }),
  },
  {
    name: 'request: pickValue 支持 status/time/header/body 路径与非法 JSON',
    fn: () => {
      const res = { status: 201, timeMs: 12, headers: { 'Content-Type': 'text/plain' }, body: '{"a":{"b":[{"c":9}]}}' }
      assert.equal(pickValue(res, 'status'), 201)
      assert.equal(pickValue(res, 'time'), 12)
      assert.equal(pickValue(res, 'header', 'content-type'), 'text/plain')
      assert.equal(pickValue(res, 'body', 'a.b[0].c'), 9)
      assert.equal(pickValue(res, 'body', 'a.b.0.c'), 9)
      assert.equal(pickValue(res, 'body', 'a.zz'), undefined)
      assert.equal(pickValue({ body: 'not json' }, 'body', 'a'), undefined)
      assert.equal(pickValue({ body: 'not json' }, 'body'), 'not json')
    },
  },
  {
    name: 'request: 无 variables 时 {{}} 原样发送（向后兼容）',
    fn: () => withEchoServer(async (svc, base) => {
      const res = await svc.send({ method: 'GET', url: `${base}/echo`, params: [{ key: 'k', value: '{{raw}}' }] })
      assert.equal(res.status, 200)
      assert.ok(JSON.parse(res.body).url.includes('k=%7B%7Braw%7D%7D'))
    }),
  },
]

/* ------------------------------------------------------------------ Mock 服务 */

function mockProject() {
  return {
    id: 'proj_m',
    endpoints: [
      {
        id: 'ep_m1',
        url: 'https://api.example.com/users/list',
        responses: [{ id: 'res_1', name: '成功', code: 201, isDefault: true, enabled: true, body: '{"fallback":true}' }],
        mock: { enabled: true, delayMs: 0, rules: [] },
      },
    ],
    mocks: [
      { id: 'mk_1', endpointId: 'ep_m1', field: 'name', rule: 'fixed', value: 'tom', enabled: true },
      { id: 'mk_2', endpointId: 'ep_m1', field: 'seq', rule: 'increment', value: '10', enabled: true },
      { id: 'mk_3', endpointId: 'ep_m1', field: 'code', rule: 'regex', value: '[A-Z]{3}[0-9]{4}', enabled: true },
      { id: 'mk_4', endpointId: 'ep_m1', field: 'age', rule: 'random', value: 'int:18:30', enabled: true },
      { id: 'mk_5', endpointId: 'ep_m1', field: 'tag', rule: 'template', value: 'id-{{$randomInt}}', enabled: true },
      { id: 'mk_6', endpointId: 'ep_m1', field: 'obj.k', rule: 'fixed', value: '{"x":1}', enabled: true },
      { id: 'mk_7', endpointId: 'ep_m1', field: 'off', rule: 'fixed', value: 'nope', enabled: false },
    ],
  }
}

async function withMockServer(fn, project) {
  const srv = createMockServer({ getProject: async (id) => (id === (project || mockProject()).id ? project || mockProject() : Promise.reject(new Error('not found'))), port: 0 })
  const started = await srv.start()
  try {
    return await fn(srv, `http://127.0.0.1:${started.port}`)
  } finally {
    await srv.stop()
  }
}

const mockTests = [
  {
    name: 'mock: start/status/stop 生命周期与真实端口',
    fn: async () => {
      const srv = createMockServer({ getProject: async () => mockProject(), port: 0 })
      assert.deepEqual(srv.status(), { running: false, port: 0 })
      const started = await srv.start()
      assert.equal(started.running, true)
      assert.ok(started.port > 0)
      assert.deepEqual(srv.status(), started)
      await srv.stop()
      assert.deepEqual(srv.status(), { running: false, port: 0 })
      // 重复 stop 幂等
      await srv.stop()
    },
  },
  {
    name: 'mock: 按 endpointId 命中，5 种规则生成 body，未启用规则被忽略',
    fn: () => withMockServer(async (srv, base) => {
      const r1 = await fetch(`${base}/mock/proj_m/ep_m1`)
      assert.equal(r1.status, 200)
      const b1 = await r1.json()
      assert.equal(b1.name, 'tom')
      // increment 的 value 是可解析 JSON 数字，按 coerce 规则落成 number
      assert.equal(b1.seq, 10)
      assert.match(b1.code, /^[A-Z]{3}[0-9]{4}$/)
      assert.ok(Number(b1.age) >= 18 && Number(b1.age) <= 30, `random 越界: ${b1.age}`)
      assert.match(b1.tag, /^id-\d+$/)
      assert.deepEqual(b1.obj, { k: { x: 1 } })
      assert.equal(b1.off, undefined)

      // increment 每次 +1
      const b2 = await (await fetch(`${base}/mock/proj_m/ep_m1`)).json()
      assert.equal(b2.seq, 11)
      // 两次 random 结果独立（int:18:30 空间小，只校验范围）
      assert.ok(Number(b2.age) >= 18 && Number(b2.age) <= 30)
    }),
  },
  {
    name: 'mock: 按 endpoint 路径命中（/mock/<projectId><endpointPath>）',
    fn: () => withMockServer(async (srv, base) => {
      const r = await fetch(`${base}/mock/proj_m/users/list`)
      assert.equal(r.status, 200)
      const b = await r.json()
      assert.equal(b.name, 'tom')
    }),
  },
  {
    name: 'mock: endpoint.mock.rules（Mock 页落点）与 project.mocks 合并生效',
    fn: () => withMockServer(async (srv, base) => {
      // 回归：Mock 页「保存配置」把规则写到 endpoint.mock.rules，服务端此前只读
      // project.mocks，页面配置的规则从不生效，命中地址永远回落默认响应。
      const project = mockProject()
      project.mocks = []
      project.endpoints[0].mock.rules = [
        { id: 'mr_1', endpointId: 'ep_m1', field: 'name', rule: 'fixed', value: 'page-rule', enabled: true },
        { id: 'mr_2', endpointId: 'ep_m1', field: 'gone', rule: 'fixed', value: 'nope', enabled: false },
      ]
      const srv2 = createMockServer({ getProject: async () => project, port: 0 })
      const s2 = await srv2.start()
      try {
        const b = await (await fetch(`http://127.0.0.1:${s2.port}/mock/proj_m/ep_m1`)).json()
        assert.equal(b.name, 'page-rule')
        assert.equal(b.gone, undefined)
      } finally {
        await srv2.stop()
      }
      // 两个落点同时存在时都生效
      const both = mockProject()
      both.endpoints[0].mock.rules = [
        { id: 'mr_3', endpointId: 'ep_m1', field: 'extra', rule: 'fixed', value: 'from-endpoint', enabled: true },
      ]
      const srv3 = createMockServer({ getProject: async () => both, port: 0 })
      const s3 = await srv3.start()
      try {
        const b = await (await fetch(`http://127.0.0.1:${s3.port}/mock/proj_m/ep_m1`)).json()
        assert.equal(b.name, 'tom')
        assert.equal(b.extra, 'from-endpoint')
      } finally {
        await srv3.stop()
      }
    }),
  },
  {
    name: 'mock: 无匹配规则回落默认响应（status/body 取自 responses.isDefault）',
    fn: () => withMockServer(async (srv, base) => {
      const project = mockProject()
      project.mocks = []
      const srv2 = createMockServer({ getProject: async () => project, port: 0 })
      const s2 = await srv2.start()
      try {
        const r = await fetch(`http://127.0.0.1:${s2.port}/mock/proj_m/ep_m1`)
        assert.equal(r.status, 201)
        assert.deepEqual(await r.json(), { fallback: true })
      } finally {
        await srv2.stop()
      }
    }),
  },
  {
    name: 'mock: 未知项目 / 未知路径 / 非 /mock 前缀返回 404 且不抛错',
    fn: () => withMockServer(async (srv, base) => {
      const r1 = await fetch(`${base}/mock/proj_unknown/ep_m1`)
      assert.equal(r1.status, 404)
      assert.equal((await r1.json()).ok, false)

      const r2 = await fetch(`${base}/mock/proj_m/no-such-path`)
      assert.equal(r2.status, 404)

      const r3 = await fetch(`${base}/other/x`)
      assert.equal(r3.status, 404)
    }),
  },
  {
    name: 'mock: 接口级 endpoint.mock.rules 参与响应生成（mock 页保存落点）',
    fn: () => {
      const project = mockProject()
      delete project.mocks // 仅接口级规则：无项目级 mocks 时规则仍要生效
      project.endpoints[0].mock = {
        enabled: true,
        delayMs: 0,
        rules: [
          { id: 'mk_e1', endpointId: 'ep_m1', field: 'data.seq', rule: 'increment', value: '100', enabled: true },
          { id: 'mk_e2', endpointId: 'ep_m1', field: 'skip', rule: 'fixed', value: 'no', enabled: false },
        ],
      }
      return withMockServer(async (srv, base) => {
        const b1 = await (await fetch(`${base}/mock/proj_m/ep_m1`)).json()
        const b2 = await (await fetch(`${base}/mock/proj_m/ep_m1`)).json()
        assert.equal(b1.data.seq, 100, 'increment 首次返回基值（coerce 后为数值）')
        assert.equal(b2.data.seq, 101, 'increment 应递增')
        assert.equal(b1.skip, undefined, 'enabled=false 的接口级规则应忽略')
      }, project)
    },
  },
  {
    name: 'mock: endpoint.mock.enabled=false 时不套用接口级规则',
    fn: () => {
      const project = mockProject()
      delete project.mocks
      project.endpoints[0].mock = {
        enabled: false,
        delayMs: 0,
        rules: [{ id: 'mk_e3', endpointId: 'ep_m1', field: 'name', rule: 'fixed', value: 'blocked', enabled: true }],
      }
      return withMockServer(async (srv, base) => {
        const b = await (await fetch(`${base}/mock/proj_m/ep_m1`)).json()
        assert.deepEqual(b, { fallback: true }, '应回落默认响应')
      }, project)
    },
  },
]

/* ------------------------------------------------------------------ 自动化测试执行 */

const runnerTests = [
  {
    name: 'test-runner: runCase 端到端通过并回传 extractors 结果',
    fn: () => withEchoServer(async (svc, base) => {
      const project = makeProject(base)
      const runner = createTestRunner({ storage: stubStorage(project), request: svc })
      const out = await runner.runCase('proj_a', 'tc_1')
      assert.equal(out.caseId, 'tc_1')
      assert.equal(out.passed, true, JSON.stringify(out.results))
      assert.deepEqual(out.results.map((r) => [r.name, r.passed]), [['状态码 200', true]])
      assert.deepEqual(out.extracted, { method: 'GET' })
      assert.ok(out.durationMs >= 0)
    }),
  },
  {
    name: 'test-runner: 相对 URL 接口自动拼默认环境 baseUrl（与调试页 joinUrl 同语义）',
    fn: () => withEchoServer(async (svc, base) => {
      const project = makeProject(base)
      // 环境只存 baseUrl，接口只存 path —— 页面上最常见的数据形态
      project.environments = [{ id: 'env_1', name: '测试环境', baseUrl: base, isDefault: true }]
      const ep = project.endpoints.find((e) => e.id === 'ep_echo')
      ep.url = '/echo'
      const runner = createTestRunner({ storage: stubStorage(project), request: svc })
      const out = await runner.runCase('proj_a', 'tc_1')
      assert.equal(out.passed, true, JSON.stringify(out.results))
      // 绝对 URL 不受影响
      ep.url = `${base}/echo`
      const out2 = await runner.runCase('proj_a', 'tc_1')
      assert.equal(out2.passed, true)
      // 无 baseUrl 环境保持原样
      project.environments = [{ id: 'env_2', name: '无baseUrl', baseUrl: '', isDefault: true }]
      ep.url = '/echo'
      const out3 = await runner.runCase('proj_a', 'tc_1')
      assert.equal(out3.passed, false, '无 baseUrl 时相对路径应保持原样并失败')
    }),
  },
  {
    name: 'test-runner: runCase 断言失败 → passed=false；缺 id 抛错',
    fn: () => withEchoServer(async (svc, base) => {
      const project = makeProject(base)
      project.testCases[0].assertions = [{ source: 'status', op: 'eq', value: '201', message: '应 201' }]
      const runner = createTestRunner({ storage: stubStorage(project), request: svc })
      const out = await runner.runCase('proj_a', 'tc_1')
      assert.equal(out.passed, false)
      assert.equal(out.results[0].passed, false)

      await assert.rejects(() => runner.runCase('proj_a', 'tc_missing'), /test case not found/)
      project.testCases[0].endpointId = 'ep_missing'
      await assert.rejects(() => runner.runCase('proj_a', 'tc_1'), /endpoint not found/)
    }),
  },
  {
    name: 'test-runner: runCase 合并 endpoint.postProcessors 的 assert 与脚本',
    fn: () => withEchoServer(async (svc, base) => {
      const project = makeProject(base)
      const ep = project.endpoints.find((e) => e.id === 'ep_echo')
      ep.postProcessors = [
        { id: 'post_1', type: 'script', enabled: true, code: 'pm.environment.set("fromScript", "ok")' },
        { id: 'ast_1', type: 'assert', enabled: true, assertions: [{ source: 'body', path: 'method', op: 'eq', value: 'GET' }] },
        { id: 'ast_2', type: 'assert', enabled: false, assertions: [{ source: 'status', op: 'eq', value: '999' }] },
      ]
      const runner = createTestRunner({ storage: stubStorage(project), request: svc })
      const out = await runner.runCase('proj_a', 'tc_1')
      assert.equal(out.passed, true, JSON.stringify(out.results))
      assert.equal(out.results.length, 2) // 用例自带 1 条 + 启用的 assert 1 条
    }),
  },
  {
    name: 'test-runner: runScenario 步骤间变量传递（登录 token 供下一步使用）',
    fn: () => withEchoServer(async (svc, base) => {
      const project = makeProject(base)
      const runner = createTestRunner({ storage: stubStorage(project), request: svc })
      const out = await runner.runScenario('proj_a', 'ts_1')
      assert.equal(out.scenarioId, 'ts_1')
      assert.equal(out.passed, true, JSON.stringify(out.steps))
      assert.equal(out.steps.length, 2)
      assert.deepEqual(out.steps[0].extracted, { token: 'tk-abc' })
      assert.equal(out.steps[0].status, 200)
      assert.equal(out.steps[1].status, 200)
      assert.ok(out.steps[1].results.length === 0)
    }),
  },
  {
    name: 'test-runner: runScenario 步骤缺 endpoint 记失败但不中断后续步骤',
    fn: () => withEchoServer(async (svc, base) => {
      const project = makeProject(base)
      project.testScenarios[0].steps.unshift({ id: 'stp_0', name: '坏的步骤', endpointId: 'ep_missing' })
      const runner = createTestRunner({ storage: stubStorage(project), request: svc })
      const out = await runner.runScenario('proj_a', 'ts_1')
      assert.equal(out.passed, false)
      assert.equal(out.steps.length, 3)
      assert.equal(out.steps[0].passed, false)
      assert.match(out.steps[0].error, /endpoint not found/)
      assert.equal(out.steps[2].passed, true)
    }),
  },
  {
    name: 'test-runner: runScenario 网络错误步骤 passed=false 且带 error',
    fn: () => withEchoServer(async (svc) => {
      const project = makeProject('http://127.0.0.1:9')
      project.testScenarios[0].steps = [{ id: 'stp_x', name: '连不上', endpointId: 'ep_echo' }]
      const runner = createTestRunner({ storage: stubStorage(project), request: svc })
      const out = await runner.runScenario('proj_a', 'ts_1')
      assert.equal(out.passed, false)
      assert.equal(out.steps[0].status, 0)
      assert.match(out.steps[0].error, /network/)
    }),
  },
]

export const tests = [...variableTests, ...sandboxTests, ...requestTests, ...mockTests, ...runnerTests]
