# DSH 侧边栏接线实录（T2 sidebar-shell）

> 依据实物源码：npm pack 拉取的官方包原文（存 `.research/sidebar/`），非文档转述。
> 拉取时间 2026-11-18，registry https://registry.npmjs.org/。

## 0. 拉包清单

| 包 | 版本 | tarball | 解压路径（.research/sidebar/ 下） |
|---|---|---|---|
| @deepseek-ai/dsh-client-ui-sidebar-right | 0.2.2-rc.3 | deepseek-ai-dsh-client-ui-sidebar-right-0.2.2-rc.3.tgz（276.9 kB，136 files，sha256 06b8286b341f5c3a889d0001d7ef01c9723faba6） | `deepseek-ai-dsh-client-ui-sidebar-right-0.2.2-rc.3/package/`（含 src/ 原始 TS 源码） |
| @deepseek-ai/dsh-client-ui-sidebar-files | 0.2.2-rc.3 | deepseek-ai-dsh-client-ui-sidebar-files-0.2.2-rc.3.tgz（222.7 kB，95 files，sha 9ce09e8ba02ecfb643c6faafe6740c377f02df4c） | `deepseek-ai-dsh-client-ui-sidebar-files-0.2.2-rc.3/package/`（端到端样板） |
| @deepseek-ai/dsh-client-ui-sidebar | 0.0.1-rc.1 | deepseek-ai-dsh-client-ui-sidebar-0.0.1-rc.1.tgz（11.1 kB，14 files，sha c49757be1be90a3ebc92da5d38a268a61fc7e560） | `deepseek-ai-dsh-client-ui-sidebar-0.0.1-rc.1/package/`（仅 lib + 类型，无 src） |

## 1. 右栏 slots 契约（sidebar-right src/client/contract/slots.ts 实录）

declare module '@deepseek-ai/dsh-client-ui-slots' 的 SlotMap 共 6 项，插件可注册的是其中 4 个席位：

| slot 名 | kind | 用途 | 注册 key |
|---|---|---|---|
| `sidebar.right.pane.tab` | keyed | 页签 body（每个该 kind 的 tab，无论停靠/浮动都由它渲染） | **definition.id**（"a tab type registers here under its definition's id"） |
| `sidebar.right.pane.tab.title` | keyed | 页签 chip 标题（浮动面板 header 同源）；可选，缺省用 registry 打开时捕获的 title(address) | 同上，definition.id |
| `sidebar.right.tab.guide` | chain | 整体替换 guide 页内容（首个不 decline 的入选） | 顺序链 |
| `sidebar.right.tab.menu.item` | list | 页签动作菜单追加项（owner 收 { tab, dismiss }，动作必须调 dismiss） | 注册序 |

另有 `sidebar.right.tab.guide.actions`（list）与 `sidebar.right.tab.guide.entry`（keyed）为 guide 卡片扩展，本骨架未用。

**注入形态**：body 与 title 的 slot 注入 `SidebarRightTabInjected = { hooks: { tabInfo: SlotHookFactory<...> } }`，组件经 `useTabInfo()` 拿到 `SidebarRightTabInfo`（sidebar.expanded/fullscreen、panel.id/isFloating、tab: TabRecord & { visible, navigation, signal, actions, refreshShortcut }）。

## 2. register 签名实录（sidebar-right src/client/tab-registry.ts）

```ts
class SidebarRightTabRegistry {
  constructor(ctx: Context)                    // cordis Context，effect 归宿主
  register(definition: SidebarRightTabDefinition): () => void   // 幂等 disposer
  get(kind): SidebarRightTabDefinition | undefined
  candidates(address): SidebarRightTabDefinition[]
  claim(address, kind?): SidebarRightTabClaim  // contentId 即 address
  entries() / guide() / subscribe(fn)
}
```

`SidebarRightTabDefinition` 完整字段（tab-registry.ts L94-139）：

