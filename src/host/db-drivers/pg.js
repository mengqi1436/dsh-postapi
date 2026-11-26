/**
 * PostgreSQL wire protocol 客户端（node:net/node:tls/node:crypto 自实现，零 npm 依赖）。
 * 协议覆盖：
 * - 启动：StartupMessage（len + 协议版本 196608 + user/database cstring 对 + \0）；
 *   ssl:true 时先发 SSLRequest（len=8 + code 80877103）→ 'S' 后 node:tls 升级
 *   （servername=host，自签证书放行），'N' → CONNECTION_ERROR。
 * - 认证：R '0' ok；'3' cleartext → 'p' password\0；'5' md5 + 4B salt →
 *   'p' "md5"+md5hex(md5hex(password+user)+salthex)；'10' SASL → SCRAM-SHA-256
 *   （client-first n,,n=,r=nonce；server-first 校验 r 前缀；SaltedPassword=pbkdf2(password,s,i,32)；
 *   ClientKey/StoredKey/ClientSignature/ClientProof；client-final c=biws,r=...,p=proof；
 *   SASLFinal v= 校验 ServerSignature）；其余 auth code → CONNECTION_ERROR。
 * - 查询：无 params 用 Simple Query 'Q'；有 params 用扩展协议
 *   Parse('')+Bind+Describe(portal)+Execute+Sync（参数 text 格式、type OID 0 让服务器推断、
 *   null 参数长度 -1）。
 * - 响应：'T' RowDescription（name/type OID）、'D' DataRow（text，-1=null）、'C' CommandComplete、
 *   'Z' ReadyForQuery、'E' ErrorResponse（S/V/C/M/D 字段 → DbError('SQL_ERROR')）、
 *   'N' Notice 忽略、'1'/'2'/'n'/'S'/'K' 忽略。消息头 1B type + 4B len（含自身）。
 * - 值转换按 type OID：int2/4/8 → Number（int8 超安全整数保留字符串，精度保护）；
 *   float4/8 → Number；bool → boolean；json/jsonb → JSON.parse；其余保留字符串。
 * 边界：仅 text 数据格式（未实现二进制格式）；密码不做 SASLprep（ASCII 直用）；
 * SCRAM channel binding 固定 c=biws（无 TLS 通道绑定）；连接错误/超时 → DbError('CONNECTION_ERROR')。
 */
import net from 'node:net'
import tls from 'node:tls'
import crypto from 'node:crypto'

const PROTOCOL_VERSION = 196608 // 3.0
const SSL_REQUEST_CODE = 80877103
const CONNECT_TIMEOUT_MS = 10000
const IO_TIMEOUT_MS = 30000
const CLOSE_GRACE_MS = 500

// type OID
const OID_BOOL = 16
const OID_INT8 = 20
const OID_INT2 = 21
const OID_INT4 = 23
const OID_JSON = 114
const OID_FLOAT4 = 700
const OID_FLOAT8 = 701
const OID_JSONB = 3802

/** 简单消息封装：1B type + 4B len（含自身）+ payload。 */
function pgMessage(type, payload) {
  const head = Buffer.alloc(5)
  head[0] = type.charCodeAt(0)
  head.writeUInt32BE(payload.length + 4, 1)
  return Buffer.concat([head, payload])
}

function u32(value) {
  const b = Buffer.alloc(4)
  b.writeUInt32BE(value >>> 0, 0)
  return b
}

function i16(value) {
  const b = Buffer.alloc(2)
  b.writeInt16BE(value, 0)
  return b
}

function cstring(text) {
  return Buffer.concat([Buffer.from(text, 'utf8'), Buffer.from([0])])
}

function md5Hex(text) {
  return crypto.createHash('md5').update(text, 'utf8').digest('hex')
}

function hmacSha256(key, text) {
  return crypto.createHmac('sha256', key).update(text, 'utf8').digest()
}

