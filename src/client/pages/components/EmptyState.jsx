// EmptyState — 统一空态（居中图标 + 主文案 + 提示 + 可选动作，样式全部来自 .pp-empty）
// 之前是 1px 虚线大框 + 两行字，宽 460px 只放一句话，视觉上像一块未完成的占位。
// 现在收窄到 --empty-w、加图标位与可选按钮，信息层级更清楚（图标 → 文案 → 提示 → 动作）。
// 纪律：不引图标库（用内联 SVG path），颜色/字号/尺寸全部走 token。
import { createElement } from 'react'

/** 空态图标：24×24 stroke 风格，默认用「空盒子」。 */
const EMPTY_ICONS = {
  box: ['M4 8.5L12 4l8 4.5v7L12 20l-8-4.5z', 'M12 12l8-4.5', 'M12 12v8', 'M12 12L4 7.5'],
  search: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'M20 20l-4.2-4.2'],
  file: ['M6 3h8l4 4v14H6z', 'M14 3v4h4'],
}

function EmptyIcon({ name = 'box' }) {
  const paths = EMPTY_ICONS[name] || EMPTY_ICONS.box
  return createElement('svg', {
    viewBox: '0 0 24 24',
    width: 28,
    height: 28,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.4,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    className: 'pp-empty-icon',
  }, paths.map((d, i) => createElement('path', { key: i, d })))
}

/**
 * @param text  主文案
 * @param hint  次要提示
 * @param icon  图标名（box / search / file），传 null 不显示
 * @param action 可选动作 { label, onClick } 或 { label, href }
 */
export function EmptyState({ text = '暂无数据', hint = '', icon = 'box', action = null }) {
  const node = action
    ? (action.href
      ? createElement('a', { className: 'pp-btn pp-btn-sm pp-btn-primary', href: action.href }, action.label)
      : createElement('button', {
        type: 'button',
        className: 'pp-btn pp-btn-sm pp-btn-primary',
        onClick: action.onClick,
      }, action.label))
    : null
  return createElement('div', { className: 'pp-empty' },
    icon ? createElement(EmptyIcon, { name: icon }) : null,
    createElement('div', { className: 'pp-empty-text' }, text),
    hint ? createElement('div', { className: 'pp-meta' }, hint) : null,
    node ? createElement('div', { className: 'pp-empty-action' }, node) : null,
  )
}
