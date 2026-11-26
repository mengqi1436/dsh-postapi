/**
 * 存储服务 v2：契约 §2（schema v2 / 原子写 / 串行队列 / 损坏隔离 / .trash 备份）
 * 与 §3 postapi.storage face。纯工厂 createStorageService(basePath) 便于测试注入临时目录。
 * v2 相对 v1：index.json 带 version；project.json 带 schemaVersion 与 schemas/environments/
 * globals/mocks/testCases/testScenarios/settings 等实体；endpoint 补全 protocol/responses/
 * preProcessors/postProcessors/mock/tags/status；新增 14 个 face 方法。
 * 既有 9 个方法签名与四条机制（原子写 / 串行队列 / 损坏隔离 / .trash）保持不变。
 */
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomBytes } from 'node:crypto'

/**
 * 默认数据根目录（可移植）：POSTAPI_DATA_DIR 环境变量优先，否则落在用户主目录下的
 * `.dsh/postapi`。不写死任何盘符——插件要能被任意用户装上就用，宿主侧可再用
 * config.basePath / config.storage.basePath 覆盖到指定目录。
 */
export const DEFAULT_BASE_PATH = (() => {
  const fromEnv = (process.env.POSTAPI_DATA_DIR || '').trim()
  return fromEnv !== '' ? fromEnv : path.join(os.homedir(), '.dsh', 'postapi')
})()
export const SCHEMA_VERSION = 2

/** 契约 §2.2 settings 默认值。 */
export const DEFAULT_SETTINGS = {
  mockPort: 4010,
  proxyUrl: '',
  requestTimeoutMs: 30000,
  historyLimit: 200,
}

const DEFAULT_HISTORY_LIMIT = DEFAULT_SETTINGS.historyLimit

function nowIso() {
  return new Date().toISOString()
}

/** 契约 §2.2 id 规则：前缀 + Date.now().toString(36) + 2 位随机。 */
export function makeId(prefix) {
  return `${prefix}${Date.now().toString(36)}${randomBytes(1).toString('hex')}`
}

/** 同格式内避开已有 id（同毫秒高并发时随机位碰撞则重取）。 */
function uniqueId(prefix, existing) {
  let id = makeId(prefix)
  while (existing.has(id)) id = makeId(prefix)
  return id
}

/** id 是否真实存在：null/undefined 与空串都视为「无 id」。
 *  调试页等客户端会带着 id:'' 保存新实体，只判 != null 会把空串当既有 id 落盘，
 *  产出 id:'' 的死记录（文档路由 / Mock 规则 / 用例绑定全部失联）。 */
function hasRealId(id) {
  return id != null && String(id).trim() !== ''
}

