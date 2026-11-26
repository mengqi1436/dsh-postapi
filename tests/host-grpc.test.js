/**
 * gRPC 客户端套件：proto3 解析器 / protobuf wire codec / http2 unary 调用 / 桥路由集成。
 *
 * 独立运行：node tests/host-grpc.test.js
 * lead 接线：tests/run.js 里 import { tests } from './host-grpc.test.js' 后逐条 await t.fn()。
 *
 * mock gRPC 服务端：node:http2 明文 h2c，请求帧（1B flag + 4B len + protobuf）用被测 codec
 * 解码，回 DATA 帧 + trailers grpc-status:0（wantTrailers/sendTrailers）。
 * 错误形态：trailers-only（headers 带 grpc-status）→ GRPC_ERROR；不回包 → TIMEOUT。
 */
import assert from 'node:assert/strict'
import http from 'node:http'
import http2 from 'node:http2'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { parseProto, encodeMessage, decodeMessage, createGrpcClient } from '../src/host/grpc-client.js'
import { handlePostapiRequest } from '../src/host/bridge.js'

const here = path.dirname(fileURLToPath(import.meta.url))

/** 全域共用的 .proto 文本：嵌套 message + repeated + map + oneof + enum + int64。 */
export const TEST_PROTO = [
  'syntax = "proto3";',
  'package demo.v1;',
  '',
  'enum Color {',
  '  RED = 0;',
  '  GREEN = 1;',
  '  BLUE = 2;',
  '}',
  '',
  'message Item {',
  '  string key = 1;',
  '  double qty = 2;',
  '}',
  '',
  'message Cart {',
  '  string user = 1;',
  '  repeated int32 codes = 2;',
  '  map<string, int64> counts = 3;',
  '  Item item = 4;',
  '  repeated Item items = 5;',
  '  oneof pay { string card = 10; string token = 11; }',
  '  Color color = 7;',
  '  repeated sint64 zz = 12;',
  '  bool paid = 6;',
  '  bytes blob = 14;',
  '}',
  '',
  'service CartService {',
  '  rpc GetCart(Cart) returns (Cart);',
  '  rpc Watch(stream Cart) returns (stream Cart);',
  '}',
].join('\n')

function grpcFrame(payload) {
  const head = Buffer.alloc(5)
  head.writeUInt32BE(payload.length, 1)
  return Buffer.concat([head, payload])
}

/**
 * mock gRPC 服务端（h2c）。responseFn(reqJson, headers) →
 *   { message } 回 DATA + trailers grpc-status:0（可带 trailers 附加键）
 * | { errorStatus, errorMessage? } trailers-only 错误
 * | { hang: true } 收到请求后挂住（客户端超时用）
 * | { httpStatus } 非 200 响应
 */
function makeGrpcMock(responseFn) {
  const server = http2.createServer()
  const seen = { headers: [], bodies: [] }
  server.on('stream', (stream, headers) => {
    seen.headers.push(headers)
    const chunks = []
    stream.on('data', (c) => chunks.push(c))
    stream.on('end', () => {
      try {
        const frame = Buffer.concat(chunks)
        const reg = parseProto(TEST_PROTO)
        const cart = reg.types.get('demo.v1.Cart')
        const req = frame.length >= 5 ? decodeMessage(cart, frame.subarray(5, 5 + frame.readUInt32BE(1))) : {}
        seen.bodies.push(req)
        const out = responseFn(req, headers) || {}
        if (out.hang) return // 挂住：客户端 grpc-timeout 到点自己断
        if (out.httpStatus !== undefined) {
          stream.respond({ ':status': String(out.httpStatus), 'content-type': 'application/grpc+proto' }, { endStream: true })
          return
        }
        if (out.errorStatus !== undefined) {
          const h = { ':status': 200, 'content-type': 'application/grpc+proto', 'grpc-status': String(out.errorStatus) }
          if (out.errorMessage !== undefined) h['grpc-message'] = out.errorMessage
          stream.respond(h, { endStream: true }) // trailers-only 形态
          return
        }
        const resp = encodeMessage(cart, out.message || {})
        stream.respond({ ':status': 200, 'content-type': 'application/grpc+proto' }, { waitForTrailers: true })
        stream.on('wantTrailers', () => {
          stream.sendTrailers({ 'grpc-status': String(out.statusCode ?? 0), ...(out.trailers || {}) })
        })
        stream.write(grpcFrame(resp))
        stream.end()
      } catch (err) {
        stream.respond({ ':status': 500 }, { endStream: true })
      }
    })
  })
  return {
    seen,
    listen() {
      return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve('http://127.0.0.1:' + server.address().port)))
    },
    async close() {
      server.closeAllConnections?.()
      await new Promise((resolve) => server.close(resolve))
    },
  }
}

