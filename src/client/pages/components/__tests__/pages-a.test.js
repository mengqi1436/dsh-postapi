// pages-a.test.js — pages-a 三页（doc / debug / mock）与共用组件的静态 + 行为测试
// 双模式：node 直跑（自建 mini runner）或由 lead 的 tests/run.js 收录（导出 tests 数组）。
// 行为测试不引 react-dom：用 esbuild 把页面打成 cjs（external react + jsx-shim），
// 在 vm 里用假 react 加载，取导出纯函数真跑（不渲染）。
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import vm from 'node:vm'
// Apifox 化专项用例（doc/debug 两页 + 四组件）：独立文件便于单跑，这里拼进同一套件，
// 使 tests/run.js 的 pages-a 收录点自动覆盖（run.js 属 lead 范围，不新增收录行）。
import { tests as apifoxUiTests } from './apifox-ui.test.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const COMPONENTS_DIR = resolve(__dirname, '..')
const PAGES_DIR = resolve(COMPONENTS_DIR, '..')
const ROOT = resolve(PAGES_DIR, '..', '..', '..')

const PAGE_FILES = {
  doc: join(PAGES_DIR, 'doc.jsx'),
  debug: join(PAGES_DIR, 'debug.jsx'),
  mock: join(PAGES_DIR, 'mock.jsx'),
}
const COMPONENT_FILES = ['EmptyState.jsx', 'StatusPill.jsx', 'ParamTable.jsx', 'JsonEditor.jsx']

const read = (file) => (existsSync(file) ? readFileSync(file, 'utf8') : '')

function assert(cond, message) {
  if (!cond) throw new Error(message)
}

/* ---------------- esbuild + vm：加载页面模块取导出纯函数 ---------------- */

