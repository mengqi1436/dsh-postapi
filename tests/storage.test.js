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
    name: 'storage: 新建 endpoint 字段全量补默认、order 追加末尾、getProject 读回逐字段一致',
    fn: () => withTempStorage(async (storage, base) => {
      const p = await storage.createProject('默认字段项目')
      const first = await storage.saveEndpoint(p.id, { name: '第一', url: 'http://a/1', method: 'POST' })
      const second = await storage.saveEndpoint(p.id, { name: '第二' })
      assert.equal(first.order, 0)
      assert.equal(second.order, 1) // 未传 order 时追加在末尾
      assert.match(second.id, /^ep_[0-9a-z]+$/)
      assert.ok(!Number.isNaN(Date.parse(second.createdAt)))
      assert.ok(!Number.isNaN(Date.parse(second.updatedAt)))

      // 契约 §2.2 默认值全量断言
      const expectDefaults = {
        folderId: null,
        protocol: 'http',
        params: [],
        pathParams: [],
        headers: [],
        cookies: [],
        body: { type: 'none', content: '', schema: null, examples: [] },
        auth: { type: 'none', token: '', username: '', password: '', key: '', value: '', addTo: 'header' },
        responses: [],
        preProcessors: [],
        postProcessors: [],
        mock: { enabled: false, delayMs: 0, rules: [] },
        description: '',
        tags: [],
        status: 'developing',
      }
      for (const [k, v] of Object.entries(expectDefaults)) {
        assert.deepEqual(second[k], v, 'endpoint.' + k + ' 应补契约默认值')
      }
      assert.equal(second.method, 'GET')
      assert.equal(second.url, '')

      // 读回逐字段相等（含默认值），且落盘介质内容一致
      const got = (await storage.getProject(p.id)).endpoints.find((e) => e.id === second.id)
      assert.deepEqual(got, second)
      const raw = JSON.parse(await fs.readFile(path.join(base, p.id, 'project.json'), 'utf8'))
      assert.deepEqual(raw.endpoints.find((e) => e.id === second.id), second)
      assert.deepEqual(raw.endpoints.map((e) => e.id), [first.id, second.id])
    }),
  },
  {
    name: 'storage: 更新只传 id + patch 时未传字段由 withEndpointDefaults 保留，createdAt 不变',
    fn: () => withTempStorage(async (storage) => {
      const p = await storage.createProject('patch 项目')
      const ep = await storage.saveEndpoint(p.id, {
        name: '原接口',
        method: 'POST',
        url: 'http://a/1',
        params: [{ key: 'q', value: '1', enabled: true, description: '', required: false, type: 'string' }],
        headers: [{ key: 'X-Trace', value: 'on', enabled: true, description: '', required: false, type: 'string' }],
        body: { type: 'json', content: '{"a":1}' },
        auth: { type: 'bearer', token: 'T' },
        tags: ['x'],
        description: '描述',
        status: 'released',
      })
      await new Promise((r) => setTimeout(r, 5))
      // 只传 id + 两个字段：其余字段必须从 prev 合并回来，不能被打回默认值
      const merged = await storage.saveEndpoint(p.id, { id: ep.id, name: '改后接口', method: 'PUT' })
      assert.equal(merged.id, ep.id)
      assert.equal(merged.createdAt, ep.createdAt)
      assert.ok(Date.parse(merged.updatedAt) >= Date.parse(ep.updatedAt))
      assert.equal(merged.name, '改后接口')
      assert.equal(merged.method, 'PUT')
      assert.equal(merged.url, 'http://a/1')
      assert.deepEqual(merged.params, ep.params)
      assert.deepEqual(merged.headers, ep.headers)
      assert.deepEqual(merged.body, ep.body)
      assert.deepEqual(merged.auth, ep.auth)
      assert.deepEqual(merged.tags, ['x'])
      assert.equal(merged.description, '描述')
      assert.equal(merged.status, 'released')

      const project = await storage.getProject(p.id)
      assert.equal(project.endpoints.length, 1, '更新不得新增条目')
      assert.deepEqual(project.endpoints[0], merged)
    }),
  },
  {
    name: 'storage: endpoint 增删后 index.json updatedAt 与 project.updatedAt 同步，删除不影响其他条目',
    fn: () => withTempStorage(async (storage, base) => {
      const p = await storage.createProject('索引同步项目')
      const readIndex = async () => JSON.parse(await fs.readFile(path.join(base, 'index.json'), 'utf8'))
      const index0 = await readIndex()
      assert.equal(index0.projects.length, 1)
      assert.equal(index0.projects[0].updatedAt, p.updatedAt)

      await new Promise((r) => setTimeout(r, 5))
      const a = await storage.saveEndpoint(p.id, { name: 'A', url: 'http://a' })
      const b = await storage.saveEndpoint(p.id, { name: 'B', url: 'http://b' })
      const projectRaw = JSON.parse(await fs.readFile(path.join(base, p.id, 'project.json'), 'utf8'))
      const index1 = await readIndex()
      assert.equal(index1.projects[0].updatedAt, projectRaw.updatedAt, 'index.updatedAt 应随 endpoint 写入同步')
      assert.equal(index1.projects[0].name, '索引同步项目')

      await new Promise((r) => setTimeout(r, 5))
      await storage.deleteEndpoint(p.id, a.id)
      const after = await storage.getProject(p.id)
      assert.deepEqual(after.endpoints.map((e) => e.id), [b.id])
      assert.equal(after.endpoints[0].name, 'B', '删除 A 不应影响 B')
      const index2 = await readIndex()
      assert.equal(index2.projects[0].updatedAt, after.updatedAt, 'index.updatedAt 应随删除同步')
      assert.ok(Date.parse(index2.projects[0].updatedAt) > Date.parse(index1.projects[0].updatedAt))

      // 列表读到的 updatedAt 与磁盘一致（client 项目列表直接用这个值）
      const list = await storage.listProjects()
      assert.equal(list[0].updatedAt, index2.projects[0].updatedAt)
    }),
  },
  {
    name: 'storage: v1 index.json 升级与并发写不互相覆盖（listProjects 队列内重读磁盘）',
    fn: async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), 'postapi-storage-'))
      try {
        const pid = 'proj_v1'
        const old = '2026-01-01T00:00:00.000Z'
        await fs.mkdir(path.join(base, pid), { recursive: true })
        await fs.writeFile(path.join(base, 'index.json'), JSON.stringify({
          projects: [{ id: pid, name: '旧项目', updatedAt: old }],
        }))
        await fs.writeFile(path.join(base, pid, 'project.json'), JSON.stringify({
          id: pid, name: '旧项目', createdAt: old, updatedAt: old, schemaVersion: 2,
          folders: [], endpoints: [], schemas: [], environments: [], globals: { variables: [] },
          mocks: [], testCases: [], testScenarios: [], flow: { name: '', steps: [] },
          settings: { mockPort: 4010, proxyUrl: '', requestTimeoutMs: 30000, historyLimit: 200 },
        }))
        const storage = createStorageService(base)

        // v1 升级写 与 endpoint 写 并发：升级写不得用读入时的旧快照覆盖新的 updatedAt
        await Promise.all([
          storage.listProjects(),
          storage.saveEndpoint(pid, { name: '新接口', url: 'http://a/1' }),
        ])
        const index = JSON.parse(await fs.readFile(path.join(base, 'index.json'), 'utf8'))
        const project = JSON.parse(await fs.readFile(path.join(base, pid, 'project.json'), 'utf8'))
        assert.equal(index.version, 2, 'version 必须升级为 2')
        assert.equal(index.projects[0].name, '旧项目', '升级不得丢项目条目')
        assert.equal(index.projects[0].updatedAt, project.updatedAt, '升级写不得回退 updatedAt')
        assert.equal(project.endpoints.length, 1, '并发写不得丢失')
      } finally {
        await fs.rm(base, { recursive: true, force: true })
      }
    },
  },
]
