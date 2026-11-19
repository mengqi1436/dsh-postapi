/**
 * response-panel 套件：响应面板六页签（task-23 契约）。
 *
 * 独立运行：node tests/response-panel.test.js
 * lead 接线：tests/run.js 里 optionalSuite('response-panel.test.js', 'tests') 后逐条 await t.fn()。
 *
 * 覆盖：空态 / sending 态 / 六页签齐全 / error 时不渲染页签 / set-cookie 解析（单值、数组、多属性）/
 * 断言通过与失败两种 pill / 实际请求缺失空态 / 页签计数 / 复制成功与失败（页面内提示，不弹窗）/
 * 静态纪律（无颜色字号字面量、无 alert/confirm/prompt、无第三方依赖、类名均已定义）。
 *
 * 依赖：仅 node 内置模块 + esbuild（与 build.mjs 同款解析），不新增依赖。
 * 临时产物写仓库内 .tmp/（Windows 上 esbuild 写系统临时目录会被拒绝）。
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const here = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(here, '..')
const COMPONENT = path.join(REPO, 'src', 'client', 'pages', 'components', 'ResponsePanel.jsx')
const CSS = path.join(REPO, 'src', 'client', 'pages', 'design-tokens.css')
const SHIM = path.join(REPO, 'src', 'client', 'jsx-shim.js')
const TMP = path.join(REPO, '.tmp', 'response-panel-test')

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

const assert = (cond, message) => { if (!cond) throw new Error(message) }

/* ---------------- react stub（有状态：useState 真实 slot，支持点击后重渲染） ---------------- */

function makeStub() {
  const log = { slots: [], cursor: 0 }
  const stub = {
    useState: (init) => {
      const i = log.cursor++
      if (i >= log.slots.length) log.slots[i] = { value: typeof init === 'function' ? init() : init }
      const slot = log.slots[i]
      const set = (nv) => { slot.value = typeof nv === 'function' ? nv(slot.value) : nv }
      return [slot.value, set]
    },
    useEffect: () => {},
    useRef: (v) => ({ current: v }),
    useMemo: (fn) => fn(),
    useCallback: (fn) => fn(),
    useLayoutEffect: () => {},
    log,
  }
  stub.default = stub
  return stub
}

let activeStub = makeStub()

// 打包后的模块在求值时绑定一次 require('react') 的返回值，故返回固定委托对象，hook 转发到当前 stub。
const reactFacade = {
  createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
  Fragment: 'Fragment',
  useState: (...a) => activeStub.useState(...a),
  useEffect: (...a) => activeStub.useEffect(...a),
  useRef: (...a) => activeStub.useRef(...a),
  useMemo: (...a) => activeStub.useMemo(...a),
  useCallback: (...a) => activeStub.useCallback(...a),
  useLayoutEffect: (...a) => activeStub.useLayoutEffect(...a),
}
reactFacade.default = reactFacade

/** 剪贴板替身：用例按需改写 writeText 的行为。 */
const clipboard = { writeText: (text) => { clipboard.copied = text; return Promise.resolve() }, copied: null }

