// search.jsx — 全局搜索页（Apifox 工作台：搜索框 + 分组结果列表）
// 自注册：模块求值期入队 __postapiQueue
// 数据：api.storage.listProjects / search(projectId, keyword) -> { endpoints, schemas, folders }
// 视觉基线：docs/apifox-design-spec.md —— .pp-input / .pp-tree-group / .pp-list-row
import React, { useEffect, useRef, useState } from 'react'
import { applyTheme } from './theme.js'
import { EmptyState } from './components/EmptyState.jsx'

;(window.__postapiQueue = window.__postapiQueue || []).push(['search', SearchPage]) // 注册表就绪前入队

const MOCK_RESULT = {
  endpoints: [{ id: 'ep_1001', name: '查询订单列表', method: 'GET', url: '/api/v1/orders' }],
  schemas: [{ id: 'sch_order', name: 'Order', description: '订单对象' }],
  folders: [{ id: 'fld_01', name: '订单管理' }],
}

const GROUPS = [
  { key: 'endpoints', label: '接口', target: (id) => '#/doc/' + encodeURIComponent(id) },
  { key: 'schemas', label: '数据模型', target: (id) => '#/schema/' + encodeURIComponent(id) },
  { key: 'folders', label: '目录', target: (id) => '#/doc/' + encodeURIComponent(id) },
]

/** 结果分组：保证三组键都在，非数组一律归一为空数组。 */
export function groupResults(res) {
  const data = res && res.data !== undefined ? res.data : res
  const out = {}
  for (const g of GROUPS) {
    const list = data && Array.isArray(data[g.key]) ? data[g.key] : []
    out[g.key] = list.map((item) => ({
      id: item && item.id ? item.id : '',
      title: (item && (item.name || item.url)) || (item && item.id) || '(未命名)',
      method: item && item.method ? item.method : '',
      url: item && item.url ? item.url : '',
      description: item && item.description ? item.description : '',
    }))
  }
  return out
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
  const [projects, setProjects] = useState([{ id: 'proj_demo01', name: '订单中心' }])
  const [projectId, setProjectId] = useState('proj_demo01')
  const [keyword, setKeyword] = useState(() => readQueryKeyword(route.query))
  const [groups, setGroups] = useState(groupResults(MOCK_RESULT))
  const [isMock, setIsMock] = useState(true)
  const [searched, setSearched] = useState(false)
  const [collapsed, setCollapsed] = useState({})
  const [error, setError] = useState('')

  useEffect(() => applyTheme(rootRef.current), [])

  useEffect(() => {
    const boot = async () => {
      if (!storage || typeof storage.listProjects !== 'function') return
      try {
        const list = await storage.listProjects()
        if (Array.isArray(list) && list.length > 0) {
          setProjects(list)
          setProjectId(list[0].id)
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
      setError('当前桥未提供 api.storage.search')
      return
    }
    setError('')
    try {
      const res = await storage.search(projectId, String(keyword).trim())
      setGroups(groupResults(res))
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
        {/* 搜索条：项目 + 输入框 + 按钮挤在一行，回车即搜。
            原来「搜索」按钮在页头、输入框在下方卡片里，一次搜索要跨两个区域移动视线。 */}
        <div className="pp-search-bar">
          <select className="pp-select pp-search-project" value={projectId}
            onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
          </select>
          <input className="pp-input pp-search-input" placeholder="搜索接口名称 / URL / 描述，回车即搜"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') runSearch() }} />
          <button className="pp-btn pp-btn-primary pp-search-btn" onClick={runSearch}>搜索</button>
        </div>
        <div className="pp-toolbar">
          <span className="pp-meta">
            {isMock ? '示例数据 — api.storage.search 不可用，以下为文件内 mock' : '数据来源：api.storage.search（名称 / url / 描述，大小写不敏感）'}
          </span>
        </div>
        {error ? <p className="pp-error-text">{error}</p> : null}

        {!searched ? (
          <div className="pp-search-hint">
            <EmptyState text="输入关键字开始搜索" hint="可搜接口名称、URL、描述，也可搜数据模型与目录" />
          </div>
        ) : total === 0 ? (
          <div className="pp-search-hint">
            <EmptyState text={'没有匹配「' + kw + '」的结果'} hint="换个关键字，或检查是否选错了项目" />
          </div>
        ) : (
          <div className="pp-search-results">
            {visibleGroups.map((g) => (
              <section key={g.key} className="pp-search-group">
                <button className="pp-search-group-head" data-collapsed={collapsed[g.key] ? 'true' : 'false'}
                  onClick={() => setCollapsed({ ...collapsed, [g.key]: !collapsed[g.key] })}>
                  <span className="pp-search-caret">{collapsed[g.key] ? '▸' : '▾'}</span>
                  <span className="pp-search-group-label">{g.label}</span>
                  <span className="pp-search-count">{groups[g.key].length}</span>
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
