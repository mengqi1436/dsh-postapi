/**
 * host-data 测试：schema v2 / 14 个新方法 / 导入导出 / 代码生成。
 * node tests/run.js 直接执行（runner 约定 export const tests = [{ name, fn }]），无外部依赖。
 */
import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createStorageService, SCHEMA_VERSION, DEFAULT_SETTINGS } from '../src/host/storage.js'
import {
  importOpenApi, importPostman, importHar, importCurl,
  exportOpenApi, exportPostman, exportHar, exportMarkdown, joinUrl,
} from '../src/host/import-export.js'
import { generateCode, listLanguages } from '../src/host/codegen.js'

/** 每个用例独立的临时基路径，结束自动清理。 */
async function withTempStorage(fn) {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'postapi-hostdata-'))
  try {
    return await fn(createStorageService(base), base)
  } finally {
    await fs.rm(base, { recursive: true, force: true })
  }
}

/* ── 固定样本 ─────────────────────────────────────────────────────────── */

const OPENAPI_SAMPLE = {
  openapi: '3.0.3',
  info: { title: '示例 API', version: '1.0.0' },
  servers: [{ url: 'https://api.example.com/v1' }],
  tags: [{ name: '用户' }, { name: '订单' }],
  paths: {
    '/users/{id}': {
      get: {
        summary: '查询用户',
        description: '按 id 查询用户详情',
        tags: ['用户'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: '用户 id' },
          { name: 'verbose', in: 'query', schema: { type: 'boolean' }, example: false },
          { name: 'X-Trace', in: 'header', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: '成功',
            content: { 'application/json': { example: { id: 'u_1', name: '张三' } } },
          },
          404: { description: '不存在' },
        },
      },
    },
    '/orders': {
      post: {
        summary: '创建订单',
        tags: ['订单'],
        requestBody: {
          content: { 'application/json': { example: { sku: 'A1', count: 2 } } },
        },
        responses: { 201: { description: '已创建', content: { 'application/json': { example: { id: 'o_1' } } } } },
      },
    },
  },
  components: {
    schemas: {
      User: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } }, description: '用户模型' },
    },
  },
}

const POSTMAN_SAMPLE = {
  info: { name: 'Postman 示例', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
  item: [
    {
      name: '用户模块',
      item: [
        {
          name: '登录',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }, { key: 'X-Skip', value: '1', disabled: true }],
            url: {
              raw: 'https://api.example.com/login?from=web',
              query: [{ key: 'from', value: 'web' }],
            },
            body: { mode: 'raw', raw: '{"user":"a","pwd":"b"}', options: { raw: { language: 'json' } } },
            auth: { type: 'bearer', bearer: [{ key: 'token', value: 'tk_1', type: 'string' }] },
            description: '账号密码登录',
          },
          response: [{ name: '成功', code: 200, header: [{ key: 'Content-Type', value: 'application/json' }], body: '{"token":"tk_2"}' }],
        },
      ],
    },
    {
      name: '健康检查',
      request: { method: 'GET', header: [], url: 'https://api.example.com/health' },
    },
  ],
}

