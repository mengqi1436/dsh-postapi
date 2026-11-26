#!/usr/bin/env node
/**
 * 异变测试（Mutation Testing）：对 src/host 核心逻辑做等价变异，验证测试套件的查错能力。
 *
 * 变异算子：===↔!==、&&↔||、<→<=、>→>=、数字 n→n+1、true↔false。
 * 扫描器跳过字符串/模板/注释/正则字面量，只变异真实代码位。
 * 每个变异体在独立仓库副本上跑全套测试：测试失败=KILLED（套件抓住了变异），通过=SURVIVED（漏网）。
 * 输出逐文件变异分数 + 幸存者清单；总分低于门槛时非零退出。
 *
 * 用法：node scripts/mutation-test.mjs [--dry]（--dry 只统计候选数不执行）
 * 预算：约 4 分钟（12 文件 × ≤36 变异 × 4 并行 × ~4s/次全套）。
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TARGET_FILES = [
  'src/host/bridge.js',
  'src/host/storage.js',
  'src/host/request.js',
  'src/host/mock-server.js',
  'src/host/test-runner.js',
  'src/host/ws-client.js',
  'src/host/db.js',
  'src/host/script-sandbox.js',
  'src/host/variables.js',
  'src/host/import-export.js',
  'src/host/codegen.js',
  'src/client/jsx-shim.js',
]
const CAP_PER_FILE = 30
const PARALLEL = Math.max(2, Math.min(4, os.cpus().length))
const SCORE_GATE = 60 // 总分低于此值非零退出

/* ---------------- 候选扫描：跳过字符串/模板/注释/正则 ---------------- */

const OPERATORS = [
  { token: '===', replacement: '!==', kind: 'eq' },
  { token: '!==', replacement: '===', kind: 'neq' },
  { token: '&&', replacement: '||', kind: 'and' },
  { token: '||', replacement: '&&', kind: 'or' },
  { token: '<', replacement: '<=', kind: 'lt' },
  { token: '>', replacement: '>=', kind: 'gt' },
]

