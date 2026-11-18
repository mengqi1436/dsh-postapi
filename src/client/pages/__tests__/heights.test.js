// heights.test.js — 等高一致性静态检查（契约 §7「所有控件高度来自 token」）
// 双模式运行：
//   1) node src/client/pages/__tests__/heights.test.js  —— 自建 mini runner 直接执行（参考 tests/run.js 模式）
//   2) vitest 环境 —— import { run } 后在 test() 中断言 run().failures.length === 0（lead 统一接线）
// 扫描范围：design-tokens.css 全部 height 类声明 + 六个页面组件的内联 style 高度
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PAGES_DIR = resolve(__dirname, '..')

const CSS_FILE = join(PAGES_DIR, 'design-tokens.css')
// 参与高度纪律扫描的页面组件（theme.js 无样式，不参与）
const PAGE_FILES = [
  'overview.jsx', 'doc.jsx', 'debug.jsx', 'mock.jsx', 'schema.jsx', 'env.jsx',
  'history.jsx', 'test.jsx', 'import.jsx', 'flow.jsx', 'search.jsx', 'settings.jsx',
  'sequence.jsx',
]
const REGISTERED_PAGES = [
  'overview', 'doc', 'debug', 'mock', 'schema', 'env',
  'history', 'test', 'import', 'flow', 'search', 'settings',
]

// 允许的高度值：尺寸 token 引用 / 含 token 或 100% 的 calc / 自适应关键字
// 尺寸 token 家族：主控件 / 小控件 / 大控件 / 行 / 胶囊 / 顶栏（Apifox 版新增三档控件高）
const TOKEN_HEIGHT_RE = /^var\(--(ctl-h|ctl-h-sm|ctl-h-lg|row-h|pill-h|topbar-h|hit|rail-w|rail-icon)\)$/
const AUTO_VALUES = new Set(['100%', 'auto', 'inherit', 'fit-content', 'min-content', 'max-content'])

function checkHeightValue(value) {
  const v = String(value).trim()
  if (TOKEN_HEIGHT_RE.test(v)) return null
  if (AUTO_VALUES.has(v)) return null
  if (v === '0') return null
  // calc 里只要引用 token 变量或 100% 就算合规（滚动条、分段高度等派生值都走 calc）
  if (/^calc\(/.test(v) && /var\(--|100%/.test(v)) return null
  return '高度值未引用尺寸 token（--ctl-h/--row-h/--pill-h）'
}

// CSS 逐行扫描（design-tokens.css 每行一条声明；token 定义 --x: 28px 不匹配 height 属性名）
const CSS_LINE_RE = /^\s*(min-height|max-height|height)\s*:\s*(.+?);?\s*$/
// JSX 内联样式扫描：style={{ height: '...' }} 或 style="height: ..."（字符串值）
const JSX_LINE_RE = /\b(minHeight|maxHeight|height|min-height|max-height|height)\s*:\s*['"`]([^'"`]+)['"`]/g

export function run() {
  const failures = []
  let checks = 0

  // 1) 尺寸 token 定义存在且取值正确（契约 §5）
  if (!existsSync(CSS_FILE)) {
    failures.push('design-tokens.css 不存在')
    return { failures, checks }
  }
  const css = readFileSync(CSS_FILE, 'utf8')
  const tokenDefs = {
    '--ctl-h': /--ctl-h:\s*32px/.test(css),
    '--ctl-h-sm': /--ctl-h-sm:\s*24px/.test(css),
    '--ctl-h-lg': /--ctl-h-lg:\s*40px/.test(css),
    '--row-h': /--row-h:\s*36px/.test(css),
    '--pill-h': /--pill-h:\s*22px/.test(css),
    '--topbar-h': /--topbar-h:\s*44px/.test(css),
    '--rail-w': /--rail-w:\s*48px/.test(css),
    '--hit': /--hit:\s*28px/.test(css),
  }
  for (const [name, ok] of Object.entries(tokenDefs)) {
    checks++
    if (!ok) failures.push(`design-tokens.css: 尺寸 token ${name} 缺失或取值偏离契约（28/32/20）`)
  }

  // 2) CSS 中所有高度声明必须引用 token
  for (const [i, line] of css.split('\n').entries()) {
    const m = CSS_LINE_RE.exec(line)
    if (!m) continue
    checks++
    const err = checkHeightValue(m[2])
    if (err) failures.push(`design-tokens.css:${i + 1}: ${m[1]}: ${m[2].trim()} — ${err}`)
  }

  // 3) 页面组件内联高度必须合规；4) 五页面自注册
  for (const file of PAGE_FILES) {
    const full = join(PAGES_DIR, file)
    if (!existsSync(full)) {
      failures.push(`${file} 不存在`)
      continue
    }
    const src = readFileSync(full, 'utf8')
    let m
    JSX_LINE_RE.lastIndex = 0
    while ((m = JSX_LINE_RE.exec(src))) {
      checks++
      const err = checkHeightValue(m[2])
      if (err) {
        const lineNo = src.slice(0, m.index).split('\n').length
        failures.push(`${file}:${lineNo}: 内联 ${m[1]}: ${m[2]} — ${err}`)
      }
    }
  }
  for (const pageId of REGISTERED_PAGES) {
    checks++
    const full = join(PAGES_DIR, pageId + '.jsx')
    const src = existsSync(full) ? readFileSync(full, 'utf8') : ''
    // 两种合法形态：直接注册（window.__postapiPages?.register?.）或队列注册（ensureGlobals 统一重放）
    const direct = new RegExp(`window\\.__postapiPages\\?\\.register\\?\\.\\('${pageId}'`)
    const queued = new RegExp(`__postapiQueue[^;\\n]*\\.push\\(\\['${pageId}'`)
    if (!direct.test(src) && !queued.test(src)) failures.push(`${pageId}.jsx: 缺少自注册（register 或 __postapiQueue push）`)
  }

  return { failures, checks }
}

// —— mini runner：node 直接执行时输出结果并返回退出码 ——
const isMain = (() => {
  try {
    const argv1 = process.argv[1]
    return Boolean(argv1) && resolve(argv1) === fileURLToPath(import.meta.url)
  } catch {
    return false
  }
})()

if (isMain) {
  const { failures, checks } = run()
  for (const f of failures) console.error('FAIL  ' + f)
  if (failures.length === 0) {
    console.log(`heights.test: PASS (${checks} checks)`)
  } else {
    console.log(`heights.test: ${failures.length} failure(s) / ${checks} checks`)
  }
  process.exit(failures.length === 0 ? 0 : 1)
}
