/**
 * Dubbo 调试客户端（feature-matrix：Dubbo 由「仅协议位」提升为真实 TCP 调用）。
 * 零 npm 依赖：Dubbo 私有协议帧 + hessian-lite codec（Hessian 2.0 规范表）+ node:net。
 *
 * Dubbo 协议帧（16B 头 + bodyLen 定长，见 Apache dubbo 协议文档）：
 *  - 0-1  魔数 0xdabb；2  flag：ReqOrRes(0x80)|2way(0x40)|event(0x20)|序列化类型低 5 位（hessian2=2）；
 *  - 3    响应状态（请求帧恒 0）：20 OK / 30 CLIENT_TIMEOUT / 40 SERVER_TIMEOUT / 50 BAD_REQUEST /
 *         60 BAD_RESPONSE / 70 SERVICE_NOT_FOUND / 80 SERVICE_ERROR / 90 SERVER_ERROR /
 *         100 CLIENT_ERROR / 110 SERVER_THREADPOOL_EXHAUSTED_ERROR；
 *  - 4-11 8B 大端消息 id（响应按 id 配对）；12-15 4B 大端 bodyLen。
 *  - 请求体（hessian 值序列）：dubbo 版本 "2.0.2"、path（服务路径）、version、method、
 *    parameterTypes 描述符串、各参数、attachments map（可选）。
 *    描述符串按 Apache dubbo ReflectUtils.getDesc 为「直接拼接、无分隔符」
 *    （如 int+String → 'ILjava/lang/String;'）——任务文本写「空格分隔」，真实服务端
 *    desc2classArray 按描述符字符顺序解析，带空格会解析失败，故按真实协议拼接。
 *  - 响应体：首字节 flag：0=值 / 1=值+attachments / 2=null / 3=异常 / 4=异常+attachments，
 *    后跟 hessian 值（带 attachments 时再读一个 map）。异常值是 Throwable 的 hessian 形态
 *    （class-def 对象），取类名 + detailMessage/message 拼 DUBBO_ERROR。
 *
 * hessian-lite codec（Hessian 2.0 规范表，形态核对自 hessian.js v2 / caucho 规范；
 * 解码按表全分支，编码只出规范形态）：
 *  - null 'N'(0x4e)；bool 'T'(0x54)/'F'(0x46)；
 *  - int：0x80-0xbf 单字节(value=code-0x90)、0xc0-0xcf+b0、0xd0-0xd7+b0b1、'I'(0x49)+4B；
 *  - long：0xd8-0xef(code-0xe0)、0xf0-0xff+b0、0x38-0x3f+b0b1、'Y'(0x59)+4B、'L'(0x4c)+8B
 *    （解码回字符串保精度；编码出规范全形 'L'）；
 *  - double：0x5b=0.0、0x5c=1.0、0x5d+b0(8bit)、0x5e+b0b1(16bit)、0x5f+4B(float)、'D'+8B；
 *  - date：'J'(0x4a)+8B 毫秒；'K'(0x4b)+4B 分钟（编码在整分时出紧凑 'K'，否则 'A'→0x4a 全形；
 *    任务文本写的 'd'(0x64)+8B 是 Hessian 1.0 形态且与 2.0 的 0x60-0x6f 对象段冲突，不采用）；
 *  - string：'S'(0x53)+16bit 字符长度终块、'R'(0x52) 非终块（>32768 字符分块，块尾不劈代理对）、
 *    0x00-0x1f 紧凑（0-31 字符）、0x30-0x33+b0（≤1023 字符）；长度按 UTF-16 char 数、
 *    payload 为 UTF-8 字节；
 *  - binary：'B'(0x42)+16bit 终块、'A'(0x41) 非终块、0x20-0x2f 紧凑（≤15 字节）、
 *    0x34-0x37+b0（≤1023 字节）；JSON 侧 base64；
 *  - list：0x70-0x77 有类型定长 0-7（type + 元素，无 'Z'）、0x78-0x7f 无类型定长 0-7、
 *    'V'(0x56)+type+紧凑 int 长度（定长）、'X'(0x58)+紧凑 int 长度（无类型定长）、
 *    'U'(0x55)+type+元素+'Z'（变长容错）、'W'(0x57)+元素+'Z'（无类型变长容错）；
 *  - map：'M'(0x4d)+type+键值对+'Z'(0x5a) / 'H'(0x48) 无类型+键值对+'Z'（1.0 的 'z'(0x7a)
 *    结尾在循环里同样接受）；
 *  - class 定义 'C'(0x43)+类名+紧凑 int 字段数+字段名串（随后紧跟实例字段值）；
 *    对象实例 0x60-0x6f（def 直接引用）/ 'O'(0x4f)+紧凑 int def 引用 → { __class: 类型, ... }；
 *  - 引用 'Q'(0x51)+紧凑 int（共享 list/map/对象）；type 字段可为「紧凑 int 类型回引」
 *    （类型表去重，解码维护 types[]）。
 *
 * 类型映射边界（明确不做）：
 *  - 无 POJO 字节码/字段反射：直连调用传复杂对象按 hessian map 编码（服务端需 Map 兼容），
 *    传 POJO 参数请走 generic=true（$invoke 泛化，args 元素以 map/list/标量编码）；
 *  - 编码不产出共享引用（'Q'）/紧凑 int/long，只出规范全形（服务端解码无影响）；
 *  - Date 参数需显式 java.util.Date 描述符 + ISO 字符串/毫秒数值；
 *  - Hessian 1.0 服务端（'d' 日期、's' 串块、'v' 无类型列表、0x7a 结尾）不在支持范围，
 *    仅 0x7a 结尾作为循环终止兼容保留。
 */

import net from 'node:net'

