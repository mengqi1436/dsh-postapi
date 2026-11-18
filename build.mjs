/**
 * esbuild 打包：src/client/** -> dist/client.js 单文件（window.__ModuleLoader__
 * 产物形态，JSX classic transform（走 React.createElement，只 require react），
 * react 与 @deepseek-ai/* 走宿主 require）。
 * 构建后附 node:vm smoke：加载产物、运行 factory、以假 ctx 跑 apply 断言注册面，
 * 并验证 __postapiApi 为同源 HTTP 桥形态（storage 9 方法 + request.send）。
 */
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

/** esbuild 解析：优先工作区 node_modules（lead 后续补依赖即生效），
 *  回落 .research/sidebar/node_modules（当前研究区安装），最后交默认解析。 */
function loadEsbuild() {
  const candidates = [
    path.join(here, 'node_modules'),
    path.join(here, '.research', 'sidebar'),
  ]
  for (const dir of candidates) {
    if (existsSync(path.join(dir, 'node_modules', 'esbuild'))) {
      const req = createRequire(path.join(dir, 'noop.js'))
      return req('esbuild')
    }
  }
  const req = createRequire(path.join(here, 'noop.js'))
  return req('esbuild')
}

const esbuild = loadEsbuild()

mkdirSync(path.join(here, 'dist'), { recursive: true })

await esbuild.build({
  entryPoints: [path.join(here, 'src/client/index.js')],
  outfile: path.join(here, 'dist/client.js'),
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: ['es2022'],
  // classic runtime：JSX 编译成 createElement/Fragment，由 inject 的 jsx-shim 提供，
  // 产物只 require('react')。宿主 __ModuleLoader__ 的 require 只保证 react 可达，
  // automatic runtime 会额外 require('react/jsx-runtime') 而拿不到模块。
  jsx: 'transform',
  // 显式指定 JSX 工厂为 createElement/Fragment：这两个自由标识符由下方 inject 的
  // jsx-shim 提供。若用 esbuild 默认工厂（React.createElement），未默认导入 React 的
  // 页面模块会产出裸 React.createElement，在宿主里直接 ReferenceError（页面白屏）。
  jsxFactory: 'createElement',
  jsxFragment: 'Fragment',
  inject: [path.join(here, 'src/client/jsx-shim.js')],
  loader: { '.js': 'jsx' },
  external: ['react', 'react-dom', '@deepseek-ai/*'],
  banner: {
    js: [
      "window.__ModuleLoader__.load({",
      "  id: 'dsh-postapi',",
      "  factory(require) {",
      "    var module = { exports: {} };",
      "    var exports = module.exports;",
    ].join('\n'),
  },
  footer: {
    js: [
      '',
      // esbuild cjs 会重新赋值 module.exports，而宿主在 factory 开头缓存的 exports 仍是旧引用；
      // 回写一次，宿主读到的才是真导出（否则 apply/inject 全丢，页签静默不注册）。
      '    Object.assign(exports, module.exports);',
      "    return module.exports;",
      '  },',
      '});',
      '',
    ].join('\n'),
  },
  logLevel: 'info',
  minify: false,
  sourcemap: false,
})

/* ---------------- smoke：vm 加载产物 + 假 ctx 跑 apply ---------------- */

const code = readFileSync(path.join(here, 'dist/client.js'), 'utf8')
if (!code.startsWith('window.__ModuleLoader__.load({')) {
  console.error('smoke 失败：产物头部不是 window.__ModuleLoader__.load({')
  process.exit(1)
}

const reactShim = {
  createElement: (type, props, ...children) => ({ type, props, children }),
  Fragment: 'Fragment',
  useState: (v) => [v, () => {}],
  useEffect: () => {},
  useRef: (v) => ({ current: v }),
  useMemo: (fn) => fn(),
  useCallback: (fn) => fn(),
  useLayoutEffect: () => {},
}
// 只放行 react：产物若仍 require('react/jsx-runtime') 会在此直接炸掉，
// 这正是 automatic runtime 在宿主 __ModuleLoader__ 下拿不到模块的失败模式。
const requireShim = (name) => {
  if (name === 'react') return reactShim
  throw new Error('smoke: 意外的宿主 require: ' + name)
}

let loaded
const sandboxWindow = { __ModuleLoader__: { load(def) { loaded = def } } }
const sandbox = { window: sandboxWindow, require: requireShim, console }
vm.createContext(sandbox)
vm.runInContext(code, sandbox, { filename: 'dist/client.js' })

const assert = (cond, message) => {
  if (!cond) {
    console.error('smoke 失败：' + message)
    process.exit(1)
  }
}

assert(!code.includes('react/jsx-runtime'), '产物不得 require react/jsx-runtime（宿主 require 只保证 react）')
// 回归：JSX 必须全部编译成 createElement（由 inject 的 jsx-shim 提供）；
// 出现裸 React.createElement 表示某页面模块没有 React 绑定，运行时会 ReferenceError。
const bareReact = code.split('React.createElement').length - 1
assert(bareReact === 0, '产物不得出现裸 React.createElement（应用 createElement 工厂），实际 ' + bareReact + ' 处')
assert(loaded && loaded.id === 'dsh-postapi', 'load id 应为 dsh-postapi')
assert(typeof loaded.factory === 'function', 'factory 应为函数')