/** ErrorResponse 字段（1B code + cstring value）解析 → DbError('SQL_ERROR')。 */
function parseErrorResponse(payload, ctx) {
  let severity = ''
  let sqlState = ''
  let message = ''
  let detail = ''
  let pos = 0
  while (pos < payload.length) {
    const field = String.fromCharCode(payload[pos])
    if (field === '\0') break
    let end = payload.indexOf(0, pos + 1)
    if (end < 0) end = payload.length
    const value = payload.toString('utf8', pos + 1, end)
    if (field === 'S' || field === 'V') severity = severity || value
    else if (field === 'C') sqlState = value
    else if (field === 'M') message = value
    else if (field === 'D') detail = value
    pos = end + 1
  }
  const err = new ctx.DbError(
    'SQL_ERROR',
    `${severity || 'ERROR'}: ${message || '未知错误'}${detail ? ` — ${detail}` : ''}${sqlState ? ` (SQLSTATE ${sqlState})` : ''}`,
  )
  err.sqlState = sqlState
  return err
}

/** StartupMessage：len + 196608 + 参数 cstring 对 + 终止 \0。 */
function startupMessage(user, database) {
  const parts = [u32(PROTOCOL_VERSION), cstring('user'), cstring(user)]
  if (database) parts.push(cstring('database'), cstring(database))
  parts.push(Buffer.from([0]))
  const body = Buffer.concat(parts)
  const head = Buffer.alloc(4)
  head.writeUInt32BE(body.length + 4, 0)
  return Buffer.concat([head, body])
}

/** 值转换按 type OID；int8 超安全整数 → 保留字符串（normalizeCell 大整数策略一致）。 */
function coercePgValue(text, typeOid) {
  if (text === null) return null
  switch (typeOid) {
    case OID_BOOL:
      return text === 't'
    case OID_INT8:
    case OID_INT2:
    case OID_INT4: {
      const n = Number(text)
      return Number.isSafeInteger(n) ? n : text
    }
    case OID_FLOAT4:
    case OID_FLOAT8: {
      const n = Number(text)
      return Number.isNaN(n) ? text : n
    }
    case OID_JSON:
    case OID_JSONB:
      try {
        return JSON.parse(text)
      } catch {
        return text
      }
    default:
      return text
  }
}

/** 参数 → 扩展协议 text 字面量；不支持类型报 INVALID_ARGUMENT。 */
function pgParamText(value, ctx) {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value ? 't' : 'f'
  if (typeof value === 'bigint') return value.toString()
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new ctx.DbError('INVALID_ARGUMENT', `不支持的数值参数：${value}`)
    return String(value)
  }
  if (typeof value === 'string') return value
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new ctx.DbError('INVALID_ARGUMENT', 'Date 参数为无效时间')
    return value.toISOString()
  }
  throw new ctx.DbError('INVALID_ARGUMENT', `不支持的参数类型：${typeof value}（仅支持 string/number/bigint/boolean/null/Date）`)
}

/** RowDescription 解析：列名 + type OID。 */
function parseRowDescription(payload) {
  const count = payload.readInt16BE(0)
  const columns = new Array(count)
  let pos = 2
  for (let i = 0; i < count; i++) {
    let end = payload.indexOf(0, pos)
    if (end < 0) end = payload.length
    const name = payload.toString('utf8', pos, end)
    pos = end + 1
    const typeOid = payload.readUInt32BE(pos + 6) // tableOid(4) + attrNum(2) 之后
    pos += 18 // tableOid 4 + attrNum 2 + typeOid 4 + typlen 2 + typmod 4 + format 2
    columns[i] = { name, typeOid }
  }
  return columns
}

/** DataRow 解析：text 格式，len=-1 → null。 */
function parseDataRow(payload) {
  const count = payload.readInt16BE(0)
  const values = new Array(count)
  let pos = 2
  for (let i = 0; i < count; i++) {
    const len = payload.readInt32BE(pos)
    pos += 4
    if (len === -1) {
      values[i] = null
      continue
    }
    values[i] = payload.toString('utf8', pos, pos + len)
    pos += len
  }
  return values
}

/** PostgreSQL 连接：协议状态 + socket 读写。 */
class PgConnection {
  constructor(config, ctx) {
    this.ctx = ctx
    this.host = String(config.host || '').trim() || '127.0.0.1'
    const port = Number(config.port)
    this.port = Number.isFinite(port) && port > 0 ? Math.trunc(port) : 5432
    this.user = String(config.user || '')
    this.password = String(config.password || '')
    this.database = String(config.database || '').trim()
    this.ssl = config.ssl === true
    this._socket = null
    this._buf = Buffer.alloc(0)
    this._off = 0
    this._waiters = []
    this._error = null
    this._dead = false
  }

