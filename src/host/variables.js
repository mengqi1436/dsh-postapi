/**
 * 变量解析：契约 §4 createVariableResolver + DYNAMIC_VARS。
 * 优先级 local > environment > globals（feature-matrix 第 7 行）；未定义变量保留 {{key}} 原文。
 * 变量集合三种入参形态都吃：数组 [{key,value,enabled}]、{variables:[...]}、普通对象 {k:v}。
 */
import { randomUUID, randomBytes } from 'node:crypto'

const VAR_RE = /\{\{\s*([^{}]+?)\s*\}\}/g

function pad2(n) {
  return String(n).padStart(2, '0')
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randStr(len) {
  return randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len)
}

function ymd(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function ymdhms(d) {
  return `${ymd(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
}

/** 契约 §4 的 11 个动态变量：{{$timestamp}} 形态，每次替换即时生成。 */
export const DYNAMIC_VARS = {
  $timestamp: () => String(Math.floor(Date.now() / 1000)),
  $isoTimestamp: () => new Date().toISOString(),
  $randomInt: () => String(randInt(0, 1000)),
  $randomString: () => randStr(12),
  $uuid: () => randomUUID(),
  $randomEmail: () => `user_${randStr(6)}@example.com`,
  $randomPhone: () => `1${randInt(3, 9)}${String(randInt(0, 999999999)).padStart(9, '0')}`,
  $randomBoolean: () => (Math.random() < 0.5 ? 'true' : 'false'),
  $randomFloat: () => Math.random().toFixed(6),
  $datetime: () => ymdhms(new Date()),
  $date: () => ymd(new Date()),
}

function collectInto(out, input) {
  if (!input || typeof input !== 'object') return
  const list = Array.isArray(input) ? input : Array.isArray(input.variables) ? input.variables : null
  if (list) {
    for (const item of list) {
      if (!item || item.enabled === false) continue
      const key = item.key == null ? '' : String(item.key)
      if (key === '') continue
      out[key] = item.value == null ? '' : String(item.value)
    }
    // 环境对象的 baseUrl 也作为变量暴露（{{baseUrl}} 是最高频用法）
    if (!Array.isArray(input) && input.baseUrl) {
      if (!Object.prototype.hasOwnProperty.call(out, 'baseUrl')) out.baseUrl = String(input.baseUrl)
    }
    return
  }
  for (const [k, v] of Object.entries(input)) {
    if (v && typeof v === 'object') continue
    out[k] = v == null ? '' : String(v)
  }
}

/** 把任意形态的变量集合归一化成 { key: 'value' } 普通对象（request / script 共用）。 */
export function normalizeVariables(input) {
  const out = {}
  collectInto(out, input)
  return out
}

/**
 * createVariableResolver({ globals, environment, local })
 * .resolve(text) -> string（未定义保留原文）
 * .explain(text) -> { resolved, missing: [] }
 */
export function createVariableResolver({ globals, environment, local } = {}) {
  // 后写覆盖先写 → local 最强、globals 最弱
  const table = Object.assign({}, normalizeVariables(globals), normalizeVariables(environment), normalizeVariables(local))

  function resolve(text) {
    if (typeof text !== 'string' || text === '') return text
    return text.replace(VAR_RE, (raw, name) => {
      const key = String(name).trim()
      if (key.startsWith('$') && typeof DYNAMIC_VARS[key] === 'function') return String(DYNAMIC_VARS[key]())
      if (Object.prototype.hasOwnProperty.call(table, key)) return table[key]
      return raw
    })
  }

  function explain(text) {
    const missing = []
    const resolved = resolve(text)
    if (typeof text === 'string') {
      for (const m of text.matchAll(VAR_RE)) {
        const key = String(m[1]).trim()
        if (key.startsWith('$') && typeof DYNAMIC_VARS[key] === 'function') continue
        if (Object.prototype.hasOwnProperty.call(table, key)) continue
        if (!missing.includes(key)) missing.push(key)
      }
    }
    return { resolved, missing }
  }

  return { resolve, explain, variables: { ...table } }
}
