/**
 * PostAPI 页签 body（sidebar.right.pane.tab 席位）：Apifox 同构工作台骨架。
 *
 * 规范：docs/apifox-visual-parity-spec.md（全部数值取自 Apifox 2.8.55 的 CSS 原文）
 *   结构 = 顶栏 48px + 左侧 240px 常驻文字菜单 + 主区（44px 页签条 + 页头 + 页面）。
 *   历史：v1 是 240px 左树 + 主区 + 240px 右栏三段式，窄容器里必然拥挤；
 *   v2 换成 64px 图标轨 + 浮层二级菜单，解决了宽度但图标认不出功能、二级要多点一次；
 *   v3（当前）照 Apifox 用 240px 常驻文字菜单，分组标题 + 路由文字全部直读。
 *
 * 路由形态：#/overview、#/doc/:endpointId、#/debug、#/flow、#/settings…（契约 §3）。
 * 颜色 / 字号 / 尺寸一律引用 design-tokens.css 的 var(--*) token，内联 style 只写 layout。
 */
import { createElement, useEffect, useRef, useState } from 'react'
import { zh } from './locales.js'
import { pageRegistry } from './registry.js'

/** 主题与环境的本地设置键（与 pages/theme.js 共用同一套键，切页不丢）。 */
const THEME_KEY = 'postapi.settings.theme'
const ENV_KEY = 'postapi.settings.env'

/** 12 条路由（顺序 = 契约 §3 页面清单）。 */
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

/**
 * 五个导航分组（v2）：每条路由只出现在一个分组里，一级只显示分组图标。
 * glyph 用等宽符号而非 emoji：emoji 在不同系统字号/基线上抖动，会破坏轨的对齐。
 */
export const NAV_GROUPS = [
  { id: 'project', labelKey: 'group.project', icon: 'grid', routes: ['overview'] },
  { id: 'api', labelKey: 'group.api', icon: 'layers', routes: ['doc', 'debug', 'mock'] },
  { id: 'data', labelKey: 'group.data', icon: 'db', routes: ['schema', 'env'] },
  { id: 'quality', labelKey: 'group.quality', icon: 'check', routes: ['test', 'history', 'flow'] },
  { id: 'tools', labelKey: 'group.tools', icon: 'sliders', routes: ['import', 'search', 'settings'] },
]

/**
 * 图标路径表（24×24 视图，stroke 风格）。
 * 用 SVG 而非符号字符：符号在 Windows/不同字体下基线与粗细不一致，轨会看起来歪。
 */
