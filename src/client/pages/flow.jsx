// flow.jsx — 流程图页（Apifox 工作台：时序图容器 + 步骤编排表 + 拆分提示）
// 哲学：diagram-design 4/10 密度；steps > 9 显示拆分提示（超过即拆两张图）
// 自注册；数据契约 §2 project.flow.steps（含可选 op/guard/divider/headline 扩展字段）
// 编排结果真接 api.storage.saveFlow(projectId, flow) 落盘；api 缺失时用 localStorage 草稿兜底
// 视觉基线：docs/apifox-design-spec.md —— .pp-seq-wrap / .pp-table / .pp-split-hint
import React, { useEffect, useRef, useState } from 'react'
import { SequenceDiagram, exportSequenceSvg } from './sequence.jsx'
import { applyTheme } from './theme.js'

;(window.__postapiQueue = window.__postapiQueue || []).push(['flow', FlowPage]) // 注册表就绪前入队

const ACTIONS = ['call', 'return', 'self', 'note']

// —— mock flow（契约 §2 flow 结构；后两条带 alt 片段扩展字段）——
const DEFAULT_STEPS = [
  { actor: '页面', action: 'call', target: 'Storage', message: 'loadProject', note: '' },
  { actor: 'Storage', action: 'return', target: '页面', message: 'project', note: '' },
  { actor: '页面', action: 'call', target: 'Request', message: 'send', note: '' },
  { actor: 'Request', action: 'call', target: 'Server', message: 'GET /users', note: '' },
  { actor: 'Server', action: 'return', target: 'Request', message: '200 OK', note: '', headline: true },
  { actor: 'Request', action: 'self', target: '', message: 'serialize body', note: '' },
  { actor: 'Request', action: 'return', target: '页面', message: 'result', note: '' },
  { actor: '页面', action: 'self', target: '', message: 'render doc', note: '', op: 'alt', guard: '[status 2xx]' },
  { actor: '页面', action: 'self', target: '', message: 'toast error', note: '', divider: true, guard: '[else]' },
]

const DRAFT_KEY = 'postapi.flow.draft'

/** 步骤规整：补齐 action/actor/target/message/note，丢弃非对象项（保存前统一调用）。 */
export function normalizeSteps(steps) {
  return (Array.isArray(steps) ? steps : [])
    .filter((s) => s && typeof s === 'object')
    .map((s) => {
      const out = {
        actor: String(s.actor || ''),
        action: ACTIONS.includes(s.action) ? s.action : 'call',
        target: String(s.target || ''),
        message: String(s.message || ''),
        note: String(s.note || ''),
      }
      if (s.op === 'alt' || s.op === 'opt') out.op = s.op
      if (s.guard) out.guard = String(s.guard)
      if (s.divider === true) out.divider = true
      if (s.headline === true) out.headline = true
      return out
    })
}

/** flow 载荷：项目 flow 结构 + 规整后的 steps。 */
export function flowPayload(name, steps) {
  return { name: String(name || ''), steps: normalizeSteps(steps) }
}

function loadDraft() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DRAFT_KEY) : null
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? normalizeSteps(parsed) : null
  } catch {
    return null
  }
}
function saveDraft(steps) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(normalizeSteps(steps))) } catch { /* 忽略隐私模式 */ }
}

function errText(err) {
  return err && err.message ? err.message : String(err)
}

