// tree.test.js — FolderTree（多级分组树）静态纪律 + 行为断言
// 结构基线：docs/apifox-visual-parity-spec.md §4（左侧目录树实测）+ §12.3（类名契约）。
// 目录行 = switcher(.pp-tree-switcher) → 图标(.pp-tree-icon) → 名称(.pp-ellipsis) → 计数(.pp-tree-row-count)；
// 接口行 = 方法徽标(.pp-method) → 名称，无 switcher/icon，靠 paddingLeft 负补偿与同层目录名左对齐。
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
/** 本地深比较：固定键序对象用 JSON 串比较（ops 的键序由实现固定为 kind,id,parentId,order）。 */
const deepEq = (a, b, message) => {
  assert(JSON.stringify(a) === JSON.stringify(b), message + '：' + JSON.stringify(a) + ' ≠ ' + JSON.stringify(b))
}

/** 允许出现的类名：只限 design-tokens.css 已定义的 .pp-* 集合（本次不改样式表）。 */
const ALLOWED_CLASSES = new Set([
  'pp-tree', 'pp-tree-row', 'pp-tree-group', 'pp-tree-row-count',
  'pp-tree-switcher', 'pp-tree-icon',
  'pp-method', 'pp-ellipsis', 'pp-empty', 'pp-meta',
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

/** 目录行 = .pp-tree-row 且首个子节点是 .pp-tree-switcher 箭头 span（接口行没有 switcher）。 */
function folderRows(root) {
  return byClass(root, 'pp-tree-row').filter((row) => {
    const kids = flatten(row.children || [])
    return kids.some((k) => k && typeof k === 'object' && cls(k) === 'pp-tree-switcher')
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

/** 拖拽排序夹具：两个顶级目录（f1 含子目录 f1a）+ 三层接口分布（f1 两条 / f2 一条 / 游离一条）。 */
function moveProject() {
  return {
    id: 'proj_move',
    name: '排序',
    folders: [
      { id: 'f1', name: '目录A', parentId: null, order: 0 },
      { id: 'f2', name: '目录B', parentId: null, order: 1 },
      { id: 'f1a', name: 'A-子', parentId: 'f1', order: 0 },
    ],
    endpoints: [
      { id: 'e1', name: '接口1', method: 'GET', folderId: 'f1', order: 0 },
      { id: 'e2', name: '接口2', method: 'POST', folderId: 'f1', order: 1 },
      { id: 'e3', name: '接口3', method: 'PUT', folderId: 'f2', order: 0 },
      { id: 'e4', name: '游离接口', method: 'DELETE', folderId: null, order: 0 },
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
      assert(/var\(--sp-1\)/.test(src), 'FolderTree.jsx 缩进步长应为 var(--sp-1)')
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
      // 接口行没有 switcher/icon 两格，按规格用负补偿与同层目录名左对齐（见用例「接口名与目录名左对齐」）
      assert(String(eps[0].props.style.paddingLeft).includes('* 3'), '深层接口缩进应含 3 个步长基数')
      assert(String(eps[0].props.style.paddingLeft).includes('- var(--sp-1)'), '接口行缩进应含 - var(--sp-1) 负补偿')
    },
  },
  {
    name: 'folder-tree: 接口行无 switcher/icon 占位，靠负补偿与同层目录名左对齐',
    async fn() {
      const { FolderTree } = await loadModule(FILE.tree)
      const project = deepProject()
      const root = FolderTree({ project, activeEndpointId: '', onPick() {}, onToggle() {}, collapsed: {} })
      const ep = endpointRows(root)[0]
      const kids = flatten(ep.children || []).filter((k) => k && typeof k === 'object')
      assert(!kids.some((k) => cls(k) === 'pp-tree-switcher'), '接口行不应有 pp-tree-switcher')
      assert(!kids.some((k) => cls(k) === 'pp-tree-icon'), '接口行不应留 pp-tree-icon 空白占位')
      assert(kids.length === 2, '接口行应只有方法徽标 + 名称两格，实际 ' + kids.length)
      // 深层接口挂在 f3 下：f3 目录行 depth=2（缩进 * 2），接口行 depth=3 且减一个步长 → 同为 * 2。
      // 两边 paddingLeft 相等时，目录的 switcher(12+4+4) + icon(16) + 2 个 gap(4) = 44px 与
      // 接口的 .pp-method min-width 44px 等宽，故名称左边缘严格对齐。
      const folderPad = String(folderRows(root)[2].props.style.paddingLeft)
      const epPad = String(ep.props.style.paddingLeft)
      assert(folderPad === 'calc(var(--sp-1) * 2)', '三级目录缩进不符：' + folderPad)
      assert(epPad === 'calc(var(--sp-1) * 3 - var(--sp-1))', '接口行缩进不符：' + epPad)
      assert(epPad.replace(' * 3 - var(--sp-1)', ' * 2') === folderPad, '接口行与同层目录行缩进未对齐')
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
  {
    name: 'computeTreeMove: 同层重排（拖到接口行前）产出被移节点 + 受影响兄弟的归一化 ops',
    async fn() {
      const { computeTreeMove } = await loadModule(FILE.tree)
      assert(typeof computeTreeMove === 'function', 'FolderTree.jsx 未导出 computeTreeMove')
      const ops = computeTreeMove(moveProject(), { kind: 'endpoint', id: 'e2', targetKind: 'endpoint', targetId: 'e1', position: 'before' })
      // f1 层：e2 插到 e1 前 → e2=0，e1=1（e2 原 order=1 变化、e1 原 0→1 变化，两条 op）
      assert(ops.length === 2, '应产生 2 条 op，实际 ' + JSON.stringify(ops))
      deepEq(ops[0], { kind: 'endpoint', id: 'e2', parentId: 'f1', order: 0 }, 'e2 op 不符')
      deepEq(ops[1], { kind: 'endpoint', id: 'e1', parentId: 'f1', order: 1 }, 'e1 op 不符')
      // f2 层的 e3 与游离的 e4 不受影响
      assert(ops.every((o) => o.id !== 'e3' && o.id !== 'e4'), '跨层节点不应出现在 ops 里')
    },
  },
  {
    name: 'computeTreeMove: 跨目录移入（into 目录末尾）并归一化两层 order',
    async fn() {
      const { computeTreeMove } = await loadModule(FILE.tree)
      const ops = computeTreeMove(moveProject(), { kind: 'endpoint', id: 'e1', targetKind: 'folder', targetId: 'f2', position: 'into' })
      // f2 层：e3 不动（order 0 不变）、e1 追加到末尾 order 1；f1 源层：e2 归一化回 0
      assert(ops.length === 2, '应产生 2 条 op，实际 ' + JSON.stringify(ops))
      assert(ops.some((o) => o.id === 'e1' && o.parentId === 'f2' && o.order === 1), 'e1 应移入 f2 末尾：' + JSON.stringify(ops))
      assert(ops.some((o) => o.id === 'e2' && o.parentId === 'f1' && o.order === 0), '源层 e2 应归一化回 0：' + JSON.stringify(ops))
      assert(!ops.some((o) => o.id === 'e3'), 'e3 order 未变化不应产生 op')
    },
  },
  {
    name: 'computeTreeMove: 拖进自己 / 自己的子孙目录被拒，返回 []',
    async fn() {
      const { computeTreeMove } = await loadModule(FILE.tree)
      const p = moveProject()
      deepEq(computeTreeMove(p, { kind: 'folder', id: 'f1', targetKind: 'folder', targetId: 'f1', position: 'into' }), [], '拖到自己应被拒')
      deepEq(computeTreeMove(p, { kind: 'folder', id: 'f1', targetKind: 'folder', targetId: 'f1a', position: 'into' }), [], '拖进直接子目录应被拒')
      // 深一层：f1 → f2 → f3 结构里把 f1 拖进 f3 同样是子孙
      const deep = deepProject()
      deepEq(computeTreeMove(deep, { kind: 'folder', id: 'f1', targetKind: 'folder', targetId: 'f3', position: 'into' }), [], '拖进隔层子孙应被拒')
    },
  },
  {
    name: 'computeTreeMove: 目标不存在 / 非法移动一律返回 []',
    async fn() {
      const { computeTreeMove } = await loadModule(FILE.tree)
      const p = moveProject()
      deepEq(computeTreeMove(p, { kind: 'endpoint', id: 'e1', targetKind: 'folder', targetId: 'fld_gone', position: 'into' }), [], '目标目录不存在')
      deepEq(computeTreeMove(p, { kind: 'endpoint', id: 'e1', targetKind: 'endpoint', targetId: 'ep_gone', position: 'before' }), [], '目标接口不存在')
      deepEq(computeTreeMove(p, { kind: 'endpoint', id: 'ep_gone', targetKind: 'root', position: 'into' }), [], '被移动节点不存在')
      deepEq(computeTreeMove(p, { kind: 'folder', id: 'f1', targetKind: 'root', position: 'before' }), [], 'root 无参照行，before 非法')
      deepEq(computeTreeMove(p, { kind: 'endpoint', id: 'e1', targetKind: 'endpoint', targetId: 'e3', position: 'into' }), [], '接口行不接受 into')
      deepEq(computeTreeMove(p, { kind: 'folder', id: 'f1', targetKind: 'endpoint', targetId: 'e3', position: 'before' }), [], '目录没有插到接口行前的语义')
      deepEq(computeTreeMove(p, { kind: 'endpoint', id: 'e2', targetKind: 'endpoint', targetId: 'e2', position: 'before' }), [], '拖到自身上')
      deepEq(computeTreeMove(p, null), [], '入参非对象')
      deepEq(computeTreeMove(p, { kind: 'endpoint', id: '', targetKind: 'root', position: 'into' }), [], '缺 id')
    },
  },
  {
    name: 'computeTreeMove: 根/未归类层为目标（parentId null），order 归一化连续 0..n',
    async fn() {
      const { computeTreeMove } = await loadModule(FILE.tree)
      const ops = computeTreeMove(moveProject(), { kind: 'endpoint', id: 'e1', targetKind: 'root', position: 'into' })
      // 目标层（根/未归类）：e4 order 0 已就位不产出 op；e1 追加 order 1（parentId: null）；
      // 源层 f1：e2 归一化回 0。order 全程 0..n 连续。
      assert(ops.length === 2, '应产生 2 条 op，实际 ' + JSON.stringify(ops))
      deepEq(ops[0], { kind: 'endpoint', id: 'e1', parentId: null, order: 1 }, 'e1 op 不符')
      deepEq(ops[1], { kind: 'endpoint', id: 'e2', parentId: 'f1', order: 0 }, 'e2 op 不符')
      for (const o of ops) assert(Number.isInteger(o.order) && o.order >= 0, 'order 应为非负整数：' + JSON.stringify(o))
      // 目录同层重排：f2 提到 f1 前
      const folderOps = computeTreeMove(moveProject(), { kind: 'folder', id: 'f2', targetKind: 'folder', targetId: 'f1', position: 'before' })
      deepEq(folderOps, [
        { kind: 'folder', id: 'f2', parentId: null, order: 0 },
        { kind: 'folder', id: 'f1', parentId: null, order: 1 },
      ], '目录同层重排 ops 不符')
    },
  },
  {
    name: 'folder-tree: 拖拽链路 dragstart→drop 逐条回调 onMove；目录拖到接口行就近映射为移入其目录',
    async fn() {
      const { FolderTree } = await loadModule(FILE.tree)
      const moves = []
      const root = FolderTree({ project: moveProject(), activeEndpointId: '', onPick() {}, onToggle() {}, collapsed: {}, onMove: (op) => moves.push(op) })
      const eps = endpointRows(root)
      const fols = folderRows(root)
      const rowOf = (rows, text) => rows.find((row) => texts(row).join('').includes(text))
      // 接口2 拖到 接口1 前：before 语义
      const src = rowOf(eps, '接口2')
      const dst = rowOf(eps, '接口1')
      assert(typeof src.props.onDragStart === 'function' && src.props.draggable === true, '接口行应可拖拽（draggable + onDragStart）')
      src.props.onDragStart({ dataTransfer: { setData() {}, setDragImage() {} } })
      dst.props.onDragOver({ preventDefault() {}, dataTransfer: { dropEffect: '' } })
      dst.props.onDrop({ preventDefault() {} })
      deepEq(moves, [
        { kind: 'endpoint', id: 'e2', parentId: 'f1', order: 0 },
        { kind: 'endpoint', id: 'e1', parentId: 'f1', order: 1 },
      ], 'drop 未按 computeTreeMove 逐条回调 onMove')

      // 目录A 拖到 接口3（f2 内）行上：映射为移入 f2（f2 内原本无目录，落 order 0）；源层（根目录）f2 归一化回 0
      moves.length = 0
      const folderRow = rowOf(fols, '目录A')
      assert(typeof folderRow.props.onDragStart === 'function', '目录行应可拖拽')
      folderRow.props.onDragStart({ dataTransfer: { setData() {} } })
      rowOf(eps, '接口3').props.onDrop({ preventDefault() {} })
      deepEq(moves, [
        { kind: 'folder', id: 'f1', parentId: 'f2', order: 0 },
        { kind: 'folder', id: 'f2', parentId: null, order: 0 },
      ], '目录拖到接口行应映射为移入其目录并归一化源层')

      // 拖进自己的子孙：onMove 不应收到任何 op（computeTreeMove 拒绝）
      moves.length = 0
      const tree = FolderTree({ project: deepProject(), activeEndpointId: '', onPick() {}, onToggle() {}, collapsed: {}, onMove: (op) => moves.push(op) })
      folderRows(tree)[0].props.onDragStart({ dataTransfer: { setData() {} } })
      endpointRows(tree)[0].props.onDrop({ preventDefault() {} }) // 深层接口在 f3（f1 的孙层）内
      deepEq(moves, [], '拖进子孙目录不应产生 op')

      // onMove 缺省时 drop 不炸
      const noCb = FolderTree({ project: moveProject(), activeEndpointId: '', onPick() {}, onToggle() {}, collapsed: {} })
      endpointRows(noCb)[0].props.onDragStart({ dataTransfer: { setData() {} } })
      endpointRows(noCb)[1].props.onDrop({ preventDefault() {} })
    },
  },
  {
    name: 'folder-tree: 行右键回调 onContextMenu(kind,id,x,y)；树空白/项目名行回 root',
    async fn() {
      const { FolderTree } = await loadModule(FILE.tree)
      const seen = []
      const root = FolderTree({
        project: moveProject(),
        activeEndpointId: '',
        onPick() {},
        onToggle() {},
        collapsed: {},
        onContextMenu: (kind, id, x, y) => seen.push([kind, id, x, y]),
      })
      const row = endpointRows(root).find((r) => texts(r).join('').includes('接口1'))
      row.props.onContextMenu({ preventDefault() {}, clientX: 11, clientY: 22 })
      deepEq(seen, [['endpoint', 'e1', 11, 22]], '接口行右键回调不符')

      const folderRow = folderRows(root)[0]
      folderRow.props.onContextMenu({ preventDefault() {}, clientX: 5, clientY: 6 })
      deepEq(seen[1], ['folder', 'f1', 5, 6], '目录行右键回调不符')

      // 树空白 / 项目名行：kind=root
      const treeEl = byClass(root, 'pp-tree')[0]
      assert(typeof treeEl.props.onContextMenu === 'function', '树根缺 onContextMenu（空白区右键）')
      treeEl.props.onContextMenu({ preventDefault() {}, clientX: 1, clientY: 2 })
      deepEq(seen[2], ['root', '', 1, 2], '空白区右键应回 kind=root')
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
