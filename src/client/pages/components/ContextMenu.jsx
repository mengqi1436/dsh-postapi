// ContextMenu — 右键菜单（固定定位，doc 树 / overview 项目卡片共用）
// 面板与菜单项复用 design-tokens.css 既有 .pp-menu / .pp-menu-item 体系（与 shell Body.js 三级菜单同一套），
// 外层仅补 .pp-ctx-menu（fixed + z-index 层级 token，见 design-tokens.css 尾部新增规则）。
// 关闭：document 点击（菜单内部点击除外）/ Escape / resize / scroll（捕获阶段，容器内滚动也关）。
// 越界翻转：视口放不下时向上 / 向左翻（Body.js getBoundingClientRect 同思路；此处按估算尺寸翻转）。
// 纪律：无 alert/confirm/prompt；内联样式只放 top/left（layout）；项高继承 .pp-menu-item 的 --menu-item-h。
import { useEffect, useRef } from 'react'

/** 越界翻转用的估算尺寸：宽 = --menu-w（200px），高 = 项数 * --menu-item-h + 分隔线估算。
 *  只服务于首帧定位（真实尺寸随内容自动撑开），数值不进任何样式。 */
const EST_ITEM_H = 32
const EST_SEP_H = 9
const EST_WIDTH = 200

export function estimateMenuSize(items) {
  const list = Array.isArray(items) ? items : []
  let rows = 0
  let seps = 0
  for (const item of list) {
    if (item && item.divider) seps += 1
    else rows += 1
  }
  return { width: EST_WIDTH, height: rows * EST_ITEM_H + seps * EST_SEP_H }
}

/** 越界翻转：右缘超出视口且左侧放得下 → 左移一个菜单宽；下缘同理上移。 */
export function flipPosition(x, y, width, height) {
  const vw = typeof window !== 'undefined' && Number.isFinite(window.innerWidth) ? window.innerWidth : 0
  const vh = typeof window !== 'undefined' && Number.isFinite(window.innerHeight) ? window.innerHeight : 0
  let left = Number(x) || 0
  let top = Number(y) || 0
  if (vw > 0 && left + width > vw && left - width >= 0) left -= width
  if (vh > 0 && top + height > vh && top - height >= 0) top -= height
  if (left < 0) left = 0
  if (top < 0) top = 0
  return { left, top }
}

export function ContextMenu({ x, y, items, onClose }) {
  const rootRef = useRef(null)
  const list = Array.isArray(items) ? items.filter(Boolean) : []

  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const close = () => {
      if (typeof onClose === 'function') onClose()
    }
    // 菜单内部点击不关（项 onClick 自己负责 close），外部点击才关
    const onDocClick = (e) => {
      const el = rootRef.current
      if (el && e && typeof el.contains === 'function' && el.contains(e.target)) return
      close()
    }
    const onKey = (e) => {
      if (e && e.key === 'Escape') close()
    }
    const onReflow = () => close()
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKey)
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', onReflow)
      // scroll 用捕获：任意容器的滚动都算视口变化，菜单位置已失真，直接关
      window.addEventListener('scroll', onReflow, true)
    }
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', onReflow)
        window.removeEventListener('scroll', onReflow, true)
      }
    }
  }, [onClose])

  const size = estimateMenuSize(list)
  const pos = flipPosition(x, y, size.width, size.height)

  return (
    <div className="pp-menu pp-ctx-menu" role="menu" data-ctx-menu="true" ref={rootRef} style={{ left: pos.left, top: pos.top }}>
      {list.map((item, i) => (item && item.divider) ? (
        <div key={i} className="pp-menu-sep" role="separator" />
      ) : (
        <button
          key={i}
          type="button"
          role="menuitem"
          className={'pp-menu-item' + (item && item.danger ? ' pp-menu-item-danger' : '')}
          disabled={item && item.disabled ? true : undefined}
          onClick={() => {
            if (item && typeof item.onClick === 'function') item.onClick()
            if (typeof onClose === 'function') onClose()
          }}
        >
          <span className="pp-menu-label">{item && item.label != null ? item.label : ''}</span>
        </button>
      ))}
    </div>
  )
}
