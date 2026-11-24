// search.jsx — 全局搜索页（对齐 Apifox 2.8.55 全局搜索：搜索条 + 分组结果列表，命中片段高亮）
// 自注册：模块求值期入队 __postapiQueue
// 数据：api.storage.listProjects / getProject / search(projectId, keyword) -> { endpoints, schemas, folders }
//      环境组取 getProject 的 environments（契约 §3 search 只返回三类，环境在本地按名称过滤）
// 视觉基线：docs/apifox-visual-parity-spec.md —— .pp-search-bar / .pp-search-group / .pp-list-row / .pp-input
import React, { useEffect, useRef, useState } from 'react'
import { applyTheme } from './theme.js'
import { EmptyState } from './components/EmptyState.jsx'

;(window.__postapiQueue = window.__postapiQueue || []).push(['search', SearchPage]) // 注册表就绪前入队

// 文件内 mock：仅在 api.storage 缺失时渲染结构示例
const MOCK_RESULT = {
  endpoints: [{ id: 'ep_sample01', name: '查询订单列表', method: 'GET', url: '/api/v1/orders' }],
  schemas: [{ id: 'sch_sample_order', name: 'Order', description: '订单对象' }],
  folders: [{ id: 'fld_sample01', name: '订单管理' }],
  environments: [{ id: 'env_sample_dev', name: '开发环境', baseUrl: 'http://127.0.0.1:8080' }],
}

const GROUPS = [
  { key: 'endpoints', label: '接口', target: (id) => '#/doc/' + encodeURIComponent(id) },
  { key: 'schemas', label: '数据模型', target: (id) => '#/schema/' + encodeURIComponent(id) },
  { key: 'folders', label: '目录', target: (id) => '#/doc/' + encodeURIComponent(id) },
  { key: 'environments', label: '环境', target: () => '#/env' },
]

/** 结果分组：保证四组键都在，非数组一律归一为空数组。 */
export function groupResults(res) {
  const data = res && res.data !== undefined ? res.data : res
  const out = {}
  for (const g of GROUPS) {
    const list = data && Array.isArray(data[g.key]) ? data[g.key] : []
    out[g.key] = list
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        id: item.id ? item.id : '',
        title: item.name || item.url || item.id || '(未命名)',
        method: item.method ? item.method : '',
        url: item.url || item.baseUrl || '',
        description: item.description || '',
      }))
  }
  return out
}

/** 环境组本地过滤：契约 §3 search 不返回环境，按名称 / baseUrl 命中。 */
export function matchEnvironments(envs, keyword) {
  const kw = String(keyword || '').trim().toLowerCase()
  if (!kw) return []
  return (Array.isArray(envs) ? envs : [])
    .filter((e) => e && typeof e === 'object')
    .filter((e) => String(e.name || '').toLowerCase().includes(kw) || String(e.baseUrl || '').toLowerCase().includes(kw))
    .map((e) => ({ id: e.id || '', name: e.name || e.id, baseUrl: e.baseUrl || '' }))
}

/** 关键字非空判断（去首尾空白）。 */
export function hasKeyword(keyword) {
  return String(keyword || '').trim().length > 0
}

function errText(err) {
  return err && err.message ? err.message : String(err)
}

/** 把 highlight() 的三段拼成 JSX（命中段套 <mark>）。 */
function markParts(text, keyword) {
  const h = highlight(text, keyword)
  if (!h.hit) return h.before
  return [h.before, <mark key="hit" className="pp-search-mark">{h.hit}</mark>, h.after]
}

/**
 * 关键字高亮：把命中的片段包进 <mark>（大小写不敏感，取第一处）。
 * 搜索页最关键的信息是「为什么这条命中」，不高亮就得逐字比对。
 */
export function highlight(text, keyword) {
  const raw = String(text || '')
  const kw = String(keyword || '').trim()
  if (!kw) return { before: raw, hit: '', after: '' }
  const at = raw.toLowerCase().indexOf(kw.toLowerCase())
  if (at < 0) return { before: raw, hit: '', after: '' }
  return {
    before: raw.slice(0, at),
    hit: raw.slice(at, at + kw.length),
    after: raw.slice(at + kw.length),
  }
}

