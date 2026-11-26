# Apifox 功能全表 → dsh-postapi 实现矩阵（v2 基线）

> lead 产出 · 2026-11-18 · 依据：docs/apifox-research/analysis.md（REA 静态取证）+ Apifox 官方文档功能面 + 本仓库现状
> 用途：Agent Teams 并行实现的唯一需求基线。每个功能点必须能在本表找到「归属 / 优先级 / 验收」。
> 优先级：P0 = 本轮必须落地并有测试；P1 = 本轮落地（允许简化交互，但数据与桥路由必须真跑通）；P2 = 只落数据位与路由位，UI 显示「规划中」。

## 0. 结论摘要

- Apifox 是 Electron 37 + UmiJS 渲染层 + Dexie(IndexedDB) 数据层 + 云端同步的接口全生命周期平台。
- 本插件不复制其架构（IndexedDB/MessagePort/bytenode/NSIS 均无必要），只复制**功能面与数据模型**：单文件 JSON 存储 + webServer prefix 桥 + React 页面（Vercel Geist token）。
- 功能域共 18 类，下表逐项给出实现归属。P0+P1 合计 96 项；P2 只剩云端协作、AI 生成与 Tars/Socket.IO 真实收发（2026-11 更新：WebSocket 调试、数据库操作（sqlite）、Apifox/YApi 导入已从 P2 提升为 P1 落地；2026-11-26 更新：gRPC/Dubbo 真收发、mysql/postgresql 内置驱动、拖拽排序、右键菜单、项目设置全族同样提升为 P1 落地）。

## 1. 功能域矩阵

| # | 功能域 | Apifox 具体能力 | 归属 | 优先级 | 验收方式 |
|---|---|---|---|---|---|
| 1 | 项目与目录 | 项目增删改查、多级目录、拖拽排序、目录树折叠、右键菜单（新建/重命名/删除/移动） | host-data + pages-b | P0（拖拽/右键菜单 2026-11-26 补齐真实现） | storage 测试 + 页面渲染 |
| 2 | 接口设计·HTTP | method/URL/path 变量、Params/Headers/Cookies/Path 四组参数、body 六种类型 | host-data + pages-a | P0 | endpoint upsert 测试 + doc/debug 页 |
| 3 | 接口设计·其他协议 | WebSocket、Socket.IO、gRPC、GraphQL、RPC(Dubbo/Tars) 协议类型位 | host-data + pages-a | WebSocket P1 真实现（ws-client，调试页 WS 模式）；GraphQL P1（HTTP body=graphql，已实现）；gRPC/Dubbo P1 真实现（2026-11-26：grpc-client.js proto3+protobuf+HTTP/2 unary、dubbo-client.js Dubbo 协议+hessian-lite，调试页协议面板）；Socket.IO/Tars P2 只留协议位 | grpc/dubbo invoke 桥测试（mock 服务端）+ debug 页面板渲染 |
| 4 | 接口文档 | Markdown 描述、参数表、请求体表、响应示例、TOC、复制为 cURL | pages-a | P0 | doc 页渲染 + 锚点 |
| 5 | 数据模型(Schema) | JSON Schema 定义、复用引用、示例生成、校验 | host-data + pages-b | P1 | schema CRUD 测试 + 示例生成 |
| 6 | 响应管理 | 多响应（code/name/contentType/body/schema/enabled）、默认响应 | host-data + pages-a | P1 | 响应增删改测试 |
| 7 | 环境与变量 | 环境列表、环境变量、全局变量、变量优先级（局部>环境>全局）、动态变量 {{$timestamp}} 等 | host-runtime + pages-b | P0 | 变量替换单测 + env 页 |
| 8 | 认证 | none/bearer/basic/apikey/oauth2/digest 位 | host-runtime + pages-a | P1 | auth 注入测试 |
| 9 | 前置/后置操作 | JS 脚本（pm.* 兼容沙箱）、断言、变量提取、继承开关、数据库操作 | host-runtime | P0(脚本/断言/提取) P1(数据库：2026-11-26 七类型全部官方驱动——sqlite=node:sqlite、mysql=mysql2、postgresql=pg、mssql=mssql、oracle=oracledb、mongodb=mongodb(命令文档)、redis=redis(命令行)；项目级前置/后置脚本并入请求管线) | 沙箱单测 + 断言单测 + db 桥测试（官方驱动 glue + mock 服务端/注入 fake） |
| 10 | Mock | 智能 Mock、字段规则、Mock 期望、本地 Mock 服务 | host-runtime + pages-a | P1 | mock 规则测试 + mock 页 |
| 11 | 调试发送 | 发送请求、响应展示（status/耗时/大小/headers/body/预览）、取消、历史记录、保存为接口 | host-runtime + pages-a | P0 | request 测试 + debug 页 |
| 12 | 请求历史 | 按项目记录最近 N 条、可回放、可清空 | host-data + pages-b | P1 | history 测试 + history 页 |
| 13 | 自动化测试 | 测试用例、测试场景（多步骤+变量传递）、批量运行、结果报告 | host-runtime + pages-b | P1 | runCase 测试 + test 页 |
| 14 | 导入 | OpenAPI/Swagger、Postman、HAR、cURL、Apifox JSON、YApi | host-data | P1(openapi/postman/har/curl/apifox/yapi 全部真实现) | importer 单测（固定样本） |
| 15 | 导出 | OpenAPI 3、Postman、HAR、Markdown、Apifox JSON | host-data | P1 | exporter 单测（往返一致） |
| 16 | 代码生成 | cURL / fetch / axios / Python requests / Go / Java / PHP / C# 等 | host-data | P1(前 5 种) P2(其余) | codegen 快照测试 |
| 17 | 全局搜索 | 跨接口/目录/模型的关键字搜索 | host-data + pages-b | P1 | search 测试 |
| 18 | 设置与协作 | 存储路径、主题、语言、Mock 端口、代理、成员位、变更历史位 | pages-b + host-data | P0(前四项) P2(成员/历史)；项目设置全族 P1（2026-11-26：基本信息/全局参数/全局认证/项目级前后置脚本并入发送管线） | settings 页 + 项目设置页签 + request 合并测试 |