const DEFAULT_TIMEOUT_MS = 10000
const MAX_TIMEOUT_MS = 10 * 60 * 1000
const DUBBO_VERSION = '2.0.2'
const MAGIC = 0xdabb
const FLAG_REQUEST = 0x80
const FLAG_TWOWAY = 0x40
const SERIALIZATION_HESSIAN2 = 2
const GENERIC_INTERFACE = 'org.apache.dubbo.rpc.service.GenericService'
const GENERIC_DESCS = ['Ljava/lang/String;', '[Ljava/lang/String;', '[Ljava/lang/Object;']

/** 响应状态 → 文案（dubbo 协议表）。 */
const RESPONSE_STATUS_TEXT = {
  20: 'OK', 30: 'CLIENT_TIMEOUT', 40: 'SERVER_TIMEOUT', 50: 'BAD_REQUEST',
  60: 'BAD_RESPONSE', 70: 'SERVICE_NOT_FOUND', 80: 'SERVICE_ERROR', 90: 'SERVER_ERROR',
  100: 'CLIENT_ERROR', 110: 'SERVER_THREADPOOL_EXHAUSTED_ERROR',
}

/** 响应体首字节 flag。 */
const RESP_FLAG_VALUE = 0x00
const RESP_FLAG_VALUE_WITH_ATTACHMENTS = 0x01
const RESP_FLAG_NULL = 0x02
const RESP_FLAG_EXCEPTION = 0x03
const RESP_FLAG_EXCEPTION_WITH_ATTACHMENTS = 0x04

/** list/map 终止符：2.0 'Z'(0x5a)；1.0 'z'(0x7a) 循环兼容。 */
const TAG_END = 0x5a
const TAG_END_LEGACY = 0x7a

/** 带 code 的 Dubbo 客户端错误：code ∈ INVALID_ARGUMENT/DUBBO_ERROR/UNAVAILABLE/TIMEOUT。 */
export class DubboError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'DubboError'
    this.code = code
    this.status = code === 'INVALID_ARGUMENT' ? 400 : code === 'TIMEOUT' ? 504 : 502
  }
}

/* ================= Java 描述符工具 ================= */

/** Java 类名 → JVM 描述符：java.lang.String → Ljava/lang/String;，int → I，X[] → [LX;。 */
export function javaDescriptor(name) {
  const cn = String(name || '').trim()
  const prims = {
    void: 'V', int: 'I', long: 'J', double: 'D', boolean: 'Z', float: 'F', short: 'S', byte: 'B', char: 'C',
  }
  let n = cn
  let dims = 0
  while (n.endsWith('[]')) { dims += 1; n = n.slice(0, -2) }
  if (prims[n]) return '['.repeat(dims) + prims[n]
  return '['.repeat(dims) + 'L' + n.replace(/\./g, '/') + ';'
}

/* ================= hessian-lite codec：编码（只出规范形态） ================= */

/**
 * 紧凑 int 编码（Hessian 2.0 规范表；长度/class 字段数/ref id 用）：
 * -16..47 单字节、-2048..2047 两字节、-262144..262143 三字节、其余 'I'+4B。
 */
function writeIntBytes(val) {
  if (val >= -16 && val <= 47) return Buffer.from([val + 0x90])
  if (val >= -2048 && val <= 2047) {
    const buf = Buffer.alloc(2)
    buf[0] = (val >> 8) + 0xc8
    buf[1] = val & 0xff
    return buf
  }
  if (val >= -262144 && val <= 262143) {
    const buf = Buffer.alloc(3)
    buf[0] = (val >> 16) + 0xd4
    buf.writeUInt16BE(val & 0xffff, 1)
    return buf
  }
  const buf = Buffer.alloc(5)
  buf[0] = 0x49
  buf.writeInt32BE(val, 1)
  return buf
}

function hessianStringBytes(v) {
  const out = []
  let rest = v
  let remaining = rest.length // 长度按 UTF-16 char 数
  // 超过 32768 字符先发 'R' 非终块（块尾不劈代理对），最后一段为终块
  const CHUNK = 0x8000
  while (remaining > CHUNK) {
    let take = CHUNK
    const tail = rest.charCodeAt(take - 1)
    if (tail >= 0xd800 && tail <= 0xdbff) take -= 1 // 块不能以高位代理结尾
    const head = Buffer.alloc(3)
    head[0] = 0x52 // 'R' 非终块
    head.writeUInt16BE(take, 1)
    out.push(head, Buffer.from(rest.slice(0, take), 'utf8'))
    rest = rest.slice(take)
    remaining = rest.length
  }
  if (remaining < 32) {
    out.push(Buffer.from([remaining]), Buffer.from(rest, 'utf8')) // 0x00+n 紧凑终块
  } else if (remaining <= 1023) {
    const head = Buffer.alloc(2)
    head[0] = 0x30 + (remaining >> 8)
    head[1] = remaining & 0xff
    out.push(head, Buffer.from(rest, 'utf8'))
  } else {
    const head = Buffer.alloc(3)
    head[0] = 0x53 // 'S' 终块
    head.writeUInt16BE(remaining, 1)
    out.push(head, Buffer.from(rest, 'utf8'))
  }
  return out
}

function hessianBinaryBytes(v) {
  const buf = Buffer.isBuffer(v) ? v : Buffer.from(v) // Uint8Array/数组
  const out = []
  let offset = 0
  const CHUNK = 4093 // hessian.js 同款分块阈值（≤0xffff 均可，取保守值）
  while (buf.length - offset > CHUNK) {
    const head = Buffer.alloc(3)
    head[0] = 0x41 // 'A' 非终块
    head.writeUInt16BE(CHUNK, 1)
    out.push(head, buf.subarray(offset, offset + CHUNK))
    offset += CHUNK
  }
  const left = buf.length - offset
  if (left <= 15) {
    out.push(Buffer.from([0x20 + left]), buf.subarray(offset))
  } else if (left <= 1023) {
    const head = Buffer.alloc(2)
    head[0] = 0x34 + (left >> 8)
    head[1] = left & 0xff
    out.push(head, buf.subarray(offset))
  } else {
    const head = Buffer.alloc(3)
    head[0] = 0x42 // 'B' 终块
    head.writeUInt16BE(left, 1)
    out.push(head, buf.subarray(offset))
  }
  return out
}

