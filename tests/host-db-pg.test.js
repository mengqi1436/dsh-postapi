/**
 * mysql/postgresql 驱动套件（postgresql 部分）：自建 mock PostgreSQL 服务端（读 StartupMessage/
 * 密码消息/Query/扩展协议 Parse+Bind+Describe+Execute+Sync，回 Authentication/RowDescription/
 * DataRow/CommandComplete/ReadyForQuery 或 ErrorResponse；SCRAM-SHA-256 服务端侧按 RFC 5802
 * 独立实现 proof 校验与 ServerSignature 下发）。
 * 覆盖：cleartext/md5/SCRAM 三种认证、简单查询行集、扩展协议 $1 参数（服务端断言 Bind 文本）、
 * CommandComplete→changes、ErrorResponse→DbError、int8/bool/json 类型转换、池复用与 close。
 * node tests/host-db-pg.test.js 直接执行（mini runner），node tests/run.js 汇总执行。
 */
import assert from 'node:assert/strict'
import net from 'node:net'
import crypto from 'node:crypto'
import { createDbService, DbError } from '../src/host/db.js'

/* ---------------- mock PostgreSQL 服务端（独立实现，不复用被测代码） ---------------- */

function pgMsg(type, payload) {
  const head = Buffer.alloc(5)
  head[0] = type.charCodeAt(0)
  head.writeUInt32BE(payload.length + 4, 1)
  return Buffer.concat([head, payload])
}

function beU32(n) {
  const b = Buffer.alloc(4)
  b.writeUInt32BE(n >>> 0, 0)
  return b
}

function beI16(n) {
  const b = Buffer.alloc(2)
  b.writeInt16BE(n, 0)
  return b
}

function beI32(n) {
  const b = Buffer.alloc(4)
  b.writeInt32BE(n, 0)
  return b
}

function cstr(text) {
  return Buffer.concat([Buffer.from(String(text), 'utf8'), Buffer.from([0])])
}

function hmacSha256(key, text) {
  return crypto.createHmac('sha256', key).update(text, 'utf8').digest()
}

function md5Hex(text) {
  return crypto.createHash('md5').update(text, 'utf8').digest('hex')
}

