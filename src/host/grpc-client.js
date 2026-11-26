/**
 * gRPC 调试客户端（feature-matrix：gRPC 由「仅协议位」提升为真实 unary 调用）。
 * 零 npm 依赖：proto3 文本解析子集 + protobuf wire codec + node:http2 unary 客户端。
 *
 * 协议要点（实现依据 protobuf encoding 规范 / gRPC over HTTP2 规范）：
 *  - wire type：0 varint / 1 64-bit / 2 length-delimited / 5 32-bit；tag = (字段号 << 3) | wireType；
 *  - proto3 默认 packed repeated（numeric/bool/enum 单个长度前缀帧承载全部元素）；
 *    string/bytes/message 逐元素 length-delimited；map<k,v> 是「字段1=key、字段2=value」的
 *    隐式 repeated 子消息；
 *  - 64 位整数编解码用 BigInt，解码后以字符串回传（JSON number 超 2^53 丢精度）；
 *    bytes 在 JSON 侧一律 base64；enum 编码收名字或数值、解码回名字（无别名冲突时）；
 *  - gRPC 帧：1B compressed-flag（仅支持 0=uncompressed）+ 4B 大端长度 + protobuf 消息；
 *  - HTTP/2 头：:method POST、:path /pkg.Svc/Method、content-type application/grpc+proto、
 *    te: trailers、grpc-timeout（毫秒，单位符 'm'）；metadata 以普通小写头透传，
 *    跳过 ':' 前缀伪头与保留头，避免破坏调用语义；
 *  - grpc-status/grpc-message 可能出现在响应 headers（trailers-only 形态）或 END_STREAM
 *    的 trailers 帧，两处都取；grpc-status≠0 → GRPC_ERROR（带 0..16 状态名映射）；
 *    HTTP 非 200 → UNAVAILABLE；定时器到点销毁 session → TIMEOUT。
 *
 * 边界（明确不做）：
 *  - 仅 unary：client/server streaming rpc 直接 INVALID_ARGUMENT（仅支持 unary）；
 *  - 仅 uncompressed 响应（compressed-flag=1 → UNAVAILABLE）；
 *  - 不实现 proto3 自定义 options 求值 / group 字段 / proto2 required 语义（reserved 等跳过）；
 *  - JSON 请求里的 number 一律按 JS number 编码，超 2^53 的 64 位整数请传字符串。
 */

import http2 from 'node:http2'

const DEFAULT_TIMEOUT_MS = 10000
const MAX_TIMEOUT_MS = 10 * 60 * 1000

/** 带 code 的 gRPC 客户端错误：code ∈ INVALID_ARGUMENT/UNAVAILABLE/GRPC_ERROR/TIMEOUT。 */
export class GrpcError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'GrpcError'
    this.code = code
    // status 供 bridge 外层 catch（duck-typing BridgeError）转 HTTP 状态码
    this.status = code === 'INVALID_ARGUMENT' ? 400 : code === 'TIMEOUT' ? 504 : 502
  }
}

/** grpc-status 0..16 状态名映射（gRPC 标准表）。 */
const GRPC_STATUS_NAMES = [
  'OK', 'CANCELLED', 'UNKNOWN', 'INVALID_ARGUMENT', 'DEADLINE_EXCEEDED', 'NOT_FOUND',
  'ALREADY_EXISTS', 'PERMISSION_DENIED', 'RESOURCE_EXHAUSTED', 'FAILED_PRECONDITION',
  'ABORTED', 'OUT_OF_RANGE', 'UNIMPLEMENTED', 'INTERNAL', 'UNAVAILABLE', 'DATA_LOSS',
  'UNAUTHENTICATED',
]

/** 不允许由用户 metadata 覆盖的保留头（小写）。 */
const RESERVED_META = new Set([
  'content-type', 'content-encoding', 'content-length', 'te', 'transfer-encoding',
  'connection', 'grpc-timeout', 'grpc-encoding', 'grpc-accept-encoding',
  'grpc-status', 'grpc-message',
])

/** proto3 标量类型全表。 */
const SCALARS = new Set([
  'double', 'float', 'int32', 'int64', 'uint32', 'uint64', 'sint32', 'sint64',
  'fixed32', 'fixed64', 'sfixed32', 'sfixed64', 'bool', 'string', 'bytes',
])

/* ================= proto3 文本解析器（子集） ================= */

/**
 * 词法：ident（含点号，方便携带 'pkg.Type'）/num/str/punct，token 带行列。
 * 解析错误统一 GrpcError(INVALID_ARGUMENT) 且带「第 X 行第 Y 列」。
 */
function tokenize(src) {
  const tokens = []
  let i = 0
  let line = 1
  let col = 1
  const n = src.length
  while (i < n) {
    const ch = src[i]
    if (ch === '\n') { i += 1; line += 1; col = 1; continue }
    if (ch === ' ' || ch === '\t' || ch === '\r') { i += 1; col += 1; continue }
    if (ch === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') { i += 1; col += 1 }
      continue
    }
    if (ch === '/' && src[i + 1] === '*') {
      const sl = line
      const sc = col
      i += 2
      col += 2
      let closed = false
      while (i < n) {
        if (src[i] === '*' && src[i + 1] === '/') { i += 2; col += 2; closed = true; break }
        if (src[i] === '\n') { line += 1; col = 1 } else col += 1
        i += 1
      }
      if (!closed) throw new GrpcError('INVALID_ARGUMENT', `proto 解析失败（第 ${sl} 行第 ${sc} 列）: 块注释未闭合`)
      continue
    }
    if (ch === '"' || ch === "'") {
      const quote = ch
      const sl = line
      const sc = col
      i += 1
      col += 1
      let out = ''
      let closed = false
      const esc = { n: '\n', t: '\t', r: '\r', '"': '"', "'": "'", '\\': '\\' }
      while (i < n) {
        const c = src[i]
        if (c === '\\') { out += esc[src[i + 1]] !== undefined ? esc[src[i + 1]] : (src[i + 1] ?? ''); i += 2; col += 2; continue }
        if (c === quote) { i += 1; col += 1; closed = true; break }
        if (c === '\n') { line += 1; col = 1 } else col += 1
        out += c
        i += 1
      }
      if (!closed) throw new GrpcError('INVALID_ARGUMENT', `proto 解析失败（第 ${sl} 行第 ${sc} 列）: 字符串未闭合`)
      tokens.push({ kind: 'str', v: out, line: sl, col: sc })
      continue
    }
    if (/[A-Za-z_]/.test(ch)) {
      const sl = line
      const sc = col
      let v = ''
      while (i < n && /[A-Za-z0-9_.]/.test(src[i])) { v += src[i]; i += 1; col += 1 }
      tokens.push({ kind: 'ident', v, line: sl, col: sc })
      continue
    }
    if (/[0-9]/.test(ch) || (ch === '-' && /[0-9]/.test(src[i + 1] || ''))) {
      const sl = line
      const sc = col
      let v = ''
      if (ch === '-') { v += '-'; i += 1; col += 1 }
      while (i < n && /[0-9a-fA-FxX]/.test(src[i])) { v += src[i]; i += 1; col += 1 }
      tokens.push({ kind: 'num', v, line: sl, col: sc })
      continue
    }
    tokens.push({ kind: 'punct', v: ch, line, col })
    i += 1
    col += 1
  }
  tokens.push({ kind: 'eof', v: '', line, col })
  return tokens
}