/** 单值编码（追加到 out 数组，元素为 Buffer）。 */
function hessianEncodeValue(out, v) {
  if (v === undefined || v === null) {
    out.push(Buffer.from([0x4e])) // 'N'
    return
  }
  if (typeof v === 'boolean') {
    out.push(Buffer.from([v ? 0x54 : 0x46])) // 'T'/'F'
    return
  }
  if (typeof v === 'bigint') {
    const head = Buffer.alloc(9)
    head[0] = 0x4c // 'L'
    head.writeBigInt64BE(BigInt.asIntN(64, v), 1)
    out.push(head)
    return
  }
  if (typeof v === 'number') {
    if (Number.isInteger(v) && v >= -2147483648 && v <= 2147483647) {
      const head = Buffer.alloc(5)
      head[0] = 0x49 // 'I'
      head.writeInt32BE(v, 1)
      out.push(head)
    } else if (Number.isInteger(v) && v >= Number.MIN_SAFE_INTEGER && v <= Number.MAX_SAFE_INTEGER) {
      const head = Buffer.alloc(9)
      head[0] = 0x4c // 'L'（超 32 位整数走 64 位 long）
      head.writeBigInt64BE(BigInt(v), 1)
      out.push(head)
    } else {
      const num = Number(v)
      if (!Number.isFinite(num)) throw new DubboError('INVALID_ARGUMENT', 'hessian 编码失败: 非有限数字')
      const head = Buffer.alloc(9)
      head[0] = 0x44 // 'D'
      head.writeDoubleBE(num, 1)
      out.push(head)
    }
    return
  }
  if (typeof v === 'string') {
    out.push(...hessianStringBytes(v))
    return
  }
  if (v instanceof Date) {
    const ms = v.getTime()
    if (ms % 60000 === 0) {
      const minutes = ms / 60000
      if (minutes >= -0x80000000 && minutes <= 0x7fffffff) {
        const head = Buffer.alloc(5)
        head[0] = 0x4b // 'K' 分钟精度紧凑 date
        head.writeInt32BE(minutes, 1)
        out.push(head)
        return
      }
    }
    const head = Buffer.alloc(9)
    head[0] = 0x4a // 'J' 8B 毫秒
    head.writeBigInt64BE(BigInt(ms), 1)
    out.push(head)
    return
  }
  if (v instanceof Uint8Array || Buffer.isBuffer(v)) {
    out.push(...hessianBinaryBytes(v))
    return
  }
  if (Array.isArray(v)) {
    const len = v.length
    if (len <= 7) {
      out.push(Buffer.from([0x78 + len])) // 无类型定长 list（无 type、无 'Z'）
      for (const item of v) hessianEncodeValue(out, item)
    } else {
      out.push(Buffer.from([0x58])) // 'X' 无类型定长 + 紧凑 int 长度
      out.push(writeIntBytes(len))
      for (const item of v) hessianEncodeValue(out, item)
    }
    return
  }
  if (typeof v === 'object') {
    // 对象/Map → hessian map；带 __class 的走 'M'+type（decode 的 class 对象可回写）
    const cls = typeof v.__class === 'string' && v.__class !== '' ? v.__class : null
    const entries = Object.entries(v).filter(([k]) => !(cls && k === '__class'))
    if (cls) {
      out.push(Buffer.from([0x4d]), ...hessianStringBytes(cls)) // 'M' + type
    } else {
      out.push(Buffer.from([0x48])) // 'H' 无类型 map
    }
    for (const [k, item] of entries) {
      hessianEncodeValue(out, String(k))
      hessianEncodeValue(out, item)
    }
    out.push(Buffer.from([TAG_END])) // 'Z'
    return
  }
  throw new DubboError('INVALID_ARGUMENT', 'hessian 编码失败: 不支持的值类型 ' + typeof v)
}

/**
 * JSON 值 → hessian 字节串。值形态见文件头「类型映射边界」。
 * @returns {Buffer}
 */
export function hessianEncode(value) {
  const out = []
  hessianEncodeValue(out, value)
  return Buffer.concat(out)
}

/* ================= hessian-lite codec：解码（Hessian 2.0 规范表全分支） ================= */

/** 解码上下文：pos 游标 + 共享引用表 + class 定义表 + 类型表（type 回引用）。 */
function makeCtx(buf, offset) {
  return { buf, pos: offset, refs: [], classDefs: [], types: [] }
}

function need(ctx, n, what) {
  if (ctx.pos + n > ctx.buf.length) {
    throw new DubboError('INVALID_ARGUMENT', `hessian 解码失败: ${what || '数据'}越界（需 ${n} 字节，剩 ${ctx.buf.length - ctx.pos}）`)
  }
}

function u8(ctx) {
  need(ctx, 1, 'tag')
  return ctx.buf[ctx.pos++]
}

/** UTF-8 字节流按「UTF-16 char 数」读字符串（Hessian 长度单位是字符不是字节）。 */
function readUtf8Chars(ctx, charLen) {
  let chars = 0
  let end = ctx.pos
  while (chars < charLen) {
    if (end >= ctx.buf.length) throw new DubboError('INVALID_ARGUMENT', 'hessian 解码失败: 字符串越界')
    const b = ctx.buf[end]
    const unit = b < 0x80 ? 1 : b < 0xe0 ? 2 : b < 0xf0 ? 3 : 4
    end += unit
    chars += 1
  }
  const s = ctx.buf.subarray(ctx.pos, end).toString('utf8')
  ctx.pos = end
  return s
}

