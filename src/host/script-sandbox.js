/**
 * 脚本沙箱：契约 §4 runScript。node:vm 隔离 + pm.* 兼容面。
 * 安全边界：vm 不是进程级安全边界，但「不注入 require/process/fs/global」+
 * codeGeneration.strings=false（禁 eval/new Function）已阻断契约要求的逃逸路径。
 * 超时用 Script.runInContext 的 timeout 中断同步死循环；沙箱内无 setTimeout/setInterval。
 */
import vm from 'node:vm'

function stringifyArg(v) {
  if (typeof v === 'string') return v
  try {
    const s = JSON.stringify(v)
    return s === undefined ? String(v) : s
  } catch {
    return String(v)
  }
}

function deepEqual(a, b) {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a == null || b == null) return false
  if (typeof a !== 'object') return false
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

function fmtValue(v) {
  if (typeof v === 'string') return JSON.stringify(v)
  try {
    const s = JSON.stringify(v)
    return s === undefined ? String(v) : s
  } catch {
    return String(v)
  }
}

/** 链式断言：pm.expect(v).to.eql(x) / .not.include(y) / .be.above(1) / .be.true ... */
function makeExpect(actual, negate) {
  const check = (cond, msg) => {
    if (negate ? cond : !cond) throw new Error((negate ? 'not: ' : '') + msg)
  }
  const api = {
    eql(v) {
      check(deepEqual(actual, v), `expected ${fmtValue(actual)} to eql ${fmtValue(v)}`)
      return api
    },
    equal(v) {
      check(actual === v, `expected ${fmtValue(actual)} to equal ${fmtValue(v)}`)
      return api
    },
    above(n) {
      check(Number(actual) > Number(n), `expected ${fmtValue(actual)} to be above ${fmtValue(n)}`)
      return api
    },
    below(n) {
      check(Number(actual) < Number(n), `expected ${fmtValue(actual)} to be below ${fmtValue(n)}`)
      return api
    },
    least(n) {
      check(Number(actual) >= Number(n), `expected ${fmtValue(actual)} to be at least ${fmtValue(n)}`)
      return api
    },
    most(n) {
      check(Number(actual) <= Number(n), `expected ${fmtValue(actual)} to be at most ${fmtValue(n)}`)
      return api
    },
    include(v) {
      const hay = actual == null ? '' : String(actual)
      check(hay.includes(String(v)), `expected ${fmtValue(actual)} to include ${fmtValue(v)}`)
      return api
    },
    match(re) {
      check(new RegExp(re).test(actual == null ? '' : String(actual)), `expected ${fmtValue(actual)} to match ${String(re)}`)
      return api
    },
  }
  api.to = api
  api.be = api
  api.have = api
  api.that = api
  api.is = api
  api.and = api
  api.a = api
  api.an = api
  Object.defineProperty(api, 'not', { get: () => makeExpect(actual, !negate) })
  Object.defineProperty(api, 'true', {
    get: () => {
      check(actual === true, `expected ${fmtValue(actual)} to be true`)
      return api
    },
  })
  Object.defineProperty(api, 'false', {
    get: () => {
      check(actual === false, `expected ${fmtValue(actual)} to be false`)
      return api
    },
  })
  Object.defineProperty(api, 'ok', {
    get: () => {
      check(!!actual, `expected ${fmtValue(actual)} to be truthy`)
      return api
    },
  })
  Object.defineProperty(api, 'undefined', {
    get: () => {
      check(actual === undefined, `expected ${fmtValue(actual)} to be undefined`)
      return api
    },
  })
  Object.defineProperty(api, 'exist', {
    get: () => {
      check(actual !== undefined && actual !== null, `expected ${fmtValue(actual)} to exist`)
      return api
    },
  })
  return api
}

function plain(value) {
  if (value === undefined) return {}
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return {}
  }
}

/**
 * runScript(code, { context, timeoutMs = 3000 })
 * context: { request, response, env, globals, variables, eventName }
 * → { ok, error?, logs: [], variables: {}, tests: [], exports: {} }
 * 注意：context.request / env / globals / variables 以引用方式进入沙箱，脚本对它们的修改对调用方可见。
 */
