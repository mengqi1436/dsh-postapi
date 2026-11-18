// JsonEditor — 轻量 JSON 文本编辑（textarea + 格式化/压缩 + 行内校验提示，不引 Monaco）
// 只读态用于 doc 页展示请求体/响应示例；可编辑态用于 debug 页 Body 页签。
import { useState } from 'react'

export function JsonEditor({ value = '', onChange, readOnly = false, rows = 8, placeholder = '{}' }) {
  const [error, setError] = useState('')
  const text = value == null ? '' : String(value)

  const transform = (fn, label) => {
    try {
      const next = fn(JSON.parse(text))
      setError('')
      if (typeof onChange === 'function') onChange(next)
    } catch (err) {
      setError(label + '失败：' + (err && err.message ? err.message : String(err)))
    }
  }

  return (
    <div>
      {readOnly ? null : (
        <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)' }}>
          <button className="pp-btn" onClick={() => transform((v) => JSON.stringify(v, null, 2), '格式化')}>
            格式化
          </button>
          <button className="pp-btn" onClick={() => transform((v) => JSON.stringify(v), '压缩')}>
            压缩
          </button>
        </div>
      )}
      <textarea
        className="pp-input pp-input-mono"
        rows={rows}
        readOnly={readOnly}
        placeholder={placeholder}
        style={{ width: '100%', height: 'auto', padding: 'var(--sp-2)', resize: 'vertical' }}
        value={text}
        onChange={(e) => {
          if (typeof onChange === 'function') onChange(e.target.value)
        }}
      />
      {error ? <p className="pp-muted">{error}</p> : null}
    </div>
  )
}
