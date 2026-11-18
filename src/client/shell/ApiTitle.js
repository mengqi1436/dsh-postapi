/**
 * PostAPI 页签 chip 标题（sidebar.right.pane.tab.title 席位）。
 * 对照样板 FilesTitle.tsx：接收 { useTabInfo }，读 tab.title；不注册该席位时
 * chip 会显示 registry 打开时捕获的 title(address) 文本，注册后由本组件接管。
 * 视觉走 Apifox token：字号/字重由 .pp-topbar-title 提供，间距用 var(--sp-1)，
 * 内联 style 只写 layout（display / alignItems / gap）。
 */
export function ApiTitle({ useTabInfo }) {
  const { tab } = useTabInfo()
  return (
    <span className="pp-topbar-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-1)' }}>
      <svg viewBox="0 0 64 64" width={14} height={14} aria-hidden="true"
        className="pp-accent" style={{ display: 'block', flexShrink: 0 }}>
        <path d="M6 50 L54 26 L6 8 L6 24 L36 26 L6 28 Z" fill="currentColor" />
      </svg>
      <span className="pp-ellipsis">{tab.title}</span>
    </span>
  )
}
