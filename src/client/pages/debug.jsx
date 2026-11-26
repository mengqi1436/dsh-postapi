// debug.jsx — 调试发送页（Apifox 调试台：左接口树 + 中 URL 行/页签请求编辑 + 右响应面板）
// 布局类全部来自 design-tokens.css：.pp-url-row / .pp-tabs + .pp-tab / .pp-pane / .pp-pill / .pp-pre / .pp-table。
// 发送走 window.__postapiApi.request.send，接口与环境走 storage；未注入 api 时用文件内 mock 并标注「示例数据」。
import { useEffect, useMemo, useRef, useState } from 'react'
import { applyTheme } from './theme.js'
import { ParamTable } from './components/ParamTable.jsx'
import { JsonEditor } from './components/JsonEditor.jsx'
import { EmptyState } from './components/EmptyState.jsx'
import { StatusPill } from './components/StatusPill.jsx'
import { COMMON_HEADERS, filterHeaders } from './components/headerPresets.js'
import { BodyEditor } from './components/BodyEditor.jsx'
import { ScriptPanel } from './components/ScriptPanel.jsx'
import { ResponsePanel } from './components/ResponsePanel.jsx'
import { buildCurl } from './doc.jsx'

;(window.__postapiQueue = window.__postapiQueue || []).push(['debug', DebugPage]) // 注册表就绪前入队，ensureGlobals 统一重放（模块求值顺序无关）

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
const BODY_TYPES = ['none', 'json', 'form', 'urlencoded', 'raw', 'xml', 'graphql']
const AUTH_TYPES = ['none', 'bearer', 'basic', 'apikey']

// —— mock 接口（契约 §2 endpoint 结构；与 doc 页独立副本，避免跨页耦合）——
const MOCK_PROJECT = {
  id: 'proj_demo01',
  name: '订单中心（示例数据）',
  environments: [
    { id: 'env_01', name: '开发环境', baseUrl: 'https://api.example.test', isDefault: true,
      variables: [{ key: 'token', value: 'demo-token', enabled: true, secret: false }] },
    { id: 'env_02', name: '生产环境', baseUrl: 'https://api.example.com', isDefault: false, variables: [] },
  ],
  globals: { variables: [{ key: 'apiKey', value: 'demo-key', enabled: true, secret: false }] },
  folders: [{ id: 'fld_01', name: '订单管理', parentId: null, order: 0 }],
  endpoints: [
    {
      id: 'ep_1001', name: '查询订单列表', folderId: 'fld_01', method: 'GET', url: '/api/v1/orders',
      params: [
        { key: 'page', value: '1', enabled: true, type: 'number', description: '', required: false },
        { key: 'pageSize', value: '20', enabled: true, type: 'number', description: '', required: false },
      ],
      pathParams: [], headers: [{ key: 'Accept', value: 'application/json', enabled: true, type: 'string', description: '', required: false }],
      cookies: [], body: { type: 'none', content: '' },
      auth: { type: 'bearer', token: '{{token}}', username: '', password: '', key: '', value: '', addTo: 'header' },
      responses: [{ id: 'res_a', name: '成功', code: 200, contentType: 'application/json',
        body: '{\n  "code": 0,\n  "data": { "total": 42, "items": [] }\n}', headers: [], enabled: true, isDefault: true }],
    },
    {
      id: 'ep_1002', name: '创建订单', folderId: 'fld_01', method: 'POST', url: '/api/v1/orders',
      params: [], pathParams: [],
      headers: [{ key: 'Content-Type', value: 'application/json', enabled: true, type: 'string', description: '', required: true }],
      cookies: [], body: { type: 'json', content: '{\n  "skuId": "SKU-1001",\n  "quantity": 2\n}' },
      auth: { type: 'bearer', token: '{{token}}', username: '', password: '', key: '', value: '', addTo: 'header' },
      responses: [{ id: 'res_b', name: '创建成功', code: 201, contentType: 'application/json',
        body: '{\n  "code": 0,\n  "data": { "orderId": "ORD-002" }\n}', headers: [], enabled: true, isDefault: true }],
    },
    {
      id: 'ep_3001', name: '更新支付状态', folderId: null, method: 'PATCH', url: '/api/v1/payments/{paymentId}',
      params: [], pathParams: [{ key: 'paymentId', value: 'PAY-001', enabled: true, type: 'string', description: '', required: true }],
      headers: [], cookies: [], body: { type: 'json', content: '{\n  "status": "PAID"\n}' },
      auth: { type: 'none', token: '', username: '', password: '', key: '', value: '', addTo: 'header' },
      responses: [{ id: 'res_c', name: '成功', code: 200, contentType: 'application/json', body: '{}', headers: [], enabled: true, isDefault: true }],
    },
  ],
}

const TABS = [
  { id: 'params', label: 'Params' },
  { id: 'headers', label: 'Headers' },
  { id: 'body', label: 'Body' },
  { id: 'auth', label: 'Auth' },
  { id: 'script', label: '脚本' },
  { id: 'db', label: '数据库' },
  { id: 'settings', label: '设置' },
  { id: 'projSettings', label: '项目设置' },
]

/** WebSocket 模式下只保留与握手相关的页签（Body/Auth/脚本属于 HTTP 语义）。 */
const WS_TABS = [
  { id: 'params', label: 'Params' },
  { id: 'headers', label: 'Headers' },
]

/** gRPC / Dubbo 模式页签：Params 暂不参与调用（gRPC 走 message JSON、Dubbo 走 args），仅留 Headers 当 metadata/attachment 编辑位。 */
const RPC_TABS = [
  { id: 'params', label: 'Params' },
  { id: 'headers', label: 'Headers' },
]

/** RPC 调用的草稿字段默认值（挂在 draft 上，protocol 切换时互不干扰）。 */
function emptyRpcDraft(ep) {
  return {
    rpcAddress: '',
    rpcProto: '',
    rpcService: '',
    rpcMethod: '',
    rpcMessage: '',
    rpcInterface: '',
    rpcVersion: '',
    rpcGroup: '',
    rpcParamTypes: '',
    rpcArgs: '',
    rpcGeneric: true,
    ...(ep && typeof ep === 'object' ? {
      rpcAddress: ep.rpcAddress == null ? '' : String(ep.rpcAddress),
      rpcProto: ep.rpcProto == null ? '' : String(ep.rpcProto),
      rpcService: ep.rpcService == null ? '' : String(ep.rpcService),
      rpcMethod: ep.rpcMethod == null ? '' : String(ep.rpcMethod),
      rpcMessage: ep.rpcMessage == null ? '' : String(ep.rpcMessage),
      rpcInterface: ep.rpcInterface == null ? '' : String(ep.rpcInterface),
      rpcVersion: ep.rpcVersion == null ? '' : String(ep.rpcVersion),
      rpcGroup: ep.rpcGroup == null ? '' : String(ep.rpcGroup),
      rpcParamTypes: ep.rpcParamTypes == null ? '' : String(ep.rpcParamTypes),
      rpcArgs: ep.rpcArgs == null ? '' : String(ep.rpcArgs),
      rpcGeneric: ep.rpcGeneric === false ? false : true,
    } : {}),
  }
}

/** 项目设置全族（project.settings）页面侧归一：缺字段回落空值，类型不对时兜底。 */
export function emptyProjSettings(project) {
  const s = (project && project.settings && typeof project.settings === 'object') ? project.settings : {}
  const gp = (s.globalParams && typeof s.globalParams === 'object') ? s.globalParams : {}
  const ga = (s.globalAuth && typeof s.globalAuth === 'object') ? s.globalAuth : {}
  const rows = (v) => (Array.isArray(v) ? v.map((r) => ({ ...r })) : [])
  return {
    name: (project && project.name) || '',
    description: (project && project.description) || '',
    globalParams: { headers: rows(gp.headers), query: rows(gp.query), cookies: rows(gp.cookies) },
    globalAuth: {
      type: ga.type || 'none',
      token: ga.token == null ? '' : String(ga.token),
      username: ga.username == null ? '' : String(ga.username),
      password: ga.password == null ? '' : String(ga.password),
      key: ga.key == null ? '' : String(ga.key),
      value: ga.value == null ? '' : String(ga.value),
      addTo: ga.addTo || 'header',
    },
    preScript: s.preScript == null ? '' : String(s.preScript),
    postScript: s.postScript == null ? '' : String(s.postScript),
  }
}

const DB_TYPES = [
  { id: 'sqlite', label: 'SQLite（node 内置驱动）' },
  { id: 'mysql', label: 'MySQL（官方 mysql2）' },
  { id: 'postgresql', label: 'PostgreSQL（官方 pg）' },
  { id: 'mssql', label: 'SQL Server（官方 mssql）' },
  { id: 'oracle', label: 'Oracle（官方 oracledb）' },
  { id: 'mongodb', label: 'MongoDB（官方 mongodb）' },
  { id: 'redis', label: 'Redis（官方 redis）' },
]

/** 各驱动默认端口提示（placeholder 用）。 */
const DB_DEFAULT_PORT = { mysql: '3306（默认）', postgresql: '5432（默认）', mssql: '1433（默认）', oracle: '1521（默认）', redis: '6379（默认）' }
/** SSL 开关适用面：关系型 + Redis TLS；MongoDB 走 URL 里的 ssl 参数。 */
const DB_SSL_TYPES = ['mysql', 'postgresql', 'mssql', 'redis']
/** 端口字段适用的驱动（sqlite 走文件路径、mongodb 走 URL）。 */
const DB_HOST_TYPES = ['mysql', 'postgresql', 'mssql', 'oracle', 'redis']

