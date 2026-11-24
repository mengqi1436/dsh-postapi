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
// 临时产物放仓库内 .tmp：Windows 上 esbuild 子进程写 os.tmpdir() 会被拒绝（Access is denied），
// 仓库内目录对构建子进程可写；.tmp 已列入 .gitignore。
const TMP = path.join(REPO, '.tmp', 'pages-b-test')

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

/**
 * Apifox 外观硬指标：每页必须出现的 .pp-* 类（docs/apifox-design-spec.md 的组件规格）。
 * 缺任一即视为外观未复刻，用例直接失败。
 */
const PAGE_CLASSES = {
  overview: ['pp-stats', 'pp-stat', 'pp-overview-grid', 'pp-card-hover', 'pp-table'],
  env: ['pp-env-layout', 'pp-env-side', 'pp-table', 'pp-toolbar', 'pp-meta'],
  schema: ['pp-tree-row', 'pp-json-editor', 'pp-note-ok', 'pp-note-bad'],
  history: ['pp-table', 'pp-pill', 'pp-meta', 'pp-pane'],
  test: ['pp-tree-row', 'pp-table', 'pp-result-row', 'pp-pill'],
  import: ['pp-card', 'pp-btn', 'pp-pre', 'pp-select'],
  flow: ['pp-flow-layout', 'pp-flow-side', 'pp-seq-wrap', 'pp-flow-props', 'pp-split-hint'],
  settings: ['pp-form-row', 'pp-form-label', 'pp-input', 'pp-note-ok'],
  search: ['pp-input', 'pp-tree-group', 'pp-list-row'],
}
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
  // Apifox 外观：每页必需的 .pp-* 类必须出现（缺任一 = 外观未复刻）
  for (const cls of PAGE_CLASSES[name] || []) {
    if (!src.includes(cls)) fails.push('缺少 Apifox 类 .' + cls)
  }
  // 类名一律 .pp- 前缀（禁止引入未在 design-tokens.css 定义的私有类名）
  const classAttrs = src.match(/className="([^"]*)"/g) || []
  for (const attr of classAttrs) {
    const names = attr.replace(/className="|"$/g, '').split(/\s+/).filter(Boolean)
    for (const one of names) {
      if (!/^pp-[a-z0-9-]+$/.test(one)) fails.push('类名未使用 pp- 前缀：' + one)
    }
  }
  // 内联 style 只允许 layout：出现颜色/字号/字重键即违规
  const styleBlocks = src.match(/style=\{\{[^}]*\}\}/g) || []
  for (const block of styleBlocks) {
    if (/\b(color|background|backgroundColor|borderColor|fontSize|fontWeight|fontFamily)\s*:/.test(block)) {
      fails.push('内联样式含颜色/字号键：' + block.slice(0, 60))
    }
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

t('Apifox 纪律：九页类名全部 pp- 前缀且无内联颜色/字号（design-tokens 唯一视觉基线）', () => {
  const fails = []
  for (const name of PAGE_NAMES) {
    const src = readFileSync(path.join(PAGES, name + '.jsx'), 'utf8')
    const classAttrs = src.match(/className="([^"]*)"/g) || []
    for (const attr of classAttrs) {
      const names = attr.replace(/className="|"$/g, '').split(/\s+/).filter(Boolean)
      for (const one of names) {
        if (!/^pp-[a-z0-9-]+$/.test(one)) fails.push(name + ': 类名 ' + one + ' 未使用 pp- 前缀')
      }
    }
    for (const block of src.match(/style=\{\{[^}]*\}\}/g) || []) {
      if (/\b(color|background|backgroundColor|borderColor|fontSize|fontWeight|fontFamily)\s*:/.test(block)) {
        fails.push(name + ': 内联样式含颜色/字号 ' + block.slice(0, 48))
      }
    }
    // 九页必须消费 design-tokens 的 .pp-scope 作用域根，保证 token 生效
    if (!/className="pp-scope/.test(src)) fails.push(name + ': 根节点缺 .pp-scope 作用域')
  }
  if (fails.length) throw new Error(fails.join(' | '))
})

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

