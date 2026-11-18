/**
 * 本地 Mock 服务：契约 §4 createMockServer。
 * 两种命中路径：GET /mock/<projectId>/<endpointId> 与 GET /mock/<projectId><endpointPath>。
 * body 由 project.mocks 的字段规则生成（fixed/regex/increment/random/template）；
 * 未命中规则回落 endpoint.responses 的默认响应，再回落 200 {}。
 */
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import { DYNAMIC_VARS } from './variables.js'

const TEMPLATE_RE = /\{\{\s*([^{}]+?)\s*\}\}/g

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randStr(len) {
  let out = ''
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < len; i += 1) out += alphabet[randInt(0, alphabet.length - 1)]
  return out
}

/** 模板规则：{{$timestamp}} 等动态变量即时替换，其它 {{key}} 原样保留。 */
function resolveTemplate(text) {
  return String(text).replace(TEMPLATE_RE, (raw, name) => {
    const key = String(name).trim()
    return typeof DYNAMIC_VARS[key] === 'function' ? String(DYNAMIC_VARS[key]()) : raw
  })
}

function randomBy(spec) {
  const s = String(spec == null ? '' : spec).trim()
  if (s === '') return randStr(8)
  if (s === 'number' || s === 'int') return String(randInt(0, 1000))
  if (s === 'float') return Math.random().toFixed(4)
  if (s === 'boolean' || s === 'bool') return Math.random() < 0.5 ? 'true' : 'false'
  if (s === 'uuid') return randomUUID()
  if (s === 'email') return `user_${randStr(6)}@example.com`
  if (s === 'phone') return `1${randInt(3, 9)}${String(randInt(0, 999999999)).padStart(9, '0')}`
  if (s === 'string') return randStr(8)
  const m = /^int:(-?\d+):(-?\d+)$/.exec(s)
  if (m) return String(randInt(Number(m[1]), Number(m[2])))
  return randStr(8)
}

function pickChar(token) {
  if (token.startsWith('[') && token.endsWith(']')) {
    const body = token.slice(1, -1)
    const range = /^(\w)-(\w)$/.exec(body)
    if (range) return String.fromCharCode(randInt(range[1].charCodeAt(0), range[2].charCodeAt(0)))
    const chars = body.replace(/\\/g, '')
    return chars === '' ? 'a' : chars[randInt(0, chars.length - 1)]
  }
  if (token === '\\d') return String(randInt(0, 9))
  if (token === '\\w') return randStr(1)
  if (token === '\\s') return ' '
  if (token === '.') return 'a'
  if (token.length === 2 && token[0] === '\\') return token[1]
  return token
}

/** 正则规则：把 [A-Z]{3}[0-9]{4} 这类字面正则展开成一个可匹配串。 */
function regexSample(pattern) {
  const p = String(pattern == null ? '' : pattern)
  let out = ''
  let i = 0
  while (i < p.length) {
    let token = ''
    if (p[i] === '[') {
      const end = p.indexOf(']', i)
      if (end < 0) {
        token = 'a'
        i += 1
      } else {
        token = p.slice(i, end + 1)
        i = end + 1
      }
    } else if (p[i] === '\\') {
      token = p.slice(i, i + 2)
      i += 2
    } else {
      token = p[i]
      i += 1
    }
    let min = 1
    let max = 1
    const q = /^(?:\{(\d+)(?:,(\d*))?\}|([*+?]))/.exec(p.slice(i))
    if (q) {
      i += q[0].length
      if (q[1] != null) {
        min = Number(q[1])
        max = q[2] == null || q[2] === '' ? min : Number(q[2])
      } else if (q[3] === '*') {
        min = 0
        max = 3
      } else if (q[3] === '+') {
        min = 1
        max = 3
      }
    }
    const n = randInt(min, Math.max(min, Math.min(max, 12)))
    out += pickChar(token).repeat(n)
  }
  return out
}

