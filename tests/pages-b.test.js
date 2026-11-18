/**
 * pages-b 页面套件（overview / env / schema / history / test / import / flow / settings / search）。
 *
 * 独立运行：node tests/pages-b.test.js
 * lead 接线：tests/run.js 里 import { tests } 后逐条 await t.fn()。
 *
 * 覆盖三层：
 *  1) 静态纪律：自注册、禁用 API（alert/confirm/prompt）、无内联颜色/字号字面量、
 *     高度只引用 --ctl-h/--row-h/--pill-h、真接 api、无 api 时标注「示例数据」；
 *  2) esbuild 真实打包（与 build.mjs 同配置：jsxFactory=createElement + inject jsx-shim）
 *     后 node:vm 加载，断言顶层入队与无 api 渲染降级；
 *  3) 纯函数单测 + 真接 api 交互（点击按钮断言 api 被调用、失败在页面内显示错误文案）。
 *
 * 依赖：仅 node 内置模块 + esbuild（与 build.mjs 同款解析：优先工作区 node_modules，
 * 回落 .research/sidebar/node_modules），不新增依赖。
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const here = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(here, '..')
const PAGES = path.join(REPO, 'src', 'client', 'pages')
const SHIM = path.join(REPO, 'src', 'client', 'jsx-shim.js')
const TMP = path.join(os.tmpdir(), 'postapi-pages-b-test')

/** esbuild 解析：与 build.mjs 同款（工作区 node_modules 优先，回落 .research/sidebar）。 */
function loadEsbuild() {
  const candidates = [path.join(REPO, 'node_modules'), path.join(REPO, '.research', 'sidebar')]
  for (const dir of candidates) {
    if (existsSync(path.join(dir, 'node_modules', 'esbuild'))) {
      return createRequire(path.join(dir, 'noop.js'))('esbuild')
    }
  }
  return createRequire(path.join(REPO, 'noop.js'))('esbuild')
}

const esbuild = loadEsbuild()

const PAGE_NAMES = ['overview', 'env', 'schema', 'history', 'test', 'import', 'flow', 'settings', 'search']
const PAGE_TITLE_RE = /总览|环境|数据模型|历史|测试|导入|流程|设置|搜索/

const TOKEN_HEIGHT_RE = /^var\(--(ctl|row|pill)-h\)$/
const AUTO_VALUES = new Set(['100%', 'auto', 'inherit', 'fit-content', 'min-content', 'max-content'])

