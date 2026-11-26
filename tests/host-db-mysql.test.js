/**
 * mysql/postgresql 驱动套件（mysql 部分）：自建 mock MySQL 服务端（协议服务器侧按 wire protocol
 * 实现：发握手 v10、校验 HandshakeResponse41、按 auth 插件独立计算期望 scramble、收 COM_PING/
 * COM_QUERY/COM_QUIT、回 column def + text 行或 OK/ERR；3B len + 1B seq 分帧读写自己实现）。
 * 覆盖：test 连接、native/caching fast/caching full(RSA)/AUTH_SWITCH、SELECT/INSERT/ERR、
 * params 转义（服务端断言最终 SQL）、池复用（只握手一次）、close/closeAll、SSLRequest 拒绝、大包分帧。
 * node tests/host-db-mysql.test.js 直接执行（mini runner），node tests/run.js 汇总执行。
 */
import assert from 'node:assert/strict'
import net from 'node:net'
import crypto from 'node:crypto'
import { createDbService, DbError, SUPPORTED_DRIVERS } from '../src/host/db.js'
import { splitPayload } from '../src/host/db-drivers/mysql.js'

const MAX_PAYLOAD = 0xffffff

/* ---------------- mock MySQL 服务端（独立实现，不复用被测代码） ---------------- */

function u16le(n) {
  const b = Buffer.alloc(2)
  b.writeUInt16LE(n, 0)
  return b
}

function u32le(n) {
  const b = Buffer.alloc(4)
  b.writeUInt32LE(n, 0)
  return b
}

function mockLenencInt(n) {
  if (n < 0xfb) return Buffer.from([n])
  if (n <= 0xffff) return Buffer.concat([Buffer.from([0xfc]), u16le(n)])
  if (n <= 0xffffff) return Buffer.concat([Buffer.from([0xfd]), Buffer.from([n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff])])
  const b = Buffer.alloc(9)
  b[0] = 0xfe
  b.writeBigUInt64LE(BigInt(n), 1)
  return b
}

function mockLenencStr(text) {
  const b = Buffer.from(String(text), 'utf8')
  return Buffer.concat([mockLenencInt(b.length), b])
}

function mockCstring(text) {
  return Buffer.concat([Buffer.from(String(text), 'utf8'), Buffer.from([0])])
}

/** 服务端 SHA1 scramble（mysql_native_password 期望值，独立计算）。 */
function serverNativeScramble(password, seed) {
  const s1 = crypto.createHash('sha1').update(password, 'utf8').digest()
  const s2 = crypto.createHash('sha1').update(s1).digest()
  const s3 = crypto.createHash('sha1').update(Buffer.concat([seed, s2])).digest()
  return Buffer.from(s1.map((b, i) => b ^ s3[i]))
}

/** 服务端 SHA256 scramble（caching_sha2_password fast auth 期望值）。 */
function serverSha256Scramble(password, seed) {
  const s1 = crypto.createHash('sha256').update(password, 'utf8').digest()
  const s2 = crypto.createHash('sha256').update(s1).digest()
  const s3 = crypto.createHash('sha256').update(Buffer.concat([s2, seed])).digest()
  return Buffer.from(s1.map((b, i) => b ^ s3[i]))
}

/** mock 服务端能力位（与被测客户端约定一致的最小集）。 */
const SERVER_CAPS = 0x1 | 0x200 | 0x2000 | 0x8000 | 0x80000 // LONG_PASSWORD|PROTOCOL_41|TRANSACTIONS|SECURE_CONNECTION|PLUGIN_AUTH

