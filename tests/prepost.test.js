/**
 * tests/prepost.test.js — ScriptPanel / AssertTable 断言（前置后置脚本 + 断言表 + 等待时间）
 *
 * 双模式：
 *   node tests/prepost.test.js          # 自带 mini runner 直跑
 *   import { tests } from './prepost.test.js'  # 供 tests/run.js 接线
 *
 * 做法照抄 apifox-ui.test.js：esbuild 现打包组件源码 → node:vm 里以假 react 求值，
 * 直接调用组件函数拿到元素树，再对元素树做结构断言（不引 react-dom、不写临时文件）。
 */
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const COMPONENTS = join(ROOT, 'src', 'client', 'pages', 'components')
const FILE = {
  scriptPanel: join(COMPONENTS, 'ScriptPanel.jsx'),
  assertTable: join(COMPONENTS, 'AssertTable.jsx'),
}

const assert = (cond, message) => { if (!cond) throw new Error(message) }

/** 假 react：createElement 保留原始 children 数组，便于后续遍历元素树。 */
const fakeReact = {
  createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
  Fragment: 'Fragment',
  useState: (v) => [typeof v === 'function' ? v() : v, () => {}],
  useEffect: () => {},
  useRef: (v) => ({ current: v }),
  useMemo: (fn) => fn(),
  useCallback: (fn) => fn(),
  useLayoutEffect: () => {},
}

function loadEsbuild() {
  for (const dir of [ROOT, join(ROOT, '.research', 'sidebar')]) {
    if (existsSync(join(dir, 'node_modules', 'esbuild'))) {
      return createRequire(join(dir, 'noop.js'))('esbuild')
    }
  }
  throw new Error('esbuild 不可用（工作区与 .research/sidebar 均未安装）')
}

/** 打包单文件并求值，返回其导出（模块内部 import 的兄弟组件一并打进去）。 */
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

/* ------------------------------ 元素树工具 ------------------------------ */

const isElement = (n) => n && typeof n === 'object' && typeof n.type !== 'undefined'

/** 递归展开：数组拍平，函数组件当场求值（组件都是纯函数，无 hook 依赖）。 */
function walk(node, out = []) {
  if (node == null || typeof node === 'boolean') return out
  if (Array.isArray(node)) {
    for (const n of node) walk(n, out)
    return out
  }
  if (!isElement(node)) return out
  out.push(node)
  if (typeof node.type === 'function') {
    walk(node.type(node.props || {}), out)
    return out
  }
  walk(node.children, out)
  return out
}

/** 元素树的纯文本（拼接所有字符串子节点）。 */
function textOf(node) {
  if (node == null || typeof node === 'boolean') return ''
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (!isElement(node)) return String(node)
  return textOf(node.children)
}

/** 直接子元素（拍平数组），不含文本节点。 */
function childElements(node) {
  const flat = []
  const push = (n) => {
    if (n == null || typeof n === 'boolean') return
    if (Array.isArray(n)) { n.forEach(push); return }
    if (isElement(n)) flat.push(n)
  }
  push(node && node.children)
  return flat
}

/** 按类型与类名找元素（类名按空格分词精确匹配，避免 pp-table 命中 pp-table-wide 之外的误判）。 */
function findByClass(nodes, className, type) {
  return walk(nodes).filter((el) => {
    if (type && el.type !== type) return false
    const cls = el.props && el.props.className
    if (typeof cls !== 'string') return false
    return cls.split(/\s+/).includes(className)
  })
}

function findByText(nodes, text, type) {
  return walk(nodes).filter((el) => (!type || el.type === type) && textOf(el) === text)
}

/** 取断言表的 tbody 行（断言行 + 表尾「+ 添加断言」行）。 */
function tableRows(tableEl) {
  const tbody = childElements(tableEl).find((el) => el.type === 'tbody')
  assert(tbody, '断言表缺 tbody')
  return childElements(tbody).filter((el) => el.type === 'tr')
}

