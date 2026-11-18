import { tests } from 'file:///D:/Code/DSH-Postapi/tests/host-data.test.js'
let passed = 0, failed = 0
for (const t of tests) {
  try { await t.fn(); passed += 1; console.log('  PASS ' + t.name) }
  catch (e) { failed += 1; console.log('  FAIL ' + t.name); console.log('       ' + (e && e.stack ? e.stack.split('\n').slice(0,6).join('\n       ') : e)) }
}
console.log('\n结果：通过 ' + passed + '，失败 ' + failed + '，共 ' + (passed + failed))
if (failed > 0) process.exitCode = 1
