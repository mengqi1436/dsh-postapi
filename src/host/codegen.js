/**
 * 代码生成（契约 §3 / feature-matrix 16）：generateCode({ endpoint, env, lang }) → string。
 * 纯函数，不落盘、不发请求。支持 curl / fetch / axios / python / go / java / php / csharp 八种。
 * env 提供 baseUrl 与 variables，用于 {{var}} 替换（未定义变量保留原文，便于用户回填）。
 */

const LANGS = ['curl', 'fetch', 'axios', 'python', 'go', 'java', 'php', 'csharp']

/** 变量替换：{{key}} 优先取 env.variables，其次 env 顶层同名键；未命中保留原文。 */
function makeReplacer(env) {
  const vars = new Map()
  const e = env && typeof env === 'object' ? env : {}
  const push = (k, v) => {
    if (typeof k === 'string' && k !== '' && v !== undefined && v !== null) vars.set(k, String(v))
  }
  if (Array.isArray(e.variables)) {
    for (const row of e.variables) {
      if (row && row.enabled !== false) push(row.key, row.value)
    }
  }
  for (const [k, v] of Object.entries(e)) {
    if (k !== 'variables' && typeof v !== 'object') push(k, v)
  }
  return (text) => String(text == null ? '' : text).replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (whole, key) => {
    const hit = vars.get(key)
    return hit === undefined ? whole : hit
  })
}

function asArray(v) {
  return Array.isArray(v) ? v : []
}

function str(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v)
}

/** 拼完整 URL：绝对 URL 原样，相对 URL 补 env.baseUrl。 */
function fullUrl(endpoint, env, replace) {
  const raw = replace(str(endpoint && endpoint.url))
  const base = replace(str(env && env.baseUrl)).replace(/\/+$/, '')
  const url = /^https?:\/\//i.test(raw) || base === '' ? raw : base + (raw.startsWith('/') ? raw : '/' + raw)
  const params = asArray(endpoint && endpoint.params)
    .filter((p) => p && p.enabled !== false && str(p.key) !== '')
    .map((p) => encodeURIComponent(replace(str(p.key))) + '=' + encodeURIComponent(replace(str(p.value))))
  if (params.length === 0) return url
  return url + (url.includes('?') ? '&' : '?') + params.join('&')
}

/** 有效 header 列表（enabled !== false 且 key 非空），含 auth 注入的 header。 */
function headersOf(endpoint, replace) {
  const out = []
  for (const h of asArray(endpoint && endpoint.headers)) {
    if (!h || h.enabled === false || str(h.key) === '') continue
    out.push([replace(str(h.key)), replace(str(h.value))])
  }
  const auth = (endpoint && endpoint.auth) || {}
  const type = str(auth.type) || 'none'
  const has = (name) => out.some(([k]) => k.toLowerCase() === name.toLowerCase())
  if (type === 'bearer' && str(auth.token) !== '' && !has('Authorization')) {
    out.push(['Authorization', 'Bearer ' + replace(str(auth.token))])
  }
  if (type === 'basic' && !has('Authorization')) {
    const pair = replace(str(auth.username)) + ':' + replace(str(auth.password))
    out.push(['Authorization', 'Basic ' + Buffer.from(pair, 'utf8').toString('base64')])
  }
  if (type === 'apikey' && str(auth.addTo) !== 'query' && str(auth.key) !== '' && !has(str(auth.key))) {
    out.push([replace(str(auth.key)), replace(str(auth.value))])
  }
  return out
}

/** 请求体：返回 { text, contentType } 或 null。urlencoded/form 由调用方按语言分别渲染。 */
function bodyOf(endpoint, replace) {
  const body = (endpoint && endpoint.body) || {}
  const type = str(body.type) || 'none'
  if (type === 'none') return null
  const content = replace(str(body.content))
  if (type === 'json') return { type, text: content === '' ? '{}' : content, contentType: 'application/json' }
  if (type === 'xml') return { type, text: content, contentType: 'application/xml' }
  if (type === 'urlencoded') return { type, text: content, contentType: 'application/x-www-form-urlencoded' }
  if (type === 'form') return { type, text: content, contentType: 'multipart/form-data' }
  if (type === 'graphql') return { type, text: content === '' ? '{"query":""}' : content, contentType: 'application/json' }
  if (type === 'binary') return { type, text: '', contentType: 'application/octet-stream' }
  return { type: 'raw', text: content, contentType: 'text/plain' }
}

/** urlencoded/form 的 content（JSON 数组字符串）→ [[k,v]]；非法 JSON 退化为空表。 */
function rowsOf(text) {
  try {
    const rows = JSON.parse(text)
    return asArray(rows).filter((r) => r && str(r.key) !== '').map((r) => [str(r.key), str(r.value)])
  } catch {
    return []
  }
}

function methodOf(endpoint) {
  const m = str(endpoint && endpoint.method).toUpperCase()
  return m === '' ? 'GET' : m
}

/* ── 各语言渲染 ────────────────────────────────────────────────────────── */

