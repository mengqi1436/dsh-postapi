/** T3 webServer prefix 桥测试：全路由冒烟 + apply 注册与宿主栅栏 + 契约 §5 全表路由 + 四类错误码。node tests/run.js 直接执行。 */
import assert from 'node:assert/strict'
import http from 'node:http'
import { once } from 'node:events'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { handlePostapiRequest } from '../src/host/bridge.js'
import { apply } from '../src/host/index.js'
import { createStorageService } from '../src/host/storage.js'
import { createRequestService } from '../src/host/request.js'
import {
  createBridgeStorage, createBridgeRequest, createBridgeServices,
  createStubServices, STORAGE_METHODS, REQUEST_METHODS, SERVICE_METHODS,
} from '../src/client/shell/registry.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '..')

/** 把 handler 挂成 loopback node:http server（handler 崩溃兜底 500 JSON）。 */
function startHandlerServer(handler) {
  const server = http.createServer((req, res) => {
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

async function withHandlerServer(handler, fn) {
  const { server, listening } = startHandlerServer(handler)
  await listening
  const base = 'http://127.0.0.1:' + server.address().port
  try {
    return await fn(base)
  } finally {
    server.close()
    await once(server, 'close')
  }
}

async function jsonFetch(base, p, opts = {}) {
  const { method = 'GET', body } = opts
  const res = await fetch(base + p, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })
  return { status: res.status, json: await res.json() }
}

async function withTempBase(fn) {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'postapi-bridge-'))
  try {
    return await fn(base)
  } finally {
    await fs.rm(base, { recursive: true, force: true })
  }
}

/** 组装 storage/request 并桥接成 HTTP handler（第三参 services 可选）。 */
function makeBridge(basePath, services) {
  const storage = createStorageService(basePath)
  const request = createRequestService()
  return (req, res) => handlePostapiRequest(req, res, { storage, request, services })
}

/**
 * 记录型 storage：真实 service 的方法照常执行（host-data 已交付的方法用真实实现），
 * 未交付的方法回落最小假桩 —— 让桥的路由冒烟不被 host-data 的交付进度绑死。
 */
function makeSpyStorage(basePath) {
  const real = createStorageService(basePath)
  const calls = []
  const storage = new Proxy(real, {
    get(target, prop) {
      if (typeof prop !== 'string') return target[prop]
      if (prop === '__calls') return calls
      return (...args) => {
        calls.push([prop, args])
        const fn = target[prop]
        if (typeof fn === 'function') return fn.apply(target, args)
        return { method: prop, args }
      }
    },
  })
  return { storage, calls, real }
}

/** 记录型 request：只记录入参，不真发请求（透传断言用）。 */
function makeSpyRequest(result = { status: 200, headers: {}, body: 'ok', bodySize: 2, timeMs: 1, request: { method: 'GET', url: 'http://x/y', headers: {}, body: '' } }) {
  const calls = []
  return {
    calls,
    service: {
      async send(opts) { calls.push(['send', opts]); return result },
      async preview(opts) { calls.push(['preview', opts]); return { previewed: true } },
    },
  }
}

/** 契约 §4 services 假桩：每次调用记录 (方法名, 参数) 并回可辨识结果。 */
function makeFakeServices() {
  const calls = []
  const rec = (name) => (...args) => {
    calls.push([name, args])
    return { stub: name, args }
  }
  const resolverOf = (input) => {
    const local = (input && input.local) || {}
    const envVars = (input && input.environment && input.environment.variables) || []
    const globals = (input && input.globals && input.globals.variables) || []
    const resolve = (text) => String(text ?? '').replace(/\{\{([\w.$]+)\}\}/g, (m, k) => {
      if (local[k] !== undefined) return String(local[k])
      const hitEnv = envVars.find((v) => v && v.key === k)
      if (hitEnv) return String(hitEnv.value)
      const hitGlobal = globals.find((v) => v && v.key === k)
      return hitGlobal ? String(hitGlobal.value) : m
    })
    return {
      resolve,
      explain: (text) => ({ resolved: resolve(text), missing: [] }),
    }
  }
  return {
    calls,
    services: {
      variables: { createVariableResolver: (input) => { calls.push(['variables.createVariableResolver', [input]]); return resolverOf(input) } },
      sandbox: { runScript: rec('sandbox.runScript') },
      mock: { start: rec('mock.start'), stop: rec('mock.stop'), status: rec('mock.status') },
      runner: { runCase: rec('runner.runCase'), runScenario: rec('runner.runScenario') },
      importExport: {
        importOpenApi: rec('ie.importOpenApi'),
        importPostman: rec('ie.importPostman'),
        importHar: rec('ie.importHar'),
        importCurl: rec('ie.importCurl'),
        exportOpenApi: rec('ie.exportOpenApi'),
        exportPostman: rec('ie.exportPostman'),
        exportHar: rec('ie.exportHar'),
        exportMarkdown: rec('ie.exportMarkdown'),
      },
      codegen: { generateCode: rec('codegen.generateCode') },
    },
  }
}

/** 建一个真实项目并返回 id（storage 扩展路由的 400/501 用例前置）。 */
async function seedProject(httpBase, name = '契约项目') {
  const created = await jsonFetch(httpBase, '/api/storage/createProject', { method: 'POST', body: { name } })
  assert.equal(created.json.ok, true)
  return created.json.data.id
}