| 字段 | 类型 | 语义 |
|---|---|---|
| `id` | string | 实现身份，全局唯一（重复抛错）；**即 body/title 席位的 key** |
| `kind` | string | 类型判别符，openTab(kind) 命名它 |
| `multiple?` | boolean | true 时每次 openTab 独立内容；缺省每 pane 每 kind 一页 |
| `keepMounted?` | boolean | 访问过的 body 在隐藏/切会话/停靠变换时不卸载，缺省 false |
| `patterns?` | string[] | 资源地址 glob；缺省即 page 型（按 kind 打开） |
| `priority?` | 'extension'\|'builtin'\|'fallback' | **缺省 'extension'**（DEFAULT_BAND），最高带且可接管 builtin |
| `canOpen?` | (address)=>boolean | 同步否决器，每次路由决策都会跑 |
| `title` | (address)=>string | chip 初始文案，**thunk 每次取值即时读取**（语言切换免重注册） |
| `guide?` | SidebarRightGuideEntry[] | guide 页入口胶囊：{ id, order, title(), description?(), icon?, commandId? } |

register 行为关键点（源码注释与实现一致）：
- **caller 必须把返回的 disposer 放进自己的 ctx.effect**（"The caller holds the returned disposer inside its own ctx.effect"）；实现内层是 `this.ctx.effect(...)`，label 形如 `sidebarRight.tabs.register("<id>")`。
- id 已占用 → throw；kind 冲突规则：extension/builtin 可配对共存（extension 生效，builtin 被遮蔽，extension 注销后 builtin 复活），fallback 与任何同 kind 不共存，同 band 二次注册 → throw。
- guide entry id 在同一 definition 内重复 → throw。

## 3. 端到端样板注册序列（sidebar-files src/client/index.ts apply() 实录）

样板五步，全部 `ctx.effect(fn, 'label')` 包裹：

1. `ctx.effect(() => ctx.sidebarRightTabs.register(filesDefinition(t)), 'ui-sidebar-files: files type')` —— definition：`{ id: FILES_ID, kind: FILES_KIND, priority: 'builtin', title: () => t('type.label'), guide: [{ id: 'workspace', commandId, order: 10, title: () => t('guide.title'), description: () => t('guide.description'), icon: GuideArtworkFiles }] }`
2. `ctx.effect(() => ctx.locale.register(NS, { zh, en, ja, es, fr, de, ru, pt }), 'ui-sidebar-files: dictionaries')` —— NS = `'sidebarFiles'`，zh 是 key-set 事实来源
3. `ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({ name: 'sidebar.right.pane.tab', key: FILES_ID, locale: NS, store, inject: injectFace }, FilesBody)), ...)`
4. `ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({ name: 'sidebar.right.pane.tab.title', key: FILES_ID }, FilesTitle)), ...)`
5. 另有 registerFactory×3（tree/navigator/toggle，本骨架不需要）与 shortcuts 注册。

样板 `export const inject = ['slots', 'locale', 'sidebarRightTabs', 'sidebarRight', 'remote', 'remote.workspaceFiles']` —— client 体声明的 face 依赖数组，apply(ctx) 时 ctx 上直接可用。

**席位 key 实证**：files 的 body/title 注册 key 均为 `FILES_ID`（`'@deepseek-ai/dsh-client-ui-sidebar-files'`），即 definition.id 原样，**不拼 localeKey**。

**产物形态实证**（sidebar-files 与左栏包 lib/client.js 同构）：

```js
window.__ModuleLoader__.load({ id: "<bundle-id>", factory(require) {
  var module = { exports: {} }; var exports = module.exports;
  ... bundle（外部依赖一律 require("react")、require("react/jsx-runtime")、require("@deepseek-ai/...")）
  exports.apply = apply; exports.inject = inject;
  return module.exports;
} });
```

包级声明在 package.json `dsh.client` 段：`client.inject` 列 **npm 包名**（宿主为其提供模块解析），`platform: "web"`。

## 4. 本骨架实现（与样板逐项对应）

