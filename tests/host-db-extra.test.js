/**
 * 扩展驱动套件（mssql/oracle/mongodb/redis glue）：官方包薄 glue 层的纯函数映射 + DI 注入 fake 驱动
 * 的服务级分发。四个 glue 文件均在模块顶部静态 import 官方包（mssql/oracledb/mongodb/redis），
 * 但本套件不连任何真实服务：
 * - 纯函数直测：? → @p0/$1/:1 改写（引号/注释/美元引用保护、不安全文本抛 INVALID_ARGUMENT）、
 *   mysql 方言占位符计数、mssql rowsAffected 求和 → changes、oracle rowsAffected → changes、
 *   行集映射（normalizeCell/base64/截断）、mongodb 命令文档解析与 JSON 安全化、redis 命令行切参
 *   与返回值归一。
 * - DI fake（实现 db.js 驱动内部接口 { key, open, ping, select, exec/command, close, formatError? }）：
 *   注册表分发与 UNSUPPORTED_DRIVER、错误归一（open→CONNECTION_ERROR / 执行→SQL_ERROR）、
 *   指纹复用（同配置 open 一次 + ping 探活）、close/closeAll。
 * node tests/host-db-extra.test.js 直接执行（mini runner），node tests/run.js 汇总执行。
 */
import assert from 'node:assert/strict'
import { createDbService, DbError, SUPPORTED_DRIVERS } from '../src/host/db.js'
import { countPlaceholders, rewritePlaceholders, splitRedisCommandLine, normalizeRedisValue, parseMongoCommand, jsonSafeMongoOutput } from '../src/host/db-drivers/sqltext.js'
import { mapMssqlSelect, mapMssqlExec } from '../src/host/db-drivers/mssql.js'
import { mapOracleSelect, mapOracleExec } from '../src/host/db-drivers/oracle.js'

/** 归一函数（与 db.js 内部实现同语义，直取其导出结构无法复用故就地复刻断言）。 */
function normalizeCell(value) {
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Uint8Array) return Buffer.from(value).toString('base64')
  return value
}
const MAX_ROWS = 1000

/** fake SQL 型驱动（select/exec），统计 open/ping/close/调用参数。 */
function fakeSqlDriver(stats, impl = {}) {
  return {
    key: 'fake-sql',
    async open(config) {
      stats.opens.push(config)
      return { id: stats.opens.length }
    },
    async ping(handle) {
      stats.pings += 1
      if (impl.failPingOnce && stats.pings === 1) throw new Error('stale handle')
    },
    async select(handle, sql, params) {
      stats.selects.push([sql, params])
      return impl.select || { columns: ['a'], rows: [{ a: 1 }], rowCount: 1, truncated: false }
    },
    async exec(handle, sql, params) {
      stats.execs.push([sql, params])
      return { changes: impl.changes != null ? impl.changes : 3, lastInsertRowid: impl.lastInsertRowid != null ? impl.lastInsertRowid : null }
    },
    async close() {
      stats.closes += 1
    },
    ...(impl.formatError ? { formatError: impl.formatError } : {}),
  }
}

/** fake 命令型驱动（command），输出由 handler 决定。 */
function fakeCommandDriver(stats, handler) {
  return {
    key: 'fake-cmd',
    async open(config) {
      stats.opens.push(config)
      return { id: stats.opens.length }
    },
    async ping(handle) {
      stats.pings += 1
    },
    async command(handle, statement, params) {
      stats.commands.push([statement, params])
      return handler ? handler(statement, params) : { pong: 1 }
    },
    async close() {
      stats.closes += 1
    },
  }
}

/** DI fake 工厂包装：让每个 createDbService 都拿到统计同一 stats 的驱动实例。 */
function factoryOf(makeDriver) {
  return (ctx) => makeDriver(ctx)
}

