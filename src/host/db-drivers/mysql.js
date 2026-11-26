/**
 * MySQL wire protocol 客户端（node:net/node:tls/node:crypto 自实现，零 npm 依赖）。
 * 协议覆盖：
 * - Initial Handshake v10 解析（protocol version、server version、seed part1(8)+part2(12)、
 *   capability flags、auth plugin name）与 HandshakeResponse41 回应
 *   （CLIENT_LONG_PASSWORD|PROTOCOL_41|TRANSACTIONS|SECURE_CONNECTION|PLUGIN_AUTH，
 *   charset 45 = utf8mb4_general_ci，user、auth response、插件名回显，database 可选）。
 * - 认证：mysql_native_password（SHA1 scramble）；caching_sha2_password（fast = SHA256 XOR
 *   scramble；full auth：TLS 通道发明文 password\0，明文通道先发 0x01 请求服务器下发的
 *   RSA 公钥（AuthMoreData 0x02 带 PEM），再对 (password\0 XOR seed) 做 RSA-OAEP(sha1) 加密回发）；
 *   sha256_password（明文 cleartext）；AUTH_SWITCH 请求按切换后的插件名分发响应。
 * - 命令：COM_PING（存活探测/连接测试）、COM_QUERY（text protocol）、COM_QUIT 关闭。
 * - text protocol 结果集：column_count → N 个 column definition（取列名与类型）→ EOF →
 *   text 行（lenenc string，0xFB = NULL）→ EOF；行数超过 maxRows 时继续读完丢弃（保持连接干净）。
 * - OK 包（0x00/0xfe）解析 affected rows、last insert id、status flags；ERR 包（0xff）解析
 *   errno、sqlstate（'#'+5B）、message → DbError('SQL_ERROR')，err.errno 携带 errno。
 * - 帧格式：3B 长度 + 1B seq；payload > 16MB 按 0xffffff 续帧（seq 连续递增），读侧重组、
 *   写侧 splitPayload 切帧；每条命令边界重置 seq。
 * - ssl:true 时先发 SSLRequest（32B：caps|CLIENT_SSL，max packet 0，charset 45，23×0）→
 *   服务器回 'S' 后 node:tls 升级（servername=host，自签证书放行），随后在 TLS 通道完成握手。
 * 边界：仅 text protocol（未实现 COM_STMT_PREPARE 二进制协议）；params 在客户端做安全转义
 * 替换 ?（mysql2 text 模式同款做法）；LOCAL INFILE 拒绝；建连超时 10s、IO 超时 30s；
 * socket error/timeout/意外关闭统一映射 DbError('CONNECTION_ERROR')。
 */
import net from 'node:net'
import tls from 'node:tls'
import crypto from 'node:crypto'

const PROTOCOL_VERSION = 10
const MAX_PAYLOAD = 0xffffff
const UTF8MB4_GENERAL_CI = 45
const CONNECT_TIMEOUT_MS = 10000
const IO_TIMEOUT_MS = 30000
const CLOSE_GRACE_MS = 500

// 客户端能力位
const CLIENT_LONG_PASSWORD = 0x00000001
const CLIENT_CONNECT_WITH_DB = 0x00000008
const CLIENT_SSL = 0x00000800
const CLIENT_PROTOCOL_41 = 0x00000200
const CLIENT_TRANSACTIONS = 0x00002000
const CLIENT_SECURE_CONNECTION = 0x00008000
const CLIENT_PLUGIN_AUTH = 0x00080000

// 命令字
const COM_QUIT = 0x01
const COM_QUERY = 0x03
const COM_PING = 0x0e

// 包类型首字节
const AUTH_MORE_DATA = 0x01
const OK_HEADER = 0x00
const EOF_HEADER = 0xfe
const ERR_HEADER = 0xff

// text 值转换涉及的列类型
const MYSQL_TYPE_TINY = 0x01
const MYSQL_TYPE_SHORT = 0x02
const MYSQL_TYPE_LONG = 0x03
const MYSQL_TYPE_FLOAT = 0x04
const MYSQL_TYPE_DOUBLE = 0x05
const MYSQL_TYPE_LONGLONG = 0x08
const MYSQL_TYPE_INT24 = 0x09

