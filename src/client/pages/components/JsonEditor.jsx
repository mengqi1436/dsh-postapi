// JsonEditor — 轻量 JSON 文本编辑（.pp-json-editor 文本域 + 格式化/压缩 + 行内校验提示，不引 Monaco）
// 只读态用于 doc 页展示请求体/响应示例；可编辑态用于 debug 页 Body 页签。
// 尺寸与配色全部来自 .pp-json-editor（token 承载），内联样式只放 layout。
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
        <div className="pp-toolbar-inline" style={{ marginBottom: 'var(--sp-2)' }}>
          <button className="pp-btn pp-btn-sm" onClick={() => transform((v) => JSON.stringify(v, null, 2), '格式化')}>
            格式化
          </button>
          <button className="pp-btn pp-btn-sm" onClick={() => transform((v) => JSON.stringify(v), '压缩')}>
            压缩
          </button>
        </div>
      )}
      <textarea
        className="pp-json-editor"
        rows={rows}
        readOnly={readOnly}
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          if (typeof onChange === 'function') onChange(e.target.value)
        }}
      />
      {error ? <p className="pp-error-text">{error}</p> : null}
    </div>
  )
}
