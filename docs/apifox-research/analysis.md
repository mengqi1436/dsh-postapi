# Apifox 2.8.55 (Windows x64) 安装包静态分析报告

> 任务 task-1（T1 apifox-rea）产出 · dsh-postapi 契约 v1 §1 校正依据 · 2026-11-18
> 工具链：curl / 7-Zip 26.04（NSIS）/ @electron/asar extract / REA（analyze_javascript_application → inspect_analysis_view）+ 静态 grep 与 node 正则取证；全程未运行目标程序。

## 0. 分析元信息

| 项 | 值 |
|---|---|
| 下载直链 | https://file-assets.apifox.com/download/Apifox-windows-latest.zip（docs.apifox.com/download 页解析；GET 必须带完整浏览器头 + Referer: docs.apifox.com，否则 302 到 black-list.apifox.com 拦截页；HEAD 放行、GET 拦截） |
| zip SHA-256 | ae2a9b49ba645fd8e24d05396bfa99aa63226d95f4781fd55a682719886f515b（194,838,883 B） |
| 内含安装器 | pkg/Apifox-2.8.55.exe，194,909,008 B，构建时间 2026-11-14 21:55，SHA-256 8aeeb11d95d4ef634e9c8f9129d866b270d9d0722fd27f118a2d7f53d68c62d8 |
| 安装器格式 | NSIS-3 Unicode（7z Type=Nsis）；第二层 $PLUGINSDIR/app-64.7z 194,121,124 B |
| 解出应用 | app64/（1410 文件，857,655,623 B）；resources/app.asar 430,713,112 B，SHA-256 1d95914cf73152bac45ac264a509ad6357e06b23768285576102687769a2a368；asar 解出 app/（dist + node_modules + package.json，640 MB） |
| 本地工作区 | .research/apifox/{Apifox-windows-latest.zip, pkg/, installer/, app64/, app/, tools/} |
| 版本 | apifox 2.8.55（app/package.json）；customBuild.stable.forceAutoUpdateVersion=2.1.8，alpha=2.1.8-alpha.66 |

## 1. 架构文字图

```
Apifox-windows-latest.zip
└─ Apifox-2.8.55.exe            [NSIS-3 Unicode 安装器]
   └─ $PLUGINSDIR/app-64.7z     [纯 7z 数据层]
      └─ app64/                 [Electron 桌面应用: Electron 37.7.0 / Chromium 138.0.7204.251]
         ├─ Apifox.exe          [Electron 主二进制]
         └─ resources/
            ├─ app.asar         [应用主包]
            │  └─ dist/
            │     ├─ main/      [主进程: webpack 分包]
            │     │  ├─ main.js (35B stub) → load-jsc("main.jsc")   ← bytenode V8 字节码, 共 7 个 .jsc:
            │     │  │     main / server.local / worker.runner / WorkerThread /
            │     │  │     ExecutionProcess / ThreadGroupExecutable / agent.manager
            │     │  ├─ vendors.js(27MB) / 900.js(13MB) / 260.js / context-extend-factory.js(869KB)
            │     │  ├─ local-server-impl.js(2.5MB)     [本地服务实现]
            │     │  ├─ io-service-worker.js / worker.groupRunner.js / worker.utilityRunner.js
            │     │  ├─ preload.main-window.js / preload.tab-view.js  [渲染进程桥]
            │     │  ├─ dexie-host-preload.js (360B)    [Dexie 主机端口转发壳]
            │     │  └─ agent-debugger-preload.js / a2a-debugger-preload.js  [AI/agent 调试入口]
            │     ├─ renderer/  [渲染进程: UmiJS, 1168 个 JS, webpack 数字 chunk + 1299 条 chunk 映射]
            │     │  ├─ index.html           [zh-CN 单入口, APP_REGION=CN, AliLog 错误上报]
            │     │  ├─ fb859e9ae0dcbd.405165ba.js (20KB) [webpack runtime + chunk 映射]
            │     │  ├─ index.4fed96b5fcebc02a.js (675KB) [Umi 路由表 + 数据模型实体注册]
            │     │  ├─ <chunkId>.<hash>.async.js ×1166   [业务/组件懒加载 chunk]
            │     │  ├─ p__*.css ×26                      [页面级样式, 语义命名]
            │     │  └─ ts.<hash>.worker.js               [数据引擎 Web Worker: IndexedDB/Dexie 宿主]
            │     ├─ offline/   [离线模式资源镜像]
            │     ├─ assets/
            │     └─ node_modules/  [生产依赖: 数据库驱动全家桶]
            └─ app-update.yml   [electron-updater: generic, api.apifox.cn/api/v1/configs/client-updates/<ver>/win64/]

进程间通道（观测到的 IPC 通道族）:
  renderer --ipc--> electronAPI:attachIPC:{create,send,invoke,subscribe,unsubscribe,dispose,event}
  renderer <--MessagePort-- electronAPI:dexieHost:port   (dexie-host-preload 转发 → ts.worker IndexedDB 宿主)
  renderer <--MessagePort-- electronAPI:ioProxy:port
  云端: https://api.apifox.{cn,com} (REST /api/v1/*, 登录/同步/AI/更新)
```

