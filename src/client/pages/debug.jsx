// debug.jsx — 调试发送页（#/debug/:endpointId）
// 结构对齐 Apifox 2.8.55 调试台（取证：async_panel_api.014078b9.css + async_http_response.e6cb7b3e.css
// + docs/apifox-visual-parity-spec.md §5 §12.4）：
//   顶部 URL 行（.pp-url-row 40px）：方法下拉 + baseUrl 胶囊 + path 输入 + 发送按钮组（主按钮 + 取消）
//   请求页签：Params / Body / Headers / Cookies / Auth / 前置操作 / 后置操作 / 设置
//   下方分栏：左请求编辑（.pp-debug-request） + 右响应面板（.pp-debug-response → ResponsePanel）
// 项目与接口选择默认空（与总览页一致）；未选接口时 URL 可手填直接调试（Apifox 的「快捷请求」）。
// 发送走 window.__postapiApi.request.send；发送成功后若当前接口有 id 可「保存响应示例」→ storage.saveResponse。
// 未注入 api 时用文件内 mock 并标注「示例数据」。
import { useEffect, useMemo, useRef, useState } from 'react'
import { applyTheme } from './theme.js'
import { ParamTable } from './components/ParamTable.jsx'
import { EmptyState } from './components/EmptyState.jsx'
import { COMMON_HEADERS, filterHeaders } from './components/headerPresets.js'
import { BodyEditor } from './components/BodyEditor.jsx'
import { ScriptPanel } from './components/ScriptPanel.jsx'
import { ResponsePanel } from './components/ResponsePanel.jsx'

;(window.__postapiQueue = window.__postapiQueue || []).push(['debug', DebugPage]) // 注册表就绪前入队，ensureGlobals 统一重放（模块求值顺序无关）

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
const AUTH_TYPES = ['none', 'bearer', 'basic', 'apikey']
const AUTH_LABEL = { none: '无认证', bearer: 'Bearer', basic: 'Basic', apikey: 'API Key' }

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
  ],
}

/** Apifox 调试台八个页签（Params / Body / Headers / Cookies / Auth / 前置操作 / 后置操作 / 设置）。 */
const TABS = [
  { id: 'params', label: 'Params' },
  { id: 'body', label: 'Body' },
  { id: 'headers', label: 'Headers' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'auth', label: 'Auth' },
  { id: 'pre', label: '前置操作' },
  { id: 'post', label: '后置操作' },
  { id: 'settings', label: '设置' },
]

/** 回放快照 key：与 history 页写入的 key 一致，切到调试页即按快照重填。 */
const REPLAY_KEY = 'postapi.debug.replay'

/** 目标 key：doc 页「发送」写入 { projectId, endpointId }（debug 不是参数路由，拿不到 hash 参数）。 */
const TARGET_KEY = 'postapi.debug.target'

function resolveApi() {
  return typeof window !== 'undefined' ? window.__postapiApi : null
}

function errText(err) {
  return err && err.message ? err.message : String(err)
}

/** 空白草稿（快捷请求：无项目、无接口时也能直接填 URL 发送）。 */
export function blankDraft() {
  return {
    id: '', name: '', folderId: null, method: 'GET', url: '',
    params: [], pathParams: [], headers: [], cookies: [],
    body: { type: 'none', content: '' },
    auth: { type: 'none', token: '', username: '', password: '', key: '', value: '', addTo: 'header' },
    responses: [],
    preScript: '', postScript: '', assertions: [], waitMs: 0,
  }
}

