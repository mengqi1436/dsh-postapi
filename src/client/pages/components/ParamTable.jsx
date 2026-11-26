// ParamTable — 参数表（doc 页只读展示 / debug 页可编辑，四组参数共用一套列定义）
// Apifox 规格：固定列宽 + table-layout:fixed，横向滚动由调用方的 .pp-table-wrap 承担，
// 窄容器里是整体滚动而不是列被压塌；单元格内编辑用无边框 .pp-cell-input，聚焦才显边框。
// 可选 suggest（query => [{ key, value, description }]）：key 列挂 <datalist> 常用建议，
// 选中建议时把该条的 value / description 回填到本行空字段；suggest 缺省时渲染与原行为完全一致。
import { useState } from 'react'
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

/* ---------------- 常用建议（suggest）辅助 ---------------- */

/** datalist id 自增序号：每张表一个稳定唯一 id。用模块级计数器而不是随机数——
 *  随机数会让每次渲染 id 变化，input 的 list 关联随之失效。 */
let suggestSeq = 0

function nextSuggestId() {
  suggestSeq += 1
  return 'pp-param-suggest-' + suggestSeq
}

/** 空值判定：null / undefined / 空串都算「用户还没填」。 */
function isBlank(v) {
  return v == null || v === ''
}

/** 取建议清单：suggest 缺省、返回非数组或抛错一律按「无建议」处理，
 *  建议源有问题也不能把表格本身带崩。 */
function collectSuggestions(suggest, query) {
  if (typeof suggest !== 'function') return []
  try {
    const items = suggest(query)
    if (!Array.isArray(items)) return []
    return items.filter((it) => it && !isBlank(it.key))
  } catch {
    return []
  }
}

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

function renderCell(col, row, index, editable, patch, ctx) {
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
    // 只读态与可编辑态口径一致：type 空值按 string 展示（Apifox 从不显示裸 '-'），其它列仍用 '-'。
    const blank = value == null || value === ''
    const text = blank ? (col === 'type' ? 'string' : '-') : String(value)
    return <span className={meta.mono ? 'pp-table-mono' : undefined}>{text}</span>
  }
  if (col === 'key' && ctx) {
    // key 列挂 datalist：浏览器原生下拉列出常用建议，选中后由 ctx.onKeyChange 回填。
    return (
      <input
        className={'pp-cell-input pp-input-sm' + (meta.mono ? ' pp-input-mono' : '')}
        list={ctx.suggestId}
        value={value == null ? '' : String(value)}
        onChange={(e) => ctx.onKeyChange(index, e.target.value)}
      />
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
  suggest,
}) {
  const list = Array.isArray(rows) ? rows : []
  const editable = !readOnly && typeof onChange === 'function'
  const hasSuggest = editable && typeof suggest === 'function'
  // 每张表一个稳定 datalist id：首次渲染定下来，后续渲染不变（useState 惰性初始化）。
  const [suggestId] = useState(nextSuggestId)

  /** 单字段或整行补丁：value 传对象时按多字段合并。 */
  const patch = (index, field, value) => {
    const next = list.slice()
    const fields = field && typeof field === 'object' ? field : { [field]: value }
    next[index] = { ...next[index], ...fields }
    onChange(next)
  }

  /**
   * key 列输入：先写 key；若输入值恰好等于某条建议的 key，则把该条的 value / description
   * 一并回填——只填空字段，用户已经填过的内容一律保留。
   */
  const onKeyChange = (index, value) => {
    const row = list[index] || {}
    const hit = collectSuggestions(suggest, value).find((it) => it.key === value)
    if (!hit) {
      patch(index, 'key', value)
      return
    }
    const fill = { key: value }
    if (isBlank(row.value) && !isBlank(hit.value)) fill.value = hit.value
    if (isBlank(row.description) && !isBlank(hit.description)) fill.description = hit.description
    patch(index, fill)
  }

  const cellCtx = hasSuggest ? { suggestId, onKeyChange } : undefined
  const remove = (index) => {
    const next = list.slice()
    next.splice(index, 1)
    onChange(next)
  }

  if (list.length === 0 && !editable) return <EmptyState text={emptyText} hint={emptyHint} />

  // datalist：option 的 value 是建议 key，label 用 description（浏览器下拉里显示为副标题）。
  const datalist = hasSuggest
    ? <datalist id={suggestId}>
        {collectSuggestions(suggest, '').map((it, i) => (
          <option key={it.key + '-' + i} value={it.key} label={it.description || undefined} />
        ))}
      </datalist>
    : null

  // datalist 不能是 <table> 的直接子元素（HTML 嵌套规则，React validateDOMNesting 会报红）：
  // 有建议下拉时用 Fragment 让 datalist 与 table 成兄弟节点（inputs 靠 list={suggestId} 引用）；
  // 无建议时保持裸 table 作为根（历史契约：根节点即 .pp-table）。
  const tableEl = (
    <table className="pp-table pp-table-params" data-param-table style={{ minWidth: tableMinWidth(columns, editable) }}>
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
              <td key={col} data-col={col}>{renderCell(col, row, index, editable, patch, cellCtx)}</td>
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
  return hasSuggest ? (
    <>
      {datalist}
      {tableEl}
    </>
  ) : tableEl
}