function createMockPgServer(options = {}) {
  const opts = {
    auth: 'cleartext', // 'cleartext' | 'md5' | 'scram'
    user: 'postgres',
    password: 'secret',
    database: 'testdb',
    onQuery: null, // (sql) => { columns:[{name,oid}], rows, tag } | { tag } | { err }
    ...options,
  }
  const state = {
    connections: 0,
    authOkCount: 0,
    scramProofOk: false,
    scramServerSigSent: '',
    md5SaltHex: '',
    queries: [],
    lastSql: '',
    extendedSql: '',
    lastBindParams: [],
    lastBindParamKinds: [],
    terminations: 0,
    startupParams: {},
    failReasons: [],
  }
  const server = net.createServer((sock) => {
    state.connections += 1
    let buf = Buffer.alloc(0)
    let phase = 'startup' // startup | run
    let scram = null // { clientFirstBare, serverFirst, saltB64, iterations }
    let md5Salt = null

    function sendR(code, extra) {
      sock.write(pgMsg('R', Buffer.concat([beU32(code), extra || Buffer.alloc(0)])))
    }

    function ready() {
      sock.write(pgMsg('Z', Buffer.from('I')))
    }

    function sendError(severity, code, message) {
      sock.write(pgMsg('E', Buffer.concat([Buffer.from('S' + severity + '\0'), Buffer.from('C' + code + '\0'), Buffer.from('M' + message + '\0'), Buffer.from([0])])))
    }

    function authSuccess() {
      state.authOkCount += 1
      sendR(0)
      sock.write(pgMsg('K', Buffer.concat([beU32(1234), beU32(5678)]))) // BackendKeyData
      sock.write(pgMsg('S', Buffer.concat([cstr('server_version'), cstr('15.0-mock')]))) // ParameterStatus
      ready()
    }

    function denyAuth(message) {
      state.failReasons.push(message)
      sendError('FATAL', '28P01', message)
      sock.destroy()
    }

    function rowDescription(columns) {
      const parts = [beI16(columns.length)]
      for (const c of columns) {
        parts.push(cstr(c.name), beU32(0), beI16(0), beU32(c.oid == null ? 25 : c.oid), beI16(-1), beI32(0), beI16(0))
      }
      return pgMsg('T', Buffer.concat(parts))
    }

    function dataRow(values) {
      const parts = [beI16(values.length)]
      for (const v of values) {
        if (v === null) parts.push(beI32(-1))
        else {
          const b = Buffer.from(String(v), 'utf8')
          parts.push(beI32(b.length), b)
        }
      }
      return pgMsg('D', Buffer.concat(parts))
    }

    function respondQuery(desc) {
      if (desc.err) {
        sendError(desc.err.severity || 'ERROR', desc.err.code || 'XX000', desc.err.message)
        ready()
        return
      }
      if (desc.columns) {
        sock.write(rowDescription(desc.columns))
        for (const row of desc.rows) sock.write(dataRow(row))
        sock.write(pgMsg('C', cstr(desc.tag || `SELECT ${desc.rows.length}`)))
      } else {
        sock.write(pgMsg('C', cstr(desc.tag)))
      }
      ready()
    }

    function respondExtended() {
      sock.write(pgMsg('1', Buffer.alloc(0))) // ParseComplete
      sock.write(pgMsg('2', Buffer.alloc(0))) // BindComplete
      const desc = opts.onQuery ? opts.onQuery(state.extendedSql) : { tag: 'UPDATE 1' }
      if (desc.err) {
        sendError(desc.err.severity || 'ERROR', desc.err.code || 'XX000', desc.err.message)
        ready()
        return
      }
      if (desc.columns) {
        sock.write(rowDescription(desc.columns))
        for (const row of desc.rows) sock.write(dataRow(row))
        sock.write(pgMsg('C', cstr(desc.tag || `SELECT ${desc.rows.length}`)))
      } else {
        sock.write(pgMsg('n', Buffer.alloc(0))) // NoData
        sock.write(pgMsg('C', cstr(desc.tag)))
      }
      ready()
    }

    // SCRAM server 侧（RFC 5802 独立实现）
    function scramStart(clientFirst) {
      const clientFirstBare = clientFirst.slice(clientFirst.indexOf(',,') + 2)
      const clientNonce = clientFirstBare.match(/r=([^,]*)/)[1]
      const salt = crypto.randomBytes(16)
      const saltB64 = salt.toString('base64')
      const iterations = 4096
      const serverNonce = clientNonce + crypto.randomBytes(8).toString('hex')
      const serverFirst = `r=${serverNonce},s=${saltB64},i=${iterations}`
      scram = { clientFirstBare, serverFirst, saltB64, iterations, salt }
      sendR(11, Buffer.from(serverFirst, 'utf8'))
    }

    function scramFinish(clientFinalRaw) {
      const m = clientFinalRaw.match(/^c=biws,r=([^,]*),p=([A-Za-z0-9+/=]+)$/)
      if (!m) {
        state.scramProofOk = false
        denyAuth('client-final 格式异常')
        return
      }
      const authMessage = `${scram.clientFirstBare},${scram.serverFirst},c=biws,r=${m[1]}`
      const proof = Buffer.from(m[2], 'base64')
      const salted = crypto.pbkdf2Sync(opts.password, scram.salt, scram.iterations, 32, 'sha256')
      const clientKey = hmacSha256(salted, 'Client Key')
      const storedKey = crypto.createHash('sha256').update(clientKey).digest()
      const clientSignature = hmacSha256(storedKey, authMessage)
      const recovered = Buffer.from(proof.map((b, i) => b ^ clientSignature[i]))
      const ok = crypto.createHash('sha256').update(recovered).digest().equals(storedKey)
      state.scramProofOk = ok
      if (!ok) {
        denyAuth('SCRAM proof 校验失败')
        return
      }
      const serverKey = hmacSha256(salted, 'Server Key')
      const serverSig = hmacSha256(serverKey, authMessage)
      state.scramServerSigSent = serverSig.toString('base64')
      sendR(12, Buffer.from('v=' + state.scramServerSigSent, 'utf8'))
      authSuccess()
    }

    function handlePasswordMessage(payload) {
      if (opts.auth === 'cleartext') {
        const pw = payload.toString('utf8', 0, payload.length - 1)
        if (pw === opts.password) authSuccess()
        else denyAuth('密码错误（cleartext）')
        return
      }
      if (opts.auth === 'md5') {
        const resp = payload.toString('utf8', 0, payload.length - 1)
        const expect = 'md5' + md5Hex(md5Hex(opts.password + opts.user) + state.md5SaltHex)
        if (resp === expect) authSuccess()
        else denyAuth('密码错误（md5）')
        return
      }
      if (opts.auth === 'scram') {
        // SASLInitialResponse：mechanism cstring + int32 len + client-first；SASLResponse：final raw
        if (!scram) {
          let pos = 0
          let end = payload.indexOf(0, pos)
          const mechanism = payload.toString('utf8', pos, end)
          if (mechanism !== 'SCRAM-SHA-256') {
            denyAuth('机制不匹配 ' + mechanism)
            return
          }
          pos = end + 1
          const len = payload.readInt32BE(pos)
          pos += 4
          scramStart(payload.toString('utf8', pos, pos + len))
        } else {
          scramFinish(payload.toString('utf8'))
        }
      }
    }

    function parseBindParams(payload) {
      // portal cstring + statement cstring + i16 fmtCount + codes + i16 paramCount + params + i16 resultFmts
      let pos = 0
      let end = payload.indexOf(0, pos)
      pos = end + 1 // portal ''
      end = payload.indexOf(0, pos)
      pos = end + 1 // statement ''
      const fmtCount = payload.readInt16BE(pos)
      pos += 2 + fmtCount * 2
      const paramCount = payload.readInt16BE(pos)
      pos += 2
      const params = []
      const kinds = []
      for (let i = 0; i < paramCount; i++) {
        const len = payload.readInt32BE(pos)
        pos += 4
        if (len === -1) {
          params.push(null)
          kinds.push('null(-1)')
        } else {
          params.push(payload.toString('utf8', pos, pos + len))
          kinds.push('text:' + len + 'B')
          pos += len
        }
      }
      return { params, kinds }
    }

    function handleMessage(type, payload) {
      if (type === 'p') {
        handlePasswordMessage(payload)
        return
      }
      if (type === 'Q') {
        const sql = payload.toString('utf8', 0, payload.length - 1)
        state.lastSql = sql
        state.queries.push(sql)
        const desc = opts.onQuery ? opts.onQuery(sql) : { columns: [{ name: '?column?', oid: 23 }], rows: [['1']] }
        respondQuery(desc)
        return
      }
      if (type === 'P') {
        let end = payload.indexOf(0, 0)
        pos2 = end + 1 // statement 名
        end = payload.indexOf(0, pos2)
        state.extendedSql = payload.toString('utf8', pos2, end)
        return
      }
      if (type === 'B') {
        const parsed = parseBindParams(payload)
        state.lastBindParams = parsed.params
        state.lastBindParamKinds = parsed.kinds
        return
      }
      if (type === 'D') {
        return // Describe(portal)：无独立响应，RowDescription 在 Sync 响应序列中回
      }
      if (type === 'E') {
        return // Execute(portal)：无独立响应，结果在 Sync 响应序列中回
      }
      if (type === 'S') {
        respondExtended()
        return
      }
      if (type === 'X') {
        state.terminations += 1
        sock.end()
        return
      }
      sendError('FATAL', '08P01', '未知消息类型 ' + type)
    }

    let pos2 = 0
    sock.on('data', (d) => {
      buf = Buffer.concat([buf, d])
      pump()
    })
    function pump() {
      for (;;) {
        if (phase === 'startup') {
          if (buf.length < 4) return
          const len = buf.readUInt32BE(0)
          if (buf.length < len) return
          const payload = buf.subarray(4, len)
          buf = buf.subarray(len)
          const code = payload.readUInt32BE(0)
          if (code === 80877103) {
            sock.write('N') // 拒绝 SSL
            continue
          }
          // StartupMessage 参数解析（cstring 对）
          let pos = 4
          while (pos < payload.length && payload[pos] !== 0) {
            let end = payload.indexOf(0, pos)
            const key = payload.toString('utf8', pos, end)
            pos = end + 1
            end = payload.indexOf(0, pos)
            const value = payload.toString('utf8', pos, end)
            pos = end + 1
            state.startupParams[key] = value
          }
          if (state.startupParams.user !== opts.user) {
            denyAuth(`role "${state.startupParams.user}" does not exist`)
            return
          }
          if (opts.auth === 'md5') {
            md5Salt = crypto.randomBytes(4)
            state.md5SaltHex = md5Salt.toString('hex')
            sendR(5, md5Salt)
          } else if (opts.auth === 'scram') {
            sendR(10, Buffer.concat([cstr('SCRAM-SHA-256'), Buffer.from([0])]))
          } else {
            sendR(3) // cleartext
          }
          phase = 'run'
          continue
        }
        if (buf.length < 5) return
        const len = buf.readUInt32BE(1)
        if (buf.length < 1 + len) return
        const type = String.fromCharCode(buf[0])
        const payload = buf.subarray(5, 1 + len)
        buf = buf.subarray(1 + len)
        try {
          handleMessage(type, payload)
        } catch (err) {
          state.failReasons.push('server error: ' + err.message)
          sock.destroy()
        }
      }
    }
  })
  return { server, state, opts }
}

