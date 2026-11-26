/**
 * SQL 文本扫描工具（官方驱动 glue 的共享纯函数，零依赖、无副作用）。
 * - 引号/注释感知的 ? 占位符扫描：
 *   - 单引号字符串（含 '' 加倍转义；mysql 方言额外处理反斜杠转义）内的 ? 不改写；
 *   - 双引号（pg/mssql 标识符或字符串）、反引号（mysql 标识符）、[]（mssql 括号标识符）、
 *     pg 美元引用 $$..$$ / $tag$..$tag$ 内的 ? 不改写；
 *   - 行注释（--、mysql #）与块注释（斜杠星号对）内的 ? 不改写（mysql 方言下带感叹号/加号的
 *     可执行块注释视作普通文本，其中的 ? 会被改写，与 mysql2 的 sql-escaper 行为一致）。
 * - 无法安全解析（引号/注释未闭合、歧义引号）时抛 code=INVALID_ARGUMENT 的原始错误；
 *   glue 层用 rethrowInvalid() 转成 DbError，纯函数测试可直接断言 err.code。
 * - countPlaceholders（mysql 方言）：与 mysql2 的 format() 占位符语义对齐——
 *   连续 ? 恰好 1 个 → 1 个参数；恰好 2 个（??）→ 1 个参数（escapeId）；≥3 个 → 整段跳过。
 * - rewritePlaceholders(sql, style)：把裸 ? 按出现顺序改写为占位符：
 *   '$' → $1..$n（postgresql）、'@p' → @p0..（mssql）、':' → :1..:n（oracle）。
 * - splitRedisCommandLine / normalizeRedisValue / jsonSafeMongoOutput 为 redis/mongodb glue
 *   的配套纯函数（引号切参、返回值归一、输出 JSON 安全化）。
 */

/** 方言表：backslash=字符串内反斜杠转义；hash=# 行注释；dashDashSpace=-- 后需空白才是注释；
 *  backtick=反引号标识符；doubleQuoteIsString=" 亦为字符串上下文；bracket=[] 标识符；
 *  dollarQuote=$$/$tag$ 引用；execComment=/*!、/*+ 不算注释。 */
const DIALECTS = {
  mysql: { backslash: true, hash: true, dashDashSpace: true, backtick: true, doubleQuoteIsString: true, bracket: false, dollarQuote: false, execComment: true },
  pg: { backslash: false, hash: false, dashDashSpace: false, backtick: false, doubleQuoteIsString: true, bracket: false, dollarQuote: true, execComment: false },
  mssql: { backslash: false, hash: false, dashDashSpace: false, backtick: false, doubleQuoteIsString: true, bracket: true, dollarQuote: false, execComment: false },
  oracle: { backslash: false, hash: false, dashDashSpace: false, backtick: false, doubleQuoteIsString: true, bracket: false, dollarQuote: false, execComment: false },
}

/** 构造原始 INVALID_ARGUMENT 错误（无 DbError 依赖，避免与 db.js 循环导入）。 */
export function invalidSqlError(message) {
  return Object.assign(new Error(message), { code: 'INVALID_ARGUMENT', status: 400, name: 'DbError' })
}

/** glue 层用：把扫描器抛出的 INVALID_ARGUMENT 原始错误转成 DbError，其余原样抛出。 */
export function rethrowInvalid(err, DbError) {
  if (err && err.code === 'INVALID_ARGUMENT') throw new DbError('INVALID_ARGUMENT', err && err.message)
  throw err
}

/** 跳过一个引号上下文，返回结束后的下标；未闭合返回 -1。doubled：'' 加倍转义。 */
function skipQuoted(sql, start, quote, backslash) {
  const n = sql.length
  let i = start + 1
  while (i < n) {
    const c = sql[i]
    if (backslash && c === '\\') { i += 2; continue }
    if (c === quote) {
      if (sql[i + 1] === quote) { i += 2; continue }
      return i + 1
    }
    i += 1
  }
  return -1
}

/** 跳过 pg 美元引用：$tag$ ... $tag$（tag 可空）。未闭合返回 -1。 */
function skipDollarQuoted(sql, start) {
  const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(start))
  if (!m) return -2 // 不是美元引用开头，按普通字符处理
  const tag = m[0]
  const end = sql.indexOf(tag, start + tag.length)
  return end === -1 ? -1 : end + tag.length
}

