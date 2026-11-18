/**
 * T2 客户端构建与注册形态固化（对齐 db-tool 生产形态）。
 *
 * 独立运行：node tests/client/registration.test.js
 * lead 接线：import { tests } 后逐条 await t.fn()（同 tests/run.js 形态）。
 *
 * 断言四件事：
 *  1) 产物只 require('react')，不得出现 react/jsx-runtime（宿主 __ModuleLoader__
 *     的 require 只保证 react 可达，automatic runtime 会让整个模块加载失败）；
 *  2) 类型定义 priority === 'extension'、guide 单条且 icon 是 React 组件（缺 icon
 *     时官方 guide 只画立方体占位图，入口无插件标识）；
 *  3) apply 在宿主缺 sidebarRightTabs / slots 时 console.warn 一次、不抛错、不注册；
 *  4) 正常 ctx 下注册面完整：1 个类型 + 2 个席位（key 均为 definition.id）+ 6 个 effect。
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(here, '..', '..', 'dist', 'client.js')

const reactStub = {
  createElement: (type, props, ...children) => ({ type, props, children }),
  Fragment: 'Fragment',
  useState: (v) => [typeof v === 'function' ? v() : v, () => {}],
  useEffect: () => {},
  useRef: (v) => ({ current: v }),
  useMemo: (fn) => fn(),
  useCallback: (fn) => fn(),
  useLayoutEffect: () => {},
  useSyncExternalStore: (_sub, get) => get(),
}

/** 加载产物：require 只放行 react，其它一律抛错（等同宿主 __ModuleLoader__ 行为）。 */
function loadModule() {
  const code = readFileSync(DIST, 'utf8')
  const required = []
  const requireShim = (name) => {
    required.push(name)
    if (name === 'react') return reactStub
    throw new Error('宿主 require 未提供模块: ' + name)
  }
  let def
  const win = { __ModuleLoader__: { load(d) { def = d } } }
  vm.runInNewContext(code, { window: win, console, fetch: () => Promise.reject(new Error('no fetch')) })
  const mod = def.factory(requireShim)
  return { code, mod, required, win }
}

/** 记录器式 ctx（含 disposer 收集）。 */
function makeCtx(overrides = {}) {
  const state = { types: [], seats: [], effects: [], warns: [] }
  const ctx = {
    locale: {
      bind: (ns) => (key) => ns + ':' + key,
      register: (ns, dict) => { state.locale = { ns, dict }; return () => {} },
    },
    sidebarRightTabs: {
      register: (def) => { state.types.push(def); return () => {} },
    },
    slots: {
      inject: (name, fn) => { state.effects.push(['inject', name]); return fn() },
      register: (def, comp) => { state.seats.push({ name: def.name, key: def.key, comp }); return () => {} },
    },
    effect: (fn, label) => { state.effects.push(['effect', label]); const d = fn(); return () => { if (typeof d === 'function') d() } },
    ...overrides,
  }
  return { ctx, state }
}

export const tests = [
  {
    name: '产物只 require react，不含 react/jsx-runtime',
    fn() {
      const { code, required } = loadModule()
      assert.equal(code.includes('react/jsx-runtime'), false, 'dist/client.js 仍引用 react/jsx-runtime')
      assert.deepEqual([...new Set(required)], ['react'], '产物 require 列表应只有 react，实际: ' + [...new Set(required)].join(','))
    },
  },
  {
    name: 'exports.inject 为内置 face（slots/locale/sidebarRightTabs）',
    fn() {
      const { mod } = loadModule()
      assert.deepEqual([...mod.inject].sort(), ['locale', 'sidebarRightTabs', 'slots'])
    },
  },
  {
    name: '类型定义 priority=extension、keepMounted、guide 单条且 icon 是组件',
    fn() {
      const { mod } = loadModule()
      const { ctx, state } = makeCtx()
      mod.apply(ctx)
      assert.equal(state.types.length, 1)
      const def = state.types[0]
      assert.equal(def.id, 'postapi')
      assert.equal(def.kind, 'postapi')
      assert.equal(def.keepMounted, true)
      assert.equal(def.priority, 'extension')
      assert.equal(Array.isArray(def.guide) && def.guide.length, 1)
      assert.equal(def.guide[0].id, 'postapi', 'guide 条目 id 应与类型 id 一致（空态入口按它开页签）')
      assert.equal(typeof def.guide[0].icon, 'function', 'guide 条目必须带 icon 组件')
      const icon = def.guide[0].icon({ size: 18 })
      assert.equal(icon.type, 'svg')
      assert.equal(icon.props.width, 18)
    },
  },
  {
    name: '正常 ctx：2 个席位 key 均为 definition.id，effect 共 6 个',
    fn() {
      const { mod } = loadModule()
      const { ctx, state } = makeCtx()
      mod.apply(ctx)
      const paneSeats = state.seats.filter(s => s.name.startsWith('sidebar.right.pane.tab'))
      assert.equal(paneSeats.length, 2)
      for (const seat of paneSeats) assert.equal(seat.key, 'postapi')
      assert.deepEqual(paneSeats.map(s => s.name).sort(),
        ['sidebar.right.pane.tab', 'sidebar.right.pane.tab.title'])
      // composer 徽章是保留的官方 slot（契约 §4），不计入右栏席位
      assert.equal(state.seats.some(s => s.name === 'conversation.composer.dock'), true)
      assert.equal(state.effects.filter(e => e[0] === 'effect').length, 6)
    },
  },
  {
    name: 'locale 缺失时仍完成注册，title 回落中文原文',
    fn() {
      const { mod } = loadModule()
      const { ctx, state } = makeCtx({ locale: undefined })
      assert.doesNotThrow(() => mod.apply(ctx))
      assert.equal(state.types.length, 1)
      assert.equal(state.types[0].title(), 'PostAPI')
      assert.equal(state.types[0].guide[0].title(), '打开 PostAPI')
      // 无 locale 时不注册字典（effect 数相应少 1）
      assert.equal(state.effects.filter(e => e[0] === 'effect').length, 5)
    },
  },
  {
    name: '服务缺失时 warn 一次、不抛错、不注册',
    fn() {
      const { mod } = loadModule()
      const warns = []
      const origWarn = console.warn
      console.warn = (...args) => warns.push(args)
      try {
        const { ctx, state } = makeCtx({ sidebarRightTabs: undefined, slots: undefined })
        assert.doesNotThrow(() => mod.apply(ctx))
        assert.equal(warns.length, 1)
        assert.equal(String(warns[0][0]).includes('sidebarRightTabs'), true)
        assert.equal(state.types.length, 0)
        assert.equal(state.seats.length, 0)
      } finally {
        console.warn = origWarn
      }
    },
  },
]

// 直接执行（node tests/client/registration.test.js）
const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
if (invokedDirectly) {
  let failed = 0
  for (const t of tests) {
    try {
      await t.fn()
      console.log('  PASS ' + t.name)
    } catch (err) {
      failed += 1
      console.log('  FAIL ' + t.name)
      console.log('       ' + (err && err.message ? err.message : err))
    }
  }
  console.log('结果：通过 ' + (tests.length - failed) + '，失败 ' + failed + '，共 ' + tests.length)
  if (failed > 0) process.exitCode = 1
}
