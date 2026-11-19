// BodyEditor — 请求体编辑器（Apifox Body 页签：类型下拉 + 按类型切换编辑形态）
// 受控组件：value = { type, content, fields }；任何改动都以「完整 value」回抛 onChange，
// 切类型只改 type，不清空用户已填的 content / fields（Apifox 切回来内容还在）。
// 纪律：不写颜色/字号字面量（走 .pp-* 类与 token）；类名只用已存在的 .pp-* 与 .pp-body-*。
import { EmptyState } from './EmptyState.jsx'
import { ParamTable } from './ParamTable.jsx'
import { JsonEditor } from './JsonEditor.jsx'

/** Body 七种类型（Apifox Body 页签下拉口径，顺序即下拉顺序）。 */
export const BODY_TYPES = [
  { id: 'none', label: 'none' },
  { id: 'form', label: 'form-data' },
  { id: 'urlencoded', label: 'x-www-form-urlencoded' },
  { id: 'json', label: 'json' },
  { id: 'xml', label: 'xml' },
  { id: 'raw', label: 'raw' },
  { id: 'graphql', label: 'GraphQL' },
]

/** 键值表列：与 debug 页其它参数组同一套列定义（操作列由 ParamTable 自己追加）。 */
export const BODY_FIELD_COLUMNS = ['enabled', 'key', 'type', 'value', 'description']

/** 走键值表的两种类型，其余类型走文本编辑。 */
const TABLE_TYPES = ['form', 'urlencoded']

/** 文本编辑占位符：按类型给最小示例，避免四种类型共用 '{}' 误导用户。 */
const PLACEHOLDER = {
  json: '{\n  "key": "value"\n}',
  xml: '<root>\n  <item>value</item>\n</root>',
  raw: '原始文本',
  graphql: 'query {\n  field\n}',
}

/** 归一化 value：缺字段按 none / 空串 / 空数组补齐；非法 type 回落 none（不让脏数据打崩页面）。 */
function normalize(value) {
  const src = value && typeof value === 'object' ? value : {}
  const type = BODY_TYPES.some((t) => t.id === src.type) ? src.type : 'none'
  return {
    type,
    content: src.content == null ? '' : String(src.content),
    fields: Array.isArray(src.fields) ? src.fields : [],
  }
}

/**
 * @param value    { type, content, fields }
 * @param onChange (next) => void，next 恒为完整 value
 */
export function BodyEditor({ value, onChange }) {
  const body = normalize(value)
  // 任何分支都回抛完整 value：调用方直接存盘即可，不用自己拼字段。
  const emit = (patch) => {
    if (typeof onChange === 'function') onChange({ ...body, ...patch })
  }
  const isTable = TABLE_TYPES.indexOf(body.type) >= 0

  return (
    <div>
      <div className="pp-body-head">
        <label className="pp-form-label">类型</label>
        <select
          className="pp-select pp-input-sm"
          value={body.type}
          onChange={(e) => emit({ type: e.target.value })}
        >
          {BODY_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>
      {body.type === 'none' ? (
        <EmptyState text="无请求体" hint="Body 类型选 none 时不发送请求体" />
      ) : isTable ? (
        <div className="pp-table-wrap">
          <ParamTable
            rows={body.fields}
            columns={BODY_FIELD_COLUMNS}
            onChange={(rows) => emit({ fields: rows })}
            emptyText="无表单字段"
            addLabel="+ 添加字段"
          />
        </div>
      ) : (
        <JsonEditor
          value={body.content}
          rows={10}
          placeholder={PLACEHOLDER[body.type] || ''}
          onChange={(next) => emit({ content: next })}
        />
      )}
    </div>
  )
}
