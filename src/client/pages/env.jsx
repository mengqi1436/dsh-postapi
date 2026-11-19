// env.jsx — 环境与变量页（Apifox 工作台：左环境列表 + 右变量表 + 全局变量 + 优先级说明）
// 自注册：模块求值期入队 __postapiQueue
// 数据：api.storage.listProjects / getProject / saveEnvironment / deleteEnvironment / saveGlobals
// 视觉基线：docs/apifox-design-spec.md —— .pp-tree-row / .pp-table（表头 --bg-subtle）/ .pp-toolbar / .pp-note
import React, { useEffect, useRef, useState } from 'react'
import { applyTheme } from './theme.js'
import { EmptyState } from './components/EmptyState.jsx'

;(window.__postapiQueue = window.__postapiQueue || []).push(['env', EnvPage]) // 注册表就绪前入队

const MOCK_PROJECT = {
  id: 'proj_demo01',
  name: '订单中心',
  environments: [
    {
      id: 'env_dev', name: '开发环境', baseUrl: 'http://127.0.0.1:8080', isDefault: true,
      variables: [
        { key: 'token', value: 'dev-token', enabled: true, secret: true },
        { key: 'tenantId', value: 't-1001', enabled: true, secret: false },
      ],
    },
    { id: 'env_prod', name: '生产环境', baseUrl: 'https://api.example.test', isDefault: false, variables: [] },
  ],
  globals: { variables: [{ key: 'userAgent', value: 'postapi/0.1.0', enabled: true, secret: false }] },
}

const VAR_COLUMNS = ['变量名', '值', '启用', '密钥', '操作']
/** 右编辑区页签（Apifox 环境管理把「环境变量 / 全局变量」放在同一页，这里补上优先级说明） */
const ENV_TABS = [
  { id: 'env', label: '环境变量' },
  { id: 'globals', label: '全局变量' },
  { id: 'priority', label: '优先级' },
]
const PRIORITY_ROWS = [
  { level: '1（最高）', scope: '接口局部变量', note: 'params / headers / body 里写死的值' },
  { level: '2', scope: '环境变量', note: '当前环境 enabled 的变量' },
  { level: '3', scope: '全局变量', note: '跨环境共用' },
  { level: '4（最低）', scope: '动态变量', note: '{{$timestamp}} 等内置变量' },
]

/** 变量行规整：补齐 enabled/secret 默认值，丢弃非对象项。 */
export function normalizeVars(list) {
  return (Array.isArray(list) ? list : [])
    .filter((v) => v && typeof v === 'object')
    .map((v) => ({
      key: String(v.key || ''),
      value: String(v.value === undefined || v.value === null ? '' : v.value),
      enabled: v.enabled !== false,
      secret: v.secret === true,
    }))
}

/** 变量优先级说明行（页面与测试共用同一份数据）。 */
export function priorityRows() {
  return PRIORITY_ROWS.slice()
}

/** 环境摘要：名称 + baseUrl + 变量数（左列表渲染用）。 */
export function envSummary(envs) {
  return (Array.isArray(envs) ? envs : []).map((e) => ({
    id: e.id,
    name: e.name || e.id,
    baseUrl: e.baseUrl || '',
    isDefault: e.isDefault === true,
    varCount: Array.isArray(e.variables) ? e.variables.length : 0,
  }))
}

function errText(err) {
  return err && err.message ? err.message : String(err)
}

function blankEnv() {
  return { name: '新环境', baseUrl: '', isDefault: false, variables: [] }
}

