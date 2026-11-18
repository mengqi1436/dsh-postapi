/**
 * 页面注册表 + 同源 HTTP 桥 api（db-tool 同款）。
 *
 * - window.__postapiPages：页面注册表。页面（T5 ui-pages）运行时调用
 *   window.__postapiPages.register(name, component) 自注册；本骨架禁止静态
 *   import ../pages/，只消费注册表。
 * - window.__postapiApi：同源 HTTP 桥。宿主 face 总线只提供内置 face，postapi.*
 *   无法注册为自定义 face，故 client 侧经 fetch('/dsh-postapi/api/…') 同源相对
 *   路径调用宿主桥路由（契约 §2/§3/§4 签名逐项映射，契约 §5 路由全表一一对应）；
 *   响应封套 { ok, data | error }，fetch 失败 / 非 2xx / ok!==true 时该次调用回落
 *   内存桩兜底（签名不变，桩为最小可用实现，不抛错）。
 */
import { POSTAPI_NS } from './locales.js'

/** 页面注册表（name -> component）。 */
const pages = new Map()

export const pageRegistry = {
  register(name, component) { pages.set(name, component) },
  get(name) { return pages.get(name) },
  has(name) { return pages.has(name) },
  names() { return [...pages.keys()] },
}

/** 把注册表挂到 window（幂等），并重放队列期注册（页面模块可能早于本函数求值）。 */
export function ensureGlobals() {
  if (typeof window === 'undefined') return
  window.__postapiPages = pageRegistry
  const queued = window.__postapiQueue
  if (Array.isArray(queued)) {
    for (const entry of queued.splice(0)) pageRegistry.register(entry[0], entry[1])
  }
}

/* ---------------- 同源 HTTP 桥 ---------------- */

/** 桥基路径：宿主在同源下托管的插件路由前缀。 */
export const BRIDGE_BASE = '/dsh-postapi/api'

/**
 * 一次桥调用：fetch 同源相对路径并解包封套。
 * @param path - 桥内路径（如 '/storage/listProjects'）。
 * @param init - fetch init（缺省 GET）。
 * @returns 封套 data 字段。
 * @throws 任一环节失败（网络 / HTTP 非 2xx / ok!==true）。
 */
async function bridgeCall(path, init) {
  const res = await fetch(BRIDGE_BASE + path, init)
  if (!res.ok) throw new Error('postapi bridge: HTTP ' + res.status + ' ' + path)
  const payload = await res.json()
  if (!payload || payload.ok !== true) {
    const reason = payload && payload.error && payload.error.message ? payload.error.message : '响应缺少 ok:true'
    throw new Error('postapi bridge: ' + reason + ' (' + path + ')')
  }
  return payload.data
}

function bridgePost(path, body) {
  return bridgeCall(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
}

/** GET + query 形态（history/search/listProjects 用，契约 §5 这两条为 GET）。 */
function bridgeGet(path, query) {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  }
  const tail = qs.toString()
  return bridgeCall(path + (tail ? '?' + tail : ''))
}

/**
 * storage 桥：契约 §3 全量签名映射到 /storage/<method>。
 * 与 host 路由一一对应（storage/X ↔ POST|GET /storage/X），名称不得改写。
 */
export function createBridgeStorage() {
  const post = (method, body) => bridgePost('/storage/' + method, body)
  return {
    // 既有 9 方法（签名保持不变）
    listProjects: () => bridgeCall('/storage/listProjects'),
    createProject: (name) => post('createProject', { name }),
    renameProject: (id, name) => post('renameProject', { id, name }),
    deleteProject: (id) => post('deleteProject', { id }),
    getProject: (id) => post('getProject', { id }),
    saveEndpoint: (projectId, endpoint) => post('saveEndpoint', { projectId, endpoint }),
    deleteEndpoint: (projectId, endpointId) => post('deleteEndpoint', { projectId, endpointId }),
    saveFolder: (projectId, folder) => post('saveFolder', { projectId, folder }),
    deleteFolder: (projectId, folderId) => post('deleteFolder', { projectId, folderId }),
    // 契约 §3 新增
    moveNode: (projectId, node) => post('moveNode', { projectId, ...(node ?? {}) }),
    saveSchema: (projectId, schema) => post('saveSchema', { projectId, schema }),
    deleteSchema: (projectId, schemaId) => post('deleteSchema', { projectId, schemaId }),
    saveEnvironment: (projectId, environment) => post('saveEnvironment', { projectId, environment }),
    deleteEnvironment: (projectId, envId) => post('deleteEnvironment', { projectId, envId }),
    saveGlobals: (projectId, globals) => post('saveGlobals', { projectId, globals }),
    saveProjectSettings: (projectId, settings) => post('saveProjectSettings', { projectId, settings }),
    saveFlow: (projectId, flow) => post('saveFlow', { projectId, flow }),
    saveResponse: (projectId, endpointId, response) => post('saveResponse', { projectId, endpointId, response }),
    deleteResponse: (projectId, endpointId, responseId) => post('deleteResponse', { projectId, endpointId, responseId }),
    getHistory: (projectId) => bridgeGet('/storage/getHistory', { projectId }),
    appendHistory: (projectId, entry) => post('appendHistory', { projectId, entry }),
    clearHistory: (projectId) => post('clearHistory', { projectId }),
    search: (projectId, keyword) => bridgeGet('/storage/search', { projectId, keyword }),
  }
}