/**
 * 解析 .proto 文本（proto3 子集）。
 * @returns {{ pkg: string, types: Map<string,object>, messages: object[], enums: object[], services: object[] }}
 *   types 按「全限定名」索引 message/enum；service.methods[].inputType/outputType 为解析后的
 *   message 类型对象，clientStreaming/serverStreaming 标记 streaming rpc。
 */
export function parseProto(text) {
  const tokens = tokenize(String(text ?? ''))
  let pos = 0
  const peek = () => tokens[pos]
  const next = () => {
    const t = tokens[pos]
    if (pos < tokens.length - 1) pos += 1
    return t
  }
  const fail = (tok, msg) => {
    throw new GrpcError('INVALID_ARGUMENT', `proto 解析失败（第 ${tok.line} 行第 ${tok.col} 列）: ${msg}`)
  }
  const expectPunct = (p, what) => {
    const t = next()
    if (t.kind === 'eof' || t.kind !== 'punct' || t.v !== p) fail(t, `期望 ${what || p}`)
    return t
  }
  const expectIdent = (what) => {
    const t = next()
    if (t.kind !== 'ident') fail(t, `期望 ${what || '标识符'}`)
    return t.v
  }
  /** 跳过一条语句：到顶层 ';'；遇 '{' 则吞到平衡 '}'（可带尾分号）。 */
  const skipStatement = () => {
    let depth = 0
    for (;;) {
      const t = next()
      if (t.kind === 'eof') fail(t, '语句未结束（缺少 ;）')
      if (t.kind === 'punct' && t.v === '{') depth += 1
      else if (t.kind === 'punct' && t.v === '}') {
        depth -= 1
        if (depth <= 0) {
          const x = peek()
          if (x.kind === 'punct' && x.v === ';') next()
          return
        }
      } else if (t.kind === 'punct' && t.v === ';' && depth === 0) return
    }
  }
  /** 跳过已吞掉 '{' 的平衡块。 */
  const skipBlockBody = () => {
    let depth = 1
    for (;;) {
      const t = next()
      if (t.kind === 'eof') fail(t, '块未闭合（缺少 }）')
      if (t.kind === 'punct' && t.v === '{') depth += 1
      else if (t.kind === 'punct' && t.v === '}') {
        depth -= 1
        if (depth === 0) return
      }
    }
  }

  const pkgParts = []
  const types = new Map()
  const messages = []
  const enums = []
  const services = []
  const pkgPrefix = () => pkgParts.join('.')

  const qualName = (scope, name) => {
    // 包前缀只对顶层（scope 为空）拼接：scope 非空时自身已含包前缀
    if (scope) return scope + '.' + name
    const pkg = pkgParts.join('.')
    return pkg ? pkg + '.' + name : name
  }

  /** enum：VALUE = N [opts];（option/reserved 跳过）。 */
  function parseEnum(scope) {
    const name = expectIdent('enum 名')
    const full = qualName(scope, name)
    const en = { kind: 'enum', name, fullName: full, valuesByName: new Map(), valuesByNumber: new Map() }
    types.set(full, en)
    enums.push(en)
    expectPunct('{', '"{"')
    for (;;) {
      const t = next()
      if (t.kind === 'eof') fail(t, 'enum ' + name + ' 未闭合')
      if (t.kind === 'punct' && t.v === '}') return en
      if (t.kind === 'punct' && t.v === ';') continue
      if (t.kind !== 'ident') fail(t, 'enum 成员异常')
      if (t.v === 'option' || t.v === 'reserved') { skipStatement(); continue }
      const vName = t.v
      expectPunct('=', '"="')
      const num = next()
      if (num.kind !== 'num') fail(num, 'enum 值必须是整数')
      const x = peek()
      if (x.kind === 'punct' && x.v === '[') { next(); skipStatement() } // [deprecated=true...] 跳到 ';'
      else expectPunct(';', '";"')
      const value = Number(num.v)
      if (!en.valuesByNumber.has(value)) en.valuesByNumber.set(value, vName) // allow_alias 保留首个
      en.valuesByName.set(vName, value)
    }
  }

  /** 字段尾：TypeName（已消费）name = N [opts];。 */
  function parseFieldRest(msg, typeName, repeated, inOneof) {
    const fname = expectIdent('字段名')
    expectPunct('=', '"="')
    const num = next()
    if (num.kind !== 'num') fail(num, '字段号必须是整数')
    let packed = undefined
    const x = peek()
    if (x.kind === 'punct' && x.v === '[') {
      next()
      // 仅提取 packed；其余字段选项（default/json_name/自定义）跳过
      for (;;) {
        const t = next()
        if (t.kind === 'eof') fail(t, '字段选项未闭合')
        if (t.kind === 'punct' && t.v === ']') break
        if (t.kind === 'ident' && t.v === 'packed') {
          expectPunct('=', '"="')
          const v = next()
          packed = v.v === 'true'
        } else if (t.kind === 'punct' && t.v === ';') fail(t, '字段选项异常')
      }
      expectPunct(';', '";"')
    } else {
      expectPunct(';', '";"')
    }
    const field = {
      name: fname,
      number: Number(num.v),
      repeated: Boolean(repeated),
      oneof: inOneof || null,
      packed,
      kind: SCALARS.has(typeName) ? 'scalar' : 'ref',
      scalar: SCALARS.has(typeName) ? typeName : null,
      refName: SCALARS.has(typeName) ? null : typeName,
      ref: null,
    }
    if (msg.byName.has(fname)) fail(num, '重复字段名 ' + fname)
    msg.fields.push(field)
    msg.byName.set(fname, field)
    msg.byNumber.set(field.number, field)
    return field
  }

  function parseOneof(msg, scope) {
    const name = expectIdent('oneof 名')
    expectPunct('{', '"{"')
    msg.oneofs.push(name)
    for (;;) {
      const t = next()
      if (t.kind === 'eof') fail(t, 'oneof ' + name + ' 未闭合')
      if (t.kind === 'punct' && t.v === '}') return
      if (t.kind === 'punct' && t.v === ';') continue
      if (t.kind !== 'ident') fail(t, 'oneof 成员异常')
      parseFieldRest(msg, t.v, false, name)
    }
  }

  function parseMessage(scope) {
    const name = expectIdent('message 名')
    const full = qualName(scope, name)
    const msg = { kind: 'message', name, fullName: full, fields: [], byName: new Map(), byNumber: new Map(), oneofs: [] }
    types.set(full, msg)
    messages.push(msg)
    expectPunct('{', '"{"')
    for (;;) {
      const t = next()
      if (t.kind === 'eof') fail(t, 'message ' + name + ' 未闭合')
      if (t.kind === 'punct' && t.v === '}') return msg
      if (t.kind === 'punct' && t.v === ';') continue
      if (t.kind !== 'ident') fail(t, 'message 成员异常')
      const kw = t.v
      if (kw === 'message') parseMessage(full)
      else if (kw === 'enum') parseEnum(full)
      else if (kw === 'oneof') parseOneof(msg, full)
      else if (kw === 'reserved' || kw === 'option' || kw === 'extensions') skipStatement()
      else if (kw === 'extend') { expectIdent('extendee'); expectPunct('{', '"{"'); skipBlockBody() }
      else if (kw === 'repeated' || kw === 'optional' || kw === 'required') {
        const typeName = expectIdent('字段类型')
        parseFieldRest(msg, typeName, kw === 'repeated', false)
      }
      else if (kw === 'map') {
        expectPunct('<', '"<"')
        const keyType = expectIdent('map key 类型')
        if (!['int32', 'int64', 'uint32', 'uint64', 'sint32', 'sint64', 'fixed32', 'fixed64', 'sfixed32', 'sfixed64', 'bool', 'string'].includes(keyType)) {
          fail(t, 'map key 只能是整型/bool/string')
        }
        expectPunct(',', '","')
        const valType = expectIdent('map value 类型')
        expectPunct('>', '">"')
        const fname = expectIdent('map 字段名')
        expectPunct('=', '"="')
        const num = next()
        if (num.kind !== 'num') fail(num, '字段号必须是整数')
        const x = peek()
        if (x.kind === 'punct' && x.v === '[') { next(); skipStatement() } else expectPunct(';', '";"')
        const field = {
          name: fname, number: Number(num.v), repeated: true, oneof: null, packed: null,
          kind: 'map', keyScalar: keyType,
          valueKind: SCALARS.has(valType) ? 'scalar' : 'ref',
          valueScalar: SCALARS.has(valType) ? valType : null,
          valueRefName: SCALARS.has(valType) ? null : valType,
          valueRef: null,
        }
        msg.fields.push(field)
        msg.byName.set(fname, field)
        msg.byNumber.set(field.number, field)
      } else parseFieldRest(msg, kw, false, false)
    }
  }

  function parseService(scope) {
    const name = expectIdent('service 名')
    const full = qualName(scope, name)
    const svc = { kind: 'service', name, fullName: full, methods: [] }
    expectPunct('{', '"{"')
    for (;;) {
      const t = next()
      if (t.kind === 'eof') fail(t, 'service ' + name + ' 未闭合')
      if (t.kind === 'punct' && t.v === '}') break
      if (t.kind === 'punct' && t.v === ';') continue
      if (t.kind !== 'ident') fail(t, 'service 成员异常')
      if (t.v === 'option') { skipStatement(); continue }
      if (t.v !== 'rpc') fail(t, 'service 内仅支持 rpc/option')
      const mname = expectIdent('rpc 名')
      expectPunct('(', '"("')
      let inStream = false
      let tt = next()
      if (tt.kind === 'ident' && tt.v === 'stream') { inStream = true; tt = next() }
      if (tt.kind !== 'ident') fail(tt, '期望请求类型')
      const inputName = tt.v
      expectPunct(')', '")"')
      const r = next()
      if (!(r.kind === 'ident' && r.v === 'returns')) fail(r, '期望 returns')
      expectPunct('(', '"("')
      let outStream = false
      let tt2 = next()
      if (tt2.kind === 'ident' && tt2.v === 'stream') { outStream = true; tt2 = next() }
      if (tt2.kind !== 'ident') fail(tt2, '期望响应类型')
      const outputName = tt2.v
      expectPunct(')', '")"')
      const tail = next()
      if (tail.kind === 'punct' && tail.v === '{') skipBlockBody()
      else if (!(tail.kind === 'punct' && tail.v === ';')) fail(tail, 'rpc 定义应以 ; 或 { } 结束')
      svc.methods.push({
        name: mname, inputTypeName: inputName, outputTypeName: outputName,
        clientStreaming: inStream, serverStreaming: outStream,
        inputType: null, outputType: null,
      })
    }
    services.push(svc)
  }

  /* ---- 顶层 ---- */
  for (;;) {
    const t = next()
    if (t.kind === 'eof') break
    if (t.kind === 'punct' && t.v === ';') continue
    if (t.kind !== 'ident') fail(t, '顶层只能是 syntax/package/import/option/message/enum/service/extend')
    const kw = t.v
    if (kw === 'syntax') {
      expectPunct('=', '"="')
      const v = next()
      if (v.kind !== 'str') fail(v, 'syntax 需要字符串字面量')
      if (v.v !== 'proto3') fail(v, '仅支持 syntax = "proto3"，收到 ' + JSON.stringify(v.v))
      expectPunct(';', '";"')
    } else if (kw === 'package') {
      for (;;) {
        const x = next()
        if (x.kind === 'ident') pkgParts.push(x.v)
        else if (x.kind === 'punct' && x.v === '.') continue
        else if (x.kind === 'punct' && x.v === ';') break
        else fail(x, 'package 名异常')
      }
    } else if (kw === 'import' || kw === 'option' || kw === 'edition') skipStatement()
    else if (kw === 'message') parseMessage('')
    else if (kw === 'enum') parseEnum('')
    else if (kw === 'service') parseService('')
    else if (kw === 'extend') { expectIdent('extendee'); expectPunct('{', '"{"'); skipBlockBody() }
    else fail(t, '未知顶层关键字 ' + kw)
  }

  /* ---- 第二遍：类型引用解析（最内作用域优先，逐级回退到包根） ---- */
  const resolveRef = (scopeFull, name, owner, fieldLabel) => {
    if (name.startsWith('.')) {
      const hit = types.get(name.slice(1))
      if (!hit) throw new GrpcError('INVALID_ARGUMENT', `proto 解析失败: ${owner} 的 ${fieldLabel} 引用了未知类型 ${name}`)
      return hit
    }
    const parts = scopeFull ? scopeFull.split('.') : []
    for (let i = parts.length; i >= 0; i -= 1) {
      const cand = [...parts.slice(0, i), name].join('.')
      const hit = types.get(cand)
      if (hit) return hit
    }
    throw new GrpcError('INVALID_ARGUMENT', `proto 解析失败: ${owner} 的 ${fieldLabel} 引用了未知类型 ${name}（缺少 import 或类型未定义）`)
  }
  for (const msg of messages) {
    for (const f of msg.fields) {
      if (f.kind === 'ref') f.ref = resolveRef(msg.fullName, f.refName, msg.fullName, '字段 ' + f.name)
      if (f.kind === 'map' && f.valueKind === 'ref') {
        f.valueRef = resolveRef(msg.fullName, f.valueRefName, msg.fullName, 'map 字段 ' + f.name)
      }
    }
  }
  for (const svc of services) {
    for (const m of svc.methods) {
      const inType = resolveRef(svc.fullName, m.inputTypeName, svc.fullName, 'rpc ' + m.name + ' 请求类型')
      const outType = resolveRef(svc.fullName, m.outputTypeName, svc.fullName, 'rpc ' + m.name + ' 响应类型')
      if (inType.kind !== 'message' || outType.kind !== 'message') {
        throw new GrpcError('INVALID_ARGUMENT', `proto 解析失败: rpc ${m.name} 的请求/响应必须是 message`)
      }
      m.inputType = inType
      m.outputType = outType
    }
  }

  return { pkg: pkgPrefix(), types, messages, enums, services }
}

