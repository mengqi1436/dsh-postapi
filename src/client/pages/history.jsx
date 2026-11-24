// history.jsx — 请求历史页（对齐 Apifox 2.8.55 async_http_request_history：历史表 + 状态胶囊 + 详情抽屉）
// 自注册：模块求值期入队 __postapiQueue
// 数据：api.storage.listProjects / getProject / getHistory / clearHistory
// Apifox 取证（.research/apifox/app/dist/renderer/17888.b25d262e.async.js + async_http_request_history.f1b86d50.css）：
//   历史是一张等高表格（时间 / 方法 / 名称 / URL / 状态 / 耗时 / 大小），点行开右侧详情；
//   状态用胶囊三档（2xx 绿 / 4xx 橙 / 其余红），清空是危险动作需二次确认。
// 视觉基线：docs/apifox-visual-parity-spec.md —— .pp-table / .pp-pill（三档）/ .pp-meta / .pp-pane
import React, { useEffect, useRef, useState } from 'react'
import { applyTheme } from './theme.js'
import { EmptyState } from './components/EmptyState.jsx'

;(window.__postapiQueue = window.__postapiQueue || []).push(['history', HistoryPage]) // 注册表就绪前入队

const REPLAY_KEY = 'postapi.debug.replay'

// 文件内 mock：仅在 api.storage 缺失时渲染结构示例
const MOCK_ENTRIES = [
  {
    id: 'his_sample01', at: '2026-11-17T10:20:11.000Z', method: 'GET', url: 'http://127.0.0.1:8080/api/v1/orders?page=1',
    status: 200, timeMs: 42, bodySize: 512,
    request: { method: 'GET', url: '/api/v1/orders', headers: [{ key: 'Accept', value: 'application/json' }], body: '' },
    response: { status: 200, headers: { 'content-type': 'application/json' }, body: '{\n  "code": 0\n}' },
  },
  {
    id: 'his_sample02', at: '2026-11-17T09:05:03.000Z', method: 'POST', url: 'http://127.0.0.1:8080/api/v1/orders',
    status: 500, timeMs: 918, bodySize: 128,
    request: { method: 'POST', url: '/api/v1/orders', headers: [{ key: 'Content-Type', value: 'application/json' }], body: '{"skuId":"SKU-1001"}' },
    response: { status: 500, headers: { 'content-type': 'application/json' }, body: '{\n  "error": "internal"\n}' },
  },
]

/** 时间格式化 yyyy-MM-dd HH:mm:ss。 */
export function fmtDateTime(iso) {
  if (!iso) return '-'
  return String(iso).slice(0, 19).replace('T', ' ')
}

/** 字节数人性化（B/KB/MB）。 */
export function fmtSize(bytes) {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n < 0) return '-'
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / (1024 * 1024)).toFixed(1) + ' MB'
}

/** 状态码分组：2xx success / 4xx warning / 其他 error（页面胶囊着色用）。 */
export function statusTone(status) {
  const s = Number(status)
  if (s >= 200 && s < 300) return 'success'
  if (s >= 400 && s < 500) return 'warning'
  return 'error'
}

/** 胶囊类名：三档状态色映射到 .pp-pill-ok / -warn / -bad（Apifox 胶囊无底色，仅同色边框文字）。 */
export function pillClass(tone) {
  if (tone === 'success') return 'pp-pill pp-pill-ok'
  if (tone === 'warning') return 'pp-pill pp-pill-warn'
  return 'pp-pill pp-pill-bad'
}

/** 回放载荷：把历史条目折算成 debug 页可用的请求快照。 */
export function replayPayload(entry) {
  const req = (entry && entry.request) || {}
  return {
    method: req.method || (entry && entry.method) || 'GET',
    url: req.url || (entry && entry.url) || '',
    headers: Array.isArray(req.headers) ? req.headers : [],
    body: typeof req.body === 'string' ? req.body : '',
  }
}