/** 从已读出的 tag 解析紧凑 int（'I' 4B 也认）：'V'/'X' 长度、'C' 字段数、'Q' ref、类型回引用。 */
function readIntFromTag(ctx, tag) {
  if (tag >= 0x80 && tag <= 0xbf) return tag - 0x90
  if (tag >= 0xc0 && tag <= 0xcf) { need(ctx, 1, 'int'); const b0 = ctx.buf[ctx.pos++]; return ((tag - 0xc8) << 8) | b0 }
  if (tag >= 0xd0 && tag <= 0xd7) { need(ctx, 2, 'int'); const b0 = ctx.buf[ctx.pos++]; const b1 = ctx.buf[ctx.pos++]; return ((tag - 0xd4) << 16) | (b0 << 8) | b1 }
  if (tag === 0x49) { need(ctx, 4, 'int'); const v = ctx.buf.readInt32BE(ctx.pos); ctx.pos += 4; return v }
  throw new DubboError('INVALID_ARGUMENT', 'hessian 解码失败: int 形态异常 0x' + tag.toString(16))
}

function readIntValue(ctx) {
  return readIntFromTag(ctx, u8(ctx))
}

/**
 * list/map/class-def 的 type 字段（Hessian 2.0）：字符串形态（终块/非终块）或
 * 「紧凑 int 类型回引用」（类型表去重）。
 */
function readType(ctx) {
  const tag = u8(ctx)
  const isStringForm = (tag >= 0x00 && tag <= 0x1f) || (tag >= 0x30 && tag <= 0x33) || tag === 0x52 || tag === 0x53
  if (isStringForm) {
    ctx.pos -= 1
    const type = decodeString(ctx)
    ctx.types.push(type)
    return type
  }
  const ref = readIntFromTag(ctx, tag)
  const hit = ctx.types[ref]
  if (hit === undefined) throw new DubboError('INVALID_ARGUMENT', 'hessian 解码失败: 类型回引用不存在 #' + ref)
  return hit
}

/** 字符串解码（终块 + 'R' 非终块循环）。 */
function decodeString(ctx) {
  let s = ''
  let tag = u8(ctx)
  for (;;) {
    let len
    if (tag >= 0x00 && tag <= 0x1f) len = tag
    else if (tag >= 0x30 && tag <= 0x33) { need(ctx, 1, '字符串长度'); len = ((tag - 0x30) << 8) | ctx.buf[ctx.pos++] }
    else if (tag === 0x53 || tag === 0x52) { need(ctx, 2, '字符串长度'); len = ctx.buf.readUInt16BE(ctx.pos); ctx.pos += 2 }
    else throw new DubboError('INVALID_ARGUMENT', 'hessian 解码失败: 字符串形态异常 0x' + tag.toString(16))
    s += readUtf8Chars(ctx, len)
    if (tag === 0x52) { // 'R' 非终块，继续吞块
      tag = u8(ctx)
      continue
    }
    return s
  }
}

/** binary 解码（'A' 非终块循环 + 'B'/'x20-2f'/'x34-37' 终块；'b' 为 1.0 兼容块）。 */
function decodeBinary(ctx) {
  const parts = []
  let tag = u8(ctx)
  for (;;) {
    let len
    if (tag >= 0x20 && tag <= 0x2f) len = tag - 0x20
    else if (tag >= 0x34 && tag <= 0x37) { need(ctx, 1, 'binary 长度'); len = ((tag - 0x34) << 8) | ctx.buf[ctx.pos++] }
    else if (tag === 0x42 || tag === 0x41 || tag === 0x62) { need(ctx, 2, 'binary 长度'); len = ctx.buf.readUInt16BE(ctx.pos); ctx.pos += 2 }
    else throw new DubboError('INVALID_ARGUMENT', 'hessian 解码失败: binary 形态异常 0x' + tag.toString(16))
    need(ctx, len, 'binary 数据')
    parts.push(ctx.buf.subarray(ctx.pos, ctx.pos + len))
    ctx.pos += len
    if (tag === 0x41 || tag === 0x62) { // 非终块（0x41 'A'；0x62 'b' 1.0 兼容）
      tag = u8(ctx)
      continue
    }
    return Buffer.concat(parts).toString('base64')
  }
}

/**
 * list 解码：tag 携带形态（0x70-0x77 有类型定长 0-7、0x78-0x7f 无类型定长 0-7、
 * 'V' 有类型 + 紧凑 int 长度、'X' 无类型 + 紧凑 int 长度、'U'/'W' 变长到 'Z'）。
 */
function decodeList(ctx, tag) {
  let type = null
  let length = -1
  let variable = false
  if (tag >= 0x70 && tag <= 0x77) { type = readType(ctx); length = tag - 0x70 }
  else if (tag >= 0x78 && tag <= 0x7f) { length = tag - 0x78 }
  else if (tag === 0x56) { type = readType(ctx); length = readIntValue(ctx) }
  else if (tag === 0x58) { length = readIntValue(ctx) }
  else if (tag === 0x55) { type = readType(ctx); variable = true } // 'U' 有类型变长（容错）
  else if (tag === 0x57) { variable = true } // 'W' 无类型变长（容错）
  else throw new DubboError('INVALID_ARGUMENT', 'hessian 解码失败: list 形态异常 0x' + tag.toString(16))

  const arr = []
  ctx.refs.push(arr) // 先入引用表（支持自引用）
  if (variable) {
    for (;;) {
      const t = u8(ctx)
      if (t === TAG_END || t === TAG_END_LEGACY) break // 'Z'（'z' 兼容）
      ctx.pos -= 1
      arr.push(hessianDecodeValue(ctx).value)
    }
  } else {
    for (let i = 0; i < length; i += 1) arr.push(hessianDecodeValue(ctx).value)
  }
  return arr
}

