// overview.jsx — 项目总览页（项目卡片网格 + 最近接口表 + 快捷入口）
// 自注册：模块求值期入队 __postapiQueue，ensureGlobals 统一重放（注册表就绪顺序无关）
// 数据：api.storage.listProjects / getProject / createProject / renameProject / deleteProject
// 失败一律页面内显示错误文案（不弹窗）；api 缺失时渲染文件内 mock 并标注「示例数据」
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

  return (
    <div className="pp-scope pp-page" data-page="overview" ref={rootRef}>
      <h1 className="pp-page-title">项目总览</h1>
      <p className="pp-muted">
        {isMock
          ? '示例数据 — api.storage 未注入或不可用，以下为文件内 mock'
          : '数据来源：api.storage（listProjects / getProject）'}
      </p>
      {error ? <p className="pp-error-text">{error}</p> : null}
      {notice ? <p className="pp-muted">{notice}</p> : null}

      <h2 className="pp-card-title">项目</h2>
      <div className="pp-card" style={{ marginBottom: 'var(--sp-3)' }}>
        <div className="pp-form-row">
          <label className="pp-form-label">新建项目</label>
          <input className="pp-input" style={{ flex: 1 }} placeholder="项目名"
            value={newName} onChange={(e) => { setNewName(e.target.value); setNotice('') }} />
          <button className="pp-btn pp-btn-primary" onClick={createProject}>新建</button>
        </div>
        <div className="pp-form-row">
          <label className="pp-form-label">当前项目</label>
          <input className="pp-input pp-input-mono" style={{ flex: 1 }} readOnly value={currentId || '-'} />
          <input className="pp-input" style={{ flex: 1 }} placeholder="重命名"
            value={renameName} onChange={(e) => { setRenameName(e.target.value); setNotice('') }} />
          <button className="pp-btn" onClick={renameProject}>重命名</button>
        </div>
      </div>

      <div className="pp-overview-grid">
        {cards.map((p) => (
          <div key={p.id} className="pp-card">
            <div className="pp-card-title">{p.name}</div>
            <div className="pp-muted">
              {p.endpointCount === undefined ? '接口数未知' : p.endpointCount + ' 个接口'} · 更新于 {fmtTime(p.updatedAt)}
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
              <button className="pp-btn" onClick={() => openProject(p.id)}>打开</button>
              <button className="pp-btn" onClick={() => deleteProject(p.id)}>
                {pendingDelete === p.id ? '确认删除' : '删除'}
              </button>
            </div>
          </div>
        ))}
        {cards.length === 0 ? <div className="pp-empty">暂无项目，先在上方新建一个</div> : null}
      </div>

      <h2 className="pp-card-title" style={{ marginTop: 'var(--sp-6)' }}>最近接口</h2>
      <div className="pp-card">
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
              <tr key={e.id} onClick={() => { window.location.hash = '#/doc/' + encodeURIComponent(e.id) }}
                style={{ cursor: 'pointer' }}>
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

      <h2 className="pp-card-title" style={{ marginTop: 'var(--sp-6)' }}>快捷入口</h2>
      <div className="pp-card" style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
        {SHORTCUTS.map((s) => (
          <a key={s.hash} className="pp-btn" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }} href={s.hash}>
            {s.label}
          </a>
        ))}
      </div>
    </div>
  )
}