## 2. 数据模型 v2 实体全表（host-data 权威，pages 只读结构）

| 实体 | 落盘位置 | 关键字段 | 优先级 |
|---|---|---|---|
| ProjectIndex | index.json | version, projects[{id,name,updatedAt}] | P0 |
| Project | <id>/project.json | id,name,description,folders,endpoints,schemas,environments,globals,mocks,testCases,testScenarios,flow,settings | P0 |
| Folder | project.folders[] | id,name,parentId,order | P0 |
| Endpoint | project.endpoints[] | id,name,folderId,order,protocol,method,url,params,pathParams,headers,cookies,body,auth,responses,preProcessors,postProcessors,mock,description,tags,status,createdAt,updatedAt | P0 |
| Response | endpoint.responses[] | id,code,name,contentType,body,schema,headers,enabled,isDefault | P1 |
| DataSchema | project.schemas[] | id,name,folderId,jsonSchema,description,createdAt,updatedAt | P1 |
| Environment | project.environments[] | id,name,baseUrl,variables[{key,value,enabled,secret}],isDefault | P0 |
| GlobalVars | project.globals | variables[] | P0 |
| MockRule | project.mocks[] | id,endpointId,field,rule,value,enabled | P1 |
| TestCase | project.testCases[] | id,name,endpointId,assertions[],extractors[],lastResult | P1 |
| TestScenario | project.testScenarios[] | id,name,steps[{id,name,endpointId,override,extract}],lastRun | P1 |
| FlowStep | project.flow.steps[] | actor,action,target,message,note | P0 |
| RequestHistory | <id>/history.json | entries[{id,at,method,url,status,timeMs,size,request,response}] 上限 200 | P1 |

## 3. 页面路由全表（client-shell 权威）

| 路由 | 页面 | 归属 | 优先级 |
|---|---|---|---|
| #/overview | 项目总览（卡片 + 最近接口 + 快捷入口） | pages-b | P0 |
| #/doc/:endpointId | 接口文档（左树 + 正文 + TOC） | pages-a | P0 |
| #/debug | 调试发送（接口列表 + 请求编辑 + 响应面板） | pages-a | P0 |
| #/mock | Mock 规则与服务 | pages-a | P1 |
| #/schema/:schemaId? | 数据模型编辑 | pages-b | P1 |
| #/env | 环境与变量 | pages-b | P0 |
| #/history | 请求历史 | pages-b | P1 |
| #/test | 自动化测试 | pages-b | P1 |
| #/import | 导入导出 + 代码生成 | pages-b | P1 |
| #/flow | API 流程图 | pages-b | P0 |
| #/settings | 设置 | pages-b | P0 |
| #/search?q= | 全局搜索结果 | pages-b | P1 |