export function FlowPage(props) {
  const rootRef = useRef(null)
  const svgRef = useRef(null)
  const api = (props && props.api) || (typeof window !== 'undefined' ? window.__postapiApi : undefined)
  const storage = api && api.storage
  const [projects, setProjects] = useState([{ id: 'proj_demo01', name: '订单中心' }])
  const [projectId, setProjectId] = useState('proj_demo01')
  const [flowName, setFlowName] = useState('接口调试时序')
  const [steps, setSteps] = useState(() => loadDraft() || DEFAULT_STEPS)
  const [isMock, setIsMock] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    applyTheme(rootRef.current)
    saveDraft(steps)
  }, [steps])

  // 项目列表 + 当前项目 flow 载入（api 缺失时保持 mock 与草稿）
  useEffect(() => {
    const boot = async () => {
      if (!storage || typeof storage.listProjects !== 'function') return
      try {
        const list = await storage.listProjects()
        if (Array.isArray(list) && list.length > 0) {
          setProjects(list)
          setProjectId(list[0].id)
          setIsMock(false)
          if (typeof storage.getProject === 'function') {
            const loaded = await storage.getProject(list[0].id)
            const flow = loaded && loaded.flow
            if (flow && Array.isArray(flow.steps) && flow.steps.length > 0) {
              setSteps(normalizeSteps(flow.steps))
              setFlowName(flow.name || '接口调试时序')
            }
          }
        }
      } catch (err) {
        setError('加载项目失败：' + errText(err))
      }
    }
    boot()
  }, [])

  const overBudget = steps.length > 9

  const update = (i, patch) => {
    setSteps(steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
    setNotice('')
  }
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= steps.length) return
    const next = steps.slice()
    const tmp = next[i]
    next[i] = next[j]
    next[j] = tmp
    setSteps(next)
    setNotice('')
  }
  const remove = (i) => { setSteps(steps.filter((_, idx) => idx !== i)); setNotice('') }
  const add = () => {
    setSteps(steps.concat([{ actor: '页面', action: 'call', target: 'Storage', message: '', note: '' }]))
    setNotice('')
  }

  const reloadProject = async (id) => {
    if (!storage || typeof storage.getProject !== 'function') {
      setError('当前桥未提供 api.storage.getProject')
      return
    }
    setError('')
    try {
      const loaded = await storage.getProject(id)
      const flow = loaded && loaded.flow
      if (flow && Array.isArray(flow.steps)) {
        setSteps(normalizeSteps(flow.steps))
        setFlowName(flow.name || '接口调试时序')
        setNotice('已载入项目流程图：' + (flow.name || '未命名'))
      } else {
        setNotice('该项目尚无流程图，可编辑后保存')
      }
    } catch (err) {
      setError('载入流程图失败：' + errText(err))
    }
  }

  const persist = async () => {
    if (!storage || typeof storage.saveFlow !== 'function') {
      setError('当前桥未提供 api.storage.saveFlow，编排结果仅保存在本地草稿（' + DRAFT_KEY + '）')
      return
    }
    setError('')
    try {
      const payload = flowPayload(flowName, steps)
      await storage.saveFlow(projectId, payload)
      setNotice('已保存流程图：' + (payload.name || '未命名') + '（' + payload.steps.length + ' 步）')
    } catch (err) {
      setError('保存流程图失败：' + errText(err))
    }
  }

  const copyJson = async () => {
    const text = JSON.stringify(flowPayload(flowName, steps), null, 2)
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text)
        setNotice('flow JSON 已复制')
        return
      } catch (err) {
        setError('复制失败：' + errText(err))
        return
      }
    }
    setError('当前环境无剪贴板权限，请手动复制 JSON')
  }
  const exportSvg = () => exportSequenceSvg(svgRef.current, 'flow-sequence.svg')

  return (
    <div className="pp-scope pp-page" data-page="flow" ref={rootRef}>
      <div className="pp-overview-head">
        <span className="pp-overview-title">流程图</span>
        {/* 页头只留主动作；项目选择、图名与导出复制移进内容区工具条，
            否则 528px 宽的主区里 7 个控件会把页头顶出 248px。 */}
        <div className="pp-overview-actions">
          <button className="pp-btn pp-btn-primary" onClick={persist}>保存到项目</button>
        </div>
      </div>
      <div className="pp-overview-content">
        <div className="pp-card">
          <div className="pp-card-title">图配置</div>
          <div className="pp-form-grid">
            <label className="pp-form-label">项目</label>
            <select className="pp-select" value={projectId}
              onChange={(e) => { setProjectId(e.target.value); reloadProject(e.target.value) }}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
            </select>
            <label className="pp-form-label">图名</label>
            <input className="pp-input" value={flowName}
              onChange={(e) => { setFlowName(e.target.value); setNotice('') }} />
          </div>
          <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-3)' }}>
            <button className="pp-btn" onClick={exportSvg}>导出 SVG</button>
            <button className="pp-btn" onClick={copyJson}>复制 JSON</button>
          </div>
        </div>
        <div className="pp-toolbar">
          <span className="pp-meta">
            {isMock
              ? '示例数据 — api.storage.saveFlow 不可用，编排结果仅存本地草稿（' + DRAFT_KEY + '）'
              : '数据来源：api.storage（getProject / saveFlow）'}
          </span>
        </div>
        {error ? <p className="pp-error-text">{error}</p> : null}
        {notice ? <p className="pp-muted">{notice}</p> : null}
  
        {overBudget && (
          <div className="pp-split-hint" style={{ marginBottom: 'var(--sp-3)' }}>
            当前 {steps.length} 步，超过 9 步密度预算（4/10）——建议拆分为「主流程」与「分支/异常」两张图
          </div>
        )}
  
        <div className="pp-seq-wrap">
          <SequenceDiagram
            steps={steps}
            svgRef={svgRef}
            idPrefix="flow-page-seq"
            title={flowName || '接口调试时序'}
            desc="页面经 Storage 载入项目、Request 发起 HTTP 调用，并按响应状态渲染或提示错误的时序图"
          />
        </div>
  
        <div className="pp-card" style={{ marginTop: 'var(--sp-4)' }}>
          <div className="pp-card-title">步骤编排</div>
          <div className="pp-table-wrap">
          <table className="pp-table pp-table-wide">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th style={{ width: '110px' }}>发起方</th>
                <th style={{ width: '110px' }}>动作</th>
                <th style={{ width: '110px' }}>接收方</th>
                <th>消息</th>
                <th style={{ width: '140px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((s, i) => (
                <tr key={i}>
                  <td className="pp-meta">{i + 1}</td>
                  <td>
                    <input className="pp-input pp-input-sm" style={{ width: '100%' }} value={s.actor}
                      onChange={(e) => update(i, { actor: e.target.value })} />
                  </td>
                  <td>
                    <select className="pp-select pp-input-sm" style={{ width: '100%' }} value={s.action}
                      onChange={(e) => update(i, { action: e.target.value })}>
                      {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </td>
                  <td>
                    <input className="pp-input pp-input-sm" style={{ width: '100%' }} value={s.target || ''}
                      onChange={(e) => update(i, { target: e.target.value })} />
                  </td>
                  <td>
                    <input className="pp-input pp-input-sm" style={{ width: '100%' }} value={s.message || ''}
                      onChange={(e) => update(i, { message: e.target.value })} />
                  </td>
                  <td>
                    <button className="pp-btn pp-btn-sm" onClick={() => move(i, -1)} title="上移">↑</button>{' '}
                    <button className="pp-btn pp-btn-sm" onClick={() => move(i, 1)} title="下移">↓</button>{' '}
                    <button className="pp-btn pp-btn-sm pp-btn-danger" onClick={() => remove(i)} title="删除">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-3)' }}>
            <button className="pp-btn pp-btn-primary" onClick={add}>+ 添加步骤</button>
          </div>
        </div>
      
      </div>
    </div>
  )
}
