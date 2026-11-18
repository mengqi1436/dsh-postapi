// apifox-ui.test.js — Apifox 化改造专项断言（doc / debug 两页 + 四个共用组件）
// 双模式：node 直跑（mini runner），或由 pages-a.test.js 展开收录进 tests/run.js。
// 只做静态结构与纯函数行为断言，不引 react-dom。
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
  doc: join(PAGES_DIR, 'doc.jsx'),
  debug: join(PAGES_DIR, 'debug.jsx'),
  paramTable: join(COMPONENTS_DIR, 'ParamTable.jsx'),
  jsonEditor: join(COMPONENTS_DIR, 'JsonEditor.jsx'),
  statusPill: join(COMPONENTS_DIR, 'StatusPill.jsx'),
  emptyState: join(COMPONENTS_DIR, 'EmptyState.jsx'),
}

const read = (file) => (existsSync(file) ? readFileSync(file, 'utf8') : '')
const assert = (cond, message) => { if (!cond) throw new Error(message) }

/** 出现次数（用于断言「至少 N 处」）。 */
const count = (src, needle) => String(src).split(needle).length - 1

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
    // 与 build.mjs 一致：classic runtime + 显式工厂，否则默认产出 React.createElement 而宿主只给 createElement
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

/** 方法徽标必须全部带 data-method（Apifox 白字彩底靠属性选择器上色）。 */
function bareMethodBadges(src) {
  const bad = []
  const re = /<span className="pp-method"(?![^>]*data-method)/g
  let m
  while ((m = re.exec(src))) bad.push(src.slice(0, m.index).split('\n').length)
  return bad
}