/** 行末（含换行符本身）下标。 */
function endOfLine(sql, from) {
  const idx = sql.indexOf('\n', from)
  return idx === -1 ? sql.length : idx + 1
}

/**
 * 扫描 SQL：遇到裸 ? 时回调 onPlaceholder(startIndex, runLength)，返回 -1 表示扫描完成，
 * 返回 -2 表示遇到无法安全解析的文本（引号/注释未闭合）。回调返回 false 时继续跳过该段。
 */
function scanSql(sql, dialect, onPlaceholder) {
  const d = DIALECTS[dialect]
  const n = sql.length
  let i = 0
  while (i < n) {
    const c = sql[i]
    if (c === '?') {
      let runEnd = i + 1
      while (sql[runEnd] === '?') runEnd += 1
      const run = runEnd - i
      if (!onPlaceholder(i, run)) i = runEnd
      else i = runEnd
      continue
    }
    if (c === "'") {
      const end = skipQuoted(sql, i, "'", d.backslash)
      if (end === -1) return -2
      i = end
      continue
    }
    if (d.doubleQuoteIsString && c === '"') {
      const end = skipQuoted(sql, i, '"', d.backslash)
      if (end === -1) return -2
      i = end
      continue
    }
    if (d.backtick && c === '`') {
      const end = skipQuoted(sql, i, '`', false)
      if (end === -1) return -2
      i = end
      continue
    }
    if (d.bracket && c === '[') {
      const end = sql.indexOf(']', i + 1)
      if (end === -1) return -2
      i = end + 1
      continue
    }
    if (d.dollarQuote && c === '$') {
      const end = skipDollarQuoted(sql, i)
      if (end === -1) return -2
      i = end === -2 ? i + 1 : end
      continue
    }
    if (d.hash && c === '#') {
      i = endOfLine(sql, i + 1)
      continue
    }
    if (c === '-' && sql[i + 1] === '-') {
      const after = sql.charCodeAt(i + 2)
      if (!d.dashDashSpace || Number.isNaN(after) || after <= 32) {
        i = endOfLine(sql, i + 2)
        continue
      }
      i += 1
      continue
    }
    if (c === '/' && sql[i + 1] === '*') {
      const marker = sql[i + 2]
      if (d.execComment && (marker === '!' || marker === '+')) { i += 2; continue }
      const end = sql.indexOf('*/', i + 2)
      i = end === -1 ? n : end + 2
      continue
    }
    i += 1
  }
  return -1
}

/** mysql 方言 ? 占位符计数（与 mysql2 format 语义一致：1→1、??→1、≥3 连续→0）。 */
export function countPlaceholders(sql) {
  let count = 0
  const result = scanSql(String(sql), 'mysql', (_pos, run) => {
    if (run === 1) count += 1
    else if (run === 2) count += 1
    return true
  })
  if (result === -2) {
    throw invalidSqlError('SQL 存在未闭合的引号或注释，无法可靠解析 ? 占位符（请改用参数绑定，避免内联值）')
  }
  return count
}

/**
 * 顺序改写裸 ? 为 style 风格占位符：'$'→$1..$n、'@p'→@p0..、':'→:1..:n。
 * 引号/注释内的 ? 原样保留；无法安全解析时抛 INVALID_ARGUMENT。
 * 返回 { sql, count }（count = 改写占位符个数 = 参数绑定个数）。
 */
export function rewritePlaceholders(sql, style) {
  const d = style === '@p' ? 'mssql' : style === ':' ? 'oracle' : 'pg'
  const source = String(sql)
  let count = 0
  let out = ''
  let last = 0
  const result = scanSql(source, d, (pos, run) => {
    if (run !== 1) return true // ?? 及更长连续 ? 不改写（非参数占位符，原样保留）
    out += source.slice(last, pos)
    count += 1
    // '$' → $1..$n（1 起）；'@p' → @p0..（0 起）；':' → :1..:n（1 起）
    out += style + (style === '@p' ? count - 1 : count)
    last = pos + 1
    return true
  })
  if (result === -2) {
    throw invalidSqlError(`SQL 存在未闭合的引号或注释，无法安全把 ? 改写为 ${style} 风格占位符（请改用参数绑定，避免内联值）`)
  }
  out += source.slice(last)
  return { sql: out, count }
}

