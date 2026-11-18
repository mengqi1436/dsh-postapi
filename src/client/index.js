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
import './pages-entry.js'

/** 客户端依赖的宿主 face：全部为内置 face（宿主总线不提供插件自定义 face）。 */
export const inject = ['slots', 'locale', 'sidebarRightTabs']

/** 会话输入框底栏徽章（conversation.composer.dock，骨架已验证的官方 slot）。 */
function ComposerBadge() {
  return createElement('svg', {
    viewBox: '0 0 64 64', width: 16, height: 16, 'aria-hidden': true,
    style: { display: 'block', pointerEvents: 'none' },
  }, createElement('path', { d: 'M6 50 L54 26 L6 8 L6 24 L36 26 L6 28 Z', fill: '#247bbf' }))
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

  // 1. 页签类型声明：keepMounted + guide 单入口直开（契约 §4）。
  ctx.effect(() => ctx.sidebarRightTabs.register(postapiDefinition(t)), 'dsh-postapi: postapi tab type')
  // 2. 'postapi' 命名空间字典。
  if (ctx.locale) {
    ctx.effect(() => ctx.locale.register(POSTAPI_NS, { zh, en }), 'dsh-postapi: dictionaries')
  }
  // 3. 页签 body：席位 key = definition.id（POSTAPI_ID，不拼 localeKey）。
  ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register(
    { name: 'sidebar.right.pane.tab', key: POSTAPI_ID, locale: POSTAPI_NS },
    PostApiBody,
  )), 'dsh-postapi: tab body')
  // 4. 页签 chip 标题。
  ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register(
    { name: 'sidebar.right.pane.tab.title', key: POSTAPI_ID },
    ApiTitle,
  )), 'dsh-postapi: tab title')
  // 5. composer.dock 徽章：该 slot 由 conversation 插件提供，未安装时 inject 会抛错；
  //    软失败处理，任何异常都不允许拖垮页签注册链（页签是主功能）。
  try {
    ctx.effect(() => ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register(
      { name: 'conversation.composer.dock', id: 'dsh-postapi', order: 5 },
      ComposerBadge,
    )), 'dsh-postapi: composer badge')
  } catch (err) {
    console.warn('[dsh-postapi] composer 徽章未注册（slot 提供方缺失）：', err && err.message)
  }
  // 6. 同源 HTTP 桥（db-tool 同款）：宿主 face 总线只提供内置 face，postapi.*
  //    无法注册为自定义 face；window.__postapiApi 经 fetch('/dsh-postapi/api/…')
  //    调用宿主桥路由，桥不可达时自动降级内存桩（契约 §2 签名不变）。
  ctx.effect(() => installApi(), 'dsh-postapi: bridge api install')
}
