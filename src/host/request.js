/**
 * T3 请求服务：契约 §2 postapi.request face，v2 §4 扩展。
 * Node 全局 fetch + AbortController；错误结构化进 error 字段，不抛出。
 * v2 新增：variables（{{}} 替换）、preScript / postScript（沙箱）、assertions（内置断言）；
 * 返回体新增 request / tests / variables / logs，既有字段与行为不变。
 */
import { createVariableResolver } from './variables.js'
import { runScript } from './script-sandbox.js'

const OVER_LIMIT_BYTES = 2 * 1024 * 1024 // >2MB 触发截断
const KEEP_BYTES = 200 * 1024 // 截断后保留 200KB

const BODY_TYPE_CONTENT_TYPE = {
  json: 'application/json',
  form: 'application/x-www-form-urlencoded',
  urlencoded: 'application/x-www-form-urlencoded',
  raw: 'text/plain',
  xml: 'application/xml',
  graphql: 'application/json',
}

/** 既有可用 body 类型（需要序列化并补默认 Content-Type 的）。 */
const BODY_TYPES = new Set(Object.keys(BODY_TYPE_CONTENT_TYPE))

/** header 两种形态归一：对象 {k:v} 与数组 [{key,value,enabled}]。 */
function headersToObject(input) {
  if (!input) return {}
  if (Array.isArray(input)) {
    const out = {}
    for (const item of input) {
      if (!item || item.enabled === false) continue
      const key = item.key == null ? '' : String(item.key)
      if (key === '') continue
      out[key] = item.value == null ? '' : String(item.value)
    }
    return out
  }
  if (typeof input === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(input)) {
      if (v == null) continue
      out[k] = String(v)
    }
    return out
  }
  return {}
}

/** params 两种形态归一：数组 [{key,value,enabled}] 与对象 {k:v}。 */
function paramsToList(input) {
  if (!input) return []
  if (Array.isArray(input)) {
    return input
      .filter((p) => p && p.enabled !== false && p.key != null && p.key !== '')
      .map((p) => ({ key: String(p.key), value: p.value == null ? '' : String(p.value) }))
  }
  if (typeof input === 'object') {
    return Object.entries(input).map(([k, v]) => ({ key: String(k), value: v == null ? '' : String(v) }))
  }
  return []
}

/** Cookie 行归一：取 enabled !== false 且有 key 的行，值转字符串（接口 cookies 与全局 cookies 共用）。 */
function cookieRows(input) {
  return (Array.isArray(input) ? input : [])
    .filter((c) => c && c.enabled !== false && c.key != null && c.key !== '')
    .map((c) => ({ key: String(c.key), value: c.value == null ? '' : String(c.value) }))
}

/** globalAuth 兜底判定：接口认证是 none（或缺）且全局认证类型非 none 时才生效。 */
function pickAuth(authValue, globalAuth) {
  const endpointType = authValue && typeof authValue === 'object' ? String(authValue.type || 'none') : 'none'
  if (endpointType !== 'none') return authValue
  const g = globalAuth && typeof globalAuth === 'object' ? globalAuth : null
  if (!g || String(g.type || 'none') === 'none') return authValue
  return { ...g }
}

/** 'a.b[0].c' 取值；解析失败返回 undefined。 */
export function pickValue(res, source, path) {
  const src = String(source || 'body')
  const key = path == null ? '' : String(path)
  if (src === 'status') return res.status
  if (src === 'time') return res.timeMs
  if (src === 'header') {
    const headers = res.headers || {}
    const lower = key.toLowerCase()
    for (const [k, v] of Object.entries(headers)) if (k.toLowerCase() === lower) return v
    return undefined
  }
  const text = res.body == null ? '' : String(res.body)
  if (key === '') {
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    return undefined
  }
  const segs = key.replace(/\[(\d+)\]/g, '.$1').split('.').filter((s) => s !== '')
  let cur = parsed
  for (const seg of segs) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = cur[seg]
  }
  return cur
}

/** 内置断言（契约 §4：source=status|body|header|time，op 共 9 种）。 */
function evalAssertion(a, res) {
  const item = a && typeof a === 'object' ? a : {}
  const source = String(item.source || 'status')
  const op = String(item.op || 'eq')
  const expected = item.value
  const name = item.message || `${source}${item.path ? ':' + item.path : ''} ${op} ${expected == null ? '' : expected}`.trim()
  const actual = pickValue(res, source, item.path)
  const actualText = actual == null ? '' : typeof actual === 'object' ? JSON.stringify(actual) : String(actual)
  try {
    let cond
    switch (op) {
      case 'eq':
        cond = actualText === String(expected == null ? '' : expected)
        break
      case 'neq':
        cond = actualText !== String(expected == null ? '' : expected)
        break
      case 'gt':
        cond = Number(actualText) > Number(expected)
        break
      case 'lt':
        cond = Number(actualText) < Number(expected)
        break
      case 'contains':
        cond = actualText.includes(String(expected == null ? '' : expected))
        break
      case 'notContains':
        cond = !actualText.includes(String(expected == null ? '' : expected))
        break
      case 'exists':
        cond = actual !== undefined && actual !== null
        break
      case 'notExists':
        cond = actual === undefined || actual === null
        break
      case 'regex':
        cond = new RegExp(String(expected == null ? '' : expected)).test(actualText)
        break
      default:
        return { name, passed: false, error: `unknown op: ${op}` }
    }
    if (cond) return { name, passed: true }
    return { name, passed: false, error: `expected ${actualText === '' ? '(empty)' : actualText} ${op} ${expected == null ? '' : expected}`.trim() }
  } catch (err) {
    return { name, passed: false, error: err && err.message ? err.message : String(err) }
  }
}

