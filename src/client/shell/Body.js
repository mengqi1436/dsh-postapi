/**
 * PostAPI 页签 body（sidebar.right.pane.tab 席位）：
 * hash 路由 + 页面注册表消费端。路由：#/overview、#/doc/:endpointId、
 * #/debug、#/flow、#/settings（契约 §3）。页面组件来自
 * window.__postapiPages（T5 自注册），缺席时渲染占位。
 */
import { useState, useEffect } from 'react'
import { zh } from './locales.js'
import { pageRegistry } from './registry.js'

const ROUTES = [
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
const PARAM_ROUTES = ['doc', 'schema']

/** 解析当前 hash 为 { name, arg, query }；未知路由回落 overview。 */
function parseHash() {
  const raw = typeof location !== 'undefined' ? location.hash : ''
  const clean = String(raw || '#/overview').replace(/^#\/?/, '')
  const qAt = clean.indexOf('?')
  const pathPart = qAt >= 0 ? clean.slice(0, qAt) : clean
  const query = qAt >= 0 ? clean.slice(qAt + 1) : ''
  const [first, ...rest] = pathPart.split('/')
  if (PARAM_ROUTES.indexOf(first) >= 0) {
    return { name: first, arg: rest.length ? decodeURIComponent(rest.join('/')) : '', query }
  }
  if (ROUTES.some(r => r.name === first)) return { name: first, arg: '', query }
  return { name: 'overview', arg: '', query }
}

/** hashchange 订阅式路由 hook。 */
function useHashRoute() {
  const [route, setRoute] = useState(parseHash)
  useEffect(() => {
    const onChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

function Placeholder({ route }) {
  return (
    <div style={{ padding: 24, fontSize: 13, lineHeight: 1.45, color: '#666' }}>
      <div style={{ fontWeight: 600, marginBottom: 8, color: '#000' }}>
        {zh['placeholder.title']}: {route.name}{route.arg ? '/' + route.arg : ''}
      </div>
      <div>{zh['placeholder.body']}</div>
      <div style={{ marginTop: 8 }}>{zh['placeholder.hint']}</div>
    </div>
  )
}

/**
 * 页签 body 组件。props 来自 slots runtime：useTabInfo + 注入的 locale t（若有）。
 * 页签渲染的是整个 PostAPI 工作台：左侧路由导航 + 页面渲染区。
 */
export function PostApiBody({ useTabInfo }) {
  const route = useHashRoute()
  // 页面组件每次渲染查注册表：T5 页面可能在 body 已挂载后才自注册。
  const Page = pageRegistry.get(route.name)
  const navStyle = {
    display: 'flex', gap: 4, padding: '6px 10px',
    borderBottom: '1px solid #eaeaea', flexWrap: 'wrap',
    position: 'sticky', top: 0, background: '#ffffff', zIndex: 2,
  }
  const linkStyle = {
    padding: '0 8px', height: 24, display: 'inline-flex', alignItems: 'center',
    borderRadius: 6, fontSize: 12, lineHeight: '24px',
    textDecoration: 'none', color: '#666',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <nav style={navStyle}>
        {ROUTES.map(item => (
          <a key={item.name}
            href={item.name === 'doc' && route.arg ? '#/doc/' + encodeURIComponent(route.arg) : item.hash}
            style={{ ...linkStyle, fontWeight: route.name === item.name ? 600 : 400, color: route.name === item.name ? '#000' : '#666', background: route.name === item.name ? '#f5f5f5' : 'transparent' }}>
            {zh[item.labelKey]}
          </a>
        ))}
      </nav>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {Page ? <Page route={route} api={typeof window !== 'undefined' ? window.__postapiApi : undefined} /> : <Placeholder route={route} />}
      </div>
    </div>
  )
}

// useTabInfo 属于可选信息：骨架不读 tab 上下文，props 形态与样板保持一致
// （该形参仅存在于 PostApiBody 函数签名内，勿在模块顶层引用）。