/** 大 payload 切帧：每帧 ≤ 0xffffff，恰好整除时补一个空帧（协议规定）。 */
export function splitPayload(payload) {
  if (payload.length === 0) return [Buffer.alloc(0)]
  const frames = []
  for (let off = 0; off < payload.length; off += MAX_PAYLOAD) {
    frames.push(payload.subarray(off, Math.min(off + MAX_PAYLOAD, payload.length)))
  }
  if (payload.length % MAX_PAYLOAD === 0) frames.push(Buffer.alloc(0))
  return frames
}

/** 简单游标读取器：握手/OK/列定义解析用。 */
class Br {
  constructor(buf) {
    this.buf = buf
    this.pos = 0
  }

  get remaining() {
    return this.buf.length - this.pos
  }

  u8() {
    return this.buf[this.pos++]
  }

  u16() {
    const v = this.buf.readUInt16LE(this.pos)
    this.pos += 2
    return v
  }

  u32() {
    const v = this.buf.readUInt32LE(this.pos)
    this.pos += 4
    return v
  }

  bytes(n) {
    const out = this.buf.subarray(this.pos, this.pos + n)
    this.pos += n
    return out
  }

  skip(n) {
    this.pos += n
  }

  /** 以 \0 结尾的 ASCII/UTF8 字符串。 */
  cstring() {
    let end = this.buf.indexOf(0, this.pos)
    if (end < 0) end = this.buf.length
    const out = this.buf.toString('utf8', this.pos, end)
    this.pos = Math.min(end + 1, this.buf.length)
    return out
  }

  /** lenenc int → bigint（0xFB = NULL 在此处不允许）。 */
  lenencInt() {
    const first = this.buf[this.pos]
    if (first < 0xfb) {
      this.pos += 1
      return BigInt(first)
    }
    if (first === 0xfc) {
      const v = this.buf.readUInt16LE(this.pos + 1)
      this.pos += 3
      return BigInt(v)
    }
    if (first === 0xfd) {
      const v = this.buf.readUIntLE(this.pos + 1, 3)
      this.pos += 4
      return BigInt(v)
    }
    if (first === 0xfe) {
      const v = this.buf.readBigUInt64LE(this.pos + 1)
      this.pos += 9
      return v
    }
    throw new Error('lenenc int 首字节 0xfb（NULL）在此处非法')
  }

  lenencBytes() {
    const n = Number(this.lenencInt())
    const out = this.buf.subarray(this.pos, this.pos + n)
    this.pos += n
    return out
  }
}

/** lenenc int 编码（OK 包 affected/insert id 回写用）。 */
function lenencIntBytes(value) {
  const n = typeof value === 'bigint' ? value : BigInt(Math.trunc(Number(value)))
  if (n < 0n || n > 0xffffffffffffffffn) throw new RangeError('lenenc int 超出 64 位范围')
  if (n < 0xfbn) return Buffer.from([Number(n)])
  if (n <= 0xffffn) {
    const b = Buffer.alloc(3)
    b[0] = 0xfc
    b.writeUInt16LE(Number(n), 1)
    return b
  }
  if (n <= 0xffffffn) {
    const b = Buffer.alloc(4)
    b[0] = 0xfd
    b.writeUIntLE(Number(n), 1, 3)
    return b
  }
  const b = Buffer.alloc(9)
  b[0] = 0xfe
  b.writeBigUInt64LE(n, 1)
  return b
}

/** mysql_native_password：SHA1(scramble) 与 SHA1(scramble + SHA1(SHA1(pw))) 的 XOR。 */
function nativePasswordToken(password, seed) {
  const stage1 = crypto.createHash('sha1').update(password, 'utf8').digest()
  const stage2 = crypto.createHash('sha1').update(stage1).digest()
  const stage3 = crypto.createHash('sha1').update(Buffer.concat([seed, stage2])).digest()
  return Buffer.from(stage1.map((b, i) => b ^ stage3[i]))
}

/** caching_sha2_password scramble：SHA256(pw) XOR SHA256(SHA256(SHA256(pw)) + nonce)。 */
function sha256PasswordToken(password, seed) {
  const stage1 = crypto.createHash('sha256').update(password, 'utf8').digest()
  const stage2 = crypto.createHash('sha256').update(stage1).digest()
  const stage3 = crypto.createHash('sha256').update(Buffer.concat([stage2, seed])).digest()
  return Buffer.from(stage1.map((b, i) => b ^ stage3[i]))
}

/** seed 循环 XOR（full auth 前对 password\0 做盲化）。 */
function xorWithSeed(buf, seed) {
  const out = Buffer.from(buf)
  for (let i = 0; i < out.length; i++) out[i] ^= seed[i % seed.length]
  return out
}

