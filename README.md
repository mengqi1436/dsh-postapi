# dsh-postapi

DeepSeek Harness 插件：官方右侧栏内复刻 Apifox 全功能面的接口管理工具。接口数据以 JSON 落盘于本地「文档/api」目录（默认 E:/User/文档/api，host 构造参数可覆盖）。

## 功能面（12 页 / 18 功能域）

官方右侧栏页签（id=postapi）内含十二个页面（Vercel Geist 设计语言、文档密度对齐 PostHog/Mintlify）：

| 路由 | 页面 | 覆盖能力 |
|---|---|---|
| `#/overview` | 项目总览 | 项目卡片网格、新建/重命名/删除（两段式确认）、最近接口表、快捷入口 |
| `#/doc/:endpointId` | 接口文档 | 左树（目录折叠 + 未归类分组）、Markdown 描述、Path/Query/Headers/Cookies 四组参数表、请求体、认证、多响应页签、右 TOC、复制为 cURL |
| `#/debug` | 调试发送 | 接口列表、环境选择与 baseUrl 拼接、`{{var}}` 引用标注与未定义提示、Params/Headers/Body/Auth 四页签、发送/取消、响应面板（状态胶囊/耗时/大小/响应头/原文↔美化/断言结果/脚本日志/截断标记）、保存为接口 |
| `#/mock` | Mock | 字段规则表（fixed/regex/increment/random/template）、延迟与启用、本地 Mock 服务启停、命中地址 |
| `#/schema` | 数据模型 | JSON Schema 列表与编辑、校验（api.schema.validate，缺失本地降级）、生成示例 |
| `#/env` | 环境与变量 | 环境增删改、baseUrl、变量表（key/value/enabled/secret）、全局变量、变量优先级说明 |
| `#/history` | 请求历史 | 时间/方法/URL/状态/耗时/大小、详情、回放到调试页、清空（两段式确认） |
| `#/test` | 自动化测试 | 用例（断言 + 提取器）、场景（多步骤 + 变量传递）、运行与结果明细 |
| `#/import` | 导入导出 | 导入 OpenAPI/Postman/HAR/cURL、导出 OpenAPI/Postman/HAR/Markdown、代码生成 8 语言 |
| `#/flow` | 流程图 | sequence 渲染 + SVG 导出 + 步骤编排落盘（saveFlow） |
| `#/search` | 全局搜索 | 跨接口/模型/目录关键字搜索与分组跳转 |
| `#/settings` | 设置 | 存储路径（只读展示 host 注入值）、主题、语言、Mock 端口、代理、超时、历史条数 |

未纳入本轮（P2 占位）：gRPC/Dubbo/Tars 真实收发（只保留协议字段与 UI 提示）、数据库操作（桥路由固定 501）、云端账号/团队协作/在线分享、AI 生成用例。

## 架构

- **侧边栏**：全部使用 DSH 官方组件——右栏 `@deepseek-ai/dsh-client-ui-sidebar-right`（sidebarRightTabs 两段式注册）；左栏走桌面端原生（官方 sidebar 包 SlotMap 无插件可用席位，"declaring is claiming"，不自制侧边栏）；会话输入框 `conversation.composer.dock` 徽章保留。
- **client↔host 通信**：DSH 官方 webServer prefix 桥（db-tool 同款）——host 挂 `/dsh-postapi/api`（handler 首行 `requestRejection` 鉴权栅栏），client 同源 fetch；桥未就绪时 client 自动降级内存桩（签名不变）。
- **存储**：`index.json`（version 2）+ `<projectId>/project.json`（folders/endpoints/schemas/environments/globals/mocks/testCases/testScenarios/flow/settings）+ `<projectId>/history.json`；tmp+rename 原子写、写操作串行队列、损坏隔离 `.corrupt-<ts>`、删项目 `.trash` 备份；v1 数据读入自动升级 v2。
- **请求管线**：变量替换（`{{var}}` 与 11 个 `{{$dynamic}}`，优先级 局部>环境>全局）→ 前置脚本（node:vm 沙箱，pm.* 兼容面）→ Node fetch + AbortController（30s 默认）→ 后置脚本 → 断言（status/body/header/time × 9 种 op）→ 历史落盘；响应 >2MB 截断标注。
- **Mock 服务**：node:http 独立端口（默认 4010），两种命中路径，规则优先、默认响应回落。
- **测试运行器**：runCase / runScenario，场景步骤间用 extractor 提取的变量传递。

## 目录结构

- `index.js`：host 入口（re-export `src/host/index.js`）
- `src/host/`：storage（schema v2 + 23 方法）/ request（变量+脚本+断言）/ variables / script-sandbox / mock-server / test-runner / import-export / codegen / bridge（webServer prefix 桥，44 条路由）
- `src/client/shell/`：官方侧边栏接线（definition / Body 路由 / registry 桥 api + 桩 / locales / ApiTitle）
- `src/client/pages/`：十二页 + components（ParamTable/JsonEditor/StatusPill/EmptyState）+ sequence + design-tokens.css（Vercel Geist token 全表，尺寸统一 token）
- `tests/`：storage / request / bridge / host-data / host-runtime / pages-b 六套件 + `run.js`（node 直跑，无需测试框架）
- `scripts/smoke-host.mjs`：宿主端到端冒烟（27 项，含 v2 全链路）
- `docs/feature-matrix.md`：Apifox 功能全表 → 本插件实现矩阵（18 功能域 / 优先级 / 验收）
- `docs/interface-contract-v2.md`：v2 契约（schema / host face / 桥路由 / 页面约定 / 测试要求 / 写范围）
- `docs/apifox-research/analysis.md`：REA 版 Apifox 2.8.55 静态分析报告

## 本地安装（Windows 桌面端）

前置（官方右栏页签组件）：

```powershell
& "C:\Users\Sjc\AppData\Local\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add @deepseek-ai/dsh-client-ui-sidebar-right@0.2.2-rc.3 --registry=https://registry.npmjs.org/
```

插件（本地链接，改动重启桌面端生效）：

```powershell
& "C:\Users\Sjc\AppData\Local\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add link:D:/Code/DSH-Postapi
```

装完核查 desktop profile 的 `dsh.profile.bundles` 同时含 `@deepseek-ai/dsh-client-ui-sidebar-right` 与 `dsh-postapi`（add 偶发只写 dependencies 不写 bundles，缺则手工补）。

## 构建与测试

```
node build.mjs                    # esbuild 打包 src/client → dist/client.js，附 vm smoke
node tests/run.js                 # 六套件全绿（113 用例，本地 echo，无外网依赖）
node scripts/smoke-host.mjs       # 宿主端到端冒烟 27 项（临时基路径 + 真实基路径）
node src/client/pages/__tests__/heights.test.js   # 等高纪律静态检查 28 项
```

## 开发约定

- client 经 `window.__postapiApi`（同源桥 + stub 兜底）取数，页面自注册 `window.__postapiQueue`（ensureGlobals 统一重放，模块求值顺序无关）
- 尺寸一律引用 `design-tokens.css` 的 token（--ctl-h/--row-h/--pill-h），禁止控件各自撑高（heights.test 固化）
- JSX 一律编译为 `createElement`（build.mjs 显式 jsxFactory + inject jsx-shim）；产物出现裸 `React.createElement` 即构建失败（宿主无 React 全局）
- 契约偏离必须标注进 `docs/interface-contract-v2.md` 或对应 docs