存储抽象枚举（dist/renderer/index…js 模块 92462 原文）：
`((n={})[n.None=0]="None",n[n.Ipc=1]="Ipc",n[n.Local=2]="Local",n[n.File=4]="File",n[n.Local_Ipc=3]="Local_Ipc",n)`，
伴生 `{userDataPath:""}` 注入装饰器——每条数据读取通道可声明为 IPC / 本地 / 文件 / 本地+IPC 四种介质。

## 2. 技术栈 + 版本证据

| 组件 | 版本 | 证据位置 |
|---|---|---|
| Electron | 37.7.0 | Apifox.exe 二进制内嵌 UA 串 "Chrome/138.0.7204.251 Electron/37.7.0"（node Buffer 直搜） |
| Chromium | 138.0.7204.251 | 同上 |
| React | 16.13.1 与 17.0.2 混用 | renderer 各 chunk "@license React v16.13.1" / "v17.0.2" 均命中 |
| 打包器 | rspack 1.5.8 | dexie-host-preload.js 注入头 t.rv=()=>"1.5.8", t.ruid="bundler=rspack@1.5.8"；renderer webpack 数字 chunk 形态 |
| 路由框架 | UmiJS（p__ 页面约定 + 嵌套路由对象） | p__*.css 26 个语义名；REA routes 视图 mechanism=nested-route-object |
| UI 库 | antd 痕迹 26 处 + 自研 ui- token（index.html 内 --ui-border-color-base、--safe-window-control-*） | grep antd/ant-design |
| 编辑器 | Monaco/CodeMirror 族痕迹 269 处（含 .LICENSE.txt 旁证） | grep monaco/CodeMirror |
| bytenode | 1.5.7 | package.json dependencies；dist/main/*.jsc + load-jsc.js（os.arch() 自适应 arm64/x64） |
| MCP SDK | @modelcontextprotocol/sdk 1.25.1 | package.json（2.8.55 已内置 MCP 能力，配合 agent/a2a-debugger-preload） |
| 数据库驱动 | mysql2 2.3.3 / pg 8.5.1 / mssql 8.1.2 / mongoose 7.6.3 / redis 4.6.10 / clickhouse 2.6.0 / dmdb 1.0.17128 / ibm_db(@tarslib 4.0.1-1) / oracledb(@tarslib 5.1.0-3) / ssh2(@tarslib 1.16.0) / kerberos | package.json（连接数据库功能依赖面） |
| 内部包族 | @tarslib/*（base/json-bigint/json-schema-faker/mock-base/nunjucks/protobuf-parser/register-client/swagger2openapi 6.0.3-beta.12/widdershins 4.0.17） | package.json（mock/文档/OAS 转换能力） |
| 其他 | chardet 1.4 / jsonpath 1.1.1 / mongodb-query-parser 4.4.2 / node-machine-id 1.1.12 / node-schedule 2.0.0 / @napi-rs/snappy 全平台 optional / nodejieba 2.5.2 | package.json |
| 更新通道 | generic provider, https://api.apifox.cn/api/v1/configs/client-updates/2.8.55/win64/, 缓存目录 apifox-updater | app64/resources/app-update.yml 原文 |

## 3. 页面路由全表

来源 A：index.4fed96b5fcebc02a.js 正则抽取 path:"…"（完整 97 条）；来源 B：REA javascript-routes 视图去重 48 条静态候选（两者交叉验证，REA 每条含精确 source_range provenance）。

```
/user  /user/login  /user/sso-login  /user/ldap-login  /user/sso-overwrite
/user/passport/:type/login-result-success  …/login-result-failure  …/login-result-binding
/user/register  /user/password-confirm  /user/reset-password
/pdv  /pdv/license-error/:reason
/invite/:type?
/project/:id?            ← 项目工作台根
/specs
/api-manage/             ← 接口管理(树)
/api-test/  /api-test/test-case/index  /api-test/test-case/detail
/api-test/test-suite/index  /api-test/test-suite/detail
/api-test/test-report/index
/api-doc/  /api-doc/shared-doc/shared-doc-list/  /api-doc/shared-doc/
/api-doc/published-project/  …/publish-settings  …/basic-settings  …/layout-settings
/history
/project-settings/
  /project-settings/common/basic/  …/git-branch/  …/members/
  …/feature-setting/  …/api-status-setting/  …/mock/  …/advanced-setting
  …/notification/  …/targets  …/events  …/settings
  /project-settings/resource/template-parameter  …/project-branch  …/api-version
  …/common-response/  …/common-script/  …/database-connection/  …/git-connection/
  …/alibaba-cloud-config/  …/custom-function/  …/socket-input  …/socket-output  …/socket-unpack
  /project-settings/data/bind  /project-settings/data/import  /project-settings/data/export
  …/dubbo-import-config
/account/settings
/exception/403  /exception/500
/error  /error/show/:errorType
/main/:key?  /main/:key?/:id?          ← 主工作台(tab 容器)
/main/settings/organizations/:id (+ /settings /teams /plans /members /saml-groups /sso
  /enterprisePolicies /secret-scanner /audit-logs /selfHostedRunners /scripts
  /databaseConnections /externalPrograms /api-hub)
/main/teams/:id  /main/organizations/:id
/online-share  /online-share/clone  /online-share/login
/link  /link/project/:projectId  /link/landing  /link/email-preferences
/uninstall   /   (多条 "/" 嵌套入口)
```

REA 视图原文要点（evidence ev_b0ce78b5…，view=javascript-routes）：
coverage: {"status":"page","examined":48,"total":48,"next_offset":null,"exhausted":true}；
每条形如 {id:"jsr:…", path:"/account/settings", classification:"page", classification_basis:"router-configuration", mechanisms:["nested-route-object"], provenance:{source_range:{line:1,column:25657…}}}。

## 4. 组件 / 端点观测清单

### 4.1 渲染层组件面
- 页面级样式 chunk（语义命名即页面清单）：p__entry__Main、p__account__settings、p__invite、p__organization（-api-hub/-audit-logs/-coming-soon/-enterprise-policies/-members/-plans/-saml-groups/-secret-scanner/-self-hosted-runners/-settings/-sso/-teams）、p__user__login（+__components__{DocsSiteLogin,LdapLogin,LoginOrClone,SamlSsoOrgSelector}）、p__user__{password-confirm,register,reset-password,saml-sso-overwrite}、p__link__EmailPreference。
- 接口 Diff 字段比较器组件族（94743 chunk）：以 {key,title,pickedFieldNames,formatter,hideFieldNameIfSingleField,translateRelevantData} 为注册单元的声明式字段渲染/对比框架。
- 编辑器：Monaco/CodeMirror 族痕迹 269 处（JSON Schema/代码编辑）。

### 4.2 IPC face 端点（renderer↔host 契约面，观测自 index chunk 字符串常量）
```
electronAPI:attachIPC:create | send | invoke | subscribe | unsubscribe | dispose | event
electronAPI:dexieHost:port    (MessagePort 转发, dexie-host-preload.js 360B 全文实现)
electronAPI:ioProxy:port      (MessagePort)
```
attachIPC 族即 Apifox 的通用 host face：统一 create/send/invoke/subscribe/dispose 生命周期语义。

### 4.3 云端 REST 端点（静态可见样本）
```
https://api.apifox.cn/api/v1/configs/client-updates/<version>/win64/   (electron-updater)
/api/v1/ai/test-cases/test-case-types
域名面: api.apifox.cn(preconnect) / api.apifox.com / cdn.apifox.{cn,com}
埋点: AliLogTracker → cn-hangzhou.log.aliyuncs.com apifox/desktop-app-error (GET 拼参上报)
```
本地 mock 服务（local-server-impl.js, 2.5MB 明文）未观测到 .listen( 调用与端口常量——监听逻辑疑似位于 .jsc 或动态组装；标注为未观测项。

### 4.4 REA coverage / limitations 原文
第一轮（input=renderer, source=fb859 主 chunk，evidence ev_337d8dcbafc854bbb8db46be9b942ce7314ca93f99e48fba68a7f853ce44401a）：
- coverage: {"status":"complete-within-view","examined":1169,"total":1169,"next_offset":null,"exhausted":true}
- limitations 原文（全量）：
```
"Boundary extraction covers unshadowed JSON/global coercions plus parse and validation method candidates."
"Caller-selected source analysis leaves 1173 inventoried files outside analysis scope. Inventory identity covers the complete artifact; relationships through unselected sources remain unknown."
"Child-process extraction covers asynchronous node:child_process creation, literal argv/env/stdio options, exit/error listeners, and kill signals."
"CommonJS and ESM binding relationships were recovered from inert syntax and resolved only within the inventoried artifact container."
"Configuration extraction covers process.env, process.argv, node:fs reads, and direct logical defaults."
"Event extraction covers EventEmitter-style literal registrations, removals, and dispatch candidates; dynamic names remain unknown."
"Function fingerprints are static candidates; equal digests can remain ambiguous and do not prove behavioral equivalence."
"Graph coverage is incomplete; unavailable facts remain explicit and must not be read as absence."
"JavaScript and HTML were parsed as inert text; bundle bootstrap code was never executed."
"Local data flow does not claim control-flow-sensitive reaching definitions or arbitrary dynamic property resolution."
"Promise ownership covers explicit unshadowed Promise construction, static factories, aggregation, chaining, and await syntax only."
"Request extraction covers fetch, WebSocket, node:http/node:https construction, direct option fields, and exact local response consumers."
"Resource extraction covers built-in filesystem/network acquisition and exact local close/destroy/end handles."
"Static imports, entrypoints, workers, endpoints, and storage relationships do not prove runtime execution."
"Static paths and relationships may remain unresolved when expressions are dynamic or obfuscated."
"The semantic graph contains static syntax observations and conservative relationship candidates; it does not claim runtime execution."
"Timer extraction covers global or node:timers scheduling and exact local-handle cancellation."
"Webpack/Rspack factories were recovered from AST literals; REA did not invoke push handlers or bundle bootstrap code."
```
- unknowns: 1173 application graph unknowns + 16644 semantic graph unknowns（未选源与动态表达所致）。
第二轮（source=index 业务 chunk，evidence ev_b0ce78b57ba997d083ef2557fc41f047191be492c535f21c441587a89009fd67）：coverage examined 2053/2053 exhausted；routes 视图 48/48 exhausted。

### 4.5 recover_javascript_sources 未调用说明
renderer 全部为可读 minified JS（标识符压缩但结构完整，正则/AST 可稳定取证），非 wakaru 目标形态的"丢失模块名 bundle"，证据获取未受阻，故未调用；dist/main 的 7 个 .jsc 为 bytenode V8 字节码，wakaru/静态 JS 工具链不可还原（需运行时 V8 版本匹配），且本轮七项证据均取自明文层，无需打开该层。

## 5. API 数据模型字段全表 + 与契约 §1 差异表

### 5.1 数据实体（Dexie store 名注册表，index chunk 模块 406997 原文抽取）
ApiDetail、WebSocketApi、WebSocketApis、ProjectDataSource、ProjectDataSources、ProjectDataResource、ProjectDataResources、RpcMethod、RpcMethods、RpcMessage、RpcMessages、RpcModule、RpcModules、RpcService、RpcServices、HttpApiDetail、ApiDetails、ApiMock、ApiResponse、ApiSchema、ApiSchemaTreeList、CommonParameters、UserProjectState、CustomApiFields、ProjectSetting、HttpFolders、File、RequestHistory、TeamMembers、UsageHelpAssets、DataSchemaFolders、OASExportSettings、Environments、OasComponent、OasComponentFolder、OasComponentTreeList、SecurityScheme、ApiExportTempStorage。

### 5.2 ApiDetail/endpoint 字段表（94743 chunk Diff 字段注册表 + pickedFieldNames 汇总，共 52 个观测键）
```
基本: name displayName description path protocol method folderId status maintainerId responsibleId
      tags[] serverId operationId sourceUrl customApiFields customEndpointFields
参数: parameters{ query[] cookie[] header[] path } required schemeGroups
      CommonParameters(公共参数引用) itemSchema example/examples
请求体: requestBody( type 多形态[json/xml/form-data/x-www-form-urlencoded/raw/binary…]
        + jsonSchema + content + example )      [formatRequestBodyType/mapRequestBodyType 函数旁证]
认证: auth{ authType authConfigs } securityScheme oasAuthType guidanceConfigs
响应: responses[] { code contentType name jsonSchema doc defaultEnable }
      responseExamples  transformResponseContent
处理链: preProcessors inheritPreProcessors postProcessors inheritPostProcessors
其他: advancedSettings priority docId doc itemOrders ordering options
```
OpenAPI Operation 字段全集（OAS 转换层 94743 原文）：["tags","summary","description","externalDocs","operationId","parameters","requestBody","responses","callbacks","deprecated","security","servers"]；MediaType 子集 ["schema","example","examples","encoding"]；Response 子集 ["description","headers","content","links","name"]。

### 5.3 与契约 §1 schema 逐字段差异表

| 契约 §1 (dsh-postapi) | Apifox 对应 | 差异判定 |
|---|---|---|
| projects: [{id,name,updatedAt}] | project + TeamMembers 实体（IndexedDB）+ 云端同步 | 结构性差异：Apifox 项目元数据不落单文件 index.json，由 DB 表 + 云端账套承载 |
| folders: {id,name,parentId} | HttpFolders / DataSchemaFolders / OasComponentFolder 树 + endpoint.folderId 挂接 | 同构（folderId 外键一致）；Apifox 额外有 itemsOrder 排序字段，契约无 |
| endpoints.id | 实体 id（形态未在明文观测到完整生成规则） | 标注：Apifox id 规则未取证，契约 proj_/fld_/ep_+36 进制方案不受影响 |
| method 枚举 7 值 | method 字段存在；全集枚举未在明文 chunk 观测到 | 标注：无法核对全集，契约 7 值为子集假设 |
| url | path + protocol + serverId(projectSetting.servers[]) | 结构性差异：Apifox 把 host 拆到环境级 servers，endpoint 只存 path；契约 url 为完整串（简化，可保留） |
| params: [{key,value,enabled}] | parameters 按 query/cookie/header 位置分组 + required/style/explode + JSON-Schema 化 + 示例值 + CommonParameters 引用 | 结构性差异：契约是扁平 enabled 开关模型，Apifox 是 schema 化+位置分组模型；契约刻意简化成立 |
| pathParams: [] | path 内 {} 变量 + parameters.path | 等价（契约独立数组 vs Apifox 内嵌 path+参数组） |
| headers: [{key,value,enabled}] | parameters.header 子组 | 同上（扁平 vs 分组） |
| body {type: json|form|raw|none, content} | requestBody {type: json/xml/form-data/x-www-form-urlencoded/raw/binary…, jsonSchema, content, example} | 契约为 Apifox requestBody 的子集；契约 type 命名 form↔form-data 对齐建议保留契约简版 |
| auth {type: none|bearer|basic, token, username, password} | auth {authType, authConfigs[]} + securityScheme(oasAuthType) | 契约为 Apifox authType 的子集；Apifox 支持 securityScheme/OAS 认证联动，契约单对象扁平模型成立 |
| description | description | 一致 |
| createdAt/updatedAt | 未在明文观测到同名字段（疑在 .jsc/元数据层） | 标注：契约 timestamps 方案不受影响 |
| flow.steps {actor,action,target,message,note} | 无直接对应物；最近邻为 testSteps（自动化测试步骤, 含 options/performanceTestOptions） | 结构性差异：契约 flow 是 sequence 叙事模型，Apifox 对应物是测试编排而非流程图叙事；dsh-postapi flow 为差异化功能，无现成 schema 可抄 |

结论：契约 §1 是 Apifox 数据模型的刻意简化子集，无字段级冲突；差异全部为「Apifox 更复杂、契约取子集」方向，T3 按契约实现即可，§1 无需修改。备注（非契约变更）：endpoint.folderId 语义与 Apifox 一致，未来若支持排序可预留 itemsOrder 字段位。

## 6. 本地存储方式（观测结论）

1. 主存储 = IndexedDB（Dexie）：dexie 痕迹 20 处（dist 全局），renderer/ts.<hash>.worker.js 为数据引擎 Worker（indexedDB API 14 处）；数据实体（§5.1）即 Dexie store 名。SQLite 0 命中（better-sqlite3/sql.js/.sqlite 全库 grep 无结果）——纯 IndexedDB 架构。
2. 跨 context 通道 = MessagePort：dexie-host-preload.js（360B 全文）监听 IPC 通道 electronAPI:dexieHost:port，把 e.ports[0] 以 window.postMessage({__dexieHostPortChannel}, "*", [r]) 转发给页面——preload 是零逻辑薄壳，数据逻辑全部在 worker/页面侧。
3. 设置层 = localStorage：64 处调用；观测键：currentAccessToken、apiMode、Context:currentProject、命名空间模板 <store>.<key>（localStorageStore 实现 get/set/delete/bulkSet，index chunk 模块 460637）与三段式 <a>.<b>.<c>。
4. 文件介质：数据源枚举含 File/Local_Ipc（§1 架构图），userDataPath 由装饰器注入——导入/导出/离线资源走文件系统；dist/offline/ 为离线资源镜像。
5. 更新缓存：apifox-updater 目录（app-update.yml）。
6. 对契约 §1 的含义：Apifox 的 DB-in-IndexedDB + MessagePort 架构服务于多窗口/多 tab 实时共享 + 云同步场景；dsh-postapi 契约的单文件 JSON + 原子写 + 串行队列是不同问题域的正确选择（插件宿主已有 inject face 数据面），维持契约现状。

## 7. 对本插件（dsh-postapi）的借鉴点清单

1. face 生命周期命名：attachIPC:{create,send,invoke,subscribe,unsubscribe,dispose,event} 的统一生命周期动词表，可作为 postapi.storage/request face 方法命名的对齐参考（契约签名已固定，仅命名风格借鉴）。
2. 薄壳 preload + 端口转发：dexie-host-preload 360B 只转发 MessagePort，逻辑在 worker——本插件 client 侧 api 桩可同样保持零业务逻辑薄壳（与契约 §3「页面先用注入 api 对象桩」一致）。
3. 字段注册表模式：Diff 比较器 {key,title,pickedFieldNames,formatter,hideFieldNameIfSingleField} 声明式字段描述——doc 页接口属性表/未来对比功能可直接套用此模式。
4. OAS Operation 字段全集：契约 endpoint 未来扩展（responses/security/callbacks）时的字段位规划参照 §5.2/§5.3。
5. 路由参数化：/project/:id?、/main/:key? 可选参数路由——契约五页 hash 路由中的 #/doc/:endpointId 已同构，无需改动；可选段 "?" 写法可借鉴到 overview→doc 直跳场景。
6. localStorage 命名空间：<Context>:<key> / <store>.<key> 两级命名空间（Apifox 用 Context:currentProject 隔离项目态）——插件 UI 态持久化键建议 postapi:<page>:<key> 风格。
7. 桌面窗口安全区：index.html 的 --safe-window-control-width/height:48px 处理自定义标题栏与系统热区冲突——T5 页面若做贴边布局需预留同等变量（Geist token 体系内补 --safe-* 即可）。
8. 埋点轻量桥：eventTracking.dataLayer.push + AliLogTracker GET 上报——插件如需诊断遥测可复用此零依赖模式（可选，契约未要求）。
9. 更新通道描述文件：app-update.yml 按 <version>/win64/ 路径寻址——dsh_release_watch 的版本探测可对齐 Apifox 官方通道 URL 规律（观测：client-updates/<精确版本>/win64/）。
10. 反模式警示：React 16.13.1 与 17.0.2 双版本共存于同一渲染层（多入口遗留）——插件构建须锁定单一 React 依赖，避免同类碎片化；bytenode/NSIS 双层保护对本插件无必要，保持 esbuild 透明产物即可。

## 8. 验收自检（七项）

| # | 验收项 | 状态 | 位置 |
|---|---|---|---|
| 1 | 架构文字图 | ✅ | §1 |
| 2 | 技术栈+版本证据 | ✅ | §2（逐项证据位置） |
| 3 | 页面路由全表 | ✅ | §3（97 条正则全表 + REA 48 条佐证） |
| 4 | 组件/端点观测清单（附 coverage/limitations 原文） | ✅ | §4（原文全量引用） |
| 5 | 数据模型字段全表 + 契约 §1 差异表 | ✅ | §5（52 观测键 + 逐字段差异表；3 处「未取证」显式标注） |
| 6 | 本地存储方式 | ✅ | §6（无 SQLite 显式证据） |
| 7 | 借鉴点清单 | ✅ | §7（10 条） |

缺项说明：无缺项。三处显式「未取证」项（Apifox id 生成规则、method 枚举全集、createdAt/updatedAt 字段名）均在 §5.3 表内标注，均不阻塞契约实现。