export const tests = [
  {
    name: 'bridge: /api/health 与 prefix 形态 /dsh-postapi/api/health 均可达',
    fn: () => withTempBase((base) =>
      withHandlerServer(makeBridge(base), async (httpBase) => {
        const r1 = await jsonFetch(httpBase, '/api/health')
        assert.equal(r1.status, 200)
        assert.equal(r1.json.ok, true)
        const r2 = await jsonFetch(httpBase, '/dsh-postapi/api/health')
        assert.equal(r2.status, 200)
        assert.equal(r2.json.ok, true)
      })),
  },
  {
    name: 'bridge: listProjects 空库 + createProject/saveEndpoint 往返 + getProject',
    fn: () => withTempBase((base) =>
      withHandlerServer(makeBridge(base), async (httpBase) => {
        const empty = await jsonFetch(httpBase, '/dsh-postapi/api/storage/listProjects')
        assert.deepEqual(empty.json, { ok: true, data: [] })

        const created = await jsonFetch(httpBase, '/api/storage/createProject', {
          method: 'POST', body: { name: '桥接项目' },
        })
        assert.equal(created.status, 200)
        assert.equal(created.json.ok, true)
        const projectId = created.json.data.id
        assert.match(projectId, /^proj_/)

        const saved = await jsonFetch(httpBase, '/api/storage/saveEndpoint', {
          method: 'POST',
          body: { projectId, endpoint: { name: '桥接接口', url: 'http://x/y', method: 'GET' } },
        })
        assert.equal(saved.status, 200)
        assert.equal(saved.json.ok, true)
        assert.match(saved.json.data.id, /^ep_/)
        assert.ok(saved.json.data.createdAt)

        const got = await jsonFetch(httpBase, '/api/storage/getProject?projectId=' + projectId)
        assert.equal(got.status, 200)
        assert.equal(got.json.data.endpoints.length, 1)
        assert.equal(got.json.data.endpoints[0].name, '桥接接口')

        const list = await jsonFetch(httpBase, '/api/storage/listProjects')
        assert.equal(list.json.data.length, 1)
        assert.equal(list.json.data[0].name, '桥接项目')
      })),
  },
  {
    name: 'bridge: POST /api/request/send 转发本地 echo 返回 send 结果',
    fn: () => withTempBase((base) =>
      withHandlerServer(makeBridge(base), async (httpBase) => {
        const echo = http.createServer((req, res) => { res.end('pong') })
        echo.listen(0, '127.0.0.1')
        await once(echo, 'listening')
        try {
          const r = await jsonFetch(httpBase, '/api/request/send', {
            method: 'POST',
            body: { method: 'GET', url: 'http://127.0.0.1:' + echo.address().port + '/x' },
          })
          assert.equal(r.status, 200)
          assert.equal(r.json.ok, true)
          assert.equal(r.json.data.status, 200)
          assert.equal(r.json.data.body, 'pong')
        } finally {
          echo.close()
          await once(echo, 'close')
        }
      })),
  },
  {
    name: 'bridge: 未知路由 404 NOT_FOUND',
    fn: () => withTempBase((base) =>
      withHandlerServer(makeBridge(base), async (httpBase) => {
        const r = await jsonFetch(httpBase, '/api/nope')
        assert.equal(r.status, 404)
        assert.equal(r.json.ok, false)
        assert.equal(r.json.code, 'NOT_FOUND')
      })),
  },
  {
    name: 'bridge: 坏 JSON body 转 400 INVALID_ARGUMENT（契约 §5 参数错误）且存储不受损',
    fn: () => withTempBase((base) =>
      withHandlerServer(makeBridge(base), async (httpBase) => {
        const created = await jsonFetch(httpBase, '/api/storage/createProject', {
          method: 'POST', body: { name: '坏' },
        })
        const projectId = created.json.data.id
        const r = await fetch(httpBase + '/api/storage/saveEndpoint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'not json at all',
        })
        assert.equal(r.status, 400)
        const j = await r.json()
        assert.equal(j.ok, false)
        assert.equal(j.code, 'INVALID_ARGUMENT')
        const got = await jsonFetch(httpBase, '/api/storage/getProject?projectId=' + projectId)
        assert.equal(got.json.ok, true)
      })),
  },
  {
    name: 'bridge: getProject 缺 projectId 返回 400 INVALID_ARGUMENT',
    fn: () => withTempBase((base) =>
      withHandlerServer(makeBridge(base), async (httpBase) => {
        const r = await jsonFetch(httpBase, '/api/storage/getProject')
        assert.equal(r.status, 400)
        assert.equal(r.json.code, 'INVALID_ARGUMENT')
      })),
  },
  {
    name: 'bridge: apply 注册 prefix 桥 + requestRejection 栅栏 401/403/放行',
    fn: () => withTempBase(async (base) => {
      const registrations = []
      const ctx = {
        effect: (fn) => fn(),
        webServer: {
          host: '127.0.0.1',
          port: 58538,
          register: (h) => {
            registrations.push(h)
            return () => {}
          },
        },
        connection: {
          requestRejection: (req) => {
            const mode = new URL(req.url, 'http://x').searchParams.get('mode')
            if (mode === '401') return 401
            if (mode === '403') return 403
            return undefined
          },
        },
      }
      apply(ctx, { storage: { basePath: base } })
      assert.ok(typeof ctx.effect === 'function') // cordis 受控 ctx 禁止挂属性：不再断言 ctx.postapi（桥以闭包持服务）
      assert.equal(registrations.length, 1)
      assert.equal(registrations[0].kind, 'prefix')
      assert.equal(registrations[0].path, '/dsh-postapi/api')
      return withHandlerServer(registrations[0].handler, async (httpBase) => {
        const r401 = await jsonFetch(httpBase, '/api/health?mode=401')
        assert.equal(r401.status, 401)
        assert.equal(r401.json.ok, false)
        assert.equal(r401.json.code, 'UNAUTHORIZED')
        const r403 = await jsonFetch(httpBase, '/api/health?mode=403')
        assert.equal(r403.status, 403)
        assert.equal(r403.json.code, 'FORBIDDEN')
        const ok = await jsonFetch(httpBase, '/api/health')
        assert.equal(ok.status, 200)
        assert.equal(ok.json.ok, true)
      })
    }),
  },
  {
    name: 'bridge: POST /storage/getProject 兼容分支与 GET 形态同返回',
    fn: () => withTempBase((base) =>
      withHandlerServer(makeBridge(base), async (httpBase) => {
        const created = await jsonFetch(httpBase, '/api/storage/createProject', {
          method: 'POST', body: { name: 'POST 形态项目' },
        })
        const projectId = created.json.data.id
        await jsonFetch(httpBase, '/api/storage/saveEndpoint', {
          method: 'POST',
          body: { projectId, endpoint: { name: '往返接口' } },
        })
        const viaPost = await jsonFetch(httpBase, '/api/storage/getProject', {
          method: 'POST', body: { projectId },
        })
        assert.equal(viaPost.status, 200)
        assert.equal(viaPost.json.ok, true)
        assert.equal(viaPost.json.data.id, projectId)
        assert.equal(viaPost.json.data.endpoints.length, 1)
        assert.equal(viaPost.json.data.endpoints[0].name, '往返接口')
        // prefix 形态同样命中
        const viaPrefix = await jsonFetch(httpBase, '/dsh-postapi/api/storage/getProject', {
          method: 'POST', body: { projectId },
        })
        assert.equal(viaPrefix.json.ok, true)
        assert.equal(viaPrefix.json.data.id, projectId)
        // 缺 projectId 与 GET 形态一致返回 400
        const missing = await jsonFetch(httpBase, '/api/storage/getProject', { method: 'POST', body: {} })
        assert.equal(missing.status, 400)
        assert.equal(missing.json.code, 'INVALID_ARGUMENT')
      })),
  },
  {
    name: 'bridge: renameProject/deleteProject 兼容 client 的 {id} 形态（不静默空 projectId）',
    fn: () => withTempBase((base) =>
      withHandlerServer(makeBridge(base), async (httpBase) => {
        const created = await jsonFetch(httpBase, '/api/storage/createProject', {
          method: 'POST', body: { name: '旧名' },
        })
        const projectId = created.json.data.id
        // client registry.js 发的是 { id }，不是 { projectId }：必须同样命中
        const renamed = await jsonFetch(httpBase, '/api/storage/renameProject', {
          method: 'POST', body: { id: projectId, name: '新名' },
        })
        assert.equal(renamed.status, 200)
        assert.equal(renamed.json.ok, true)
        assert.equal(renamed.json.data.name, '新名')
        const got = await jsonFetch(httpBase, '/api/storage/getProject', {
          method: 'POST', body: { id: projectId },
        })
        assert.equal(got.json.data.name, '新名')
        const list = await jsonFetch(httpBase, '/api/storage/listProjects')
        assert.equal(list.json.data[0].name, '新名')
        const del = await jsonFetch(httpBase, '/api/storage/deleteProject', {
          method: 'POST', body: { id: projectId },
        })
        assert.equal(del.json.ok, true)
        const after = await jsonFetch(httpBase, '/api/storage/listProjects')
        assert.deepEqual(after.json.data, [])
      })),
  },

  /* ---------------- 契约 §5 新增：storage 扩展路由全表冒烟 ---------------- */

  {
    name: 'bridge: storage 扩展路由（moveNode/save|deleteSchema/env/globals/settings/flow/response）逐条命中并透传参数',
    fn: () => withTempBase(async (base) => {
      const { storage, calls } = makeSpyStorage(base)
      const request = createRequestService()
      const handler = (req, res) => handlePostapiRequest(req, res, { storage, request })
      await withHandlerServer(handler, async (httpBase) => {
        const projectId = await seedProject(httpBase, '扩展路由项目')
        calls.length = 0
        const cases = [
          ['moveNode', { kind: 'endpoint', id: 'ep_1', parentId: 'fld_1', order: 3 }, ['moveNode', [projectId, { kind: 'endpoint', id: 'ep_1', parentId: 'fld_1', order: 3 }]]],
          ['saveSchema', { schema: { name: '用户模型' } }, ['saveSchema', [projectId, { name: '用户模型' }]]],
          ['deleteSchema', { schemaId: 'sch_1' }, ['deleteSchema', [projectId, 'sch_1']]],
          ['saveEnvironment', { environment: { name: '开发环境' } }, ['saveEnvironment', [projectId, { name: '开发环境' }]]],
          ['deleteEnvironment', { envId: 'env_1' }, ['deleteEnvironment', [projectId, 'env_1']]],
          ['saveGlobals', { globals: { variables: [{ key: 'k', value: 'v' }] } }, ['saveGlobals', [projectId, { variables: [{ key: 'k', value: 'v' }] }]]],
          ['saveProjectSettings', { settings: { mockPort: 4011 } }, ['saveProjectSettings', [projectId, { mockPort: 4011 }]]],
          ['saveFlow', { flow: { steps: [] } }, ['saveFlow', [projectId, { steps: [] }]]],
          ['saveResponse', { endpointId: 'ep_1', response: { code: 200 } }, ['saveResponse', [projectId, 'ep_1', { code: 200 }]]],
          ['deleteResponse', { endpointId: 'ep_1', responseId: 'res_1' }, ['deleteResponse', [projectId, 'ep_1', 'res_1']]],
          ['clearHistory', {}, ['clearHistory', [projectId]]],
          ['appendHistory', { entry: { method: 'GET', url: '/x' } }, ['appendHistory', [projectId, { method: 'GET', url: '/x' }]]],
        ]
        for (const [route, body, expected] of cases) {
          calls.length = 0
          const r = await jsonFetch(httpBase, '/api/storage/' + route, { method: 'POST', body: { projectId, ...body } })
          assert.equal(r.status, 200, route + ' 应返回 200')
          assert.equal(r.json.ok, true, route + ' 封套应为 ok:true')
          const hit = calls.find((c) => c[0] === expected[0])
          assert.ok(hit, route + ' 应命中 storage.' + expected[0])
          assert.deepEqual(hit[1], expected[1], route + ' 参数应逐项透传')
        }
      })
    }),
  },
  {
    name: 'bridge: getHistory/search 的 GET query 形态与 POST body 形态同命中',
    fn: () => withTempBase(async (base) => {
      const { storage, calls } = makeSpyStorage(base)
      const handler = (req, res) => handlePostapiRequest(req, res, { storage, request: createRequestService() })
      await withHandlerServer(handler, async (httpBase) => {
        const projectId = await seedProject(httpBase, '查询项目')
        calls.length = 0
        const viaGet = await jsonFetch(httpBase, '/api/storage/getHistory?projectId=' + projectId)
        assert.equal(viaGet.status, 200)
        assert.equal(viaGet.json.ok, true)
        assert.deepEqual(calls.find((c) => c[0] === 'getHistory')[1], [projectId])

        const viaPost = await jsonFetch(httpBase, '/api/storage/getHistory', { method: 'POST', body: { projectId } })
        assert.equal(viaPost.json.ok, true)

        calls.length = 0
        const searchGet = await jsonFetch(httpBase, '/api/storage/search?projectId=' + projectId + '&keyword=abc')
        assert.equal(searchGet.json.ok, true)
        assert.deepEqual(calls.find((c) => c[0] === 'search')[1], [projectId, 'abc'])

        calls.length = 0
        const searchPost = await jsonFetch(httpBase, '/api/storage/search', { method: 'POST', body: { projectId, keyword: 'xyz' } })
        assert.equal(searchPost.json.ok, true)
        assert.deepEqual(calls.find((c) => c[0] === 'search')[1], [projectId, 'xyz'])
      })
    }),
  },

  /* ---------------- request/send 透传 + 自动追加历史 ---------------- */

  {
    name: 'bridge: request/send 透传 variables/preScript/postScript/assertions 并自动追加历史',
    fn: () => withTempBase(async (base) => {
      const { storage, calls } = makeSpyStorage(base)
      const spyRequest = makeSpyRequest({
        status: 201, headers: { 'x-a': '1' }, body: 'created', bodySize: 7, timeMs: 3,
        request: { method: 'POST', url: 'http://api.test/v1/users', headers: { a: 'b' }, body: '{}' },
      })
      const handler = (req, res) => handlePostapiRequest(req, res, { storage, request: spyRequest.service })
      await withHandlerServer(handler, async (httpBase) => {
        const projectId = await seedProject(httpBase, '发送项目')
        calls.length = 0
        const payload = {
          projectId,
          method: 'POST',
          url: '{{base}}/v1/users',
          variables: { globals: { variables: [] }, environment: { variables: [{ key: 'base', value: 'http://api.test' }] } },
          preScript: 'pm.variables.set("a", 1)',
          postScript: 'pm.test("ok", () => pm.expect(pm.response.code).to.eql(201))',
          assertions: [{ source: 'status', op: 'eq', value: '201' }],
        }
        const r = await jsonFetch(httpBase, '/api/request/send', { method: 'POST', body: payload })
        assert.equal(r.status, 200)
        assert.equal(r.json.ok, true)
        assert.equal(r.json.data.status, 201)
        // 透传：新字段一个都不能丢
        const sent = spyRequest.calls.find((c) => c[0] === 'send')[1]
        assert.deepEqual(sent.variables, payload.variables)
        assert.equal(sent.preScript, payload.preScript)
        assert.equal(sent.postScript, payload.postScript)
        assert.deepEqual(sent.assertions, payload.assertions)
        // 历史：request 只回 raw，appendHistory 由桥追加
        const hist = calls.find((c) => c[0] === 'appendHistory')
        assert.ok(hist, 'send 带 projectId 时应自动 appendHistory')
        assert.equal(hist[1][0], projectId)
        assert.equal(hist[1][1].status, 201)
        assert.equal(hist[1][1].url, 'http://api.test/v1/users')
      })
    }),
  },

  /* ---------------- request/preview ---------------- */

  {
    name: 'bridge: request/preview 优先走 request.preview，缺失时用 services.variables 渲染变量',
    fn: () => withTempBase(async (base) => {
      const { storage } = makeSpyStorage(base)
      const fake = makeFakeServices()
      // 1) request 自带 preview 时直接透传
      const spyRequest = makeSpyRequest()
      await withHandlerServer(
        (req, res) => handlePostapiRequest(req, res, { storage, request: spyRequest.service, services: fake.services }),
        async (httpBase) => {
          const r = await jsonFetch(httpBase, '/api/request/preview', { method: 'POST', body: { url: 'http://x' } })
          assert.equal(r.status, 200)
          assert.deepEqual(r.json.data, { previewed: true })
          assert.equal(spyRequest.calls.filter((c) => c[0] === 'preview').length, 1)
        },
      )
      // 2) request 无 preview 时回落 services.variables
      const plainRequest = { send: async () => ({ status: 200 }) }
      await withHandlerServer(
        (req, res) => handlePostapiRequest(req, res, { storage, request: plainRequest, services: fake.services }),
        async (httpBase) => {
          const r = await jsonFetch(httpBase, '/api/request/preview', {
            method: 'POST',
            body: {
              url: '{{base}}/v1/users',
              local: { base: 'http://api.test' },
              headers: [{ key: 'X-Token', value: '{{token}}' }],
              body: { type: 'json', content: '{"a":"{{base}}"}' },
            },
          })
          assert.equal(r.status, 200)
          assert.equal(r.json.data.url.resolved, 'http://api.test/v1/users')
          assert.equal(r.json.data.url.missing.length, 0)
          assert.equal(r.json.data.headers[0].value, '{{token}}') // 未定义变量保留原文
          assert.equal(r.json.data.body.content, '{"a":"http://api.test"}')
        },
      )
    }),
  },

  /* ---------------- script / mock ---------------- */

  {
    name: 'bridge: script/run 与 mock/start|stop|status 走 services 并透传入参',
    fn: () => withTempBase(async (base) => {
      const { storage } = makeSpyStorage(base)
      const fake = makeFakeServices()
      await withHandlerServer(
        (req, res) => handlePostapiRequest(req, res, { storage, request: createRequestService(), services: fake.services }),
        async (httpBase) => {
          const script = await jsonFetch(httpBase, '/api/script/run', {
            method: 'POST',
            body: { code: 'pm.test("a", () => {})', context: { env: { k: 'v' } }, timeoutMs: 1500 },
          })
          assert.equal(script.status, 200)
          assert.equal(script.json.data.stub, 'sandbox.runScript')
          const scriptArgs = fake.calls.find((c) => c[0] === 'sandbox.runScript')[1]
          assert.equal(scriptArgs[0], 'pm.test("a", () => {})')
          assert.deepEqual(scriptArgs[1], { context: { env: { k: 'v' } }, timeoutMs: 1500 })

          for (const [route, name] of [['start', 'mock.start'], ['stop', 'mock.stop'], ['status', 'mock.status']]) {
            const r = await jsonFetch(httpBase, '/api/mock/' + route, {
              method: 'POST', body: route === 'start' ? { port: 4010 } : {},
            })
            assert.equal(r.status, 200, route + ' 应 200')
            assert.equal(r.json.data.stub, name)
          }
          assert.deepEqual(fake.calls.find((c) => c[0] === 'mock.start')[1], [4010])
        },
      )
    }),
  },

  /* ---------------- import / export / codegen ---------------- */

  {
    name: 'bridge: import/* 与 codegen/run 走 services 并透传入参',
    fn: () => withTempBase(async (base) => {
      const { storage } = makeSpyStorage(base)
      const fake = makeFakeServices()
      await withHandlerServer(
        (req, res) => handlePostapiRequest(req, res, { storage, request: createRequestService(), services: fake.services }),
        async (httpBase) => {
          const openapi = { openapi: '3.0.0', paths: {} }
          const r1 = await jsonFetch(httpBase, '/api/import/openapi', { method: 'POST', body: { json: openapi } })
          assert.equal(r1.status, 200)
          assert.equal(r1.json.data.stub, 'ie.importOpenApi')
          assert.deepEqual(fake.calls.find((c) => c[0] === 'ie.importOpenApi')[1], [openapi])

          const r2 = await jsonFetch(httpBase, '/api/import/postman', { method: 'POST', body: { json: { info: {} } } })
          assert.equal(r2.json.data.stub, 'ie.importPostman')
          const r3 = await jsonFetch(httpBase, '/api/import/har', { method: 'POST', body: { json: { log: {} } } })
          assert.equal(r3.json.data.stub, 'ie.importHar')
          const r4 = await jsonFetch(httpBase, '/api/import/curl', { method: 'POST', body: { text: 'curl http://x' } })
          assert.equal(r4.json.data.stub, 'ie.importCurl')
          assert.deepEqual(fake.calls.find((c) => c[0] === 'ie.importCurl')[1], ['curl http://x'])

          const r5 = await jsonFetch(httpBase, '/api/codegen/run', {
            method: 'POST',
            body: { endpoint: { method: 'GET', url: 'http://x' }, lang: 'python' },
          })
          assert.equal(r5.json.data.stub, 'codegen.generateCode')
          const genArgs = fake.calls.find((c) => c[0] === 'codegen.generateCode')[1][0]
          assert.equal(genArgs.lang, 'python')
          assert.equal(genArgs.endpoint.url, 'http://x')
        },
      )
    }),
  },
  {
    name: 'bridge: export/* 支持 body 直接带 project，也支持 projectId 读盘',
    fn: () => withTempBase(async (base) => {
      const { storage } = makeSpyStorage(base)
      const fake = makeFakeServices()
      await withHandlerServer(
        (req, res) => handlePostapiRequest(req, res, { storage, request: createRequestService(), services: fake.services }),
        async (httpBase) => {
          const projectId = await seedProject(httpBase, '导出项目')
          const inline = { id: 'proj_inline', name: '内联项目', endpoints: [] }
          const r1 = await jsonFetch(httpBase, '/api/export/openapi', { method: 'POST', body: { project: inline } })
          assert.equal(r1.status, 200)
          assert.equal(r1.json.data.stub, 'ie.exportOpenApi')
          assert.deepEqual(fake.calls.find((c) => c[0] === 'ie.exportOpenApi')[1][0], inline)

          for (const route of ['postman', 'har', 'markdown']) {
            const r = await jsonFetch(httpBase, '/api/export/' + route, { method: 'POST', body: { projectId } })
            assert.equal(r.status, 200, route + ' 应 200')
            assert.match(r.json.data.stub, /^ie\.export/)
            const passed = fake.calls.filter((c) => c[0] === r.json.data.stub).pop()[1][0]
            assert.equal(passed.id, projectId, route + ' 应按 projectId 读到真实项目')
          }
        },
      )
    }),
  },

  /* ---------------- schema ---------------- */

  {
    name: 'bridge: schema/example|validate 有 services 时走 services，无 services 时走内置兜底不崩',
    fn: () => withTempBase(async (base) => {
      const { storage } = makeSpyStorage(base)
      const schema = { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] }
      // 1) 内置兜底（services 缺失）
      await withHandlerServer(
        (req, res) => handlePostapiRequest(req, res, { storage, request: createRequestService() }),
        async (httpBase) => {
          const ex = await jsonFetch(httpBase, '/api/schema/example', { method: 'POST', body: { schema } })
          assert.equal(ex.status, 200)
          assert.deepEqual(ex.json.data.example, { name: '' })
          const okValidate = await jsonFetch(httpBase, '/api/schema/validate', { method: 'POST', body: { schema } })
          assert.equal(okValidate.json.data.ok, true)
          const badValidate = await jsonFetch(httpBase, '/api/schema/validate', {
            method: 'POST', body: { schema, data: { age: 1 } },
          })
          assert.equal(badValidate.json.data.ok, false)
          assert.match(badValidate.json.data.message, /必填缺失/)
          const badSchema = await jsonFetch(httpBase, '/api/schema/validate', {
            method: 'POST', body: { schema: { type: 'notatype' } },
          })
          assert.equal(badSchema.json.data.ok, false)
        },
      )
      // 2) services.schema 覆盖内置实现
      const services = {
        schema: {
          example: async (b) => ({ example: { fromService: true, got: b.schema } }),
          validate: async () => ({ ok: true, message: '服务端校验通过' }),
        },
      }
      await withHandlerServer(
        (req, res) => handlePostapiRequest(req, res, { storage, request: createRequestService(), services }),
        async (httpBase) => {
          const ex = await jsonFetch(httpBase, '/api/schema/example', { method: 'POST', body: { schema } })
          assert.deepEqual(ex.json.data, { example: { fromService: true, got: schema } })
          const v = await jsonFetch(httpBase, '/api/schema/validate', { method: 'POST', body: { schema } })
          assert.equal(v.json.data.message, '服务端校验通过')
        },
      )
    }),
  },

  /* ---------------- test runner ---------------- */

  {
    name: 'bridge: test/runCase|runScenario 走 services.runner 并透传 projectId + id',
    fn: () => withTempBase(async (base) => {
      const { storage } = makeSpyStorage(base)
      const fake = makeFakeServices()
      await withHandlerServer(
        (req, res) => handlePostapiRequest(req, res, { storage, request: createRequestService(), services: fake.services }),
        async (httpBase) => {
          const projectId = await seedProject(httpBase, '测试项目')
          const r1 = await jsonFetch(httpBase, '/api/test/runCase', { method: 'POST', body: { projectId, caseId: 'tc_1' } })
          assert.equal(r1.status, 200)
          assert.equal(r1.json.data.stub, 'runner.runCase')
          assert.deepEqual(fake.calls.find((c) => c[0] === 'runner.runCase')[1], [projectId, 'tc_1'])
          const r2 = await jsonFetch(httpBase, '/api/test/runScenario', { method: 'POST', body: { projectId, scenarioId: 'ts_1' } })
          assert.equal(r2.status, 200)
          assert.equal(r2.json.data.stub, 'runner.runScenario')
          assert.deepEqual(fake.calls.find((c) => c[0] === 'runner.runScenario')[1], [projectId, 'ts_1'])
        },
      )
    }),
  },

  /* ---------------- 四类错误码：400 / 404 / 501 / 500 ---------------- */

  {
    name: 'bridge: 缺 projectId 的 storage 扩展路由一律 400 INVALID_ARGUMENT',
    fn: () => withTempBase(async (base) => {
      const { storage } = makeSpyStorage(base)
      await withHandlerServer(
        (req, res) => handlePostapiRequest(req, res, { storage, request: createRequestService() }),
        async (httpBase) => {
          const routes = ['moveNode', 'saveSchema', 'deleteSchema', 'saveEnvironment', 'deleteEnvironment',
            'saveGlobals', 'saveProjectSettings', 'saveFlow', 'saveResponse', 'deleteResponse',
            'appendHistory', 'clearHistory']
          for (const route of routes) {
            const r = await jsonFetch(httpBase, '/api/storage/' + route, { method: 'POST', body: {} })
            assert.equal(r.status, 400, route + ' 缺 projectId 应 400')
            assert.equal(r.json.code, 'INVALID_ARGUMENT', route + ' 错误码应为 INVALID_ARGUMENT')
          }
          for (const route of ['getHistory', 'search']) {
            const r = await jsonFetch(httpBase, '/api/storage/' + route)
            assert.equal(r.status, 400, route + ' 缺 projectId 应 400')
            assert.equal(r.json.code, 'INVALID_ARGUMENT')
          }
          for (const route of ['runCase', 'runScenario']) {
            const r = await jsonFetch(httpBase, '/api/test/' + route, { method: 'POST', body: {} })
            assert.equal(r.status, 400, route + ' 缺 projectId 应 400')
            assert.equal(r.json.code, 'INVALID_ARGUMENT')
          }
        },
      )
    }),
  },
  {
    name: 'bridge: services 缺失时新路由返回 501 NOT_WIRED 而不是崩 handler',
    fn: () => withTempBase(async (base) => {
      const storage = createStorageService(base)
      await withHandlerServer(
        (req, res) => handlePostapiRequest(req, res, { storage, request: createRequestService() }),
        async (httpBase) => {
          const projectId = await seedProject(httpBase, '未接线项目')
          const routes = [
            ['/api/script/run', { code: 'x' }],
            ['/api/mock/start', {}],
            ['/api/mock/stop', {}],
            ['/api/mock/status', {}],
            ['/api/import/openapi', { json: {} }],
            ['/api/import/postman', { json: {} }],
            ['/api/import/har', { json: {} }],
            ['/api/import/curl', { text: 'curl x' }],
            ['/api/export/openapi', { projectId }],
            ['/api/export/postman', { projectId }],
            ['/api/export/har', { projectId }],
            ['/api/export/markdown', { projectId }],
            ['/api/codegen/run', { endpoint: { url: 'http://x' }, lang: 'curl' }],
            ['/api/test/runCase', { projectId, caseId: 'tc_1' }],
            ['/api/test/runScenario', { projectId, scenarioId: 'ts_1' }],
            ['/api/request/preview', { url: 'http://x' }],
            ['/api/ws/open', { url: 'ws://127.0.0.1:1/x' }],
            ['/api/ws/send', { id: 'x', message: 'm' }],
            ['/api/ws/messages', { id: 'x' }],
            ['/api/ws/close', { id: 'x' }],
            ['/api/db/test', { connection: { type: 'sqlite', path: ':memory:' } }],
            ['/api/db/query', { connection: { type: 'sqlite', path: ':memory:' }, sql: 'SELECT 1' }],
            ['/api/db/close', { connection: {} }],
            ['/api/import/apifox', { json: {} }],
            ['/api/import/yapi', { json: {} }],
          ]
          for (const [route, body] of routes) {
            const r = await jsonFetch(httpBase, route, { method: 'POST', body })
            assert.equal(r.status, 501, route + ' 未接线应 501')
            assert.equal(r.json.ok, false)
            assert.equal(r.json.code, 'NOT_WIRED', route + ' 错误码应为 NOT_WIRED')
            assert.ok(typeof r.json.error === 'string' && r.json.error.length > 0)
          }
          // handler 未崩：health 仍可用
          const health = await jsonFetch(httpBase, '/api/health')
          assert.equal(health.status, 200)
        },
      )
    }),
  },
  {
    name: 'bridge: db/test|query|close 真实现（sqlite 内置驱动 + 不支持驱动 400 + 参数校验）',
    fn: () => withTempBase(async (base) => {
      const { createDbService } = await import('../src/host/db.js')
      const fake = makeFakeServices()
      const services = { ...fake.services, db: createDbService() }
      await withHandlerServer(
        (req, res) => handlePostapiRequest(req, res, {
          storage: createStorageService(base), request: createRequestService(), services,
        }),
        async (httpBase) => {
          const conn = { type: 'sqlite', path: ':memory:' }
          // test：内置驱动连通
          const t = await jsonFetch(httpBase, '/api/db/test', { method: 'POST', body: { connection: conn } })
          assert.equal(t.status, 200)
          assert.equal(t.json.data.ok, true)
          assert.equal(t.json.data.driver, 'sqlite')
          // query：SELECT 返回行
          const q = await jsonFetch(httpBase, '/api/db/query', {
            method: 'POST',
            body: { connection: conn, sql: 'SELECT 1 AS one, \'a\' AS s' },
          })
          assert.equal(q.status, 200)
          assert.deepEqual(q.json.data.rows, [{ one: 1, s: 'a' }])
          assert.equal(q.json.data.rowCount, 1)
          // query：写入语句返回 changes
          const w = await jsonFetch(httpBase, '/api/db/query', {
            method: 'POST',
            body: { connection: conn, sql: 'CREATE TABLE t1 (id INTEGER); ' },
          })
          assert.equal(w.status, 200)
          assert.equal(w.json.data.changes, 0)
          // 不支持的驱动：db/test 返回 ok:false + UNSUPPORTED_DRIVER（验证端点不抛）；db/query 抛 400
          // （七驱动已全部内置，这里用未知 type 走同一条 UNSUPPORTED 路径）
          const u = await jsonFetch(httpBase, '/api/db/test', {
            method: 'POST',
            body: { connection: { type: 'db2', host: '127.0.0.1' } },
          })
          assert.equal(u.status, 200)
          assert.equal(u.json.data.ok, false)
          assert.equal(u.json.data.error.code, 'UNSUPPORTED_DRIVER')
          const uq = await jsonFetch(httpBase, '/api/db/query', {
            method: 'POST',
            body: { connection: { type: 'db2', host: '127.0.0.1' }, sql: 'SELECT 1' },
          })
          assert.equal(uq.status, 400)
          assert.equal(uq.json.code, 'UNSUPPORTED_DRIVER')
          // 参数校验：缺 sql → 400
          const bad = await jsonFetch(httpBase, '/api/db/query', { method: 'POST', body: { connection: conn, sql: '' } })
          assert.equal(bad.status, 400)
          assert.equal(bad.json.code, 'INVALID_ARGUMENT')
          // close 幂等
          const c = await jsonFetch(httpBase, '/api/db/close', { method: 'POST', body: { connection: conn } })
          assert.equal(c.status, 200)
          assert.equal(c.json.data.ok, true)
        },
      )
    }),
  },
  {
    name: 'bridge: /ws/* 未接线 501 NOT_WIRED，接线后 open/send/messages/close 全链路（本地 echo）',
    fn: () => withTempBase(async (base) => {
      const { createWsClient } = await import('../src/host/ws-client.js')
      const http = await import('node:http')
      const crypto = await import('node:crypto')
      // 本地 WS echo：握手 + 文本帧回显（测试内自建，不依赖外网）
      const frameReply = (socket, text) => {
        const payload = Buffer.from(text)
        socket.write(Buffer.concat([Buffer.from([0x81, payload.length]), payload]))
      }
      const echoServer = http.createServer(() => {})
      const sockets = new Set()
      echoServer.on('upgrade', (req, socket) => {
        // 升级后的 socket 脱离 server 的连接跟踪，closeAllConnections 收不掉——手动登记，收尾销毁
        sockets.add(socket)
        socket.on('close', () => sockets.delete(socket))
        const accept = crypto.createHash('sha1')
          .update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
          .digest('base64')
        socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n')
        socket.on('data', (buf) => {
          // close 帧原样回一个空 close 帧，完成关闭握手（undici 才会立刻释放连接）
          if (buf[0] === 0x88) {
            socket.write(Buffer.from([0x88, 0x00]))
            return
          }
          if ((buf[0] & 0x0f) === 1 && buf.length > 6) {
            const len = buf[1] & 0x7f
            const mask = buf.slice(2, 6)
            const out = Buffer.from(buf.slice(6, 6 + len))
            for (let i = 0; i < out.length; i += 1) out[i] ^= mask[i % 4]
            frameReply(socket, out.toString('utf8'))
          }
        })
      })
      await new Promise((resolve) => echoServer.listen(0, '127.0.0.1', resolve))
      const echoUrl = 'ws://127.0.0.1:' + echoServer.address().port + '/echo'
      const fake = makeFakeServices()
      const services = { ...fake.services, ws: createWsClient() }
      try {
        await withHandlerServer(
          (req, res) => handlePostapiRequest(req, res, {
            storage: createStorageService(base), request: createRequestService(), services,
          }),
          async (httpBase) => {
            // 未接线场景单独起一个 handler（services 去掉 ws）
            await withHandlerServer(
              (req2, res2) => handlePostapiRequest(req2, res2, {
                storage: createStorageService(base), request: createRequestService(), services: fake.services,
              }),
              async (bareBase) => {
                const r = await jsonFetch(bareBase, '/api/ws/open', { method: 'POST', body: { url: echoUrl } })
                assert.equal(r.status, 501)
                assert.equal(r.json.code, 'NOT_WIRED')
              },
            )
            // 接线全链路
            const opened = await jsonFetch(httpBase, '/api/ws/open', {
              method: 'POST',
              body: { url: echoUrl.replace('ws://', 'http://'), headers: [{ key: 'X-Test', value: '1', enabled: true }] },
            })
            assert.equal(opened.status, 200)
            assert.equal(opened.json.data.status, 'open')
            const id = opened.json.data.id
            assert.ok(id, '应返回连接 id')
            const sent = await jsonFetch(httpBase, '/api/ws/send', { method: 'POST', body: { id, message: 'ping-echo' } })
            assert.equal(sent.status, 200)
            assert.equal(sent.json.data.ok, true)
            await new Promise((resolve) => setTimeout(resolve, 200))
            const logs = await jsonFetch(httpBase, '/api/ws/messages', { method: 'POST', body: { id } })
            assert.equal(logs.status, 200)
            const texts = logs.json.data.messages.filter((m) => m.direction === 'in').map((m) => m.data)
            assert.deepEqual(texts, ['ping-echo'], '应收到 echo 消息')
            const closed = await jsonFetch(httpBase, '/api/ws/close', { method: 'POST', body: { id } })
            assert.equal(closed.status, 200)
            assert.equal(closed.json.data.ok, true)
            // 已关连接再 send：ok:false 带 error（不崩）
            const after = await jsonFetch(httpBase, '/api/ws/send', { method: 'POST', body: { id, message: 'x' } })
            assert.equal(after.status, 200)
            assert.equal(after.json.data.ok, false)
          },
        )
      } finally {
        // 升级 socket + close() 都收不干净的连接统一销毁，事件循环才能排空（进程正常退出）
        for (const s of sockets) s.destroy()
        echoServer.closeAllConnections()
        echoServer.close()
      }
    }),
  },
  {
    name: 'bridge: /import/apifox 与 /import/yapi 路由接线并返回 bundle',
    fn: () => withTempBase(async (base) => {
      const fake = makeFakeServices()
      const services = { ...fake.services, importExport: await import('../src/host/import-export.js') }
      await withHandlerServer(
        (req, res) => handlePostapiRequest(req, res, {
          storage: createStorageService(base), request: createRequestService(), services,
        }),
        async (httpBase) => {
          const ax = await jsonFetch(httpBase, '/api/import/apifox', {
            method: 'POST',
            body: { json: { name: 'P', apiCollection: [{ type: 'api', method: 'GET', path: '/x', name: 'X' }] } },
          })
          assert.equal(ax.status, 200)
          assert.equal(ax.json.data.endpoints.length, 1)
          assert.equal(ax.json.data.endpoints[0].url, '/x')
          const y = await jsonFetch(httpBase, '/api/import/yapi', {
            method: 'POST',
            body: { json: { name: 'Y', list: [{ title: 'T', path: '/y', method: 'GET', req_query: [{ name: 'a' }] }] } },
          })
          assert.equal(y.status, 200)
          assert.equal(y.json.data.endpoints.length, 1)
          assert.equal(y.json.data.endpoints[0].params[0].key, 'a')
          // 未接线：501 NOT_WIRED
          await withHandlerServer(
            (req2, res2) => handlePostapiRequest(req2, res2, {
              storage: createStorageService(base), request: createRequestService(), services: fake.services,
            }),
            async (bareBase) => {
              const r = await jsonFetch(bareBase, '/api/import/apifox', { method: 'POST', body: { json: {} } })
              assert.equal(r.status, 501)
              assert.equal(r.json.code, 'NOT_WIRED')
            },
          )
        },
      )
    }),
  },
  {
    name: 'bridge: 服务方法抛错统一转 500 INTERNAL 且不泄露栈',
    fn: () => withTempBase(async (base) => {
      const services = { sandbox: { runScript: () => { throw new Error('沙箱内部错误') } } }
      await withHandlerServer(
        (req, res) => handlePostapiRequest(req, res, {
          storage: createStorageService(base), request: createRequestService(), services,
        }),
        async (httpBase) => {
          const r = await jsonFetch(httpBase, '/api/script/run', { method: 'POST', body: { code: 'x' } })
          assert.equal(r.status, 500)
          assert.equal(r.json.ok, false)
          assert.equal(r.json.code, 'INTERNAL')
          assert.equal(r.json.error, '沙箱内部错误')
          assert.ok(!String(r.json.error).includes('at '), '错误信息不应带调用栈')
        },
      )
    }),
  },

  /* ---------------- client 桥 ↔ host 路由 集合比对 ---------------- */

  {
    name: 'bridge: client 桥方法名与 host 路由名一一对应（动态捕获 + 读两份源码集合比对）',
    fn: async () => {
      const hostSrc = await fs.readFile(path.join(repoRoot, 'src/host/bridge.js'), 'utf8')
      const clientSrc = await fs.readFile(path.join(repoRoot, 'src/client/shell/registry.js'), 'utf8')

      // 1) host 源码里的路由键集合（去掉 method 前缀，按路径归一）
      const hostPaths = new Set()
      for (const m of hostSrc.matchAll(/'(GET|POST) (\/[A-Za-z0-9_/-]+)'/g)) hostPaths.add(m[2])
      assert.ok(hostPaths.size >= 40, 'host 路由路径数应 >= 40，实际 ' + hostPaths.size)

      // 2) client 桥源码里的桥路径集合（/storage/xxx 与其余命名空间）
      const clientSrcPaths = new Set()
      for (const m of clientSrc.matchAll(/'(\/[a-zA-Z0-9_/-]+)'/g)) {
        const p = m[1]
        if (p === '/' || p.startsWith('//')) continue
        clientSrcPaths.add(p)
      }
      // client 桥的 storage 方法用 post('saveEndpoint', …) / get('getHistory', …) 拼接形态，
      // 源码里没有完整 '/storage/xxx' 字面量：按拼接前缀补回，才能与动态捕获集合比对。
      for (const m of clientSrc.matchAll(/\b(?:post|get)\('([a-zA-Z0-9_]+)'/g)) {
        clientSrcPaths.add('/storage/' + m[1])
      }

      // 3) 动态捕获：拦截 fetch，跑一遍全部 client 桥方法，收集实际请求路径
      const captured = new Set()
      const realFetch = globalThis.fetch
      globalThis.fetch = async (url) => {
        const u = String(url).replace('/dsh-postapi/api', '')
        captured.add(u.split('?')[0])
        return { ok: true, json: async () => ({ ok: true, data: null }) }
      }
      try {
        const storage = createBridgeStorage()
        for (const method of STORAGE_METHODS) {
          assert.equal(typeof storage[method], 'function', 'client 桥 storage.' + method + ' 应为函数')
          await storage[method]('proj_1', { id: 'x' }, 'id2')
        }
        const request = createBridgeRequest()
        for (const method of REQUEST_METHODS) {
          assert.equal(typeof request[method], 'function', 'client 桥 request.' + method + ' 应为函数')
          await request[method]({})
        }
        const svc = createBridgeServices()
        for (const [ns, methods] of Object.entries(SERVICE_METHODS)) {
          for (const method of methods) {
            assert.equal(typeof svc[ns][method], 'function', 'client 桥 ' + ns + '.' + method + ' 应为函数')
            await svc[ns][method]('arg1', 'arg2')
          }
        }
      } finally {
        globalThis.fetch = realFetch
      }

      // 4) 动态捕获 ⊆ host 路由路径
      for (const p of captured) {
        assert.ok(hostPaths.has(p), 'client 桥路径 ' + p + ' 在 host 路由表中不存在')
      }
      // 5) host 独有只允许 /health（health 由宿主/运维直连，不由 client 桥调用）
      const hostOnly = [...hostPaths].filter((p) => !captured.has(p))
      assert.deepEqual(hostOnly.sort(), ['/health'], 'host 独有路由应只有 /health，实际 ' + hostOnly.join(','))
      // 6) 源码集合与动态集合一致（防止源码里写了但方法没接上，或反之）
      for (const p of captured) {
        assert.ok(clientSrcPaths.has(p), 'client 源码中应出现桥路径 ' + p)
      }
    },
  },
  {
    name: 'bridge: installApi 兜底桩覆盖全部桥方法、桥失败不抛错且既有 9 方法名不变',
    fn: async () => {
      const realFetch = globalThis.fetch
      const realWarn = console.warn
      const warnings = []
      console.warn = (...args) => { warnings.push(args.join(' ')) }
      const sandboxWindow = {}
      globalThis.window = sandboxWindow
      globalThis.fetch = async () => { throw new Error('bridge down') }
      try {
        const { installApi } = await import('../src/client/shell/registry.js')
        const api = installApi()
        assert.equal(sandboxWindow.__postapiApi, api, '__postapiApi 应指向挂载后的 api')
        // 既有 9 方法名不变
        for (const m of ['listProjects', 'createProject', 'renameProject', 'deleteProject', 'getProject',
          'saveEndpoint', 'deleteEndpoint', 'saveFolder', 'deleteFolder']) {
          assert.equal(typeof api.storage[m], 'function', 'api.storage.' + m + ' 必须保留')
        }
        // 契约 §3 新增方法全部有桩
        for (const m of STORAGE_METHODS) {
          assert.equal(typeof api.storage[m], 'function', 'api.storage.' + m + ' 应有桥/桩方法')
        }
        for (const m of REQUEST_METHODS) {
          assert.equal(typeof api.request[m], 'function', 'api.request.' + m + ' 应有桥/桩方法')
        }
        for (const [ns, methods] of Object.entries(SERVICE_METHODS)) {
          assert.ok(api[ns], 'api.' + ns + ' 命名空间应存在')
          for (const method of methods) {
            assert.equal(typeof api[ns][method], 'function', 'api.' + ns + '.' + method + ' 应有桥/桩方法')
          }
        }
        // 桥全挂时兜底桩不抛错，返回最小可用结构
        const list = await api.storage.listProjects()
        assert.ok(Array.isArray(list), 'storage.listProjects 兜底应返回数组')
        const created = await api.storage.createProject('桩项目')
        assert.match(created.id, /^proj_/)
        const savedSchema = await api.storage.saveSchema(created.id, { name: 'S' })
        assert.match(savedSchema.id, /^sch_/)
        const history = await api.storage.getHistory(created.id)
        assert.deepEqual(history, { entries: [] })
        const search = await api.storage.search(created.id, 'x')
        assert.deepEqual(search, { endpoints: [], schemas: [], folders: [] })
        const settings = await api.storage.saveProjectSettings(created.id, { mockPort: 4011 })
        assert.equal(settings.mockPort, 4011)
        const cleared = await api.storage.clearHistory(created.id)
        assert.equal(typeof cleared.cleared, 'number')
        const script = await api.script.run('x')
        assert.equal(script.ok, false)
        assert.ok(Array.isArray(script.tests))
        const mockStatus = await api.mock.status()
        assert.equal(mockStatus.running, false)
        const validate = await api.schema.validate({ schema: {} })
        assert.equal(typeof validate.ok, 'boolean')
        const example = await api.schema.example({ schema: {} })
        assert.ok('example' in example)
        const imported = await api.import.openapi({})
        assert.deepEqual(imported, { folders: [], endpoints: [], schemas: [] })
        const exported = await api.export.openapi({})
        assert.equal(typeof exported, 'string')
        const code = await api.codegen.run({})
        assert.equal(typeof code, 'string')
        const runCase = await api.test.runCase('proj_1', 'tc_1')
        assert.equal(runCase.caseId, 'tc_1')
        assert.equal(runCase.passed, false)
        const dbTest = await api.db.test({})
        assert.equal(dbTest.ok, false)
        assert.ok(dbTest.error && dbTest.error.message, 'db 桩应带 error.message')
        const wsOpen = await api.ws.open({ url: 'ws://127.0.0.1:1/x' })
        assert.equal(wsOpen.status, 'unavailable')
        assert.ok(wsOpen.error && wsOpen.error.message, 'ws 桩应带 error.message')
        // 降级只 warn 一次
        assert.equal(warnings.filter((w) => w.includes('桥不可达')).length, 1, '降级提示应只出现一次')
        // 桩 request：fetch 抛错时返回 error 结构而非抛出
        const sent = await api.request.send({ url: 'http://127.0.0.1:1/x' })
        assert.equal(sent.status, 0)
        assert.ok(sent.error)
        // createStubServices 直接可用的兜底形状
        const stub = createStubServices()
        assert.equal((await stub.mock.status()).running, false)
      } finally {
        globalThis.fetch = realFetch
        console.warn = realWarn
        delete globalThis.window
      }
    },
  },
]