function decodeMap(ctx, tag) {
  const type = tag === 0x4d ? readType(ctx) : null // 'M' 带 type，'H' 无类型
  const obj = {}
  ctx.refs.push(obj)
  for (;;) {
    const t = u8(ctx)
    if (t === TAG_END || t === TAG_END_LEGACY) break // 'Z'（'z' 兼容）
    ctx.pos -= 1
    const key = hessianDecodeValue(ctx).value
    const value = hessianDecodeValue(ctx).value
    obj[key === undefined || key === null ? '' : String(key)] = value
  }
  if (type && typeof type === 'string' && type !== '' && obj.__class === undefined) obj.__class = type
  return obj
}

/**
 * 单值解码（Hessian 2.0 全表分支；0x7a 在值位置仍是无类型定长 list 长度 2，仅在
 * map/list 的「终止判断」处优先于区间匹配）。
 * @returns {{ value: any }} value 为 JSON 安全形态；ctx.pos 指向下一值起点。
 */
function hessianDecodeValue(ctx) {
  const tag = u8(ctx)
  switch (true) {
    case tag === 0x4e: return { value: null } // 'N'
    case tag === 0x54: return { value: true } // 'T'
    case tag === 0x46: return { value: false } // 'F'
    case tag >= 0x80 && tag <= 0xbf: return { value: tag - 0x90 } // 单字节 int
    case tag >= 0xc0 && tag <= 0xcf: {
      need(ctx, 1, 'int')
      return { value: ((tag - 0xc8) << 8) | ctx.buf[ctx.pos++] }
    }
    case tag >= 0xd0 && tag <= 0xd7: {
      need(ctx, 2, 'int')
      const b0 = ctx.buf[ctx.pos++]
      const b1 = ctx.buf[ctx.pos++]
      return { value: ((tag - 0xd4) << 16) | (b0 << 8) | b1 }
    }
    case tag === 0x49: { // 'I' 32 位 int
      need(ctx, 4, 'int')
      const v = ctx.buf.readInt32BE(ctx.pos)
      ctx.pos += 4
      return { value: v }
    }
    case tag >= 0xd8 && tag <= 0xef: return { value: tag - 0xe0 } // 单字节 long
    case tag >= 0xf0 && tag <= 0xff: {
      need(ctx, 1, 'long')
      return { value: ((tag - 0xf8) << 8) | ctx.buf[ctx.pos++] }
    }
    case tag >= 0x38 && tag <= 0x3f: { // 三字节 long
      need(ctx, 2, 'long')
      const b0 = ctx.buf[ctx.pos++]
      const b1 = ctx.buf[ctx.pos++]
      return { value: String(((tag - 0x3c) << 16) | (b0 << 8) | b1) }
    }
    case tag === 0x59: { // 'Y' 32 位 long
      need(ctx, 4, 'long')
      const v = BigInt(ctx.buf.readInt32BE(ctx.pos))
      ctx.pos += 4
      return { value: v.toString() }
    }
    case tag === 0x4c: { // 'L' 64 位 long → 字符串保精度
      need(ctx, 8, 'long')
      const v = ctx.buf.readBigInt64BE(ctx.pos)
      ctx.pos += 8
      return { value: v.toString() }
    }
    case tag === 0x5b: return { value: 0 } // double 0.0
    case tag === 0x5c: return { value: 1 } // double 1.0
    case tag === 0x5d: { // 8 位精度 double（带符号字节）
      need(ctx, 1, 'double')
      return { value: ctx.buf.readInt8(ctx.pos++) }
    }
    case tag === 0x5e: { // 16 位整数形态 double
      need(ctx, 2, 'double')
      const v = ctx.buf.readInt16BE(ctx.pos)
      ctx.pos += 2
      return { value: v }
    }
    case tag === 0x5f: { // 32 位 float 形态
      need(ctx, 4, 'double')
      const v = ctx.buf.readFloatBE(ctx.pos)
      ctx.pos += 4
      return { value: v }
    }
    case tag === 0x44: { // 'D' 64 位 double
      need(ctx, 8, 'double')
      const v = ctx.buf.readDoubleBE(ctx.pos)
      ctx.pos += 8
      return { value: v }
    }
    case tag === 0x4a: { // 'J' 8B 毫秒 date
      need(ctx, 8, 'date')
      const v = ctx.buf.readBigInt64BE(ctx.pos)
      ctx.pos += 8
      return { value: new Date(Number(v)).toISOString() }
    }
    case tag === 0x4b: { // 'K' 4B 分钟精度 date
      need(ctx, 4, 'date')
      const minutes = ctx.buf.readInt32BE(ctx.pos)
      ctx.pos += 4
      return { value: new Date(minutes * 60000).toISOString() }
    }
    case (tag >= 0x00 && tag <= 0x1f) || (tag >= 0x30 && tag <= 0x33) || tag === 0x53 || tag === 0x52:
      ctx.pos -= 1
      return { value: decodeString(ctx) }
    case (tag >= 0x20 && tag <= 0x2f) || (tag >= 0x34 && tag <= 0x37) || tag === 0x42 || tag === 0x41 || tag === 0x62:
      ctx.pos -= 1
      return { value: decodeBinary(ctx) }
    case (tag >= 0x70 && tag <= 0x77) || (tag >= 0x78 && tag <= 0x7f)
      || tag === 0x56 || tag === 0x58 || tag === 0x55 || tag === 0x57:
      return { value: decodeList(ctx, tag) }
    case tag === 0x4d: // 'M' 有类型 map
    case tag === 0x48: // 'H' 无类型 map
      return { value: decodeMap(ctx, tag) }
    case tag === 0x43: { // 'C' class 定义（随后紧跟实例字段值）
      const type = decodeString(ctx)
      const count = readIntValue(ctx)
      const fields = []
      for (let i = 0; i < count; i += 1) fields.push(decodeString(ctx))
      ctx.classDefs.push({ type, fields })
      // 定义之后立即跟该实例的字段值：按对象形态读出
      const obj = { __class: type }
      ctx.refs.push(obj)
      for (const name of fields) obj[name] = hessianDecodeValue(ctx).value
      return { value: obj }
    }
    case tag >= 0x60 && tag <= 0x6f: // 对象实例（class-def 直接索引 0-15）
      return { value: decodeObject(ctx, tag - 0x60) }
    case tag === 0x4f: // 'O' 对象实例（紧凑 int class-def 引用）
      return { value: decodeObject(ctx, readIntValue(ctx)) }
    case tag === 0x51: { // 'Q' 共享引用（紧凑 int）
      const idx = readIntFromTag(ctx, u8(ctx))
      const hit = ctx.refs[idx]
      if (hit === undefined) throw new DubboError('INVALID_ARGUMENT', 'hessian 解码失败: 引用不存在 #' + idx)
      return { value: hit }
    }
    default:
      throw new DubboError('INVALID_ARGUMENT', 'hessian 解码失败: 未知类型码 0x' + tag.toString(16))
  }
}