t('overview.overviewStats：四块统计（项目/接口/环境/最近更新取最晚时间）', async () => {
  const f = await ex('overview', 'overviewStats')
  const got = f(
    [{ id: 'p1', updatedAt: '2026-11-01T00:00:00Z' }, { id: 'p2', updatedAt: '2026-11-05T00:00:00Z' }],
    {
      environments: [{ id: 'e1' }, { id: 'e2' }],
      endpoints: [
        { id: 'ep1', updatedAt: '2026-11-03T00:00:00Z' },
        { id: 'ep2', updatedAt: '2026-11-09T00:00:00Z' },
      ],
    },
  )
  if (got.projectCount !== 2) throw new Error('项目数错误：' + got.projectCount)
  if (got.endpointCount !== 2) throw new Error('接口数错误：' + got.endpointCount)
  if (got.envCount !== 2) throw new Error('环境数错误：' + got.envCount)
  if (got.latestUpdated !== '2026-11-09T00:00:00Z') throw new Error('最近更新取值错误：' + got.latestUpdated)
  const empty = f(undefined, undefined)
  if (empty.projectCount !== 0 || empty.endpointCount !== 0 || empty.envCount !== 0 || empty.latestUpdated !== '') {
    throw new Error('空入参未回落零值：' + JSON.stringify(empty))
  }
})

