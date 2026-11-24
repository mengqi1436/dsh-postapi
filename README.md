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
| `#/overview` | 项目总览 | Apifox 同构：统计卡（大数字 + 四块统计）、模块计数条（接口/文档/模型/单接口用例/场景用例）、右栏 6 动作、三张功能卡（分享列表/自动导入/代码生成）、项目卡片网格、最近接口表；当前项目**默认空**由用户选择 |
| `#/doc/:endpointId` | 接口文档 | 240px 目录面板 + 新建/编辑/删除接口（两段式确认）、页签「文档/运行/用例/Mock/设置」、sticky 锚点条 + 10 分区（Path/Query/请求头/Cookies/请求体/认证/响应定义/响应示例/状态码/代码生成）、复制 cURL |
| `#/debug/:endpointId` | 调试发送 | Apifox `.main-input-bar` 结构（URL 胶囊行 + 发送按钮组）、八页签 Params/Body/Headers/Cookies/Auth/前置操作/后置操作/设置、未选接口即快捷请求、响应面板（状态/耗时/大小/Body/Headers/Cookies/实际请求/控制台）、保存响应示例 |
| `#/mock` | Mock | 本地 Mock 服务卡（端口/状态/命中地址）+ 接口 Mock 配置卡（启用/延迟/规则表六列：启用·字段·类型·规则·示例值·操作） |
| `#/schema` | 数据模型 | 左「目录 → 模型」两级树、右基本信息 + 树模式/源码模式、校验、生成示例、保存/删除 |
| `#/env` | 环境与变量 | 左环境列表（+ 新建）+ 右页签「环境变量/全局变量/优先级」、变量表（变量名·值·密钥·启用·类型·操作）、Base URL、前置 URL |
| `#/history` | 请求历史 | 时间/方法/URL/状态/耗时/大小/操作、方法筛选、详情面板（request/response）、回填调试页、清空（两段式确认） |
| `#/test` | 自动化测试 | 左「单接口用例 / 自动化场景」双组树、右用例编辑（基本信息/前置步骤/断言表/提取变量/运行）、场景步骤编排带方法徽标 |
| `#/import` | 导入导出 | 导入 OpenAPI / Postman / HAR / cURL（文本框 + 文件选择 + 解析预览卡 + 保存到项目）、导出 OpenAPI / Postman / HAR / Markdown、代码生成 8 语言 |
| `#/flow` | 场景编排 | 左步骤列表（序号/起止方/消息/动作）+ 右时序画布（双向选中联动）+ 属性面板；>9 步给拆分提示 |
| `#/search` | 全局搜索 | 四组结果（接口/模型/目录/环境）、分组折叠与命中计数、命中片段高亮 |
| `#/settings` | 设置 | 四组卡：基础信息、请求设置（超时/代理/历史条数）、Mock 设置（端口 + 地址）、数据目录（只读） |

## 架构

- **侧边栏**：全部使用 DSH 官方组件 —— 右栏 `@deepseek-ai/dsh-client-ui-sidebar-right`（`sidebarRightTabs` 两段式注册，`keepMounted` + guide 单入口）；左栏走桌面端原生（官方 sidebar 包 SlotMap 无插件可用席位，不自制侧边栏）；会话输入框 `conversation.composer.dock` 徽章保留。
- **client ↔ host 通信**：DSH 官方 webServer prefix 桥 —— host 挂 `/dsh-postapi/api`（handler 首行 `connection.requestRejection` 鉴权栅栏，401/403 兜底写 JSON），client 同源 `fetch`；桥不可达时 client 自动降级内存桩（签名不变，页面不白屏）。
- **路由**：48 条唯一路由（`GET|POST /<domain>/<method>`），覆盖 storage CRUD、`request/send|preview`、`script/run`、`mock/start|stop|status`、`schema/validate|example`、`test/runCase|runScenario`、`import/*`、`export/*`、`codegen/run`、`storage/search|getHistory|appendHistory|clearHistory`。`/db/query|test|close` 三条固定返回 `501 NOT_IMPLEMENTED`（P2 占位）。
- **存储 v2**：`index.json`（`version`）+ `<projectId>/project.json`（folders/endpoints/schemas/environments/globals/mocks/testCases/testScenarios/flow/settings）+ `<projectId>/history.json`；tmp+rename 原子写、写操作串行队列、损坏隔离 `.corrupt-<ts>`、删项目 `.trash` 备份；v1 数据读入自动升级 v2。
- **请求管线**：`{{var}}` 与 11 个 `{{$dynamic}}`（`$timestamp`/`$isoTimestamp`/`$randomInt`/`$randomString`/`$uuid`/`$randomEmail`/`$randomPhone`/`$randomBoolean`/`$randomFloat`/`$datetime`/`$date`），优先级 局部 > 环境 > 全局 → 前置脚本（`node:vm` 沙箱，`pm.*` 兼容面）→ `fetch` + AbortController（默认 30s）→ 后置脚本 → 断言（status/body/header/time × 9 种 op：`eq`/`neq`/`gt`/`lt`/`contains`/`notContains`/`exists`/`notExists`/`regex`）→ 历史落盘；响应 >2MB 截断标注。
- **Mock 服务**：`node:http` 独立端口（默认 4010），两种命中路径，规则优先、默认响应回落。
- **测试运行器**：`runCase` / `runScenario`，场景步骤间用 extractor 提取的变量传递。
- **模型工具（`PostAPI`）**：host 经 `ctx.tools.register` 暴露 11 个 action，agent 可直接建项目/建接口/改接口/导入 OpenAPI/发请求，不必手工点页面 —— `list_projects`、`get_project`、`create_project`、`list_endpoints`、`get_endpoint`、`create_endpoint`、`update_endpoint`、`delete_endpoint`、`create_folder`、`import_openapi`、`send_request`。返回体刻意不含全量 endpoint body（`get_project` 只给计数与接口概要），避免撑爆模型上下文；`ctx.tools` 缺失时静默跳过，不影响右侧栏。

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
tests/                       17 套件 348 用例（node 直跑，无测试框架依赖）
scripts/smoke-host.mjs       宿主端到端冒烟 27 项
docs/                        契约、视觉规格、功能矩阵、排查报告
```

## 构建与验证

```bash
npm install          # 只装 esbuild（唯一的 devDependency）
npm run build        # esbuild 打包 src/client → dist/client.js，附 vm smoke
npm test             # 17 套件 / 348 用例
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
- `src/client/pages/__tests__/heights.test.js` 是设计纪律静态检查（150 checks，当前全 PASS），未纳入 `npm test`。
- Apifox 深色主题未逐页比对，目前只有浅色字面量取自实测。
- agent 的 `send_request` 不写请求历史（写历史在 bridge 的 `/request/send` 路由里）。

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
- [Apifox 全页面拆解规格](docs/apifox-research/pages-spec.md)：12 条路由 + 骨架的类名嵌套、CSS 实测值、i18n 文案、数据来源与映射建议（REA 取证）
- [Apifox chunk 映射](docs/apifox-research/chunks.md)：38 个工作台 chunk + 121 项名→id 反查 + 复现命令
- [总览页重建记录](docs/apifox-research/overview-rebuild.md)：解包链、REA 证据与类名映射范式
- [侧边栏消失根因](docs/rootcause-sidebar-vanish.md)：`ctx.effect` 返回值形态的一次真实事故复盘

## 许可

[Apache-2.0](./LICENSE) © 2026 mengqi1436
