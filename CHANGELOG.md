# 更新日志

本项目版本遵循语义化版本；发布包见 https://www.npmjs.com/package/dsh-postapi 。

## 未发布 — Apifox 全页面同构 + 模型工具

### 新增

- **模型工具 `PostAPI`**（`src/host/agent-tool.js`，经 `ctx.tools.register` 暴露）：11 个 action —— `list_projects` / `get_project` / `create_project` / `list_endpoints` / `get_endpoint` / `create_endpoint` / `update_endpoint` / `delete_endpoint` / `create_folder` / `import_openapi` / `send_request`。agent 可直接建接口落盘，返回体不含全量 endpoint body。
- **Apifox 全页面拆解规格**（`docs/apifox-research/pages-spec.md` 1456 行 + `chunks.md` 147 行）：REA 对 Apifox 2.8.55 renderer 取证，逐页给出类名嵌套、CSS 实测值、i18n 文案、数据来源与映射建议。
- **样式类 `design-tokens.css` 扩到 493 个 `.pp-*`**：骨架页签激活态/竖线、调试台 URL 胶囊行与发送组、文档编辑器外壳、测试工具条与状态胶囊、场景页签条与 CLI 块、设置菜单与列表、环境条目与色块等。
- 尺寸 token `--tabbar-lg: 48px`、`--toolbar-h: 50px`（取自 Apifox 场景页签条与报告表头实测）。

### 变更

- **总览页按 Apifox 结构重建**：统计卡（24px 大数字 + 四块统计）、模块计数条（接口/文档/模型/单接口用例/场景用例）、右栏 6 动作、三张功能卡。
- **当前项目默认空**：所有页面不再预填 `proj_demo01`，也不再自动打开列表首项；由用户在下拉里选择或点「打开」。
- 接口文档 / 调试 / Mock / 环境 / 数据模型 / 历史 / 测试 / 导入导出 / 场景编排 / 搜索 / 设置 十一页按 Apifox 真实结构重排。
- `#/debug/:endpointId` 成为参数路由（此前只能靠 localStorage 传目标）。

### 修复

- **`index.json` 的 `updatedAt` 建项后永不更新**：`listProjects()` 是项目列表唯一读源，导致侧栏时间永远是建项时间。`saveProject` 现在同步索引条目。
- **v1 索引升级写覆盖并发写（丢写）**：升级写挪进队列并重读磁盘，不再用陈旧快照回写。
- **桥的 6 条老路由缺 `projectId` 返回 500**：`renameProject` / `deleteProject` / `saveEndpoint` / `deleteEndpoint` / `saveFolder` / `deleteFolder` 改为 400 `INVALID_ARGUMENT`。
- **文档页空接口崩溃**：`ep` 为 null 时四个视图在 return 前构造 JSX 直接抛错，已加守卫。
- `heights.test.js` 8 处历史告警清零（图标/滚动条/菜单行 token 纳入白名单），150 checks 全 PASS。

### 验证

- `node tests/run.js`：348 通过 / 0 失败（基线 332，净增 16 条）
- `node tests/ui-audit.test.js`：18/18，问题合计 0 处（类名规范 493/493）
- `node src/client/pages/__tests__/heights.test.js`：PASS (150 checks)
- `node scripts/smoke-host.mjs`：27 项冒烟全过

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