function decodeObject(ctx, classIndex) {
  const def = ctx.classDefs[classIndex]
  if (!def) throw new DubboError('INVALID_ARGUMENT', 'hessian 解码失败: 引用了未定义的 class ' + classIndex)
  const obj = { __class: def.type }
  ctx.refs.push(obj)
  for (const name of def.fields) {
    obj[name] = hessianDecodeValue(ctx).value
  }
  return obj
}

/**
 * 解码单个 hessian 值。
 * @returns {{ value: any, offset: number }} offset 指向下一值起点。
 */
export function hessianDecode(buf, offset = 0) {
  const ctx = makeCtx(Buffer.isBuffer(buf) ? buf : Buffer.from(buf), offset)
  const value = hessianDecodeValue(ctx).value
  return { value, offset: ctx.pos }
}

/** 连续解码一段 body 里的多个 hessian 值（mock 服务端/测试用）。 */
export function hessianDecodeAll(buf, offset = 0) {
  const ctx = makeCtx(Buffer.isBuffer(buf) ? buf : Buffer.from(buf), offset)
  const values = []
  while (ctx.pos < ctx.buf.length) {
    values.push(hessianDecodeValue(ctx).value)
  }
  return values
}

/* ================= Dubbo 请求体 ================= */

/**
 * JSON 参数 → hessian 值（按描述符）：
 * String→字符串；I/J/D/Z 等与包装类→标量；java.util.Date→date；[B→binary(base64)；
 * 数组/List→list；Map/对象→map（无 POJO 字节码，POJO 参数请走 generic=true）。
 */
function argValueByDescriptor(v, desc) {
  const d = String(desc || '')
  if (v === undefined || v === null) return null
  if (d === 'Ljava/lang/String;') return String(v)
  if (['I', 'S', 'B', 'Ljava/lang/Integer;', 'Ljava/lang/Short;', 'Ljava/lang/Byte;'].includes(d)) {
    if (!Number.isInteger(Number(v))) throw new DubboError('INVALID_ARGUMENT', `参数需要整数（描述符 ${d}，收到 ${JSON.stringify(v)}）`)
    return Number(v)
  }
  if (['J', 'Ljava/lang/Long;'].includes(d)) {
    if (typeof v === 'string' && /^-?\d+$/.test(v)) {
      const b = BigInt(v)
      if (b >= -2147483648n && b <= 2147483647n) return Number(b) // 32 位范围内可走 int 形态
      return b
    }
    if (!Number.isInteger(Number(v))) throw new DubboError('INVALID_ARGUMENT', '参数需要整数（描述符 ' + d + '）')
    return Number(v)
  }
  if (['D', 'F', 'Ljava/lang/Double;', 'Ljava/lang/Float;'].includes(d)) {
    const num = Number(v)
    if (!Number.isFinite(num)) throw new DubboError('INVALID_ARGUMENT', '参数需要数字（描述符 ' + d + '）')
    return num
  }
  if (d === 'Z' || d === 'Ljava/lang/Boolean;') return Boolean(v)
  if (d === 'C' || d === 'Ljava/lang/Character;') return String(v).slice(0, 1)
  if (d === 'Ljava/util/Date;') {
    const t = typeof v === 'number' ? v : Date.parse(String(v))
    if (Number.isNaN(t)) throw new DubboError('INVALID_ARGUMENT', '参数需要 ISO 字符串或毫秒数值（java.util.Date）')
    return new Date(t)
  }
  if (d === '[B') {
    if (typeof v === 'string') return Buffer.from(v, 'base64')
    if (Array.isArray(v)) return Buffer.from(v)
    if (v instanceof Uint8Array) return Buffer.from(v)
    throw new DubboError('INVALID_ARGUMENT', '参数需要 base64 字符串或字节数组（[B）')
  }
  if (Array.isArray(v)) return v // 数组/List 描述符或本身就是数组
  if (v && typeof v === 'object') return v // Map/对象 → map 编码
  return v // 兜底标量（enum 名等按字符串传，服务端泛化兼容）
}

/** Dubbo 请求体（hessian 值序列）。attachments 为 null 时不写。 */
function buildRequestBody({ interfacePath, version, method, descs, args, attachments }) {
  const out = []
  hessianEncodeValue(out, DUBBO_VERSION) // dubbo 版本
  hessianEncodeValue(out, interfacePath) // path
  hessianEncodeValue(out, version ?? '') // version
  hessianEncodeValue(out, method) // method
  hessianEncodeValue(out, descs.join('')) // parameterTypes 描述符串（拼接无分隔符）
  for (const a of args) hessianEncodeValue(out, a)
  if (attachments && Object.keys(attachments).length > 0) hessianEncodeValue(out, attachments)
  return Buffer.concat(out)
}

