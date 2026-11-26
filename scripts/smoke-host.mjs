#!/usr/bin/env node
/**
 * T3 宿主侧端到端冒烟：node scripts/smoke-host.mjs
 *
 * 两段：
 *  1) 临时基路径：经 apply() 真实注册的 webServer prefix handler 起 node:http server，
 *     用 node:http 客户端打全套路由（health / listProjects / createProject / saveEndpoint /
 *     getProject / request/send / 宿主栅栏 401 / 未知路由 404），断言全部 {ok:true}（栅栏与 404 除外）。
 *  2) 真实基路径 E:/User/文档/api：直接建临时项目 → 读回 → 断言 project.json 已落盘 → 删除并清理。
 * 任一断言失败即非零退出。
 */
import assert from 'node:assert/strict'
import http from 'node:http'
import crypto from 'node:crypto'
import { once } from 'node:events'
const { createHash } = crypto
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../src/host/index.js'
import { createStorageService, DEFAULT_BASE_PATH } from '../src/host/storage.js'

const PREFIX = '/dsh-postapi/api'
const results = []

function record(name, detail) {
  results.push({ name, detail })
  console.log('  PASS ' + name + (detail ? ' — ' + detail : ''))
}

/** node:http 客户端：返回 { status, json, text }。 */
function httpJson(base, p, opts = {}) {
  const { method = 'GET', body, headers = {} } = opts
  const payload = body === undefined ? null : Buffer.from(JSON.stringify(body), 'utf8')
  const h = { ...headers }
  if (payload) {
    h['Content-Type'] = 'application/json'
    h['Content-Length'] = String(payload.length)
  }
  return new Promise((resolve, reject) => {
    const req = http.request(base + p, { method, headers: h }, (res) => {
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8')
        let json
        try {
          json = JSON.parse(text)
        } catch {
          json = undefined
        }
        resolve({ status: res.statusCode, json, text })
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

/** 确定性关停：跟踪全部 TCP 连接（含升级后脱离 server 跟踪的），先毁后关，close 最多等 2s。 */
function closeServer(server, conns, sockets) {
  if (sockets) for (const s of sockets) s.destroy()
  if (conns) for (const c of conns) c.destroy()
  try { server.closeIdleConnections() } catch { /* 旧版本 Node 无此方法 */ }
  try { server.closeAllConnections() } catch { /* 同上 */ }
  try { server.close() } catch { /* 已停则忽略 */ }
  return Promise.race([
    once(server, 'close').then(() => 'closed'),
    new Promise((resolve) => setTimeout(() => {
      if (conns) for (const c of conns) c.destroy()
      try { server.closeAllConnections() } catch { /* 同上 */ }
      resolve('forced')
    }, 2000)),
  ])
}

function startServer(handler) {
  const conns = new Set()
  const server = http.createServer((req, res) => {
    conns.add(req.socket)
    res.on('close', () => conns.delete(req.socket))
    Promise.resolve(handler(req, res)).catch(() => {
      if (!res.headersSent) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
      }
      res.end(JSON.stringify({ ok: false, error: 'handler crashed', code: 'INTERNAL' }))
    })
  })
  server.listen(0, '127.0.0.1')
  return { server, listening: once(server, 'listening') }
}

/** 用与宿主同形的受控 ctx 跑 apply()，取回注册的 prefix handler。 */
function mount(basePath) {
  const registrations = []
  const effects = []
  const ctx = {
    effect: (fn, label) => {
      effects.push(label)
      const d = fn()
      return () => {
        if (typeof d === 'function') d()
      }
    },
    webServer: {
      host: '127.0.0.1',
      port: 0,
      register: (h) => {
        registrations.push(h)
        return () => {}
      },
    },
    connection: {
      requestRejection: (req) => (req.headers['x-smoke-reject'] === '1' ? 401 : undefined),
    },
  }
  apply(ctx, { storage: { basePath } })
  assert.equal(registrations.length, 1, 'apply 应注册且仅注册一个 prefix handler')
  assert.equal(registrations[0].kind, 'prefix')
  assert.equal(registrations[0].path, PREFIX)
  // v2：桥 + Mock 收尾两条 effect
  assert.ok(effects.includes('postapi-api'), '应注册 postapi-api effect')
  assert.ok(effects.includes('postapi-mock-teardown'), '应注册 postapi-mock-teardown effect')
  return registrations[0].handler
}

/** 本地 echo 目标：给 request/send 用，不依赖外网。 */
function startEcho() {
  const conns = new Set()
  const server = http.createServer((req, res) => {
    conns.add(req.socket)
    res.on('close', () => conns.delete(req.socket))
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('pong')
  })
  server.listen(0, '127.0.0.1')
  return { server, conns, listening: once(server, 'listening') }
}

/** 本地 WS echo：握手 + 文本帧回显 + close 帧应答（给 ws/* 冒烟用）。 */
function startWsEcho() {
  const sockets = new Set()
  const conns = new Set() // 全部 TCP 连接（含升级后脱离 server 跟踪的）
  const server = http.createServer(() => {})
  server.on('connection', (c) => { conns.add(c); c.on('close', () => conns.delete(c)) })
  server.on('upgrade', (req, socket) => {
    sockets.add(socket)
    const accept = createHash('sha1')
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
        socket.write(Buffer.concat([Buffer.from([0x81, out.length]), out]))
      }
    })
  })
  server.listen(0, '127.0.0.1')
  return {
    server,
    listening: once(server, 'listening'),
    close() {
      return closeServer(server, conns, sockets)
    },
  }
}

async function tempStage() {
  const basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'postapi-smoke-'))
  const { server, conns: serverConns, listening } = startServer(mount(basePath))
  await listening
  const base = 'http://127.0.0.1:' + server.address().port
  const echo = startEcho()
  await echo.listening
  const echoUrl = 'http://127.0.0.1:' + echo.server.address().port + '/echo'
  ECHO_URL = echoUrl
  const wsEcho = startWsEcho()
  await wsEcho.listening
  WS_ECHO_URL = 'ws://127.0.0.1:' + wsEcho.server.address().port + '/echo'
  try {
    console.log('\n== 1) 临时基路径 ' + basePath + ' ==')

    const health = await httpJson(base, PREFIX + '/health')
    assert.equal(health.status, 200)
    assert.deepEqual(health.json, { ok: true, data: { status: 'up', storeRoot: basePath } })
    record('GET ' + PREFIX + '/health', 'status=200 ok=true storeRoot=' + health.json.data.storeRoot)

    const empty = await httpJson(base, PREFIX + '/storage/listProjects')
    assert.equal(empty.status, 200)
    assert.deepEqual(empty.json, { ok: true, data: [] })
    record('GET listProjects（空库）', 'data=[]')

    const created = await httpJson(base, PREFIX + '/storage/createProject', {
      method: 'POST',
      body: { name: 'smoke-临时项目' },
    })
    assert.equal(created.status, 200)
    assert.equal(created.json.ok, true)
    const projectId = created.json.data.id
    assert.match(projectId, /^proj_/)
    record('POST createProject', 'projectId=' + projectId)

    const saved = await httpJson(base, PREFIX + '/storage/saveEndpoint', {
      method: 'POST',
      body: {
        projectId,
        endpoint: {
          name: 'smoke 接口',
          method: 'GET',
          url: echoUrl,
          params: [{ key: 'a', value: '1', enabled: true }],
          headers: [{ key: 'X-Smoke', value: '1', enabled: true }],
          body: { type: 'none', content: '' },
          auth: { type: 'none', token: '', username: '', password: '' },
          description: '冒烟用例',
        },
      },
    })
    assert.equal(saved.status, 200)
    assert.equal(saved.json.ok, true)
    const endpointId = saved.json.data.id
    assert.match(endpointId, /^ep_/)
    assert.ok(saved.json.data.createdAt, 'saveEndpoint 应补 createdAt')
    record('POST saveEndpoint', 'endpointId=' + endpointId + ' createdAt=' + saved.json.data.createdAt)

    const got = await httpJson(base, PREFIX + '/storage/getProject?projectId=' + encodeURIComponent(projectId))
    assert.equal(got.status, 200)
    assert.equal(got.json.ok, true)
    assert.equal(got.json.data.id, projectId)
    assert.equal(got.json.data.endpoints.length, 1)
    assert.equal(got.json.data.endpoints[0].name, 'smoke 接口')
    record('GET getProject', 'endpoints=' + got.json.data.endpoints.length)

    const sent = await httpJson(base, PREFIX + '/request/send', {
      method: 'POST',
      body: { method: 'GET', url: echoUrl, params: [{ key: 'q', value: 'smoke', enabled: true }] },
    })
    assert.equal(sent.status, 200)
    assert.equal(sent.json.ok, true)
    assert.equal(sent.json.data.status, 200)
    assert.equal(sent.json.data.body, 'pong')
    record('POST request/send（本地 echo）', 'status=' + sent.json.data.status + ' body=' + JSON.stringify(sent.json.data.body) + ' timeMs=' + sent.json.data.timeMs)

    const rejected = await httpJson(base, PREFIX + '/health', { headers: { 'x-smoke-reject': '1' } })
    assert.equal(rejected.status, 401)
    assert.equal(rejected.json.ok, false)
    assert.equal(rejected.json.code, 'UNAUTHORIZED')
    record('宿主栅栏 requestRejection', 'status=401 code=UNAUTHORIZED')

    const missing = await httpJson(base, PREFIX + '/nope')
    assert.equal(missing.status, 404)
    assert.equal(missing.json.code, 'NOT_FOUND')
    record('未知路由', 'status=404 code=NOT_FOUND')

    const list = await httpJson(base, PREFIX + '/storage/listProjects')
    assert.equal(list.json.data.length, 1)
    assert.equal(list.json.data[0].name, 'smoke-临时项目')
    record('GET listProjects（含新项目）', 'count=1')

    // client 桥（registry.js）发的是 { id } 而不是 { projectId }：端到端同样要通
    const renamed = await httpJson(base, PREFIX + '/storage/renameProject', {
      method: 'POST',
      body: { id: projectId, name: 'smoke-改名后' },
    })
    assert.equal(renamed.status, 200)
    assert.equal(renamed.json.ok, true)
    assert.equal(renamed.json.data.name, 'smoke-改名后')
    record('POST renameProject（client {id} 形态）', 'name=' + renamed.json.data.name)

    // v2 全链路（变量/脚本/schema/导入导出/代码生成/历史/搜索/测试/mock/P2 路由位）
    await v2Stage(base, projectId)

    const removed = await httpJson(base, PREFIX + '/storage/deleteProject', {
      method: 'POST',
      body: { id: projectId },
    })
    assert.equal(removed.status, 200)
    assert.equal(removed.json.ok, true)
    const afterDelete = await httpJson(base, PREFIX + '/storage/listProjects')
    assert.deepEqual(afterDelete.json.data, [])
    record('POST deleteProject（client {id} 形态）', 'listProjects 已空')
  } finally {
    // 升级后的 WS 连接会脱离 server 跟踪、keep-alive 空闲连接也可能让 close() 长等——
    // 统一走确定性关停（先毁后关 + 2s 超时兜底），保证冒烟进程必定退出。
    await closeServer(echo.server, echo.conns)
    await wsEcho.close()
    await closeServer(server, serverConns)
    await fs.rm(basePath, { recursive: true, force: true })
  }
}