let modCache = null
async function loadModule() {
  if (modCache) return modCache
  if (!existsSync(TMP)) mkdirSync(TMP, { recursive: true })
  const outfile = path.join(TMP, 'response-panel.cjs')
  await esbuild.build({
    entryPoints: [COMPONENT],
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
  const sandbox = {
    window: {},
    module: mod,
    exports: mod.exports,
    console,
    navigator: { clipboard },
    require: (name) => {
      if (name === 'react') return reactFacade
      throw new Error('意外的宿主 require: ' + name)
    },
  }
  vm.createContext(sandbox)
  vm.runInContext(code, sandbox, { filename: 'ResponsePanel.jsx' })
  modCache = mod.exports
  return modCache
}

/* ---------------- 渲染树工具（不展开函数组件，只读其 props） ---------------- */

function collectNodes(node, acc = []) {
  if (node === null || node === undefined || node === false) return acc
  if (Array.isArray(node)) { for (const n of node) collectNodes(n, acc); return acc }
  if (typeof node !== 'object') return acc
  acc.push(node)
  if (node.children) collectNodes(node.children, acc)
  return acc
}

function textOf(node) {
  if (node === null || node === undefined || node === false) return ''
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (typeof node !== 'object') return ''
  return textOf(node.children)
}

const cls = (n) => String((n.props && n.props.className) || '')
const hasCls = (n, name) => cls(n).split(/\s+/).includes(name)

function byClass(tree, name) {
  return collectNodes(tree).filter((n) => hasCls(n, name))
}

/**
 * EmptyState 节点：stub 的 createElement 不渲染子组件，函数组件在树里以 type 出现。
 * 按 props 形态识别（有 text、无 status），避免把 StatusPill 误判成空态。
 */
function empties(tree) {
  return collectNodes(tree).filter((n) => typeof n.type === 'function' && n.props
    && typeof n.props.text === 'string' && !('status' in n.props))
}

function emptyTexts(tree) {
  return empties(tree).map((n) => n.props.text)
}

/** 点页签：按文案前缀匹配（兼容「Headers (3)」这种带计数的标题）。 */
function clickTabButton(tree, prefix) {
  const btn = collectNodes(tree).find((n) => n.type === 'button' && hasCls(n, 'pp-tab')
    && textOf(n).trim().indexOf(prefix) === 0)
  assert(btn, '找不到页签按钮：' + prefix)
  btn.props.onClick()
}

/** 复用同一 stub 重渲染（读最新 state，模拟 React 重渲染）。 */
function rerender(ex, stub, props) {
  activeStub = stub
  stub.log.cursor = 0
  return ex.ResponsePanel(props)
}

/** 首轮渲染：新建 stub（或复用传入的），返回 { tree, stub, ex }。 */
async function render(props, stub) {
  const ex = await loadModule()
  const s = stub || makeStub()
  activeStub = s
  s.log.cursor = 0
  return { tree: ex.ResponsePanel(props), stub: s, ex }
}

/** 切到某页签并返回重渲染后的树。 */
async function renderTab(props, prefix) {
  const first = await render(props)
  clickTabButton(first.tree, prefix)
  return rerender(first.ex, first.stub, props)
}

/* ---------------- 样例响应（严格对齐 host request.send 返回值） ---------------- */

function sampleResp(over) {
  return Object.assign({
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/json',
      'x-request-id': 'req-1',
      'Set-Cookie': ['sid=abc; Path=/; HttpOnly', 'theme=dark; Max-Age=3600'],
    },
    body: '{"code":0,"data":{"id":1}}',
    bodySize: 27,
    timeMs: 42,
    request: {
      method: 'post',
      url: 'https://api.example.test/v1/items',
      headers: { 'content-type': 'application/json' },
      body: '{"a":1}',
    },
    tests: [{ name: 'status 为 2xx', passed: true }, { name: 'code 为 0', passed: false, error: '实际 1' }],
    logs: ['script: before', 'script: after'],
  }, over || {})
}

/* ---------------- 用例 ---------------- */

export const tests = []
const t = (name, fn) => tests.push({ name: 'response-panel: ' + name, fn })

t('空态：resp 为 null 且未发送时给出 EmptyState 主文案与提示', async () => {
  const { tree } = await render({ resp: null, sending: false })
  const list = empties(tree)
  assert(list.length === 1, '应恰好一个空态，实际 ' + list.length)
  assert(list[0].props.text === '尚未发送请求', '空态主文案应为「尚未发送请求」，实际 ' + list[0].props.text)
  assert(list[0].props.hint === '填写 URL 后点「发送」', '空态提示文案偏离：' + list[0].props.hint)
  assert(byClass(tree, 'pp-tab').length === 0, '空态不应渲染页签')
})

t('sending 态：顶部「发送中…」胶囊 + 取消按钮回调 onCancel', async () => {
  let cancelled = 0
  const { tree } = await render({ resp: null, sending: true, onCancel: () => { cancelled += 1 } })
  const pills = byClass(tree, 'pp-pill').filter((n) => textOf(n).indexOf('发送中') > -1)
  assert(pills.length === 1, '应有一个「发送中…」胶囊，实际 ' + pills.length)
  const cancel = collectNodes(tree).find((n) => n.type === 'button' && textOf(n).trim() === '取消')
  assert(cancel, '应有取消按钮')
  cancel.props.onClick()
  assert(cancelled === 1, '取消按钮应调用 onCancel，实际调用 ' + cancelled + ' 次')
})

t('六个页签齐全且顺序与文案对齐契约', async () => {
  const ex = await loadModule()
  const { tree } = await render({ resp: sampleResp() })
  // 外层六页签 + Body 页内的「美化 / 原文」二级切换共用 .pp-tab，这里只看外层。
  const tabs = byClass(tree, 'pp-tab').map((n) => textOf(n).trim())
    .filter((x) => x !== '美化' && x !== '原文')
  const expected = ['Body', 'Headers (3)', 'Cookies', '实际请求', '测试结果 (2)', '控制台']
  assert(tabs.join('|') === expected.join('|'), '页签顺序/文案偏离：' + tabs.join('|'))
  assert(ex.RESPONSE_TABS.length === 6, 'RESPONSE_TABS 应为 6 项，实际 ' + ex.RESPONSE_TABS.length)
})

t('页签计数：Headers / 测试结果 带数量，其余不带', async () => {
  const ex = await loadModule()
  const counts = { headers: 8, tests: 0 }
  const titles = ex.RESPONSE_TABS.map((tab) => ex.tabTitle(tab, counts))
  assert(titles[1] === 'Headers (8)', 'Headers 计数应为 8，实际 ' + titles[1])
  assert(titles[4] === '测试结果 (0)', '测试结果计数应为 0，实际 ' + titles[4])
  for (const i of [0, 2, 3, 5]) {
    assert(titles[i].indexOf('(') === -1, ex.RESPONSE_TABS[i].label + ' 不应带计数：' + titles[i])
  }
  // 无 counts 时退化为纯标签
  assert(ex.tabTitle({ id: 'headers', label: 'Headers' }) === 'Headers', '缺 counts 时应退化为纯标签')
})

t('error 态：显示 error.message，不渲染任何页签', async () => {
  const resp = {
    status: 0, statusText: '', headers: {}, body: '', bodySize: 0, timeMs: 0,
    error: { message: 'ECONNREFUSED 127.0.0.1:1' },
  }
  const { tree } = await render({ resp })
  const notes = byClass(tree, 'pp-note-bad')
  assert(notes.length === 1, '应有一条 .pp-note-bad，实际 ' + notes.length)
  assert(textOf(notes[0]).indexOf('ECONNREFUSED 127.0.0.1:1') > -1, '错误文案未展示：' + textOf(notes[0]))
  assert(byClass(tree, 'pp-tab').length === 0, 'error 时不应渲染页签')
})

t('set-cookie 解析：单值字符串按 ; 拆 name=value 与属性', async () => {
  const ex = await loadModule()
  const rows = ex.parseSetCookies({ 'Set-Cookie': 'sid=abc; Path=/; HttpOnly; SameSite=Lax' })
  assert(rows.length === 1, '应解析出 1 条，实际 ' + rows.length)
  assert(rows[0].name === 'sid' && rows[0].value === 'abc', 'name/value 解析错误：' + JSON.stringify(rows[0]))
  assert(rows[0].attrs === 'Path=/; HttpOnly; SameSite=Lax', '属性串解析错误：' + rows[0].attrs)
})

t('set-cookie 解析：数组多值 + 键名大小写不敏感', async () => {
  const ex = await loadModule()
  const rows = ex.parseSetCookies({ 'set-cookie': ['a=1; Path=/', 'b=2'] })
  assert(rows.length === 2, '数组应解析出 2 条，实际 ' + rows.length)
  assert(rows[0].name === 'a' && rows[1].name === 'b', '多条 name 解析错误：' + JSON.stringify(rows.map((r) => r.name)))
  assert(rows[1].attrs === '', '无属性时 attrs 应为空串，实际 ' + JSON.stringify(rows[1].attrs))
  assert(ex.parseSetCookies({ 'SET-COOKIE': 'x=9' }).length === 1, '大写键名应被识别')
})

t('set-cookie 解析：无 cookie / 空值 / 非对象一律空数组', async () => {
  const ex = await loadModule()
  for (const headers of [undefined, null, {}, { 'content-type': 'text/plain' }, 'oops']) {
    const rows = ex.parseSetCookies(headers)
    assert(Array.isArray(rows) && rows.length === 0, '非 set-cookie 头应返回空数组：' + JSON.stringify(headers))
  }
})

t('Cookies 页签：无 cookie 给 EmptyState「无 Cookies」，有则渲染三列表格', async () => {
  const plain = sampleResp({ headers: { 'content-type': 'text/plain' } })
  const emptyTree = await renderTab({ resp: plain }, 'Cookies')
  assert(emptyTexts(emptyTree).indexOf('无 Cookies') > -1, '应出现「无 Cookies」空态，实际 ' + emptyTexts(emptyTree).join(','))

  const withCookie = sampleResp()
  const tree = await renderTab({ resp: withCookie }, 'Cookies')
  const table = byClass(tree, 'pp-table')[0]
  assert(table, '应渲染 .pp-table')
  const heads = collectNodes(table).filter((n) => n.type === 'th').map((n) => textOf(n))
  assert(heads.join('|') === '名称|值|属性', '三列表头应为 名称/值/属性，实际 ' + heads.join('|'))
  const cells = collectNodes(table).filter((n) => n.type === 'td').map((n) => textOf(n))
  assert(cells.indexOf('sid') > -1 && cells.indexOf('abc') > -1, '未渲染 cookie 名称/值：' + cells.join(','))
  assert(cells.some((c) => c.indexOf('Path=/') > -1), '未渲染 cookie 属性：' + cells.join(','))
})

t('测试结果：通过 / 失败两种 pill，失败带 error 文案', async () => {
  const resp = sampleResp()
  const tree = await renderTab({ resp }, '测试结果')
  const rows = byClass(tree, 'pp-result-row')
  assert(rows.length === 2, '应有两行断言结果，实际 ' + rows.length)
  const oks = byClass(tree, 'pp-pill-ok').filter((n) => textOf(n).trim() === '通过')
  const bads = byClass(tree, 'pp-pill-bad').filter((n) => textOf(n).trim() === '失败')
  assert(oks.length === 1, '应有一个「通过」胶囊，实际 ' + oks.length)
  assert(bads.length === 1, '应有一个「失败」胶囊，实际 ' + bads.length)
  assert(textOf(tree).indexOf('实际 1') > -1, '失败项应展示 error 文案')
})

t('测试结果：无断言给 EmptyState「无断言」', async () => {
  const tree = await renderTab({ resp: sampleResp({ tests: [] }) }, '测试结果')
  assert(emptyTexts(tree).indexOf('无断言') > -1, '应出现「无断言」空态，实际 ' + emptyTexts(tree).join(','))
})

t('实际请求：缺失时给 EmptyState「无请求快照」', async () => {
  const tree = await renderTab({ resp: sampleResp({ request: undefined }) }, '实际请求')
  assert(emptyTexts(tree).indexOf('无请求快照') > -1, '应出现「无请求快照」空态，实际 ' + emptyTexts(tree).join(','))
})

t('实际请求：存在时展示 method 徽标 + url + 请求头 + body', async () => {
  const tree = await renderTab({ resp: sampleResp() }, '实际请求')
  const badge = byClass(tree, 'pp-method')[0]
  assert(badge, '应渲染 .pp-method 徽标')
  assert(badge.props['data-method'] === 'POST', '方法徽标应大写为 POST，实际 ' + badge.props['data-method'])
  assert(textOf(tree).indexOf('https://api.example.test/v1/items') > -1, '应展示请求 url')
  assert(byClass(tree, 'pp-pre').some((n) => textOf(n) === '{"a":1}'), '应展示请求 body 的 pre')
})

t('控制台：logs 逐行进 pre，空则 EmptyState「无日志」', async () => {
  const tree = await renderTab({ resp: sampleResp() }, '控制台')
  const pre = byClass(tree, 'pp-pre')[0]
  assert(pre, '应渲染 .pp-pre')
  assert(textOf(pre) === 'script: before\nscript: after', '日志应逐行拼进 pre，实际 ' + JSON.stringify(textOf(pre)))

  const emptyTree = await renderTab({ resp: sampleResp({ logs: [] }) }, '控制台')
  assert(emptyTexts(emptyTree).indexOf('无日志') > -1, '应出现「无日志」空态，实际 ' + emptyTexts(emptyTree).join(','))
})

t('Body：美化解析 JSON，非法 JSON 回落原文；二级切换可用', async () => {
  const ex = await loadModule()
  assert(ex.prettyBody('{"a":1}') === '{\n  "a": 1\n}', '美化结果偏离：' + JSON.stringify(ex.prettyBody('{"a":1}')))
  assert(ex.prettyBody('not json') === 'not json', '非法 JSON 应回落原文')
  assert(ex.prettyBody('') === '' && ex.prettyBody(null) === '', '空体应返回空串')

  const stub = makeStub()
  const resp = sampleResp({ body: 'not json' })
  const first = await render({ resp }, stub)
  const sub = byClass(first.tree, 'pp-tab').filter((n) => ['美化', '原文'].includes(textOf(n).trim()))
  assert(sub.length === 2, 'Body 页应有「美化 / 原文」二级切换，实际 ' + sub.length)
  assert(sub[0].props['data-active'] === true, '默认应选中「美化」')
  const pre = byClass(first.tree, 'pp-pre')[0]
  assert(textOf(pre) === 'not json', '美化失败应回落原文，实际 ' + JSON.stringify(textOf(pre)))

  // 切到「原文」后 data-active 互换
  sub[1].props.onClick()
  const after = rerender(ex, stub, { resp })
  const sub2 = byClass(after, 'pp-tab').filter((n) => ['美化', '原文'].includes(textOf(n).trim()))
  assert(sub2[1].props['data-active'] === true, '切到原文后「原文」应为激活态')
})

t('状态条：StatusPill + 耗时/大小 + truncated 警告胶囊', async () => {
  const resp = sampleResp({ status: 500, statusText: 'Server Error', bodySize: 2048, timeMs: 1234, truncated: true })
  const { tree } = await render({ resp })
  // StatusPill 是函数组件（stub 不渲染子组件），这里单独求值它的渲染结果做断言。
  const pillNode = collectNodes(tree).find((n) => typeof n.type === 'function' && n.props && 'status' in n.props)
  assert(pillNode, '状态条应含 StatusPill 节点')
  assert(pillNode.props.status === 500, 'StatusPill 应收到 status=500，实际 ' + pillNode.props.status)
  const rendered = pillNode.type(pillNode.props)
  assert(hasCls(rendered, 'pp-pill') && hasCls(rendered, 'pp-pill-bad'), '500 应渲染为 pp-pill pp-pill-bad，实际 ' + cls(rendered))
  assert(textOf(rendered).indexOf('500') > -1, '胶囊文案应含 500，实际 ' + JSON.stringify(textOf(rendered)))
  assert(textOf(tree).indexOf('1234 ms') > -1, '应展示耗时')
  assert(textOf(tree).indexOf('2048 B') > -1, '应展示大小')
  assert(byClass(tree, 'pp-pill-warn').some((n) => textOf(n).trim() === '已截断'), 'truncated 时应显示「已截断」警告胶囊')
})

t('复制：成功调用 clipboard.writeText 且无错误提示', async () => {
  const ex = await loadModule()
  clipboard.copied = null
  clipboard.writeText = (text) => { clipboard.copied = text; return Promise.resolve() }
  const resp = sampleResp()
  const stub = makeStub()
  const first = await render({ resp }, stub)
  const copy = collectNodes(first.tree).find((n) => n.type === 'button' && textOf(n).trim() === '复制')
  assert(copy, '应有复制按钮')
  copy.props.onClick()
  await Promise.resolve()
  await Promise.resolve()
  assert(clipboard.copied === resp.body, '应把响应体写入剪贴板，实际 ' + JSON.stringify(clipboard.copied))
  const after = rerender(ex, stub, { resp })
  assert(byClass(after, 'pp-note-bad').length === 0, '复制成功不应出现错误提示')
})

t('复制：剪贴板失败与不可用时在页面内提示，不弹窗', async () => {
  const ex = await loadModule()
  const resp = sampleResp()

  clipboard.writeText = () => Promise.reject(new Error('denied'))
  const stub = makeStub()
  const first = await render({ resp }, stub)
  collectNodes(first.tree).find((n) => n.type === 'button' && textOf(n).trim() === '复制').props.onClick()
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
  const after = rerender(ex, stub, { resp })
  const notes = byClass(after, 'pp-note-bad')
  assert(notes.length === 1, '失败应出现一条 .pp-note-bad，实际 ' + notes.length)
  assert(textOf(notes[0]).indexOf('复制失败') > -1, '提示文案应含「复制失败」：' + textOf(notes[0]))

  // clipboard 不可用：同步提示
  clipboard.writeText = undefined
  const stub2 = makeStub()
  const second = await render({ resp }, stub2)
  collectNodes(second.tree).find((n) => n.type === 'button' && textOf(n).trim() === '复制').props.onClick()
  const after2 = rerender(ex, stub2, { resp })
  const notes2 = byClass(after2, 'pp-note-bad')
  assert(notes2.length === 1, '剪贴板不可用时应同步提示，实际 ' + notes2.length)
  assert(textOf(notes2[0]).indexOf('复制失败') > -1, '不可用提示应含「复制失败」：' + textOf(notes2[0]))
})

t('静态纪律：无颜色/字号字面量、无 alert/confirm/prompt、无第三方依赖', async () => {
  const src = readFileSync(COMPONENT, 'utf8')
  const colorHits = src.match(/#[0-9a-fA-F]{3,8}\b|rgba?\s*\(/g)
  assert(!colorHits, '出现颜色字面量：' + [...new Set(colorHits || [])].join(','))
  assert(!/font-?[sS]ize\s*:\s*['"\d]/.test(src), '出现字号字面量')
  assert(!/font-?[wW]eight\s*:\s*\d/.test(src), '出现字重字面量')
  assert(!/\balert\s*\(/.test(src), '出现 alert(')
  assert(!/\bconfirm\s*\(/.test(src), '出现 confirm(')
  assert(!/\bprompt\s*\(/.test(src), '出现 prompt(')
  const specs = [...src.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1])
  for (const s of specs) {
    assert(s === 'react' || s.startsWith('./') || s.startsWith('../'), '引入了非本地模块：' + s)
  }
})

t('静态纪律：只用 design-tokens.css 已定义的 .pp-* 类', async () => {
  const src = readFileSync(COMPONENT, 'utf8')
  const css = readFileSync(CSS, 'utf8')
  const defined = new Set((css.match(/\.pp-[a-z0-9-]+/g) || []).map((s) => s.slice(1)))
  const used = new Set(src.match(/pp-[a-z0-9-]+/g) || [])
  // .pp-resp-* 由另一位 teammate 在 CSS 定义（契约允许直接用），此处不参与本套件断言。
  const missing = [...used].filter((c) => !defined.has(c) && c.indexOf('pp-resp-') !== 0)
  assert(missing.length === 0, '使用了未定义的类：' + missing.join(','))
})

/* ---------------- 直接执行（node tests/response-panel.test.js） ---------------- */

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
      console.log('       ' + (err && err.message ? err.message : err))
    }
  }
  console.log('\nresponse-panel: 通过 ' + passed + '，失败 ' + failed + '，共 ' + (passed + failed))
  if (failed > 0) process.exitCode = 1
}