const BASE_VALUE = {
  preScript: 'pm.environment.set("a", 1)',
  postScript: 'pm.test("ok", () => {})',
  assertions: [
    { source: 'status', path: '', op: 'eq', value: '200', message: '状态码为 200' },
    { source: 'body', path: '$.code', op: 'eq', value: '0', message: '业务码为 0' },
  ],
  waitMs: 500,
}

export const tests = [
  {
    name: 'prepost: ScriptPanel 渲染前置脚本 / 后置脚本 / 断言 / 等待时间四段',
    async fn() {
      const { ScriptPanel } = await loadModule(FILE.scriptPanel)
      const tree = ScriptPanel({ value: BASE_VALUE, onChange: () => {} })
      const titles = findByClass(tree, 'pp-group-title').map(textOf)
      for (const want of ['前置脚本', '后置脚本', '断言', '等待时间']) {
        assert(titles.includes(want), '缺分组标题「' + want + '」，实际 ' + JSON.stringify(titles))
      }
      // 两个脚本编辑器：.pp-textarea.pp-input-mono + rows=6 + 值回填
      const areas = findByClass(tree, 'pp-textarea', 'textarea')
      assert(areas.length === 2, '脚本编辑器应为 2 个，实际 ' + areas.length)
      for (const area of areas) {
        assert(area.props.className === 'pp-textarea pp-input-mono', '脚本编辑器类名不符：' + area.props.className)
        assert(area.props.rows === 6, '脚本编辑器 rows 应为 6，实际 ' + area.props.rows)
      }
      assert(areas[0].props.value === BASE_VALUE.preScript, '前置脚本未回填 value')
      assert(areas[1].props.value === BASE_VALUE.postScript, '后置脚本未回填 value')
      // 两段各带一行 .pp-meta 提示
      const metas = findByClass(tree, 'pp-meta').map(textOf)
      assert(metas.some((t) => t.includes('pm.request') && t.includes('pm.environment.set') && t.includes('console.log')),
        '前置脚本提示缺 pm.request / pm.environment.set / console.log：' + JSON.stringify(metas))
      assert(metas.some((t) => t.includes('pm.response') && t.includes('pm.test') && t.includes('pm.globals.set')),
        '后置脚本提示缺 pm.response / pm.test / pm.globals.set：' + JSON.stringify(metas))
    },
  },
  {
    name: 'prepost: 等待时间走数字输入（pp-input pp-input-sm），并回填 ms 值',
    async fn() {
      const { ScriptPanel } = await loadModule(FILE.scriptPanel)
      const tree = ScriptPanel({ value: BASE_VALUE, onChange: () => {} })
      const num = findByClass(tree, 'pp-input', 'input').filter((el) => el.props.type === 'number')
      assert(num.length === 1, '等待时间数字输入应为 1 个，实际 ' + num.length)
      assert(num[0].props.className === 'pp-input pp-input-sm', '等待输入类名不符：' + num[0].props.className)
      assert(num[0].props.value === '500', '等待时间未回填：' + num[0].props.value)
      assert(findByClass(tree, 'pp-meta').map(textOf).some((t) => t.includes('发送前等待')), '缺「发送前等待」说明')
    },
  },
  {
    name: 'prepost: 断言表六列（来源/路径/操作/期望值/说明/操作）',
    async fn() {
      const { ScriptPanel } = await loadModule(FILE.scriptPanel)
      const tree = ScriptPanel({ value: BASE_VALUE, onChange: () => {} })
      const tables = findByClass(tree, 'pp-table-wide', 'table')
      assert(tables.length === 1, '断言表应为 1 张，实际 ' + tables.length)
      assert(tables[0].props.className === 'pp-table pp-table-wide', '断言表类名不符：' + tables[0].props.className)
      const thead = childElements(tables[0]).find((el) => el.type === 'thead')
      assert(thead, '断言表缺 thead')
      const ths = childElements(childElements(thead)[0])
      assert(ths.length === 6, '断言表列数应为 6，实际 ' + ths.length)
      const heads = ths.map(textOf)
      assert(heads.join('/') === '来源/路径/操作/期望值/说明/操作', '表头文案不符：' + heads.join('/'))
      // 断言表必须在 .pp-table-wrap 里（窄容器整体横向滚动）
      assert(findByClass(tree, 'pp-table-wrap').length === 1, '断言表未套 .pp-table-wrap')
    },
  },
  {
    name: 'prepost: + 添加断言后行数 +1，且回传完整 value（不是 patch）',
    async fn() {
      const { ScriptPanel } = await loadModule(FILE.scriptPanel)
      let got = null
      const tree = ScriptPanel({ value: BASE_VALUE, onChange: (next) => { got = next } })
      const table = findByClass(tree, 'pp-table-wide', 'table')[0]
      const rowsBefore = tableRows(table)
      assert(rowsBefore.length === BASE_VALUE.assertions.length + 1, '初始行数不符：' + rowsBefore.length)
      const addBtn = findByText(tree, '+ 添加断言', 'button')[0]
      assert(addBtn, '缺「+ 添加断言」按钮')
      addBtn.props.onClick()
      assert(got, '点添加未触发 onChange')
      // 完整 value：四个字段齐全，非断言字段原样保留
      for (const key of ['preScript', 'postScript', 'assertions', 'waitMs']) {
        assert(Object.prototype.hasOwnProperty.call(got, key), 'onChange 传的不是完整 value，缺字段 ' + key)
      }
      assert(got.preScript === BASE_VALUE.preScript && got.postScript === BASE_VALUE.postScript,
        'onChange 把未改动的脚本字段弄丢了')
      assert(got.waitMs === BASE_VALUE.waitMs, 'onChange 把 waitMs 弄丢了')
      assert(Array.isArray(got.assertions) && got.assertions.length === BASE_VALUE.assertions.length + 1,
        '添加后断言数未 +1：' + (got.assertions || []).length)
      // 用新值重渲染，表格行数同样 +1
      const after = tableRows(findByClass(ScriptPanel({ value: got, onChange: () => {} }), 'pp-table-wide', 'table')[0])
      assert(after.length === rowsBefore.length + 1, '重渲染后行数未 +1：' + after.length)
    },
  },
  {
    name: 'prepost: 删除首行断言后行数 -1，且只删该行',
    async fn() {
      const { ScriptPanel } = await loadModule(FILE.scriptPanel)
      let got = null
      const tree = ScriptPanel({ value: BASE_VALUE, onChange: (next) => { got = next } })
      const rowsBefore = tableRows(findByClass(tree, 'pp-table-wide', 'table')[0])
      const del = findByText(tree, '删除', 'button')[0]
      assert(del, '缺删除按钮')
      del.props.onClick()
      assert(got && Array.isArray(got.assertions), '删除未回传完整 value')
      assert(got.assertions.length === BASE_VALUE.assertions.length - 1, '删除后断言数未 -1：' + got.assertions.length)
      assert(got.assertions[0].value === BASE_VALUE.assertions[1].value, '删除的不是首行（应保留第二条）')
      const after = tableRows(findByClass(ScriptPanel({ value: got, onChange: () => {} }), 'pp-table-wide', 'table')[0])
      assert(after.length === rowsBefore.length - 1, '重渲染后行数未 -1：' + after.length)
    },
  },
  {
    name: 'prepost: 来源 / 操作下拉选项与导出常量一致',
    async fn() {
      const { ScriptPanel, ASSERT_SOURCES, ASSERT_OPS } = await loadModule(FILE.scriptPanel)
      assert(Array.isArray(ASSERT_SOURCES) && ASSERT_SOURCES.join('/') === 'status/body/header/time',
        'ASSERT_SOURCES 不符：' + JSON.stringify(ASSERT_SOURCES))
      assert(Array.isArray(ASSERT_OPS)
        && ASSERT_OPS.join('/') === 'eq/neq/gt/lt/contains/notContains/exists/notExists/regex',
        'ASSERT_OPS 不符：' + JSON.stringify(ASSERT_OPS))
      const tree = ScriptPanel({ value: BASE_VALUE, onChange: () => {} })
      const selects = findByClass(tree, 'pp-cell-input', 'select')
      assert(selects.length === 4, '两行断言应有 4 个下拉（来源 + 操作各一），实际 ' + selects.length)
      const optionsOf = (sel) => childElements(sel).map((opt) => opt.props.value)
      assert(optionsOf(selects[0]).join('/') === ASSERT_SOURCES.join('/'),
        '来源下拉选项与 ASSERT_SOURCES 不一致：' + optionsOf(selects[0]).join('/'))
      assert(optionsOf(selects[1]).join('/') === ASSERT_OPS.join('/'),
        '操作下拉选项与 ASSERT_OPS 不一致：' + optionsOf(selects[1]).join('/'))
      assert(selects[0].props.value === 'status', '来源下拉未回填行值')
      assert(selects[1].props.value === 'eq', '操作下拉未回填行值')
    },
  },
  {
    name: 'prepost: AssertTable 空态渲染一行 .pp-meta「暂无断言」',
    async fn() {
      const { AssertTable } = await loadModule(FILE.assertTable)
      const table = AssertTable({ rows: [], onChange: () => {} })
      assert(table.props.className === 'pp-table pp-table-wide', 'AssertTable 根类名不符：' + table.props.className)
      const rows = tableRows(table)
      assert(rows.length === 2, '空态应为「空态行 + 添加行」2 行，实际 ' + rows.length)
      const metas = findByClass(rows[0], 'pp-meta').map(textOf)
      assert(metas.length === 1 && metas[0] === '暂无断言', '空态文案不符：' + JSON.stringify(metas))
      // rows 缺省（undefined）按空表处理，不能炸
      const undef = AssertTable({ onChange: () => {} })
      assert(findByClass(undef, 'pp-meta').map(textOf).includes('暂无断言'), 'rows 缺省时未走空态')
    },
  },
  {
    name: 'prepost: 改字段 / 改脚本回传完整 value 对象，且是整表替换而非 patch',
    async fn() {
      const { ScriptPanel } = await loadModule(FILE.scriptPanel)
      const got = []
      const tree = ScriptPanel({ value: BASE_VALUE, onChange: (next) => got.push(next) })
      // 改前置脚本
      findByClass(tree, 'pp-textarea', 'textarea')[0].props.onChange({ target: { value: 'x = 1' } })
      // 改断言第一行期望值
      const inputs = findByClass(tree, 'pp-cell-input', 'input')
      const valueInput = inputs.find((el) => el.props.value === '200')
      assert(valueInput, '未找到断言期望值输入框')
      valueInput.props.onChange({ target: { value: '201' } })
      assert(got.length === 2, '应触发两次 onChange，实际 ' + got.length)
      for (const next of got) {
        assert(next !== BASE_VALUE, 'onChange 不应回传原对象引用')
        assert(Object.keys(next).sort().join('/') === 'assertions/postScript/preScript/waitMs',
          'onChange 回传字段集合不符（疑似 patch）：' + Object.keys(next).join('/'))
      }
      assert(got[0].preScript === 'x = 1', '前置脚本改动未生效：' + got[0].preScript)
      assert(got[1].assertions[0].value === '201', '断言期望值改动未生效：' + got[1].assertions[0].value)
      assert(got[1].assertions[1].value === '0', '改动首行时把第二行弄丢了')
      // 原对象不被就地修改（受控组件不能改入参）
      assert(BASE_VALUE.assertions[0].value === '200', 'onChange 就地修改了入参 assertions')
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
  console.log('\nprepost.test：通过 ' + passed + '，失败 ' + failed + '，共 ' + (passed + failed))
  process.exitCode = failed === 0 ? 0 : 1
}