export const tests = [
  {
    name: 'extra: SUPPORTED_DRIVERS 七驱动 + 注册表分发（fake mssql/oracle）+ 命令型 output 包装 + UNSUPPORTED',
    fn: async () => {
      assert.deepEqual(
        SUPPORTED_DRIVERS,
        ['sqlite', 'mysql', 'postgresql', 'mssql', 'oracle', 'mongodb', 'redis'],
      )
      const stats = { opens: [], pings: 0, closes: 0, selects: [], execs: [], commands: [] }
      const db = createDbService({
        drivers: {
          mssql: factoryOf(() => fakeSqlDriver(stats)),
          oracle: factoryOf(() => fakeSqlDriver(stats, { changes: 5 })),
          // 命令型 glue 的 JSON 安全化在真实 glue 内部，fake 复用同一导出模拟
          mongodb: factoryOf(() => fakeCommandDriver(stats, (statement) => jsonSafeMongoOutput({ ok: 1n, blob: Buffer.from('hi'), echo: statement }))),
        },
      })
      try {
        // fake mssql：SELECT 行集 + ? → @p 改写发生在 glue 内部（fake 直接收改写后的语句）
        const q = await db.query({ connection: { type: 'mssql', host: 'x', user: 'u' }, sql: 'SELECT a FROM t', params: [] })
        assert.equal(q.driver, 'mssql')
        assert.deepEqual(q.columns, ['a'])
        assert.deepEqual(q.rows, [{ a: 1 }])
        assert.equal(q.rowCount, 1)
        assert.equal(q.truncated, false)
        assert.equal(stats.opens.length, 1)
        // fake oracle：写语句 changes
        const w = await db.query({ connection: { type: 'oracle', host: 'x', user: 'u', password: 'p', database: 'svc' }, sql: 'UPDATE t SET a = 1' })
        assert.equal(w.driver, 'oracle')
        assert.equal(w.changes, 5)
        assert.equal(w.lastInsertRowid, null)
        // fake mongodb：命令型驱动 → { driver, output }；命令文本可含分号（多语句约束只给 SQL 型驱动）
        const r = await db.query({ connection: { type: 'mongodb', host: 'x', database: 'db' }, sql: '{"ping":1;}' })
        assert.equal(r.driver, 'mongodb')
        assert.deepEqual(r.output, { ok: '1', blob: Buffer.from('hi').toString('base64'), echo: '{"ping":1;}' })
        assert.equal(stats.commands.length, 1)
        assert.equal(stats.commands[0][0], '{"ping":1;}')
        // 未注入 fake 的驱动仍走默认 glue 参数校验（postgresql 缺 database → INVALID_ARGUMENT，不触网）
        await assert.rejects(
          () => db.query({ connection: { type: 'postgresql', host: 'x', user: 'u' }, sql: 'SELECT 1' }),
          (err) => err instanceof DbError && err.code === 'INVALID_ARGUMENT' && /database/.test(err.message),
        )
        // 未知 type → UNSUPPORTED_DRIVER
        await assert.rejects(
          () => db.query({ connection: { type: 'db2', host: 'x' }, sql: 'SELECT 1' }),
          (err) => err instanceof DbError && err.code === 'UNSUPPORTED_DRIVER' && err.status === 400,
        )
        const t = await db.test({ connection: { type: 'db2', host: 'x' } })
        assert.equal(t.ok, false)
        assert.equal(t.error.code, 'UNSUPPORTED_DRIVER')
      } finally {
        await db.closeAll()
      }
    },
  },
  {
    name: 'extra: ? → $1/@p0/:1 顺序改写（引号/注释/美元引用保护，不安全文本抛 INVALID_ARGUMENT）',
    fn: async () => {
      // postgresql：$1..$n
      const pg1 = rewritePlaceholders("SELECT * FROM t WHERE a = ? AND b = 'x?y' AND c = ?", '$')
      assert.equal(pg1.sql, "SELECT * FROM t WHERE a = $1 AND b = 'x?y' AND c = $2")
      assert.equal(pg1.count, 2)
      // mssql：@p0..@pn
      const ms = rewritePlaceholders('INSERT INTO t (a,b) VALUES (?, ?)', '@p')
      assert.equal(ms.sql, 'INSERT INTO t (a,b) VALUES (@p0, @p1)')
      assert.equal(ms.count, 2)
      // oracle：:1..:n
      const ora = rewritePlaceholders('UPDATE t SET a = ? WHERE b = ?', ':')
      assert.equal(ora.sql, 'UPDATE t SET a = :1 WHERE b = :2')
      assert.equal(ora.count, 2)
      // 注释内的 ? 不改写；双引号标识符内的 ? 不改写
      const cm = rewritePlaceholders('SELECT ? /* ? */ -- ? FROM "we?rd"', '$')
      assert.equal(cm.sql, 'SELECT $1 /* ? */ -- ? FROM "we?rd"')
      assert.equal(cm.count, 1)
      // pg 美元引用 $$..$$ 内的 ? 不改写
      const dq = rewritePlaceholders('SELECT $$a?b$$, ?', '$')
      assert.equal(dq.sql, 'SELECT $$a?b$$, $1')
      assert.equal(dq.count, 1)
      // $tag$ 带名美元引用同样保护
      const tag = rewritePlaceholders('SELECT $fn$ ? inner ? $fn$, ?', '$')
      assert.equal(tag.sql, 'SELECT $fn$ ? inner ? $fn$, $1')
      // 已含 $n 的 SQL（pg 用例）原样透传：无 ? 时 count 0 且文本不变
      const keep = rewritePlaceholders('SELECT id FROM t WHERE name = $1 AND score > $2', '$')
      assert.equal(keep.sql, 'SELECT id FROM t WHERE name = $1 AND score > $2')
      assert.equal(keep.count, 0)
      // 不安全改写：未闭合引号
      assert.throws(() => rewritePlaceholders("SELECT 'abc", '$'), (err) => err.code === 'INVALID_ARGUMENT')
      // 不安全改写：pg 方言下反斜杠不转义 → 引号提前闭合 → 尾部引号悬空（歧义）
      assert.throws(() => rewritePlaceholders("SELECT 'a\\'b?'", '$'), (err) => err.code === 'INVALID_ARGUMENT')
      // 未闭合块注释按「注释到结尾」处理（与 mysql2 sql-escaper 一致）：? 正常改写，不算不安全
      const openComment = rewritePlaceholders('SELECT ? /* 未闭合注释', '@p')
      assert.equal(openComment.sql, 'SELECT @p0 /* 未闭合注释')
      assert.equal(openComment.count, 1)
    },
  },
  {
    name: 'extra: mysql 方言占位符计数（?? = escapeId、≥3 连续跳过、反斜杠转义字符串）',
    fn: async () => {
      assert.equal(countPlaceholders("SELECT '?' , ?, /* ? */ ?"), 2)
      assert.equal(countPlaceholders('SELECT ?? FROM t'), 1, '?? 是 escapeId 占位，消耗 1 个参数（mysql2 语义）')
      assert.equal(countPlaceholders('SELECT ??? FROM t'), 0, '连续 ≥3 个 ? 被 mysql2 整段跳过')
      assert.equal(countPlaceholders('SELECT * FROM t WHERE a = ?'), 1)
      assert.equal(countPlaceholders("SELECT 'a\\'b?'"), 0, 'mysql 方言下反斜杠转义引号，整段是字符串')
      assert.equal(countPlaceholders("SELECT ? # 这里 ? '都是注释"), 1, '# 行注释内的 ? 不计数')
      assert.equal(countPlaceholders("SELECT ? -- 尾随注释 ?"), 1, '-- 行注释内的 ? 不计数')
      assert.throws(() => countPlaceholders("SELECT 'abc"), (err) => err.code === 'INVALID_ARGUMENT')
    },
  },
  {
    name: 'extra: mssql rowsAffected 求和 → changes + 行集映射（base64/截断）；oracle rowsAffected → changes',
    fn: async () => {
      // mssql：rowsAffected 多段求和
      assert.deepEqual(mapMssqlExec({ rowsAffected: [2, 0, 3] }), { changes: 5, lastInsertRowid: null })
      assert.deepEqual(mapMssqlExec({}), { changes: 0, lastInsertRowid: null })
      const sel = mapMssqlSelect({ recordsets: [[{ a: 1, b: Buffer.from('hi') }, { a: 2 }]] }, normalizeCell, MAX_ROWS)
      assert.deepEqual(sel.columns, ['a', 'b'])
      assert.equal(sel.rows[0].a, 1)
      assert.equal(sel.rows[0].b, Buffer.from('hi').toString('base64'))
      assert.equal(sel.rowCount, 2)
      assert.equal(sel.truncated, false)
      // 空行集 → columns []
      const empty = mapMssqlSelect({ recordsets: [[]], rowsAffected: [0] }, normalizeCell, MAX_ROWS)
      assert.deepEqual(empty.columns, [])
      assert.deepEqual(empty.rows, [])
      // 截断：1001 行 → rows 1000、rowCount 1001、truncated true
      const big = { recordsets: [Array.from({ length: MAX_ROWS + 1 }, (_, i) => ({ x: i }))] }
      const cut = mapMssqlSelect(big, normalizeCell, MAX_ROWS)
      assert.equal(cut.rows.length, MAX_ROWS)
      assert.equal(cut.rowCount, MAX_ROWS + 1)
      assert.equal(cut.truncated, true)
      // oracle：rowsAffected → changes；rows 对象数组 → 行集
      assert.deepEqual(mapOracleExec({ rowsAffected: 7 }), { changes: 7, lastInsertRowid: null })
      assert.deepEqual(mapOracleExec({}), { changes: 0, lastInsertRowid: null })
      const osel = mapOracleSelect({ rows: [{ ID: 1, NOTE: null }] }, normalizeCell, MAX_ROWS)
      assert.deepEqual(osel.columns, ['ID', 'NOTE'])
      assert.deepEqual(osel.rows, [{ ID: 1, NOTE: null }])
      assert.equal(osel.rowCount, 1)
    },
  },
  {
    name: 'extra: mongodb 命令文档 JSON 校验（INVALID_ARGUMENT 提示）+ bigint/Buffer JSON 安全化',
    fn: async () => {
      const hint = /MongoDB 需要命令文档 JSON/
      assert.throws(() => parseMongoCommand('SELECT 1'), (err) => err.code === 'INVALID_ARGUMENT' && hint.test(err.message))
      assert.throws(() => parseMongoCommand('{invalid'), (err) => err.code === 'INVALID_ARGUMENT')
      assert.throws(() => parseMongoCommand('[1,2]'), (err) => err.code === 'INVALID_ARGUMENT' && hint.test(err.message))
      assert.throws(() => parseMongoCommand(''), (err) => err.code === 'INVALID_ARGUMENT')
      assert.deepEqual(parseMongoCommand('{"find":"users","filter":{},"limit":10}'), { find: 'users', filter: {}, limit: 10 })
      // JSON 安全化：bigint → 字符串、Buffer → base64、Date → ISO、嵌套递归、undefined → null
      const safe = jsonSafeMongoOutput({ ok: 1n, n: 9007199254740993n, blob: Buffer.from('hi'), nested: { big: 42n, at: new Date(0) } })
      assert.equal(safe.ok, '1')
      assert.equal(safe.n, '9007199254740993')
      assert.equal(safe.blob, Buffer.from('hi').toString('base64'))
      assert.equal(safe.nested.big, '42')
      assert.equal(safe.nested.at, '1970-01-01T00:00:00.000Z')
      assert.equal(jsonSafeMongoOutput(undefined), null)
      // 服务级：output 包装走 jsonSafeMongoOutput（fake 命令驱动返回 bigint/Buffer）
      const stats = { opens: [], pings: 0, closes: 0, commands: [] }
      const db = createDbService({
        drivers: { redis: factoryOf(() => fakeCommandDriver(stats, () => jsonSafeMongoOutput({ n: 1n }))) },
      })
      try {
        const r = await db.query({ connection: { type: 'redis', host: 'x' }, sql: 'GET key' })
        assert.equal(r.driver, 'redis')
        assert.deepEqual(r.output, { n: '1' })
      } finally {
        await db.closeAll()
      }
    },
  },
  {
    name: 'extra: redis 命令行切参（引号含空格/转义）+ 返回值归一（Buffer/数组/数值/null）',
    fn: async () => {
      assert.deepEqual(splitRedisCommandLine('GET key'), ['GET', 'key'])
      assert.deepEqual(splitRedisCommandLine('SET key "hello world"'), ['SET', 'key', 'hello world'])
      assert.deepEqual(splitRedisCommandLine("SET k 'a b c'"), ['SET', 'k', 'a b c'])
      assert.deepEqual(splitRedisCommandLine('  SET   k   v  '), ['SET', 'k', 'v'])
      assert.deepEqual(splitRedisCommandLine('SET k "say \\"hi\\""'), ['SET', 'k', 'say "hi"'])
      assert.throws(() => splitRedisCommandLine('GET "abc'), (err) => err.code === 'INVALID_ARGUMENT')
      assert.throws(() => splitRedisCommandLine("GET 'abc"), (err) => err.code === 'INVALID_ARGUMENT')
      assert.throws(() => splitRedisCommandLine('   '), (err) => err.code === 'INVALID_ARGUMENT')
      // 返回值归一
      assert.equal(normalizeRedisValue(Buffer.from('v1')), 'v1')
      assert.equal(normalizeRedisValue('OK'), 'OK')
      assert.equal(normalizeRedisValue(42), 42)
      assert.equal(normalizeRedisValue(null), null)
      assert.equal(normalizeRedisValue(9007199254740993n), '9007199254740993')
      assert.deepEqual(normalizeRedisValue(['a', Buffer.from('b'), 3]), ['a', 'b', 3])
      assert.deepEqual(normalizeRedisValue(new Set(['x', 'y'])), ['x', 'y'])
      assert.deepEqual(normalizeRedisValue(new Map([['k', Buffer.from('v')]])), { k: 'v' })
    },
  },
  {
    name: 'extra: 错误归一（open/ping 失败 → CONNECTION_ERROR，执行错 → SQL_ERROR 带 errno）',
    fn: async () => {
      // open 失败（认证失败模拟）→ test 返回 CONNECTION_ERROR，formatError 信息进入 message
      const db1 = createDbService({
        drivers: {
          mssql: factoryOf(() => ({
            key: 'f',
            async open() {
              throw Object.assign(new Error('login failed for user'), { code: 'ELOGIN' })
            },
            async ping() {},
            async select() {},
            async exec() {},
            async close() {},
            formatError(err) {
              return { message: 'ELOGIN: ' + err.message, errno: 18456 }
            },
          })),
        },
      })
      const t = await db1.test({ connection: { type: 'mssql', host: 'x' } })
      assert.equal(t.ok, false)
      assert.equal(t.error.code, 'CONNECTION_ERROR')
      assert.match(t.error.message, /login failed/)
      // 执行错 → SQL_ERROR，附带 errno（formatError 提取 errorNum）且保留原始 message
      const db3 = createDbService({
        drivers: {
          oracle: factoryOf(() => ({
            key: 'f',
            async open() { return {} },
            async ping() {},
            async select() {
              throw Object.assign(new Error('ORA-00942: table or view does not exist'), { errorNum: 942 })
            },
            async exec() {},
            async close() {},
            formatError(err) {
              return { message: err.message, errno: err.errorNum }
            },
          })),
        },
      })
      // 无 formatError 的驱动 → 原始 message 直接作为 SQL_ERROR message
      const db4 = createDbService({
        drivers: {
          mssql: factoryOf(() => ({
            key: 'f',
            async open() { return {} },
            async ping() {},
            async select() {
              throw new Error('boom from driver')
            },
            async exec() {},
            async close() {},
          })),
        },
      })
      try {
        await assert.rejects(
          () => db3.query({ connection: { type: 'oracle', host: 'x', user: 'u', password: 'p', database: 's' }, sql: 'SELECT 1 FROM DUAL' }),
          (err) => err instanceof DbError && err.code === 'SQL_ERROR' && err.status === 400
            && err.errno === 942 && /ORA-00942/.test(err.message),
        )
        await assert.rejects(
          () => db4.query({ connection: { type: 'mssql', host: 'x' }, sql: 'SELECT 1' }),
          (err) => err instanceof DbError && err.code === 'SQL_ERROR' && String(err.message).includes('boom from driver'),
        )
        // DbError 实例直接透传不改码（fake 抛真 DbError → INVALID_ARGUMENT 保留）
        const db5 = createDbService({
          drivers: {
            mssql: factoryOf(() => ({
              key: 'f',
              async open() { return {} },
              async ping() {},
              async select() {
                throw new DbError('INVALID_ARGUMENT', 'bad param')
              },
              async exec() {},
              async close() {},
            })),
          },
        })
        await assert.rejects(
          () => db5.query({ connection: { type: 'mssql', host: 'x' }, sql: 'SELECT 1' }),
          (err) => err instanceof DbError && err.code === 'INVALID_ARGUMENT' && err.status === 400,
        )
        await db3.closeAll()
        await db4.closeAll()
        await db5.closeAll()
      } finally {
        await db1.closeAll()
        await db3.closeAll()
        await db4.closeAll()
      }
    },
  },
  {
    name: 'extra: ping 失败丢弃重开（探活恢复）+ 指纹复用 + close/closeAll 计数',
    fn: async () => {
      const stats = { opens: [], pings: 0, closes: 0, selects: [] }
      const db = createDbService({
        drivers: {
          mssql: factoryOf(() => fakeSqlDriver(stats, { failPingOnce: true })),
        },
      })
      const conn = { type: 'mssql', host: 'x', user: 'u' }
      try {
        // 第一次 query：无缓存 → open（第 1 次）
        await db.query({ connection: conn, sql: 'SELECT 1' })
        assert.equal(stats.opens.length, 1)
        // 第二次 query：指纹命中 → ping 失败 → 丢弃重开（第 2 次 open）
        await db.query({ connection: conn, sql: 'SELECT 1' })
        assert.equal(stats.opens.length, 2, 'ping 失败应丢弃句柄重开一次')
        assert.equal(stats.closes, 1, '失效句柄应被 close 清理')
        // 第三次 query：新句柄 ping 成功 → 复用，不再 open（两次指纹命中各探活一次）
        await db.query({ connection: conn, sql: 'SELECT 1' })
        assert.equal(stats.opens.length, 2)
        assert.equal(stats.pings, 2, '指纹命中先探活（第一次失败 + 一次成功复用）')
        // 不同配置 → 不同指纹
        await db.query({ connection: { type: 'mssql', host: 'y', user: 'u' }, sql: 'SELECT 1' })
        assert.equal(stats.opens.length, 3)
        // close / closeAll
        const closed = await db.close({ connection: conn })
        assert.equal(closed.ok, true)
        assert.equal(closed.closed, true)
        const again = await db.close({ connection: conn })
        assert.equal(again.closed, false, '重复 close 幂等')
        const all = await db.closeAll()
        assert.equal(all.closed, 1, 'closeAll 关剩余一条')
        assert.equal(stats.closes, 3)
      } finally {
        await db.closeAll()
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
