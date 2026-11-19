// tree.test.js — FolderTree（多级分组树）静态纪律 + 行为断言
// 形态照抄 apifox-ui.test.js：读源文本断言 + esbuild 打成 cjs 后用假 react 直接调组件函数，
// 断言返回的 element 树（不引 react-dom、不渲染）。
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
  tree: join(COMPONENTS_DIR, 'FolderTree.jsx'),
}

const read = (file) => (existsSync(file) ? readFileSync(file, 'utf8') : '')
const assert = (cond, message) => { if (!cond) throw new Error(message) }

/** 允许出现的类名：只限 design-tokens.css 已定义的 .pp-* 集合（本次不改样式表）。 */
const ALLOWED_CLASSES = new Set([
  'pp-tree', 'pp-tree-row', 'pp-tree-group', 'pp-tree-row-count',
  'pp-method', 'pp-ellipsis', 'pp-faint', 'pp-empty', 'pp-meta',
])

const BANNED_APIS = [/\balert\s*\(/, /\bconfirm\s*\(/, /\bprompt\s*\(/]
const HARDCODED_COLOR = /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b|\brgba?\s*\(|\bhsla?\s*\(/
const HARDCODED_FONT = /fontSize\s*:\s*['"?]?\d/

function loadEsbuild() {
  for (const dir of [ROOT, join(ROOT, '.research', 'sidebar')]) {
    if (existsSync(join(dir, 'node_modules', 'esbuild'))) {
      return createRequire(join(dir, 'noop.js'))('esbuild')
    }
  }
  throw new Error('esbuild 不可用（工作区与 .research/sidebar 均未安装）')
}

const fakeReact = {
  createElement: (type, props, ...children) => ({ type, props, children }),
  Fragment: 'Fragment',
  useState: (v) => [typeof v === 'function' ? v() : v, () => {}],
  useEffect: () => {},
  useRef: (v) => ({ current: v }),
  useMemo: (fn) => fn(),
  useCallback: (fn) => fn(),
  useLayoutEffect: () => {},
}

async function loadModule(file) {
  const esbuild = loadEsbuild()
  const built = await esbuild.build({
    entryPoints: [file],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'browser',
    target: ['es2022'],
    jsx: 'transform',
    // 与 build.mjs 一致：classic runtime + 显式工厂（宿主只给 createElement）
    jsxFactory: 'createElement',
    jsxFragment: 'Fragment',
    inject: [join(ROOT, 'src', 'client', 'jsx-shim.js')],
    loader: { '.js': 'jsx' },
    external: ['react'],
    logLevel: 'silent',
  })
  const module = { exports: {} }
  const sandbox = {
    window: { __postapiQueue: [] },
    module,
    exports: module.exports,
    console,
    require: (name) => {
      if (name === 'react') return fakeReact
      throw new Error('意外的宿主 require: ' + name)
    },
  }
  vm.createContext(sandbox)
  vm.runInContext(built.outputFiles[0].text, sandbox, { filename: file })
  return module.exports
}

/* ---------------- element 树工具 ---------------- */

/** JSX children 里 map 会产生嵌套数组，先摊平。 */
function flatten(children, out = []) {
  for (const c of children) {
    if (c == null || c === false || c === true) continue
    if (Array.isArray(c)) flatten(c, out)
    else out.push(c)
  }
  return out
}

/** 深度优先收集所有 element 节点（不含字符串）。 */
function collect(el, out = []) {
  if (!el || typeof el !== 'object') return out
  out.push(el)
  for (const c of flatten(el.children || [])) {
    if (c && typeof c === 'object') collect(c, out)
  }
  return out
}

/** 收集节点子树下所有文本片段。 */
function texts(el, out = []) {
  if (el == null || el === false) return out
  if (typeof el === 'string' || typeof el === 'number') { out.push(String(el)); return out }
  if (Array.isArray(el)) { for (const c of el) texts(c, out); return out }
  if (typeof el === 'object') texts(el.children || [], out)
  return out
}

const cls = (el) => String((el && el.props && el.props.className) || '')

/** 组件节点（type 为函数，如 EmptyState）：其 className 要调用后才可见。 */
const componentNodes = (root) => collect(root).filter((el) => typeof el.type === 'function')
const byClass = (root, name) => collect(root).filter((el) => cls(el).split(/\s+/).includes(name))
const allText = (root) => texts(root).join('|')

/** 目录行 = .pp-tree-row 且首个子节点是箭头 span。 */
function folderRows(root) {
  return byClass(root, 'pp-tree-row').filter((row) => {
    const kids = flatten(row.children || [])
    return kids.some((k) => k && typeof k === 'object' && cls(k) === 'pp-faint')
  })
}
/** 接口行 = .pp-tree-row 且含 .pp-method 徽标。 */
function endpointRows(root) {
  return byClass(root, 'pp-tree-row').filter((row) => {
    const kids = flatten(row.children || [])
    return kids.some((k) => k && typeof k === 'object' && cls(k) === 'pp-method')
  })
}

/* ---------------- 固定夹具 ---------------- */

/** 三层目录：一级 → 二级 → 三级，接口挂最深一层 + 一个游离接口。 */
function deepProject() {
  return {
    id: 'proj_tree',
    name: '订单中心',
    folders: [
      { id: 'f1', name: '一级', parentId: null, order: 0 },
      { id: 'f2', name: '二级', parentId: 'f1', order: 0 },
      { id: 'f3', name: '三级', parentId: 'f2', order: 0 },
    ],
    endpoints: [
      { id: 'e_deep', name: '深层接口', method: 'GET', folderId: 'f3', order: 0 },
    ],
  }
}

export const tests = [
  {
    name: 'folder-tree: 只用既有 .pp-* 类名（不改 design-tokens.css）',
    fn() {
      const src = read(FILE.tree)
      assert(src !== '', 'FolderTree.jsx 不存在')
      const re = /className="([^"]*)"/g
      let m
      while ((m = re.exec(src))) {
        for (const name of m[1].split(/\s+/).filter(Boolean)) {
          assert(ALLOWED_CLASSES.has(name), 'FolderTree.jsx 使用了未定义的类名：' + name)
        }
      }
      for (const need of ['pp-tree', 'pp-tree-row', 'pp-tree-group', 'pp-tree-row-count', 'pp-method', 'pp-ellipsis']) {
        assert(src.includes(need), 'FolderTree.jsx 缺类名 ' + need)
      }
      // 展开箭头必须是文本 span，不能引图标库
      assert(src.includes('▸') && src.includes('▾'), 'FolderTree.jsx 缺 ▸ / ▾ 展开箭头')
      assert(!/from\s+['"](?!react|\.)[^'"]+['"]/.test(src), 'FolderTree.jsx 引入了非白名单模块（禁止新依赖）')
    },
  },
  {
    name: 'folder-tree: 无颜色/字号字面量，缩进走 var(--sp-*) 内联 layout',
    fn() {
      const src = read(FILE.tree)
      assert(!HARDCODED_COLOR.test(src), 'FolderTree.jsx 出现颜色字面量（应用 var(--*) token）')
      assert(!HARDCODED_FONT.test(src), 'FolderTree.jsx 出现字号字面量（应用 var(--fs-*) token）')
      assert(/paddingLeft/.test(src), 'FolderTree.jsx 缩进应使用内联 paddingLeft')
      assert(/var\(--sp-3\)/.test(src), 'FolderTree.jsx 缩进步长应为 var(--sp-3)')
      for (const re of BANNED_APIS) assert(!re.test(src), 'FolderTree.jsx 使用了禁用 API（alert/confirm/prompt）')
    },
  },
  {
    name: 'folder-tree: 递归三层目录与接口全部渲染，缩进按深度递增',
    async fn() {
      const { FolderTree } = await loadModule(FILE.tree)
      assert(typeof FolderTree === 'function', 'FolderTree.jsx 未导出 FolderTree')
      const root = FolderTree({ project: deepProject(), activeEndpointId: '', onPick() {}, onToggle() {}, collapsed: {} })
      const text = allText(root)
      for (const name of ['一级', '二级', '三级', '深层接口']) {
        assert(text.includes(name), '三层结构缺节点：' + name)
      }
      const rows = folderRows(root)
      assert(rows.length === 3, '目录行应为 3 个，实际 ' + rows.length)
      const pad = (row) => String((row.props.style && row.props.style.paddingLeft) || '')
      assert(pad(rows[0]) === '', '顶层目录不应额外缩进，实际 ' + pad(rows[0]))
      assert(pad(rows[1]).includes('* 1'), '二级目录缩进应为 1 个步长，实际 ' + pad(rows[1]))
      assert(pad(rows[2]).includes('* 2'), '三级目录缩进应为 2 个步长，实际 ' + pad(rows[2]))
      const eps = endpointRows(root)
      assert(eps.length === 1, '接口行应为 1 个，实际 ' + eps.length)
      assert(String(eps[0].props.style.paddingLeft).includes('* 3'), '深层接口缩进应为 3 个步长')
    },
  },
  {
    name: 'folder-tree: order 升序生效（目录与接口各自排序）',
    async fn() {
      const { FolderTree } = await loadModule(FILE.tree)
      const project = {
        name: '排序',
        folders: [
          { id: 'fb', name: '目录B', parentId: null, order: 2 },
          { id: 'fa', name: '目录A', parentId: null, order: 0 },
          { id: 'fc', name: '目录C', parentId: null, order: 1 },
        ],
        endpoints: [
          { id: 'e3', name: '接口C', method: 'PUT', folderId: 'fa', order: 2 },
          { id: 'e1', name: '接口A', method: 'GET', folderId: 'fa', order: 0 },
          { id: 'e2', name: '接口B', method: 'POST', folderId: 'fa', order: 1 },
        ],
      }
      const root = FolderTree({ project, activeEndpointId: '', onPick() {}, onToggle() {}, collapsed: {} })
      const folderNames = folderRows(root).map((row) => texts(row).join(''))
      const order = folderNames.map((t) => ['目录A', '目录B', '目录C'].find((n) => t.includes(n)))
      assert(order.join(',') === '目录A,目录C,目录B', '目录未按 order 升序：' + order.join(','))
      const epNames = endpointRows(root).map((row) => texts(row).join(''))
      const epOrder = epNames.map((t) => ['接口A', '接口B', '接口C'].find((n) => t.includes(n)))
      assert(epOrder.join(',') === '接口A,接口B,接口C', '接口未按 order 升序：' + epOrder.join(','))
    },
  },
  {
    name: 'folder-tree: 目录行显示接口数；折叠后子项不渲染',
    async fn() {
      const { FolderTree } = await loadModule(FILE.tree)
      const project = deepProject()
      const expanded = FolderTree({ project, activeEndpointId: '', onPick() {}, onToggle() {}, collapsed: {} })
      const counts = byClass(expanded, 'pp-tree-row-count').map((el) => texts(el).join(''))
      // 一级/二级自身无接口 → 0；三级挂 1 个
      assert(counts.join(',') === '0,0,1', '目录接口数不正确：' + counts.join(','))
      assert(allText(expanded).includes('深层接口'), '展开态应渲染深层接口')

      const folded = FolderTree({ project, activeEndpointId: '', onPick() {}, onToggle() {}, collapsed: { f1: true } })
      assert(!allText(folded).includes('二级'), '折叠一级后不应渲染二级目录')
      assert(!allText(folded).includes('深层接口'), '折叠一级后不应渲染深层接口')
      assert(allText(folded).includes('▸'), '折叠态箭头应为 ▸')
    },
  },
  {
    name: 'folder-tree: 未归类分组仅在存在游离接口时渲染（含悬挂 folderId）',
    async fn() {
      const { FolderTree } = await loadModule(FILE.tree)
      const withLoose = deepProject()
      withLoose.endpoints.push({ id: 'e_free', name: '游离接口', method: 'DELETE', folderId: null, order: 0 })
      withLoose.endpoints.push({ id: 'e_orphan', name: '悬挂接口', method: 'PATCH', folderId: 'fld_gone', order: 1 })
      const root = FolderTree({ project: withLoose, activeEndpointId: '', onPick() {}, onToggle() {}, collapsed: {} })
      const groups = byClass(root, 'pp-tree-group').map((el) => texts(el).join(''))
      assert(groups.includes('未归类'), '缺「未归类」分组：' + groups.join(','))
      const looseText = allText(root)
      assert(looseText.includes('游离接口'), '未归类分组缺 folderId=null 的接口')
      assert(looseText.includes('悬挂接口'), '未归类分组应收容悬挂 folderId 的接口')

      const clean = FolderTree({ project: deepProject(), activeEndpointId: '', onPick() {}, onToggle() {}, collapsed: {} })
      const cleanGroups = byClass(clean, 'pp-tree-group').map((el) => texts(el).join(''))
      assert(!cleanGroups.includes('未归类'), '无游离接口时不应渲染「未归类」分组')
    },
  },
  {
    name: 'folder-tree: 选中态 data-active 只落在目标接口行，onPick 回调收到 id',
    async fn() {
      const { FolderTree } = await loadModule(FILE.tree)
      const picked = []
      const project = deepProject()
      project.endpoints.push({ id: 'e_other', name: '另一个接口', method: 'POST', folderId: 'f1', order: 1 })
      const root = FolderTree({
        project,
        activeEndpointId: 'e_deep',
        onPick: (id) => picked.push(id),
        onToggle() {},
        collapsed: {},
      })
      const active = endpointRows(root).filter((row) => row.props['data-active'] === true)
      assert(active.length === 1, '选中行应恰好 1 个，实际 ' + active.length)
      assert(texts(active[0]).join('').includes('深层接口'), '选中的不是目标接口')
      const inactive = endpointRows(root).filter((row) => row.props['data-active'] === false)
      assert(inactive.length === 1, '未选中行应显式 data-active=false，实际 ' + inactive.length)

      active[0].props.onClick()
      assert(picked.length === 1 && picked[0] === 'e_deep', 'onPick 未收到被点接口 id：' + JSON.stringify(picked))

      // readOnly 下点击不触发 onPick
      const ro = FolderTree({ project, activeEndpointId: '', onPick: (id) => picked.push(id), onToggle() {}, collapsed: {}, readOnly: true })
      endpointRows(ro)[0].props.onClick()
      assert(picked.length === 1, 'readOnly 下不应触发 onPick')
    },
  },
  {
    name: 'folder-tree: 空项目渲染空态；onToggle 收到目录 id',
    async fn() {
      const { FolderTree } = await loadModule(FILE.tree)
      const empty = FolderTree({ project: { name: '空项目', folders: [], endpoints: [] }, activeEndpointId: '', onPick() {}, onToggle() {}, collapsed: {} })
      const emptyNodes = componentNodes(empty)
      assert(emptyNodes.length === 1, '空项目应渲染 1 个空态组件，实际 ' + emptyNodes.length)
      assert(String(emptyNodes[0].props.text).includes('暂无目录与接口'), '空态文案缺失：' + JSON.stringify(emptyNodes[0].props))
      const emptyDom = emptyNodes[0].type(emptyNodes[0].props)
      assert(emptyDom.props.className === 'pp-empty', '空态根类不是 .pp-empty')
      assert(folderRows(empty).length === 0, '空项目不应有目录行')

      const toggled = []
      const root = FolderTree({ project: deepProject(), activeEndpointId: '', onPick() {}, onToggle: (id) => toggled.push(id), collapsed: {} })
      folderRows(root)[0].props.onClick()
      assert(toggled.length === 1 && toggled[0] === 'f1', 'onToggle 未收到目录 id：' + JSON.stringify(toggled))

      // project 为 null 时也不能炸（页面首帧 project 尚未加载）
      const nullTree = FolderTree({ project: null, activeEndpointId: '', onPick() {}, onToggle() {}, collapsed: {} })
      assert(componentNodes(nullTree).length === 1, 'project=null 应退化为空态')
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
  console.log('\ntree.test：通过 ' + passed + '，失败 ' + failed + '，共 ' + (passed + failed))
  process.exit(failed === 0 ? 0 : 1)
}
