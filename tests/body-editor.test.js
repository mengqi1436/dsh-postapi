/**
 * tests/body-editor.test.js — BodyEditor（Body 七种类型编辑器）套件。
 *
 * 独立运行：node tests/body-editor.test.js
 * lead 接线：import { tests } from './body-editor.test.js' 后逐条 await t.fn()。
 *
 * 做法与 tests/pages-b.test.js 一致：esbuild 真实打包（jsxFactory=createElement + inject
 * jsx-shim，与 build.mjs 同配置）→ node:vm 加载 → 无状态 react stub 提供 createElement/useState，
 * 然后直接调用组件函数拿 createElement 树，遇到函数型节点就地展开成树再断言。
 *
 * 覆盖：七种类型齐全 / 下拉全量选项 / none 走空态 / form 与 urlencoded 走 ParamTable /
 * json·xml·raw·graphql 走 JsonEditor / 切类型不清空 content 与 fields /
 * 文本域输入与键值表加行都回抛完整 value / 源码静态纪律。
 *
 * 依赖：仅 node 内置模块 + esbuild（不新增依赖）；临时产物写仓库内 .tmp（已 gitignore）。
 */
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const here = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(here, '..')
const ENTRY = path.join(REPO, 'src', 'client', 'pages', 'components', 'BodyEditor.jsx')
const SHIM = path.join(REPO, 'src', 'client', 'jsx-shim.js')
const TMP = path.join(REPO, '.tmp', 'body-editor-test')

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

/** 无状态 react stub：组件只用 createElement 与 useState，够展开成静态树。 */
const reactStub = {
  createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
  Fragment: 'Fragment',
  useState: (init) => [typeof init === 'function' ? init() : init, () => {}],
  useEffect: () => {},
  useRef: (v) => ({ current: v }),
  useMemo: (fn) => fn(),
  useCallback: (fn) => fn(),
  useLayoutEffect: () => {},
}
// esbuild 的 CJS interop 会读 stub.default，真实 react 也是 module.exports 形态。
reactStub.default = reactStub

const requireShim = (name) => {
  if (name === 'react') return reactStub
  throw new Error('意外的 require: ' + name)
}

let cachedMod = null