/** v2 阶段：变量渲染 / 脚本 / Mock / 导入导出 / 代码生成 / 自动化测试 全链路。 */
let ECHO_URL = ''
let WS_ECHO_URL = ''
async function v2Stage(base, projectId) {
  const echoUrl = ECHO_URL;
  // 1) 变量渲染（request/preview 走 services.variables）
  const preview = await httpJson(base, PREFIX + '/request/preview', {
    method: 'POST',
    body: {
      projectId,
      url: 'https://{{host}}/api/{{version}}/orders',
      params: [{ key: 'q', value: '{{keyword}}' }],
      local: { host: 'api.example.test', version: 'v1', keyword: 'pen' },
    },
  })
  assert.equal(preview.status, 200)
  assert.equal(preview.json.ok, true)
  assert.equal(preview.json.data.url.resolved, 'https://api.example.test/api/v1/orders', 'preview 应完成 {{}} 替换')
  assert.equal(preview.json.data.url.missing.length, 0, 'local 变量齐备时不应有 missing')
  assert.equal(preview.json.data.params[0].value, 'pen', 'params 值也应替换')
  record('POST request/preview（变量渲染）', 'resolved=' + preview.json.data.url.resolved + ' missing=0')

  // 2) 脚本沙箱
  const script = await httpJson(base, PREFIX + '/script/run', {
    method: 'POST',
    body: {
      code: 'pm.test("status ok", () => { pm.expect(pm.response.code).to.equal(200) }); pm.environment.set("tid", "T-1");',
      context: { response: { status: 200, headers: {}, body: '{}', timeMs: 5 }, env: {}, globals: {}, variables: {} },
    },
  })
  assert.equal(script.status, 200)
  assert.equal(script.json.ok, true)
  assert.equal(script.json.data.ok, true)
  assert.equal(script.json.data.tests.length, 1)
  assert.equal(script.json.data.tests[0].passed, true)
  assert.equal(script.json.data.variables.tid, 'T-1')
  record('POST script/run（pm.test + 变量回传）', 'tests=1 variables.tid=T-1')

  // 3) schema 示例与校验
  const example = await httpJson(base, PREFIX + '/schema/example', {
    method: 'POST',
    body: { schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } } },
  })
  assert.equal(example.status, 200)
  assert.deepEqual(example.json.data.example, { id: 0, name: '' })
  record('POST schema/example', JSON.stringify(example.json.data.example))

  const validate = await httpJson(base, PREFIX + '/schema/validate', {
    method: 'POST',
    body: { schema: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } }, data: { name: 'x' } },
  })
  assert.equal(validate.json.ok, true)
  assert.equal(validate.json.data.ok, false)
  assert.match(validate.json.data.message, /必填缺失/)
  record('POST schema/validate（必填缺失命中）', validate.json.data.message)

  // 4) 导入 OpenAPI（固定样本）→ 落盘为目录/接口/模型
  const openapi = {
    openapi: '3.0.3',
    info: { title: 'smoke-api', version: '1.0.0' },
    tags: [{ name: '订单' }],
    paths: {
      '/orders/{id}': {
        get: {
          tags: ['订单'], summary: '查订单',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'ok', content: { 'application/json': { schema: { type: 'object' } } } } },
        },
      },
    },
    components: { schemas: { Order: { type: 'object', properties: { id: { type: 'string' } } } } },
  }
  const imported = await httpJson(base, PREFIX + '/import/openapi', { method: 'POST', body: { json: openapi } })
  assert.equal(imported.status, 200)
  assert.equal(imported.json.ok, true)
  const importedData = imported.json.data
  assert.ok(importedData, 'import/openapi 应返回导入结果')
  const importedEndpoints = Array.isArray(importedData) ? importedData : (importedData.endpoints || [])
  assert.ok(importedEndpoints.length >= 1, 'OpenAPI 导入应产出至少一条接口')
  record('POST import/openapi', 'endpoints=' + importedEndpoints.length)

  // 5) 导出 OpenAPI（从落盘项目读）
  const exported = await httpJson(base, PREFIX + '/export/openapi', { method: 'POST', body: { projectId } })
  assert.equal(exported.status, 200)
  assert.equal(exported.json.ok, true)
  assert.equal(exported.json.data.openapi !== undefined, true)
  record('POST export/openapi', 'paths=' + Object.keys(exported.json.data.paths || {}).length)

  // 6) 导出 Markdown
  const md = await httpJson(base, PREFIX + '/export/markdown', { method: 'POST', body: { projectId } })
  assert.equal(md.status, 200)
  assert.equal(typeof md.json.data, 'string')
  record('POST export/markdown', 'bytes=' + md.json.data.length)

  // 7) 代码生成（8 语言逐个）
  const LANGS = ['curl', 'fetch', 'axios', 'python', 'go', 'java', 'php', 'csharp']
  for (const lang of LANGS) {
    const gen = await httpJson(base, PREFIX + '/codegen/run', {
      method: 'POST',
      body: { lang, endpoint: { method: 'POST', url: 'https://api.example.test/v1/orders', headers: [{ key: 'X-T', value: '1', enabled: true }], body: { type: 'json', content: '{"a":1}' } } },
    })
    assert.equal(gen.status, 200, lang + ' 代码生成应 200')
    assert.equal(gen.json.ok, true, lang + ' 代码生成应 ok')
    assert.ok(typeof gen.json.data === 'string' && gen.json.data.length > 10, lang + ' 应产出代码字符串')
  }
  record('POST codegen/run（8 语言）', LANGS.join('/'))

  // 8) 历史：request/send 带 projectId 后应自动落一条
  const sent = await httpJson(base, PREFIX + '/request/send', {
    method: 'POST',
    body: { projectId, method: 'GET', url: 'https://api.example.test/ping' },
  })
  assert.equal(sent.status, 200)
  const hist = await httpJson(base, PREFIX + '/storage/getHistory?projectId=' + encodeURIComponent(projectId))
  assert.equal(hist.status, 200)
  assert.ok(Array.isArray(hist.json.data.entries), 'getHistory 应返回 entries 数组')
  assert.ok(hist.json.data.entries.length >= 1, 'request/send 带 projectId 应自动追加历史')
  record('GET storage/getHistory（自动追加）', 'entries=' + hist.json.data.entries.length)

  // 9) 全局搜索
  const search = await httpJson(base, PREFIX + '/storage/search?projectId=' + encodeURIComponent(projectId) + '&keyword=smoke')
  assert.equal(search.status, 200)
  assert.ok(search.json.data && Array.isArray(search.json.data.endpoints), 'search 应返回 endpoints 数组')
  record('GET storage/search', 'endpoints=' + search.json.data.endpoints.length)

  // 10) 自动化测试：用例写入 project.settings.testCases（test 页同款落点）后 runCase
  const ep = await httpJson(base, PREFIX + '/storage/saveEndpoint', {
    method: 'POST',
    body: {
      projectId,
      endpoint: {
        name: 'smoke 测试接口', method: 'GET', url: echoUrl,
        responses: [{ name: '成功', code: 200, contentType: 'text/plain', body: 'pong', isDefault: true }],
      },
    },
  })
  assert.equal(ep.status, 200)
  const epId = ep.json.data.id
  const caseId = 'tc_smoke1'
  const savedSettings = await httpJson(base, PREFIX + '/storage/saveProjectSettings', {
    method: 'POST',
    body: {
      projectId,
      settings: {
        testCases: [{
          id: caseId, name: 'smoke 用例', endpointId: epId,
          assertions: [{ source: 'status', op: 'eq', value: 200 }],
          extractors: [{ name: 'st', source: 'status', path: '' }],
        }],
      },
    },
  })
  assert.equal(savedSettings.status, 200)
  // runCase 读 project.testCases（顶层）：把用例同时写到顶层以覆盖运行器契约
  const projectNow = await httpJson(base, PREFIX + '/storage/getProject', { method: 'POST', body: { projectId } })
  assert.equal(projectNow.status, 200)
  const runCase = await httpJson(base, PREFIX + '/test/runCase', { method: 'POST', body: { projectId, caseId } })
  assert.equal(runCase.status, 200, 'runCase 应 200（用例写在 settings.testCases 时运行器必须读到）')
  assert.equal(runCase.json.ok, true)
  assert.equal(runCase.json.data.passed, true, 'echo 目标返回 200，断言 status=200 应通过')
  assert.equal(runCase.json.data.extracted.st, 200, 'extractor 应提取 status')
  record('POST test/runCase（settings.testCases 落点）', 'passed=true extracted.st=200')

  // 11) mock 服务启停（端口 0 → OS 分配，避免与本机 4010 冲突）
  const started = await httpJson(base, PREFIX + '/mock/start', { method: 'POST', body: { port: 0 } })
  assert.equal(started.status, 200)
  assert.equal(started.json.data.running, true)
  const status = await httpJson(base, PREFIX + '/mock/status', { method: 'POST', body: {} })
  assert.equal(status.json.data.running, true)
  const stopped = await httpJson(base, PREFIX + '/mock/stop', { method: 'POST', body: {} })
  assert.equal(stopped.json.data.running, false)
  record('POST mock/start|status|stop', 'running=true → false')

  // 12) 数据库操作（sqlite 内置驱动真实现）
  const dbQuery = await httpJson(base, PREFIX + '/db/query', {
    method: 'POST',
    body: { connection: { type: 'sqlite', path: ':memory:' }, sql: 'SELECT 40 + 2 AS answer' },
  })
  assert.equal(dbQuery.status, 200)
  assert.equal(dbQuery.json.ok, true)
  assert.equal(dbQuery.json.data.rows[0].answer, 42)
  record('POST db/query（sqlite 内置驱动）', 'rows[0].answer=' + dbQuery.json.data.rows[0].answer)

  const dbUnsupported = await httpJson(base, PREFIX + '/db/test', {
    method: 'POST',
    body: { connection: { type: 'mysql', host: '127.0.0.1' } },
  })
  assert.equal(dbUnsupported.status, 200)
  assert.equal(dbUnsupported.json.data.ok, false)
  assert.equal(dbUnsupported.json.data.error.code, 'UNSUPPORTED_DRIVER')
  record('POST db/test（未内置驱动明确报错）', 'ok=false code=' + dbUnsupported.json.data.error.code)

  // 13) WebSocket 调试（本地 WS echo，握手即连）
  const wsOpen = await httpJson(base, PREFIX + '/ws/open', { method: 'POST', body: { url: WS_ECHO_URL.replace('ws://', 'http://') } })
  assert.equal(wsOpen.status, 200)
  assert.equal(wsOpen.json.ok, true)
  assert.equal(wsOpen.json.data.status, 'open', 'http 地址应自动归一为 ws 并完成握手')
  const wsId = wsOpen.json.data.id
  const wsSend = await httpJson(base, PREFIX + '/ws/send', { method: 'POST', body: { id: wsId, message: 'smoke-ws' } })
  assert.equal(wsSend.json.data.ok, true)
  await new Promise((resolve) => setTimeout(resolve, 150))
  const wsMessages = await httpJson(base, PREFIX + '/ws/messages', { method: 'POST', body: { id: wsId } })
  assert.ok(wsMessages.json.data.messages.some((m) => m.direction === 'in' && m.data === 'smoke-ws'), '应收到回显')
  const wsClose = await httpJson(base, PREFIX + '/ws/close', { method: 'POST', body: { id: wsId } })
  assert.equal(wsClose.json.data.ok, true)
  record('POST ws/open|send|messages|close（本地 echo）', 'status=open echo=smoke-ws')

  // 14) Apifox / YApi 导入路由
  const apifoxIn = await httpJson(base, PREFIX + '/import/apifox', {
    method: 'POST',
    body: { json: { name: 'smoke-apifox', apiCollection: [{ type: 'api', method: 'GET', path: '/smoke', name: '冒烟接口' }] } },
  })
  assert.equal(apifoxIn.status, 200)
  assert.equal(apifoxIn.json.data.endpoints.length, 1)
  const yapiIn = await httpJson(base, PREFIX + '/import/yapi', {
    method: 'POST',
    body: { json: { name: 'smoke-yapi', list: [{ title: '冒烟接口', path: '/smoke', method: 'GET' }] } },
  })
  assert.equal(yapiIn.status, 200)
  assert.equal(yapiIn.json.data.endpoints.length, 1)
  record('POST import/apifox + import/yapi', 'endpoints=1/1')
}

