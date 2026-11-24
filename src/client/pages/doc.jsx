// doc.jsx — 接口文档页（#/doc/:endpointId）
// 结构对齐 Apifox 2.8.55 接口详情（取证：.research/apifox/app/dist/renderer/async_http_api_case.4459d613.css
// 类名序列 + docs/apifox-visual-parity-spec.md §5 §12.5）：
//   左 240px 目录面板：项目下拉（默认空）+「新建接口」+ 多级目录树（FolderTree）
//   右主列：页头（18px/700 标题 + 动作区：复制 cURL / 发送 / 删除）
//          → 页签「文档 / 运行 / 用例 / Mock / 设置」→ 正文
//     · 文档：主区顶部 sticky 锚点条 + Path / Query / 请求头 / Cookies / 请求体 / 认证 / 响应定义 / 响应示例 / 状态码 / 代码生成
//     · 运行：完整 URL + 在调试页发送（Apifox 的「运行」即调试）
//     · 用例：该接口的单接口用例（project.testCases 过滤 endpointId）
//     · Mock：endpoint.mock 摘要（启用 / 延迟 / 规则数）
//     · 设置：名称 / 方法 / 路径 / 目录 / 状态 / 描述，保存走 storage.saveEndpoint（有 id 即更新）
// 纪律：颜色 / 字号 / 高度全部走 token 与既有 .pp-* 类；内联 style 只放 layout。
// 数据走 window.__postapiApi.storage（listProjects / getProject / saveEndpoint / deleteEndpoint / saveResponse）；
// api 缺失时渲染文件内 mock 并可见标注「示例数据」。
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
  testCases: [],
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
      mock: { enabled: true, delayMs: 120, rules: [] },
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
      mock: { enabled: false, delayMs: 0, rules: [] },
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
      mock: { enabled: false, delayMs: 0, rules: [] },
      tags: ['订单'], status: 'developing',
    },
  ],
}

/** 页内锚点（文档视图）。改名为 ANCHORS：源码里不出现右栏 TOC 的类名字面。 */
const ANCHORS = [
  { id: 'sec-info', label: '基本信息' },
  { id: 'sec-path', label: 'Path 参数' },
  { id: 'sec-params', label: 'Query 参数' },
  { id: 'sec-headers', label: '请求头' },
  { id: 'sec-cookies', label: 'Cookies' },
  { id: 'sec-body', label: '请求体' },
  { id: 'sec-auth', label: '认证' },
  { id: 'sec-response', label: '响应示例' },
  { id: 'sec-status', label: '状态码' },
  { id: 'sec-code', label: '代码生成' },
]

/** Apifox 接口详情五个页签。 */
const VIEWS = [
  { id: 'doc', label: '文档' },
  { id: 'run', label: '运行' },
  { id: 'case', label: '用例' },
  { id: 'mock', label: 'Mock' },
  { id: 'settings', label: '设置' },
]

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
const BODY_TYPES = ['none', 'json', 'form', 'urlencoded', 'raw', 'binary', 'xml', 'graphql']
const STATUS_OPTIONS = ['developing', 'testing', 'done', 'deprecated']

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

function resolveApi() {
  return typeof window !== 'undefined' ? window.__postapiApi : null
}

function errText(err) {
  return err && err.message ? err.message : String(err)
}

function readEndpointIdFromHash() {
  if (typeof window === 'undefined') return ''
  const m = /^#\/doc\/([^/?#]+)/.exec(window.location.hash || '')
  return m ? decodeURIComponent(m[1]) : ''
}

/** 调试跳转的目标：Body.js 的 PARAM_ROUTES 只含 doc/schema，debug 拿不到 hash 参数，
 *  因此把「要调试哪个项目的哪个接口」写进 localStorage，由 debug 页挂载时消费一次。
 *  这与 history 页 → 调试页的回放快照（postapi.debug.replay）是同一套机制。 */
export const DEBUG_TARGET_KEY = 'postapi.debug.target'

function gotoDebug(projectId, endpointId) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DEBUG_TARGET_KEY, JSON.stringify({ projectId: projectId || '', endpointId: endpointId || '' }))
    }
  } catch { /* 隐私模式忽略：调试页退化为空项目快捷请求 */ }
  if (typeof window !== 'undefined') window.location.hash = '#/debug'
}

