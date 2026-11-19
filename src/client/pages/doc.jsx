// doc.jsx — 接口文档页（#/doc/:endpointId）
// v2 布局（docs/nav-layout-v2-spec.md）：.pp-split 两栏
//   左：面板化接口树 .pp-panel（.pp-tree / .pp-tree-group / .pp-tree-row / .pp-tree-row-count）
//   右：主列 .pp-doc-main（顶部 sticky 锚点条 .pp-anchor-bar + 正文 .pp-page）
// 刻意不用右栏常驻 TOC：窄容器里它会吃掉 240px，把正文挤成窄条；
// 改成主区顶部横向 chips 后只占一行纵向，正文宽度完全不受影响。
// 方法徽标统一用 Apifox 白字彩底 .pp-method[data-method]；颜色/字号全部来自 token，内联只放 layout。
// 数据走 window.__postapiApi.storage（listProjects / getProject / saveResponse），
// 未注入时渲染文件内 mock 并可见标注「示例数据」。
import { useEffect, useMemo, useRef, useState } from 'react'
import { applyTheme } from './theme.js'
import { ParamTable } from './components/ParamTable.jsx'
import { FolderTree } from './components/FolderTree.jsx'
import { JsonEditor } from './components/JsonEditor.jsx'
import { EmptyState } from './components/EmptyState.jsx'
import { StatusPill } from './components/StatusPill.jsx'

;(window.__postapiQueue = window.__postapiQueue || []).push(['doc', DocPage]) // 注册表就绪前入队，ensureGlobals 统一重放（模块求值顺序无关）

const FENCE = '\x60\x60\x60' // 三个反引号：Markdown 代码围栏