const ICON_PATHS = {
  grid: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
  layers: ['M4 7h16', 'M4 12h16', 'M4 17h10'],
  db: ['M5 6c0-1.1 3.1-2 7-2s7 .9 7 2-3.1 2-7 2-7-.9-7-2z', 'M5 6v12c0 1.1 3.1 2 7 2s7-.9 7-2V6', 'M5 12c0 1.1 3.1 2 7 2s7-.9 7-2'],
  check: ['M4 12l5 5L20 6'],
  sliders: ['M4 7h10', 'M18 7h2', 'M4 17h4', 'M12 17h8', 'M14 4v6', 'M8 14v6'],
  sun: ['M12 4v2', 'M12 18v2', 'M4 12h2', 'M18 12h2', 'M6.3 6.3l1.4 1.4', 'M16.3 16.3l1.4 1.4', 'M6.3 17.7l1.4-1.4', 'M16.3 7.7l1.4-1.4'],
  moon: ['M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z'],
  gear: ['M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', 'M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1L14.5 3h-4l-.4 2.6a7 7 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5c.1-.3.1-.7.1-1z'],
  help: ['M12 18h.01', 'M9.1 9a3 3 0 1 1 4.2 2.7c-.8.5-1.3 1.1-1.3 2.3', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z'],
  plus: ['M12 5v14', 'M5 12h14'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
}

/**
 * 渲染一个 SVG 图标。
 * @param name - ICON_PATHS 的键。
 * @param size - 边长（默认 --rail-icon 的 20px）。
 */
export function Icon({ name, size = 20 }) {
  const paths = ICON_PATHS[name] || ICON_PATHS.grid
  return createElement('svg', {
    viewBox: '0 0 24 24',
    width: size,
    height: size,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    style: { display: 'block' },
  }, paths.map((d, i) => createElement('path', { key: i, d })))
}

/** 帮助浮层里的快捷入口（固定四条，文案复用 nav.* 键）。 */
export const SHORTCUTS = [
  { name: 'debug', hash: '#/debug', labelKey: 'nav.debug' },
  { name: 'doc', hash: '#/doc', labelKey: 'nav.doc' },
  { name: 'test', hash: '#/test', labelKey: 'nav.test' },
  { name: 'settings', hash: '#/settings', labelKey: 'nav.settings' },
]

/** 解析 hash 为 { name, arg, query }；未知路由回落 overview。 */
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

/** 当前路由属于哪个分组（未知路由归第一组）。 */
export function groupOfRoute(name) {
  const hit = NAV_GROUPS.find((g) => g.routes.indexOf(name) >= 0)
  return hit || NAV_GROUPS[0]
}

/** 分组内的路由对象列表（保持 ROUTES 顺序）。 */
export function routesOfGroup(group) {
  if (!group || !Array.isArray(group.routes)) return []
  return group.routes.map((name) => ROUTES.find((r) => r.name === name)).filter(Boolean)
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

/** 页面未注册时的占位。 */
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

/**
 * 页头：只放一行页面说明（文案取 aside.page.<route>）。
 *
 * 刻意不再重复标题：顶栏已经显示当前页名，页面组件自身也有 .pp-page-title，
 * 三层标题叠在一起是 v1 的视觉噪音来源之一。说明文字缺省时整块不渲染。
 */
function PageHead({ active }) {
  const desc = zh['aside.page.' + active.name]
  if (!desc) return null
  return (
    <div className="pp-page-head">
      <div className="pp-page-head-main">
        <p className="pp-page-desc">{desc}</p>
      </div>
    </div>
  )
}

/**
 * 页签 body 组件。props 来自 slots runtime：useTabInfo + 注入的 locale t（若有）。
 * v2 骨架：顶栏（面包屑 + 搜索 + 动作）+ 图标轨（分组）+ 主区（页头 + 页面）。
 */
export function PostApiBody({ useTabInfo }) {
  const route = useHashRoute()
  const [theme, setTheme] = useState(() => readSetting(THEME_KEY, 'light'))
  const [env, setEnv] = useState(() => readSetting(ENV_KEY, ''))
  const [keyword, setKeyword] = useState('')
  // 帮助卡片（原右上下文栏的内容，收进侧栏底部一项）
  const [helpOpen, setHelpOpen] = useState(false)
  const shellRef = useRef(null)
  // 页面组件每次渲染查注册表：页面可能在 body 已挂载后才自注册。
  const Page = pageRegistry.get(route.name)
  const active = ROUTES.find((r) => r.name === route.name) || ROUTES[0]
  const activeGroup = groupOfRoute(route.name)
  const api = typeof window !== 'undefined' ? window.__postapiApi : undefined

  // Esc 关闭帮助卡片；点卡片外关闭。
  useEffect(() => {
    const onKey = (event) => {
      if (event && event.key === 'Escape') setHelpOpen(false)
    }
    const onDown = (event) => {
      const target = event && event.target
      if (!target || !shellRef.current) return
      if (typeof shellRef.current.contains === 'function' && shellRef.current.contains(target)) {
        // 点在侧栏或帮助卡片内部：交给各自的 onClick 处理
        if (target.closest && (target.closest('.pp-sider') || target.closest('.pp-help-card'))) return
      }
      setHelpOpen(false)
    }
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('keydown', onKey)
      window.addEventListener('mousedown', onDown)
      return () => {
        window.removeEventListener('keydown', onKey)
        window.removeEventListener('mousedown', onDown)
      }
    }
    return undefined
  }, [])

  // 路由变化时收起帮助卡片（跳转后说明卡不该留在屏幕上）。
  useEffect(() => { setHelpOpen(false) }, [route.name, route.arg])

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
  const toggleHelp = () => setHelpOpen((prev) => !prev)

  return (
    <div className="pp-scope pp-workbench-v2" data-theme={theme} data-route={route.name}>
      <header className="pp-topbar">
        <span className="pp-topbar-title">{zh[active.labelKey]}</span>
        <span className="pp-crumb">
          <span className="pp-crumb-sep">/</span>
          {zh[activeGroup.labelKey]}
        </span>
        <span className="pp-topbar-spacer" />
        <input
          className="pp-input pp-input-sm pp-topbar-search"
          type="search"
          value={keyword}
          placeholder={zh['topbar.searchPlaceholder']}
          aria-label={zh['topbar.search']}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={onSearchKey}
        />
        <button className="pp-btn pp-btn-sm pp-btn-primary" type="button"
          onClick={() => goto('#/doc')}>{zh['topbar.newEndpoint']}</button>
        <select className="pp-select pp-input-sm" value={env} onChange={pickEnv}
          title={zh['topbar.env']} aria-label={zh['topbar.env']}>
          <option value="">{zh['topbar.envDefault']}</option>
        </select>
        <button className="pp-icon-btn" type="button" onClick={toggleTheme}
          title={zh['topbar.themeHint']} aria-label={zh['topbar.themeHint']}>
          <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={18} />
        </button>
        <button className="pp-icon-btn" type="button" onClick={() => goto('#/settings')}
          title={zh['topbar.settings']} aria-label={zh['topbar.settings']}>
          <Icon name="gear" size={18} />
        </button>
        <button className="pp-icon-btn" type="button" onClick={toggleHelp}
          data-active={helpOpen ? 'true' : 'false'}
          title={zh['aside.about']} aria-label={zh['aside.about']}>
          <Icon name="help" size={18} />
        </button>
      </header>
      <div className="pp-shell" ref={shellRef}>
        {/* 左侧 240px 常驻文字菜单（Apifox .sider-bxNtfB 同规格）：
            分组标题 + 组内路由，全部文字直接可见，不再有「图标看不懂」与「二级要点开」两个问题。 */}
        <nav className="pp-sider" aria-label={zh['aside.nav']}>
          {NAV_GROUPS.map((group) => (
            <div key={group.id}>
              <div className="pp-sider-group">{zh[group.labelKey]}</div>
              {routesOfGroup(group).map((item) => (
                <a key={item.name} className="pp-sider-item"
                  href={routeHref(item, route)}
                  data-active={route.name === item.name ? 'true' : 'false'}>
                  <Icon name={group.icon} size={16} />
                  <span className="pp-sider-label">{zh[item.labelKey]}</span>
                </a>
              ))}
            </div>
          ))}
          <span className="pp-sider-spacer" />
          <button type="button" className="pp-sider-item" onClick={toggleHelp}
            data-active={helpOpen ? 'true' : 'false'}>
            <Icon name="help" size={16} />
            <span className="pp-sider-label">{zh['aside.about']}</span>
          </button>
        </nav>
        <main className="pp-main-v2">
          {/* 页签条：Apifox 主页签条 44px（docs/apifox-visual-parity-spec.md §6）。
              当前只承载「当前页」一个页签，结构按卡片式页签建好，后续多开接口时直接复用。 */}
          <div className="pp-tabbar" role="tablist" aria-label={zh[active.labelKey]}>
            <button type="button" className="pp-tabbar-item" role="tab"
              data-active="true" aria-selected="true">
              <span className="pp-sider-label">{zh[active.labelKey]}</span>
            </button>
          </div>
          <PageHead active={active} />
          {helpOpen ? (
            <div className="pp-help-card" role="dialog" aria-label={zh['aside.about']}>
              <div className="pp-help-card-head">
                <span className="pp-help-card-title">{zh['aside.about']}</span>
                <button type="button" className="pp-icon-btn" onClick={() => setHelpOpen(false)}
                  aria-label={zh['aside.shortcuts']}>
                  <Icon name="close" size={14} />
                </button>
              </div>
              <div className="pp-help">{zh['aside.page.' + route.name] || zh['aside.noContext']}</div>
              <div className="pp-help-card-title">{zh['aside.shortcuts']}</div>
              <div className="pp-help-links">
                {SHORTCUTS.map((item) => (
                  <a key={item.name} className="pp-sider-item" href={item.hash}
                    onClick={() => setHelpOpen(false)}>
                    <span className="pp-sider-label">{zh[item.labelKey]}</span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
          {Page ? <Page route={route} api={api} /> : <Placeholder route={route} />}
        </main>
      </div>
    </div>
  )
}

// useTabInfo 属于可选信息：骨架不读 tab 上下文，props 形态与样板保持一致
// （该形参仅存在于 PostApiBody 函数签名内，勿在模块顶层引用）。