function readQueryKeyword(query) {
  const raw = String(query || '')
  const at = raw.indexOf('q=')
  if (at < 0) return ''
  const value = raw.slice(at + 2).split('&')[0]
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function SearchPage(props) {
  const rootRef = useRef(null)
  const api = (props && props.api) || (typeof window !== 'undefined' ? window.__postapiApi : undefined)
  const storage = api && api.storage
  const route = (props && props.route) || {}
  // 默认态：项目列表为空、当前项目为空（用户选）；关键字取自 route.query 的 q=
  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  const [keyword, setKeyword] = useState(() => readQueryKeyword(route.query))
  const [groups, setGroups] = useState({ endpoints: [], schemas: [], folders: [], environments: [] })
  const [isMock, setIsMock] = useState(true)
  const [searched, setSearched] = useState(false)
  const [collapsed, setCollapsed] = useState({})
  const [error, setError] = useState('')

  useEffect(() => { applyTheme(rootRef.current) }, [])

  const applyMock = () => {
    setIsMock(true)
    setProjects([{ id: 'search_sample_project', name: '示例项目' }])
  }

  useEffect(() => {
    const boot = async () => {
      if (!storage || typeof storage.listProjects !== 'function') { applyMock(); return }
      try {
        const list = await storage.listProjects()
        if (Array.isArray(list) && list.length > 0) {
          setProjects(list)
          setProjectId(list[0].id)
          setIsMock(false)
        } else {
          setIsMock(false)
        }
      } catch (err) {
        setError('加载项目列表失败：' + errText(err))
      }
    }
    boot()
  }, [])

  const runSearch = async () => {
    if (!hasKeyword(keyword)) {
      setError('请输入关键字')
      return
    }
    if (!storage || typeof storage.search !== 'function') {
      // 无桥：用文件内 mock 走一遍分组渲染，标注示例数据
      applyMock()
      setGroups(groupResults(MOCK_RESULT))
      setSearched(true)
      setError('当前桥未提供 api.storage.search，以下为文件内 mock 结果')
      return
    }
    setError('')
    try {
      const kw = String(keyword).trim()
      const res = await storage.search(projectId, kw)
      const next = groupResults(res)
      // 环境组：search 不返回环境，按 getProject 的 environments 本地过滤
      if (typeof storage.getProject === 'function' && projectId) {
        const loaded = await storage.getProject(projectId)
        next.environments = groupResults({ environments: matchEnvironments(loaded && loaded.environments, kw) }).environments
      }
      setGroups(next)
      setSearched(true)
    } catch (err) {
      setError('搜索失败：' + errText(err))
    }
  }

  const jump = (hash) => {
    window.location.hash = hash
  }

  const total = GROUPS.reduce((n, g) => n + groups[g.key].length, 0)
  const visibleGroups = GROUPS.filter((g) => groups[g.key].length > 0)
  const kw = String(keyword || '').trim()

  return (
    <div className="pp-scope pp-page" data-page="search" ref={rootRef}>
      <div className="pp-overview-head">
        <span className="pp-overview-title">全局搜索</span>
        <div className="pp-overview-actions">
          <span className="pp-meta pp-search-summary">
            {searched ? '命中 ' + total + ' 条 · ' + visibleGroups.length + ' 个分组' : '尚未搜索'}
          </span>
        </div>
      </div>
      <div className="pp-overview-content">
        {/* 搜索条：项目 + 输入框 + 按钮同一行，回车即搜 */}
        <div className="pp-search-bar">
          <select className="pp-select pp-search-project" value={projectId}
            onChange={(e) => setProjectId(e.target.value)}>
            <option value="">{projects.length ? '请选择项目' : '暂无项目'}</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
          </select>
          <input className="pp-input pp-search-input" placeholder="搜索接口名称 / URL / 描述 / 模型 / 目录 / 环境，回车即搜"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') runSearch() }} />
          <button className="pp-btn pp-btn-primary pp-search-btn" onClick={runSearch}>搜索</button>
        </div>
        <div className="pp-meta pp-search-source">
          {isMock
            ? '示例数据 — api.storage.search 不可用，以下为文件内 mock'
            : '数据来源：api.storage.search（名称 / url / 描述，大小写不敏感）+ getProject.environments（环境组本地过滤）'}
        </div>
        {error ? <div className="pp-note pp-note-bad">{error}</div> : null}

        {!searched ? (
          <div className="pp-search-hint">
            <EmptyState text="输入关键字开始搜索" hint="可搜接口名称、URL、描述，也可搜数据模型、目录与环境" icon="search" />
          </div>
        ) : total === 0 ? (
          <div className="pp-search-hint">
            <EmptyState text={'没有匹配「' + kw + '」的结果'} hint="换个关键字，或检查是否选错了项目" icon="search" />
          </div>
        ) : (
          <div className="pp-search-results">
            {visibleGroups.map((g) => (
              <section key={g.key} className="pp-search-group">
                <button className="pp-search-group-head" data-collapsed={collapsed[g.key] ? 'true' : 'false'}
                  onClick={() => setCollapsed({ ...collapsed, [g.key]: !collapsed[g.key] })}>
                  <span className="pp-search-caret">{collapsed[g.key] ? '▸' : '▾'}</span>
                  <span className="pp-tree-group">{g.label}</span>
                  <span className="pp-search-count">{groups[g.key].length}</span>
                  <span className="pp-toolbar-spacer" />
                  <span className="pp-meta">命中 {groups[g.key].length} 条</span>
                </button>
                {collapsed[g.key] ? null : (
                  <div className="pp-list pp-search-list">
                    {groups[g.key].map((item) => (
                      <div key={g.key + '-' + item.id} className="pp-list-row pp-search-row"
                        onClick={() => jump(g.target(item.id))}>
                        {item.method
                          ? <span className="pp-method" data-method={item.method}>{item.method}</span>
                          : <span className="pp-search-dot" />}
                        <span className="pp-ellipsis pp-search-name">{markParts(item.title, kw)}</span>
                        <span className="pp-meta pp-ellipsis pp-search-sub">
                          {item.url || item.description || ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