/** 16B 协议头。 */
function buildFrameHead({ request, id, bodyLen }) {
  const head = Buffer.alloc(16)
  head.writeUInt16BE(MAGIC, 0)
  head[2] = (request ? FLAG_REQUEST : 0) | FLAG_TWOWAY | SERIALIZATION_HESSIAN2
  head[3] = 0 // 请求帧 status 恒 0
  head.writeBigUInt64BE(BigInt(id), 4)
  head.writeUInt32BE(bodyLen, 12)
  return head
}

/* ================= TCP 客户端：单次调用一连接 ================= */

function parseAddress(address) {
  const m = /^([\w.\-]+):(\d{1,5})$/.exec(String(address || '').trim())
  if (!m) throw new DubboError('INVALID_ARGUMENT', 'address 必须是 host:port 形态')
  const port = Number(m[2])
  if (!(port >= 1 && port <= 65535)) throw new DubboError('INVALID_ARGUMENT', 'port 超出范围: ' + m[2])
  return { host: m[1], port }
}

/** 半包累积：16B 头 + bodyLen 定长 body；按 id 校验配对。 */
function readResponseFrame(socket, requestId) {
  return new Promise((resolve, reject) => {
    let header = Buffer.alloc(0)
    let body = null
    let bodyLen = 0
    let meta = null
    let settled = false
    const finish = (err, val) => {
      if (settled) return
      settled = true
      socket.removeListener('data', onData)
      socket.removeListener('error', onError)
      socket.removeListener('close', onClose)
      if (err) reject(err)
      else resolve(val)
    }
    const onData = (chunk) => {
      if (settled) return
      try {
        if (body === null) {
          header = Buffer.concat([header, chunk])
          if (header.length < 16) return
          if (header.readUInt16BE(0) !== MAGIC) {
            return finish(new DubboError('UNAVAILABLE', '响应帧魔数错误（非 0xdabb）'))
          }
          const id = header.readBigUInt64BE(4)
          if (id !== BigInt(requestId)) {
            return finish(new DubboError('UNAVAILABLE', `响应 id 不匹配（期望 ${requestId}，收到 ${id}）`))
          }
          const flagByte = header[2]
          if ((flagByte & FLAG_REQUEST) !== 0) {
            return finish(new DubboError('UNAVAILABLE', '收到了请求帧（应为响应帧）'))
          }
          meta = { flagByte, status: header[3] }
          bodyLen = header.readUInt32BE(12)
          if (bodyLen > 64 * 1024 * 1024) {
            return finish(new DubboError('UNAVAILABLE', '响应 body 过大（' + bodyLen + ' 字节）'))
          }
          body = header.subarray(16)
          header = Buffer.alloc(0)
        } else {
          body = Buffer.concat([body, chunk])
        }
        if (body.length >= bodyLen) {
          finish(null, { flagByte: meta.flagByte, status: meta.status, body: body.subarray(0, bodyLen) })
        }
      } catch (err) {
        finish(err instanceof DubboError ? err : new DubboError('UNAVAILABLE', err && err.message ? err.message : String(err)))
      }
    }
    const onError = (err) => {
      finish(new DubboError('UNAVAILABLE', '连接错误: ' + (err && err.message ? err.message : String(err))))
    }
    const onClose = () => {
      finish(new DubboError('UNAVAILABLE', '连接被关闭（半包/服务端提前断开）'))
    }
    socket.on('data', onData)
    socket.on('error', onError)
    socket.on('close', onClose)
  })
}

