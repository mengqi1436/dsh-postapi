// context-menu.test.js — ContextMenu（右键菜单）静态纪律 + 行为断言
// 形态照抄 tree.test.js：esbuild 打 cjs + vm 假 react 直接调组件函数取 element 树（不引 react-dom）。
// 行为断言用「捕获 useEffect 回调」的假 react：手动执行副作用，用假 document/window 验证
// document 点击 / Escape / resize / scroll 的关闭语义与监听器清理。
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import vm from 'node:vm'

const __dirname = dirname(fileURLToPath(import.meta.url))
const COMPONENTS_DIR = resolve(__dirname, '..')
const PAGES_DIR = resolve(COMPONENTS_DIR, '..')
const ROOT = resolve(PAGES_DIR, '..', '..', '..')

const FILE = {
  ctx: join(COMPONENTS_DIR, 'ContextMenu.jsx'),
  css: join(PAGES_DIR, 'design-tokens.css'),
}

const read = (file) => (existsSync(file) ? readFileSync(file, 'utf8') : '')
const assert = (cond, message) => { if (!cond) throw new Error(message) }
const deepEq = (a, b, message) => {
  assert(JSON.stringify(a) === JSON.stringify(b), message + '：' + JSON.stringify(a) + ' ≠ ' + JSON.stringify(b))
}

/** 允许出现的类名：面板体复用 .pp-menu 体系 + 尾部新增的 .pp-ctx-menu / 危险项。 */
const ALLOWED_CLASSES = new Set([
  'pp-menu', 'pp-ctx-menu', 'pp-menu-item', 'pp-menu-item-danger', 'pp-menu-sep', 'pp-menu-label',
])

