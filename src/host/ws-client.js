/**
 * WebSocket 调试客户端（feature-matrix 域 3：WebSocket 由 P2 占位提升为 P1 真实现）。
 * 连接注册表：open 建立连接并等待握手结果，send 发文本/二进制消息，messages 取消息日志，
 * close 断开单连接，closeAll 供插件卸载收尾。消息日志上限 MAX_MESSAGES，超出丢最旧。
 * 连接用 Node 全局 WebSocket（undici，支持 { headers } 扩展传入握手头，如 Authorization）。
 */
import { createVariableResolver } from './variables.js'

const MAX_MESSAGES = 200
const DEFAULT_TIMEOUT_MS = 30000

/** header 数组 [{key,value,enabled}] / 对象 → 握手头对象。 */
function headersToObject(input) {
  const out = {}
  if (Array.isArray(input)) {
    for (const item of input) {
      if (!item || item.enabled === false) continue
      const key = item.key == null ? '' : String(item.key)
      if (key === '') continue
      out[key] = item.value == null ? '' : String(item.value)
    }
  } else if (input && typeof input === 'object') {
    for (const [k, v] of Object.entries(input)) if (v != null) out[k] = String(v)
  }
  return out
}

/** http(s) → ws(s) 归一：Apifox 允许粘 http 地址调 WS。 */
function normalizeWsUrl(url) {
  return String(url || '')
    .replace(/^https:\/\//i, 'wss://')
    .replace(/^http:\/\//i, 'ws://')
}

function nowIso() { return new Date().toISOString() }

/** 二进制帧转 base64 文本入日志（文本帧原样）。 */
function frameText(ev) {
  if (typeof ev.data === 'string') return { data: ev.data, binary: false }
  const bytes = ev.data instanceof ArrayBuffer
    ? new Uint8Array(ev.data)
    : (ev.data && ev.data.buffer ? new Uint8Array(ev.data.buffer, ev.data.byteOffset, ev.data.byteLength) : null)
  return { data: bytes ? Buffer.from(bytes).toString('base64') : '', binary: true }
}

export function createWsClient() {
  const conns = new Map()

  function pushLog(conn, entry) {
    conn.messages.push(entry)
    if (conn.messages.length > MAX_MESSAGES) conn.messages.splice(0, conn.messages.length - MAX_MESSAGES)
  }

  function snapshot(conn) {
    return {
      id: conn.id,
      url: conn.url,
      status: conn.status,
      openedAt: conn.openedAt,
      closedAt: conn.closedAt || null,
      messages: conn.messages.slice(),
    }
  }

  return {
    /**
     * open({ url, headers, params, auth, variables, timeoutMs=30000 })
     * → { id, url, status, openedAt, messages }；握手失败/超时附 error 字段，不抛出。
     * 变量替换与认证注入语义对齐 request.send（{{}}/{{$dynamic}} → 前置 auth → 握手）。
     */
    async open(options = {}) {
      const { auth, variables, timeoutMs = DEFAULT_TIMEOUT_MS } = options || {}
      let url = normalizeWsUrl(options && options.url)
      if (url === '') return { id: '', url: '', status: 'error', messages: [], error: { kind: 'client', message: 'open: url is required' } }

      // 变量替换（{{key}} / {{$dynamic}}）：URL 与握手头同一套 resolver；未定义保留原文
      const resolver = variables && typeof variables === 'object'
        ? createVariableResolver({
            globals: variables.globals,
            environment: variables.environment,
            local: variables.local,
          })
        : null
      const R = (v) => (resolver ? resolver.resolve(v == null ? '' : String(v)) : v)
      url = R(url)
      const headerMap = headersToObject(options && options.headers)
      for (const k of Object.keys(headerMap)) headerMap[k] = R(headerMap[k])
      // params 追加为握手 URL 的 query（与 HTTP 语义一致）
      for (const p of Array.isArray(options && options.params) ? options.params : []) {
        if (!p || p.enabled === false || p.key == null || p.key === '') continue
        url += (url.indexOf('?') >= 0 ? '&' : '?') + encodeURIComponent(String(p.key)) + '=' + encodeURIComponent(R(p.value))
      }
      // 认证注入（对齐 request.js：bearer/basic/apikey）
      const authValue = auth && typeof auth === 'object' ? auth : null
      if (authValue && authValue.type === 'bearer' && authValue.token) {
        headerMap.Authorization = `Bearer ${R(authValue.token)}`
      } else if (authValue && authValue.type === 'basic') {
        headerMap.Authorization = `Basic ${Buffer.from(`${R(authValue.username) || ''}:${R(authValue.password) || ''}`).toString('base64')}`
      } else if (authValue && authValue.type === 'apikey' && authValue.key) {
        const addTo = String(authValue.addTo || 'header')
        if (addTo === 'query') {
          url += (url.indexOf('?') >= 0 ? '&' : '?') + encodeURIComponent(String(authValue.key)) + '=' + encodeURIComponent(R(authValue.value))
        } else {
          headerMap[String(authValue.key)] = R(authValue.value)
        }
      }

      const conn = {
        id: 'ws_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        url,
        status: 'connecting',
        messages: [],
        openedAt: nowIso(),
        closedAt: null,
      }
      // 握手开始即登记：失败连接也留档，send/messages/close 才能命中；close 时移除
      conns.set(conn.id, conn)
      return new Promise((resolve) => {
        let settled = false
        let ws
        const finish = (extra) => {
          if (settled) return
          settled = true
          clearTimeout(timer)
          resolve({ ...snapshot(conn), ...(extra || {}) })
        }
        let timer
        try {
          ws = new WebSocket(url, { headers: headerMap })
        } catch (err) {
          conn.status = 'error'
          conn.closedAt = nowIso()
          finish({ error: { kind: 'client', message: err && err.message ? err.message : String(err) } })
          return
        }
        conn.ws = ws
        timer = setTimeout(() => {
          try { ws.close() } catch { /* 已关则忽略 */ }
          conn.status = 'error'
          conn.closedAt = nowIso()
          pushLog(conn, { direction: 'system', at: nowIso(), event: 'timeout' })
          finish({ error: { kind: 'timeout', message: `connect timeout after ${timeoutMs}ms` } })
        }, Math.max(1000, Number(timeoutMs) || DEFAULT_TIMEOUT_MS))
        ws.onopen = () => {
          conn.status = 'open'
          pushLog(conn, { direction: 'system', at: nowIso(), event: 'open' })
          finish()
        }
        ws.onmessage = (ev) => pushLog(conn, { direction: 'in', at: nowIso(), ...frameText(ev) })
        ws.onerror = () => {
          // error 后必然跟 close：等 close 带出握手失败码
          pushLog(conn, { direction: 'system', at: nowIso(), event: 'error' })
        }
        ws.onclose = (ev) => {
          const wasOpen = conn.status === 'open'
          conn.status = 'closed'
          conn.closedAt = nowIso()
          pushLog(conn, { direction: 'system', at: nowIso(), event: 'close', code: ev.code, reason: ev.reason || '' })
          if (wasOpen) {
            // 已交付过的连接：静默落 closed，不再补 error
            return
          }
          finish({ error: { kind: 'network', message: `handshake failed (code ${ev.code}${ev.reason ? ' ' + ev.reason : ''})` } })
        }
      })
    },

    /** send({ id, message })：仅 status=open 可发；返回最新快照，失败附 error 不抛出。 */
    async send({ id, message } = {}) {
      const conn = conns.get(String(id || ''))
      if (!conn) return { ok: false, error: { kind: 'client', message: 'connection not found: ' + id } }
      if (conn.status !== 'open' || !conn.ws || conn.ws.readyState !== 1) {
        return { ok: false, ...snapshot(conn), error: { kind: 'client', message: 'connection is not open (status ' + conn.status + ')' } }
      }
      const text = message == null ? '' : String(message)
      try {
        conn.ws.send(text)
        pushLog(conn, { direction: 'out', at: nowIso(), data: text, binary: false })
        return { ok: true, ...snapshot(conn) }
      } catch (err) {
        return { ok: false, ...snapshot(conn), error: { kind: 'network', message: err && err.message ? err.message : String(err) } }
      }
    },

    /** messages({ id, since=0 })：按日志下标增量取（since 为上次返回的 lastIndex）。 */
    async messages({ id, since } = {}) {
      const conn = conns.get(String(id || ''))
      if (!conn) return { ok: false, error: { kind: 'client', message: 'connection not found: ' + id } }
      const from = Number.isFinite(since) && since >= 0 ? Math.floor(since) : 0
      const all = conn.messages
      return { ok: true, ...snapshot(conn), lastIndex: all.length, messages: all.slice(from) }
    },

    /** close({ id, code=1000, reason='' })：已关/不存在均幂等返回快照。 */
    async close({ id, code = 1000, reason = '' } = {}) {
      const conn = conns.get(String(id || ''))
      if (!conn) return { ok: false, error: { kind: 'client', message: 'connection not found: ' + id } }
      try {
        if (conn.ws && conn.ws.readyState <= 1) conn.ws.close(Number(code) || 1000, String(reason || ''))
      } catch { /* 已关则忽略 */ }
      conns.delete(String(id))
      return { ok: true, ...snapshot(conn) }
    },

    /** closeAll()：插件卸载收尾，断开全部连接。 */
    async closeAll() {
      const ids = [...conns.keys()]
      for (const id of ids) {
        const conn = conns.get(id)
        try {
          if (conn && conn.ws && conn.ws.readyState <= 1) conn.ws.close(1000, 'plugin unload')
        } catch { /* 已关则忽略 */ }
        conns.delete(id)
      }
      return { closed: ids.length }
    },
  }
}
