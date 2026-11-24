/**
 * agent 工具实现体：让模型通过宿主 `ctx.tools.register` 暴露的工具直接建接口。
 * 纯函数 + 依赖注入（deps.storage / deps.importExport / deps.request），不碰文件系统，便于单测。
 * 注册接线在 src/host/index.js（lead 负责），本文件只导出 createAgentTool。
 *
 * 纪律：
 * - 每个 action 返回 { text: JSON 字符串（缩进 2）, isError? }，**绝不抛异常**；
 * - 参数校验失败 / 项目不存在 / 服务未接线一律 isError:true；
 * - 返回体不含完整 project（避免模型上下文被 endpoint body 撑爆）。
 */

/** 成功：统一 { ok:true, ...payload }。 */
function ok(payload) {
  return { text: JSON.stringify({ ok: true, ...payload }, null, 2) }
}

/** 失败：{ ok:false, error }，isError 置真。 */
function fail(error) {
  return { text: JSON.stringify({ ok: false, error: String(error) }, null, 2), isError: true }
}

/** 必填字符串参数：缺 / 非字符串 / 空串都算校验失败。 */
function requireString(args, key) {
  const v = args ? args[key] : undefined
  if (typeof v !== 'string' || v.trim() === '') throw new Error(`参数 ${key} 必填（非空字符串）`)
  return v.trim()
}

/** 可选字符串参数。 */
function optionalString(args, key) {
  const v = args ? args[key] : undefined
  if (v === undefined || v === null) return undefined
  return String(v)
}

/** 必填对象参数。 */
function requireObject(args, key) {
  const v = args ? args[key] : undefined
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error(`参数 ${key} 必填（对象）`)
  return v
}

/** endpoint 概要：列表/项目摘要统一用它，不带 body/auth/responses。 */
function endpointSummary(ep) {
  return {
    id: ep.id,
    name: ep.name,
    method: ep.method,
    url: ep.url,
    folderId: ep.folderId,
    status: ep.status,
    tags: Array.isArray(ep.tags) ? ep.tags : [],
  }
}

/** 默认环境：isDefault 优先，否则第一个。 */
function defaultEnvironment(project) {
  const envs = Array.isArray(project.environments) ? project.environments : []
  return envs.find((e) => e && e.isDefault) || envs[0] || null
}

/** url 与 baseUrl 拼接：绝对 url 原样返回，相对 url 挂到 baseUrl 下。 */
function resolveUrl(url, baseUrl) {
  const u = String(url || '')
  if (u === '') return u
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(u)) return u
  const base = String(baseUrl || '')
  if (base === '') return u
  return base.replace(/\/+$/, '') + '/' + u.replace(/^\/+/, '')
}

/**
 * 极简 YAML 子集解析：缩进映射 / 序列 / 标量 / | 与 > 块标量。
 * ponytail: 只覆盖 OpenAPI 文档常见写法（锚点、多文档、流式集合嵌套、复杂折叠不保证）。
 * 升级路径：需要完整 YAML 1.2 时换成 js-yaml，但那要新增依赖，当前纪律不允许。
 */
