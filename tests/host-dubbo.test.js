/**
 * Dubbo 客户端套件：hessian-lite codec / Dubbo 协议帧 / TCP 调用 / 桥路由集成。
 *
 * 独立运行：node tests/host-dubbo.test.js
 * lead 接线：tests/run.js 里 import { tests } from './host-dubbo.test.js' 后逐条 await t.fn()。
 *
 * mock Dubbo 服务端：node:net，读 16B 头 + bodyLen 定长 body，hessianDecodeAll 解请求体
 * （[dubbo版本, path, version, method, 描述符串, ...args, attachments?]），按 id 回帧。
 * 响应形态：flag 0=值 / 1=值+attachments / 2=null / 3=异常（class-def Throwable）。
 */
import assert from 'node:assert/strict'
import http from 'node:http'
import net from 'node:net'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  hessianEncode, hessianDecode, hessianDecodeAll, javaDescriptor, createDubboClient,
} from '../src/host/dubbo-client.js'
import { handlePostapiRequest } from '../src/host/bridge.js'

const here = path.dirname(fileURLToPath(import.meta.url))

/** 描述符串 → 参数个数（按字符顺序解析：'[' 前缀跳过，'L...;' 跳到分号，原始单字符计 1）。 */
function countDescriptors(desc) {
  let n = 0
  for (let i = 0; i < desc.length;) {
    const c = desc[i]
    if (c === '[') { i += 1; continue }
    if (c === 'L') { i = desc.indexOf(';', i) + 1; n += 1; continue }
    i += 1
    n += 1
  }
  return n
}

function buildResponseFrame({ id, status = 20, body }) {
  const head = Buffer.alloc(16)
  head.writeUInt16BE(0xdabb, 0)
  head[2] = 2 // 序列化 hessian2，非请求帧
  head[3] = status
  head.writeBigUInt64BE(BigInt(id), 4)
  head.writeUInt32BE(body.length, 12)
  return Buffer.concat([head, body])
}

/**
 * mock Dubbo 服务端。responder(ctx) →
 *   { body } 回 20 + body（ctx 含 decoded 请求值数组 / id / head）
 * | { status, body } 非 20 状态
 * | { hang: true } 收到请求后挂住（客户端超时用）
 */
function makeDubboMock(responder) {
  const server = net.createServer((sock) => {
    let acc = Buffer.alloc(0)
    sock.on('data', (chunk) => {
      acc = Buffer.concat([acc, chunk])
      for (;;) {
        if (acc.length < 16) return
        const bodyLen = acc.readUInt32BE(12)
        if (acc.length < 16 + bodyLen) return
        const head = acc.subarray(0, 16)
        const body = acc.subarray(16, 16 + bodyLen)
        acc = acc.subarray(16 + bodyLen)
        const ctx = {
          id: head.readBigUInt64BE(4),
          flag: head[2],
          decoded: hessianDecodeAll(body, 0),
          rawBody: body,
        }
        const out = responder(ctx) || {}
        if (out.hang) return
        sock.write(buildResponseFrame({ id: ctx.id, status: out.status ?? 20, body: out.body ?? Buffer.from([0x02]) }))
      }
    })
  })
  return {
    listen() {
      return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)))
    },
    async close() {
      server.closeAllConnections?.()
      await new Promise((resolve) => server.close(resolve))
    },
  }
}

