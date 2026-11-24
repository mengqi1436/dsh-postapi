/**
 * agent-tool 端到端测试：用临时目录的真实 createStorageService 跑，覆盖 11 个 action。
 * node tests/run.js 直接执行，无 vitest 依赖。
 */
import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createStorageService } from '../src/host/storage.js'
import * as importExport from '../src/host/import-export.js'
import { createAgentTool, parseOpenApiText, parseYamlSubset } from '../src/host/agent-tool.js'

/** 每个用例独立临时基路径 + 真实 storage + 工具实例；可选注入 request 桩。 */
async function withTool(fn, extraDeps) {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'postapi-agenttool-'))
  try {
    const storage = createStorageService(base)
    const tool = createAgentTool({ storage, importExport, ...(extraDeps || {}) })
    return await fn(tool, storage, base)
  } finally {
    await fs.rm(base, { recursive: true, force: true })
  }
}

/** 断言成功结果并解析 text。 */
function payloadOf(res) {
  assert.equal(res.isError, undefined, '不应是错误结果：' + res.text)
  assert.equal(typeof res.text, 'string')
  const body = JSON.parse(res.text)
  assert.equal(body.ok, true)
  return body
}

/** 断言失败结果：isError 真、text 是 { ok:false, error }、且 execute 没抛。 */
function errorOf(res, pattern) {
  assert.equal(res.isError, true, '应为错误结果')
  const body = JSON.parse(res.text)
  assert.equal(body.ok, false)
  assert.equal(typeof body.error, 'string')
  if (pattern) assert.match(body.error, pattern)
  return body
}

/** 最小 OpenAPI 3.0 文档（JSON 文本形态）。 */
const OPENAPI_MIN = JSON.stringify({
  openapi: '3.0.0',
  info: { title: 'Demo', version: '1.0.0' },
  servers: [{ url: 'https://api.demo.test' }],
  tags: [{ name: '订单' }],
  paths: {
    '/orders': {
      get: {
        summary: '查询订单列表',
        tags: ['订单'],
        parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' } }],
        responses: { 200: { description: 'ok', content: { 'application/json': { schema: { type: 'object' } } } } },
      },
      post: {
        summary: '创建订单',
        tags: ['订单'],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 201: { description: 'created' } },
      },
    },
    '/health': { get: { summary: '健康检查', responses: { 200: { description: 'ok' } } } },
  },
  components: {
    schemas: { Order: { type: 'object', description: '订单模型', properties: { id: { type: 'string' } } } },
  },
})

