/**
 * tests/ui-audit.test.js — Apifox UI 一致性审计（独立审计角色，不改页面实现）
 *
 * 运行：
 *   node tests/ui-audit.test.js        # 自建 mini runner，输出硬断言结果 + 问题清单
 *   import { tests, run } from './ui-audit.test.js'   # 供 tests/run.js / vitest 接线
 *
 * 断言分级（docs/ui-audit.md 同步记录）：
 *   HARD  token 完整性（spec §1 色板 + §2/§3 尺寸，逐项取值比对）
 *   HARD  类名规范（页面/组件/shell 的 className 必须在 design-tokens.css 有定义）
 *   SOFT  其余纪律项：只收集问题清单，不抛错、不阻塞并行开发
 *
 * 依赖：仅 node 内置模块（无 esbuild、无 npm 依赖、不写任何临时文件）。
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(here, '..')
const PAGES = path.join(REPO, 'src', 'client', 'pages')
const COMPONENTS = path.join(PAGES, 'components')
const SHELL = path.join(REPO, 'src', 'client', 'shell')
const CLIENT = path.join(REPO, 'src', 'client')
const CSS_FILE = path.join(PAGES, 'design-tokens.css')

/** 反引号 / 美元符常量：避免本文件出现模板插值序列。 */
const BT = String.fromCharCode(96)
const DOLLAR = String.fromCharCode(36)

/** 12 个注册页（与 heights.test.js 的 REGISTERED_PAGES 同集）。 */
export const PAGE_IDS = [
  'overview', 'doc', 'debug', 'mock', 'schema', 'env',
  'history', 'test', 'import', 'flow', 'search', 'settings',
]
/** 4 个共用组件。 */
export const COMPONENT_FILES = ['EmptyState.jsx', 'JsonEditor.jsx', 'ParamTable.jsx', 'StatusPill.jsx']
/** shell 侧参与审计的文件。 */
export const SHELL_FILES = ['Body.js', 'registry.js', 'definition.js', 'locales.js', 'ApiTitle.js']

/* ============================ spec 基线（逐项） ============================ */

/** spec §1 色板：token → 期望值（light 皮肤）。 */
export const SPEC_COLOR_TOKENS = {
  '--border': '#eaecf0',
  '--bg-hover': '#f2f4f7',
  '--bg-subtle': '#f2f4f7',
  '--fg': '#344054',
  '--fg-tertiary': '#98a2b3',
  '--accent': '#9373ee',
  '--bg-app': '#f9fafb',
  '--error': '#f04438',
  '--method-delete': '#f04438',
  '--method-patch': '#ee46bc',
  '--fg-secondary': '#667085',
  '--border-strong': '#d0d5dd',
  '--success': '#17b26a',
  '--method-get': '#17b26a',
  '--info': '#2e90fa',
  '--method-post': '#2e90fa',
  '--warning': '#f79009',
  '--method-put': '#f79009',
  '--link': '#6172f3',
  '--accent-hover': '#8276c9',
  '--bg-stripe': '#f5f5f5',
  '--method-other': '#06aed4',
}

/** spec §1 暗色皮肤四项（在 [data-theme="dark"] 块内）。 */
export const SPEC_DARK_TOKENS = {
  '--bg-app': '#101828',
  '--bg-surface': '#1d2939',
  '--border': '#344054',
  '--fg': '#f9fafb',
}