| 本文件 | 对应样板 | 内容 |
|---|---|---|
| `src/client/shell/definition.js` | files definition.tsx | `postapiDefinition(t)` → `{ id: 'postapi', kind: 'postapi', keepMounted: true, title: () => t('type.label'), guide: [{ id: 'postapi-entry', order: 10, title, description }] }`；icon 省略（官方 guide 自绘立方体占位，不引 primitives 包） |
| `src/client/shell/locales.js` | files locales.ts | NS=`'postapi'`；zh 键集：type.label / guide.title / guide.description / nav.* / placeholder.* ；en 键集对齐 |
| `src/client/shell/ApiTitle.js` | FilesTitle.tsx | `{ useTabInfo }` → svg 图标 + tab.title |
| `src/client/shell/Body.js` | FilesBody.tsx（简化） | hash 路由（#/overview、#/doc/:endpointId、#/debug、#/flow、#/settings）+ 导航 + 页面渲染区；页面来自注册表，缺页占位 |
| `src/client/shell/registry.js` | — | `window.__postapiPages` 注册表 + `window.__postapiApi` face 桩（face 缺席时内存 stub，契约 §2 签名逐项对齐） |
| `src/client/index.js` | files index.ts | `inject = ['slots','locale','sidebarRightTabs','postapi.storage','postapi.request']`；apply 六连：tabs.register / locale.register / pane.tab body（key=POSTAPI_ID） / pane.tab.title（key=POSTAPI_ID） / composer.dock 徽章（契约 §4 保留） / face inject 桩 |
| `build.mjs` | — | esbuild：format cjs、jsx automatic、`loader: {'.js':'jsx'}`、external `react`/`react-dom`/`react/jsx-runtime`/`@deepseek-ai/*`、banner+footer 包成 __ModuleLoader__ 形态；构建后 node:vm smoke（假 require + 假 ctx 跑 apply，断言 6 个 effect、席位 key、guide 单入口、__postapiPages/__postapiApi） |

注册形态全部照抄样板：`ctx.effect(() => ctx.slots.inject('<slot>', () => ctx.slots.register({...}, Component)), '<label>')`；tabs.register 的 disposer 直接作为 `ctx.effect` 回调返回值。

## 5. 左栏结论：@deepseek-ai/dsh-client-ui-sidebar@0.0.1-rc.1

**结论：左栏走桌面端原生，插件不注册、不自制。** 该包不提供任何插件可用的左栏扩展点。

证据（声明 + 运行时实现双确认）：

1. **类型声明**（lib/types/client/contract/slots.d.ts）：SlotMap 只有 2 个席位，且均为 `kind: 'single', scope: 'root'` ——
   - `sidebar.workspaces`：会话浏览区（header/搜索/分组列表/对话框）。注释明说 "declaring is claiming; **ui-workspace registers the browser**"。
   - `sidebar.settings`：底栏设置席。注释 "ui-settings registers its trigger row + modal panel"。
   - 没有 keyed / list / chain 类型的开放席位，没有第三方插件席，没有 registry service，没有可复用的 face。
2. **运行时实现**（lib/client.js 全文核对）：`apply(ctx)` 仅两步 —— `ctx.locale.register('sidebar', { zh, en })` 与 `ctx.slots.register('sidebar', { children: { 'sidebar.workspaces': { kind:'single', scope:'root' }, 'sidebar.settings': {...} } }, SidebarRoot)`。`inject = ['slots','layout','sessions','workspaces','locale']`。single 席位被一个注册者占用后无再注册语义。
3. **导出面**（README 与 lib/types/client/index.d.ts）："The `/client` export surface is the plugin body (apply/inject) plus the contract types only; SidebarRoot, the row components, and the tree derivation remain **package-internal** behind the slot registration." —— 除 apply/inject 与类型外无任何可编程入口。

即便强行向 `sidebar.workspaces`/`sidebar.settings` 发起 second single 注册也会与 ui-workspace/ui-settings 冲突（slot 系统的 single 语义），故契约 §4 的"无则原生"分支成立。会话输入框快捷入口按契约走 `conversation.composer.dock` 官方 slot（骨架已验证接线，已并入本骨架 apply 第 5 步）。

## 6. lead（T4）接线清单

