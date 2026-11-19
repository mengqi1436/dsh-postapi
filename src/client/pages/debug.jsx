// debug.jsx — 调试发送页（Apifox 调试台：左接口树 + 中 URL 行/页签请求编辑 + 右响应面板）
// 布局类全部来自 design-tokens.css：.pp-url-row / .pp-tabs + .pp-tab / .pp-pane / .pp-pill / .pp-pre / .pp-table。
// 发送走 window.__postapiApi.request.send，接口与环境走 storage；未注入 api 时用文件内 mock 并标注「示例数据」。
import { useEffect, useMemo, useRef, useState } from 'react'
import { applyTheme } from './theme.js'
import { ParamTable } from './components/ParamTable.jsx'
import { FolderTree } from './components/FolderTree.jsx'
import { JsonEditor } from './components/JsonEditor.jsx'
import { EmptyState } from './components/EmptyState.jsx'
import { StatusPill } from './components/StatusPill.jsx'

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
]

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
  const [collapsed, setCollapsed] = useState({})
  const [resp, setResp] = useState(null)
  const [sending, setSending] = useState(false)
  const [bodyView, setBodyView] = useState('pretty')
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

  const endpoints = useMemo(() => (Array.isArray(project && project.endpoints) ? project.endpoints : []), [project])
  const envs = useMemo(() => (Array.isArray(project && project.environments) ? project.environments : []), [project])
  const { table, env } = useMemo(() => varTable(project, envId), [project, envId])
  const varRefs = useMemo(() => collectVarRefs(draft), [draft])
  const missingVars = useMemo(() => varRefs.filter((k) => !(k in table)), [varRefs, table])
  const finalUrl = useMemo(() => joinUrl(env && env.baseUrl, draft.url), [env, draft.url])

  const loadEndpoint = (ep) => {
    setDraft(emptyDraft(ep))
    setResp(null)
    setSavedHint('')
  }

  const patch = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }))
  const patchAuth = (field, value) => setDraft((prev) => ({ ...prev, auth: { ...prev.auth, [field]: value } }))

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
      timeoutMs: 30000,
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
    Promise.resolve()
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

  const respBodyText = resp ? (bodyView === 'pretty' ? prettyJson(resp.body) : String(resp.body == null ? '' : resp.body)) : ''
  const respHeaders = useMemo(() => {
    const h = resp && resp.headers
    if (!h || typeof h !== 'object') return []
    return Object.keys(h).map((key) => ({ key, value: h[key] }))
  }, [resp])

  const responsePanel = (
    <section className="pp-pane">
      <div className="pp-card-title">响应</div>
      {!resp ? <EmptyState text="尚未发送请求" hint="填写 URL 后点「发送」" /> : null}
      {resp && resp.error ? (
        <p className="pp-note pp-note-bad">错误：{resp.error.message || String(resp.error)}</p>
      ) : null}
      {resp && !resp.error ? (
        <div>
          <div className="pp-toolbar-inline">
            <StatusPill status={resp.status} text={resp.statusText || ''} />
            <span className="pp-meta">{resp.timeMs == null ? '-' : resp.timeMs} ms</span>
            <span className="pp-meta">{resp.bodySize == null ? '-' : resp.bodySize} B</span>
            {resp.truncated ? <span className="pp-pill pp-pill-warn">已截断</span> : null}
          </div>

          <div className="pp-tabs" style={{ marginTop: 'var(--sp-2)' }}>
            <button className="pp-tab" data-active={bodyView === 'pretty'} onClick={() => setBodyView('pretty')}>美化</button>
            <button className="pp-tab" data-active={bodyView === 'raw'} onClick={() => setBodyView('raw')}>原文</button>
          </div>
          <pre className="pp-pre pp-pre-scroll" style={{ marginTop: 'var(--sp-2)' }}>{respBodyText}</pre>

          {respHeaders.length > 0 ? (
            <div style={{ marginTop: 'var(--sp-2)' }}>
              <div className="pp-card-title">响应头</div>
              <div className="pp-table-wrap"><ParamTable rows={respHeaders} readOnly columns={['key', 'value']} emptyText="无响应头" /></div>
            </div>
          ) : null}

          <div style={{ marginTop: 'var(--sp-2)' }}>
            <div className="pp-card-title">断言 / 脚本结果</div>
            {Array.isArray(resp.tests) && resp.tests.length > 0 ? (
              <table className="pp-table">
                <thead><tr><th>名称</th><th style={{ width: '72px' }}>结果</th><th style={{ width: '160px' }}>错误</th></tr></thead>
                <tbody>
                  {resp.tests.map((t, i) => (
                    <tr key={i}>
                      <td>{t.name}</td>
                      <td className={t.passed ? 'pp-ok' : 'pp-bad'}>{t.passed ? '通过' : '失败'}</td>
                      <td className="pp-muted">{t.error || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="pp-meta">无断言</p>
            )}
          </div>

          {Array.isArray(resp.logs) && resp.logs.length > 0 ? (
            <div style={{ marginTop: 'var(--sp-2)' }}>
              <div className="pp-card-title">脚本日志</div>
              <pre className="pp-pre pp-pre-scroll">{resp.logs.join('\n')}</pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )

  return (
    <div className="pp-scope pp-page-flush" data-page="debug" ref={rootRef}>
      <div className="pp-debug-layout" style={{ margin: 'var(--sp-3)' }}>
        {/* 左：接口树 */}
        <nav className="pp-pane" style={{ padding: 'var(--sp-2)' }}>
          <FolderTree
            project={project}
            activeEndpointId={draft.id}
            collapsed={collapsed}
            onPick={(endpointId) => {
              const target = endpoints.find((e) => e.id === endpointId)
              if (target) loadEndpoint(target)
            }}
            onToggle={(folderId) => setCollapsed((prev) => ({ ...prev, [folderId]: !prev[folderId] }))}
          />
          <div style={{ marginTop: 'var(--sp-3)' }}>
            <a className="pp-toc-item" href="#/history">请求历史 / 回放</a>
          </div>
        </nav>

        {/* 中：URL 行 + 页签请求编辑 */}
        <section className="pp-pane">
          <div className="pp-toolbar-inline" style={{ marginBottom: 'var(--sp-2)' }}>
            <span className="pp-form-label">环境</span>
            <select className="pp-select" value={envId} onChange={(e) => setEnvId(e.target.value)}>
              {envs.length === 0 ? <option value="">（无环境）</option> : null}
              {envs.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <span className="pp-meta">{env && env.baseUrl ? env.baseUrl : '未配置 baseUrl'}</span>
          </div>

          <div className="pp-url-row">
            <select className="pp-select" value={draft.method} onChange={(e) => patch('method', e.target.value)}>
              {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <input
              className="pp-input pp-input-mono"
              value={draft.url}
              placeholder="/api/v1/... 或 https://TARGET/endpoint，支持 {{var}}"
              onChange={(e) => patch('url', e.target.value)}
            />
            <button className="pp-btn pp-btn-primary" onClick={send} disabled={sending}>
              {sending ? '发送中…' : '发送'}
            </button>
            <button className="pp-btn" onClick={cancel} disabled={!sending}>取消</button>
          </div>

          <p className="pp-mono pp-meta" style={{ margin: 'var(--sp-2) 0 0 0' }}>
            实际地址：{finalUrl || '（未填写 URL）'}
          </p>
          {varRefs.length > 0 ? (
            <p className="pp-meta">
              变量 {varRefs.join('、')}
              {missingVars.length > 0 ? '（未定义：' + missingVars.join('、') + '）' : '（均已定义）'}
            </p>
          ) : null}
          {isMock ? <p className="pp-note pp-note-warn">示例数据 — window.__postapiApi 未注入或读取失败，发送将返回 mock 响应</p> : null}
          {error ? <p className="pp-note pp-note-bad">{error}</p> : null}

          <div className="pp-tabs" style={{ marginTop: 'var(--sp-3)' }}>
            {TABS.map((t) => (
              <button key={t.id} className="pp-tab" data-active={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </div>

          <div style={{ marginTop: 'var(--sp-2)' }}>
            {tab === 'params' ? (
              <div>
                <div className="pp-card-title">Path 参数</div>
                <div className="pp-table-wrap"><ParamTable rows={draft.pathParams} onChange={(rows) => patch('pathParams', rows)} emptyText="无 Path 参数" /></div>
                <div className="pp-card-title" style={{ marginTop: 'var(--sp-3)' }}>Query 参数</div>
                <div className="pp-table-wrap"><ParamTable rows={draft.params} onChange={(rows) => patch('params', rows)} emptyText="无 Query 参数" /></div>
              </div>
            ) : null}
            {tab === 'headers' ? (
              <div>
                <div className="pp-card-title">请求头</div>
                <div className="pp-table-wrap"><ParamTable rows={draft.headers} onChange={(rows) => patch('headers', rows)} emptyText="无请求头" /></div>
                <div className="pp-card-title" style={{ marginTop: 'var(--sp-3)' }}>Cookies</div>
                <div className="pp-table-wrap"><ParamTable rows={draft.cookies} onChange={(rows) => patch('cookies', rows)} emptyText="无 Cookies" /></div>
              </div>
            ) : null}
            {tab === 'body' ? (
              <div>
                <div className="pp-form-row">
                  <label className="pp-form-label">类型</label>
                  <select className="pp-select" value={draft.body.type} onChange={(e) => patch('body', { ...draft.body, type: e.target.value })}>
                    {BODY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {draft.body.type === 'none' ? (
                  <EmptyState text="无请求体" hint="Body 类型选 none 时不发送请求体" />
                ) : (
                  <JsonEditor
                    value={draft.body.content}
                    rows={8}
                    onChange={(next) => patch('body', { ...draft.body, content: next })}
                  />
                )}
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
              <span className={'pp-note ' + (savedHint.indexOf('已保存') === 0 ? 'pp-note-ok' : 'pp-note-bad')}>{savedHint}</span>
            ) : null}
          </div>
        </section>

        {responsePanel}
      </div>
    </div>
  )
}
