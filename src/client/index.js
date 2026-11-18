/**
 * dsh-postapi 客户端入口：官方右侧栏接线 + 同源 HTTP 桥 api + 页面注册表 +
 * composer.dock 徽章（契约 §4 保留）。
 *
 * 接线对照样板 @deepseek-ai/dsh-client-ui-sidebar-files@0.2.2-rc.3
 * src/client/index.ts 的 apply()：所有 register/inject 返回的 disposer 都由
 * ctx.effect 包裹，插件卸载即随 effect 释放。
 */
import { createElement } from 'react'
import { POSTAPI_ID, postapiDefinition } from './shell/definition.js'
import { POSTAPI_NS, zh, en } from './shell/locales.js'
import { PostApiBody } from './shell/Body.js'
import { ApiTitle } from './shell/ApiTitle.js'
import { ensureGlobals, installApi } from './shell/registry.js'
import designTokensCss from './pages/design-tokens.css'
import './pages-entry.js'

/**
 * 把 design-tokens.css 注入页面。
 *
 * 宿主 __ModuleLoader__ 只加载 CJS 模块、没有 CSS 入口，样式表必须以文本形式打进产物
 * 再由 client 自己插 <style>（带 data-plugin 标记，宿主卸载插件时会一并清掉）。
 * 缺这一步所有 .pp-* 类都不生效，页面退化成无样式裸 HTML。
 * @returns 卸载函数（移除本插件注入的 style 节点）。
 */
function installStyles() {
  if (typeof document === 'undefined') return () => {}
  const existing = document.querySelector('style[data-plugin="dsh-postapi"]')
  if (existing) return () => { existing.remove() }
  const el = document.createElement('style')
  el.setAttribute('data-plugin', 'dsh-postapi')
  el.setAttribute('data-plugin-css', 'design-tokens')
  el.textContent = designTokensCss
  document.head.append(el)
  return () => { el.remove() }
}

/** 客户端依赖的宿主 face：全部为内置 face（宿主总线不提供插件自定义 face）。 */
export const inject = ['slots', 'locale', 'sidebarRightTabs']

/**
 * ctx.effect 的安全包装。
 *
 * cordis 的 Fiber#_execute 只接受 effect body 返回「函数 / null / Promise / 同步或异步迭代器」；
 * 返回普通对象（例如 register 把注册记录对象当返回值）会抛 TypeError('Invalid effect')，
 * 整个 apply 随之失败，宿主回滚本 entry 的全部注册——页签因此完全消失且只有一条
 * 「1 entry did not activate」警告。这里把任何非函数、非 null 的返回值丢掉并记一条 warn，
 * 让单个注册点的形态差异不至于拖垮整条注册链。
 * @param ctx - 客户端根上下文。
 * @param label - effect 标签（诊断用）。
 * @param body - effect body，返回值被归一化。
 * @returns 无。
 */
function safeEffect(ctx, label, body) {
  ctx.effect(() => {
    const result = body()
    if (result === undefined || result === null) return undefined
    if (typeof result === 'function') return result
    if (typeof result.then === 'function' || typeof result[Symbol.iterator] === 'function' || typeof result[Symbol.asyncIterator] === 'function') return result
    console.warn('[dsh-postapi] ' + label + ' 返回了非 disposer 值（已忽略）：', typeof result)
    return undefined
  }, label)
}

/** 会话输入框底栏徽章（conversation.composer.dock，骨架已验证的官方 slot）。 */
function ComposerBadge() {
  return createElement('svg', {
    viewBox: '0 0 64 64', width: 16, height: 16, 'aria-hidden': true,
    style: { display: 'block', pointerEvents: 'none' },
  }, createElement('path', { d: 'M6 50 L54 26 L6 8 L6 24 L36 26 L6 28 Z', fill: 'currentColor' }))
}

