# 全功能复测对比 + 压力测试 + 异变测试 报告

> 产出：full-parity-retest 工单 · 2026-11-26 · 基线 91dd648（0.1.0 发布版）
> 三条命令全部可复跑：`npm run retest` / `npm run stress` / `npm run mutation`
> 结论：**18 个功能域 + 桥契约共 90 项端到端断言全部通过；压力测试 16/16 通过；发现并修复 4 个真实缺陷、1 个契约偏差；异变分数见 §3。**

## 0. 修复清单（复测发现 → 修复）

| # | 缺陷 | 位置 | 修复 | 证据 |
|---|---|---|---|---|
| 1 | **Mock 页配置的接口级规则不生效**：mock 页把规则写进 `endpoint.mock.rules`，服务端只读项目级 `project.mocks`，UI 配的规则全部被忽略 | `src/host/mock-server.js` buildBody | 规则双来源合并（项目级 + 接口级，`endpoint.mock.enabled=false` 时接口级规则跳过） | retest 域 10 两条 + host-runtime 新增 2 用例 |
| 2 | **前置脚本设置变量不参与请求替换**：变量解析先于前置脚本执行，`pm.variables.set` 后 `{{var}}` 不生效（Apifox/Postman 语义是先跑脚本再定稿请求） | `src/host/request.js` send | 前置脚本成功后按脚本变量（local 最高优先级）补解析 URL/params/headers/body | retest 域 9 + request 新增用例 |
| 3 | **坏 JSON body 返回 500**：契约 §5 规定参数错误是 400 INVALID_ARGUMENT，实际返回 500 INTERNAL | `src/host/bridge.js` readBody | 非法 JSON / 非 JSON 对象 / 超 2MB 统一转 badRequest(400) | retest 域 19 + bridge 用例按契约更新 |
| 4 | **历史追加热路径性能**：`appendHistory` 走 `loadProjectForWrite`（全量 normalize），5000 接口项目实测 ~130ms/次，而每次发送请求桥层都会追加历史 | `src/host/storage.js` | limit 轻量读取 + 进程内缓存（saveProjectSettings/deleteProject 失效） | 压测 S4：160645ms → 1923ms（**83×**） |
| 5 | **Mock 服务雷群效应**：每个 mock 请求都全量 normalize 项目，5000 接口 ~220ms/次；TTL 过期瞬间 500 并发各自加载 | `src/host/mock-server.js` | 300ms TTL 项目缓存 + single-flight 合并并发加载 | 压测 S6：114650ms → 6493ms（**17.7×**） |

## 1. 全功能复测对比（`npm run retest`）

对照 `docs/feature-matrix.md` 的 18 个功能域 + 桥契约，在真实服务上端到端断言
（临时落盘目录 + 本地 HTTP/WS 目标服务，非 mock 断言），**90/90 通过**：

| 功能域 | 检查数 | 结果 | 要点证据 |
|---|---|---|---|
| 1 项目与目录 | 6 | PASS | 建/改名/两级目录/moveNode(parentId+order)/删除（列表+落盘+.trash） |
| 2 接口设计·HTTP | 4 | PASS | 全字段往返、body 六类型位、ENDPOINT_DEFAULTS、删除幂等；method 落盘原样、发送侧归一大写 |
| 3 接口设计·其他协议 | 4 | PASS | 4 协议位存储；WebSocket 真调试（http→ws 归一/echo/close）；GraphQL 经 HTTP body 真发送；gRPC/Socket.IO 占位回落 HTTP（§5 边界） |
| 4 接口文档 | 3 | PASS | Markdown 描述往返；复制为 cURL（codegen）；schema/example 嵌套生成 |
| 5 数据模型 | 3 | PASS | schema CRUD；validate 必填/类型/通过三态 |
| 6 响应管理 | 3 | PASS | 首响应自动 isDefault；多响应默认不漂移；删除 |
| 7 环境与变量 | 6 | PASS | env/baseUrl、globals、优先级 local>env>global、11 个动态变量、explain 缺失报告、删除 |
| 8 认证 | 4 | PASS | bearer/basic/apikey(header+query) 真注入；oauth2/digest 占位无注入（UI 标注规划中） |
| 9 前置/后置 + 数据库 | 8 | PASS | 前置变量进 URL（修复#2 后）、后置提取、断言两态、沙箱 pm.test、死循环 timeoutMs 中止（602ms）、sqlite 建表/插入/查询、多语句拒绝、UNSUPPORTED_DRIVER |
| 10 Mock | 6 | PASS | 启停、路径命中、接口级 increment/regex 规则（修复#1 后）、disabled 规则忽略、404 两处 |
| 11 调试发送 | 8 | PASS | params 拼 query、POST json、500 呈现、network 错误、timeout 中止（503ms）、20MB 截断、302 跟随、取消覆盖下载阶段 |
| 12 请求历史 | 3 | PASS | 自动追加、historyLimit 裁剪保留最新、清空 |
| 13 自动化测试 | 5 | PASS | runCase（settings + 顶层两落点）、断言失败可见、runScenario 多步骤变量传递、未知 id 报错 |
| 14 导入 | 7 | PASS | OpenAPI/Postman/HAR/cURL/Apifox/YApi 全部真解析 + importBundle 落盘 |
| 15 导出 | 4 | PASS | OpenAPI（往返一致）/Postman/HAR/Markdown |
| 16 代码生成 | 3 | PASS | 8 语言（curl/fetch/axios/python/go/java/php/csharp）逐个产出含 URL；未知语言报错 |
| 17 全局搜索 | 3 | PASS | e/s/f 三类命中、大小写不敏感、空关键字空集、未知项目报错 |
| 18 设置与协作 | 3 | PASS | theme/language/mockPort/historyLimit 读写回；无云端字段（§5 边界）；flow 落盘 |
| 19 桥契约 | 7 | PASS | 封套 {ok,data}/{ok,error,code}、404 NOT_FOUND、501 NOT_WIRED、400 INVALID_ARGUMENT（修复#3）、401 栅栏、preview 双通道 |

