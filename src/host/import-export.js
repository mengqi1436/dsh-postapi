/**
 * 导入导出（契约 §3 / feature-matrix 14、15）：全部纯函数，不落盘、不依赖 storage。
 * 导入返回 { folders, endpoints, schemas } 骨架（id 稳定且可预测，便于重复导入幂等）；
 * 导出返回可 JSON.stringify 的对象或 Markdown 字符串。
 */

/** 导入产物里的稳定 id：前缀 + 三位序号（重复导入同一文档得到同一批 id）。 */
function seqId(prefix, i) {
  return prefix + String(i + 1).padStart(3, '0')
}

function str(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v)
}

function asArray(v) {
  return Array.isArray(v) ? v : []
}

/** baseUrl 与 path 拼接：单斜杠归一，baseUrl 为空则原样返回 path。 */
export function joinUrl(base, p) {
  const b = str(base).replace(/\/+$/, '')
  const path = str(p)
  if (b === '') return path
  return b + (path.startsWith('/') ? path : '/' + path)
}

const EMPTY_ENDPOINT = {
  folderId: null,
  order: 0,
  protocol: 'http',
  method: 'GET',
  url: '',
  params: [],
  pathParams: [],
  headers: [],
  cookies: [],
  body: { type: 'none', content: '', schema: null, examples: [] },
  auth: { type: 'none', token: '', username: '', password: '', key: '', value: '', addTo: 'header' },
  responses: [],
  preProcessors: [],
  postProcessors: [],
  mock: { enabled: false, delayMs: 0, rules: [] },
  description: '',
  tags: [],
  status: 'developing',
}

/** 导入骨架统一出口：补全 endpoint 默认字段，避免下游页面拿不到结构。 */
function makeEndpoint(patch) {
  const p = patch || {}
  return {
    ...EMPTY_ENDPOINT,
    ...p,
    body: { ...EMPTY_ENDPOINT.body, ...(p.body || {}) },
    auth: { ...EMPTY_ENDPOINT.auth, ...(p.auth || {}) },
    mock: { ...EMPTY_ENDPOINT.mock, ...(p.mock || {}) },
  }
}

/** 参数行统一形态（契约 §2.2 params/pathParams/headers/cookies 同构）。 */
function makeParam(key, value, extra) {
  const e = extra || {}
  return {
    key: str(key),
    value: str(value),
    enabled: e.enabled === undefined ? true : !!e.enabled,
    description: str(e.description),
    required: !!e.required,
    type: str(e.type) || 'string',
  }
}

function looksJson(text) {
  const t = str(text).trim()
  if (t === '') return false
  try {
    JSON.parse(t)
    return true
  } catch {
    return false
  }
}

/* ── 导入：OpenAPI 3 / Swagger 2 ───────────────────────────────────────── */

const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace']

function schemaToBodyType(contentType) {
  const ct = str(contentType).toLowerCase()
  if (ct.includes('json')) return 'json'
  if (ct.includes('x-www-form-urlencoded')) return 'urlencoded'
  if (ct.includes('multipart/form-data')) return 'form'
  if (ct.includes('xml')) return 'xml'
  if (ct.includes('graphql')) return 'graphql'
  if (ct === '') return 'none'
  return 'raw'
}

function exampleOf(media) {
  const m = media || {}
  if (m.example !== undefined) return m.example
  const ex = m.examples && typeof m.examples === 'object' ? Object.values(m.examples)[0] : undefined
  if (ex && typeof ex === 'object' && ex.value !== undefined) return ex.value
  return undefined
}

/** 从 parameters 拆出 pathParams/params/headers/cookies。 */
function splitParameters(parameters) {
  const out = { pathParams: [], params: [], headers: [], cookies: [] }
  for (const raw of asArray(parameters)) {
    const p = raw && typeof raw === 'object' ? raw : {}
    const name = p.name
    if (!name) continue
    const schema = p.schema && typeof p.schema === 'object' ? p.schema : {}
    const value = p.example !== undefined
      ? p.example
      : (schema.example !== undefined ? schema.example : (schema.default !== undefined ? schema.default : ''))
    const row = makeParam(name, value, {
      description: p.description,
      required: p.required,
      type: schema.type,
    })
    const where = str(p.in)
    if (where === 'path') out.pathParams.push(row)
    else if (where === 'header') out.headers.push(row)
    else if (where === 'cookie') out.cookies.push(row)
    else out.params.push(row)
  }
  return out
}

function buildRequestBody(requestBody) {
  const rb = requestBody && typeof requestBody === 'object' ? requestBody : null
  if (!rb || !rb.content || typeof rb.content !== 'object') {
    return { type: 'none', content: '', schema: null, examples: [] }
  }
  const entries = Object.entries(rb.content)
  if (entries.length === 0) return { type: 'none', content: '', schema: null, examples: [] }
  const [contentType, media] = entries[0]
  const type = schemaToBodyType(contentType)
  const example = exampleOf(media)
  const schema = media && media.schema ? media.schema : null
  const content = example !== undefined
    ? (typeof example === 'string' ? example : JSON.stringify(example, null, 2))
    : (schema ? JSON.stringify(schema, null, 2) : '')
  return { type, content, schema, examples: [] }
}