/** request 桥：契约 §4 send / preview 整体走 POST。 */
export function createBridgeRequest() {
  return {
    send: (opts) => bridgePost('/request/send', opts ?? {}),
    preview: (opts) => bridgePost('/request/preview', opts ?? {}),
  }
}

/** script / mock / schema / import / export / codegen / test / db 桥（契约 §4，名称与 host 路由同名）。 */
export function createBridgeServices() {
  const post = bridgePost
  return {
    script: { run: (code, options) => post('/script/run', { code, ...(options ?? {}) }) },
    mock: {
      start: (port) => post('/mock/start', { port }),
      stop: () => post('/mock/stop', {}),
      status: () => post('/mock/status', {}),
    },
    schema: {
      example: (opts) => post('/schema/example', opts ?? {}),
      validate: (opts) => post('/schema/validate', opts ?? {}),
    },
    import: {
      openapi: (json) => post('/import/openapi', { json }),
      postman: (json) => post('/import/postman', { json }),
      har: (json) => post('/import/har', { json }),
      curl: (text) => post('/import/curl', { text }),
    },
    export: {
      openapi: (project) => post('/export/openapi', { project }),
      postman: (project) => post('/export/postman', { project }),
      har: (project) => post('/export/har', { project }),
      markdown: (project) => post('/export/markdown', { project }),
    },
    codegen: { run: (opts) => post('/codegen/run', opts ?? {}) },
    test: {
      runCase: (projectId, caseId) => post('/test/runCase', { projectId, caseId }),
      runScenario: (projectId, scenarioId) => post('/test/runScenario', { projectId, scenarioId }),
    },
    db: {
      test: (opts) => post('/db/test', opts ?? {}),
      query: (opts) => post('/db/query', opts ?? {}),
      close: (opts) => post('/db/close', opts ?? {}),
    },
  }
}

/* ---------------- 内存版 storage 桩（契约 §3 签名，兜底用） ---------------- */

function nowIso() { return new Date().toISOString() }
function makeId(prefix) { return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 4) }

function emptyProject(id, name) {
  return {
    id, name, description: '', createdAt: nowIso(), updatedAt: nowIso(), schemaVersion: 2,
    folders: [], endpoints: [], schemas: [],
    environments: [], globals: { variables: [] },
    mocks: [], testCases: [], testScenarios: [],
    flow: { name: '', steps: [] },
    settings: { mockPort: 4010, proxyUrl: '', requestTimeoutMs: 30000, historyLimit: 200 },
  }
}

/** upsert 到数组：有 id 覆盖（保留 createdAt），无 id 新建。 */
function upsert(list, item, prefix) {
  const ts = nowIso()
  if (item && item.id) {
    const at = list.findIndex((x) => x.id === item.id)
    const merged = { ...(at >= 0 ? list[at] : { createdAt: ts }), ...item, updatedAt: ts }
    if (at >= 0) list[at] = merged
    else list.push(merged)
    return merged
  }
  const created = { ...item, id: makeId(prefix), createdAt: ts, updatedAt: ts }
  list.push(created)
  return created
}

