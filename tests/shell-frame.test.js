/**
 * shell-frame 套件：Apifox 工作台骨架（顶栏 + 三段式 + 页签条）。
 *
 * 独立运行：node tests/shell-frame.test.js
 * lead 接线：tests/run.js 里 import { tests } from './shell-frame.test.js' 后逐条 await t.fn()。
 *
 * 覆盖三层：
 *  1) 静态纪律：只用 .pp-* 类且类必须在 design-tokens.css 定义、无内联颜色/字号字面量、
 *     无 alert/confirm/prompt、不引第三方依赖；
 *  2) 纯函数：parseHash / routeHref / searchHash / nextTheme / readSetting / writeSetting；
 *  3) esbuild 真实打包（与 build.mjs 同配置）+ node:vm 加载 + react stub 渲染骨架，
 *     断言三段式容器、左树 12 条路由、顶栏元素、搜索回车跳转、主题切换写 localStorage、
 *     两段式页面、页面组件从注册表取且 props 为 { route, api }。
 *
 * 依赖：仅 node 内置模块 + esbuild（与 build.mjs 同款解析），不新增依赖。
 * 临时产物写仓库内 .tmp/（Windows 上 esbuild 写系统临时目录会被拒绝）。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const here = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(here, '..')
const SHELL = path.join(REPO, 'src', 'client', 'shell')
const CSS = path.join(REPO, 'src', 'client', 'pages', 'design-tokens.css')
const SHIM = path.join(REPO, 'src', 'client', 'jsx-shim.js')
const TMP = path.join(REPO, '.tmp', 'shell-frame-test')

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

/* ---------------- react stub（委托式：模块绑定固定对象，hook 转发到当前 stub） ---------------- */

/**
 * 有状态 stub：useState 有真实 slot（同一 stub 重渲染读最新值），useEffect 不执行
 * （骨架只在 hashchange 订阅里用它，渲染断言不需要真实事件循环）。
 */
function makeStub() {
  const log = { slots: [], cursor: 0, setState: [] }
  const stub = {
    useState: (init) => {
      const i = log.cursor++
      if (i >= log.slots.length) log.slots[i] = { value: typeof init === 'function' ? init() : init }
      const slot = log.slots[i]
      const set = (nv) => {
        const next = typeof nv === 'function' ? nv(slot.value) : nv
        log.setState.push(next)
        slot.value = next
      }
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

// 打包后的模块在求值时绑定一次 require('react') 的返回值，因此这里返回固定的委托对象，
// hook 调用时再转发给当前 activeStub —— 否则后续用例只能看到首个 stub 的 slot（stale state）。
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

const requireShim = (n) => {
  if (n === 'react') return reactFacade
  throw new Error('意外的 require: ' + n)
}

/* ---------------- 沙箱环境（location / localStorage / document） ---------------- */

const store = new Map()
const lsStub = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)) },
  removeItem: (k) => { store.delete(k) },
}
const themed = []
const docStub = { querySelectorAll: () => themed }
const win = { __postapiQueue: [], addEventListener() {}, removeEventListener() {} }
const loc = { hash: '' }

/* ---------------- 打包 + vm 加载 ---------------- */

/**
 * 临时入口：重新导出 Body.js 全部导出 + 注册表（页面注册与骨架解耦，
 * 测试需要往注册表塞假页面，故显式带上 registry）。
 */
const ENTRY_SRC = [
  "export * from '../../src/client/shell/Body.js'",
  "export { pageRegistry } from '../../src/client/shell/registry.js'",
  "export { zh, en } from '../../src/client/shell/locales.js'",
  "export { ApiTitle } from '../../src/client/shell/ApiTitle.js'",
  '',
].join('\n')