/** 项目设置子页签（基本信息 / 全局参数 / 全局认证 / 前后置脚本）。 */
const PROJ_SUBTABS = [
  { id: 'basic', label: '基本信息' },
  { id: 'globalParams', label: '全局参数' },
  { id: 'globalAuth', label: '全局认证' },
  { id: 'scripts', label: '前后置脚本' },
]

/** 回放快照 key：与 history 页写入的 key 一致，切到调试页即按快照重填。 */
const REPLAY_KEY = 'postapi.debug.replay'

// 参数表列用 ParamTable 的默认列（启用/参数名/类型/必填/示例值/描述 + 操作），
// 与 doc 页只读表同一套，避免两页列不一致。
const AUTH_LABEL = { none: '无认证', bearer: 'Bearer', basic: 'Basic', apikey: 'API Key' }

function resolveApi() {
  return typeof window !== 'undefined' ? window.__postapiApi : null
}

function errText(err) {
  return err && err.message ? err.message : String(err)
}

/** Dubbo args JSON 数组解析：非法返回 null（发送前拦截并给出行内错误）。 */
function parseJsonArray(text) {
  const raw = String(text == null ? '' : text).trim()
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function emptyDraft(ep) {
  return {
    id: ep && ep.id ? ep.id : '',
    name: ep && ep.name ? ep.name : '',
    folderId: ep && ep.folderId ? ep.folderId : null,
    method: (ep && ep.method) || 'GET',
    // 协议位（http | websocket | grpc...）：websocket 走调试页 WS 模式，其余仍回落 HTTP
    protocol: (ep && ep.protocol) || 'http',
    url: (ep && ep.url) || '',
    params: (ep && Array.isArray(ep.params) ? ep.params : []).map((r) => ({ ...r })),
    pathParams: (ep && Array.isArray(ep.pathParams) ? ep.pathParams : []).map((r) => ({ ...r })),
    headers: (ep && Array.isArray(ep.headers) ? ep.headers : []).map((r) => ({ ...r })),
    cookies: (ep && Array.isArray(ep.cookies) ? ep.cookies : []).map((r) => ({ ...r })),
    body: { type: (ep && ep.body && ep.body.type) || 'none', content: (ep && ep.body && ep.body.content) || '' },
    auth: {
      type: (ep && ep.auth && ep.auth.type) || 'none',
      token: (ep && ep.auth && ep.auth.token) || '',
      username: (ep && ep.auth && ep.auth.username) || '',
      password: (ep && ep.auth && ep.auth.password) || '',
      key: (ep && ep.auth && ep.auth.key) || '',
      value: (ep && ep.auth && ep.auth.value) || '',
      addTo: (ep && ep.auth && ep.auth.addTo) || 'header',
    },
    responses: (ep && Array.isArray(ep.responses) ? ep.responses : []).map((r) => ({ ...r })),
    // 前后置脚本 / 断言 / 发送前等待（Apifox 的「前置操作 / 后置操作」与「等待时间」）
    preScript: (ep && ep.preScript) || '',
    postScript: (ep && ep.postScript) || '',
    assertions: (ep && Array.isArray(ep.assertions) ? ep.assertions : []).map((a) => ({ ...a })),
    waitMs: Number.isFinite(ep && ep.waitMs) ? ep.waitMs : 0,
    // RPC（gRPC / Dubbo）草稿字段：地址沿用 url 输入框，其余独立字段
    ...emptyRpcDraft(ep),
  }
}

/** 读取 history 页写入的回放快照（无则 null）；结构 { method, url, headers, body }。 */
export function readReplay() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(REPLAY_KEY) : null
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

/** 收集 {{var}} 引用（URL / Params / Headers / Body / Auth），用于提示未定义变量。 */
export function collectVarRefs(draft) {
  const found = []
  const push = (text) => {
    const re = /\{\{\s*([^}\s]+)\s*\}\}/g
    let m
    const src = String(text == null ? '' : text)
    while ((m = re.exec(src))) if (found.indexOf(m[1]) < 0) found.push(m[1])
  }
  if (!draft) return found
  push(draft.url)
  for (const rows of [draft.params, draft.pathParams, draft.headers, draft.cookies]) {
    for (const r of Array.isArray(rows) ? rows : []) {
      push(r && r.key)
      push(r && r.value)
    }
  }
  if (draft.body) push(draft.body.content)
  if (draft.auth) {
    push(draft.auth.token)
    push(draft.auth.value)
  }
  return found
}

/** 当前环境 + 全局变量表（key -> value），只取 enabled !== false 的项。 */
export function varTable(project, envId) {
  const table = {}
  const globals = project && project.globals && Array.isArray(project.globals.variables) ? project.globals.variables : []
  for (const v of globals) if (v && v.enabled !== false && v.key) table[v.key] = v.value
  const envs = project && Array.isArray(project.environments) ? project.environments : []
  const env = envs.find((e) => e.id === envId) || envs.find((e) => e.isDefault) || envs[0]
  for (const v of env && Array.isArray(env.variables) ? env.variables : []) {
    if (v && v.enabled !== false && v.key) table[v.key] = v.value
  }
  return { table, env }
}

function joinUrl(baseUrl, url) {
  const raw = String(url || '')
  if (/^https?:\/\//i.test(raw)) return raw
  const base = String(baseUrl || '').replace(/\/+$/, '')
  if (!base) return raw
  return base + (raw.charAt(0) === '/' ? raw : '/' + raw)
}

/** 追加常用请求头：跳过已存在（key 大小写不敏感）的项，按清单顺序补最多 limit 条。
 *  行结构与 ParamTable 的 blankParamRow 一致，可直接交给 patch('headers', rows)。 */
export function appendCommonHeaders(rows, limit = 3) {
  const list = Array.isArray(rows) ? rows.slice() : []
  const exists = (key) => list.some((r) => String((r && r.key) || '').trim().toLowerCase() === String(key).toLowerCase())
  let added = 0
  for (const h of Array.isArray(COMMON_HEADERS) ? COMMON_HEADERS : []) {
    if (added >= limit) break
    if (!h || !h.key || exists(h.key)) continue
    list.push({
      key: h.key,
      value: h.value == null ? '' : h.value,
      enabled: true,
      type: 'string',
      required: false,
      description: h.description == null ? '' : h.description,
    })
    added += 1
  }
  return list
}

/** JSON 美化；失败返回原文（原文/美化切换用）。 */
export function prettyJson(text) {
  if (text == null) return ''
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text == null ? '' : String(text)
  }
}