/** 契约 §3 postapi.storage 的内存实现，签名逐项对齐（兜底不落盘）。 */
export function createStubStorage() {
  const projects = new Map()
  const history = new Map()
  const project = (id) => projects.get(id)
  const clone = (v) => (v === undefined ? undefined : structuredClone(v))
  return {
    listProjects() {
      return [...projects.values()]
        .map((p) => ({ id: p.id, name: p.name, updatedAt: p.updatedAt }))
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    },
    createProject(name) {
      const created = emptyProject(makeId('proj_'), String(name ?? '新项目'))
      projects.set(created.id, created)
      return clone(created)
    },
    renameProject(id, name) {
      const p = project(id)
      if (p) { p.name = String(name ?? p.name); p.updatedAt = nowIso() }
      return clone(p)
    },
    deleteProject(id) { projects.delete(id); history.delete(id) },
    getProject(id) { return clone(project(id)) },
    saveEndpoint(projectId, endpoint) {
      const p = project(projectId)
      if (!p) return undefined
      p.updatedAt = nowIso()
      return clone(upsert(p.endpoints, endpoint ?? {}, 'ep_'))
    },
    deleteEndpoint(projectId, endpointId) {
      const p = project(projectId)
      if (!p) return undefined
      p.endpoints = p.endpoints.filter((e) => e.id !== endpointId)
      p.updatedAt = nowIso()
      return { id: endpointId }
    },
    saveFolder(projectId, folder) {
      const p = project(projectId)
      if (!p) return undefined
      p.updatedAt = nowIso()
      return clone(upsert(p.folders, folder ?? {}, 'fld_'))
    },
    deleteFolder(projectId, folderId) {
      const p = project(projectId)
      if (!p) return undefined
      p.folders = p.folders.filter((f) => f.id !== folderId)
      for (const e of p.endpoints) if (e.folderId === folderId) e.folderId = null
      for (const f of p.folders) if (f.parentId === folderId) f.parentId = null
      p.updatedAt = nowIso()
      return { id: folderId }
    },
    moveNode(projectId, node) {
      const p = project(projectId)
      if (!p) return undefined
      const { kind, id, parentId = null, order } = node ?? {}
      const list = kind === 'folder' ? p.folders : p.endpoints
      const hit = list.find((x) => x.id === id)
      if (!hit) return undefined
      if (kind === 'folder') hit.parentId = parentId
      else hit.folderId = parentId
      if (order !== undefined) hit.order = order
      p.updatedAt = nowIso()
      return clone(hit)
    },
    saveSchema(projectId, schema) {
      const p = project(projectId)
      if (!p) return undefined
      p.updatedAt = nowIso()
      return clone(upsert(p.schemas, schema ?? {}, 'sch_'))
    },
    deleteSchema(projectId, schemaId) {
      const p = project(projectId)
      if (!p) return undefined
      p.schemas = p.schemas.filter((s) => s.id !== schemaId)
      p.updatedAt = nowIso()
      return { id: schemaId }
    },
    saveEnvironment(projectId, environment) {
      const p = project(projectId)
      if (!p) return undefined
      p.updatedAt = nowIso()
      return clone(upsert(p.environments, environment ?? {}, 'env_'))
    },
    deleteEnvironment(projectId, envId) {
      const p = project(projectId)
      if (!p) return undefined
      p.environments = p.environments.filter((e) => e.id !== envId)
      p.updatedAt = nowIso()
      return { id: envId }
    },
    saveGlobals(projectId, globals) {
      const p = project(projectId)
      if (!p) return undefined
      p.globals = { variables: [], ...(globals ?? {}) }
      p.updatedAt = nowIso()
      return clone(p.globals)
    },
    saveProjectSettings(projectId, settings) {
      const p = project(projectId)
      if (!p) return undefined
      p.settings = { ...p.settings, ...(settings ?? {}) }
      p.updatedAt = nowIso()
      return clone(p.settings)
    },
    saveFlow(projectId, flow) {
      const p = project(projectId)
      if (!p) return undefined
      p.flow = { name: '', steps: [], ...(flow ?? {}) }
      p.updatedAt = nowIso()
      return clone(p.flow)
    },
    saveResponse(projectId, endpointId, response) {
      const p = project(projectId)
      if (!p) return undefined
      const ep = p.endpoints.find((e) => e.id === endpointId)
      if (!ep) return undefined
      ep.responses = Array.isArray(ep.responses) ? ep.responses : []
      p.updatedAt = nowIso()
      return clone(upsert(ep.responses, response ?? {}, 'res_'))
    },
    deleteResponse(projectId, endpointId, responseId) {
      const p = project(projectId)
      if (!p) return undefined
      const ep = p.endpoints.find((e) => e.id === endpointId)
      if (ep && Array.isArray(ep.responses)) ep.responses = ep.responses.filter((r) => r.id !== responseId)
      p.updatedAt = nowIso()
      return { id: responseId }
    },
    getHistory(projectId) {
      return { entries: clone(history.get(projectId) || []) }
    },
    appendHistory(projectId, entry) {
      const p = project(projectId)
      const limit = (p && p.settings && p.settings.historyLimit) || 200
      const list = history.get(projectId) || []
      const created = { id: makeId('his_'), at: nowIso(), ...(entry ?? {}) }
      list.unshift(created)
      history.set(projectId, list.slice(0, limit))
      return clone(created)
    },
    clearHistory(projectId) {
      const n = (history.get(projectId) || []).length
      history.set(projectId, [])
      return { cleared: n }
    },
    search(projectId, keyword) {
      const p = project(projectId)
      const kw = String(keyword ?? '').toLowerCase()
      if (!p || kw === '') return { endpoints: [], schemas: [], folders: [] }
      const hit = (obj, fields) => fields.some((f) => String(obj[f] ?? '').toLowerCase().includes(kw))
      return {
        endpoints: clone(p.endpoints.filter((e) => hit(e, ['name', 'url', 'description']))),
        schemas: clone(p.schemas.filter((s) => hit(s, ['name', 'description']))),
        folders: clone(p.folders.filter((f) => hit(f, ['name']))),
      }
    },
  }
}