let modCache = null
async function loadShell() {
  if (modCache) return modCache
  if (!existsSync(TMP)) mkdirSync(TMP, { recursive: true })
  const entry = path.join(TMP, 'entry.js')
  writeFileSync(entry, ENTRY_SRC)
  const outfile = path.join(TMP, 'shell-frame.cjs')
  await esbuild.build({
    entryPoints: [entry],
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
  vm.runInNewContext(code, {
    window: win, module: mod, exports: mod.exports, require: requireShim,
    console, location: loc, localStorage: lsStub, document: docStub,
  })
  modCache = { exports: mod.exports, code }
  return modCache
}

/* ---------------- 渲染树工具 ---------------- */

/**
 * 展平渲染树。函数组件（ContextAside / Placeholder / 测试注册的假页面）按 React 语义
 * 就地求值展开——stub 的 createElement 不做渲染，不展开就看不到子树的类名与文本。
 * 只用于本套件内无 hook 的展示型组件；带 hook 的页面组件不在此展开。
 */
function collectNodes(node, acc = []) {
  if (node === null || node === undefined || node === false) return acc
  if (Array.isArray(node)) { for (const n of node) collectNodes(n, acc); return acc }
  if (typeof node !== 'object') return acc
  acc.push(node)
  if (typeof node.type === 'function') {
    collectNodes(node.type(node.props || {}), acc)
    return acc
  }
  if (node.children) collectNodes(node.children, acc)
  return acc
}

function collectText(node) {
  if (node === null || node === undefined || node === false) return ''
  if (Array.isArray(node)) return node.map(collectText).join('')
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (typeof node !== 'object') return ''
  if (typeof node.type === 'function') return collectText(node.type(node.props || {}))
  return collectText(node.children)
}

const cls = (n) => String((n.props && n.props.className) || '')
const byClass = (tree, name) => collectNodes(tree).filter((n) => cls(n).split(/\s+/).includes(name))

function assert(cond, message) {
  if (!cond) throw new Error(message)
}

/**
 * 渲染一轮。传入同一 stub 即复用 hook slot（模拟重渲染：读最新 state）。
 * @param stub - 可选的复用 stub；缺省新建（首次渲染）。
 * @param props - 传给 PostApiBody 的 props。
 */
async function render(stub, props) {
  const mod = await loadShell()
  const s = stub || makeStub()
  activeStub = s
  s.log.cursor = 0
  const tree = mod.exports.PostApiBody(props || {})
  return { tree, stub: s, mod }
}

/* ---------------- 用例 ---------------- */

export const tests = []
const t = (name, fn) => tests.push({ name: 'shell-frame: ' + name, fn })

t('12 条路由齐全且顺序与契约 §3 一致', async () => {
  const { exports: ex } = await loadShell()
  const names = ex.ROUTES.map((r) => r.name)
  const expected = ['overview', 'doc', 'debug', 'mock', 'schema', 'env',
    'history', 'test', 'import', 'flow', 'search', 'settings']
  assert(names.length === 12, '路由条数应为 12，实际 ' + names.length)
  assert(names.join(',') === expected.join(','), '路由顺序偏离契约：' + names.join(','))
  for (const r of ex.ROUTES) {
    assert(r.hash === '#/' + r.name, r.name + ' 的 hash 应为 #/' + r.name)
    assert(typeof r.labelKey === 'string' && r.labelKey.indexOf('nav.') === 0, r.name + ' 缺少 nav.* 文案键')
  }
  assert(ex.PARAM_ROUTES.join(',') === 'doc,schema', 'PARAM_ROUTES 应为 doc,schema')
  assert(ex.TWO_COL_ROUTES.join(',') === 'debug,mock', 'TWO_COL_ROUTES 应为 debug,mock')
})

t('静态纪律：只用 .pp-* 类且类都在 design-tokens.css 定义', async () => {
  const css = readFileSync(CSS, 'utf8')
  const defined = new Set((css.match(/\.pp-[a-z0-9-]+/g) || []).map((s) => s.slice(1)))
  for (const file of ['Body.js', 'ApiTitle.js']) {
    const src = readFileSync(path.join(SHELL, file), 'utf8')
    const used = new Set(src.match(/pp-[a-z0-9-]+/g) || [])
    const missing = [...used].filter((c) => !defined.has(c))
    assert(missing.length === 0, file + ' 使用了 design-tokens.css 未定义的类：' + missing.join(','))
  }
})

t('静态纪律：无内联颜色/字号字面量、无 alert/confirm/prompt', async () => {
  for (const file of ['Body.js', 'ApiTitle.js', 'locales.js']) {
    const src = readFileSync(path.join(SHELL, file), 'utf8')
    const colorHits = src.match(/#[0-9a-fA-F]{3,8}\b|rgba?\s*\(/g)
    assert(!colorHits, file + ' 出现内联颜色字面量：' + [...new Set(colorHits || [])].join(','))
    assert(!/font-?[sS]ize\s*:\s*['"\d]/.test(src), file + ' 出现内联字号字面量')
    assert(!/font-?[wW]eight\s*:\s*\d/.test(src), file + ' 出现内联字重字面量')
    assert(!/\balert\s*\(/.test(src), file + ' 出现 alert(')
    assert(!/\bconfirm\s*\(/.test(src), file + ' 出现 confirm(')
    assert(!/\bprompt\s*\(/.test(src), file + ' 出现 prompt(')
  }
})

t('静态纪律：不引第三方依赖（只允许 react 与本地相对路径）', async () => {
  for (const file of ['Body.js', 'ApiTitle.js', 'locales.js']) {
    const src = readFileSync(path.join(SHELL, file), 'utf8')
    const specs = [...src.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1])
    for (const s of specs) {
      assert(s === 'react' || s.startsWith('./') || s.startsWith('../'), file + ' 引入了非本地模块：' + s)
    }
  }
})

t('纯函数 parseHash：普通路由 / 参数路由 / query / 未知回落', async () => {
  const { exports: ex } = await loadShell()
  let r = ex.parseHash('#/debug')
  assert(r.name === 'debug' && r.arg === '' && r.query === '', '普通路由解析错误：' + JSON.stringify(r))
  r = ex.parseHash('#/doc/ep_1001')
  assert(r.name === 'doc' && r.arg === 'ep_1001', '参数路由解析错误：' + JSON.stringify(r))
  r = ex.parseHash('#/search?q=order%20list')
  assert(r.name === 'search' && r.query === 'q=order%20list', 'query 解析错误：' + JSON.stringify(r))
  r = ex.parseHash('#/nope')
  assert(r.name === 'overview', '未知路由应回落 overview：' + JSON.stringify(r))
  r = ex.parseHash('')
  assert(r.name === 'overview', '空 hash 应回落 overview')
})

t('纯函数 routeHref / searchHash：参数路由保留 arg、搜索做 URL 编码', async () => {
  const { exports: ex } = await loadShell()
  const docRoute = ex.ROUTES.find((r) => r.name === 'doc')
  assert(ex.routeHref(docRoute, { name: 'doc', arg: 'ep_1' }) === '#/doc/ep_1', '参数路由应带 arg')
  assert(ex.routeHref(docRoute, { name: 'doc', arg: '' }) === '#/doc', '无 arg 时用静态 hash')
  const envRoute = ex.ROUTES.find((r) => r.name === 'env')
  assert(ex.routeHref(envRoute, { name: 'env', arg: '' }) === '#/env', '普通路由用静态 hash')
  assert(ex.searchHash('order list') === '#/search?q=order%20list', '搜索应 URL 编码')
  assert(ex.searchHash('  ') === '#/search', '空关键字回落 #/search')
  assert(ex.searchHash(undefined) === '#/search', 'undefined 回落 #/search')
})

t('纯函数 nextTheme / readSetting / writeSetting：localStorage 读写与缺键兜底', async () => {
  const { exports: ex } = await loadShell()
  assert(ex.nextTheme('light') === 'dark', 'light 应切到 dark')
  assert(ex.nextTheme('dark') === 'light', 'dark 应切到 light')
  assert(ex.readSetting('postapi.settings.missing', 'fallback') === 'fallback', '缺键应回落默认值')
  ex.writeSetting('postapi.settings.probe', 'v1')
  assert(store.get('postapi.settings.probe') === 'v1', 'writeSetting 应写入 localStorage')
  assert(ex.readSetting('postapi.settings.probe', 'fallback') === 'v1', 'readSetting 应读到写入值')
  store.delete('postapi.settings.probe')
})

t('骨架容器：.pp-workbench 包 .pp-topbar + 三段式（左 / 中 / 右）', async () => {
  loc.hash = '#/overview'
  const { tree } = await render()
  assert(cls(tree).split(/\s+/).includes('pp-scope'), '根元素应带 pp-scope')
  assert(cls(tree).split(/\s+/).includes('pp-workbench'), '根元素应带 pp-workbench')
  assert(byClass(tree, 'pp-topbar').length === 1, '应渲染 1 个 .pp-topbar')
  assert(byClass(tree, 'pp-body-3col').length === 1, 'overview 应走 .pp-body-3col')
  assert(byClass(tree, 'pp-body-2col').length === 0, 'overview 不应出现 .pp-body-2col')
  assert(byClass(tree, 'pp-col-left').length === 1, '应有左列 .pp-col-left')
  assert(byClass(tree, 'pp-main').length === 1, '应有主区 .pp-main')
  assert(byClass(tree, 'pp-col-right').length === 1, '应有右栏 .pp-col-right')
})

t('左树：12 条 .pp-tree-row，仅当前路由 data-active=true', async () => {
  loc.hash = '#/history'
  const { tree, mod } = await render()
  const rows = byClass(tree, 'pp-tree-row')
  assert(rows.length === 12, '左树应有 12 条路由，实际 ' + rows.length)
  const actives = rows.filter((n) => String(n.props['data-active']) === 'true')
  assert(actives.length === 1, '激活态应恰好 1 条，实际 ' + actives.length)
  assert(collectText(actives[0]).includes(mod.exports.zh['nav.history']), '激活项应是「历史」')
  for (const n of rows) assert(n.type === 'a', '树行应为 <a>（保留 hash 路由）')
})

t('顶栏元素齐全：标题 / 搜索 / 新建接口 / 环境 / 主题 / 设置', async () => {
  loc.hash = '#/test'
  const { tree, mod } = await render()
  const bar = byClass(tree, 'pp-topbar')[0]
  const nodes = collectNodes(bar)
  const title = nodes.find((n) => cls(n).split(/\s+/).includes('pp-topbar-title'))
  assert(title && collectText(title).includes(mod.exports.zh['nav.test']), '顶栏标题应取当前路由 labelKey')
  const input = nodes.find((n) => n.type === 'input')
  assert(input, '顶栏应有搜索输入框')
  assert(cls(input).split(/\s+/).includes('pp-input'), '搜索框应带 .pp-input')
  assert(input.props.placeholder === mod.exports.zh['topbar.searchPlaceholder'], '搜索框占位文案应取字典')
  const buttons = nodes.filter((n) => n.type === 'button')
  assert(buttons.length >= 3, '顶栏至少 3 个按钮（新建接口 / 主题 / 设置），实际 ' + buttons.length)
  for (const b of buttons) assert(cls(b).split(/\s+/).includes('pp-btn'), '按钮应带 .pp-btn')
  const sel = nodes.find((n) => n.type === 'select')
  assert(sel && cls(sel).split(/\s+/).includes('pp-select'), '顶栏应有环境选择 .pp-select')
})

t('搜索回车跳转 #/search?q=<keyword>（空关键字 / 非回车不跳）', async () => {
  loc.hash = '#/overview'
  const first = await render()
  const input1 = collectNodes(first.tree).find((n) => n.type === 'input')
  input1.props.onChange({ target: { value: '订单 order' } })
  // 同一 stub 重渲染：受控 input 读到最新 state
  const second = await render(first.stub)
  const input2 = collectNodes(second.tree).find((n) => n.type === 'input')
  assert(input2.props.value === '订单 order', '输入值应回填到受控 input，实际 ' + JSON.stringify(input2.props.value))
  input2.props.onKeyDown({ key: 'Enter' })
  assert(loc.hash === '#/search?q=' + encodeURIComponent('订单 order'), '回车应跳搜索，实际 ' + loc.hash)
  // 非回车键不跳
  loc.hash = '#/env'
  const third = await render()
  const input3 = collectNodes(third.tree).find((n) => n.type === 'input')
  input3.props.onKeyDown({ key: 'a' })
  assert(loc.hash === '#/env', '非回车键不应跳转，实际 ' + loc.hash)
  // 空关键字不跳
  input3.props.onKeyDown({ key: 'Enter' })
  assert(loc.hash === '#/env', '空关键字不应跳转，实际 ' + loc.hash)
})

t('主题切换：写 localStorage postapi.settings.theme、切 data-theme、同步页面根', async () => {
  store.clear()
  themed.length = 0
  const el = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v } }
  themed.push(el)
  loc.hash = '#/overview'
  const first = await render()
  assert(first.tree.props['data-theme'] === 'light', '默认主题应为 light，实际 ' + first.tree.props['data-theme'])
  const themeBtn = collectNodes(first.tree).find((n) => n.type === 'button' && /深色/.test(collectText(n)))
  assert(themeBtn, '未找到主题切换按钮')
  themeBtn.props.onClick()
  assert(store.get('postapi.settings.theme') === 'dark', '应写入 localStorage，实际 ' + store.get('postapi.settings.theme'))
  assert(el.attrs['data-theme'] === 'dark', '应同步已挂载 .pp-scope 的 data-theme')
  const second = await render(first.stub)
  assert(second.tree.props['data-theme'] === 'dark', '重渲染后 data-theme 应为 dark')
  const back = collectNodes(second.tree).find((n) => n.type === 'button' && /浅色/.test(collectText(n)))
  back.props.onClick()
  assert(store.get('postapi.settings.theme') === 'light', '再切回应写回 light')
  const third = await render(first.stub)
  assert(third.tree.props['data-theme'] === 'light', '再切后 data-theme 应回 light')
  store.clear()
})

t('两段式：debug / mock 走 .pp-body-2col 且无右栏', async () => {
  for (const name of ['debug', 'mock']) {
    loc.hash = '#/' + name
    const { tree } = await render()
    assert(byClass(tree, 'pp-body-2col').length === 1, name + ' 应走 .pp-body-2col')
    assert(byClass(tree, 'pp-body-3col').length === 0, name + ' 不应出现 .pp-body-3col')
    assert(byClass(tree, 'pp-col-right').length === 0, name + ' 不应有右栏')
    assert(byClass(tree, 'pp-main').length === 1, name + ' 应有主区')
  }
})

t('页面渲染：从注册表取组件，props 为 { route, api }；未注册时给 .pp-empty 占位', async () => {
  const { exports: ex } = await loadShell()
  loc.hash = '#/schema/sch_1'
  let seen = null
  ex.pageRegistry.register('schema', (props) => {
    seen = props
    return reactFacade.createElement('div', { 'data-page': 'schema' }, 'SCHEMA_PAGE')
  })
  const { tree } = await render()
  // stub 的 createElement 不渲染子组件：先展平（展开函数组件即触发其调用）再断言。
  const text = collectText(tree)
  assert(seen, '页面组件未被调用')
  assert(seen.route && seen.route.name === 'schema' && seen.route.arg === 'sch_1', 'route 传参错误：' + JSON.stringify(seen.route))
  assert('api' in seen, 'props 应含 api 字段')
  assert(text.includes('SCHEMA_PAGE'), '注册的页面应渲染到 .pp-main')
  assert(byClass(tree, 'pp-empty').length === 0, '已注册页面不应出现空态占位')

  loc.hash = '#/nope' // 未知路由回落 overview；overview 未注册 → 占位
  const second = await render()
  assert(byClass(second.tree, 'pp-empty').length >= 1, '未注册页面应渲染 .pp-empty 占位')
  assert(collectText(second.tree).includes(ex.zh['placeholder.title']), '占位应带「页面未注册」文案')
})

t('右栏：当前页面说明取 aside.page.<route>，快捷入口四条', async () => {
  loc.hash = '#/flow'
  const { tree, mod } = await render()
  const aside = byClass(tree, 'pp-col-right')[0]
  const text = collectText(aside)
  assert(text.includes(mod.exports.zh['aside.page.flow']), '右栏应展示当前页面说明，实际：' + text.slice(0, 120))
  assert(text.includes(mod.exports.zh['aside.shortcuts']), '右栏应有快捷入口分组')
  const links = byClass(aside, 'pp-toc-item')
  assert(links.length === 4, '快捷入口应 4 条，实际 ' + links.length)
})

t('locales：zh/en 键集对齐，topbar / aside 文案齐全', async () => {
  const { exports: ex } = await loadShell()
  const zhKeys = Object.keys(ex.zh).sort()
  const enKeys = Object.keys(ex.en).sort()
  assert(zhKeys.join(',') === enKeys.join(','), 'zh/en 键集不一致：'
    + zhKeys.filter((k) => !enKeys.includes(k)).join(',') + ' | '
    + enKeys.filter((k) => !zhKeys.includes(k)).join(','))
  const need = ['topbar.search', 'topbar.searchPlaceholder', 'topbar.newEndpoint', 'topbar.env',
    'topbar.theme', 'topbar.themeDark', 'topbar.themeLight', 'topbar.settings',
    'aside.nav', 'aside.about', 'aside.shortcuts', 'aside.noContext']
  for (const k of need) {
    assert(ex.zh[k] && ex.en[k], '缺少文案键：' + k)
  }
  for (const name of ['overview', 'doc', 'debug', 'mock', 'schema', 'env', 'history', 'test', 'import', 'flow', 'search', 'settings']) {
    assert(ex.zh['aside.page.' + name] && ex.en['aside.page.' + name], '缺少右栏说明键 aside.page.' + name)
  }
})

t('ApiTitle：渲染 tab.title 且用 token 类（不写死颜色/字号）', async () => {
  const { exports: ex } = await loadShell()
  const stub = makeStub()
  activeStub = stub
  const tree = ex.ApiTitle({ useTabInfo: () => ({ tab: { title: 'PostAPI' } }) })
  assert(collectText(tree).includes('PostAPI'), 'ApiTitle 应渲染 tab.title')
  assert(cls(tree).split(/\s+/).includes('pp-topbar-title'), 'ApiTitle 应带 .pp-topbar-title')
  const svg = collectNodes(tree).find((n) => n.type === 'svg')
  assert(svg && cls(svg).split(/\s+/).includes('pp-accent'), '图标应走 .pp-accent（currentColor）')
  const gap = String((tree.props && tree.props.style && tree.props.style.gap) || '')
  assert(gap.indexOf('var(--') === 0, '内联间距应引用 token，实际 ' + gap)
})

t('打包产物：无裸 React.createElement、不 require react/jsx-runtime', async () => {
  const { code } = await loadShell()
  assert(!code.includes('React.createElement'), '产物出现裸 React.createElement（应走 jsx-shim 工厂）')
  assert(!code.includes('react/jsx-runtime'), '产物不应 require react/jsx-runtime')
})

/* ---------------- 直接执行块 ---------------- */

const isMain = (() => {
  try {
    const argv1 = process.argv[1]
    return Boolean(argv1) && path.resolve(argv1) === fileURLToPath(import.meta.url)
  } catch {
    return false
  }
})()

if (isMain) {
  let passed = 0
  let failed = 0
  for (const c of tests) {
    try {
      await c.fn()
      passed += 1
      console.log('  PASS ' + c.name)
    } catch (err) {
      failed += 1
      console.log('  FAIL ' + c.name)
      console.log('       ' + (err && err.message ? err.message : err))
    }
  }
  console.log('\nshell-frame: 通过 ' + passed + '，失败 ' + failed + '，共 ' + (passed + failed))
  if (failed > 0) process.exitCode = 1
}
