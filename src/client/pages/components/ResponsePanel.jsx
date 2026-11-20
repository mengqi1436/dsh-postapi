// ResponsePanel — 响应面板（Apifox 六页签：Body / Headers / Cookies / 实际请求 / 测试结果 / 控制台）
// resp 结构严格对齐 host request.send 返回值：
//   { status, statusText, headers, body, bodySize, timeMs, truncated?, error?,
//     request?: { method, url, headers, body }, tests?: [{ name, passed, error? }],
//     variables?, logs? }
// 纪律：类名只用 design-tokens.css 已定义的 .pp-*；颜色/字号/间距一律走 var(--*)；
// 复制失败只在页面内 .pp-note-bad 提示，不弹窗。
import { useState } from 'react'
import { EmptyState } from './EmptyState.jsx'
import { ParamTable } from './ParamTable.jsx'
import { StatusPill } from './StatusPill.jsx'

/** 六个页签，顺序即 Apifox 顺序。 */
export const RESPONSE_TABS = [
  { id: 'body', label: 'Body' },
  { id: 'headers', label: 'Headers' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'request', label: '实际请求' },
  { id: 'tests', label: '测试结果' },
  { id: 'logs', label: '控制台' },
]

/** 只有这两个页签的标题后面挂数量徽标（Apifox 同款）。 */
export const COUNTED_TABS = ['headers', 'tests']

/** 页签标题：Headers / 测试结果 带计数，如「Headers (8)」。 */
export function tabTitle(tab, counts) {
  const n = counts ? counts[tab.id] : undefined
  const counted = COUNTED_TABS.indexOf(tab.id) > -1 && typeof n === 'number'
  return counted ? tab.label + ' (' + n + ')' : tab.label
}

/** 任意值转展示文本：数组逐行（set-cookie 多值），对象 JSON，其余 String。 */
function textOf(v) {
  if (v == null) return ''
  if (Array.isArray(v)) return v.map(textOf).filter((s) => s !== '').join('\n')
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v)
    } catch {
      return String(v)
    }
  }
  return String(v)
}

/** 响应体原文。 */
export function bodyText(body) {
  return body == null ? '' : textOf(body)
}

