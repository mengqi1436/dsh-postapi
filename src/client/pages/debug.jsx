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
  { id: 'settings', label: '设置' },
]

/** 回放快照 key：与 history 页写入的 key 一致，切到调试页即按快照重填。 */
const REPLAY_KEY = 'postapi.debug.replay'

// 参数表列用 ParamTable 的默认列（启用/参数名/类型/必填/示例值/描述 + 操作），
// 与 doc 页只读表同一套，避免两页列不一致。
const AUTH_LABEL = { none: '无认证', bearer: 'Bearer', basic: 'Basic', apikey: 'API Key' }

function resolveApi() {
  return typeof window !== 'undefined' ? window.__postapiApi : null
}

function emptyDraft(ep) {
  return {
    id: ep && ep.id ? ep.id : '',
    name: ep && ep.name ? ep.name : '',
    folderId: ep && ep.folderId ? ep.folderId : null,
    method: (ep && ep.method) || 'GET',
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
  const finalUrl = useMemo(() => joinUrl(env && env.baseUrl, draft.url), [env, draft.url])

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
      name: draft.name || draft.method + ' ' + draft.url,
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
            {/* 方法下拉本身承担方法色（data-method → CSS 变色）：不再「徽标 + 下拉」双元素并排 */}
            <select
              className="pp-select pp-url-method"
              data-method={draft.method}
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
              <button className="pp-btn pp-btn-primary" onClick={send} disabled={sending || !String(draft.url || '').trim()}
                title={String(draft.url || '').trim() ? '' : '先填写请求路径'}>
                {sending ? '发送中…' : '发送'}
              </button>
              <button className="pp-btn" onClick={cancel} disabled={!sending} title="取消本次发送">✕</button>
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

          <div className="pp-tabs">
            {TABS.map((t) => (
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

        {responsePanel}
      </div>
    </div>
  )
}
