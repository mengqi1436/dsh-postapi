// headerPresets — 常用请求头清单与过滤函数
// debug 页 Headers 组的两处消费：ParamTable 的 suggest（下拉建议）与「+ 常用请求头」（按顺序补 3 条）。
// 纯数据 + 纯函数，不引 React、不碰样式，组件与测试都能直接 import。

/** 常用请求头清单：数组顺序即「+ 常用请求头」的追加顺序，filterHeaders 空查询取前 8 条。 */
export const COMMON_HEADERS = [
  { key: 'Accept', value: 'application/json', description: '期望的响应内容类型' },
  { key: 'Accept-Charset', value: 'utf-8', description: '可接受的字符集' },
  { key: 'Accept-Encoding', value: 'gzip, deflate, br', description: '可接受的压缩编码' },
  { key: 'Accept-Language', value: 'zh-CN,zh;q=0.9', description: '期望的响应语言' },
  { key: 'Authorization', value: 'Bearer {{token}}', description: '认证凭证' },
  { key: 'Cache-Control', value: 'no-cache', description: '缓存控制' },
  { key: 'Content-Type', value: 'application/json', description: '请求体的媒体类型' },
  { key: 'Cookie', value: '', description: 'Cookie 字符串' },
  { key: 'If-None-Match', value: '', description: '条件请求（ETag）' },
  { key: 'Origin', value: '', description: '请求来源域' },
  { key: 'Referer', value: '', description: '来源页面地址' },
  { key: 'User-Agent', value: 'PostAPI/0.1.0', description: '客户端标识' },
  { key: 'X-Api-Key', value: '{{apiKey}}', description: 'API Key 认证' },
  { key: 'X-Request-Id', value: '{{$uuid}}', description: '请求追踪 ID' },
  { key: 'X-Forwarded-For', value: '', description: '代理链客户端 IP' },
]

/** 建议下拉最多返回条数（与 Apifox 一致）。 */
const SUGGEST_LIMIT = 8

/** 统一归一：null/undefined 转空串、去首尾空白、转小写（大小写不敏感的比较基准）。 */
function norm(value) {
  return String(value == null ? '' : value).trim().toLowerCase()
}

/** 复制一项：调用方拿到的永远是新对象，改写它不会污染 COMMON_HEADERS。 */
function copy(item) {
  return { ...item }
}

/**
 * 按关键字过滤常用请求头。
 * - 大小写不敏感，关键字先去首尾空白；
 * - 关键字为空时返回清单前 8 条；
 * - 否则 key 前缀命中的排在包含命中之前，同组内保持清单原顺序，最多 8 条；
 * - 始终返回新数组（元素也是副本），不会把 COMMON_HEADERS 本身交出去。
 */
export function filterHeaders(query) {
  const q = norm(query)
  if (!q) return COMMON_HEADERS.slice(0, SUGGEST_LIMIT).map(copy)
  const prefix = []
  const contains = []
  for (const item of COMMON_HEADERS) {
    const key = norm(item.key)
    const at = key.indexOf(q)
    if (at === 0) prefix.push(item)
    else if (at > 0) contains.push(item)
  }
  return prefix.concat(contains).slice(0, SUGGEST_LIMIT).map(copy)
}

/** 是否为常用请求头：大小写不敏感；空值/非字符串一律 false。 */
export function isCommonHeader(key) {
  const k = norm(key)
  if (!k) return false
  return COMMON_HEADERS.some((item) => norm(item.key) === k)
}