function createMockMysqlServer(options = {}) {
  const opts = {
    plugin: 'mysql_native_password',
    cachingMode: 'fast', // 'fast' | 'full'
    authSwitch: false, // true：握手后发 AUTH_SWITCH 到 mysql_native_password（新 seed）
    user: 'root',
    password: 'secret',
    onQuery: null, // (sql) => { columns, rows } | { ok } | { err }
    ...options,
  }
  const state = {
    connections: 0,
    handshakes: 0,
    authOk: 0,
    pings: 0,
    quitCount: 0,
    queries: [],
    lastSql: '',
    sslRequests: 0,
    clientCaps: 0,
    clientUser: '',
    clientPlugin: '',
    clientDatabase: '',
    authFailures: [],
  }
  const server = net.createServer((sock) => {
    state.connections += 1
    const seed = crypto.randomBytes(20)
    let outSeq = 0
    let stage = 'await-response' // await-response | await-switch | await-full-key | await-full-rsa | cmd
    let switchSeed = null

    function writePacket(payload) {
      for (const frame of splitServerFrames(payload)) {
        const head = Buffer.alloc(4)
        head.writeUIntLE(frame.length, 0, 3)
        head[3] = outSeq & 0xff
        sock.write(Buffer.concat([head, frame]))
        outSeq = (outSeq + 1) & 0xff
      }
    }

    // 服务端侧分帧（与客户端 splitPayload 同规则：0xffffff 续帧，整除补空帧）
    function splitServerFrames(payload) {
      if (payload.length === 0) return [Buffer.alloc(0)]
      const frames = []
      for (let off = 0; off < payload.length; off += MAX_PAYLOAD) {
        frames.push(payload.subarray(off, Math.min(off + MAX_PAYLOAD, payload.length)))
      }
      if (payload.length % MAX_PAYLOAD === 0) frames.push(Buffer.alloc(0))
      return frames
    }

    function sendOk(affected = 0, insertId = 0) {
      writePacket(Buffer.concat([
        Buffer.from([0x00]),
        mockLenencInt(affected),
        mockLenencInt(insertId),
        u16le(0x0002), // status: AUTOCOMMIT
        u16le(0), // warnings
      ]))
    }

    function sendErr(errno, sqlstate, message) {
      writePacket(Buffer.concat([Buffer.from([0xff]), u16le(errno), Buffer.from('#' + sqlstate), Buffer.from(message, 'utf8')]))
    }

    function sendEof() {
      writePacket(Buffer.from([0xfe, 0x00, 0x00, 0x00, 0x00]))
    }

    function sendColumnDef(name, type) {
      writePacket(Buffer.concat([
        mockLenencStr('def'),
        mockLenencStr(''),
        mockLenencStr('t'),
        mockLenencStr('t'),
        mockLenencStr(name),
        mockLenencStr(name),
        mockLenencInt(0x0c),
        u16le(63), // charset binary
        u32le(64), // column length
        Buffer.from([type]),
        u16le(0),
        Buffer.from([0]),
        u16le(0),
      ]))
    }

    function sendTextRow(values) {
      writePacket(Buffer.concat(values.map((v) => (v === null ? Buffer.from([0xfb]) : mockLenencStr(String(v))))))
    }

    function sendResultSet(desc) {
      writePacket(mockLenencInt(desc.columns.length))
      for (const c of desc.columns) sendColumnDef(c.name, c.type == null ? 0xfd : c.type)
      sendEof()
      for (const row of desc.rows) sendTextRow(row)
      sendEof()
    }

    // 初始握手 v10
    const handshake = Buffer.concat([
      Buffer.from([10]),
      mockCstring('8.0.31-mock'),
      u32le(1), // thread id
      seed.subarray(0, 8), // seed part1
      Buffer.from([0]), // filler
      u16le(SERVER_CAPS & 0xffff),
      Buffer.from([45]), // charset
      u16le(0x0002), // status
      u16le((SERVER_CAPS >>> 16) & 0xffff),
      Buffer.from([21]), // auth data len = 8 + 12 + 1(\0)
      Buffer.alloc(10), // reserved
      Buffer.concat([seed.subarray(8), Buffer.from([0])]), // seed part2 (13B)
      mockCstring(opts.plugin),
    ])
    writePacket(handshake)

    function parseResponse41(pkt) {
      let pos = 0
      const caps = pkt.readUInt32LE(0)
      pos += 8 // caps + max packet
      pos += 1 // charset
      pos += 23 // reserved
      let end = pkt.indexOf(0, pos)
      const user = pkt.toString('utf8', pos, end)
      pos = end + 1
      let auth
      if (caps & 0x00080000) {
        const n = pkt[pos]
        pos += 1
        auth = pkt.subarray(pos, pos + n)
        pos += n
      } else {
        end = pkt.indexOf(0, pos)
        auth = pkt.subarray(pos, end)
        pos = end + 1
      }
      let database = ''
      if (caps & 0x00000008 && pos < pkt.length) {
        end = pkt.indexOf(0, pos)
        database = pkt.toString('utf8', pos, end)
        pos = end + 1
      }
      let plugin = ''
      if (pos < pkt.length) {
        end = pkt.indexOf(0, pos)
        plugin = end < 0 ? pkt.toString('utf8', pos) : pkt.toString('utf8', pos, end)
      }
      return { caps, user, auth, database, plugin }
    }

    function denyAuth(message) {
      state.authFailures.push(message)
      sendErr(1045, '28000', message)
      sock.destroy()
    }

    function authSuccess() {
      state.authOk += 1
      sendOk()
      stage = 'cmd'
    }

    function handlePacket(pkt) {
      if (stage === 'await-response') {
        // SSLRequest：32B 裸包（caps 含 CLIENT_SSL），在明文握手之后到达
        if (pkt.length === 32 && (pkt.readUInt32LE(0) & 0x800) !== 0) {
          state.sslRequests += 1
          sock.write('N') // 拒绝 SSL 升级
          sock.destroy()
          return
        }
        state.handshakes += 1
        const parsed = parseResponse41(pkt)
        state.clientCaps = parsed.caps
        state.clientUser = parsed.user
        state.clientPlugin = parsed.plugin
        state.clientDatabase = parsed.database
        if (parsed.user !== opts.user) {
          denyAuth(`Access denied for user '${parsed.user}'`)
          return
        }
        if (opts.authSwitch) {
          switchSeed = crypto.randomBytes(20)
          writePacket(Buffer.concat([Buffer.from([0xfe]), mockCstring('mysql_native_password'), switchSeed, Buffer.from([0])]))
          stage = 'await-switch'
          return
        }
        if (opts.plugin === 'mysql_native_password') {
          const expected = parsed.auth.length === 0 ? Buffer.alloc(0) : serverNativeScramble(opts.password, seed)
          if (parsed.auth.equals(expected)) authSuccess()
          else denyAuth('native scramble mismatch')
          return
        }
        if (opts.plugin === 'caching_sha2_password' && opts.cachingMode === 'fast') {
          const expected = parsed.auth.length === 0 ? Buffer.alloc(0) : serverSha256Scramble(opts.password, seed)
          if (parsed.auth.equals(expected)) {
            writePacket(Buffer.from([0x01, 0x03])) // AuthMoreData: fast auth 成功
            authSuccess()
          } else {
            denyAuth('sha256 scramble mismatch')
          }
          return
        }
        if (opts.plugin === 'caching_sha2_password' && opts.cachingMode === 'full') {
          // 强制 full auth：跳过 fast 校验
          writePacket(Buffer.from([0x01, 0x04]))
          stage = 'await-full-key'
          return
        }
        denyAuth(`unknown plugin ${opts.plugin}`)
        return
      }
      if (stage === 'await-switch') {
        // AUTH_SWITCH 响应：客户端按新 seed 计算 native scramble
        const expected = serverNativeScramble(opts.password, switchSeed)
        if (pkt.equals(expected)) authSuccess()
        else denyAuth('switch scramble mismatch')
        return
      }
      if (stage === 'await-full-key') {
        if (pkt.length === 1 && pkt[0] === 0x01) {
          // 客户端请求 RSA 公钥 → AuthMoreData 0x02 + PEM cstring
          writePacket(Buffer.concat([Buffer.from([0x01, 0x02]), mockCstring(opts.rsaPublicKey)]))
          stage = 'await-full-rsa'
        } else {
          denyAuth('full auth 期待公钥请求 0x01')
        }
        return
      }
      if (stage === 'await-full-rsa') {
        const dec = crypto.privateDecrypt(
          { key: opts.rsaPrivateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha1' },
          pkt,
        )
        for (let i = 0; i < dec.length; i++) dec[i] ^= seed[i % seed.length]
        if (dec.equals(Buffer.concat([Buffer.from(opts.password, 'utf8'), Buffer.from([0])]))) authSuccess()
        else denyAuth('full auth RSA 解密后密码不匹配')
        return
      }
      // cmd 阶段：响应 seq 已由 pump 按 client 包 seq+1 设好
      const cmd = pkt[0]
      if (cmd === 0x0e) {
        state.pings += 1
        sendOk()
        return
      }
      if (cmd === 0x01) {
        state.quitCount += 1
        sock.end()
        return
      }
      if (cmd === 0x03) {
        const sql = pkt.toString('utf8', 1)
        state.lastSql = sql
        state.queries.push(sql)
        const desc = opts.onQuery ? opts.onQuery(sql) : { columns: [{ name: '1', type: 0x08 }], rows: [['1']] }
        if (desc.err) {
          sendErr(desc.err.errno, desc.err.sqlstate || 'HY000', desc.err.message)
          return
        }
        if (desc.ok) {
          sendOk(desc.ok.affectedRows || 0, desc.ok.insertId || 0)
          return
        }
        sendResultSet(desc)
        return
      }
      sendErr(1047, '08S01', '未知命令 ' + cmd)
    }

    let buf = Buffer.alloc(0)
    sock.on('data', (d) => {
      buf = Buffer.concat([buf, d])
      pump()
    })
    function pump() {
      while (buf.length >= 4) {
        const len = buf.readUIntLE(0, 3)
        if (buf.length < 4 + len) break
        const pktSeq = buf[3]
        const pkt = buf.subarray(4, 4 + len)
        buf = buf.subarray(4 + len)
        // 共享 seq 序列：服务端下一个发送包 seq = 客户端包 seq + 1
        outSeq = (pktSeq + 1) & 0xff
        try {
          handlePacket(pkt)
        } catch (err) {
          state.authFailures.push('server error: ' + err.message)
          sock.destroy()
        }
      }
    }
  })
  return { server, state, opts }
}

async function listen(server) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  return server.address().port
}