/* ================= protobuf wire codec ================= */

const WT_VARINT = 0
const WT_64BIT = 1
const WT_LEN = 2
const WT_32BIT = 5

/** unsigned BigInt → varint 字节序列。 */
function varintBytes(value /* BigInt >= 0 */) {
  const out = []
  let v = value
  do {
    let b = v & 0x7fn
    v >>= 7n
    if (v > 0n) b |= 0x80n
    out.push(Number(b))
  } while (v > 0n)
  return out
}

function readVarint(buf, offset) {
  let result = 0n
  let shift = 0n
  let i = offset
  for (;;) {
    if (i >= buf.length) throw new GrpcError('INVALID_ARGUMENT', 'proto 解码失败: varint 越界')
    const b = buf[i]
    result |= BigInt(b & 0x7f) << shift
    i += 1
    if ((b & 0x80) === 0) break
    shift += 7n
    if (shift > 63n) throw new GrpcError('INVALID_ARGUMENT', 'proto 解码失败: varint 超过 10 字节')
  }
  return [result, i]
}

function zigzag(v /* BigInt */) {
  return v >= 0n ? v << 1n : ((-v) << 1n) - 1n
}

function unzigzag(v /* BigInt */) {
  return (v & 1n) === 0n ? v >> 1n : -((v + 1n) >> 1n)
}

