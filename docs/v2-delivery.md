# dsh-postapi v2 交付总结（Apifox 功能面复刻）

> 交付日 2026-11-18 · 主 agent（lead）汇总 5 个并行 teammate 的产出
> 需求基线：docs/feature-matrix.md · 实现契约：docs/interface-contract-v2.md · 取证依据：docs/apifox-research/analysis.md

## 1. 交付结论

Apifox 2.8.55 的 18 个功能域里，**14 个已在本插件内以真实实现落地**（数据落盘 + 桥路由 + 页面交互 + 测试），3 个按 P2 保留数据位与路由位，1 个（云端协作）明确不做（无服务端）。

四道验收全绿：

| 验收 | 命令 | 结果 |
|---|---|---|
| 构建 + 产物 vm smoke | `node build.mjs` | 通过，dist/client.js 238.9kb，12 页全部注册，产物 0 处裸 React.createElement |
| 单元/集成测试 | `node tests/run.js` | **183 通过 / 0 失败**（六套件） |
| 宿主端到端冒烟 | `node scripts/smoke-host.mjs` | **27 项通过 / 0 失败**（临时基路径 + 真实基路径 E:/User/文档/api） |
| 等高纪律静态检查 | `node src/client/pages/__tests__/heights.test.js` | **PASS (28 checks)** |

## 2. 并行分工与产出