/** 由接口定义生成草稿（字段逐个兜底，脏数据不打崩页面）。 */
export function emptyDraft(ep) {
  const base = blankDraft()
  if (!ep) return base
  const rows = (v) => (Array.isArray(v) ? v.map((r) => ({ ...r })) : [])
  return {
    ...base,
    id: ep.id || '',
    name: ep.name || '',
    folderId: ep.folderId || null,
    method: ep.method || 'GET',
    url: ep.url || '',
    params: rows(ep.params),
    pathParams: rows(ep.pathParams),
    headers: rows(ep.headers),
    cookies: rows(ep.cookies),
    body: { type: (ep.body && ep.body.type) || 'none', content: (ep.body && ep.body.content) || '' },
    auth: {
      type: (ep.auth && ep.auth.type) || 'none',
      token: (ep.auth && ep.auth.token) || '',
      username: (ep.auth && ep.auth.username) || '',
      password: (ep.auth && ep.auth.password) || '',
      key: (ep.auth && ep.auth.key) || '',
      value: (ep.auth && ep.auth.value) || '',
      addTo: (ep.auth && ep.auth.addTo) || 'header',
    },
    responses: rows(ep.responses),
    preScript: ep.preScript || '',
    postScript: ep.postScript || '',
    assertions: Array.isArray(ep.assertions) ? ep.assertions.map((a) => ({ ...a })) : [],
    waitMs: Number.isFinite(ep.waitMs) ? ep.waitMs : 0,
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

/** 读取 doc 页写入的调试目标（无则 null）；读后即清，避免下次进来又被旧目标覆盖。 */
export function readDebugTarget() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(TARGET_KEY) : null
    if (!raw) return null
    localStorage.removeItem(TARGET_KEY)
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return { projectId: String(parsed.projectId || ''), endpointId: String(parsed.endpointId || '') }
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

/** 追加常用请求头：跳过已存在（key 大小写不敏感）的项，按清单顺序补最多 limit 条。 */
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

/** 由一次响应构造「响应示例」（契约 §2 endpoint.responses 行结构）。 */
export function responseExample(resp, name) {
  const headers = resp && resp.headers && typeof resp.headers === 'object'
    ? Object.keys(resp.headers).map((k) => ({ key: k, value: String(resp.headers[k]) }))
    : []
  return {
    id: '',
    name: name || '调试保存',
    code: Number(resp && resp.status) || 200,
    contentType: (resp && resp.headers && (resp.headers['content-type'] || resp.headers['Content-Type'])) || 'application/json',
    body: (resp && resp.body) || '',
    schema: null,
    headers,
    enabled: true,
    isDefault: false,
  }
}

export function DebugPage({ route, api }) {
  const rootRef = useRef(null)
  const abortRef = useRef({ cancelled: false })
  useEffect(() => applyTheme(rootRef.current), [])
  const apiRef = resolveApi() || api

  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  const [project, setProject] = useState(null)
  const [isMock, setIsMock] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [envId, setEnvId] = useState('')
  const [endpointId, setEndpointId] = useState(() => (route && route.arg) || '')
  // doc 页「发送」带过来的目标：项目与接口在项目列表加载完后自动打开（只消费一次）。
  const [target, setTarget] = useState(() => readDebugTarget())
  const [draft, setDraft] = useState(blankDraft)
  const [tab, setTab] = useState('params')
  const [resp, setResp] = useState(null)
  const [sending, setSending] = useState(false)
  const [timeoutMs, setTimeoutMs] = useState(30000)

  // 项目列表：默认不预选（与总览页一致）；未注入 api 时用文件内 mock 并标注「示例数据」。
  useEffect(() => {
    const storage = apiRef && apiRef.storage
    if (!storage || typeof storage.listProjects !== 'function') {
      setProject(MOCK_PROJECT)
      setIsMock(true)
      const envs = MOCK_PROJECT.environments
      const def = envs.find((e) => e.isDefault) || envs[0]
      setEnvId(def ? def.id : '')
      return undefined
    }
    let cancelled = false
    Promise.resolve()
      .then(() => storage.listProjects())
      .then((list) => {
        if (cancelled) return
        setProjects(Array.isArray(list) ? list : [])
        setIsMock(false)
        // 目标项目存在才自动打开（项目可能已被删除，此时退回空项目快捷请求）。
        if (target && target.projectId && Array.isArray(list) && list.some((p) => p && p.id === target.projectId)) {
          return Promise.resolve()
            .then(() => storage.getProject(target.projectId))
            .then((data) => {
              if (cancelled || !data) return
              setProjectId(target.projectId)
              setProject(data)
              const envs = Array.isArray(data.environments) ? data.environments : []
              const def = envs.find((e) => e.isDefault) || envs[0]
              setEnvId(def ? def.id : '')
              const list2 = Array.isArray(data.endpoints) ? data.endpoints : []
              const hit = target.endpointId ? list2.find((e) => e && e.id === target.endpointId) : null
              if (hit) {
                setEndpointId(hit.id)
                setDraft(emptyDraft(hit))
              }
              setTarget(null)
            })
        }
        return undefined
      })
      .catch((err) => {
        if (cancelled) return
        setProject(MOCK_PROJECT)
        setIsMock(true)
        setError('读取项目列表失败：' + errText(err))
      })
    return () => { cancelled = true }
  }, [apiRef, target])

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

  const endpoints = useMemo(() => (Array.isArray(project && project.endpoints) ? project.endpoints : []), [project])
  const envs = useMemo(() => (Array.isArray(project && project.environments) ? project.environments : []), [project])
  const { table, env } = useMemo(() => varTable(project, envId), [project, envId])
  const varRefs = useMemo(() => collectVarRefs(draft), [draft])
  const missingVars = useMemo(() => varRefs.filter((k) => !(k in table)), [varRefs, table])
  const finalUrl = useMemo(() => joinUrl(env && env.baseUrl, draft.url), [env, draft.url])

  const patch = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }))
  const patchAuth = (field, value) => setDraft((prev) => ({ ...prev, auth: { ...prev.auth, [field]: value } }))
  const addCommonHeaders = () => setDraft((prev) => ({ ...prev, headers: appendCommonHeaders(prev.headers, 3) }))

  /** 选项目：拉全量 project，接口选择与草稿一起重置。 */
  const openProject = (id) => {
    setProjectId(id)
    setError('')
    setNotice('')
    setResp(null)
    if (!id) {
      setProject(null)
      setEndpointId('')
      setDraft(blankDraft())
      setEnvId('')
      return
    }
    const storage = apiRef && apiRef.storage
    if (!storage || typeof storage.getProject !== 'function') return
    Promise.resolve()
      .then(() => storage.getProject(id))
      .then((data) => {
        if (!data) return
        setProject(data)
        setIsMock(false)
        const list = Array.isArray(data.environments) ? data.environments : []
        const def = list.find((e) => e.isDefault) || list[0]
        setEnvId(def ? def.id : '')
      })
      .catch((err) => setError('读取项目失败：' + errText(err)))
  }

  /** 选接口：把接口定义填进草稿（快捷请求不受影响，选空即空白草稿）。 */
  const openEndpoint = (id) => {
    setEndpointId(id)
    setResp(null)
    setNotice('')
    const hit = endpoints.find((e) => e && e.id === id)
    setDraft(hit ? emptyDraft(hit) : blankDraft())
  }

  const send = () => {
    const requestApi = apiRef && apiRef.request
    const cancelled = { cancelled: false }
    abortRef.current = cancelled
    setSending(true)
    setResp(null)
    setNotice('')
    const payload = {
      method: draft.method,
      url: finalUrl,
      params: (draft.params || []).filter((p) => p && p.enabled !== false && p.key),
      headers: (draft.headers || []).filter((h) => h && h.enabled !== false && h.key),
      body: draft.body,
      auth: draft.auth,
      timeoutMs: timeoutMs > 0 ? timeoutMs : 30000,
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
    if (!String(draft.url || '').trim()) {
      setError('发送失败：先填写请求路径或完整 URL')
      setSending(false)
      return
    }
    if (!requestApi || typeof requestApi.send !== 'function') {
      // 无 api：本地 mock 响应（结构对齐契约 §4 request.send 返回值）
      setResp({
        status: /DELETE|PATCH/.test(draft.method) ? 204 : 200,
        statusText: 'OK (mock)',
        headers: { 'content-type': 'application/json' },
        body: '{\n  "code": 0,\n  "data": { "mock": true }\n}',
        bodySize: 128,
        timeMs: 42,
        request: { method: draft.method, url: finalUrl, headers: {}, body: '' },
        tests: [{ name: 'status 为 2xx', passed: true }],
        logs: [],
      })
      setSending(false)
      return
    }
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
          error: { message: errText(err) } })
      })
      .finally(() => { if (!cancelled.cancelled) setSending(false) })
  }

  const cancel = () => {
    abortRef.current.cancelled = true
    setSending(false)
    setError('已取消本次发送（响应不再回填）')
  }

  /** 保存响应示例：接口有 id 时走 storage.saveResponse（契约 §3）。 */
  const saveExample = () => {
    const storage = apiRef && apiRef.storage
    if (!project || !draft.id) {
      setNotice('保存失败：先选择或保存一个接口')
      return
    }
    if (!storage || typeof storage.saveResponse !== 'function') {
      setNotice('保存失败：storage.saveResponse 不可用')
      return
    }
    const example = responseExample(resp, '调试 ' + new Date().toLocaleTimeString())
    Promise.resolve()
      .then(() => storage.saveResponse(project.id, draft.id, example))
      .then(() => { setNotice('已保存响应示例：' + example.code); setError('') })
      .catch((err) => setNotice('保存失败：' + errText(err)))
  }

  /** 保存草稿为接口（新建或更新，契约 §2 endpoint 结构）。 */
  const saveEndpoint = () => {
    const storage = apiRef && apiRef.storage
    if (!project || !project.id) {
      setNotice('保存失败：先选择项目')
      return
    }
    if (!storage || typeof storage.saveEndpoint !== 'function') {
      setNotice('保存失败：storage.saveEndpoint 不可用')
      return
    }
    const endpoint = {
      ...draft,
      name: draft.name || draft.method + ' ' + draft.url,
      body: { type: draft.body.type, content: draft.body.content, schema: null, examples: [] },
      mock: (endpoints.find((e) => e && e.id === draft.id) || {}).mock || { enabled: false, delayMs: 0, rules: [] },
    }
    Promise.resolve()
      .then(() => storage.saveEndpoint(project.id, endpoint))
      .then((saved) => {
        const final = saved && saved.id ? saved : endpoint
        setProject((prev) => (prev ? {
          ...prev,
          endpoints: prev.endpoints && prev.endpoints.some((e) => e && e.id === final.id)
            ? prev.endpoints.map((e) => (e && e.id === final.id ? final : e))
            : (prev.endpoints || []).concat([final]),
        } : prev))
        setEndpointId(final.id || '')
        setDraft((prev) => ({ ...prev, id: final.id || prev.id }))
        setNotice('已保存：' + (final.name || ''))
        setError('')
      })
      .catch((err) => setNotice('保存失败：' + errText(err)))
  }

  const canSaveExample = Boolean(
    resp && resp.status && draft.id && apiRef && apiRef.storage && typeof apiRef.storage.saveResponse === 'function',
  )

  const tabBody = (
    <div className="pp-debug-tabbody">
      {tab === 'params' ? (
        <div>
          <div className="pp-group-title">Path 参数</div>
          <div className="pp-table-wrap">
            <ParamTable rows={draft.pathParams} onChange={(rows) => patch('pathParams', rows)} emptyText="无 Path 参数" />
          </div>
          <div className="pp-group-title">Query 参数</div>
          <div className="pp-table-wrap">
            <ParamTable rows={draft.params} onChange={(rows) => patch('params', rows)} emptyText="无 Query 参数" />
          </div>
        </div>
      ) : null}

      {tab === 'body' ? (
        <div>
          <div className="pp-group-title">请求体</div>
          <BodyEditor value={draft.body} onChange={(next) => patch('body', next)} />
        </div>
      ) : null}

      {tab === 'headers' ? (
        <div>
          <div className="pp-group-head">
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
        </div>
      ) : null}

      {tab === 'cookies' ? (
        <div>
          <div className="pp-group-title">Cookies</div>
          <div className="pp-table-wrap">
            <ParamTable rows={draft.cookies} onChange={(rows) => patch('cookies', rows)} emptyText="无 Cookies" />
          </div>
        </div>
      ) : null}

      {tab === 'auth' ? (
        <div>
          <div className="pp-group-title">认证</div>
          <div className="pp-form-row">
            <label className="pp-form-label">类型</label>
            <select className="pp-select" value={draft.auth.type} onChange={(e) => patchAuth('type', e.target.value)}>
              {AUTH_TYPES.map((t) => <option key={t} value={t}>{AUTH_LABEL[t] || t}</option>)}
            </select>
          </div>
          {draft.auth.type === 'bearer' ? (
            <div className="pp-form-row">
              <label className="pp-form-label">Token</label>
              <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={draft.auth.token}
                onChange={(e) => patchAuth('token', e.target.value)} />
            </div>
          ) : null}
          {draft.auth.type === 'basic' ? (
            <div>
              <div className="pp-form-row">
                <label className="pp-form-label">用户名</label>
                <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={draft.auth.username}
                  onChange={(e) => patchAuth('username', e.target.value)} />
              </div>
              <div className="pp-form-row">
                <label className="pp-form-label">密码</label>
                <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={draft.auth.password}
                  onChange={(e) => patchAuth('password', e.target.value)} />
              </div>
            </div>
          ) : null}
          {draft.auth.type === 'apikey' ? (
            <div>
              <div className="pp-form-row">
                <label className="pp-form-label">Key</label>
                <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={draft.auth.key}
                  onChange={(e) => patchAuth('key', e.target.value)} />
              </div>
              <div className="pp-form-row">
                <label className="pp-form-label">Value</label>
                <input className="pp-input pp-input-mono" style={{ flex: 1 }} value={draft.auth.value}
                  onChange={(e) => patchAuth('value', e.target.value)} />
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

      {tab === 'pre' ? (
        <ScriptPanel
          value={{ preScript: draft.preScript, postScript: '', assertions: [], waitMs: draft.waitMs }}
          onChange={(next) => setDraft((prev) => ({ ...prev, preScript: next.preScript, waitMs: next.waitMs }))}
        />
      ) : null}

      {tab === 'post' ? (
        <ScriptPanel
          value={{ preScript: '', postScript: draft.postScript, assertions: draft.assertions, waitMs: 0 }}
          onChange={(next) => setDraft((prev) => ({ ...prev, postScript: next.postScript, assertions: next.assertions }))}
        />
      ) : null}

      {tab === 'settings' ? (
        <div>
          <div className="pp-group-title">发送设置</div>
          <div className="pp-form-row">
            <label className="pp-form-label">超时 (ms)</label>
            <input className="pp-input pp-input-sm" style={{ flex: 1, maxWidth: 160 }} value={String(timeoutMs)}
              onChange={(e) => setTimeoutMs(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)} />
          </div>
          <div className="pp-form-row">
            <label className="pp-form-label">等待 (ms)</label>
            <input className="pp-input pp-input-sm" style={{ flex: 1, maxWidth: 160 }} value={String(draft.waitMs || 0)}
              onChange={(e) => patch('waitMs', Number(e.target.value.replace(/[^0-9]/g, '')) || 0)} />
          </div>
          <div className="pp-group-title">请求概览</div>
          <table className="pp-table">
            <tbody>
              <tr><td className="pp-meta">方法</td><td><span className="pp-method" data-method={draft.method}>{draft.method}</span></td></tr>
              <tr><td className="pp-meta">完整 URL</td><td className="pp-mono pp-ellipsis">{finalUrl || '（未填写）'}</td></tr>
              <tr><td className="pp-meta">环境</td><td>{env ? env.name : '（无环境）'}</td></tr>
              <tr>
                <td className="pp-meta">变量</td>
                <td>{varRefs.length
                  ? varRefs.join('、') + (missingVars.length ? '（未定义：' + missingVars.join('、') + '）' : '（均已定义）')
                  : '无'}</td>
              </tr>
              <tr>
                <td className="pp-meta">已启用参数</td>
                <td>
                  {(draft.params || []).filter((p) => p && p.enabled !== false && p.key).length} 个 Query /{' '}
                  {(draft.pathParams || []).filter((p) => p && p.enabled !== false && p.key).length} 个 Path
                </td>
              </tr>
              <tr>
                <td className="pp-meta">已启用请求头</td>
                <td>{(draft.headers || []).filter((h) => h && h.enabled !== false && h.key).length} 个</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )

  return (
    <div className="pp-scope pp-page-flush" data-page="debug" ref={rootRef}>
      <div className="pp-debug-page pp-debug-split">
        <section className="pp-pane pp-debug-request">
          {/* 项目 / 接口选择：默认空（不预填 proj_demo01），未选也能手填 URL 直接调试 */}
          <div className="pp-debug-meta">
            <select
              className="pp-select pp-input-sm"
              value={projectId}
              onChange={(e) => openProject(e.target.value)}
              aria-label="当前项目"
            >
              <option value="">{projects.length ? '请选择项目' : '暂无项目'}</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
            </select>
            <select
              className="pp-select pp-input-sm"
              value={endpointId}
              onChange={(e) => openEndpoint(e.target.value)}
              aria-label="当前接口"
            >
              <option value="">快捷请求（不选接口）</option>
              {endpoints.map((e) => <option key={e.id} value={e.id}>{(e.method || 'GET') + ' ' + (e.name || e.url || e.id)}</option>)}
            </select>
            <select className="pp-select pp-input-sm" value={envId} onChange={(e) => setEnvId(e.target.value)} aria-label="环境">
              {envs.length === 0 ? <option value="">（无环境）</option> : null}
              {envs.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <a className="pp-meta" href="#/history">请求历史</a>
          </div>

          {/* URL 行（Apifox .main-input-bar）：40px 高，方法 + baseUrl 胶囊 + path + 发送按钮组 */}
          <div className="pp-url-row">
            <span className="pp-method" data-method={draft.method}>{draft.method}</span>
            <select
              className="pp-select pp-url-method"
              value={draft.method}
              onChange={(e) => patch('method', e.target.value)}
              aria-label="请求方法"
            >
              {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <span className="pp-url-pill" title={env && env.baseUrl ? env.baseUrl : '未配置 baseUrl'}>
              {env && env.baseUrl ? env.baseUrl : '未配置 baseUrl'}
            </span>
            <input
              className="pp-input pp-input-mono"
              value={draft.url}
              placeholder="/api/v1/... 或 https://TARGET/endpoint，支持 {{var}}"
              onChange={(e) => patch('url', e.target.value)}
              aria-label="请求路径"
            />
            <span className="pp-send-group">
              <button
                className="pp-btn pp-btn-primary"
                onClick={send}
                disabled={sending || !String(draft.url || '').trim()}
                title={String(draft.url || '').trim() ? '' : '先填写请求路径'}
              >
                {sending ? '发送中…' : '发送'}
              </button>
              <button className="pp-btn" onClick={cancel} disabled={!sending} title="取消本次发送">✕</button>
            </span>
          </div>

          <p className="pp-meta pp-ellipsis" title={finalUrl || ''}>{finalUrl || '（未填写 URL）'}</p>

          {isMock ? (
            <p className="pp-note pp-note-warn">示例数据 — window.__postapiApi 未注入或读取失败，发送将返回 mock 响应</p>
          ) : null}
          {!project && !isMock ? (
            <p className="pp-note">未选择项目：可直接在上方填写完整 URL 调试（快捷请求），或去 <a href="#/doc">接口文档</a> 选一个接口。</p>
          ) : null}
          {error ? <p className="pp-note pp-note-bad">{error}</p> : null}
          {notice ? <p className="pp-note">{notice}</p> : null}

          <div className="pp-tabs">
            {TABS.map((t) => (
              <button key={t.id} className="pp-tab" data-active={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </div>

          {tabBody}

          <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-3)' }}>
            <input
              className="pp-input"
              style={{ flex: 1 }}
              placeholder="接口名称"
              value={draft.name}
              onChange={(e) => patch('name', e.target.value)}
            />
            <button className="pp-btn" onClick={saveEndpoint}>保存为接口</button>
            {canSaveExample ? (
              <button className="pp-btn" onClick={saveExample}>保存响应示例</button>
            ) : null}
          </div>
        </section>

        <section className="pp-pane pp-debug-response">
          {resp && resp.status && !draft.id ? (
            <p className="pp-meta">当前是快捷请求：选择或保存一个接口后才能保存响应示例</p>
          ) : null}
          <ResponsePanel resp={resp} sending={sending} onCancel={cancel} />
        </section>
      </div>
    </div>
  )
}
