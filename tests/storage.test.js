/** T3 存储服务测试：契约 §1 §7。node tests/run.js 直接执行，无 vitest 依赖。 */
import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createStorageService } from '../src/host/storage.js'

/** 每个用例独立的临时基路径（os.tmpdir + 随机），结束自动清理。 */
async function withTempStorage(fn) {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'postapi-storage-'))
  try {
    return await fn(createStorageService(base), base)
  } finally {
    await fs.rm(base, { recursive: true, force: true })
  }
}

export const tests = [
  {
    name: 'storage: appendHistory 的 historyLimit 改动即时生效（热路径 limit 缓存失效）',
    fn: () => withTempStorage(async (storage) => {
      const p = await storage.createProject('历史限流')
      // 先追加 3 条：默认上限 200，此时 limit 缓存已建立
      for (let i = 0; i < 3; i += 1) await storage.appendHistory(p.id, { method: 'GET', url: 'https://x.test#' + i, status: 200 })
      assert.equal((await storage.getHistory(p.id)).entries.length, 3)
      // 改小上限后必须立即生效（缓存要在 saveProjectSettings 时失效）
      await storage.saveProjectSettings(p.id, { historyLimit: 5 })
      for (let i = 3; i < 10; i += 1) await storage.appendHistory(p.id, { method: 'GET', url: 'https://x.test#' + i, status: 200 })
      const h = await storage.getHistory(p.id)
      assert.equal(h.entries.length, 5, '上限改为 5 后应只保留最新 5 条')
      assert.ok(h.entries[4].url.endsWith('#9'), '应保留最新一条')
      // 不存在的项目追加历史：明确报错（与原 loadProjectForWrite 行为一致）
      await assert.rejects(() => storage.appendHistory('proj_none', {}), /project not found/)
    }),
  },
  {
    name: 'storage: 项目建列删 + rename 同步 index + .trash 备份',
    fn: () => withTempStorage(async (storage, base) => {
      const created = await storage.createProject('演示项目')
      assert.match(created.id, /^proj_[0-9a-z]+$/)
      assert.equal(created.name, '演示项目')
      assert.ok(!Number.isNaN(Date.parse(created.updatedAt)))

      let list = await storage.listProjects()
      assert.equal(list.length, 1)
      assert.equal(list[0].id, created.id)
      assert.equal(list[0].name, '演示项目')

      const full = await storage.getProject(created.id)
      assert.deepEqual(
        { folders: full.folders, endpoints: full.endpoints, flow: full.flow },
        { folders: [], endpoints: [], flow: { name: '', steps: [] } },
      )
      assert.ok(!Number.isNaN(Date.parse(full.createdAt)))

      await storage.renameProject(created.id, '改名后')
      list = await storage.listProjects()
      assert.equal(list[0].name, '改名后')
      assert.equal((await storage.getProject(created.id)).name, '改名后')

      await storage.deleteProject(created.id)
      assert.equal((await storage.listProjects()).length, 0)
      await assert.rejects(() => fs.access(path.join(base, created.id)), /ENOENT/)
      // 删除项目：整目录先复制到 .trash/<projectId>-<ts>/ 再删除
      const trash = await fs.readdir(path.join(base, '.trash'))
      assert.equal(trash.length, 1)
      assert.ok(trash[0].startsWith(created.id + '-'))
      await fs.access(path.join(base, '.trash', trash[0], 'project.json'))
    }),
  },
  {
    name: 'storage: endpoint upsert 补 id/timestamps，覆盖保留 createdAt',
    fn: () => withTempStorage(async (storage) => {
      const p = await storage.createProject('ep 项目')
      const ep = await storage.saveEndpoint(p.id, {
        name: '查询订单', url: 'https://api.example.com/orders', method: 'GET',
      })
      assert.match(ep.id, /^ep_[0-9a-z]+$/)
      assert.ok(!Number.isNaN(Date.parse(ep.createdAt)))
      assert.ok(!Number.isNaN(Date.parse(ep.updatedAt)))
      assert.equal(ep.method, 'GET')
      assert.equal(ep.folderId, null)

      let project = await storage.getProject(p.id)
      assert.equal(project.endpoints.length, 1)

      await new Promise((r) => setTimeout(r, 5))
      const updated = await storage.saveEndpoint(p.id, { ...ep, name: '查询订单 V2' })
      assert.equal(updated.id, ep.id)
      assert.equal(updated.createdAt, ep.createdAt)
      assert.ok(Date.parse(updated.updatedAt) >= Date.parse(ep.updatedAt))
      project = await storage.getProject(p.id)
      assert.equal(project.endpoints.length, 1)
      assert.equal(project.endpoints[0].name, '查询订单 V2')

      await storage.saveEndpoint(p.id, { name: '第二条' })
      project = await storage.getProject(p.id)
      assert.equal(project.endpoints.length, 2)
    }),
  },
  {
    name: 'storage: folder 增删，删除后子项 folderId/parentId 置 null 不级联删',
    fn: () => withTempStorage(async (storage) => {
      const p = await storage.createProject('folder 项目')
      const fld = await storage.saveFolder(p.id, { name: '用户模块' })
      assert.match(fld.id, /^fld_[0-9a-z]+$/)
      assert.equal(fld.parentId, null)

      const ep = await storage.saveEndpoint(p.id, { name: '登录', folderId: fld.id })
      await storage.saveFolder(p.id, { name: '子目录', parentId: fld.id })

      await storage.deleteFolder(p.id, fld.id)
      const project = await storage.getProject(p.id)
      assert.equal(project.folders.length, 1) // 子目录保留
      assert.equal(project.folders[0].parentId, null) // parentId 置 null
      assert.equal(project.endpoints.length, 1) // endpoint 不级联删
      assert.equal(project.endpoints[0].id, ep.id)
      assert.equal(project.endpoints[0].folderId, null) // folderId 置 null
    }),
  },
  {
    name: 'storage: 损坏 JSON 隔离 .corrupt-<ts> 后重建空结构',
    fn: () => withTempStorage(async (storage, base) => {
      const p = await storage.createProject('损坏项目')
      const file = path.join(base, p.id, 'project.json')
      await fs.writeFile(file, '{ this is not json')

      const recovered = await storage.getProject(p.id)
      assert.equal(recovered.id, p.id)
      assert.equal(recovered.name, '损坏项目') // name 从 index.json 找回
      assert.deepEqual(recovered.endpoints, [])
      assert.deepEqual(recovered.folders, [])

      const entries = await fs.readdir(path.join(base, p.id))
      const corrupt = entries.filter((n) => n.includes('.corrupt-'))
      assert.equal(corrupt.length, 1)
      assert.ok(corrupt[0].startsWith('project.json.corrupt-'))
      // 原路径恢复为合法 JSON 结构
      const rebuilt = JSON.parse(await fs.readFile(file, 'utf8'))
      assert.equal(rebuilt.id, p.id)
    }),
  },
  {
    name: 'storage: 原子写读回一致且无 .tmp 残留',
    fn: () => withTempStorage(async (storage, base) => {
      const p = await storage.createProject('原子项目')
      const ep = await storage.saveEndpoint(p.id, {
        name: '原子接口', url: 'http://x/y', method: 'POST',
        body: { type: 'json', content: '{"a":1}' },
      })
      // 直接读盘验证与 API 返回一致（tmp+rename 原子落盘）
      const raw = JSON.parse(await fs.readFile(path.join(base, p.id, 'project.json'), 'utf8'))
      assert.equal(raw.endpoints.length, 1)
      assert.deepEqual(raw.endpoints[0], ep)
      const indexRaw = JSON.parse(await fs.readFile(path.join(base, 'index.json'), 'utf8'))
      assert.equal(indexRaw.projects.length, 1)
      assert.equal(indexRaw.projects[0].id, p.id)
      const entries = await fs.readdir(path.join(base, p.id))
      assert.ok(!entries.some((n) => n.endsWith('.tmp')))
      assert.ok(!(await fs.readdir(base)).some((n) => n.endsWith('.tmp')))
    }),
  },
  {
    name: 'storage: 10 并发写全部落盘不丢失',
    fn: () => withTempStorage(async (storage, base) => {
      const p = await storage.createProject('并发项目')
      const results = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          storage.saveEndpoint(p.id, { name: `并发接口 ${i}` })),
      )
      assert.equal(new Set(results.map((r) => r.id)).size, 10) // id 不碰撞
      const project = await storage.getProject(p.id)
      assert.equal(project.endpoints.length, 10)
      const raw = JSON.parse(await fs.readFile(path.join(base, p.id, 'project.json'), 'utf8'))
      assert.equal(raw.endpoints.length, 10)
    }),
  },
  {
    name: 'storage: 空串 id 的新实体自动补 id（调试页保存形态）',
    fn: () => withTempStorage(async (storage, base) => {
      const p = await storage.createProject('空 id 项目')
      // 调试页 emptyDraft 的 id 是 ''（不是 null/undefined），必须按新建处理而不是 upsert 到 id:''
      const ep = await storage.saveEndpoint(p.id, { id: '', name: 'echo 调试接口', method: 'GET', url: '/echo' })
      assert.match(ep.id, /^ep_[0-9a-z]+$/)
      const folder = await storage.saveFolder(p.id, { id: '', name: '目录' })
      assert.match(folder.id, /^fld_[0-9a-z]+$/)
      const schema = await storage.saveSchema(p.id, { id: '', name: 'Order', jsonSchema: { type: 'object' } })
      assert.match(schema.id, /^sch_[0-9a-z]+$/)
      const env = await storage.saveEnvironment(p.id, { id: '', name: '测试环境' })
      assert.match(env.id, /^env_[0-9a-z]+$/)
      const resp = await storage.saveResponse(p.id, ep.id, { id: '', name: '成功', code: 200 })
      assert.match(resp.id, /^res_[0-9a-z]+$/)
      // 空串 id 不落盘为 ''；带真实 id 的保存仍走覆盖路径
      const project = await storage.getProject(p.id)
      assert.ok(project.endpoints.every((e) => e.id !== ''))
      const updated = await storage.saveEndpoint(p.id, { id: ep.id, name: '改名后' })
      assert.equal(updated.id, ep.id)
      const after = await storage.getProject(p.id)
      assert.equal(after.endpoints.find((e) => e.id === ep.id).name, '改名后')
      assert.equal(after.endpoints.length, 1)
      // 历史条目空 id 同样补齐
      const his = await storage.appendHistory(p.id, { id: '', method: 'GET', url: '/echo', status: 200 })
      assert.match(his.id, /^his_[0-9a-z]+$/)
    }),
  },
]
