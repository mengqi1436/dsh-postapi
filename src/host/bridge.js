/**
 * webServer prefix 桥：官方 web client 无法注入插件自定义 face（样板 inject 全为宿主内置 face），
 * 契约 §3 的 inject face 方案作废，改走 dsh-db-tool 同款 prefix 桥（0.2.x 生产验证）。
 * handlePostapiRequest(req, res, { storage, request, services })：全量路由 + {ok,data}/{ok:false,error,code} 响应形态。
 * 路由键统一为剥离 /api 前缀后的形式（GET /health、POST /storage/saveEndpoint ...），
 * /api/... 与 /dsh-postapi/api/... 两种请求形态归一化命中同一批路由。
 *
 * 契约 §5 全表：既有 11 条路由行为不变；新增 storage 扩展 / request.preview / script / mock /
 * schema / import / export / codegen / test / db 共 8 组。第三参 services 承载 host-data 与
 * host-runtime 的扩展服务（variables/sandbox/mock/runner/importExport/codegen/schema）；
 * 服务方法缺失时该路由返回 501 NOT_WIRED，绝不抛栈崩 handler——两个半边并行开发期必须如此。
 */
const MAX_JSON_BODY_BYTES = 2 * 1024 * 1024
const PREFIX = '/dsh-postapi/api'