/** 高度值合规判定：尺寸 token / 自适应关键字 / 含 token 或 100% 的 calc。 */
function checkHeightValue(v) {
  const s = String(v).trim()
  if (TOKEN_HEIGHT_RE.test(s)) return null
  if (AUTO_VALUES.has(s)) return null
  if (/^calc\(/.test(s) && /var\(--(ctl|row|pill)-h\)|100%/.test(s)) return null
  return '高度值未引用尺寸 token'
}

/* ---------------- 静态扫描 ---------------- */

/** 单页静态纪律检查，返回违规说明数组（空数组即通过）。 */
function staticChecks(name, src) {
  const fails = []
  if (!src.includes('__postapiQueue')) fails.push('缺少 __postapiQueue 自注册入口')
  if (!src.includes("push(['" + name + "'")) fails.push('自注册名不是 ' + name)
  if (/\balert\s*\(/.test(src)) fails.push('出现 alert(')
  if (/\bconfirm\s*\(/.test(src)) fails.push('出现 confirm(')
  if (/\bprompt\s*\(/.test(src)) fails.push('出现 prompt(')
  const colorHits = src.match(/#[0-9a-fA-F]{3,8}\b|rgba?\s*\(/g)
  if (colorHits) fails.push('内联颜色字面量：' + [...new Set(colorHits)].join(','))
  if (/font-?[sS]ize\s*:\s*['"\d]/.test(src)) fails.push('内联字号字面量')
  if (/font-?[wW]eight\s*:\s*\d/.test(src)) fails.push('内联字重字面量')
  let m
  const H = /\b(minHeight|maxHeight|height)\s*:\s*['"]([^'"]+)['"]/g
  while ((m = H.exec(src))) {
    const err = checkHeightValue(m[2])
    if (err) fails.push('内联 ' + m[1] + ': ' + m[2] + ' — ' + err)
  }
  if (!/export function \w+Page/.test(src)) fails.push('缺少页面组件导出')
  if (!/api\.(storage|request|import|export|codegen|test|schema)/.test(src) && !/props\.api/.test(src)) {
    fails.push('未真接 api')
  }
  if (!/示例数据/.test(src)) fails.push('缺少「示例数据」标注')
  return fails
}

/* ---------------- react stub ---------------- */

/** 基础 stub：无状态，够用于「无 api 渲染降级」类断言。 */
const reactStub = {
  createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
  Fragment: 'Fragment',
  useState: (v) => [typeof v === 'function' ? v() : v, () => {}],
  useEffect: () => {},
  useRef: (v) => ({ current: v }),
  useMemo: (fn) => fn(),
  useCallback: (fn) => fn(),
  useLayoutEffect: () => {},
  useSyncExternalStore: (_s, get) => get(),
}
// esbuild CJS interop 把 import React from 'react' 折成 __toESM(require('react')).default，
// stub 自身提供 default 指向自己（真实 react 也是 module.exports 形态）。
reactStub.default = reactStub

// require 返回当前生效的 stub（drive 会切换 activeStub），页面模块拿到的 hooks 才带状态记录能力。
let activeStub = reactStub
const requireShim = (n) => {
  if (n === 'react') return activeStub
  throw new Error('意外的 require: ' + n)
}

/* ---------------- 打包 + vm 加载 ---------------- */

/** 单页打包到临时目录并 vm 加载，返回 { exports, queue, code }。 */
async function loadPage(name) {
  if (!existsSync(TMP)) mkdirSync(TMP, { recursive: true })
  const outfile = path.join(TMP, name + '.cjs')
  await esbuild.build({
    entryPoints: [path.join(PAGES, name + '.jsx')],
    outfile,
    bundle: true,
    format: 'cjs',
    platform: 'browser',
    target: ['es2022'],
    // 与 build.mjs 一致：classic transform + 显式 createElement/Fragment 工厂，
    // 由 inject 的 jsx-shim 提供，产物不出现裸 React.createElement。
    jsx: 'transform',
    jsxFactory: 'createElement',
    jsxFragment: 'Fragment',
    inject: [SHIM],
    loader: { '.js': 'jsx' },
    external: ['react'],
    logLevel: 'silent',
  })
  const code = readFileSync(outfile, 'utf8')
  const mod = { exports: {} }
  const win = { __postapiQueue: [] }
  vm.runInNewContext(code, { window: win, module: mod, exports: mod.exports, require: requireShim, console })
  return { exports: mod.exports, queue: win.__postapiQueue, code }
}

/* ---------------- 渲染树工具 ---------------- */

/** 取根元素 data-page 与全部文本（扁平化）。 */
function flatten(node, acc = []) {
  if (node === null || node === undefined || node === false) return acc
  if (Array.isArray(node)) { for (const n of node) flatten(n, acc); return acc }
  if (typeof node === 'string' || typeof node === 'number') { acc.push(String(node)); return acc }
  if (typeof node !== 'object') return acc
  if (node.props && node.props['data-page']) acc.push('DATA_PAGE=' + node.props['data-page'])
  if (node.children) flatten(node.children, acc)
  return acc
}

function collectNodes(node, acc = []) {
  if (node === null || node === undefined || node === false) return acc
  if (Array.isArray(node)) { for (const n of node) collectNodes(n, acc); return acc }
  if (typeof node !== 'object') return acc
  acc.push(node)
  if (node.children) collectNodes(node.children, acc)
  return acc
}

function collectText(node) {
  if (node === null || node === undefined || node === false) return ''
  if (Array.isArray(node)) return node.map(collectText).join('')
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (typeof node !== 'object') return ''
  return collectText(node.children)
}

function buttonByText(tree, text) {
  const nodes = collectNodes(tree).filter((n) => n.type === 'button')
  const hit = nodes.find((n) => collectText(n).includes(text))
  if (!hit) throw new Error('未找到按钮：' + text + '，现有 ' + JSON.stringify(nodes.map((n) => collectText(n)).slice(0, 24)))
  return hit
}

/* ---------------- 有状态 stub（可断言 setState 与重渲染） ---------------- */

/**
 * 可控 react stub：useState 有真实 slot 与重渲染能力（setter 写 slot 并标脏），
 * useEffect 按 deps 浅比较去重并收集 promise，从而可断言
 * 「api 被调用」与「失败在页面内显示错误文案」。
 */
function makeStub() {
  const log = { setState: [], effects: [], slots: [], effectSlots: [], dirty: false, cursor: 0, effectCursor: 0 }
  const stub = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
    Fragment: 'Fragment',
    useState: (init) => {
      const i = log.cursor++
      if (i >= log.slots.length) log.slots[i] = { value: typeof init === 'function' ? init() : init }
      const slot = log.slots[i]
      const set = (nv) => {
        const next = typeof nv === 'function' ? nv(slot.value) : nv
        log.setState.push(next)
        if (next !== slot.value) { slot.value = next; log.dirty = true }
      }
      return [slot.value, set]
    },
    useEffect: (fn, deps) => {
      const i = log.effectCursor++
      const prev = log.effectSlots[i]
      const same = prev && Array.isArray(deps) && Array.isArray(prev.deps)
        && deps.length === prev.deps.length && deps.every((d, k) => d === prev.deps[k])
      if (same) return
      log.effectSlots[i] = { deps: Array.isArray(deps) ? deps.slice() : null }
      const x = fn()
      if (x && typeof x.then === 'function') log.effects.push(x)
    },
    useRef: (v) => ({ current: v }),
    useMemo: (fn) => fn(),
    useCallback: (fn) => fn(),
    useLayoutEffect: () => {},
    useSyncExternalStore: (_s, get) => get(),
    log,
  }
  stub.default = stub
  return stub
}

/** 所有 setState 值的可读文本（字符串原样、对象 JSON）。 */
function stateTexts(stub) {
  return stub.log.setState.map((v) => (typeof v === 'string' ? v : JSON.stringify(v)))
}

/** 所有 setState 的原始值（判断数组/对象态变化用）。 */
function stateValues(stub) {
  return stub.log.setState
}

function pageFnOf(mod, name) {
  const e = Object.entries(mod.exports).find(([k, v]) => /Page$/.test(k) && typeof v === 'function')
  if (!e) throw new Error(name + ' 无 *Page 导出')
  return e[1]
}

/** 单轮渲染：重置 hook 游标、跑 effect，等 setState 数量稳定（异步 effect 链落地）。 */
async function renderOnce(Page, props, stub) {
  stub.log.cursor = 0
  stub.log.effectCursor = 0
  stub.log.effects = []
  const tree = Page(props)
  // 页面 boot effect 是 async 函数且不返回 promise（真实 React 也是这个形态），
  // 故不能只等 log.effects：要等 setState 数量连续两次让出后不再增长。
  let last = -1
  for (let i = 0; i < 24; i++) {
    const n = stub.log.setState.length
    await Promise.allSettled(stub.log.effects)
    await new Promise((res) => setImmediate(res))
    await new Promise((res) => setTimeout(res, 0))
    if (stub.log.setState.length === n && n === last) break
    last = n
  }
  return tree
}

/** 渲染到收敛（setState 不再变化即停，最多 8 轮）。 */
async function settle(Page, props, stub) {
  let tree = null
  for (let round = 0; round < 8; round++) {
    tree = await renderOnce(Page, props, stub)
    if (!stub.log.dirty) break
    stub.log.dirty = false
  }
  return tree
}

/**
 * 渲染 → 收敛（boot effect 落地）→ 执行 act（点击等交互）→ 再收敛。
 * 两段收敛是必要的：页面交互读的是最近一次渲染闭包里的 state，
 * 与真实 React「onChange 先重渲染、再点按钮」的顺序一致。
 * act 签名：(tree, stub, rerender) => Promise<void>
 */
async function drive(name, api, route, act) {
  const stub = makeStub()
  activeStub = stub
  const mod = await loadPage(name)
  const Page = pageFnOf(mod, name)
  const props = { route: route || { name, arg: '', query: '' }, api }
  let tree = await settle(Page, props, stub)
  if (act) {
    const rerender = async () => {
      stub.log.dirty = true
      tree = await settle(Page, props, stub)
      return tree
    }
    await act(tree, stub, rerender)
    stub.log.dirty = true
    tree = await settle(Page, props, stub)
  }
  stub.log.cursor = 0
  return { tree, stub, mod }
}

/** 一个「方法齐全」的 storage 假实现（可追加覆盖，并记录调用）。 */
function okStorage(extra) {
  const calls = []
  const base = {
    listProjects: async () => { calls.push(['listProjects']); return [{ id: 'p1', name: 'P1', updatedAt: '2026-11-17T00:00:00Z' }] },
    getProject: async (id) => {
      calls.push(['getProject', id])
      return {
        id,
        name: 'P1',
        endpoints: [{ id: 'ep1', name: 'E', method: 'GET', url: '/a', updatedAt: '2026-11-17T00:00:00Z' }],
        testCases: [{ id: 'tc_1001', name: 'C1', endpointId: 'ep1', assertions: [], extractors: [] }],
        testScenarios: [{ id: 'ts_1001', name: 'S1', steps: [] }],
        settings: { mockPort: 4010, proxyUrl: '', requestTimeoutMs: 30000, historyLimit: 200 },
        environments: [{ id: 'env1', name: 'dev', baseUrl: 'http://x', variables: [] }],
        globals: { variables: [] },
        schemas: [],
      }
    },
  }
  return { storage: Object.assign(base, extra || {}), calls }
}

/* ---------------- 用例 ---------------- */

export const tests = []
const t = (name, fn) => tests.push({ name: 'pages-b: ' + name, fn })

/** 打包结果缓存：静态/纯函数用例按页懒加载一次。 */
const loaded = {}
async function pageOf(name) {
  if (!loaded[name]) loaded[name] = await loadPage(name)
  return loaded[name]
}

t('九页文件齐全', () => {
  for (const n of PAGE_NAMES) {
    const p = path.join(PAGES, n + '.jsx')
    if (!existsSync(p)) throw new Error('缺文件 ' + p)
  }
})

for (const name of PAGE_NAMES) {
  t(name + '.jsx 静态纪律：自注册/禁用 API/无颜色字号字面量/高度 token/api 真接/示例数据标注', () => {
    const src = readFileSync(path.join(PAGES, name + '.jsx'), 'utf8')
    const fails = staticChecks(name, src)
    if (fails.length) throw new Error(fails.join(' | '))
  })
}

for (const name of PAGE_NAMES) {
  t(name + '.jsx 打包：esbuild 通过、产物无裸 React.createElement、顶层入队名正确', async () => {
    const res = await loadPage(name)
    loaded[name] = res
    if (res.code.includes('React.createElement')) {
      throw new Error('产物出现裸 React.createElement（应用 createElement 工厂 + jsx-shim）')
    }
    const entry = res.queue.find((e) => e[0] === name)
    if (!entry) throw new Error('队列中无 ' + name + '，实际 ' + JSON.stringify(res.queue.map((e) => e[0])))
    if (typeof entry[1] !== 'function') throw new Error(name + ' 注册项不是组件函数')
  })
}

for (const name of PAGE_NAMES) {
  t(name + ' 渲染：无 api 时降级 mock，根 data-page 正确且含标题与示例数据标注', async () => {
    const res = await pageOf(name)
    const Page = pageFnOf(res, name)
    const tree = Page({ route: { name, arg: '', query: 'q=order' }, api: undefined })
    const flat = flatten(tree)
    if (!flat.includes('DATA_PAGE=' + name)) {
      throw new Error('根元素 data-page 不是 ' + name + '：' + JSON.stringify(flat.slice(0, 6)))
    }
    const text = flat.join(' ')
    if (!PAGE_TITLE_RE.test(text)) throw new Error('未渲染页面标题')
    if (!/示例数据/.test(text)) throw new Error('未渲染「示例数据」标注')
  })
}

/* ---- 纯函数 ---- */

const ex = async (n, k) => (await pageOf(n)).exports[k]

t('overview.fmtTime：ISO 截断为 yyyy-MM-dd HH:mm，空值回落 -', async () => {
  const f = await ex('overview', 'fmtTime')
  if (f('2026-11-17T10:20:00.000Z') !== '2026-11-17 10:20') throw new Error('格式化错误：' + f('2026-11-17T10:20:00.000Z'))
  if (f('') !== '-' || f(null) !== '-') throw new Error('空值未回落 -')
})

t('overview.recentEndpoints：按 updatedAt 降序取前 N 条', async () => {
  const f = await ex('overview', 'recentEndpoints')
  const project = { endpoints: [
    { id: 'a', updatedAt: '2026-01-01T00:00:00Z' },
    { id: 'b', updatedAt: '2026-03-01T00:00:00Z' },
    { id: 'c', updatedAt: '2026-02-01T00:00:00Z' },
  ] }
  const got = f(project, 2).map((e) => e.id)
  if (got.join(',') !== 'b,c') throw new Error('排序/截断错误：' + got.join(','))
  if (f(null).length !== 0) throw new Error('空项目未返回空数组')
})

t('overview.projectCards：补接口计数与名称回落', async () => {
  const f = await ex('overview', 'projectCards')
  const got = f([{ id: 'p1', name: 'A', endpoints: [{}, {}] }, { id: 'p2', endpoints: [] }])
  if (got[0].endpointCount !== 2) throw new Error('计数错误')
  if (got[1].name !== 'p2') throw new Error('名称未回落 id')
  if (f(undefined).length !== 0) throw new Error('非数组未返回空数组')
})

t('env.normalizeVars：补 enabled/secret 默认值并丢弃非法项', async () => {
  const f = await ex('env', 'normalizeVars')
  const got = f([{ key: 'a', value: 1 }, null, { key: 'b', enabled: false, secret: true }])
  if (got.length !== 2) throw new Error('未过滤非法项')
  if (got[0].enabled !== true || got[0].secret !== false || got[0].value !== '1') throw new Error('默认值错误：' + JSON.stringify(got[0]))
  if (got[1].enabled !== false || got[1].secret !== true) throw new Error('显式值被覆盖')
})

t('env.priorityRows：四级优先级 局部>环境>全局>动态', async () => {
  const rows = (await ex('env', 'priorityRows'))()
  if (rows.length !== 4) throw new Error('优先级行数错误')
  if (!rows[0].scope.includes('局部') || !rows[1].scope.includes('环境') || !rows[2].scope.includes('全局')) {
    throw new Error('优先级顺序错误')
  }
})

t('env.envSummary：摘要含名称/baseUrl/变量数/默认标记', async () => {
  const f = await ex('env', 'envSummary')
  const got = f([{ id: 'e1', name: 'dev', baseUrl: 'http://x', isDefault: true, variables: [{}, {}] }])
  if (got[0].varCount !== 2 || got[0].isDefault !== true || got[0].baseUrl !== 'http://x') throw new Error('摘要字段错误')
  if (f(null).length !== 0) throw new Error('非数组未返回空数组')
})

t('schema.localValidateSchema：非法 JSON/非对象/缺 shape/未知 type 均报错，合法通过', async () => {
  const f = await ex('schema', 'localValidateSchema')
  if (f('{bad').ok !== false) throw new Error('非法 JSON 未报错')
  if (f('[]').ok !== false) throw new Error('数组未报错')
  if (f('{"foo":1}').ok !== false) throw new Error('缺 shape 未报错')
  if (f('{"type":"objct"}').ok !== false) throw new Error('未知 type 未报错')
  const ok = f('{"type":"object","properties":{"a":{"type":"string"}}}')
  if (ok.ok !== true || ok.schema.type !== 'object') throw new Error('合法 schema 未通过')
})

t('schema.localExampleFromSchema：example 优先、enum 取首项、object/array 递归', async () => {
  const f = await ex('schema', 'localExampleFromSchema')
  if (f({ type: 'string', example: 'x' }) !== 'x') throw new Error('example 未优先')
  if (f({ type: 'string', enum: ['a', 'b'] }) !== 'a') throw new Error('enum 未取首项')
  const obj = f({ type: 'object', properties: { n: { type: 'number' }, ok: { type: 'boolean' } } })
  if (obj.n !== 0 || obj.ok !== true) throw new Error('object 递归错误：' + JSON.stringify(obj))
  const arr = f({ type: 'array', items: { type: 'string' } })
  if (!Array.isArray(arr) || arr.length !== 1) throw new Error('array 生成错误')
  if (f(null) !== null) throw new Error('null schema 未回落 null')
})

t('history.fmtDateTime / fmtSize：时间截断与 B/KB/MB 换算', async () => {
  const fd = await ex('history', 'fmtDateTime')
  const fs = await ex('history', 'fmtSize')
  if (fd('2026-11-17T10:20:11.000Z') !== '2026-11-17 10:20:11') throw new Error('时间格式错误')
  if (fd('') !== '-') throw new Error('空时间未回落 -')
  if (fs(512) !== '512 B' || fs(2048) !== '2.0 KB' || fs(3 * 1024 * 1024) !== '3.0 MB') throw new Error('大小换算错误')
  if (fs('x') !== '-' || fs(-1) !== '-') throw new Error('非法大小未回落 -')
})

t('history.statusTone：2xx success / 4xx warning / 其他 error', async () => {
  const f = await ex('history', 'statusTone')
  if (f(200) !== 'success' || f(404) !== 'warning' || f(500) !== 'error' || f(0) !== 'error') throw new Error('分组错误')
})

t('history.replayPayload：折算成 debug 请求快照', async () => {
  const f = await ex('history', 'replayPayload')
  const got = f({ method: 'POST', url: 'http://x/a', request: { method: 'PUT', url: '/b', headers: [{ key: 'a' }], body: '{"k":1}' } })
  if (got.method !== 'PUT' || got.url !== '/b' || got.body !== '{"k":1}') throw new Error('折算错误：' + JSON.stringify(got))
  const bare = f({ method: 'GET', url: '/c' })
  if (bare.method !== 'GET' || bare.headers.length !== 0 || bare.body !== '') throw new Error('缺 request 时未回落')
})

t('test.normalizeAssertions：补默认 source/op 并过滤非法项', async () => {
  const f = await ex('test', 'normalizeAssertions')
  const got = f([{ source: 'bad', op: 'nope', path: 'data.id' }, null])
  if (got.length !== 1) throw new Error('未过滤非法项')
  if (got[0].source !== 'status' || got[0].op !== 'eq' || got[0].path !== 'data.id') throw new Error('默认值错误')
})

t('test.summarizeResult：通过计数、失败明细与耗时', async () => {
  const f = await ex('test', 'summarizeResult')
  const r1 = f({ passed: false, results: [{ name: 'a', passed: true }, { name: 'b', passed: false, error: 'x' }], durationMs: 12 })
  if (r1.passed !== false || r1.total !== 2 || r1.passedCount !== 1 || r1.failedCount !== 1 || r1.durationMs !== 12) {
    throw new Error('汇总错误：' + JSON.stringify(r1))
  }
  const r2 = f({ steps: [{ id: 's1', passed: true }] })
  if (r2.passed !== true || r2.total !== 1) throw new Error('steps 形态未兜底')
  const r3 = f({})
  if (r3.passed !== false || r3.total !== 0) throw new Error('空结果未回落失败')
})

t('test.summarizeResult：透传 error 字段', async () => {
  const f = await ex('test', 'summarizeResult')
  const r = f({ passed: false, results: [], error: 'runner 不可用' })
  if (r.error !== 'runner 不可用') throw new Error('error 未透传')
})

t('test.casesOf / scenariosOf：顶层优先，回落 settings 子键，过滤非法项', async () => {
  const cf = await ex('test', 'casesOf')
  const sf = await ex('test', 'scenariosOf')
  const a = cf({ testCases: [{ id: 'c1' }], settings: { testCases: [{ id: 'c2' }] } })
  if (a.length !== 1 || a[0].id !== 'c1') throw new Error('顶层未优先')
  const b = cf({ settings: { testCases: [{ id: 'c3' }, null] } })
  if (b.length !== 1 || b[0].id !== 'c3') throw new Error('settings 回落失败')
  if (cf(null).length !== 0) throw new Error('空项目未返回空数组')
  const s = sf({ settings: { testScenarios: [{ id: 's1' }] } })
  if (s.length !== 1 || s[0].id !== 's1') throw new Error('场景回落失败')
})

t('import.resultText：字符串原样、对象 JSON 美化、空值空串', async () => {
  const f = await ex('import', 'resultText')
  if (f('abc') !== 'abc') throw new Error('字符串未原样')
  if (f({ a: 1 }) !== '{\n  "a": 1\n}') throw new Error('对象未美化：' + f({ a: 1 }))
  if (f(null) !== '' || f(undefined) !== '') throw new Error('空值未回落空串')
})

t('import.importSummary：接口/目录/模型计数', async () => {
  const f = await ex('import', 'importSummary')
  const got = f({ endpoints: [{}, {}], folders: [{}], schemas: [] })
  if (got.endpoints !== 2 || got.folders !== 1 || got.schemas !== 0) throw new Error('计数错误：' + JSON.stringify(got))
  if (f(null).endpoints !== 0) throw new Error('空输入未回落 0')
})

t('search.groupResults：三组归一、字段提取与非法项容错', async () => {
  const f = await ex('search', 'groupResults')
  const got = f({ endpoints: [{ id: 'e1', name: 'A', method: 'GET', url: '/a' }], schemas: [{ id: 's1' }] })
  if (got.endpoints[0].title !== 'A' || got.endpoints[0].method !== 'GET') throw new Error('接口字段错误')
  if (got.schemas[0].title !== 's1') throw new Error('模型名称未回落 id')
  if (!Array.isArray(got.folders) || got.folders.length !== 0) throw new Error('缺组未归空数组')
  const wrapped = f({ data: { endpoints: [{ id: 'x' }] } })
  if (wrapped.endpoints.length !== 1) throw new Error('{data} 形态未兜底')
})

t('search.hasKeyword：空白视为无关键字', async () => {
  const f = await ex('search', 'hasKeyword')
  if (f('  ') !== false || f('') !== false || f(null) !== false) throw new Error('空白未判空')
  if (f(' a ') !== true) throw new Error('非空未通过')
})

t('settings.normalizeSettings：数字夹取区间、代理字符串化、缺省回落默认值', async () => {
  const f = await ex('settings', 'normalizeSettings')
  const got = f({ mockPort: 99999, requestTimeoutMs: 10, historyLimit: 0, proxyUrl: 123 })
  if (got.mockPort !== 65535) throw new Error('端口未上限夹取：' + got.mockPort)
  if (got.requestTimeoutMs !== 1000) throw new Error('超时未下限夹取：' + got.requestTimeoutMs)
  if (got.historyLimit !== 1) throw new Error('历史条数未下限夹取：' + got.historyLimit)
  if (got.proxyUrl !== '123') throw new Error('代理未字符串化')
  const dflt = f(null)
  if (dflt.mockPort !== 4010 || dflt.requestTimeoutMs !== 30000 || dflt.historyLimit !== 200) {
    throw new Error('默认值错误：' + JSON.stringify(dflt))
  }
})

t('settings.storeRootOf：注入值优先，缺省回落契约默认路径', async () => {
  const f = await ex('settings', 'storeRootOf')
  if (f('D:/x') !== 'D:/x') throw new Error('注入值未优先')
  if (f('') !== 'E:/User/文档/api') throw new Error('空注入未回落默认：' + f(''))
  if (f(undefined) !== 'E:/User/文档/api') throw new Error('undefined 未回落默认')
})

t('flow.normalizeSteps：补 action 默认、丢弃非法项、保留扩展字段', async () => {
  const f = await ex('flow', 'normalizeSteps')
  const got = f([{ actor: 'A', action: 'bogus', message: 'm', op: 'alt', guard: '[x]', divider: true }, null, { actor: 'B', headline: true }])
  if (got.length !== 2) throw new Error('未过滤非法项')
  if (got[0].action !== 'call') throw new Error('action 未回落 call')
  if (got[0].op !== 'alt' || got[0].guard !== '[x]' || got[0].divider !== true) throw new Error('扩展字段丢失')
  if (got[1].headline !== true) throw new Error('headline 丢失')
  if ('op' in got[1]) throw new Error('无 op 时不应带 op 字段')
})

t('flow.flowPayload：载荷结构 name + 规整 steps', async () => {
  const f = await ex('flow', 'flowPayload')
  const got = f('时序', [{ actor: 'A', action: 'return', target: 'B', message: 'm' }])
  if (got.name !== '时序' || got.steps.length !== 1 || got.steps[0].action !== 'return') {
    throw new Error('载荷错误：' + JSON.stringify(got))
  }
  if (f(undefined, undefined).steps.length !== 0) throw new Error('空 steps 未回落空数组')
})

/* ---- 真接 api 交互 ---- */

t('overview 真接 api：listProjects 被调用；失败在页面内显示错误文案', async () => {
  const a = okStorage()
  await drive('overview', { storage: a.storage })
  if (!a.calls.some((c) => c[0] === 'listProjects')) throw new Error('未调用 listProjects')
  const r2 = await drive('overview', { storage: { listProjects: async () => { throw new Error('boom') } } })
  const texts = stateTexts(r2.stub).join('|')
  if (!texts.includes('boom')) throw new Error('失败未在页面内显示错误文案，setState: ' + texts)
  if (!texts.includes('加载项目列表失败')) throw new Error('错误文案缺少上下文')
})

t('overview 真接 api：空项目名被拦截（页面内提示，不调用 createProject）', async () => {
  const calls = []
  const r = await drive('overview', { storage: okStorage({ createProject: async () => { calls.push('createProject') } }).storage },
    null, async (tree) => { await buttonByText(tree, '新建').props.onClick() })
  if (calls.length > 0) throw new Error('空名仍调用了 createProject')
  if (!stateTexts(r.stub).join('|').includes('项目名不能为空')) throw new Error('未提示项目名为空')
})

t('overview 真接 api：非空项目名调用 createProject 并给出创建提示', async () => {
  const calls = []
  const r = await drive('overview', {
    storage: okStorage({ createProject: async (name) => { calls.push(name); return { id: 'p9', name } } }).storage,
  }, null, async (tree, stub, rerender) => {
    const input = collectNodes(tree).find((n) => n.type === 'input' && n.props.placeholder === '项目名')
    input.props.onChange({ target: { value: '新项目X' } })
    const tree2 = await rerender()
    await buttonByText(tree2, '新建').props.onClick()
  })
  if (calls.join(',') !== '新项目X') throw new Error('createProject 未按名调用：' + JSON.stringify(calls))
  if (!stateTexts(r.stub).join('|').includes('已创建')) throw new Error('创建成功提示缺失')
})

t('env 真接 api：saveEnvironment 缺失时报错，存在时被调用且变量已规整', async () => {
  const r1 = await drive('env', { storage: {
    listProjects: async () => [{ id: 'p1', name: 'P1' }],
    getProject: async () => ({ id: 'p1', environments: [{ id: 'e1', name: 'dev', variables: [] }], globals: { variables: [] } }),
  } }, null, async (tree) => { await buttonByText(tree, '保存环境').props.onClick() })
  if (!stateTexts(r1.stub).join('|').includes('saveEnvironment')) throw new Error('缺失方法未提示')

  const saved = []
  await drive('env', { storage: {
    listProjects: async () => [{ id: 'p1', name: 'P1' }],
    getProject: async () => ({
      id: 'p1',
      environments: [{ id: 'e1', name: 'dev', baseUrl: 'http://x', variables: [{ key: 'k', value: 'v' }] }],
      globals: { variables: [] },
    }),
    saveEnvironment: async (pid, env) => { saved.push([pid, env]); return env },
  } }, null, async (tree) => { await buttonByText(tree, '保存环境').props.onClick() })
  if (saved.length !== 1) throw new Error('saveEnvironment 调用次数 ' + saved.length)
  if (saved[0][0] !== 'p1') throw new Error('projectId 错误：' + saved[0][0])
  const v = saved[0][1].variables[0]
  if (v.enabled !== true || v.secret !== false) throw new Error('变量未规整：' + JSON.stringify(v))
})

t('env 真接 api：saveGlobals 被调用且 payload 为 { variables[] }', async () => {
  const saved = []
  await drive('env', { storage: {
    listProjects: async () => [{ id: 'p1', name: 'P1' }],
    getProject: async () => ({
      id: 'p1',
      environments: [{ id: 'e1', name: 'dev', variables: [] }],
      globals: { variables: [{ key: 'g', value: '1' }] },
    }),
    saveGlobals: async (pid, g) => { saved.push([pid, g]); return g },
  } }, null, async (tree) => { await buttonByText(tree, '保存全局').props.onClick() })
  if (saved.length !== 1) throw new Error('saveGlobals 未调用')
  if (!Array.isArray(saved[0][1].variables)) throw new Error('payload 结构错误')
})

t('schema 真接 api：api.schema.validate 被调用；缺失时本地降级并说明', async () => {
  const seen = []
  const r1 = await drive('schema', {
    storage: {
      listProjects: async () => [{ id: 'p1', name: 'P1' }],
      getProject: async () => ({ id: 'p1', schemas: [{ id: 's1', name: 'S', jsonSchema: { type: 'object' } }] }),
    },
    schema: { validate: async (arg) => { seen.push(arg); return { ok: true, message: 'api-ok' } } },
  }, null, async (tree) => { await buttonByText(tree, '校验').props.onClick() })
  if (seen.length !== 1) throw new Error('api.schema.validate 未被调用')
  if (!stateTexts(r1.stub).join('|').includes('api-ok')) throw new Error('校验结果未显示：' + stateTexts(r1.stub).join('|'))

  const r2 = await drive('schema', {
    storage: { listProjects: async () => [{ id: 'p1', name: 'P1' }], getProject: async () => ({ id: 'p1', schemas: [] }) },
  }, null, async (tree) => { await buttonByText(tree, '校验').props.onClick() })
  if (!stateTexts(r2.stub).join('|').includes('api.schema.validate 未提供')) throw new Error('降级说明缺失')
})

t('schema 真接 api：saveSchema 被调用且 payload 含 jsonSchema 与 name', async () => {
  const saved = []
  await drive('schema', { storage: {
    listProjects: async () => [{ id: 'p1', name: 'P1' }],
    getProject: async () => ({ id: 'p1', schemas: [] }),
    saveSchema: async (pid, s) => { saved.push([pid, s]); return { ...s, id: 'sch_new' } },
  } }, null, async (tree) => { await buttonByText(tree, '保存').props.onClick() })
  if (saved.length !== 1) throw new Error('saveSchema 未调用')
  if (!saved[0][1].jsonSchema || typeof saved[0][1].name !== 'string') {
    throw new Error('payload 结构错误：' + JSON.stringify(saved[0][1]))
  }
})

t('history 真接 api：getHistory 被调用；首次点清空只提示不调用', async () => {
  const calls = []
  const r = await drive('history', { storage: {
    listProjects: async () => [{ id: 'p1', name: 'P1' }],
    getHistory: async (id) => {
      calls.push(['getHistory', id])
      return { entries: [{ id: 'h1', at: '2026-11-17T10:00:00Z', method: 'GET', url: '/a', status: 200, timeMs: 5, bodySize: 10 }] }
    },
    clearHistory: async (id) => { calls.push(['clearHistory', id]); return { cleared: 1 } },
  } }, null, async (tree) => { await buttonByText(tree, '清空历史').props.onClick() })
  if (!calls.some((c) => c[0] === 'getHistory')) throw new Error('未调用 getHistory')
  if (calls.some((c) => c[0] === 'clearHistory')) throw new Error('首次点击即清空（缺两段式确认）')
  if (!stateTexts(r.stub).join('|').includes('确认清空')) throw new Error('两段式确认提示缺失')
})

t('test 真接 api：api.test.runCase 缺失时报错，存在时被调用且结果进页面', async () => {
  const r1 = await drive('test', { storage: okStorage().storage }, null, async (tree) => {
    await buttonByText(tree, '运行用例').props.onClick()
  })
  if (!stateTexts(r1.stub).join('|').includes('runCase')) throw new Error('缺失方法未提示')

  const ran = []
  const r2 = await drive('test', {
    storage: okStorage().storage,
    test: { runCase: async (pid, cid) => { ran.push([pid, cid]); return { passed: true, results: [{ name: 'a', passed: true }], durationMs: 7 } } },
  }, null, async (tree) => { await buttonByText(tree, '运行用例').props.onClick() })
  if (ran.length !== 1) throw new Error('runCase 未调用')
  const shown = stateValues(r2.stub).find((v) => v && typeof v === 'object' && v.kind === 'case')
  if (!shown || shown.passed !== true || shown.total !== 1) throw new Error('结果未展示：' + JSON.stringify(shown))
})

t('test 真接 api：测试场景页签可切换', async () => {
  const r = await drive('test', { storage: okStorage().storage }, null, async (tree) => {
    const tabBtn = collectNodes(tree).find((n) => n.type === 'button' && collectText(n) === '测试场景')
    tabBtn.props.onClick()
  })
  if (!stateValues(r.stub).includes('scenarios')) throw new Error('未切到场景页签：' + stateTexts(r.stub).join('|'))
})

t('import 真接 api：api.import.openapi 缺失报错，存在时接已解析 JSON 并给计数摘要', async () => {
  const r1 = await drive('import', { storage: { listProjects: async () => [{ id: 'p1', name: 'P1' }] } },
    null, async (tree) => { await buttonByText(tree, '开始导入').props.onClick() })
  if (!stateTexts(r1.stub).join('|').includes('api.import.openapi')) throw new Error('缺失方法未提示')

  const got = []
  const r2 = await drive('import', {
    storage: { listProjects: async () => [{ id: 'p1', name: 'P1' }] },
    import: { openapi: async (doc) => { got.push(doc); return { endpoints: [{}, {}], folders: [{}], schemas: [] } } },
  }, null, async (tree, stub, rerender) => {
    const ta = collectNodes(tree).find((n) => n.type === 'textarea')
    ta.props.onChange({ target: { value: '{"openapi":"3.0.0","paths":{}}' } })
    const tree2 = await rerender()
    await buttonByText(tree2, '开始导入').props.onClick()
  })
  if (got.length !== 1) throw new Error('import.openapi 调用次数 ' + got.length)
  if (typeof got[0] !== 'object' || got[0].openapi !== '3.0.0') throw new Error('未按已解析 JSON 传入：' + JSON.stringify(got[0]))
  if (!stateTexts(r2.stub).join('|').includes('接口 2 条')) throw new Error('计数摘要缺失')
})

t('import 真接 api：非法 JSON 在页面内报错且不调用 import', async () => {
  let called = 0
  const r = await drive('import', {
    storage: { listProjects: async () => [{ id: 'p1', name: 'P1' }] },
    import: { openapi: async () => { called += 1; return {} } },
  }, null, async (tree, stub, rerender) => {
    const ta = collectNodes(tree).find((n) => n.type === 'textarea')
    ta.props.onChange({ target: { value: '{bad json' } })
    const tree2 = await rerender()
    await buttonByText(tree2, '开始导入').props.onClick()
  })
  if (called !== 0) throw new Error('非法 JSON 仍调用了 import')
  if (!stateTexts(r.stub).join('|').includes('不是合法 JSON')) throw new Error('非法 JSON 未在页面内报错')
})

t('import 真接 api：export 接 project 对象、codegen 接 { endpoint, env, lang }', async () => {
  const calls = []
  const project = { id: 'p1', name: 'P1', endpoints: [] }
  const api = {
    storage: { listProjects: async () => [{ id: 'p1', name: 'P1' }], getProject: async () => project },
    export: { markdown: async (arg) => { calls.push(['export', arg]); return '# doc' } },
    codegen: { run: async (opts) => { calls.push(['codegen', opts]); return 'curl x' } },
  }
  const r = await drive('import', api, null, async (tree) => { await buttonByText(tree, 'Markdown').props.onClick() })
  const expCall = calls.find((c) => c[0] === 'export')
  if (!expCall) throw new Error('export.markdown 未调用')
  if (expCall[1] !== project) throw new Error('export 未接 project 对象：' + JSON.stringify(expCall[1] && expCall[1].id))
  if (!stateTexts(r.stub).join('|').includes('# doc')) throw new Error('导出结果未展示')

  const r2 = await drive('import', api, null, async (tree) => { await buttonByText(tree, '生成代码').props.onClick() })
  const cgCall = calls.find((c) => c[0] === 'codegen')
  if (!cgCall) throw new Error('codegen.run 未调用')
  if (cgCall[1].lang !== 'curl' || !cgCall[1].endpoint) throw new Error('codegen 入参错误：' + JSON.stringify(cgCall[1]))
  if (!stateTexts(r2.stub).join('|').includes('curl x')) throw new Error('生成代码未展示')
})

t('import 真接 api：export 在缺 getProject 时页面内报错', async () => {
  const r = await drive('import', {
    storage: { listProjects: async () => [{ id: 'p1', name: 'P1' }] },
    export: { markdown: async () => '# x' },
  }, null, async (tree) => { await buttonByText(tree, 'Markdown').props.onClick() })
  if (!stateTexts(r.stub).join('|').includes('getProject')) throw new Error('缺 getProject 未报错')
})

t('search 真接 api：api.storage.search 被调用且结果分组渲染', async () => {
  const calls = []
  const r = await drive('search', { storage: {
    listProjects: async () => [{ id: 'p1', name: 'P1' }],
    search: async (pid, kw) => {
      calls.push([pid, kw])
      return { endpoints: [{ id: 'e1', name: 'A', method: 'GET' }], schemas: [], folders: [] }
    },
  } }, { name: 'search', arg: '', query: 'q=order' }, async (tree) => { await buttonByText(tree, '搜索').props.onClick() })
  if (calls.length !== 1 || calls[0][1] !== 'order') throw new Error('search 调用异常：' + JSON.stringify(calls))
  if (!collectText(r.tree).includes('接口（1）')) throw new Error('结果分组未渲染')
})

t('flow 真接 api：saveFlow 被调用且 payload 为 { name, steps[] }', async () => {
  const saved = []
  await drive('flow', { storage: {
    listProjects: async () => [{ id: 'p1', name: 'P1' }],
    getProject: async () => ({ id: 'p1', flow: { name: 'F', steps: [{ actor: 'A', action: 'call', target: 'B', message: 'm' }] } }),
    saveFlow: async (pid, flow) => { saved.push([pid, flow]); return flow },
  } }, null, async (tree) => { await buttonByText(tree, '保存到项目').props.onClick() })
  if (saved.length !== 1) throw new Error('saveFlow 未调用')
  if (saved[0][0] !== 'p1') throw new Error('projectId 错误：' + saved[0][0])
  const flow = saved[0][1]
  if (typeof flow.name !== 'string' || !Array.isArray(flow.steps)) throw new Error('payload 结构错误：' + JSON.stringify(flow))
  if (flow.steps[0].action !== 'call' || !('actor' in flow.steps[0])) throw new Error('步骤未规整：' + JSON.stringify(flow.steps[0]))
})

t('flow 真接 api：添加步骤写入状态并渲染新增行', async () => {
  const r = await drive('flow', { storage: {
    listProjects: async () => [{ id: 'p1', name: 'P1' }],
    getProject: async () => ({ id: 'p1', flow: { name: 'F', steps: [{ actor: 'A', action: 'call', target: 'B', message: 'm' }] } }),
  } }, null, async (tree) => { await buttonByText(tree, '+ 添加步骤').props.onClick() })
  const lens = stateValues(r.stub).filter((v) => Array.isArray(v)).map((v) => v.length)
  if (!lens.includes(2)) throw new Error('添加步骤未生效，数组态长度：' + JSON.stringify(lens))
  const rows = collectNodes(r.tree).filter((n) => n.type === 'tr').length
  if (rows < 3) throw new Error('步骤表未渲染新增行，tr 数 ' + rows)
})

t('settings 真接 api：saveProjectSettings 被调用且数值被夹取', async () => {
  const saved = []
  await drive('settings', { storage: {
    listProjects: async () => [{ id: 'p1', name: 'P1' }],
    getProject: async () => ({ id: 'p1', settings: { mockPort: 4010, proxyUrl: '', requestTimeoutMs: 30000, historyLimit: 200 } }),
    saveProjectSettings: async (pid, s) => { saved.push([pid, s]); return s },
  } }, null, async (tree) => { await buttonByText(tree, '保存项目设置').props.onClick() })
  if (saved.length !== 1) throw new Error('saveProjectSettings 未调用')
  const s = saved[0][1]
  if (s.mockPort !== 4010 || s.requestTimeoutMs !== 30000 || s.historyLimit !== 200) {
    throw new Error('设置未规整：' + JSON.stringify(s))
  }
})

t('settings 真接 api：存储路径只读且展示 host 注入值', async () => {
  const r = await drive('settings', { storeRoot: 'D:/data/api', storage: { listProjects: async () => [] } })
  const ro = collectNodes(r.tree).filter((n) => n.type === 'input').find((n) => n.props.readOnly === true)
  if (!ro) throw new Error('未找到只读存储路径输入框')
  if (ro.props.value !== 'D:/data/api') throw new Error('未展示注入值：' + ro.props.value)
})

/* ---------------- 直接执行（node tests/pages-b.test.js） ---------------- */

const invokedDirectly = (() => {
  try {
    const argv1 = process.argv[1]
    return Boolean(argv1) && path.resolve(argv1) === fileURLToPath(import.meta.url)
  } catch {
    return false
  }
})()

if (invokedDirectly) {
  let passed = 0
  let failed = 0
  for (const test of tests) {
    try {
      await test.fn()
      passed += 1
      console.log('  PASS ' + test.name)
    } catch (err) {
      failed += 1
      console.log('  FAIL ' + test.name)
      console.log('       ' + (err && err.message ? err.message : String(err)))
    }
  }
  console.log('\n结果：通过 ' + passed + '，失败 ' + failed + '，共 ' + (passed + failed))
  if (failed > 0) process.exitCode = 1
}
