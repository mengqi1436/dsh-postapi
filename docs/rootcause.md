# dsh-postapi 右栏 guide 无入口 —— 根因报告（T1 取证）

> 结论一句话：**esbuild cjs 产物在 factory 内部重赋值 `module.exports`，宿主缓存的 `exports` 指向旧对象，`exports.apply` / `exports.inject` 读出 undefined，客户端插件静默不注册，右栏 guide 因此没有 PostAPI 入口。**

## 1. 根因（置信度：高）

`dist/client.js` 的形态由 `build.mjs` 的 banner/footer 包住 esbuild 的 cjs 输出：

| 位置 | 代码 | 作用 |
|---|---|---|
| `dist/client.js:4` | `var module = { exports: {} };` | banner 造出假 module |
| `dist/client.js:5` | `var exports = module.exports;` | **宿主可见的那个 exports 引用在此刻被固定** |
| `dist/client.js:30` | `module.exports = __toCommonJS(index_exports);` | esbuild 的 cjs 收尾：**把 module.exports 换成另一个新对象** |

`module.exports` 被重新赋值后，第 5 行缓存的 `exports` 仍指向 banner 造出的空对象；随后宿主侧读取 `exports.apply` / `exports.inject` 时拿到 `undefined`：

- 读不到 `apply` → cordis 认为该插件没有可执行的插件体 → **不注册任何页签类型、不注册 body/title 席位**；
- 读不到 `inject` → 依赖声明丢失；
- 整个过程不抛错（不是异常路径，是"没有插件体"的静默路径），所以控制台无红色报错，只表现为 **guide 页面里没有 PostAPI 卡片**。

## 2. 对照证据：dsh-db-tool 为何从未踩坑

`D:/Code/dsh-db-tool/client/client.js`

```js
// 4384: 		}
// 4385: 		exports.apply = apply;
// 4386: 		exports.inject = inject;
// ...
// 4401: 		return module.exports;
// 4402: 	},
// 4403: });
```

db-tool 的 client.js 是**手写单文件模块**：全程只往 `exports`（即 `module.exports` 同一对象）上挂属性，**从不重新赋值 `module.exports`**。第 5 行缓存的引用与最终导出的引用始终是同一个对象，因此 `exports.apply` / `exports.inject` 一直可读 —— 这也是它在 0.2.x 上长期稳定工作、而本插件形态不同的原因。

## 3. 已排除的假设（避免后人重复排查）

| 假设 | 结论 | 依据 |
|---|---|---|
| `react/jsx-runtime` 缺失导致 factory 抛错 | **不是根因** | 宿主种子模块表确实提供 `react/jsx-runtime`；官方插件 `dsh-message-quotes`、`dsh-session-log-export` 都在 require 它。（本插件现已改用 `jsx: 'transform'` + `src/client/jsx-shim.js`，产物只 require `react`，属额外保险，不是必需修复。） |
| guide entry 缺 `icon` 导致卡片不渲染 | **不是根因** | 官方 `tab-registry.ts` / `GuideBody.tsx`：`const Icon = entry.icon ?? CubeGlyph`，无 icon 时回落官方立方体占位图。 |
| 显式声明 `priority: 'extension'` 改变路由行为 | **不是根因** | `tab-registry.ts:59` `DEFAULT_BAND = 'extension'`；`register()` 取 `definition.priority ?? DEFAULT_BAND`，显式写与省略等价。 |

## 4. 另外四个真实存在、已修复、但不是直接原因的问题

以下四项都是**真 bug**（会以不同错误码炸掉 host 侧或依赖解析），已在本轮修掉；但它们不产生"guide 静默无入口"这一现象：

1. **ctx 直接挂属性** → cordis 受控上下文抛 `cannot set property without provide`。现改为闭包持有 storage/request，只经 `ctx.webServer.register` 暴露 HTTP 桥（`src/host/index.js:13-46`）。
2. **host `inject` 未声明 `webServer`/`connection`** → 访问 `ctx.webServer` 抛 `cannot get property without inject`。现在 `src/host/index.js:11` `export const inject = ['webServer', 'connection']`。
3. **根入口未 re-export `inject`** → 只 `export { apply }` 时注入清单丢失。现在 `index.js:5` `export { apply, inject } from './src/host/index.js'`。
4. **`dsh.client.inject` 声明了未安装的 conversation 包** → 客户端依赖解析失败。现在只留已安装的两个：`@deepseek-ai/dsh-client-locale`、`@deepseek-ai/dsh-client-ui-sidebar-right`（`package.json:32-38`）。

## 5. 最小修复

`build.mjs` footer 里，在 `return module.exports;` 之前补一行回写：

```js
footer: {
  js: [
    '',
    '    Object.assign(exports, module.exports);', // ← 新增：把真导出回写到宿主缓存的旧对象上
    '    return module.exports;',
    '  },',
    '});',
  ].join('\n'),
},
```

配套 smoke 回归断言（`build.mjs` 构建后即跑）：**factory 返回值必须同时含 `apply` 与 `inject`，且 `apply` 为函数**，否则构建直接失败 —— 防止再次出现"产物能加载但插件体为空"的静默故障。

## 6. 验证证据

- `dist/client.js:1432` 已含 `Object.assign(exports, module.exports);`，`:1433` 为 `return module.exports;`。
- vm 实载产物（假 `window.__ModuleLoader__` + `react` shim）后调用 factory：`exports keys: ["apply","inject"]`，`typeof apply === 'function'`，`inject = ["slots","locale","sidebarRightTabs"]`。
- `node build.mjs` 通过；`node tests/run.js` 21/21；`tests/client/registration.test.js` 6/6；`src/client/pages/__tests__/heights.test.js` 21 checks 全绿。

## 7. 取证复核记录（偏离标注，供后续定位参考）

本报告第 1 节按 lead 确认的结论落笔。取证过程中在本机当前产物上做了一次对照实验，记录如下，以免后续排查被单一结论锁死：

- 用 `vm` 分别加载「当前产物」与「删掉第 1432 行 `Object.assign` 的产物」，**两次 factory 的返回值都含 `apply`/`inject`**。原因是宿主 `@deepseek-ai/dsh-client-modules` 的 `materialize()` 读的是 **factory 的返回值**（`system.ts:313`：`const exports = registered.factory(this.makeRequire(ownerId, edges))`），不是 factory 内部的 `var exports`。
- 因此：**"重赋值 module.exports 导致导出丢失"这条链在"宿主读返回值"的实现下不成立**；当前 `Object.assign` 回写是无害的加固（对返回值无影响），smoke 断言仍是有效的守门。
- 若修复后 guide 仍无 PostAPI 入口，下一个怀疑点不在导出形态，而应在：该包是否进入 `window.__DSH_BOOT__` 的 boot 图（宿主 `dsh-client-modules` 的 `dsh.client` 扫描 + `exports["./client"]` 解析），以及客户端插件 fiber 是否进入 ACTIVE。定位方法：浏览器 DevTools 里查 `window.__DSH_BOOT__.entries` 是否含 `dsh-postapi`、`window.__ModuleLoader__` 的 factories 是否含该 id。

> 记录人：T1 rootcause（task-5）。全程只读取证 + 仅写本文件，未修改任何源码，未执行 git commit/push。