/** 标量值 → 编码前 BigInt 归一（int64 接受字符串保精度）。 */
function toInt(v, path, label) {
  if (typeof v === 'bigint') return v
  if (typeof v === 'number') {
    if (!Number.isInteger(v)) throw new GrpcError('INVALID_ARGUMENT', `字段 ${path} 需要 64 位整数（收到非整数 ${v}）`)
    return BigInt(v)
  }
  if (typeof v === 'string' && /^-?\d+$/.test(v.trim())) return BigInt(v.trim())
  throw new GrpcError('INVALID_ARGUMENT', `字段 ${path} 需要 ${label}`)
}

/** 标量 payload 编码（不含 tag）；返回字节序列。 */
function scalarPayload(scalar, v, path) {
  switch (scalar) {
    case 'int32':
    case 'int64': {
      const b = BigInt.asIntN(scalar === 'int32' ? 32 : 64, toInt(v, path, '整数'))
      return varintBytes(BigInt.asUintN(64, b)) // 负数按 64 位补码 varint
    }
    case 'uint32':
    case 'uint64': {
      const b = toInt(v, path, '无符号整数')
      if (b < 0n) throw new GrpcError('INVALID_ARGUMENT', `字段 ${path} 不能为负数`)
      return varintBytes(b)
    }
    case 'sint32':
    case 'sint64': {
      const b = BigInt.asIntN(scalar === 'sint32' ? 32 : 64, toInt(v, path, '整数'))
      return varintBytes(zigzag(b))
    }
    case 'bool':
      return varintBytes(v ? 1n : 0n)
    case 'enum': {
      const b = toInt(v, path, 'enum 数值')
      return varintBytes(BigInt.asUintN(64, BigInt.asIntN(32, b)))
    }
    case 'fixed32': {
      const buf = Buffer.alloc(4)
      buf.writeUInt32LE(Number(toInt(v, path, '无符号整数')), 0)
      return [...buf]
    }
    case 'sfixed32': {
      const buf = Buffer.alloc(4)
      buf.writeInt32LE(Number(BigInt.asIntN(32, toInt(v, path, '整数'))), 0)
      return [...buf]
    }
    case 'fixed64': {
      const buf = Buffer.alloc(8)
      buf.writeBigUInt64LE(BigInt.asUintN(64, toInt(v, path, '无符号整数')), 0)
      return [...buf]
    }
    case 'sfixed64': {
      const buf = Buffer.alloc(8)
      buf.writeBigInt64LE(BigInt.asIntN(64, toInt(v, path, '整数')), 0)
      return [...buf]
    }
    case 'float': {
      const buf = Buffer.alloc(4)
      const num = typeof v === 'number' ? v : Number(v)
      if (!Number.isFinite(num)) throw new GrpcError('INVALID_ARGUMENT', `字段 ${path} 需要数字`)
      buf.writeFloatLE(num, 0)
      return [...buf]
    }
    case 'double': {
      const buf = Buffer.alloc(8)
      const num = typeof v === 'number' ? v : Number(v)
      if (!Number.isFinite(num)) throw new GrpcError('INVALID_ARGUMENT', `字段 ${path} 需要数字`)
      buf.writeDoubleLE(num, 0)
      return [...buf]
    }
    case 'string': {
      if (typeof v !== 'string') throw new GrpcError('INVALID_ARGUMENT', `字段 ${path} 需要字符串`)
      const bytes = Buffer.from(v, 'utf8')
      return [...varintBytes(BigInt(bytes.length)), ...bytes]
    }
    case 'bytes': {
      let bytes
      if (Buffer.isBuffer(v)) bytes = v
      else if (v instanceof Uint8Array) bytes = Buffer.from(v)
      else if (typeof v === 'string') bytes = Buffer.from(v, 'base64') // JSON 侧统一 base64
      else throw new GrpcError('INVALID_ARGUMENT', `字段 ${path} 需要 base64 字符串或 Buffer`)
      return [...varintBytes(BigInt(bytes.length)), ...bytes]
    }
    default:
      throw new GrpcError('INVALID_ARGUMENT', `字段 ${path} 的标量类型 ${scalar} 不支持`)
  }
}