| teammate | 任务 | 写范围 | 关键产出 |
|---|---|---|---|
| host-data | task-1 | src/host/storage.js、import-export.js、codegen.js、tests/host-data.test.js | schema v2 全实体 + 23 个 storage 方法；四类导入（OpenAPI/Swagger/Postman/HAR/cURL）、四类导出、8 语言代码生成；30 条测试 |
| host-runtime | task-2 | request.js、variables.js、script-sandbox.js、mock-server.js、test-runner.js、tests/host-runtime.test.js | 变量解析（11 动态变量）、node:vm 脚本沙箱（pm.* 兼容）、请求管线（前/后置脚本 + 9 种断言）、Mock 服务、用例/场景运行器；31 条测试 |
| pages-a | task-3 | doc.jsx、debug.jsx、mock.jsx、pages/components/** | 文档页（四组参数表 + TOC + cURL）、调试页（环境选择 + 四页签 + 响应面板）、Mock 页；4 个共用组件；16 条测试 |
| pages-b | task-4 | overview/env/schema/history/test/import/flow/settings/search 九页 + tests/pages-b.test.js | 九页全部真接 api；70 条测试 |
| bridge-wiring | task-5 | bridge.js、client/shell/registry.js、tests/bridge.test.js | 桥路由 44 条（含 400/404/501/500 四类错误码）、client 桥方法同步扩展 + 兜底桩、host/client 路由名集合比对断言；24 条测试 |
| lead | 集成 | build.mjs、index.js、src/host/index.js、src/client/index.js、pages-entry.js、shell/**、design-tokens.css、tests/run.js、scripts/**、docs/**、README | 契约 v2 与功能矩阵、host services 装配、12 页路由与字典、token 增补、JSX 工厂修复、冒烟 v2 阶段、README 重写 |

## 3. 架构落地

```
DSH 桌面端（Electron）
└─ 右栏页签 postapi（官方 sidebarRightTabs）
   └─ src/client/shell/Body.js  ← hash 路由 12 页
      └─ src/client/pages/*.jsx  ← 自注册 window.__postapiQueue
         └─ window.__postapiApi（同源桥 + 内存桩兜底）
            └─ fetch /dsh-postapi/api/*
               └─ src/host/bridge.js（44 条路由，requestRejection 栅栏）
                  ├─ storage（schema v2，单文件 JSON 原子写）
                  ├─ request（变量 → 前置脚本 → fetch → 后置脚本 → 断言）
                  ├─ variables / script-sandbox（node:vm）
                  ├─ mock-server（node:http 独立端口）
                  ├─ test-runner（runCase / runScenario）
                  └─ import-export / codegen（纯函数）
```

存储：`E:/User/文档/api/{index.json, <projectId>/project.json, <projectId>/history.json}`，tmp+rename 原子写、写串行队列、损坏隔离、`.trash` 备份、v1→v2 自动升级。

## 4. 契约偏离汇总（均由各 teammate 汇报，lead 审核接受）

| 项 | 偏离 | 理由 |
|---|---|---|
| storage.moveNode / saveResponse / deleteResponse 目标不存在 | 幂等返回而非抛错 | 桥侧通用透传路由不应因假 id 变 500 |
| storage.search 空关键字 | 返回空集（非全量） | 避免搜索页初次进入全量渲染 |
| request.send 返回体 | 新增 request/tests/variables/logs 四字段 | 契约 §4 已列，页面刚需 |
| runCase/runScenario 返回体 | 额外带 extracted / steps[].results | 测试页要展示提取值与步骤明细 |
| script-sandbox 禁 setTimeout | 抛错而非返回 undefined | 让脚本作者立刻发现，不静默失败 |
| mock-server port | 支持 0（OS 分配），默认仍 4010 | 测试与冒烟避免端口冲突 |
| request.preview 返回形状 | { url:{resolved,missing}, params, headers, body } | 契约未定义，按页面消费形态定 |
| request/send 带 projectId | 桥自动 appendHistory（失败静默） | 契约 §4「历史由 bridge 负责」 |
| schema/example|validate 无 services 时 | 内置最小实现兜底（非 501） | 页面在服务未注入时仍拿到结构一致返回 |
| 用例/场景落盘 | 复用 saveProjectSettings 写 settings.testCases/testScenarios | 契约 §3 无专用 CRUD；运行器已改为两处都读 |
| history→debug 回放 | 写 localStorage `postapi.debug.replay` | 跨页传参，debug 页消费侧待接 |

## 5. 已知降级与 P2 占位

1. **gRPC / Dubbo / Tars / Socket.IO 真实收发**：只保留 `endpoint.protocol` 字段与 UI 提示，发送回落 HTTP。
2. **数据库操作**：`/db/test|query|close` 固定返回 501 NOT_IMPLEMENTED。
3. **智能 Mock（Schema 驱动）**：只实现 5 种显式字段规则，未做 Schema 自动生成。
4. **YApi / Apifox JSON 导入导出**：未做（P2）。
5. **mock/serve/* 路由**：桥保留入口但 mock-server 未定义 serve 方法，当前 501 NOT_WIRED；Mock 命中由 mock-server 自身监听端口完成。
6. **pm.sendRequest / pm.iterationData / pm.cookies**：契约未列，未实现。
7. **vm 沙箱非硬安全边界**：已禁 require/process/fs/global 与 eval，但属「够用隔离」，注释中已标注。
8. **云端账号 / 团队协作 / 在线分享 / SSO**：无服务端，settings 页只留只读占位。

## 6. 复现步骤

```bash
cd D:/Code/DSH-Postapi
node build.mjs                                  # 构建 + 产物 smoke
node tests/run.js                               # 183 用例
node scripts/smoke-host.mjs                     # 27 项端到端冒烟
node src/client/pages/__tests__/heights.test.js # 等高纪律
```

桌面端加载（已装则重启桌面端即可）：

```powershell
& "C:\Users\Sjc\AppData\Local\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add link:D:/Code/DSH-Postapi
```

## 7. 遗留待办（下一轮建议）

1. debug 页消费 `postapi.debug.replay`，打通历史回放预填（pages-b 写入侧已就绪）。
2. mock-server 补 `serve` 方法，让 `/mock/serve/*` 桥路由可用（当前走独立端口）。
3. 智能 Mock：按 endpoint 响应 JSON Schema 自动生成示例数据。
4. 契约 §3 增补 saveTestCase / saveScenario 专用方法，替换当前 settings 落点。
5. 桌面端真机验证：重启后逐页点开 12 条路由，确认无控制台红错（本轮为脚本级验证）。
