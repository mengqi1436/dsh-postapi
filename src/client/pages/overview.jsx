// overview.jsx — 项目总览（按 Apifox 2.8.55 async_project_overview 同构重建）
// 自注册：模块求值期入队 __postapiQueue，ensureGlobals 统一重放（注册表就绪顺序无关）
// 数据：api.storage.listProjects / getProject / createProject / renameProject / deleteProject
// 失败一律页面内显示错误文案（不弹窗）；api 缺失时渲染文件内 mock 并标注「示例数据」
//
// Apifox 结构（.research/apifox/app/dist/renderer/32636.00189f99.async.js 取证）：
//   .container-LUodZ0      → .pp-overview-content（沿用；侧栏主区窄，不再套 1200 上限）
//   .card-R2lvj9           → .pp-ov-summary（统计卡：标题「统计」+ 大数字 + 描述 + 统计网格）
//   .projectSummary__num   → .pp-ov-summary-num（24px / 34px 行高）
//   .statisticsContainer   → .pp-stats（沿用；起跳 minmax 96px，窄栏两列）
//   .container-FmdDnj      → .pp-ov-modules（计数条 + 左功能区 + 右动作栏）
//   .counts-Q2yB8W         → .pp-ov-counts（原 24/38/28% 固定比例在窄栏挤压，改 auto 分配 + 1px 竖线）
//   .functions-VkPW1t      → .pp-ov-functions（flex / gap 20 / margin-top 20）
//   .rightAction-CUSGuy    → .pp-ov-action（padding 8 / radius 8 / hover 换底）
//   .card-WoMhzt           → .pp-ov-card（功能卡：标题 + 说明 + 动作 + 右下角水印图标）
//
// 默认态纪律：没有任何项目时「当前项目」保持空，不预填 id / 名称，由用户自己新建或打开。
import React, { useEffect, useRef, useState } from 'react'
import { applyTheme } from './theme.js'
import { EmptyState } from './components/EmptyState.jsx'

;(window.__postapiQueue = window.__postapiQueue || []).push(['overview', OverviewPage]) // 注册表就绪前入队

// —— mock（契约 §2 project.json 结构子集）——
// 仅在 api.storage 缺失时用于渲染结构示例，且不参与任何写操作（currentId 恒为空）。
const MOCK_PROJECTS = [
  { id: 'proj_sample01', name: '示例项目 A', updatedAt: '2026-11-17T10:20:00.000Z' },
  { id: 'proj_sample02', name: '示例项目 B', updatedAt: '2026-11-16T18:40:00.000Z' },
]
const MOCK_PROJECT = {
  id: 'proj_sample01',
  name: '示例项目 A',
  environments: [{ id: 'env_dev', name: '开发环境' }, { id: 'env_prod', name: '生产环境' }],
  endpoints: [
    { id: 'ep_1001', name: '查询订单列表', method: 'GET', url: '/api/v1/orders', updatedAt: '2026-11-17T10:20:00.000Z' },
    { id: 'ep_1002', name: '创建订单', method: 'POST', url: '/api/v1/orders', updatedAt: '2026-11-17T09:05:00.000Z' },
    { id: 'ep_1003', name: '取消订单', method: 'DELETE', url: '/api/v1/orders/{orderId}', updatedAt: '2026-11-16T21:30:00.000Z' },
  ],
  schemas: [],
  testCases: [],
  testScenarios: [],
}

const RECENT_LIMIT = 5

/** 时间格式化为 yyyy-MM-dd HH:mm（无值回落 -）。 */
export function fmtTime(iso) {
  if (!iso) return '-'
  return String(iso).slice(0, 16).replace('T', ' ')
}

/** 项目卡片数据：补接口计数（project 详情缺失时为 undefined）。 */
export function projectCards(projects) {
  return (Array.isArray(projects) ? projects : []).map((p) => ({
    id: p.id,
    name: p.name || p.id,
    updatedAt: p.updatedAt || '',
    endpointCount: Array.isArray(p.endpoints) ? p.endpoints.length : p.endpointCount,
  }))
}