/** 标量的「原生」wire type（packed 校验/解码分支用）。 */
function scalarWireType(scalar) {
  if (['double', 'fixed64', 'sfixed64'].includes(scalar)) return WT_64BIT
  if (['float', 'fixed32', 'sfixed32'].includes(scalar)) return WT_32BIT
  if (['string', 'bytes'].includes(scalar)) return WT_LEN
  return WT_VARINT
}

/** numeric/bool/enum 可 packed（proto3 默认 packed）。 */
function isPackable(f) {
  if (f.kind === 'scalar') return !['string', 'bytes'].includes(f.scalar)
  if (f.kind === 'ref' && f.ref && f.ref.kind === 'enum') return true
  return false
}

function fieldPacked(f) {
  if (!isPackable(f) || !f.repeated) return false
  return f.packed !== false // proto3 默认 packed，显式 [packed=false] 关闭
}

function tagBytes(number, wireType) {
  return varintBytes(BigInt(number) * 8n + BigInt(wireType))
}

/** enum 名/值都收：名字 → 数值（未知名原样交给数值校验报错）。 */
function enumValueOf(enumType, v) {
  if (typeof v === 'string' && enumType && enumType.valuesByName.has(v)) return enumType.valuesByName.get(v)
  return v
}

/**
 * JSON → 二进制：按 message 类型编码（未知字段名报 INVALID_ARGUMENT 带字段路径；
 * proto3 无必填，缺字段即缺失；未知 JSON 多余键视同未知字段名报错——请求侧宁可严一点）。
 */
export function encodeMessage(type, json, pathPrefix = '') {
  if (!type || type.kind !== 'message') throw new GrpcError('INVALID_ARGUMENT', 'encodeMessage 需要解析后的 message 类型')
  if (json === undefined || json === null) return Buffer.alloc(0)
  if (typeof json !== 'object' || Array.isArray(json)) {
    throw new GrpcError('INVALID_ARGUMENT', `消息 ${pathPrefix || type.fullName} 必须是 JSON 对象`)
  }
  const out = []
  for (const [key, value] of Object.entries(json)) {
    const f = type.byName.get(key)
    if (!f) {
      throw new GrpcError('INVALID_ARGUMENT', `消息 ${type.fullName} 不存在字段 ${pathPrefix}${key}（proto 未声明，禁止编码未知字段）`)
    }
    if (value === undefined) continue
    encodeField(out, f, value, pathPrefix)
  }
  return Buffer.from(out)
}

function encodeField(out, f, value, pathPrefix) {
  const path = pathPrefix + f.name
  if (f.kind === 'map') {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new GrpcError('INVALID_ARGUMENT', `字段 ${path} 需要对象（map<${f.keyScalar}, ${f.valueScalar || f.valueRefName}>）`)
    }
    for (const [k, v] of Object.entries(value)) {
      const entry = []
      // 字段1 = key，字段2 = value（proto3 map 的隐式子消息）
      entry.push(...tagBytes(1, f.keyScalar === 'string' || f.keyScalar === 'bytes' ? WT_LEN : scalarWireType(f.keyScalar)))
      entry.push(...scalarPayload(f.keyScalar, k, path))
      if (f.valueKind === 'scalar') {
        entry.push(...tagBytes(2, scalarWireType(f.valueScalar)))
        entry.push(...scalarPayload(f.valueScalar, v, path))
      } else if (f.valueKind === 'ref' && f.valueRef.kind === 'enum') {
        entry.push(...tagBytes(2, WT_VARINT))
        entry.push(...scalarPayload('enum', enumValueOf(f.valueRef, v), path))
      } else {
        const sub = encodeMessage(f.valueRef, v, path + '.')
        entry.push(...tagBytes(2, WT_LEN))
        entry.push(...varintBytes(BigInt(sub.length)))
        entry.push(...sub)
      }
      out.push(...tagBytes(f.number, WT_LEN))
      out.push(...varintBytes(BigInt(entry.length)))
      out.push(...entry)
    }
    return
  }
  if (f.repeated) {
    if (!Array.isArray(value)) {
      throw new GrpcError('INVALID_ARGUMENT', `字段 ${path} 需要数组（repeated）`)
    }
    if (value.length === 0) return
    if (fieldPacked(f)) {
      const isEnum = f.kind === 'ref' && f.ref && f.ref.kind === 'enum'
      const scalar = isEnum ? 'enum' : f.scalar
      const payload = []
      for (let i = 0; i < value.length; i += 1) {
        const item = isEnum ? enumValueOf(f.ref, value[i]) : value[i]
        payload.push(...scalarPayload(scalar, item, path))
      }
      out.push(...tagBytes(f.number, WT_LEN))
      out.push(...varintBytes(BigInt(payload.length)))
      out.push(...payload)
      return
    }
    for (let i = 0; i < value.length; i += 1) encodeSingle(out, f, value[i], pathPrefix)
    return
  }
  encodeSingle(out, f, value, pathPrefix)
}

function encodeSingle(out, f, value, pathPrefix) {
  const path = pathPrefix + f.name
  if (f.kind === 'scalar' || (f.kind === 'ref' && f.ref.kind === 'enum')) {
    const scalar = f.kind === 'scalar' ? f.scalar : 'enum'
    const item = f.kind === 'ref' ? enumValueOf(f.ref, value) : value
    out.push(...tagBytes(f.number, scalarWireType(scalar)))
    out.push(...scalarPayload(scalar, item, path))
    return
  }
  // 嵌套 message
  const sub = encodeMessage(f.ref, value, path + '.')
  out.push(...tagBytes(f.number, WT_LEN))
  out.push(...varintBytes(BigInt(sub.length)))
  out.push(...sub)
}

