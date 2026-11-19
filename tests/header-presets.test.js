// header-presets.test.js — 常用请求头清单与过滤函数（task-17 契约）
// 独立运行：node tests/header-presets.test.js
// lead 接线：tests/run.js 里 optionalSuite('header-presets.test.js', 'tests') 后逐条 await t.fn()。
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { COMMON_HEADERS, filterHeaders, isCommonHeader } from '../src/client/pages/components/headerPresets.js'

const assert = (cond, message) => { if (!cond) throw new Error(message) }

/** 上限：建议下拉最多 8 条（契约值，写死便于发现漂移）。 */
const LIMIT = 8

export const tests = [
  {
    name: 'headerPresets: COMMON_HEADERS 非空，每项都有 key/value/description 且 key 不重复',
    fn() {
      assert(Array.isArray(COMMON_HEADERS), 'COMMON_HEADERS 应为数组')
      assert(COMMON_HEADERS.length >= 10, 'COMMON_HEADERS 条目过少，实际 ' + COMMON_HEADERS.length)
      const seen = new Set()
      for (const item of COMMON_HEADERS) {
        assert(item && typeof item === 'object', '清单项应为对象')
        assert(typeof item.key === 'string' && item.key.length > 0, '清单项缺 key：' + JSON.stringify(item))
        assert(typeof item.value === 'string', '清单项 value 应为字符串：' + item.key)
        assert(typeof item.description === 'string' && item.description.length > 0, '清单项缺 description：' + item.key)
        const low = item.key.toLowerCase()
        assert(!seen.has(low), 'key 重复：' + item.key)
        seen.add(low)
      }
    },
  },
  {
    name: 'headerPresets: 契约清单逐项对齐（key 顺序 + 代表值）',
    fn() {
      const keys = COMMON_HEADERS.map((h) => h.key)
      assert(keys[0] === 'Accept', '首项应为 Accept，实际 ' + keys[0])
      assert(keys.indexOf('Content-Type') > -1, '清单应含 Content-Type')
      assert(keys.indexOf('Authorization') > -1, '清单应含 Authorization')
      const ct = COMMON_HEADERS.find((h) => h.key === 'Content-Type')
      assert(ct.value === 'application/json', 'Content-Type 默认值应为 application/json，实际 ' + ct.value)
      const auth = COMMON_HEADERS.find((h) => h.key === 'Authorization')
      assert(auth.value === 'Bearer {{token}}', 'Authorization 默认值应为 Bearer {{token}}，实际 ' + auth.value)
      const reqId = COMMON_HEADERS.find((h) => h.key === 'X-Request-Id')
      assert(reqId.value === '{{$uuid}}', 'X-Request-Id 默认值应为 {{$uuid}}，实际 ' + reqId.value)
    },
  },
  {
    name: 'headerPresets: filterHeaders 空查询（含空白串/null/undefined）返回前 8 条',
    fn() {
      for (const q of ['', '   ', null, undefined]) {
        const out = filterHeaders(q)
        assert(Array.isArray(out), '返回值应为数组（入参 ' + String(q) + '）')
        assert(out.length === LIMIT, '空查询应返回 ' + LIMIT + ' 条，实际 ' + out.length + '（入参 ' + String(q) + '）')
        const expected = COMMON_HEADERS.slice(0, LIMIT).map((h) => h.key)
        const actual = out.map((h) => h.key)
        assert(actual.join(',') === expected.join(','), '空查询应保持清单原顺序，实际 ' + actual.join(','))
      }
    },
  },
  {
    name: 'headerPresets: filterHeaders 大小写不敏感',
    fn() {
      const lower = filterHeaders('accept').map((h) => h.key)
      const upper = filterHeaders('ACCEPT').map((h) => h.key)
      const mixed = filterHeaders('AcCePt').map((h) => h.key)
      assert(lower.length > 0, '小写查询应有结果')
      assert(lower.join(',') === upper.join(','), '大小写结果应一致：' + lower.join(',') + ' vs ' + upper.join(','))
      assert(lower.join(',') === mixed.join(','), '混合大小写结果应一致')
      assert(lower.indexOf('Accept') === 0, '前缀命中 Accept 应排第一，实际 ' + lower.join(','))
    },
  },
  {
    name: 'headerPresets: filterHeaders 前缀命中排在包含命中之前',
    fn() {
      const out = filterHeaders('ac').map((h) => h.key)
      // Accept* 是前缀命中（Accept / Accept-Charset / Accept-Encoding / Accept-Language）
      assert(out.length >= 4, '查询 ac 命中过少，实际 ' + out.join(','))
      assert(out.slice(0, 4).join(',') === 'Accept,Accept-Charset,Accept-Encoding,Accept-Language',
        '前缀命中应整体排在前，实际 ' + out.join(','))
      // Cache-Control 是包含命中（cac 位于 "cache-control" 第 0 位，故用 x- 验证纯包含）
      const inside = filterHeaders('request').map((h) => h.key)
      assert(inside.length === 1 && inside[0] === 'X-Request-Id', '包含命中应返回 X-Request-Id，实际 ' + inside.join(','))
    },
  },
  {
    name: 'headerPresets: filterHeaders 上限 8 条，且无命中返回空数组',
    fn() {
      // 'a' 命中项远多于 8（Accept* / Authorization / Cache-Control / User-Agent / X-Api-Key 等）
      const many = filterHeaders('a')
      assert(many.length === LIMIT, '命中项超过上限时应截断到 ' + LIMIT + ' 条，实际 ' + many.length)
      const none = filterHeaders('zzz-not-exist')
      assert(Array.isArray(none) && none.length === 0, '无命中应返回空数组，实际 ' + JSON.stringify(none))
    },
  },
  {
    name: 'headerPresets: filterHeaders 返回新数组与副本，不污染 COMMON_HEADERS',
    fn() {
      const out = filterHeaders('')
      assert(out !== COMMON_HEADERS, '不得直接返回 COMMON_HEADERS 本身')
      assert(out[0] !== COMMON_HEADERS[0], '元素应为副本，不得复用清单对象')
      const snapshot = COMMON_HEADERS.map((h) => h.key + '=' + h.value).join('|')
      out[0].key = '__mutated__'
      out[0].value = '__mutated__'
      out.push({ key: 'Extra', value: '', description: '' })
      const after = COMMON_HEADERS.map((h) => h.key + '=' + h.value).join('|')
      assert(after === snapshot, '改写返回值不应影响 COMMON_HEADERS，实际 ' + after)
      const again = filterHeaders('')
      assert(again.length === LIMIT, '再次调用仍应返回 ' + LIMIT + ' 条，实际 ' + again.length)
      assert(again[0].key === COMMON_HEADERS[0].key, '再次调用首项应正常')
    },
  },
  {
    name: 'headerPresets: isCommonHeader 正例（大小写/空白不敏感）',
    fn() {
      for (const key of ['Accept', 'content-type', 'CONTENT-TYPE', '  Content-Type  ', 'Authorization', 'x-request-id']) {
        assert(isCommonHeader(key) === true, '应识别为常用头：' + JSON.stringify(key))
      }
      for (const item of COMMON_HEADERS) {
        assert(isCommonHeader(item.key) === true, '清单内 key 应全部识别：' + item.key)
      }
    },
  },
  {
    name: 'headerPresets: isCommonHeader 反例（未知头/空值/非字符串）',
    fn() {
      for (const key of ['X-Not-Exist', 'Accepts', 'Content', '', '   ', null, undefined, 0, {}, []]) {
        assert(isCommonHeader(key) === false, '不应识别为常用头：' + JSON.stringify(key))
      }
    },
  },
]

/* ---------------- 直接执行（node tests/header-presets.test.js） ---------------- */

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
  console.log('\nheader-presets: 通过 ' + passed + '，失败 ' + failed + '，共 ' + (passed + failed))
  if (failed > 0) process.exitCode = 1
}
