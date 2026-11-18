// mock.jsx — Mock 规则与服务页（#/mock）
// Mock 规则表（字段/规则/值/启用）+ 延迟设置 + 服务启停（api.mock.start/stop/status）+ 命中地址展示。
// 数据走 window.__postapiApi.storage（getProject / saveEndpoint 写回 endpoint.mock），
// 服务走 window.__postapiApi.mock；api 缺失时渲染文件内 mock 并可见标注「示例数据」。
import { useEffect, useMemo, useRef, useState } from 'react'
import { applyTheme } from './theme.js'
import { EmptyState } from './components/EmptyState.jsx'

;(window.__postapiQueue = window.__postapiQueue || []).push(['mock', MockPage]) // 注册表就绪前入队，ensureGlobals 统一重放（模块求值顺序无关）

const RULES = ['fixed', 'regex', 'increment', 'random', 'template']
const RULE_LABEL = { fixed: '固定值', regex: '正则生成', increment: '自增', random: '随机', template: '模板' }
const RULE_COLUMNS = ['enabled', 'field', 'rule', 'value']

// —— mock 项目（契约 §2：endpoint.mock = { enabled, delayMs, rules[] }）——
const MOCK_PROJECT = {
  id: 'proj_demo01',
  name: '订单中心（示例数据）',
  endpoints: [
    {
      id: 'ep_1001', name: '查询订单列表', method: 'GET', url: '/api/v1/orders',
      mock: {
        enabled: true,
        delayMs: 120,
        rules: [
          { id: 'mk_01', endpointId: 'ep_1001', field: 'data.total', rule: 'fixed', value: '42', enabled: true },
          { id: 'mk_02', endpointId: 'ep_1001', field: 'data.items[0].orderId', rule: 'template', value: 'ORD-{{$randomInt}}', enabled: true },
          { id: 'mk_03', endpointId: 'ep_1001', field: 'data.items[0].status', rule: 'fixed', value: 'PAID', enabled: false },
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
  mocks: [],
}

function resolveApi() {
  return typeof window !== 'undefined' ? window.__postapiApi : null
}

function blankRule(endpointId) {
  return { id: '', endpointId: endpointId || '', field: '', rule: 'fixed', value: '', enabled: true }
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

export function MockPage({ route, api }) {
  const rootRef = useRef(null)
  useEffect(() => applyTheme(rootRef.current), [])
  const apiRef = resolveApi() || api

  const [project, setProject] = useState(MOCK_PROJECT)
  const [isMock, setIsMock] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [currentId, setCurrentId] = useState(MOCK_PROJECT.endpoints[0].id)
  const [delayMs, setDelayMs] = useState(MOCK_PROJECT.endpoints[0].mock.delayMs)
  const [rules, setRules] = useState(MOCK_PROJECT.endpoints[0].mock.rules)
  const [mockEnabled, setMockEnabled] = useState(MOCK_PROJECT.endpoints[0].mock.enabled)
  const [service, setService] = useState({ running: false, port: 4010 })
  const [busy, setBusy] = useState(false)

  const endpoints = useMemo(() => (Array.isArray(project && project.endpoints) ? project.endpoints : []), [project])
  const current = useMemo(() => endpoints.find((e) => e.id === currentId) || endpoints[0] || null, [endpoints, currentId])
  const port = (project && project.settings && project.settings.mockPort) || 4010

  // 载入项目 + Mock 服务状态
  useEffect(() => {
    const storage = apiRef && apiRef.storage
    let cancelled = false
    if (storage && typeof storage.listProjects === 'function' && typeof storage.getProject === 'function') {
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
          const list = Array.isArray(data.endpoints) ? data.endpoints : []
          const first = list[0] || null
          setCurrentId(first ? first.id : '')
          setRules(first && first.mock && Array.isArray(first.mock.rules) ? first.mock.rules : [])
          setDelayMs(first && first.mock ? first.mock.delayMs || 0 : 0)
          setMockEnabled(Boolean(first && first.mock && first.mock.enabled))
        })
        .catch((err) => {
          if (cancelled) return
          setError('读取项目失败：' + (err && err.message ? err.message : String(err)))
        })
    }
    const mockApi = apiRef && apiRef.mock
    if (mockApi && typeof mockApi.status === 'function') {
      Promise.resolve()
        .then(() => mockApi.status())
        .then((st) => {
          if (cancelled || !st) return
          setService({ running: Boolean(st.running), port: st.port || port })
        })
        .catch(() => { /* 服务未启动时保持默认 */ })
    }
    return () => { cancelled = true }
  }, [apiRef])

  const selectEndpoint = (ep) => {
    setCurrentId(ep.id)
    setRules(ep.mock && Array.isArray(ep.mock.rules) ? ep.mock.rules.map((r) => ({ ...r })) : [])
    setDelayMs(ep.mock ? ep.mock.delayMs || 0 : 0)
    setMockEnabled(Boolean(ep.mock && ep.mock.enabled))
    setNotice('')
  }

  const persist = () => {
    const storage = apiRef && apiRef.storage
    if (!storage || typeof storage.saveEndpoint !== 'function' || !project || !project.id || !current) {
      setNotice('保存失败：storage.saveEndpoint 不可用')
      return
    }
    const endpoint = {
      ...current,
      mock: { enabled: mockEnabled, delayMs: Number(delayMs) || 0, rules },
    }
    setBusy(true)
    Promise.resolve()
      .then(() => storage.saveEndpoint(project.id, endpoint))
      .then(() => {
        setProject((prev) => ({
          ...prev,
          endpoints: (prev.endpoints || []).map((e) => (e.id === endpoint.id ? { ...e, mock: endpoint.mock } : e)),
        }))
        setNotice('已保存 Mock 配置')
        setError('')
      })
      .catch((err) => setNotice('保存失败：' + (err && err.message ? err.message : String(err))))
      .finally(() => setBusy(false))
  }

  const startService = () => {
    const mockApi = apiRef && apiRef.mock
    if (!mockApi || typeof mockApi.start !== 'function') {
      setNotice('启动失败：api.mock.start 不可用')
      return
    }
    setBusy(true)
    Promise.resolve()
      .then(() => mockApi.start({ projectId: project && project.id, port }))
      .then((st) => {
        setService({ running: true, port: (st && st.port) || port })
        setNotice('Mock 服务已启动')
      })
      .catch((err) => setNotice('启动失败：' + (err && err.message ? err.message : String(err))))
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
        setService({ running: false, port })
        setNotice('Mock 服务已停止')
      })
      .catch((err) => setNotice('停止失败：' + (err && err.message ? err.message : String(err))))
      .finally(() => setBusy(false))
  }

  const patchRule = (index, field, value) => {
    const next = rules.slice()
    next[index] = { ...next[index], [field]: value }
    setRules(next)
  }

  const urls = useMemo(() => hitUrls(project && project.id, current, service.port || port), [project, current, service.port, port])

  return (
    <div className="pp-scope pp-page" data-page="mock" ref={rootRef}>
      <h1 className="pp-page-title">Mock</h1>
      <p className="pp-muted">
        {isMock ? '示例数据 — window.__postapiApi 未注入或读取失败，以下为文件内 mock' : '数据来源：postapi.storage + postapi.mock'}
      </p>
      {error ? <p className="pp-muted">{error}</p> : null}
      {notice ? <p className="pp-muted">{notice}</p> : null}

      <div className="pp-debug-layout">
        {/* 左：接口列表 */}
        <nav className="pp-pane" style={{ padding: 'var(--sp-2)' }}>
          <div className="pp-card-title" style={{ padding: '0 var(--sp-2)' }}>接口</div>
          {endpoints.length === 0 ? <EmptyState text="暂无接口" /> : null}
          {endpoints.map((ep) => (
            <div key={ep.id} className="pp-tree-row" data-active={ep.id === currentId} onClick={() => selectEndpoint(ep)}>
              <span className="pp-method" data-method={ep.method}>{ep.method}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{ep.name}</span>
            </div>
          ))}
        </nav>

        {/* 中：规则表 + 延迟 */}
        <section className="pp-pane">
          <div className="pp-card-title">{current ? current.name : '未选择接口'}</div>
          <div className="pp-form-row">
            <label className="pp-form-label">启用 Mock</label>
            <input type="checkbox" checked={mockEnabled} onChange={(e) => setMockEnabled(e.target.checked)} />
          </div>
          <div className="pp-form-row">
            <label className="pp-form-label">延迟 (ms)</label>
            <input
              className="pp-input pp-input-mono"
              style={{ width: '120px' }}
              value={String(delayMs)}
              onChange={(e) => setDelayMs(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </div>

          <div className="pp-card-title" style={{ marginTop: 'var(--sp-3)' }}>字段规则</div>
          {rules.length === 0 ? <EmptyState text="尚无规则" hint="未命中规则时回落默认响应" /> : null}
          {rules.length > 0 ? (
            <table className="pp-table">
              <thead>
                <tr>
                  <th style={{ width: '56px' }}>启用</th>
                  <th style={{ width: '180px' }}>字段</th>
                  <th style={{ width: '110px' }}>规则</th>
                  <th>值</th>
                  <th style={{ width: '64px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, index) => (
                  <tr key={index}>
                    <td><input type="checkbox" checked={rule.enabled !== false} onChange={(e) => patchRule(index, 'enabled', e.target.checked)} /></td>
                    <td>
                      <input className="pp-input pp-input-mono" style={{ width: '100%' }} value={rule.field || ''}
                        placeholder="data.items[0].id" onChange={(e) => patchRule(index, 'field', e.target.value)} />
                    </td>
                    <td>
                      <select className="pp-select" value={rule.rule || 'fixed'} onChange={(e) => patchRule(index, 'rule', e.target.value)}>
                        {RULES.map((r) => <option key={r} value={r}>{RULE_LABEL[r] || r}</option>)}
                      </select>
                    </td>
                    <td>
                      <input className="pp-input pp-input-mono" style={{ width: '100%' }} value={rule.value || ''}
                        onChange={(e) => patchRule(index, 'value', e.target.value)} />
                    </td>
                    <td>
                      <button className="pp-btn" onClick={() => setRules(rules.filter((_, i) => i !== index))}>删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
            <button className="pp-btn" onClick={() => setRules(rules.concat([blankRule(current && current.id)]))}>+ 添加规则</button>
            <button className="pp-btn pp-btn-primary" onClick={persist} disabled={busy}>保存配置</button>
          </div>
        </section>

        {/* 右：服务启停 + 命中地址 */}
        <section className="pp-pane">
          <div className="pp-card-title">本地 Mock 服务</div>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="pp-pill">{service.running ? '运行中' : '已停止'}</span>
            <span className="pp-muted">端口 {service.port || port}</span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
            <button className="pp-btn pp-btn-primary" onClick={startService} disabled={busy || service.running}>启动</button>
            <button className="pp-btn" onClick={stopService} disabled={busy || !service.running}>停止</button>
          </div>

          <div className="pp-card-title" style={{ marginTop: 'var(--sp-3)' }}>命中地址</div>
          {urls.length === 0 ? <EmptyState text="选择接口后显示命中地址" /> : null}
          {urls.map((u) => <pre key={u} className="pp-pre" style={{ marginBottom: 'var(--sp-1)' }}>{u}</pre>)}

          <p className="pp-muted" style={{ marginTop: 'var(--sp-2)' }}>
            规则优先级：字段规则 → 默认响应（isDefault）→ 200 {'{}'}
          </p>
        </section>
      </div>
    </div>
  )
}