/** 契约 §2.2 endpoint 默认结构（v2 全字段；createdAt/updatedAt 由写路径显式赋）。 */
export const ENDPOINT_DEFAULTS = {
  name: '',
  folderId: null,
  order: 0,
  protocol: 'http',
  method: 'GET',
  url: '',
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

/** 契约 §2.2 response 默认结构。 */
const RESPONSE_DEFAULTS = {
  name: '',
  code: 200,
  contentType: 'application/json',
  body: '',
  schema: null,
  headers: [],
  enabled: true,
  isDefault: false,
}

/** 契约 §2.2 schema 默认结构。 */
const SCHEMA_DEFAULTS = {
  name: '',
  folderId: null,
  jsonSchema: {},
  description: '',
}

/** 契约 §2.2 environment 默认结构。 */
const ENV_DEFAULTS = {
  name: '',
  baseUrl: '',
  isDefault: false,
  variables: [],
}

function emptyProject(id, name) {
  const ts = nowIso()
  return {
    id,
    name,
    description: '',
    createdAt: ts,
    updatedAt: ts,
    schemaVersion: SCHEMA_VERSION,
    folders: [],
    endpoints: [],
    schemas: [],
    environments: [],
    globals: { variables: [] },
    mocks: [],
    testCases: [],
    testScenarios: [],
    flow: { name: '', steps: [] },
    settings: { ...DEFAULT_SETTINGS },
  }
}

/** 浅补默认字段；无缺失时返回原引用，避免无意义重写。 */
function withDefaults(item, defaults) {
  if (!item || typeof item !== 'object') return { item: { ...defaults }, changed: true }
  let changed = false
  const out = { ...item }
  for (const [k, v] of Object.entries(defaults)) {
    if (out[k] === undefined) {
      out[k] = v
      changed = true
    }
  }
  return { item: changed ? out : item, changed }
}

/** endpoint 归一：顶层 + body/auth/mock 三个嵌套对象都补默认（v1 数据缺这些字段）。 */
function normalizeEndpoint(ep) {
  const base = withDefaults(ep, ENDPOINT_DEFAULTS)
  const out = { ...base.item }
  let changed = base.changed
  for (const key of ['body', 'auth', 'mock']) {
    const nested = withDefaults(out[key], ENDPOINT_DEFAULTS[key])
    if (nested.changed) {
      out[key] = nested.item
      changed = true
    }
  }
  return { item: changed ? out : ep, changed }
}

/** project 归一：v1 project.json（无 schemaVersion / settings / schemas 等）升级到 v2 结构。 */
function normalizeProject(raw) {
  let changed = false
  const project = { ...raw }
  if (project.schemaVersion !== SCHEMA_VERSION) {
    project.schemaVersion = SCHEMA_VERSION
    changed = true
  }
  const blanks = {
    description: '',
    folders: [],
    endpoints: [],
    schemas: [],
    environments: [],
    globals: { variables: [] },
    mocks: [],
    testCases: [],
    testScenarios: [],
    flow: { name: '', steps: [] },
  }
  for (const [k, v] of Object.entries(blanks)) {
    if (project[k] === undefined || project[k] === null) {
      project[k] = v
      changed = true
    }
  }
  const settings = { ...DEFAULT_SETTINGS, ...(project.settings || {}) }
  if (JSON.stringify(settings) !== JSON.stringify(project.settings)) {
    project.settings = settings
    changed = true
  }
  const endpoints = project.endpoints.map((ep) => normalizeEndpoint(ep))
  if (endpoints.some((r) => r.changed)) {
    project.endpoints = endpoints.map((r) => r.item)
    changed = true
  }
  return { project: changed ? project : raw, changed }
}

function upsertById(list, item) {
  const i = list.findIndex((x) => x.id === item.id)
  if (i >= 0) list[i] = item
  else list.push(item)
}

/** 返回给调用方的副本：search 结果不暴露内部引用。 */
function clone(v) {
  return JSON.parse(JSON.stringify(v))
}

function asVariables(globals) {
  if (Array.isArray(globals)) return { variables: globals }
  if (globals && typeof globals === 'object') return { variables: [], ...globals }
  return { variables: [] }
}

export function createStorageService(basePath = DEFAULT_BASE_PATH) {
  // 进程内 promise 串行队列：所有写操作排队执行，并发写不互相覆盖（契约 §2）。
  let tail = Promise.resolve()
  const enqueue = (job) => {
    const run = tail.then(job, job)
    tail = run.then(() => {}, () => {})
    return run
  }

  const indexFile = () => path.join(basePath, 'index.json')
  const projectFile = (id) => path.join(basePath, id, 'project.json')
  const historyFile = (id) => path.join(basePath, id, 'history.json')

  /** 原子写：tmp 文件 + fs.rename（契约 §2）。 */
  async function atomicWrite(file, data) {
    await fs.mkdir(path.dirname(file), { recursive: true })
    const tmp = `${file}.tmp`
    await fs.writeFile(tmp, data)
    await fs.rename(tmp, file)
  }

  async function readJson(file) {
    return JSON.parse(await fs.readFile(file, 'utf8'))
  }

  /**
   * 读 index.json：ENOENT → 空库（version 2）；v1（无 version）自动补 version:2 并标记 upgraded，
   * 由调用方决定是否落盘升级（listProjects 入队写回）。
   */
  async function readIndexState() {
    try {
      const index = await readJson(indexFile())
      let upgraded = false
      if (index.version !== SCHEMA_VERSION) {
        index.version = SCHEMA_VERSION
        upgraded = true
      }
      if (!Array.isArray(index.projects)) {
        index.projects = []
        upgraded = true
      }
      return { index, upgraded }
    } catch (err) {
      if (err.code === 'ENOENT') return { index: { version: SCHEMA_VERSION, projects: [] }, upgraded: false }
      throw err
    }
  }

  async function readIndex() {
    return (await readIndexState()).index
  }

  const writeIndex = (index) => atomicWrite(indexFile(), JSON.stringify(index, null, 2))

  /**
   * 读取 project.json 并归一为 v2。损坏（解析失败）→ 原文件改名 .corrupt-<ts> 后返回待重建的空结构；
   * ENOENT → null。不在本函数内落盘，由调用方决定写路径（队列内直写 / getProject 入队）。
   */
  async function loadProjectData(id) {
    const file = projectFile(id)
    try {
      const raw = await readJson(file)
      const { project, changed } = normalizeProject(raw)
      return { data: project, upgrade: changed }
    } catch (err) {
      if (err.code === 'ENOENT') return null
      const corruptName = `${file}.corrupt-${Date.now()}`
      await fs.rename(file, corruptName).catch(() => {})
      // name 尽量从 index.json 找回，减少损坏重建的信息损失
      let name = ''
      try {
        const index = await readIndex()
        name = (index.projects.find((p) => p.id === id) || {}).name || ''
      } catch {
        // 找回失败不阻塞重建
      }
      return { data: emptyProject(id, name), rebuild: true }
    }
  }

  const saveProject = (project) =>
    atomicWrite(projectFile(project.id), JSON.stringify(project, null, 2))

  /** 队列内取项目：损坏时直接重建落盘，v1 结构时升级落盘。 */
  async function loadProjectForWrite(id) {
    const loaded = await loadProjectData(id)
    if (!loaded) throw new Error(`project not found: ${id}`)
    if (loaded.rebuild || loaded.upgrade) await saveProject(loaded.data)
    return loaded.data
  }

  /** 读 history.json：ENOENT → 空历史；损坏 → 隔离 .corrupt-<ts> 后返回空历史。 */
  async function readHistory(id) {
    const file = historyFile(id)
    try {
      const data = await readJson(file)
      return { entries: Array.isArray(data.entries) ? data.entries : [] }
    } catch (err) {
      if (err.code === 'ENOENT') return { entries: [] }
      await fs.rename(file, `${file}.corrupt-${Date.now()}`).catch(() => {})
      return { entries: [] }
    }
  }

  return {
    // 存储根目录：health 桥透传给设置页只读展示（README「存储路径 host 注入值」）
    basePath,
    async listProjects() {
      const { index, upgraded } = await readIndexState()
      // v1 index.json 读入后升级落盘（契约 §2.1：自动补 version: 2 并保留 projects）
      if (upgraded) await enqueue(() => writeIndex(index))
      return index.projects
    },

    async createProject(name) {
      return enqueue(async () => {
        const project = emptyProject(uniqueId('proj_', new Set()), name)
        await saveProject(project)
        const index = await readIndex()
        index.projects.push({ id: project.id, name: project.name, updatedAt: project.updatedAt })
        await writeIndex(index)
        return project
      })
    },

    async renameProject(id, name) {
      return enqueue(async () => {
        const project = await loadProjectForWrite(id)
        project.name = name
        project.updatedAt = nowIso()
        await saveProject(project)
        const index = await readIndex()
        const entry = index.projects.find((p) => p.id === id)
        if (entry) {
          entry.name = name
          entry.updatedAt = project.updatedAt
        }
        await writeIndex(index)
        return project
      })
    },

    async deleteProject(id) {
      return enqueue(async () => {
        const dir = path.join(basePath, id)
        // 契约 §2：整目录先复制到 .trash/<projectId>-<ts>/ 再删除
        const trashDir = path.join(basePath, '.trash', `${id}-${Date.now()}`)
        await fs.mkdir(path.dirname(trashDir), { recursive: true })
        await fs.cp(dir, trashDir, { recursive: true, force: true })
        await fs.rm(dir, { recursive: true, force: true })
        const index = await readIndex()
        index.projects = index.projects.filter((p) => p.id !== id)
        await writeIndex(index)
        return { id }
      })
    },

    async getProject(id) {
      const loaded = await loadProjectData(id)
      if (!loaded) throw new Error(`project not found: ${id}`)
      // 损坏重建 / v1→v2 升级都落盘（读路径不入队直写，避免与写路径竞争）
      if (loaded.rebuild || loaded.upgrade) await enqueue(() => saveProject(loaded.data))
      return loaded.data
    },

    async saveEndpoint(projectId, endpoint) {
      return enqueue(async () => {
        const project = await loadProjectForWrite(projectId)
        const ts = nowIso()
        if (endpoint && hasRealId(endpoint.id)) {
          // 有 id 覆盖：保留 createdAt，更新 updatedAt（契约 §2）
          const prev = project.endpoints.find((e) => e.id === endpoint.id)
          const saved = {
            ...withEndpointDefaults(endpoint, prev),
            createdAt: prev ? prev.createdAt : ts,
            updatedAt: ts,
          }
          upsertById(project.endpoints, saved)
          project.updatedAt = ts
          await saveProject(project)
          return saved
        }
        const saved = {
          ...withEndpointDefaults(endpoint, null),
          id: uniqueId('ep_', new Set(project.endpoints.map((e) => e.id))),
          order: endpoint && endpoint.order != null ? Number(endpoint.order) : project.endpoints.length,
          createdAt: ts,
          updatedAt: ts,
        }
        project.endpoints.push(saved)
        project.updatedAt = ts
        await saveProject(project)
        return saved
      })
    },

    async deleteEndpoint(projectId, endpointId) {
      return enqueue(async () => {
        const project = await loadProjectForWrite(projectId)
        project.endpoints = project.endpoints.filter((e) => e.id !== endpointId)
        project.updatedAt = nowIso()
        await saveProject(project)
        return { id: endpointId }
      })
    },

    async saveFolder(projectId, folder) {
      return enqueue(async () => {
        const project = await loadProjectForWrite(projectId)
        const saved = folder && hasRealId(folder.id)
          ? { name: '', parentId: null, order: 0, ...folder }
          : {
              name: '',
              parentId: null,
              ...folder,
              id: uniqueId('fld_', new Set(project.folders.map((f) => f.id))),
              order: folder && folder.order != null ? Number(folder.order) : project.folders.length,
            }
        upsertById(project.folders, saved)
        project.updatedAt = nowIso()
        await saveProject(project)
        return saved
      })
    },

    async deleteFolder(projectId, folderId) {
      return enqueue(async () => {
        const project = await loadProjectForWrite(projectId)
        project.folders = project.folders.filter((f) => f.id !== folderId)
        // 契约 §2：子项 folderId/parentId 置 null，不级联删
        for (const ep of project.endpoints) if (ep.folderId === folderId) ep.folderId = null
        for (const f of project.folders) if (f.parentId === folderId) f.parentId = null
        for (const s of project.schemas) if (s.folderId === folderId) s.folderId = null
        project.updatedAt = nowIso()
        await saveProject(project)
        return { id: folderId }
      })
    },

    /** 契约 §3：目录/接口移动与排序（endpoint 的 parentId 落在 folderId 上）。 */
    async moveNode(projectId, move) {
      return enqueue(async () => {
        const project = await loadProjectForWrite(projectId)
        const m = move && typeof move === 'object' ? move : {}
        const id = m.id == null ? '' : String(m.id)
        if (id === '') throw new Error('moveNode: id is required')
        const parentId = m.parentId == null || m.parentId === '' ? null : String(m.parentId)
        // 目标不存在时幂等返回归一结果（契约未定义错误语义，桥侧通用透传不应因此 500）
        if (m.kind === 'endpoint') {
          const ep = project.endpoints.find((e) => e.id === id)
          if (!ep) return { kind: 'endpoint', id, parentId, order: m.order != null ? Number(m.order) : 0 }
          ep.folderId = parentId
          if (m.order != null) ep.order = Number(m.order)
          project.updatedAt = nowIso()
          await saveProject(project)
          return ep
        }
        if (m.kind !== 'folder') throw new Error(`moveNode: unknown kind ${m.kind}`)
        const folder = project.folders.find((f) => f.id === id)
        if (!folder) return { kind: 'folder', id, parentId, order: m.order != null ? Number(m.order) : 0 }
        folder.parentId = parentId
        if (m.order != null) folder.order = Number(m.order)
        project.updatedAt = nowIso()
        await saveProject(project)
        return folder
      })
    },

    /**
     * 导入 bundle 原子落盘：{ folders, endpoints, schemas } 一次 enqueue、一次 saveProject。
     * id 冲突（已有同 id）重分配并在 idMap 记旧→新；folder 的 parentId / endpoint 与 schema 的
     * folderId 按 idMap 改写，避免挂到旧 id 上。folders 按数组先序写入（父必在子前）。
     */
    async importBundle(projectId, bundle) {
      return enqueue(async () => {
        const project = await loadProjectForWrite(projectId)
        const b = bundle && typeof bundle === 'object' ? bundle : {}
        const ts = nowIso()
        const idMap = {}
        const taken = {
          fld_: new Set(project.folders.map((f) => f.id)),
          ep_: new Set(project.endpoints.map((e) => e.id)),
          sch_: new Set(project.schemas.map((s) => s.id)),
        }
        /** 取 id：未占用则原样保留，否则分配新 id 并记映射。 */
        const takeId = (raw, prefix) => {
          const old = raw && raw.id != null ? String(raw.id) : ''
          if (old !== '' && !taken[prefix].has(old)) {
            taken[prefix].add(old)
            return old
          }
          const next = uniqueId(prefix, taken[prefix])
          taken[prefix].add(next)
          if (old !== '') idMap[old] = next
          return next
        }
        /** 父引用改写：命中 idMap 用新 id，未在 bundle 内的既有 id 保持原值。 */
        const remap = (v) => {
          if (v == null || v === '') return null
          const key = String(v)
          return idMap[key] !== undefined ? idMap[key] : key
        }
        const rows = (v) => (Array.isArray(v) ? v : [])

        // 两遍处理：先给全部目录分配 id（建全 idMap），再 remap parentId，
        // 这样即使 bundle.folders 不是先序，子目录也能正确指向父目录的新 id。
        const folderRows = rows(b.folders).map((raw) => {
          const f = raw && typeof raw === 'object' ? raw : {}
          return { ...f, oldId: f.id == null ? '' : String(f.id), id: takeId(f, 'fld_') }
        })
        // 落盘顺序按父子深度稳定排序：bundle 乱序时 project.json 里仍是父在子前
        const byOldId = new Map()
        for (const f of folderRows) if (f.oldId !== '') byOldId.set(f.oldId, f)
        const depthOf = (f) => {
          let d = 0
          let cur = f
          const guard = new Set([f.oldId])
          while (cur && cur.parentId && byOldId.has(cur.parentId) && !guard.has(cur.parentId)) {
            guard.add(cur.parentId)
            cur = byOldId.get(cur.parentId)
            d += 1
          }
          return d
        }
        const ordered = folderRows
          .map((f, i) => ({ f, i, d: depthOf(f) }))
          .sort((x, y) => (x.d - y.d) || (x.i - y.i))
          .map((x) => x.f)
        const folders = ordered.map(({ oldId, ...f }) => ({
          name: '',
          order: 0,
          ...f,
          parentId: remap(f.parentId),
          createdAt: f.createdAt || ts,
          updatedAt: ts,
        }))
        const endpoints = rows(b.endpoints).map((raw) => {
          const ep = raw && typeof raw === 'object' ? raw : {}
          return {
            ...withEndpointDefaults(ep, null),
            id: takeId(ep, 'ep_'),
            folderId: remap(ep.folderId),
            createdAt: ts,
            updatedAt: ts,
          }
        })
        const schemas = rows(b.schemas).map((raw) => {
          const s = raw && typeof raw === 'object' ? raw : {}
          return {
            ...SCHEMA_DEFAULTS,
            ...s,
            id: takeId(s, 'sch_'),
            folderId: remap(s.folderId),
            createdAt: s.createdAt || ts,
            updatedAt: ts,
          }
        })

        project.folders.push(...folders)
        project.endpoints.push(...endpoints)
        project.schemas.push(...schemas)
        project.updatedAt = ts
        await saveProject(project)
        return { folders: folders.length, endpoints: endpoints.length, schemas: schemas.length, idMap }
      })
    },

    async saveSchema(projectId, schema) {
      return enqueue(async () => {
        const project = await loadProjectForWrite(projectId)
        const ts = nowIso()
        const prev = schema && hasRealId(schema.id)
          ? project.schemas.find((s) => s.id === schema.id)
          : undefined
        const saved = {
          ...SCHEMA_DEFAULTS,
          ...(prev || {}),
          ...(schema || {}),
          id: hasRealId(schema && schema.id)
            ? schema.id
            : uniqueId('sch_', new Set(project.schemas.map((s) => s.id))),
          createdAt: prev ? prev.createdAt : ts,
          updatedAt: ts,
        }
        upsertById(project.schemas, saved)
        project.updatedAt = ts
        await saveProject(project)
        return saved
      })
    },

    async deleteSchema(projectId, schemaId) {
      return enqueue(async () => {
        const project = await loadProjectForWrite(projectId)
        project.schemas = project.schemas.filter((s) => s.id !== schemaId)
        project.updatedAt = nowIso()
        await saveProject(project)
        return { id: schemaId }
      })
    },

    async saveEnvironment(projectId, env) {
      return enqueue(async () => {
        const project = await loadProjectForWrite(projectId)
        const prev = env && hasRealId(env.id)
          ? project.environments.find((e) => e.id === env.id)
          : undefined
        const saved = {
          ...ENV_DEFAULTS,
          ...(prev || {}),
          ...(env || {}),
          variables: Array.isArray((env && env.variables))
            ? env.variables
            : (prev && Array.isArray(prev.variables) ? prev.variables : []),
          id: hasRealId(env && env.id)
            ? env.id
            : uniqueId('env_', new Set(project.environments.map((e) => e.id))),
        }
        upsertById(project.environments, saved)
        project.updatedAt = nowIso()
        await saveProject(project)
        return saved
      })
    },

    async deleteEnvironment(projectId, envId) {
      return enqueue(async () => {
        const project = await loadProjectForWrite(projectId)
        project.environments = project.environments.filter((e) => e.id !== envId)
        project.updatedAt = nowIso()
        await saveProject(project)
        return { id: envId }
      })
    },

    async saveGlobals(projectId, globals) {
      return enqueue(async () => {
        const project = await loadProjectForWrite(projectId)
        project.globals = asVariables(globals)
        project.updatedAt = nowIso()
        await saveProject(project)
        return project.globals
      })
    },

    async saveProjectSettings(projectId, settings) {
      return enqueue(async () => {
        const project = await loadProjectForWrite(projectId)
        // 局部合并：只覆盖传入键，其余沿用（契约 §3 saveProjectSettings 语义）
        project.settings = {
          ...DEFAULT_SETTINGS,
          ...(project.settings || {}),
          ...(settings && typeof settings === 'object' ? settings : {}),
        }
        project.updatedAt = nowIso()
        await saveProject(project)
        return project.settings
      })
    },

    async saveFlow(projectId, flow) {
      return enqueue(async () => {
        const project = await loadProjectForWrite(projectId)
        project.flow = {
          name: '',
          steps: [],
          ...(flow && typeof flow === 'object' ? flow : {}),
        }
        project.updatedAt = nowIso()
        await saveProject(project)
        return project.flow
      })
    },

    async saveResponse(projectId, endpointId, response) {
      return enqueue(async () => {
        const project = await loadProjectForWrite(projectId)
        const ep = project.endpoints.find((e) => e.id === endpointId)
        // endpoint 不存在时幂等回构造结果、不落盘（桥侧通用透传不应 500，契约未定义错误语义）
        if (!ep) {
          return {
            ...RESPONSE_DEFAULTS,
            ...(response || {}),
            id: response && hasRealId(response.id) ? response.id : uniqueId('res_', new Set()),
          }
        }
        if (!Array.isArray(ep.responses)) ep.responses = []
        const prev = response && hasRealId(response.id)
          ? ep.responses.find((r) => r.id === response.id)
          : undefined
        const saved = {
          ...RESPONSE_DEFAULTS,
          ...(prev || {}),
          ...(response || {}),
          id: hasRealId(response && response.id)
            ? response.id
            : uniqueId('res_', new Set(ep.responses.map((r) => r.id))),
        }
        // 首个响应自动成为默认响应（契约 §2.2 isDefault）
        if (!prev && ep.responses.length === 0 && response && response.isDefault === undefined) {
          saved.isDefault = true
        }
        upsertById(ep.responses, saved)
        project.updatedAt = nowIso()
        await saveProject(project)
        return saved
      })
    },

    async deleteResponse(projectId, endpointId, responseId) {
      return enqueue(async () => {
        const project = await loadProjectForWrite(projectId)
        const ep = project.endpoints.find((e) => e.id === endpointId)
        // 同上：缺失 endpoint 幂等返回，不抛错
        if (!ep) return { id: responseId }
        ep.responses = (ep.responses || []).filter((r) => r.id !== responseId)
        project.updatedAt = nowIso()
        await saveProject(project)
        return { id: responseId }
      })
    },

    async getHistory(projectId) {
      if (!projectId) throw new Error('getHistory: projectId is required')
      return readHistory(projectId)
    },

    async appendHistory(projectId, entry) {
      return enqueue(async () => {
        if (!projectId) throw new Error('appendHistory: projectId is required')
        const project = await loadProjectForWrite(projectId)
        const history = await readHistory(projectId)
        const limit = Number((project.settings && project.settings.historyLimit) || DEFAULT_HISTORY_LIMIT)
        const e = entry && typeof entry === 'object' ? entry : {}
        const saved = {
          id: hasRealId(e.id)
            ? String(e.id)
            : uniqueId('his_', new Set(history.entries.map((x) => x.id))),
          at: e.at != null ? String(e.at) : nowIso(),
          method: e.method != null ? String(e.method).toUpperCase() : 'GET',
          url: e.url != null ? String(e.url) : '',
          status: e.status != null ? Number(e.status) : 0,
          timeMs: e.timeMs != null ? Number(e.timeMs) : 0,
          bodySize: e.bodySize != null ? Number(e.bodySize) : 0,
          request: e.request && typeof e.request === 'object' ? e.request : {},
          response: e.response && typeof e.response === 'object' ? e.response : {},
        }
        history.entries.push(saved)
        // 契约 §2.3：按 settings.historyLimit 保留最新 N 条（数组尾部为最新）
        const kept = limit > 0 ? history.entries.slice(-limit) : []
        await atomicWrite(historyFile(projectId), JSON.stringify({ entries: kept }, null, 2))
        return saved
      })
    },

    async clearHistory(projectId) {
      return enqueue(async () => {
        if (!projectId) throw new Error('clearHistory: projectId is required')
        const history = await readHistory(projectId)
        const cleared = history.entries.length
        await atomicWrite(historyFile(projectId), JSON.stringify({ entries: [] }, null, 2))
        return { cleared }
      })
    },

    /** 契约 §3：名称/url/description 命中，大小写不敏感；空关键字返回空集（不返回全部）。 */
    async search(projectId, keyword) {
      if (!projectId) throw new Error('search: projectId is required')
      const kw = typeof keyword === 'string' ? keyword.trim().toLowerCase() : ''
      if (kw === '') return { endpoints: [], schemas: [], folders: [] }
      const loaded = await loadProjectData(projectId)
      // 未知项目返回空结果而非 500：搜索是只读查询，项目缺失（页面初挂载带
      // mock 占位 id 自动查一次）不该炸成 INTERNAL，也不该把 console 染红。
      if (!loaded) return { endpoints: [], schemas: [], folders: [] }
      const project = loaded.data
      const hit = (...fields) =>
        fields.some((f) => typeof f === 'string' && f.toLowerCase().includes(kw))
      return {
        endpoints: clone(project.endpoints.filter((ep) => hit(ep.name, ep.url, ep.description))),
        schemas: clone(project.schemas.filter((s) => hit(s.name, s.description))),
        folders: clone(project.folders.filter((f) => hit(f.name))),
      }
    },
  }
}

/** endpoint 补默认：ENDPOINT_DEFAULTS ← 旧值 ← 新值，body/auth/mock 三层各自合并。 */
function withEndpointDefaults(patch, prev) {
  const p = patch && typeof patch === 'object' ? patch : {}
  const b = prev && typeof prev === 'object' ? prev : {}
  return {
    ...ENDPOINT_DEFAULTS,
    ...b,
    ...p,
    body: { ...ENDPOINT_DEFAULTS.body, ...(b.body || {}), ...(p.body || {}) },
    auth: { ...ENDPOINT_DEFAULTS.auth, ...(b.auth || {}), ...(p.auth || {}) },
    mock: { ...ENDPOINT_DEFAULTS.mock, ...(b.mock || {}), ...(p.mock || {}) },
  }
}