function loadEsbuild() {
  const candidates = [ROOT, join(ROOT, '.research', 'sidebar')]
  for (const dir of candidates) {
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

async function loadPageModule(file) {
  const esbuild = loadEsbuild()
  const built = await esbuild.build({
    entryPoints: [file],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'browser',
    target: ['es2022'],
    jsx: 'transform',
    inject: [join(ROOT, 'src', 'client', 'jsx-shim.js')],
    loader: { '.js': 'jsx' },
    external: ['react'],
    logLevel: 'silent',
  })
  const code = built.outputFiles[0].text
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
  vm.runInContext(code, sandbox, { filename: file })
  return { exports: module.exports, queue: sandbox.window.__postapiQueue }
}

/* ---------------- 静态规则 ---------------- */

const BANNED_APIS = [/\balert\s*\(/, /\bconfirm\s*\(/, /\bprompt\s*\(/]
const HARDCODED_COLOR = /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b|\brgba?\s*\(|\bhsla?\s*\(/
const HARDCODED_FONT = /fontSize\s*:\s*['"?]?\d/
const HEIGHT_RE = new RegExp('\\b(minHeight|maxHeight|height)\\s*:\\s*[\'"\x60]([^\'"\x60]+)[\'"\x60]', 'g')
const HEIGHT_OK = /^var\(--(ctl|row|pill)-h\)$/
const HEIGHT_AUTO = new Set(['100%', 'auto', 'inherit', 'fit-content', 'min-content', 'max-content'])
const BRIDGE_FETCH = new RegExp('fetch\\(\\s*[\'"\x60]/dsh-postapi')

function heightViolations(src, label) {
  const bad = []
  let m
  HEIGHT_RE.lastIndex = 0
  while ((m = HEIGHT_RE.exec(src))) {
    const value = String(m[2]).trim()
    if (HEIGHT_OK.test(value) || HEIGHT_AUTO.has(value)) continue
    if (/^calc\(/.test(value) && /var\(--(ctl|row|pill)-h\)|100%/.test(value)) continue
    const line = src.slice(0, m.index).split('\n').length
    bad.push(label + ':' + line + ' ' + m[1] + ':' + value)
  }
  return bad
}

/* ---------------- 测试集 ---------------- */

const PAGE_SPECS = [
  { name: 'doc', exportName: 'DocPage' },
  { name: 'debug', exportName: 'DebugPage' },
  { name: 'mock', exportName: 'MockPage' },
]

const pagesATests = [
  {
    name: 'pages-a: 三页文件存在且首部自注册到 __postapiQueue',
    fn() {
      for (const spec of PAGE_SPECS) {
        const src = read(PAGE_FILES[spec.name])
        assert(src !== '', spec.name + '.jsx 不存在')
        const re = new RegExp("__postapiQueue[^\\n]*\\.push\\(\\['" + spec.name + "'")
        assert(re.test(src), spec.name + '.jsx 缺少 push([\'' + spec.name + '\', ...]) 自注册')
        assert(
          new RegExp('export function ' + spec.exportName).test(src),
          spec.name + '.jsx 缺少命名导出 ' + spec.exportName,
        )
      }
    },
  },
  {
    name: 'pages-a: 页面根元素为 pp-scope pp-page + data-page + applyTheme',
    fn() {
      for (const spec of PAGE_SPECS) {
        const src = read(PAGE_FILES[spec.name])
        // 根类必须是 pp-scope 起头，且带 pp-page 或 pp-page-flush
        // （doc/debug 是 Apifox 三段式/调试台，用 pp-page-flush 取消外层内边距，排版交给 .pp-body-3col / .pp-debug-layout）
        assert(/className="pp-scope pp-page(-flush)?(\s[^"]*)?"/.test(src), spec.name + '.jsx 根元素缺 pp-scope pp-page(-flush)')
        assert(src.includes('data-page="' + spec.name + '"'), spec.name + '.jsx 根元素缺 data-page')
        assert(/useEffect\(\(\) => applyTheme\(rootRef\.current\)/.test(src), spec.name + '.jsx 未调用 applyTheme')
      }
    },
  },
  {
    name: 'pages-a: 无 alert/confirm/prompt 与硬编码桥 fetch 路径',
    fn() {
      const files = [PAGE_FILES.doc, PAGE_FILES.debug, PAGE_FILES.mock]
        .concat(COMPONENT_FILES.map((f) => join(COMPONENTS_DIR, f)))
      for (const file of files) {
        const src = read(file)
        assert(src !== '', file + ' 不存在')
        for (const re of BANNED_APIS) {
          assert(!re.test(src), file + ' 使用了禁用 API（alert/confirm/prompt）')
        }
        assert(!BRIDGE_FETCH.test(src), file + ' 直接写了桥 fetch 路径')
      }
    },
  },
  {
    name: 'pages-a: 只 import react 与本地相对路径，无 npm 依赖',
    fn() {
      const files = [PAGE_FILES.doc, PAGE_FILES.debug, PAGE_FILES.mock]
        .concat(COMPONENT_FILES.map((f) => join(COMPONENTS_DIR, f)))
      for (const file of files) {
        const src = read(file)
        const re = /from\s+['"]([^'"]+)['"]/g
        let m
        while ((m = re.exec(src))) {
          const spec = m[1]
          const ok = spec === 'react' || spec.charAt(0) === '.'
          assert(ok, file + ' 引入了非白名单模块：' + spec)
        }
      }
    },
  },
  {
    name: 'pages-a: 无内联颜色/字号字面量',
    fn() {
      const files = [PAGE_FILES.doc, PAGE_FILES.debug, PAGE_FILES.mock]
        .concat(COMPONENT_FILES.map((f) => join(COMPONENTS_DIR, f)))
      for (const file of files) {
        const src = read(file)
        assert(!HARDCODED_COLOR.test(src), file + ' 出现颜色字面量（应用 var(--*) token）')
        assert(!HARDCODED_FONT.test(src), file + ' 出现字号字面量（应用 var(--fs-*) token）')
      }
    },
  },
  {
    name: 'pages-a: 内联高度只引用尺寸 token',
    fn() {
      const files = [PAGE_FILES.doc, PAGE_FILES.debug, PAGE_FILES.mock]
        .concat(COMPONENT_FILES.map((f) => join(COMPONENTS_DIR, f)))
      const bad = []
      for (const file of files) bad.push(...heightViolations(read(file), file.replace(ROOT, '')))
      assert(bad.length === 0, '高度未引用 token：\n' + bad.join('\n'))
    },
  },
  {
    name: 'pages-a: api 缺失时渲染 mock 并标注「示例数据」',
    fn() {
      for (const spec of PAGE_SPECS) {
        const src = read(PAGE_FILES[spec.name])
        assert(src.includes('示例数据'), spec.name + '.jsx 未标注「示例数据」')
        assert(/isMock/.test(src), spec.name + '.jsx 缺 isMock 状态')
      }
    },
  },
  {
    name: 'pages-a: doc 页真接 api（listProjects/getProject/saveResponse）且含四组参数表 + TOC + cURL',
    fn() {
      const src = read(PAGE_FILES.doc)
      for (const need of ['listProjects', 'getProject', 'saveResponse']) {
        assert(src.includes(need), 'doc.jsx 未接 storage.' + need)
      }
      for (const sec of ['sec-path', 'sec-params', 'sec-headers', 'sec-cookies', 'sec-body', 'sec-auth', 'sec-response']) {
        assert(src.includes(sec), 'doc.jsx 缺锚点 ' + sec)
      }
      assert(src.includes('ParamTable'), 'doc.jsx 未使用 ParamTable')
      assert(src.includes('复制为 cURL'), 'doc.jsx 缺「复制为 cURL」')
      assert(src.includes('navigator.clipboard'), 'doc.jsx 未走剪贴板 API')
      // v2：右 TOC 改成主区顶部锚点条（.pp-anchor-chip），窄容器里不再吃 240px
      assert(src.includes('pp-anchor-chip'), 'doc.jsx 缺页内锚点条（v2 取代右 TOC）')
    },
  },
  {
    name: 'pages-a: debug 页真接 api（request.send / saveEndpoint）且含状态胶囊与断言列表',
    fn() {
      const src = read(PAGE_FILES.debug)
      assert(src.includes('request') && src.includes('send'), 'debug.jsx 未接 request.send')
      assert(src.includes('saveEndpoint'), 'debug.jsx 未接 storage.saveEndpoint')
      assert(src.includes('StatusPill'), 'debug.jsx 未使用 StatusPill')
      assert(src.includes('resp.tests'), 'debug.jsx 缺断言结果列表')
      assert(src.includes('pp-debug-layout'), 'debug.jsx 缺紧凑三栏布局类')
      assert(src.includes('#/history'), 'debug.jsx 缺历史回放入口')
      for (const tab of ["'params'", "'headers'", "'body'", "'auth'"]) {
        assert(src.includes(tab), 'debug.jsx 缺页签 ' + tab)
      }
    },
  },
  {
    name: 'pages-a: mock 页真接 api（mock.start/stop/status + saveEndpoint）',
    fn() {
      const src = read(PAGE_FILES.mock)
      for (const need of ['mockApi.start', 'mockApi.stop', 'mockApi.status', 'saveEndpoint']) {
        assert(src.includes(need), 'mock.jsx 未接 ' + need)
      }
      assert(src.includes('命中地址'), 'mock.jsx 缺命中地址展示')
      assert(src.includes('延迟'), 'mock.jsx 缺延迟设置')
    },
  },
  {
    name: 'pages-a: buildCurl 生成 method/query/header/auth/body 完整命令',
    async fn() {
      const { exports } = await loadPageModule(PAGE_FILES.doc)
      assert(typeof exports.buildCurl === 'function', 'doc.jsx 未导出 buildCurl')
      const curl = exports.buildCurl({
        method: 'POST',
        url: '/api/v1/orders/{orderId}',
        pathParams: [{ key: 'orderId', value: 'ORD-9', enabled: true }],
        params: [{ key: 'page', value: '2', enabled: true }, { key: 'skip', value: 'x', enabled: false }],
        headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
        auth: { type: 'bearer', token: '{{token}}' },
        body: { type: 'json', content: '{"a":1}' },
      }, 'https://api.example.test')
      assert(curl.includes("curl -X POST 'https://api.example.test/api/v1/orders/ORD-9?page=2'"), 'cURL URL 拼接不正确：' + curl)
      assert(!curl.includes('skip='), 'cURL 不应包含 enabled=false 的参数')
      assert(curl.includes("-H 'Accept: application/json'"), 'cURL 缺 header')
      assert(curl.includes("-H 'Authorization: Bearer {{token}}'"), 'cURL 缺 bearer 认证')
      assert(curl.includes("--data-raw '{\"a\":1}'"), 'cURL 缺 body')
      assert(exports.buildCurl(null, '') === '', 'buildCurl(null) 应返回空串')
    },
  },
  {
    name: 'pages-a: collectVarRefs 收集 {{var}} 且去重；varTable 合并 globals 与环境',
    async fn() {
      const { exports } = await loadPageModule(PAGE_FILES.debug)
      assert(typeof exports.collectVarRefs === 'function', 'debug.jsx 未导出 collectVarRefs')
      assert(typeof exports.varTable === 'function', 'debug.jsx 未导出 varTable')
      const refs = exports.collectVarRefs({
        url: '/x/{{id}}/{{id}}',
        params: [{ key: 'q', value: '{{kw}}' }],
        headers: [],
        body: { content: '{"t":"{{token}}"}' },
        auth: { token: '{{authToken}}' },
      })
      assert(JSON.stringify(refs) === JSON.stringify(['id', 'kw', 'token', 'authToken']), '变量收集结果不符：' + JSON.stringify(refs))
      assert(JSON.stringify(exports.collectVarRefs(null)) === '[]', 'collectVarRefs(null) 应为空数组')

      const project = {
        globals: { variables: [{ key: 'g', value: '1', enabled: true }, { key: 'off', value: 'x', enabled: false }] },
        environments: [
          { id: 'env_a', name: 'A', baseUrl: 'https://a.test', isDefault: false, variables: [{ key: 'a', value: '2', enabled: true }] },
          { id: 'env_b', name: 'B', baseUrl: 'https://b.test', isDefault: true, variables: [{ key: 'a', value: '3', enabled: true }] },
        ],
      }
      const explicit = exports.varTable(project, 'env_a')
      assert(explicit.table.g === '1' && explicit.table.a === '2', '指定环境未生效：' + JSON.stringify(explicit.table))
      assert(explicit.table.off === undefined, 'enabled=false 的变量不应进入表')
      const fallback = exports.varTable(project, '不存在')
      assert(fallback.env.id === 'env_b', '缺省应回落 isDefault 环境')
      assert(fallback.table.a === '3', '默认环境变量值不正确')
    },
  },
  {
    name: 'pages-a: prettyJson 美化合法 JSON 且原文回落非法 JSON',
    async fn() {
      const { exports } = await loadPageModule(PAGE_FILES.debug)
      assert(typeof exports.prettyJson === 'function', 'debug.jsx 未导出 prettyJson')
      assert(exports.prettyJson('{"a":1}') === '{\n  "a": 1\n}', 'prettyJson 美化结果不正确')
      assert(exports.prettyJson('not json') === 'not json', 'prettyJson 非法 JSON 应回落原文')
      assert(exports.prettyJson(null) === '', 'prettyJson(null) 应为空串')
    },
  },
  {
    name: 'pages-a: hitUrls 生成两种命中地址形态',
    async fn() {
      const { exports } = await loadPageModule(PAGE_FILES.mock)
      assert(typeof exports.hitUrls === 'function', 'mock.jsx 未导出 hitUrls')
      const urls = exports.hitUrls('proj_1', { id: 'ep_1', url: '/api/v1/orders' }, 4010)
      assert(urls.length === 2, '命中地址应为 2 条')
      assert(urls[0] === 'http://127.0.0.1:4010/mock/proj_1/ep_1', '按 endpointId 命中地址不正确：' + urls[0])
      assert(urls[1] === 'http://127.0.0.1:4010/mock/proj_1/api/v1/orders', '按 path 命中地址不正确：' + urls[1])
      assert(exports.hitUrls('', null, 4010).length === 0, '缺 projectId/endpoint 应返回空数组')
    },
  },
  {
    name: 'pages-a: statusTone 按 2xx/3xx/4xx 分级且 0 视为错误',
    async fn() {
      const { exports } = await loadPageModule(join(COMPONENTS_DIR, 'StatusPill.jsx'))
      assert(typeof exports.statusTone === 'function', 'StatusPill.jsx 未导出 statusTone')
      assert(exports.statusTone(200) === 'var(--success)', '2xx 应为 success')
      assert(exports.statusTone(302) === 'var(--warning)', '3xx 应为 warning')
      assert(exports.statusTone(404) === 'var(--error)', '4xx 应为 error')
      assert(exports.statusTone(0) === 'var(--error)', '0 应为 error')
      assert(exports.statusTone(undefined) === 'var(--error)', 'undefined 应为 error')
    },
  },
  {
    name: 'pages-a: 三页在 vm 中注册进 __postapiQueue 且导出组件为函数',
    async fn() {
      for (const spec of PAGE_SPECS) {
        const { exports, queue } = await loadPageModule(PAGE_FILES[spec.name])
        const entry = queue.find((e) => e[0] === spec.name)
        assert(Boolean(entry), spec.name + ' 未 push 到 __postapiQueue')
        assert(typeof entry[1] === 'function', spec.name + ' 注册项不是组件函数')
        assert(typeof exports[spec.exportName] === 'function', spec.name + ' 导出 ' + spec.exportName + ' 不是函数')
      }
    },
  },
]

export const tests = [...pagesATests, ...apifoxUiTests]

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
  console.log('\npages-a.test：通过 ' + passed + '，失败 ' + failed + '，共 ' + (passed + failed))
  process.exit(failed === 0 ? 0 : 1)
}