async function startMock(options = {}) {
  const mock = createMockPgServer(options)
  await new Promise((resolve) => mock.server.listen(0, '127.0.0.1', resolve))
  const port = mock.server.address().port
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

function pgConnection(port, extra = {}) {
  return { type: 'postgresql', host: '127.0.0.1', port, user: 'postgres', password: 'secret', database: 'testdb', ...extra }
}

export const tests = [
  {
    name: 'postgresql: cleartext 认证 + test 连接成功（StartupMessage user/database 传递）',
    fn: async () => {
      const mock = await startMock({ auth: 'cleartext' })
      const db = createDbService()
      try {
        const t = await db.test({ connection: pgConnection(mock.port) })
        assert.equal(t.ok, true, JSON.stringify(t))
        assert.equal(t.driver, 'postgresql')
        assert.equal(mock.state.startupParams.user, 'postgres')
        assert.equal(mock.state.startupParams.database, 'testdb')
        assert.equal(mock.state.authOkCount, 1)
      } finally {
        await db.closeAll()
        await mock.stop()
      }
    },
  },
  {
    name: 'postgresql: md5 认证（服务端校验 md5hex(md5hex(pw+user)+salt)）+ 错误口令被拒',
    fn: async () => {
      const mock = await startMock({ auth: 'md5', password: 'correct-pw' })
      const db = createDbService()
      try {
        const ok = await db.test({ connection: pgConnection(mock.port, { password: 'correct-pw' }) })
        assert.equal(ok.ok, true, JSON.stringify(ok))
        const bad = await db.test({ connection: pgConnection(mock.port, { password: 'nope' }) })
        assert.equal(bad.ok, false)
        assert.equal(bad.error.code, 'SQL_ERROR', '认证失败应以 SQL_ERROR 呈现')
        assert.match(bad.error.message, /28P01/)
        assert.equal(mock.state.failReasons.length, 1)
      } finally {
        await db.closeAll()
        await mock.stop()
      }
    },
  },
  {
    name: 'postgresql: SCRAM-SHA-256 认证（proof 校验 + ServerSignature 双向验证）',
    fn: async () => {
      const mock = await startMock({ auth: 'scram' })
      const db = createDbService()
      try {
        const t = await db.test({ connection: pgConnection(mock.port) })
        assert.equal(t.ok, true, JSON.stringify(t))
        assert.equal(mock.state.scramProofOk, true, '客户端 proof 应通过服务端校验')
        assert.notEqual(mock.state.scramServerSigSent, '', '服务端应下发 ServerSignature（客户端侧已校验否则连接失败）')
        assert.equal(mock.state.authOkCount, 1)
      } finally {
        await db.closeAll()
        await mock.stop()
      }
    },
  },
  {
    name: 'postgresql: 简单查询行集（int8/int4/bool/json 转换 + NULL + 列名）',
    fn: async () => {
      const mock = await startMock({ auth: 'cleartext' })
      const db = createDbService()
      try {
        mock.setOnQuery((sql) => {
          if (!sql.includes('metrics')) return null
          return {
            columns: [
              { name: 'id', oid: 20 }, // int8
              { name: 'count', oid: 23 }, // int4
              { name: 'flag', oid: 16 }, // bool
              { name: 'payload', oid: 114 }, // json
              { name: 'note', oid: 25 },
            ],
            rows: [
              ['42', '7', 't', '{"a":1}', 'ok'],
              ['9223372036854775807', null, 'f', '[1,2,3]', null],
            ],
            tag: 'SELECT 2',
          }
        })
        const q = await db.query({ connection: pgConnection(mock.port), sql: 'SELECT id, count, flag, payload, note FROM metrics' })
        assert.equal(q.driver, 'postgresql')
        assert.deepEqual(q.columns, ['id', 'count', 'flag', 'payload', 'note'])
        assert.equal(q.rowCount, 2)
        assert.equal(q.truncated, false)
        assert.deepEqual(q.rows[0], { id: 42, count: 7, flag: true, payload: { a: 1 }, note: 'ok' })
        assert.equal(q.rows[1].id, '9223372036854775807', 'int8 超安全整数保留字符串')
        assert.equal(q.rows[1].count, null)
        assert.equal(q.rows[1].flag, false)
        assert.deepEqual(q.rows[1].payload, [1, 2, 3])
        assert.equal(q.rows[1].note, null)
      } finally {
        await db.closeAll()
        await mock.stop()
      }
    },
  },
  {
    name: 'postgresql: 扩展协议 $1/$2 参数（服务端断言 Bind 参数文本与 null=-1 长度）',
    fn: async () => {
      const mock = await startMock({ auth: 'cleartext' })
      const db = createDbService()
      try {
        mock.setOnQuery(() => ({ columns: [{ name: 'id', oid: 23 }], rows: [['9']], tag: 'SELECT 1' }))
        const q = await db.query({
          connection: pgConnection(mock.port),
          sql: 'SELECT id FROM t WHERE name = $1 AND score > $2 AND deleted_at IS $3',
          params: ['O\'Brien', 3.5, null],
        })
        assert.equal(q.rows[0].id, 9)
        assert.equal(mock.state.extendedSql, 'SELECT id FROM t WHERE name = $1 AND score > $2 AND deleted_at IS $3', 'Parse 应携带原 SQL')
        assert.deepEqual(mock.state.lastBindParams, ["O'Brien", '3.5', null], 'Bind 参数应为文本：字符串原样、数字字符串化、null → -1 长度')
        assert.deepEqual(mock.state.lastBindParamKinds, ['text:7B', 'text:3B', 'null(-1)'])
        // bigint 参数 → 字符串化
        await db.query({ connection: pgConnection(mock.port), sql: 'SELECT $1', params: [9007199254740993n] })
        assert.deepEqual(mock.state.lastBindParams, ['9007199254740993'])
        // Date 参数 → ISO
        await db.query({ connection: pgConnection(mock.port), sql: 'SELECT $1', params: [new Date('2024-01-02T03:04:05.678Z')] })
        assert.deepEqual(mock.state.lastBindParams, ['2024-01-02T03:04:05.678Z'])
      } finally {
        await db.closeAll()
        await mock.stop()
      }
    },
  },
  {
    name: 'postgresql: CommandComplete → changes（INSERT oid n / UPDATE n / DELETE n）',
    fn: async () => {
      const mock = await startMock({ auth: 'cleartext' })
      const db = createDbService()
      try {
        mock.setOnQuery(() => ({ tag: 'INSERT 0 1' }))
        const w = await db.query({ connection: pgConnection(mock.port), sql: 'INSERT INTO t (a) VALUES (1)' })
        assert.equal(w.driver, 'postgresql')
        assert.equal(w.changes, 1, 'INSERT 0 1 → changes 1')
        assert.equal(w.lastInsertRowid, null, 'postgresql 无 lastInsertRowid')
        mock.setOnQuery(() => ({ tag: 'UPDATE 5' }))
        const u = await db.query({ connection: pgConnection(mock.port), sql: 'UPDATE t SET a = 2' })
        assert.equal(u.changes, 5)
        mock.setOnQuery(() => ({ tag: 'DELETE 3' }))
        const d = await db.query({ connection: pgConnection(mock.port), sql: 'DELETE FROM t WHERE a = 2' })
        assert.equal(d.changes, 3)
        mock.setOnQuery(() => ({ tag: 'CREATE TABLE' }))
        const c = await db.query({ connection: pgConnection(mock.port), sql: 'CREATE TABLE t2 (a int)' })
        assert.equal(c.changes, 0, '无行数 tag → changes 0')
        // 参数化写语句走扩展协议，CommandComplete 行数同样解析
        mock.setOnQuery(() => ({ tag: 'UPDATE 3' }))
        const u2 = await db.query({ connection: pgConnection(mock.port), sql: 'UPDATE t SET a = $1 WHERE id = $2', params: [2, 7] })
        assert.equal(u2.changes, 3)
        assert.deepEqual(mock.state.lastBindParams, ['2', '7'])
      } finally {
        await db.closeAll()
        await mock.stop()
      }
    },
  },
  {
    name: 'postgresql: ErrorResponse → DbError SQL_ERROR（severity/message/SQLSTATE）',
    fn: async () => {
      const mock = await startMock({ auth: 'cleartext' })
      const db = createDbService()
      try {
        mock.setOnQuery(() => ({ err: { severity: 'ERROR', code: '42P01', message: 'relation "missing" does not exist' } }))
        await assert.rejects(
          () => db.query({ connection: pgConnection(mock.port), sql: 'SELECT * FROM missing' }),
          (err) => err instanceof DbError && err.code === 'SQL_ERROR' && err.status === 400
            && String(err.message).includes('ERROR') && String(err.message).includes('does not exist')
            && String(err.message).includes('42P01'),
        )
        // 扩展协议路径的 ErrorResponse 同样映射
        await assert.rejects(
          () => db.query({ connection: pgConnection(mock.port), sql: 'SELECT $1', params: [1] }),
          (err) => err.code === 'SQL_ERROR' && err.sqlState === '42P01',
        )
      } finally {
        await db.closeAll()
        await mock.stop()
      }
    },
  },
  {
    name: 'postgresql: 连接池复用（同配置只握手一次）+ close 发 Terminate',
    fn: async () => {
      const mock = await startMock({ auth: 'cleartext' })
      const db = createDbService()
      try {
        mock.setOnQuery(() => ({ columns: [{ name: 'n', oid: 23 }], rows: [['7']] }))
        const conn = pgConnection(mock.port)
        const q1 = await db.query({ connection: conn, sql: 'SELECT 1 AS n' })
        const q2 = await db.query({ connection: conn, sql: 'SELECT 1 AS n' })
        assert.equal(mock.state.connections, 1, '两次 query 复用同一连接（第二次仅 SELECT 1 探活）')
        assert.equal(mock.state.authOkCount, 1)
        assert.equal(q1.rows[0].n, 7)
        assert.equal(q2.rows[0].n, 7)
        await db.close({ connection: conn })
        assert.equal(mock.state.terminations, 1, 'close 应发 Terminate(X)')
        const closed = await db.close({ connection: conn })
        assert.equal(closed.closed, false, '重复 close 幂等')
      } finally {
        await db.closeAll()
        await mock.stop()
      }
    },
  },
  {
    name: 'postgresql: closeAll 收尾（计数 + 每连接 Terminate）',
    fn: async () => {
      const mock = await startMock({ auth: 'cleartext' })
      const db = createDbService()
      try {
        mock.setOnQuery(() => ({ columns: [{ name: 'n', oid: 23 }], rows: [['1']] }))
        await db.query({ connection: pgConnection(mock.port), sql: 'SELECT 1' })
        await db.query({ connection: pgConnection(mock.port, { database: 'otherdb' }), sql: 'SELECT 1' })
        assert.equal(mock.state.connections, 2)
        const all = await db.closeAll()
        assert.equal(all.closed, 2)
        assert.equal(mock.state.terminations, 2)
      } finally {
        await db.closeAll()
        await mock.stop()
      }
    },
  },
  {
    name: 'postgresql: 行数截断（MAX_ROWS 上限 + truncated 标记）',
    fn: async () => {
      const mock = await startMock({ auth: 'cleartext' })
      const db = createDbService()
      try {
        const total = 1100
        mock.setOnQuery(() => ({
          columns: [{ name: 'x', oid: 23 }],
          rows: Array.from({ length: total }, (_, i) => [String(i)]),
          tag: 'SELECT ' + total,
        }))
        const q = await db.query({ connection: pgConnection(mock.port), sql: 'SELECT x FROM big' })
        assert.equal(q.rowCount, total)
        assert.equal(q.rows.length, 1000)
        assert.equal(q.truncated, true)
      } finally {
        await db.closeAll()
        await mock.stop()
      }
    },
  },
  {
    name: 'postgresql: UNSUPPORTED_DRIVER 保留给未知 type + 缺 database 校验',
    fn: async () => {
      const db = createDbService()
      await assert.rejects(
        () => db.query({ connection: { type: 'oracle', host: 'x' }, sql: 'SELECT 1' }),
        (err) => err instanceof DbError && err.code === 'UNSUPPORTED_DRIVER' && err.status === 400,
      )
      const t = await db.test({ connection: { type: 'oracle', host: 'x' } })
      assert.equal(t.ok, false)
      assert.equal(t.error.code, 'UNSUPPORTED_DRIVER')
      await assert.rejects(
        () => db.query({ connection: { type: 'postgresql', host: '127.0.0.1', user: 'u' }, sql: 'SELECT 1' }),
        (err) => err.code === 'INVALID_ARGUMENT' && /database/.test(err.message),
      )
      await assert.rejects(
        () => db.query({ connection: { type: 'postgresql', host: '127.0.0.1', database: 'd' }, sql: 'SELECT 1' }),
        (err) => err.code === 'INVALID_ARGUMENT' && /user/.test(err.message),
      )
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