/** 最近接口：按 updatedAt 降序取前 limit 条（缺 updatedAt 的排在后面）。 */
export function recentEndpoints(project, limit = RECENT_LIMIT) {
  const list = Array.isArray(project && project.endpoints) ? project.endpoints.slice() : []
  list.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
  return list.slice(0, limit)
}

/** 顶部统计条四块：项目数 / 接口数 / 环境数 / 最近更新时间（取项目与接口的最晚时间）。 */
export function overviewStats(projects, project) {
  const list = Array.isArray(projects) ? projects : []
  const endpoints = Array.isArray(project && project.endpoints) ? project.endpoints : []
  const envs = Array.isArray(project && project.environments) ? project.environments : []
  let latest = ''
  for (const item of endpoints.concat(list)) {
    const at = item && item.updatedAt ? String(item.updatedAt) : ''
    if (at && at > latest) latest = at
  }
  return {
    projectCount: list.length,
    endpointCount: endpoints.length,
    envCount: envs.length,
    latestUpdated: latest,
  }
}

/**
 * 模块计数（Apifox .counts-Q2yB8W 三块：接口数 / 文档数 / 数据模型数）。
 * 文档数与接口数同源（一个接口一条文档），数据模型取 project.schemas。
 */
export function moduleCounts(project) {
  const endpoints = Array.isArray(project && project.endpoints) ? project.endpoints : []
  const schemas = Array.isArray(project && project.schemas) ? project.schemas : []
  return {
    endpointCount: endpoints.length,
    docsCount: endpoints.length,
    schemaCount: schemas.length,
  }
}

/**
 * 用例覆盖计数（Apifox .count3-i_jRC1：单接口用例 / 调试用例 / 场景用例）。
 * 三个数都是「当前项目对象里实际存在的条目数」，缺失即 0，不做估算。
 */
export function caseCounts(project) {
  const cases = Array.isArray(project && project.testCases) ? project.testCases : []
  const scenarios = Array.isArray(project && project.testScenarios) ? project.testScenarios : []
  return {
    caseCount: cases.length,
    scenarioCount: scenarios.length,
  }
}

function errText(err) {
  return err && err.message ? err.message : String(err)
}

const SHORTCUTS = [
  { hash: '#/debug', label: '调试发送' },
  { hash: '#/doc', label: '接口文档' },
  { hash: '#/env', label: '环境与变量' },
  { hash: '#/test', label: '自动化测试' },
]

/** Apifox 右栏动作（projectModule.action.*）：文档分享 / 站点发布 / 代码生成 / 导入 / 导出 / 更多设置。 */
const ACTIONS = [
  { key: 'shareDoc', label: '分享文档', hash: '#/doc' },
  { key: 'docSite', label: '发布文档站', hash: '#/doc' },
  { key: 'generateCode', label: '生成代码', hash: '#/import' },
  { key: 'import', label: '导入数据', hash: '#/import' },
  { key: 'export', label: '导出数据', hash: '#/import' },
  { key: 'more', label: '更多设置', hash: '#/settings' },
]

/** Apifox 功能卡（cardShareDoc / cardAutoImport / cardCodeGeneration 三张）。 */
const FEATURE_CARDS = [
  { key: 'share', title: '分享列表', info: '将接口文档以 URL 形式分享出去，方便外部团队在线查看', action: '新建分享', hash: '#/doc' },
  { key: 'autoImport', title: '自动导入', info: '自动将 OpenAPI（Swagger）或 apiDoc 格式的在线 URL 接口数据定时导入', action: '立即导入', hash: '#/import' },
  { key: 'codegen', title: '代码生成', info: '根据接口 / 模型定义，自动生成各语言与框架的业务代码', action: '立即生成', hash: '#/import' },
]