/** 把 handlePostapiRequest 挂成 loopback HTTP 服务（桥路由集成用）。 */
async function withBridgeServer(services, fn) {
  const storage = { listProjects: async () => [] }
  const server = http.createServer((req, res) => {
    Promise.resolve(handlePostapiRequest(req, res, { storage, request: {}, services })).catch(() => {
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ ok: false, error: 'handler crashed', code: 'INTERNAL' }))
    })
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const base = 'http://127.0.0.1:' + server.address().port
  try {
    return await fn(base)
  } finally {
    server.closeAllConnections?.()
    await new Promise((resolve) => server.close(resolve))
  }
}

/** 单跑支持块（与 tests/shell-frame.test.js 同款）。 */
const isMain = (() => {
  try {
    const argv1 = process.argv[1]
    return Boolean(argv1) && path.resolve(argv1) === fileURLToPath(import.meta.url)
  } catch {
    return false
  }
})()

export const tests = [
  {
    name: 'grpc codec: encode/decodeMessage round-trip（嵌套/repeated/map/oneof/enum/int64/sint/bytes）',
    fn: () => {
      const reg = parseProto(TEST_PROTO)
      const cart = reg.types.get('demo.v1.Cart')
      const json = {
        user: 'u1',
        codes: [1, -2, 2147483647],
        counts: { a: '9007199254740993', b: '0' }, // int64 字符串保精度
        item: { key: 'k', qty: 1.5 },
        items: [{ key: 'x', qty: 2.25 }, { key: '', qty: 0 }],
        card: '4111-1111', // oneof 摊平字段
        color: 'BLUE', // enum 名
        zz: ['-5', '0', '5'],
        paid: true,
        blob: 'AQID', // bytes base64
      }
      const buf = encodeMessage(cart, json)
      const back = decodeMessage(cart, buf)
      assert.deepEqual(back, json)
      // 二次编码字节级稳定（解码→编码幂等）
      assert.equal(Buffer.compare(buf, encodeMessage(cart, back)), 0)
      // enum 数值同样可编，解码回名字
      const byNumber = decodeMessage(cart, encodeMessage(cart, { ...json, color: 1 }))
      assert.equal(byNumber.color, 'GREEN')
      // int32 负数按 64 位补码 varint 也能解
      assert.deepEqual(decodeMessage(cart, encodeMessage(cart, { codes: [-2147483648] })).codes, [-2147483648])
    },
  },
  {
    name: 'grpc codec: packed repeated 默认打包 / [packed=false] 逐元素 / 未知字段与乱序字段跳过',
    fn: () => {
      const reg = parseProto(TEST_PROTO)
      const cart = reg.types.get('demo.v1.Cart')
      // codes（repeated int32）proto3 默认 packed：单帧长度前缀
      const buf = encodeMessage(cart, { codes: [1, 2, 3] })
      assert.deepEqual([...buf], [0x12, 3, 1, 2, 3])
      // 服务端不打包（逐元素）同样可解：定长形态对无 packed 的 message 解
      const regP0 = parseProto('syntax="proto3"; message P0 { repeated int32 xs = 1 [packed=false]; }')
      const unpacked = Buffer.from([0x08, 1, 0x08, 2, 0x08, 3])
      assert.deepEqual(decodeMessage(regP0.types.get('P0'), unpacked).xs, [1, 2, 3])
      // 显式 [packed=false]
      const reg2 = parseProto('syntax="proto3"; message P { repeated int32 xs = 1 [packed=false]; string s = 2; }')
      const p = reg2.types.get('P')
      assert.deepEqual([...encodeMessage(p, { xs: [1, 2] })], [0x08, 1, 0x08, 2])
      // 未知字段（wireType 0/2/5）+ 乱序 + 嵌套未知子消息，全部跳过
      const foreign = Buffer.from([
        0x12, 3, 0x63, 0x62, 0x61, // s = 'cba'
        0x08, 0x63, // xs = [99]
        0x2a, 3, 0x08, 0x96, 0x01, // 未知字段 5（子消息，内部 varint 字段）
        0x4d, 7, 0, 0, 0, // 未知字段 9 fixed32 → 跳过 4 字节
      ])
      assert.deepEqual(decodeMessage(p, foreign), { s: 'cba', xs: [99] })
    },
  },
  {
    name: 'grpc codec: proto 解析器（oneof/map/nested/reserved/option/import 跳过 + 行列报错）',
    fn: () => {
      const reg = parseProto(TEST_PROTO)
      assert.equal(reg.pkg, 'demo.v1')
      const svc = reg.services[0]
      assert.equal(svc.fullName, 'demo.v1.CartService')
      assert.equal(svc.methods[0].name, 'GetCart')
      assert.equal(svc.methods[0].clientStreaming, false)
      assert.equal(svc.methods[1].clientStreaming, true)
      assert.equal(svc.methods[1].serverStreaming, true)
      const cart = reg.types.get('demo.v1.Cart')
      assert.ok(cart.byName.get('item').ref.fullName === 'demo.v1.Item')
      assert.equal(cart.byName.get('counts').kind, 'map')
      assert.equal(cart.byName.get('counts').keyScalar, 'string')
      assert.equal(cart.byName.get('card').oneof, 'pay')
      assert.equal(cart.byName.get('token').oneof, 'pay')
      // reserved/option/import 跳过；嵌套 message + 同文件枚举引用解析 + 类型全限定名带包前缀
      const reg2 = parseProto([
        'syntax = "proto3";',
        'import "other.proto";',
        'option java_package = "com.x";',
        'package a.b;',
        'message Outer {',
        '  reserved 2, 15, 9 to 11;',
        '  reserved "legacy";',
        '  option deprecated = true;',
        '  message Inner { string id = 1; }',
        '  enum Level { L0 = 0; L1 = 1; }',
        '  Inner inner = 1;',
        '  Level level = 2;',
        '}',
        'service S { rpc Do(Outer) returns (Outer); }',
      ].join('\n'))
      const outer = reg2.types.get('a.b.Outer')
      assert.ok(outer, 'message 全限定名应带包前缀')
      assert.equal(outer.byName.get('inner').ref.fullName, 'a.b.Outer.Inner')
      assert.equal(outer.byName.get('level').ref.kind, 'enum')
      assert.equal(reg2.services[0].fullName, 'a.b.S')
      assert.equal(reg2.services[0].methods[0].inputType.fullName, 'a.b.Outer')
      // 坏语法：字段号缺失 → INVALID_ARGUMENT 带「第 3 行第 13 列」（';' 在第 13 列）
      assert.throws(
        () => parseProto('syntax = "proto3";\nmessage A {\n  int32 x = ;\n}\n'),
        (err) => err.code === 'INVALID_ARGUMENT' && /第 3 行第 13 列/.test(err.message),
      )
      // 未闭合 message
      assert.throws(() => parseProto('syntax = "proto3";\nmessage A {\n'), /未闭合/)
      // 未知顶层关键字
      assert.throws(() => parseProto('syntax = "proto3";\nsyntax2 = "x";'), /未知顶层关键字/)
    },
  },
  {
    name: 'grpc invoke: proto 解析失败（缺字段号）带行列的 INVALID_ARGUMENT',
    fn: async () => {
      const client = createGrpcClient()
      const badProto = 'syntax = "proto3";\nmessage A {\n  int32 x = ;\n}\n'
      const res = await client.invoke({ address: 'http://127.0.0.1:1', proto: badProto, service: 'A', method: 'M' })
      assert.equal(res.ok, false)
      assert.equal(res.error.code, 'INVALID_ARGUMENT')
      assert.match(res.error.message, /第 3 行第 13 列/)
      // 缺参：无 proto / 无 service / message 非对象
      const noProto = await client.invoke({ address: 'http://127.0.0.1:1', proto: '', service: 'A', method: 'M' })
      assert.equal(noProto.error.code, 'INVALID_ARGUMENT')
      const noSvc = await client.invoke({ address: 'http://127.0.0.1:1', proto: TEST_PROTO, service: '', method: 'GetCart' })
      assert.equal(noSvc.error.code, 'INVALID_ARGUMENT')
      const badMsg = await client.invoke({ address: 'http://127.0.0.1:1', proto: TEST_PROTO, service: 'demo.v1.CartService', method: 'GetCart', message: [1] })
      assert.equal(badMsg.error.code, 'INVALID_ARGUMENT')
      const badAddr = await client.invoke({ address: 'tcp://x', proto: TEST_PROTO, service: 'demo.v1.CartService', method: 'GetCart' })
      assert.equal(badAddr.error.code, 'INVALID_ARGUMENT')
    },
  },
  {
    name: 'grpc invoke: 非 unary rpc 报 INVALID_ARGUMENT（仅支持 unary）',
    fn: async () => {
      const client = createGrpcClient()
      const res = await client.invoke({ address: 'http://127.0.0.1:1', proto: TEST_PROTO, service: 'demo.v1.CartService', method: 'Watch', message: {} })
      assert.equal(res.ok, false)
      assert.equal(res.error.code, 'INVALID_ARGUMENT')
      assert.match(res.error.message, /仅支持 unary/)
      // 方法不存在
      const missing = await client.invoke({ address: 'http://127.0.0.1:1', proto: TEST_PROTO, service: 'demo.v1.CartService', method: 'Nope' })
      assert.equal(missing.error.code, 'INVALID_ARGUMENT')
      assert.match(missing.error.message, /Nope/)
    },
  },
  {
    name: 'grpc invoke: 消息未知字段报 INVALID_ARGUMENT（带字段路径）',
    fn: async () => {
      const client = createGrpcClient()
      const res = await client.invoke({ address: 'http://127.0.0.1:1', proto: TEST_PROTO, service: 'demo.v1.CartService', method: 'GetCart', message: { item: { nope: 1 } } })
      assert.equal(res.ok, false)
      assert.equal(res.error.code, 'INVALID_ARGUMENT')
      assert.match(res.error.message, /nope/)
      assert.match(res.error.message, /demo\.v1\.Item/)
      // 顶层未知字段
      const top = await client.invoke({ address: 'http://127.0.0.1:1', proto: TEST_PROTO, service: 'demo.v1.CartService', method: 'GetCart', message: { ghost: true } })
      assert.match(top.error.message, /ghost/)
    },
  },
  {
    name: 'grpc invoke: 成功往返（嵌套 message + repeated + map + oneof + enum，服务端断言收到的消息）',
    fn: async () => {
      const mock = makeGrpcMock((req) => ({
        message: {
          user: req.user + '!ok',
          codes: req.codes.concat([99]),
          counts: { ...req.counts, extra: '42' },
          item: { key: req.item.key.toUpperCase(), qty: req.item.qty * 2 },
          items: req.items,
          color: 'BLUE',
          card: req.card,
          paid: true,
        },
        trailers: { 'x-tail': 'tv' },
      }))
      const base = await mock.listen()
      const client = createGrpcClient()
      try {
        const res = await client.invoke({
          address: base,
          proto: TEST_PROTO,
          service: 'demo.v1.CartService',
          method: 'GetCart',
          message: {
            user: 'tom',
            codes: [1, 2],
            counts: { cart: '9007199254740993' },
            item: { key: 'sku', qty: 3.5 },
            items: [{ key: 'a', qty: 1 }],
            card: '4111',
          },
          metadata: { 'x-trace-id': 'T-1' },
          timeoutMs: 5000,
        })
        assert.equal(res.ok, undefined) // 成功形态无 ok 字段
        assert.equal(res.status, 'OK')
        assert.equal(res.statusCode, 0)
        assert.equal(res.path, '/demo.v1.CartService/GetCart')
        assert.equal(res.address, base)
        assert.equal(res.timeMs >= 0, true)
        assert.equal(res.message.user, 'tom!ok')
        assert.deepEqual(res.message.codes, [1, 2, 99])
        assert.deepEqual(res.message.counts, { cart: '9007199254740993', extra: '42' })
        assert.deepEqual(res.message.item, { key: 'SKU', qty: 7 })
        assert.equal(res.message.color, 'BLUE')
        assert.equal(res.trailers['grpc-status'], '0')
        assert.equal(res.trailers['x-tail'], 'tv')
        // 服务端真实解出的请求体
        const seen = mock.seen.bodies[0]
        assert.equal(seen.user, 'tom')
        assert.deepEqual(seen.counts, { cart: '9007199254740993' })
        assert.deepEqual(seen.item, { key: 'sku', qty: 3.5 })
      } finally {
        await client.closeAll()
        await mock.close()
      }
    },
  },
  {
    name: 'grpc invoke: int64 字符串精度跨进程不丢',
    fn: async () => {
      const big = '9223372036854775807' // int64 max
      const mock = makeGrpcMock((req) => ({ message: { counts: { echo: req.counts.echo } } }))
      const base = await mock.listen()
      const client = createGrpcClient()
      try {
        const res = await client.invoke({
          address: base, proto: TEST_PROTO, service: 'demo.v1.CartService', method: 'GetCart',
          message: { counts: { echo: big } }, timeoutMs: 5000,
        })
        assert.equal(res.message.counts.echo, big)
        assert.equal(mock.seen.bodies[0].counts.echo, big)
      } finally {
        await client.closeAll()
        await mock.close()
      }
    },
  },
  {
    name: 'grpc invoke: metadata 透传（服务端断言收到头 + 保留头注入被拒）',
    fn: async () => {
      const mock = makeGrpcMock((req, headers) => {
        mock.seen.meta = headers
        return { message: {} }
      })
      const base = await mock.listen()
      const client = createGrpcClient()
      try {
        await client.invoke({
          address: base, proto: TEST_PROTO, service: 'demo.v1.CartService', method: 'GetCart',
          message: {}, metadata: { 'x-trace-id': 'T-9', Authorization: 'Bearer tk', ':evil': 'x', 'grpc-timeout': 'hack' },
          timeoutMs: 5000,
        })
        const h = mock.seen.meta
        assert.equal(h['x-trace-id'], 'T-9')
        assert.equal(h.authorization, 'Bearer tk')
        assert.equal(h['content-type'], 'application/grpc+proto')
        assert.equal(h.te, 'trailers')
        assert.match(h['grpc-timeout'], /^\d+m$/)
        assert.equal(h[':evil'], undefined, '伪头必须被过滤')
        assert.notEqual(h['grpc-timeout'], 'hack', '保留头不允许被 metadata 覆盖')
      } finally {
        await client.closeAll()
        await mock.close()
      }
    },
  },
  {
    name: 'grpc invoke: 服务端 grpc-status:5 → GRPC_ERROR（状态名 + grpc-message 百分号解码）',
    fn: async () => {
      const mock = makeGrpcMock(() => ({ errorStatus: 5, errorMessage: 'cart%20not%20found' }))
      const base = await mock.listen()
      const client = createGrpcClient()
      try {
        const res = await client.invoke({ address: base, proto: TEST_PROTO, service: 'demo.v1.CartService', method: 'GetCart', message: {}, timeoutMs: 5000 })
        assert.equal(res.ok, false)
        assert.equal(res.error.code, 'GRPC_ERROR')
        assert.match(res.error.message, /NOT_FOUND\(5\)/)
        assert.match(res.error.message, /cart not found/)
        // 非 0 但无 grpc-message
        const mock2 = makeGrpcMock(() => ({ errorStatus: 16 }))
        const base2 = await mock2.listen()
        try {
          const res2 = await client.invoke({ address: base2, proto: TEST_PROTO, service: 'demo.v1.CartService', method: 'GetCart', message: {}, timeoutMs: 5000 })
          assert.match(res2.error.message, /UNAUTHENTICATED\(16\)/)
        } finally {
          await mock2.close()
        }
      } finally {
        await client.closeAll()
        await mock.close()
      }
    },
  },
  {
    name: 'grpc invoke: 连接拒绝（端口已关）→ UNAVAILABLE；HTTP 非 200 → UNAVAILABLE',
    fn: async () => {
      const client = createGrpcClient()
      // 起一个 TCP 口再关掉，拿到一个确定不可连的端口
      const dead = http.createServer()
      dead.listen(0, '127.0.0.1')
      await once(dead, 'listening')
      const deadPort = dead.address().port
      await new Promise((resolve) => dead.close(resolve))
      const res = await client.invoke({ address: 'http://127.0.0.1:' + deadPort, proto: TEST_PROTO, service: 'demo.v1.CartService', method: 'GetCart', message: {}, timeoutMs: 5000 })
      assert.equal(res.ok, false)
      assert.equal(res.error.code, 'UNAVAILABLE')
      // HTTP 非 200
      const mock = makeGrpcMock(() => ({ httpStatus: 404 }))
      const base = await mock.listen()
      try {
        const res2 = await client.invoke({ address: base, proto: TEST_PROTO, service: 'demo.v1.CartService', method: 'GetCart', message: {}, timeoutMs: 5000 })
        assert.equal(res2.error.code, 'UNAVAILABLE')
        assert.match(res2.error.message, /404/)
      } finally {
        await mock.close()
      }
    },
  },
  {
    name: 'grpc invoke: grpc-timeout 超时 → TIMEOUT（挂住的服务端 + 定时器销毁 session）',
    fn: async () => {
      const mock = makeGrpcMock(() => ({ hang: true }))
      const base = await mock.listen()
      const client = createGrpcClient()
      try {
        const started = Date.now()
        const res = await client.invoke({ address: base, proto: TEST_PROTO, service: 'demo.v1.CartService', method: 'GetCart', message: {}, timeoutMs: 600 })
        const cost = Date.now() - started
        assert.equal(res.ok, false)
        assert.equal(res.error.code, 'TIMEOUT')
        assert.ok(cost < 4000, '超时应由客户端定时器触发，不应等满 4s：' + cost)
        // closeAll 幂等可调用
        const closed = await client.closeAll()
        assert.equal(typeof closed.closed, 'number')
      } finally {
        await mock.close()
      }
    },
  },
  {
    name: 'grpc bridge: POST /grpc/invoke 走 handlePostapiRequest 通 + 失败封套透传',
    fn: async () => {
      const mock = makeGrpcMock((req) => ({ message: { user: req.user + '!ok', paid: true } }))
      const base = await mock.listen()
      const client = createGrpcClient()
      try {
        await withBridgeServer({ grpc: client }, async (httpBase) => {
          const res = await fetch(httpBase + '/api/grpc/invoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address: base, proto: TEST_PROTO, service: 'demo.v1.CartService', method: 'GetCart',
              message: { user: 'bob' }, timeoutMs: 5000,
            }),
          })
          assert.equal(res.status, 200)
          const payload = await res.json()
          assert.equal(payload.ok, true)
          assert.equal(payload.data.message.user, 'bob!ok')
          assert.equal(payload.data.status, 'OK')
          // 失败封套：service 缺失 → data.ok:false + code（HTTP 仍 200，UI 按 code 分支）
          const bad = await fetch(httpBase + '/dsh-postapi/api/grpc/invoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: base, proto: TEST_PROTO, service: '', method: 'GetCart' }),
          })
          assert.equal(bad.status, 200)
          const badPayload = await bad.json()
          assert.equal(badPayload.ok, true)
          assert.equal(badPayload.data.ok, false)
          assert.equal(badPayload.data.error.code, 'INVALID_ARGUMENT')
        })
      } finally {
        await client.closeAll()
        await mock.close()
      }
    },
  },
]

if (isMain) {
  let passed = 0
  let failed = 0
  for (const c of tests) {
    try {
      await c.fn()
      passed += 1
      console.log('  PASS ' + c.name)
    } catch (err) {
      failed += 1
      console.log('  FAIL ' + c.name)
      console.log('       ' + (err && err.message ? err.message : err))
    }
  }
  console.log('\nhost-grpc: 通过 ' + passed + '，失败 ' + failed + '，共 ' + (passed + failed))
  if (failed > 0) process.exitCode = 1
}