1. `package.json` exports：`"./client": "./dist/client.js"`（构建产物已具 __ModuleLoader__ 形态，与现手写 client.js 同构；现文件可保留为回退）。
2. `package.json` `dsh.client.inject` 需增补 npm 包：`@deepseek-ai/dsh-client-ui-sidebar-right`（提供 sidebarRightTabs face 与 slots 契约）、`@deepseek-ai/dsh-client-locale`（locale face 的键集合并链）。
3. esbuild devDependency（当前装在 `.research/sidebar/node_modules`，build.mjs 的 loadEsbuild() 优先吃工作区 node_modules，回落研究区；lead 正式化后无需改 build.mjs）。
4. 构建/验证命令：`node build.mjs`（构建 + smoke 一体，BUILD_EXIT=0 即通过）。

## 7. 契约偏离点标注

- 契约 §3 原文"路由挂点组件（从 src/client/pages/ 引入五页；pages 暂缺时渲染占位）"与任务书"页面注册表模式（window.__postapiPages.register），**禁止静态 import ../pages/**"冲突；按任务书实现注册表模式（运行时自注册 + 缺页占位），本文件在此显式标注。
- 任务书字面"definition.js：sidebarRightTabs.register({...})"：register **调用**按官方样板分层放在 index.js 的 apply()（definition.js 只产出定义对象、index 负责带 ctx.effect 的注册），与样板 sidebar-files 的 definition.tsx / index.ts 分层一致，字段与任务书一致（id/kind/title/guide/keepMounted:true）。
- guide entry 的 icon 字段缺省：不为图标引入 @deepseek-ai/dsh-client-ui-primitives 依赖，官方 guide 自带占位图。

## 8. 同源 HTTP 桥（联调修订，db-tool 同款）

官方机制核实结论：宿主 face 总线只提供内置 face。官方三包的 client inject 全部为内置项实证——sidebar-files 为 slots/locale/sidebarRightTabs/sidebarRight/remote/remote.workspaceFiles，sidebar-right 亦全内置；插件不可注册 postapi.* 自定义 face。据此本骨架由 inject face 桩改为同源 HTTP 桥：

- **client 侧**（src/client/shell/registry.js）：window.__postapiApi 的每个方法经 fetch('/dsh-postapi/api/…') 同源相对路径调用宿主桥路由；响应封套 `{ ok: true, data }` | `{ ok: false, error: { message } }`，解包取 data。
- **降级语义**：任一方法 fetch 抛错 / HTTP 非 2xx / ok!==true 时，console.warn 一次（"桥不可达，降级内存桩"），该次调用回落内存桩；契约 §2 签名不变（兜底数据不落盘）。
- **index.js inject 收敛**：移除 'postapi.storage' / 'postapi.request'（宿主不认识这两个 face，注入只会得 undefined/告警），保留内置三项 slots/locale/sidebarRightTabs。

桥路由表（宿主侧由 T3/lead 在同源 /dsh-postapi/api 下托管，表内短路径均为 /dsh-postapi/api 前缀下的桥内路径）：

| client 调用 | 桥内路径 | HTTP | body |
|---|---|---|---|
| storage.listProjects() | /storage/listProjects | GET | — |
| storage.createProject(name) | /storage/createProject | POST | { name } |
| storage.renameProject(id, name) | /storage/renameProject | POST | { id, name } |
| storage.deleteProject(id) | /storage/deleteProject | POST | { id } |
| storage.getProject(id) | /storage/getProject | POST | { id } |
| storage.saveEndpoint(projectId, endpoint) | /storage/saveEndpoint | POST | { projectId, endpoint } |
| storage.deleteEndpoint(projectId, endpointId) | /storage/deleteEndpoint | POST | { projectId, endpointId } |
| storage.saveFolder(projectId, folder) | /storage/saveFolder | POST | { projectId, folder } |
| storage.deleteFolder(projectId, folderId) | /storage/deleteFolder | POST | { projectId, folderId } |
| request.send(opts) | /request/send | POST | 契约 §2 send 参数整体 |

宿主返回封套后，client 端页面仍只依赖 window.__postapiApi 契约签名，桥/桩切换对页面透明。
