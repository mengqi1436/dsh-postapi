// ScriptPanel — 调试台「脚本」页签：前置脚本 / 后置脚本 / 断言 / 等待时间
// 受控组件：value = { preScript, postScript, assertions, waitMs }。
// 任何一处改动都回传**完整新 value 对象**（debug.jsx 用 setDraft(prev => ({ ...prev, ...next }))
// 直接合并，所以这里不能传 patch）。
// 断言表抽在 AssertTable.jsx：ScriptPanel 内部复用它，同时对外导出常量供测试单独断言。
import { AssertTable, ASSERT_SOURCES, ASSERT_OPS } from './AssertTable.jsx'

export { ASSERT_SOURCES, ASSERT_OPS }

/** 空 value：缺字段时按此兜底，组件永远拿到四种字段齐全的对象。 */
export const EMPTY_SCRIPT_VALUE = { preScript: '', postScript: '', assertions: [], waitMs: 0 }

/** 归一化：外部数据可能缺字段或类型不对，统一收敛成契约形状。 */
function normalize(value) {
  const v = value || {}
  return {
    preScript: v.preScript == null ? '' : String(v.preScript),
    postScript: v.postScript == null ? '' : String(v.postScript),
    assertions: Array.isArray(v.assertions) ? v.assertions : [],
    waitMs: Number.isFinite(v.waitMs) ? v.waitMs : 0,
  }
}

/** 等待时间只收非负整数（输入框里粘贴带单位/字母的串也要能吃掉）。 */
function parseWait(text) {
  const digits = String(text == null ? '' : text).replace(/[^0-9]/g, '')
  return digits === '' ? 0 : Number(digits)
}

/**
 * @param value    当前值 { preScript, postScript, assertions, waitMs }
 * @param onChange 收到完整新 value 对象
 */
export function ScriptPanel({ value, onChange }) {
  const current = normalize(value)
  const emit = (next) => {
    if (typeof onChange === 'function') onChange({ ...current, ...next })
  }

  return (
    <div>
      <div className="pp-script-block">
        <div className="pp-group-head">
          <span className="pp-group-title">前置脚本</span>
        </div>
        <textarea
          className="pp-textarea pp-input-mono"
          rows={6}
          placeholder="// 请求发送前执行"
          value={current.preScript}
          onChange={(e) => emit({ preScript: e.target.value })}
        />
        <p className="pp-meta">可用 pm.request / pm.environment.set / console.log</p>
      </div>

      <div className="pp-script-block">
        <div className="pp-group-head">
          <span className="pp-group-title">后置脚本</span>
        </div>
        <textarea
          className="pp-textarea pp-input-mono"
          rows={6}
          placeholder="// 响应返回后执行"
          value={current.postScript}
          onChange={(e) => emit({ postScript: e.target.value })}
        />
        <p className="pp-meta">可用 pm.response / pm.test / pm.globals.set</p>
      </div>

      <div className="pp-script-block">
        <div className="pp-group-head">
          <span className="pp-group-title">断言</span>
        </div>
        <div className="pp-table-wrap">
          <AssertTable rows={current.assertions} onChange={(rows) => emit({ assertions: rows })} />
        </div>
      </div>

      <div className="pp-script-block">
        <div className="pp-group-head">
          <span className="pp-group-title">等待时间</span>
        </div>
        <div className="pp-form-row">
          <label className="pp-form-label" htmlFor="pp-wait-ms">等待</label>
          <input
            id="pp-wait-ms"
            className="pp-input pp-input-sm"
            type="number"
            min="0"
            step="100"
            value={String(current.waitMs)}
            onChange={(e) => emit({ waitMs: parseWait(e.target.value) })}
          />
          <span className="pp-meta">ms · 发送前等待</span>
        </div>
      </div>
    </div>
  )
}