const exp = loaded.factory(requireShim)
// 回归：宿主在 factory 开头缓存 exports 引用，esbuild 会重赋值 module.exports；
// 必须回写才能让宿主读到 apply/inject（曾导致页签静默不注册）。
assert(exp && typeof exp.apply === 'function' && Array.isArray(exp.inject), 'factory 返回值应含 apply/inject')
assert(exp && typeof exp.apply === 'function', 'exports.apply 应为函数')
assert(Array.isArray(exp.inject) && exp.inject.includes('sidebarRightTabs'), 'inject 应声明 sidebarRightTabs')
assert(!exp.inject.includes('postapi.storage') && !exp.inject.includes('postapi.request'), 'inject 不应声明 postapi.* 自定义 face（宿主总线只认内置 face）')

const calls = []
const fakeCtx = {
  locale: {
    bind: (ns) => (key) => ns + ':' + key,
    register: (ns, dict) => { calls.push(['locale.register', ns, Object.keys(dict ?? {})]) },
  },
  sidebarRightTabs: {
    register: (def) => { calls.push(['tabs.register', def]); return () => {} },
  },
  slots: {
    inject: (name, fn) => { calls.push(['slots.inject', name]); return fn() },
    register: (def, comp) => { calls.push(['slots.register', def.name, def.key ?? def.id, def.locale ?? null]); return () => {} },
  },
  effect: (fn, label) => {
    calls.push(['effect', label])
    const result = fn()
    // cordis Fiber#_execute 只接受函数 / null / Promise / 迭代器；普通对象会抛 Invalid effect，
    // 整个 apply 失败、宿主回滚所有注册（页签静默消失）。smoke 必须同样严格。
    const ok = result === undefined || result === null || typeof result === 'function'
      || typeof result.then === 'function' || typeof result[Symbol.iterator] === 'function'
      || typeof result[Symbol.asyncIterator] === 'function'
    assert(ok, 'effect「' + label + '」返回值不是合法 disposer（' + typeof result + '），宿主会抛 Invalid effect')
    return typeof result === 'function' ? result : () => {}
  },
}
exp.apply(fakeCtx)

const tabDef = calls.find(c => c[0] === 'tabs.register')
assert(tabDef && tabDef[1].id === 'postapi', 'definition.id 应为 postapi')
assert(tabDef[1].kind === 'postapi', 'definition.kind 应为 postapi')
assert(tabDef[1].keepMounted === true, 'keepMounted 应为 true')
assert(Array.isArray(tabDef[1].guide) && tabDef[1].guide.length === 1, 'guide 应为单入口')
const injects = calls.filter(c => c[0] === 'slots.inject').map(c => c[1])
for (const slot of ['sidebar.right.pane.tab', 'sidebar.right.pane.tab.title', 'conversation.composer.dock']) {
  assert(injects.includes(slot), '应接线 slot: ' + slot)
}
const bodyReg = calls.find(c => c[0] === 'slots.register' && c[1] === 'sidebar.right.pane.tab')
assert(bodyReg && bodyReg[2] === 'postapi', 'body 席位 key 应为 definition.id（postapi）')
assert(sandboxWindow.__postapiPages && typeof sandboxWindow.__postapiPages.register === 'function', '__postapiPages.register 应存在')
const registeredPages = typeof sandboxWindow.__postapiPages.names === 'function' ? sandboxWindow.__postapiPages.names() : []
const EXPECTED_PAGES = ['overview', 'doc', 'debug', 'mock', 'schema', 'env', 'history', 'test', 'import', 'flow', 'search', 'settings']
const missingPages = EXPECTED_PAGES.filter((p) => !registeredPages.includes(p))
assert(missingPages.length === 0, '页面应已注册进注册表（队列重放生效），缺失: ' + missingPages.join(','))
assert(sandboxWindow.__postapiApi, '__postapiApi 应已挂载')
const STORAGE_METHODS = ['listProjects', 'createProject', 'renameProject', 'deleteProject', 'getProject',
  'saveEndpoint', 'deleteEndpoint', 'saveFolder', 'deleteFolder',
  'moveNode', 'saveSchema', 'deleteSchema', 'saveEnvironment', 'deleteEnvironment', 'saveGlobals',
  'saveProjectSettings', 'saveFlow', 'saveResponse', 'deleteResponse',
  'getHistory', 'appendHistory', 'clearHistory', 'search']
for (const m of STORAGE_METHODS) {
  assert(typeof sandboxWindow.__postapiApi.storage[m] === 'function', '__postapiApi.storage.' + m + ' 应为桥方法函数')
}
assert(typeof sandboxWindow.__postapiApi.request.send === 'function', '__postapiApi.request.send 应为桥方法函数')
const effects = calls.filter(c => c[0] === 'effect')
assert(effects.length === 6, 'apply 应恰好 6 个 ctx.effect 注册，实际 ' + effects.length)

console.log('')
console.log('smoke 通过：ModuleLoader 形态 / apply / inject（内置 face）/ 6 个 effect / 席位 key=postapi / __postapiPages / __postapiApi 桥形态（9 storage + request.send）全部断言成功')