/** 方法分组过滤（Apifox 历史列表顶部的方法筛选）。 */
export function matchesMethod(entry, method) {
  if (!method) return true
  return String((entry && entry.method) || '').toUpperCase() === String(method).toUpperCase()
}

function errText(err) {
  return err && err.message ? err.message : String(err)
}

const METHODS = ['', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH']

export function HistoryPage(props) {
  const rootRef = useRef(null)
  const api = (props && props.api) || (typeof window !== 'undefined' ? window.__postapiApi : undefined)
  const storage = api && api.storage
  // 默认态：项目列表为空、当前项目为空
  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  const [entries, setEntries] = useState([])
  const [isMock, setIsMock] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [detailId, setDetailId] = useState('')
  const [pendingClear, setPendingClear] = useState(false)
  const [method, setMethod] = useState('')

  useEffect(() => { applyTheme(rootRef.current) }, [])

  const applyMock = () => {
    setIsMock(true)
    setProjects([{ id: 'history_sample_project', name: '示例项目' }])
    setEntries(MOCK_ENTRIES)
  }

  const load = async (id) => {
    if (!storage || typeof storage.getHistory !== 'function') { applyMock(); return }
    if (!id) { setEntries([]); return }
    try {
      const res = await storage.getHistory(id)
      const list = res && Array.isArray(res.entries) ? res.entries : []
      setEntries(list)
      setIsMock(false)
      setError('')
    } catch (err) {
      setError('加载历史失败：' + errText(err))
    }
  }

  useEffect(() => {
    const boot = async () => {
      if (!storage || typeof storage.listProjects !== 'function') { applyMock(); return }
      try {
        const list = await storage.listProjects()
        if (Array.isArray(list) && list.length > 0) {
          setProjects(list)
          setProjectId(list[0].id)
          await load(list[0].id)
          return
        }
        setIsMock(false)
      } catch (err) {
        setError('加载项目列表失败：' + errText(err))
      }
    }
    boot()
  }, [])

  // 行点击回填调试页：写回放快照后跳转（Apifox 点历史行即重开该请求）
  const replay = (entry) => {
    try {
      localStorage.setItem(REPLAY_KEY, JSON.stringify(replayPayload(entry)))
      setNotice('已写入回放快照（' + REPLAY_KEY + '），切到调试页后按此快照重发')
    } catch (err) {
      setError('写入回放快照失败：' + errText(err))
      return
    }
    window.location.hash = '#/debug'
  }

  // 两段式清空（不使用弹窗确认）
  const clear = async () => {
    if (!pendingClear) {
      setPendingClear(true)
      setNotice('再次点击「确认清空」将删除当前项目全部历史')
      return
    }
    if (!storage || typeof storage.clearHistory !== 'function') {
      setError('当前桥未提供 api.storage.clearHistory（契约 §3）')
      return
    }
    setPendingClear(false)
    setError('')
    try {
      const res = await storage.clearHistory(projectId)
      setNotice('已清空历史：' + ((res && res.cleared) || 0) + ' 条')
      setDetailId('')
      await load(projectId)
    } catch (err) {
      setError('清空历史失败：' + errText(err))
    }
  }

  const rows = entries.filter((e) => matchesMethod(e, method))
  const detail = entries.find((e) => e.id === detailId)

  return (
    <div className="pp-scope pp-page" data-page="history" ref={rootRef}>
      <div className="pp-overview-head">
        <span className="pp-overview-title">请求历史</span>
        <div className="pp-overview-actions">
          <label className="pp-meta">项目</label>
          <select className="pp-select" value={projectId}
            onChange={(e) => { const v = e.target.value; setProjectId(v); load(v) }}>
            <option value="">{projects.length ? '请选择项目' : '暂无项目'}</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
          </select>
          <button className="pp-btn" onClick={() => load(projectId)}>刷新</button>
          <button className="pp-btn pp-btn-danger" onClick={clear}>{pendingClear ? '确认清空' : '清空历史'}</button>
        </div>
      </div>
      <div className="pp-overview-content">
        <div className="pp-toolbar">
          <span className="pp-meta">
            {isMock
              ? '示例数据 — api.storage.getHistory 不可用，以下为文件内 mock'
              : '数据来源：api.storage（getHistory / clearHistory）'}
          </span>
          <span className="pp-toolbar-spacer" />
          <label className="pp-meta">方法</label>
          <select className="pp-select pp-input-sm" value={method} onChange={(e) => setMethod(e.target.value)}>
            {METHODS.map((m) => <option key={m || 'all'} value={m}>{m || '全部'}</option>)}
          </select>
          <span className="pp-meta">{rows.length} / {entries.length} 条</span>
        </div>
        {error ? <div className="pp-note pp-note-bad">{error}</div> : null}
        {notice ? <div className="pp-note pp-note-ok">{notice}</div> : null}

        <div className="pp-card">
          <div className="pp-table-wrap">
            <table className="pp-table">
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>时间</th>
                  <th style={{ width: '80px' }}>方法</th>
                  <th>URL</th>
                  <th style={{ width: '70px' }}>状态</th>
                  <th style={{ width: '80px' }}>耗时</th>
                  <th style={{ width: '90px' }}>大小</th>
                  <th style={{ width: '110px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} data-active={detailId === e.id ? 'true' : 'false'}
                    onClick={() => setDetailId(detailId === e.id ? '' : e.id)}>
                    <td className="pp-meta">{fmtDateTime(e.at)}</td>
                    <td><span className="pp-method" data-method={e.method}>{e.method}</span></td>
                    <td className="pp-table-mono pp-ellipsis">{e.url}</td>
                    <td><span className={pillClass(statusTone(e.status))}>{e.status}</span></td>
                    <td className="pp-meta">{e.timeMs} ms</td>
                    <td className="pp-meta">{fmtSize(e.bodySize)}</td>
                    <td>
                      <button className="pp-btn pp-btn-sm" onClick={(ev) => { if (ev && ev.stopPropagation) ev.stopPropagation(); setDetailId(detailId === e.id ? '' : e.id) }}>详情</button>{' '}
                      <button className="pp-btn pp-btn-sm" onClick={(ev) => { if (ev && ev.stopPropagation) ev.stopPropagation(); replay(e) }}>回放</button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr><td colSpan={7} className="pp-muted">暂无历史记录，在调试页发送请求后自动记录</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {detail ? (
          <div className="pp-pane" style={{ marginTop: 'var(--sp-3)' }}>
            <div className="pp-card-title">详情 · {detail.id}</div>
            <div className="pp-toolbar-inline">
              <span className="pp-meta">状态</span>
              <span className={pillClass(statusTone(detail.status))}>{detail.status}</span>
              <span className="pp-meta">耗时 {detail.timeMs} ms</span>
              <span className="pp-meta">大小 {fmtSize(detail.bodySize)}</span>
              <span className="pp-toolbar-spacer" />
              <button className="pp-btn pp-btn-sm" onClick={() => replay(detail)}>回填到调试页</button>
            </div>
            <div className="pp-meta" style={{ marginTop: 'var(--sp-2)' }}>请求</div>
            <pre className="pp-pre pp-pre-scroll">{JSON.stringify(detail.request || {}, null, 2)}</pre>
            <div className="pp-meta" style={{ marginTop: 'var(--sp-2)' }}>响应</div>
            <pre className="pp-pre pp-pre-scroll">{JSON.stringify(detail.response || {}, null, 2)}</pre>
          </div>
        ) : (
          <div style={{ marginTop: 'var(--sp-3)' }}>
            <EmptyState text="选中一行查看请求与响应详情" hint="点表格任意一行，或在「操作」列点「详情」" />
          </div>
        )}
      </div>
    </div>
  )
}
