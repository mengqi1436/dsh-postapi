// AssertTable — 断言表（调试台「脚本」页签的一段：来源 / 路径 / 操作 / 期望值 / 说明 / 操作）
// 与 ParamTable 同口径：表格整体横向滚动交给外层 .pp-table-wrap，窄容器里不压塌列；
// 组件是纯受控渲染，任何增删改都把「完整新数组」回传给 onChange（不传 patch）。
// 常量与选项放在本文件，由 ScriptPanel 再导出，避免两个组件互相 import 形成环。

/** 断言来源：与 Apifox 的断言目标一致（状态码 / 响应体 / 响应头 / 耗时）。 */
export const ASSERT_SOURCES = ['status', 'body', 'header', 'time']

/** 断言操作符：eq / neq / gt / lt / contains / notContains / exists / notExists / regex。 */
export const ASSERT_OPS = ['eq', 'neq', 'gt', 'lt', 'contains', 'notContains', 'exists', 'notExists', 'regex']

/** 列定义：标题一处写死，表头与单元格共用；width 是该列的建议列宽（内联 th style，纯 layout）。
    来源/操作符下拉列收窄、路径吃百分比，让「期望值/说明」在窄容器首屏可见。 */
export const ASSERT_COLUMNS = [
  { field: 'source', title: '来源', width: 88 },
  { field: 'path', title: '路径', mono: true, width: '20%' },
  { field: 'op', title: '操作符', width: 96 },
  { field: 'value', title: '期望值', mono: true },
  { field: 'message', title: '说明' },
]

/** 新增断言行模板：默认断言状态码等于某值，用户只需要填期望值。 */
export function blankAssertRow() {
  return { source: 'status', path: '', op: 'eq', value: '', message: '' }
}

/** 单元格输入框类名：表格内编辑无边框，聚焦才显边框（与 ParamTable 的 .pp-cell-input 一致）。 */
function cellInputClass(mono) {
  return 'pp-cell-input pp-input-sm' + (mono ? ' pp-input-mono' : '')
}

function renderCell(row, column, index, patch) {
  const value = row ? row[column.field] : undefined
  const text = value == null ? '' : String(value)

  if (column.field === 'source') {
    return (
      <select className="pp-cell-input pp-input-sm" value={text || ASSERT_SOURCES[0]}
        onChange={(e) => patch(index, column.field, e.target.value)}>
        {ASSERT_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    )
  }
  if (column.field === 'op') {
    return (
      <select className="pp-cell-input pp-input-sm" value={text || ASSERT_OPS[0]}
        onChange={(e) => patch(index, column.field, e.target.value)}>
        {ASSERT_OPS.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }
  return (
    <input
      className={cellInputClass(column.mono)}
      value={text}
      onChange={(e) => patch(index, column.field, e.target.value)}
    />
  )
}

/**
 * @param rows     断言行数组，缺省按空表处理
 * @param onChange 收到完整新数组（增行 / 删行 / 改字段都是整表回传）
 */
export function AssertTable({ rows, onChange }) {
  const list = Array.isArray(rows) ? rows : []
  const emit = (next) => {
    if (typeof onChange === 'function') onChange(next)
  }

  /** 单字段改动：整表浅拷贝后替换本行，保持 onChange 的「完整数组」语义。 */
  const patch = (index, field, value) => {
    const next = list.slice()
    next[index] = { ...next[index], [field]: value }
    emit(next)
  }

  const remove = (index) => {
    const next = list.slice()
    next.splice(index, 1)
    emit(next)
  }

  const add = () => emit(list.concat([blankAssertRow()]))

  const colSpan = ASSERT_COLUMNS.length + 1

  return (
    <table className="pp-table pp-table-wide">
      <thead>
        <tr>
          {ASSERT_COLUMNS.map((column) => (
            <th key={column.field} data-col={column.field}
              style={column.width ? { width: column.width } : undefined}>{column.title}</th>
          ))}
          <th data-col="op-cell" style={{ width: '52px' }}>操作</th>
        </tr>
      </thead>
      <tbody>
        {list.length === 0 ? (
          <tr>
            <td colSpan={colSpan}>
              <div className="pp-meta">暂无断言</div>
            </td>
          </tr>
        ) : list.map((row, index) => (
          <tr key={index}>
            {ASSERT_COLUMNS.map((column) => (
              <td key={column.field} data-col={column.field}>{renderCell(row, column, index, patch)}</td>
            ))}
            <td data-col="op-cell">
              <button className="pp-btn pp-btn-sm pp-btn-ghost pp-btn-danger" onClick={() => remove(index)}>删除</button>
            </td>
          </tr>
        ))}
        <tr>
          <td colSpan={colSpan}>
            <button className="pp-btn pp-btn-sm pp-btn-ghost pp-table-add" onClick={add}>+ 添加断言</button>
          </td>
        </tr>
      </tbody>
    </table>
  )
}
