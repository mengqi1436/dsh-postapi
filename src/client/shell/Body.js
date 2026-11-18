/**
 * PostAPI 页签 body（sidebar.right.pane.tab 席位）：Apifox 工作台骨架。
 *
 * 三段式（docs/apifox-design-spec.md §3）：
 *   顶栏 .pp-topbar —— 当前页标题 / 全局搜索 / 新建接口 / 环境 / 主题 / 设置
 *   ├ 左树 .pp-col-left —— 12 条路由竖排（.pp-tree-row，激活 data-active）
 *   ├ 主区 .pp-main     —— 页面渲染区（组件取自 window.__postapiPages）
 *   └ 右栏 .pp-col-right —— 当前页面说明 + 快捷入口（无内容时 .pp-empty）
 * 「调试」「Mock」两页不设右栏，容器切 .pp-body-2col。
 *
 * 路由形态：#/overview、#/doc/:endpointId、#/debug、#/flow、#/settings…（契约 §3）。
 * 颜色 / 字号 / 尺寸一律引用 design-tokens.css 的 var(--*) token，内联 style 只写 layout。
 */
import { useEffect, useState } from 'react'
import { zh } from './locales.js'
import { pageRegistry } from './registry.js'

/** 主题与环境的本地设置键（与 pages/theme.js 共用同一套键，切页不丢）。 */
const THEME_KEY = 'postapi.settings.theme'
const ENV_KEY = 'postapi.settings.env'

/** 12 条路由（左树顺序 = 契约 §3 页面清单）。 */
export const ROUTES = [
  { name: 'overview', hash: '#/overview', labelKey: 'nav.overview' },
  { name: 'doc', hash: '#/doc', labelKey: 'nav.doc' },
  { name: 'debug', hash: '#/debug', labelKey: 'nav.debug' },
  { name: 'mock', hash: '#/mock', labelKey: 'nav.mock' },
  { name: 'schema', hash: '#/schema', labelKey: 'nav.schema' },
  { name: 'env', hash: '#/env', labelKey: 'nav.env' },
  { name: 'history', hash: '#/history', labelKey: 'nav.history' },
  { name: 'test', hash: '#/test', labelKey: 'nav.test' },
  { name: 'import', hash: '#/import', labelKey: 'nav.import' },
  { name: 'flow', hash: '#/flow', labelKey: 'nav.flow' },
  { name: 'search', hash: '#/search', labelKey: 'nav.search' },
  { name: 'settings', hash: '#/settings', labelKey: 'nav.settings' },
]

/** 带参数的路由（hash 形态 #/name/:arg）。 */
export const PARAM_ROUTES = ['doc', 'schema']

/** 两段式（无右栏）的页面。 */
export const TWO_COL_ROUTES = ['debug', 'mock']

/** 右栏快捷入口（固定四条，文案复用 nav.* 键）。 */
export const SHORTCUTS = [
  { name: 'debug', hash: '#/debug', labelKey: 'nav.debug' },
  { name: 'doc', hash: '#/doc', labelKey: 'nav.doc' },
  { name: 'test', hash: '#/test', labelKey: 'nav.test' },
  { name: 'settings', hash: '#/settings', labelKey: 'nav.settings' },
]

/**
 * 解析 hash 为 { name, arg, query }；未知路由回落 overview。
 * @param raw - 可选的 hash 原文（缺省读 location.hash，便于单测）。
 */