/** 多级嵌套 Postman 样本：验证标准层级（collection → 目录 → 子目录 → 接口）。 */
const NESTED_SAMPLE = {
  info: { name: '商城 API', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
  item: [
    {
      name: '用户',
      item: [
        {
          name: '鉴权',
          item: [
            { name: '登录', request: { method: 'POST', url: 'https://api.example.com/login' } },
            { name: '登出', request: { method: 'POST', url: 'https://api.example.com/logout' } },
          ],
        },
        { name: '资料', request: { method: 'GET', url: 'https://api.example.com/profile' } },
      ],
    },
    {
      name: '订单',
      item: [{ name: '列表', request: { method: 'GET', url: 'https://api.example.com/orders' } }],
    },
  ],
}

const HAR_SAMPLE = {
  log: {
    version: '1.2',
    entries: [
      {
        request: {
          method: 'POST',
          url: 'https://api.example.com/v1/login?from=web',
          headers: [{ name: 'Content-Type', value: 'application/json' }, { name: ':authority', value: 'api.example.com' }],
          queryString: [{ name: 'from', value: 'web' }],
          postData: { mimeType: 'application/json', text: '{"user":"a"}' },
        },
        response: {
          status: 200,
          statusText: 'OK',
          headers: [{ name: 'Content-Type', value: 'application/json' }],
          content: { mimeType: 'application/json', text: '{"token":"tk"}' },
        },
      },
      // 同 method+path 的第二条应被去重
      { request: { method: 'POST', url: 'https://api.example.com/v1/login?from=mobile' }, response: { status: 401 } },
      { request: { method: 'GET', url: 'https://api.example.com/v1/users' }, response: { status: 200, content: { mimeType: 'application/json', text: '[]' } } },
    ],
  },
}

const CURL_SAMPLE = `curl 'https://api.example.com/v1/users?page=2&size=20' \\
  -X POST \\
  -H 'Content-Type: application/json' \\
  -H 'X-Token: abc' \\
  -u 'alice:secret' \\
  --data-raw '{"name":"张三","age":18}'`

/** 造一个带完整 v2 内容的项目，供导出/代码生成断言复用。 */
async function seedProject(storage) {
  const p = await storage.createProject('示例项目')
  await storage.saveProjectSettings(p.id, { historyLimit: 3 })
  const folder = await storage.saveFolder(p.id, { name: '用户模块' })
  const ep = await storage.saveEndpoint(p.id, {
    name: '查询用户',
    folderId: folder.id,
    method: 'GET',
    url: '/users/{id}',
    params: [{ key: 'verbose', value: 'false', enabled: true, description: '详情', required: false, type: 'boolean' }],
    pathParams: [{ key: 'id', value: 'u_1', enabled: true, description: '用户 id', required: true, type: 'string' }],
    headers: [{ key: 'X-Token', value: 'tk', enabled: true, description: '', required: false, type: 'string' }],
    body: { type: 'json', content: '{"a":1}', schema: null, examples: [] },
    auth: { type: 'bearer', token: 'tk_bearer', username: '', password: '', key: '', value: '', addTo: 'header' },
    description: '按 id 查询',
    responses: [],
  })
  await storage.saveResponse(p.id, ep.id, {
    name: '成功', code: 200, contentType: 'application/json', body: '{"id":"u_1"}', isDefault: true,
  })
  await storage.saveSchema(p.id, {
    name: 'User', jsonSchema: { type: 'object', properties: { id: { type: 'string' } } }, description: '用户模型',
  })
  await storage.saveEnvironment(p.id, {
    name: '开发环境', baseUrl: 'https://api.example.com/v1', isDefault: true,
    variables: [{ key: 'token', value: 'tk_env', enabled: true, secret: false }],
  })
  const project = await storage.getProject(p.id)
  return { project, projectId: p.id, folderId: folder.id, endpointId: ep.id }
}

export const tests = [
  /* ── schema v2 与 v1 升级 ─────────────────────────────────────────── */

  {
    name: 'host-data: 新建项目即 v2（schemaVersion=2 + 全实体位 + settings 默认）',
    fn: () => withTempStorage(async (storage, base) => {
      const p = await storage.createProject('v2 项目')
      assert.equal(p.schemaVersion, SCHEMA_VERSION)
      assert.equal(p.schemaVersion, 2)
      assert.deepEqual(p.schemas, [])
      assert.deepEqual(p.environments, [])
      assert.deepEqual(p.globals, { variables: [] })
      assert.deepEqual(p.mocks, [])
      assert.deepEqual(p.testCases, [])
      assert.deepEqual(p.testScenarios, [])
      assert.deepEqual(p.settings, DEFAULT_SETTINGS)
      // index.json 带 version:2
      const index = JSON.parse(await fs.readFile(path.join(base, 'index.json'), 'utf8'))
      assert.equal(index.version, 2)
      assert.equal(index.projects.length, 1)
    }),
  },
  {
    name: 'host-data: v1 index.json（无 version）读入自动补 version:2 且保留 projects',
    fn: async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), 'postapi-hostdata-'))
      try {
        await fs.writeFile(path.join(base, 'index.json'), JSON.stringify({
          projects: [{ id: 'proj_v1', name: '旧项目', updatedAt: '2026-01-01T00:00:00.000Z' }],
        }))
        const storage = createStorageService(base)
        const list = await storage.listProjects()
        assert.equal(list.length, 1)
        assert.equal(list[0].id, 'proj_v1')
        // 升级已落盘
        await new Promise((r) => setTimeout(r, 20))
        const raw = JSON.parse(await fs.readFile(path.join(base, 'index.json'), 'utf8'))
        assert.equal(raw.version, 2)
        assert.equal(raw.projects[0].name, '旧项目')
      } finally {
        await fs.rm(base, { recursive: true, force: true })
      }
    },
  },
  {
    name: 'host-data: v1 project.json（无 schemaVersion/endpoint 新字段）读入自动升级 v2 并落盘',
    fn: async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), 'postapi-hostdata-'))
      try {
        const v1 = {
          id: 'proj_v1', name: '旧项目', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
          folders: [{ id: 'fld_a', name: '旧目录', parentId: null }],
          endpoints: [{ id: 'ep_a', name: '旧接口', folderId: null, method: 'GET', url: 'http://x/y', params: [], pathParams: [], headers: [], body: { type: 'none', content: '' }, auth: { type: 'none' }, description: '' }],
          flow: { name: '', steps: [] },
        }
        await fs.mkdir(path.join(base, 'proj_v1'), { recursive: true })
        await fs.writeFile(path.join(base, 'proj_v1', 'project.json'), JSON.stringify(v1))
        await fs.writeFile(path.join(base, 'index.json'), JSON.stringify({ version: 2, projects: [{ id: 'proj_v1', name: '旧项目', updatedAt: v1.updatedAt }] }))

        const storage = createStorageService(base)
        const got = await storage.getProject('proj_v1')
        assert.equal(got.schemaVersion, 2)
        assert.deepEqual(got.schemas, [])
        assert.deepEqual(got.environments, [])
        assert.deepEqual(got.settings, DEFAULT_SETTINGS)
        // endpoint 补齐 v2 字段
        const ep = got.endpoints[0]
        assert.equal(ep.protocol, 'http')
        assert.deepEqual(ep.responses, [])
        assert.deepEqual(ep.cookies, [])
        assert.deepEqual(ep.tags, [])
        assert.equal(ep.status, 'developing')
        assert.equal(ep.auth.addTo, 'header')
        assert.deepEqual(ep.mock, { enabled: false, delayMs: 0, rules: [] })
        assert.deepEqual(ep.body.examples, [])
        // 升级结果已落盘
        await new Promise((r) => setTimeout(r, 20))
        const raw = JSON.parse(await fs.readFile(path.join(base, 'proj_v1', 'project.json'), 'utf8'))
        assert.equal(raw.schemaVersion, 2)
        assert.equal(raw.endpoints[0].protocol, 'http')
      } finally {
        await fs.rm(base, { recursive: true, force: true })
      }
    },
  },
  {
    name: 'host-data: 既有 9 方法签名与四条机制保持（原子写无 .tmp / 并发不丢 / 损坏隔离 / .trash）',
    fn: () => withTempStorage(async (storage, base) => {
      const p = await storage.createProject('机制项目')
      // 并发写 6 条
      const eps = await Promise.all(Array.from({ length: 6 }, (_, i) => storage.saveEndpoint(p.id, { name: '并发 ' + i })))
      assert.equal(new Set(eps.map((e) => e.id)).size, 6)
      // 原子写无残留
      assert.ok(!(await fs.readdir(path.join(base, p.id))).some((n) => n.endsWith('.tmp')))
      // 损坏隔离
      await fs.writeFile(path.join(base, p.id, 'project.json'), '{ bad json')
      const recovered = await storage.getProject(p.id)
      assert.equal(recovered.name, '机制项目')
      assert.equal(recovered.schemaVersion, 2)
      assert.ok((await fs.readdir(path.join(base, p.id))).some((n) => n.startsWith('project.json.corrupt-')))
      // .trash
      await storage.deleteProject(p.id)
      const trash = await fs.readdir(path.join(base, '.trash'))
      assert.ok(trash[0].startsWith(p.id + '-'))
    }),
  },

  /* ── 新方法 ───────────────────────────────────────────────────────── */

  {
    name: 'host-data: moveNode 移动 folder/endpoint 并改 order，未知 kind/缺 id 抛错',
    fn: () => withTempStorage(async (storage) => {
      const p = await storage.createProject('移动项目')
      const f1 = await storage.saveFolder(p.id, { name: 'A' })
      const f2 = await storage.saveFolder(p.id, { name: 'B' })
      const ep = await storage.saveEndpoint(p.id, { name: '接口' })

      const movedFolder = await storage.moveNode(p.id, { kind: 'folder', id: f2.id, parentId: f1.id, order: 5 })
      assert.equal(movedFolder.parentId, f1.id)
      assert.equal(movedFolder.order, 5)
      const movedEp = await storage.moveNode(p.id, { kind: 'endpoint', id: ep.id, parentId: f2.id, order: 2 })
      assert.equal(movedEp.folderId, f2.id)
      assert.equal(movedEp.order, 2)
      // 落盘
      const got = await storage.getProject(p.id)
      assert.equal(got.folders.find((f) => f.id === f2.id).parentId, f1.id)
      assert.equal(got.endpoints[0].folderId, f2.id)

      // 移到根：parentId=null
      const back = await storage.moveNode(p.id, { kind: 'endpoint', id: ep.id, parentId: null })
      assert.equal(back.folderId, null)

      // 边界：缺 id / 未知 kind 抛错；目标不存在幂等返回（桥侧通用透传不 500）
      await assert.rejects(() => storage.moveNode(p.id, { kind: 'folder' }), /id is required/)
      await assert.rejects(() => storage.moveNode(p.id, { kind: 'nope', id: f1.id }), /unknown kind/)
      assert.deepEqual(
        await storage.moveNode(p.id, { kind: 'folder', id: 'fld_missing', parentId: f1.id, order: 4 }),
        { kind: 'folder', id: 'fld_missing', parentId: f1.id, order: 4 },
      )
      assert.deepEqual(
        await storage.moveNode(p.id, { kind: 'endpoint', id: 'ep_missing' }),
        { kind: 'endpoint', id: 'ep_missing', parentId: null, order: 0 },
      )
    }),
  },
  {
    name: 'host-data: saveSchema/deleteSchema 新建补 id 与时间戳，覆盖保留 createdAt',
    fn: () => withTempStorage(async (storage) => {
      const p = await storage.createProject('schema 项目')
      const s = await storage.saveSchema(p.id, { name: 'User', jsonSchema: { type: 'object' } })
      assert.match(s.id, /^sch_/)
      assert.ok(!Number.isNaN(Date.parse(s.createdAt)))
      assert.equal(s.description, '')
      assert.equal(s.folderId, null)

      await new Promise((r) => setTimeout(r, 5))
      const updated = await storage.saveSchema(p.id, { ...s, description: '用户模型' })
      assert.equal(updated.id, s.id)
      assert.equal(updated.createdAt, s.createdAt)
      assert.equal(updated.description, '用户模型')
      let got = await storage.getProject(p.id)
      assert.equal(got.schemas.length, 1)

      // 空值边界：空对象也能建
      const blank = await storage.saveSchema(p.id, {})
      assert.match(blank.id, /^sch_/)
      assert.deepEqual(blank.jsonSchema, {})

      await storage.deleteSchema(p.id, s.id)
      got = await storage.getProject(p.id)
      assert.equal(got.schemas.length, 1)
      assert.equal(got.schemas[0].id, blank.id)
      // 删不存在的 id 不报错
      assert.deepEqual(await storage.deleteSchema(p.id, 'sch_missing'), { id: 'sch_missing' })
    }),
  },
  {
    name: 'host-data: saveEnvironment/deleteEnvironment 增删改 + 默认变量结构',
    fn: () => withTempStorage(async (storage) => {
      const p = await storage.createProject('env 项目')
      const e = await storage.saveEnvironment(p.id, {
        name: '开发环境', baseUrl: 'https://dev.example.com', isDefault: true,
        variables: [{ key: 'token', value: 'a', enabled: true, secret: false }],
      })
      assert.match(e.id, /^env_/)
      assert.equal(e.variables.length, 1)
      const got1 = await storage.getProject(p.id)
      assert.equal(got1.environments.length, 1)

      const updated = await storage.saveEnvironment(p.id, { ...e, baseUrl: 'https://prod.example.com' })
      assert.equal(updated.id, e.id)
      assert.equal(updated.baseUrl, 'https://prod.example.com')
      // 未传 variables 时沿用旧值
      assert.equal(updated.variables.length, 1)
      // 空值边界
      const blank = await storage.saveEnvironment(p.id, {})
      assert.deepEqual(blank.variables, [])
      assert.equal(blank.baseUrl, '')

      await storage.deleteEnvironment(p.id, e.id)
      const got2 = await storage.getProject(p.id)
      assert.equal(got2.environments.length, 1)
      assert.equal(got2.environments[0].id, blank.id)
    }),
  },
  {
    name: 'host-data: saveGlobals 支持 {variables} 与数组两种入参形态',
    fn: () => withTempStorage(async (storage) => {
      const p = await storage.createProject('globals 项目')
      const g1 = await storage.saveGlobals(p.id, { variables: [{ key: 'g', value: '1', enabled: true, secret: false }] })
      assert.equal(g1.variables.length, 1)
      assert.equal(g1.variables[0].key, 'g')

      const g2 = await storage.saveGlobals(p.id, [{ key: 'h', value: '2', enabled: true, secret: true }])
      assert.equal(g2.variables[0].key, 'h')

      const g3 = await storage.saveGlobals(p.id, null)
      assert.deepEqual(g3, { variables: [] })

      const got = await storage.getProject(p.id)
      assert.deepEqual(got.globals, { variables: [] })
    }),
  },
  {
    name: 'host-data: saveProjectSettings 局部合并（只覆盖传入键）',
    fn: () => withTempStorage(async (storage) => {
      const p = await storage.createProject('settings 项目')
      const s1 = await storage.saveProjectSettings(p.id, { historyLimit: 50 })
      assert.equal(s1.historyLimit, 50)
      assert.equal(s1.mockPort, DEFAULT_SETTINGS.mockPort)
      assert.equal(s1.requestTimeoutMs, DEFAULT_SETTINGS.requestTimeoutMs)

      const s2 = await storage.saveProjectSettings(p.id, { mockPort: 4020 })
      assert.equal(s2.mockPort, 4020)
      assert.equal(s2.historyLimit, 50) // 上一次的保留

      const s3 = await storage.saveProjectSettings(p.id, null)
      assert.equal(s3.mockPort, 4020) // null 不破坏已有
      const got = await storage.getProject(p.id)
      assert.equal(got.settings.mockPort, 4020)
    }),
  },
  {
    name: 'host-data: saveFlow 保存流程图步骤，空值回落空结构',
    fn: () => withTempStorage(async (storage) => {
      const p = await storage.createProject('flow 项目')
      const flow = {
        name: '下单流程',
        steps: [{ actor: '客户端', action: 'call', target: '订单服务', message: 'POST /orders', note: '' }],
      }
      const saved = await storage.saveFlow(p.id, flow)
      assert.equal(saved.name, '下单流程')
      assert.equal(saved.steps.length, 1)
      assert.equal(saved.steps[0].action, 'call')
      const got = await storage.getProject(p.id)
      assert.deepEqual(got.flow, flow)

      const blank = await storage.saveFlow(p.id, null)
      assert.deepEqual(blank, { name: '', steps: [] })
    }),
  },
  {
    name: 'host-data: saveResponse/deleteResponse 在 endpoint.responses 内 upsert，首个自动 isDefault',
    fn: () => withTempStorage(async (storage) => {
      const p = await storage.createProject('response 项目')
      const ep = await storage.saveEndpoint(p.id, { name: '接口' })
      const r1 = await storage.saveResponse(p.id, ep.id, { name: '成功', code: 200, body: '{"a":1}' })
      assert.match(r1.id, /^res_/)
      assert.equal(r1.isDefault, true) // 首个自动默认
      assert.equal(r1.contentType, 'application/json')

      const r2 = await storage.saveResponse(p.id, ep.id, { name: '失败', code: 500, body: 'boom' })
      assert.equal(r2.isDefault, false)
      assert.equal(r2.code, 500)

      const r1b = await storage.saveResponse(p.id, ep.id, { ...r1, body: '{"a":2}' })
      assert.equal(r1b.id, r1.id)
      assert.equal(r1b.body, '{"a":2}')
      let got = await storage.getProject(p.id)
      assert.equal(got.endpoints[0].responses.length, 2)

      // 边界：缺 endpoint → 幂等回构造结果、不落盘、不抛错
      const orphan = await storage.saveResponse(p.id, 'ep_missing', { code: 200 })
      assert.match(orphan.id, /^res_/)
      assert.equal(orphan.code, 200)
      assert.equal((await storage.getProject(p.id)).endpoints[0].responses.length, 2) // 未被写入

      await storage.deleteResponse(p.id, ep.id, r1.id)
      got = await storage.getProject(p.id)
      assert.equal(got.endpoints[0].responses.length, 1)
      assert.equal(got.endpoints[0].responses[0].id, r2.id)
      assert.deepEqual(await storage.deleteResponse(p.id, 'ep_missing', r1.id), { id: r1.id })
    }),
  },

  /* ── history ──────────────────────────────────────────────────────── */

  {
    name: 'host-data: appendHistory/getHistory 落 history.json 并补 id/at 默认值',
    fn: () => withTempStorage(async (storage, base) => {
      const p = await storage.createProject('history 项目')
      assert.deepEqual(await storage.getHistory(p.id), { entries: [] }) // 空库

      const e = await storage.appendHistory(p.id, {
        method: 'post', url: 'https://x/y', status: 200, timeMs: 12, bodySize: 3,
        request: { headers: {} }, response: { status: 200 },
      })
      assert.match(e.id, /^his_/)
      assert.equal(e.method, 'POST') // method 统一大写
      assert.ok(!Number.isNaN(Date.parse(e.at)))

      const got = await storage.getHistory(p.id)
      assert.equal(got.entries.length, 1)
      assert.equal(got.entries[0].id, e.id)
      // 直接读盘校验
      const raw = JSON.parse(await fs.readFile(path.join(base, p.id, 'history.json'), 'utf8'))
      assert.equal(raw.entries.length, 1)

      // 空值边界：空对象也能落一条（补默认）
      const blank = await storage.appendHistory(p.id, null)
      assert.equal(blank.method, 'GET')
      assert.equal(blank.status, 0)
      assert.equal((await storage.getHistory(p.id)).entries.length, 2)

      // 缺 projectId 抛错
      await assert.rejects(() => storage.appendHistory('', { url: 'x' }), /projectId is required/)
      await assert.rejects(() => storage.getHistory(''), /projectId is required/)
    }),
  },
  {
    name: 'host-data: appendHistory 超 settings.historyLimit 裁剪保留最新 N 条',
    fn: () => withTempStorage(async (storage) => {
      const p = await storage.createProject('裁剪项目')
      await storage.saveProjectSettings(p.id, { historyLimit: 3 })
      for (let i = 0; i < 7; i += 1) {
        await storage.appendHistory(p.id, { url: 'https://x/' + i, status: 200 })
      }
      const got = await storage.getHistory(p.id)
      assert.equal(got.entries.length, 3)
      // 保留最新三条（尾部最新）
      assert.deepEqual(got.entries.map((e) => e.url), ['https://x/4', 'https://x/5', 'https://x/6'])
      // 默认 limit=200
      const p2 = await storage.createProject('默认裁剪')
      for (let i = 0; i < 205; i += 1) await storage.appendHistory(p2.id, { url: 'u' + i })
      assert.equal((await storage.getHistory(p2.id)).entries.length, DEFAULT_SETTINGS.historyLimit)
    }),
  },
  {
    name: 'host-data: clearHistory 返回 cleared 计数并清空文件',
    fn: () => withTempStorage(async (storage) => {
      const p = await storage.createProject('清空项目')
      await storage.appendHistory(p.id, { url: 'a' })
      await storage.appendHistory(p.id, { url: 'b' })
      assert.deepEqual(await storage.clearHistory(p.id), { cleared: 2 })
      assert.deepEqual(await storage.getHistory(p.id), { entries: [] })
      // 再清一次 0 条
      assert.deepEqual(await storage.clearHistory(p.id), { cleared: 0 })
      await assert.rejects(() => storage.clearHistory(''), /projectId is required/)
    }),
  },
  {
    name: 'host-data: history.json 损坏隔离 .corrupt-<ts> 后返回空历史',
    fn: () => withTempStorage(async (storage, base) => {
      const p = await storage.createProject('损坏历史')
      await storage.appendHistory(p.id, { url: 'a' })
      await fs.writeFile(path.join(base, p.id, 'history.json'), 'not json')
      assert.deepEqual(await storage.getHistory(p.id), { entries: [] })
      assert.ok((await fs.readdir(path.join(base, p.id))).some((n) => n.startsWith('history.json.corrupt-')))
    }),
  },

  /* ── search ───────────────────────────────────────────────────────── */

  {
    name: 'host-data: search 名称/url/description 命中且大小写不敏感，空关键字返回空集',
    fn: () => withTempStorage(async (storage) => {
      const p = await storage.createProject('搜索项目')
      const folder = await storage.saveFolder(p.id, { name: 'User 模块' })
      await storage.saveEndpoint(p.id, { name: '查询用户', url: 'https://api.example.com/USERS/{id}', folderId: folder.id, description: '按 ID 查询' })
      await storage.saveEndpoint(p.id, { name: '创建订单', url: '/orders', description: 'Order 创建' })
      await storage.saveSchema(p.id, { name: 'UserModel', description: 'user 数据模型' })

      const byName = await storage.search(p.id, 'user')
      assert.equal(byName.endpoints.length, 1)
      assert.equal(byName.endpoints[0].name, '查询用户')
      assert.equal(byName.folders.length, 1)
      assert.equal(byName.schemas.length, 1)

      const byUrl = await storage.search(p.id, 'USERS')
      assert.equal(byUrl.endpoints.length, 1)

      const byDesc = await storage.search(p.id, 'order')
      assert.equal(byDesc.endpoints.length, 1)
      assert.equal(byDesc.endpoints[0].name, '创建订单')

      // 大小写混写同样命中
      assert.equal((await storage.search(p.id, 'UsEr')).endpoints.length, 1)
      // 空/空白关键字 → 空集（不是全部）
      assert.deepEqual(await storage.search(p.id, ''), { endpoints: [], schemas: [], folders: [] })
      assert.deepEqual(await storage.search(p.id, '   '), { endpoints: [], schemas: [], folders: [] })
      // 无命中
      assert.deepEqual(await storage.search(p.id, 'zzz'), { endpoints: [], schemas: [], folders: [] })
      // 边界
      await assert.rejects(() => storage.search('', 'x'), /projectId is required/)
      // 未知项目 → 空集（只读查询不炸 500；搜索页初挂载会用占位 id 自动查一次）
      assert.deepEqual(await storage.search('proj_missing', 'x'), { endpoints: [], schemas: [], folders: [] })
    }),
  },

  /* ── 导入 ─────────────────────────────────────────────────────────── */

  {
    name: 'import: OpenAPI 3 固定样本 → 目录/接口/模型与参数拆分',
    fn: async () => {
      const out = importOpenApi(OPENAPI_SAMPLE)
      assert.equal(out.folders.length, 2)
      assert.deepEqual(out.folders.map((f) => f.name), ['用户', '订单'])
      assert.equal(out.endpoints.length, 2)
      assert.equal(out.schemas.length, 1)
      assert.equal(out.schemas[0].name, 'User')

      const get = out.endpoints.find((e) => e.method === 'GET')
      assert.equal(get.name, '查询用户')
      assert.equal(get.url, 'https://api.example.com/v1/users/{id}')
      assert.equal(get.folderId, out.folders[0].id) // 用户目录
      assert.equal(get.pathParams.length, 1)
      assert.equal(get.pathParams[0].key, 'id')
      assert.equal(get.pathParams[0].required, true)
      assert.equal(get.params.length, 1)
      assert.equal(get.params[0].key, 'verbose')
      assert.equal(get.headers.length, 1)
      assert.equal(get.headers[0].key, 'X-Trace')
      assert.equal(get.responses.length, 2)
      assert.equal(get.responses[0].code, 200)
      assert.equal(get.responses[0].isDefault, true)
      assert.equal(JSON.parse(get.responses[0].body).name, '张三')

      const post = out.endpoints.find((e) => e.method === 'POST')
      assert.equal(post.folderId, out.folders[1].id)
      assert.equal(post.body.type, 'json')
      assert.deepEqual(JSON.parse(post.body.content), { sku: 'A1', count: 2 })
      assert.equal(post.responses[0].code, 201)

      // 空文档边界
      const empty = importOpenApi(null)
      assert.deepEqual(empty, { folders: [], endpoints: [], schemas: [] })
      assert.deepEqual(importOpenApi({ openapi: '3.0.0', paths: {} }), { folders: [], endpoints: [], schemas: [] })
    },
  },
  {
    name: 'import: Swagger 2.0（host/basePath/definitions）同样可导入',
    fn: async () => {
      const out = importOpenApi({
        swagger: '2.0',
        host: 'api.old.com',
        basePath: '/v2',
        schemes: ['https'],
        paths: { '/ping': { get: { summary: '探活', responses: { 200: { description: 'OK' } } } } },
        definitions: { Ping: { type: 'object' } },
      })
      assert.equal(out.endpoints.length, 1)
      assert.equal(out.endpoints[0].url, 'https://api.old.com/v2/ping')
      assert.equal(out.schemas[0].name, 'Ping')
    },
  },
  {
    name: 'import: Postman v2.1 固定样本 → 目录嵌套/headers 过滤 disabled/auth/响应',
    fn: async () => {
      const out = importPostman(POSTMAN_SAMPLE)
      // collection.info.name 作为根目录（parentId null），item 树挂在它下面
      assert.equal(out.folders.length, 2)
      assert.equal(out.folders[0].name, 'Postman 示例')
      assert.equal(out.folders[0].parentId, null)
      assert.equal(out.folders[0].order, 0)
      assert.equal(out.folders[1].name, '用户模块')
      assert.equal(out.folders[1].parentId, out.folders[0].id)
      assert.equal(out.folders[1].order, 0) // 同级内序号，不是全局序号
      assert.equal(out.endpoints.length, 2)

      const login = out.endpoints.find((e) => e.name === '登录')
      assert.equal(login.method, 'POST')
      assert.equal(login.url, 'https://api.example.com/login?from=web')
      assert.equal(login.folderId, out.folders[1].id)
      // disabled header 保留但 enabled=false
      assert.equal(login.headers.length, 2)
      assert.equal(login.headers[1].enabled, false)
      assert.equal(login.params.length, 1)
      assert.equal(login.params[0].key, 'from')
      assert.equal(login.body.type, 'json')
      assert.equal(login.auth.type, 'bearer')
      assert.equal(login.auth.token, 'tk_1')
      assert.equal(login.description, '账号密码登录')
      assert.equal(login.responses.length, 1)
      assert.equal(login.responses[0].code, 200)
      assert.equal(login.responses[0].body, '{"token":"tk_2"}')

      const health = out.endpoints.find((e) => e.name === '健康检查')
      assert.equal(health.folderId, out.folders[0].id) // 直接挂在根目录下
      assert.equal(health.method, 'GET')
      assert.equal(health.order, 0) // 根目录下第一个接口

      // 空集合边界
      assert.deepEqual(importPostman(null), { folders: [], endpoints: [], schemas: [] })
    },
  },
  {
    name: 'import: HAR 固定样本 → 每 entry 一接口、method+path 去重、伪 header 过滤',
    fn: async () => {
      const out = importHar(HAR_SAMPLE)
      assert.equal(out.folders.length, 0)
      assert.equal(out.endpoints.length, 2) // 重复的 POST /v1/login 被去重
      const login = out.endpoints.find((e) => e.method === 'POST')
      assert.equal(login.url, 'https://api.example.com/v1/login?from=web')
      assert.equal(login.params.length, 1)
      assert.equal(login.params[0].key, 'from')
      // ':authority' 伪 header 被过滤
      assert.equal(login.headers.length, 1)
      assert.equal(login.headers[0].key, 'Content-Type')
      assert.equal(login.body.type, 'json')
      assert.equal(login.responses.length, 1)
      assert.equal(login.responses[0].code, 200)
      assert.equal(login.responses[0].body, '{"token":"tk"}')
      const users = out.endpoints.find((e) => e.method === 'GET')
      assert.equal(users.name, 'GET /v1/users')

      assert.deepEqual(importHar({}), { folders: [], endpoints: [], schemas: [] })
    },
  },
  {
    name: 'import: cURL 固定样本 → method/headers/basic auth/JSON body/query 拆分',
    fn: async () => {
      const ep = importCurl(CURL_SAMPLE)
      assert.equal(ep.method, 'POST')
      assert.equal(ep.url, 'https://api.example.com/v1/users')
      assert.equal(ep.params.length, 2)
      assert.deepEqual(ep.params.map((p) => p.key), ['page', 'size'])
      assert.equal(ep.headers.length, 2)
      assert.equal(ep.headers[0].key, 'Content-Type')
      assert.equal(ep.auth.type, 'basic')
      assert.equal(ep.auth.username, 'alice')
      assert.equal(ep.auth.password, 'secret')
      assert.equal(ep.body.type, 'json')
      assert.deepEqual(JSON.parse(ep.body.content), { name: '张三', age: 18 })
      assert.equal(ep.name, '/v1/users')

      // 无 -X 且有 -d → POST；无 body → GET
      assert.equal(importCurl("curl https://x/y -d 'a=1'").method, 'POST')
      assert.equal(importCurl('curl https://x/y').method, 'GET')
      // -G 把 data 转 query
      const g = importCurl("curl -G https://x/y -d 'a=1&b=2'")
      assert.equal(g.method, 'GET')
      assert.equal(g.params.length, 2)
      assert.equal(g.body.type, 'none')
      // 空输入边界
      const blank = importCurl('')
      assert.equal(blank.method, 'GET')
      assert.equal(blank.url, '')
    },
  },
  {
    name: 'import: Apifox JSON → apiCollection 树/OpenAPI 风格叶子/models 模型，重复导入 id 稳定',
    fn: async () => {
      const { importApifox } = await import('../src/host/import-export.js')
      const sample = {
        name: 'Apifox 示例项目',
        apiCollection: [
          {
            type: 'folder',
            name: '用户模块',
            items: [
              {
                type: 'api',
                method: 'GET',
                path: '/v1/users/{id}',
                name: '查询用户',
                description: '按 id 查用户',
                parameters: [
                  { name: 'id', in: 'path', required: true, description: '用户 id' },
                  { name: 'verbose', in: 'query', description: '详细输出' },
                  { name: 'X-Trace', in: 'header', example: 't-1' },
                ],
                responses: { 200: { description: 'OK', content: { 'application/json': { example: { id: 1 } } } } },
              },
            ],
          },
          { type: 'api', method: 'POST', path: '/v1/orders', name: '下单' },
        ],
        models: [{ name: 'User', jsonSchema: { type: 'object' } }],
      }
      const out = importApifox(sample)
      // 项目名根目录 + 用户模块子目录
      assert.equal(out.folders.length, 2)
      assert.equal(out.folders[0].name, 'Apifox 示例项目')
      assert.equal(out.folders[0].parentId, null)
      assert.equal(out.folders[1].name, '用户模块')
      assert.equal(out.folders[1].parentId, out.folders[0].id)
      assert.equal(out.endpoints.length, 2)
      const get = out.endpoints.find((e) => e.name === '查询用户')
      assert.equal(get.method, 'GET')
      assert.equal(get.url, '/v1/users/{id}')
      assert.equal(get.folderId, out.folders[1].id)
      assert.equal(get.pathParams.length, 1)
      assert.equal(get.pathParams[0].key, 'id')
      assert.equal(get.params.length, 1)
      assert.equal(get.params[0].key, 'verbose')
      assert.equal(get.headers.length, 1)
      assert.equal(get.headers[0].key, 'X-Trace')
      assert.equal(get.description, '按 id 查用户')
      assert.equal(get.responses.length, 1)
      assert.equal(get.responses[0].code, 200)
      const post = out.endpoints.find((e) => e.name === '下单')
      assert.equal(post.folderId, out.folders[0].id)
      assert.equal(out.schemas.length, 1)
      assert.equal(out.schemas[0].name, 'User')
      assert.deepEqual(out.schemas[0].jsonSchema, { type: 'object' })

      // v2 形态：items 树 + dataSchemas，叶子用 url 字段
      const v2 = importApifox({
        items: [{ type: 'api', method: 'PUT', url: '/x', name: '改' }],
        dataSchemas: [{ name: 'S', jsonSchema: { type: 'string' } }],
      })
      assert.equal(v2.endpoints.length, 1)
      assert.equal(v2.endpoints[0].url, '/x')
      assert.equal(v2.folders.length, 0) // 无项目名不造根目录
      assert.equal(v2.schemas[0].name, 'S')

      // 扁平形态：apis[] + folder 字段
      const flat = importApifox({
        apis: [
          { method: 'GET', path: '/a', name: 'A', folder: '组一' },
          { method: 'GET', path: '/b', name: 'B', folder: '组一' },
          { method: 'GET', path: '/c', name: 'C' },
        ],
      })
      assert.equal(flat.folders.length, 1)
      assert.equal(flat.folders[0].name, '组一')
      assert.equal(flat.endpoints.filter((e) => e.folderId === flat.folders[0].id).length, 2)
      assert.equal(flat.endpoints.find((e) => e.name === 'C').folderId, null)

      // 幂等：重复导入同文档得到同一批 id
      const again = importApifox(sample)
      assert.deepEqual(again.endpoints.map((e) => e.id), out.endpoints.map((e) => e.id))
      // 空文档边界
      assert.deepEqual(importApifox(null), { folders: [], endpoints: [], schemas: [] })
      assert.deepEqual(importApifox({}), { folders: [], endpoints: [], schemas: [] })
    },
  },
  {
    name: 'import: YApi → list 数组/req_query/req_headers/req_body_* /res_body JSON-Schema，项目名根目录',
    fn: async () => {
      const { importYApi } = await import('../src/host/import-export.js')
      const out = importYApi({
        name: 'YApi 迁移项目',
        list: [
          {
            title: '创建用户',
            path: '/v1/users',
            method: 'POST',
            markdown: '创建用户的说明',
            req_headers: [{ name: 'Authorization', value: 'Bearer x', required: '1' }],
            req_body_type: 'json',
            req_body_other: '{ "type": "object", "required": ["name"] }',
            res_body_type: 'json',
            res_body: '{ "type": "object", "properties": { "id": { "type": "integer" } } }',
          },
          {
            title: '查询用户',
            path: '/v1/users',
            method: 'GET',
            req_query: [
              { name: 'page', value: '1', required: '0' },
              { name: 'size', value: '20', required: '1', desc: '每页条数' },
            ],
          },
          {
            title: '表单上传',
            path: '/v1/upload',
            method: 'POST',
            req_body_type: 'form',
            req_body_form: [{ name: 'file', type: 'file', required: '1' }],
          },
        ],
      })
      assert.equal(out.folders.length, 1)
      assert.equal(out.folders[0].name, 'YApi 迁移项目')
      assert.equal(out.endpoints.length, 3)

      const post = out.endpoints.find((e) => e.name === '创建用户')
      assert.equal(post.method, 'POST')
      assert.equal(post.body.type, 'json')
      assert.deepEqual(post.body.schema, { type: 'object', required: ['name'] })
      assert.equal(post.headers.length, 1)
      assert.equal(post.headers[0].required, true)
      assert.equal(post.responses.length, 1)
      assert.deepEqual(post.responses[0].schema.properties.id, { type: 'integer' })
      assert.equal(post.description, '创建用户的说明')

      const get = out.endpoints.find((e) => e.name === '查询用户')
      assert.deepEqual(get.params.map((p) => p.key), ['page', 'size'])
      assert.equal(get.params[0].required, false)
      assert.equal(get.params[1].required, true)
      assert.equal(get.params[1].description, '每页条数')
      assert.equal(get.body.type, 'none')

      const form = out.endpoints.find((e) => e.name === '表单上传')
      assert.equal(form.body.type, 'form')
      assert.deepEqual(JSON.parse(form.body.content), [{ key: 'file', value: '', type: 'file', required: true }])

      // res_body 非 JSON-Schema 字符串 → 不产生响应
      const noSchema = importYApi({ list: [{ title: 'T', path: '/t', method: 'GET', res_body: '不是 JSON' }] })
      assert.equal(noSchema.endpoints[0].responses.length, 0)
      // 空边界
      assert.deepEqual(importYApi(null), { folders: [], endpoints: [], schemas: [] })
      assert.deepEqual(importYApi({ list: [] }), { folders: [], endpoints: [], schemas: [] })
    },
  },

  /* ── 导出与往返 ───────────────────────────────────────────────────── */

  {
    name: 'export: OpenAPI 导出含 paths/parameters/requestBody/responses/components',
    fn: () => withTempStorage(async (storage) => {
      const { project } = await seedProject(storage)
      const doc = exportOpenApi(project)
      assert.equal(doc.openapi, '3.0.3')
      assert.equal(doc.info.title, '示例项目')
      assert.deepEqual(doc.servers, [{ url: 'https://api.example.com/v1' }])
      assert.deepEqual(doc.tags, [{ name: '用户模块' }])
      const op = doc.paths['/users/{id}'].get
      assert.equal(op.summary, '查询用户')
      assert.equal(op.tags[0], '用户模块')
      const params = op.parameters
      assert.equal(params.find((p) => p.in === 'path').name, 'id')
      assert.equal(params.find((p) => p.in === 'path').required, true)
      assert.equal(params.find((p) => p.in === 'query').name, 'verbose')
      assert.equal(params.find((p) => p.in === 'header').name, 'X-Token')
      assert.deepEqual(op.requestBody.content['application/json'].example, { a: 1 })
      assert.deepEqual(op.responses['200'].content['application/json'].example, { id: 'u_1' })
      assert.deepEqual(doc.components.schemas.User.properties.id, { type: 'string' })
      assert.equal(doc.components.schemas.User.description, '用户模型')

      // 空项目边界
      const emptyDoc = exportOpenApi({ name: '空' })
      assert.deepEqual(emptyDoc.paths, {})
      assert.equal(emptyDoc.components, undefined)
    }),
  },
  {
    name: 'export: OpenAPI 导出→再导入往返，endpoint 数与关键字段一致',
    fn: () => withTempStorage(async (storage) => {
      const { project } = await seedProject(storage)
      const doc = exportOpenApi(project)
      const back = importOpenApi(JSON.parse(JSON.stringify(doc)))

      assert.equal(back.endpoints.length, project.endpoints.length)
      assert.equal(back.schemas.length, project.schemas.length)
      assert.equal(back.folders.length, project.folders.length)
      assert.equal(back.folders[0].name, project.folders[0].name)

      const src = project.endpoints[0]
      const dst = back.endpoints[0]
      assert.equal(dst.name, src.name)
      assert.equal(dst.method, src.method)
      // 导出时 url 会按 servers/baseUrl 补全为绝对地址（OpenAPI 语义），往返后以 baseUrl 开头
      assert.equal(dst.url, 'https://api.example.com/v1' + src.url)
      assert.equal(dst.pathParams[0].key, src.pathParams[0].key)
      assert.equal(dst.params[0].key, src.params[0].key)
      assert.equal(dst.headers[0].key, src.headers[0].key)
      assert.equal(dst.body.type, src.body.type)
      assert.deepEqual(JSON.parse(dst.body.content), JSON.parse(src.body.content))
      assert.equal(dst.responses.length, src.responses.length)
      assert.equal(dst.responses[0].code, src.responses[0].code)
      assert.equal(dst.responses[0].contentType, src.responses[0].contentType)
      assert.deepEqual(JSON.parse(dst.responses[0].body), JSON.parse(src.responses[0].body))
      assert.equal(back.schemas[0].name, project.schemas[0].name)
      assert.deepEqual(back.schemas[0].jsonSchema.properties, project.schemas[0].jsonSchema.properties)
    }),
  },
  {
    name: 'export: Postman 导出目录嵌套 + 再导入往返一致',
    fn: () => withTempStorage(async (storage) => {
      const { project } = await seedProject(storage)
      const collection = exportPostman(project)
      assert.equal(collection.info.name, '示例项目')
      assert.ok(collection.info.schema.includes('v2.1.0'))
      assert.equal(collection.item.length, 1)
      assert.equal(collection.item[0].name, '用户模块')
      assert.equal(collection.item[0].item.length, 1)
      const req = collection.item[0].item[0].request
      assert.equal(req.method, 'GET')
      assert.equal(req.url.raw, 'https://api.example.com/v1/users/{id}?verbose=false')
      assert.equal(req.url.query[0].key, 'verbose')
      assert.equal(req.auth.type, 'bearer')
      assert.equal(req.header[0].key, 'X-Token')
      assert.equal(collection.item[0].item[0].response.length, 1)

      const back = importPostman(JSON.parse(JSON.stringify(collection)))
      assert.equal(back.endpoints.length, 1)
      // collection.info.name 回导入时成为根目录，原目录降为其子目录
      assert.equal(back.folders.length, 2)
      assert.equal(back.folders[0].name, '示例项目')
      assert.equal(back.folders[0].parentId, null)
      assert.equal(back.folders[1].name, '用户模块')
      assert.equal(back.folders[1].parentId, back.folders[0].id)
      assert.equal(back.endpoints[0].name, '查询用户')
      assert.equal(back.endpoints[0].method, 'GET')
      assert.equal(back.endpoints[0].folderId, back.folders[1].id)
      assert.equal(back.endpoints[0].auth.type, 'bearer')
      assert.equal(back.endpoints[0].params[0].key, 'verbose')
      // 往返后 url 已补 baseUrl 并带 query（Postman raw 惯例）
      assert.equal(back.endpoints[0].url, 'https://api.example.com/v1/users/{id}?verbose=false')
    }),
  },
  {
    name: 'export: HAR 导出 log.entries 且再导入可还原 method/url/响应',
    fn: () => withTempStorage(async (storage) => {
      const { project } = await seedProject(storage)
      const har = exportHar(project)
      assert.equal(har.log.version, '1.2')
      assert.equal(har.log.entries.length, 1)
      const entry = har.log.entries[0]
      assert.equal(entry.request.method, 'GET')
      // HAR 惯例：request.url 带完整 query，queryString 明细另存
      assert.equal(entry.request.url, 'https://api.example.com/v1/users/{id}?verbose=false')
      assert.equal(entry.request.queryString[0].name, 'verbose')
      assert.equal(entry.request.postData.mimeType, 'application/json')
      assert.equal(entry.response.status, 200)
      assert.equal(entry.response.content.text, '{"id":"u_1"}')

      const back = importHar(JSON.parse(JSON.stringify(har)))
      assert.equal(back.endpoints.length, 1)
      assert.equal(back.endpoints[0].method, 'GET')
      assert.equal(back.endpoints[0].url, 'https://api.example.com/v1/users/{id}?verbose=false')
      assert.equal(back.endpoints[0].params[0].key, 'verbose')
      assert.equal(back.endpoints[0].responses[0].body, '{"id":"u_1"}')
    }),
  },
  {
    name: 'export: Markdown 含标题/接口小节/参数表/响应代码块，空项目给占位',
    fn: () => withTempStorage(async (storage) => {
      const { project } = await seedProject(storage)
      const md = exportMarkdown(project)
      assert.ok(md.startsWith('# 示例项目'))
      assert.ok(md.includes('## 用户模块'))
      assert.ok(md.includes('### 查询用户'))
      assert.ok(md.includes('`GET /users/{id}`'))
      assert.ok(md.includes('**Path 参数**'))
      assert.ok(md.includes('| id | u_1 | 是 | 用户 id |'))
      assert.ok(md.includes('**Query 参数**'))
      assert.ok(md.includes('**响应**'))
      assert.ok(md.includes('{"id":"u_1"}'))

      const emptyMd = exportMarkdown({ name: '空项目' })
      assert.ok(emptyMd.includes('_（暂无接口）_'))
    }),
  },

  /* ── 代码生成 ─────────────────────────────────────────────────────── */

  {
    name: 'codegen: 八种语言全部可生成且含 URL/方法/关键语法特征',
    fn: () => withTempStorage(async (storage) => {
      const { project, endpointId } = await seedProject(storage)
      const endpoint = project.endpoints.find((e) => e.id === endpointId)
      const env = { baseUrl: 'https://api.example.com/v1', variables: [{ key: 'token', value: 'tk_env', enabled: true }] }
      assert.deepEqual(listLanguages(), ['curl', 'fetch', 'axios', 'python', 'go', 'java', 'php', 'csharp'])

      const cases = [
        ['curl', ['curl -X GET', "https://api.example.com/v1/users/{id}?verbose=false", "-H 'X-Token: tk'", 'Authorization: Bearer tk_bearer', "-d '{\"a\":1}'"]],
        ['fetch', ['await fetch("https://api.example.com/v1/users/{id}?verbose=false"', "method: 'GET'", '"X-Token": "tk"', 'Authorization', 'body: "{\\"a\\":1}"']],
        ['axios', ["import axios from 'axios'", 'method: "get"', 'url: "https://api.example.com/v1/users/{id}?verbose=false"', '"X-Token": "tk"', 'data: {"a":1}']],
        ['python', ['import requests', 'url = "https://api.example.com/v1/users/{id}?verbose=false"', '"X-Token": "tk"', 'requests.request("GET"']],
        ['go', ['package main', '"net/http"', 'http.NewRequest("GET"', 'req.Header.Set("X-Token", "tk")']],
        ['java', ['HttpClient.newHttpClient()', 'HttpRequest.newBuilder()', 'URI.create("https://api.example.com/v1/users/{id}?verbose=false")', '.header("X-Token", "tk")', '.method("GET"']],
        ['php', ['<?php', 'curl_init()', 'CURLOPT_CUSTOMREQUEST, \'GET\'', "'X-Token: tk'", 'CURLOPT_POSTFIELDS']],
        ['csharp', ['using System.Net.Http;', 'new HttpRequestMessage(new HttpMethod("GET")', 'TryAddWithoutValidation("X-Token", "tk")', 'SendAsync(request)']],
      ]
      for (const [lang, needles] of cases) {
        const code = generateCode({ endpoint, env, lang })
        assert.equal(typeof code, 'string')
        assert.ok(code.length > 0, lang + ' 输出为空')
        for (const n of needles) {
          assert.ok(code.includes(n), lang + ' 缺少片段：' + n + '\n实际输出：\n' + code)
        }
      }
    }),
  },
  {
    name: 'codegen: 变量替换生效、未定义变量保留原文、缺 lang 默认 curl、未知 lang 抛错',
    fn: () => withTempStorage(async (storage) => {
      const p = await storage.createProject('codegen 项目')
      const ep = await storage.saveEndpoint(p.id, {
        name: '带变量接口',
        method: 'POST',
        url: '{{host}}/api/{{missing}}',
        params: [{ key: 'k', value: '{{token}}', enabled: true }],
        headers: [{ key: 'Authorization', value: 'Bearer {{token}}', enabled: true }],
        body: { type: 'json', content: '{"t":"{{token}}"}' },
      })
      const env = { baseUrl: '', variables: [{ key: 'host', value: 'https://h.example', enabled: true }, { key: 'token', value: 'tk_1', enabled: true }] }

      const curl = generateCode({ endpoint: ep, env })
      assert.ok(curl.startsWith('curl -X POST'), '缺 lang 应默认 curl，实际：' + curl)
      assert.ok(curl.includes('https://h.example/api/{{missing}}')) // 未定义变量保留原文
      assert.ok(curl.includes('k=tk_1'))
      assert.ok(curl.includes('Bearer tk_1'))
      assert.ok(curl.includes('{"t":"tk_1"}'))

      // enabled=false 的变量不参与替换
      const disabled = generateCode({
        endpoint: ep,
        env: { variables: [{ key: 'host', value: 'https://off', enabled: false }] },
        lang: 'python',
      })
      assert.ok(disabled.includes('{{host}}'))

      // 空 endpoint 边界
      const empty = generateCode({ endpoint: {}, lang: 'fetch' })
      assert.ok(empty.includes('await fetch("", {'))

      // 未知语言
      assert.throws(() => generateCode({ endpoint: ep, lang: 'rust' }), /unsupported lang/)
    }),
  },
  {
    name: 'codegen: urlencoded/form 体在 curl/axios/python/php 中按表单渲染',
    fn: () => withTempStorage(async (storage) => {
      const p = await storage.createProject('表单项目')
      const ep = await storage.saveEndpoint(p.id, {
        name: '表单提交',
        method: 'POST',
        url: 'https://api.example.com/form',
        body: { type: 'urlencoded', content: '[{"key":"a","value":"1"},{"key":"b","value":"2"}]' },
      })
      const curl = generateCode({ endpoint: ep, lang: 'curl' })
      assert.ok(curl.includes("-d 'a=1'"))
      assert.ok(curl.includes("-d 'b=2'"))

      const axios = generateCode({ endpoint: ep, lang: 'axios' })
      assert.ok(axios.includes('new URLSearchParams({'))
      assert.ok(axios.includes('"a": "1"'))

      const python = generateCode({ endpoint: ep, lang: 'python' })
      assert.ok(python.includes('data = {'))
      assert.ok(python.includes('"a": "1"'))

      const php = generateCode({ endpoint: ep, lang: 'php' })
      assert.ok(php.includes('http_build_query(['))

      // 非法 JSON 内容退化为空表而不抛错
      const broken = await storage.saveEndpoint(p.id, { name: '坏表单', body: { type: 'urlencoded', content: 'not json' } })
      const brokenCurl = generateCode({ endpoint: broken, lang: 'curl' })
      assert.ok(brokenCurl.includes('curl -X GET'))
    }),
  },
  {
    name: 'import-export: joinUrl 单斜杠归一',
    fn: async () => {
      assert.equal(joinUrl('https://a.com/', '/x'), 'https://a.com/x')
      assert.equal(joinUrl('https://a.com', 'x'), 'https://a.com/x')
      assert.equal(joinUrl('', '/x'), '/x')
      assert.equal(joinUrl(null, null), '')
    },
  },

  /* ── 标准层级：多级目录树 + importBundle 原子落盘 ─────────────────── */

  {
    name: 'import: Postman 多级嵌套 → 根目录为 collection 名、parentId 链完整、order 同级递增且父在子前',
    fn: async () => {
      const out = importPostman(NESTED_SAMPLE)
      const byName = (n) => out.folders.find((f) => f.name === n)
      const idx = (id) => out.folders.findIndex((f) => f.id === id)
      const root = out.folders[0]
      assert.equal(root.name, '商城 API')
      assert.equal(root.parentId, null)
      assert.equal(root.order, 0)

      const user = byName('用户')
      const auth = byName('鉴权')
      const order = byName('订单')
      assert.equal(user.parentId, root.id)
      assert.equal(order.parentId, root.id)
      assert.equal(auth.parentId, user.id)
      // order 是同级内序号，不是全局递增
      assert.equal(user.order, 0)
      assert.equal(order.order, 1)
      assert.equal(auth.order, 0)
      // 先序：父目录在子目录之前
      assert.ok(idx(root.id) < idx(user.id), '根目录应在子目录前')
      assert.ok(idx(user.id) < idx(auth.id), '父目录应在子目录前')

      const login = out.endpoints.find((e) => e.name === '登录')
      const logout = out.endpoints.find((e) => e.name === '登出')
      const profile = out.endpoints.find((e) => e.name === '资料')
      const list = out.endpoints.find((e) => e.name === '列表')
      assert.equal(login.folderId, auth.id)
      assert.equal(logout.folderId, auth.id)
      assert.equal(profile.folderId, user.id)
      assert.equal(list.folderId, order.id)
      // endpoint order 同样按同级内序号
      assert.equal(login.order, 0)
      assert.equal(logout.order, 1)
      assert.equal(profile.order, 0)
      assert.equal(list.order, 0)
    },
  },
  {
    name: 'importBundle: 单次原子落盘多级目录树，getProject 读回完整层级且只写一次 project.json',
    fn: () => withTempStorage(async (storage, base) => {
      const bundle = importPostman(NESTED_SAMPLE)
      const p = await storage.createProject('导入落盘项目')

      const writes = []
      const origRename = fs.rename
      fs.rename = async (from, to) => {
        writes.push(String(to))
        return origRename(from, to)
      }
      let res
      try {
        res = await storage.importBundle(p.id, bundle)
      } finally {
        fs.rename = origRename
      }

      assert.equal(writes.filter((f) => f.endsWith('project.json')).length, 1, 'importBundle 应只落盘一次 project.json')
      assert.deepEqual(
        { folders: res.folders, endpoints: res.endpoints, schemas: res.schemas },
        { folders: bundle.folders.length, endpoints: bundle.endpoints.length, schemas: 0 },
      )
      assert.deepEqual(res.idMap, {}, '空项目无 id 冲突时映射应为空')

      const got = await storage.getProject(p.id)
      assert.equal(got.folders.length, bundle.folders.length)
      assert.equal(got.endpoints.length, bundle.endpoints.length)
      // 层级链完整：每个目录的 parentId 要么 null 要么命中已有目录，且父在子前
      const seen = new Set()
      for (const f of got.folders) {
        if (f.parentId !== null) assert.ok(seen.has(f.parentId), '目录 ' + f.name + ' 的父目录应已在前')
        seen.add(f.id)
      }
      const root = got.folders.find((f) => f.name === '商城 API')
      const user = got.folders.find((f) => f.name === '用户')
      const auth = got.folders.find((f) => f.name === '鉴权')
      assert.equal(root.parentId, null)
      assert.equal(user.parentId, root.id)
      assert.equal(auth.parentId, user.id)
      // 接口全部挂在存在的目录上，且补全 v2 默认字段与时间戳
      for (const ep of got.endpoints) {
        assert.ok(got.folders.some((f) => f.id === ep.folderId), '接口 ' + ep.name + ' 的 folderId 应命中目录')
        assert.equal(ep.protocol, 'http')
        assert.deepEqual(ep.tags, [])
        assert.ok(!Number.isNaN(Date.parse(ep.createdAt)))
        assert.ok(!Number.isNaN(Date.parse(ep.updatedAt)))
      }
      // 原子写无 .tmp 残留
      assert.ok(!(await fs.readdir(path.join(base, p.id))).some((n) => n.endsWith('.tmp')))
    }),
  },
  {
    name: 'importBundle: id 冲突重分配并返回旧→新映射，endpoint.folderId 按映射改写，重复导入不撞 id',
    fn: () => withTempStorage(async (storage) => {
      const bundle = importPostman(NESTED_SAMPLE)
      const p = await storage.createProject('冲突项目')
      const takenFolderId = bundle.folders[0].id
      const takenEndpointId = bundle.endpoints[0].id
      await storage.saveFolder(p.id, { id: takenFolderId, name: '已有目录', parentId: null, order: 0 })
      await storage.saveEndpoint(p.id, { id: takenEndpointId, name: '已有接口', folderId: takenFolderId })

      const res = await storage.importBundle(p.id, bundle)
      assert.ok(res.idMap[takenFolderId], '冲突目录 id 应出现在映射中')
      assert.notEqual(res.idMap[takenFolderId], takenFolderId)
      assert.ok(res.idMap[takenEndpointId], '冲突接口 id 应出现在映射中')
      assert.notEqual(res.idMap[takenEndpointId], takenEndpointId)

      const got = await storage.getProject(p.id)
      // 原占位数据未被覆盖
      assert.equal(got.folders.find((f) => f.id === takenFolderId).name, '已有目录')
      assert.equal(got.endpoints.find((e) => e.id === takenEndpointId).name, '已有接口')
      // 导入的根目录拿到新 id，子目录 parentId 指向新 id
      const importedRoot = got.folders.find((f) => f.name === '商城 API')
      assert.equal(importedRoot.id, res.idMap[takenFolderId])
      assert.equal(got.folders.find((f) => f.name === '用户').parentId, importedRoot.id)
      // 接口 folderId 已按映射改写，不会挂到旧目录 id 上
      for (const ep of got.endpoints) {
        if (ep.id === takenEndpointId) continue
        assert.notEqual(ep.folderId, takenFolderId)
        assert.ok(got.folders.some((f) => f.id === ep.folderId))
      }

      // 重复导入同一 bundle：id 全部重分配，不产生重复 id
      const res2 = await storage.importBundle(p.id, bundle)
      assert.equal(Object.keys(res2.idMap).length, bundle.folders.length + bundle.endpoints.length)
      const got2 = await storage.getProject(p.id)
      assert.equal(new Set(got2.folders.map((f) => f.id)).size, got2.folders.length, '目录 id 不得重复')
      assert.equal(new Set(got2.endpoints.map((e) => e.id)).size, got2.endpoints.length, '接口 id 不得重复')
      assert.equal(got2.folders.filter((f) => f.name === '商城 API').length, 2, '两次导入应各有一棵完整树')
      // 边界：bundle.folders 非先序（子目录排在父目录前）也能正确挂链
      const shuffled = {
        folders: [
          { id: 'fld_child', name: '子', parentId: 'fld_parent', order: 0 },
          { id: 'fld_parent', name: '父', parentId: null, order: 0 },
        ],
        endpoints: [{ id: 'ep_c', name: '子接口', folderId: 'fld_child' }],
        schemas: [],
      }
      const resShuffled = await storage.importBundle(p.id, shuffled)
      const gotShuffled = await storage.getProject(p.id)
      const parent = gotShuffled.folders.find((f) => f.name === '父')
      const child = gotShuffled.folders.find((f) => f.name === '子')
      assert.equal(child.parentId, parent.id, '非先序 bundle 的子目录仍应挂到父目录')
      assert.equal(gotShuffled.endpoints.find((x) => x.name === '子接口').folderId, child.id)
      assert.deepEqual(resShuffled.idMap, {}, '无 id 冲突时映射应为空')
      // 落盘顺序父在子前，且不泄漏内部中间字段
      const shufFolders = gotShuffled.folders.filter((f) => f.name === '父' || f.name === '子')
      assert.equal(shufFolders[0].name, '父', '落盘顺序应父在子前')
      assert.ok(!('oldId' in shufFolders[0]), '落盘目录不应带内部中间字段 oldId')

      // 边界：缺 bundle / 项目不存在
      const blank = await storage.importBundle(p.id, null)
      assert.deepEqual({ folders: blank.folders, endpoints: blank.endpoints, schemas: blank.schemas }, { folders: 0, endpoints: 0, schemas: 0 })
      await assert.rejects(() => storage.importBundle('proj_missing', bundle), /project not found/)
    }),
  },
]