/* ---------------- request 桩（契约 §4 签名，fetch 实现，兜底用） ---------------- */

/** 契约 §4 postapi.request：fetch + AbortController + auth 注入 + query 拼接。 */
export function createStubRequest() {
  return async function send(opts = {}) {
    const { method = 'GET', url = '', params, headers, body, auth, timeoutMs = 30000 } = opts
    const started = Date.now()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const finalUrl = new URL(url, typeof location !== 'undefined' ? location.href : 'http://localhost/')
      for (const { key, value, enabled = true } of params ?? []) {
        if (enabled && key) finalUrl.searchParams.set(String(key), String(value ?? ''))
      }
      const h = new Headers()
      for (const { key, value, enabled = true } of headers ?? []) {
        if (enabled && key) h.set(String(key), String(value ?? ''))
      }
      let bodyText
      if (body && body.type !== 'none' && method !== 'GET' && method !== 'HEAD') {
        if (body.type === 'json') {
          bodyText = body.content ?? ''
          if (!h.has('Content-Type')) h.set('Content-Type', 'application/json')
        } else if (body.type === 'form') {
          bodyText = body.content ?? ''
          if (!h.has('Content-Type')) h.set('Content-Type', 'application/x-www-form-urlencoded')
        } else {
          bodyText = body.content ?? ''
        }
      }
      if (auth?.type === 'bearer' && auth.token) h.set('Authorization', 'Bearer ' + auth.token)
      if (auth?.type === 'basic' && auth.username !== undefined) {
        h.set('Authorization', 'Basic ' + btoa(auth.username + ':' + (auth.password ?? '')))
      }
      const res = await fetch(finalUrl.toString(), { method, headers: h, body: bodyText, signal: controller.signal })
      const text = await res.text()
      return {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body: text,
        bodySize: text.length,
        timeMs: Date.now() - started,
      }
    } catch (error) {
      return {
        status: 0, statusText: '', headers: {}, body: '', bodySize: 0,
        timeMs: Date.now() - started,
        error: { message: error instanceof Error ? error.message : String(error), aborted: controller.signal.aborted },
      }
    } finally { clearTimeout(timer) }
  }
}

/* ---------------- 服务桩（契约 §4 最小可用，兜底不抛错） ---------------- */