export function parseYamlSubset(text) {
  const items = []
  for (const line of String(text).replace(/\r\n?/g, '\n').split('\n')) {
    if (/^\s*(#.*)?$/.test(line)) continue
    if (/^\s*(---|\.\.\.)\s*$/.test(line)) continue
    if (/^\t/.test(line)) throw new Error('YAML 缩进不支持 tab，请改用空格')
    const indent = line.length - line.replace(/^ +/, '').length
    items.push({ indent, text: line.trim(), raw: line })
  }
  if (items.length === 0) throw new Error('YAML 内容为空')
  let pos = 0

  const bad = (msg) => {
    throw new Error('YAML 解析失败（第 ' + (pos + 1) + ' 个有效行）：' + msg)
  }

  function matchKey(line) {
    const m = /^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^:#]+?)\s*:(?:\s+(.*))?$/.exec(line)
    if (!m) return null
    let key = m[1].trim()
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
      key = key.slice(1, -1)
    }
    return { key, rest: m[2] === undefined ? '' : m[2].trim() }
  }

  function scalar(v) {
    const s = String(v).trim()
    if (s === '' || s === '~' || s === 'null') return null
    if (s === 'true') return true
    if (s === 'false') return false
    if (/^-?\d+$/.test(s)) return Number(s)
    if (/^-?\d*\.\d+$/.test(s)) return Number(s)
    if (s.length > 1 && ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))) {
      if (s.startsWith('"')) {
        try {
          return JSON.parse(s)
        } catch {
          return s.slice(1, -1)
        }
      }
      return s.slice(1, -1)
    }
    if (s.startsWith('[') || s.startsWith('{')) {
      try {
        return JSON.parse(s)
      } catch {
        return s
      }
    }
    return s
  }

  function blockScalar(parentIndent, marker) {
    const kept = []
    let blockIndent = -1
    while (pos < items.length && items[pos].indent > parentIndent) {
      if (blockIndent < 0) blockIndent = items[pos].indent
      kept.push(items[pos].raw.slice(blockIndent))
      pos += 1
    }
    return marker.startsWith('>') ? kept.join(' ') : kept.join('\n')
  }

  function parseSeq(indent) {
    const out = []
    while (pos < items.length && items[pos].indent === indent) {
      const t = items[pos].text
      if (!(t === '-' || t.startsWith('- '))) break
      const rest = t === '-' ? '' : t.slice(2).trim()
      pos += 1
      if (rest === '') {
        out.push(pos < items.length && items[pos].indent > indent ? parseNode(items[pos].indent) : null)
        continue
      }
      const inline = matchKey(rest)
      if (inline) {
        // "- key: value" 起头一个行内映射：插一条虚拟行，再按映射继续消费后续更深缩进行
        const virtualIndent = indent + 2
        items.splice(pos, 0, { indent: virtualIndent, text: rest, raw: ' '.repeat(virtualIndent) + rest })
        out.push(parseMap(virtualIndent))
        continue
      }
      out.push(scalar(rest))
    }
    return out
  }

  function parseMap(indent) {
    const out = {}
    while (pos < items.length) {
      const line = items[pos]
      if (line.indent < indent) break
      if (line.indent > indent) bad('缩进过深：' + line.text)
      const kv = matchKey(line.text)
      if (!kv) bad('不是 key: value 形式：' + line.text)
      pos += 1
      const { key, rest } = kv
      if (rest === '|' || rest === '>' || rest === '|-' || rest === '>-' || rest === '|+' || rest === '>+') {
        out[key] = blockScalar(indent, rest)
      } else if (rest === '') {
        const next = items[pos]
        if (next && next.indent > indent) out[key] = parseNode(next.indent)
        else if (next && next.indent === indent && (next.text === '-' || next.text.startsWith('- '))) out[key] = parseSeq(indent)
        else out[key] = null
      } else {
        out[key] = scalar(rest)
      }
    }
    return out
  }

  function parseNode(indent) {
    const cur = items[pos]
    if (!cur) return null
    if (cur.text === '-' || cur.text.startsWith('- ')) return parseSeq(indent)
    return parseMap(indent)
  }

  const root = parseNode(items[0].indent)
  if (pos < items.length) bad('存在未消费的剩余行：' + items[pos].text)
  return root
}

/** OpenAPI 文本 → 对象：先按 JSON 解析，失败再走 YAML 子集。 */
export function parseOpenApiText(text) {
  if (text && typeof text === 'object') return text
  const raw = String(text === undefined || text === null ? '' : text).trim()
  if (raw === '') throw new Error('参数 text 为空，需要 OpenAPI/Swagger 的 JSON 或 YAML 文本')
  if (raw.startsWith('{') || raw.startsWith('[')) {
    try {
      return JSON.parse(raw)
    } catch (err) {
      // 以 { 开头的也可能是 YAML 流式映射，继续尝试 YAML
      try {
        return parseYamlSubset(raw)
      } catch {
        throw new Error('文本既不是合法 JSON 也不是可解析的 YAML：' + (err && err.message))
      }
    }
  }
  return parseYamlSubset(raw)
}