export function createDubboClient() {
  const sockets = new Set()
  let nextId = 1

  return {
    /**
     * invoke({ address, interface, version, group, method, parameterTypes, args, generic, timeoutMs })
     * 成功 → { address, interface, method, value, status:'OK', timeMs, attachments? }；
     * 失败 → { ok:false, error:{ code, message } }（不抛出）。
     */
    async invoke(opts = {}) {
      const started = Date.now()
      let socket = null
      let timer = null
      try {
        const { host, port } = parseAddress(opts.address)
        const iface = String(opts.interface ?? '').trim()
        if (iface === '') throw new DubboError('INVALID_ARGUMENT', 'interface 不能为空（如 com.x.Api）')
        const method = String(opts.method ?? '').trim()
        if (method === '') throw new DubboError('INVALID_ARGUMENT', 'method 不能为空')
        const version = String(opts.version ?? '')
        const group = String(opts.group ?? '')
        const timeoutMs = Math.min(MAX_TIMEOUT_MS, Math.max(1, Number.isFinite(opts.timeoutMs) ? Number(opts.timeoutMs) : DEFAULT_TIMEOUT_MS))
        const generic = opts.generic === true
        const classNames = (Array.isArray(opts.parameterTypes) ? opts.parameterTypes : []).map((s) => String(s))
        const args = Array.isArray(opts.args) ? opts.args : []
        if (!generic && args.length !== classNames.length) {
          throw new DubboError('INVALID_ARGUMENT', `args 数量（${args.length}）必须与 parameterTypes 数量（${classNames.length}）一致`)
        }

        let interfacePath = iface
        let wireMethod = method
        let wireDescs
        let wireArgs
        const attachments = {
          path: iface,
          interface: iface,
          method,
          version,
        }
        if (group !== '') attachments.group = group
        attachments.timeout = String(timeoutMs)
        // 用户自定义 attachments（UI 的 Headers 表）合并进来；寻址键保持表单值不被覆盖
        // （真实服务端按 path/interface attachment 寻址导出器，被改写会查不到服务）。
        const userAttachments = opts.attachments && typeof opts.attachments === 'object' && !Array.isArray(opts.attachments)
          ? opts.attachments
          : {}
        for (const [k, v] of Object.entries(userAttachments)) {
          const key = String(k)
          if (key === '' || ['path', 'interface', 'method', 'version'].includes(key)) continue
          attachments[key] = v == null ? '' : String(v)
        }
        if (generic) {
          // Apache 泛化 $invoke：接口/方法/描述符整体改形（path 保持目标服务，见 GenericFilter 语义），
          // args = [原 method, 原参数类型名数组, 原参数数组]，attachment generic='true'
          interfacePath = GENERIC_INTERFACE
          wireMethod = '$invoke'
          wireDescs = GENERIC_DESCS
          wireArgs = [
            method,
            classNames,
            args.map((a, i) => argValueByDescriptor(a, javaDescriptor(classNames[i] ?? ''))),
          ]
          attachments.generic = 'true'
        } else {
          wireDescs = classNames.map((n) => javaDescriptor(n))
          wireArgs = args.map((a, i) => argValueByDescriptor(a, wireDescs[i]))
        }

        const id = nextId++
        const body = buildRequestBody({
          interfacePath, version, method: wireMethod, descs: wireDescs, args: wireArgs, attachments,
        })
        const frame = Buffer.concat([buildFrameHead({ request: true, id, bodyLen: body.length }), body])

        socket = await new Promise((resolve, reject) => {
          const s = net.connect({ host, port })
          s.setNoDelay(true)
          sockets.add(s)
          const onErr = (err) => {
            sockets.delete(s)
            reject(new DubboError('UNAVAILABLE', '连接失败: ' + (err && err.message ? err.message : String(err))))
          }
          s.once('error', onErr)
          s.once('connect', () => {
            s.removeListener('error', onErr)
            resolve(s)
          })
        })
        // 读响应（带超时栅栏：定时器先裁 TIMEOUT 再销毁 socket，close 兜底让位）。
        // 请求帧必须在等响应前发出：先 write，再挂 readResponseFrame。
        socket.write(frame)
        const resp = await new Promise((resolve, reject) => {
          let settled = false
          timer = setTimeout(() => {
            settled = true
            reject(new DubboError('TIMEOUT', `dubbo 调用超时（${timeoutMs}ms，含连接与响应等待）`))
            try { socket.destroy() } catch { /* 已销毁忽略 */ }
          }, timeoutMs)
          readResponseFrame(socket, id).then(
            (v) => {
              if (settled) return
              settled = true
              clearTimeout(timer)
              resolve(v)
            },
            (e) => {
              if (settled) return
              settled = true
              clearTimeout(timer)
              reject(e)
            },
          )
        })

        if (resp.status !== 20) {
          const name = RESPONSE_STATUS_TEXT[resp.status] || 'STATUS_' + resp.status
          throw new DubboError('DUBBO_ERROR', `dubbo 响应状态 ${name}(${resp.status})`)
        }
        const flag = resp.body.length > 0 ? resp.body[0] : -1
        let value = null
        let respAttachments = null
        if (flag === RESP_FLAG_NULL) {
          value = null
        } else if (flag === RESP_FLAG_VALUE || flag === RESP_FLAG_VALUE_WITH_ATTACHMENTS
          || flag === RESP_FLAG_EXCEPTION || flag === RESP_FLAG_EXCEPTION_WITH_ATTACHMENTS) {
          const decoded = hessianDecode(resp.body, 1)
          value = decoded.value
          if (flag === RESP_FLAG_VALUE_WITH_ATTACHMENTS || flag === RESP_FLAG_EXCEPTION_WITH_ATTACHMENTS) {
            respAttachments = hessianDecode(resp.body, decoded.offset).value
          }
          if (flag === RESP_FLAG_EXCEPTION || flag === RESP_FLAG_EXCEPTION_WITH_ATTACHMENTS) {
            throw new DubboError('DUBBO_ERROR', exceptionText(value))
          }
        } else {
          throw new DubboError('DUBBO_ERROR', '未知响应 flag: ' + flag)
        }

        const result = {
          address: `${host}:${port}`,
          interface: iface,
          method,
          value,
          status: 'OK',
          timeMs: Date.now() - started,
        }
        if (respAttachments && typeof respAttachments === 'object') result.attachments = respAttachments
        return result
      } catch (err) {
        const dubboErr = err instanceof DubboError ? err : new DubboError('INVALID_ARGUMENT', err && err.message ? err.message : String(err))
        return { ok: false, error: { code: dubboErr.code, message: dubboErr.message } }
      } finally {
        if (timer) clearTimeout(timer)
        if (socket) {
          sockets.delete(socket)
          try { socket.destroy() } catch { /* 已销毁忽略 */ }
        }
      }
    },

    /** closeAll：插件卸载时销毁仍挂着的 socket。 */
    async closeAll() {
      const list = [...sockets]
      sockets.clear()
      for (const s of list) {
        try { s.destroy() } catch { /* 忽略 */ }
      }
      return { closed: list.length }
    },
  }
}

/** Throwable 的 hessian 形态（class-def 对象/map）→ 错误文案。 */
function exceptionText(value) {
  if (value === null || value === undefined) return 'dubbo 服务端抛出异常（无异常信息）'
  if (typeof value === 'string') return 'dubbo 服务端抛出异常: ' + value
  if (typeof value === 'object') {
    const cls = String(value.__class || value.exceptionClassName || 'Exception')
    const msg = value.detailMessage ?? value.message ?? value.msg ?? ''
    return `dubbo 服务端抛出异常 ${cls}${msg ? ': ' + msg : ''}`
  }
  return 'dubbo 服务端抛出异常: ' + JSON.stringify(value)
}
