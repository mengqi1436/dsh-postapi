// ParamTable — 参数表（doc 页只读展示 / debug 页可编辑，四组参数共用一套列定义）
// 列宽是 layout 内联，颜色与字号一律走 .pp-* 类与 token。
import { EmptyState } from './EmptyState.jsx'

const COLUMN_META = {
  enabled: { title: '启用', width: '56px' },
  key: { title: '参数', width: '160px' },
  value: { title: '值' },
  type: { title: '类型', width: '88px' },
  required: { title: '必填', width: '56px' },
  description: { title: '说明', width: '160px' },
}

const DEFAULT_COLUMNS = ['enabled', 'key', 'value', 'type', 'required', 'description']

/** 新增行模板（契约 §2 endpoint.params 行结构）。 */
export function blankParamRow() {
  return { key: '', value: '', enabled: true, type: 'string', required: false, description: '' }
}

function renderCell(col, row, index, editable, patch) {
  const value = row ? row[col] : undefined
  if (col === 'enabled' || col === 'required') {
    if (!editable) return value ? '是' : '否'
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => patch(index, col, e.target.checked)}
      />
    )
  }
  if (!editable) {
    const mono = col === 'key' || col === 'value'
    return (
      <span className={mono ? 'pp-table-mono' : undefined}>
        {value == null || value === '' ? '-' : String(value)}
      </span>
    )
  }
  return (
    <input
      className="pp-input pp-input-mono"
      style={{ width: '100%' }}
      value={value == null ? '' : String(value)}
      onChange={(e) => patch(index, col, e.target.value)}
    />
  )
}

export function ParamTable({
  rows,
  onChange,
  readOnly = false,
  columns = DEFAULT_COLUMNS,
  emptyText = '无',
  addLabel = '+ 添加',
}) {
  const list = Array.isArray(rows) ? rows : []
  const editable = !readOnly && typeof onChange === 'function'

  const patch = (index, field, value) => {
    const next = list.slice()
    next[index] = { ...next[index], [field]: value }
    onChange(next)
  }
  const remove = (index) => {
    const next = list.slice()
    next.splice(index, 1)
    onChange(next)
  }

  if (list.length === 0 && !editable) return <EmptyState text={emptyText} />

  return (
    <table className="pp-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col}
              style={COLUMN_META[col] && COLUMN_META[col].width ? { width: COLUMN_META[col].width } : undefined}
            >
              {COLUMN_META[col] ? COLUMN_META[col].title : col}
            </th>
          ))}
          {editable ? <th style={{ width: '64px' }}>操作</th> : null}
        </tr>
      </thead>
      <tbody>
        {list.map((row, index) => (
          <tr key={index}>
            {columns.map((col) => (
              <td key={col}>{renderCell(col, row, index, editable, patch)}</td>
            ))}
            {editable ? (
              <td>
                <button className="pp-btn" onClick={() => remove(index)}>删除</button>
              </td>
            ) : null}
          </tr>
        ))}
        {editable ? (
          <tr>
            <td colSpan={columns.length + 1}>
              <button className="pp-btn" onClick={() => onChange(list.concat([blankParamRow()]))}>
                {addLabel}
              </button>
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  )
}