export function OverviewPage(props) {
  const rootRef = useRef(null)
  const api = (props && props.api) || (typeof window !== 'undefined' ? window.__postapiApi : undefined)
  const storage = api && api.storage
  // 默认态：项目列表为空、当前项目为空 —— 不预填任何 id / 名称（用户自行新建或打开）。
  const [projects, setProjects] = useState([])
  const [project, setProject] = useState(null)
  const [currentId, setCurrentId] = useState('')
  const [isMock, setIsMock] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [newName, setNewName] = useState('')
  const [renameName, setRenameName] = useState('')
  const [pendingDelete, setPendingDelete] = useState('')
  // 新建/重命名表单折叠态：页头只留一个「新建项目」按钮
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => { applyTheme(rootRef.current) }, [])

  const refresh = async () => {
    if (!storage || typeof storage.listProjects !== 'function') {
      // 无 api：用 mock 渲染结构示例，但当前项目仍保持空（mock id 不参与重命名/删除）。
      setIsMock(true)
      setProjects(MOCK_PROJECTS)
      setProject(MOCK_PROJECT)
      return
    }
    try {
      const list = await storage.listProjects()
      if (Array.isArray(list)) {
        setProjects(list)
        setIsMock(false)
        // 不自动打开任何项目：当前项目由用户点击「打开」决定（避免默认值误导与误操作）。
        if (list.length === 0) {
          setProject(null)
          setCurrentId('')
          setRenameName('')
        }
      }
    } catch (err) {
      setError('加载项目列表失败：' + errText(err))
    }
  }

  useEffect(() => { refresh() }, [])

  const openProject = async (projectId) => {
    if (!storage || typeof storage.getProject !== 'function') {
      setError('当前桥未提供 api.storage.getProject')
      return
    }
    setError('')
    try {
      const loaded = await storage.getProject(projectId)
      if (loaded) {
        setProject(loaded)
        setCurrentId(loaded.id || projectId)
        setRenameName(loaded.name || '')
        setNotice('已打开：' + (loaded.name || loaded.id || projectId))
      } else {
        setError('项目不存在：' + projectId)
      }
    } catch (err) {
      setError('打开项目失败：' + errText(err))
    }
  }

  const createProject = async () => {
    if (!storage || typeof storage.createProject !== 'function') {
      setError('当前桥未提供 api.storage.createProject')
      return
    }
    const name = String(newName || '').trim()
    if (!name) {
      setError('项目名不能为空')
      return
    }
    setError('')
    try {
      const created = await storage.createProject(name)
      setNewName('')
      setNotice('已创建：' + (created && created.name ? created.name : name))
      await refresh()
      if (created && created.id) await openProject(created.id)
    } catch (err) {
      setError('创建项目失败：' + errText(err))
    }
  }

  const renameProject = async () => {
    if (!storage || typeof storage.renameProject !== 'function') {
      setError('当前桥未提供 api.storage.renameProject')
      return
    }
    const name = String(renameName || '').trim()
    if (!name) {
      setError('新项目名不能为空')
      return
    }
    if (!currentId) {
      setError('请先打开一个项目再重命名')
      return
    }
    setError('')
    try {
      await storage.renameProject(currentId, name)
      setNotice('已重命名：' + name)
      await refresh()
    } catch (err) {
      setError('重命名失败：' + errText(err))
    }
  }

  // 两段式删除：第一次点标记待确认，第二次点执行（不使用弹窗确认）
  const deleteProject = async (projectId) => {
    if (pendingDelete !== projectId) {
      setPendingDelete(projectId)
      setNotice('再次点击「删除」确认删除项目 ' + projectId)
      return
    }
    if (!projectId) {
      setError('项目 id 为空，无法删除')
      return
    }
    if (!storage || typeof storage.deleteProject !== 'function') {
      setError('当前桥未提供 api.storage.deleteProject')
      return
    }
    setError('')
    setPendingDelete('')
    try {
      await storage.deleteProject(projectId)
      setNotice('已删除：' + projectId)
      if (projectId === currentId) {
        setProject(null)
        setCurrentId('')
        setRenameName('')
      }
      await refresh()
    } catch (err) {
      setError('删除项目失败：' + errText(err))
    }
  }

  const recent = recentEndpoints(project)
  const cards = projectCards(projects)
  const stats = overviewStats(projects, project)
  const modules = moduleCounts(project)
  const cases = caseCounts(project)
  const hasCurrent = Boolean(currentId)

  return (
    <div className="pp-scope pp-page" data-page="overview" ref={rootRef}>
      {/* 页头：标题 + 主动作（Apifox .overview-header-container） */}
      <div className="pp-overview-head">
        <span className="pp-overview-title">项目总览</span>
        <div className="pp-overview-actions">
          <button className="pp-btn pp-btn-primary" onClick={() => setFormOpen((v) => !v)}>
            {formOpen ? '取消' : '新建项目'}
          </button>
        </div>
      </div>
      <div className="pp-overview-content">
        <p className="pp-muted">
          {isMock
            ? '示例数据 — api.storage 未注入或不可用，以下为文件内 mock'
            : '数据来源：api.storage（listProjects / getProject）'}
        </p>
        {error ? <p className="pp-error-text">{error}</p> : null}
        {notice ? <p className="pp-muted">{notice}</p> : null}

        {/* Apifox .card-R2lvj9「统计」卡：大数字 + 描述 + 四块统计 */}
        <section className="pp-card pp-ov-summary">
          <div className="pp-card-title">统计</div>
          <div className="pp-ov-summary-num">{stats.endpointCount}</div>
          <p className="pp-ov-summary-desc">
            接口总数 · 项目 {stats.projectCount} 个 · 环境 {stats.envCount} 个
          </p>
          <div className="pp-stats">
            <div className="pp-stat">
              <span className="pp-stat-value">{stats.projectCount}</span>
              <span className="pp-stat-label">项目数</span>
            </div>
            <div className="pp-stat">
              <span className="pp-stat-value">{stats.endpointCount}</span>
              <span className="pp-stat-label">接口数</span>
            </div>
            <div className="pp-stat">
              <span className="pp-stat-value">{stats.envCount}</span>
              <span className="pp-stat-label">环境数</span>
            </div>
            <div className="pp-stat">
              <span className="pp-stat-value">{fmtTime(stats.latestUpdated)}</span>
              <span className="pp-stat-label">最近更新</span>
            </div>
          </div>
        </section>

        {/* Apifox .container-FmdDnj 模块卡：计数条 + 左功能区 + 右动作栏 */}
        <section className="pp-card pp-ov-modules">
          <div className="pp-ov-counts">
            <div className="pp-ov-count">
              <span className="pp-ov-count-num">{modules.endpointCount}</span>
              <span className="pp-ov-count-label">接口数</span>
            </div>
            <span className="pp-ov-divider" />
            <div className="pp-ov-count">
              <span className="pp-ov-count-num">{modules.docsCount}</span>
              <span className="pp-ov-count-label">文档数</span>
            </div>
            <span className="pp-ov-divider" />
            <div className="pp-ov-count">
              <span className="pp-ov-count-num">{modules.schemaCount}</span>
              <span className="pp-ov-count-label">数据模型数</span>
            </div>
            <span className="pp-ov-divider" />
            <div className="pp-ov-count">
              <span className="pp-ov-count-num">{cases.caseCount}</span>
              <span className="pp-ov-count-label">单接口用例数</span>
            </div>
            <span className="pp-ov-divider" />
            <div className="pp-ov-count">
              <span className="pp-ov-count-num">{cases.scenarioCount}</span>
              <span className="pp-ov-count-label">场景用例数</span>
            </div>
          </div>

          <div className="pp-ov-functions">
            <div className="pp-ov-left">
              {/* 当前项目：默认空 —— 不预填任何 id / 名称，由用户在下拉里自行选择或新建 */}
              <div className="pp-ov-current">
                <label className="pp-form-label">当前项目</label>
                <select
                  className="pp-select pp-ov-current-value"
                  value={currentId}
                  onChange={(e) => { const v = e.target.value; if (v) openProject(v) }}
                >
                  <option value="">{projects.length ? '请选择项目' : '暂无项目'}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name || p.id}</option>
                  ))}
                </select>
                {hasCurrent ? null : (
                  <span className="pp-meta">尚未选择项目：在下拉里选一个，或先新建项目</span>
                )}
              </div>

              {/* 新建 / 重命名：名称输入默认留空，由用户自行填写 */}
              {formOpen ? (
                <div className="pp-card pp-ov-form">
                  <div className="pp-card-title">新建 / 重命名项目</div>
                  <div className="pp-form-grid">
                    <label className="pp-form-label">新建项目</label>
                    <div className="pp-toolbar-inline">
                      <input className="pp-input" placeholder="项目名"
                        value={newName} onChange={(e) => { setNewName(e.target.value); setNotice('') }} />
                      <button className="pp-btn pp-btn-primary" onClick={createProject}>新建</button>
                    </div>
                    <label className="pp-form-label">重命名当前项目</label>
                    <div className="pp-toolbar-inline">
                      <input className="pp-input" placeholder="新名称"
                        value={renameName} onChange={(e) => { setRenameName(e.target.value); setNotice('') }} />
                      <button className="pp-btn" disabled={!hasCurrent} onClick={renameProject}>重命名</button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pp-ov-right">
              {ACTIONS.map((a) => (
                <a key={a.key} className="pp-ov-action" href={a.hash}>{a.label}</a>
              ))}
            </div>
          </div>
        </section>

        {/* Apifox 功能卡三张（card-WoMhzt 同构） */}
        <div className="pp-ov-cards">
          {FEATURE_CARDS.map((c) => (
            <div key={c.key} className="pp-card pp-ov-card">
              <div className="pp-ov-card-title">{c.title}</div>
              <p className="pp-ov-card-info">{c.info}</p>
              <a className="pp-btn pp-btn-sm" href={c.hash}>{c.action}</a>
            </div>
          ))}
        </div>

        {/* 项目列表：Apifox 项目卡片网格 */}
        <div className="pp-overview-grid">
          {cards.map((p) => (
            <div key={p.id} className="pp-card pp-card-hover" data-active={currentId === p.id ? 'true' : 'false'}>
              <div className="pp-card-title pp-ellipsis">{p.name}</div>
              <div className="pp-meta">
                {p.endpointCount === undefined ? '接口数未知' : p.endpointCount + ' 个接口'} · 更新于 {fmtTime(p.updatedAt)}
              </div>
              <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-3)' }}>
                <button className="pp-btn" onClick={() => openProject(p.id)}>打开</button>
                <button className="pp-btn pp-btn-danger" onClick={() => deleteProject(p.id)}>
                  {pendingDelete === p.id ? '确认删除' : '删除'}
                </button>
              </div>
            </div>
          ))}
          {cards.length === 0 ? <EmptyState text="暂无项目" hint="先在上方新建一个项目" /> : null}
        </div>

        <div className="pp-card" style={{ marginTop: 'var(--sp-5)' }}>
          <div className="pp-card-title">最近接口</div>
          <div className="pp-table-wrap">
          <table className="pp-table">
            <thead>
              <tr>
                <th style={{ width: '90px' }}>方法</th>
                <th>名称</th>
                <th>URL</th>
                <th style={{ width: '150px' }}>更新时间</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((e) => (
                <tr key={e.id} onClick={() => { window.location.hash = '#/doc/' + encodeURIComponent(e.id) }}>
                  <td><span className="pp-method" data-method={e.method}>{e.method}</span></td>
                  <td>{e.name || '-'}</td>
                  <td className="pp-table-mono pp-muted">{e.url || '-'}</td>
                  <td className="pp-muted">{fmtTime(e.updatedAt)}</td>
                </tr>
              ))}
              {recent.length === 0 ? (
                <tr><td colSpan={4} className="pp-muted">{hasCurrent ? '当前项目暂无接口' : '尚未选择项目'}</td></tr>
              ) : null}
            </tbody>
          </table>
          </div>
        </div>

        <div className="pp-toolbar" style={{ marginTop: 'var(--sp-5)' }}>
          <span className="pp-card-title" style={{ margin: 0 }}>快捷入口</span>
          <span className="pp-toolbar-spacer" />
          {SHORTCUTS.map((s) => (
            <a key={s.hash} className="pp-btn" href={s.hash}>{s.label}</a>
          ))}
        </div>

      </div>
    </div>
  )
}