/** 二进制 → JSON。64 位整数回字符串、bytes 回 base64、repeated 归数组、map 归对象、enum 回名字。 */
export function decodeMessage(type, buf) {
  if (!type || type.kind !== 'message') throw new GrpcError('INVALID_ARGUMENT', 'decodeMessage 需要解析后的 message 类型')
  const out = {}
  let i = 0
  while (i < buf.length) {
    const [tag, ni] = readVarint(buf, i)
    i = ni
    const fieldNumber = Number(tag >> 3n)
    const wireType = Number(tag & 7n)
    const f = type.byNumber.get(fieldNumber)
    if (!f || f.number <= 0) {
      i = skipField(buf, i, wireType)
      continue
    }
    if (f.kind === 'map') {
      if (wireType !== WT_LEN) throw new GrpcError('INVALID_ARGUMENT', `proto 解码失败: 字段 ${f.name} wireType ${wireType} 不匹配`)
      const [len, n1] = readVarint(buf, i)
      const sub = buf.slice(n1, n1 + Number(len))
      i = n1 + Number(len)
      const entry = decodeMapEntry(f, sub)
      const slot = (out[f.name] = out[f.name] || {})
      slot[entry.key] = entry.value
      continue
    }
    if (f.repeated && wireType === WT_LEN && fieldPacked(f)) {
      // packed 帧：一段 payload 里连续装 N 个标量
      const [len, n1] = readVarint(buf, i)
      const end = n1 + Number(len)
      i = n1
      const arr = (out[f.name] = out[f.name] || [])
      while (i < end) {
        const [value, n2] = readScalarOrRef(f, buf, i, pathOf(f))
        arr.push(value)
        i = n2
      }
      continue
    }
    const [value, n2] = readSingle(buf, i, f, wireType)
    i = n2
    if (f.repeated) {
      const arr = (out[f.name] = out[f.name] || [])
      arr.push(value)
    } else {
      out[f.name] = value
    }
  }
  return out
}

function pathOf(f) { return f.name }

function decodeMapEntry(f, sub) {
  let key
  let value
  let i = 0
  while (i < sub.length) {
    const [tag, ni] = readVarint(sub, i)
    i = ni
    const num = Number(tag >> 3n)
    const wt = Number(tag & 7n)
    if (num === 1) {
      const [v, n2] = readScalar(sub, i, f.keyScalar, wt)
      key = v
      i = n2
    } else if (num === 2) {
      const [v, n2] = readValueOf(f.valueKind, f.valueScalar, f.valueRef, sub, i, wt)
      value = v
      i = n2
    } else {
      i = skipField(sub, i, wt)
    }
  }
  // JSON 对象键统一字符串
  return { key: key === undefined ? '' : String(key), value: value === undefined ? null : value }
}

function readScalar(buf, i, scalar, wireType) {
  const expect = scalarWireType(scalar)
  if (wireType !== expect) throw new GrpcError('INVALID_ARGUMENT', `proto 解码失败: ${scalar} wireType ${wireType} 与期望 ${expect} 不匹配`)
  switch (scalar) {
    case 'int32':
    case 'int64': {
      const [v, n] = readVarint(buf, i)
      return [scalar === 'int32' ? Number(BigInt.asIntN(32, v)) : BigInt.asIntN(64, v).toString(), n]
    }
    case 'uint32':
    case 'uint64': {
      const [v, n] = readVarint(buf, i)
      return [scalar === 'uint32' ? Number(v) : v.toString(), n]
    }
    case 'sint32':
    case 'sint64': {
      const [v, n] = readVarint(buf, i)
      const zz = unzigzag(v)
      return [scalar === 'sint32' ? Number(zz) : zz.toString(), n]
    }
    case 'bool': {
      const [v, n] = readVarint(buf, i)
      return [v !== 0n, n]
    }
    case 'enum': {
      const [v, n] = readVarint(buf, i)
      return [Number(BigInt.asIntN(32, v)), n]
    }
    case 'fixed32': {
      if (i + 4 > buf.length) throw new GrpcError('INVALID_ARGUMENT', 'proto 解码失败: fixed32 越界')
      return [buf.readUInt32LE(i), i + 4]
    }
    case 'sfixed32': {
      if (i + 4 > buf.length) throw new GrpcError('INVALID_ARGUMENT', 'proto 解码失败: sfixed32 越界')
      return [buf.readInt32LE(i), i + 4]
    }
    case 'fixed64': {
      if (i + 8 > buf.length) throw new GrpcError('INVALID_ARGUMENT', 'proto 解码失败: fixed64 越界')
      return [buf.readBigUInt64LE(i).toString(), i + 8]
    }
    case 'sfixed64': {
      if (i + 8 > buf.length) throw new GrpcError('INVALID_ARGUMENT', 'proto 解码失败: sfixed64 越界')
      return [buf.readBigInt64LE(i).toString(), i + 8]
    }
    case 'float': {
      if (i + 4 > buf.length) throw new GrpcError('INVALID_ARGUMENT', 'proto 解码失败: float 越界')
      return [buf.readFloatLE(i), i + 4]
    }
    case 'double': {
      if (i + 8 > buf.length) throw new GrpcError('INVALID_ARGUMENT', 'proto 解码失败: double 越界')
      return [buf.readDoubleLE(i), i + 8]
    }
    case 'string': {
      const [len, n] = readVarint(buf, i)
      const start = n
      const end = start + Number(len)
      if (end > buf.length) throw new GrpcError('INVALID_ARGUMENT', 'proto 解码失败: string 越界')
      return [buf.slice(start, end).toString('utf8'), end]
    }
    case 'bytes': {
      const [len, n] = readVarint(buf, i)
      const start = n
      const end = start + Number(len)
      if (end > buf.length) throw new GrpcError('INVALID_ARGUMENT', 'proto 解码失败: bytes 越界')
      return [buf.slice(start, end).toString('base64'), end]
    }
    default:
      throw new GrpcError('INVALID_ARGUMENT', 'proto 解码失败: 未知标量 ' + scalar)
  }
}

function readValueOf(valueKind, valueScalar, valueRef, buf, i, wireType) {
  if (valueKind === 'scalar') return readScalar(buf, i, valueScalar, wireType)
  if (valueRef.kind === 'enum') {
    const [v, n] = readScalar(buf, i, 'enum', wireType)
    return [enumName(valueRef, v), n]
  }
  if (wireType !== WT_LEN) throw new GrpcError('INVALID_ARGUMENT', 'proto 解码失败: 嵌套 message wireType 不匹配')
  const [len, n] = readVarint(buf, i)
  const end = n + Number(len)
  if (end > buf.length) throw new GrpcError('INVALID_ARGUMENT', 'proto 解码失败: 嵌套 message 越界')
  return [decodeMessage(valueRef, buf.slice(n, end)), end]
}