function buildResponses(responses) {
  const out = []
  if (!responses || typeof responses !== 'object') return out
  let i = 0
  for (const [code, raw] of Object.entries(responses)) {
    const r = raw && typeof raw === 'object' ? raw : {}
    const contentObj = r.content && typeof r.content === 'object' ? r.content : null
    const first = contentObj ? Object.entries(contentObj)[0] : null
    const contentType = first ? first[0] : 'application/json'
    const media = first ? (first[1] || {}) : {}
    const example = exampleOf(media)
    out.push({
      id: seqId('res_', i),
      name: str(r.description) || ('响应 ' + code),
      code: Number.isNaN(Number(code)) ? 200 : Number(code),
      contentType,
      body: example !== undefined
        ? (typeof example === 'string' ? example : JSON.stringify(example, null, 2))
        : (media.schema ? JSON.stringify(media.schema, null, 2) : ''),
      schema: media.schema || null,
      headers: [],
      enabled: true,
      isDefault: i === 0,
    })
    i += 1
  }
  return out
}

/**
 * OpenAPI 3.x / Swagger 2.0 → { folders, endpoints, schemas }。
 * tags 生成目录（folderId 指向），components.schemas（或 definitions）生成数据模型。
 */
export function importOpenApi(json) {
  const doc = json && typeof json === 'object' ? json : {}
  const isV3 = doc.openapi !== undefined
  const servers = isV3
    ? asArray(doc.servers)
    : (doc.host
      ? [{ url: (asArray(doc.schemes)[0] ? str(doc.schemes[0]) + '://' : 'https://') + str(doc.host) + str(doc.basePath) }]
      : [])
  const baseUrl = servers.length > 0 && servers[0] && typeof servers[0] === 'object'
    ? str(servers[0].url)
    : ''

  // tags → 目录（同名 tag 复用一个目录）
  const folders = []
  const folderIdByTag = new Map()
  for (const t of asArray(doc.tags)) {
    const name = t && typeof t === 'object' ? str(t.name) : str(t)
    if (name === '' || folderIdByTag.has(name)) continue
    const id = seqId('fld_', folders.length)
    folders.push({ id, name, parentId: null, order: folders.length })
    folderIdByTag.set(name, id)
  }

  const endpoints = []
  const paths = doc.paths && typeof doc.paths === 'object' ? doc.paths : {}
  for (const [rawPath, pathItem] of Object.entries(paths)) {
    const item = pathItem && typeof pathItem === 'object' ? pathItem : {}
    for (const method of HTTP_METHODS) {
      const op = item[method]
      if (!op || typeof op !== 'object') continue
      const groups = splitParameters([...asArray(item.parameters), ...asArray(op.parameters)])
      const tags = asArray(op.tags).map(str).filter(Boolean)
      const folderTag = tags.find((t) => folderIdByTag.has(t))
      endpoints.push(makeEndpoint({
        id: seqId('ep_', endpoints.length),
        name: str(op.summary) || str(op.operationId) || (method.toUpperCase() + ' ' + rawPath),
        folderId: folderTag ? folderIdByTag.get(folderTag) : null,
        order: endpoints.length,
        method: method.toUpperCase(),
        url: joinUrl(baseUrl, rawPath),
        params: groups.params,
        pathParams: groups.pathParams,
        headers: groups.headers,
        cookies: groups.cookies,
        body: buildRequestBody(op.requestBody),
        responses: buildResponses(op.responses),
        description: str(op.description) || str(op.summary),
        tags,
      }))
    }
  }

  const schemaSource = isV3
    ? ((doc.components && doc.components.schemas) || {})
    : (doc.definitions || {})
  const schemas = Object.entries(schemaSource).map(([name, jsonSchema], i) => ({
    id: seqId('sch_', i),
    name,
    folderId: null,
    jsonSchema: jsonSchema && typeof jsonSchema === 'object' ? jsonSchema : {},
    description: str(jsonSchema && jsonSchema.description),
  }))

  return { folders, endpoints, schemas }
}

/* ── 导入：Postman collection v2.1 ─────────────────────────────────────── */

function postmanUrlParts(url) {
  if (typeof url === 'string') return { raw: url, query: [] }
  const u = url && typeof url === 'object' ? url : {}
  const host = Array.isArray(u.host) ? u.host.join('.') : str(u.host)
  const pathPart = Array.isArray(u.path)
    ? '/' + u.path.map((p) => (p && typeof p === 'object' ? str(p.value) : str(p))).join('/')
    : ''
  const raw = str(u.raw) || ((u.protocol ? str(u.protocol) + '://' : '') + host + pathPart)
  return { raw, query: asArray(u.query) }
}