/** WS 握手地址：http(s) 自动转 ws(s)（宿主 ws-client 再兜底一次）。 */
export function toWsUrl(raw) {
  const url = String(raw || '')
  if (/^wss?:\/\//i.test(url)) return url
  return url.replace(/^https:\/\//i, 'wss://').replace(/^http:\/\//i, 'ws://')
}

/** WS open 入参：URL/参数/头/认证原样下发，变量替换与认证物化在宿主侧完成（对齐 request.send 语义）。 */
export function buildWsPayload(draft, finalUrl, variables) {
  return {
    url: toWsUrl(finalUrl),
    params: (Array.isArray(draft.params) ? draft.params : []).filter((p) => p && p.enabled !== false && p.key),
    headers: (Array.isArray(draft.headers) ? draft.headers : []).filter((h) => h && h.enabled !== false && h.key),
    auth: draft.auth || { type: 'none' },
    variables,
  }
}

/** WS 消息方向徽标：→ 发出 / ← 收到 / ● 系统。 */
const WS_DIR_LABEL = { out: '→', in: '←', system: '●' }

function wsTime(at) {
  const raw = String(at || '')
  return raw.length >= 19 ? raw.slice(11, 19) : raw
}

export function DebugPage({ route, api }) {
  const rootRef = useRef(null)
  const abortRef = useRef({ cancelled: false })
  useEffect(() => applyTheme(rootRef.current), [])
  const apiRef = resolveApi() || api

  const [project, setProject] = useState(MOCK_PROJECT)
  const [isMock, setIsMock] = useState(true)
  const [error, setError] = useState('')
  const [envId, setEnvId] = useState(() => {
    const envs = MOCK_PROJECT.environments
    const def = envs.find((e) => e.isDefault) || envs[0]
    return def ? def.id : ''
  })
  const [draft, setDraft] = useState(() => emptyDraft(MOCK_PROJECT.endpoints[0]))
  const [tab, setTab] = useState('params')
  // 左树折叠态：{ folderId: true } 表示该目录已收起
  const [resp, setResp] = useState(null)
  const [sending, setSending] = useState(false)
  const [timeoutMs, setTimeoutMs] = useState(30000)
  const [savedHint, setSavedHint] = useState('')
  // —— WebSocket 模式状态（draft.protocol === 'websocket' 时启用）——
  const [wsState, setWsState] = useState({ id: '', status: 'idle', messages: [], error: null })
  const [wsInput, setWsInput] = useState('')
  const wsIndexRef = useRef(0) // 增量取消息游标（宿主 messages({ since })）
  const wsTimerRef = useRef(null)
  // —— 数据库页签状态 ——
  const [dbConfig, setDbConfig] = useState({ type: 'sqlite', path: '', url: '', host: '', port: '', user: '', password: '', database: '', ssl: false })
  const [dbSql, setDbSql] = useState('SELECT 1')
  const [dbHint, setDbHint] = useState('')
  const [dbResult, setDbResult] = useState(null)
  const [dbBusy, setDbBusy] = useState(false)
  // —— 项目设置全族（project.settings）：加载进 state，保存走 renameProject + saveProjectSettings ——
  const [projSettings, setProjSettings] = useState(() => emptyProjSettings(MOCK_PROJECT))
  const [projSub, setProjSub] = useState('basic')
  const [projSaveHint, setProjSaveHint] = useState('')
  const [projSaveBad, setProjSaveBad] = useState(false)

  // 载入项目（列表首个）
  useEffect(() => {
    const storage = apiRef && apiRef.storage
    if (!storage || typeof storage.listProjects !== 'function' || typeof storage.getProject !== 'function') return undefined
    let cancelled = false
    Promise.resolve()
      .then(() => storage.listProjects())
      .then((list) => {
        const first = Array.isArray(list) && list.length ? list[0] : null
        return first ? storage.getProject(first.id) : null
      })
      .then((data) => {
        if (cancelled || !data) return
        setProject(data)
        setIsMock(false)
        setError('')
        setProjSettings(emptyProjSettings(data))
        const envs = Array.isArray(data.environments) ? data.environments : []
        const def = envs.find((e) => e.isDefault) || envs[0]
        setEnvId(def ? def.id : '')
        const list = Array.isArray(data.endpoints) ? data.endpoints : []
        setDraft(emptyDraft(list[0] || null))
      })
      .catch((err) => {
        if (cancelled) return
        setError('读取项目失败：' + (err && err.message ? err.message : String(err)))
      })
    return () => { cancelled = true }
  }, [apiRef])

  // 历史页「回放」写入的快照：进入本页时读一次，把 method/url/headers/body 填进草稿
  useEffect(() => {
    const snap = readReplay()
    if (!snap) return
    setDraft((prev) => ({
      ...prev,
      method: snap.method || prev.method,
      url: snap.url || prev.url,
      headers: Array.isArray(snap.headers) && snap.headers.length
        ? snap.headers.map((h) => ({ enabled: true, type: 'string', required: false, description: '', ...h }))
        : prev.headers,
      body: typeof snap.body === 'string' && snap.body
        ? { ...prev.body, type: prev.body.type === 'none' ? 'json' : prev.body.type, content: snap.body }
        : prev.body,
    }))
    try { localStorage.removeItem(REPLAY_KEY) } catch { /* 隐私模式忽略 */ }
  }, [])

  const envs = useMemo(() => (Array.isArray(project && project.environments) ? project.environments : []), [project])
  const { table, env } = useMemo(() => varTable(project, envId), [project, envId])
  const varRefs = useMemo(() => collectVarRefs(draft), [draft])
  const missingVars = useMemo(() => varRefs.filter((k) => !(k in table)), [varRefs, table])
  const finalUrl = useMemo(() => {
    const raw = String(draft.url || '')
    // ws(s):// 绝对地址不拼 baseUrl（joinUrl 只认 http 绝对地址）
    if (/^wss?:\/\//i.test(raw)) return raw
    // RPC（gRPC/Dubbo）地址必须是完整 host:port，不与 baseUrl 拼接
    if (draft.protocol === 'grpc' || draft.protocol === 'dubbo') return raw
    return joinUrl(env && env.baseUrl, raw)
  }, [env, draft.url, draft.protocol])
  const wsMode = draft.protocol === 'websocket'
  const grpcMode = draft.protocol === 'grpc'
  const dubboMode = draft.protocol === 'dubbo'
  const rpcMode = grpcMode || dubboMode
  const activeTabs = wsMode ? WS_TABS : rpcMode ? RPC_TABS : TABS
  const dbConnections = useMemo(
    () => (project && project.settings && Array.isArray(project.settings.dbConnections) ? project.settings.dbConnections : []),
    [project],
  )

  /** 增量拉取 WS 消息：open 期间每秒一次；连接结束自动停。 */
  const pollWsMessages = () => {
    const wsApi = apiRef && apiRef.ws
    if (!wsApi || typeof wsApi.messages !== 'function' || !wsState.id) return
    wsApi.messages({ id: wsState.id, since: wsIndexRef.current })
      .then((result) => {
        if (!result || result.ok === false) return
        if (Array.isArray(result.messages) && result.messages.length) {
          setWsState((prev) => ({ ...prev, messages: [...prev.messages, ...result.messages], status: result.status || prev.status }))
        } else {
          setWsState((prev) => ({ ...prev, status: result.status || prev.status }))
        }
        if (Number.isFinite(result.lastIndex)) wsIndexRef.current = result.lastIndex
      })
      .catch(() => { /* 轮询失败下一轮再试 */ })
  }

  // open 期间轮询；状态变化（连接建立/断开）即重建定时器
  useEffect(() => {
    if (wsTimerRef.current) { clearInterval(wsTimerRef.current); wsTimerRef.current = null }
    if (wsState.status !== 'open' || !wsState.id) return undefined
    wsTimerRef.current = setInterval(pollWsMessages, 1000)
    return () => { if (wsTimerRef.current) { clearInterval(wsTimerRef.current); wsTimerRef.current = null } }
  }, [wsState.status, wsState.id, apiRef])

  // 卸载兜底：清轮询定时器
  useEffect(() => () => { if (wsTimerRef.current) clearInterval(wsTimerRef.current) }, [])

  const patch = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }))
  const patchAuth = (field, value) => setDraft((prev) => ({ ...prev, auth: { ...prev.auth, [field]: value } }))
  // 「+ 常用请求头」：按 COMMON_HEADERS 顺序补 3 条未出现的头，已存在的跳过（函数式更新避免拿到旧 draft）
  const addCommonHeaders = () => setDraft((prev) => ({ ...prev, headers: appendCommonHeaders(prev.headers, 3) }))

  const send = () => {
    const requestApi = apiRef && apiRef.request
    const cancelled = { cancelled: false }
    abortRef.current = cancelled
    setSending(true)
    setResp(null)
    const payload = {
      method: draft.method,
      url: finalUrl,
      params: draft.params.filter((p) => p && p.enabled !== false && p.key),
      headers: draft.headers.filter((h) => h && h.enabled !== false && h.key),
      body: draft.body,
      auth: draft.auth,
      timeoutMs: timeoutMs > 0 ? timeoutMs : 30000,
      // 前后置脚本与断言：host request.send 已支持这三个字段（bridge 直通 request.js）
      preScript: draft.preScript || undefined,
      postScript: draft.postScript || undefined,
      assertions: Array.isArray(draft.assertions) && draft.assertions.length ? draft.assertions : undefined,
      variables: {
        globals: project && project.globals ? project.globals.variables || [] : [],
        environment: env && Array.isArray(env.variables) ? env.variables : [],
        local: [],
      },
      projectId: project && project.id ? project.id : '',
    }
    // v3：项目设置全族随发送下发（host request.send 负责合并语义）；字段缺失时不传
    const ps = project && project.settings && typeof project.settings === 'object' ? project.settings : null
    if (ps && ps.globalParams) payload.globalParams = ps.globalParams
    if (ps && ps.globalAuth) payload.globalAuth = ps.globalAuth
    if (ps && ps.preScript) payload.projectPreScript = ps.preScript
    if (ps && ps.postScript) payload.projectPostScript = ps.postScript
    if (!requestApi || typeof requestApi.send !== 'function') {
      // 无 api：本地 mock 响应（结构对齐契约 §4 request.send 返回值）
      setResp({
        status: /DELETE|PATCH/.test(draft.method) ? 204 : 200,
        statusText: 'OK (mock)',
        headers: { 'content-type': 'application/json' },
        body: '{\n  "code": 0,\n  "data": { "mock": true }\n}',
        bodySize: 128,
        timeMs: 42,
        tests: [{ name: 'status 为 2xx', passed: true }],
        logs: [],
      })
      setSending(false)
      return
    }
    // 发送前等待（Apifox「等待时间」）：仅在有值时延后，0 不引入额外 tick
    const wait = Number(draft.waitMs) > 0 ? Number(draft.waitMs) : 0
    Promise.resolve()
      .then(() => (wait > 0 ? new Promise((resolve) => setTimeout(resolve, wait)) : undefined))
      .then(() => requestApi.send(payload))
      .then((result) => {
        if (cancelled.cancelled) return
        setResp(result || {})
        setError('')
      })
      .catch((err) => {
        if (cancelled.cancelled) return
        setResp({ status: 0, statusText: '', headers: {}, body: '', bodySize: 0, timeMs: 0,
          error: { message: err && err.message ? err.message : String(err) } })
      })
      .finally(() => { if (!cancelled.cancelled) setSending(false) })
  }

  const cancel = () => {
    abortRef.current.cancelled = true
    setSending(false)
    setError('已取消本次发送（响应不再回填）')
  }

  const saveAsEndpoint = () => {
    const storage = apiRef && apiRef.storage
    if (!storage || typeof storage.saveEndpoint !== 'function' || !project || !project.id) {
      setSavedHint('保存失败：storage.saveEndpoint 不可用')
      return
    }
    const endpoint = {
      ...draft,
      protocol: wsMode ? 'websocket' : (draft.protocol || 'http'),
      name: draft.name || (wsMode ? 'WS ' : draft.method + ' ') + draft.url,
      responses: draft.responses.length ? draft.responses : [],
    }
    Promise.resolve()
      .then(() => storage.saveEndpoint(project.id, endpoint))
      .then((saved) => {
        setSavedHint('已保存：' + ((saved && saved.name) || endpoint.name))
        setDraft((prev) => ({ ...prev, id: (saved && saved.id) || prev.id }))
      })
      .catch((err) => setSavedHint('保存失败：' + (err && err.message ? err.message : String(err))))
  }

  // —— RPC（gRPC / Dubbo）发送：结果进右侧响应面板，错误形态与 ws/send 同款（页内显示，不弹窗）——
  const enabledRpcRows = (rows) => (Array.isArray(rows) ? rows : []).filter((r) => r && r.enabled !== false && r.key)
  // host 侧 metadata/attachments 要的是普通对象 {k:v}（不是 ParamTable 行数组），在这里收敛
  const rowsToObject = (rows) => {
    const out = {}
    for (const r of enabledRpcRows(rows)) out[String(r.key)] = r.value == null ? '' : String(r.value)
    return out
  }

  const rpcSend = () => {
    const face = grpcMode ? (apiRef && apiRef.grpc) : (apiRef && apiRef.dubbo)
    const faceName = grpcMode ? 'api.grpc' : 'api.dubbo'
    const cancelled = { cancelled: false }
    abortRef.current = cancelled
    const fail = (message) => setResp({ status: 0, statusText: '', headers: {}, body: '', bodySize: 0, timeMs: 0, error: { message } })
    if (!face || typeof face.invoke !== 'function') {
      fail(faceName + ' 不可用（桥降级或宿主未注入）')
      return
    }
    const address = String(draft.url || '').trim()
    const timeout = timeoutMs > 0 ? timeoutMs : 30000
    let dubboArgs = null
    let grpcMessage = null
    let call
    if (grpcMode) {
      // host 要求 message 是 JSON 对象：textarea 文本在这里解析（空串视为 {}）
      const raw = String(draft.rpcMessage || '').trim()
      if (raw !== '') {
        try {
          grpcMessage = JSON.parse(raw)
        } catch (err) {
          fail('Message JSON 解析失败：' + (err && err.message ? err.message : String(err)))
          return
        }
      } else {
        grpcMessage = {}
      }
      call = face.invoke({
        address,
        proto: draft.rpcProto || '',
        service: draft.rpcService || '',
        method: draft.rpcMethod || '',
        message: grpcMessage,
        metadata: rowsToObject(draft.headers),
        timeoutMs: timeout,
      })
    } else {
      dubboArgs = parseJsonArray(draft.rpcArgs)
      if (dubboArgs === null) {
        fail('Args JSON 解析失败：需要 JSON 数组，如 [1, "a", {"k":"v"}]')
        return
      }
      call = face.invoke({
        address,
        interface: draft.rpcInterface || '',
        version: draft.rpcVersion || '',
        group: draft.rpcGroup || '',
        method: draft.rpcMethod || '',
        parameterTypes: String(draft.rpcParamTypes || '').split(',').map((s) => s.trim()).filter(Boolean),
        args: dubboArgs,
        generic: draft.rpcGeneric !== false,
        attachments: rowsToObject(draft.headers),
        timeoutMs: timeout,
      })
    }
    setSending(true)
    setResp(null)
    Promise.resolve()
      .then(() => call)
      .then((result) => {
        if (cancelled.cancelled) return
        // 桩返回 { ok:false, error }；桥成功返回 data（无 ok 包装）——两种形态都处理
        if (result && result.ok === false) {
          setResp({ status: 0, statusText: '', headers: {}, body: '', bodySize: 0, timeMs: 0,
            error: { message: (result.error && result.error.message) || '调用失败' } })
          return
        }
        const data = result && typeof result === 'object' ? result : {}
        setResp(grpcMode ? {
          // status 胶囊吃 gRPC 的 statusCode；trailers 进 Headers 页签
          status: Number(data.statusCode) || 0,
          statusText: 'gRPC',
          headers: data.trailers && typeof data.trailers === 'object' ? data.trailers : {},
          body: prettyJson(data.message),
          bodySize: 0,
          timeMs: data.timeMs == null ? 0 : data.timeMs,
        } : {
          status: Number(data.status) || 200,
          statusText: 'Dubbo',
          headers: {},
          body: data.value == null ? '' : prettyJson(JSON.stringify(data.value)),
          bodySize: 0,
          timeMs: data.timeMs == null ? 0 : data.timeMs,
        })
        setError('')
      })
      .catch((err) => {
        if (cancelled.cancelled) return
        fail(errText(err))
      })
      .finally(() => { if (!cancelled.cancelled) setSending(false) })
  }

  // —— 项目设置全族：归一化的本地草稿 + 保存（renameProject + saveProjectSettings）——
  const patchProj = (field, value) => setProjSettings((prev) => ({ ...prev, [field]: value }))
  const patchProjAuth = (field, value) => setProjSettings((prev) => ({ ...prev, globalAuth: { ...prev.globalAuth, [field]: value } }))
  const patchProjParams = (group, rows) => setProjSettings((prev) => ({ ...prev, globalParams: { ...prev.globalParams, [group]: rows } }))

  const saveProjSettings = () => {
    const storage = apiRef && apiRef.storage
    const pid = project && project.id
    if (!storage || typeof storage.saveProjectSettings !== 'function' || !pid) {
      setProjSaveHint('保存失败：storage.saveProjectSettings 不可用')
      setProjSaveBad(true)
      return
    }
    const name = String(projSettings.name || '').trim()
    if (!name) {
      setProjSaveHint('项目名不能为空')
      setProjSaveBad(true)
      return
    }
    const payload = {
      name,
      description: projSettings.description,
      globalParams: projSettings.globalParams,
      globalAuth: projSettings.globalAuth,
      preScript: projSettings.preScript,
      postScript: projSettings.postScript,
    }
    setProjSaveHint('')
    Promise.resolve()
      .then(async () => {
        // 基本信息：改名走 renameProject（索引同步），其余键走 saveProjectSettings（name/description 由 host 同步进 project）
        if (typeof storage.renameProject === 'function') await storage.renameProject(pid, name)
        return storage.saveProjectSettings(pid, payload)
      })
      .then((savedSettings) => {
        setProject((prev) => ({
          ...prev,
          name,
          description: projSettings.description,
          settings: { ...(prev.settings || {}), ...(savedSettings || payload) },
        }))
        // 本地 project.settings 已更新：下一次「发送」直接吃到全局参数 / 认证 / 项目级脚本
        setProjSaveHint('已保存项目设置')
        setProjSaveBad(false)
      })
      .catch((err) => {
        setProjSaveHint('保存失败：' + errText(err))
        setProjSaveBad(true)
      })
  }

  // —— WebSocket 模式动作：连接 / 发送消息 / 断开 ——
  const wsConnect = () => {
    const wsApi = apiRef && apiRef.ws
    if (!wsApi || typeof wsApi.open !== 'function') {
      setWsState((prev) => ({ ...prev, status: 'unavailable', error: { kind: 'unavailable', message: 'api.ws 不可用' } }))
      return
    }
    const payload = buildWsPayload(draft, finalUrl, {
      globals: project && project.globals ? project.globals.variables || [] : [],
      environment: env && Array.isArray(env.variables) ? env.variables : [],
      local: [],
    })
    wsIndexRef.current = 0
    setWsState({ id: '', status: 'connecting', messages: [], error: null })
    wsApi.open({ ...payload, timeoutMs: timeoutMs > 0 ? timeoutMs : 30000 })
      .then((result) => {
        const messages = Array.isArray(result && result.messages) ? result.messages : []
        wsIndexRef.current = messages.length
        setWsState({
          id: (result && result.id) || '',
          url: (result && result.url) || '',
          status: (result && result.status) || 'closed',
          messages,
          error: (result && result.error) || null,
        })
      })
      .catch((err) => setWsState({ id: '', url: '', status: 'error', messages: [], error: { kind: 'client', message: err && err.message ? err.message : String(err) } }))
  }

  const wsDisconnect = () => {
    const wsApi = apiRef && apiRef.ws
    if (!wsApi || typeof wsApi.close !== 'function' || !wsState.id) return
    wsApi.close({ id: wsState.id })
      .then(() => setWsState((prev) => ({ ...prev, status: 'closed' })))
      .catch(() => setWsState((prev) => ({ ...prev, status: 'closed' })))
  }

  const wsSend = () => {
    const wsApi = apiRef && apiRef.ws
    if (!wsApi || typeof wsApi.send !== 'function' || !wsState.id) return
    const text = String(wsInput)
    wsApi.send({ id: wsState.id, message: text })
      .then((result) => {
        if (result && result.ok === false) {
          setWsState((prev) => ({ ...prev, error: result.error || { kind: 'client', message: '发送失败' } }))
          return
        }
        setWsState((prev) => ({ ...prev, status: (result && result.status) || prev.status, messages: [...prev.messages, { direction: 'out', at: new Date().toISOString(), data: text, binary: false }] }))
        setWsInput('')
        pollWsMessages()
      })
      .catch((err) => setWsState((prev) => ({ ...prev, error: { kind: 'client', message: err && err.message ? err.message : String(err) } })))
  }

  // —— 数据库页签动作：测试连接 / 执行 SQL / 保存连接 / 载入连接 ——
  const dbPatch = (field, value) => setDbConfig((prev) => ({ ...prev, [field]: value }))

  const dbTest = () => {
    const dbApi = apiRef && apiRef.db
    if (!dbApi || typeof dbApi.test !== 'function') { setDbHint('api.db 不可用（桥降级）'); return }
    setDbBusy(true)
    setDbHint('')
    dbApi.test({ connection: dbConfig })
      .then((result) => {
        if (result && result.ok) setDbHint('连接成功（' + result.driver + '）')
        else setDbHint('连接失败：' + ((result && result.error && result.error.message) || '未知错误'))
      })
      .catch((err) => setDbHint('连接失败：' + (err && err.message ? err.message : String(err))))
      .finally(() => setDbBusy(false))
  }

  const dbRun = () => {
    const dbApi = apiRef && apiRef.db
    if (!dbApi || typeof dbApi.query !== 'function') { setDbHint('api.db 不可用（桥降级）'); return }
    setDbBusy(true)
    setDbHint('')
    dbApi.query({ connection: dbConfig, sql: dbSql })
      .then((result) => { setDbResult(result) })
      .catch((err) => { setDbResult(null); setDbHint('执行失败：' + (err && err.message ? err.message : String(err))) })
      .finally(() => setDbBusy(false))
  }

  const dbSave = () => {
    const storage = apiRef && apiRef.storage
    if (!storage || typeof storage.saveProjectSettings !== 'function' || !project || !project.id) {
      setDbHint('保存失败：storage.saveProjectSettings 不可用')
      return
    }
    const name = (dbConfig.type === 'sqlite' ? dbConfig.path : dbConfig.type === 'mongodb' ? (dbConfig.url || dbConfig.host) : dbConfig.host) || dbConfig.type
    const next = [...dbConnections.filter((c) => c && c.name !== name), { ...dbConfig, name }]
    storage.saveProjectSettings(project.id, { dbConnections: next })
      .then(() => setProject((prev) => ({ ...prev, settings: { ...(prev.settings || {}), dbConnections: next } })))
      .then(() => setDbHint('已保存连接：' + name))
      .catch((err) => setDbHint('保存失败：' + (err && err.message ? err.message : String(err))))
  }

  const dbLoad = (name) => {
    const hit = dbConnections.find((c) => c && c.name === name)
    if (!hit) return
    setDbConfig({ type: 'sqlite', path: '', url: '', host: '', port: '', user: '', password: '', database: '', ssl: false, ...hit })
    setDbHint('已载入连接：' + name)
  }

  const dbDelete = (name) => {
    const storage = apiRef && apiRef.storage
    if (!storage || typeof storage.saveProjectSettings !== 'function' || !project || !project.id) return
    const next = dbConnections.filter((c) => c && c.name !== name)
    storage.saveProjectSettings(project.id, { dbConnections: next })
      .then(() => setProject((prev) => ({ ...prev, settings: { ...(prev.settings || {}), dbConnections: next } })))
      .catch(() => { /* 列表刷新失败不打断 */ })
  }

  const wsPanel = (
    <section className="pp-pane pp-debug-response" data-ws="1">
      <div className="pp-group-head">
        <span className="pp-group-title">消息日志</span>
        <span className={'pp-pill ' + (wsState.status === 'open' ? 'pp-pill-ok' : wsState.status === 'connecting' ? 'pp-pill-warn' : '')}>
          {wsState.status === 'idle' ? '未连接' : wsState.status === 'connecting' ? '连接中' : wsState.status === 'open' ? '已连接' : wsState.status === 'closed' ? '已断开' : wsState.status}
        </span>
        <button className="pp-btn pp-btn-link" onClick={pollWsMessages} disabled={!wsState.id}>刷新</button>
      </div>
      {wsState.error ? <p className="pp-note pp-note-bad">{wsState.error.message}</p> : null}
      {wsState.url ? <p className="pp-meta pp-ellipsis" title={wsState.url}>{wsState.url}</p> : null}
      {wsState.messages.length === 0 ? (
        <EmptyState title="暂无消息" hint="连接建立后，收发的消息会按时间顺序显示在这里。" />
      ) : (
        <div className="pp-pre" style={{ maxHeight: 360, overflowY: 'auto' }}>
          {wsState.messages.map((m, i) => (
            <div key={i} className="pp-form-row" style={{ alignItems: 'baseline' }}>
              <span className="pp-meta">{wsTime(m.at)} {WS_DIR_LABEL[m.direction] || '·'}</span>
              <span className="pp-mono" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {m.event ? String(m.event) + (m.code != null ? ` (${m.code}${m.reason ? ' ' + m.reason : ''})` : '') : (m.binary ? '[二进制 base64] ' : '') + String(m.data == null ? '' : m.data)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )

  const responsePanel = (
    <section className="pp-pane pp-debug-response">
      <ResponsePanel resp={resp} sending={sending} onCancel={cancel} />
    </section>
  )
  return (
    <div className="pp-scope pp-page-flush" data-page="debug" ref={rootRef}>
      {/* Apifox 调试页是单栏：接口树就是左侧全局导航，页面内不再自带一份。
          之前自带 .pp-pane 树面板，窄容器下收成单列后变成一张铺满宽度的空白卡。 */}
      <div className="pp-debug-page pp-debug-split">
        <section className="pp-pane pp-debug-request">
          {/* URL 行（Apifox .main-input-bar）：40px 高，方法 + baseUrl 胶囊 + path + 发送按钮组 */}
          <div className="pp-url-row">
            {/* 协议切换：HTTP / WebSocket / gRPC / Dubbo（Apifox 调试台同款四态）；WS/RPC 模式无 HTTP 方法语义 */}
            <select
              className="pp-select pp-input-sm"
              value={draft.protocol || 'http'}
              onChange={(e) => {
                patch('protocol', e.target.value)
                // 切协议后当前页签可能不在新协议的页签集里（如 Body/Auth），落回 Params
                const nextTabs = e.target.value === 'websocket' ? WS_TABS
                  : (e.target.value === 'grpc' || e.target.value === 'dubbo') ? RPC_TABS
                  : TABS
                setTab((prev) => (nextTabs.some((t) => t.id === prev) ? prev : 'params'))
              }}
              aria-label="协议"
              title="WebSocket 走 WS 调试模式；gRPC / Dubbo 走 RPC 调用面板；其余协议回落 HTTP"
            >
              <option value="http">HTTP</option>
              <option value="websocket">WebSocket</option>
              <option value="grpc">gRPC</option>
              <option value="dubbo">Dubbo</option>
            </select>
            {wsMode ? (
              <span className="pp-method" data-method="WS" title="WebSocket 连接">WS</span>
            ) : rpcMode ? (
              <span className="pp-method" data-method="RPC" title={grpcMode ? 'gRPC 调用' : 'Dubbo 调用'}>RPC</span>
            ) : (
              <>
                <span className="pp-method" data-method={draft.method}>{draft.method}</span>
                <select
                  className="pp-select pp-url-method"
                  value={draft.method}
                  onChange={(e) => patch('method', e.target.value)}
                  aria-label="请求方法"
                >
                  {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </>
            )}
            <span className="pp-url-pill" title={env && env.baseUrl ? env.baseUrl : '未配置 baseUrl'}>
              {env && env.baseUrl ? env.baseUrl : '未配置 baseUrl'}
            </span>
            <input
              className="pp-input pp-input-mono"
              value={draft.url}
              placeholder={wsMode
                ? 'ws://TARGET/path 或 /path（拼 baseUrl），支持 {{var}}'
                : grpcMode
                  ? 'http(s)://TARGET:port，支持 {{var}}'
                  : dubboMode
                    ? 'TARGET:port（Dubbo 地址），支持 {{var}}'
                    : '/api/v1/... 或 https://TARGET/endpoint，支持 {{var}}'}
              onChange={(e) => patch('url', e.target.value)}
              aria-label="请求路径"
            />
            <span className="pp-send-group">
              {wsMode ? (
                wsState.status === 'open' ? (
                  <button className="pp-btn" onClick={wsDisconnect} title="断开 WebSocket 连接">断开</button>
                ) : (
                  <button className="pp-btn pp-btn-primary" onClick={wsConnect}
                    disabled={wsState.status === 'connecting' || !String(draft.url || '').trim()}
                    title={String(draft.url || '').trim() ? '' : '先填写连接地址'}>
                    {wsState.status === 'connecting' ? '连接中…' : '连接'}
                  </button>
                )
              ) : rpcMode ? (
                <button className="pp-btn pp-btn-primary" onClick={rpcSend}
                  disabled={sending || !String(draft.url || '').trim()}
                  title={String(draft.url || '').trim() ? '' : '先填写 RPC 地址'}>
                  {sending ? '发送中…' : '发送'}
                </button>
              ) : (
                <>
                  <button className="pp-btn pp-btn-primary" onClick={send} disabled={sending || !String(draft.url || '').trim()}
                    title={String(draft.url || '').trim() ? '' : '先填写请求路径'}>
                    {sending ? '发送中…' : '发送'}
                  </button>
                  <button className="pp-btn" onClick={cancel} disabled={!sending} title="取消本次发送">✕</button>
                </>
              )}
            </span>
          </div>

          {/* 环境 + 实际地址 + 变量：压成一行元信息，不再各占一行 */}
          <div className="pp-debug-meta">
            <select className="pp-select pp-input-sm" value={envId} onChange={(e) => setEnvId(e.target.value)}
              aria-label="环境">
              {envs.length === 0 ? <option value="">（无环境）</option> : null}
              {envs.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <span className="pp-mono pp-meta pp-ellipsis" title={finalUrl || ''}>
              {finalUrl || '（未填写 URL）'}
            </span>
            {varRefs.length > 0 ? (
              <span className="pp-meta">
                变量 {varRefs.join('、')}
                {missingVars.length > 0 ? '（未定义：' + missingVars.join('、') + '）' : '（均已定义）'}
              </span>
            ) : null}
            <a className="pp-meta" href="#/history">请求历史</a>
            <button className="pp-btn pp-btn-sm pp-btn-ghost"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(buildCurl({
                    method: draft.method, url: draft.url,
                    params: draft.params, headers: draft.headers, auth: draft.auth, body: draft.body,
                  }, env && env.baseUrl))
                  setSavedHint('已复制 cURL')
                } catch (err) {
                  setSavedHint('复制失败：' + (err && err.message ? err.message : String(err)))
                }
              }}>复制 cURL</button>
          </div>
          {/* 空项目引导：真实项目还没有接口时，URL 为空、发送无意义，明确指引去哪里建 */}
          {!isMock && !String(draft.url || '').trim() ? (
            <p className="pp-note">
              当前项目还没有接口，先到 <a href="#/doc">接口文档</a> 或 <a href="#/overview">总览</a> 新建一个，也可以直接在上方填写完整 URL 调试。
            </p>
          ) : null}
          {isMock ? <p className="pp-note pp-note-warn">示例数据 — window.__postapiApi 未注入或读取失败，发送将返回 mock 响应</p> : null}
          {error ? <p className="pp-note pp-note-bad">{error}</p> : null}

          {/* —— RPC（gRPC / Dubbo）调用面板：位于 URL 行下、页签条上；metadata/attachments 复用 Headers 页签 —— */}
          {rpcMode ? (
            <div data-rpc-panel="true">
              {grpcMode ? (
                <div>
                  <div className="pp-form-row">
                    <label className="pp-form-label">service</label>
                    <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={draft.rpcService}
                      placeholder="包名.服务名，如 pkg.Greeter" onChange={(e) => patch('rpcService', e.target.value)} aria-label="gRPC service" />
                  </div>
                  <div className="pp-form-row">
                    <label className="pp-form-label">method</label>
                    <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={draft.rpcMethod}
                      placeholder="如 SayHello" onChange={(e) => patch('rpcMethod', e.target.value)} aria-label="gRPC method" />
                  </div>
                  <div className="pp-form-row">
                    <label className="pp-form-label">.proto</label>
                    <textarea
                      className="pp-textarea pp-input-mono"
                      rows={8}
                      style={{ width: '100%' }}
                      value={draft.rpcProto}
                      placeholder="粘贴 .proto 全文（service / message 定义）"
                      onChange={(e) => patch('rpcProto', e.target.value)}
                      aria-label="proto 定义"
                    />
                  </div>
                  <div className="pp-form-row">
                    <label className="pp-form-label">消息 JSON</label>
                    <textarea
                      className="pp-textarea pp-input-mono"
                      rows={6}
                      style={{ width: '100%' }}
                      value={draft.rpcMessage}
                      placeholder='{ "name": "world" }'
                      onChange={(e) => patch('rpcMessage', e.target.value)}
                      aria-label="gRPC 消息"
                    />
                  </div>
                  <p className="pp-meta">metadata 在 Headers 页签维护（启用行生效）；结果含 trailers，status 胶囊显示 gRPC statusCode。</p>
                </div>
              ) : (
                <div>
                  <div className="pp-form-row">
                    <label className="pp-form-label">interface</label>
                    <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={draft.rpcInterface}
                      placeholder="如 com.example.UserService" onChange={(e) => patch('rpcInterface', e.target.value)} aria-label="Dubbo interface" />
                  </div>
                  <div className="pp-form-row">
                    <label className="pp-form-label">method</label>
                    <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={draft.rpcMethod}
                      placeholder="如 getUser" onChange={(e) => patch('rpcMethod', e.target.value)} aria-label="Dubbo method" />
                  </div>
                  <div className="pp-form-row">
                    <label className="pp-form-label">version</label>
                    <input className="pp-input pp-input-mono" style={{ flex: 1, maxWidth: 160 }} value={draft.rpcVersion}
                      placeholder="如 1.0.0（可空）" onChange={(e) => patch('rpcVersion', e.target.value)} aria-label="Dubbo version" />
                  </div>
                  <div className="pp-form-row">
                    <label className="pp-form-label">group</label>
                    <input className="pp-input pp-input-mono" style={{ flex: 1, maxWidth: 160 }} value={draft.rpcGroup}
                      placeholder="分组（可空）" onChange={(e) => patch('rpcGroup', e.target.value)} aria-label="Dubbo group" />
                  </div>
                  <div className="pp-form-row">
                    <label className="pp-form-label">参数类型</label>
                    <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={draft.rpcParamTypes}
                      placeholder="逗号分隔，如 java.lang.String,java.lang.Integer"
                      onChange={(e) => patch('rpcParamTypes', e.target.value)} aria-label="parameterTypes" />
                  </div>
                  <div className="pp-form-row">
                    <label className="pp-form-label">Args JSON</label>
                    <textarea
                      className="pp-textarea pp-input-mono"
                      rows={5}
                      style={{ width: '100%' }}
                      value={draft.rpcArgs}
                      placeholder='[ "alice", 18 ]'
                      onChange={(e) => patch('rpcArgs', e.target.value)}
                      aria-label="Dubbo 参数"
                    />
                  </div>
                  <div className="pp-form-row">
                    <label className="pp-form-label">泛化调用</label>
                    <input type="checkbox" checked={draft.rpcGeneric !== false} onChange={(e) => patch('rpcGeneric', e.target.checked)} aria-label="泛化调用" />
                    <span className="pp-meta">generic=true（默认）：无需本地接口类，宿主按 parameterTypes + args 发起泛化调用</span>
                  </div>
                  <p className="pp-meta">attachments 在 Headers 页签维护（启用行生效）；结果 value 以 JSON 展示。</p>
                </div>
              )}
            </div>
          ) : null}

          <div className="pp-tabs">
            {activeTabs.map((t) => (
              <button key={t.id} className="pp-tab" data-active={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </div>

          <div className="pp-debug-tabbody">
            {tab === 'params' ? (
              <div>
                <div className="pp-group-title">Path 参数</div>
                <div className="pp-table-wrap"><ParamTable rows={draft.pathParams} onChange={(rows) => patch('pathParams', rows)} emptyText="无 Path 参数" /></div>
                <div className="pp-group-title">Query 参数</div>
                <div className="pp-table-wrap"><ParamTable rows={draft.params} onChange={(rows) => patch('params', rows)} emptyText="无 Query 参数" /></div>
              </div>
            ) : null}
            {tab === 'headers' ? (
              <div>
                {/* 分组标题行：标题靠左、动作靠右（.pp-group-head 布局类见 design-tokens.css） */}
                <div className="pp-group-head">
                  {/* 右对齐由 .pp-group-head 的 space-between 与 > .pp-group-title 的 margin-right:auto 负责 */}
                  <span className="pp-group-title">请求头</span>
                  <button className="pp-btn pp-btn-link" onClick={addCommonHeaders} title="追加 3 条常用请求头">+ 常用请求头</button>
                </div>
                <div className="pp-table-wrap">
                  <ParamTable
                    rows={draft.headers}
                    onChange={(rows) => patch('headers', rows)}
                    suggest={filterHeaders}
                    emptyText="无请求头"
                  />
                </div>
                <div className="pp-group-title">Cookies</div>
                <div className="pp-table-wrap"><ParamTable rows={draft.cookies} onChange={(rows) => patch('cookies', rows)} emptyText="无 Cookies" /></div>
              </div>
            ) : null}
            {tab === 'body' ? (
              <BodyEditor value={draft.body} onChange={(next) => patch('body', next)} />
            ) : null}
            {tab === 'script' ? (
              <ScriptPanel
                value={{ preScript: draft.preScript, postScript: draft.postScript, assertions: draft.assertions, waitMs: draft.waitMs }}
                onChange={(next) => setDraft((prev) => ({ ...prev, ...next }))}
              />
            ) : null}
            {tab === 'settings' ? (
              <div>
                <div className="pp-group-title">发送设置</div>
                <div className="pp-form-row">
                  <label className="pp-form-label">超时 (ms)</label>
                  <input className="pp-input" style={{ flex: 1, maxWidth: 160 }} value={String(timeoutMs)}
                    onChange={(e) => setTimeoutMs(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)} />
                </div>
                <div className="pp-form-row">
                  <label className="pp-form-label">等待 (ms)</label>
                  <input className="pp-input" style={{ flex: 1, maxWidth: 160 }} value={String(draft.waitMs || 0)}
                    onChange={(e) => patch('waitMs', Number(e.target.value.replace(/[^0-9]/g, '')) || 0)} />
                </div>
                <div className="pp-group-title">请求概览</div>
                <table className="pp-table">
                  <tbody>
                    <tr><td className="pp-meta">方法</td><td><span className="pp-method" data-method={draft.method}>{draft.method}</span></td></tr>
                    <tr><td className="pp-meta">完整 URL</td><td className="pp-mono pp-ellipsis">{finalUrl || '（未填写）'}</td></tr>
                    <tr><td className="pp-meta">环境</td><td>{env ? env.name : '（无环境）'}</td></tr>
                    <tr><td className="pp-meta">变量</td><td>{varRefs.length ? varRefs.join('、') + (missingVars.length ? '（未定义：' + missingVars.join('、') + '）' : '（均已定义）') : '无'}</td></tr>
                    <tr><td className="pp-meta">已启用参数</td><td>{draft.params.filter((p) => p && p.enabled !== false && p.key).length} 个 Query / {draft.pathParams.filter((p) => p && p.enabled !== false && p.key).length} 个 Path</td></tr>
                    <tr><td className="pp-meta">已启用请求头</td><td>{draft.headers.filter((h) => h && h.enabled !== false && h.key).length} 个</td></tr>
                  </tbody>
                </table>
              </div>
            ) : null}
            {tab === 'projSettings' ? (
              <div data-proj-settings="true">
                {/* 顶部保存条：保存按钮 + 行内结果文案（成功 ok / 失败 bad，不弹窗） */}
                <div className="pp-group-head">
                  <span className="pp-group-title">项目设置</span>
                  <button className="pp-btn pp-btn-primary" onClick={saveProjSettings}>保存项目设置</button>
                </div>
                {projSaveHint ? (
                  <p className={'pp-note ' + (projSaveBad ? 'pp-note-bad' : 'pp-note-ok')} data-proj-save-hint="true">{projSaveHint}</p>
                ) : null}
                <div className="pp-tabs pp-sub-tabs">
                  {PROJ_SUBTABS.map((t) => (
                    <button key={t.id} className="pp-tab" data-active={projSub === t.id} onClick={() => setProjSub(t.id)}>{t.label}</button>
                  ))}
                </div>
                {projSub === 'basic' ? (
                  <div>
                    <div className="pp-form-row">
                      <label className="pp-form-label">项目名</label>
                      <input className="pp-input" style={{ flex: 1 }} value={projSettings.name}
                        onChange={(e) => patchProj('name', e.target.value)} aria-label="项目名" />
                    </div>
                    <div className="pp-form-row">
                      <label className="pp-form-label">描述</label>
                      <input className="pp-input" style={{ flex: 1 }} value={projSettings.description}
                        placeholder="项目描述（可选）"
                        onChange={(e) => patchProj('description', e.target.value)} aria-label="项目描述" />
                    </div>
                    <p className="pp-meta">保存时写 project.name / project.description（renameProject + saveProjectSettings 同步）。</p>
                  </div>
                ) : null}
                {projSub === 'globalParams' ? (
                  <div>
                    <div className="pp-group-title">全局请求头（接口同名头优先）</div>
                    <div className="pp-table-wrap">
                      <ParamTable rows={projSettings.globalParams.headers} onChange={(rows) => patchProjParams('headers', rows)} emptyText="无全局请求头" />
                    </div>
                    <div className="pp-group-title">全局 Query 参数（接口同名参数优先）</div>
                    <div className="pp-table-wrap">
                      <ParamTable rows={projSettings.globalParams.query} onChange={(rows) => patchProjParams('query', rows)} emptyText="无全局 Query 参数" />
                    </div>
                    <div className="pp-group-title">全局 Cookies（排在接口 Cookies 之后合并为 Cookie 头）</div>
                    <div className="pp-table-wrap">
                      <ParamTable rows={projSettings.globalParams.cookies} onChange={(rows) => patchProjParams('cookies', rows)} emptyText="无全局 Cookies" />
                    </div>
                  </div>
                ) : null}
                {projSub === 'globalAuth' ? (
                  <div>
                    <p className="pp-meta">接口 Auth 类型为「无认证」时全局认证兜底生效；接口自带认证时不覆盖。</p>
                    <div className="pp-form-row">
                      <label className="pp-form-label">类型</label>
                      <select className="pp-select" value={projSettings.globalAuth.type} onChange={(e) => patchProjAuth('type', e.target.value)}>
                        {AUTH_TYPES.map((t) => <option key={t} value={t}>{AUTH_LABEL[t] || t}</option>)}
                      </select>
                    </div>
                    {projSettings.globalAuth.type === 'bearer' ? (
                      <div className="pp-form-row">
                        <label className="pp-form-label">Token</label>
                        <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={projSettings.globalAuth.token}
                          onChange={(e) => patchProjAuth('token', e.target.value)} />
                      </div>
                    ) : null}
                    {projSettings.globalAuth.type === 'basic' ? (
                      <div>
                        <div className="pp-form-row">
                          <label className="pp-form-label">用户名</label>
                          <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={projSettings.globalAuth.username}
                            onChange={(e) => patchProjAuth('username', e.target.value)} />
                        </div>
                        <div className="pp-form-row">
                          <label className="pp-form-label">密码</label>
                          <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={projSettings.globalAuth.password}
                            onChange={(e) => patchProjAuth('password', e.target.value)} />
                        </div>
                      </div>
                    ) : null}
                    {projSettings.globalAuth.type === 'apikey' ? (
                      <div>
                        <div className="pp-form-row">
                          <label className="pp-form-label">Key</label>
                          <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={projSettings.globalAuth.key}
                            onChange={(e) => patchProjAuth('key', e.target.value)} />
                        </div>
                        <div className="pp-form-row">
                          <label className="pp-form-label">Value</label>
                          <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={projSettings.globalAuth.value}
                            onChange={(e) => patchProjAuth('value', e.target.value)} />
                        </div>
                        <div className="pp-form-row">
                          <label className="pp-form-label">位置</label>
                          <select className="pp-select" value={projSettings.globalAuth.addTo} onChange={(e) => patchProjAuth('addTo', e.target.value)}>
                            <option value="header">header</option>
                            <option value="query">query</option>
                          </select>
                        </div>
                      </div>
                    ) : null}
                    {projSettings.globalAuth.type === 'none' ? <p className="pp-meta">无认证</p> : null}
                  </div>
                ) : null}
                {projSub === 'scripts' ? (
                  <div>
                    <div className="pp-form-row" style={{ alignItems: 'flex-start' }}>
                      <label className="pp-form-label">项目前置脚本</label>
                      <textarea
                        className="pp-textarea pp-input-mono"
                        rows={6}
                        style={{ flex: 1 }}
                        placeholder="// 早于接口前置脚本执行，可用 pm.request / pm.environment.set / console.log"
                        value={projSettings.preScript}
                        onChange={(e) => patchProj('preScript', e.target.value)}
                        aria-label="项目前置脚本"
                      />
                    </div>
                    <div className="pp-form-row" style={{ alignItems: 'flex-start' }}>
                      <label className="pp-form-label">项目后置脚本</label>
                      <textarea
                        className="pp-textarea pp-input-mono"
                        rows={6}
                        style={{ flex: 1 }}
                        placeholder="// 晚于接口后置脚本执行，可用 pm.response / pm.test / pm.globals.set"
                        value={projSettings.postScript}
                        onChange={(e) => patchProj('postScript', e.target.value)}
                        aria-label="项目后置脚本"
                      />
                    </div>
                    <p className="pp-meta">pm.* 沙箱执行：日志前缀分别为「project pre 」「project post 」，与接口脚本共用同一沙箱。</p>
                  </div>
                ) : null}
              </div>
            ) : null}
            {tab === 'db' ? (
              <div>
                <div className="pp-group-head">
                  <span className="pp-group-title">数据库连接</span>
                  <button className="pp-btn pp-btn-link" onClick={dbTest} disabled={dbBusy}>测试连接</button>
                </div>
                <div className="pp-form-row">
                  <label className="pp-form-label">驱动</label>
                  <select className="pp-select" value={dbConfig.type} onChange={(e) => dbPatch('type', e.target.value)}>
                    {DB_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                {dbConfig.type === 'sqlite' ? (
                  <div className="pp-form-row">
                    <label className="pp-form-label">文件路径</label>
                    <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={dbConfig.path} placeholder="/path/to/data.db 或 :memory:"
                      onChange={(e) => dbPatch('path', e.target.value)} />
                  </div>
                ) : dbConfig.type === 'mongodb' ? (
                  <div>
                    <div className="pp-form-row">
                      <label className="pp-form-label">连接 URL</label>
                      <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={dbConfig.url} aria-label="MongoDB URL"
                        placeholder="mongodb://user:pass@127.0.0.1:27017（填了 URL 则忽略下方主机/端口）"
                        onChange={(e) => dbPatch('url', e.target.value)} />
                    </div>
                    <div className="pp-form-row">
                      <label className="pp-form-label">主机</label>
                      <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={dbConfig.host} onChange={(e) => dbPatch('host', e.target.value)} />
                    </div>
                    <div className="pp-form-row">
                      <label className="pp-form-label">端口</label>
                      <input className="pp-input pp-input-sm" style={{ flex: 1, maxWidth: 120 }} value={dbConfig.port} placeholder="27017（默认）"
                        onChange={(e) => dbPatch('port', e.target.value)} />
                    </div>
                    <div className="pp-form-row">
                      <label className="pp-form-label">用户名</label>
                      <input className="pp-input" style={{ flex: 1 }} value={dbConfig.user} onChange={(e) => dbPatch('user', e.target.value)} />
                    </div>
                    <div className="pp-form-row">
                      <label className="pp-form-label">密码</label>
                      <input className="pp-input" type="password" style={{ flex: 1 }} value={dbConfig.password} onChange={(e) => dbPatch('password', e.target.value)} />
                    </div>
                    <div className="pp-form-row">
                      <label className="pp-form-label">数据库</label>
                      <input className="pp-input" style={{ flex: 1 }} value={dbConfig.database} onChange={(e) => dbPatch('database', e.target.value)} />
                    </div>
                    <p className="pp-meta">MongoDB 执行的是命令文档：下方输入 JSON，如 {'{"find":"users","filter":{},"limit":10}'}</p>
                  </div>
                ) : (
                  <div>
                    <div className="pp-form-row">
                      <label className="pp-form-label">主机</label>
                      <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={dbConfig.host} onChange={(e) => dbPatch('host', e.target.value)} />
                    </div>
                    <div className="pp-form-row">
                      <label className="pp-form-label">端口</label>
                      <input className="pp-input pp-input-sm" style={{ flex: 1, maxWidth: 120 }} value={dbConfig.port}
                        placeholder={DB_DEFAULT_PORT[dbConfig.type] || ''}
                        onChange={(e) => dbPatch('port', e.target.value)} />
                    </div>
                    <div className="pp-form-row">
                      <label className="pp-form-label">用户名</label>
                      <input className="pp-input" style={{ flex: 1 }} value={dbConfig.user} onChange={(e) => dbPatch('user', e.target.value)} />
                    </div>
                    <div className="pp-form-row">
                      <label className="pp-form-label">密码</label>
                      <input className="pp-input" type="password" style={{ flex: 1 }} value={dbConfig.password} onChange={(e) => dbPatch('password', e.target.value)} />
                    </div>
                    <div className="pp-form-row">
                      <label className="pp-form-label">{dbConfig.type === 'oracle' ? '服务名（ServiceName）' : '数据库'}</label>
                      <input className="pp-input" style={{ flex: 1 }} value={dbConfig.database} onChange={(e) => dbPatch('database', e.target.value)} />
                    </div>
                    {DB_SSL_TYPES.includes(dbConfig.type) ? (
                      <div className="pp-form-row">
                        <label className="pp-form-label">SSL</label>
                        <input type="checkbox" checked={Boolean(dbConfig.ssl)} onChange={(e) => dbPatch('ssl', e.target.checked)} aria-label="SSL" />
                        <span className="pp-meta">可选：启用 TLS 连接（服务端需支持）</span>
                      </div>
                    ) : null}
                    {dbConfig.type === 'mongodb' || dbConfig.type === 'redis' ? (
                      <p className="pp-meta">{dbConfig.type === 'redis' ? 'Redis 执行单条命令：如 GET mykey / HGETALL myhash' : null}</p>
                    ) : null}
                  </div>
                )}
                {dbConnections.length > 0 ? (
                  <div className="pp-form-row">
                    <label className="pp-form-label">已存连接</label>
                    <select className="pp-select" value="" onChange={(e) => dbLoad(e.target.value)}>
                      <option value="">选择已保存的连接…</option>
                      {dbConnections.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                    <button className="pp-btn pp-btn-link" onClick={() => dbSave()}>保存当前</button>
                    {dbConnections.map((c) => (
                      <button key={c.name} className="pp-btn pp-btn-link" onClick={() => dbDelete(c.name)} title="删除该连接">✕ {c.name}</button>
                    ))}
                  </div>
                ) : (
                  <div className="pp-form-row">
                    <label className="pp-form-label" />
                    <button className="pp-btn pp-btn-link" onClick={dbSave}>保存连接到项目</button>
                  </div>
                )}
                <div className="pp-group-head">
                  <span className="pp-group-title">SQL 执行</span>
                  <button className="pp-btn pp-btn-primary" onClick={dbRun} disabled={dbBusy || !String(dbSql || '').trim()}>{dbBusy ? '执行中…' : '执行'}</button>
                </div>
                <textarea
                  className="pp-input pp-input-mono"
                  style={{ width: '100%', minHeight: 72, fontFamily: 'var(--font-mono, monospace)' }}
                  value={dbSql}
                  onChange={(e) => setDbSql(e.target.value)}
                  placeholder={dbConfig.type === 'mongodb'
                    ? '{ "find": "users", "filter": {}, "limit": 10 }'
                    : dbConfig.type === 'redis'
                      ? 'GET mykey'
                      : 'SELECT * FROM users LIMIT 10'}
                />
                {dbHint ? <p className={'pp-note ' + (dbHint.indexOf('连接成功') === 0 || dbHint.indexOf('已保存') === 0 ? 'pp-note-ok' : 'pp-note-bad')}>{dbHint}</p> : null}
                {dbResult && dbResult.output !== undefined ? (
                  <div>
                    <div className="pp-group-title">结果（{dbResult.driver === 'redis' ? 'Redis 命令输出' : 'MongoDB 命令输出'}）</div>
                    <pre className="pp-pre pp-pre-scroll">{prettyJson(typeof dbResult.output === 'string' ? dbResult.output : JSON.stringify(dbResult.output))}</pre>
                  </div>
                ) : null}
                {dbResult && Array.isArray(dbResult.rows) ? (
                  <div>
                    <div className="pp-group-title">结果（{dbResult.rowCount} 行{dbResult.truncated ? '，超过 1000 行已截断' : ''}）</div>
                    <div className="pp-table-wrap">
                      {dbResult.rows.length === 0 ? (
                        <p className="pp-meta">（无返回行）</p>
                      ) : (
                        <table className="pp-table">
                          <thead>
                            <tr>{dbResult.columns.map((c) => <th key={c}>{c}</th>)}</tr>
                          </thead>
                          <tbody>
                            {dbResult.rows.map((row, i) => (
                              <tr key={i}>{dbResult.columns.map((c) => (
                                <td key={c} className="pp-mono">{row && row[c] != null ? String(row[c]) : ''}</td>
                              ))}</tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                ) : null}
                {dbResult && dbResult.changes !== undefined ? (
                  <p className="pp-note pp-note-ok">已执行：影响 {dbResult.changes} 行{dbResult.lastInsertRowid != null ? '，lastInsertRowid=' + dbResult.lastInsertRowid : ''}</p>
                ) : null}
              </div>
            ) : null}
            {tab === 'auth' ? (
              <div>
                <div className="pp-form-row">
                  <label className="pp-form-label">类型</label>
                  <select className="pp-select" value={draft.auth.type} onChange={(e) => patchAuth('type', e.target.value)}>
                    {AUTH_TYPES.map((t) => <option key={t} value={t}>{AUTH_LABEL[t] || t}</option>)}
                  </select>
                </div>
                {draft.auth.type === 'bearer' ? (
                  <div className="pp-form-row">
                    <label className="pp-form-label">Token</label>
                    <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={draft.auth.token} onChange={(e) => patchAuth('token', e.target.value)} />
                  </div>
                ) : null}
                {draft.auth.type === 'basic' ? (
                  <div>
                    <div className="pp-form-row">
                      <label className="pp-form-label">用户名</label>
                      <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={draft.auth.username} onChange={(e) => patchAuth('username', e.target.value)} />
                    </div>
                    <div className="pp-form-row">
                      <label className="pp-form-label">密码</label>
                      <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={draft.auth.password} onChange={(e) => patchAuth('password', e.target.value)} />
                    </div>
                  </div>
                ) : null}
                {draft.auth.type === 'apikey' ? (
                  <div>
                    <div className="pp-form-row">
                      <label className="pp-form-label">Key</label>
                      <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={draft.auth.key} onChange={(e) => patchAuth('key', e.target.value)} />
                    </div>
                    <div className="pp-form-row">
                      <label className="pp-form-label">Value</label>
                      <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={draft.auth.value} onChange={(e) => patchAuth('value', e.target.value)} />
                    </div>
                    <div className="pp-form-row">
                      <label className="pp-form-label">位置</label>
                      <select className="pp-select" value={draft.auth.addTo} onChange={(e) => patchAuth('addTo', e.target.value)}>
                        <option value="header">header</option>
                        <option value="query">query</option>
                      </select>
                    </div>
                  </div>
                ) : null}
                {draft.auth.type === 'none' ? <p className="pp-meta">无认证</p> : null}
              </div>
            ) : null}
          </div>

          {wsMode ? (
            <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-3)' }}>
              <input
                className="pp-input pp-input-mono"
                style={{ flex: 1 }}
                placeholder={wsState.status === 'open' ? '输入要发送的消息…' : '连接建立后可发送消息'}
                value={wsInput}
                disabled={wsState.status !== 'open'}
                onChange={(e) => setWsInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && wsState.status === 'open') wsSend() }}
              />
              <button className="pp-btn pp-btn-primary" onClick={wsSend} disabled={wsState.status !== 'open' || wsInput === ''}>发送消息</button>
            </div>
          ) : null}

          <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-3)' }}>
            <input
              className="pp-input"
              style={{ flex: 1 }}
              placeholder="接口名称"
              value={draft.name}
              onChange={(e) => patch('name', e.target.value)}
            />
            <button className="pp-btn" onClick={saveAsEndpoint}>保存为接口</button>
            {savedHint ? (
              <span className={'pp-note ' + (savedHint.indexOf('已保存') === 0 || savedHint.indexOf('已复制') === 0 ? 'pp-note-ok' : 'pp-note-bad')}>{savedHint}</span>
            ) : null}
          </div>
        </section>

        {wsMode ? wsPanel : responsePanel}
      </div>
    </div>
  )
}
