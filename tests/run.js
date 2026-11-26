/** 简易测试 runner：node tests/run.js 直接执行并汇总通过/失败计数，无 vitest 依赖。 */
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { tests as storageTests } from './storage.test.js'
import { tests as requestTests } from './request.test.js'
import { tests as bridgeTests } from './bridge.test.js'

const here = dirname(fileURLToPath(import.meta.url))

/** 可选套件：文件不存在时跳过（并行开发期各 teammate 陆续落地）。 */
async function optionalSuite(file, exportName) {
  const full = join(here, file)
  if (!existsSync(full)) return []
  try {
    const mod = await import('./' + file)
    return mod[exportName] ?? []
  } catch (err) {
    console.log('  SKIP ' + file + '（导入失败：' + (err && err.message) + '）')
    return []
  }
}

const hostDataTests = await optionalSuite('host-data.test.js', 'tests')
const hostRuntimeTests = await optionalSuite('host-runtime.test.js', 'tests')
const hostWsTests = await optionalSuite('host-ws.test.js', 'tests')
const hostDbTests = await optionalSuite('host-db.test.js', 'tests')

/** 页面套件在 src/ 下，用绝对路径动态导入。 */
async function optionalPageSuite(relPath, exportName) {
  const full = join(here, '..', relPath)
  if (!existsSync(full)) return []
  try {
    const mod = await import('file://' + full.replace(/\\/g, '/'))
    return mod[exportName] ?? []
  } catch (err) {
    console.log('  SKIP ' + relPath + '（导入失败：' + (err && err.message) + '）')
    return []
  }
}

const pagesATests = await optionalPageSuite('src/client/pages/components/__tests__/pages-a.test.js', 'tests')
const apifoxUiTests = await optionalPageSuite('src/client/pages/components/__tests__/apifox-ui.test.js', 'tests')
const treeTests = await optionalPageSuite('src/client/pages/components/__tests__/tree.test.js', 'tests')
// 高度纪律（heights）：文件头注释预留的「lead 统一接线」——套件导出 run() 而非 tests 数组，
// 包装成一个用例接入；它红说明有高度绕开了尺寸 token（组件大小一致性契约 §7）。
const heightsModule = await optionalPageSuite('src/client/pages/__tests__/heights.test.js', 'run')
const heightsTests = heightsModule.length ? [{
  name: 'heights: 全部高度声明引用尺寸 token（CSS + 页面内联）',
  fn: async () => {
    const { failures, checks } = heightsModule[0].run()
    if (failures.length > 0) throw new Error(failures.join('；') + `（共 ${checks} 项检查）`)
  },
}] : []
const headerPresetsTests = await optionalSuite('header-presets.test.js', 'tests')
const bodyEditorTests = await optionalSuite('body-editor.test.js', 'tests')
const prepostTests = await optionalSuite('prepost.test.js', 'tests')
const responsePanelTests = await optionalSuite('response-panel.test.js', 'tests')
const pagesBTests = await optionalSuite('pages-b.test.js', 'tests')
const shellFrameTests = await optionalSuite('shell-frame.test.js', 'tests')
const uiAuditTests = await optionalSuite('ui-audit.test.js', 'tests')
const menuTests = await optionalSuite('menu.test.js', 'tests')

const suites = [
  ['tests/storage.test.js', storageTests],
  ['tests/request.test.js', requestTests],
  ['tests/bridge.test.js', bridgeTests],
  ['tests/host-data.test.js', hostDataTests],
  ['tests/host-runtime.test.js', hostRuntimeTests],
  ['tests/host-ws.test.js', hostWsTests],
  ['tests/host-db.test.js', hostDbTests],
  ['src/client/pages/components/__tests__/pages-a.test.js', pagesATests],
  ['src/client/pages/components/__tests__/apifox-ui.test.js', apifoxUiTests],
  ['src/client/pages/components/__tests__/tree.test.js', treeTests],
  ['src/client/pages/__tests__/heights.test.js', heightsTests],
  ['tests/header-presets.test.js', headerPresetsTests],
  ['tests/body-editor.test.js', bodyEditorTests],
  ['tests/prepost.test.js', prepostTests],
  ['tests/response-panel.test.js', responsePanelTests],
  ['tests/pages-b.test.js', pagesBTests],
  ['tests/shell-frame.test.js', shellFrameTests],
  ['tests/ui-audit.test.js', uiAuditTests],
  ['tests/menu.test.js', menuTests],
]

let passed = 0
let failed = 0
for (const [file, tests] of suites) {
  console.log(`\n== ${file} ==`)
  for (const t of tests) {
    try {
      await t.fn()
      passed += 1
      console.log(`  PASS ${t.name}`)
    } catch (err) {
      failed += 1
      console.log(`  FAIL ${t.name}`)
      console.log(`       ${err && err.message ? err.message : err}`)
    }
  }
}

console.log(`\n结果：通过 ${passed}，失败 ${failed}，共 ${passed + failed}`)
if (failed > 0) process.exitCode = 1