const valueBody = (v) => Buffer.concat([Buffer.from([0x00]), hessianEncode(v)])

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
    name: 'hessian codec: 标量/长字符串分块/紧凑形态解码/map/list/对象/ref 全分支',
    fn: () => {
      const enc = (v) => hessianEncode(v)
      const dec = (v) => hessianDecode(enc(v), 0).value
      // 标量 round-trip
      assert.equal(dec(null), null)
      assert.equal(dec(true), true)
      assert.equal(dec(false), false)
      assert.equal(dec(12345), 12345)
      assert.equal(dec(-999), -999)
      assert.equal(dec(1.25), 1.25)
      assert.equal(dec('hello 中文'), 'hello 中文')
      assert.equal(dec('x'.repeat(40000)).length, 40000, '长字符串走 R 分块 + S 终块')
      assert.equal(dec('y'.repeat(40)).length, 40, '40 字符走 0x30-0x33 形态')
      assert.equal(dec(Buffer.from([1, 2, 3])), 'AQID', 'binary → base64')
      assert.equal(dec(new Date('2024-01-01T00:00:00Z')), '2024-01-01T00:00:00.000Z')
      assert.deepEqual(dec([1, 'x', true, null]), [1, 'x', true, null])
      assert.deepEqual(dec({ a: 1, b: 'y', nested: { k: [2] } }), { a: 1, b: 'y', nested: { k: [2] } })
      // 64 位整数以字符串回传保精度
      assert.equal(dec('9007199254740993'), '9007199254740993')
      assert.equal(dec(BigInt('-9223372036854775808')), '-9223372036854775808')
      // 带 __class 的对象走 'M'+type，解码回 { __class, ...fields }
      assert.deepEqual(dec({ __class: 'com.x.User', name: 'tom', age: 9 }), { __class: 'com.x.User', name: 'tom', age: 9 })
      // 服务端紧凑形态（规范表逐项）：int 单字节/两字节/三字节/'I'，long 单/两/三字节/'Y'/'L'，double 紧凑，date 'K'/'J'
      assert.deepEqual(hessianDecodeAll(Buffer.from([0x90, 0xbf, 0xc8, 0x00, 0xd4, 0x12, 0x34, 0x49, 0x00, 0x00, 0x30, 0x39]), 0), [0, 47, 0, 4660, 12345])
      assert.deepEqual(hessianDecodeAll(Buffer.from([0xe0, 0xf8, 0x00, 0x3c, 0x12, 0x34, 0x59, 0x00, 0x00, 0x01, 0x00, 0x4c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x64]), 0), [0, 0, '4660', '256', '100'])
      assert.deepEqual(hessianDecodeAll(Buffer.from([0x5b, 0x5c, 0x5d, 0x05, 0x5e, 0x01, 0x00]), 0), [0, 1, 5, 256])
      const dateBuf = Buffer.alloc(16)
      dateBuf[0] = 0x4b // 'K' 分钟精度
      dateBuf.writeInt32BE(10109, 1)
      dateBuf[5] = 0x4a // 'J' 毫秒精度
      const ms2024 = BigInt(new Date('2024-06-01T08:00:00.000Z').getTime())
      dateBuf.writeBigInt64BE(ms2024, 6)
      const dates = hessianDecodeAll(dateBuf, 0)
      assert.equal(dates[0], new Date(10109 * 60000).toISOString())
      assert.equal(dates[1], new Date(Number(ms2024)).toISOString())
      // 'Q'(0x51) 共享引用：两个 key 指向同一 list（refs[1]）
      const refBuf = Buffer.from([0x48, 0x01, 0x61, 0x79, 0x97, 0x01, 0x62, 0x51, 0x91, 0x5a])
      const refVals = hessianDecodeAll(refBuf, 0)
      assert.equal(refVals[0].b, refVals[0].a)
      assert.deepEqual(refVals[0].a, [7])
      // class-def：'C' + 类名 + 字段数('I') + 字段名 + 实例值；'O'(0x4f) 引用 def
      const clsBuf = Buffer.concat([
        Buffer.from([0x43]), hessianEncode('java.lang.RuntimeException'),
        Buffer.from([0x49, 0, 0, 0, 1]), hessianEncode('detailMessage'),
        hessianEncode('boom'),
        Buffer.from([0x4f]), Buffer.from([0x49, 0, 0, 0, 0]),
        hessianEncode('second'),
      ])
      const clsVals = hessianDecodeAll(clsBuf, 0)
      assert.deepEqual(clsVals[0], { __class: 'java.lang.RuntimeException', detailMessage: 'boom' })
      assert.deepEqual(clsVals[1], { __class: 'java.lang.RuntimeException', detailMessage: 'second' })
      // 描述符转换
      assert.equal(javaDescriptor('java.lang.String'), 'Ljava/lang/String;')
      assert.equal(javaDescriptor('int'), 'I')
      assert.equal(javaDescriptor('long'), 'J')
      assert.equal(javaDescriptor('java.lang.String[]'), '[Ljava/lang/String;')
      assert.equal(javaDescriptor('int[]'), '[I')
      assert.equal(javaDescriptor('java.util.Map'), 'Ljava/util/Map;')
      // 类型回引用：第二个 'M' 的 type 用紧凑 int 回引（0x90 → types[0]）
      const typeRefBuf = Buffer.concat([
        enc({ __class: 'com.x.Item', id: 1 }),
        enc({ __class: 'com.x.Item', id: 2 }),
      ])
      assert.deepEqual(hessianDecodeAll(typeRefBuf, 0), [
        { __class: 'com.x.Item', id: 1 },
        { __class: 'com.x.Item', id: 2 },
      ])
    },
  },
  {
    name: 'dubbo invoke: 直连调用（String+int）成功往返 + 帧/头/attachments 服务端断言',
    fn: async () => {
      let reqCtx = null
      const mock = makeDubboMock((ctx) => {
        reqCtx = ctx
        return { body: valueBody('user-' + ctx.decoded[5] + ':' + ctx.decoded[6]) }
      })
      const port = await mock.listen()
      const client = createDubboClient()
      try {
        const res = await client.invoke({
          address: '127.0.0.1:' + port,
          interface: 'com.x.Api', version: '1.0.0', method: 'get',
          parameterTypes: ['java.lang.String', 'int'], args: ['tom', 7],
          attachments: { traceId: 'T-9', path: 'hijack-attempt' },
          timeoutMs: 5000,
        })
        assert.equal(res.ok, undefined)
        assert.equal(res.status, 'OK')
        assert.equal(res.address, '127.0.0.1:' + port)
        assert.equal(res.interface, 'com.x.Api')
        assert.equal(res.method, 'get')
        assert.equal(res.value, 'user-tom:7')
        assert.ok(res.timeMs >= 0)
        // 服务端解出的请求体形态（dubbo 协议 body 布局）
        assert.deepEqual(reqCtx.decoded.slice(0, 5), ['2.0.2', 'com.x.Api', '1.0.0', 'get', 'Ljava/lang/String;I'])
        assert.equal(reqCtx.decoded[5], 'tom')
        assert.equal(reqCtx.decoded[6], 7)
        const att = reqCtx.decoded[7]
        assert.equal(att.path, 'com.x.Api')
        assert.equal(att.interface, 'com.x.Api')
        assert.equal(att.method, 'get')
        assert.equal(att.version, '1.0.0')
        assert.equal(att.timeout, '5000')
        // 用户自定义 attachments 透传；寻址键（path）不可被用户附件覆盖
        assert.equal(att.traceId, 'T-9')
        assert.equal(att.path, 'com.x.Api')
        // 请求帧头：魔数 + Req|2way|hessian2
        assert.equal(reqCtx.flag, 0x80 | 0x40 | 2)
        assert.equal(reqCtx.id > 0n, true)
      } finally {
        await client.closeAll()
        await mock.close()
      }
    },
  },
  {
    name: 'dubbo invoke: generic $invoke 泛化（GenericService 形态 + generic attachment + 参数保形）',
    fn: async () => {
      let reqCtx = null
      const mock = makeDubboMock((ctx) => {
        reqCtx = ctx
        return { body: Buffer.concat([Buffer.from([0x01]), hessianEncode({ name: 'tom', score: 9 }), hessianEncode({ dc: 'gz01' })]) }
      })
      const port = await mock.listen()
      const client = createDubboClient()
      try {
        const res = await client.invoke({
          address: '127.0.0.1:' + port,
          interface: 'com.x.Api', method: 'find',
          parameterTypes: ['com.x.User'], args: [{ name: 'tom', score: 9 }],
          generic: true, timeoutMs: 5000,
        })
        assert.equal(res.status, 'OK')
        assert.deepEqual(res.value, { name: 'tom', score: 9 })
        assert.deepEqual(res.attachments, { dc: 'gz01' })
        // 泛化改形断言
        assert.equal(reqCtx.decoded[1], 'org.apache.dubbo.rpc.service.GenericService')
        assert.equal(reqCtx.decoded[3], '$invoke')
        assert.equal(reqCtx.decoded[4], 'Ljava/lang/String;[Ljava/lang/String;[Ljava/lang/Object;')
        assert.equal(reqCtx.decoded[5], 'find')
        assert.deepEqual(reqCtx.decoded[6], ['com.x.User'])
        assert.deepEqual(reqCtx.decoded[7], [{ name: 'tom', score: 9 }])
        assert.equal(reqCtx.decoded[8].generic, 'true')
        assert.equal(reqCtx.decoded[8].path, 'com.x.Api', 'attachment path 保持目标服务（服务端按 path 寻址）')
        assert.equal(reqCtx.decoded[8].method, 'find')
        // 方法回显为原始方法名（不是 $invoke）
        assert.equal(res.method, 'find')
      } finally {
        await client.closeAll()
        await mock.close()
      }
    },
  },
  {
    name: 'dubbo invoke: args 含对象/List/Map/嵌套结构（服务端解出同形 JSON）',
    fn: async () => {
      const seen = []
      const mock = makeDubboMock((ctx) => {
        seen.push(ctx.decoded.slice(5, 5 + countDescriptors(ctx.decoded[4])))
        return { body: Buffer.from([0x02]) }
      })
      const port = await mock.listen()
      const client = createDubboClient()
      try {
        const res = await client.invoke({
          address: '127.0.0.1:' + port,
          interface: 'com.x.Api', method: 'save',
          parameterTypes: ['com.x.User', 'java.util.List', 'java.util.Map', '[Ljava/lang/String;', 'long', 'java.util.Date'],
          args: [
            { name: 'tom', tags: ['a', 'b'], meta: { k: 1 } },
            [{ id: 1 }, { id: 2 }],
            { env: 'test', limit: '9007199254740993' },
            ['s1', 's2'],
            '9007199254740992',
            '2024-06-01T08:00:00.000Z',
          ],
          timeoutMs: 5000,
        })
        assert.equal(res.status, 'OK')
        assert.equal(res.value, null)
        assert.deepEqual(seen[0][0], { name: 'tom', tags: ['a', 'b'], meta: { k: 1 } })
        assert.deepEqual(seen[0][1], [{ id: 1 }, { id: 2 }])
        assert.deepEqual(seen[0][2], { env: 'test', limit: '9007199254740993' })
        assert.deepEqual(seen[0][3], ['s1', 's2'])
        assert.equal(seen[0][4], '9007199254740992')
        assert.equal(seen[0][5], '2024-06-01T08:00:00.000Z')
      } finally {
        await client.closeAll()
        await mock.close()
      }
    },
  },
  {
    name: 'dubbo invoke: 响应异常 flag=3（class-def Throwable）→ DUBBO_ERROR（类名 + message）',
    fn: async () => {
      const mock = makeDubboMock(() => ({
        body: Buffer.concat([
          Buffer.from([0x03]),
          hessianEncode({ __class: 'java.lang.RuntimeException', detailMessage: 'boom happened' }),
        ]),
      }))
      const port = await mock.listen()
      const client = createDubboClient()
      try {
        const res = await client.invoke({
          address: '127.0.0.1:' + port,
          interface: 'com.x.Api', method: 'get',
          parameterTypes: [], args: [], timeoutMs: 5000,
        })
        assert.equal(res.ok, false)
        assert.equal(res.error.code, 'DUBBO_ERROR')
        assert.match(res.error.message, /java\.lang\.RuntimeException/)
        assert.match(res.error.message, /boom happened/)
      } finally {
        await client.closeAll()
        await mock.close()
      }
    },
  },
  {
    name: 'dubbo invoke: 响应 null 值 flag=2 → value:null；未知 flag → DUBBO_ERROR',
    fn: async () => {
      const mock = makeDubboMock(() => ({ body: Buffer.from([0x02]) }))
      const port = await mock.listen()
      const client = createDubboClient()
      try {
        const res = await client.invoke({
          address: '127.0.0.1:' + port,
          interface: 'com.x.Api', method: 'del',
          parameterTypes: [], args: [], timeoutMs: 5000,
        })
        assert.equal(res.status, 'OK')
        assert.equal(res.value, null)
        // 异常 + attachments（flag=4）也归 DUBBO_ERROR
        const mock2 = makeDubboMock(() => ({
          body: Buffer.concat([
            Buffer.from([0x04]),
            hessianEncode({ __class: 'java.lang.IllegalStateException', message: 'bad state' }),
            hessianEncode({ dc: 'sh01' }),
          ]),
        }))
        const port2 = await mock2.listen()
        try {
          const res2 = await client.invoke({
            address: '127.0.0.1:' + port2,
            interface: 'com.x.Api', method: 'x',
            parameterTypes: [], args: [], timeoutMs: 5000,
          })
          assert.equal(res2.ok, false)
          assert.equal(res2.error.code, 'DUBBO_ERROR')
          assert.match(res2.error.message, /IllegalStateException/)
          // 未知 flag
          const mock3 = makeDubboMock(() => ({ body: Buffer.from([0x63]) }))
          const port3 = await mock3.listen()
          try {
            const res3 = await client.invoke({
              address: '127.0.0.1:' + port3,
              interface: 'com.x.Api', method: 'x',
              parameterTypes: [], args: [], timeoutMs: 5000,
            })
            assert.equal(res3.error.code, 'DUBBO_ERROR')
            assert.match(res3.error.message, /未知响应 flag/)
          } finally {
            await mock3.close()
          }
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
    name: 'dubbo invoke: 带 attachments 响应（flag=1）→ result.attachments；int/double/bool 返回值解析',
    fn: async () => {
      const mock = makeDubboMock((ctx) => ({
        body: Buffer.concat([
          Buffer.from([0x01]),
          hessianEncode(ctx.decoded[3] === 'count' ? 42 : 1.5),
          hessianEncode({ dc: 'gz01', dubbo: '2.5.7', relay: true }),
        ]),
      }))
      const port = await mock.listen()
      const client = createDubboClient()
      try {
        const res = await client.invoke({
          address: '127.0.0.1:' + port,
          interface: 'com.x.Api', method: 'count',
          parameterTypes: [], args: [], timeoutMs: 5000,
        })
        assert.equal(res.value, 42)
        assert.deepEqual(res.attachments, { dc: 'gz01', dubbo: '2.5.7', relay: true })
        const res2 = await client.invoke({
          address: '127.0.0.1:' + port,
          interface: 'com.x.Api', method: 'rate',
          parameterTypes: [], args: [], timeoutMs: 5000,
        })
        assert.equal(res2.value, 1.5)
      } finally {
        await client.closeAll()
        await mock.close()
      }
    },
  },
  {
    name: 'dubbo invoke: 响应 status=70 → DUBBO_ERROR SERVICE_NOT_FOUND（非 20 状态带文案）',
    fn: async () => {
      const mock = makeDubboMock(() => ({ status: 70, body: Buffer.from([0x02]) }))
      const port = await mock.listen()
      const client = createDubboClient()
      try {
        const res = await client.invoke({
          address: '127.0.0.1:' + port,
          interface: 'com.missing.Api', method: 'get',
          parameterTypes: [], args: [], timeoutMs: 5000,
        })
        assert.equal(res.ok, false)
        assert.equal(res.error.code, 'DUBBO_ERROR')
        assert.match(res.error.message, /SERVICE_NOT_FOUND\(70\)/)
      } finally {
        await client.closeAll()
        await mock.close()
      }
    },
  },
  {
    name: 'dubbo invoke: 连接拒绝（端口已关）→ UNAVAILABLE；缺参 → INVALID_ARGUMENT',
    fn: async () => {
      const client = createDubboClient()
      const dead = http.createServer()
      dead.listen(0, '127.0.0.1')
      await once(dead, 'listening')
      const deadPort = dead.address().port
      await new Promise((resolve) => dead.close(resolve))
      const res = await client.invoke({ address: '127.0.0.1:' + deadPort, interface: 'com.x.Api', method: 'get', parameterTypes: [], args: [], timeoutMs: 3000 })
      assert.equal(res.ok, false)
      assert.equal(res.error.code, 'UNAVAILABLE')
      assert.match(res.error.message, /连接失败/)
      // 参数个数不匹配
      const res2 = await client.invoke({ address: '127.0.0.1:1', interface: 'com.x.Api', method: 'get', parameterTypes: ['java.lang.String'], args: [], timeoutMs: 1000 })
      assert.equal(res2.error.code, 'INVALID_ARGUMENT')
      // 坏地址
      const res3 = await client.invoke({ address: '127.0.0.1', interface: 'com.x.Api', method: 'get' })
      assert.equal(res3.error.code, 'INVALID_ARGUMENT')
      // 缺 interface / 缺 method
      const res4 = await client.invoke({ address: '127.0.0.1:1', method: 'get' })
      assert.equal(res4.error.code, 'INVALID_ARGUMENT')
      const res5 = await client.invoke({ address: '127.0.0.1:1', interface: 'com.x.Api' })
      assert.equal(res5.error.code, 'INVALID_ARGUMENT')
      // args 校验：类型不合法 → INVALID_ARGUMENT
      const res6 = await client.invoke({ address: '127.0.0.1:1', interface: 'com.x.Api', method: 'get', parameterTypes: ['int'], args: ['abc'], timeoutMs: 1000 })
      assert.equal(res6.error.code, 'INVALID_ARGUMENT')
      await client.closeAll()
    },
  },
  {
    name: 'dubbo invoke: timeoutMs 超时 → TIMEOUT（服务端收包不回，定时器销毁 socket）',
    fn: async () => {
      const mock = makeDubboMock(() => ({ hang: true }))
      const port = await mock.listen()
      const client = createDubboClient()
      try {
        const started = Date.now()
        const res = await client.invoke({
          address: '127.0.0.1:' + port,
          interface: 'com.x.Api', method: 'get',
          parameterTypes: [], args: [], timeoutMs: 500,
        })
        const cost = Date.now() - started
        assert.equal(res.ok, false)
        assert.equal(res.error.code, 'TIMEOUT')
        assert.ok(cost < 4000, '超时应由客户端定时器触发：' + cost)
        // 默认超时（timeoutMs 缺省 10s）：用一个必拒绝端口确认错误路径不依赖超时参数
        const res2 = await client.invoke({ address: '127.0.0.1:1', interface: 'com.x.Api', method: 'get', parameterTypes: [], args: [] })
        assert.equal(res2.error.code, 'UNAVAILABLE')
      } finally {
        await client.closeAll()
        await mock.close()
      }
    },
  },
  {
    name: 'dubbo bridge: POST /dubbo/invoke 走 handlePostapiRequest 通 + 失败封套透传',
    fn: async () => {
      const mock = makeDubboMock((ctx) => ({ body: valueBody('pong:' + ctx.decoded[5]) }))
      const port = await mock.listen()
      const client = createDubboClient()
      try {
        await withBridgeServer({ dubbo: client }, async (httpBase) => {
          const res = await fetch(httpBase + '/api/dubbo/invoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address: '127.0.0.1:' + port,
              interface: 'com.x.Api', method: 'ping',
              parameterTypes: ['java.lang.String'], args: ['x'], timeoutMs: 5000,
            }),
          })
          assert.equal(res.status, 200)
          const payload = await res.json()
          assert.equal(payload.ok, true)
          assert.equal(payload.data.value, 'pong:x')
          assert.equal(payload.data.status, 'OK')
          // 失败封套：服务端异常 → data.ok:false + DUBBO_ERROR
          const mock2 = makeDubboMock(() => ({
            body: Buffer.concat([Buffer.from([0x03]), hessianEncode({ __class: 'java.lang.Exception', detailMessage: 'bridge-err' })]),
          }))
          const port2 = await mock2.listen()
          try {
            const bad = await fetch(httpBase + '/dsh-postapi/api/dubbo/invoke', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ address: '127.0.0.1:' + port2, interface: 'com.x.Api', method: 'ping', parameterTypes: [], args: [], timeoutMs: 5000 }),
            })
            assert.equal(bad.status, 200)
            const badPayload = await bad.json()
            assert.equal(badPayload.ok, true)
            assert.equal(badPayload.data.ok, false)
            assert.equal(badPayload.data.error.code, 'DUBBO_ERROR')
            assert.match(badPayload.data.error.message, /bridge-err/)
          } finally {
            await mock2.close()
          }
        })
      } finally {
        await client.closeAll()
        await mock.close()
      }
    },
  },
]

/** 桥 loopback（同 tests/host-grpc.test.js 形态）。 */
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
  console.log('\nhost-dubbo: 通过 ' + passed + '，失败 ' + failed + '，共 ' + (passed + failed))
  if (failed > 0) process.exitCode = 1
}