/**
 * 客户端插件体。
 * @param ctx - 客户端根上下文（携带 slots/locale/sidebarRightTabs 与 postapi.* face）。
 */
export function apply(ctx) {
  // 自诊断：确认 client 半边是否被宿主执行（定位「右栏无入口」时用，稳定后可删）。
  console.info('[dsh-postapi] client apply 已执行', { hasTabs: !!ctx.sidebarRightTabs, hasSlots: !!ctx.slots, hasLocale: !!ctx.locale })
  ensureGlobals()
  // 服务缺失时 warn 后返回（不抛错、不注册）：与 db-tool 一致。宿主 ctx 若未提供
  // 右侧栏两件套，硬调 register 会抛错并被宿主记为加载失败，整插件连字典都不生效。
  if (!ctx.sidebarRightTabs || !ctx.slots) {
    console.warn('[dsh-postapi] 宿主未提供 sidebarRightTabs / slots 服务，右侧栏页签不会挂载')
    return
  }
  // locale 为内置 face，正常必在；缺失时回落中文原文，不让文案取用拖垮注册链。
  const t = ctx.locale ? ctx.locale.bind(POSTAPI_NS) : (key) => zh[key] ?? key

  // 0. 样式表注入：先于任何注册执行，保证页面首次渲染就带样式。
  safeEffect(ctx, 'dsh-postapi: design tokens', () => installStyles())
  // 1. 页签类型声明：keepMounted + guide 单入口直开（契约 §4）。
  safeEffect(ctx, 'dsh-postapi: postapi tab type', () => ctx.sidebarRightTabs.register(postapiDefinition(t)))
  // 2. 'postapi' 命名空间字典。
  if (ctx.locale) {
    safeEffect(ctx, 'dsh-postapi: dictionaries', () => ctx.locale.register(POSTAPI_NS, { zh, en }))
  }
  // 3. 页签 body：席位 key = definition.id（POSTAPI_ID，不拼 localeKey）。
  safeEffect(ctx, 'dsh-postapi: tab body', () => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register(
    { name: 'sidebar.right.pane.tab', key: POSTAPI_ID, locale: POSTAPI_NS },
    PostApiBody,
  )))
  // 4. 页签 chip 标题。
  safeEffect(ctx, 'dsh-postapi: tab title', () => ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register(
    { name: 'sidebar.right.pane.tab.title', key: POSTAPI_ID },
    ApiTitle,
  )))
  // 5. composer.dock 徽章：该 slot 由 conversation 插件提供，未安装时 inject 会抛错；
  //    软失败处理，任何异常都不允许拖垮页签注册链（页签是主功能）。
  try {
    safeEffect(ctx, 'dsh-postapi: composer badge', () => ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register(
      { name: 'conversation.composer.dock', id: 'dsh-postapi', order: 5 },
      ComposerBadge,
    )))
  } catch (err) {
    console.warn('[dsh-postapi] composer 徽章未注册（slot 提供方缺失）：', err && err.message)
  }
  // 6. 同源 HTTP 桥（db-tool 同款）：宿主 face 总线只提供内置 face，postapi.*
  //    无法注册为自定义 face；window.__postapiApi 经 fetch('/dsh-postapi/api/…')
  //    调用宿主桥路由，桥不可达时自动降级内存桩（契约 §2 签名不变）。
  //
  //    注意 effect body 必须返回「disposer 函数 / null / Promise / 迭代器」之一：
  //    cordis 的 Fiber#_execute 收到普通对象会抛 TypeError('Invalid effect')，
  //    整个 apply 随之失败，宿主回滚本 entry 的全部注册（页签因此消失）。
  //    installApi() 的返回值是 api 对象，只能丢弃，disposer 里清掉挂载点。
  safeEffect(ctx, 'dsh-postapi: bridge api install', () => {
    installApi()
    return () => {
      if (typeof window !== 'undefined' && window.__postapiApi) delete window.__postapiApi
    }
  })
}