function postmanBody(body) {
  const b = body && typeof body === 'object' ? body : null
  if (!b) return { type: 'none', content: '', schema: null, examples: [] }
  const mode = str(b.mode)
  if (mode === 'raw') {
    const lang = b.options && b.options.raw && b.options.raw.language ? str(b.options.raw.language) : ''
    let type = 'raw'
    if (lang === 'json' || (lang === '' && looksJson(b.raw))) type = 'json'
    else if (lang === 'xml') type = 'xml'
    return { type, content: str(b.raw), schema: null, examples: [] }
  }
  if (mode === 'urlencoded') {
    return {
      type: 'urlencoded',
      content: JSON.stringify(asArray(b.urlencoded).map((r) => ({ key: str(r && r.key), value: str(r && r.value) }))),
      schema: null,
      examples: [],
    }
  }
  if (mode === 'formdata') {
    return {
      type: 'form',
      content: JSON.stringify(asArray(b.formdata).map((r) => ({ key: str(r && r.key), value: str(r && r.value) }))),
      schema: null,
      examples: [],
    }
  }
  if (mode === 'file') return { type: 'binary', content: '', schema: null, examples: [] }
  if (mode === 'graphql') {
    return {
      type: 'graphql',
      content: JSON.stringify({ query: str(b.graphql && b.graphql.query), variables: str(b.graphql && b.graphql.variables) }),
      schema: null,
      examples: [],
    }
  }
  return { type: 'none', content: '', schema: null, examples: [] }
}

function postmanAuth(auth) {
  const a = auth && typeof auth === 'object' ? auth : null
  if (!a || !a.type) return { ...EMPTY_ENDPOINT.auth }
  const pick = (key) => {
    const row = asArray(a[a.type]).find((r) => r && r.key === key)
    return row ? str(row.value) : ''
  }
  const type = str(a.type)
  if (type === 'bearer') return { ...EMPTY_ENDPOINT.auth, type: 'bearer', token: pick('token') }
  if (type === 'basic') return { ...EMPTY_ENDPOINT.auth, type: 'basic', username: pick('username'), password: pick('password') }
  if (type === 'apikey') {
    return { ...EMPTY_ENDPOINT.auth, type: 'apikey', key: pick('key'), value: pick('value'), addTo: pick('in') === 'query' ? 'query' : 'header' }
  }
  if (type === 'oauth2') return { ...EMPTY_ENDPOINT.auth, type: 'oauth2', token: pick('accessToken') }
  return { ...EMPTY_ENDPOINT.auth }
}

/**
 * Postman v2.1 → { folders, endpoints, schemas: [] }。
 * 标准层级：collection 名 → 根目录（parentId null），item 树递归挂在它下面；
 * item 含 request 的当接口，含 item 的当目录。order 是同级内序号（不是全局序号），
 * folders 数组保持先序（父目录必在子目录之前），便于按序落盘。
 */
export function importPostman(json) {
  const collection = json && typeof json === 'object'
    ? (json.collection && typeof json.collection === 'object' ? json.collection : json)
    : {}
  const folders = []
  const endpoints = []
  // 空集合（无 item 且无 info.name）不造根目录，保持「无内容 → 空结构」的边界语义
  const rootName = str(collection.info && collection.info.name)
  if (rootName === '' && asArray(collection.item).length === 0) {
    return { folders: [], endpoints: [], schemas: [] }
  }
  // 根目录：collection.info.name（缺失时给中性名），让导入结果始终有唯一的项目级分组
  const rootId = seqId('fld_', 0)
  folders.push({ id: rootId, name: rootName || '导入的 Collection', parentId: null, order: 0 })

  /** 同级序号：按父目录分别计数，子目录与接口各自独立递增。 */
  const walk = (items, parentId) => {
    let folderOrder = 0
    let endpointOrder = 0
    for (const raw of asArray(items)) {
      const item = raw && typeof raw === 'object' ? raw : {}
      const name = str(item.name)
      if (item.request && typeof item.request === 'object') {
        const req = item.request
        const parts = postmanUrlParts(req.url)
        const headers = asArray(req.header).map((h) => makeParam(h && h.key, h && h.value, {
          enabled: !(h && h.disabled),
          description: h && h.description,
        }))
        const params = parts.query.map((q) => makeParam(q && q.key, q && q.value, {
          enabled: !(q && q.disabled),
          description: q && q.description,
        }))
        const responses = asArray(item.response).map((r, i) => ({
          id: seqId('res_', i),
          name: str(r && r.name) || ('响应 ' + str(r && r.code)),
          code: Number(str(r && r.code)) || 200,
          contentType: (() => {
            const h = asArray(r && r.header).find((x) => str(x && x.key).toLowerCase() === 'content-type')
            return h ? str(h.value) : 'application/json'
          })(),
          body: str(r && r.body),
          schema: null,
          headers: asArray(r && r.header).map((h) => makeParam(h && h.key, h && h.value)),
          enabled: true,
          isDefault: i === 0,
        }))
        endpoints.push(makeEndpoint({
          id: seqId('ep_', endpoints.length),
          name: name || ((str(req.method) || 'GET').toUpperCase() + ' ' + parts.raw),
          folderId: parentId,
          order: endpointOrder++,
          method: (str(req.method) || 'GET').toUpperCase(),
          url: parts.raw,
          params,
          headers,
          body: postmanBody(req.body),
          auth: postmanAuth(req.auth),
          description: str(req.description),
          responses,
        }))
        continue
      }
      if (Array.isArray(item.item)) {
        const id = seqId('fld_', folders.length)
        folders.push({ id, name, parentId, order: folderOrder++ })
        walk(item.item, id)
      }
    }
  }

  walk(collection.item, rootId)
  return { folders, endpoints, schemas: [] }
}