/**
 * params 客户端转义（mysql2 text 模式同款做法：逐字符扫描 SQL，跳过引号内与注释，
 * 遇到 ? 用安全转义后的字面量替换；text protocol 无服务端参数绑定）。
 */
function escapeValue(value, ctx) {
  if (value === null) return 'NULL'
  if (typeof value === 'boolean') return value ? '1' : '0'
  if (typeof value === 'bigint') return value.toString()
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new ctx.DbError('INVALID_ARGUMENT', `不支持的数值参数：${value}`)
    return String(value)
  }
  if (typeof value === 'string') return quoteString(value)
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new ctx.DbError('INVALID_ARGUMENT', 'Date 参数为无效时间')
    return quoteString(value.toISOString())
  }
  throw new ctx.DbError('INVALID_ARGUMENT', `不支持的参数类型：${typeof value}（仅支持 string/number/bigint/boolean/null/Date）`)
}

function quoteString(text) {
  let out = '\''
  for (const ch of text) {
    switch (ch) {
      case '\0': out += '\\0'; break
      case '\n': out += '\\n'; break
      case '\r': out += '\\r'; break
      case '\u001a': out += '\\Z'; break
      case '\'': out += '\\\''; break
      case '"': out += '\\"'; break
      case '\\': out += '\\\\'; break
      default: out += ch
    }
  }
  return out + '\''
}

/** 引号内（' " `）与注释（-- # /\* *\​/）跳过的 ? 替换。 */
export function formatSql(sql, params, ctx) {
  let out = ''
  let i = 0
  let used = 0
  const n = sql.length
  while (i < n) {
    const c = sql[i]
    if (c === '\'' || c === '"' || c === '`') {
      let j = i + 1
      while (j < n) {
        if (sql[j] === '\\' && c !== '`') { j += 2; continue }
        if (sql[j] === c) {
          if (sql[j + 1] === c) { j += 2; continue }
          j += 1
          break
        }
        j += 1
      }
      out += sql.slice(i, j)
      i = j
    } else if (c === '#' || (c === '-' && sql[i + 1] === '-')) {
      let j = sql.indexOf('\n', i)
      if (j < 0) j = n
      out += sql.slice(i, j)
      i = j
    } else if (c === '/' && sql[i + 1] === '*') {
      let j = sql.indexOf('*/', i + 2)
      j = j < 0 ? n : j + 2
      out += sql.slice(i, j)
      i = j
    } else if (c === '?') {
      if (used >= params.length) {
        throw new ctx.DbError('INVALID_ARGUMENT', `占位符 ? 比 params 多（${used + 1} 个 ?，${params.length} 个参数）`)
      }
      out += escapeValue(params[used], ctx)
      used += 1
      i += 1
    } else {
      out += c
      i += 1
    }
  }
  if (used < params.length) {
    throw new ctx.DbError('INVALID_ARGUMENT', `params 比占位符 ? 多（${params.length} 个参数，${used} 个 ?）`)
  }
  return out
}

/** ERR 包解析：errno + sqlstate('#'+5B) + message → DbError('SQL_ERROR')，err.errno 带 errno。 */
function parseErrPacket(pkt, ctx) {
  const errno = pkt.readUInt16LE(1)
  let sqlState = ''
  let message
  if (pkt.length > 8 && pkt[3] === 0x23) {
    sqlState = pkt.toString('utf8', 4, 9)
    message = pkt.toString('utf8', 9)
  } else {
    message = pkt.toString('utf8', 3)
  }
  const err = new ctx.DbError('SQL_ERROR', `MySQL ${errno}${sqlState ? ` (${sqlState})` : ''}: ${message}`)
  err.errno = errno
  err.sqlState = sqlState
  return err
}

/** 列定义解析：只取列名与类型（text 值转换用）。 */
function parseColumnDefinition(pkt) {
  const r = new Br(pkt)
  r.lenencBytes() // catalog 'def'
  r.lenencBytes() // schema
  r.lenencBytes() // table
  r.lenencBytes() // org_table
  const name = r.lenencBytes().toString('utf8')
  r.lenencBytes() // org_name
  // fixed fields（lenenc 包裹的 12B）：charset(2) + column length(4) + type(1) + flags(2) + decimals(1) + filler(2)
  const fixed = r.lenencBytes()
  const type = fixed.length >= 7 ? fixed[6] : 0xfd
  return { name, type }
}