  _attach(socket) {
    socket.setNoDelay(true)
    socket.setTimeout(IO_TIMEOUT_MS)
    socket.on('data', (chunk) => {
      this._buf = this._off > 0 ? Buffer.concat([this._buf.subarray(this._off), chunk]) : (this._buf.length ? Buffer.concat([this._buf, chunk]) : chunk)
      this._off = 0
      this._drain()
    })
    socket.on('error', (err) => this._fail(new this.ctx.DbError('CONNECTION_ERROR', `PostgreSQL 连接错误：${err.message}`)))
    socket.on('close', () => this._fail(new this.ctx.DbError('CONNECTION_ERROR', 'PostgreSQL 连接已被关闭')))
    socket.on('timeout', () => {
      socket.destroy()
      this._fail(new this.ctx.DbError('CONNECTION_ERROR', `PostgreSQL IO 超时（${IO_TIMEOUT_MS}ms）`))
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

  /** 读一条消息：1B type + 4B len（含自身）。 */
  async readMessage() {
    const head = await this._readExact(5)
    const type = String.fromCharCode(head[0])
    const len = head.readUInt32BE(1)
    const payload = len >= 4 ? await this._readExact(len - 4) : Buffer.alloc(0)
    return { type, payload }
  }

  send(type, payload) {
    this._socket.write(pgMessage(type, payload))
  }

  _openSocket() {
    return new Promise((resolve, reject) => {
      const socket = net.connect({ host: this.host, port: this.port })
      const timer = setTimeout(() => {
        socket.destroy()
        reject(new this.ctx.DbError('CONNECTION_ERROR', `连接 PostgreSQL 超时（${CONNECT_TIMEOUT_MS}ms）：${this.host}:${this.port}`))
      }, CONNECT_TIMEOUT_MS)
      socket.once('connect', () => {
        clearTimeout(timer)
        resolve(socket)
      })
      socket.once('error', (err) => {
        clearTimeout(timer)
        reject(new this.ctx.DbError('CONNECTION_ERROR', `连接 PostgreSQL 失败：${err.message}`))
      })
    })
  }

  /** ssl:true：SSLRequest(80877103) → 'S' 后 TLS 升级；'N' → 错误。 */
  async _sslNegotiate() {
    this._socket.write(Buffer.concat([u32(8), u32(SSL_REQUEST_CODE)]))
    const resp = await this._readExact(1)
    if (resp[0] !== 0x53) {
      throw new this.ctx.DbError('CONNECTION_ERROR', '服务器拒绝 SSL（SSLRequest 响应非 S）')
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
  }

  /** 认证循环：R ok / cleartext / md5 / SASL(SCRAM-SHA-256)；E → SQL_ERROR；其余码报错。 */
  async _authenticate() {
    for (;;) {
      const msg = await this.readMessage()
      if (msg.type === 'E') throw parseErrorResponse(msg.payload, this.ctx)
      if (msg.type !== 'R') {
        throw new this.ctx.DbError('CONNECTION_ERROR', `认证阶段收到非 Authentication 消息：${msg.type}`)
      }
      const code = msg.payload.readUInt32BE(0)
      if (code === 0) return
      if (code === 3) {
        // cleartext：'p' + password\0
        this.send('p', Buffer.concat([Buffer.from(this.password, 'utf8'), Buffer.from([0])]))
        continue
      }
      if (code === 5) {
        // md5：salt 取 payload[4..8]，hex 小写
        const salt = msg.payload.subarray(4, 8)
        const inner = md5Hex(this.password + this.user)
        const token = 'md5' + md5Hex(inner + salt.toString('hex'))
        this.send('p', Buffer.concat([Buffer.from(token, 'utf8'), Buffer.from([0])]))
        continue
      }
      if (code === 10) {
        await this._scramAuthentication(msg.payload)
        continue
      }
      throw new this.ctx.DbError('CONNECTION_ERROR', `不支持的认证方式（authentication code=${code}）`)
    }
  }

  /** SCRAM-SHA-256：client-first → server-first → client-final → SASLFinal 校验。 */
  async _scramAuthentication(payload) {
    // 机制列表：payload[4..] 为 cstring 序列
    const mechanisms = []
    let pos = 4
    while (pos < payload.length && payload[pos] !== 0) {
      let end = payload.indexOf(0, pos)
      if (end < 0) end = payload.length
      mechanisms.push(payload.toString('utf8', pos, end))
      pos = end + 1
    }
    if (!mechanisms.includes('SCRAM-SHA-256')) {
      throw new this.ctx.DbError('CONNECTION_ERROR', `服务器不提供 SCRAM-SHA-256（${mechanisms.join(',')}）`)
    }
    const clientNonce = crypto.randomBytes(16).toString('hex')
    const clientFirst = `n,,n=,r=${clientNonce}`
    const clientFirstBare = clientFirst.slice(3)
    // SASLInitialResponse：mechanism cstring + int32 len + client-first
    const initialBody = Buffer.concat([cstring('SCRAM-SHA-256'), u32(Buffer.byteLength(clientFirst)), Buffer.from(clientFirst, 'utf8')])
    this.send('p', initialBody)
    // server-first：R(11)
    const cont = await this.readMessage()
    if (cont.type === 'E') throw parseErrorResponse(cont.payload, this.ctx)
    if (cont.type !== 'R' || cont.payload.readUInt32BE(0) !== 11) {
      throw new this.ctx.DbError('CONNECTION_ERROR', 'SCRAM 阶段未收到 server-first（R/11）')
    }
    const serverFirst = cont.payload.toString('utf8', 4)
    const m = serverFirst.match(/^r=([^,]*),s=([^,]*),i=(\d+)$/)
    if (!m) throw new this.ctx.DbError('CONNECTION_ERROR', `server-first 格式异常：${serverFirst}`)
    const serverNonce = m[1]
    const salt = Buffer.from(m[2], 'base64')
    const iterations = Number(m[3])
    if (!serverNonce.startsWith(clientNonce)) {
      throw new this.ctx.DbError('CONNECTION_ERROR', 'server nonce 未以 client nonce 开头（疑似降级攻击）')
    }
    // SaltedPassword / ClientKey / StoredKey / ClientSignature / ClientProof
    const saltedPassword = crypto.pbkdf2Sync(this.password, salt, iterations, 32, 'sha256')
    const clientKey = hmacSha256(saltedPassword, 'Client Key')
    const storedKey = crypto.createHash('sha256').update(clientKey).digest()
    const authMessage = `${clientFirstBare},${serverFirst},c=biws,r=${serverNonce}`
    const clientSignature = hmacSha256(storedKey, authMessage)
    const clientProof = Buffer.from(clientKey.map((b, i) => b ^ clientSignature[i]))
    const clientFinal = `c=biws,r=${serverNonce},p=${clientProof.toString('base64')}`
    this.send('p', Buffer.from(clientFinal, 'utf8'))
    // SASLFinal：R(12) + "v=b64(ServerSignature)"
    const fin = await this.readMessage()
    if (fin.type === 'E') throw parseErrorResponse(fin.payload, this.ctx)
    if (fin.type !== 'R' || fin.payload.readUInt32BE(0) !== 12) {
      throw new this.ctx.DbError('CONNECTION_ERROR', 'SCRAM 阶段未收到 SASLFinal（R/12）')
    }
    const serverSignatureValue = hmacSha256(hmacSha256(saltedPassword, 'Server Key'), authMessage)
    const expected = 'v=' + serverSignatureValue.toString('base64')
    if (fin.payload.toString('utf8', 4) !== expected) {
      throw new this.ctx.DbError('CONNECTION_ERROR', 'ServerSignature 校验失败')
    }
  }

  /** 认证成功后读完启动期剩余消息（ParameterStatus/BackendKeyData/Notice）到 ReadyForQuery。 */
  async _drainStartup() {
    for (;;) {
      const msg = await this.readMessage()
      if (msg.type === 'E') throw parseErrorResponse(msg.payload, this.ctx)
      if (msg.type === 'Z') return
    }
  }

  async connect() {
    const socket = await this._openSocket()
    this._socket = socket
    this._attach(socket)
    if (this.ssl) await this._sslNegotiate()
    this._socket.write(startupMessage(this.user, this.database))
    await this._authenticate()
    await this._drainStartup()
  }

  /**
   * 消息收集循环：到 'Z' 结束；期间收集 T/D/C，记录 E（最后一条），结束若存在 E → 抛出。
   * '1'/'2'/'n'/'S'/'K'/'N' 等忽略。
   */
  async _collect() {
    const columns = []
    const dataRows = []
    const tags = []
    let error = null
    for (;;) {
      const msg = await this.readMessage()
      switch (msg.type) {
        case 'T':
          columns.push(...parseRowDescription(msg.payload))
          break
        case 'D':
          dataRows.push(parseDataRow(msg.payload))
          break
        case 'C': {
          let end = msg.payload.indexOf(0)
          if (end < 0) end = msg.payload.length
          tags.push(msg.payload.toString('utf8', 0, end))
          break
        }
        case 'E':
          error = parseErrorResponse(msg.payload, this.ctx)
          break
        case 'Z':
          if (error) throw error
          return { columns, dataRows, tags }
        default:
          break
      }
    }
  }

  /** Simple Query 'Q'。 */
  async simpleQuery(sql) {
    this.send('Q', Buffer.concat([Buffer.from(sql, 'utf8'), Buffer.from([0])]))
    return this._collect()
  }

  /** 扩展协议：Parse('')+Bind+Describe(portal)+Execute+Sync。 */
  async extendedQuery(sql, params) {
    // Parse：语句名 ''、参数类型数 0（type OID 让服务器推断）
    this.send('P', Buffer.concat([cstring(''), cstring(sql), i16(0)]))
    // Bind：参数全 text 格式（format code 0 ×1）、null → 长度 -1、结果全 text
    const bindParts = [cstring(''), cstring(''), i16(1), i16(0), i16(params.length)]
    for (const p of params) {
      const text = pgParamText(p, this.ctx)
      if (text === null) {
        bindParts.push(u32(0xffffffff))
      } else {
        const bytes = Buffer.from(text, 'utf8')
        bindParts.push(u32(bytes.length), bytes)
      }
    }
    bindParts.push(i16(1), i16(0))
    this.send('B', Buffer.concat(bindParts))
    // Describe portal + Execute(0 = 不限行) + Sync
    this.send('D', Buffer.concat([Buffer.from([0x50]), cstring('')]))
    this.send('E', Buffer.concat([cstring(''), u32(0)]))
    this.send('S', Buffer.alloc(0))
    return this._collect()
  }

  async query(sql, params) {
    if (params && params.length) return this.extendedQuery(sql, params)
    return this.simpleQuery(sql)
  }

  /** 存活探测：SELECT 1 简单查询（读到 ReadyForQuery）。 */
  async ping() {
    await this.simpleQuery('SELECT 1')
  }

  /** SELECT 类：按 type OID 转换值；0 行也返回列名。 */
  async select(sql, params) {
    const res = await this.query(sql, params)
    const names = res.columns.map((c) => c.name)
    const rows = res.dataRows.slice(0, this.ctx.maxRows).map((values) => {
      const row = {}
      for (let i = 0; i < res.columns.length; i++) {
        row[res.columns[i].name] = this.ctx.normalizeCell(coercePgValue(values[i], res.columns[i].typeOid))
      }
      return row
    })
    return { columns: names, rows, rowCount: res.dataRows.length, truncated: res.dataRows.length > rows.length }
  }

  /** 写语句：CommandComplete tag 解析行数（INSERT oid n / UPDATE n / DELETE n）。 */
  async exec(sql, params) {
    const res = await this.query(sql, params)
    const tag = res.tags[res.tags.length - 1] || ''
    const last = tag.split(' ').pop()
    const n = Number(last)
    return {
      changes: tag !== '' && Number.isFinite(n) ? n : 0,
      lastInsertRowid: null,
    }
  }

  /** Terminate 'X' + 优雅关闭。 */
  async end() {
    if (!this._socket || this._dead) return
    this._dead = true
    const socket = this._socket
    try {
      this.send('X', Buffer.alloc(0))
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
export function createPgDriver(ctx) {
  return {
    key: 'postgresql',
    async open(config) {
      const cfg = config && typeof config === 'object' ? config : {}
      if (String(cfg.user == null ? '' : cfg.user).trim() === '') {
        throw new ctx.DbError('INVALID_ARGUMENT', 'postgresql 连接缺少 user')
      }
      if (String(cfg.database == null ? '' : cfg.database).trim() === '') {
        throw new ctx.DbError('INVALID_ARGUMENT', 'postgresql 连接缺少 database')
      }
      const conn = new PgConnection(cfg, ctx)
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