function genCurl(ctx) {
  const lines = ['curl -X ' + ctx.method + ' \'' + ctx.url + '\'']
  for (const [k, v] of ctx.headers) lines.push('  -H \'' + k + ': ' + v + '\'')
  const b = ctx.body
  if (b) {
    if (b.type === 'urlencoded' || b.type === 'form') {
      for (const [k, v] of rowsOf(b.text)) lines.push('  -d \'' + k + '=' + v + '\'')
    } else if (b.type !== 'binary' && b.text !== '') {
      lines.push('  -d \'' + b.text.replace(/'/g, "'\\''") + '\'')
    }
  }
  return lines.join(' \\\n')
}

function genFetch(ctx) {
  const opts = ['  method: \'' + ctx.method + '\',']
  opts.push('  headers: {')
  for (const [k, v] of ctx.headers) opts.push('    ' + JSON.stringify(k) + ': ' + JSON.stringify(v) + ',')
  opts.push('  },')
  if (ctx.body && ctx.body.type !== 'binary' && ctx.body.text !== '') {
    opts.push('  body: ' + JSON.stringify(ctx.body.text) + ',')
  }
  return [
    'const res = await fetch(' + JSON.stringify(ctx.url) + ', {',
    ...opts,
    '})',
    'const data = await res.json()',
  ].join('\n')
}

function genAxios(ctx) {
  const lines = ['import axios from \'axios\'', '', 'const res = await axios({']
  lines.push('  method: ' + JSON.stringify(ctx.method.toLowerCase()) + ',')
  lines.push('  url: ' + JSON.stringify(ctx.url) + ',')
  if (ctx.headers.length > 0) {
    lines.push('  headers: {')
    for (const [k, v] of ctx.headers) lines.push('    ' + JSON.stringify(k) + ': ' + JSON.stringify(v) + ',')
    lines.push('  },')
  }
  const b = ctx.body
  if (b) {
    if (b.type === 'urlencoded' || b.type === 'form') {
      lines.push('  data: new URLSearchParams({')
      for (const [k, v] of rowsOf(b.text)) lines.push('    ' + JSON.stringify(k) + ': ' + JSON.stringify(v) + ',')
      lines.push('  }),')
    } else if (b.type !== 'binary' && b.text !== '') {
      lines.push('  data: ' + b.text + ',')
    }
  }
  lines.push('})')
  lines.push('console.log(res.data)')
  return lines.join('\n')
}

function pyQuote(v) {
  return JSON.stringify(v)
}

function genPython(ctx) {
  const lines = ['import requests', '', 'url = ' + pyQuote(ctx.url)]
  if (ctx.headers.length > 0) {
    lines.push('headers = {')
    for (const [k, v] of ctx.headers) lines.push('    ' + pyQuote(k) + ': ' + pyQuote(v) + ',')
    lines.push('}')
  } else {
    lines.push('headers = {}')
  }
  const b = ctx.body
  if (b && (b.type === 'urlencoded' || b.type === 'form')) {
    lines.push('data = {')
    for (const [k, v] of rowsOf(b.text)) lines.push('    ' + pyQuote(k) + ': ' + pyQuote(v) + ',')
    lines.push('}')
  } else if (b && b.type !== 'binary' && b.text !== '') {
    lines.push('data = ' + pyQuote(b.text))
  } else {
    lines.push('data = None')
  }
  lines.push('')
  lines.push('res = requests.request(' + pyQuote(ctx.method) + ', url, headers=headers, data=data, timeout=30)')
  lines.push('print(res.status_code, res.text)')
  return lines.join('\n')
}

function goQuote(v) {
  return JSON.stringify(v)
}

function genGo(ctx) {
  const lines = [
    'package main',
    '',
    'import (',
    '\t"fmt"',
    '\t"io"',
    '\t"net/http"',
    '\t"strings"',
    ')',
    '',
    'func main() {',
  ]
  const b = ctx.body
  const hasBody = !!b && b.type !== 'binary' && b.text !== ''
  const payload = hasBody ? goQuote(b.text) : '""'
  lines.push('\tpayload := strings.NewReader(' + payload + ')')
  lines.push('\treq, err := http.NewRequest(' + goQuote(ctx.method) + ', ' + goQuote(ctx.url) + ', payload)')
  lines.push('\tif err != nil {')
  lines.push('\t\tpanic(err)')
  lines.push('\t}')
  for (const [k, v] of ctx.headers) lines.push('\treq.Header.Set(' + goQuote(k) + ', ' + goQuote(v) + ')')
  lines.push('\tres, err := http.DefaultClient.Do(req)')
  lines.push('\tif err != nil {')
  lines.push('\t\tpanic(err)')
  lines.push('\t}')
  lines.push('\tdefer res.Body.Close()')
  lines.push('\tbody, _ := io.ReadAll(res.Body)')
  lines.push('\tfmt.Println(res.Status)')
  lines.push('\tfmt.Println(string(body))')
  lines.push('}')
  return lines.join('\n')
}

function javaQuote(v) {
  return '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'
}

function genJava(ctx) {
  const lines = [
    'import java.net.URI;',
    'import java.net.http.HttpClient;',
    'import java.net.http.HttpRequest;',
    'import java.net.http.HttpResponse;',
    '',
    'public class Main {',
    '  public static void main(String[] args) throws Exception {',
    '    HttpClient client = HttpClient.newHttpClient();',
  ]
  const b = ctx.body
  const hasBody = !!b && b.type !== 'binary' && b.text !== ''
  lines.push('    HttpRequest.Builder builder = HttpRequest.newBuilder()')
  lines.push('        .uri(URI.create(' + javaQuote(ctx.url) + '))')
  for (const [k, v] of ctx.headers) {
    lines.push('        .header(' + javaQuote(k) + ', ' + javaQuote(v) + ')')
  }
  const bodyArg = hasBody
    ? 'HttpRequest.BodyPublishers.ofString(' + javaQuote(b.text) + ')'
    : 'HttpRequest.BodyPublishers.noBody()'
  lines.push('        .method(' + javaQuote(ctx.method) + ', ' + bodyArg + ');')
  lines.push('    HttpResponse<String> res = client.send(builder.build(), HttpResponse.BodyHandlers.ofString());')
  lines.push('    System.out.println(res.statusCode());')
  lines.push('    System.out.println(res.body());')
  lines.push('  }')
  lines.push('}')
  return lines.join('\n')
}

function phpQuote(v) {
  return "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"
}

function genPhp(ctx) {
  const lines = ['<?php', '$ch = curl_init();']
  lines.push('curl_setopt($ch, CURLOPT_URL, ' + phpQuote(ctx.url) + ');')
  lines.push('curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);')
  lines.push('curl_setopt($ch, CURLOPT_CUSTOMREQUEST, ' + phpQuote(ctx.method) + ');')
  if (ctx.headers.length > 0) {
    lines.push('curl_setopt($ch, CURLOPT_HTTPHEADER, [')
    for (const [k, v] of ctx.headers) lines.push('    ' + phpQuote(k + ': ' + v) + ',')
    lines.push(']);')
  }
  const b = ctx.body
  if (b && (b.type === 'urlencoded' || b.type === 'form')) {
    lines.push('curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([')
    for (const [k, v] of rowsOf(b.text)) lines.push('    ' + phpQuote(k) + ' => ' + phpQuote(v) + ',')
    lines.push(']));')
  } else if (b && b.type !== 'binary' && b.text !== '') {
    lines.push('curl_setopt($ch, CURLOPT_POSTFIELDS, ' + phpQuote(b.text) + ');')
  }
  lines.push('$response = curl_exec($ch);')
  lines.push('$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);')
  lines.push('curl_close($ch);')
  lines.push('echo $status . PHP_EOL;')
  lines.push('echo $response . PHP_EOL;')
  return lines.join('\n')
}

function csQuote(v) {
  return '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'
}

function genCsharp(ctx) {
  const lines = [
    'using System;',
    'using System.Net.Http;',
    'using System.Text;',
    'using System.Threading.Tasks;',
    '',
    'class Program',
    '{',
    '    static async Task Main()',
    '    {',
    '        using var client = new HttpClient();',
  ]
  lines.push('        var request = new HttpRequestMessage(new HttpMethod(' + csQuote(ctx.method) + '), ' + csQuote(ctx.url) + ');')
  for (const [k, v] of ctx.headers) {
    lines.push('        request.Headers.TryAddWithoutValidation(' + csQuote(k) + ', ' + csQuote(v) + ');')
  }
  const b = ctx.body
  if (b && b.type !== 'binary' && b.text !== '') {
    lines.push('        request.Content = new StringContent(' + csQuote(b.text) + ', Encoding.UTF8, ' + csQuote(b.contentType) + ');')
  }
  lines.push('        var response = await client.SendAsync(request);')
  lines.push('        var body = await response.Content.ReadAsStringAsync();')
  lines.push('        Console.WriteLine((int)response.StatusCode);')
  lines.push('        Console.WriteLine(body);')
  lines.push('    }')
  lines.push('}')
  return lines.join('\n')
}

const GENERATORS = {
  curl: genCurl,
  fetch: genFetch,
  axios: genAxios,
  python: genPython,
  go: genGo,
  java: genJava,
  php: genPhp,
  csharp: genCsharp,
}

/**
 * 生成请求代码。lang 缺省 'curl'；未知语言抛错（bridge 侧转 400）。
 * 返回字符串，末尾无换行。
 */
export function generateCode({ endpoint, env, lang } = {}) {
  const language = str(lang) === '' ? 'curl' : str(lang).toLowerCase()
  const gen = GENERATORS[language]
  if (!gen) throw new Error('generateCode: unsupported lang ' + lang)
  const replace = makeReplacer(env)
  const ctx = {
    method: methodOf(endpoint),
    url: fullUrl(endpoint, env, replace),
    headers: headersOf(endpoint, replace),
    body: bodyOf(endpoint, replace),
  }
  return gen(ctx)
}

/** 供 bridge/页面列出可选语言。 */
export function listLanguages() {
  return [...LANGS]
}