/** text 行解析：逐列 lenenc string，0xFB = NULL；返回原始字符串数组。 */
function parseTextRow(pkt, columnCount) {
  const values = new Array(columnCount)
  let pos = 0
  for (let i = 0; i < columnCount; i++) {
    if (pos >= pkt.length) throw new RangeError('行数据长度不足列数')
    const first = pkt[pos]
    if (first === 0xfb) {
      values[i] = null
      pos += 1
      continue
    }
    let len
    if (first < 0xfb) {
      len = first
      pos += 1
    } else if (first === 0xfc) {
      len = pkt.readUInt16LE(pos + 1)
      pos += 3
    } else if (first === 0xfd) {
      len = pkt.readUIntLE(pos + 1, 3)
      pos += 4
    } else {
      len = Number(pkt.readBigUInt64LE(pos + 1))
      pos += 9
    }
    values[i] = pkt.toString('utf8', pos, pos + len)
    pos += len
  }
  return values
}

/** text 值按列类型转换：整型转 Number（超安全整数保留字符串，int8 大数走精度保护），浮点转 Number，其余字符串。 */
function coerceTextValue(text, type) {
  if (text === null) return null
  switch (type) {
    case MYSQL_TYPE_TINY:
    case MYSQL_TYPE_SHORT:
    case MYSQL_TYPE_LONG:
    case MYSQL_TYPE_LONGLONG:
    case MYSQL_TYPE_INT24: {
      const n = Number(text)
      return Number.isSafeInteger(n) ? n : text
    }
    case MYSQL_TYPE_FLOAT:
    case MYSQL_TYPE_DOUBLE: {
      const n = Number(text)
      return Number.isNaN(n) ? text : n
    }
    default:
      return text
  }
}

/** MySQL 连接：协议状态 + socket 读写。 */
class MysqlConnection {
  constructor(config, ctx) {
    this.ctx = ctx
    this.host = String(config.host || '').trim() || '127.0.0.1'
    const port = Number(config.port)
    this.port = Number.isFinite(port) && port > 0 ? Math.trunc(port) : 3306
    this.user = String(config.user || '')
    this.password = String(config.password || '')
    this.database = String(config.database || '').trim()
    this.ssl = config.ssl === true
    this.serverVersion = ''
    this.capabilities = 0
    this._socket = null
    this._buf = Buffer.alloc(0)
    this._off = 0
    this._waiters = []
    this._error = null
    this._dead = false
    // 共享 seq 计数器：每收/发一个包都递增（新命令边界重置为 0）
    this._seq = 0
    this._baseCaps = CLIENT_LONG_PASSWORD | CLIENT_PROTOCOL_41 | CLIENT_TRANSACTIONS | CLIENT_SECURE_CONNECTION | CLIENT_PLUGIN_AUTH
  }

  /** 挂载 socket 监听（TLS 升级后换 socket 时重复调用）。 */
  _attach(socket) {
    socket.setNoDelay(true)
    socket.setTimeout(IO_TIMEOUT_MS)
    socket.on('data', (chunk) => {
      this._buf = this._off > 0 ? Buffer.concat([this._buf.subarray(this._off), chunk]) : (this._buf.length ? Buffer.concat([this._buf, chunk]) : chunk)
      this._off = 0
      this._drain()
    })
    socket.on('error', (err) => this._fail(new this.ctx.DbError('CONNECTION_ERROR', `MySQL 连接错误：${err.message}`)))
    socket.on('close', () => this._fail(new this.ctx.DbError('CONNECTION_ERROR', 'MySQL 连接已被关闭')))
    socket.on('timeout', () => {
      socket.destroy()
      this._fail(new this.ctx.DbError('CONNECTION_ERROR', `MySQL IO 超时（${IO_TIMEOUT_MS}ms）`))
    })
  }

  _fail(err) {
    if (!this._error) this._error = err
    const waiters = this._waiters.splice(0)
    for (const w of waiters) w.reject(err)
  }

  _drain() {
    while (this._waiters.length) {
      const w = this._waiters[0]
      if (this._buf.length - this._off < w.need) break
      this._waiters.shift()
      const out = this._buf.subarray(this._off, this._off + w.need)
      this._off += w.need
      if (this._off >= this._buf.length) {
        this._buf = Buffer.alloc(0)
        this._off = 0
      }
      w.resolve(out)
    }
  }