t('overview 渲染：.pp-stats 四块统计 + .pp-overview-grid 卡片 + .pp-card-hover', async () => {
  const a = okStorage()
  const r = await drive('overview', { storage: a.storage })
  const nodes = collectNodes(r.tree)
  const stats = nodes.filter((n) => n.props && String(n.props.className || '').includes('pp-stat'))
  if (stats.length < 4) throw new Error('.pp-stat 块数不足 4：' + stats.length)
  const labels = stats.map((n) => collectText(n)).join('|')
  for (const word of ['项目数', '接口数', '环境数', '最近更新']) {
    if (!labels.includes(word)) throw new Error('统计块缺标签 ' + word + '：' + labels)
  }
  if (!nodes.some((n) => String(n.props.className || '') === 'pp-overview-grid')) throw new Error('缺 .pp-overview-grid')
  if (!nodes.some((n) => String(n.props.className || '').includes('pp-card-hover'))) throw new Error('缺 .pp-card-hover')
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

t('env 渲染：左环境列表 .pp-env-layout + 变量表 .pp-table + 工具条 .pp-toolbar + 说明 .pp-meta', async () => {
  const r = await drive('env', { storage: {
    listProjects: async () => [{ id: 'p1', name: 'P1' }],
    getProject: async () => ({
      id: 'p1',
      environments: [{ id: 'e1', name: 'dev', baseUrl: 'http://x', variables: [{ key: 'k', value: 'v' }] }],
      globals: { variables: [] },
    }),
  } })
  const nodes = collectNodes(r.tree)
  if (!nodes.some((n) => String(n.props.className || '').includes('pp-env-layout'))) throw new Error('缺 .pp-env-layout 左列表+右编辑区布局')
  if (!nodes.some((n) => String(n.props.className || '').includes('pp-env-side'))) throw new Error('缺 .pp-env-side 环境列表')
  // 变量表挂 .pp-table 与 .pp-table-vars（固定列宽），按包含判定
  if (!nodes.some((n) => String(n.props.className || '').split(/\s+/).includes('pp-table'))) {
    throw new Error('变量表未使用 .pp-table')
  }
  if (!nodes.some((n) => String(n.props.className || '') === 'pp-toolbar')) throw new Error('缺 .pp-toolbar')
  if (!nodes.some((n) => String(n.props.className || '').includes('pp-meta'))) throw new Error('缺 .pp-meta 说明')
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

t('history.pillClass：三档状态映射到 .pp-pill-ok/-warn/-bad（胶囊无底色）', async () => {
  const f = await ex('history', 'pillClass')
  if (f('success') !== 'pp-pill pp-pill-ok') throw new Error('success 档错误：' + f('success'))
  if (f('warning') !== 'pp-pill pp-pill-warn') throw new Error('warning 档错误：' + f('warning'))
  if (f('error') !== 'pp-pill pp-pill-bad') throw new Error('error 档错误：' + f('error'))
  if (f('unknown') !== 'pp-pill pp-pill-bad') throw new Error('未知档未回落 bad：' + f('unknown'))
})

t('history 渲染：状态胶囊带三档类、耗时/大小用 .pp-meta、详情面板用 .pp-pane', async () => {
  const r = await drive('history', { storage: {
    listProjects: async () => [{ id: 'p1', name: 'P1' }],
    getHistory: async () => ({ entries: [
      { id: 'h1', at: '2026-11-17T10:00:00Z', method: 'GET', url: '/a', status: 200, timeMs: 5, bodySize: 10 },
      { id: 'h2', at: '2026-11-17T10:00:01Z', method: 'POST', url: '/b', status: 404, timeMs: 6, bodySize: 20 },
      { id: 'h3', at: '2026-11-17T10:00:02Z', method: 'PUT', url: '/c', status: 500, timeMs: 7, bodySize: 30 },
    ] }),
  } }, null, async (tree) => {
    const btn = collectNodes(tree).find((n) => n.type === 'button' && collectText(n) === '详情')
    await btn.props.onClick()
  })
  const nodes = collectNodes(r.tree)
  const pillClasses = nodes.map((n) => String(n.props.className || '')).filter((c) => c.includes('pp-pill'))
  for (const cls of ['pp-pill-ok', 'pp-pill-warn', 'pp-pill-bad']) {
    if (!pillClasses.some((c) => c.includes(cls))) throw new Error('缺胶囊档 ' + cls + '：' + pillClasses.join('|'))
  }
  if (!nodes.some((n) => String(n.props.className || '') === 'pp-pane')) throw new Error('详情未使用 .pp-pane')
  if (!collectText(r.tree).includes('详情 · h1')) throw new Error('详情面板未渲染')
})

t('history.replayPayload：折算成 debug 请求快照', async () => {
  const f = await ex('history', 'replayPayload')
  const got = f({ method: 'POST', url: 'http://x/a', request: { method: 'PUT', url: '/b', headers: [{ key: 'a' }], body: '{"k":1}' } })
  if (got.method !== 'PUT' || got.url !== '/b' || got.body !== '{"k":1}') throw new Error('折算错误：' + JSON.stringify(got))
  const bare = f({ method: 'GET', url: '/c' })
  if (bare.method !== 'GET' || bare.headers.length !== 0 || bare.body !== '') throw new Error('缺 request 时未回落')
})

t('schema 渲染：.pp-json-editor 编辑器 + 校验结果用 .pp-note-ok/.pp-note-bad', async () => {
  const ok = await drive('schema', {
    storage: { listProjects: async () => [{ id: 'p1', name: 'P1' }], getProject: async () => ({ id: 'p1', schemas: [] }) },
  }, null, async (tree) => { await buttonByText(tree, '校验').props.onClick() })
  const okNodes = collectNodes(ok.tree)
  if (!okNodes.some((n) => n.type === 'textarea' && String(n.props.className || '').includes('pp-json-editor'))) {
    throw new Error('JSON 编辑区未使用 .pp-json-editor')
  }
  if (!okNodes.some((n) => String(n.props.className || '').includes('pp-note-ok'))) {
    throw new Error('校验通过未使用 .pp-note-ok：' + okNodes.map((n) => n.props.className).filter(Boolean).join('|'))
  }

  const bad = await drive('schema', {
    storage: { listProjects: async () => [{ id: 'p1', name: 'P1' }], getProject: async () => ({ id: 'p1', schemas: [] }) },
  }, null, async (tree, stub, rerender) => {
    const ta = collectNodes(tree).find((n) => n.type === 'textarea')
    ta.props.onChange({ target: { value: '{bad' } })
    const tree2 = await rerender()
    await buttonByText(tree2, '校验').props.onClick()
  })
  if (!collectNodes(bad.tree).some((n) => String(n.props.className || '').includes('pp-note-bad'))) {
    throw new Error('校验失败未使用 .pp-note-bad')
  }
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

t('test 渲染：断言表 .pp-table + 运行结果 .pp-result-row/.pp-pill', async () => {
  const r = await drive('test', {
    storage: okStorage().storage,
    test: { runCase: async () => ({ passed: true, results: [{ name: 'a', passed: true }, { name: 'b', passed: false, error: 'x' }], durationMs: 7 }) },
  }, null, async (tree) => { await buttonByText(tree, '运行用例').props.onClick() })
  const nodes = collectNodes(r.tree)
  if (!nodes.some((n) => String(n.props.className || '').includes('pp-table'))) throw new Error('断言表未使用 .pp-table')
  const rows = nodes.filter((n) => String(n.props.className || '').includes('pp-result-row'))
  if (rows.length < 2) throw new Error('.pp-result-row 明细行不足：' + rows.length)
  const pills = nodes.map((n) => String(n.props.className || '')).filter((c) => c.includes('pp-pill'))
  if (!pills.some((c) => c.includes('pp-pill-ok')) || !pills.some((c) => c.includes('pp-pill-bad'))) {
    throw new Error('结果胶囊未按三档着色：' + pills.join('|'))
  }
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

t('search 渲染：搜索条 .pp-search-bar + 分组 .pp-search-group + 结果行 .pp-list-row', async () => {
  const r = await drive('search', { storage: {
    listProjects: async () => [{ id: 'p1', name: 'P1' }],
    search: async () => ({ endpoints: [{ id: 'e1', name: 'A', method: 'GET' }], schemas: [], folders: [] }),
  } }, { name: 'search', arg: '', query: 'q=order' }, async (tree) => { await buttonByText(tree, '搜索').props.onClick() })
  const nodes = collectNodes(r.tree)
  const has = (cls) => nodes.some((n) => String(n.props.className || '').split(/\s+/).includes(cls))
  if (!nodes.some((n) => n.type === 'input' && String(n.props.className || '').includes('pp-input'))) {
    throw new Error('搜索框未使用 .pp-input')
  }
  // 搜索条：项目 + 输入框 + 按钮同一行
  if (!has('pp-search-bar')) throw new Error('缺 .pp-search-bar 搜索条')
  // 只渲染有命中的分组（空组隐藏）；本例 endpoints 有 1 条、另两组为 0
  const groups = nodes.filter((n) => String(n.props.className || '').split(/\s+/).includes('pp-search-group'))
  if (groups.length !== 1) throw new Error('空分组应隐藏，实际渲染分组数 ' + groups.length)
  if (!has('pp-search-group-head')) throw new Error('缺可折叠的分组头')
  if (!has('pp-list-row')) throw new Error('结果行未使用 .pp-list-row')
})

t('settings 渲染：表单 .pp-form-row/.pp-form-label，保存提示用 .pp-note-ok', async () => {
  const r = await drive('settings', { storage: {
    listProjects: async () => [{ id: 'p1', name: 'P1' }],
    getProject: async () => ({ id: 'p1', settings: { mockPort: 4010, proxyUrl: '', requestTimeoutMs: 30000, historyLimit: 200 } }),
    saveProjectSettings: async (_pid, s) => s,
  } }, null, async (tree) => { await buttonByText(tree, '保存项目设置').props.onClick() })
  const nodes = collectNodes(r.tree)
  if (!nodes.some((n) => String(n.props.className || '') === 'pp-form-row')) throw new Error('缺 .pp-form-row')
  if (!nodes.some((n) => String(n.props.className || '') === 'pp-form-label')) throw new Error('缺 .pp-form-label')
  const ok = nodes.filter((n) => String(n.props.className || '').includes('pp-note-ok'))
  if (ok.length === 0) throw new Error('保存提示未使用 .pp-note-ok')
  if (!collectText(r.tree).includes('已保存项目设置')) throw new Error('保存提示文案缺失')
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

t('flow 渲染：左步骤列表 .pp-flow-side + 时序画布 .pp-seq-wrap + 属性面板 + 超 9 步拆分提示 .pp-split-hint', async () => {
  const ten = Array.from({ length: 10 }, (_, i) => ({ actor: 'A', action: 'call', target: 'B', message: 'm' + i }))
  const r = await drive('flow', { storage: {
    listProjects: async () => [{ id: 'p1', name: 'P1' }],
    getProject: async () => ({ id: 'p1', flow: { name: 'F', steps: ten } }),
  } })
  const nodes = collectNodes(r.tree)
  const has = (cls) => nodes.some((n) => String(n.props.className || '').split(/\s+/).includes(cls))
  // 左步骤列表 + 右画布 + 属性面板（Apifox 测试场景同构）
  for (const cls of ['pp-flow-layout', 'pp-flow-side', 'pp-flow-steps', 'pp-seq-wrap', 'pp-flow-props']) {
    if (!has(cls)) throw new Error('缺 .' + cls)
  }
  if (!nodes.some((n) => String(n.props.className || '').includes('pp-split-hint'))) {
    throw new Error('10 步时未显示 .pp-split-hint 拆分提示')
  }

  const few = await drive('flow', { storage: {
    listProjects: async () => [{ id: 'p1', name: 'P1' }],
    getProject: async () => ({ id: 'p1', flow: { name: 'F', steps: [{ actor: 'A', action: 'call', target: 'B', message: 'm' }] } }),
  } })
  if (collectNodes(few.tree).some((n) => String(n.props.className || '').includes('pp-split-hint'))) {
    throw new Error('1 步时不应显示拆分提示')
  }
})

t('flow 选中联动：左列表选中态与画布高亮绑定同一步', async () => {
  const steps = [
    { actor: 'A', action: 'call', target: 'B', message: 'm1' },
    { actor: 'B', action: 'return', target: 'A', message: 'm2' },
    { actor: 'A', action: 'self', target: '', message: 'm3' },
  ]
  const r = await drive('flow', { storage: {
    listProjects: async () => [{ id: 'p1', name: 'P1' }],
    getProject: async () => ({ id: 'p1', flow: { name: 'F', steps } }),
  } })
  const nodes = collectNodes(r.tree)
  // 左列表：恰好一条 data-active=true
  const rowsActive = nodes.filter((n) => String(n.props.className || '').split(/\s+/).includes('pp-flow-step') && n.props['data-active'] === 'true')
  if (rowsActive.length !== 1) throw new Error('左列表选中态应恰好 1 条，实际 ' + rowsActive.length)
  // 画布：传入的 activeIndex 必须与左列表选中项一致（第 0 步）
  const seq = nodes.find((n) => n.props && 'activeIndex' in n.props && 'steps' in n.props)
  if (!seq) throw new Error('画布未收到 activeIndex')
  if (seq.props.activeIndex !== 0) throw new Error('画布 activeIndex 应为 0，实际 ' + seq.props.activeIndex)
  if (typeof seq.props.onSelectRow !== 'function') throw new Error('画布缺少 onSelectRow，无法从图元反选左侧列表')
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

t('overview 默认态：当前项目为空（不预填 id/名称），无项目时渲染空态', async () => {
  const r = await drive('overview', { storage: { listProjects: async () => [], getProject: async () => null } })
  const nodes = collectNodes(r.tree)
  // 当前项目控件必须是空值：value 空且带「请选择项目 / 暂无项目」占位项
  const sel = nodes.find((n) => n.type === 'select' && String(n.props.className || '').includes('pp-ov-current-value'))
  if (!sel) throw new Error('缺当前项目选择控件 .pp-ov-current-value')
  if (String(sel.props.value) !== '') throw new Error('当前项目默认值应为空，实际 ' + JSON.stringify(sel.props.value))
  const optText = collectNodes(sel).filter((n) => n.type === 'option').map((n) => collectText(n)).join('|')
  if (!/暂无项目|请选择项目/.test(optText)) throw new Error('空项目列表未给出占位项：' + optText)
  // 名称输入框默认空
  await buttonByText(r.tree, '新建项目').props.onClick()
  const r2 = await drive('overview', { storage: { listProjects: async () => [], getProject: async () => null } }, null, async (tree) => {
    await buttonByText(tree, '新建项目').props.onClick()
  })
  const input = collectNodes(r2.tree).find((n) => n.type === 'input' && n.props.placeholder === '项目名')
  if (!input) throw new Error('缺项目名输入框')
  if (String(input.props.value) !== '') throw new Error('项目名输入框默认值应为空，实际 ' + JSON.stringify(input.props.value))
})

t('overview 有项目时不自动打开：当前项目仍为空，需用户点「打开」', async () => {
  const opened = []
  const r = await drive('overview', { storage: okStorage({ getProject: async (id) => { opened.push(id); return { id, name: 'P1', endpoints: [] } } }).storage })
  const nodes = collectNodes(r.tree)
  const sel = nodes.find((n) => n.type === 'select' && String(n.props.className || '').includes('pp-ov-current-value'))
  if (String(sel.props.value) !== '') throw new Error('列表非空时也不应自动选中项目，实际 ' + JSON.stringify(sel.props.value))
  if (opened.length > 0) throw new Error('不应自动调用 getProject：' + JSON.stringify(opened))
})

t('overview Apifox 同构：统计卡 / 模块计数条 / 功能卡 / 右栏动作全部就位', async () => {
  const a = okStorage()
  const r = await drive('overview', { storage: a.storage })
  const nodes = collectNodes(r.tree)
  const has = (cls) => nodes.some((n) => String(n.props.className || '').split(/\s+/).includes(cls))
  for (const cls of ['pp-ov-summary', 'pp-ov-summary-num', 'pp-ov-summary-desc', 'pp-ov-modules',
    'pp-ov-counts', 'pp-ov-count', 'pp-ov-divider', 'pp-ov-functions', 'pp-ov-left', 'pp-ov-right',
    'pp-ov-action', 'pp-ov-cards', 'pp-ov-card', 'pp-ov-current']) {
    if (!has(cls)) throw new Error('缺 Apifox 同构类 .' + cls)
  }
  // 右栏动作 6 项（Apifox projectModule.action.*）
  const actions = nodes.filter((n) => String(n.props.className || '').split(/\s+/).includes('pp-ov-action'))
  if (actions.length !== 6) throw new Error('右栏动作应为 6 项，实际 ' + actions.length)
  // 功能卡 3 张（分享列表 / 自动导入 / 代码生成）
  const cardsOv = nodes.filter((n) => String(n.props.className || '').split(/\s+/).includes('pp-ov-card'))
  if (cardsOv.length !== 3) throw new Error('功能卡应为 3 张，实际 ' + cardsOv.length)
  const cardText = cardsOv.map((n) => collectText(n)).join('|')
  for (const word of ['分享列表', '自动导入', '代码生成']) {
    if (!cardText.includes(word)) throw new Error('功能卡缺 ' + word + '：' + cardText)
  }
})

t('overview.moduleCounts / caseCounts：计数取项目实际条目，缺失回落 0', async () => {
  const mf = await ex('overview', 'moduleCounts')
  const got = mf({ endpoints: [{}, {}], schemas: [{}] })
  if (got.endpointCount !== 2 || got.docsCount !== 2 || got.schemaCount !== 1) {
    throw new Error('模块计数错误：' + JSON.stringify(got))
  }
  const zero = mf(null)
  if (zero.endpointCount !== 0 || zero.docsCount !== 0 || zero.schemaCount !== 0) {
    throw new Error('空入参未回落 0：' + JSON.stringify(zero))
  }
  const cf = await ex('overview', 'caseCounts')
  const cases = cf({ testCases: [{}, {}, {}], testScenarios: [{}] })
  if (cases.caseCount !== 3 || cases.scenarioCount !== 1) throw new Error('用例计数错误：' + JSON.stringify(cases))
  if (cf(undefined).caseCount !== 0) throw new Error('空入参未回落 0')
})

t('overview 真接 api：空项目名被拦截（页面内提示，不调用 createProject）', async () => {
  const calls = []
  // v3：新建/重命名表单收进内容区折叠卡，先点页头「新建项目」展开，再点卡内「新建」
  const r = await drive('overview', { storage: okStorage({ createProject: async () => { calls.push('createProject') } }).storage },
    null, async (tree, stub, rerender) => {
      await buttonByText(tree, '新建项目').props.onClick()
      const tree2 = await rerender()
      await buttonByText(tree2, '新建').props.onClick()
    })
  if (calls.length > 0) throw new Error('空名仍调用了 createProject')
  if (!stateTexts(r.stub).join('|').includes('项目名不能为空')) throw new Error('未提示项目名为空')
})

t('overview 真接 api：非空项目名调用 createProject 并给出创建提示', async () => {
  const calls = []
  const r = await drive('overview', {
    storage: okStorage({ createProject: async (name) => { calls.push(name); return { id: 'p9', name } } }).storage,
  }, null, async (tree, stub, rerender) => {
    await buttonByText(tree, '新建项目').props.onClick()
    const tree1 = await rerender()
    const input = collectNodes(tree1).find((n) => n.type === 'input' && n.props.placeholder === '项目名')
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
  } }, null, async (tree, stub, rerender) => {
    // 全局变量在页签里：先切到「全局变量」页签再点保存
    await buttonByText(tree, '全局变量').props.onClick()
    tree = await rerender()
    await buttonByText(tree, '保存全局').props.onClick()
  })
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

t('import 渲染：页签分区 .pp-io-layout + 左格式列表 .pp-io-side + 按钮组 .pp-btn + 结果 .pp-pre', async () => {
  const r = await drive('import', {
    storage: { listProjects: async () => [{ id: 'p1', name: 'P1' }], getProject: async () => ({ id: 'p1' }) },
    export: { markdown: async () => '# doc' },
  }, null, async (tree, stub, rerender) => {
    // 导出在「导出」页签里：先切页签，再点 Markdown 格式，最后点导出
    await buttonByText(tree, '导出').props.onClick()
    let t2 = await rerender()
    await buttonByText(t2, 'Markdown').props.onClick()
    t2 = await rerender()
    await buttonByText(t2, '导出 Markdown').props.onClick()
  })
  const nodes = collectNodes(r.tree)
  const has = (cls) => nodes.some((n) => String(n.props.className || '').split(/\s+/).includes(cls))
  for (const cls of ['pp-io-layout', 'pp-io-side', 'pp-io-item', 'pp-io-main']) {
    if (!has(cls)) throw new Error('缺 .' + cls)
  }
  if (!nodes.some((n) => n.type === 'button' && String(n.props.className || '').includes('pp-btn'))) throw new Error('按钮未使用 .pp-btn')
  if (!nodes.some((n) => n.type === 'pre' && String(n.props.className || '').includes('pp-pre'))) throw new Error('结果未使用 .pp-pre')
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
  const r = await drive('import', api, null, async (tree, stub, rerender) => {
    await buttonByText(tree, '导出').props.onClick()
    let t2 = await rerender()
    await buttonByText(t2, 'Markdown').props.onClick()
    t2 = await rerender()
    await buttonByText(t2, '导出 Markdown').props.onClick()
  })
  const expCall = calls.find((c) => c[0] === 'export')
  if (!expCall) throw new Error('export.markdown 未调用')
  if (expCall[1] !== project) throw new Error('export 未接 project 对象：' + JSON.stringify(expCall[1] && expCall[1].id))
  if (!stateTexts(r.stub).join('|').includes('# doc')) throw new Error('导出结果未展示')

  const r2 = await drive('import', api, null, async (tree, stub, rerender) => {
    await buttonByText(tree, '代码生成').props.onClick()
    const t2 = await rerender()
    await buttonByText(t2, '生成代码').props.onClick()
  })
  const cgCall = calls.find((c) => c[0] === 'codegen')
  if (!cgCall) throw new Error('codegen.run 未调用')
  if (cgCall[1].lang !== 'curl' || !cgCall[1].endpoint) throw new Error('codegen 入参错误：' + JSON.stringify(cgCall[1]))
  if (!stateTexts(r2.stub).join('|').includes('curl x')) throw new Error('生成代码未展示')
})

t('import 真接 api：export 在缺 getProject 时页面内报错', async () => {
  const r = await drive('import', {
    storage: { listProjects: async () => [{ id: 'p1', name: 'P1' }] },
    export: { markdown: async () => '# x' },
  }, null, async (tree, stub, rerender) => {
    await buttonByText(tree, '导出').props.onClick()
    let t2 = await rerender()
    await buttonByText(t2, 'Markdown').props.onClick()
    t2 = await rerender()
    await buttonByText(t2, '导出 Markdown').props.onClick()
  })
  if (!stateTexts(r.stub).join('|').includes('getProject')) throw new Error('缺 getProject 未报错')
})

t('search.highlight：大小写不敏感切三段，无命中时 hit 为空', async () => {
  const f = await ex('search', 'highlight')
  const hit = f('查询订单列表', 'order')
  if (hit.hit !== '') {
    // 中文标题里没有 order，应整体不命中
    if (hit.before !== '查询订单列表') throw new Error('中文标题不应被切开：' + JSON.stringify(hit))
  }
  const en = f('OrderItem', 'order')
  if (en.before !== '' || en.hit !== 'Order' || en.after !== 'Item') {
    throw new Error('大小写不敏感切分错误：' + JSON.stringify(en))
  }
  const none = f('abc', 'xyz')
  if (none.hit !== '' || none.before !== 'abc') throw new Error('无命中应原样返回')
  const empty = f('abc', '  ')
  if (empty.hit !== '' || empty.before !== 'abc') throw new Error('空关键字应原样返回')
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
  // 新结构：分组头「接口」+ 计数徽标「1」
  const txt = collectText(r.tree)
  if (!txt.includes('接口')) throw new Error('结果分组未渲染')
  if (!txt.includes('命中 1 条')) throw new Error('未显示命中计数：' + txt.slice(0, 120))
})

t('flow 真接 api：saveFlow 被调用且 payload 为 { name, steps[] }', async () => {
  const saved = []
  const added = await drive('flow', { storage: {
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

t('flow 真接 api：添加步骤写入状态并渲染新增条目', async () => {
  const r = await drive('flow', { storage: {
    listProjects: async () => [{ id: 'p1', name: 'P1' }],
    getProject: async () => ({ id: 'p1', flow: { name: 'F', steps: [{ actor: 'A', action: 'call', target: 'B', message: 'm' }] } }),
  } }, null, async (tree) => { await buttonByText(tree, '+ 添加').props.onClick() })
  const lens = stateValues(r.stub).filter((v) => Array.isArray(v)).map((v) => v.length)
  if (!lens.includes(2)) throw new Error('添加步骤未生效，数组态长度：' + JSON.stringify(lens))
  // 左步骤列表应渲染 2 个条目
  const items = collectNodes(r.tree).filter((n) => String(n.props.className || '').split(/\s+/).includes('pp-flow-step')).length
  if (items !== 2) throw new Error('步骤列表未渲染新增条目，条目数 ' + items)
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
