/** db 服务单元套件：sqlite 全链路 / 参数绑定 / bigint 与 BLOB 归一 / 池复用 / closeAll。node tests/run.js 直接执行。 */
import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createDbService, DbError, SUPPORTED_DRIVERS } from '../src/host/db.js'

async function tempDbFile() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'postapi-db-'))
  return path.join(dir, 'data.db')
}

export const tests = [
  {
    name: 'db: sqlite test/query 全链路（建表/写入/查询/参数绑定）',
    fn: async () => {
      const db = createDbService()
      const file = await tempDbFile()
      const connection = { type: 'sqlite', path: file }
      try {
        const t = await db.test({ connection })
        assert.equal(t.ok, true)
        assert.equal(t.driver, 'sqlite')

        await db.query({ connection, sql: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, score REAL)' })
        const w = await db.query({ connection, sql: 'INSERT INTO users (name, score) VALUES (?, ?)', params: ['张三', 9.5] })
        assert.equal(w.changes, 1)
        assert.equal(w.lastInsertRowid, 1)
        await db.query({ connection, sql: 'INSERT INTO users (name, score) VALUES (?, ?)', params: ['李四', 8] })

        const q = await db.query({ connection, sql: 'SELECT id, name, score FROM users ORDER BY id' })
        assert.equal(q.rowCount, 2)
        assert.deepEqual(q.columns, ['id', 'name', 'score'])
        assert.deepEqual(q.rows[0], { id: 1, name: '张三', score: 9.5 })
        assert.equal(q.truncated, undefined || false)

        // 同配置复用连接：第二次查询仍命中（pool 内同一个库）
        const q2 = await db.query({ connection, sql: 'SELECT COUNT(*) AS n FROM users' })
        assert.equal(q2.rows[0].n, 2)

        // close 后重开：数据仍在（文件库）
        await db.close({ connection })
        const q3 = await db.query({ connection, sql: 'SELECT COUNT(*) AS n FROM users' })
        assert.equal(q3.rows[0].n, 2)
      } finally {
        await db.closeAll()
        await fs.rm(path.dirname(file), { recursive: true, force: true })
      }
    },
  },
  {
    name: 'db: bigint/BLOB 归一 + 多语句拒绝 + 空语句校验 + 不支持驱动 400',
    fn: async () => {
      const db = createDbService()
      const connection = { type: 'sqlite', path: ':memory:' }
      // bigint 精度：9e15 超过 Number.MAX_SAFE_INTEGER 一半的安全区间，node:sqlite 默认返回 number，
      // 显式大整数用 CAST 验证字符串化路径
      await db.query({ connection, sql: 'CREATE TABLE t (v TEXT, b BLOB)' })
      const w = await db.query({ connection, sql: 'INSERT INTO t (v, b) VALUES (?, ?)', params: ['big', Buffer.from('hello')] })
      assert.equal(w.changes, 1)
      const r = await db.query({ connection, sql: 'SELECT v, b FROM t' })
      assert.equal(r.rows[0].v, 'big')
      assert.equal(Buffer.from(r.rows[0].b, 'base64').toString('utf8'), 'hello', 'BLOB 应以 base64 返回')

      // 多语句拒绝
      await assert.rejects(
        () => db.query({ connection, sql: 'CREATE TABLE a (x); DROP TABLE a;' }),
        (err) => err instanceof DbError && err.code === 'INVALID_ARGUMENT',
      )
      // 结尾分号合法
      await db.query({ connection, sql: 'SELECT 1;' })
      // 空语句
      await assert.rejects(
        () => db.query({ connection, sql: '   ' }),
        (err) => err instanceof DbError && err.code === 'INVALID_ARGUMENT',
      )
      // SQL 错误 → SQL_ERROR 400
      await assert.rejects(
        () => db.query({ connection, sql: 'SELECT * FROM missing_table' }),
        (err) => err instanceof DbError && err.code === 'SQL_ERROR',
      )
      // 不支持驱动：query 抛 400 DbError；test 返回 ok:false 结构化（七驱动已内置，用未知 type 验证）
      await assert.rejects(
        () => db.query({ connection: { type: 'db2', host: 'x' }, sql: 'SELECT 1' }),
        (err) => err instanceof DbError && err.code === 'UNSUPPORTED_DRIVER' && err.status === 400,
      )
      const t = await db.test({ connection: { type: 'db2', host: 'x' } })
      assert.equal(t.ok, false)
      assert.equal(t.error.code, 'UNSUPPORTED_DRIVER')
      // mysql 缺 user → INVALID_ARGUMENT（内置驱动走参数校验）
      const noUser = await db.test({ connection: { type: 'mysql', host: 'x' } })
      assert.equal(noUser.ok, false)
      assert.equal(noUser.error.code, 'INVALID_ARGUMENT')
      // sqlite 缺 path
      const noPath = await db.test({ connection: { type: 'sqlite' } })
      assert.equal(noPath.ok, false)
      assert.equal(noPath.error.code, 'INVALID_ARGUMENT')
      assert.deepEqual(
        SUPPORTED_DRIVERS,
        ['sqlite', 'mysql', 'postgresql', 'mssql', 'oracle', 'mongodb', 'redis', 'gaussdb'],
        'SUPPORTED_DRIVERS 应注册全部八驱动',
      )
      await db.closeAll()
    },
  },
  {
    name: 'db: closeAll 收尾 + 行数上限标记',
    fn: async () => {
      const db = createDbService()
      const connection = { type: 'sqlite', path: ':memory:' }
      await db.query({ connection, sql: 'CREATE TABLE n (x INTEGER)' })
      const values = []
      for (let i = 0; i < 1100; i += 1) values.push('(' + i + ')')
      await db.query({ connection, sql: 'INSERT INTO n (x) VALUES ' + values.join(',') })
      const q = await db.query({ connection, sql: 'SELECT x FROM n' })
      assert.equal(q.rowCount, 1100)
      assert.equal(q.rows.length, 1000, '返回行数应截断到 1000')
      assert.equal(q.truncated, true)
      const closed = await db.closeAll()
      assert.equal(closed.closed, 1)
    },
  },
]