/** 新建接口的空模板（契约 §2 endpoint 结构，缺字段按默认值补齐）。 */
export function blankEndpoint(folderId) {
  return {
    id: '', name: '', folderId: folderId || null, order: 0, protocol: 'http',
    method: 'GET', url: '',
    params: [], pathParams: [], headers: [], cookies: [],
    body: { type: 'none', content: '', schema: null, examples: [] },
    auth: { type: 'none', token: '', username: '', password: '', key: '', value: '', addTo: 'header' },
    responses: [],
    mock: { enabled: false, delayMs: 0, rules: [] },
    description: '', tags: [], status: 'developing',
  }
}

/** endpoints 里按 id upsert（新建追加 / 编辑替换）。 */
export function upsertEndpoint(list, saved) {
  const arr = Array.isArray(list) ? list.slice() : []
  if (!saved || !saved.id) return arr
  const at = arr.findIndex((e) => e && e.id === saved.id)
  if (at >= 0) arr[at] = { ...arr[at], ...saved }
  else arr.push(saved)
  return arr
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
  if (src.trim() === '') return <EmptyState text="（无描述）" />
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

  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  const [project, setProject] = useState(null)
  const [isMock, setIsMock] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selectedId, setSelectedId] = useState(() => (route && route.arg) || readEndpointIdFromHash())
  const [collapsed, setCollapsed] = useState({})
  const [view, setView] = useState('doc')
  const [activeSec, setActiveSec] = useState('sec-info')
  const [responseId, setResponseId] = useState('')
  const [copied, setCopied] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ name: '', method: 'GET', url: '', folderId: '' })
  const [editDraft, setEditDraft] = useState(null)
  const [pendingDelete, setPendingDelete] = useState('')
  const [saving, setSaving] = useState(false)

  // 项目列表：默认不预选任何项目（与总览页一致），用户在下拉里选了才 getProject。
  useEffect(() => {
    const storage = apiRef && apiRef.storage
    if (!storage || typeof storage.listProjects !== 'function') {
      setProject(MOCK_PROJECT)
      setIsMock(true)
      return undefined
    }
    let cancelled = false
    Promise.resolve()
      .then(() => storage.listProjects())
      .then((list) => {
        if (cancelled) return
        setProjects(Array.isArray(list) ? list : [])
        setIsMock(false)
      })
      .catch((err) => {
        if (cancelled) return
        setProject(MOCK_PROJECT)
        setIsMock(true)
        setError('读取项目列表失败：' + errText(err))
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
  const epId = ep ? ep.id : ''

  // 选中接口变化时重置设置草稿与删除确认态
  useEffect(() => {
    setEditDraft(ep ? {
      name: ep.name || '',
      method: ep.method || 'GET',
      url: ep.url || '',
      folderId: ep.folderId || '',
      status: ep.status || 'developing',
      description: ep.description || '',
    } : null)
    setPendingDelete('')
  }, [epId])

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

  const caseRows = useMemo(() => {
    const all = Array.isArray(project && project.testCases) ? project.testCases : []
    return all.filter((c) => c && c.endpointId === epId)
  }, [project, epId])

  const canSave = Boolean(apiRef && apiRef.storage && typeof apiRef.storage.saveEndpoint === 'function')
  const canDelete = Boolean(apiRef && apiRef.storage && typeof apiRef.storage.deleteEndpoint === 'function')
  const canSaveResponse = Boolean(apiRef && apiRef.storage && typeof apiRef.storage.saveResponse === 'function')
  const statusLabel = ep ? STATUS_LABEL[ep.status] || ep.status || '' : ''

  const openProject = (id) => {
    setProjectId(id)
    setError('')
    setNotice('')
    setPendingDelete('')
    setView('doc')
    const storage = apiRef && apiRef.storage
    if (!id) { setProject(null); return }
    if (!storage || typeof storage.getProject !== 'function') return
    Promise.resolve()
      .then(() => storage.getProject(id))
      .then((data) => {
        if (!data) return
        setProject(data)
        setIsMock(false)
        const list = Array.isArray(data.endpoints) ? data.endpoints : []
        const want = selectedId && list.some((e) => e.id === selectedId) ? selectedId : (list[0] ? list[0].id : '')
        setSelectedId(want)
      })
      .catch((err) => setError('读取项目失败：' + errText(err)))
  }

  const pick = (endpointId) => {
    setSelectedId(endpointId)
    setResponseId('')
    setPendingDelete('')
    if (typeof window !== 'undefined') window.location.hash = '#/doc/' + encodeURIComponent(endpointId)
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

  /** 保存接口（有 id 即更新）：api 可用走 storage.saveEndpoint，缺 api 时本地乐观更新。 */
  const persist = (nextEp, okText) => {
    const storage = apiRef && apiRef.storage
    if (!project) { setError('保存失败：请先在左侧选择项目'); return }
    if (!storage || typeof storage.saveEndpoint !== 'function') {
      if (isMock) {
        setProject((prev) => (prev ? { ...prev, endpoints: upsertEndpoint(prev.endpoints, nextEp) } : prev))
        setSelectedId(nextEp.id || selectedId)
        setNotice(okText + '（示例数据：本地未落盘）')
        setError('')
      } else {
        setError('保存失败：storage.saveEndpoint 不可用')
      }
      return
    }
    setSaving(true)
    Promise.resolve()
      .then(() => storage.saveEndpoint(project.id, nextEp))
      .then((saved) => {
        const final = saved && saved.id ? saved : nextEp
        setProject((prev) => (prev ? { ...prev, endpoints: upsertEndpoint(prev.endpoints, final) } : prev))
        setSelectedId(final.id || selectedId)
        setNotice(okText)
        setError('')
      })
      .catch((err) => setError('保存失败：' + errText(err)))
      .finally(() => setSaving(false))
  }

  const createEndpoint = () => {
    const url = String(form.url || '').trim()
    if (!url) { setError('新建失败：路径不能为空'); return }
    const next = {
      ...blankEndpoint(form.folderId || null),
      name: String(form.name || '').trim() || (form.method + ' ' + url),
      method: form.method,
      url,
    }
    persist(next, '已新建接口：' + next.name)
    setFormOpen(false)
    setForm({ name: '', method: 'GET', url: '', folderId: '' })
  }

  const saveSettings = () => {
    if (!ep || !editDraft) return
    persist({
      ...ep,
      name: String(editDraft.name || '').trim() || ep.name,
      method: editDraft.method,
      url: String(editDraft.url || '').trim(),
      folderId: editDraft.folderId || null,
      status: editDraft.status,
      description: editDraft.description,
    }, '已保存接口设置')
  }

  /** 两段式删除：第一次点只进入确认态，第二次点才真正删除（不用 confirm 弹窗）。 */
  const requestDelete = () => {
    if (!ep) return
    if (pendingDelete !== ep.id) {
      setPendingDelete(ep.id)
      setNotice('再点一次「确认删除」删除接口：' + ep.name)
      return
    }
    const storage = apiRef && apiRef.storage
    const after = () => {
      setProject((prev) => (prev ? { ...prev, endpoints: (prev.endpoints || []).filter((e) => e.id !== ep.id) } : prev))
      setSelectedId('')
      setPendingDelete('')
      setNotice('已删除接口：' + ep.name)
      setError('')
    }
    if (!storage || typeof storage.deleteEndpoint !== 'function') {
      if (isMock) { after(); return }
      setError('删除失败：storage.deleteEndpoint 不可用')
      return
    }
    Promise.resolve()
      .then(() => storage.deleteEndpoint(project.id, ep.id))
      .then(after)
      .catch((err) => setError('删除失败：' + errText(err)))
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
    if (!storage || typeof storage.saveResponse !== 'function' || !project || !ep || !activeResponse) {
      setError('保存失败：storage.saveResponse 不可用')
      return
    }
    Promise.resolve()
      .then(() => storage.saveResponse(project.id, ep.id, activeResponse))
      .then(() => { setNotice('已保存响应：' + (activeResponse.name || activeResponse.code)); setError('') })
      .catch((err) => setError('保存响应失败：' + errText(err)))
  }

  /* ---------------- 左侧目录面板 ---------------- */

  const formBlock = (
    <div className="pp-card" style={{ margin: 'var(--sp-2)' }}>
      <div className="pp-card-title">新建接口</div>
      <div className="pp-form-grid">
        <label className="pp-form-label">名称</label>
        <input
          className="pp-input pp-input-sm"
          placeholder="查询订单列表"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <label className="pp-form-label">方法</label>
        <select
          className="pp-select pp-input-sm"
          value={form.method}
          onChange={(e) => setForm({ ...form, method: e.target.value })}
        >
          {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <label className="pp-form-label">路径</label>
        <input
          className="pp-input pp-input-sm pp-input-mono"
          placeholder="/api/v1/orders"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
        />
        <label className="pp-form-label">目录</label>
        <select
          className="pp-select pp-input-sm"
          value={form.folderId}
          onChange={(e) => setForm({ ...form, folderId: e.target.value })}
        >
          <option value="">（不归类）</option>
          {folders.map((f) => <option key={f.id} value={f.id}>{f.name || f.id}</option>)}
        </select>
      </div>
      <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-2)' }}>
        <button className="pp-btn pp-btn-primary pp-btn-sm" onClick={createEndpoint} disabled={saving || !String(form.url || '').trim()}>
          保存接口
        </button>
        <span className="pp-meta">保存后出现在左侧目录树</span>
      </div>
    </div>
  )

  const sidePanel = (
    <nav className="pp-panel" aria-label="接口目录">
      <div className="pp-toolbar-inline" style={{ padding: 'var(--sp-2) var(--sp-2) 0' }}>
        <select
          className="pp-select pp-input-sm"
          value={projectId}
          onChange={(e) => openProject(e.target.value)}
          aria-label="当前项目"
        >
          <option value="">{projects.length ? '请选择项目' : '暂无项目'}</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
        </select>
        <button
          className="pp-btn pp-btn-sm pp-btn-primary"
          onClick={() => { setFormOpen(!formOpen); setNotice('') }}
          disabled={!project}
          title={project ? '' : '先选择项目'}
        >
          {formOpen ? '取消' : '新建接口'}
        </button>
      </div>
      {formOpen ? formBlock : null}
      {project ? (
        <FolderTree
          project={project}
          activeEndpointId={epId}
          collapsed={collapsed}
          onPick={pick}
          onToggle={(folderId) => setCollapsed((prev) => ({ ...prev, [folderId]: !prev[folderId] }))}
        />
      ) : (
        <p className="pp-meta" style={{ padding: 'var(--sp-2)' }}>
          {isMock ? '示例数据：未注入 api，使用文件内项目' : '选择项目后显示接口目录'}
        </p>
      )}
    </nav>
  )

  /* ---------------- 主列 ---------------- */

  const docHead = (
    <div className="pp-doc-head">
      <span className="pp-doc-title">{ep ? ep.name : '接口文档'}</span>
      <div className="pp-overview-actions">
        {copied ? (
          <span className={'pp-note ' + (copied === '已复制' ? 'pp-note-ok' : 'pp-note-bad')}>{copied}</span>
        ) : null}
        {statusLabel ? <span className="pp-pill pp-pill-accent">{statusLabel}</span> : null}
        {ep ? <button className="pp-btn pp-btn-sm" onClick={copyCurl}>复制为 cURL</button> : null}
        {ep ? (
          <button
            className="pp-btn pp-btn-sm"
            onClick={() => gotoDebug(projectId, ep ? ep.id : '')}
          >
            发送
          </button>
        ) : null}
        {ep ? (
          <button className="pp-btn pp-btn-sm pp-btn-danger" onClick={requestDelete}>
            {pendingDelete === ep.id ? '确认删除' : '删除接口'}
          </button>
        ) : null}
      </div>
    </div>
  )

  const viewTabs = (
    <div className="pp-tabs">
      {VIEWS.map((v) => (
        <button key={v.id} className="pp-tab" data-active={view === v.id} onClick={() => setView(v.id)}>
          {v.label}
        </button>
      ))}
    </div>
  )

  const anchorBar = (
    <div className="pp-anchor-bar" role="navigation" aria-label="本页目录">
      {ANCHORS.map((t) => (
        <a
          key={t.id}
          className="pp-anchor-chip"
          data-active={activeSec === t.id}
          onClick={(e) => { e.preventDefault(); jump(t.id) }}
          href={'#/doc/' + encodeURIComponent(epId)}
        >
          {t.label}
        </a>
      ))}
    </div>
  )

  // ep 为空时视图一律不求值：JSX 在 return 之前就被构造，直接渲染会在 null 上取属性。
  const docView = !ep ? null : (
    <div className="pp-page">
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
        <div className="pp-table-wrap">
          <ParamTable rows={ep.pathParams} readOnly emptyText="无 Path 参数" emptyHint="路径里没有 {var} 占位符" />
        </div>
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
        <h2 className="pp-doc-h2">响应定义 / 响应示例</h2>
        {responses.length === 0 ? (
          <EmptyState text="尚未定义响应" hint="在调试页发送后保存响应示例，或新增响应" />
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
                  <StatusPill status={activeResponse.code} text={activeResponse.name || String(activeResponse.code)} />
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
                    <h3 className="pp-doc-h2">响应头</h3>
                    <div className="pp-table-wrap">
                      <ParamTable rows={activeResponse.headers} readOnly columns={['key', 'value']} emptyText="无响应头" />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section id="sec-status" className="pp-doc-section">
        <h2 className="pp-doc-h2">状态码</h2>
        <div className="pp-table-wrap">
          <table className="pp-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>状态码</th>
                <th style={{ width: '180px' }}>名称</th>
                <th>内容类型</th>
              </tr>
            </thead>
            <tbody>
              {responses.length === 0 ? (
                <tr><td colSpan={3} className="pp-muted">尚未定义响应</td></tr>
              ) : null}
              {responses.map((r) => (
                <tr key={r.id}>
                  <td><StatusPill status={r.code} text={String(r.code)} /></td>
                  <td>{r.name || '-'}</td>
                  <td className="pp-muted">{r.contentType || 'application/json'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="sec-code" className="pp-doc-section">
        <h2 className="pp-doc-h2">代码生成（cURL）</h2>
        <pre className="pp-pre pp-pre-scroll">{buildCurl(ep, baseUrl)}</pre>
      </section>
    </div>
  )

  const runView = !ep ? null : (
    <div className="pp-page">
      <div className="pp-group-title">快捷发送</div>
      <div className="pp-url-row">
        <span className="pp-method" data-method={ep.method}>{ep.method}</span>
        <span className="pp-url-pill" title={baseUrl || '未配置 baseUrl'}>{baseUrl || '未配置 baseUrl'}</span>
        <span className="pp-mono pp-ellipsis" style={{ flex: 1 }}>{ep.url}</span>
        <span className="pp-send-group">
          <button className="pp-btn pp-btn-primary" onClick={() => gotoDebug(projectId, ep.id)}>
            在调试页发送
          </button>
        </span>
      </div>
      <p className="pp-meta">完整 URL：{joinUrl(baseUrl, ep.url) || '（未配置环境 baseUrl）'}</p>
      <div className="pp-group-title">请求概要</div>
      <table className="pp-table">
        <tbody>
          <tr><td className="pp-meta">方法</td><td><span className="pp-method" data-method={ep.method}>{ep.method}</span></td></tr>
          <tr><td className="pp-meta">Query 参数</td><td>{(ep.params || []).filter((p) => p && p.enabled !== false && p.key).length} 个</td></tr>
          <tr><td className="pp-meta">Path 参数</td><td>{(ep.pathParams || []).filter((p) => p && p.enabled !== false && p.key).length} 个</td></tr>
          <tr><td className="pp-meta">请求头</td><td>{(ep.headers || []).filter((h) => h && h.enabled !== false && h.key).length} 个</td></tr>
          <tr><td className="pp-meta">请求体</td><td>{(ep.body && ep.body.type) || 'none'}</td></tr>
        </tbody>
      </table>
    </div>
  )

  const caseView = !ep ? null : (
    <div className="pp-page">
      <div className="pp-group-title">单接口用例</div>
      {caseRows.length === 0 ? (
        <EmptyState
          text="该接口暂无用例"
          hint="在「测试」页为这个接口新建用例（断言 + 提取变量）"
          action={{ label: '去测试页', href: '#/test' }}
        />
      ) : (
        <div className="pp-table-wrap">
          <table className="pp-table">
            <thead><tr><th>名称</th><th style={{ width: '120px' }}>断言数</th><th style={{ width: '120px' }}>最近结果</th></tr></thead>
            <tbody>
              {caseRows.map((c) => (
                <tr key={c.id}>
                  <td>{c.name || c.id}</td>
                  <td>{Array.isArray(c.assertions) ? c.assertions.length : 0}</td>
                  <td>{c.lastResult && c.lastResult.passed ? '通过' : '未运行'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const mockCfg = (ep && ep.mock) || { enabled: false, delayMs: 0, rules: [] }
  const mockView = !ep ? null : (
    <div className="pp-page">
      <div className="pp-group-title">Mock 配置</div>
      <div className="pp-form-grid">
        <span className="pp-form-label">启用</span>
        <span className="pp-meta">{mockCfg.enabled ? '已启用' : '未启用'}</span>
        <span className="pp-form-label">延迟</span>
        <span className="pp-meta">{Number(mockCfg.delayMs) || 0} ms</span>
        <span className="pp-form-label">规则数</span>
        <span className="pp-meta">{Array.isArray(mockCfg.rules) ? mockCfg.rules.length : 0} 条</span>
      </div>
      <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-3)' }}>
        <a className="pp-btn pp-btn-sm" href="#/mock">在 Mock 页编辑规则</a>
      </div>
    </div>
  )

  const settingsView = editDraft ? (
    <div className="pp-page">
      <div className="pp-group-title">接口设置</div>
      <div className="pp-form-grid">
        <label className="pp-form-label">名称</label>
        <input
          className="pp-input"
          placeholder="接口名称"
          value={editDraft.name}
          onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
        />
        <label className="pp-form-label">方法</label>
        <select
          className="pp-select"
          value={editDraft.method}
          onChange={(e) => setEditDraft({ ...editDraft, method: e.target.value })}
        >
          {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <label className="pp-form-label">路径</label>
        <input
          className="pp-input pp-input-mono"
          placeholder="/api/v1/orders"
          value={editDraft.url}
          onChange={(e) => setEditDraft({ ...editDraft, url: e.target.value })}
        />
        <label className="pp-form-label">目录</label>
        <select
          className="pp-select"
          value={editDraft.folderId}
          onChange={(e) => setEditDraft({ ...editDraft, folderId: e.target.value })}
        >
          <option value="">（不归类）</option>
          {folders.map((f) => <option key={f.id} value={f.id}>{f.name || f.id}</option>)}
        </select>
        <label className="pp-form-label">状态</label>
        <select
          className="pp-select"
          value={editDraft.status}
          onChange={(e) => setEditDraft({ ...editDraft, status: e.target.value })}
        >
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s] || s}</option>)}
        </select>
        <label className="pp-form-label">描述</label>
        <textarea
          className="pp-textarea pp-input-mono"
          rows={5}
          placeholder="支持 Markdown"
          value={editDraft.description}
          onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
        />
      </div>
      <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-3)' }}>
        <button className="pp-btn pp-btn-primary" onClick={saveSettings} disabled={saving}>保存设置</button>
        <button className="pp-btn pp-btn-danger" onClick={requestDelete}>
          {pendingDelete === epId ? '确认删除' : '删除接口'}
        </button>
        <span className="pp-meta">{canSave ? '保存走 storage.saveEndpoint' : '只读：storage.saveEndpoint 不可用'}</span>
      </div>
    </div>
  ) : null

  const bodyView = !ep ? (
    <div className="pp-page">
      <EmptyState
        icon="file"
        text={project ? '还没有接口文档' : '尚未选择项目'}
        hint={project ? '点左侧「新建接口」创建第一个接口' : '在左侧项目下拉里选择一个项目，或去总览页新建项目'}
        action={project ? undefined : { label: '去总览页', href: '#/overview' }}
      />
    </div>
  ) : view === 'run' ? runView
    : view === 'case' ? caseView
      : view === 'mock' ? mockView
        : view === 'settings' ? settingsView
          : docView

  return (
    <div className="pp-scope pp-page-flush" data-page="doc" ref={rootRef}>
      <div className="pp-split">
        {sidePanel}
        <div className="pp-doc-main">
          {docHead}
          {ep ? viewTabs : null}
          {ep && view === 'doc' ? anchorBar : null}
          {isMock ? (
            <p className="pp-note pp-note-warn" style={{ margin: 'var(--sp-2) var(--sp-3)' }}>
              示例数据 — window.__postapiApi 未注入或读取失败，以下为文件内 mock
            </p>
          ) : null}
          {error ? <p className="pp-note pp-note-bad" style={{ margin: 'var(--sp-2) var(--sp-3)' }}>{error}</p> : null}
          {notice ? <p className="pp-note" style={{ margin: 'var(--sp-2) var(--sp-3)' }}>{notice}</p> : null}
          {bodyView}
        </div>
      </div>
    </div>
  )
}