  _readExact(n) {
    if (this._error) return Promise.reject(this._error)
    if (this._buf.length - this._off >= n) {
      const out = this._buf.subarray(this._off, this._off + n)
      this._off += n
      if (this._off >= this._buf.length) {
        this._buf = Buffer.alloc(0)
        this._off = 0
      }
      return Promise.resolve(out)
    }
    return new Promise((resolve, reject) => this._waiters.push({ need: n, resolve, reject }))
  }

  /** 读完整逻辑包：>16MB 的 0xffffff 续帧在此重组，seq 连续性校验。 */
  async _readPacket() {
    let payload = Buffer.alloc(0)
    for (;;) {
      const head = await this._readExact(4)
      const got = head[3]
      if (got !== this._seq) {
        throw new this.ctx.DbError('CONNECTION_ERROR', `协议 seq 错位（期望 ${this._seq}，收到 ${got}）`)
      }
      this._seq = (got + 1) & 0xff
      const len = head[0] | (head[1] << 8) | (head[2] << 16)
      if (len > 0) {
        const chunk = await this._readExact(len)
        payload = payload.length === 0 ? chunk : Buffer.concat([payload, chunk])
      }
      if (len < MAX_PAYLOAD) return payload
    }
  }

  _sendPacket(payload) {
    const frames = splitPayload(payload)
    for (const frame of frames) {
      const head = Buffer.alloc(4)
      head.writeUIntLE(frame.length, 0, 3)
      head[3] = this._seq & 0xff
      this._socket.write(Buffer.concat([head, frame]))
      this._seq = (this._seq + 1) & 0xff
    }
  }

  /** 每条命令边界重置 seq：client 第一包 seq0，此后收发交替递增。 */
  _newCommand() {
    this._seq = 0
  }

  /** TCP 建连（带建连超时）。 */
  _openSocket() {
    return new Promise((resolve, reject) => {
      const socket = net.connect({ host: this.host, port: this.port })
      const timer = setTimeout(() => {
        socket.destroy()
        reject(new this.ctx.DbError('CONNECTION_ERROR', `连接 MySQL 超时（${CONNECT_TIMEOUT_MS}ms）：${this.host}:${this.port}`))
      }, CONNECT_TIMEOUT_MS)
      socket.once('connect', () => {
        clearTimeout(timer)
        resolve(socket)
      })
      socket.once('error', (err) => {
        clearTimeout(timer)
        reject(new this.ctx.DbError('CONNECTION_ERROR', `连接 MySQL 失败：${err.message}`))
      })
    })
  }

  /**
   * ssl:true：读明文握手后发 SSLRequest（32B：caps|CLIENT_SSL，max packet 0，charset 45，23×0），
   * 服务器回 'S' 后 node:tls 升级（servername=host，自签证书放行），随后在 TLS 通道发
   * HandshakeResponse41（seq 接续明文握手递增）。
   */
  async _sslUpgrade() {
    const body = Buffer.alloc(32)
    body.writeUInt32LE(this._baseCaps | CLIENT_SSL, 0)
    body.writeUInt32LE(0, 4) // max packet
    body[8] = UTF8MB4_GENERAL_CI
    this._sendPacket(body) // seq 接续握手（握手 seq0 → SSLRequest seq1）
    const resp = await this._readExact(1)
    if (resp[0] !== 0x53) {
      throw new this.ctx.DbError('CONNECTION_ERROR', '服务器拒绝 SSL 升级（SSLRequest 响应非 S）')
    }
    const raw = this._socket
    raw.removeAllListeners('data')
    raw.removeAllListeners('error')
    raw.removeAllListeners('close')
    raw.removeAllListeners('timeout')
    raw.setTimeout(0)
    const secure = await new Promise((resolve, reject) => {
      const t = tls.connect({ socket: raw, servername: this.host, rejectUnauthorized: false }, () => resolve(t))
      const timer = setTimeout(() => {
        t.destroy()
        reject(new this.ctx.DbError('CONNECTION_ERROR', 'TLS 握手超时'))
      }, CONNECT_TIMEOUT_MS)
      t.once('error', (err) => {
        clearTimeout(timer)
        reject(new this.ctx.DbError('CONNECTION_ERROR', `TLS 握手失败：${err.message}`))
      })
    })
    this._socket = secure
    this._attach(secure)
    // seq 保持共享递增：TLS 上的 HandshakeResponse41 是本连接第 3 个包（seq2）
  }

