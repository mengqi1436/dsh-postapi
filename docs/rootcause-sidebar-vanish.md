# 侧边栏消失根因报告（2026-11-18）

> 现象：安装本地开发版后，右侧栏 guide 里 PostAPI 入口消失，右栏只剩「插件 / 自动化任务」两个面板。
> 结论一句话：**`ctx.effect` 的 body 返回了普通对象，cordis 抛 `TypeError: Invalid effect`，整个 client apply 失败，宿主回滚本 entry 的全部注册。**

## 1. 直接证据

用 CDP 在复现环境（`--profile repro2`，只装 `@deepseek-ai/dsh-base` + `@deepseek-ai/dsh-web-app` + `dsh-postapi`）里抓 console：

```
{"type":"info","text":"[dsh-postapi] client apply 已执行 | Object"}
{"type":"warning","text":"web boot: warning: 1 entry did not activate\ndsh-postapi: failed: TypeError: Invalid effect"}
```

即：apply 进去了、也执行到第一行，但 effect 抛错导致 entry 判为 failed，宿主把该 entry 的注册整体回滚——页签类型、body 席位、title 席位、字典全没了，只剩一条 warning。

## 2. 机制（宿主源码）

`cordis` 的 `Fiber#_execute`（app.asar 内联实现）对 effect body 的返回值做严格分型：

```ts
const effect = runner.execute.call(this)
if (typeof effect === 'function') return runner.collect(effect)
else if (isNullable(effect)) { /* return */ }
else if (!isObject(effect)) throw new TypeError('Invalid effect')
else if ('then' in effect) return effect.then(safeCollect)      // Promise
else if (Symbol.iterator in effect) { /* 迭代器 */ }
else if (Symbol.asyncIterator in effect) { /* 异步迭代器 */ }
else throw new TypeError('Invalid effect')                       // ← 普通对象落到这里
```

合法返回值只有五种：函数（disposer）、null/undefined、Promise、同步迭代器、异步迭代器。**普通对象直接抛错**。

## 3. 我们的出错点

`src/client/index.js` 最后一条注册：

```js
ctx.effect(() => installApi(), 'dsh-postapi: bridge api install')
```

`installApi()` 的返回值是 `window.__postapiApi`（一个对象，含 storage/request/script/mock/schema/import/export/codegen/test/db 十个命名空间）。箭头函数隐式返回它 → effect body 返回普通对象 → `Invalid effect` → 整条 apply 回滚。

前五条 effect 返回的都是 register/inject 的 disposer 函数，本来合法；但只有这一条把整条链带崩，所以现象是「页签完全消失」而不是「少了一个功能」。

## 4. 为什么脚本层测试没抓到

`build.mjs` 的 vm smoke 用假 ctx：

```js
effect: (fn, label) => { calls.push(['effect', label]); return fn() }
```

假 ctx 不校验返回值形态，所以 `installApi()` 返回对象也照样「通过」。这是测试替身过于宽松造成的盲区。

## 5. 修复

### 5.1 业务代码（`src/client/index.js`）

新增 `safeEffect(ctx, label, body)` 包装器：body 返回值不是函数/可 then/可迭代时，记一条 `console.warn` 并归一为 `undefined`；六处注册全部改走它。这样任何单个注册点的返回值形态差异都不会再拖垮整条注册链。

同时把 installApi 那条显式写成带 disposer 的形式（卸载时清掉 `window.__postapiApi`）。

### 5.2 构建期加固（`build.mjs`）

vm smoke 的假 ctx `effect` 改为与宿主同构校验：非函数/非 null/非 thenable/非 iterable 直接 `assert` 失败，错误信息带上 effect label。同类问题下次在 `node build.mjs` 就炸，不必等真机。

## 6. 验证

复现环境（repro2，最小 profile）用 CDP 实测，修复前后对比：

| 检查 | 修复前 | 修复后 |
|---|---|---|
| console | `1 entry did not activate / Invalid effect` | 无该警告 |
| `window.__postapiPages.names()` | 12 页（模块已执行） | 12 页 |
| 展开右栏后的 guide 条目 | `[]` | `["postapi","files","terminal"]` |
| guide 文案 | 无 PostAPI | `打开 PostAPI / 接口设计、调试、Mock、测试与文档` |

另外四道验收全绿：`node build.mjs`（含新增的 effect 形态断言）、`node tests/run.js` 183/183、`node scripts/smoke-host.mjs` 27/27、`heights.test.js` PASS(28)。

## 7. 排查过程中排除的假设

| 假设 | 结论 | 依据 |
|---|---|---|
| 客户端入口 `exports["./client"]` 指向错误 | 曾是真问题，已修 | 原本指向骨架期探测桩 `probe-client.js`（只注册一个空页签），已改为 `dist/client.js` 并把探测桩归档到 `docs/probe-client.legacy.js` |
| symlink 安装（`link:`）导致内核扫描漏掉 | 否 | boot 图 `__DSH_BOOT__.entries` 里明确含 `dsh-postapi`，bundle URL 200 且 244KB |
| `dsh.client.inject` 声明了未安装的包 | 否 | inject 只有 `dsh-client-locale` 与 `dsh-client-ui-sidebar-right`，两者都在 boot 图里 |
| 产物出现裸 `React.createElement` | 曾是真问题，已修 | 已改 `jsxFactory: 'createElement'` + inject shim，构建期断言 0 处 |
| `dsh-better-sidebar` 抢占右栏 | 否 | 它只注册自己的 tab 服务；guide 里 `files`/`terminal` 是官方 tabs，postapi 与它们并列 |
| 宿主 client 模块表缺 react | 否 | `staticModules` 种子表含 `react`/`react/jsx-runtime`，且产物 18 处 `require("react")` 全部命中 |

## 8. 教训（写进开发约定）

- effect body **只能**返回 disposer 函数 / null / Promise / 迭代器；返回业务对象一律包装。
- 测试替身必须与真实宿主同构校验；宽松替身会把宿主级错误推迟到真机。