function send(res, status, body) {
  if (!res.headersSent) res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

function sendOk(res, data) {
  send(res, 200, { ok: true, data })
}

function sendFail(res, status, code, error) {
  send(res, status, { ok: false, error, code })
}

/** JSON body 读取：2MB 上限、空 body 视为 {}、必须是 JSON 对象（形态同 db-tool readBody）。 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > MAX_JSON_BODY_BYTES) {
        reject(new Error('request body exceeds 2MB limit'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8').trim()
      if (text === '') return resolve({})
      try {
        const parsed = JSON.parse(text)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) resolve(parsed)
        else reject(new Error('request body must be a JSON object'))
      } catch {
        reject(new Error('request body is not valid JSON'))
      }
    })
    req.on('error', reject)
  })
}

function str(v) {
  return typeof v === 'string' ? v : ''
}

/** 项目 id 字段兼容：client 桥（registry.js）发 { id }，历史/文档形态发 { projectId }。 */
function projectIdOf(b) {
  return str(b.projectId) || str(b.id)
}

/** 兼容 /api/... 与 /dsh-postapi/api/... 两种请求形态，归一化出无 /api 前缀的 path 与 query。 */
function splitPath(url) {
  const u = new URL(url || '/', 'http://bridge.local')
  let p = u.pathname
  if (p.startsWith('/api/')) p = p.slice(4)
  else if (p.startsWith(PREFIX + '/')) p = p.slice(PREFIX.length)
  else if (p === '/api' || p === PREFIX) p = '/'
  return { path: p, search: u.searchParams }
}

/* ---------------- 桥级错误：带 HTTP 状态 + 错误码，由最外层 catch 统一转封套 ---------------- */

class BridgeError extends Error {
  constructor(status, code, message) {
    super(message)
    this.name = 'BridgeError'
    this.status = status
    this.code = code
  }
}

const badRequest = (message) => new BridgeError(400, 'INVALID_ARGUMENT', message)
const notWired = (message) => new BridgeError(501, 'NOT_WIRED', message)
const notImplemented = (message) => new BridgeError(501, 'NOT_IMPLEMENTED', message)

/** 取服务方法：对象或方法缺失一律 501 NOT_WIRED（并行开发期 storage/services 尚未补齐也不崩）。 */
function need(target, name, label) {
  if (!target || typeof target[name] !== 'function') {
    throw notWired((label || name) + ' 未接线（服务方法缺失）')
  }
  return target[name].bind(target)
}

/** projectId 取值：body 优先（POST），回落 query（GET 形态）。 */
function projectIdFrom(b, search) {
  const fromQuery = search && typeof search.get === 'function' ? str(search.get('projectId')) : ''
  return projectIdOf(b) || fromQuery
}

/** 必填 projectId 校验：缺失返回 400 INVALID_ARGUMENT（契约 §5）。 */
function requireProject(b, search) {
  const id = projectIdFrom(b, search)
  if (id === '') throw badRequest('projectId is required')
  return id
}

export async function handlePostapiRequest(req, res, { storage, request, services } = {}) {
  const svc = services || {}
  try {
    const { path: p, search } = splitPath(req.url)
    const method = (req.method || 'GET').toUpperCase()
    const key = method + ' ' + p

    if (key === 'GET /health') {
      return sendOk(res, { status: 'up' })
    }
    if (key === 'GET /storage/listProjects') {
      return sendOk(res, await storage.listProjects())
    }
    // POST 形态兼容（client 桥映射 POST /storage/getProject，body 携 projectId），与 GET query 形态同行为同返回
    if (key === 'GET /storage/getProject' || key === 'POST /storage/getProject') {
      const projectId = key.startsWith('POST ')
        ? projectIdOf(await readBody(req))
        : search.get('projectId') || ''
      if (projectId === '') return sendFail(res, 400, 'INVALID_ARGUMENT', 'projectId is required')
      return sendOk(res, await storage.getProject(projectId))
    }
    if (key === 'POST /request/send') {
      const body = await readBody(req)
      const result = await request.send(body)
      // 契约 §4：request 只回 raw，历史由 bridge 负责追加；追加失败不阻断本次发送结果。
      const projectId = projectIdOf(body)
      if (projectId !== '' && typeof storage.appendHistory === 'function') {
        try {
          await storage.appendHistory(projectId, {
            method: body.method || 'GET',
            url: (result && result.request && result.request.url) || body.url || '',
            status: result && result.status,
            timeMs: result && result.timeMs,
            bodySize: result && result.bodySize,
            request: (result && result.request) || {},
            response: {
              status: result && result.status,
              headers: (result && result.headers) || {},
              body: (result && result.body) || '',
            },
          })
        } catch {
          // 历史落盘失败不改变发送结果（契约 §4 只要求 raw 响应）
        }
      }
      return sendOk(res, result)
    }

    const body = method === 'POST' ? await readBody(req) : {}
    const routes = {
      'POST /storage/createProject': (b) => storage.createProject(str(b.name)),
      'POST /storage/renameProject': (b) => storage.renameProject(projectIdOf(b), str(b.name)),
      'POST /storage/deleteProject': (b) => storage.deleteProject(projectIdOf(b)),
      'POST /storage/saveEndpoint': (b) => storage.saveEndpoint(projectIdOf(b), b.endpoint),
      'POST /storage/deleteEndpoint': (b) => storage.deleteEndpoint(projectIdOf(b), str(b.endpointId)),
      'POST /storage/saveFolder': (b) => storage.saveFolder(projectIdOf(b), b.folder),
      'POST /storage/deleteFolder': (b) => storage.deleteFolder(projectIdOf(b), str(b.folderId)),
    }
    const route = routes[key]
    if (route) return sendOk(res, await route(body))

    /* ---------------- feature-matrix §4 新增路由（第三参 services 注入） ---------------- */

    // Mock 服务的响应转发入口：/mock/serve/<projectId>/<endpointId> 形态由 mock 服务内部处理。
    if (p.startsWith('/mock/serve/')) {
      const serve = need(svc.mock, 'serve', 'mock.serve')
      return sendOk(res, await serve({ path: p.slice('/mock/serve'.length), search, method, req }))
    }

    /**
     * storage 扩展路由统一入口：先校验 projectId（缺 → 400），再取服务方法（缺 → 501）。
     * @param name - storage 方法名（与 client 桥同名）。
     * @param argsOf - 由 projectId 拼出剩余实参（缺省无额外参数）。
     */
    const store = (name, b, s, argsOf) => {
      const projectId = requireProject(b, s)
      const rest = typeof argsOf === 'function' ? argsOf(projectId) : []
      return need(storage, name)(projectId, ...(Array.isArray(rest) ? rest : [rest]))
    }

    /** 导出类路由的 project 取用：body 直接带 project 优先，否则按 projectId 读盘。 */
    const projectOf = async (b, s) => {
      if (b.project && typeof b.project === 'object') return b.project
      return need(storage, 'getProject')(requireProject(b, s))
    }
    /** import 类入参：client 发 { json } 或 { text }，兼容旧形态 { data }。 */
    const payloadOf = (b) => (b.json !== undefined ? b.json : b.data !== undefined ? b.data : str(b.text))

    const newRoutes = {
      /* ---- storage 扩展（契约 §3，host-data 并行交付） ---- */
      // 校验顺序固定：先 requireProject（缺 → 400），再 need 取服务方法（缺 → 501），
      // 否则 callee 先求值会让「缺 projectId + 服务未接线」错报成 501。
      'POST /storage/moveNode': (b, s) => store('moveNode', b, s, (id) => ({
        kind: str(b.kind),
        id: str(b.id),
        parentId: b.parentId === undefined ? null : b.parentId,
        order: b.order,
      })),
      // 导入 bundle 原子落盘：body { projectId, bundle: { folders, endpoints, schemas } }
      'POST /storage/importBundle': (b, s) => store('importBundle', b, s, () => [b.bundle]),
      'POST /storage/saveSchema': (b, s) => store('saveSchema', b, s, (id) => [b.schema]),
      'POST /storage/deleteSchema': (b, s) => store('deleteSchema', b, s, () => [str(b.schemaId)]),
      'POST /storage/saveEnvironment': (b, s) => store('saveEnvironment', b, s, () => [b.environment]),
      'POST /storage/deleteEnvironment': (b, s) => store('deleteEnvironment', b, s, () => [str(b.envId)]),
      'POST /storage/saveGlobals': (b, s) => store('saveGlobals', b, s, () => [b.globals]),
      'POST /storage/saveProjectSettings': (b, s) => store('saveProjectSettings', b, s, () => [b.settings]),
      'POST /storage/saveFlow': (b, s) => store('saveFlow', b, s, () => [b.flow]),
      'POST /storage/saveResponse': (b, s) => store('saveResponse', b, s, () => [str(b.endpointId), b.response]),
      'POST /storage/deleteResponse': (b, s) => store('deleteResponse', b, s, () => [str(b.endpointId), str(b.responseId)]),
      // 历史：GET query 形态与 POST body 形态同行为（client 桥用 GET）
      'GET /storage/getHistory': (b, s) => store('getHistory', b, s),
      'POST /storage/getHistory': (b, s) => store('getHistory', b, s),
      'POST /storage/appendHistory': (b, s) => store('appendHistory', b, s, () => [b.entry]),
      'POST /storage/clearHistory': (b, s) => store('clearHistory', b, s),
      'GET /storage/search': (b, s) => store('search', b, s, () => [str(s.get('keyword') || s.get('q'))]),
      'POST /storage/search': (b, s) => store('search', b, s, () => [str(b.keyword)]),

      /* ---- request 预览（契约 §4：只渲染变量不发送） ---- */
      'POST /request/preview': async (b, s) => {
        if (request && typeof request.preview === 'function') return request.preview(b)
        const makeResolver = need(svc.variables, 'createVariableResolver', 'variables.createVariableResolver')
        const projectId = projectIdFrom(b, s)
        const project = projectId !== '' ? await need(storage, 'getProject')(projectId) : null
        const environments = (project && project.environments) || []
        const environment = b.environment
          || environments.find((e) => e && e.id === str(b.environmentId))
          || environments.find((e) => e && e.isDefault)
          || null
        const resolver = makeResolver({
          globals: b.globals || (project && project.globals) || null,
          environment,
          local: b.local || null,
        })
        const resolveText = (v) => resolver.resolve(v == null ? '' : String(v))
        const explainText = (v) => (typeof resolver.explain === 'function'
          ? resolver.explain(v == null ? '' : String(v))
          : { resolved: resolveText(v), missing: [] })
        return {
          url: explainText(b.url),
          params: (Array.isArray(b.params) ? b.params : []).map((x) => (
            x && typeof x === 'object' ? { ...x, value: resolveText(x.value) } : x
          )),
          headers: (Array.isArray(b.headers) ? b.headers : []).map((x) => (
            x && typeof x === 'object' ? { ...x, value: resolveText(x.value) } : x
          )),
          body: b.body && typeof b.body === 'object'
            ? { ...b.body, content: resolveText(b.body.content) }
            : (b.body === undefined ? null : b.body),
        }
      },

      /* ---- 脚本沙箱（契约 §4） ---- */
      'POST /script/run': (b) => need(svc.sandbox, 'runScript')(str(b.code), {
        context: b.context && typeof b.context === 'object' ? b.context : {},
        timeoutMs: Number.isFinite(b.timeoutMs) ? b.timeoutMs : 3000,
      }),

      /* ---- 本地 Mock 服务（契约 §4） ---- */
      'POST /mock/start': (b) => need(svc.mock, 'start')(Number.isFinite(b.port) ? b.port : undefined),
      'POST /mock/stop': () => need(svc.mock, 'stop')(),
      'POST /mock/status': () => need(svc.mock, 'status')(),

      /* ---- Schema 示例生成与校验（services.schema 优先，缺失走内置最小实现） ---- */
      'POST /schema/example': (b) => (svc.schema && typeof svc.schema.example === 'function'
        ? svc.schema.example(b)
        : { example: schemaExampleOf(b.schema) }),
      'POST /schema/validate': (b) => (svc.schema && typeof svc.schema.validate === 'function'
        ? svc.schema.validate(b)
        : schemaValidateOf(b.schema, b.data)),

      /* ---- 导入（契约 §4，host-data import-export.js） ---- */
      'POST /import/openapi': (b) => need(svc.importExport, 'importOpenApi')(payloadOf(b)),
      'POST /import/postman': (b) => need(svc.importExport, 'importPostman')(payloadOf(b)),
      'POST /import/har': (b) => need(svc.importExport, 'importHar')(payloadOf(b)),
      'POST /import/curl': (b) => need(svc.importExport, 'importCurl')(str(b.text) || str(b.curl)),

      /* ---- 导出（契约 §4） ---- */
      'POST /export/openapi': async (b, s) => need(svc.importExport, 'exportOpenApi')(await projectOf(b, s)),
      'POST /export/postman': async (b, s) => need(svc.importExport, 'exportPostman')(await projectOf(b, s)),
      'POST /export/har': async (b, s) => need(svc.importExport, 'exportHar')(await projectOf(b, s)),
      'POST /export/markdown': async (b, s) => need(svc.importExport, 'exportMarkdown')(await projectOf(b, s)),

      /* ---- 代码生成（契约 §4） ---- */
      'POST /codegen/run': (b) => need(svc.codegen, 'generateCode')({
        endpoint: b.endpoint,
        env: b.env || b.environment || null,
        lang: str(b.lang) || 'curl',
      }),

      /* ---- 自动化测试（契约 §4） ---- */
      'POST /test/runCase': (b, s) => {
        const projectId = requireProject(b, s)
        return need(svc.runner, 'runCase')(projectId, str(b.caseId))
      },
      'POST /test/runScenario': (b, s) => {
        const projectId = requireProject(b, s)
        return need(svc.runner, 'runScenario')(projectId, str(b.scenarioId))
      },

      /* ---- 数据库操作（feature-matrix P2：只留路由位，固定 501） ---- */
      'POST /db/test': () => { throw notImplemented('数据库操作规划中（feature-matrix P2）') },
      'POST /db/query': () => { throw notImplemented('数据库操作规划中（feature-matrix P2）') },
      'POST /db/close': () => { throw notImplemented('数据库操作规划中（feature-matrix P2）') },
    }
    const newRoute = newRoutes[key]
    if (newRoute) return sendOk(res, await newRoute(body, search))

    return sendFail(res, 404, 'NOT_FOUND', 'no route: ' + key)
  } catch (e) {
    // 契约 §5：400 参数错误 / 501 服务未接线 / 500 其余异常，统一转 JSON 封套
    if (e instanceof BridgeError) return sendFail(res, e.status, e.code, e.message)
    return sendFail(res, 500, 'INTERNAL', e && e.message ? e.message : String(e))
  }
}

/* ---------------- schema 内置最小实现（services.schema 未接线时兜底，页面不因此报错） ---------------- */

/** 由 JSON Schema 生成示例值（example/default/enum/oneOf/anyOf + 七种 type，深度上限 12）。 */
export function schemaExampleOf(schema, depth = 0) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema) || depth > 12) return null
  if (schema.example !== undefined) return schema.example
  if (schema.default !== undefined) return schema.default
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[0]
  if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) return schemaExampleOf(schema.oneOf[0], depth + 1)
  if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) return schemaExampleOf(schema.anyOf[0], depth + 1)
  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type
  if (type === 'object' || (type === undefined && schema.properties)) {
    const out = {}
    for (const [k, sub] of Object.entries(schema.properties || {})) out[k] = schemaExampleOf(sub, depth + 1)
    return out
  }
  if (type === 'array' || (type === undefined && schema.items)) return [schemaExampleOf(schema.items || {}, depth + 1)]
  if (type === 'string') {
    if (schema.format === 'date-time') return '2024-01-01T00:00:00.000Z'
    if (schema.format === 'date') return '2024-01-01'
    if (schema.format === 'email') return 'user@example.com'
    if (schema.format === 'uri' || schema.format === 'url') return 'https://example.com'
    return ''
  }
  if (type === 'integer' || type === 'number') return 0
  if (type === 'boolean') return true
  if (type === 'null') return null
  return null
}