/* ── 导入：HAR ─────────────────────────────────────────────────────────── */

/** HAR log.entries → { folders: [], endpoints, schemas: [] }（每条 entry 一个接口，method+path 去重）。 */
export function importHar(json) {
  const doc = json && typeof json === 'object' ? json : {}
  const entries = asArray(doc.log && doc.log.entries)
  const endpoints = []
  const seen = new Set()
  for (const raw of entries) {
    const entry = raw && typeof raw === 'object' ? raw : {}
    const req = entry.request && typeof entry.request === 'object' ? entry.request : {}
    const res = entry.response && typeof entry.response === 'object' ? entry.response : {}
    const url = str(req.url)
    if (url === '') continue
    let pathname = url
    try {
      pathname = new URL(url).pathname
    } catch {
      // 非绝对 URL 时保留原串
    }
    const method = (str(req.method) || 'GET').toUpperCase()
    const key = method + ' ' + pathname
    if (seen.has(key)) continue
    seen.add(key)
    const content = res.content && typeof res.content === 'object' ? res.content : {}
    const postData = req.postData && typeof req.postData === 'object' ? req.postData : null
    endpoints.push(makeEndpoint({
      id: seqId('ep_', endpoints.length),
      name: method + ' ' + pathname,
      order: endpoints.length,
      method,
      url,
      params: asArray(req.queryString).map((q) => makeParam(q && q.name, q && q.value)),
      headers: asArray(req.headers)
        .filter((h) => h && !str(h.name).startsWith(':'))
        .map((h) => makeParam(h && h.name, h && h.value)),
      body: postData
        ? { type: looksJson(postData.text) ? 'json' : 'raw', content: str(postData.text), schema: null, examples: [] }
        : { type: 'none', content: '', schema: null, examples: [] },
      description: str(res.statusText),
      responses: [{
        id: seqId('res_', 0),
        name: 'HAR 记录响应',
        code: Number(res.status) || 200,
        contentType: str(content.mimeType) || 'application/json',
        body: str(content.text),
        schema: null,
        headers: asArray(res.headers).map((h) => makeParam(h && h.name, h && h.value)),
        enabled: true,
        isDefault: true,
      }],
    }))
  }
  return { folders: [], endpoints, schemas: [] }
}

/* ── 导入：cURL ────────────────────────────────────────────────────────── */

/** 按 shell 规则切分参数（支持单/双引号与反斜杠续行）。 */
function splitCurlArgs(text) {
  const s = str(text).replace(/\\\r?\n/g, ' ')
  const args = []
  let cur = ''
  let quote = ''
  let started = false
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i]
    if (quote !== '') {
      if (ch === quote) quote = ''
      else if (ch === '\\' && quote === '"' && i + 1 < s.length) {
        cur += s[i + 1]
        i += 1
      } else cur += ch
      continue
    }
    if (ch === "'" || ch === '"') {
      quote = ch
      started = true
      continue
    }
    if (/\s/.test(ch)) {
      if (started) {
        args.push(cur)
        cur = ''
        started = false
      }
      continue
    }
    cur += ch
    started = true
  }
  if (started) args.push(cur)
  return args
}

/**
 * cURL 命令 → endpoint 骨架。支持 -X/--request、-H/--header、-d/--data*、-u/--user、
 * -F/--form、--url、-G（data 转 query）、以及任意位置的首个 URL。
 */