// —— mock 项目（契约 §2 project.json v2 结构，仅页面展示用）——
const MOCK_PROJECT = {
  id: 'proj_demo01',
  name: '订单中心（示例数据）',
  description: '演示项目：包含订单与支付两条业务线。',
  folders: [
    { id: 'fld_01', name: '订单管理', parentId: null, order: 0 },
    { id: 'fld_02', name: '支付', parentId: null, order: 1 },
  ],
  environments: [
    { id: 'env_01', name: '开发环境', baseUrl: 'https://api.example.test', isDefault: true, variables: [] },
  ],
  endpoints: [
    {
      id: 'ep_1001', name: '查询订单列表', folderId: 'fld_01', order: 0, protocol: 'http',
      method: 'GET', url: '/api/v1/orders',
      description: '分页查询当前用户的订单，支持按状态过滤。\n\n### 说明\n- 需要 Bearer 认证\n- 单页最多 100 条',
      params: [
        { key: 'page', value: '1', enabled: true, description: '页码', required: false, type: 'number' },
        { key: 'pageSize', value: '20', enabled: true, description: '每页条数', required: false, type: 'number' },
        { key: 'status', value: 'PAID', enabled: false, description: '订单状态', required: false, type: 'string' },
      ],
      pathParams: [],
      headers: [
        { key: 'Accept', value: 'application/json', enabled: true, description: '', required: false, type: 'string' },
      ],
      cookies: [],
      body: { type: 'none', content: '', schema: null, examples: [] },
      auth: { type: 'bearer', token: '{{token}}', username: '', password: '', key: '', value: '', addTo: 'header' },
      responses: [
        { id: 'res_1001a', name: '成功', code: 200, contentType: 'application/json',
          body: '{\n  "code": 0,\n  "data": {\n    "total": 42,\n    "items": [\n      { "orderId": "ORD-001", "status": "PAID", "amount": 9900 }\n    ]\n  }\n}',
          schema: null, headers: [{ key: 'content-type', value: 'application/json' }], enabled: true, isDefault: true },
        { id: 'res_1001b', name: '未认证', code: 401, contentType: 'application/json',
          body: '{\n  "code": 401,\n  "message": "unauthorized"\n}', schema: null, headers: [], enabled: true, isDefault: false },
      ],
      tags: ['订单'], status: 'developing',
    },
    {
      id: 'ep_1002', name: '创建订单', folderId: 'fld_01', order: 1, protocol: 'http',
      method: 'POST', url: '/api/v1/orders',
      description: '根据商品条目创建订单。',
      params: [], pathParams: [],
      headers: [
        { key: 'Content-Type', value: 'application/json', enabled: true, description: '', required: true, type: 'string' },
      ],
      cookies: [],
      body: { type: 'json', content: '{\n  "skuId": "SKU-1001",\n  "quantity": 2\n}', schema: null, examples: [] },
      auth: { type: 'bearer', token: '{{token}}', username: '', password: '', key: '', value: '', addTo: 'header' },
      responses: [
        { id: 'res_1002a', name: '创建成功', code: 201, contentType: 'application/json',
          body: '{\n  "code": 0,\n  "data": { "orderId": "ORD-002", "status": "CREATED" }\n}', schema: null, headers: [], enabled: true, isDefault: true },
      ],
      tags: ['订单'], status: 'developing',
    },
    {
      id: 'ep_1003', name: '取消订单', folderId: 'fld_01', order: 2, protocol: 'http',
      method: 'DELETE', url: '/api/v1/orders/{orderId}',
      description: '取消未支付的订单。',
      params: [], pathParams: [
        { key: 'orderId', value: 'ORD-001', enabled: true, description: '订单号', required: true, type: 'string' },
      ],
      headers: [], cookies: [],
      body: { type: 'none', content: '', schema: null, examples: [] },
      auth: { type: 'none', token: '', username: '', password: '', key: '', value: '', addTo: 'header' },
      responses: [
        { id: 'res_1003a', name: '已取消', code: 204, contentType: 'application/json', body: '', schema: null, headers: [], enabled: true, isDefault: true },
      ],
      tags: ['订单'], status: 'developing',
    },
    {
      id: 'ep_2001', name: '发起支付', folderId: 'fld_02', order: 0, protocol: 'http',
      method: 'POST', url: '/api/v1/payments',
      description: '对指定订单发起支付。',
      params: [], pathParams: [],
      headers: [
        { key: 'Content-Type', value: 'application/json', enabled: true, description: '', required: true, type: 'string' },
      ],
      cookies: [{ key: 'session', value: '{{sessionId}}', enabled: false, description: '会话票据', required: false, type: 'string' }],
      body: { type: 'json', content: '{\n  "orderId": "ORD-001",\n  "channel": "alipay"\n}', schema: null, examples: [] },
      auth: { type: 'apikey', token: '', username: '', password: '', key: 'X-Api-Key', value: '{{apiKey}}', addTo: 'header' },
      responses: [
        { id: 'res_2001a', name: '成功', code: 200, contentType: 'application/json',
          body: '{\n  "code": 0,\n  "data": { "paymentId": "PAY-001", "qrUrl": "https://example.test/qr" }\n}', schema: null, headers: [], enabled: true, isDefault: true },
      ],
      tags: ['支付'], status: 'developing',
    },
  ],
}

const TOC = [
  { id: 'sec-info', label: '基本信息' },
  { id: 'sec-path', label: 'Path 参数' },
  { id: 'sec-params', label: 'Query 参数' },
  { id: 'sec-headers', label: '请求头' },
  { id: 'sec-cookies', label: 'Cookies' },
  { id: 'sec-body', label: '请求体' },
  { id: 'sec-auth', label: '认证' },
  { id: 'sec-response', label: '响应' },
  { id: 'sec-code', label: '代码生成' },
]

const BODY_TYPES = ['none', 'json', 'form', 'urlencoded', 'raw', 'binary', 'xml', 'graphql']
const AUTH_LABEL = {
  none: '无认证',
  bearer: 'Bearer Token（Authorization: Bearer <token>）',
  basic: 'Basic（用户名 / 密码）',
  apikey: 'API Key（写入 header 或 query）',
  oauth2: 'OAuth 2.0（规划中：仅保留类型位）',
  digest: 'Digest（规划中：仅保留类型位）',
}

/** 接口状态胶囊文案（Apifox 文档页头右侧状态位）。 */
const STATUS_LABEL = { developing: '开发中', testing: '测试中', done: '已完成', deprecated: '已废弃' }
/* 状态胶囊三档：沿用 .pp-pill-ok/warn/bad（响应码 StatusPill 同体系），不再四种状态一律主色 */
const STATUS_TONE = { developing: 'pp-pill-accent', testing: 'pp-pill-warn', done: 'pp-pill-ok', deprecated: 'pp-pill-bad' }