function scanCandidates(src) {
  const cands = []
  let i = 0
  let line = 1
  let mode = 'code' // code | sq | dq | tpl | line-comment | block-comment | regex
  const tplStack = [] // 模板串 ${} 嵌套栈：每项 { brace: 该 ${} 内未闭合的 { 计数 }
  let prevMeaningful = '' // 上一个非空白字符（正则启发式）
  const push = (col, token, replacement, kind) => cands.push({ line, col, token, replacement, kind })

  while (i < src.length) {
    const c = src[i]
    const n = src[i + 1]
    if (c === '\n') {
      line += 1
      if (mode === 'line-comment') mode = 'code'
      i += 1
      prevMeaningful = ''
      continue
    }
    if (mode === 'code') {
      if (c === '/' && n === '/') { mode = 'line-comment'; i += 2; prevMeaningful = ''; continue }
      if (c === '/' && n === '*') { mode = 'block-comment'; i += 2; prevMeaningful = ''; continue }
      if (c === "'") { mode = 'sq'; i += 1; prevMeaningful = "'"; continue }
      if (c === '"') { mode = 'dq'; i += 1; prevMeaningful = '"'; continue }
      if (c === '`') { mode = 'tpl'; i += 1; prevMeaningful = '`'; continue }
      if (c === '{' && tplStack.length > 0) { tplStack[tplStack.length - 1].brace += 1; i += 1; prevMeaningful = '{'; continue }
      if (c === '}' && tplStack.length > 0) {
        const top = tplStack[tplStack.length - 1]
        if (top.brace > 0) top.brace -= 1
        else { tplStack.pop(); mode = 'tpl' }
        i += 1
        prevMeaningful = '}'
        continue
      }
      // 正则启发式：/ 前是操作符或关键字结尾时视为正则开始
      if (c === '/' && /[=(,:[!&|?{};+\-*%<>~^]|^/.test(prevMeaningful === '' ? '^' : prevMeaningful)) {
        mode = 'regex'
        i += 1
        prevMeaningful = '/'
        continue
      }
      if (c === '<' && n === '<') { prevMeaningful = c; i += 2; continue } // 位运算 << 跳过
      if (c === '>' && n === '>') { prevMeaningful = c; i += 2; continue } // 位运算 >> 跳过
      if (c === '=' && n === '>') { prevMeaningful = '>'; i += 2; continue } // 箭头 =>
      let matched = false
      for (const op of OPERATORS) {
        if (op.token === '<' && src.startsWith('<=', i)) continue
        if (op.token === '>' && src.startsWith('>=', i)) continue
        if (src.startsWith(op.token, i) && (op.token.length > 1 || !'<>='.includes(n))) {
          // < 后跟 = 是 <=，不作为 < 变异；=== 优先于 ==；单字符 < / > 需要下一个字符不是 =
          if (op.token.length === 1 && n === '=') continue
          push(colOf(src, i), op.token, op.replacement, op.kind)
          matched = true
          break
        }
      }
      if (!matched && /\d/.test(c) && !/[\w$]/.test(src[i - 1] || '')) {
        // 数字字面量（排除属性访问里的数字片段如 .0、标识符中段）
        const m = /^\d+(\.\d+)?/.exec(src.slice(i))
        if (m && !/\.$/.test(m[0])) push(colOf(src, i), m[0], String(Number(m[0]) + 1), 'num')
        i += m ? m[0].length : 1
        prevMeaningful = '0'
        continue
      }
      if (!matched && c === 't' && src.startsWith('true', i) && !/[\w$]/.test(src[i + 4] || '')) {
        push(colOf(src, i), 'true', 'false', 'bool')
      }
      if (!matched && c === 'f' && src.startsWith('false', i) && !/[\w$]/.test(src[i + 5] || '')) {
        push(colOf(src, i), 'false', 'true', 'bool')
      }
      if (!/\s/.test(c)) prevMeaningful = c
      i += 1
      continue
    }
    if (mode === 'sq') {
      if (c === '\\') { i += 2; continue }
      if (c === "'") mode = 'code'
      i += 1
      prevMeaningful = "'"
      continue
    }
    if (mode === 'dq') {
      if (c === '\\') { i += 2; continue }
      if (c === '"') mode = 'code'
      i += 1
      prevMeaningful = '"'
      continue
    }
    if (mode === 'tpl') {
      if (c === '\\') { i += 2; continue }
      if (c === '`') { mode = 'code'; i += 1; continue }
      if (c === '$' && n === '{') { tplStack.push({ brace: 0 }); mode = 'code'; i += 2; continue }
      i += 1
      continue
    }
    if (mode === 'line-comment') { i += 1; continue }
    if (mode === 'block-comment') {
      if (c === '*' && n === '/') { mode = 'code'; i += 2; prevMeaningful = ''; continue }
      i += 1
      continue
    }
    if (mode === 'regex') {
      if (c === '\\') { i += 2; continue }
      if (c === '[') { // 字符类内的 / 不结束正则
        i += 1
        while (i < src.length && src[i] !== ']') { if (src[i] === '\\') i += 1; i += 1 }
        i += 1
        continue
      }
      if (c === '/') {
        mode = 'code'
        i += 1
        while (i < src.length && /[gimsuyvd]/.test(src[i])) i += 1 // flags
        prevMeaningful = '/'
        continue
      }
      i += 1
      continue
    }
  }
  return cands
}

function colOf(src, index) {
  const nl = src.lastIndexOf('\n', index - 1)
  return index - (nl + 1)
}

/* ---------------- 变异执行 ---------------- */

function evenSample(list, cap) {
  if (list.length <= cap) return list
  const out = []
  const step = list.length / cap
  for (let k = 0; k < cap; k += 1) out.push(list[Math.floor(k * step)])
  return out
}

async function copyRepo(dest) {
  await fs.cp(repoRoot, dest, {
    recursive: true,
    filter: (srcPath) => {
      const rel = path.relative(repoRoot, srcPath)
      if (rel === '') return true
      const top = rel.split(path.sep)[0]
      return !['node_modules', '.git', 'dist', 'docs', '.github', '.codebase-memory'].includes(top)
    },
  })
}

function applyMutant(src, cand) {
  const lines = src.split('\n')
  const l = lines[cand.line - 1]
  if (l === undefined || l.slice(cand.col, cand.col + cand.token.length) !== cand.token) return null
  lines[cand.line - 1] = l.slice(0, cand.col) + cand.replacement + l.slice(cand.col + cand.token.length)
  return lines.join('\n')
}

function runTests(cwd) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['tests/run.js'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    const timer = setTimeout(() => { try { child.kill('SIGKILL') } catch { /* 已退出 */ } }, 180000)
    child.stdout.on('data', (d) => { out += d })
    child.stderr.on('data', (d) => { out += d })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ killed: code !== 0 || /失败 [1-9]/.test(out), output: out })
    })
  })
}