export function importCurl(text) {
  const args = splitCurlArgs(text)
  let method = ''
  let url = ''
  const headers = []
  const dataParts = []
  const formParts = []
  let user = ''
  let toQuery = false

  const takeValue = (i) => (i + 1 < args.length ? args[i + 1] : '')
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i]
    if (a === 'curl') continue
    if (a === '-X' || a === '--request') {
      method = takeValue(i).toUpperCase()
      i += 1
      continue
    }
    if (a === '-H' || a === '--header') {
      const raw = takeValue(i)
      i += 1
      const idx = raw.indexOf(':')
      if (idx > 0) headers.push(makeParam(raw.slice(0, idx).trim(), raw.slice(idx + 1).trim()))
      continue
    }
    if (a === '-d' || a === '--data' || a === '--data-raw' || a === '--data-binary' || a === '--data-ascii') {
      dataParts.push(takeValue(i))
      i += 1
      continue
    }
    if (a === '-F' || a === '--form') {
      const raw = takeValue(i)
      i += 1
      const idx = raw.indexOf('=')
      if (idx > 0) formParts.push({ key: raw.slice(0, idx), value: raw.slice(idx + 1) })
      continue
    }
    if (a === '-u' || a === '--user') {
      user = takeValue(i)
      i += 1
      continue
    }
    if (a === '--url') {
      url = takeValue(i)
      i += 1
      continue
    }
    if (a === '-G' || a === '--get') {
      toQuery = true
      continue
    }
    if (a.startsWith('-')) continue
    if (url === '') url = a
  }

  const data = dataParts.join('&')
  let params = []
  let baseUrl = url
  try {
    const u = new URL(url)
    params = [...u.searchParams.entries()].map(([k, v]) => makeParam(k, v))
    baseUrl = u.origin + u.pathname
  } catch {
    const qi = url.indexOf('?')
    if (qi >= 0) {
      baseUrl = url.slice(0, qi)
      params = url.slice(qi + 1).split('&').filter(Boolean).map((pair) => {
        const [k, v] = pair.split('=')
        return makeParam(decodeURIComponent(k || ''), decodeURIComponent(v || ''))
      })
    }
  }
  if (toQuery && data !== '') {
    for (const pair of data.split('&').filter(Boolean)) {
      const [k, v] = pair.split('=')
      params.push(makeParam(decodeURIComponent(k || ''), decodeURIComponent(v || '')))
    }
  }

  let body = { type: 'none', content: '', schema: null, examples: [] }
  if (formParts.length > 0) {
    body = { type: 'form', content: JSON.stringify(formParts), schema: null, examples: [] }
  } else if (data !== '' && !toQuery) {
    const ct = headers.find((h) => h.key.toLowerCase() === 'content-type')
    const ctValue = ct ? ct.value.toLowerCase() : ''
    let type = 'raw'
    if (looksJson(data) || ctValue.includes('json')) type = 'json'
    else if (ctValue.includes('x-www-form-urlencoded')) type = 'urlencoded'
    else if (ctValue.includes('xml')) type = 'xml'
    body = { type, content: data, schema: null, examples: [] }
  }

  let auth = { ...EMPTY_ENDPOINT.auth }
  if (user !== '') {
    const idx = user.indexOf(':')
    auth = {
      ...auth,
      type: 'basic',
      username: idx >= 0 ? user.slice(0, idx) : user,
      password: idx >= 0 ? user.slice(idx + 1) : '',
    }
  }

  if (method === '') {
    if (toQuery) method = 'GET'
    else if (body.type !== 'none') method = 'POST'
    else method = 'GET'
  }

  let name = baseUrl
  try {
    name = new URL(baseUrl).pathname
  } catch {
    // 保留原串
  }

  return makeEndpoint({
    id: seqId('ep_', 0),
    name: name || (method + ' ' + baseUrl),
    method,
    url: baseUrl,
    params,
    headers,
    body,
    auth,
  })
}

/* ── 导出 ──────────────────────────────────────────────────────────────── */

function defaultEnvironment(project) {
  const envs = asArray(project && project.environments)
  return envs.find((e) => e && e.isDefault) || envs[0] || null
}

/** endpoint.url → OpenAPI path（绝对 URL 取 pathname，相对串原样）。 */
function toOpenApiPath(url, baseUrl) {
  const raw = str(url)
  const base = str(baseUrl).replace(/\/+$/, '')
  if (base !== '' && raw.startsWith(base)) return raw.slice(base.length) || '/'
  try {
    const u = new URL(raw)
    return u.pathname || '/'
  } catch {
    return raw.startsWith('/') ? raw : '/' + raw
  }
}

function paramToOpenApi(row, where) {
  const p = row && typeof row === 'object' ? row : {}
  if (str(p.key) === '') return null
  const schema = { type: str(p.type) || 'string' }
  const out = {
    name: str(p.key),
    in: where,
    required: where === 'path' ? true : !!p.required,
    schema,
  }
  if (str(p.description) !== '') out.description = str(p.description)
  if (str(p.value) !== '') {
    if (schema.type === 'number' || schema.type === 'integer') out.example = Number(p.value)
    else if (schema.type === 'boolean') out.example = p.value === 'true'
    else out.example = str(p.value)
  }
  return out
}

function bodyToOpenApi(body) {
  const b = body && typeof body === 'object' ? body : {}
  const type = str(b.type) || 'none'
  if (type === 'none') return null
  const content = str(b.content)
  const media = {}
  if (b.schema && typeof b.schema === 'object') media.schema = b.schema
  if (type === 'json') {
    if (looksJson(content)) media.example = JSON.parse(content)
    else if (content !== '') media.example = content
    return { content: { 'application/json': media } }
  }
  if (type === 'urlencoded' || type === 'form') {
    let rows = []
    try {
      rows = JSON.parse(content)
    } catch {
      rows = []
    }
    const properties = {}
    for (const r of asArray(rows)) properties[str(r && r.key)] = { type: 'string' }
    media.schema = media.schema || { type: 'object', properties }
    const ct = type === 'form' ? 'multipart/form-data' : 'application/x-www-form-urlencoded'
    return { content: { [ct]: media } }
  }
  if (type === 'xml') return { content: { 'application/xml': { ...media, example: content } } }
  if (type === 'graphql') return { content: { 'application/graphql': { ...media, example: content } } }
  if (type === 'binary') return { content: { 'application/octet-stream': media } }
  return { content: { 'text/plain': { ...media, example: content } } }
}

