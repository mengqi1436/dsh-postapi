// StatusPill — 响应状态胶囊（状态码 → token 色阶；0 / 缺失视为错误态）
// 颜色只引用 --success / --warning / --error 三个 token，不写颜色字面量。

/** 状态码 → token 色阶。 */
export function statusTone(status) {
  const code = Number(status)
  if (!Number.isFinite(code) || code <= 0) return 'var(--error)'
  if (code < 300) return 'var(--success)'
  if (code < 400) return 'var(--warning)'
  return 'var(--error)'
}

export function StatusPill({ status, text = '', tone }) {
  const color = tone || statusTone(status)
  return (
    <span className="pp-pill" style={{ color, borderColor: color }}>
      {status == null || status === '' ? '-' : String(status)}
      {text ? ' ' + text : ''}
    </span>
  )
}