  /** Initial Handshake v10 解析。 */
  async _readInitialHandshake() {
    const pkt = await this._readPacket()
    if (pkt.length === 0 || pkt[0] === ERR_HEADER) throw parseErrPacket(pkt.length ? pkt : Buffer.from([0xff, 0, 0]), this.ctx)
    const r = new Br(pkt)
    const proto = r.u8()
    if (proto !== PROTOCOL_VERSION) {
      throw new this.ctx.DbError('CONNECTION_ERROR', `不支持的 MySQL 协议版本：${proto}`)
    }
    this.serverVersion = r.cstring()
    r.u32() // thread id
    const seed1 = Buffer.from(r.bytes(8))
    r.skip(1) // filler
    const capsLower = r.u16()
    let capsUpper = 0
    let seed2 = Buffer.alloc(0)
    let pluginName = 'mysql_native_password'
    if (r.remaining >= 22) {
      r.skip(1) // charset
      r.skip(2) // status flags
      capsUpper = r.u16()
      const authLen = r.u8()
      r.skip(10) // reserved
      const n = authLen > 0 ? Math.max(13, authLen - 8) : 13
      seed2 = Buffer.from(r.bytes(Math.min(n, r.remaining)))
      if (r.remaining > 0) pluginName = r.cstring()
    }
    const seed = Buffer.concat([seed1, seed2.subarray(0, seed2.length === 13 ? 12 : seed2.length)])
    this.capabilities = (capsUpper << 16) | capsLower
    return { seed, pluginName }
  }

  /** 按插件计算握手 auth response（空口令 → 空 token）。 */
  _authToken(pluginName, seed) {
    if (this.password === '') return Buffer.alloc(0)
    if (pluginName === 'mysql_native_password') return nativePasswordToken(this.password, seed)
    if (pluginName === 'caching_sha2_password') return sha256PasswordToken(this.password, seed)
    if (pluginName === 'sha256_password') {
      // sha256_password：cleartext（TLS/受信通道直传；本实现按 cleartext 语义）
      return Buffer.concat([Buffer.from(this.password, 'utf8'), Buffer.from([0])])
    }
    throw new this.ctx.DbError('CONNECTION_ERROR', `不支持的认证插件：${pluginName}`)
  }

  /** HandshakeResponse41。 */
  _sendHandshakeResponse(handshake) {
    let flags = this._baseCaps
    if (this.database !== '') flags |= CLIENT_CONNECT_WITH_DB
    const auth = this._authToken(handshake.pluginName, handshake.seed)
    const parts = [Buffer.alloc(4)]
    parts[0].writeUInt32LE(flags >>> 0, 0)
    const maxPacket = Buffer.alloc(4)
    maxPacket.writeUInt32LE(0, 0)
    parts.push(maxPacket, Buffer.from([UTF8MB4_GENERAL_CI]), Buffer.alloc(23))
    parts.push(Buffer.from(this.user, 'utf8'), Buffer.from([0]))
    parts.push(Buffer.from([auth.length]), auth)
    if (this.database !== '') parts.push(Buffer.from(this.database, 'utf8'), Buffer.from([0]))
    // CLIENT_PLUGIN_AUTH：回显服务器指定的插件名
    parts.push(Buffer.from(handshake.pluginName, 'utf8'), Buffer.from([0]))
    this._sendPacket(Buffer.concat(parts))
  }

  /** 认证循环：OK / ERR / AuthSwitchRequest / AuthMoreData（fast 成功、full auth）。 */
  async _authLoop(handshake) {
    for (;;) {
      const pkt = await this._readPacket()
      if (pkt[0] === ERR_HEADER) throw parseErrPacket(pkt, this.ctx)
      if (pkt[0] === AUTH_MORE_DATA) {
        const code = pkt[1]
        if (code === 0x03) {
          // caching_sha2 fast auth 成功，随后跟 OK 包
          const ok = await this._readPacket()
          if (ok[0] === ERR_HEADER) throw parseErrPacket(ok, this.ctx)
          this._parseOk(ok)
          return
        }
        if (code === 0x04) {
          await this._fullAuthentication(handshake.seed)
          continue
        }
        throw new this.ctx.DbError('CONNECTION_ERROR', `未知 AuthMoreData 子码：0x${code?.toString(16)}`)
      }
      if (pkt[0] === EOF_HEADER) {
        // 认证阶段的 0xfe 一律是 AuthSwitchRequest：插件名 cstring + 新 seed（去尾部 \0）
        let end = pkt.indexOf(0, 1)
        if (end < 0) end = pkt.length
        const pluginName = pkt.toString('utf8', 1, end)
        let seed = pkt.subarray(end + 1)
        if (seed.length > 0 && seed[seed.length - 1] === 0) seed = seed.subarray(0, seed.length - 1)
        this._sendPacket(this._authSwitchResponse(pluginName, seed))
        continue
      }
      // OK（含 0xfe 长包形态）
      this._parseOk(pkt)
      return
    }
  }