function responsesToOpenApi(responses) {
  const out = {}
  const rows = asArray(responses)
  if (rows.length === 0) {
    out['200'] = { description: '成功' }
    return out
  }
  for (const raw of rows) {
    const r = raw && typeof raw === 'object' ? raw : {}
    const code = String(r.code === undefined || r.code === null ? 200 : r.code)
    const entry = { description: str(r.name) || ('响应 ' + code) }
    const body = str(r.body)
    const ct = str(r.contentType) || 'application/json'
    if (body !== '') {
      const media = {}
      if (looksJson(body)) media.example = JSON.parse(body)
      else media.example = body
      if (r.schema && typeof r.schema === 'object') media.schema = r.schema
      entry.content = { [ct]: media }
    } else if (r.schema && typeof r.schema === 'object') {
      entry.content = { [ct]: { schema: r.schema } }
    }
    out[code] = entry
  }
  return out
}

/** project → OpenAPI 3.0.3 文档对象。 */
export function exportOpenApi(project) {
  const p = project && typeof project === 'object' ? project : {}
  const env = defaultEnvironment(p)
  const baseUrl = env ? str(env.baseUrl) : ''
  const paths = {}
  const tagOrder = []
  for (const raw of asArray(p.endpoints)) {
    const ep = raw && typeof raw === 'object' ? raw : {}
    const folder = asArray(p.folders).find((f) => f && f.id === ep.folderId)
    const tag = folder ? str(folder.name) : ''
    if (tag !== '' && !tagOrder.includes(tag)) tagOrder.push(tag)
    const pathKey = toOpenApiPath(ep.url, baseUrl)
    if (!paths[pathKey]) paths[pathKey] = {}
    const operation = {
      summary: str(ep.name) || (str(ep.method) + ' ' + pathKey),
      operationId: str(ep.id),
      responses: responsesToOpenApi(ep.responses),
    }
    if (str(ep.description) !== '') operation.description = str(ep.description)
    if (tag !== '') operation.tags = [tag]
    const parameters = [
      ...asArray(ep.pathParams).map((r) => paramToOpenApi(r, 'path')),
      ...asArray(ep.params).map((r) => paramToOpenApi(r, 'query')),
      ...asArray(ep.headers).map((r) => paramToOpenApi(r, 'header')),
      ...asArray(ep.cookies).map((r) => paramToOpenApi(r, 'cookie')),
    ].filter(Boolean)
    if (parameters.length > 0) operation.parameters = parameters
    const requestBody = bodyToOpenApi(ep.body)
    if (requestBody) operation.requestBody = requestBody
    paths[pathKey][(str(ep.method) || 'GET').toLowerCase()] = operation
  }

  const schemas = {}
  for (const raw of asArray(p.schemas)) {
    const s = raw && typeof raw === 'object' ? raw : {}
    const name = str(s.name)
    if (name === '') continue
    const base = s.jsonSchema && typeof s.jsonSchema === 'object' ? s.jsonSchema : { type: 'object' }
    schemas[name] = str(s.description) !== '' && base.description === undefined
      ? { ...base, description: str(s.description) }
      : base
  }

  const doc = {
    openapi: '3.0.3',
    info: {
      title: str(p.name) || 'dsh-postapi 项目',
      version: '1.0.0',
      description: str(p.description),
    },
    paths,
  }
  if (baseUrl !== '') doc.servers = [{ url: baseUrl }]
  if (tagOrder.length > 0) doc.tags = tagOrder.map((name) => ({ name }))
  if (Object.keys(schemas).length > 0) doc.components = { schemas }
  return doc
}