export const tests = [
  {
    name: 'apifox-ui: doc 页三段式骨架（左树 / 主区 / 右 TOC）齐全',
    fn() {
      const src = read(FILE.doc)
      for (const cls of ['pp-body-3col', 'pp-col-left', 'pp-col-right', 'pp-main']) {
        assert(src.includes(cls), 'doc.jsx 缺三段式类 ' + cls)
      }
      for (const cls of ['pp-tree', 'pp-tree-group', 'pp-tree-row', 'pp-tree-row-count']) {
        assert(src.includes(cls), 'doc.jsx 左树缺 ' + cls)
      }
      for (const cls of ['pp-toc', 'pp-toc-item']) {
        assert(src.includes(cls), 'doc.jsx 右 TOC 缺 ' + cls)
      }
      for (const cls of ['pp-doc-h1', 'pp-doc-section', 'pp-doc-h2']) {
        assert(src.includes(cls), 'doc.jsx 主区缺 ' + cls)
      }
      assert(count(src, 'pp-doc-section') >= 7, 'doc.jsx 分区数量不足（Path/Query/Headers/Cookies/Body/Auth/Response/Code）')
    },
  },
  {
    name: 'apifox-ui: doc / debug 方法徽标全部带 data-method（无裸 .pp-method）',
    fn() {
      for (const [label, file] of [['doc', FILE.doc], ['debug', FILE.debug]]) {
        const bad = bareMethodBadges(read(file))
        assert(bad.length === 0, label + '.jsx 第 ' + bad.join(',') + ' 行方法徽标缺 data-method')
      }
    },
  },
  {
    name: 'apifox-ui: doc 页复制 cURL 用 .pp-btn-sm 且成功提示走 .pp-note-ok',
    fn() {
      const src = read(FILE.doc)
      assert(src.includes('复制为 cURL'), 'doc.jsx 缺「复制为 cURL」按钮')
      assert(/className="pp-btn pp-btn-sm"[^>]*onClick=\{copyCurl\}|onClick=\{copyCurl\}/.test(src), 'doc.jsx 复制按钮未用 pp-btn-sm')
      assert(src.includes('pp-note-ok'), 'doc.jsx 复制成功提示未用 pp-note-ok')
    },
  },
  {
    name: 'apifox-ui: debug 页 Apifox 调试台结构（URL 行 / 页签 / 响应面板 / 断言表）',
    fn() {
      const src = read(FILE.debug)
      for (const cls of ['pp-url-row', 'pp-tabs', 'pp-tab', 'pp-pane', 'pp-pill', 'pp-pre', 'pp-pre-scroll', 'pp-table', 'pp-btn-primary']) {
        assert(src.includes(cls), 'debug.jsx 缺 ' + cls)
      }
      assert(src.includes('data-active={tab === t.id}'), 'debug.jsx 页签缺 data-active 切换')
      assert(src.includes('data-active={bodyView ==='), 'debug.jsx 响应体美化/原文页签缺 data-active')
      assert(src.includes('pp-meta'), 'debug.jsx 耗时/大小未用 pp-meta')
      assert(src.includes('断言 / 脚本结果'), 'debug.jsx 缺断言结果区块')
      assert(src.includes('脚本日志'), 'debug.jsx 缺脚本日志区块')
    },
  },
  {
    name: 'apifox-ui: ParamTable 走 .pp-table 且可编辑单元格用 .pp-input-sm',
    fn() {
      const src = read(FILE.paramTable)
      assert(src.includes('className="pp-table"'), 'ParamTable.jsx 未用 .pp-table')
      assert(src.includes('pp-input-sm'), 'ParamTable.jsx 可编辑单元格未用 .pp-input-sm')
      assert(!src.includes('className="pp-input pp-input-mono"'), 'ParamTable.jsx 仍在用旧 pp-input 编辑单元格')
      assert(src.includes('EmptyState'), 'ParamTable.jsx 空态未走 EmptyState')
      assert(src.includes('emptyHint'), 'ParamTable.jsx 缺 emptyHint 透传')
    },
  },
  {
    name: 'apifox-ui: JsonEditor 走 .pp-json-editor，校验提示走 .pp-error-text',
    fn() {
      const src = read(FILE.jsonEditor)
      assert(src.includes('pp-json-editor'), 'JsonEditor.jsx 未用 .pp-json-editor')
      assert(src.includes('pp-error-text'), 'JsonEditor.jsx 校验提示未用 .pp-error-text')
      assert(!/style=\{\{[^}]*height:/.test(src), 'JsonEditor.jsx 不应内联 height（交给 .pp-json-editor）')
      assert(src.includes('pp-btn-sm'), 'JsonEditor.jsx 工具按钮未用 pp-btn-sm')
    },
  },
  {
    name: 'apifox-ui: StatusPill 三档 .pp-pill-ok/warn/bad 且不写内联颜色',
    fn() {
      const src = read(FILE.statusPill)
      for (const cls of ['pp-pill-ok', 'pp-pill-warn', 'pp-pill-bad']) {
        assert(src.includes(cls), 'StatusPill.jsx 缺 ' + cls)
      }
      assert(!/style=\{\{/.test(src), 'StatusPill.jsx 仍写内联 style（颜色应由类承载）')
      assert(src.includes('statusToneClass'), 'StatusPill.jsx 缺 statusToneClass 导出')
    },
  },
  {
    name: 'apifox-ui: EmptyState 用 .pp-empty，hint 行走 .pp-meta',
    fn() {
      const src = read(FILE.emptyState)
      assert(src.includes('pp-empty'), 'EmptyState.jsx 未用 .pp-empty')
      assert(src.includes('pp-meta'), 'EmptyState.jsx hint 未用 .pp-meta')
    },
  },
  {
    name: 'apifox-ui: statusToneClass 三档分级（2xx 绿 / 3xx 橙 / 其余红）',
    async fn() {
      const exports = await loadModule(FILE.statusPill)
      assert(typeof exports.statusToneClass === 'function', 'StatusPill.jsx 未导出 statusToneClass')
      assert(exports.statusToneClass(200) === 'pp-pill-ok', '200 应为 pp-pill-ok')
      assert(exports.statusToneClass(204) === 'pp-pill-ok', '204 应为 pp-pill-ok')
      assert(exports.statusToneClass(302) === 'pp-pill-warn', '302 应为 pp-pill-warn')
      assert(exports.statusToneClass(404) === 'pp-pill-bad', '404 应为 pp-pill-bad')
      assert(exports.statusToneClass(500) === 'pp-pill-bad', '500 应为 pp-pill-bad')
      assert(exports.statusToneClass(0) === 'pp-pill-bad', '0 应为 pp-pill-bad')
      assert(exports.statusToneClass(undefined) === 'pp-pill-bad', 'undefined 应为 pp-pill-bad')
      // 旧契约保留：statusTone 仍返回 var(--*) 色值
      assert(exports.statusTone(200) === 'var(--success)', 'statusTone 契约变更（应仍返回 var(--success)）')
    },
  },
  {
    name: 'apifox-ui: StatusPill 渲染 pp-pill + 三档类，tone 兼容短名',
    async fn() {
      const exports = await loadModule(FILE.statusPill)
      const ok = exports.StatusPill({ status: 200, text: 'OK' })
      assert(ok.props.className === 'pp-pill pp-pill-ok', 'StatusPill 默认类不正确：' + ok.props.className)
      const warn = exports.StatusPill({ status: 200, tone: 'warn' })
      assert(warn.props.className === 'pp-pill pp-pill-warn', 'tone 短名未映射：' + warn.props.className)
      const bad = exports.StatusPill({ status: 0, tone: 'pp-pill-bad' })
      assert(bad.props.className === 'pp-pill pp-pill-bad', 'tone 全类名未透传：' + bad.props.className)
      assert(bad.props.style === undefined, 'StatusPill 不应输出内联 style')
    },
  },
  {
    name: 'apifox-ui: ParamTable 只读渲染 pp-table 表头列与空态',
    async fn() {
      const exports = await loadModule(FILE.paramTable)
      const table = exports.ParamTable({ rows: [{ key: 'page', value: '1', type: 'number', required: false, enabled: true, description: '' }], readOnly: true })
      assert(table.props.className === 'pp-table', 'ParamTable 根不是 .pp-table')
      const thead = table.children[0]
      assert(thead.type === 'thead', '第一子节点不是 thead')
      // columns.map 作为单个 JSX 子表达式传入，children 里是一层数组，需要 flat 展开
      const ths = thead.children[0].children.flat(Infinity).filter(Boolean)
      assert(ths.length === 6, '默认六列不符：' + ths.length)
      const secondTitle = ths[1].children.flat(Infinity).filter((v) => typeof v === 'string').join('')
      assert(secondTitle === '参数', '第二列表头应为「参数」：' + secondTitle)
      const empty = exports.ParamTable({ rows: [], readOnly: true, emptyText: '无参数', emptyHint: '提示' })
      assert(typeof empty.type === 'function', 'ParamTable 空态未渲染 EmptyState 组件')
      assert(empty.props.text === '无参数' && empty.props.hint === '提示', '空态文案未透传：' + JSON.stringify(empty.props))
      const emptyNode = empty.type(empty.props)
      assert(emptyNode.props.className === 'pp-empty', '空态根类不是 .pp-empty')
      assert(exports.blankParamRow().type === 'string', 'blankParamRow 模板类型不符')
    },
  },
]

/* ---------------- mini runner ---------------- */

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
  console.log('\napifox-ui.test：通过 ' + passed + '，失败 ' + failed + '，共 ' + (passed + failed))
  process.exit(failed === 0 ? 0 : 1)
}