async function runMutant(cand, relFile) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'postapi-mut-'))
  try {
    await copyRepo(tmp)
    const target = path.join(tmp, relFile)
    const src = await fs.readFile(target, 'utf8')
    const mutated = applyMutant(src, cand)
    if (mutated == null) return { status: 'APPLY_FAIL' }
    await fs.writeFile(target, mutated)
    const started = Date.now()
    const { killed } = await runTests(tmp)
    return { status: killed ? 'KILLED' : 'SURVIVED', ms: Date.now() - started }
  } finally {
    await fs.rm(tmp, { recursive: true, force: true }).catch(() => {})
  }
}

/* ---------------- 主流程 ---------------- */

async function main() {
  const dry = process.argv.includes('--dry')
  const mutants = []
  for (const rel of TARGET_FILES) {
    const src = await fs.readFile(path.join(repoRoot, rel), 'utf8')
    const all = scanCandidates(src)
    const picked = evenSample(all, CAP_PER_FILE)
    for (const c of picked) mutants.push({ ...c, file: rel })
    console.log(`扫描 ${rel}: 候选 ${all.length}，取样 ${picked.length}`)
  }
  console.log(`\n变异体总数 ${mutants.length}，并行 ${PARALLEL}${dry ? '（--dry 只统计不执行）' : ''}`)
  if (dry) return

  const queue = [...mutants]
  const outcomes = []
  let done = 0
  async function worker() {
    for (;;) {
      const m = queue.shift()
      if (!m) return
      const r = await runMutant(m, m.file)
      outcomes.push({ ...m, ...r })
      done += 1
      process.stdout.write(`  [${done}/${mutants.length}] ${m.file}:${m.line} ${m.kind} → ${r.status}\n`)
    }
  }
  await Promise.all(Array.from({ length: PARALLEL }, worker))

  const byFile = new Map()
  for (const o of outcomes) {
    const f = byFile.get(o.file) || { killed: 0, survived: 0, total: 0 }
    f.total += 1
    if (o.status === 'KILLED') f.killed += 1
    else if (o.status === 'SURVIVED') f.survived += 1
    byFile.set(o.file, f)
  }
  let killedTotal = 0
  let survivedTotal = 0
  let applyFail = 0
  console.log('\n==== 变异分数（按文件） ====')
  for (const [file, f] of byFile) {
    const score = f.total > 0 ? Math.round((f.killed / f.total) * 100) : 0
    console.log(`  ${score}%  ${file}  killed=${f.killed} survived=${f.survived}${f.total - f.killed - f.survived ? ' applyFail=' + (f.total - f.killed - f.survived) : ''}`)
    killedTotal += f.killed
    survivedTotal += f.survived
    applyFail += f.total - f.killed - f.survived
  }
  const total = killedTotal + survivedTotal
  const score = total > 0 ? Math.round((killedTotal / total) * 100) : 0
  console.log(`\n总分：${score}%（killed=${killedTotal} survived=${survivedTotal} applyFail=${applyFail}）`)
  if (survivedTotal > 0) {
    console.log('\n幸存变异体（测试未覆盖的行为变化）：')
    for (const o of outcomes.filter((x) => x.status === 'SURVIVED')) {
      console.log(`  ${o.file}:${o.line}  ${o.kind}  ${o.token} → ${o.replacement}`)
    }
  }
  if (score < SCORE_GATE) {
    console.log(`\n低于门槛 ${SCORE_GATE}%，退出码 1`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('异变脚本异常退出：', err)
  process.exit(2)
})