/** project → Postman collection v2.1 对象。 */
export function exportPostman(project) {
  const p = project && typeof project === 'object' ? project : {}
  const env = defaultEnvironment(p)
  const baseUrl = env ? str(env.baseUrl) : ''
  const folders = asArray(p.folders)
  const endpoints = asArray(p.endpoints)

  const toItem = (ep) => {
    const e = ep && typeof ep === 'object' ? ep : {}
    const rawUrl = str(e.url)
    const fullUrl = /^https?:\/\//i.test(rawUrl) || baseUrl === '' ? rawUrl : joinUrl(baseUrl, rawUrl)
    const query = asArray(e.params)
      .filter((r) => r && r.enabled !== false && str(r.key) !== '')
      .map((r) => ({ key: str(r.key), value: str(r.value) }))
    const headers = asArray(e.headers)
      .filter((r) => r && r.enabled !== false && str(r.key) !== '')
      .map((r) => ({ key: str(r.key), value: str(r.value) }))
    // Postman raw 惯例带完整 query，导入侧直接取 raw 作 url（往返一致）
    const queryString = query
      .map((q) => encodeURIComponent(q.key) + '=' + encodeURIComponent(q.value))
      .join('&')
    const urlObj = { raw: queryString === '' ? fullUrl : fullUrl + (fullUrl.includes('?') ? '&' : '?') + queryString, query }
    const b = e.body && typeof e.body === 'object' ? e.body : {}
    const bodyType = str(b.type) || 'none'
    const content = str(b.content)
    let body
    if (bodyType === 'json') body = { mode: 'raw', raw: content, options: { raw: { language: 'json' } } }
    else if (bodyType === 'raw' || bodyType === 'xml') body = { mode: 'raw', raw: content }
    else if (bodyType === 'urlencoded' || bodyType === 'form') {
      let rows = []
      try {
        rows = JSON.parse(content)
      } catch {
        rows = []
      }
      const list = asArray(rows).map((r) => ({ key: str(r && r.key), value: str(r && r.value) }))
      body = bodyType === 'form' ? { mode: 'formdata', formdata: list } : { mode: 'urlencoded', urlencoded: list }
    } else if (bodyType === 'graphql') body = { mode: 'graphql', graphql: { query: content } }
    else if (bodyType === 'none') body = undefined
    else body = { mode: 'raw', raw: content }

    const a = e.auth && typeof e.auth === 'object' ? e.auth : {}
    const authType = str(a.type) || 'none'
    let auth
    if (authType === 'bearer') auth = { type: 'bearer', bearer: [{ key: 'token', value: str(a.token), type: 'string' }] }
    else if (authType === 'basic') {
      auth = {
        type: 'basic',
        basic: [
          { key: 'username', value: str(a.username), type: 'string' },
          { key: 'password', value: str(a.password), type: 'string' },
        ],
      }
    } else if (authType === 'apikey') {
      auth = {
        type: 'apikey',
        apikey: [
          { key: 'key', value: str(a.key), type: 'string' },
          { key: 'value', value: str(a.value), type: 'string' },
          { key: 'in', value: str(a.addTo) || 'header', type: 'string' },
        ],
      }
    }

    const item = {
      name: str(e.name) || (str(e.method) + ' ' + fullUrl),
      request: {
        method: (str(e.method) || 'GET').toUpperCase(),
        header: headers,
        url: urlObj,
      },
      response: asArray(e.responses).map((r) => ({
        name: str(r && r.name),
        originalRequest: { method: (str(e.method) || 'GET').toUpperCase(), url: urlObj, header: headers },
        status: str(r && r.code),
        code: Number(r && r.code) || 200,
        header: asArray(r && r.headers).map((h) => ({ key: str(h && h.key), value: str(h && h.value) })),
        body: str(r && r.body),
      })),
    }
    if (body) item.request.body = body
    if (auth) item.request.auth = auth
    if (str(e.description) !== '') item.request.description = str(e.description)
    return item
  }

  const childrenOf = (parentId) => endpoints.filter((ep) => {
    const fid = ep && ep.folderId != null ? ep.folderId : null
    return fid === parentId
  })
  const folderItem = (folder) => {
    const id = folder && folder.id != null ? folder.id : null
    const subFolders = folders.filter((f) => (f && f.parentId != null ? f.parentId : null) === id)
    return {
      name: str(folder && folder.name),
      item: [
        ...subFolders.map(folderItem),
        ...childrenOf(id).map(toItem),
      ],
    }
  }
  const topFolders = folders.filter((f) => !f || f.parentId == null)
  const item = [
    ...topFolders.map(folderItem),
    ...childrenOf(null).map(toItem),
  ]

  return {
    info: {
      name: str(p.name) || 'dsh-postapi 项目',
      description: str(p.description),
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item,
  }
}

/** project → HAR 1.2 对象（用第一个响应的 body 作为 content.text）。 */
export function exportHar(project) {
  const p = project && typeof project === 'object' ? project : {}
  const env = defaultEnvironment(p)
  const baseUrl = env ? str(env.baseUrl) : ''
  const now = new Date(0).toISOString()
  const entries = asArray(p.endpoints).map((raw) => {
    const ep = raw && typeof raw === 'object' ? raw : {}
    const rawUrl = str(ep.url)
    const fullUrl = /^https?:\/\//i.test(rawUrl) || baseUrl === '' ? rawUrl : joinUrl(baseUrl, rawUrl)
    const query = asArray(ep.params)
      .filter((r) => r && r.enabled !== false && str(r.key) !== '')
      .map((r) => ({ name: str(r.key), value: str(r.value) }))
    const headers = asArray(ep.headers)
      .filter((r) => r && r.enabled !== false && str(r.key) !== '')
      .map((r) => ({ name: str(r.key), value: str(r.value) }))
    const bodyText = str(ep.body && ep.body.content)
    const firstResponse = asArray(ep.responses)[0] || null
    // HAR 惯例：request.url 带完整 query，同时保留 queryString 明细
    const harQuery = query
      .map((q) => encodeURIComponent(q.name) + '=' + encodeURIComponent(q.value))
      .join('&')
    const request = {
      method: (str(ep.method) || 'GET').toUpperCase(),
      url: harQuery === '' ? fullUrl : fullUrl + (fullUrl.includes('?') ? '&' : '?') + harQuery,
      httpVersion: 'HTTP/1.1',
      headers,
      queryString: query,
      cookies: [],
      headersSize: -1,
      bodySize: bodyText.length,
    }
    if (bodyText !== '') {
      request.postData = {
        mimeType: str(ep.body && ep.body.type) === 'json' ? 'application/json' : 'text/plain',
        text: bodyText,
      }
    }
    return {
      startedDateTime: now,
      time: 0,
      request,
      response: {
        status: firstResponse ? Number(firstResponse.code) || 200 : 200,
        statusText: firstResponse ? str(firstResponse.name) : '',
        httpVersion: 'HTTP/1.1',
        headers: firstResponse
          ? asArray(firstResponse.headers).map((h) => ({ name: str(h && h.key), value: str(h && h.value) }))
          : [],
        cookies: [],
        content: {
          size: firstResponse ? str(firstResponse.body).length : 0,
          mimeType: firstResponse ? (str(firstResponse.contentType) || 'application/json') : 'application/json',
          text: firstResponse ? str(firstResponse.body) : '',
        },
        redirectURL: '',
        headersSize: -1,
        bodySize: -1,
      },
      cache: {},
      timings: { send: 0, wait: 0, receive: 0 },
    }
  })
  return {
    log: {
      version: '1.2',
      creator: { name: 'dsh-postapi', version: '1.0.0' },
      entries,
    },
  }
}

/** project → Markdown 接口文档字符串（目录树 + 参数表 + 响应示例）。 */
export function exportMarkdown(project) {
  const p = project && typeof project === 'object' ? project : {}
  const FENCE = '```'
  const BQ = '`'
  const lines = []
  lines.push('# ' + (str(p.name) || 'dsh-postapi 项目'))
  if (str(p.description) !== '') lines.push('', str(p.description))
  lines.push('')

  const folders = asArray(p.folders)
  const endpoints = asArray(p.endpoints)
  const byFolder = (fid) => endpoints.filter((ep) => (ep && ep.folderId != null ? ep.folderId : null) === fid)

  const table = (title, rows) => {
    const list = asArray(rows).filter((r) => r && str(r.key) !== '')
    if (list.length === 0) return
    lines.push('**' + title + '**', '')
    lines.push('| 参数 | 值 | 必填 | 说明 |')
    lines.push('| --- | --- | --- | --- |')
    for (const r of list) {
      lines.push('| ' + str(r.key) + ' | ' + str(r.value) + ' | ' + (r.required ? '是' : '否') + ' | ' + str(r.description) + ' |')
    }
    lines.push('')
  }

  const renderEndpoint = (ep) => {
    lines.push('### ' + (str(ep.name) || str(ep.id)))
    lines.push('')
    lines.push(BQ + (str(ep.method) || 'GET') + ' ' + str(ep.url) + BQ)
    lines.push('')
    if (str(ep.description) !== '') lines.push(str(ep.description), '')
    table('Path 参数', ep.pathParams)
    table('Query 参数', ep.params)
    table('Headers', ep.headers)
    table('Cookies', ep.cookies)
    const body = ep.body && typeof ep.body === 'object' ? ep.body : {}
    if (str(body.content) !== '') {
      lines.push('**请求体（' + (str(body.type) || 'none') + '）**', '')
      lines.push(FENCE + (str(body.type) === 'json' ? 'json' : ''))
      lines.push(str(body.content))
      lines.push(FENCE, '')
    }
    const responses = asArray(ep.responses)
    if (responses.length > 0) {
      lines.push('**响应**', '')
      for (const r of responses) {
        lines.push('- ' + BQ + str(r && r.code) + BQ + ' ' + str(r && r.name))
        if (str(r && r.body) !== '') {
          lines.push('', FENCE + 'json', str(r.body), FENCE)
        }
      }
      lines.push('')
    }
  }

  const renderFolder = (folder, depth) => {
    lines.push('#'.repeat(Math.min(depth + 2, 6)) + ' ' + (str(folder && folder.name) || '未命名目录'))
    lines.push('')
    const parentId = folder ? folder.id : null
    for (const sub of folders.filter((f) => (f && f.parentId != null ? f.parentId : null) === parentId)) {
      renderFolder(sub, depth + 1)
    }
    for (const ep of byFolder(parentId)) renderEndpoint(ep)
  }

  const topFolders = folders.filter((f) => !f || f.parentId == null)
  for (const f of topFolders) renderFolder(f, 0)
  for (const ep of byFolder(null)) renderEndpoint(ep)
  if (topFolders.length === 0 && byFolder(null).length === 0) lines.push('_（暂无接口）_')
  return lines.join('\n')
}