## 4. 桥路由全表（host 权威，client 经 /dsh-postapi/api 前缀）

响应封套统一：成功 {ok:true,data}；失败 {ok:false,error,code}。

| 方法 路径 | 作用 | 归属 | 优先级 |
|---|---|---|---|
| GET /health | 健康检查 | host-data | P0 |
| GET /storage/listProjects | 项目列表 | host-data | P0 |
| POST /storage/createProject / renameProject / deleteProject / getProject | 项目 CRUD | host-data | P0 |
| POST /storage/saveEndpoint / deleteEndpoint | 接口 CRUD | host-data | P0 |
| POST /storage/saveFolder / deleteFolder / moveNode | 目录 CRUD + 移动排序 | host-data | P0/P1 |
| POST /storage/saveSchema / deleteSchema | 数据模型 CRUD | host-data | P1 |
| POST /storage/saveEnvironment / deleteEnvironment / saveGlobals | 环境与变量 | host-data | P0 |
| POST /storage/saveProjectSettings / saveFlow | 项目设置与流程图 | host-data | P0 |
| GET /storage/getHistory, POST /storage/appendHistory / clearHistory | 请求历史 | host-data | P1 |
| GET /storage/search | 全局搜索 | host-data | P1 |
| POST /request/send | 发送请求（含变量替换、前置/后置、断言） | host-runtime | P0 |
| POST /request/preview | 只渲染变量不发送（调试预览） | host-runtime | P1 |
| POST /script/run | 独立脚本沙箱执行 | host-runtime | P0 |
| POST /mock/start / stop / status | 本地 Mock 服务 | host-runtime | P1 |
| GET /mock/serve/* | Mock 响应（由 Mock 服务内部转发） | host-runtime | P1 |
| POST /schema/example / validate | 示例生成与校验 | host-runtime | P1 |
| POST /import/openapi / postman / har / curl / apifox / yapi | 导入 | host-data | P1 |
| POST /export/openapi / postman / har / markdown | 导出 | host-data | P1 |
| POST /codegen/run | 代码生成 | host-data | P1 |
| POST /db/test / query / close | 数据库操作（sqlite/mysql/postgresql 内置驱动，db.js + db-drivers/*） | host-runtime | P1 |
| POST /grpc/invoke | gRPC unary 真调用（grpc-client.js：proto3+protobuf+HTTP/2） | host-runtime | P1 |
| POST /dubbo/invoke | Dubbo 真调用（dubbo-client.js：Dubbo 协议+hessian-lite） | host-runtime | P1 |
| POST /test/runCase / runScenario | 自动化测试执行 | host-runtime | P1 |
| POST /ws/open / send / messages / close | WebSocket 调试（ws-client.js） | host-runtime | P1 |

## 5. 实现边界（明确不做）

- 不做云端账号、团队同步、在线分享、SSO、审计日志（无服务端；settings 页保留只读占位）。
- 不做 Tars/Socket.IO 真实收发（协议字段与 UI 位保留，发送回落 HTTP 或报「协议未支持」；gRPC/Dubbo 已于 2026-11-26 落地真实现）。
- 不做 AI 生成用例（无模型接入点，留按钮位 + 明确提示）。
- 不做 bytenode/asar 级打包保护、不做 Electron 多窗口数据共享（单进程 Node 服务已足够）。

## 6. 验收门槛（lead 集成时逐条跑）

1. `node build.mjs` 通过（含 vm smoke：五页注册 + __postapiApi 形态）。
2. `node tests/run.js` 全绿（host-data / host-runtime / client 三组，用例数 ≥ 60）。
3. 真实落盘冒烟：`node scripts/smoke-host.mjs` 建项目→建目录→建接口→发请求→写历史→导出 openapi→代码生成，产物写入临时目录并断言。
4. 桌面端重启后右栏 PostAPI 页签 11 个路由可达、无控制台红错。
5. 每个 teammate 汇报必须给出「已实现功能点 → 文件 → 测试用例名」三列对应表。