/** spec §2 + §3 尺寸刻度：token → 期望值。 */
export const SPEC_SIZE_TOKENS = {
  '--ctl-h': '32px',
  '--ctl-h-sm': '24px',
  '--ctl-h-lg': '40px',
  '--row-h': '32px',
  '--pill-h': '22px',
  // v3（docs/apifox-visual-parity-spec.md §1）：顶栏 48px、页签条 44px、左导航 240px
  '--topbar-h': '48px',
  '--tabbar-h': '44px',
  '--sider-w': '240px',
  '--sider-pad': '20px',
  '--sider-item-h': '32px',
  '--sider-group-h': '24px',
  '--tree-row-h': '22px',
  '--content-max-w': '1512px',
  '--page-pad': '10px',
  '--layout-pad': '8px',
  // 实体树面板与 Apifox sider 同宽
  '--panel-w': '240px',
  '--panel-w-max': '320px',
  '--hit': '28px',

  '--z-flyout': '30',
  '--motion-fast': '120ms',
  '--fs-12': '12px',
  '--fs-13': '13px',
  '--fs-14': '14px',
  '--fs-16': '16px',
  '--fs-20': '20px',
  '--fs-24': '24px',
  '--lh-20': '20px',
  '--lh-22': '22px',
  '--lh-24': '24px',
  '--radius-sm': '6px',
  '--radius-ctl': '6px',
  '--radius-card': '8px',
  '--radius-lg': '10px',
  '--sp-1': '4px',
  '--sp-2': '8px',
  '--sp-3': '12px',
  '--sp-4': '16px',
  '--sp-5': '20px',
  '--sp-6': '24px',
  '--icon-sm': '14px',
  '--icon': '16px',
  '--icon-lg': '20px',
  '--nav-w': '240px',
  '--toc-w': '240px',
  '--card-pad': '16px',
  '--popover-w': '400px',
  '--scrollbar': '6px',
}

/** spec §6：旧 Vercel Geist 皮肤值，仓库内（除 spec 文档）不得残留。 */
export const LEGACY_SKIN_VALUES = ['#0070f3', '#eaeaea', '#fafafa']

/* ============================== 基础读取工具 ============================== */

function readText(file) {
  try {
    return existsSync(file) ? readFileSync(file, 'utf8') : null
  } catch {
    return null
  }
}

function rel(file) {
  return path.relative(REPO, file).replace(/\\/g, '/')
}

/** 审计范围内的全部待检文件（页面 + 组件 + shell + client 入口）。 */
export function auditedFiles() {
  const out = []
  for (const id of PAGE_IDS) out.push(path.join(PAGES, id + '.jsx'))
  out.push(path.join(PAGES, 'sequence.jsx'))
  for (const f of COMPONENT_FILES) out.push(path.join(COMPONENTS, f))
  for (const f of SHELL_FILES) out.push(path.join(SHELL, f))
  out.push(path.join(CLIENT, 'index.js'))
  return out
}

/* ======================= className 提取（含表达式形态） ======================= */

/** 从 start（开括号位置）起取平衡括号内的表达式文本。 */
function balancedExpr(src, start) {
  let depth = 0
  for (let i = start; i < src.length; i++) {
    const ch = src[i]
    if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) return src.slice(start + 1, i)
    }
  }
  return src.slice(start + 1)
}

function addTokens(out, chunk) {
  for (const tok of String(chunk).split(/\s+/)) {
    const t = tok.trim()
    if (!t) continue
    if (!/^[A-Za-z][\w-]*$/.test(t)) continue
    if (!out.includes(t)) out.push(t)
  }
}

