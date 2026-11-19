# dsh-postapi

DeepSeek Harness 插件：在官方右侧栏内提供一套 Apifox 风格的接口工作区 —— 接口文档、调试发送、Mock、数据模型、环境变量、请求历史、自动化测试、导入导出、流程图、全局搜索，共 12 个页面。数据以 JSON 落盘本地，不需要云端账号。

[![npm](https://img.shields.io/npm/v/dsh-postapi.svg)](https://www.npmjs.com/package/dsh-postapi)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)

当前版本 **0.0.1（Demo）**：功能面已完整可跑，边界见文末「已知边界」。发布由 GitHub Actions 经 npm trusted publishing（OIDC）自动完成。

![PostAPI 预览](docs/preview.svg)

## 安装

DSH 桌面端（Electron）管理 profile，插件必须装进 profile 由宿主加载：

```bash
# 1) 官方右侧栏页签组件（0.2.2-rc.3 起提供 sidebarRightTabs）
dsh plugin --profile desktop add @deepseek-ai/dsh-client-ui-sidebar-right@0.2.2-rc.3 --registry=https://registry.npmjs.org/

# 2) 本插件
dsh plugin --profile desktop add dsh-postapi@0.0.1 --registry=https://registry.npmjs.org/
```

`dsh` 是桌面端自带的 CLI，Windows 路径：

```powershell
& "C:\Users\<你>\AppData\Local\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" `
  plugin --profile desktop add dsh-postapi@0.0.1 --registry=https://registry.npmjs.org/
```

装完重启桌面端，右侧栏空态会出现「打开 PostAPI」入口。

### 装完核查

profile 的 `package.json` 里 `dsh.profile.bundles` 必须同时含：

```json
"dsh.profile.bundles": [
  "@deepseek-ai/dsh-client-ui-sidebar-right",
  "dsh-postapi"
]
```

`dsh plugin add` 偶发只写 `dependencies` 不写 `bundles`（后者缺失=不加载），缺则手工补进 `package.json` 再重启。

## 功能面（12 页）

| 路由 | 页面 | 能力 |
|---|---|---|
| `#/overview` | 项目总览 | 项目卡片网格、新建/重命名/删除（两段式确认）、最近接口表、快捷入口 |
| `#/doc/:endpointId` | 接口文档 | 左树（目录折叠 + 未归类分组）、Markdown 描述、Path/Query/Headers/Cookies 四组参数表、请求体、认证、多响应页签、右侧 TOC、复制为 cURL |
| `#/debug` | 调试发送 | 接口列表、环境选择与 baseUrl 拼接、`{{var}}` 引用标注与未定义提示、Params/Headers/Body/Auth 四页签（Body 七类型）、发送/取消、响应面板（状态胶囊/耗时/大小/响应头/原文↔美化/断言结果/脚本日志/截断标记）、保存为接口 |
| `#/mock` | Mock | 字段规则表（fixed/regex/increment/random/template）、延迟与启用、本地 Mock 服务启停、命中地址 |
| `#/schema` | 数据模型 | JSON Schema 列表与编辑、校验、生成示例 |
| `#/env` | 环境与变量 | 环境增删改、baseUrl、变量表（key/value/enabled/secret）、全局变量、变量优先级说明 |
| `#/history` | 请求历史 | 时间/方法/URL/状态/耗时/大小、详情、回放到调试页、清空（两段式确认） |
| `#/test` | 自动化测试 | 用例（断言 + 提取器）、场景（多步骤 + 变量传递）、运行与结果明细 |
| `#/import` | 导入导出 | 导入 OpenAPI / Postman / HAR / cURL；导出 OpenAPI / Postman / HAR / Markdown；代码生成 8 语言 |
| `#/flow` | 流程图 | sequence 渲染 + SVG 导出 + 步骤编排落盘 |
| `#/search` | 全局搜索 | 跨接口/模型/目录关键字搜索与分组跳转 |
| `#/settings` | 设置 | 存储路径（只读展示 host 注入值）、主题、语言、Mock 端口、代理、超时、历史条数 |

## 架构

- **侧边栏**：全部使用 DSH 官方组件 —— 右栏 `@deepseek-ai/dsh-client-ui-sidebar-right`（`sidebarRightTabs` 两段式注册，`keepMounted` + guide 单入口）；左栏走桌面端原生（官方 sidebar 包 SlotMap 无插件可用席位，不自制侧边栏）；会话输入框 `conversation.composer.dock` 徽章保留。
- **client ↔ host 通信**：DSH 官方 webServer prefix 桥 —— host 挂 `/dsh-postapi/api`（handler 首行 `connection.requestRejection` 鉴权栅栏，401/403 兜底写 JSON），client 同源 `fetch`；桥不可达时 client 自动降级内存桩（签名不变，页面不白屏）。
- **路由**：48 条唯一路由（`GET|POST /<domain>/<method>`），覆盖 storage CRUD、`request/send|preview`、`script/run`、`mock/start|stop|status`、`schema/validate|example`、`test/runCase|runScenario`、`import/*`、`export/*`、`codegen/run`、`storage/search|getHistory|appendHistory|clearHistory`。`/db/query|test|close` 三条固定返回 `501 NOT_IMPLEMENTED`（P2 占位）。
- **存储 v2**：`index.json`（`version`）+ `<projectId>/project.json`（folders/endpoints/schemas/environments/globals/mocks/testCases/testScenarios/flow/settings）+ `<projectId>/history.json`；tmp+rename 原子写、写操作串行队列、损坏隔离 `.corrupt-<ts>`、删项目 `.trash` 备份；v1 数据读入自动升级 v2。
- **请求管线**：`{{var}}` 与 11 个 `{{$dynamic}}`（`$timestamp`/`$isoTimestamp`/`$randomInt`/`$randomString`/`$uuid`/`$randomEmail`/`$randomPhone`/`$randomBoolean`/`$randomFloat`/`$datetime`/`$date`），优先级 局部 > 环境 > 全局 → 前置脚本（`node:vm` 沙箱，`pm.*` 兼容面）→ `fetch` + AbortController（默认 30s）→ 后置脚本 → 断言（status/body/header/time × 9 种 op：`eq`/`neq`/`gt`/`lt`/`contains`/`notContains`/`exists`/`notExists`/`regex`）→ 历史落盘；响应 >2MB 截断标注。
- **Mock 服务**：`node:http` 独立端口（默认 4010），两种命中路径，规则优先、默认响应回落。
- **测试运行器**：`runCase` / `runScenario`，场景步骤间用 extractor 提取的变量传递。

## 数据存放位置

默认 `~/.dsh/postapi`（跨平台可移植）。可用下列任一方式覆盖：

| 方式 | 写法 |
|---|---|
| 环境变量 | `POSTAPI_DATA_DIR=D:/my-api-data` |
| 宿主 config | `config.basePath` 或 `config.storage.basePath` |

调试日志默认**不落盘**；需要时设 `POSTAPI_DEBUG_LOG=<文件路径>` 才写。

## 目录结构

```
index.js                     host 入口（re-export src/host/index.js）
cordis.patch.yml             bundle 补丁（插入 id: dsh-postapi）
src/host/                    storage / request / variables / script-sandbox /
                             mock-server / test-runner / import-export / codegen / bridge
src/client/index.js          client 入口（右侧栏接线 + 样式注入 + 桥）
src/client/shell/            definition / Body 路由 / registry 桥 api + 桩 / locales / menu
src/client/pages/            12 个页面 + components + sequence + design-tokens.css
locale/                      zh.json / en.json
dist/client.js               构建产物（esbuild 打包，随包发布）
tests/                       16 套件 328 用例（node 直跑，无测试框架依赖）
scripts/smoke-host.mjs       宿主端到端冒烟 27 项
docs/                        契约、视觉规格、功能矩阵、排查报告
```

## 构建与验证

```bash
npm install          # 只装 esbuild（唯一的 devDependency）
npm run build        # esbuild 打包 src/client → dist/client.js，附 vm smoke
npm test             # 16 套件 / 328 用例
npm run smoke        # 宿主端到端冒烟 27 项（临时基路径 + 真实基路径）
npm run verify       # 上面三步串跑
```

发布前 `prepublishOnly` 会自动跑 `build + test`，构建失败即中止发布。

## 已知边界（0.0.1 Demo）

- gRPC / Dubbo / Tars：只有协议字段与 UI 提示，未做真实收发。
- 数据库操作：`/db/query|test|close` 三条路由固定 `501 NOT_IMPLEMENTED`，UI 保留占位。
- 无云端账号、团队协作、在线分享；无 AI 生成用例。
- 自动化测试运行器在宿主侧串行执行，无并发/重试策略。
- 只支持 `platform: web`（桌面端与 web 端共用右侧栏组件）；无原生客户端实现。
- `src/client/pages/__tests__/heights.test.js` 是设计纪律静态检查，未纳入 `npm test`（有历史遗留告警）。

## 开发约定

- client 经 `window.__postapiApi`（同源桥 + stub 兜底）取数；页面自注册 `window.__postapiQueue`（`ensureGlobals` 统一重放，模块求值顺序无关）。
- 尺寸一律引用 `design-tokens.css` 的 token（`--ctl-h`/`--row-h`/`--pill-h`），禁止控件各自撑高。
- JSX 一律编译为 `createElement`（build.mjs 显式 `jsxFactory` + inject jsx-shim）；产物出现裸 `React.createElement` 即构建失败（宿主无 React 全局）。
- `ctx.effect` 的 body **只能**返回 disposer 函数 / null / Promise / 迭代器。返回业务对象会让 cordis 抛 `Invalid effect`，整个 apply 回滚、页签静默消失；统一走 `safeEffect` 包装，build.mjs 的 vm smoke 会断言该形态。
- client 产物只 `require('react')` 与宿主内置 `@deepseek-ai/*`，不引其他运行时依赖。
- 契约偏离必须标注进 `docs/interface-contract-v2.md` 或对应 docs。

## 文档

- [功能矩阵](docs/feature-matrix.md)：Apifox 功能全表 → 本插件实现矩阵
- [v2 契约](docs/interface-contract-v2.md)：schema / host face / 桥路由 / 页面约定 / 测试要求
- [Apifox 视觉规格](docs/apifox-visual-parity-spec.md)：从 Apifox 2.8.55 渲染器 CSS 实测的尺寸与色板
- [侧边栏消失根因](docs/rootcause-sidebar-vanish.md)：`ctx.effect` 返回值形态的一次真实事故复盘

## 许可

[Apache-2.0](./LICENSE) © 2026 mengqi1436