function resolveApi() {
  return typeof window !== 'undefined' ? window.__postapiApi : null
}

function readEndpointIdFromHash() {
  if (typeof window === 'undefined') return ''
  const m = /^#\/doc\/([^/?#]+)/.exec(window.location.hash || '')
  return m ? decodeURIComponent(m[1]) : ''
}

/** 极简行内 Markdown（行内 code / 粗体 / 链接），不引依赖。 */
function renderInline(text, keyPrefix) {
  const nodes = []
  const re = /(\x60[^\x60]+\x60)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let m
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const token = m[0]
    const key = keyPrefix + '-' + i++
    if (token.charAt(0) === '\x60') nodes.push(<code key={key} className="pp-mono">{token.slice(1, -1)}</code>)
    else if (token.slice(0, 2) === '**') nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>)
    else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token)
      nodes.push(<a key={key} href={link[2]}>{link[1]}</a>)
    }
    last = m.index + token.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

/** 极简块级 Markdown（标题 / 列表 / 代码围栏 / 段落）。 */
function Markdown({ text }) {
  const src = text == null ? '' : String(text)
  if (src.trim() === '') return <p className="pp-meta">（无描述）</p>
  const blocks = []
  let buffer = []
  let inFence = false
  let listItems = []
  const flushFence = (key) => {
    blocks.push(<pre key={key} className="pp-pre pp-pre-scroll">{buffer.join('\n')}</pre>)
    buffer = []
  }
  const flushList = (key) => {
    if (listItems.length === 0) return
    blocks.push(
      <ul key={key} className="pp-md-list">
        {listItems.map((item, idx) => <li key={idx}>{renderInline(item, key + '-li' + idx)}</li>)}
      </ul>,
    )
    listItems = []
  }
  src.split('\n').forEach((line, index) => {
    const key = 'md-' + index
    if (line.trim().startsWith(FENCE)) {
      if (inFence) { flushFence(key); inFence = false } else { flushList(key + '-l'); inFence = true }
      return
    }
    if (inFence) { buffer.push(line); return }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      flushList(key + '-l')
      blocks.push(<div key={key} className="pp-doc-h2">{renderInline(heading[2], key)}</div>)
      return
    }
    if (/^\s*[-*]\s+/.test(line)) { listItems.push(line.replace(/^\s*[-*]\s+/, '')); return }
    flushList(key + '-l')
    if (line.trim() === '') return
    blocks.push(<p key={key} style={{ margin: '0 0 var(--sp-2) 0' }}>{renderInline(line, key)}</p>)
  })
  flushList('md-end-list')
  if (inFence) flushFence('md-end-fence')
  return <div>{blocks}</div>
}

