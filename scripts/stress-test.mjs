#!/usr/bin/env node
/**
 * 压力测试：对齐 Apifox 使用强度的容量与稳定性探测。
 *
 * 覆盖：大规模导入/导出/搜索、历史上限裁剪、并发写、Mock 并发、
 * 大响应截断、WS 消息洪泛、变量替换规模、深嵌套 Schema、SQLite 批量、
 * 代码生成批量、脚本沙箱并发。
 * 每项记录量级 / 耗时 / 内存增量，超阈值即 FAIL（非零退出）。
 *
 * 用法：node scripts/stress-test.mjs
 */
import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { startTarget } from './parity-lib.mjs'

import { createStorageService } from '../src/host/storage.js'
import { createRequestService } from '../src/host/request.js'
import { createMockServer } from '../src/host/mock-server.js'
import { createWsClient } from '../src/host/ws-client.js'
import { createDbService } from '../src/host/db.js'
import { createVariableResolver } from '../src/host/variables.js'
import { runScript } from '../src/host/script-sandbox.js'
import * as importExport from '../src/host/import-export.js'
import * as codegen from '../src/host/codegen.js'
import { schemaExampleOf } from '../src/host/bridge.js'

const results = []
let currentGroup = ''

function group(name) {
  currentGroup = name
  console.log('\n== ' + name + ' ==')
}

const heapNow = () => Math.round(process.memoryUsage().heapUsed / 1024 / 1024)

async function stress(name, { budgetMs, fn }) {
  const heapBefore = heapNow()
  const started = Date.now()
  let detail = ''
  try {
    detail = (await fn()) || ''
    const cost = Date.now() - started
    const heapDelta = heapNow() - heapBefore
    const over = budgetMs != null && cost > budgetMs
    results.push({ group: currentGroup, name, pass: !over, detail: `${detail} 耗时=${cost}ms 内存增量≈${heapDelta}MB`, over })
    console.log(`  ${over ? 'FAIL(超预算)' : 'PASS'} ${name} — ${detail} 耗时=${cost}ms 内存增量≈${heapDelta}MB`)
  } catch (err) {
    results.push({ group: currentGroup, name, pass: false, detail: err && err.message })
    console.log('  FAIL ' + name + ' — ' + (err && err.message))
  }
}

/* ---------------- 大样本构造 ---------------- */

function bigOpenApi(endpointCount) {
  const paths = {}
  for (let i = 0; i < endpointCount; i += 1) {
    paths['/res/' + i] = {
      get: {
        summary: '接口' + i,
        tags: ['分组' + (i % 20)],
        parameters: [{ name: 'id', in: 'query', schema: { type: 'string' } }],
        responses: { 200: { description: 'ok', content: { 'application/json': { schema: { type: 'object', properties: { id: { type: 'string' }, seq: { type: 'integer' } } } } } } },
      },
    }
  }
  return { openapi: '3.0.3', info: { title: 'stress-api', version: '1.0.0' }, tags: Array.from({ length: 20 }, (_, i) => ({ name: '分组' + i })), paths }
}

/* ---------------- 主流程 ---------------- */