export function runScript(code, { context = {}, timeoutMs = 3000 } = {}) {
  const logs = []
  const tests = []
  const collected = {}
  const source = String(code == null ? '' : code)
  const request = context.request && typeof context.request === 'object' ? context.request : {}
  const response = context.response && typeof context.response === 'object' ? context.response : null
  const envObj = context.env && typeof context.env === 'object' ? context.env : {}
  const globalsObj = context.globals && typeof context.globals === 'object' ? context.globals : {}
  const varsObj = context.variables && typeof context.variables === 'object' ? context.variables : {}

  const makeScope = (target) => ({
    get: (k) => target[String(k)],
    set: (k, v) => {
      target[String(k)] = v
      collected[String(k)] = v
    },
    unset: (k) => {
      delete target[String(k)]
      delete collected[String(k)]
    },
    toObject: () => ({ ...target }),
  })

  const variablesScope = {
    get: (k) => {
      const key = String(k)
      if (key in varsObj) return varsObj[key]
      if (key in envObj) return envObj[key]
      return globalsObj[key]
    },
    set: (k, v) => {
      varsObj[String(k)] = v
      collected[String(k)] = v
    },
    unset: (k) => {
      delete varsObj[String(k)]
      delete collected[String(k)]
    },
    toObject: () => ({ ...globalsObj, ...envObj, ...varsObj }),
  }

  let parsedBody
  let bodyParsed = false
  const pmResponse = response
    ? {
        get code() {
          return response.status
        },
        get status() {
          return response.status
        },
        get headers() {
          return response.headers || {}
        },
        get responseTime() {
          return response.timeMs
        },
        text: () => (response.body == null ? '' : String(response.body)),
        json: () => {
          if (!bodyParsed) {
            parsedBody = JSON.parse(response.body == null ? '' : String(response.body))
            bodyParsed = true
          }
          return parsedBody
        },
      }
    : {
        get code() {
          return 0
        },
        get headers() {
          return {}
        },
        text: () => '',
        json: () => {
          throw new Error('pm.response is not available: no response yet')
        },
      }

  const pm = {
    test(name, fn) {
      const entry = { name: String(name), passed: false }
      try {
        if (typeof fn === 'function') fn()
        entry.passed = true
      } catch (err) {
        entry.error = err && err.message ? err.message : String(err)
      }
      tests.push(entry)
      return entry
    },
    expect: (v) => makeExpect(v, false),
    environment: makeScope(envObj),
    globals: makeScope(globalsObj),
    variables: variablesScope,
    response: pmResponse,
    request,
    info: { eventName: String(context.eventName || '') },
  }

  const pushLog = (level) => (...args) => logs.push(`${level}: ${args.map(stringifyArg).join(' ')}`)
  const sandbox = {
    pm,
    console: { log: pushLog('log'), info: pushLog('info'), warn: pushLog('warn'), error: pushLog('error'), debug: pushLog('debug') },
    module: { exports: {} },
    exports: null,
    // 明确禁用异步定时器（契约：setTimeout 禁用）；不给 require/process/fs/global
    setTimeout: () => {
      throw new Error('setTimeout is not available in script sandbox')
    },
    setInterval: () => {
      throw new Error('setInterval is not available in script sandbox')
    },
  }
  sandbox.exports = sandbox.module.exports

  const ctx = vm.createContext(sandbox, { codeGeneration: { strings: false, wasm: false } })

  try {
    const script = new vm.Script(source, { filename: 'postapi-script.js' })
    script.runInContext(ctx, { timeout: Math.max(1, Number(timeoutMs) || 3000) })
    return { ok: true, logs, variables: collected, tests, exports: plain(sandbox.module.exports) }
  } catch (err) {
    const isTimeout = err && err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT'
    return {
      ok: false,
      error: { kind: isTimeout ? 'timeout' : 'script', message: err && err.message ? err.message : String(err) },
      logs,
      variables: collected,
      tests,
      exports: plain(sandbox.module.exports),
    }
  }
}