function joinUrl(baseUrl, url) {
  const raw = String(url || '')
  if (/^https?:\/\//i.test(raw)) return raw
  const base = String(baseUrl || '').replace(/\/+$/, '')
  if (!base) return raw
  return base + (raw.charAt(0) === '/' ? raw : '/' + raw)
}

/** 由接口定义生成 cURL（{{var}} 原样保留，交由环境变量替换）。 */
export function buildCurl(ep, baseUrl) {
  if (!ep) return ''
  const enabled = (rows) => (Array.isArray(rows) ? rows : []).filter((r) => r && r.enabled !== false && r.key)
  let url = joinUrl(baseUrl, ep.url)
  for (const p of enabled(ep.pathParams)) url = url.replace('{' + p.key + '}', String(p.value == null ? '' : p.value))
  const query = enabled(ep.params)
    .map((p) => encodeURIComponent(p.key) + '=' + encodeURIComponent(p.value == null ? '' : p.value))
    .join('&')
  if (query) url += (url.indexOf('?') >= 0 ? '&' : '?') + query
  const lines = ['curl -X ' + (ep.method || 'GET') + " '" + url + "'"]
  for (const h of enabled(ep.headers)) lines.push("  -H '" + h.key + ': ' + (h.value == null ? '' : h.value) + "'")
  const auth = ep.auth || {}
  if (auth.type === 'bearer' && auth.token) lines.push("  -H 'Authorization: Bearer " + auth.token + "'")
  if (auth.type === 'basic') lines.push("  -u '" + (auth.username || '') + ':' + (auth.password || '') + "'")
  if (auth.type === 'apikey' && auth.key) {
    if (auth.addTo === 'query') lines.push('  # query: ' + auth.key + '=' + (auth.value || ''))
    else lines.push("  -H '" + auth.key + ': ' + (auth.value || '') + "'")
  }
  const body = ep.body || {}
  if (body.type && body.type !== 'none' && body.content) {
    lines.push("  --data-raw '" + String(body.content).replace(/'/g, "'\\''") + "'")
  }
  return lines.join(' \\\n')
}

export function DocPage({ route, api }) {
  const rootRef = useRef(null)
  useEffect(() => applyTheme(rootRef.current), [])
  const apiRef = resolveApi() || api
  const [project, setProject] = useState(MOCK_PROJECT)
  const [isMock, setIsMock] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(() => (route && route.arg) || readEndpointIdFromHash())
  const [collapsed, setCollapsed] = useState({})
  const [activeSec, setActiveSec] = useState('sec-info')
  const [responseId, setResponseId] = useState('')
  const [copied, setCopied] = useState('')

  // 载入项目：doc 路由只带 endpointId，取项目列表首个项目全量数据
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
      })
      .catch((err) => {
        if (cancelled) return
        setError('读取项目失败：' + (err && err.message ? err.message : String(err)))
      })
    return () => { cancelled = true }
  }, [apiRef])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const onHash = () => setSelectedId(readEndpointIdFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const endpoints = useMemo(() => (Array.isArray(project && project.endpoints) ? project.endpoints : []), [project])
  const folders = useMemo(() => (Array.isArray(project && project.folders) ? project.folders : []), [project])
  const ep = endpoints.find((e) => e.id === selectedId) || endpoints[0] || null

  const responses = useMemo(() => {
    const list = Array.isArray(ep && ep.responses) ? ep.responses.filter((r) => r && r.enabled !== false) : []
    return list
  }, [ep])
  const activeResponse = useMemo(() => {
    const found = responses.find((r) => r.id === responseId)
    if (found) return found
    return responses.find((r) => r.isDefault) || responses[0] || null
  }, [responses, responseId])

  const baseUrl = useMemo(() => {
    const envs = Array.isArray(project && project.environments) ? project.environments : []
    const def = envs.find((e) => e.isDefault) || envs[0]
    return def && def.baseUrl ? def.baseUrl : ''
  }, [project])

  const canSaveResponse = Boolean(apiRef && apiRef.storage && typeof apiRef.storage.saveResponse === 'function')

  const pick = (endpointId) => {
    setSelectedId(endpointId)
    setResponseId('')
    if (typeof window !== 'undefined') window.location.hash = '#/doc/' + endpointId
  }

  const jump = (secId) => {
    setActiveSec(secId)
    if (typeof document === 'undefined') return
    const el = document.getElementById(secId)
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const copyCurl = () => {
    const text = buildCurl(ep, baseUrl)
    const fail = () => setCopied('复制失败：剪贴板不可用')
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        Promise.resolve(navigator.clipboard.writeText(text)).then(() => setCopied('已复制')).catch(fail)
        return
      }
    } catch { /* 落到失败文案 */ }
    fail()
  }

  const patchResponse = (patch) => {
    if (!ep || !activeResponse) return
    const next = { ...activeResponse, ...patch }
    const list = (Array.isArray(ep.responses) ? ep.responses : []).map((r) => (r.id === next.id ? next : r))
    setProject((prev) => ({
      ...prev,
      endpoints: (prev.endpoints || []).map((e) => (e.id === ep.id ? { ...e, responses: list } : e)),
    }))
  }

  const saveResponse = () => {
    const storage = apiRef && apiRef.storage
    if (!storage || typeof storage.saveResponse !== 'function' || !ep || !activeResponse) return
    Promise.resolve()
      .then(() => storage.saveResponse(project.id, ep.id, activeResponse))
      .then(() => setError(''))
      .catch((err) => setError('保存响应失败：' + (err && err.message ? err.message : String(err))))
  }

  // 目录树：递归渲染 parentId 多级层级（Apifox 左树观感），折叠态由本页持有
  const tree = (
    <FolderTree
      project={project}
      activeEndpointId={ep ? ep.id : ''}
      collapsed={collapsed}
      onPick={pick}
      onToggle={(folderId) => setCollapsed((prev) => ({ ...prev, [folderId]: !prev[folderId] }))}
    />
  )

  /**
   * 页内锚点条：原先的右栏「本页目录」在窄容器里要吃掉 240px，把正文挤成窄条。
   * 改成主区顶部 sticky 的横向 chips——只占一行纵向，正文宽度完全不受影响。
   */
  const anchorBar = (
    <div className="pp-anchor-bar" role="navigation" aria-label="本页目录">
      {TOC.map((t) => (
        <a
          key={t.id}
          className="pp-anchor-chip"
          data-active={activeSec === t.id}
          onClick={(e) => { e.preventDefault(); jump(t.id) }}
          href={'#/doc/' + encodeURIComponent(ep ? ep.id : '')}
        >
          {t.label}
        </a>
      ))}
    </div>
  )

  // 空态：与正常文档页同骨架（页头 + 目录 + 主区），但空态只在主区出现一次。
  // 之前左右两栏各渲染一条「暂无接口 / 先在总览页创建项目与接口」，同一句话重复两遍，
  // 右侧还是个铺满宽度的虚线大框。现在左树只留一行说明，主区给带图标与动作的空态。
  // 空态：不渲染左树面板。
  // 没有接口时目录树本身零信息量，占满整宽只放一个空态会留下大片空白（窄容器下尤其明显）。
  // 主区独占一行，空态居中，并给一个去总览页的出口。
  if (!ep) {
    return (
      <div className="pp-scope pp-page-flush" data-page="doc" ref={rootRef}>
        <div className="pp-doc-main">
          <div className="pp-doc-head">
            <span className="pp-doc-title">接口文档</span>
          </div>
          <div className="pp-page">
            {isMock ? <p className="pp-note pp-note-warn">示例数据 — window.__postapiApi 未注入或读取失败，以下为文件内 mock</p> : null}
            <EmptyState
              icon="file"
              text="还没有接口文档"
              hint="在总览页新建项目后，用顶栏「新建」创建第一个接口"
              action={{ label: '去总览页', href: '#/overview' }}
            />
          </div>
        </div>
      </div>
    )
  }

  // 文档页头：Apifox .overview-header-container 同规格（18px/700 标题 + 右侧动作区，下边框）
  const statusLabel = STATUS_LABEL[ep.status] || ep.status || ''
  const docHead = (
    <div className="pp-doc-head">
      <span className="pp-doc-title">{ep.name}</span>
      <div className="pp-overview-actions">
        {copied ? (
          <span className={'pp-note ' + (copied === '已复制' ? 'pp-note-ok' : 'pp-note-bad')}>{copied}</span>
        ) : null}
        {statusLabel ? <span className={'pp-pill ' + (STATUS_TONE[ep.status] || 'pp-pill-accent')}>{statusLabel}</span> : null}
        {/* 页头主动作 32px：与 overview/flow 页头动作区同档 */}
        <button className="pp-btn" onClick={copyCurl}>复制为 cURL</button>
      </div>
    </div>
  )

  return (
    <div className="pp-scope pp-page-flush" data-page="doc" ref={rootRef}>
      <div className="pp-split">
        <nav className="pp-panel" aria-label="接口目录">{tree}</nav>

        <div className="pp-doc-main">
          {docHead}
          {anchorBar}
          <div className="pp-page">
            {isMock ? <p className="pp-note pp-note-warn">示例数据 — window.__postapiApi 未注入或读取失败，以下为文件内 mock</p> : null}
            {error ? <p className="pp-note pp-note-bad">{error}</p> : null}

            <section id="sec-info">
              <h1 className="pp-doc-h1">
                <span className="pp-method" data-method={ep.method}>{ep.method}</span>
                <span className="pp-ellipsis">{ep.name}</span>
              </h1>
              <p className="pp-mono pp-muted" style={{ margin: '0 0 var(--sp-2) 0' }}>{ep.method} {ep.url}</p>
              {ep.protocol && ep.protocol !== 'http' ? (
                <p className="pp-meta">协议 {ep.protocol}：规划中（仅保留类型位，发送回落 HTTP）</p>
              ) : null}
              <div style={{ marginTop: 'var(--sp-2)' }}><Markdown text={ep.description} /></div>
            </section>

            <section id="sec-path" className="pp-doc-section">
              <h2 className="pp-doc-h2">Path 参数</h2>
              <div className="pp-table-wrap"><ParamTable rows={ep.pathParams} readOnly emptyText="无 Path 参数" emptyHint="路径里没有 {var} 占位符" /></div>
            </section>

            <section id="sec-params" className="pp-doc-section">
              <h2 className="pp-doc-h2">Query 参数</h2>
              <div className="pp-table-wrap"><ParamTable rows={ep.params} readOnly emptyText="无 Query 参数" /></div>
            </section>

            <section id="sec-headers" className="pp-doc-section">
              <h2 className="pp-doc-h2">请求头</h2>
              <div className="pp-table-wrap"><ParamTable rows={ep.headers} readOnly emptyText="无请求头" /></div>
            </section>

            <section id="sec-cookies" className="pp-doc-section">
              <h2 className="pp-doc-h2">Cookies</h2>
              <div className="pp-table-wrap"><ParamTable rows={ep.cookies} readOnly emptyText="无 Cookies" /></div>
            </section>

            <section id="sec-body" className="pp-doc-section">
              <h2 className="pp-doc-h2">请求体（{ep.body && ep.body.type ? ep.body.type : 'none'}）</h2>
              {ep.body && ep.body.content ? (
                <JsonEditor value={ep.body.content} readOnly rows={8} />
              ) : (
                <EmptyState text="无请求体" />
              )}
              {ep.body && ep.body.type && BODY_TYPES.indexOf(ep.body.type) < 0 ? (
                <p className="pp-meta">未知 body 类型：{ep.body.type}</p>
              ) : null}
            </section>

            <section id="sec-auth" className="pp-doc-section">
              <h2 className="pp-doc-h2">认证</h2>
              <p className="pp-muted">{AUTH_LABEL[(ep.auth && ep.auth.type) || 'none'] || (ep.auth && ep.auth.type)}</p>
              {ep.auth && ep.auth.type === 'apikey' ? (
                <p className="pp-mono">{(ep.auth.key || 'key') + ' → ' + (ep.auth.addTo === 'query' ? 'query' : 'header')}</p>
              ) : null}
            </section>

            <section id="sec-response" className="pp-doc-section">
              <h2 className="pp-doc-h2">响应</h2>
              {responses.length === 0 ? (
                <EmptyState text="尚未定义响应" hint="在调试页发送后保存为接口，或新增响应" />
              ) : (
                <div>
                  <div className="pp-tabs">
                    {responses.map((r) => (
                      <button
                        key={r.id}
                        className="pp-tab"
                        data-active={Boolean(activeResponse) && r.id === activeResponse.id}
                        onClick={() => setResponseId(r.id)}
                      >
                        {r.code} {r.name || ''}
                      </button>
                    ))}
                  </div>
                  {activeResponse ? (
                    <div style={{ marginTop: 'var(--sp-2)' }}>
                      <div className="pp-toolbar-inline" style={{ marginBottom: 'var(--sp-2)' }}>
                        <StatusPill status={activeResponse.code} text={activeResponse.name || ''} />
                        <span className="pp-meta">{activeResponse.contentType || 'application/json'}</span>
                        {activeResponse.isDefault ? <span className="pp-pill pp-pill-accent">默认</span> : null}
                        {canSaveResponse ? (
                          <button className="pp-btn pp-btn-sm" onClick={saveResponse}>保存响应</button>
                        ) : (
                          <span className="pp-meta">只读：storage.saveResponse 不可用</span>
                        )}
                      </div>
                      <JsonEditor
                        value={activeResponse.body}
                        rows={10}
                        readOnly={!canSaveResponse}
                        onChange={(next) => patchResponse({ body: next })}
                      />
                      {Array.isArray(activeResponse.headers) && activeResponse.headers.length > 0 ? (
                        <div style={{ marginTop: 'var(--sp-2)' }}>
                          <h3 className="pp-doc-h3">响应头</h3>
                          <div className="pp-table-wrap"><ParamTable rows={activeResponse.headers} readOnly columns={['key', 'value']} emptyText="无响应头" /></div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}
            </section>

            <section id="sec-code" className="pp-doc-section">
              <h2 className="pp-doc-h2">代码生成（cURL）</h2>
              <pre className="pp-pre pp-pre-scroll">{buildCurl(ep, baseUrl)}</pre>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