/** 规则值 → JS 值：能解析成 JSON 的按 JSON 走，否则保留字符串。 */
function coerce(text) {
  const s = String(text)
  const t = s.trim()
  if (t === '') return s
  if (!/^[[{"]|^-?\d+(\.\d+)?$|^(true|false|null)$/.test(t)) return s
  try {
    return JSON.parse(t)
  } catch {
    return s
  }
}

function ruleValue(rule, endpointId, counters) {
  const value = rule.value == null ? '' : String(rule.value)
  switch (String(rule.rule || 'fixed')) {
    case 'increment': {
      const key = `${endpointId}::${rule.field || ''}::${rule.id || ''}`
      const start = Number(value)
      const base = value !== '' && Number.isFinite(start) ? start : 1
      const current = counters.has(key) ? counters.get(key) : base
      counters.set(key, current + 1)
      return String(current)
    }
    case 'random':
      return randomBy(value)
    case 'regex':
      return regexSample(value)
    case 'template':
      return resolveTemplate(value)
    case 'fixed':
    default:
      return value
  }
}

/** 'a.b[0].c' 路径写入。 */
function writePath(root, field, value) {
  const segs = String(field).replace(/\[(\d+)\]/g, '.$1').split('.').filter((s) => s !== '')
  let cur = root
  for (let i = 0; i < segs.length; i += 1) {
    const seg = segs[i]
    const last = i === segs.length - 1
    const nextIsIndex = !last && /^\d+$/.test(segs[i + 1])
    if (last) {
      cur[seg] = value
      break
    }
    if (cur[seg] == null) cur[seg] = nextIsIndex ? [] : {}
    cur = cur[seg]
  }
}

/** endpoint.url → pathname（剔除 {{var}} 后取 path；'/api/users' 与 'https://x/api/users' 都归一）。 */
function urlPathOf(url) {
  if (!url) return ''
  const cleaned = String(url).replace(/\{\{[^{}]*\}\}/g, '')
  try {
    return new URL(cleaned, 'http://mock.local').pathname
  } catch {
    return ''
  }
}

function defaultResponse(endpoint) {
  const responses = Array.isArray(endpoint.responses) ? endpoint.responses.filter((r) => r && r.enabled !== false) : []
  const pick = responses.find((r) => r.isDefault) || responses[0] || null
  if (!pick) return { status: 200, body: {} }
  let body = pick.body
  if (typeof body === 'string' && body.trim() !== '') {
    try {
      body = JSON.parse(body)
    } catch {
      // 非 JSON 响应体原样返回
    }
  }
  const status = Number(pick.code)
  return { status: Number.isFinite(status) && status > 0 ? status : 200, body: body == null || body === '' ? {} : body }
}

function sendJson(res, status, payload) {
  const text = typeof payload === 'string' ? JSON.stringify(payload) : JSON.stringify(payload == null ? {} : payload)
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(text) })
  res.end(text)
}

/**
 * createMockServer({ getProject, port = 4010 })
 * → { start(), stop(), status() -> { running, port } }
 */
export function createMockServer({ getProject, port = 4010 } = {}) {
  let server = null
  let actualPort = 0
  const counters = new Map()

  function status() {
    return { running: server != null, port: actualPort }
  }

  function buildBody(project, endpoint) {
    const rules = (Array.isArray(project.mocks) ? project.mocks : []).filter(
      (r) => r && r.enabled !== false && String(r.endpointId || '') === String(endpoint.id || ''),
    )
    if (rules.length === 0) return null
    const root = {}
    let whole = null
    for (const rule of rules) {
      const v = ruleValue(rule, endpoint.id, counters)
      const field = rule.field == null ? '' : String(rule.field).trim()
      if (field === '') {
        whole = v
        continue
      }
      writePath(root, field, coerce(v))
    }
    if (whole != null && Object.keys(root).length === 0) return coerce(whole)
    return root
  }

  function matchTarget(project, tail) {
    const endpoints = Array.isArray(project.endpoints) ? project.endpoints : []
    if (tail === '') return null
    const byId = endpoints.find((e) => e && tail === '/' + e.id)
    if (byId) return byId
    for (const e of endpoints) {
      if (!e) continue
      const p = urlPathOf(e.url)
      if (p && (tail === p || tail === p + '/')) return e
    }
    return null
  }

  async function handle(req, res) {
    try {
      const u = new URL(req.url || '/', 'http://mock.local')
      if (!u.pathname.startsWith('/mock/')) return sendJson(res, 404, { ok: false, error: 'mock: route must start with /mock/' })
      const rest = u.pathname.slice('/mock/'.length)
      const slash = rest.indexOf('/')
      const projectId = slash < 0 ? rest : rest.slice(0, slash)
      const tail = slash < 0 ? '' : rest.slice(slash)
      if (projectId === '') return sendJson(res, 404, { ok: false, error: 'mock: projectId is required' })

      let project
      try {
        project = await getProject(projectId)
      } catch (err) {
        return sendJson(res, 404, { ok: false, error: `mock: project not found: ${projectId}` })
      }
      if (!project) return sendJson(res, 404, { ok: false, error: `mock: project not found: ${projectId}` })

      const endpoint = matchTarget(project, tail)
      if (!endpoint) return sendJson(res, 404, { ok: false, error: `mock: no endpoint matched path ${u.pathname}` })

      const generated = buildBody(project, endpoint)
      const fallback = generated == null ? defaultResponse(endpoint) : null
      const delay = Number(endpoint.mock && endpoint.mock.delayMs) || 0
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay))
      return sendJson(res, fallback ? fallback.status : 200, generated == null ? fallback.body : generated)
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err && err.message ? err.message : String(err) })
    }
  }

  function start() {
    if (server) return Promise.resolve(status())
    return new Promise((resolve, reject) => {
      const s = http.createServer(handle)
      const onError = (err) => {
        s.removeListener('listening', onListening)
        reject(err)
      }
      const onListening = () => {
        s.removeListener('error', onError)
        s.on('error', () => {})
        server = s
        actualPort = s.address().port
        resolve(status())
      }
      s.once('error', onError)
      s.once('listening', onListening)
      s.listen(Number(port) || 0, '127.0.0.1')
    })
  }

  function stop() {
    if (!server) return Promise.resolve(status())
    const s = server
    server = null
    actualPort = 0
    return new Promise((resolve) => {
      s.close(() => resolve(status()))
    })
  }

  return { start, stop, status }
}
