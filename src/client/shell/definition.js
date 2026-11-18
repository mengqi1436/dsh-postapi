/**
 * PostAPI 右栏页签类型声明（stage one）：这个类型"是什么"。
 *
 * 对照样板 @deepseek-ai/dsh-client-ui-sidebar-files@0.2.2-rc.3 src/client/definition.tsx：
 * - id 是 tab 系统里的实现身份，也是 sidebar.right.pane.tab / .title 两个
 *   keyed 席位的注册 key（官方注释："it is the key its body registers under"）。
 * - kind 是类型判别符，openTab(kind) 用它命名。
 * - priority 不写即 'extension'（tab-registry.ts DEFAULT_BAND），契约 §4 同款。
 * - keepMounted: true 让访问过的 body 在隐藏、切会话、停靠变换时不卸载。
 * - guide 单入口：一项 entry，点开即直开本页签（guide 单入口直开）。
 */
import { createElement } from 'react'
import { POSTAPI_NS } from './locales.js'

/** 实现身份与席位 key（不拼 localeKey）。 */
export const POSTAPI_ID = 'postapi'

/** 类型判别符：ctx.sidebarRight.openTab('postapi') 即打开本页。 */
export const POSTAPI_KIND = 'postapi'

/**
 * guide 入口图标：宿主按 <Icon size className /> 渲染，故必须是 React 组件。
 * 内联 svg（同 db-tool DbIcon 形态），不引 @deepseek-ai/dsh-client-ui-primitives。
 * @param props - { size } 由宿主传入。
 */
export function PostApiIcon(props) {
  const s = (props && props.size) || 16
  return createElement('svg', {
    viewBox: '0 0 64 64', width: s, height: s, 'aria-hidden': true,
    style: { display: 'block' },
  }, createElement('path', { d: 'M6 50 L54 26 L6 8 L6 24 L36 26 L6 28 Z', fill: 'currentColor' }))
}

/**
 * 产出注册定义。
 * @param t - 命名空间绑定的翻译函数（每次取值即时读取，语言切换无需重注册）。
 * @returns sidebarRightTabs.register 的入参。
 */
export function postapiDefinition(t) {
  return {
    id: POSTAPI_ID,
    kind: POSTAPI_KIND,
    keepMounted: true,
    // 页类型（无 patterns），priority 不参与路由排序；显式写 'extension' 与 db-tool 一致。
    priority: 'extension',
    title: () => t('type.label'),
    guide: [{
      // guide 条目 id 与类型 id 一致（db-tool 同款）：空态入口卡片按它打开本页签。
      id: POSTAPI_ID,
      order: 10,
      title: () => t('guide.title'),
      description: () => t('guide.description'),
      // icon 是 React 组件；缺它时官方 guide 只画立方体占位图。
      icon: PostApiIcon,
    }],
  }
}