/** 字面量前紧邻比较运算符时它是比较操作数（col === 'key'），不是类名。 */
function isComparisonOperand(chunk, at) {
  const before = chunk.slice(0, at).replace(/\s+$/, '')
  return /(===|!==|==|!=|\.includes\(|indexOf\()$/.test(before)
}

/** 递归收集表达式内的字符串字面量（模板字面量插值内部继续下钻）。 */
function collectLiterals(out, chunk) {
  let i = 0
  while (i < chunk.length) {
    const ch = chunk[i]
    if (ch === "'" || ch === '"') {
      const end = chunk.indexOf(ch, i + 1)
      if (end < 0) return
      if (!isComparisonOperand(chunk, i)) addTokens(out, chunk.slice(i + 1, end))
      i = end + 1
    } else if (ch === BT) {
      const end = chunk.indexOf(BT, i + 1)
      if (end < 0) return
      const body = chunk.slice(i + 1, end)
      let k = 0
      let staticPart = ''
      while (k < body.length) {
        if (body[k] === DOLLAR && body[k + 1] === '{') {
          const expr = balancedExpr(body, k + 1)
          addTokens(out, staticPart)
          staticPart = ''
          collectLiterals(out, expr)
          k = k + expr.length + 2
        } else {
          staticPart += body[k]
          k += 1
        }
      }
      addTokens(out, staticPart)
      i = end + 1
    } else {
      i += 1
    }
  }
}

/** 提取源码里全部 className 值中的类名（去重、保序）。 */
export function extractClassNames(src) {
  const names = []
  const re = /className\s*=\s*/g
  let m
  while ((m = re.exec(src))) {
    const at = m.index + m[0].length
    const ch = src[at]
    if (ch === '"' || ch === "'") {
      const end = src.indexOf(ch, at + 1)
      if (end < 0) continue
      addTokens(names, src.slice(at + 1, end))
      re.lastIndex = end + 1
    } else if (ch === '{') {
      const expr = balancedExpr(src, at)
      collectLiterals(names, expr)
      re.lastIndex = at + expr.length + 2
    }
  }
  return names
}

/** 从 design-tokens.css 抽出已定义的选择器类名集合。 */
export function extractDefinedClasses(css) {
  const set = new Set()
  const re = /\.(-?[A-Za-z_][\w-]*)/g
  let m
  while ((m = re.exec(css))) set.add(m[1])
  return set
}

/* ============================== 硬断言 1：token ============================== */

/** 正则转义（手工实现，避免正则元字符集合写法带来的歧义）。 */
function escapeRe(s) {
  const SPECIAL = '.*+?^' + DOLLAR + '{}()|[]\\'
  let out = ''
  for (const ch of String(s)) out += SPECIAL.includes(ch) ? '\\' + ch : ch
  return out
}

function tokenDefined(css, name, value) {
  const re = new RegExp(escapeRe(name) + '\\s*:\\s*' + escapeRe(value) + '\\s*;')
  return re.test(css)
}

function darkBlock(css) {
  const at = css.indexOf('[data-theme="dark"]')
  if (at < 0) return ''
  const open = css.indexOf('{', at)
  return open < 0 ? '' : balancedExpr(css, open)
}

/** token 完整性：返回 { checks, failures[] }。 */
export function auditTokens() {
  const failures = []
  let checks = 0
  const css = readText(CSS_FILE)
  if (css === null) return { checks: 1, failures: ['design-tokens.css 不存在'] }

  for (const [name, value] of Object.entries(SPEC_COLOR_TOKENS)) {
    checks += 1
    if (!tokenDefined(css, name, value)) {
      failures.push('design-tokens.css: 色板 token ' + name + ' 缺失或取值非 ' + value + '（spec §1）')
    }
  }
  const dark = darkBlock(css)
  for (const [name, value] of Object.entries(SPEC_DARK_TOKENS)) {
    checks += 1
    if (!tokenDefined(dark, name, value)) {
      failures.push('design-tokens.css[data-theme=dark]: ' + name + ' 缺失或取值非 ' + value + '（spec §1 暗色）')
    }
  }
  for (const [name, value] of Object.entries(SPEC_SIZE_TOKENS)) {
    checks += 1
    if (!tokenDefined(css, name, value)) {
      failures.push('design-tokens.css: 尺寸 token ' + name + ' 缺失或取值非 ' + value + '（spec §2/§3）')
    }
  }
  return { checks, failures }
}

/* ========================== 硬断言 2：类名规范 ========================== */

/** 类名规范：返回 { checks, failures[] }。 */
export function auditClassNames() {
  const failures = []
  let checks = 0
  const css = readText(CSS_FILE)
  if (css === null) return { checks: 1, failures: ['design-tokens.css 不存在'] }
  const defined = extractDefinedClasses(css)
  for (const file of auditedFiles()) {
    const src = readText(file)
    if (src === null) {
      checks += 1
      failures.push(rel(file) + ': 文件缺失，无法审计类名')
      continue
    }
    for (const name of extractClassNames(src)) {
      checks += 1
      if (!defined.has(name)) {
        failures.push(rel(file) + ': className "' + name + '" 未在 design-tokens.css 定义')
      }
    }
  }
  return { checks, failures }
}

/** 取顶层选择器规则的声明体；选择器须位于规则起点（行首或 } 之后）并紧跟 {。 */
export function ruleBody(css, selector) {
  const re = new RegExp('(?:^|[}\n])\\s*' + escapeRe(selector) + '\\s*\\{')
  const m = re.exec(css)
  if (!m) return null
  return balancedExpr(css, m.index + m[0].length - 1)
}

/* ============================ SOFT：问题清单收集 ============================ */

const HEX_OR_RGB = /#[0-9a-fA-F]{3,8}\b|rgba?\(/

/** 颜色字面量（jsx/js 全禁；css 只允许出现在 token 定义行）。 */
export function collectColorLiterals() {
  const issues = []
  let checks = 0
  for (const file of auditedFiles()) {
    const src = readText(file)
    if (src === null) continue
    checks += 1
    for (const [i, line] of src.split('\n').entries()) {
      if (!HEX_OR_RGB.test(line)) continue
      const isComment = /^\s*(\*|\/\/)/.test(line)
      issues.push({
        category: '颜色字面量',
        file: rel(file),
        line: i + 1,
        detail: (isComment ? '[注释] ' : '') + line.trim().slice(0, 110),
        suggestion: '改用 var(--accent)/var(--fg)/var(--bg-*) token；确需常量先补 token 再引用',
      })
    }
  }
  const css = readText(CSS_FILE)
  if (css !== null) {
    checks += 1
    for (const [i, line] of css.split('\n').entries()) {
      if (!HEX_OR_RGB.test(line)) continue
      if (/^\s*--[\w-]+\s*:/.test(line)) continue
      issues.push({
        category: '颜色字面量',
        file: rel(CSS_FILE),
        line: i + 1,
        detail: line.trim().slice(0, 110),
        suggestion: 'CSS 非 token 定义行不得写颜色字面量；补 --fg-on-accent / --bg-* 后引用',
      })
    }
  }
  return { checks, issues }
}

/** 字号字面量：内联 style 里的 fontSize: 12 / fontSize="12" / font-size:12px。 */
export function collectFontLiterals() {
  const issues = []
  let checks = 0
  const RES = [
    /\bfontSize\s*:\s*['"]?\d/,
    /\bfontSize\s*=\s*['"]?\d/,
    /\bfont-size\s*:\s*\d/,
    /\blineHeight\s*:\s*['"]?\d/,
  ]
  for (const file of auditedFiles()) {
    const src = readText(file)
    if (src === null) continue
    checks += 1
    for (const [i, line] of src.split('\n').entries()) {
      if (RES.some((re) => re.test(line))) {
        issues.push({
          category: '字号字面量',
          file: rel(file),
          line: i + 1,
          detail: line.trim().slice(0, 110),
          suggestion: '改用 className + var(--fs-12..24)/var(--lh-20..24)；内联 style 只留 layout',
        })
      }
    }
  }
  return { checks, issues }
}

/** 禁用 API：alert / confirm / prompt。 */
export function collectBannedApis() {
  const issues = []
  let checks = 0
  const RE = /\b(alert|confirm|prompt)\s*\(/
  for (const file of auditedFiles()) {
    const src = readText(file)
    if (src === null) continue
    checks += 1
    for (const [i, line] of src.split('\n').entries()) {
      if (/^\s*(\*|\/\/)/.test(line)) continue
      if (RE.test(line)) {
        issues.push({
          category: '禁用 API',
          file: rel(file),
          line: i + 1,
          detail: line.trim().slice(0, 110),
          suggestion: '改为页内状态提示（.pp-note / .pp-error-text）',
        })
      }
    }
  }
  return { checks, issues }
}

/** 直连宿主 URL：fetch 指向 /dsh-postapi 必须改走 api.request。 */
export function collectDirectFetch() {
  const issues = []
  let checks = 0
  const RE = new RegExp('fetch\\s*\\(\\s*[\'"' + BT + '][^\'"' + BT + ']*/dsh-postapi')
  for (const file of auditedFiles()) {
    const src = readText(file)
    if (src === null) continue
    checks += 1
    for (const [i, line] of src.split('\n').entries()) {
      if (/^\s*(\*|\/\/)/.test(line)) continue
      if (RE.test(line)) {
        issues.push({
          category: '直连宿主',
          file: rel(file),
          line: i + 1,
          detail: line.trim().slice(0, 110),
          suggestion: '改走 api.request / api.storage，页面不得直接 fetch 宿主路由',
        })
      }
    }
  }
  return { checks, issues }
}

/** 方法徽标：渲染 method 的文件必须有 .pp-method + data-method。 */
export function collectMethodBadges() {
  const issues = []
  let checks = 0
  for (const file of auditedFiles()) {
    const src = readText(file)
    if (src === null) continue
    checks += 1
    const hasBadge = /data-method\s*=/.test(src)
    const hasMethodClass = /pp-method/.test(src)
    // 真的把 method 渲染成文本/徽标：JSX 插值里出现 .method
    const rendersMethodText = /\{[^{}]*\.method[^{}]*\}/.test(src)
    if (hasMethodClass && !hasBadge) {
      issues.push({
        category: '方法徽标',
        file: rel(file),
        line: 0,
        detail: '用了 .pp-method 但缺 data-method（徽标将无色）',
        suggestion: '补 data-method={method}',
      })
    } else if (rendersMethodText && !hasMethodClass) {
      issues.push({
        category: '方法徽标',
        file: rel(file),
        line: 0,
        detail: 'JSX 直接渲染 method 文本，未使用 .pp-method 徽标',
        suggestion: '改为 <span className="pp-method" data-method={method}>{method}</span>',
      })
    }
  }
  return { checks, issues }
}

/** 布局骨架：Body.js 必须含 v2 骨架（.pp-workbench-v2 / .pp-topbar / .pp-shell / .pp-rail / .pp-main-v2 / .pp-page-head）。 */
export function collectShellSkeleton() {
  const issues = []
  // v3 骨架：图标轨（pp-rail/pp-flyout）已按 spec §12.6 删除，改为 240px 文字侧栏 + 44px 页签条
  const targets = ['pp-workbench-v2', 'pp-topbar', 'pp-shell', 'pp-sider', 'pp-main-v2', 'pp-tabbar']
  const body = readText(path.join(SHELL, 'Body.js'))
  if (body === null) {
    return {
      checks: targets.length,
      issues: [{ category: '布局骨架', file: 'src/client/shell/Body.js', line: 0, detail: 'Body.js 缺失', suggestion: '重建工作台骨架' }],
    }
  }
  for (const t of targets) {
    if (!body.includes(t)) {
      issues.push({
        category: '布局骨架',
        file: 'src/client/shell/Body.js',
        line: 0,
        detail: '缺少 ' + t,
        suggestion: '按 docs/apifox-visual-parity-spec.md：顶栏 48px + .pp-shell(grid: var(--sider-w) minmax(0,1fr)) + 240px 文字侧栏 + 44px 页签条',
      })
    }
  }
  return { checks: targets.length, issues }
}

/** 旧皮肤残留：#0070f3 / #eaeaea / #fafafa。 */
export function collectLegacySkin() {
  const issues = []
  let checks = 0
  const files = [...auditedFiles(), path.join(PAGES, 'theme.js'), CSS_FILE]
  for (const file of files) {
    const src = readText(file)
    if (src === null) continue
    checks += 1
    for (const [i, line] of src.split('\n').entries()) {
      const low = line.toLowerCase()
      for (const v of LEGACY_SKIN_VALUES) {
        if (low.includes(v)) {
          issues.push({
            category: '旧皮肤残留',
            file: rel(file),
            line: i + 1,
            detail: v + ' → ' + line.trim().slice(0, 100),
            suggestion: '换 Apifox token：#9373ee 主色 / #f9fafb 底 / #eaecf0 边框 / var(--fg) 正文',
          })
        }
      }
    }
  }
  return { checks, issues }
}

/** 未定义 token 引用：var(--x) 的 --x 必须在 design-tokens.css 有定义（含暗色块）。 */
export function collectUndefinedTokens() {
  const issues = []
  let checks = 0
  const css = readText(CSS_FILE)
  if (css === null) return { checks: 1, issues: [] }
  const defined = new Set()
  const defRe = /(--[\w-]+)\s*:/g
  let dm
  while ((dm = defRe.exec(css))) defined.add(dm[1])
  const files = [...auditedFiles(), CSS_FILE]
  for (const file of files) {
    const src = readText(file)
    if (src === null) continue
    checks += 1
    for (const [i, line] of src.split('\n').entries()) {
      if (/^\s*(\*|\/\/)/.test(line)) continue
      const useRe = /var\((--[\w-]+)/g
      let m
      while ((m = useRe.exec(line))) {
        if (defined.has(m[1])) continue
        issues.push({
          category: '未定义 token',
          file: rel(file),
          line: i + 1,
          detail: 'var(' + m[1] + ') 未在 design-tokens.css 定义',
          suggestion: '补 token 定义，或改用已有 token（如 --bg-surface）',
        })
      }
    }
  }
  return { checks, issues }
}

/** 页面存在性与自注册。 */
export function collectPageRegistration() {
  const issues = []
  let checks = 0
  for (const id of PAGE_IDS) {
    checks += 1
    const file = path.join(PAGES, id + '.jsx')
    const src = readText(file)
    if (src === null) {
      issues.push({ category: '页面自注册', file: rel(file), line: 0, detail: '页面文件缺失', suggestion: '补齐 12 页' })
      continue
    }
    const direct = new RegExp('window\\.__postapiPages\\?\\.register\\?\\.\\(' + "'" + id + "'").test(src)
    const queued = new RegExp('__postapiQueue[^;\\n]*\\.push\\(\\[\'' + id + "'").test(src)
    if (!direct && !queued) {
      issues.push({ category: '页面自注册', file: rel(file), line: 0, detail: '缺少自注册', suggestion: 'register 或 __postapiQueue push' })
    }
  }
  return { checks, issues }
}

/** 全量审计：硬断言 + 软清单。 */
export function run() {
  const tokens = auditTokens()
  const classes = auditClassNames()
  const soft = {
    颜色字面量: collectColorLiterals(),
    字号字面量: collectFontLiterals(),
    禁用API: collectBannedApis(),
    直连宿主: collectDirectFetch(),
    方法徽标: collectMethodBadges(),
    布局骨架: collectShellSkeleton(),
    旧皮肤残留: collectLegacySkin(),
    未定义token: collectUndefinedTokens(),
    页面自注册: collectPageRegistration(),
  }
  const issues = []
  const softStats = {}
  for (const [k, v] of Object.entries(soft)) {
    issues.push(...v.issues)
    softStats[k] = { checks: v.checks, issues: v.issues.length }
  }
  return {
    tokens,
    classes,
    issues,
    softStats,
    hardPassed: tokens.failures.length === 0 && classes.failures.length === 0,
  }
}

/* ================================ 测试用例 ================================ */

function assertNoFailures(label, result) {
  if (result.failures.length === 0) return
  const head = result.failures.slice(0, 12).join('\n       ')
  const more = result.failures.length > 12 ? '\n       …共 ' + result.failures.length + ' 项' : ''
  throw new Error(label + '（' + result.failures.length + '/' + result.checks + ' 项失败）\n       ' + head + more)
}

export const tests = [
  {
    name: 'HARD token 完整性：spec §1 色板（含暗色四项）全部就位且取值一致',
    fn: async () => {
      const css = readText(CSS_FILE)
      if (css === null) throw new Error('design-tokens.css 不存在')
      const failures = []
      let checks = 0
      for (const [name, value] of Object.entries(SPEC_COLOR_TOKENS)) {
        checks += 1
        if (!tokenDefined(css, name, value)) failures.push(name + ' ≠ ' + value)
      }
      const dark = darkBlock(css)
      for (const [name, value] of Object.entries(SPEC_DARK_TOKENS)) {
        checks += 1
        if (!tokenDefined(dark, name, value)) failures.push('[dark] ' + name + ' ≠ ' + value)
      }
      assertNoFailures('色板 token 缺失/取值偏离 spec §1', { checks, failures })
    },
  },
  {
    name: 'HARD token 完整性：spec §2/§3 尺寸刻度全部就位且取值一致',
    fn: async () => {
      const css = readText(CSS_FILE)
      if (css === null) throw new Error('design-tokens.css 不存在')
      const failures = []
      let checks = 0
      for (const [name, value] of Object.entries(SPEC_SIZE_TOKENS)) {
        checks += 1
        if (!tokenDefined(css, name, value)) failures.push(name + ' ≠ ' + value)
      }
      assertNoFailures('尺寸 token 缺失/取值偏离 spec §2/§3', { checks, failures })
    },
  },
  {
    name: 'HARD 类名规范：页面/组件/shell 的 className 全部在 design-tokens.css 有定义',
    fn: async () => {
      assertNoFailures('存在未定义的 className', auditClassNames())
    },
  },
  {
    name: 'SOFT 颜色字面量：jsx/js 无 #hex / rgb()，css 仅 token 定义行',
    fn: async () => {
      const r = collectColorLiterals()
      console.log('       [收集] 颜色字面量 ' + r.issues.length + ' 处 / 扫描 ' + r.checks + ' 文件')
    },
  },
  {
    name: 'SOFT 字号字面量：内联 style 不出现 fontSize/lineHeight 数字',
    fn: async () => {
      const r = collectFontLiterals()
      console.log('       [收集] 字号字面量 ' + r.issues.length + ' 处')
    },
  },
  {
    name: 'SOFT 禁用 API：无 alert/confirm/prompt',
    fn: async () => {
      const r = collectBannedApis()
      console.log('       [收集] 禁用 API ' + r.issues.length + ' 处')
    },
  },
  {
    name: 'SOFT 直连宿主：无 fetch 指向 /dsh-postapi',
    fn: async () => {
      const r = collectDirectFetch()
      console.log('       [收集] 直连宿主 ' + r.issues.length + ' 处')
    },
  },
  {
    name: 'SOFT 方法徽标：渲染 method 处必须 .pp-method + data-method',
    fn: async () => {
      const r = collectMethodBadges()
      console.log('       [收集] 方法徽标问题 ' + r.issues.length + ' 处')
    },
  },
  {
    name: 'SOFT 布局骨架：Body.js 含 .pp-workbench-v2/.pp-topbar/.pp-shell/.pp-rail/.pp-main-v2/.pp-page-head',
    fn: async () => {
      const r = collectShellSkeleton()
      console.log('       [收集] 骨架缺失 ' + r.issues.length + ' 处')
    },
  },
  {
    name: 'SOFT 旧皮肤残留：无 #0070f3/#eaeaea/#fafafa',
    fn: async () => {
      const r = collectLegacySkin()
      console.log('       [收集] 旧皮肤残留 ' + r.issues.length + ' 处')
    },
  },
  {
    name: 'SOFT 未定义 token：var(--*) 引用必须有定义',
    fn: async () => {
      const r = collectUndefinedTokens()
      console.log('       [收集] 未定义 token ' + r.issues.length + ' 处')
    },
  },
  {
    name: 'SOFT 页面自注册：12 页存在且自注册',
    fn: async () => {
      const r = collectPageRegistration()
      console.log('       [收集] 自注册问题 ' + r.issues.length + ' 处')
    },
  },
  {
    name: 'HARD Apifox 骨架一致性：顶栏/页签条/侧栏/树/内容宽/页面间距 token 就位',
    fn: async () => {
      const css = readText(CSS_FILE)
      if (css === null) throw new Error('design-tokens.css 不存在')
      const skeleton = {
        '--topbar-h': '48px',
        '--tabbar-h': '44px',
        '--sider-w': '240px',
        '--sider-pad': '20px',
        '--sider-item-h': '32px',
        '--sider-group-h': '24px',
        '--tree-row-h': '22px',
        '--content-max-w': '1512px',
        '--page-pad': '10px',
        '--layout-pad': '8px',
      }
      const failures = []
      for (const [name, value] of Object.entries(skeleton)) {
        if (!tokenDefined(css, name, value)) failures.push(name + ' 缺失或 ≠ ' + value)
      }
      assertNoFailures('Apifox 骨架 token 偏离 spec §1', { checks: Object.keys(skeleton).length, failures })
    },
  },
  {
    name: 'HARD 树规格：行高/字号/文字色走 token，hover 只变色不换底',
    fn: async () => {
      const css = readText(CSS_FILE)
      if (css === null) throw new Error('design-tokens.css 不存在')
      const failures = []
      const row = ruleBody(css, '.pp-tree-row')
      const want = [
        [/height\s*:\s*var\(--tree-row-h\)/, 'height: var(--tree-row-h)'],
        [/font-size\s*:\s*var\(--fs-12\)/, 'font-size: var(--fs-12)'],
        [/color\s*:\s*var\(--fg-secondary\)/, 'color: var(--fg-secondary)'],
      ]
      for (const [re, label] of want) {
        if (row === null || !re.test(row)) failures.push('.pp-tree-row 缺 ' + label)
      }
      const hover = ruleBody(css, '.pp-tree-row:hover')
      if (hover === null) failures.push('.pp-tree-row:hover 规则缺失')
      else if (/background/.test(hover)) failures.push('.pp-tree-row:hover 出现 background（Apifox 树 hover 只变文字色）')
      assertNoFailures('树规格偏离 spec §4', { checks: 4, failures })
    },
  },
  {
    name: 'HARD 调试台规格：URL 行 40px / 分组标题 3px 主色竖线 / 胶囊圆角',
    fn: async () => {
      const css = readText(CSS_FILE)
      if (css === null) throw new Error('design-tokens.css 不存在')
      const failures = []
      const urlRow = ruleBody(css, '.pp-url-row')
      if (urlRow === null || !/height\s*:\s*var\(--ctl-h-lg\)/.test(urlRow)) {
        failures.push('.pp-url-row 缺 height: var(--ctl-h-lg)')
      }
      const group = ruleBody(css, '.pp-group-title')
      if (group === null || !/border-left\s*:\s*3px\s+solid\s+var\(--accent\)/.test(group)) {
        failures.push('.pp-group-title 缺 border-left: 3px solid var(--accent)')
      }
      const pill = ruleBody(css, '.pp-url-pill')
      if (pill === null || !/border-radius\s*:/.test(pill)) {
        failures.push('.pp-url-pill 缺 border-radius')
      }
      assertNoFailures('调试台规格偏离 spec §5', { checks: 3, failures })
    },
  },
  {
    name: 'HARD 页头规格：概览/文档标题 18px + 700',
    fn: async () => {
      const css = readText(CSS_FILE)
      if (css === null) throw new Error('design-tokens.css 不存在')
      const failures = []
      for (const sel of ['.pp-overview-title', '.pp-doc-title']) {
        const body = ruleBody(css, sel)
        if (body === null) {
          failures.push(sel + ' 规则缺失')
          continue
        }
        if (!/font-size\s*:\s*var\(--fs-18\)/.test(body)) failures.push(sel + ' 缺 font-size: var(--fs-18)')
        if (!/font-weight\s*:\s*700/.test(body)) failures.push(sel + ' 缺 font-weight: 700')
      }
      assertNoFailures('页头规格偏离 spec §7', { checks: 4, failures })
    },
  },
]

/* ============================ 直接执行 mini runner ============================ */

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
  for (const t of tests) {
    try {
      await t.fn()
      passed += 1
      console.log('  PASS ' + t.name)
    } catch (err) {
      failed += 1
      console.log('  FAIL ' + t.name)
      console.log('       ' + (err && err.message ? err.message : String(err)))
    }
  }

  const report = run()
  console.log('\n== 硬断言 ==')
  console.log('  token 完整性：' + (report.tokens.checks - report.tokens.failures.length) + ' 通过 / ' + report.tokens.failures.length + ' 失败（共 ' + report.tokens.checks + ' 项）')
  console.log('  类名规范：' + (report.classes.checks - report.classes.failures.length) + ' 通过 / ' + report.classes.failures.length + ' 失败（共 ' + report.classes.checks + ' 项）')
  console.log('\n== 软性清单（不阻塞） ==')
  for (const [k, v] of Object.entries(report.softStats)) {
    console.log('  ' + k + '：' + v.issues + ' 处（扫描 ' + v.checks + ' 个文件）')
  }
  const byCat = {}
  for (const it of report.issues) byCat[it.category] = (byCat[it.category] || 0) + 1
  console.log('\n== 问题合计 ' + report.issues.length + ' 处 ==')
  for (const [k, v] of Object.entries(byCat)) console.log('  ' + k + '：' + v)

  console.log('\n结果：通过 ' + passed + '，失败 ' + failed + '，共 ' + (passed + failed))
  if (failed > 0) process.exitCode = 1
}