function enumName(enumType, value) {
  const name = enumType.valuesByNumber.get(value)
  return name !== undefined ? name : value
}

function readScalarOrRef(f, buf, i) {
  if (f.kind === 'ref' && f.ref.kind === 'enum') {
    const [v, n] = readScalar(buf, i, 'enum', WT_VARINT)
    return [enumName(f.ref, v), n]
  }
  return readScalar(buf, i, f.scalar, scalarWireType(f.scalar))
}

function readSingle(buf, i, f, wireType) {
  if (f.kind === 'scalar') return readScalar(buf, i, f.scalar, wireType)
  return readValueAdapted(f, buf, i, wireType)
}

/** readSingle 的实际实现（enum 单值也回名字）。 */
function readValueAdapted(f, buf, i, wireType) {
  if (f.kind === 'ref' && f.ref.kind === 'enum') {
    const [v, n] = readScalar(buf, i, 'enum', WT_VARINT)
    return [enumName(f.ref, v), n]
  }
  if (wireType !== WT_LEN) throw new GrpcError('INVALID_ARGUMENT', `proto 解码失败: 字段 ${f.name} wireType ${wireType} 不匹配`)
  const [len, n] = readVarint(buf, i)
  const end = n + Number(len)
  if (end > buf.length) throw new GrpcError('INVALID_ARGUMENT', 'proto 解码失败: 嵌套 message 越界')
  return [decodeMessage(f.ref, buf.slice(n, end)), end]
}

function skipField(buf, i, wireType) {
  switch (wireType) {
    case WT_VARINT: {
      const [, n] = readVarint(buf, i)
      return n
    }
    case WT_64BIT: return i + 8
    case WT_32BIT: return i + 4
    case WT_LEN: {
      const [len, n] = readVarint(buf, i)
      return n + Number(len)
    }
    default:
      throw new GrpcError('INVALID_ARGUMENT', 'proto 解码失败: 未知 wireType ' + wireType)
  }
}

/* ================= gRPC unary over node:http2 ================= */

function normalizeAddress(address) {
  const raw = String(address || '').trim()
  if (!/^https?:\/\//i.test(raw)) {
    throw new GrpcError('INVALID_ARGUMENT', 'address 必须是 http(s)://host:port 形态（h2c 或 TLS+ALPN h2）')
  }
  let u
  try {
    u = new URL(raw)
  } catch {
    throw new GrpcError('INVALID_ARGUMENT', 'address 无法解析: ' + raw)
  }
  return u
}

function flattenHeaders(h) {
  const out = {}
  for (const [k, v] of Object.entries(h || {})) {
    if (k.startsWith(':')) continue
    out[k] = Array.isArray(v) ? v.join(', ') : String(v)
  }
  return out
}

/** grpc-message 按 gRPC 规范是 percent-encoded，尽力解码（失败原样）。 */
function decodeGrpcMessage(msg) {
  if (typeof msg !== 'string') return ''
  try { return decodeURIComponent(msg) } catch { return msg }
}

/** 单次 unary 调用：一个 HTTP/2 session + 一个 stream，结束即关。 */
function callUnary(o) {
  return new Promise((resolve, reject) => {
    let settled = false
    let session = null
    let timer = null
    const finish = (err, val) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      if (session) {
        try { session.close() } catch { /* 已关忽略 */ }
      }
      if (err) reject(err)
      else resolve(val)
    }
    let u
    try {
      u = normalizeAddress(o.address) // 地址形态错误 → INVALID_ARGUMENT（原样上抛，不转 UNAVAILABLE）
    } catch (err) {
      reject(err)
      return
    }
    try {
      const opts = u.protocol === 'https:' ? { ALPNProtocols: ['h2'] } : {}
      session = http2.connect(u.origin, opts)
    } catch (err) {
      reject(new GrpcError('UNAVAILABLE', '连接失败: ' + (err && err.message ? err.message : String(err))))
      return
    }
    o.track(session)
    session.on('close', () => o.untrack(session))
    timer = setTimeout(() => {
      finish(new GrpcError('TIMEOUT', `gRPC 调用超时（${o.timeoutMs}ms，含连接与响应等待）`))
      try { session.destroy() } catch { /* 已销毁忽略 */ }
    }, o.timeoutMs)
    session.on('error', (err) => {
      // 连接拒绝 / TLS 证书错误 / 协议错误都归 UNAVAILABLE，原因带上原始 message
      finish(new GrpcError('UNAVAILABLE', '连接失败: ' + (err && err.message ? err.message : String(err))))
    })

    const headers = {
      ':method': 'POST',
      ':path': o.path,
      'content-type': 'application/grpc+proto',
      'te': 'trailers',
      'grpc-timeout': `${o.timeoutMs}m`,
    }
    for (const [k, v] of Object.entries(o.metadata || {})) {
      const key = String(k == null ? '' : k).toLowerCase()
      if (key === '' || key.startsWith(':') || RESERVED_META.has(key)) continue
      headers[key] = v == null ? '' : String(v)
    }

    const head = Buffer.alloc(5)
    head.writeUInt32BE(o.payload.length, 1) // compressed-flag=0 已为 0
    const frame = Buffer.concat([head, o.payload])

    const stream = session.request(headers)
    stream.on('error', (err) => {
      finish(new GrpcError('UNAVAILABLE', 'HTTP/2 流错误: ' + (err && err.message ? err.message : String(err))))
    })
    const chunks = []
    let httpStatus = null
    let headerStatus = null
    let headerMessage = null
    let trailerStatus = null
    let trailerMessage = null
    const trailerOut = {}
    stream.on('response', (h) => {
      httpStatus = Number(h[':status'] || 0)
      if (h['grpc-status'] !== undefined) headerStatus = Number(h['grpc-status'])
      if (h['grpc-message'] !== undefined) headerMessage = String(h['grpc-message'])
      Object.assign(trailerOut, flattenHeaders(h))
    })
    stream.on('data', (c) => chunks.push(c))
    stream.on('trailers', (t) => {
      Object.assign(trailerOut, flattenHeaders(t))
      if (t['grpc-status'] !== undefined) trailerStatus = Number(t['grpc-status'])
      if (t['grpc-message'] !== undefined) trailerMessage = String(t['grpc-message'])
    })
    stream.on('end', () => {
      // queueMicrotask 兜时序：trailers 帧与 END_STREAM 同批到达时，让 'trailers' 先入账
      queueMicrotask(() => {
        try {
        if (httpStatus !== null && httpStatus !== 200) {
          finish(new GrpcError('UNAVAILABLE', `HTTP 状态 ${httpStatus}（gRPC 要求 200）`))
          return
        }
        const grpcStatus = trailerStatus !== null && trailerStatus !== undefined
          ? trailerStatus
          : (headerStatus !== null && headerStatus !== undefined ? headerStatus : 0)
        const grpcMessage = decodeGrpcMessage(trailerMessage !== null && trailerMessage !== undefined ? trailerMessage : headerMessage)
        const buf = Buffer.concat(chunks)
        let messageBuf = Buffer.alloc(0)
        if (buf.length > 0) {
          if (buf.length < 5) {
            finish(new GrpcError('UNAVAILABLE', '响应 gRPC 帧不完整（不足 5 字节头）'))
            return
          }
          const flag = buf[0]
          if (flag !== 0) {
            finish(new GrpcError('UNAVAILABLE', '仅支持 uncompressed 响应（compressed-flag=' + flag + '）'))
            return
          }
          const len = buf.readUInt32BE(1)
          if (5 + len > buf.length) {
            finish(new GrpcError('UNAVAILABLE', '响应 gRPC 帧不完整（声明 ' + len + ' 字节，实到 ' + (buf.length - 5) + '）'))
            return
          }
          messageBuf = buf.slice(5, 5 + len)
        }
        if (grpcStatus !== 0) {
          const name = GRPC_STATUS_NAMES[grpcStatus] || 'STATUS_' + grpcStatus
          finish(new GrpcError('GRPC_ERROR', `gRPC 错误 ${name}(${grpcStatus})${grpcMessage ? ': ' + grpcMessage : ''}`))
          return
        }
        finish(null, {
          message: decodeMessage(o.outputType, messageBuf),
          trailers: trailerOut,
          statusCode: grpcStatus,
          statusName: GRPC_STATUS_NAMES[grpcStatus] || String(grpcStatus),
        })
        } catch (err) {
          finish(err instanceof GrpcError ? err : new GrpcError('INVALID_ARGUMENT', err && err.message ? err.message : String(err)))
        }
      })
    })
    stream.end(frame)
  })
}