export const tests = [
  {
    name: 'agent-tool: create_project → create_endpoint → get_endpoint 读回逐字段一致',
    fn: () => withTool(async (tool) => {
      const created = payloadOf(await tool.execute({ action: 'create_project', name: '工具项目' }))
      assert.match(created.id, /^proj_[0-9a-z]+$/)
      assert.equal(created.name, '工具项目')

      const ep = payloadOf(await tool.execute({
        action: 'create_endpoint',
        project_id: created.id,
        endpoint: {
          name: '查询订单',
          method: 'POST',
          url: 'https://api.demo.test/orders',
          params: [{ key: 'page', value: '1', enabled: true, description: '', required: false, type: 'integer' }],
          headers: [{ key: 'X-Token', value: 't', enabled: true, description: '', required: false, type: 'string' }],
          body: { type: 'json', content: '{"a":1}' },
          auth: { type: 'bearer', token: 'T' },
          tags: ['订单'],
          status: 'released',
        },
      })).endpoint
      assert.match(ep.id, /^ep_[0-9a-z]+$/)
      assert.equal(ep.order, 0)
      assert.ok(!Number.isNaN(Date.parse(ep.createdAt)))
      assert.ok(!Number.isNaN(Date.parse(ep.updatedAt)))
      // 未传字段补契约默认值
      assert.equal(ep.protocol, 'http')
      assert.deepEqual(ep.cookies, [])
      assert.deepEqual(ep.responses, [])
      assert.deepEqual(ep.preProcessors, [])
      assert.deepEqual(ep.postProcessors, [])
      assert.deepEqual(ep.mock, { enabled: false, delayMs: 0, rules: [] })

      const got = payloadOf(await tool.execute({
        action: 'get_endpoint',
        project_id: created.id,
        endpoint_id: ep.id,
      })).endpoint
      assert.deepEqual(got, ep, 'get_endpoint 读回应与落盘值逐字段一致')
    }),
  },
  {
    name: 'agent-tool: update_endpoint 保留 createdAt，改 name/method/url 生效且未传字段不丢',
    fn: () => withTool(async (tool) => {
      const projectId = payloadOf(await tool.execute({ action: 'create_project', name: '更新项目' })).id
      const ep = payloadOf(await tool.execute({
        action: 'create_endpoint',
        project_id: projectId,
        endpoint: { name: '旧名', method: 'GET', url: 'http://a/1', tags: ['keep'], description: '原描述' },
      })).endpoint

      await new Promise((r) => setTimeout(r, 5))
      const updated = payloadOf(await tool.execute({
        action: 'update_endpoint',
        project_id: projectId,
        endpoint_id: ep.id,
        patch: { name: '新名', method: 'PUT', url: 'http://a/2' },
      })).endpoint
      assert.equal(updated.id, ep.id)
      assert.equal(updated.createdAt, ep.createdAt, 'createdAt 必须保留')
      assert.ok(Date.parse(updated.updatedAt) >= Date.parse(ep.updatedAt))
      assert.equal(updated.name, '新名')
      assert.equal(updated.method, 'PUT')
      assert.equal(updated.url, 'http://a/2')
      assert.deepEqual(updated.tags, ['keep'], 'patch 未传的 tags 应保留')
      assert.equal(updated.description, '原描述', 'patch 未传的 description 应保留')

      // 落盘只有一条，且读回等于返回值
      const list = payloadOf(await tool.execute({ action: 'list_endpoints', project_id: projectId }))
      assert.equal(list.total, 1)
      const got = payloadOf(await tool.execute({
        action: 'get_endpoint', project_id: projectId, endpoint_id: ep.id,
      })).endpoint
      assert.deepEqual(got, updated)
    }),
  },
  {
    name: 'agent-tool: list_endpoints 的 keyword 与 folder_id 过滤生效，返回概要字段',
    fn: () => withTool(async (tool) => {
      const projectId = payloadOf(await tool.execute({ action: 'create_project', name: '列表项目' })).id
      const folder = payloadOf(await tool.execute({
        action: 'create_folder', project_id: projectId, name: '订单模块',
      })).folder
      assert.match(folder.id, /^fld_[0-9a-z]+$/)
      assert.equal(folder.parentId, null)

      await tool.execute({
        action: 'create_endpoint', project_id: projectId,
        endpoint: { name: '查询订单', method: 'GET', url: 'http://a/orders', folderId: folder.id, tags: ['x'] },
      })
      await tool.execute({
        action: 'create_endpoint', project_id: projectId,
        endpoint: { name: '创建订单', method: 'POST', url: 'http://a/orders' },
      })
      await tool.execute({
        action: 'create_endpoint', project_id: projectId,
        endpoint: { name: '健康检查', method: 'GET', url: 'http://a/health' },
      })

      const all = payloadOf(await tool.execute({ action: 'list_endpoints', project_id: projectId }))
      assert.equal(all.total, 3)
      // 概要不带 body/auth/responses（防上下文爆炸）
      const row = all.endpoints[0]
      assert.deepEqual(Object.keys(row).sort(), ['folderId', 'id', 'method', 'name', 'status', 'tags', 'url'])

      const byKeyword = payloadOf(await tool.execute({
        action: 'list_endpoints', project_id: projectId, keyword: '订单',
      }))
      assert.equal(byKeyword.total, 2)
      assert.deepEqual(byKeyword.endpoints.map((e) => e.name), ['查询订单', '创建订单'])

      const byUrl = payloadOf(await tool.execute({
        action: 'list_endpoints', project_id: projectId, keyword: 'HEALTH',
      }))
      assert.equal(byUrl.total, 1, 'keyword 应大小写不敏感并匹配 url')
      assert.equal(byUrl.endpoints[0].name, '健康检查')

      const byFolder = payloadOf(await tool.execute({
        action: 'list_endpoints', project_id: projectId, folder_id: folder.id,
      }))
      assert.equal(byFolder.total, 1)
      assert.equal(byFolder.endpoints[0].id, all.endpoints.find((e) => e.folderId === folder.id).id)

      const noHit = payloadOf(await tool.execute({
        action: 'list_endpoints', project_id: projectId, keyword: '不存在的关键字',
      }))
      assert.equal(noHit.total, 0)
    }),
  },
  {
    name: 'agent-tool: delete_endpoint 后 list 里消失，其余接口与 index.json 同步不受影响',
    fn: () => withTool(async (tool, storage, base) => {
      const projectId = payloadOf(await tool.execute({ action: 'create_project', name: '删除项目' })).id
      const a = payloadOf(await tool.execute({
        action: 'create_endpoint', project_id: projectId, endpoint: { name: 'A', url: 'http://a/a' },
      })).endpoint
      const b = payloadOf(await tool.execute({
        action: 'create_endpoint', project_id: projectId, endpoint: { name: 'B', url: 'http://a/b' },
      })).endpoint

      const del = payloadOf(await tool.execute({
        action: 'delete_endpoint', project_id: projectId, endpoint_id: a.id,
      }))
      assert.equal(del.id, a.id)

      const list = payloadOf(await tool.execute({ action: 'list_endpoints', project_id: projectId }))
      assert.deepEqual(list.endpoints.map((e) => e.id), [b.id])
      // 落盘介质：project.json 里 A 消失、B 完整保留
      const raw = JSON.parse(await fs.readFile(path.join(base, projectId, 'project.json'), 'utf8'))
      assert.deepEqual(raw.endpoints.map((e) => e.id), [b.id])
      assert.equal(raw.endpoints[0].url, 'http://a/b')
      // index.json 的 updatedAt 跟随落盘（client 项目列表读源）
      const index = JSON.parse(await fs.readFile(path.join(base, 'index.json'), 'utf8'))
      assert.equal(index.projects[0].updatedAt, raw.updatedAt)
    }),
  },
  {
    name: 'agent-tool: 参数错误返回 isError 且不抛（缺 action/project_id/endpoint.name/patch 类型错）',
    fn: () => withTool(async (tool) => {
      errorOf(await tool.execute({}), /action/)
      errorOf(await tool.execute({ action: 'no_such_action' }), /未知 action/)
      errorOf(await tool.execute(null), /action/)
      errorOf(await tool.execute({ action: 'get_project' }), /project_id/)
      errorOf(await tool.execute({ action: 'get_project', project_id: '' }), /project_id/)
      errorOf(await tool.execute({ action: 'create_project', name: '   ' }), /name/)
      errorOf(await tool.execute({ action: 'list_endpoints', project_id: 'proj_missing' }), /proj_missing/)
      errorOf(await tool.execute({ action: 'get_endpoint', project_id: 'proj_missing', endpoint_id: 'ep_x' }), /proj_missing/)

      const projectId = payloadOf(await tool.execute({ action: 'create_project', name: '校验项目' })).id
      errorOf(await tool.execute({ action: 'create_endpoint', project_id: projectId }), /endpoint/)
      errorOf(await tool.execute({ action: 'create_endpoint', project_id: projectId, endpoint: {} }), /endpoint\.name/)
      errorOf(await tool.execute({ action: 'create_endpoint', project_id: projectId, endpoint: [] }), /endpoint/)
      errorOf(await tool.execute({
        action: 'update_endpoint', project_id: projectId, endpoint_id: 'ep_missing', patch: {},
      }), /ep_missing/)
      errorOf(await tool.execute({
        action: 'update_endpoint', project_id: projectId, endpoint_id: 'ep_x', patch: 'not-an-object',
      }), /patch/)
      errorOf(await tool.execute({
        action: 'delete_endpoint', project_id: projectId, endpoint_id: 'ep_missing',
      }), /ep_missing/)
      errorOf(await tool.execute({ action: 'create_folder', project_id: projectId }), /name/)
      errorOf(await tool.execute({
        action: 'create_folder', project_id: projectId, name: '子目录', parent_id: 'fld_missing',
      }), /父目录不存在/)
      errorOf(await tool.execute({ action: 'import_openapi', project_id: projectId, text: '' }), /text/)
    }),
  },
  {
    name: 'agent-tool: import_openapi 落盘 endpoints > 0 且能被 get_endpoint 读回',
    fn: () => withTool(async (tool) => {
      const projectId = payloadOf(await tool.execute({ action: 'create_project', name: '导入项目' })).id
      const res = payloadOf(await tool.execute({
        action: 'import_openapi', project_id: projectId, text: OPENAPI_MIN,
      }))
      assert.ok(res.endpoints > 0, '应导入至少一条接口')
      assert.equal(res.endpoints, 3)
      assert.equal(res.folders, 1) // tags: 订单
      assert.equal(res.schemas, 1) // components.schemas.Order

      const list = payloadOf(await tool.execute({ action: 'list_endpoints', project_id: projectId }))
      assert.equal(list.total, 3)
      const one = list.endpoints.find((e) => e.name === '查询订单列表')
      assert.ok(one, '导入的接口应在列表里')
      assert.equal(one.method, 'GET')
      assert.equal(one.url, 'https://api.demo.test/orders')

      const got = payloadOf(await tool.execute({
        action: 'get_endpoint', project_id: projectId, endpoint_id: one.id,
      })).endpoint
      assert.equal(got.name, '查询订单列表')
      assert.ok(got.params.some((p) => p.key === 'page'), 'query 参数应落盘')
      assert.ok(got.folderId, 'tag 目录应挂上')
      assert.ok(!Number.isNaN(Date.parse(got.createdAt)))

      // YAML 文本同样能导入（parseYamlSubset 子集）
      const yaml = [
        'openapi: 3.0.0',
        'info:',
        '  title: Y',
        '  version: 1.0.0',
        'paths:',
        '  /ping:',
        '    get:',
        '      summary: 心跳',
        '      responses:',
        "        '200':",
        '          description: ok',
      ].join('\n')
      const res2 = payloadOf(await tool.execute({
        action: 'import_openapi', project_id: projectId, text: yaml,
      }))
      assert.equal(res2.endpoints, 1)
      const list2 = payloadOf(await tool.execute({ action: 'list_endpoints', project_id: projectId }))
      assert.equal(list2.total, 4)
      assert.ok(list2.endpoints.some((e) => e.name === '心跳'))
    }),
  },
  {
    name: 'agent-tool: send_request 在 request 缺省时返回 not wired 错误而不是抛错',
    fn: () => withTool(async (tool) => {
      const projectId = payloadOf(await tool.execute({ action: 'create_project', name: '请求项目' })).id
      const ep = payloadOf(await tool.execute({
        action: 'create_endpoint', project_id: projectId,
        endpoint: { name: '待发', method: 'GET', url: 'http://127.0.0.1:1/x' },
      })).endpoint

      errorOf(await tool.execute({
        action: 'send_request', project_id: projectId, endpoint_id: ep.id,
      }), /not wired|未接线/)
      // 直接给 request 对象同样走未接线分支
      errorOf(await tool.execute({
        action: 'send_request', project_id: projectId, request: { method: 'GET', url: 'http://127.0.0.1:1/x' },
      }), /未接线/)
    }),
  },
  {
    name: 'agent-tool: send_request 接线后按 endpoint 发请求，body 截断到 4000 字符',
    fn: () => withTool(async (tool, storage, base) => {
      const projectId = payloadOf(await tool.execute({ action: 'create_project', name: '真发项目' })).id
      const ep = payloadOf(await tool.execute({
        action: 'create_endpoint', project_id: projectId,
        endpoint: { name: '发请求', method: 'POST', url: '/orders', params: [{ key: 'q', value: '1', enabled: true }] },
      })).endpoint
      const tool2 = createAgentTool({
        storage,
        importExport,
        request: {
          async send(options) {
            return {
              status: 201,
              statusText: 'Created',
              timeMs: 7,
              bodySize: 9000,
              body: 'x'.repeat(9000),
              headers: {},
              tests: [{ name: 'status', passed: true }],
              sent: options,
            }
          },
        },
      })
      const body = payloadOf(await tool2.execute({
        action: 'send_request', project_id: projectId, endpoint_id: ep.id,
      }))
      assert.equal(body.status, 201)
      assert.equal(body.timeMs, 7)
      assert.equal(body.bodySize, 9000)
      assert.equal(body.body.length, 4000, 'body 必须截断到 4000 字符')
      assert.equal(body.truncated, true)
      assert.equal(body.tests.length, 1)
    }),
  },
  {
    name: 'agent-tool: list_projects / get_project 返回摘要且不含 endpoint body',
    fn: () => withTool(async (tool) => {
      const projectId = payloadOf(await tool.execute({ action: 'create_project', name: '摘要项目' })).id
      await tool.execute({ action: 'create_folder', project_id: projectId, name: '目录一' })
      await tool.execute({
        action: 'create_endpoint', project_id: projectId,
        endpoint: { name: '有 body', url: 'http://a/b', body: { type: 'json', content: '{"secret":"BIG"}' } },
      })

      const list = payloadOf(await tool.execute({ action: 'list_projects' }))
      assert.equal(list.projects.length, 1)
      assert.deepEqual(Object.keys(list.projects[0]).sort(), ['endpointCount', 'id', 'name', 'updatedAt'])
      assert.equal(list.projects[0].endpointCount, 1)
      assert.equal(list.projects[0].id, projectId)

      const summaryRes = await tool.execute({ action: 'get_project', project_id: projectId })
      const summary = payloadOf(summaryRes)
      const p = summary.project
      assert.equal(p.id, projectId)
      assert.equal(p.counts.endpoints, 1)
      assert.equal(p.counts.folders, 1)
      assert.equal(p.folders[0].name, '目录一')
      // 摘要里不能出现 endpoint 的 body（防上下文爆炸）
      assert.ok(!summaryRes.text.includes('BIG'), 'get_project 不得返回 endpoint body 内容')
      assert.deepEqual(Object.keys(p.endpoints[0]).sort(), ['folderId', 'id', 'method', 'name', 'status', 'tags', 'url'])
    }),
  },
  {
    name: 'agent-tool: YAML 子集解析覆盖映射/序列/块标量与引号标量',
    fn: async () => {
      const doc = parseYamlSubset([
        'a: 1',
        'b: "带: 冒号"',
        "c: 'x'",
        'd:',
        '  - 甲',
        '  - 乙',
        'e:',
        '  f: true',
        'g: |',
        '  第一行',
        '  第二行',
      ].join('\n'))
      assert.deepEqual(doc, {
        a: 1,
        b: '带: 冒号',
        c: 'x',
        d: ['甲', '乙'],
        e: { f: true },
        g: '第一行\n第二行',
      })
      assert.deepEqual(parseYamlSubset('- k: v\n- k2: v2\n'), [{ k: 'v' }, { k2: 'v2' }])
      // JSON 与 YAML 双通道
      assert.deepEqual(parseOpenApiText('{"openapi":"3.0.0"}'), { openapi: '3.0.0' })
      assert.deepEqual(parseOpenApiText('openapi: 3.0.0\n'), { openapi: '3.0.0' })
      assert.throws(() => parseOpenApiText('   '), /text 为空/)
      assert.throws(() => parseYamlSubset(''), /YAML 内容为空/)
    },
  },
]
