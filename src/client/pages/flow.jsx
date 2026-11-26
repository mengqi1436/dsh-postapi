// flow.jsx — 流程图页（Apifox 工作台：时序图容器 + 步骤编排表 + 拆分提示）
// 哲学：diagram-design 4/10 密度；steps > 9 显示拆分提示（超过即拆两张图）
// 自注册；数据契约 §2 project.flow.steps（含可选 op/guard/divider/headline 扩展字段）
// 编排结果真接 api.storage.saveFlow(projectId, flow) 落盘；api 缺失时用 localStorage 草稿兜底
// 视觉基线：docs/apifox-design-spec.md —— .pp-seq-wrap / .pp-table / .pp-split-hint
import React, { useEffect, useRef, useState } from 'react'
import { SequenceDiagram, exportSequenceSvg } from './sequence.jsx'
import { applyTheme } from './theme.js'
import { EmptyState } from './components/EmptyState.jsx'

;(window.__postapiQueue = window.__postapiQueue || []).push(['flow', FlowPage]) // 注册表就绪前入队

const ACTIONS = ['call', 'return', 'self', 'note']
const ACTION_LABEL = { call: '调用', return: '返回', self: '自调用', note: '备注' }

/** 参与方去重（发起方 + 接收方），供属性面板的 datalist 与页头统计使用。 */
export function collectActors(steps) {
  const out = []
  for (const s of Array.isArray(steps) ? steps : []) {
    for (const name of [s.actor, s.target]) {
      if (name && !out.includes(name)) out.push(name)
    }
  }
  return out
}

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
  const [activeIdx, setActiveIdx] = useState(0)
  // 两段式删除（与 history 清空同款交互，不引弹窗）：第一次点标记待确认，误触有草稿兜底
  const [pendingDel, setPendingDel] = useState(false)
  const pickStep = (idx) => { setActiveIdx(idx); setPendingDel(false) }

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

  const active = steps[activeIdx] || null
  const actors = collectActors(steps)

  return (
    <div className="pp-scope pp-page" data-page="flow" ref={rootRef}>
      <div className="pp-overview-head">
        <span className="pp-overview-title">流程图</span>
        <div className="pp-overview-actions">
          {/* 项目切换 32px 档放页头：与 history/test 页同律（工具条只留次级操作） */}
          <select className="pp-select" value={projectId}
            onChange={(e) => { setProjectId(e.target.value); reloadProject(e.target.value) }}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
          </select>
          <span className="pp-pill">{steps.length} 步 · {actors.length} 参与方</span>
          <button className="pp-btn pp-btn-primary" onClick={persist}>保存到项目</button>
        </div>
      </div>
      <div className="pp-overview-content">
        <div className="pp-toolbar">
          <input className="pp-input pp-input-sm pp-flow-name" value={flowName}
            placeholder="图名"
            onChange={(e) => { setFlowName(e.target.value); setNotice('') }} />
          <span className="pp-toolbar-spacer" />
          <button className="pp-btn pp-btn-sm" onClick={exportSvg}>导出 SVG</button>
          <button className="pp-btn pp-btn-sm" onClick={copyJson}>复制 JSON</button>
          <span className="pp-meta">
            {isMock
              ? '示例数据 — api.storage.saveFlow 不可用，编排结果仅存本地草稿（' + DRAFT_KEY + '）'
              : '数据来源：api.storage（getProject / saveFlow）'}
          </span>
        </div>
        {error ? <p className="pp-error-text">{error}</p> : null}
        {notice ? <p className="pp-note pp-note-ok">{notice}</p> : null}

        {overBudget && (
          <div className="pp-split-hint">
            当前 {steps.length} 步，超过 9 步密度预算（4/10）——建议拆分为「主流程」与「分支/异常」两张图
          </div>
        )}

        {/* Apifox 测试场景同构：左侧步骤列表（可增删改序）+ 右侧时序画布。
            画布常驻可见，改任一步即时重绘；选中步骤在下方属性面板编辑。 */}
        <div className="pp-flow-layout">
          <nav className="pp-panel pp-flow-side" aria-label="步骤列表">
            <div className="pp-flow-side-head">
              <span className="pp-card-title">步骤</span>
              <button className="pp-btn pp-btn-sm pp-btn-ghost pp-btn-accent" onClick={add}>+ 添加</button>
            </div>
            <div className="pp-flow-steps">
              {steps.map((s, i) => (
                <div key={i} className="pp-flow-step" data-active={i === activeIdx ? 'true' : 'false'}
                  onClick={() => pickStep(i)}>
                  <span className="pp-flow-step-no">{i + 1}</span>
                  <div className="pp-flow-step-body">
                    <span className="pp-ellipsis pp-flow-step-name">{s.actor || '—'} → {s.target || '—'}</span>
                    <span className="pp-ellipsis pp-flow-step-msg">{s.message || '（空消息）'}</span>
                  </div>
                  <span className="pp-flow-step-act">{s.action}</span>
                </div>
              ))}
              {steps.length === 0 ? (
                <EmptyState text="暂无步骤" hint="点上方「+ 添加」开始编排" />
              ) : null}
            </div>
          </nav>

          <div className="pp-flow-main">
            {/* 画布只用 .pp-seq-wrap（与 .pp-flow-canvas 重复的两套样式已合并到一处） */}
            <div className="pp-seq-wrap">
              {steps.length > 0 ? (
                <SequenceDiagram
                  steps={steps}
                  svgRef={svgRef}
                  idPrefix="flow-page-seq"
                  title={flowName || '接口调试时序'}
                  desc="页面经 Storage 载入项目、Request 发起 HTTP 调用，并按响应状态渲染或提示错误的时序图"
                  activeIndex={activeIdx}
                  onSelectRow={pickStep}
                />
              ) : <EmptyState text="暂无可渲染的时序" hint="添加步骤后自动生成" />}
            </div>

            {active ? (
              <div className="pp-flow-props">
                <div className="pp-card-title">步骤 {activeIdx + 1}</div>
                <div className="pp-flow-prop-grid">
                  <label className="pp-form-label">发起方</label>
                  <input className="pp-input pp-input-sm" value={active.actor}
                    list="pp-flow-actors" onChange={(e) => update(activeIdx, { actor: e.target.value })} />
                  <label className="pp-form-label">动作</label>
                  <select className="pp-select pp-input-sm" value={active.action}
                    onChange={(e) => update(activeIdx, { action: e.target.value })}>
                    {ACTIONS.map((a) => <option key={a} value={a}>{ACTION_LABEL[a] || a}</option>)}
                  </select>
                  <label className="pp-form-label">接收方</label>
                  <input className="pp-input pp-input-sm" value={active.target || ''}
                    list="pp-flow-actors" onChange={(e) => update(activeIdx, { target: e.target.value })} />
                  <label className="pp-form-label">消息</label>
                  <input className="pp-input pp-input-sm pp-input-mono" value={active.message || ''}
                    onChange={(e) => update(activeIdx, { message: e.target.value })} />
                  <label className="pp-form-label">备注</label>
                  <input className="pp-input pp-input-sm" value={active.note || ''}
                    onChange={(e) => update(activeIdx, { note: e.target.value })} />
                  <label className="pp-form-label">分支</label>
                  <div className="pp-flow-prop-row">
                    <select className="pp-select pp-input-sm" value={active.op || ''}
                      onChange={(e) => update(activeIdx, { op: e.target.value || undefined })}>
                      <option value="">（无）</option>
                      <option value="alt">alt 条件分支</option>
                      <option value="opt">opt 可选片段</option>
                    </select>
                    <input className="pp-input pp-input-sm pp-input-mono" value={active.guard || ''}
                      placeholder="[条件]"
                      onChange={(e) => update(activeIdx, { guard: e.target.value || undefined })} />
                  </div>
                </div>
                <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-3)' }}>
                  <label className="pp-env-check">
                    <input type="checkbox" checked={active.headline === true}
                      onChange={(e) => update(activeIdx, { headline: e.target.checked || undefined })} />
                    <span>主色高亮</span>
                  </label>
                  <label className="pp-env-check">
                    <input type="checkbox" checked={active.divider === true}
                      onChange={(e) => update(activeIdx, { divider: e.target.checked || undefined })} />
                    <span>分隔线</span>
                  </label>
                  <span className="pp-toolbar-spacer" />
                  <button className="pp-btn pp-btn-sm" onClick={() => move(activeIdx, -1)} disabled={activeIdx === 0}>↑ 上移</button>
                  <button className="pp-btn pp-btn-sm" onClick={() => move(activeIdx, 1)} disabled={activeIdx === steps.length - 1}>↓ 下移</button>
                  <button className="pp-btn pp-btn-sm pp-btn-ghost pp-btn-danger"
                  title={pendingDel ? '再次点击确认删除该步骤' : '删除步骤（本地草稿自动保存，误删可撤销编排后重存）'}
                  onClick={() => {
                    if (!pendingDel) { setPendingDel(true); return }
                    setPendingDel(false)
                    remove(activeIdx)
                    setActiveIdx(Math.max(0, activeIdx - 1))
                  }}>{pendingDel ? '确认删除' : '删除'}</button>
                </div>
                <datalist id="pp-flow-actors">
                  {actors.map((a) => <option key={a} value={a} />)}
                </datalist>
              </div>
            ) : (
              <div className="pp-flow-props">
                <EmptyState text="未选中步骤" hint="点左侧任一步骤编辑其属性" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
