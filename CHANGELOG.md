# 更新日志

本项目版本遵循语义化版本；发布包见 https://www.npmjs.com/package/dsh-postapi 。

## 未发布 — 核心功能对标 Apifox（WebSocket 调试 / 数据库操作 / Apifox·YApi 导入）

### 功能

- **WebSocket 调试真实现**（feature-matrix 域 3 由 P2 提升为 P1）：调试页新增 HTTP/WebSocket 协议切换；WS 模式支持连接 / 发送消息 / 增量消息日志（1s 轮询）/ 断开，握手头、`{{var}}` 变量与 bearer/basic/apikey 认证注入语义对齐 HTTP 管线，http(s) 地址自动归一 ws(s)。宿主新增 `src/host/ws-client.js`（连接注册表，消息上限 200 条）与 `/ws/open|send|messages|close` 四条桥路由。
- **数据库操作真实现**（域 9 由 P2 提升）：`src/host/db.js` 用 `node:sqlite` 内置模块实现连接测试 / 单语句执行 / 同配置连接复用（行上限 1000，bigint→字符串、BLOB→base64 归一，多语句拒绝）；调试页新增「数据库」页签（连接表单 / 测试连接 / SQL 执行 / 结果表 / 连接存项目 settings.dbConnections）。MySQL / PostgreSQL 未捆绑驱动，显式返回 `UNSUPPORTED_DRIVER`。
- **导入 Apifox JSON 与 YApi**（域 14 补齐）：`importApifox` 支持 apiCollection/items 树、OpenAPI 风格叶子（parameters/requestBody/responses）与 models/dataSchemas；`importYApi` 支持 list 数组、req_query/req_headers/req_body_* 与 res_body JSON-Schema。导入页与「新建」菜单新增两个格式入口。
- 桥路由 48 → 57 条；文档页 WebSocket 协议提示更新为「已支持真实连接」。

### 测试与文档

- 套件 16 → 18（新增 `tests/host-ws.test.js`、`tests/host-db.test.js`），用例 328 → 338；桥套件新增 WS 全链路（本地 echo 服务器）、SQLite 真实现、apifox/yapi 路由接线用例；冒烟 27 → 30 项。
- feature-matrix 域 3/9/14 与 §4 路由表更新。

## 0.0.1 — 首个 Demo 版本

**定位**：DeepSeek Harness 插件，在官方右侧栏内复刻 Apifox 的接口工作区。数据以 JSON 落盘本地，不依赖云端账号。

### 功能

- **12 个页面**：项目总览、接口文档、调试发送、Mock、数据模型、环境与变量、请求历史、自动化测试、导入导出、流程图、全局搜索、设置。
- **宿主桥 48 条路由**（`/dsh-postapi/api` prefix），含 storage 全套 CRUD、`request/send|preview`、`script/run`、`mock/start|stop|status`、`schema/validate|example`、`test/runCase|runScenario`、`import/*`、`export/*`、`codegen/run`、`storage/search|getHistory|appendHistory|clearHistory`。
- **请求管线**：`{{var}}` 与 11 个 `{{$dynamic}}` 变量替换 → 前置脚本（`node:vm` 沙箱，`pm.*` 兼容面）→ `fetch` + AbortController（默认 30s）→ 后置脚本 → 断言（status/body/header/time × 9 种 op）→ 历史落盘；响应 >2MB 截断标注。
- **存储 v2**：`index.json` + `<projectId>/project.json` + `<projectId>/history.json`；tmp+rename 原子写、写操作串行队列、损坏隔离 `.corrupt-<ts>`、删项目 `.trash` 备份；v1 数据读入自动升级。
- **Mock 服务**：`node:http` 独立端口（默认 4010），规则优先、默认响应回落。
- **代码生成**：curl / fetch / axios / python / go / java / php / csharp 共 8 种。

### 安装

```bash
dsh plugin --profile desktop add dsh-postapi@0.0.1 --registry=https://registry.npmjs.org/
```

前置：官方右栏组件 `@deepseek-ai/dsh-client-ui-sidebar-right`（0.2.2-rc.3 起）。

### 发布

- GitHub Actions 自动发布：推 tag `v*` 或 master 版本变更时构建 → 328 用例 → 27 项宿主冒烟 → 发布。
- 认证走 npm trusted publishing（OIDC / SLSA provenance），不需要长期 token；`NPM_TOKEN` 仅在仓库变量 `FORCE_TOKEN_PUBLISH=true` 时作为回退。
- workflow 使用 `actions/checkout@v5` / `actions/setup-node@v5`。

### 已知边界（Demo 范围）

- gRPC / Dubbo / Tars 只有协议字段与 UI 提示，未做真实收发。
- 数据库操作路由固定返回 `501 NOT_IMPLEMENTED`。
- 无云端账号、团队协作、在线分享；无 AI 生成用例。
- 自动化测试运行器只在宿主侧跑，未做并发与重试策略。