与 Apifox 的对齐说明（feature-matrix §5 边界维持不变）：云端协作/AI 生成/gRPC·Dubbo·Tars·Socket.IO 真实收发仍是占位位（UI 标注「规划中」），本次复测确认占位语义可预期（不崩溃、回落明确）。

## 2. 压力测试（`npm run stress`）

阈值型压测（超预算即 FAIL），5000 接口量级项目，16/16 通过：

| 项 | 量级 | 实测 | 判定 |
|---|---|---|---|
| S1 importOpenApi | 5000 接口 + 20 分组 | 177ms | PASS |
| S1 importBundle 落盘 | 5000 接口落盘 | 338ms | PASS |
| S2 全局搜索 | 5000 接口 × 10 次 | 1443ms | PASS |
| S3 exportOpenApi / HAR / Markdown | 5000 接口 | 199 / 9 / 35ms | PASS |
| S4 历史上限裁剪 | append × 1200（留 200） | **160645ms → 1326ms**（修复#4） | PASS |
| S5 100 并发写 | 串行队列全量重写 | 23.6s（单文件 JSON 架构固有成本，~240ms/次，预算 90s） | PASS |
| S6 Mock 并发 | 500 并发请求 | **114650ms → 6493ms**（修复#5） | PASS |
| S7 大响应截断 | 20MB 响应 | 362ms，截断保留 200KB、bodySize 全量 | PASS |
| S8 WS 消息洪泛 | 600 连发 | 1029ms，日志截断保留最新（MAX 200） | PASS |
| S9 变量替换 | 2 万变量 + 1MB 模板 | 129ms | PASS |
| S10 深嵌套 Schema | 1000 层嵌套 | 0ms，深度有界截断（12），无栈溢出 | PASS |
| S11 SQLite 批量 | 1 万行插入/查询 | 33ms，rows 截断 1000 + truncated + rowCount=10000 | PASS |
| S12 代码生成 | 500 接口 × 8 语言 | 42ms | PASS |
| S13 脚本沙箱并发 | 50 并发前后置脚本 | 422ms，变量按并发隔离 | PASS |

已知容量边界（非缺陷，记录）：S5 并发写与单接口写都是 O(项目大小) 全量重写，这是 feature-matrix §0「单文件 JSON 存储」的设计决策；千级接口以下无感，万级接口项目建议拆分项目。

## 3. 异变测试（`npm run mutation`）

- 对 `src/host/*` 全部 11 个核心文件 + jsx-shim 做等价变异：`===↔!==`、`&&↔||`、`<→<=`、`>→>=`、数字 n→n+1、`true↔false`；
- 扫描器跳过字符串/模板/注释/正则（模板串 `${}` 花括号栈配平）；
- 每个变异体在独立仓库副本跑全套测试，失败=KILLED（套件抓住），通过=SURVIVED（漏网）。

**2026-11-26 实测（330 变异体，逐文件均匀取样 ≤30）：**

```
==== 变异分数（按文件） ====
  100%  src/host/bridge.js          killed=30 survived=0
  100%  src/host/storage.js         killed=30 survived=0
  100%  src/host/request.js         killed=30 survived=0
  100%  src/host/mock-server.js     killed=30 survived=0
  100%  src/host/test-runner.js     killed=30 survived=0
  100%  src/host/ws-client.js       killed=30 survived=0
  100%  src/host/db.js              killed=30 survived=0
  100%  src/host/script-sandbox.js  killed=30 survived=0
  100%  src/host/variables.js       killed=30 survived=0
  100%  src/host/import-export.js   killed=30 survived=0
  100%  src/host/codegen.js         killed=30 survived=0

总分：100%（killed=330 survived=0 applyFail=0）
```

**总分 100%，零幸存变异体**：11 个核心文件的每一处被变异的比较/逻辑/常量都至少被一个现有用例抓住。门槛 60%，远超达标。复跑 `npm run mutation` 在 2 核环境约需 1 小时（330 变异 × 全套测试，2 并发）；`--dry` 只统计候选不执行（全量候选约 1600，均匀取样控制在 330）。

## 4. 复跑方式

```bash
node build.mjs          # 构建 dist
node tests/run.js       # 单元/组件套件（342 用例）
node scripts/smoke-host.mjs  # 真实落盘冒烟（30 项）
npm run retest          # 本报告 §1：90 项端到端断言
npm run stress          # 本报告 §2：16 项阈值压测
npm run mutation        # 本报告 §3：异变测试（2 核约 1 小时；--dry 只统计候选）
```