async function realStage() {
  const basePath = DEFAULT_BASE_PATH
  const dirExisted = await fs.stat(basePath).then((s) => s.isDirectory(), () => false)
  const indexPath = path.join(basePath, 'index.json')
  const indexExisted = await fs.stat(indexPath).then(() => true, () => false)

  const storage = createStorageService(basePath)
  const name = 'smoke-真实基路径-' + Date.now().toString(36)
  let projectId = ''
  try {
    console.log('\n== 2) 真实基路径 ' + basePath + ' ==')
    const project = await storage.createProject(name)
    projectId = project.id
    assert.match(projectId, /^proj_/)

    const projectFile = path.join(basePath, projectId, 'project.json')
    const onDisk = JSON.parse(await fs.readFile(projectFile, 'utf8'))
    assert.equal(onDisk.id, projectId)
    assert.equal(onDisk.name, name)
    record('真实基路径 createProject', 'projectId=' + projectId + ' 落盘=' + projectFile)

    const back = await storage.getProject(projectId)
    assert.equal(back.name, name)
    assert.deepEqual(back.endpoints, [])
    assert.deepEqual(back.folders, [])
    record('真实基路径 getProject 读回', 'name=' + back.name)

    const listed = await storage.listProjects()
    assert.ok(listed.some((p) => p.id === projectId), 'index.json 应包含新项目')
    record('真实基路径 listProjects', 'index 条目=' + listed.length)
  } finally {
    if (projectId !== '') {
      await storage.deleteProject(projectId)
      // deleteProject 先备份到 .trash/<id>-<ts>/，冒烟后一并清掉，不留残留
      const trashDir = path.join(basePath, '.trash')
      const entries = await fs.readdir(trashDir).catch(() => [])
      for (const entry of entries) {
        if (entry.startsWith(projectId + '-')) {
          await fs.rm(path.join(trashDir, entry), { recursive: true, force: true })
        }
      }
      const left = await fs.readdir(trashDir).catch(() => [])
      if (left.length === 0) await fs.rm(trashDir, { recursive: true, force: true })
      const after = await storage.listProjects()
      assert.ok(!after.some((p) => p.id === projectId), '清理后 index 不应残留该项目')
      console.log('  CLEAN 已删除冒烟项目 ' + projectId + ' 并清理 .trash 副本')
    }
    if (!indexExisted) await fs.rm(indexPath, { force: true })
    if (!dirExisted) await fs.rm(basePath, { recursive: true, force: true })
  }
}

try {
  await tempStage()
  await realStage()
  console.log('\n结果：冒烟通过 ' + results.length + ' 项，失败 0 项')
} catch (err) {
  console.error('\n冒烟失败：' + (err && err.stack ? err.stack : err))
  process.exitCode = 1
}
