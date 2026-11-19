// overview.jsx — 项目总览页（Apifox 工作台：统计条 + 项目卡片网格 + 最近接口表 + 快捷入口）
// 自注册：模块求值期入队 __postapiQueue，ensureGlobals 统一重放（注册表就绪顺序无关）
// 数据：api.storage.listProjects / getProject / createProject / renameProject / deleteProject
// 失败一律页面内显示错误文案（不弹窗）；api 缺失时渲染文件内 mock 并标注「示例数据」
// 视觉基线：docs/apifox-design-spec.md —— .pp-stats / .pp-overview-grid / .pp-card-hover
import React, { useEffect, useRef, useState } from 'react'
import { applyTheme } from './theme.js'

;(window.__postapiQueue = window.__postapiQueue || []).push(['overview', OverviewPage]) // 注册表就绪前入队

// —— mock（契约 §2 project.json 结构子集）——
const MOCK_PROJECTS = [
  { id: 'proj_demo01', name: '订单中心', updatedAt: '2026-11-17T10:20:00.000Z' },
  { id: 'proj_demo02', name: '用户服务', updatedAt: '2026-11-16T18:40:00.000Z' },
]
const MOCK_PROJECT = {
  id: 'proj_demo01',
  name: '订单中心',
  environments: [{ id: 'env_dev', name: '开发环境' }, { id: 'env_prod', name: '生产环境' }],
  endpoints: [
    { id: 'ep_1001', name: '查询订单列表', method: 'GET', url: '/api/v1/orders', updatedAt: '2026-11-17T10:20:00.000Z' },
    { id: 'ep_1002', name: '创建订单', method: 'POST', url: '/api/v1/orders', updatedAt: '2026-11-17T09:05:00.000Z' },
    { id: 'ep_1003', name: '取消订单', method: 'DELETE', url: '/api/v1/orders/{orderId}', updatedAt: '2026-11-16T21:30:00.000Z' },
  ],
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

function errText(err) {
  return err && err.message ? err.message : String(err)
}

const SHORTCUTS = [
  { hash: '#/debug', label: '调试发送' },
  { hash: '#/doc', label: '接口文档' },
  { hash: '#/env', label: '环境与变量' },
  { hash: '#/test', label: '自动化测试' },
]

export function OverviewPage(props) {
  const rootRef = useRef(null)
  const api = (props && props.api) || (typeof window !== 'undefined' ? window.__postapiApi : undefined)
  const storage = api && api.storage
  const [projects, setProjects] = useState(MOCK_PROJECTS)
  const [project, setProject] = useState(MOCK_PROJECT)
  const [currentId, setCurrentId] = useState(MOCK_PROJECT.id)
  const [isMock, setIsMock] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [newName, setNewName] = useState('')
  const [renameName, setRenameName] = useState(MOCK_PROJECT.name)
  const [pendingDelete, setPendingDelete] = useState('')

  useEffect(() => applyTheme(rootRef.current), [])

  const refresh = async () => {
    if (!storage || typeof storage.listProjects !== 'function') {
      setIsMock(true)
      return
    }
    try {
      const list = await storage.listProjects()
      if (Array.isArray(list)) {
        setProjects(list)
        setIsMock(false)
        // 有真实项目时自动打开第一个：避免「重命名/删除」误作用到文件内 mock id。
        if (list.length > 0 && typeof storage.getProject === 'function') {
          const loaded = await storage.getProject(list[0].id)
          if (loaded) {
            setProject(loaded)
            setCurrentId(loaded.id || list[0].id)
            setRenameName(loaded.name || '')
          }
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
      await refresh()
    } catch (err) {
      setError('删除项目失败：' + errText(err))
    }
  }

  const recent = recentEndpoints(project)
  const cards = projectCards(projects)
  const stats = overviewStats(projects, project)

  return (
    <div className="pp-scope pp-page" data-page="overview" ref={rootRef}>
      <div className="pp-overview-head" style={{ margin: 'calc(var(--sp-5) * -1) calc(var(--sp-6) * -1) var(--sp-4)' }}>
        <span className="pp-overview-title">项目总览</span>
        <div className="pp-overview-actions">
          <input className="pp-input" style={{ width: '200px' }} placeholder="项目名"
            value={newName} onChange={(e) => { setNewName(e.target.value); setNotice('') }} />
          <button className="pp-btn pp-btn-primary" onClick={createProject}>新建</button>
          <input className="pp-input" style={{ width: '180px' }} placeholder="重命名"
            value={renameName} onChange={(e) => { setRenameName(e.target.value); setNotice('') }} />
          <button className="pp-btn" onClick={renameProject}>重命名</button>
        </div>
      </div>
      <p className="pp-muted">
        {isMock
          ? '示例数据 — api.storage 未注入或不可用，以下为文件内 mock'
          : '数据来源：api.storage（listProjects / getProject）'}
      </p>
      {error ? <p className="pp-error-text">{error}</p> : null}
      {notice ? <p className="pp-muted">{notice}</p> : null}

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

      <div className="pp-toolbar-inline" style={{ marginBottom: 'var(--sp-4)' }}>
        <span className="pp-meta">当前项目</span>
        <input className="pp-input pp-input-mono" style={{ width: '180px' }} readOnly value={currentId || '-'} />
      </div>

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
        {cards.length === 0 ? <div className="pp-empty">暂无项目，先在上方新建一个</div> : null}
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
              <tr><td colSpan={4} className="pp-muted">当前项目暂无接口</td></tr>
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
  )
}