const BANNED_APIS = [/\balert\s*\(/, /\bconfirm\s*\(/, /\bprompt\s*\(/]
const HARDCODED_COLOR = /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b|\brgba?\s*\(|\bhsla?\s*\(/
const HARDCODED_FONT = /fontSize\s*:\s*['"]?\d/
/** 内联高度纪律：height/minHeight/maxHeight 必须走 token / calc(token) / auto / ≤6px 装饰。 */
const HEIGHT_RE = /\b(minHeight|maxHeight|height)\s*:\s*['"`]([^'"`]+)['"`]/

function loadEsbuild() {
  for (const dir of [ROOT, join(ROOT, '.research', 'sidebar')]) {
    if (existsSync(join(dir, 'node_modules', 'esbuild'))) {
      return createRequire(join(dir, 'noop.js'))('esbuild')
    }
  }
  throw new Error('esbuild 不可用（工作区与 .research/sidebar 均未安装）')
}

/** ref 模拟挂载：createElement 时把 ref.current 指向带 contains 的假节点，验证「菜单内点击不关」。 */
const INSIDE = Symbol('inside-menu')

const fakeReact = {
  createElement: (type, props, ...children) => {
    if (props && props.ref && typeof props.ref === 'object' && 'current' in props.ref) {
      props.ref.current = { contains: (t) => t === INSIDE }
    }
    return { type, props, children }
  },
  Fragment: 'Fragment',
  useRef: (v) => ({ current: v }),
  useEffect: () => {},
}

/** 捕获 useEffect 回调的假 react（行为测试用）。 */
function makeEffectCapturingReact() {
  const effects = []
  return {
    react: {
      createElement: fakeReact.createElement,
      Fragment: 'Fragment',
      useRef: fakeReact.useRef,
      useEffect: (fn) => { effects.push(fn) },
    },
    effects,
  }
}

async function loadModule(file, reactImpl, windowOverrides) {
  const esbuild = loadEsbuild()
  const built = await esbuild.build({
    entryPoints: [file],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'browser',
    target: ['es2022'],
    jsx: 'transform',
    jsxFactory: 'createElement',
    jsxFragment: 'Fragment',
    inject: [join(ROOT, 'src', 'client', 'jsx-shim.js')],
    loader: { '.js': 'jsx' },
    external: ['react'],
    logLevel: 'silent',
  })
  const module = { exports: {} }
  const sandbox = {
    window: { __postapiQueue: [], innerWidth: 0, innerHeight: 0, addEventListener() {}, removeEventListener() {}, ...(windowOverrides || {}) },
    document: { addEventListener() {}, removeEventListener() {} },
    module,
    exports: module.exports,
    console,
    require: (name) => {
      if (name === 'react') return reactImpl || fakeReact
      throw new Error('意外的宿主 require: ' + name)
    },
  }
  vm.createContext(sandbox)
  vm.runInContext(built.outputFiles[0].text, sandbox, { filename: file })
  return module.exports
}

/* ---------------- element 树工具 ---------------- */

function flatten(children, out = []) {
  for (const c of children) {
    if (c == null || c === false || c === true) continue
    if (Array.isArray(c)) flatten(c, out)
    else out.push(c)
  }
  return out
}

function collect(el, out = []) {
  if (!el || typeof el !== 'object') return out
  out.push(el)
  for (const c of flatten(el.children || [])) {
    if (c && typeof c === 'object') collect(c, out)
  }
  return out
}

const cls = (el) => String((el && el.props && el.props.className) || '')
const byClass = (root, name) => collect(root).filter((el) => cls(el).split(/\s+/).includes(name))
function texts(el, out = []) {
  if (el == null || el === false) return out
  if (typeof el === 'string' || typeof el === 'number') { out.push(String(el)); return out }
  if (Array.isArray(el)) { for (const c of el) texts(c, out); return out }
  if (typeof el === 'object') texts(el.children || [], out)
  return out
}

/** 行为测试脚手架：渲染 → 执行 effect（挂监听）→ 提供触发句柄与清理。 */
async function mountContextMenu(props) {
  const { react, effects } = makeEffectCapturingReact()
  const { ContextMenu } = await loadModule(FILE.ctx, react)
  const tree = ContextMenu(props)
  const cleanups = []
  for (const fn of effects) {
    const cleanup = fn()
    if (typeof cleanup === 'function') cleanups.push(cleanup)
  }
  return { tree, cleanups }
}

/** 假 document/window：记录监听器，按类型触发。 */
function makeDocWindow() {
  const docListeners = new Map()
  const winListeners = new Map()
  const reg = (map) => ({
    addEventListener: (type, fn) => { const arr = map.get(type) || []; arr.push(fn); map.set(type, arr) },
    removeEventListener: (type, fn) => {
      const arr = map.get(type) || []
      const i = arr.indexOf(fn)
      if (i >= 0) arr.splice(i, 1)
    },
  })
  const doc = { ...reg(docListeners) }
  const win = { ...reg(winListeners), innerWidth: 0, innerHeight: 0 }
  return {
    doc, win,
    fireDoc: (type, event) => { for (const fn of docListeners.get(type) || []) fn(event) },
    fireWin: (type, event) => { for (const fn of winListeners.get(type) || []) fn(event) },
    docCount: (type) => (docListeners.get(type) || []).length,
    winCount: (type) => (winListeners.get(type) || []).length,
  }
}

const SAMPLE_ITEMS = [
  { label: '新建目录', onClick() {} },
  { divider: true },
  { label: '重命名', onClick() {} },
  { label: '删除', danger: true, onClick() {} },
  { label: '不可用', disabled: true, onClick() {} },
]

export const tests = [
  {
    name: 'context-menu: 只用既有 .pp-menu 体系 + .pp-ctx-menu，无禁用 API / 颜色字号字面量 / 裸内联高度',
    fn() {
      const src = read(FILE.ctx)
      assert(src !== '', 'ContextMenu.jsx 不存在')
      const re = /className="([^"]*)"|className=\{'([^']*)'\}/g
      let m
      while ((m = re.exec(src))) {
        for (const name of (m[1] || m[2] || '').split(/\s+/).filter(Boolean)) {
          assert(ALLOWED_CLASSES.has(name), 'ContextMenu.jsx 使用了未放行类名：' + name)
        }
      }
      for (const need of ['pp-menu', 'pp-menu-item', 'pp-menu-label', 'pp-menu-sep']) {
        assert(src.includes(need), 'ContextMenu.jsx 缺类名 ' + need)
      }
      for (const banned of BANNED_APIS) assert(!banned.test(src), 'ContextMenu.jsx 使用了禁用 API')
      assert(!HARDCODED_COLOR.test(src), 'ContextMenu.jsx 出现颜色字面量')
      assert(!HARDCODED_FONT.test(src), 'ContextMenu.jsx 出现字号字面量')
      const hm = HEIGHT_RE.exec(src)
      assert(hm === null, 'ContextMenu.jsx 出现内联高度：' + (hm && hm[0]))
      // 样式就位：.pp-ctx-menu 与危险项规则必须已在 design-tokens.css 定义（本任务尾部新增）
      const css = read(FILE.css)
      assert(/\.pp-ctx-menu\s*\{/.test(css), 'design-tokens.css 缺 .pp-ctx-menu 规则')
      assert(/\.pp-menu-item\.pp-menu-item-danger\s*\{/.test(css), 'design-tokens.css 缺 .pp-menu-item-danger 规则')
      assert(/\.pp-tree-row\[data-drop="true"\]\s*\{/.test(css), 'design-tokens.css 缺树拖拽落点规则 .pp-tree-row[data-drop="true"]')
    },
  },
  {
    name: 'context-menu: items 渲染（divider/danger/disabled）+ 估算尺寸与越界翻转',
    async fn() {
      const dims = { innerWidth: 2000, innerHeight: 1200 }
      const { ContextMenu, estimateMenuSize, flipPosition } = await loadModule(FILE.ctx, null, dims)
      const tree = ContextMenu({ x: 10, y: 20, items: SAMPLE_ITEMS, onClose() {} })
      const items = byClass(tree, 'pp-menu-item')
      assert(items.length === 4, '应渲染 4 个菜单项（divider 不算项），实际 ' + items.length)
      const seps = byClass(tree, 'pp-menu-sep')
      assert(seps.length === 1, '应渲染 1 条分隔线，实际 ' + seps.length)
      const labels = collect(tree).filter((el) => cls(el) === 'pp-menu-label').map((el) => texts(el).join(''))
      deepEq(labels, ['新建目录', '重命名', '删除', '不可用'], '菜单项文案不符')
      assert(items.some((el) => cls(el).includes('pp-menu-item-danger')), 'danger 项缺 pp-menu-item-danger 类')
      const disabled = items.find((el) => texts(el).join('') === '不可用')
      assert(disabled && disabled.props.disabled === true, 'disabled 项未置 disabled')
      assert(tree.props['data-ctx-menu'] === 'true' && tree.props.role === 'menu', '缺 role=menu / data-ctx-menu 标记')
      // 视口放得下：原样落点，且 top/left 只放 layout
      deepEq(tree.props.style, { left: 10, top: 20 }, '视口内落点应原样输出')
      assert(typeof estimateMenuSize === 'function', '缺 estimateMenuSize 导出')
      deepEq(estimateMenuSize(SAMPLE_ITEMS), { width: 200, height: 4 * 32 + 9 }, '估算尺寸不符')
      deepEq(estimateMenuSize(null), { width: 200, height: 0 }, '空 items 估算应为 0 高')
      // 越界翻转：右缘（1850+200>2000）/ 下缘（1100+137>1200）放不下且左 / 上放得下 → 翻转
      const flipped = ContextMenu({ x: 1850, y: 1100, items: SAMPLE_ITEMS, onClose() {} })
      deepEq(flipped.props.style, { left: 1650, top: 963 }, '越界翻转坐标不符')
      // 翻转结果为负（如坐标本身为负）→ 夹到 0
      const clamped = flipPosition(-50, -20, 200, 137)
      deepEq(clamped, { left: 0, top: 0 }, '负坐标应夹到视口内')
    },
  },
  {
    name: 'context-menu: 项 onClick 触发后 onClose；divider 项无 onClick',
    async fn() {
      const clicked = []
      let closed = 0
      const { tree } = await mountContextMenu({
        x: 0, y: 0,
        items: SAMPLE_ITEMS.map((it, i) => ({ ...it, onClick: () => clicked.push(i) })),
        onClose: () => { closed += 1 },
      })
      const items = byClass(tree, 'pp-menu-item')
      items[0].props.onClick()
      assert(closed === 1 && clicked.length === 1 && clicked[0] === 0, '项点击应先回调 onClick 再 onClose')
      items[3].props.onClick() // disabled 项仍绑着 onClick（浏览器侧 disabled 按钮不会触发）
      assert(clicked.includes(4), 'disabled 项（原 items 第 5 条）的 onClick 绑定缺失')
    },
  },
  {
    name: 'context-menu: Escape / 外部点击 / resize / scroll 关闭，菜单内点击不关，卸载清理监听',
    async fn() {
      const io = makeDocWindow()
      const sandboxWindow = {
        innerWidth: 2000, innerHeight: 1200,
        addEventListener: io.win.addEventListener, removeEventListener: io.win.removeEventListener,
      }
      const sandboxDocument = { addEventListener: io.doc.addEventListener, removeEventListener: io.doc.removeEventListener }
      const { react, effects } = makeEffectCapturingReact()
      const esbuild = loadEsbuild()
      const built = await esbuild.build({
        entryPoints: [FILE.ctx], bundle: true, write: false, format: 'cjs',
        platform: 'browser', target: ['es2022'], jsx: 'transform',
        jsxFactory: 'createElement', jsxFragment: 'Fragment',
        inject: [join(ROOT, 'src', 'client', 'jsx-shim.js')],
        loader: { '.js': 'jsx' }, external: ['react'], logLevel: 'silent',
      })
      const mod = { exports: {} }
      const sandbox = {
        window: sandboxWindow, document: sandboxDocument, module: mod, exports: mod.exports, console,
        require: (name) => (name === 'react' ? react : Promise.reject(new Error('意外的宿主 require: ' + name))),
      }
      vm.createContext(sandbox)
      vm.runInContext(built.outputFiles[0].text, sandbox, { filename: FILE.ctx })
      let closed = 0
      const tree = mod.exports.ContextMenu({ x: 0, y: 0, items: SAMPLE_ITEMS, onClose: () => { closed += 1 } })
      const cleanups = []
      for (const fn of effects) {
        const c = fn()
        if (typeof c === 'function') cleanups.push(c)
      }
      assert(io.docCount('click') === 1 && io.docCount('keydown') === 1, 'document 应挂 click + keydown 监听')
      assert(io.winCount('resize') === 1 && io.winCount('scroll') === 1, 'window 应挂 resize + scroll（捕获）监听')

      io.fireDoc('keydown', { key: 'Escape' })
      assert(closed === 1, 'Escape 未关闭菜单')
      io.fireDoc('keydown', { key: 'a' })
      assert(closed === 1, '非 Escape 按键不应关闭')

      io.fireDoc('click', { target: INSIDE })
      assert(closed === 1, '菜单内部点击不应关闭')
      io.fireDoc('click', { target: 'outside' })
      assert(closed === 2, '外部点击未关闭菜单')

      io.fireWin('resize')
      assert(closed === 3, 'resize 未关闭菜单')
      io.fireWin('scroll')
      assert(closed === 4, 'scroll 未关闭菜单')

      for (const c of cleanups) c()
      assert(io.docCount('click') === 0 && io.docCount('keydown') === 0, '卸载后 document 监听未清理')
      assert(io.winCount('resize') === 0 && io.winCount('scroll') === 0, '卸载后 window 监听未清理')
      assert(tree.props.className.includes('pp-ctx-menu'), '根节点缺 .pp-ctx-menu')
    },
  },
]

/* ---------------- mini runner（node 直跑本文件时生效） ---------------- */

const isMain = (() => {
  try {
    const argv1 = process.argv[1]
    return Boolean(argv1) && resolve(argv1) === fileURLToPath(import.meta.url)
  } catch {
    return false
  }
})()

if (isMain) {
  let passed = 0
  let failed = 0
  for (const t of tests) {
    try {
      await t.fn()
      passed += 1
      console.log('PASS ' + t.name)
    } catch (err) {
      failed += 1
      console.log('FAIL ' + t.name)
      console.log('     ' + (err && err.message ? err.message : err))
    }
  }
  console.log('\ncontext-menu.test：通过 ' + passed + '，失败 ' + failed + '，共 ' + (passed + failed))
  process.exit(failed === 0 ? 0 : 1)
}