/** 打包 BodyEditor.jsx 并在 vm 里加载，返回其 exports（模块级缓存，多用例共用一次构建）。 */
async function load() {
  if (cachedMod) return cachedMod
  const esbuild = loadEsbuild()
  if (!existsSync(TMP)) mkdirSync(TMP, { recursive: true })
  const outfile = path.join(TMP, 'BodyEditor.cjs')
  await esbuild.build({
    entryPoints: [ENTRY],
    outfile,
    bundle: true,
    format: 'cjs',
    platform: 'browser',
    target: ['es2022'],
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
  vm.runInNewContext(code, { window: {}, module: mod, exports: mod.exports, require: requireShim, console })
  cachedMod = mod.exports
  return cachedMod
}

/* ---------------- 渲染树工具 ---------------- */

/** 就地展开：函数型节点（组件）直接调用成树，返回纯 createElement 节点数组。 */
function expand(node) {
  if (node === null || node === undefined || node === false) return []
  if (Array.isArray(node)) {
    const out = []
    for (const n of node) out.push(...expand(n))
    return out
  }
  if (typeof node !== 'object') return [node]
  if (typeof node.type === 'function') return expand(node.type(node.props || {}))
  return [{ ...node, children: expand(node.children) }]
}

/** 收集全部对象节点（含子节点）。 */
function collectNodes(node, acc = []) {
  if (node === null || node === undefined || node === false) return acc
  if (Array.isArray(node)) {
    for (const n of node) collectNodes(n, acc)
    return acc
  }
  if (typeof node !== 'object') return acc
  acc.push(node)
  if (node.children) collectNodes(node.children, acc)
  return acc
}

/** 节点文本（字符串 children 递归拼接）。 */
function textOf(node) {
  if (node === null || node === undefined || node === false) return ''
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (typeof node !== 'object') return ''
  return textOf(node.children)
}

const find = (tree, pred) => collectNodes(tree).find(pred)

function hasClass(node, cls) {
  const raw = (node && node.props && node.props.className) || ''
  return String(raw).split(/\s+/).indexOf(cls) >= 0
}

/** 渲染一次 BodyEditor，返回展开后的树。 */
async function render(value, onChange) {
  const mod = await load()
  return expand(mod.BodyEditor({ value, onChange }))
}

/** 取类型下拉。 */
function selectOf(tree) {
  const sel = find(tree, (n) => n.type === 'select')
  assert.ok(sel, '未找到类型下拉 select')
  return sel
}

/* ---------------- 用例 ---------------- */

const tests = []

tests.push({
  name: 'BODY_TYPES 七种类型齐全且顺序为 none/form/urlencoded/json/xml/raw/graphql',
  fn: async () => {
    const mod = await load()
    // 注意：模块来自 node:vm 上下文，其 Array 与宿主 Array 不同源，
    // node:assert/strict 的 deepEqual 会按原型判不等，故统一用 JSON 文本比对。
    assert.equal(
      JSON.stringify(mod.BODY_TYPES.map((t) => t.id)),
      JSON.stringify(['none', 'form', 'urlencoded', 'json', 'xml', 'raw', 'graphql']),
    )
    assert.equal(
      JSON.stringify(mod.BODY_TYPES.map((t) => t.label)),
      JSON.stringify(['none', 'form-data', 'x-www-form-urlencoded', 'json', 'xml', 'raw', 'GraphQL']),
    )
  },
})

tests.push({
  name: '类型下拉渲染全量七个选项且用 pp-select 类',
  fn: async () => {
    const mod = await load()
    const tree = await render({ type: 'json', content: '{}', fields: [] })
    const sel = selectOf(tree)
    assert.ok(hasClass(sel, 'pp-select'), '类型下拉应带 pp-select 类')
    const opts = collectNodes(sel).filter((n) => n.type === 'option')
    assert.equal(JSON.stringify(opts.map((o) => o.props.value)), JSON.stringify(mod.BODY_TYPES.map((t) => t.id)))
    assert.equal(JSON.stringify(opts.map((o) => textOf(o))), JSON.stringify(mod.BODY_TYPES.map((t) => t.label)))
    assert.equal(sel.props.value, 'json', '下拉当前值应等于 value.type')
  },
})

tests.push({
  name: 'type 缺省或非法时回落 none 并渲染空态',
  fn: async () => {
    for (const value of [undefined, {}, { type: 'binary' }, { type: null }]) {
      const tree = await render(value)
      assert.equal(selectOf(tree).props.value, 'none', '缺省/非法 type 应回落 none')
      assert.ok(find(tree, (n) => hasClass(n, 'pp-empty')), 'none 应渲染 EmptyState（.pp-empty）')
      const text = textOf(tree)
      assert.ok(text.includes('无请求体'), '空态主文案应为「无请求体」')
      assert.ok(text.includes('Body 类型选 none 时不发送请求体'), '空态提示文案不符')
      assert.equal(find(tree, (n) => n.type === 'textarea'), undefined, 'none 不应渲染文本域')
      assert.equal(find(tree, (n) => n.type === 'table'), undefined, 'none 不应渲染键值表')
    }
  },
})

tests.push({
  name: 'type=form 渲染 ParamTable 五列键值表',
  fn: async () => {
    const fields = [
      { key: 'name', value: 'ada', enabled: true, type: 'string', description: '姓名' },
      { key: 'age', value: '36', enabled: false, type: 'integer', description: '' },
    ]
    const tree = await render({ type: 'form', content: '', fields })
    assert.equal(find(tree, (n) => hasClass(n, 'pp-empty')), undefined, 'form 不应走空态')
    const table = find(tree, (n) => n.type === 'table')
    assert.ok(table, 'form 应渲染 table（ParamTable）')
    const cols = collectNodes(table).filter((n) => n.type === 'th').map((th) => th.props['data-col'])
    assert.deepEqual(cols, ['enabled', 'key', 'type', 'value', 'description', 'op'], '列定义应为五列 + 操作列')
    const keyCells = collectNodes(table).filter((n) => n.type === 'td' && n.props['data-col'] === 'key')
    assert.equal(keyCells.length, fields.length, 'key 单元格数应等于 fields 行数')
    assert.equal(keyCells[0].children[0].props.value, 'name', '首行 key 应回显 fields[0].key')
    assert.equal(find(tree, (n) => n.type === 'textarea'), undefined, 'form 不应渲染文本域')
  },
})

tests.push({
  name: 'type=urlencoded 渲染 ParamTable 五列键值表',
  fn: async () => {
    const fields = [{ key: 'q', value: 'dsh', enabled: true, type: 'string', description: '' }]
    const tree = await render({ type: 'urlencoded', content: '', fields })
    const table = find(tree, (n) => n.type === 'table')
    assert.ok(table, 'urlencoded 应渲染 table（ParamTable）')
    const cols = collectNodes(table).filter((n) => n.type === 'th').map((th) => th.props['data-col'])
    assert.deepEqual(cols, ['enabled', 'key', 'type', 'value', 'description', 'op'])
    assert.equal(find(tree, (n) => n.type === 'textarea'), undefined, 'urlencoded 不应渲染文本域')
  },
})

tests.push({
  name: 'json/xml/raw/graphql 四种类型都渲染 JsonEditor 文本域',
  fn: async () => {
    for (const type of ['json', 'xml', 'raw', 'graphql']) {
      const content = type + '-body'
      const tree = await render({ type, content, fields: [] })
      const ta = find(tree, (n) => n.type === 'textarea')
      assert.ok(ta, type + ' 应渲染 textarea（JsonEditor）')
      assert.ok(hasClass(ta, 'pp-json-editor'), type + ' 的文本域应带 pp-json-editor 类')
      assert.equal(ta.props.value, content, type + ' 的文本域应回显 value.content')
      assert.equal(find(tree, (n) => n.type === 'table'), undefined, type + ' 不应渲染键值表')
    }
  },
})

tests.push({
  name: '切类型只改 type，不清空 content 与 fields',
  fn: async () => {
    const fields = [{ key: 'a', value: '1', enabled: true, type: 'string', description: '' }]
    const seen = []
    const tree = await render({ type: 'json', content: '{"a":1}', fields }, (v) => seen.push(v))
    selectOf(tree).props.onChange({ target: { value: 'form' } })
    assert.equal(seen.length, 1, '切类型应回抛一次 onChange')
    assert.equal(seen[0].type, 'form')
    assert.equal(seen[0].content, '{"a":1}', '切类型不得清空 content')
    assert.deepEqual(seen[0].fields, fields, '切类型不得清空 fields')

    // 反向切回：从键值表切到 xml，fields 仍保留
    const back = []
    const tree2 = await render({ type: 'urlencoded', content: '<a/>', fields }, (v) => back.push(v))
    selectOf(tree2).props.onChange({ target: { value: 'xml' } })
    assert.equal(back[0].type, 'xml')
    assert.deepEqual(back[0].fields, fields, '切回文本类型不得清空 fields')
    assert.equal(back[0].content, '<a/>')
  },
})

tests.push({
  name: '文本域输入回抛完整 value（type/content/fields 三键齐全）',
  fn: async () => {
    const seen = []
    const tree = await render({ type: 'raw', content: 'old', fields: [{ key: 'k' }] }, (v) => seen.push(v))
    const ta = find(tree, (n) => n.type === 'textarea')
    ta.props.onChange({ target: { value: 'new' } })
    assert.equal(seen.length, 1)
    assert.deepEqual(Object.keys(seen[0]).sort(), ['content', 'fields', 'type'], 'onChange 应收到完整 value')
    assert.equal(seen[0].type, 'raw')
    assert.equal(seen[0].content, 'new')
    assert.deepEqual(seen[0].fields, [{ key: 'k' }], '改 content 不得丢 fields')
  },
})

tests.push({
  name: '键值表加行把新 fields 回抛给 onChange',
  fn: async () => {
    const seen = []
    const fields = [{ key: 'a', value: '1', enabled: true, type: 'string', description: '' }]
    const tree = await render({ type: 'form', content: 'keep', fields }, (v) => seen.push(v))
    const addBtn = find(tree, (n) => n.type === 'button' && textOf(n).includes('添加字段'))
    assert.ok(addBtn, '键值表应有「+ 添加字段」按钮')
    addBtn.props.onClick()
    assert.equal(seen.length, 1)
    assert.equal(seen[0].fields.length, fields.length + 1, '加行后 fields 应多一行')
    assert.equal(seen[0].fields[0].key, 'a', '原有行保持不变')
    assert.equal(seen[0].content, 'keep', '改 fields 不得丢 content')
    assert.equal(seen[0].type, 'form')
  },
})

tests.push({
  name: '无 onChange 时交互不抛错（只读挂载安全）',
  fn: async () => {
    const tree = await render({ type: 'json', content: '{}' })
    selectOf(tree).props.onChange({ target: { value: 'none' } })
    const tree2 = await render({ type: 'form', fields: [] })
    const addBtn = find(tree2, (n) => n.type === 'button' && textOf(n).includes('添加字段'))
    addBtn.props.onClick()
    const ta = find(await render({ type: 'raw', content: '' }), (n) => n.type === 'textarea')
    ta.props.onChange({ target: { value: 'x' } })
  },
})

tests.push({
  name: '源码静态纪律：无颜色/字号字面量、无 alert/confirm/prompt、类名全 pp- 前缀、无外部依赖',
  fn: async () => {
    const src = readFileSync(ENTRY, 'utf8')
    const colorHits = src.match(/#[0-9a-fA-F]{3,8}\b|rgba?\s*\(/g)
    assert.equal(colorHits, null, '不得出现颜色字面量：' + String(colorHits))
    assert.ok(!/font-?[sS]ize\s*:/.test(src), '不得出现字号字面量')
    assert.ok(!/font-?[wW]eight\s*:/.test(src), '不得出现字重字面量')
    assert.ok(!/\balert\s*\(/.test(src), '不得出现 alert(')
    assert.ok(!/\bconfirm\s*\(/.test(src), '不得出现 confirm(')
    assert.ok(!/\bprompt\s*\(/.test(src), '不得出现 prompt(')
    const classAttrs = src.match(/className="([^"]*)"/g) || []
    for (const attr of classAttrs) {
      const names = attr.replace(/className="|"$/g, '').split(/\s+/).filter(Boolean)
      for (const one of names) {
        assert.ok(/^pp-[a-z0-9-]+$/.test(one), '类名未使用 pp- 前缀：' + one)
      }
    }
    const imports = src.match(/from\s+'([^']+)'/g) || []
    for (const one of imports) {
      assert.ok(one.includes("'./"), '只允许相对路径 import（不新增 npm 依赖）：' + one)
    }
    assert.ok(/export function BodyEditor/.test(src), '应导出 BodyEditor 组件')
    assert.ok(/export const BODY_TYPES/.test(src), '应导出 BODY_TYPES 常量')
  },
})

export { tests }

/* ---------------- 自带 mini runner（独立运行用） ---------------- */

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
if (isMain) {
  let passed = 0
  let failed = 0
  for (const t of tests) {
    try {
      await t.fn()
      passed += 1
      console.log('  PASS ' + t.name)
    } catch (err) {
      failed += 1
      console.log('  FAIL ' + t.name)
      console.log('       ' + (err && err.message ? err.message : err))
    }
  }
  console.log('\n结果：通过 ' + passed + '，失败 ' + failed + '，共 ' + (passed + failed))
  if (failed > 0) process.exitCode = 1
}