/** 脚本沙箱桩：明确回报「不可用」，不执行任何代码（浏览器侧无 vm 隔离）。 */
export function createStubServices() {
  return {
    script: {
      run: async () => ({ ok: false, error: '脚本沙箱不可用（桥降级：需 host 侧 vm 沙箱）', logs: [], variables: {}, tests: [], exports: {} }),
    },
    mock: {
      start: async () => ({ running: false, port: 0, error: 'Mock 服务不可用（桥降级）' }),
      stop: async () => ({ running: false, port: 0 }),
      status: async () => ({ running: false, port: 0 }),
    },
    schema: {
      example: async () => ({ example: {} }),
      validate: async () => ({ ok: true, message: '降级：桥不可达，未执行服务端校验' }),
    },
    import: {
      openapi: async () => ({ folders: [], endpoints: [], schemas: [] }),
      postman: async () => ({ folders: [], endpoints: [], schemas: [] }),
      har: async () => ({ folders: [], endpoints: [], schemas: [] }),
      curl: async () => ({ folders: [], endpoints: [], schemas: [], endpoint: null }),
    },
    export: {
      openapi: async () => '',
      postman: async () => '',
      har: async () => '',
      markdown: async () => '',
    },
    codegen: { run: async () => '' },
    test: {
      runCase: async (projectId, caseId) => ({ caseId, passed: false, results: [], durationMs: 0, error: '测试运行器不可用（桥降级）' }),
      runScenario: async (projectId, scenarioId) => ({ scenarioId, passed: false, steps: [], durationMs: 0, error: '测试运行器不可用（桥降级）' }),
    },
    db: {
      test: async () => ({ available: false, message: '数据库操作规划中（P2）' }),
      query: async () => ({ available: false, message: '数据库操作规划中（P2）' }),
      close: async () => ({ available: false, message: '数据库操作规划中（P2）' }),
    },
  }
}

/* ---------------- 安装：桥 + 逐方法兜底 ---------------- */

/** storage 桥/桩共有的全部方法名（installApi 逐方法包装的事实来源）。 */
export const STORAGE_METHODS = [
  'listProjects', 'createProject', 'renameProject', 'deleteProject', 'getProject',
  'saveEndpoint', 'deleteEndpoint', 'saveFolder', 'deleteFolder',
  'moveNode', 'saveSchema', 'deleteSchema', 'saveEnvironment', 'deleteEnvironment',
  'saveGlobals', 'saveProjectSettings', 'saveFlow', 'saveResponse', 'deleteResponse',
  'getHistory', 'appendHistory', 'clearHistory', 'search',
]

/** request 桥/桩共有的全部方法名。 */
export const REQUEST_METHODS = ['send', 'preview']

/** 服务命名空间与方法名（契约 §4 全表，键为 api.<ns>.<method>）。 */
export const SERVICE_METHODS = {
  script: ['run'],
  mock: ['start', 'stop', 'status'],
  schema: ['example', 'validate'],
  import: ['openapi', 'postman', 'har', 'curl'],
  export: ['openapi', 'postman', 'har', 'markdown'],
  codegen: ['run'],
  test: ['runCase', 'runScenario'],
  db: ['test', 'query', 'close'],
}

/**
 * 把桥形态的 api 挂到 window.__postapiApi（幂等）。
 * 每个方法独立兜底：桥调用失败时 console.warn 一次并回落内存桩，
 * 契约 §3/§4 签名保持不变（兜底数据不落盘）。
 * @returns 挂载后的 api 对象。
 */
export function installApi() {
  if (typeof window === 'undefined') return undefined
  let warned = false
  const warnOnce = () => {
    if (warned) return
    warned = true
    try { console.warn('[dsh-postapi] ' + BRIDGE_BASE + ' 桥不可达，本次起降级内存桩（数据不落盘）') }
    catch { /* 非控制台环境忽略 */ }
  }
  const wrap = (bridgeFn, stubFn) => (...args) =>
    Promise.resolve()
      .then(() => bridgeFn(...args))
      .catch(() => {
        warnOnce()
        return stubFn(...args)
      })

  const bridgeStorage = createBridgeStorage()
  const stubStorage = createStubStorage()
  const storage = {}
  for (const method of STORAGE_METHODS) storage[method] = wrap(bridgeStorage[method], stubStorage[method])

  const bridgeRequest = createBridgeRequest()
  const stubSend = createStubRequest()
  // 桩 request 是单函数形态（契约 §4 send 主体）；preview 的桩为纯本地渲染占位。
  const requestStub = {
    send: stubSend,
    preview: async (opts = {}) => ({ url: { resolved: String(opts.url ?? ''), missing: [] }, params: opts.params ?? [], headers: opts.headers ?? [], body: opts.body ?? null }),
  }
  const request = {}
  for (const method of REQUEST_METHODS) request[method] = wrap(bridgeRequest[method], requestStub[method])

  const bridgeServices = createBridgeServices()
  const stubServices = createStubServices()
  const api = { storage, request }
  for (const [ns, methods] of Object.entries(SERVICE_METHODS)) {
    api[ns] = {}
    for (const method of methods) api[ns][method] = wrap(bridgeServices[ns][method], stubServices[ns][method])
  }
  window.__postapiApi = api
  return api
}

export { POSTAPI_NS }