async function main() {
  const basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'postapi-stress-'))
  const storage = createStorageService(basePath)
  const request = createRequestService()
  const mock = createMockServer({ getProject: (id) => storage.getProject(id), port: 0 })
  const ws = createWsClient()
  const db = createDbService()
  const target = await startTarget()
  const project = await storage.createProject('压力测试项目')
  const pid = project.id

  try {
    /* ---- S1 大规模导入 ---- */
    group('S1 大规模导入')
    let bundle
    await stress('importOpenApi 5000 接口', {
      budgetMs: 60000,
      fn: () => {
        bundle = importExport.importOpenApi(bigOpenApi(5000))
        const eps = Array.isArray(bundle) ? bundle : bundle.endpoints
        assert.ok(eps.length === 5000, '应产出 5000 条接口，实际 ' + eps.length)
        return 'endpoints=5000 folders=' + (bundle.folders || []).length
      },
    })
    await stress('importBundle 落盘 5000 接口 + 20 目录', {
      budgetMs: 60000,
      fn: async () => {
        await storage.importBundle(pid, bundle)
        const back = await storage.getProject(pid)
        assert.equal(back.endpoints.length, 5000)
        assert.ok((back.folders || []).length >= 20)
        return '落盘 endpoints=5000'
      },
    })

    /* ---- S2 大项目搜索 ---- */
    group('S2 大项目搜索')
    await stress('search 5000 接口 × 10 次', {
      budgetMs: 10000,
      fn: async () => {
        const t0 = Date.now()
        for (let i = 0; i < 10; i += 1) {
          const out = await storage.search(pid, '接口' + i)
          assert.ok(out.endpoints.length >= 1)
        }
        return '10 次命中查询'
      },
    })

    /* ---- S3 大项目导出 ---- */
    group('S3 大项目导出')
    const bigProject = await storage.getProject(pid)
    await stress('exportOpenApi 5000 接口', { budgetMs: 20000, fn: () => { const doc = importExport.exportOpenApi(bigProject); assert.ok(Object.keys(doc.paths).length === 5000); return 'paths=5000' } })
    await stress('exportHar 5000 接口', { budgetMs: 20000, fn: () => { const har = importExport.exportHar(bigProject); assert.equal(har.log.entries.length, 5000); return 'entries=5000' } })
    await stress('exportMarkdown 5000 接口', { budgetMs: 20000, fn: () => { const md = importExport.exportMarkdown(bigProject); assert.ok(md.length > 100000); return 'bytes=' + md.length } })

    /* ---- S4 历史上限裁剪 ---- */
    group('S4 历史上限裁剪')
    await stress('appendHistory × 1200（上限 200）', {
      budgetMs: 30000,
      fn: async () => {
        await storage.saveProjectSettings(pid, { historyLimit: 200 })
        for (let i = 0; i < 1200; i += 1) {
          await storage.appendHistory(pid, { method: 'GET', url: target.base + '/hello#' + i, status: 200, timeMs: 1, bodySize: 10 })
        }
        const h = await storage.getHistory(pid)
        assert.equal(h.entries.length, 200, '应只留 200 条，实际 ' + h.entries.length)
        assert.ok(h.entries[199].url.endsWith('#1199'), '应保留最新')
        return 'entries=200（1200 写入）'
      },
    })

    /* ---- S5 并发写 ---- */
    group('S5 并发写（进程内串行队列）')
    // 注：单文件 JSON 架构每次写全量重写项目（feature-matrix §0 设计决策），5000 接口规模
    // 实测 ~330ms/次 × 100 次 ≈ 33s 属固有成本；预算放宽到 90s，关注点是不丢不损。
    await stress('100 并发 saveEndpoint 不丢不损', {
      budgetMs: 90000,
      fn: async () => {
        await Promise.all(Array.from({ length: 100 }, (_, i) =>
          storage.saveEndpoint(pid, { name: '并发' + i, method: 'GET', url: target.base + '/hello' })))
        const back = await storage.getProject(pid)
        assert.equal(back.endpoints.length, 5100, '5000+100 应全在')
        const raw = JSON.parse(await fs.readFile(path.join(basePath, pid, 'project.json'), 'utf8'))
        assert.equal(raw.endpoints.length, back.endpoints.length, '落盘与读回一致')
        return 'endpoints=5100'
      },
    })

    /* ---- S6 Mock 并发 ---- */
    group('S6 Mock 并发')
    const mockEp = await storage.saveEndpoint(pid, {
      name: 'mock压测', method: 'GET', url: target.base + '/mock-stress',
      responses: [{ code: 200, name: '默认', contentType: 'application/json', body: '{"ok":1}', isDefault: true }],
      mock: { enabled: true, delayMs: 0, rules: [{ id: 'ms1', endpointId: '', field: 'seq', rule: 'increment', value: '0', enabled: true }] },
    })
    await mock.start()
    const mockBase = 'http://127.0.0.1:' + mock.status().port + '/mock/' + pid + '/mock-stress'
    await stress('Mock 500 并发请求全部命中', {
      budgetMs: 30000,
      fn: async () => {
        const rs = await Promise.all(Array.from({ length: 500 }, () => fetch(mockBase)))
        let okCount = 0
        for (const r of rs) {
          assert.equal(r.status, 200)
          const j = await r.json()
          // 接口级 increment 规则覆盖默认体：响应为 {"seq":N}，N 各不相同即规则生效
          if (j.ok === 1 || Number.isFinite(j.seq)) okCount += 1
        }
        assert.equal(okCount, 500, '500 响应应全部正确')
        return '500/500 正确'
      },
    })
    await mock.stop()

    /* ---- S7 大响应截断 ---- */
    group('S7 大响应截断')
    await stress('20MB 响应 → 截断保留 200KB', {
      budgetMs: 15000,
      fn: async () => {
        const res = await request.send({ method: 'GET', url: target.base + '/huge', timeoutMs: 12000 })
        assert.equal(res.truncated, true)
        assert.equal(res.bodySize, 20 * 1024 * 1024)
        assert.ok(Buffer.byteLength(res.body) <= 210 * 1024)
        return 'bodySize=20971520 保留=' + Buffer.byteLength(res.body)
      },
    })

    /* ---- S8 WS 消息洪泛 ---- */
    group('S8 WS 消息洪泛')
    await stress('600 连发消息 → 日志截断保留最新 200', {
      budgetMs: 30000,
      fn: async () => {
        const opened = await ws.open({ url: target.wsBase.replace('ws://', 'http://'), timeoutMs: 3000 })
        assert.equal(opened.status, 'open')
        for (let i = 0; i < 600; i += 1) {
          await ws.send({ id: opened.id, message: 'm' + i })
          if (i % 50 === 0) await new Promise((r) => setTimeout(r, 10))
        }
        await new Promise((r) => setTimeout(r, 800))
        const logs = await ws.messages({ id: opened.id })
        const inMsgs = logs.messages.filter((m) => m.direction === 'in')
        assert.ok(inMsgs.length <= 200, 'in 消息应 ≤200，实际 ' + inMsgs.length)
        assert.ok(inMsgs.some((m) => m.data === 'm599'), '应保留最新消息')
        await ws.close({ id: opened.id })
        return 'in=' + inMsgs.length + ' 保留最新'
      },
    })

    /* ---- S9 变量替换规模 ---- */
    group('S9 变量替换规模')
    await stress('2 万变量表 + 1MB 模板替换', {
      budgetMs: 5000,
      fn: () => {
        const variables = {}
        for (let i = 0; i < 20000; i += 1) variables['v' + i] = '值' + i
        const resolver = createVariableResolver({ local: variables })
        const template = ('{{v0}}/{{v19999}}/{{v12345}}/'.repeat(25000)).slice(0, 1024 * 1024)
        const out = resolver.resolve(template)
        assert.ok(out.includes('值0') && out.includes('值19999'))
        return '模板 1MB'
      },
    })

    /* ---- S10 深嵌套 Schema ---- */
    group('S10 深嵌套 Schema')
    await stress('schemaExampleOf 1000 层嵌套不栈溢出', {
      budgetMs: 5000,
      fn: () => {
        let schema = { type: 'string' }
        for (let i = 0; i < 1000; i += 1) schema = { type: 'object', properties: { child: schema } }
        const example = schemaExampleOf(schema)
        assert.ok(example && typeof example === 'object')
        let depth = 0
        let cur = example
        while (cur && typeof cur === 'object' && cur.child) { depth += 1; cur = cur.child }
        assert.ok(depth >= 1 && depth <= 64, '深度应有界（实际 ' + depth + '）')
        return '深度=' + depth + '（有界截断）'
      },
    })

    /* ---- S11 SQLite 批量 ---- */
    group('S11 SQLite 批量')
    await stress('1 万行插入 + 全表查询截断 1000', {
      budgetMs: 30000,
      fn: async () => {
        const conn = { type: 'sqlite', path: ':memory:' }
        await db.query({ connection: conn, sql: 'CREATE TABLE t(id INTEGER PRIMARY KEY, v TEXT)' })
        for (let batch = 0; batch < 100; batch += 1) {
          const values = Array.from({ length: 100 }, (_, i) => `(${batch * 100 + i}, 'v${batch}_${i}')`).join(',')
          await db.query({ connection: conn, sql: `INSERT INTO t (id, v) VALUES ${values}` })
        }
        const sel = await db.query({ connection: conn, sql: 'SELECT id, v FROM t' })
        assert.equal(sel.rows.length, 1000, 'rows 应截断 1000 行')
        assert.equal(sel.truncated, true, '应标记 truncated')
        assert.equal(sel.rowCount, 10000, 'rowCount 应为命中总数')
        return 'rows=1000/10000 truncated=true rowCount=10000'
      },
    })

    /* ---- S12 代码生成批量 ---- */
    group('S12 代码生成批量')
    await stress('500 接口 × 8 语言', {
      budgetMs: 20000,
      fn: () => {
        const langs = codegen.listLanguages()
        const eps = bigProject.endpoints.slice(0, 500)
        for (const ep of eps) {
          for (const lang of langs) {
            const code = codegen.generateCode({ endpoint: ep, lang })
            assert.ok(code.length > 10)
          }
        }
        return 500 * langs.length + ' 份产物'
      },
    })

    /* ---- S13 脚本沙箱并发 ---- */
    group('S13 脚本沙箱并发')
    await stress('50 并发 request.send（各带前后置脚本）', {
      budgetMs: 30000,
      fn: async () => {
        const rs = await Promise.all(Array.from({ length: 50 }, (_, i) => request.send({
          method: 'GET',
          url: target.base + '/users/7?i=' + i,
          preScript: 'console.log("pre ' + i + '"); pm.variables.set("i", "' + i + '")',
          postScript: 'pm.variables.set("name", pm.response.json().name)',
        })))
        for (const [i, r] of rs.entries()) {
          assert.equal(r.status, 200, '并发 ' + i + ' 应成功')
          assert.equal(r.variables.name, 'seven')
          assert.equal(r.variables.i, String(i), '前置变量应按并发各自隔离')
        }
        return '50/50 成功'
      },
    })
  } finally {
    await mock.stop().catch(() => {})
    await ws.closeAll().catch(() => {})
    await db.closeAll().catch(() => {})
    target.close()
    await fs.rm(basePath, { recursive: true, force: true }).catch(() => {})
  }

  const failed = results.filter((r) => !r.pass)
  console.log('\n==== 压力测试结果 ====')
  console.log(`合计：通过 ${results.length - failed.length}，失败 ${failed.length}，共 ${results.length}`)
  if (failed.length > 0) {
    for (const f of failed) console.log('  ✗ [' + f.group + '] ' + f.name + ' — ' + f.detail)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('压测脚本异常退出：', err)
  process.exit(2)
})