export function createRequestService() {
  return {
    /**
     * send({ method,url,params,headers,body,auth,cookies,timeoutMs=30000,
     *        variables, preScript, postScript, assertions,
     *        globalParams:{headers,query,cookies}, globalAuth,
     *        projectPreScript, projectPostScript })
     * → { status,statusText,headers,body,bodySize,timeMs,error?,truncated?,
     *     request, tests, variables, logs }
     * v3 合并语义（只增不改）：globalParams 的 query/headers 先放、接口的局部参数后放
     * （URLSearchParams.set / 对象展开都让同名时接口优先）；cookies = 接口 cookies 在前、
     * 全局 cookies 在后，分号连接成 Cookie 头；globalAuth 仅在接口 auth.type === 'none' 时生效；
     * projectPreScript / projectPostScript 分别先于 / 后于接口脚本跑同一个 runScript 沙箱。
     */
    async send(options = {}) {
      const {
        method = 'GET',
        url,
        params,
        headers,
        cookies,
        body,
        auth,
        timeoutMs = 30000,
        variables,
        preScript,
        postScript,
        assertions,
        globalParams,
        globalAuth,
        projectPreScript,
        projectPostScript,
      } = options || {}
      const started = Date.now()
      const result = {
        status: 0,
        statusText: '',
        headers: {},
        body: '',
        bodySize: 0,
        timeMs: 0,
        request: { method: String(method || 'GET').toUpperCase(), url: url == null ? '' : String(url), headers: {}, body: '' },
        tests: [],
        variables: {},
        logs: [],
      }
      try {
        if (!url) throw new Error('send: url is required')

        // ---- 1. 变量替换：{{key}} / {{$dynamic}}，未定义保留原文（契约 §4） ----
        const resolver = variables
          ? createVariableResolver({
              globals: variables.globals,
              environment: variables.environment,
              local: variables.local,
            })
          : null
        const R = (v) => (resolver ? resolver.resolve(v) : v)

        let methodValue = String(method || 'GET').toUpperCase()
        let urlValue = R(String(url))
        // —— v3 全局合并：先全局后局部，局部同名覆盖（query 靠 searchParams.set 的后写覆盖语义）——
        const gp = globalParams && typeof globalParams === 'object' ? globalParams : {}
        const globalQuery = paramsToList(gp.query).map((p) => ({ key: R(p.key), value: R(p.value) }))
        const globalHeaders = headersToObject(gp.headers)
        let paramList = paramsToList(params).map((p) => ({ key: R(p.key), value: R(p.value) }))
        paramList = globalQuery.concat(paramList)
        let headerMap = headersToObject(headers)
        // 全局头先放、接口头后放（同名接口头优先）；再逐值做变量替换
        headerMap = { ...globalHeaders, ...headerMap }
        for (const k of Object.keys(headerMap)) headerMap[k] = R(headerMap[k])
        // 接口 cookies（此前 send 未消费）与全局 cookies 都收集；真正的 Cookie 头在 fetch 前拼装
        const endpointCookies = cookieRows(cookies).map((c) => ({ key: R(c.key), value: R(c.value) }))
        const globalCookies = cookieRows(gp.cookies).map((c) => ({ key: R(c.key), value: R(c.value) }))
        let bodyValue = body && typeof body === 'object' ? { ...body } : body
        if (bodyValue && typeof bodyValue === 'object' && bodyValue.content != null) {
          bodyValue = { ...bodyValue, content: R(String(bodyValue.content)) }
        }
        // v3：接口 auth.type === 'none' 时用 globalAuth 兜底（与现有注入逻辑同一套）
        let authValue = pickAuth(auth, globalAuth)
        if (authValue) {
          for (const k of ['token', 'username', 'password', 'key', 'value']) {
            if (authValue[k] != null) authValue[k] = R(String(authValue[k]))
          }
        }

        // ---- 2. 前置脚本：项目级先于接口级，两者跑同一 runScript 沙箱、都可改 request ----
        const ctxRequest = {
          method: methodValue,
          url: urlValue,
          params: paramList,
          headers: { ...headerMap },
          body: bodyValue,
        }
        let ranPre = false
        for (const [script, logPrefix, phase] of [
          [projectPreScript, 'project pre ', 'projectPreScript'],
          [preScript, 'pre ', 'preScript'],
        ]) {
          if (!script) continue
          const out = runScript(script, {
            context: { request: ctxRequest, response: null, env: {}, globals: {}, variables: {} },
            timeoutMs,
          })
          result.logs.push(...out.logs.map((l) => logPrefix + l))
          Object.assign(result.variables, out.variables)
          if (!out.ok) {
            result.timeMs = Date.now() - started
            result.error = { kind: out.error.kind === 'timeout' ? 'timeout' : 'script', message: `${phase}: ${out.error.message}`, phase }
            return result
          }
          ranPre = true
        }
        if (ranPre) {
          methodValue = String(ctxRequest.method || methodValue).toUpperCase()
          urlValue = String(ctxRequest.url || urlValue)
          paramList = paramsToList(ctxRequest.params)
          headerMap = headersToObject(ctxRequest.headers)
          bodyValue = ctxRequest.body
        }

        const target = new URL(urlValue)
        for (const p of paramList) target.searchParams.set(p.key, p.value)

        const h = new Headers(headerMap)
        // auth 注入（契约 §2 §4：bearer/basic/apikey）
        if (authValue && authValue.type === 'bearer' && authValue.token) {
          h.set('Authorization', `Bearer ${authValue.token}`)
        } else if (authValue && authValue.type === 'basic') {
          h.set('Authorization', `Basic ${Buffer.from(`${authValue.username || ''}:${authValue.password || ''}`).toString('base64')}`)
        } else if (authValue && authValue.type === 'apikey' && authValue.key) {
          const addTo = String(authValue.addTo || 'header')
          if (addTo === 'query') target.searchParams.set(String(authValue.key), String(authValue.value == null ? '' : authValue.value))
          else h.set(String(authValue.key), String(authValue.value == null ? '' : authValue.value))
        }

        // v3 Cookie 头：接口 cookies 在前、全局 cookies 在后，分号连接（接口 cookie 优先的呈现顺序）。
        // 若 params/headers（含全局头）已显式带 Cookie，遵循「同名接口头优先」，不再覆盖。
        const cookiePairs = endpointCookies.concat(globalCookies)
        if (cookiePairs.length && !h.has('Cookie')) {
          h.set('Cookie', cookiePairs.map((c) => `${c.key}=${c.value}`).join('; '))
        }

        // body 按 type 序列化并补默认 Content-Type（显式 header 优先）
        let payload
        const bodyType = bodyValue && bodyValue.type
        if (BODY_TYPES.has(bodyType)) {
          payload = bodyValue.content == null ? '' : String(bodyValue.content)
          if (!h.has('Content-Type')) h.set('Content-Type', BODY_TYPE_CONTENT_TYPE[bodyType])
        }

        // 实际发出的请求快照（含变量替换后与脚本改动后的值）
        result.request = {
          method: methodValue,
          url: target.toString(),
          headers: Object.fromEntries(h),
          body: payload == null ? '' : String(payload),
        }

        const ac = new AbortController()
        // 计时覆盖到 body 读取完成：下载阶段卡住同样按超时中止
        const timer = setTimeout(() => ac.abort(), timeoutMs)
        let res
        let text
        try {
          res = await fetch(target, {
            method: methodValue,
            headers: h,
            body: payload,
            signal: ac.signal,
          })
          text = await res.text()
        } finally {
          clearTimeout(timer)
        }

        const bytes = Buffer.byteLength(text)
        result.status = res.status
        result.statusText = res.statusText
        result.headers = Object.fromEntries(res.headers)
        result.bodySize = bytes
        if (bytes > OVER_LIMIT_BYTES) {
          result.body = text.slice(0, KEEP_BYTES)
          result.truncated = true
        } else {
          result.body = text
        }
        result.timeMs = Date.now() - started

        // ---- 3. 后置脚本：接口级先跑、项目级收尾，读 pm.response，可 set 变量 ----
        for (const [script, logPrefix, phase] of [
          [postScript, 'post ', 'postScript'],
          [projectPostScript, 'project post ', 'projectPostScript'],
        ]) {
          if (!script) continue
          const out = runScript(script, {
            context: {
              request: result.request,
              response: { status: result.status, headers: result.headers, body: result.body, timeMs: result.timeMs },
              env: {},
              globals: {},
              variables: {},
              eventName: 'test',
            },
            timeoutMs,
          })
          result.logs.push(...out.logs.map((l) => logPrefix + l))
          Object.assign(result.variables, out.variables)
          for (const t of out.tests) result.tests.push(t)
          if (!out.ok) {
            result.tests.push({ name: phase + ' 执行', passed: false, error: out.error.message })
          }
        }

        // ---- 4. 内置断言 ----
        for (const a of Array.isArray(assertions) ? assertions : []) {
          result.tests.push(evalAssertion(a, result))
        }
        return result
      } catch (err) {
        result.timeMs = Date.now() - started
        const aborted = err && (err.name === 'AbortError' || (err.cause && err.cause.name === 'AbortError'))
        result.error = {
          kind: aborted ? 'timeout' : 'network',
          message: err && err.message ? err.message : String(err),
        }
        return result
      }
    },
  }
}
