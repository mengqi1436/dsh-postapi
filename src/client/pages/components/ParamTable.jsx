// ParamTable — 参数表（doc 页只读展示 / debug 页可编辑，四组参数共用一套列定义）
// Apifox 规格：固定列宽 + table-layout:fixed，横向滚动由调用方的 .pp-table-wrap 承担，
// 窄容器里是整体滚动而不是列被压塌；单元格内编辑用无边框 .pp-cell-input，聚焦才显边框。
import { EmptyState } from './EmptyState.jsx'

/** 列定义：width 写死（description 吃剩余宽度，最小 160px 由 design-tokens.css 表格段兜住）。 */
export const COLUMN_META = {
  enabled: { title: '启用', width: '44px' },
  key: { title: '参数', width: '150px', mono: true },
  type: { title: '类型', width: '96px' },
  required: { title: '必填', width: '52px' },
  value: { title: '示例值', width: '140px', mono: true },
  description: { title: '描述', width: 'auto' },
}

/** 参数类型选项（Apifox 同一套）。 */
export const PARAM_TYPES = ['string', 'integer', 'number', 'boolean', 'array', 'object']

/** 参数表默认列：debug 页与 doc 页共用；操作列由组件按可编辑态追加，不计入 columns。 */
export const DEFAULT_COLUMNS = ['enabled', 'key', 'type', 'required', 'value', 'description']

/** 新增行模板（契约 §2 endpoint.params 行结构）。 */
export function blankParamRow() {
  return { key: '', value: '', enabled: true, type: 'string', required: false, description: '' }
}

/** description 列吃剩余宽度，最小 160px（fixed 布局下由 min-width 兜住）。 */
const DESC_MIN_WIDTH = 120
const OP_WIDTH = 52

function headStyle(col) {
  const meta = COLUMN_META[col]
  return meta && meta.width && meta.width !== 'auto' ? { width: meta.width } : undefined
}

/** 列宽合计 = 表格最小宽度：窄容器里整表横向滚动，列不被压缩。 */
export function tableMinWidth(columns, editable) {
  let total = editable ? OP_WIDTH : 0
  for (const col of columns) {
    const meta = COLUMN_META[col]
    total += meta && meta.width && meta.width !== 'auto' ? parseInt(meta.width, 10) : DESC_MIN_WIDTH
  }
  return total
}

function renderCell(col, row, index, editable, patch) {
  const meta = COLUMN_META[col] || {}
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
    return (
      <span className={meta.mono ? 'pp-table-mono' : undefined}>
        {value == null || value === '' ? '-' : String(value)}
      </span>
    )
  }
  if (col === 'type') {
    return (
      <select
        className="pp-cell-input pp-input-sm"
        value={value || 'string'}
        onChange={(e) => patch(index, col, e.target.value)}
      >
        {PARAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
    )
  }
  return (
    <input
      className={'pp-cell-input pp-input-sm' + (meta.mono ? ' pp-input-mono' : '')}
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
  emptyHint = '',
  addLabel = '+ 添加参数',
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

  if (list.length === 0 && !editable) return <EmptyState text={emptyText} hint={emptyHint} />

  return (
    <table className="pp-table" data-param-table style={{ minWidth: tableMinWidth(columns, editable) }}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col} data-col={col} style={headStyle(col)}>
              {COLUMN_META[col] ? COLUMN_META[col].title : col}
            </th>
          ))}
          {editable ? <th data-col="op" style={{ width: OP_WIDTH }}>操作</th> : null}
        </tr>
      </thead>
      <tbody>
        {list.map((row, index) => (
          <tr key={index}>
            {columns.map((col) => (
              <td key={col} data-col={col}>{renderCell(col, row, index, editable, patch)}</td>
            ))}
            {editable ? (
              <td data-col="op">
                <button className="pp-btn pp-btn-sm pp-btn-ghost pp-btn-danger" onClick={() => remove(index)}>删除</button>
              </td>
            ) : null}
          </tr>
        ))}
        {editable ? (
          <tr>
            <td colSpan={columns.length + 1}>
              <button className="pp-btn pp-btn-sm pp-btn-ghost pp-table-add" onClick={() => onChange(list.concat([blankParamRow()]))}>
                {addLabel}
              </button>
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  )
}