/** 美化：JSON 解析成功则缩进两格，失败（或空体）回落原文。 */
export function prettyBody(body) {
  const text = bodyText(body)
  if (!text) return ''
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

/** 响应头/请求头对象 → ParamTable 行（值可能是数组，逐行展示）。 */
export function headersToRows(headers) {
  if (!headers || typeof headers !== 'object') return []
  const keys = Array.isArray(headers) ? headers.map((_, i) => String(i)) : Object.keys(headers)
  return keys.map((key) => ({ key, value: textOf(headers[key]) }))
}

/**
 * 从响应头里拆 set-cookie：键名大小写不敏感，值支持字符串或数组，
 * 每条按 ';' 拆成 name=value 与属性串。
 */
export function parseSetCookies(headers) {
  const raw = []
  if (headers && typeof headers === 'object') {
    for (const key of Object.keys(headers)) {
      if (key.toLowerCase() !== 'set-cookie') continue
      const value = headers[key]
      if (Array.isArray(value)) raw.push(...value.map(textOf))
      else if (value != null) raw.push(textOf(value))
    }
  }
  const rows = []
  for (const item of raw) {
    // 数组值可能已被 join 成多行，逐行再拆
    for (const line of String(item).split('\n')) {
      const seg = line.trim()
      if (!seg) continue
      const pieces = seg.split(';').map((s) => s.trim()).filter((s) => s !== '')
      const head = pieces.shift() || ''
      const eq = head.indexOf('=')
      rows.push({
        name: eq >= 0 ? head.slice(0, eq).trim() : head,
        value: eq >= 0 ? head.slice(eq + 1).trim() : '',
        attrs: pieces.join('; '),
      })
    }
  }
  return rows
}

/** 控制台日志：数组逐行，空行丢弃。 */
export function logsText(logs) {
  if (Array.isArray(logs)) return logs.map(textOf).filter((s) => s !== '').join('\n')
  return logs == null ? '' : textOf(logs)
}

function errText(err) {
  if (err == null) return ''
  if (typeof err === 'object' && err.message) return String(err.message)
  return String(err)
}

/** Cookies 三列表头（列宽写死，值/属性吃剩余宽度）。 */
const COOKIE_COLS = [
  { title: '名称', width: '180px' },
  { title: '值', width: '' },
  { title: '属性', width: '' },
]

export function ResponsePanel({ resp, sending = false, onCancel }) {
  const [tab, setTab] = useState('body')
  const [bodyView, setBodyView] = useState('pretty')
  const [copyError, setCopyError] = useState('')

  /** 复制响应体：只走 navigator.clipboard，失败写页面内提示（不弹窗）。 */
  const copyBody = () => {
    const clip = typeof navigator === 'undefined' || !navigator ? null : navigator.clipboard
    if (!clip || typeof clip.writeText !== 'function') {
      setCopyError('复制失败：当前环境不支持剪贴板')
      return
    }
    try {
      const result = clip.writeText(bodyText(resp ? resp.body : ''))
      if (result && typeof result.then === 'function') {
        result.then(() => setCopyError('')).catch((err) => setCopyError('复制失败：' + errText(err)))
      } else {
        setCopyError('')
      }
    } catch (err) {
      setCopyError('复制失败：' + errText(err))
    }
  }

  const sendingBar = sending ? (
    <div className="pp-resp-bar">
      <span className="pp-pill pp-pill-accent">发送中…</span>
      <button className="pp-btn pp-btn-sm" onClick={() => { if (typeof onCancel === 'function') onCancel() }}>取消</button>
    </div>
  ) : null

  if (!resp) {
    return (
      <div data-response-panel="">
        {sendingBar}
        {sending ? null : <EmptyState text="尚未发送请求" hint="填写 URL 后点「发送」" />}
      </div>
    )
  }

  const headerRows = headersToRows(resp.headers)
  const cookieRows = parseSetCookies(resp.headers)
  const testItems = Array.isArray(resp.tests) ? resp.tests : []
  const logText = logsText(resp.logs)
  const req = resp.request && typeof resp.request === 'object' ? resp.request : null
  const counts = { headers: headerRows.length, tests: testItems.length }
  const errorMsg = resp.error ? errText(resp.error) : ''

  const statusBar = (
    <div className="pp-resp-bar">
      <StatusPill status={resp.status} text={resp.statusText || ''} />
      <span className="pp-meta">{resp.timeMs == null ? '-' : resp.timeMs} ms</span>
      <span className="pp-meta">{resp.bodySize == null ? '-' : resp.bodySize} B</span>
      {resp.truncated ? <span className="pp-pill pp-pill-warn">已截断</span> : null}
      <button className="pp-btn pp-btn-sm" onClick={copyBody}>复制</button>
    </div>
  )

  let tabBody = null
  if (tab === 'body') {
    tabBody = (
      <div>
        <div className="pp-tabs pp-sub-tabs">
          <button className="pp-tab" data-active={bodyView === 'pretty'} onClick={() => setBodyView('pretty')}>美化</button>
          <button className="pp-tab" data-active={bodyView === 'raw'} onClick={() => setBodyView('raw')}>原文</button>
        </div>
        <pre className="pp-pre pp-pre-scroll" style={{ marginTop: 'var(--sp-2)' }}>
          {bodyView === 'pretty' ? prettyBody(resp.body) : bodyText(resp.body)}
        </pre>
      </div>
    )
  } else if (tab === 'headers') {
    tabBody = (
      <div className="pp-table-wrap">
        <ParamTable rows={headerRows} readOnly columns={['key', 'value']} emptyText="无响应头" />
      </div>
    )
  } else if (tab === 'cookies') {
    tabBody = cookieRows.length === 0 ? <EmptyState text="无 Cookies" /> : (
      <div className="pp-table-wrap">
        <table className="pp-table">
          <thead>
            <tr>
              {COOKIE_COLS.map((col) => (
                <th key={col.title} style={col.width ? { width: col.width } : undefined}>{col.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cookieRows.map((row, i) => (
              <tr key={i}>
                <td className="pp-table-mono">{row.name || '-'}</td>
                <td className="pp-table-mono">{row.value || '-'}</td>
                <td className="pp-muted">{row.attrs || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  } else if (tab === 'request') {
    tabBody = req ? (
      <div>
        <div className="pp-toolbar-inline">
          <span className="pp-method" data-method={String(req.method || 'GET').toUpperCase()}>
            {String(req.method || 'GET').toUpperCase()}
          </span>
          <span className="pp-mono pp-ellipsis" title={req.url || ''}>{req.url || '-'}</span>
        </div>
        <div className="pp-table-wrap" style={{ marginTop: 'var(--sp-2)' }}>
          <ParamTable rows={headersToRows(req.headers)} readOnly columns={['key', 'value']} emptyText="无请求头" />
        </div>
        {bodyText(req.body) ? (
          <pre className="pp-pre pp-pre-scroll" style={{ marginTop: 'var(--sp-2)' }}>{bodyText(req.body)}</pre>
        ) : null}
      </div>
    ) : <EmptyState text="无请求快照" />
  } else if (tab === 'tests') {
    tabBody = testItems.length === 0 ? <EmptyState text="无断言" /> : (
      <div className="pp-list">
        {testItems.map((item, i) => (
          <div className="pp-result-row" key={i}>
            <span className={item && item.passed ? 'pp-pill pp-pill-ok' : 'pp-pill pp-pill-bad'}>
              {item && item.passed ? '通过' : '失败'}
            </span>
            <span className="pp-ellipsis">{item && item.name ? String(item.name) : '-'}</span>
            {item && item.error ? <span className="pp-meta">{errText(item.error)}</span> : null}
          </div>
        ))}
      </div>
    )
  } else {
    tabBody = logText ? (
      <pre className="pp-pre pp-pre-scroll">{logText}</pre>
    ) : <EmptyState text="无日志" />
  }

  return (
    <div data-response-panel="">
      {sendingBar}
      {statusBar}
      {copyError ? <p className="pp-note pp-note-bad">{copyError}</p> : null}
      {errorMsg ? <p className="pp-note pp-note-bad">{errorMsg}</p> : (
        <div>
          <div className="pp-resp-tabs">
            {RESPONSE_TABS.map((t) => (
              <button key={t.id} className="pp-tab" data-active={tab === t.id} onClick={() => setTab(t.id)}>
                {tabTitle(t, counts)}
              </button>
            ))}
          </div>
          <div className="pp-debug-tabbody">{tabBody}</div>
        </div>
      )}
    </div>
  )
}