/** 轻量 JSON Schema 校验：未给 data 只校验 schema 结构；给了 data 追加 type/required 命中。 */
export function schemaValidateOf(schema, data) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    return { ok: false, message: 'schema 必须是 JSON 对象' }
  }
  if (data === undefined) {
    const known = [undefined, 'object', 'array', 'string', 'number', 'integer', 'boolean', 'null']
    const list = Array.isArray(schema.type) ? schema.type : [schema.type]
    const bad = list.find((t) => !known.includes(t))
    if (bad !== undefined) return { ok: false, message: '未知 type: ' + bad }
    if (schema.properties !== undefined
      && (typeof schema.properties !== 'object' || schema.properties === null || Array.isArray(schema.properties))) {
      return { ok: false, message: 'properties 必须是对象' }
    }
    if (schema.required !== undefined && !Array.isArray(schema.required)) {
      return { ok: false, message: 'required 必须是数组' }
    }
    return { ok: true, message: 'schema 结构合法' }
  }
  const check = (sch, value, at) => {
    if (!sch || typeof sch !== 'object') return null
    const type = Array.isArray(sch.type) ? sch.type[0] : sch.type
    const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value
    const okType = type === undefined
      || type === actual
      || (type === 'number' && actual === 'number')
      || (type === 'integer' && actual === 'number' && Number.isInteger(value))
    if (!okType) return at + ': 期望 ' + type + '，实际 ' + actual
    if (type === 'object' || sch.properties) {
      for (const key of Array.isArray(sch.required) ? sch.required : []) {
        if (value === null || value === undefined || value[key] === undefined) return at + '.' + key + ': 必填缺失'
      }
      for (const [key, sub] of Object.entries(sch.properties || {})) {
        if (value && value[key] !== undefined) {
          const err = check(sub, value[key], at + '.' + key)
          if (err) return err
        }
      }
    }
    if ((type === 'array' || sch.items) && Array.isArray(value) && sch.items) {
      for (let i = 0; i < value.length; i += 1) {
        const err = check(sch.items, value[i], at + '[' + i + ']')
        if (err) return err
      }
    }
    return null
  }
  const err = check(schema, data, '$')
  return err ? { ok: false, message: err } : { ok: true, message: '校验通过' }
}