/**
 * @param {{ storage: object, importExport?: object, request?: object }} deps
 * @returns {{ execute: (args: object) => Promise<{ text: string, isError?: boolean }> }}
 */
export function createAgentTool(deps) {
  const storage = deps && deps.storage
  const importExport = deps && deps.importExport
  const request = deps && deps.request

  /** 取项目：不存在 / storage 未接线都抛，由 execute 统一转 isError。 */
  async function loadProject(projectId) {
    if (!storage || typeof storage.getProject !== 'function') {
      throw new Error('storage 未接线（deps.storage.getProject 缺失）')
    }
    try {
      return await storage.getProject(projectId)
    } catch (err) {
      throw new Error(`项目不存在：${projectId}（${err && err.message ? err.message : err}）`)
    }
  }

  async function listProjects() {
    if (!storage || typeof storage.listProjects !== 'function') {
      throw new Error('storage 未接线（deps.storage.listProjects 缺失）')
    }
    const rows = await storage.listProjects()
    const projects = []
    for (const row of Array.isArray(rows) ? rows : []) {
      let endpointCount = 0
      try {
        const full = await storage.getProject(row.id)
        endpointCount = Array.isArray(full.endpoints) ? full.endpoints.length : 0
      } catch {
        // 单个项目读失败不影响整体列表（索引条目可能是脏的）
        endpointCount = 0
      }
      projects.push({ id: row.id, name: row.name, updatedAt: row.updatedAt, endpointCount })
    }
    return ok({ projects })
  }

  async function getProjectSummary(args) {
    const projectId = requireString(args, 'project_id')
    const project = await loadProject(projectId)
    const endpoints = Array.isArray(project.endpoints) ? project.endpoints : []
    const folders = Array.isArray(project.folders) ? project.folders : []
    const schemas = Array.isArray(project.schemas) ? project.schemas : []
    const environments = Array.isArray(project.environments) ? project.environments : []
    return ok({
      project: {
        id: project.id,
        name: project.name,
        description: project.description || '',
        updatedAt: project.updatedAt,
        counts: {
          folders: folders.length,
          endpoints: endpoints.length,
          schemas: schemas.length,
          environments: environments.length,
          mocks: Array.isArray(project.mocks) ? project.mocks.length : 0,
          testCases: Array.isArray(project.testCases) ? project.testCases.length : 0,
          testScenarios: Array.isArray(project.testScenarios) ? project.testScenarios.length : 0,
        },
        folders: folders.map((f) => ({ id: f.id, name: f.name, parentId: f.parentId, order: f.order })),
        endpoints: endpoints.map(endpointSummary),
        schemas: schemas.map((s) => ({ id: s.id, name: s.name, folderId: s.folderId })),
        environments: environments.map((e) => ({ id: e.id, name: e.name, baseUrl: e.baseUrl, isDefault: !!e.isDefault })),
        settings: project.settings || {},
      },
    })
  }

  async function createProject(args) {
    const name = requireString(args, 'name')
    if (!storage || typeof storage.createProject !== 'function') {
      throw new Error('storage 未接线（deps.storage.createProject 缺失）')
    }
    const created = await storage.createProject(name)
    // 顶层直接给 id/name：模型建完项目要立刻拿 id 去建接口，少一层嵌套少一次解析错
    return ok({
      id: created.id,
      name: created.name,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    })
  }

  async function listEndpoints(args) {
    const projectId = requireString(args, 'project_id')
    const project = await loadProject(projectId)
    const folderFilter = args && Object.prototype.hasOwnProperty.call(args, 'folder_id') ? args.folder_id : undefined
    const keyword = (optionalString(args, 'keyword') || '').trim().toLowerCase()
    let rows = Array.isArray(project.endpoints) ? project.endpoints : []
    if (folderFilter !== undefined) {
      const want = folderFilter === null || folderFilter === '' ? null : String(folderFilter)
      rows = rows.filter((ep) => (ep.folderId == null ? null : String(ep.folderId)) === want)
    }
    if (keyword !== '') {
      rows = rows.filter((ep) => {
        const hay = [ep.name, ep.url, ep.description].filter((v) => typeof v === 'string').map((v) => v.toLowerCase())
        return hay.some((v) => v.includes(keyword))
      })
    }
    return ok({ projectId, total: rows.length, endpoints: rows.map(endpointSummary) })
  }

  async function getEndpoint(args) {
    const projectId = requireString(args, 'project_id')
    const endpointId = requireString(args, 'endpoint_id')
    const project = await loadProject(projectId)
    const ep = (project.endpoints || []).find((e) => e.id === endpointId)
    if (!ep) throw new Error(`接口不存在：${endpointId}（项目 ${projectId}）`)
    return ok({ endpoint: ep })
  }

  async function createEndpoint(args) {
    const projectId = requireString(args, 'project_id')
    const input = requireObject(args, 'endpoint')
    const name = typeof input.name === 'string' ? input.name.trim() : ''
    if (name === '') throw new Error('参数 endpoint.name 必填（非空字符串）')
    await loadProject(projectId) // 先确认项目存在，错误信息里带 project id
    if (!storage || typeof storage.saveEndpoint !== 'function') {
      throw new Error('storage 未接线（deps.storage.saveEndpoint 缺失）')
    }
    // 新建不带 id：id/order/createdAt/updatedAt 由 storage 赋
    const payload = { ...input, name }
    delete payload.id
    delete payload.createdAt
    delete payload.updatedAt
    const saved = await storage.saveEndpoint(projectId, payload)
    return ok({ endpoint: saved })
  }

  async function updateEndpoint(args) {
    const projectId = requireString(args, 'project_id')
    const endpointId = requireString(args, 'endpoint_id')
    const patch = requireObject(args, 'patch')
    const project = await loadProject(projectId)
    const prev = (project.endpoints || []).find((e) => e.id === endpointId)
    if (!prev) throw new Error(`接口不存在：${endpointId}（项目 ${projectId}）`)
    if (!storage || typeof storage.saveEndpoint !== 'function') {
      throw new Error('storage 未接线（deps.storage.saveEndpoint 缺失）')
    }
    // 浅合并 patch：id/createdAt/updatedAt 由 storage 决定（保留 createdAt、刷新 updatedAt）
    const merged = { ...prev, ...patch, id: endpointId }
    delete merged.updatedAt
    const saved = await storage.saveEndpoint(projectId, merged)
    return ok({ endpoint: saved })
  }

  async function deleteEndpoint(args) {
    const projectId = requireString(args, 'project_id')
    const endpointId = requireString(args, 'endpoint_id')
    const project = await loadProject(projectId)
    const exists = (project.endpoints || []).some((e) => e.id === endpointId)
    if (!exists) throw new Error(`接口不存在：${endpointId}（项目 ${projectId}）`)
    if (!storage || typeof storage.deleteEndpoint !== 'function') {
      throw new Error('storage 未接线（deps.storage.deleteEndpoint 缺失）')
    }
    const res = await storage.deleteEndpoint(projectId, endpointId)
    return ok({ id: (res && res.id) || endpointId, projectId })
  }

  async function createFolder(args) {
    const projectId = requireString(args, 'project_id')
    const name = requireString(args, 'name')
    const parentRaw = optionalString(args, 'parent_id')
    const project = await loadProject(projectId)
    if (!storage || typeof storage.saveFolder !== 'function') {
      throw new Error('storage 未接线（deps.storage.saveFolder 缺失）')
    }
    const parentId = parentRaw === undefined || parentRaw === '' ? null : parentRaw
    // 父目录必须存在：否则模型会把目录挂到不存在的 id 上，前端树里直接丢节点
    if (parentId !== null && !(project.folders || []).some((f) => f.id === parentId)) {
      throw new Error(`父目录不存在：${parentId}（项目 ${projectId}）`)
    }
    const folder = await storage.saveFolder(projectId, { name, parentId })
    return ok({ folder })
  }

  async function importOpenapi(args) {
    const projectId = requireString(args, 'project_id')
    await loadProject(projectId)
    if (!importExport || typeof importExport.importOpenApi !== 'function') {
      throw new Error('importExport 未接线（deps.importExport.importOpenApi 缺失）')
    }
    if (!storage || typeof storage.importBundle !== 'function') {
      throw new Error('storage 未接线（deps.storage.importBundle 缺失）')
    }
    const doc = parseOpenApiText(args ? args.text : undefined)
    const bundle = importExport.importOpenApi(doc)
    const res = await storage.importBundle(projectId, bundle)
    return ok({
      projectId,
      folders: res.folders,
      endpoints: res.endpoints,
      schemas: res.schemas,
    })
  }

  async function sendRequest(args) {
    if (!request || typeof request.send !== 'function') {
      throw new Error('request 未接线（deps.request.send 缺失）')
    }
    const projectId = requireString(args, 'project_id')
    const project = await loadProject(projectId)
    const env = defaultEnvironment(project)
    let options
    if (args && args.request && typeof args.request === 'object') {
      // 直接给完整请求：仍补默认环境变量，方便 {{baseUrl}} 之类
      options = {
        ...args.request,
        variables: {
          globals: project.globals || { variables: [] },
          environment: env,
          local: {},
        },
      }
    } else {
      const endpointId = requireString(args, 'endpoint_id')
      const ep = (project.endpoints || []).find((e) => e.id === endpointId)
      if (!ep) throw new Error(`接口不存在：${endpointId}（项目 ${projectId}）`)
      if (!ep.url) throw new Error(`接口 ${endpointId} 的 url 为空，无法发送`)
      options = {
        method: ep.method,
        url: resolveUrl(ep.url, env && env.baseUrl),
        params: ep.params,
        headers: ep.headers,
        body: ep.body,
        auth: ep.auth,
        timeoutMs: (project.settings && project.settings.requestTimeoutMs) || 30000,
        variables: {
          globals: project.globals || { variables: [] },
          environment: env,
          local: {},
        },
      }
    }
    const res = await request.send(options)
    const body = res && res.body == null ? '' : String(res.body)
    return ok({
      status: res && res.status != null ? res.status : 0,
      statusText: (res && res.statusText) || '',
      timeMs: res && res.timeMs != null ? res.timeMs : 0,
      bodySize: res && res.bodySize != null ? res.bodySize : body.length,
      truncated: body.length > 4000,
      body: body.slice(0, 4000),
      error: res && res.error ? res.error : null,
      tests: Array.isArray(res && res.tests) ? res.tests : [],
    })
  }

  const handlers = {
    list_projects: listProjects,
    get_project: getProjectSummary,
    create_project: createProject,
    list_endpoints: listEndpoints,
    get_endpoint: getEndpoint,
    create_endpoint: createEndpoint,
    update_endpoint: updateEndpoint,
    delete_endpoint: deleteEndpoint,
    create_folder: createFolder,
    import_openapi: importOpenapi,
    send_request: sendRequest,
  }

  return {
    actions: Object.keys(handlers),
    async execute(args) {
      const a = args && typeof args === 'object' ? args : {}
      const action = typeof a.action === 'string' ? a.action.trim() : ''
      if (action === '') return fail('参数 action 必填，可选值：' + Object.keys(handlers).join(' / '))
      const handler = handlers[action]
      if (!handler) return fail('未知 action：' + action + '，可选值：' + Object.keys(handlers).join(' / '))
      try {
        return await handler(a)
      } catch (err) {
        // 所有异常都转成 isError 结果，工具调用永不抛
        return fail(err && err.message ? err.message : err)
      }
    },
  }
}