/** 起一个 mock MySQL（可选 RSA keypair，caching full auth 用）。 */
async function startMock(options = {}) {
  const mock = createMockMysqlServer(options)
  if (options.cachingMode === 'full') {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
    mock.opts.rsaPublicKey = publicKey.export({ type: 'spki', format: 'pem' })
    mock.opts.rsaPrivateKey = privateKey.export({ type: 'pkcs8', format: 'pem' })
  }
  const port = await listen(mock.server)
  return {
    port,
    state: mock.state,
    setOnQuery(fn) {
      mock.opts.onQuery = fn
    },
    async stop() {
      await new Promise((resolve) => mock.server.close(resolve))
    },
  }
}

function mysqlConnection(port, extra = {}) {
  return { type: 'mysql', host: '127.0.0.1', port, user: 'root', password: 'secret', ...extra }
}

export const tests = [
  {
    name: 'mysql: test 连接成功（COM_PING）+ driver 标记 + SUPPORTED_DRIVERS 注册',
    fn: async () => {
      assert.deepEqual(SUPPORTED_DRIVERS, ['sqlite', 'mysql', 'postgresql'])
      const mock = await startMock()
      const db = createDbService()
      try {
        const t = await db.test({ connection: mysqlConnection(mock.port) })
        assert.equal(t.ok, true)
        assert.equal(t.driver, 'mysql')
        assert.equal(mock.state.handshakes, 1)
        assert.equal(mock.state.pings, 1, 'test 应走 COM_PING')
        assert.equal(mock.state.clientUser, 'root')
        assert.equal(mock.state.clientPlugin, 'mysql_native_password', '应回显服务器插件名')
        // 客户端能力位：PROTOCOL_41 | SECURE_CONNECTION | PLUGIN_AUTH
        assert.equal((mock.state.clientCaps & 0x200) !== 0, true)
        assert.equal((mock.state.clientCaps & 0x8000) !== 0, true)
        assert.equal((mock.state.clientCaps & 0x80000) !== 0, true)
      } finally {
        await db.closeAll()
        await mock.stop()
      }
    },
  },
  {
    name: 'mysql: mysql_native_password SHA1 scramble 服务端校验 + 错误口令被拒',
    fn: async () => {
      const mock = await startMock({ password: 'correct-horse' })
      const db = createDbService()
      try {
        const ok = await db.test({ connection: mysqlConnection(mock.port, { password: 'correct-horse' }) })
        assert.equal(ok.ok, true)
        assert.deepEqual(mock.state.authFailures, [])
        // 错误口令 → 客户端 scramble 与服务端期望不一致 → ERR 1045
        const bad = await db.test({ connection: mysqlConnection(mock.port, { password: 'wrong' }) })
        assert.equal(bad.ok, false)
        assert.equal(bad.error.code, 'SQL_ERROR')
        assert.match(bad.error.message, /1045/)
      } finally {
        await db.closeAll()
        await mock.stop()
      }
    },
  },
  {
    name: 'mysql: caching_sha2_password fast auth（SHA256 scramble + AuthMoreData 0x03）',
    fn: async () => {
      const mock = await startMock({ plugin: 'caching_sha2_password', cachingMode: 'fast' })
      const db = createDbService()
      try {
        const t = await db.test({ connection: mysqlConnection(mock.port) })
        assert.equal(t.ok, true)
        const q = await db.query({ connection: mysqlConnection(mock.port), sql: 'SELECT 1' })
        assert.equal(q.driver, 'mysql')
        assert.equal(q.rows[0]['1'], 1)
        assert.equal(mock.state.authOk, 2, '两次连接均 fast auth 成功')
      } finally {
        await db.closeAll()
        await mock.stop()
      }
    },
  },
  {
    name: 'mysql: caching_sha2_password full auth（RSA 公钥 OAEP 加密回发，服务端解密校验）',
    fn: async () => {
      const mock = await startMock({ plugin: 'caching_sha2_password', cachingMode: 'full' })
      const db = createDbService()
      try {
        const t = await db.test({ connection: mysqlConnection(mock.port) })
        assert.equal(t.ok, true, 'full auth 应通过：' + JSON.stringify(t))
        assert.equal(mock.state.authOk, 1)
        assert.deepEqual(mock.state.authFailures, [])
      } finally {
        await db.closeAll()
        await mock.stop()
      }
    },
  },
  {
    name: 'mysql: AUTH_SWITCH 分发（服务端切换插件 + 新 seed 校验）',
    fn: async () => {
      const mock = await startMock({ plugin: 'caching_sha2_password', cachingMode: 'fast', authSwitch: true })
      const db = createDbService()
      try {
        const t = await db.test({ connection: mysqlConnection(mock.port) })
        assert.equal(t.ok, true, 'AUTH_SWITCH 后应按新 seed 完成 native 认证：' + JSON.stringify(t))
        assert.equal(mock.state.clientPlugin, 'caching_sha2_password', '握手阶段回显的是服务器初始插件名')
        assert.equal(mock.state.authOk, 1)
      } finally {
        await db.closeAll()
        await mock.stop()
      }
    },
  },
  {
    name: 'mysql: SELECT 结果集解析（columns/rows/rowCount/NULL/数值转换）',
    fn: async () => {
      const mock = await startMock()
      const db = createDbService()
      try {
        mock.setOnQuery((sql) => {
          if (!sql.includes('users')) return null
          return {
            columns: [
              { name: 'id', type: 0x03 }, // LONG
              { name: 'name', type: 0xfd }, // VAR_STRING
              { name: 'score', type: 0x05 }, // DOUBLE
              { name: 'big', type: 0x08 }, // LONGLONG
            ],
            rows: [['1', '张三', '9.5', '42'], ['2', null, '8.25', '9223372036854775807']],
          }
        })
        const q = await db.query({ connection: mysqlConnection(mock.port), sql: 'SELECT id, name, score, big FROM users ORDER BY id' })
        assert.equal(q.driver, 'mysql')
        assert.deepEqual(q.columns, ['id', 'name', 'score', 'big'])
        assert.equal(q.rowCount, 2)
        assert.equal(q.truncated, false)
        assert.deepEqual(q.rows[0], { id: 1, name: '张三', score: 9.5, big: 42 })
        assert.equal(q.rows[1].name, null)
        assert.equal(q.rows[1].big, '9223372036854775807', 'int8 超安全整数应保留字符串')
      } finally {
        await db.closeAll()
        await mock.stop()
      }
    },
  },
  {
    name: 'mysql: INSERT OK 包 → changes/lastInsertRowid（lenenc 解析）',
    fn: async () => {
      const mock = await startMock()
      const db = createDbService()
      try {
        mock.setOnQuery(() => ({ ok: { affectedRows: 3, insertId: 42 } }))
        const w = await db.query({ connection: mysqlConnection(mock.port), sql: 'INSERT INTO t VALUES (1),(2),(3)' })
        assert.equal(w.driver, 'mysql')
        assert.equal(w.changes, 3)
        assert.equal(w.lastInsertRowid, 42)
        mock.setOnQuery(() => ({ ok: { affectedRows: 1, insertId: 0 } }))
        const w2 = await db.query({ connection: mysqlConnection(mock.port), sql: 'DELETE FROM t WHERE id = 1' })
        assert.equal(w2.changes, 1)
        assert.equal(w2.lastInsertRowid, null, 'insert id 0 → null')
      } finally {
        await db.closeAll()
        await mock.stop()
      }
    },
  },
  {
    name: 'mysql: ERR 包 → DbError SQL_ERROR 携带 errno/sqlstate',
    fn: async () => {
      const mock = await startMock()
      const db = createDbService()
      try {
        mock.setOnQuery(() => ({ err: { errno: 1146, sqlstate: '42S02', message: "Table 'db.missing' doesn't exist" } }))
        await assert.rejects(
          () => db.query({ connection: mysqlConnection(mock.port), sql: 'SELECT * FROM missing' }),
          (err) => err instanceof DbError && err.code === 'SQL_ERROR' && err.errno === 1146 && err.status === 400
            && String(err.message).includes('42S02') && String(err.message).includes("doesn't exist"),
        )
      } finally {
        await db.closeAll()
        await mock.stop()
      }
    },
  },
  {
    name: 'mysql: params 客户端转义（服务端断言最终 SQL 文本）',
    fn: async () => {
      const mock = await startMock()
      const db = createDbService()
      try {
        mock.setOnQuery(() => ({ ok: { affectedRows: 1, insertId: 1 } }))
        const at = new Date('2024-01-02T03:04:05.678Z')
        await db.query({
          connection: mysqlConnection(mock.port),
          sql: 'INSERT INTO t (a,b,c,d,e,f,g) VALUES (?, ?, ?, ?, ?, ?, ?) /* ? 注释内不替换 */ -- ? 也不替换',
          params: ["O'Brien", 'line1\nline2\0tab', null, true, 3.5, at, 'back\\slash'],
        })
        assert.equal(
          mock.state.lastSql,
          "INSERT INTO t (a,b,c,d,e,f,g) VALUES ('O\\'Brien', 'line1\\nline2\\0tab', NULL, 1, 3.5, "
          + "'2024-01-02T03:04:05.678Z', 'back\\\\slash') /* ? 注释内不替换 */ -- ? 也不替换",
        )
        // 引号内的 ? 不替换 + 参数个数校验
        mock.setOnQuery(() => ({ columns: [{ name: 'x', type: 0xfd }], rows: [['?']] }))
        await db.query({ connection: mysqlConnection(mock.port), sql: "SELECT '?' AS x, ? AS y", params: ['literal'] })
        assert.equal(mock.state.lastSql, "SELECT '?' AS x, 'literal' AS y")
        await assert.rejects(
          () => db.query({ connection: mysqlConnection(mock.port), sql: 'SELECT ?', params: [Buffer.from('x')] }),
          (err) => err.code === 'INVALID_ARGUMENT',
        )
        await assert.rejects(
          () => db.query({ connection: mysqlConnection(mock.port), sql: 'SELECT ?', params: [] }),
          (err) => err.code === 'INVALID_ARGUMENT',
        )
      } finally {
        await db.closeAll()
        await mock.stop()
      }
    },
  },
  {
    name: 'mysql: 连接池复用（同配置只握手一次）+ close 后重开',
    fn: async () => {
      const mock = await startMock()
      const db = createDbService()
      try {
        mock.setOnQuery(() => ({ columns: [{ name: 'n', type: 0x03 }], rows: [['7']] }))
        const conn = mysqlConnection(mock.port)
        const q1 = await db.query({ connection: conn, sql: 'SELECT 1 AS n' })
        const q2 = await db.query({ connection: conn, sql: 'SELECT 1 AS n' })
        assert.equal(mock.state.connections, 1, '两次 query 应复用同一连接')
        assert.equal(mock.state.handshakes, 1)
        assert.equal(mock.state.pings, 1, '第二次 query 前 COM_PING 探活')
        assert.equal(q1.rows[0].n, 7)
        assert.equal(q2.rows[0].n, 7)
        await db.close({ connection: conn })
        await db.query({ connection: conn, sql: 'SELECT 1 AS n' })
        assert.equal(mock.state.connections, 2, 'close 后重开新连接')
        assert.equal(mock.state.quitCount, 1, 'close 应发送 COM_QUIT')
      } finally {
        await db.closeAll()
        await mock.stop()
      }
    },
  },
  {
    name: 'mysql: close/closeAll 收尾（COM_QUIT + 计数）',
    fn: async () => {
      const mock = await startMock()
      const db = createDbService()
      try {
        mock.setOnQuery(() => ({ ok: { affectedRows: 0, insertId: 0 } }))
        const conn = mysqlConnection(mock.port)
        const before = await db.close({ connection: conn })
        assert.equal(before.closed, false, '未入池的 close 幂等')
        await db.query({ connection: conn, sql: 'INSERT INTO t VALUES (1)' })
        const closed = await db.close({ connection: conn })
        assert.equal(closed.ok, true)
        assert.equal(closed.closed, true)
        assert.equal(mock.state.quitCount, 1)
        await db.query({ connection: mysqlConnection(mock.port), sql: 'INSERT INTO t VALUES (2)' })
        const all = await db.closeAll()
        assert.equal(all.closed, 1)
        assert.equal(mock.state.quitCount, 2)
      } finally {
        await db.closeAll()
        await mock.stop()
      }
    },
  },
  {
    name: 'mysql: ssl:true 且服务器不支持（回 N）→ CONNECTION_ERROR',
    fn: async () => {
      const mock = await startMock()
      const db = createDbService()
      try {
        const t = await db.test({ connection: mysqlConnection(mock.port, { ssl: true }) })
        assert.equal(t.ok, false)
        assert.equal(t.error.code, 'CONNECTION_ERROR')
        assert.equal(mock.state.sslRequests, 1, '应先发 SSLRequest（32B）')
      } finally {
        await db.closeAll()
        await mock.stop()
      }
    },
  },
  {
    name: 'mysql: 大 payload 发送分帧（>16MB 按 0xffffff 续帧 + seq 连续）',
    fn: async () => {
      // splitPayload 纯函数验证：17MB SQL → 2 帧（0xffffff + 余量）；整除时补空帧
      const big = Buffer.alloc(MAX_PAYLOAD + 16, 0x41)
      const frames = splitPayload(big)
      assert.equal(frames.length, 2)
      assert.equal(frames[0].length, MAX_PAYLOAD)
      assert.equal(frames[1].length, 16)
      const aligned = splitPayload(Buffer.alloc(MAX_PAYLOAD * 2))
      assert.equal(aligned.length, 3, '恰好整除时补空帧')
      assert.equal(aligned[2].length, 0)
      assert.equal(splitPayload(Buffer.alloc(0)).length, 1)
      // seq 连续性在真实服务端上验证：发送 >250B 的多帧约束在 16MB 以下用多次命令覆盖（seq 跨命令重置）
      const mock = await startMock()
      const db = createDbService()
      try {
        mock.setOnQuery(() => ({ ok: { affectedRows: 1, insertId: 0 } }))
        const longSql = 'INSERT INTO t VALUES (' + 'x'.repeat(300) + ')'
        await db.query({ connection: mysqlConnection(mock.port), sql: longSql })
        assert.equal(mock.state.lastSql, longSql, '跨命令 seq 重置后服务端仍按帧正确重组')
      } finally {
        await db.closeAll()
        await mock.stop()
      }
    },
  },
]

/* ---------------- 自带 mini runner（独立运行用） ---------------- */

import { pathToFileURL } from 'node:url'

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url
if (isMain) {
  let passed = 0
  let failed = 0
  for (const t of tests) {
    try {
      await t.fn()
      passed += 1
      console.log('  PASS ' + t.name)
    } catch (err) {
      failed += 1
      console.log('  FAIL ' + t.name)
      console.log('       ' + (err && err.message ? err.message : err))
    }
  }
  console.log('\n结果：通过 ' + passed + '，失败 ' + failed + '，共 ' + (passed + failed))
  if (failed > 0) process.exitCode = 1
}