export function EnvPage(props) {
  const rootRef = useRef(null)
  const api = (props && props.api) || (typeof window !== 'undefined' ? window.__postapiApi : undefined)
  const storage = api && api.storage
  const [projects, setProjects] = useState([{ id: MOCK_PROJECT.id, name: MOCK_PROJECT.name }])
  const [projectId, setProjectId] = useState(MOCK_PROJECT.id)
  const [project, setProject] = useState(MOCK_PROJECT)
  const [isMock, setIsMock] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [draft, setDraft] = useState(MOCK_PROJECT.environments[0])
  const [globals, setGlobals] = useState(normalizeVars(MOCK_PROJECT.globals.variables))
  const [envTab, setEnvTab] = useState('env')

  useEffect(() => applyTheme(rootRef.current), [])

  const loadProject = async (id) => {
    if (!storage || typeof storage.getProject !== 'function') {
      setIsMock(true)
      setProject(MOCK_PROJECT)
      setDraft(MOCK_PROJECT.environments[0])
      setGlobals(normalizeVars(MOCK_PROJECT.globals.variables))
      return
    }
    try {
      const loaded = await storage.getProject(id)
      if (loaded) {
        setProject(loaded)
        const envs = Array.isArray(loaded.environments) ? loaded.environments : []
        setDraft(envs.length > 0 ? envs[0] : blankEnv())
        setGlobals(normalizeVars(loaded.globals && loaded.globals.variables))
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

  const envs = Array.isArray(project.environments) ? project.environments : []

  const pickEnv = (env) => {
    setDraft({ ...env, variables: normalizeVars(env.variables) })
    setNotice('')
    setError('')
  }

  const patchDraft = (patch) => setDraft({ ...draft, ...patch })

  const setVarAt = (i, patch) => {
    const next = normalizeVars(draft.variables)
    next[i] = { ...next[i], ...patch }
    setDraft({ ...draft, variables: next })
  }
  const addVar = () => setDraft({ ...draft, variables: normalizeVars(draft.variables).concat([{ key: '', value: '', enabled: true, secret: false }]) })
  const removeVar = (i) => setDraft({ ...draft, variables: normalizeVars(draft.variables).filter((_, idx) => idx !== i) })

  const setGlobalAt = (i, patch) => {
    const next = globals.slice()
    next[i] = { ...next[i], ...patch }
    setGlobals(next)
  }
  const addGlobal = () => setGlobals(globals.concat([{ key: '', value: '', enabled: true, secret: false }]))
  const removeGlobal = (i) => setGlobals(globals.filter((_, idx) => idx !== i))

  const saveEnv = async () => {
    if (!storage || typeof storage.saveEnvironment !== 'function') {
      setError('当前桥未提供 api.storage.saveEnvironment')
      return
    }
    if (!String(draft.name || '').trim()) {
      setError('环境名不能为空')
      return
    }
    setError('')
    try {
      const payload = { ...draft, variables: normalizeVars(draft.variables) }
      const saved = await storage.saveEnvironment(projectId, payload)
      setNotice('已保存环境：' + ((saved && saved.name) || payload.name))
      await loadProject(projectId)
    } catch (err) {
      setError('保存环境失败：' + errText(err))
    }
  }

  const removeEnv = async (envId) => {
    if (!storage || typeof storage.deleteEnvironment !== 'function') {
      setError('当前桥未提供 api.storage.deleteEnvironment')
      return
    }
    setError('')
    try {
      await storage.deleteEnvironment(projectId, envId)
      setNotice('已删除环境：' + envId)
      await loadProject(projectId)
    } catch (err) {
      setError('删除环境失败：' + errText(err))
    }
  }

  const saveGlobals = async () => {
    if (!storage || typeof storage.saveGlobals !== 'function') {
      setError('当前桥未提供 api.storage.saveGlobals')
      return
    }
    setError('')
    try {
      await storage.saveGlobals(projectId, { variables: globals })
      setNotice('已保存全局变量')
      await loadProject(projectId)
    } catch (err) {
      setError('保存全局变量失败：' + errText(err))
    }
  }

  const draftVars = normalizeVars(draft.variables)

  // 变量表：表头底色/行高由 .pp-table 统一（--bg-subtle / --row-h），单元格控件用 .pp-input-sm
  const varTable = (rows, onChange, onRemove) => (
    <table className="pp-table pp-table-vars">
      <thead>
        <tr>{VAR_COLUMNS.map((c) => <th key={c}>{c}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((v, i) => (
          <tr key={i}>
            <td>
              <input className="pp-input pp-input-sm pp-input-mono" style={{ width: '100%' }} value={v.key}
                onChange={(e) => onChange(i, { key: e.target.value })} />
            </td>
            <td>
              <input className="pp-input pp-input-sm pp-input-mono" style={{ width: '100%' }}
                type={v.secret ? 'password' : 'text'} value={v.value}
                onChange={(e) => onChange(i, { value: e.target.value })} />
            </td>
            <td>
              <input type="checkbox" checked={v.enabled} onChange={(e) => onChange(i, { enabled: e.target.checked })} />
            </td>
            <td>
              <input type="checkbox" checked={v.secret} onChange={(e) => onChange(i, { secret: e.target.checked })} />
            </td>
            <td>
              <button className="pp-btn pp-btn-sm pp-btn-ghost pp-btn-danger pp-icon-btn" onClick={() => onRemove(i)} title="删除该变量" aria-label="删除该变量">×</button>
            </td>
          </tr>
        ))}
        {rows.length === 0 ? (
          <tr><td colSpan={VAR_COLUMNS.length} className="pp-env-vars-empty">暂无变量，点下方「+ 变量」添加</td></tr>
        ) : null}
      </tbody>
    </table>
  )

  return (
    <div className="pp-scope pp-page" data-page="env" ref={rootRef}>
      <div className="pp-overview-head">
        <span className="pp-overview-title">环境与变量</span>
        <div className="pp-overview-actions">
          <label className="pp-meta">项目</label>
          <select className="pp-select" value={projectId}
            onChange={(e) => { setProjectId(e.target.value); loadProject(e.target.value) }}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
          </select>
        </div>
      </div>
      <div className="pp-overview-content">
        <div className="pp-toolbar">
          <span className="pp-meta">
            {isMock ? '示例数据 — api.storage 不可用，以下为文件内 mock' : '数据来源：api.storage（saveEnvironment / saveGlobals）'}
          </span>
        </div>
        {error ? <p className="pp-error-text">{error}</p> : null}
        {notice ? <p className="pp-muted">{notice}</p> : null}
  
        {/* Apifox 环境管理同构：左环境列表 + 右编辑区（页签分区）。
            单列纵向堆叠在 500px 主区里要把「环境 / 变量 / 优先级」滚三次才能看全，
            改成左列表 + 右页签后一屏就能切完三块。 */}
        <div className="pp-env-layout">
          <nav className="pp-panel pp-env-side" aria-label="环境列表">
            <div className="pp-env-side-head">
              <span className="pp-card-title">环境</span>
              <button className="pp-btn pp-btn-sm pp-btn-ghost pp-btn-accent" onClick={() => pickEnv(blankEnv())}>
                + 新建
              </button>
            </div>
            <div className="pp-tree">
              {envSummary(envs).map((e) => (
                <div key={e.id} className="pp-tree-row" data-active={draft && draft.id === e.id ? 'true' : 'false'}
                  onClick={() => pickEnv(envs.find((x) => x.id === e.id) || blankEnv())}>
                  <span className="pp-ellipsis">{e.name}{e.isDefault ? ' · 默认' : ''}</span>
                  <span className="pp-tree-row-count">{e.varCount}</span>
                </div>
              ))}
            </div>
            {envs.length === 0 ? (
              <EmptyState text="暂无环境" hint="点上方「+ 新建」创建第一个环境" />
            ) : null}
          </nav>

          <div className="pp-env-main">
            <div className="pp-tabs">
              {ENV_TABS.map((t) => (
                <button key={t.id} className="pp-tab" data-active={envTab === t.id ? 'true' : 'false'}
                  onClick={() => setEnvTab(t.id)}>{t.label}</button>
              ))}
            </div>

            {envTab === 'env' ? (
              <div className="pp-env-pane">
                <div className="pp-env-fields">
                  <div className="pp-env-field">
                    <label className="pp-form-label">名称</label>
                    <div className="pp-env-field-row">
                      <input className="pp-input" value={draft.name || ''}
                        onChange={(e) => patchDraft({ name: e.target.value })} />
                      <label className="pp-env-check">
                        <input type="checkbox" checked={draft.isDefault === true}
                          onChange={(e) => patchDraft({ isDefault: e.target.checked })} />
                        <span>设为默认</span>
                      </label>
                    </div>
                  </div>
                  <div className="pp-env-field">
                    <label className="pp-form-label">前置 URL</label>
                    <input className="pp-input pp-input-mono" value={draft.baseUrl || ''}
                      placeholder="https://api.example.com（末尾不加斜杠）"
                      onChange={(e) => patchDraft({ baseUrl: e.target.value })} />
                  </div>
                </div>
                <div className="pp-card-title">环境变量</div>
                <div className="pp-table-wrap">{varTable(draftVars, setVarAt, removeVar)}</div>
                <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-3)' }}>
                  <button className="pp-btn pp-btn-sm" onClick={addVar}>+ 变量</button>
                  <button className="pp-btn pp-btn-sm pp-btn-primary" onClick={saveEnv}>保存环境</button>
                  <button className="pp-btn pp-btn-sm pp-btn-danger" style={{ marginLeft: 'auto' }}
                    onClick={() => removeEnv(draft.id || '')}>删除环境</button>
                </div>
                <div className="pp-meta" style={{ marginTop: 'var(--sp-2)' }}>
                  仅启用的变量参与 {'{{key}}'} 替换；密钥变量以密码显示
                </div>
              </div>
            ) : null}

            {envTab === 'globals' ? (
              <div className="pp-env-pane">
                <div className="pp-card-title">全局变量</div>
                <div className="pp-table-wrap">{varTable(globals, setGlobalAt, removeGlobal)}</div>
                <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-3)' }}>
                  <button className="pp-btn pp-btn-sm" onClick={addGlobal}>+ 变量</button>
                  <button className="pp-btn pp-btn-sm pp-btn-primary" onClick={saveGlobals}>保存全局</button>
                </div>
                <div className="pp-meta" style={{ marginTop: 'var(--sp-2)' }}>
                  跨环境共用；与同名环境变量并存时环境优先
                </div>
              </div>
            ) : null}

            {envTab === 'priority' ? (
              <div className="pp-env-pane">
                <div className="pp-card-title">变量优先级</div>
                <div className="pp-priority-list">
                  {priorityRows().map((r, i) => (
                    <div key={r.level} className="pp-priority-item">
                      <span className="pp-priority-level">{i + 1}</span>
                      <div className="pp-priority-body">
                        <span className="pp-priority-scope">{r.scope}</span>
                        <span className="pp-priority-note">{r.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pp-meta" style={{ marginTop: 'var(--sp-3)' }}>
                  同名变量按此顺序取第一个命中的值；越靠上优先级越高
                </div>
              </div>
            ) : null}
          </div>
        </div>
      
      </div>
    </div>
  )
}