  /** AUTH_SWITCH 按切换后的插件名分发。 */
  _authSwitchResponse(pluginName, seed) {
    if (pluginName === 'mysql_native_password') {
      return this.password === '' ? Buffer.alloc(0) : nativePasswordToken(this.password, seed)
    }
    if (pluginName === 'caching_sha2_password') {
      return this.password === '' ? Buffer.alloc(0) : sha256PasswordToken(this.password, seed)
    }
    if (pluginName === 'mysql_clear_password') {
      return Buffer.concat([Buffer.from(this.password, 'utf8'), Buffer.from([0])])
    }
    if (pluginName === 'sha256_password') {
      if (this.ssl) return Buffer.concat([Buffer.from(this.password, 'utf8'), Buffer.from([0])])
      // 非 TLS：先发 0x01 请求服务器 RSA 公钥，后续走 full authentication
      return Buffer.from([0x01])
    }
    throw new this.ctx.DbError('CONNECTION_ERROR', `不支持的认证插件切换目标：${pluginName}`)
  }

  /** caching_sha2 full auth：TLS 明文；明文通道 RSA-OAEP(sha1) 加密 (password\0 XOR seed)。 */
  async _fullAuthentication(seed) {
    if (this.ssl) {
      this._sendPacket(Buffer.concat([Buffer.from(this.password, 'utf8'), Buffer.from([0])]))
      return
    }
    this._sendPacket(Buffer.from([0x01])) // 请求 RSA 公钥
    const pkt = await this._readPacket()
    if (pkt[0] === ERR_HEADER) throw parseErrPacket(pkt, this.ctx)
    if (!(pkt[0] === AUTH_MORE_DATA && pkt[1] === 0x02)) {
      throw new this.ctx.DbError('CONNECTION_ERROR', 'full auth 阶段未收到 RSA 公钥包（AuthMoreData 0x02）')
    }
    let pemEnd = pkt.indexOf(0, 2)
    if (pemEnd < 0) pemEnd = pkt.length
    const pem = pkt.toString('utf8', 2, pemEnd)
    const blinded = xorWithSeed(Buffer.concat([Buffer.from(this.password, 'utf8'), Buffer.from([0])]), seed)
    const encrypted = crypto.publicEncrypt(
      { key: pem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha1' },
      blinded,
    )
    this._sendPacket(encrypted)
  }

  /** OK 包解析：affected rows、last insert id、status flags。 */
  _parseOk(pkt) {
    const r = new Br(pkt)
    r.u8()
    const affected = r.lenencInt()
    const insertId = r.lenencInt()
    const status = r.remaining >= 2 ? r.u16() : 0
    return { affected, insertId, status }
  }

  /**
   * 建立连接：TCP → 明文读 Initial Handshake →（可选 SSLRequest/TLS 升级）→ HandshakeResponse41
   * → 认证循环；失败销毁 socket 不留半连接。
   */
  async connect() {
    const socket = await this._openSocket()
    this._socket = socket
    this._attach(socket)
    try {
      this._seq = 0 // server 先发 Initial Handshake（seq0）
      const handshake = await this._readInitialHandshake()
      if (this.ssl) await this._sslUpgrade()
      this._sendHandshakeResponse(handshake)
      await this._authLoop(handshake)
    } catch (err) {
      try { this._socket.destroy() } catch { /* 已断开忽略 */ }
      this._socket = null
      throw err
    }
  }

  /** COM_PING（test/池存活探测）。 */
  async ping() {
    this._newCommand()
    this._sendPacket(Buffer.from([COM_PING]))
    const pkt = await this._readPacket()
    if (pkt[0] === ERR_HEADER) throw parseErrPacket(pkt, this.ctx)
    if (pkt[0] === OK_HEADER || pkt[0] === EOF_HEADER) {
      this._parseOk(pkt)
      return
    }
    throw new this.ctx.DbError('CONNECTION_ERROR', 'COM_PING 响应异常')
  }

  /**
   * COM_QUERY text protocol：
   * 返回 { kind:'rows', columns, rows, total } 或 { kind:'ok', ok }。
   * 行数超过 maxRows 时继续读完丢弃（保持连接状态干净）。
   */
  async _queryText(sql) {
    this._newCommand()
    this._sendPacket(Buffer.concat([Buffer.from([COM_QUERY]), Buffer.from(sql, 'utf8')]))
    const first = await this._readPacket()
    if (first[0] === ERR_HEADER) throw parseErrPacket(first, this.ctx)
    if (first[0] === OK_HEADER || (first[0] === EOF_HEADER && first.length >= 9)) {
      return { kind: 'ok', ok: this._parseOk(first) }
    }
    if (first[0] === 0xfb) {
      throw new this.ctx.DbError('CONNECTION_ERROR', '服务器请求 LOCAL INFILE，已禁止')
    }
    const columnCount = Number(new Br(first).lenencInt())
    const columns = []
    for (let i = 0; i < columnCount; i++) {
      const def = await this._readPacket()
      if (def[0] === ERR_HEADER) throw parseErrPacket(def, this.ctx)
      columns.push(parseColumnDefinition(def))
    }
    const eof = await this._readPacket()
    if (eof[0] === ERR_HEADER) throw parseErrPacket(eof, this.ctx)
    const rows = []
    let total = 0
    for (;;) {
      const pkt = await this._readPacket()
      if (pkt[0] === ERR_HEADER) throw parseErrPacket(pkt, this.ctx)
      if (pkt[0] === EOF_HEADER && pkt.length < 9) break
      if (pkt[0] === OK_HEADER || pkt[0] === EOF_HEADER) break // DEPRECATE_EOF 形态兜底
      total += 1
      if (rows.length < this.ctx.maxRows) {
        const raw = parseTextRow(pkt, columnCount)
        const row = {}
        for (let i = 0; i < columnCount; i++) row[columns[i].name] = this.ctx.normalizeCell(coerceTextValue(raw[i], columns[i].type))
        rows.push(row)
      }
    }
    return { kind: 'rows', columns: columns.map((c) => c.name), rows, total }
  }

  /** SELECT 类：读结果集；无结果集响应（如 SELECT ... INTO）兜底空集。params 数组恒走 formatSql（含空数组占位符校验）。 */
  async select(sql, params) {
    const finalSql = Array.isArray(params) ? formatSql(sql, params, this.ctx) : sql
    const res = await this._queryText(finalSql)
    if (res.kind === 'ok') return { columns: [], rows: [], rowCount: 0, truncated: false }
    return { columns: res.columns, rows: res.rows, rowCount: res.total, truncated: res.total > res.rows.length }
  }

  /** 写语句：OK 包取 affected rows / insert id；返回结果集时兜底零值。 */
  async exec(sql, params) {
    const finalSql = Array.isArray(params) ? formatSql(sql, params, this.ctx) : sql
    const res = await this._queryText(finalSql)
    if (res.kind === 'rows') return { changes: 0, lastInsertRowid: null }
    return {
      changes: Number(res.ok.affected) || 0,
      lastInsertRowid: res.ok.insertId > 0n ? Number(res.ok.insertId) : null,
    }
  }

  /** COM_QUIT + 优雅关闭。 */
  async end() {
    if (!this._socket || this._dead) return
    this._dead = true
    const socket = this._socket
    try {
      this._newCommand()
      this._sendPacket(Buffer.from([COM_QUIT]))
      socket.end()
      await new Promise((resolve) => {
        const timer = setTimeout(() => {
          socket.destroy()
          resolve()
        }, CLOSE_GRACE_MS)
        socket.once('close', () => {
          clearTimeout(timer)
          resolve()
        })
        socket.once('error', () => {
          clearTimeout(timer)
          resolve()
        })
      })
    } catch {
      socket.destroy()
    }
  }
}

/** 驱动入口：统一 open/ping/select/exec/close 接口（db.js 注册表调用）。 */
export function createMysqlDriver(ctx) {
  return {
    key: 'mysql',
    async open(config) {
      const cfg = config && typeof config === 'object' ? config : {}
      if (String(cfg.user == null ? '' : cfg.user).trim() === '') {
        throw new ctx.DbError('INVALID_ARGUMENT', 'mysql 连接缺少 user')
      }
      const conn = new MysqlConnection(cfg, ctx)
      await conn.connect()
      return conn
    },
    async ping(handle) {
      await handle.ping()
    },
    async select(handle, sql, params) {
      return handle.select(sql, params)
    },
    async exec(handle, sql, params) {
      return handle.exec(sql, params)
    },
    async close(handle) {
      await handle.end()
    },
  }
}