export function parseHash(raw) {
  const source = raw === undefined ? (typeof location !== 'undefined' ? location.hash : '') : raw
  const clean = String(source || '#/overview').replace(/^#\/?/, '')
  const qAt = clean.indexOf('?')
  const pathPart = qAt >= 0 ? clean.slice(0, qAt) : clean
  const query = qAt >= 0 ? clean.slice(qAt + 1) : ''
  const [first, ...rest] = pathPart.split('/')
  if (PARAM_ROUTES.indexOf(first) >= 0) {
    return { name: first, arg: rest.length ? decodeURIComponent(rest.join('/')) : '', query }
  }
  if (ROUTES.some((r) => r.name === first)) return { name: first, arg: '', query }
  return { name: 'overview', arg: '', query }
}

/** 路由跳转目标：参数路由带上当前 arg（#/doc/:id），其余取静态 hash。 */
export function routeHref(item, route) {
  if (PARAM_ROUTES.indexOf(item.name) >= 0 && route && route.arg) {
    return item.hash + '/' + encodeURIComponent(route.arg)
  }
  return item.hash
}

/** 搜索跳转 hash：#/search?q=<keyword>（空关键字返回 #/search）。 */
export function searchHash(keyword) {
  const q = String(keyword === undefined || keyword === null ? '' : keyword).trim()
  return q === '' ? '#/search' : '#/search?q=' + encodeURIComponent(q)
}

/** 读本地设置（隐私模式下回落默认值，不抛错）。 */
export function readSetting(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback
    const value = localStorage.getItem(key)
    return value === null || value === undefined || value === '' ? fallback : value
  } catch {
    return fallback
  }
}

/** 写本地设置（隐私模式下静默忽略）。 */
export function writeSetting(key, value) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value)
  } catch { /* 忽略隐私模式 */ }
}

/** 主题取反：light <-> dark。 */
export function nextTheme(theme) {
  return theme === 'dark' ? 'light' : 'dark'
}

/**
 * 主题同步：把 data-theme 写到所有 .pp-scope 根（骨架自身 + 已挂载页面根）。
 * 页面根自带 data-theme（applyTheme 只在挂载时写一次），顶栏切主题后需一并刷新。
 */
export function syncTheme(theme) {
  if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return
  const nodes = document.querySelectorAll('.pp-scope')
  for (const el of nodes) {
    if (el && typeof el.setAttribute === 'function') el.setAttribute('data-theme', theme)
  }
}

/** hashchange 订阅式路由 hook。 */
function useHashRoute() {
  const [route, setRoute] = useState(() => parseHash())
  useEffect(() => {
    const onChange = () => setRoute(parseHash())
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('hashchange', onChange)
      return () => window.removeEventListener('hashchange', onChange)
    }
    return undefined
  }, [])
  return route
}

/** 页面未注册时的占位（.pp-empty，文案走字典）。 */
function Placeholder({ route }) {
  const title = zh['placeholder.title'] + ': ' + route.name + (route.arg ? '/' + route.arg : '')
  return (
    <div className="pp-page">
      <div className="pp-empty">
        <div className="pp-card-title">{title}</div>
        <div>{zh['placeholder.body']}</div>
        <div className="pp-meta">{zh['placeholder.hint']}</div>
      </div>
    </div>
  )
}

/** 右栏：当前页面说明 + 快捷入口；无说明文案时给 .pp-empty。 */
function ContextAside({ route }) {
  const about = zh['aside.page.' + route.name]
  return (
    <aside className="pp-col pp-col-right pp-toc" aria-label={zh['aside.about']}>
      <div className="pp-tree-group">{zh['aside.about']}</div>
      {about ? <p className="pp-muted">{about}</p> : <div className="pp-empty">{zh['aside.noContext']}</div>}
      <div className="pp-tree-group">{zh['aside.shortcuts']}</div>
      {SHORTCUTS.map((item) => (
        <a key={item.name} className="pp-toc-item" href={item.hash}>{zh[item.labelKey]}</a>
      ))}
    </aside>
  )
}

/**
 * 页签 body 组件。props 来自 slots runtime：useTabInfo + 注入的 locale t（若有）。
 * 页签渲染的是整个 PostAPI 工作台：顶栏 + 左树导航 + 页面区 + 右上下文栏。
 */
