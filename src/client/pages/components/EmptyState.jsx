// EmptyState — 统一空态（1px 虚线框 + 居中次要色文案，样式全部来自 .pp-empty）
// 只接受文案，不做图标/插画（契约：无新依赖、无内联颜色字面量）。
export function EmptyState({ text = '暂无数据', hint = '' }) {
  return (
    <div className="pp-empty">
      <div>{text}</div>
      {hint ? <div className="pp-muted">{hint}</div> : null}
    </div>
  )
}