export function createGrpcClient() {
  const sessions = new Set()

  return {
    /**
     * invoke({ address, proto, service, method, message, metadata, timeoutMs })
     * 成功 → { address, path, message, trailers, status:'OK', statusCode:0, timeMs }；
     * 失败 → { ok:false, error:{ code, message } }（不抛出，UI 拿 code 分支展示）。
     */
    async invoke(opts = {}) {
      const started = Date.now()
      const tracked = new Set()
      const track = (s) => { tracked.add(s); sessions.add(s) }
      const untrack = (s) => { tracked.delete(s); sessions.delete(s) }
      try {
        const address = typeof opts.address === 'string' ? opts.address : ''
        const protoText = typeof opts.proto === 'string' ? opts.proto : ''
        if (protoText.trim() === '') throw new GrpcError('INVALID_ARGUMENT', 'proto（.proto 全文）不能为空')
        const service = String(opts.service ?? '').replace(/^\/+/, '').trim()
        if (service === '') throw new GrpcError('INVALID_ARGUMENT', 'service 不能为空（如 pkg.Greeter，不带斜杠）')
        const methodName = String(opts.method ?? '').trim()
        if (methodName === '') throw new GrpcError('INVALID_ARGUMENT', 'method 不能为空')

        const registry = parseProto(protoText)
        const svcDef = registry.services.find((s) => s.fullName === service || s.name === service || s.fullName.endsWith('.' + service))
        if (!svcDef) {
          const known = registry.services.map((s) => s.fullName).join(', ') || '（proto 未声明任何 service）'
          throw new GrpcError('INVALID_ARGUMENT', `service ${service} 在 proto 中不存在（可用: ${known}）`)
        }
        const mDef = svcDef.methods.find((m) => m.name === methodName)
        if (!mDef) {
          throw new GrpcError('INVALID_ARGUMENT', `method ${methodName} 在 ${svcDef.fullName} 中不存在（可用: ${svcDef.methods.map((m) => m.name).join(', ') || '无'}）`)
        }
        if (mDef.clientStreaming || mDef.serverStreaming) {
          throw new GrpcError('INVALID_ARGUMENT', `rpc ${mDef.name} 是 streaming（client=${mDef.clientStreaming}/server=${mDef.serverStreaming}），仅支持 unary`)
        }
        const message = opts.message === undefined || opts.message === null ? {} : opts.message
        if (typeof message !== 'object' || Array.isArray(message)) {
          throw new GrpcError('INVALID_ARGUMENT', 'message 必须是 JSON 对象')
        }
        const payload = encodeMessage(mDef.inputType, message)
        const timeoutMs = Math.min(MAX_TIMEOUT_MS, Math.max(1, Number.isFinite(opts.timeoutMs) ? Number(opts.timeoutMs) : DEFAULT_TIMEOUT_MS))
        const metadata = opts.metadata && typeof opts.metadata === 'object' && !Array.isArray(opts.metadata) ? opts.metadata : {}
        const path = '/' + svcDef.fullName + '/' + mDef.name
        const result = await callUnary({ address, path, payload, metadata, timeoutMs, outputType: mDef.outputType, track, untrack })
        return {
          address,
          path,
          message: result.message,
          trailers: result.trailers,
          status: result.statusName,
          statusCode: result.statusCode,
          timeMs: Date.now() - started,
        }
      } catch (err) {
        const grpcErr = err instanceof GrpcError ? err : new GrpcError('INVALID_ARGUMENT', err && err.message ? err.message : String(err))
        return { ok: false, error: { code: grpcErr.code, message: grpcErr.message } }
      } finally {
        // invoke 自身兜底收尾（callUnary 内部已 close，这里兜极端路径的残留）
        for (const s of tracked) {
          if (!s.closed && !s.destroyed) {
            try { s.close() } catch { /* 忽略 */ }
          }
          sessions.delete(s)
        }
      }
    },

    /** closeAll：插件卸载时销毁仍挂着的 HTTP/2 session（超时兜底）。 */
    async closeAll() {
      const list = [...sessions]
      sessions.clear()
      for (const s of list) {
        try { s.destroy() } catch { /* 忽略 */ }
      }
      return { closed: list.length }
    },
  }
}
