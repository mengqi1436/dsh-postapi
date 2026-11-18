// StatusPill — 响应状态胶囊（Apifox .pp-pill 三档：pp-pill-ok / pp-pill-warn / pp-pill-bad）
// 色阶完全由 CSS 类承载（1px 同色边框 + 同色文字、无底色），组件不写任何内联颜色。

/** 状态码 → token 色阶。保留旧契约：返回 var(--*) 字符串，供需要色值的调用方。 */
export function statusTone(status) {
  const code = Number(status)
  if (!Number.isFinite(code) || code <= 0) return 'var(--error)'
  if (code < 300) return 'var(--success)'
  if (code < 400) return 'var(--warning)'
  return 'var(--error)'
}

/** 状态码 → .pp-pill 修饰类（Apifox 三档：2xx 绿 / 3xx 橙 / 其余红）。 */
export function statusToneClass(status) {
  const code = Number(status)
  if (!Number.isFinite(code) || code <= 0) return 'pp-pill-bad'
  if (code < 300) return 'pp-pill-ok'
  if (code < 400) return 'pp-pill-warn'
  return 'pp-pill-bad'
}

/** tone 兼容层：接受 ok/warn/bad/accent 短名或完整 .pp-pill-* 类名。 */
const TONE_ALIAS = { ok: 'pp-pill-ok', warn: 'pp-pill-warn', bad: 'pp-pill-bad', accent: 'pp-pill-accent' }

export function StatusPill({ status, text = '', tone }) {
  const cls = tone
    ? TONE_ALIAS[tone] || (String(tone).indexOf('pp-pill') === 0 ? String(tone) : statusToneClass(status))
    : statusToneClass(status)
  return (
    <span className={'pp-pill ' + cls}>
      {status == null || status === '' ? '-' : String(status)}
      {text ? ' ' + text : ''}
    </span>
  )
}
