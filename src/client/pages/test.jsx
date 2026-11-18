// test.jsx — 自动化测试页（Apifox 工作台：左用例/场景树 + 右断言表 + 运行结果行）
// 自注册：模块求值期入队 __postapiQueue
// 数据：api.storage.getProject / saveProjectSettings（契约 §3 无 testCase 专用 CRUD，
//       用例与场景存 project.settings.testCases / testScenarios；读取兼容 project 顶层同名键）
//      运行：api.test.runCase / api.test.runScenario（契约 §5 POST /test/runCase / runScenario）
// 视觉基线：docs/apifox-design-spec.md —— .pp-tree-row / .pp-table / .pp-result-row / .pp-pill
import React, { useEffect, useRef, useState } from 'react'
import { applyTheme } from './theme.js'

;(window.__postapiQueue = window.__postapiQueue || []).push(['test', TestPage]) // 注册表就绪前入队

const OPS = ['eq', 'neq', 'gt', 'lt', 'contains', 'notContains', 'exists', 'notExists', 'regex']
const SOURCES = ['status', 'body', 'header', 'time']

const MOCK_CASES = [
  {
    id: 'tc_1001', name: '订单列表返回 200', endpointId: 'ep_1001',
    assertions: [{ source: 'status', path: '', op: 'eq', value: '200', message: '状态码应为 200' }],
    extractors: [], lastResult: null,
  },
  {
    id: 'tc_1002', name: '创建订单返回 orderId', endpointId: 'ep_1002',
    assertions: [{ source: 'body', path: 'data.orderId', op: 'exists', value: '', message: 'body 应含 orderId' }],
    extractors: [{ name: 'orderId', path: 'data.orderId' }], lastResult: null,
  },
]
const MOCK_SCENARIOS = [
  {
    id: 'ts_1001', name: '下单主流程', lastRun: null,
    steps: [
      { id: 'stp_01', name: '创建订单', endpointId: 'ep_1002', override: {}, extract: [{ name: 'orderId', path: 'data.orderId' }] },
      { id: 'stp_02', name: '查询订单', endpointId: 'ep_1001', override: {}, extract: [] },
    ],
  },
]

/** 结果汇总：passed 计数 + 失败明细（runCase 用 results、runScenario 用 steps）。 */
export function summarizeResult(res) {
  const results = res && Array.isArray(res.results) ? res.results : []
  const steps = res && Array.isArray(res.steps) ? res.steps : []
  const rows = results.length > 0 ? results : steps
  const passedCount = rows.filter((r) => r && r.passed === true).length
  return {
    passed: res && res.passed !== undefined ? res.passed === true : passedCount === rows.length && rows.length > 0,
    total: rows.length,
    passedCount,
    failedCount: rows.length - passedCount,
    durationMs: res && res.durationMs !== undefined ? res.durationMs : 0,
    error: (res && res.error) || '',
    rows,
  }
}

/** 断言列表规整：补齐 source/path/op/value/message，非法项丢弃。 */
export function normalizeAssertions(list) {
  return (Array.isArray(list) ? list : [])
    .filter((a) => a && typeof a === 'object')
    .map((a) => ({
      source: SOURCES.includes(a.source) ? a.source : 'status',
      path: String(a.path || ''),
      op: OPS.includes(a.op) ? a.op : 'eq',
      value: String(a.value === undefined || a.value === null ? '' : a.value),
      message: String(a.message || ''),
    }))
}

/** 从项目对象取用例/场景：顶层优先，回落 settings 子键（落盘通道）。 */
export function casesOf(project) {
  const p = project && typeof project === 'object' ? project : {}
  const settings = p.settings && typeof p.settings === 'object' ? p.settings : {}
  const src = Array.isArray(p.testCases) ? p.testCases : (Array.isArray(settings.testCases) ? settings.testCases : [])
  return src.filter((c) => c && typeof c === 'object')
}
export function scenariosOf(project) {
  const p = project && typeof project === 'object' ? project : {}
  const settings = p.settings && typeof p.settings === 'object' ? p.settings : {}
  const src = Array.isArray(p.testScenarios) ? p.testScenarios : (Array.isArray(settings.testScenarios) ? settings.testScenarios : [])
  return src.filter((s) => s && typeof s === 'object')
}

