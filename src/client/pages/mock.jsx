// mock.jsx — Mock 页（#/mock）
// 结构对齐 Apifox 2.8.55「Mock」模块（取证：async_http_api_case.4459d613.css 的 .container-OyFKA0 /
// .table-xwbMrc / .headerLabel-K_bzPS 三段 + docs/apifox-visual-parity-spec.md §5 §12.3）：
//   左 240px 接口面板（.pp-mock-layout > .pp-panel > .pp-tree）
//   右主列：Mock 服务卡（开关 / 端口 / 状态 / 命中地址）+ 接口 Mock 配置卡（启用 / 延迟 / 规则表）
//   规则表四列：字段 / 类型 / 规则 / 示例值（Apifox 的 mock 规则列口径），外加启用与操作列。
// 数据：规则存进 endpoint.mock.rules，保存走 api.storage.saveEndpoint（契约 §2 endpoint.mock）；
// 服务：api.mock.start / stop / status（契约 §4 createMockServer）；api 缺失时渲染文件内 mock 并标注「示例数据」。
import { useEffect, useMemo, useRef, useState } from 'react'
import { applyTheme } from './theme.js'
import { EmptyState } from './components/EmptyState.jsx'

;(window.__postapiQueue = window.__postapiQueue || []).push(['mock', MockPage]) // 注册表就绪前入队，ensureGlobals 统一重放（模块求值顺序无关）

/** 规则生成方式（Apifox mock 规则的 rule 取值，契约 §2 project.mocks[].rule）。 */
const RULES = ['fixed', 'regex', 'increment', 'random', 'template']
const RULE_LABEL = { fixed: '固定值', regex: '正则生成', increment: '自增', random: '随机', template: '模板' }

/** 字段类型（决定生成的 JSON 字面量形态）。 */
const FIELD_TYPES = ['string', 'integer', 'number', 'boolean', 'array', 'object']

// —— mock 项目（契约 §2：endpoint.mock = { enabled, delayMs, rules[] }）——
const MOCK_PROJECT = {
  id: 'proj_demo01',
  name: '订单中心（示例数据）',
  settings: { mockPort: 4010 },
  endpoints: [
    {
      id: 'ep_1001', name: '查询订单列表', method: 'GET', url: '/api/v1/orders',
      mock: {
        enabled: true,
        delayMs: 120,
        rules: [
          { id: 'mk_01', endpointId: 'ep_1001', field: 'data.total', type: 'integer', rule: 'fixed', value: '42', enabled: true },
          { id: 'mk_02', endpointId: 'ep_1001', field: 'data.items[0].orderId', type: 'string', rule: 'template', value: 'ORD-{{$randomInt}}', enabled: true },
          { id: 'mk_03', endpointId: 'ep_1001', field: 'data.items[0].status', type: 'string', rule: 'fixed', value: 'PAID', enabled: false },
        ],
      },
      responses: [{ id: 'res_a', name: '成功', code: 200, contentType: 'application/json', body: '{}', headers: [], enabled: true, isDefault: true }],
    },
    {
      id: 'ep_1002', name: '创建订单', method: 'POST', url: '/api/v1/orders',
      mock: { enabled: false, delayMs: 0, rules: [] },
      responses: [{ id: 'res_b', name: '创建成功', code: 201, contentType: 'application/json', body: '{}', headers: [], enabled: true, isDefault: true }],
    },
  ],
}

function resolveApi() {
  return typeof window !== 'undefined' ? window.__postapiApi : null
}

function errText(err) {
  return err && err.message ? err.message : String(err)
}

/** 空规则模板（契约 §2 project.mocks[] 行结构 + 本页 type 列）。 */
export function blankRule(endpointId) {
  return { id: '', endpointId: endpointId || '', field: '', type: 'string', rule: 'fixed', value: '', enabled: true }
}

/** 命中地址：契约 §4 两种形态（/mock/<projectId>/<endpointId> 与 /mock/<projectId><endpointPath>）。 */
export function hitUrls(projectId, endpoint, port) {
  const base = 'http://127.0.0.1:' + (port || 4010)
  if (!projectId || !endpoint) return []
  return [
    base + '/mock/' + projectId + '/' + endpoint.id,
    base + '/mock/' + projectId + (endpoint.url || ''),
  ]
}

/** 规则计数：只数 enabled !== false 的项（页面「生效规则」标签用）。 */
export function enabledRuleCount(rules) {
  return (Array.isArray(rules) ? rules : []).filter((r) => r && r.enabled !== false).length
}

