# 更新日志

本项目版本遵循语义化版本；发布包见 https://www.npmjs.com/package/dsh-postapi 。

## 0.0.2 — OIDC 自动发布

- GitHub Actions 打通：推 tag `v*` 或 master 版本变更时自动发布。
- 发布认证切换为 npm trusted publishing（OIDC），不再依赖长期 token。
- 功能与 0.0.1 一致，本版用于验证自动化发布链路。

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

### 已知边界（Demo 范围）

- gRPC / Dubbo / Tars 只有协议字段与 UI 提示，未做真实收发。
- 数据库操作路由固定返回 `501 NOT_IMPLEMENTED`。
- 无云端账号、团队协作、在线分享；无 AI 生成用例。
- 自动化测试运行器只在宿主侧跑，未做并发与重试策略。