export function PostApiBody({ useTabInfo }) {
  const route = useHashRoute()
  const [theme, setTheme] = useState(() => readSetting(THEME_KEY, 'light'))
  const [env, setEnv] = useState(() => readSetting(ENV_KEY, ''))
  const [keyword, setKeyword] = useState('')
  // 页面组件每次渲染查注册表：页面可能在 body 已挂载后才自注册。
  const Page = pageRegistry.get(route.name)
  const active = ROUTES.find((r) => r.name === route.name) || ROUTES[0]
  const twoCol = TWO_COL_ROUTES.indexOf(route.name) >= 0
  const api = typeof window !== 'undefined' ? window.__postapiApi : undefined

  const toggleTheme = () => {
    const next = nextTheme(theme)
    writeSetting(THEME_KEY, next)
    syncTheme(next)
    setTheme(next)
  }
  const pickEnv = (event) => {
    const value = event && event.target ? event.target.value : ''
    writeSetting(ENV_KEY, value)
    setEnv(value)
  }
  const goto = (hash) => {
    if (typeof location !== 'undefined') location.hash = hash
  }
  const onSearchKey = (event) => {
    if (!event || event.key !== 'Enter') return
    const q = String(keyword === undefined || keyword === null ? '' : keyword).trim()
    if (q === '') return
    goto(searchHash(q))
  }

  return (
    <div className="pp-scope pp-workbench" data-theme={theme} data-route={route.name}>
      <header className="pp-topbar">
        <span className="pp-topbar-title">{zh[active.labelKey]}</span>
        <span className="pp-topbar-spacer" />
        <input
          className="pp-input pp-input-sm"
          type="search"
          value={keyword}
          placeholder={zh['topbar.searchPlaceholder']}
          aria-label={zh['topbar.search']}
          style={{ width: 'var(--nav-w)' }}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={onSearchKey}
        />
        <button className="pp-btn pp-btn-sm pp-btn-primary" type="button"
          onClick={() => goto('#/doc')}>{zh['topbar.newEndpoint']}</button>
        <select className="pp-select" value={env} onChange={pickEnv}
          title={zh['topbar.env']} aria-label={zh['topbar.env']}>
          <option value="">{zh['topbar.envDefault']}</option>
        </select>
        <button className="pp-btn pp-btn-sm pp-btn-ghost" type="button"
          onClick={toggleTheme} title={zh['topbar.themeHint']}>
          {theme === 'dark' ? zh['topbar.themeLight'] : zh['topbar.themeDark']}
        </button>
        <button className="pp-btn pp-btn-sm pp-btn-ghost" type="button"
          onClick={() => goto('#/settings')}>{zh['topbar.settings']}</button>
      </header>
      {/* 工作台级页签条：Apifox 在每个工作区顶部都有一条页签栏（spec §3）。
          页面级 .pp-tabs 由 doc/debug/test/import 自己在正文里用，这里放全局页签：
          当前页面为激活页签，其余为可切换页签（等价于左树的水平镜像，符合 Apifox 双入口习惯）。 */}
      <div className="pp-tabs" role="tablist" aria-label={zh['aside.nav']}>
        {ROUTES.map((item) => (
          <button key={item.name} type="button" className="pp-tab" role="tab"
            data-active={route.name === item.name ? 'true' : 'false'}
            aria-selected={route.name === item.name ? 'true' : 'false'}
            onClick={() => goto(routeHref(item, route))}>
            {zh[item.labelKey]}
          </button>
        ))}
      </div>
      <div className={twoCol ? 'pp-body-2col' : 'pp-body-3col'}>
        <nav className="pp-col pp-col-left pp-tree" aria-label={zh['aside.nav']}>
          <div className="pp-tree-group">{zh['aside.nav']}</div>
          {ROUTES.map((item) => (
            <a key={item.name} className="pp-tree-row" href={routeHref(item, route)}
              data-active={route.name === item.name ? 'true' : 'false'}>
              {zh[item.labelKey]}
            </a>
          ))}
        </nav>
        <main className="pp-main">
          {Page ? <Page route={route} api={api} /> : <Placeholder route={route} />}
        </main>
        {twoCol ? null : <ContextAside route={route} />}
      </div>
    </div>
  )
}

// useTabInfo 属于可选信息：骨架不读 tab 上下文，props 形态与样板保持一致
// （该形参仅存在于 PostApiBody 函数签名内，勿在模块顶层引用）。