export function MockPage({ route, api }) {
  const rootRef = useRef(null)
  useEffect(() => applyTheme(rootRef.current), [])
  const apiRef = resolveApi() || api

  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  const [project, setProject] = useState(null)
  const [isMock, setIsMock] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [currentId, setCurrentId] = useState('')
  const [delayMs, setDelayMs] = useState(0)
  const [rules, setRules] = useState([])
  const [mockEnabled, setMockEnabled] = useState(false)
  const [port, setPort] = useState('4010')
  const [service, setService] = useState({ running: false, port: 4010 })
  const [busy, setBusy] = useState(false)
  const [pendingRemove, setPendingRemove] = useState(-1)

  // 项目列表默认空（与总览页一致）；Mock 服务状态单独拉一次。
  useEffect(() => {
    const storage = apiRef && apiRef.storage
    const mockApi = apiRef && apiRef.mock
    let cancelled = false
    if (!storage || typeof storage.listProjects !== 'function') {
      setProject(MOCK_PROJECT)
      setIsMock(true)
      const first = MOCK_PROJECT.endpoints[0]
      setCurrentId(first.id)
      setRules(first.mock.rules)
      setDelayMs(first.mock.delayMs)
      setMockEnabled(first.mock.enabled)
      setPort(String(MOCK_PROJECT.settings.mockPort))
    } else {
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
    }
    if (mockApi && typeof mockApi.status === 'function') {
      Promise.resolve()
        .then(() => mockApi.status())
        .then((st) => {
          if (cancelled || !st) return
          setService({ running: Boolean(st.running), port: st.port || 4010 })
          if (st.port) setPort(String(st.port))
        })
        .catch(() => { /* 服务未启动时保持默认 */ })
    }
    return () => { cancelled = true }
  }, [apiRef])

  const endpoints = useMemo(() => (Array.isArray(project && project.endpoints) ? project.endpoints : []), [project])
  const current = useMemo(() => endpoints.find((e) => e && e.id === currentId) || null, [endpoints, currentId])
  const urls = useMemo(
    () => hitUrls(project && project.id, current, service.port || Number(port) || 4010),
    [project, current, service.port, port],
  )

  /** 选项目：拉全量 project，默认选中第一个接口并载入它的 mock 配置。 */
  const openProject = (id) => {
    setProjectId(id)
    setError('')
    setNotice('')
    setPendingRemove(-1)
    if (!id) {
      setProject(null)
      setCurrentId('')
      setRules([])
      setDelayMs(0)
      setMockEnabled(false)
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
        const list = Array.isArray(data.endpoints) ? data.endpoints : []
        const first = list[0] || null
        setCurrentId(first ? first.id : '')
        setRules(first && first.mock && Array.isArray(first.mock.rules) ? first.mock.rules : [])
        setDelayMs(first && first.mock ? first.mock.delayMs || 0 : 0)
        setMockEnabled(Boolean(first && first.mock && first.mock.enabled))
        const savedPort = data.settings && data.settings.mockPort
        if (savedPort) setPort(String(savedPort))
      })
      .catch((err) => setError('读取项目失败：' + errText(err)))
  }

  const selectEndpoint = (ep) => {
    if (!ep) return
    setCurrentId(ep.id)
    setRules(ep.mock && Array.isArray(ep.mock.rules) ? ep.mock.rules.map((r) => ({ ...r })) : [])
    setDelayMs(ep.mock ? ep.mock.delayMs || 0 : 0)
    setMockEnabled(Boolean(ep.mock && ep.mock.enabled))
    setNotice('')
    setPendingRemove(-1)
  }

  /** 保存：规则写进 endpoint.mock.rules，走 storage.saveEndpoint（有 id 即更新）。 */
  const persist = () => {
    if (!project || !current) { setNotice('保存失败：先选择项目与接口'); return }
    const endpoint = { ...current, mock: { enabled: mockEnabled, delayMs: Number(delayMs) || 0, rules } }
    const storage = apiRef && apiRef.storage
    if (!storage || typeof storage.saveEndpoint !== 'function') {
      if (isMock) {
        setProject((prev) => (prev ? {
          ...prev,
          endpoints: (prev.endpoints || []).map((e) => (e.id === endpoint.id ? { ...e, mock: endpoint.mock } : e)),
        } : prev))
        setNotice('已保存 Mock 配置（示例数据：本地未落盘）')
        setError('')
      } else {
        setNotice('保存失败：storage.saveEndpoint 不可用')
      }
      return
    }
    setBusy(true)
    Promise.resolve()
      .then(() => storage.saveEndpoint(project.id, endpoint))
      .then((saved) => {
        const mock = saved && saved.mock ? saved.mock : endpoint.mock
        setProject((prev) => (prev ? {
          ...prev,
          endpoints: (prev.endpoints || []).map((e) => (e.id === endpoint.id ? { ...e, mock } : e)),
        } : prev))
        setNotice('已保存 Mock 配置')
        setError('')
      })
      .catch((err) => setNotice('保存失败：' + errText(err)))
      .finally(() => setBusy(false))
  }

  const startService = () => {
    const mockApi = apiRef && apiRef.mock
    const wantPort = Number(port) || 4010
    if (!mockApi || typeof mockApi.start !== 'function') {
      setNotice('启动失败：api.mock.start 不可用')
      return
    }
    setBusy(true)
    Promise.resolve()
      .then(() => mockApi.start({ projectId: project && project.id, port: wantPort }))
      .then((st) => {
        setService({ running: true, port: (st && st.port) || wantPort })
        setNotice('Mock 服务已启动，端口 ' + ((st && st.port) || wantPort))
      })
      .catch((err) => setNotice('启动失败：' + errText(err)))
      .finally(() => setBusy(false))
  }

  const stopService = () => {
    const mockApi = apiRef && apiRef.mock
    if (!mockApi || typeof mockApi.stop !== 'function') {
      setNotice('停止失败：api.mock.stop 不可用')
      return
    }
    setBusy(true)
    Promise.resolve()
      .then(() => mockApi.stop())
      .then(() => {
        setService({ running: false, port: Number(port) || 4010 })
        setNotice('Mock 服务已停止')
      })
      .catch((err) => setNotice('停止失败：' + errText(err)))
      .finally(() => setBusy(false))
  }

  const patchRule = (index, field, value) => {
    const next = rules.slice()
    next[index] = { ...next[index], [field]: value }
    setRules(next)
  }

  /** 两段式删除规则（不用 confirm 弹窗）。 */
  const removeRule = (index) => {
    if (pendingRemove !== index) { setPendingRemove(index); return }
    setRules(rules.filter((_, i) => i !== index))
    setPendingRemove(-1)
  }

  const ruleRows = rules.length === 0 ? (
    <tr><td colSpan={6} className="pp-muted">尚无规则；未命中规则时回落默认响应（isDefault）</td></tr>
  ) : null

  return (
    <div className="pp-scope pp-page" data-page="mock" ref={rootRef}>
      <div className="pp-overview-head">
        <span className="pp-overview-title">Mock</span>
        <div className="pp-overview-actions">
          <span className={'pp-pill ' + (service.running ? 'pp-pill-ok' : 'pp-pill-warn')}>
            {service.running ? '运行中' : '已停止'}
          </span>
          <span className="pp-meta">生效规则 {enabledRuleCount(rules)} 条</span>
          <button className="pp-btn pp-btn-primary pp-btn-sm" onClick={startService} disabled={busy || service.running}>启动</button>
          <button className="pp-btn pp-btn-sm" onClick={stopService} disabled={busy || !service.running}>停止</button>
        </div>
      </div>

      <div className="pp-overview-content">
        <p className="pp-muted">
          {isMock
            ? '示例数据 — window.__postapiApi 未注入或读取失败，以下为文件内 mock'
            : '数据来源：api.storage（listProjects / getProject / saveEndpoint）+ api.mock（start / stop / status）'}
        </p>
        {error ? <p className="pp-error-text">{error}</p> : null}
        {notice ? <p className="pp-note">{notice}</p> : null}

        <div className="pp-mock-layout">
          <nav className="pp-panel" aria-label="接口列表">
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
            </div>
            <div className="pp-tree">
              <div className="pp-tree-group">接口</div>
              {endpoints.length === 0 ? (
                <EmptyState text="暂无接口" hint="在接口文档页新建接口后，可在这里配置 Mock 规则" />
              ) : null}
              {endpoints.map((ep) => (
                <div
                  key={ep.id}
                  className="pp-tree-row"
                  data-active={ep.id === currentId}
                  onClick={() => selectEndpoint(ep)}
                >
                  <span className="pp-method" data-method={ep.method}>{ep.method}</span>
                  <span className="pp-ellipsis">{ep.name || ep.url || ep.id}</span>
                </div>
              ))}
            </div>
          </nav>

          <div className="pp-mock-side">
            {/* Mock 服务卡：端口输入 + 状态 + 命中地址（Apifox .headerLabel-K_bzPS 段） */}
            <section className="pp-card">
              <div className="pp-card-title">本地 Mock 服务</div>
              <div className="pp-form-grid">
                <label className="pp-form-label">端口</label>
                <input
                  className="pp-input pp-input-sm pp-input-mono"
                  value={port}
                  onChange={(e) => setPort(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="4010"
                />
                <span className="pp-form-label">状态</span>
                <span className="pp-meta">
                  {service.running ? '运行中 · 端口 ' + (service.port || port) : '已停止'}
                </span>
              </div>

              <div className="pp-group-title">命中地址</div>
              {urls.length === 0 ? (
                <p className="pp-meta">选择项目与接口后显示命中地址</p>
              ) : (
                urls.map((u) => <pre key={u} className="pp-pre" style={{ marginBottom: 'var(--sp-1)' }}>{u}</pre>)
              )}
              <p className="pp-meta" style={{ marginTop: 'var(--sp-2)' }}>
                规则优先级：字段规则 → 默认响应（isDefault）→ 200 {'{}'}
              </p>
            </section>

            {/* 接口 Mock 配置卡：启用 / 延迟 / 规则表（字段 / 类型 / 规则 / 示例值） */}
            <section className="pp-card">
              <div className="pp-card-title">{current ? current.name || current.url : '未选择接口'}</div>
              <div className="pp-form-grid">
                <label className="pp-form-label">启用 Mock</label>
                <input type="checkbox" checked={mockEnabled} onChange={(e) => setMockEnabled(e.target.checked)} />
                <label className="pp-form-label">延迟 (ms)</label>
                <input
                  className="pp-input pp-input-sm pp-input-mono"
                  value={String(delayMs)}
                  onChange={(e) => setDelayMs(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>

              <div className="pp-group-title">Mock 规则</div>
              <div className="pp-table-wrap">
                <table className="pp-table">
                  <thead>
                    <tr>
                      <th style={{ width: '44px' }}>启用</th>
                      <th style={{ width: '180px' }}>字段</th>
                      <th style={{ width: '96px' }}>类型</th>
                      <th style={{ width: '110px' }}>规则</th>
                      <th>示例值</th>
                      <th style={{ width: '96px' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ruleRows}
                    {rules.map((rule, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            type="checkbox"
                            checked={rule.enabled !== false}
                            onChange={(e) => patchRule(index, 'enabled', e.target.checked)}
                          />
                        </td>
                        <td>
                          <input
                            className="pp-cell-input pp-input-sm pp-input-mono"
                            value={rule.field || ''}
                            placeholder="data.items[0].id"
                            onChange={(e) => patchRule(index, 'field', e.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            className="pp-cell-input pp-input-sm"
                            value={rule.type || 'string'}
                            onChange={(e) => patchRule(index, 'type', e.target.value)}
                          >
                            {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </td>
                        <td>
                          <select
                            className="pp-cell-input pp-input-sm"
                            value={rule.rule || 'fixed'}
                            onChange={(e) => patchRule(index, 'rule', e.target.value)}
                          >
                            {RULES.map((r) => <option key={r} value={r}>{RULE_LABEL[r] || r}</option>)}
                          </select>
                        </td>
                        <td>
                          <input
                            className="pp-cell-input pp-input-sm pp-input-mono"
                            value={rule.value || ''}
                            onChange={(e) => patchRule(index, 'value', e.target.value)}
                          />
                        </td>
                        <td>
                          <button
                            className="pp-btn pp-btn-sm pp-btn-ghost pp-btn-danger"
                            onClick={() => removeRule(index)}
                          >
                            {pendingRemove === index ? '确认删除' : '删除'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-2)' }}>
                <button
                  className="pp-btn pp-btn-sm pp-table-add"
                  onClick={() => setRules(rules.concat([blankRule(current && current.id)]))}
                  disabled={!current}
                >
                  + 添加规则
                </button>
                <button className="pp-btn pp-btn-primary pp-btn-sm" onClick={persist} disabled={busy || !current}>
                  保存配置
                </button>
                <span className="pp-meta">规则写入 endpoint.mock.rules（storage.saveEndpoint）</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