/**
 * redis 命令行切参：按空白切分，双/单引号包裹的参数可含空格（同引号可用反斜杠转义）。
 * 空命令或引号未闭合 → INVALID_ARGUMENT。
 */
export function splitRedisCommandLine(line) {
  const text = String(line == null ? '' : line)
  const args = []
  const n = text.length
  let i = 0
  while (i < n) {
    const c = text[i]
    if (c === ' ' || c === '\t') { i += 1; continue }
    if (c === '"' || c === "'") {
      const quote = c
      let token = ''
      i += 1
      let closed = false
      while (i < n) {
        const ch = text[i]
        if (ch === '\\' && i + 1 < n && (text[i + 1] === quote || text[i + 1] === '\\')) {
          token += text[i + 1]
          i += 2
          continue
        }
        if (ch === quote) { closed = true; i += 1; break }
        token += ch
        i += 1
      }
      if (!closed) throw invalidSqlError(`redis 命令引号未闭合：${token.slice(0, 20) || quote}…（参数含空格请用引号包裹）`)
      args.push(token)
      continue
    }
    let token = ''
    while (i < n && text[i] !== ' ' && text[i] !== '\t') { token += text[i]; i += 1 }
    args.push(token)
  }
  if (args.length === 0) throw invalidSqlError('redis 命令为空（如 PING / GET key / SET key "带 空格 值"）')
  return args
}

/** redis 返回值归一：Buffer→字符串、数组/Set→逐项归一（字符串数组）、Map→对象、其余原样。 */
export function normalizeRedisValue(value) {
  if (value == null) return null
  const t = typeof value
  if (t === 'string' || t === 'number' || t === 'boolean') return value
  if (t === 'bigint') return value.toString()
  if (value instanceof Uint8Array) return Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString('utf8')
  if (Array.isArray(value)) return value.map((v) => normalizeRedisValue(v))
  if (value instanceof Set) return [...value].map((v) => normalizeRedisValue(v))
  if (value instanceof Map) {
    const out = {}
    for (const [k, v] of value.entries()) out[String(normalizeRedisValue(k))] = normalizeRedisValue(v)
    return out
  }
  return value
}

/** mongodb 命令文档解析：sql 必须是 JSON 对象文档，否则 INVALID_ARGUMENT（带示例提示）。 */
export function parseMongoCommand(statement) {
  const hint = 'MongoDB 需要命令文档 JSON，如 {"find":"users","filter":{},"limit":10}'
  let doc
  try {
    doc = JSON.parse(String(statement == null ? '' : statement))
  } catch {
    throw invalidSqlError(hint)
  }
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) throw invalidSqlError(hint + '（解析结果必须是对象）')
  return doc
}

/**
 * mongodb 输出 JSON 安全化：bigint→字符串、Buffer/Uint8Array→base64、Date→ISO 字符串
 * （JSON.stringify 原生行为），经 JSON.parse 还原为普通对象；顶层 undefined → null。
 * 注意：Buffer 的 toJSON 会先于 stringify 的 replacer 执行，因此必须先做深拷贝预转换。
 */
export function jsonSafeMongoOutput(value) {
  if (value === undefined) return null
  const seen = new WeakSet()
  function toPlain(v) {
    if (v === null || typeof v !== 'object') {
      if (typeof v === 'bigint') return v.toString()
      return v
    }
    if (v instanceof Date) return v // 交给 JSON.stringify 输出 ISO 字符串
    if (v instanceof Uint8Array) return Buffer.from(v.buffer, v.byteOffset, v.byteLength).toString('base64')
    if (seen.has(v)) return '[Circular]'
    seen.add(v)
    if (Array.isArray(v)) return v.map((item) => toPlain(item))
    const out = {}
    for (const [k, item] of Object.entries(v)) out[k] = toPlain(item)
    return out
  }
  const text = JSON.stringify(toPlain(value))
  return text === undefined ? null : JSON.parse(text)
}