function errText(err) {
  return err && err.message ? err.message : String(err)
}

export function TestPage(props) {
  const rootRef = useRef(null)
  const api = (props && props.api) || (typeof window !== 'undefined' ? window.__postapiApi : undefined)
  const storage = api && api.storage
  const [projects, setProjects] = useState([{ id: 'proj_demo01', name: '订单中心' }])
  const [projectId, setProjectId] = useState('proj_demo01')
  const [project, setProject] = useState({ endpoints: [] })
  const [cases, setCases] = useState(MOCK_CASES)
  const [scenarios, setScenarios] = useState(MOCK_SCENARIOS)
  const [isMock, setIsMock] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [tab, setTab] = useState('cases')
  const [activeCaseId, setActiveCaseId] = useState(MOCK_CASES[0].id)
  const [activeScenarioId, setActiveScenarioId] = useState(MOCK_SCENARIOS[0].id)
  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(false)

  useEffect(() => applyTheme(rootRef.current), [])

  const loadProject = async (id) => {
    if (!storage || typeof storage.getProject !== 'function') {
      setIsMock(true)
      return
    }
    try {
      const loaded = await storage.getProject(id)
      if (loaded) {
        setProject(loaded)
        setCases(casesOf(loaded))
        setScenarios(scenariosOf(loaded))
        setIsMock(false)
      }
    } catch (err) {
      setError('加载项目失败：' + errText(err))
    }
  }

  useEffect(() => {
    const boot = async () => {
      if (storage && typeof storage.listProjects === 'function') {
        try {
          const list = await storage.listProjects()
          if (Array.isArray(list) && list.length > 0) {
            setProjects(list)
            setProjectId(list[0].id)
            await loadProject(list[0].id)
            return
          }
        } catch (err) {
          setError('加载项目列表失败：' + errText(err))
        }
      }
      setIsMock(true)
    }
    boot()
  }, [])

  const endpoints = Array.isArray(project.endpoints) ? project.endpoints : []
  const activeCase = cases.find((c) => c.id === activeCaseId) || null
  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) || null

  const patchCase = (patch) => {
    setCases(cases.map((c) => (c.id === activeCaseId ? { ...c, ...patch } : c)))
    setNotice('')
  }
  const patchAssertion = (i, patch) => {
    const next = normalizeAssertions(activeCase && activeCase.assertions)
    next[i] = { ...next[i], ...patch }
    patchCase({ assertions: next })
  }
  const addAssertion = () => patchCase({
    assertions: normalizeAssertions(activeCase && activeCase.assertions)
      .concat([{ source: 'status', path: '', op: 'eq', value: '', message: '' }]),
  })
  const removeAssertion = (i) => patchCase({
    assertions: normalizeAssertions(activeCase && activeCase.assertions).filter((_, idx) => idx !== i),
  })

  const patchScenario = (patch) => {
    setScenarios(scenarios.map((s) => (s.id === activeScenarioId ? { ...s, ...patch } : s)))
    setNotice('')
  }
  const patchStep = (i, patch) => {
    const steps = (activeScenario && Array.isArray(activeScenario.steps) ? activeScenario.steps : []).slice()
    steps[i] = { ...steps[i], ...patch }
    patchScenario({ steps })
  }
  const moveStep = (i, dir) => {
    const steps = (activeScenario && Array.isArray(activeScenario.steps) ? activeScenario.steps : []).slice()
    const j = i + dir
    if (j < 0 || j >= steps.length) return
    const tmp = steps[i]
    steps[i] = steps[j]
    steps[j] = tmp
    patchScenario({ steps })
  }
  const addStep = () => {
    const steps = (activeScenario && Array.isArray(activeScenario.steps) ? activeScenario.steps : []).concat([
      { id: 'stp_' + Date.now().toString(36), name: '新步骤', endpointId: (endpoints[0] && endpoints[0].id) || '', override: {}, extract: [] },
    ])
    patchScenario({ steps })
  }
  const removeStep = (i) => {
    const steps = (activeScenario && Array.isArray(activeScenario.steps) ? activeScenario.steps : []).filter((_, idx) => idx !== i)
    patchScenario({ steps })
  }

  const persist = async () => {
    if (!storage || typeof storage.saveProjectSettings !== 'function') {
      setError('当前桥未提供持久化入口（saveProjectSettings），用例与场景仅停留在页面内')
      return false
    }
    setError('')
    try {
      // saveProjectSettings 为局部合并，写两个子键不会冲掉 mockPort/proxyUrl 等既有设置。
      await storage.saveProjectSettings(projectId, {
        ...(project.settings || {}),
        testCases: cases,
        testScenarios: scenarios,
      })
      setNotice('已保存用例与场景（落在 project.settings.testCases / testScenarios）')
      return true
    } catch (err) {
      setError('保存用例与场景失败：' + errText(err))
      return false
    }
  }

  const runCase = async () => {
    if (!activeCase) return
    if (!api || !api.test || typeof api.test.runCase !== 'function') {
      setError('当前桥未提供 api.test.runCase（契约 §5 POST /test/runCase）')
      return
    }
    setRunning(true)
    setError('')
    setResult(null)
    try {
      const res = await api.test.runCase(projectId, activeCase.id)
      setResult({ kind: 'case', name: activeCase.name, ...summarizeResult(res) })
    } catch (err) {
      setError('运行用例失败：' + errText(err))
    } finally {
      setRunning(false)
    }
  }

  const runScenario = async () => {
    if (!activeScenario) return
    if (!api || !api.test || typeof api.test.runScenario !== 'function') {
      setError('当前桥未提供 api.test.runScenario（契约 §5 POST /test/runScenario）')
      return
    }
    setRunning(true)
    setError('')
    setResult(null)
    try {
      const res = await api.test.runScenario(projectId, activeScenario.id)
      setResult({ kind: 'scenario', name: activeScenario.name, ...summarizeResult(res) })
    } catch (err) {
      setError('运行场景失败：' + errText(err))
    } finally {
      setRunning(false)
    }
  }

  const caseAssertions = normalizeAssertions(activeCase && activeCase.assertions)

  // 运行结果：汇总行用 .pp-pill 三档胶囊，明细行用 .pp-result-row
  const resultPanel = (emptyHint) => (
    <div className="pp-pane">
      <div className="pp-card-title">运行结果</div>
      {result ? (
        <div>
          <div className="pp-toolbar-inline">
            <span className={result.passed ? 'pp-pill pp-pill-ok' : 'pp-pill pp-pill-bad'}>
              {result.passed ? '通过' : '失败'}
            </span>
            <span className="pp-meta">{result.passedCount}/{result.total}</span>
            <span className="pp-meta">{result.durationMs} ms</span>
          </div>
          {result.error ? <p className="pp-error-text">{result.error}</p> : null}
          <div className="pp-list" style={{ marginTop: 'var(--sp-2)' }}>
            {result.rows.map((r, i) => (
              <div key={i} className="pp-result-row">
                <span className="pp-ellipsis">{r.name || r.id || '-'}</span>
                <span className={r.passed ? 'pp-pill pp-pill-ok' : 'pp-pill pp-pill-bad'} style={{ marginLeft: 'auto' }}>
                  {r.passed ? '通过' : '失败'}
                </span>
                <span className="pp-meta pp-ellipsis">{r.error || '-'}</span>
              </div>
            ))}
            {result.rows.length === 0 ? <div className="pp-result-row pp-meta">无断言结果</div> : null}
          </div>
        </div>
      ) : <div className="pp-empty">{emptyHint}</div>}
    </div>
  )

  return (
    <div className="pp-scope pp-page" data-page="test" ref={rootRef}>
      <h1 className="pp-page-title">自动化测试</h1>
      <div className="pp-toolbar">
        <span className="pp-meta">
          {isMock
            ? '示例数据 — api.storage 不可用，以下为文件内 mock'
            : '数据来源：api.storage.getProject（用例与场景存 project.settings.testCases / testScenarios）；运行走 api.test.runCase / runScenario'}
        </span>
        <span className="pp-toolbar-spacer" />
        <label className="pp-meta">项目</label>
        <select className="pp-select" value={projectId}
          onChange={(e) => { setProjectId(e.target.value); loadProject(e.target.value) }}>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
        </select>
        <button className="pp-btn" onClick={persist}>保存用例与场景</button>
      </div>
      {error ? <p className="pp-error-text">{error}</p> : null}
      {notice ? <p className="pp-muted">{notice}</p> : null}

      <div className="pp-tabs">
        <button className="pp-tab" data-active={tab === 'cases' ? 'true' : 'false'} onClick={() => setTab('cases')}>测试用例</button>
        <button className="pp-tab" data-active={tab === 'scenarios' ? 'true' : 'false'} onClick={() => setTab('scenarios')}>测试场景</button>
      </div>

      {tab === 'cases' ? (
        <div className="pp-debug-layout" style={{ marginTop: 'var(--sp-3)' }}>
          <div className="pp-pane">
            <div className="pp-card-title">用例</div>
            <div className="pp-tree">
              {cases.map((c) => (
                <div key={c.id} className="pp-tree-row" data-active={c.id === activeCaseId ? 'true' : 'false'}
                  onClick={() => { setActiveCaseId(c.id); setResult(null); setError('') }}>
                  <span className="pp-ellipsis">{c.name || c.id}</span>
                </div>
              ))}
            </div>
            {cases.length === 0 ? <div className="pp-empty">暂无用例</div> : null}
          </div>
          <div className="pp-pane">
            <div className="pp-card-title">断言</div>
            {activeCase ? (
              <div>
                <div className="pp-form-row">
                  <label className="pp-form-label">名称</label>
                  <input className="pp-input" style={{ flex: 1 }} value={activeCase.name || ''}
                    onChange={(e) => patchCase({ name: e.target.value })} />
                </div>
                <div className="pp-form-row">
                  <label className="pp-form-label">接口</label>
                  <select className="pp-select" style={{ flex: 1 }} value={activeCase.endpointId || ''}
                    onChange={(e) => patchCase({ endpointId: e.target.value })}>
                    <option value="">（未绑定）</option>
                    {endpoints.map((ep) => <option key={ep.id} value={ep.id}>{ep.method} {ep.url}</option>)}
                  </select>
                </div>
                <table className="pp-table">
                  <thead>
                    <tr>
                      <th style={{ width: '90px' }}>来源</th>
                      <th>路径</th>
                      <th style={{ width: '110px' }}>操作</th>
                      <th>期望值</th>
                      <th>说明</th>
                      <th style={{ width: '70px' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caseAssertions.map((a, i) => (
                      <tr key={i}>
                        <td>
                          <select className="pp-select pp-input-sm" value={a.source} onChange={(e) => patchAssertion(i, { source: e.target.value })}>
                            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td><input className="pp-input pp-input-sm pp-input-mono" style={{ width: '100%' }} value={a.path}
                          onChange={(e) => patchAssertion(i, { path: e.target.value })} /></td>
                        <td>
                          <select className="pp-select pp-input-sm" value={a.op} onChange={(e) => patchAssertion(i, { op: e.target.value })}>
                            {OPS.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </td>
                        <td><input className="pp-input pp-input-sm pp-input-mono" style={{ width: '100%' }} value={a.value}
                          onChange={(e) => patchAssertion(i, { value: e.target.value })} /></td>
                        <td><input className="pp-input pp-input-sm" style={{ width: '100%' }} value={a.message}
                          onChange={(e) => patchAssertion(i, { message: e.target.value })} /></td>
                        <td><button className="pp-btn pp-btn-sm pp-btn-danger" onClick={() => removeAssertion(i)}>删除</button></td>
                      </tr>
                    ))}
                    {caseAssertions.length === 0 ? <tr><td colSpan={6} className="pp-muted">暂无断言</td></tr> : null}
                  </tbody>
                </table>
                <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-3)' }}>
                  <button className="pp-btn" onClick={addAssertion}>新增断言</button>
                  <button className="pp-btn pp-btn-primary" onClick={runCase} disabled={running}>运行用例</button>
                </div>
              </div>
            ) : <div className="pp-empty">左侧选择一个用例</div>}
          </div>
          {resultPanel('尚未运行')}
        </div>
      ) : (
        <div className="pp-debug-layout" style={{ marginTop: 'var(--sp-3)' }}>
          <div className="pp-pane">
            <div className="pp-card-title">场景</div>
            <div className="pp-tree">
              {scenarios.map((s) => (
                <div key={s.id} className="pp-tree-row" data-active={s.id === activeScenarioId ? 'true' : 'false'}
                  onClick={() => { setActiveScenarioId(s.id); setResult(null); setError('') }}>
                  <span className="pp-ellipsis">{s.name || s.id}</span>
                  <span className="pp-tree-row-count">{(s.steps || []).length}</span>
                </div>
              ))}
            </div>
            {scenarios.length === 0 ? <div className="pp-empty">暂无场景</div> : null}
          </div>
          <div className="pp-pane">
            <div className="pp-card-title">步骤编排</div>
            {activeScenario ? (
              <div>
                <div className="pp-form-row">
                  <label className="pp-form-label">场景名</label>
                  <input className="pp-input" style={{ flex: 1 }} value={activeScenario.name || ''}
                    onChange={(e) => patchScenario({ name: e.target.value })} />
                </div>
                <table className="pp-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>步骤名</th>
                      <th>接口</th>
                      <th style={{ width: '140px' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeScenario.steps || []).map((s, i) => (
                      <tr key={s.id || i}>
                        <td className="pp-meta">{i + 1}</td>
                        <td><input className="pp-input pp-input-sm" style={{ width: '100%' }} value={s.name || ''}
                          onChange={(e) => patchStep(i, { name: e.target.value })} /></td>
                        <td>
                          <select className="pp-select pp-input-sm" style={{ width: '100%' }} value={s.endpointId || ''}
                            onChange={(e) => patchStep(i, { endpointId: e.target.value })}>
                            <option value="">（未绑定）</option>
                            {endpoints.map((ep) => <option key={ep.id} value={ep.id}>{ep.method} {ep.url}</option>)}
                          </select>
                          {s.endpointId ? (
                            <span className="pp-method" data-method={(endpoints.find((ep) => ep.id === s.endpointId) || {}).method || 'GET'}>
                              {(endpoints.find((ep) => ep.id === s.endpointId) || {}).method || 'GET'}
                            </span>
                          ) : null}
                        </td>
                        <td>
                          <button className="pp-btn pp-btn-sm" onClick={() => moveStep(i, -1)} title="上移">↑</button>{' '}
                          <button className="pp-btn pp-btn-sm" onClick={() => moveStep(i, 1)} title="下移">↓</button>{' '}
                          <button className="pp-btn pp-btn-sm pp-btn-danger" onClick={() => removeStep(i)} title="删除">×</button>
                        </td>
                      </tr>
                    ))}
                    {(activeScenario.steps || []).length === 0 ? <tr><td colSpan={4} className="pp-muted">暂无步骤</td></tr> : null}
                  </tbody>
                </table>
                <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-3)' }}>
                  <button className="pp-btn" onClick={addStep}>添加步骤</button>
                  <button className="pp-btn pp-btn-primary" onClick={runScenario} disabled={running}>运行场景</button>
                </div>
              </div>
            ) : <div className="pp-empty">左侧选择一个场景</div>}
          </div>
          {resultPanel('尚未运行')}
        </div>
      )}
    </div>
  )
}
