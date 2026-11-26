# dsh-postapi 接口契约 v2（Apifox 功能复刻基线）

> lead 产出 · 2026-11-18 · 上游需求基线 docs/feature-matrix.md
> 所有 teammate 按本文档实现，**不得自行改签名**；确需偏离必须在汇报中单列「契约偏离」小节。
> 技术栈不变：纯 JS + JSX（esbuild classic transform，只 require react），无 TS 编译、无 Rust、无新依赖（node 内置模块 + 现有 esbuild）。

## 1. 目录与写范围（越界即违规）

| 角色 | 可写 |
|---|---|
| host-data | `src/host/storage.js`、`src/host/import-export.js`、`src/host/codegen.js`、`tests/host-data.test.js` |
| host-runtime | `src/host/request.js`、`src/host/script-sandbox.js`、`src/host/variables.js`、`src/host/mock-server.js`、`src/host/test-runner.js`、`tests/host-runtime.test.js` |
| pages-a | `src/client/pages/doc.jsx`、`debug.jsx`、`mock.jsx`、`src/client/pages/components/**` |
| pages-b | `src/client/pages/overview.jsx`、`env.jsx`、`schema.jsx`、`history.jsx`、`test.jsx`、`import.jsx`、`flow.jsx`、`settings.jsx`、`search.jsx` |
| bridge-wiring | `src/host/bridge.js`、`src/client/shell/registry.js`、`tests/bridge.test.js` |
| lead | `build.mjs`、`package.json`、`index.js`、`src/host/index.js`、`src/client/index.js`、`src/client/pages-entry.js`、`src/client/shell/**`（除 registry.js）、`docs/**`、`scripts/**`、`tests/run.js` |

红线：全程不 git commit / push；不装新 npm 依赖；不改 desktop profile；不动 `.research/`。

## 2. 存储 schema v2（host-data 权威实现）

根目录：`E:/User/文档/api`（构造参数可覆盖；测试用临时目录）。

### 2.1 index.json
```json
{ "version": 2, "projects": [ { "id": "proj_xxx", "name": "", "updatedAt": "ISO" } ] }
```
读 v1（无 version 字段）时自动补 `version: 2` 并保留 projects。

### 2.2 <projectId>/project.json
```jsonc
{
  "id": "proj_xxx", "name": "", "description": "",
  "createdAt": "ISO", "updatedAt": "ISO", "schemaVersion": 2,
  "folders": [ { "id": "fld_xxx", "name": "", "parentId": null, "order": 0 } ],
  "endpoints": [ {
    "id": "ep_xxx", "name": "", "folderId": null, "order": 0,
    "protocol": "http",                  // http | websocket | socketio | grpc | graphql | rpc  （P2 仅存值）
    "method": "GET",                     // GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|TRACE
    "url": "",                           // 支持 {{var}} 与 /path/{id}
    "params":     [ { "key": "", "value": "", "enabled": true, "description": "", "required": false, "type": "string" } ],
    "pathParams": [ { "key": "", "value": "", "enabled": true, "description": "", "required": false, "type": "string" } ],
    "headers":    [ { "key": "", "value": "", "enabled": true, "description": "", "required": false, "type": "string" } ],
    "cookies":    [ { "key": "", "value": "", "enabled": true, "description": "", "required": false, "type": "string" } ],
    "body": { "type": "none", "content": "", "schema": null, "examples": [] },
    // type: none|json|form|urlencoded|raw|binary|xml|graphql
    "auth": { "type": "none", "token": "", "username": "", "password": "",
              "key": "", "value": "", "addTo": "header" },
    // type: none|bearer|basic|apikey|oauth2|digest  （apikey 用 key/value/addTo=header|query）
    "responses": [ { "id": "res_xxx", "name": "成功", "code": 200, "contentType": "application/json",
                     "body": "", "schema": null, "headers": [], "enabled": true, "isDefault": true } ],
    "preProcessors":  [ { "id": "pre_xxx", "type": "script", "enabled": true, "code": "" } ],
    "postProcessors": [ { "id": "post_xxx", "type": "script", "enabled": true, "code": "" },
                        { "id": "ast_xxx", "type": "assert", "enabled": true,
                          "assertions": [ { "source": "status|body|header|time", "path": "", "op": "eq|neq|gt|lt|contains|notContains|exists|notExists|regex", "value": "", "message": "" } ] } ],
    "mock": { "enabled": false, "delayMs": 0, "rules": [] },
    "description": "", "tags": [], "status": "developing", "createdAt": "ISO", "updatedAt": "ISO"
  } ],
  "schemas": [ { "id": "sch_xxx", "name": "", "folderId": null, "jsonSchema": {}, "description": "", "createdAt": "ISO", "updatedAt": "ISO" } ],
  "environments": [ { "id": "env_xxx", "name": "开发环境", "baseUrl": "", "isDefault": true,
                      "variables": [ { "key": "", "value": "", "enabled": true, "secret": false } ] } ],
  "globals": { "variables": [ { "key": "", "value": "", "enabled": true, "secret": false } ] },
  "mocks": [ { "id": "mk_xxx", "endpointId": "", "field": "", "rule": "fixed|regex|increment|random|template", "value": "", "enabled": true } ],
  "testCases": [ { "id": "tc_xxx", "name": "", "endpointId": "", "assertions": [], "extractors": [], "lastResult": null } ],
  "testScenarios": [ { "id": "ts_xxx", "name": "", "steps": [ { "id": "stp_xxx", "name": "", "endpointId": "", "override": {}, "extract": [] } ], "lastRun": null } ],
  "flow": { "name": "", "steps": [ { "actor": "", "action": "call|return|self|note", "target": "", "message": "", "note": "" } ] },
  "settings": { "mockPort": 4010, "proxyUrl": "", "requestTimeoutMs": 30000, "historyLimit": 200 }
}
```

id 规则不变：`proj_/fld_/ep_/res_/sch_/env_/mk_/tc_/ts_/stp_/pre_/post_/ast_` + `Date.now().toString(36)` + 2 位随机。
时间一律 `new Date().toISOString()`。原子写 tmp+rename、进程内串行队列、损坏改名 `.corrupt-<ts>`、删项目进 `.trash`——四条既有机制**必须保持**。

### 2.3 <projectId>/history.json
```json
{ "entries": [ { "id": "his_xxx", "at": "ISO", "method": "GET", "url": "",
  "status": 200, "timeMs": 12, "bodySize": 100, "request": {}, "response": {} } ] }
```
追加时按 `project.settings.historyLimit`（默认 200）保留最新 N 条。

## 3. host-data 服务 face（createStorageService(basePath) 返回值，只增不改）

既有 9 个方法签名**保持不变**（listProjects/createProject/renameProject/deleteProject/getProject/saveEndpoint/deleteEndpoint/saveFolder/deleteFolder）。新增：

```js
moveNode(projectId, { kind: 'folder'|'endpoint', id, parentId, order })   // P1 目录移动/排序
saveSchema(projectId, schema) -> schema          // 无 id 新建
deleteSchema(projectId, schemaId)
saveEnvironment(projectId, env) -> env
deleteEnvironment(projectId, envId)
saveGlobals(projectId, globals) -> globals
saveProjectSettings(projectId, settings) -> settings
saveFlow(projectId, flow) -> flow
saveResponse(projectId, endpointId, response) -> response   // endpoint.responses 内 upsert
deleteResponse(projectId, endpointId, responseId)
getHistory(projectId) -> { entries: [] }
appendHistory(projectId, entry) -> entry          // 自动裁剪到 historyLimit
clearHistory(projectId) -> { cleared: n }
search(projectId, keyword) -> { endpoints: [], schemas: [], folders: [] }   // 名称/url/description 命中，大小写不敏感
```

## 4. host-runtime 服务 face

```js
// src/host/variables.js
createVariableResolver({ globals, environment, local })
  .resolve(text) -> string        // 替换 {{key}} 与 {{$dynamic}}；未定义保留原文
  .explain(text) -> { resolved, missing: [] }
DYNAMIC_VARS  // $timestamp $isoTimestamp $randomInt $randomString $uuid $randomEmail $randomPhone $randomBoolean $randomFloat $datetime $date

// src/host/script-sandbox.js
runScript(code, { context, timeoutMs = 3000 }) -> { ok, error?, logs: [], variables: {}, tests: [], exports: {} }
// context 结构（pm 兼容面，node:vm 隔离，禁 require/process/fs）：
// { request: { method, url, params, headers, body }, response: { status, headers, body, timeMs },
//   env: {...}, globals: {...}, variables: {...} }
// 脚本内可用全局：pm / console / JSON / Date / Math / String / Number / Array / Object / RegExp / setTimeout(禁用)
// pm.test(name, fn) → 记录断言结果；pm.expect(v).to.eql/equal/be.above/be.below/include/match/be.true/be.false
// pm.environment.get/set、pm.globals.get/set、pm.variables.get/set、pm.response.json()/text()/code、pm.request
// 返回值 tests: [{ name, passed, error? }]、variables: 脚本里 set 过的变量

// src/host/request.js（既有 send 签名扩展，向后兼容）
send({ method, url, params, headers, body, auth, timeoutMs = 30000,
       variables,            // { globals, environment, local } 传入即先做 {{}} 替换（url/params/headers/body/auth）
       preScript,            // string：发送前执行，可改 context.request
       postScript,           // string：响应后执行
       assertions,           // array：内置断言（无脚本时用）
       projectId, history,   // 传了 storage 侧 appendHistory 由 bridge 负责，request 只回 raw
     })
  -> { status, statusText, headers, body, bodySize, timeMs, truncated?, error?,
       request: { method, url, headers, body },   // 实际发出的（含变量替换后）
       tests: [{ name, passed, error? }],         // 断言/脚本结果合并
       variables: { ... },                        // 脚本 set 的变量
       logs: [] }

// src/host/mock-server.js
createMockServer({ getProject, port })  -> { start(), stop(), status() -> { running, port } }
// 规则：GET /mock/<projectId>/<endpointId> 与 /mock/<projectId><endpointPath> 两种命中；
// 按 project.mocks 字段规则生成 body；未命中回落 endpoint.responses[isDefault] 或 200 {}

// src/host/test-runner.js
createTestRunner({ storage, request })
  .runCase(projectId, caseId) -> { caseId, passed, results: [{ name, passed, error? }], durationMs }
  .runScenario(projectId, scenarioId) -> { scenarioId, passed, steps: [{ id, name, status, passed, extracted, error? }], durationMs }
```

## 5. bridge 路由全表（bridge-wiring 权威实现）

前缀 `/dsh-postapi/api`；封套 `{ok:true,data}` / `{ok:false,error,code}`；保留 `ctx.connection.requestRejection` 栅栏与 2MB body 上限。
既有 11 条路由行为不变，新增按 docs/feature-matrix.md §4 全表实现（host-data / host-runtime 各自方法名一一对应）。

client 侧 `src/client/shell/registry.js` 的 `createBridgeStorage()` / `createBridgeRequest()` 需同步扩展同名方法，并保持 `installApi()` 的「桥失败回落内存桩」行为（新增方法也要有桩，桩为最小可用实现，不抛错）。

## 6. client 页面约定（pages-a / pages-b 共同遵守）

- 每页模块**首行**（import 之后）执行：`;(window.__postapiQueue = window.__postapiQueue || []).push(['<pageName>', PageComponent])`
- 页面 props：`{ route: { name, arg }, api }`；api 即 `window.__postapiApi`，可能为 undefined（此时渲染文件内 mock 并显示「示例数据」）。
- 根元素：`<div className="pp-scope pp-page" data-page="<pageName>" ref={rootRef}>`，`useEffect(() => applyTheme(rootRef.current), [])`（`import { applyTheme } from './theme.js'`）。
- **禁止内联尺寸魔法数**：控件高用 `--ctl-h`、行高 `--row-h`、胶囊 `--pill-h`；间距只用 `var(--sp-1|2|3|4|6)`；颜色只用 token 变量。新增样式类一律 `.pp-` 前缀，写进自己页面文件的 `<style>`？**不允许**——统一由 lead 在 `design-tokens.css` 增补；teammate 只能在页面里用已存在的 `.pp-*` 类或纯 token 的内联 style（内联 style 只允许 layout，不含颜色/字号字面量）。
- 禁止 `alert/confirm/prompt`；禁止新增 npm 依赖；禁止 import 宿主内部包（只允许 `react` 与本地相对路径）。
- 交互必须真跑：保存类按钮调用 `api.storage.*`，发送按钮调用 `api.request.send`，失败时页面内显示错误文案（不弹窗）。
- 页面内不得写死 `fetch('/dsh-postapi/...')`，一律走 `api`。

## 7. 测试要求

- 框架：仓库自带极简 runner（`tests/run.js` 汇总；每个测试文件导出 `export const tests = [{ name, fn }]`）。**不引 vitest**。
- host-data / host-runtime / bridge 三组必须覆盖：happy path + 边界（空值、缺 id、损坏文件、超限）+ 异常（网络失败、脚本抛错、断言失败）。
- 每新增 host 方法至少 1 条测试；每个页面至少 1 条静态断言（导出存在 + 注册名正确 + 无禁用 API）。
- 运行：`node tests/run.js`（lead 会把它扩展到包含全部新套件）。

## 8. 汇报格式（每个 teammate 必交）

1. 已实现功能点 → 文件 → 测试用例名（三列表，覆盖 feature-matrix 中自己负责的每一行）。
2. 契约偏离（若无写「无」）。
3. 未实现 / 降级项（明确写 P2 或原因）。
4. 自测输出摘要：`node tests/run.js` 的通过/失败计数与失败明细（必须全绿才汇报完成）。

---

## 9. 功能补齐轮增补（2026-11-26 · gRPC/Dubbo/数据库驱动/拖拽/右键菜单/项目设置全族）

> 本节为「expand-feature-parity」工票的接口增补，全部真实现、零新 npm 依赖（协议客户端用 node 内置模块）。
> 云端账号、团队协作、SSO 明确不做（见 §5，本节不改变该边界）。

### 9.1 桥路由增补

| 方法 路径 | 作用 | 归属 | 备注 |
|---|---|---|---|
| POST /grpc/invoke | gRPC unary 真调用：body `{ address, proto, service, method, message, metadata?, timeoutMs? }` → `{ path, message, trailers, status, statusCode, timeMs }` | host-runtime（grpc-client.js） | proto3 解析 + protobuf 编解码 + node:http2（h2c/TLS+ALPN）；超时头发规范形态 `grpc-timeout: <ms>m`；错误码 INVALID_ARGUMENT / UNAVAILABLE / GRPC_ERROR / TIMEOUT |
| POST /dubbo/invoke | Dubbo 真调用：body `{ address, interface, version, group, method, parameterTypes, args, generic?, timeoutMs? }` → `{ value, status, timeMs }` | host-runtime（dubbo-client.js） | Dubbo 协议帧 + hessian-lite 编解码（node:net）；parameterTypes 为类名数组，协议描述符串按 ReflectUtils.getDesc 直接拼接（`ILjava/lang/String;`，无空格）；generic=true 走 GenericService.$invoke（body 的 path/interface=GenericService，attachments 的 path/interface 保留目标服务名供寻址）；错误码 INVALID_ARGUMENT / UNAVAILABLE / DUBBO_ERROR / TIMEOUT |

两条路由的服务方法失败时**返回封套不抛出**：HTTP 200 + `data = { ok:false, error:{ code, message } }`（与 db.js 同模式，UI 按 `data.error.code` 分支）。client 侧 `api.grpc.invoke` / `api.dubbo.invoke` 同名映射；降级桩返回同形 `{ok:false,error:{code:'UNAVAILABLE'}}`。

### 9.2 数据库驱动（db.js · 2026-11-26 二次扩展：全官方驱动）

`SUPPORTED_DRIVERS = ['sqlite','mysql','postgresql','gaussdb','mssql','oracle','mongodb','redis']`。全部官方驱动（npm dependencies，client bundle 不受影响）：

| type | 驱动包 | 连接配置（除 type 外） | query 语义 |
|---|---|---|---|
| sqlite | node:sqlite（内置） | path（:memory: 可用） | SQL；`?` 位置参数 |
| mysql | mysql2 ^3.24 | host, port(3306), user, password, database, ssl? | SQL；`?` 参数原生透传；行集 / ResultSetHeader→changes/insertId |
| postgresql | pg ^8.23 | host, port(5432), user, password, database, ssl? | SQL；`?` 改写 $n（引号保护，无法安全改写报 INVALID_ARGUMENT）；CommandComplete→changes |
| gaussdb | gaussdb-node ^0.2（华为云 HuaweiCloudDeveloper 官方，node-postgres 适配分支，含 GaussDB/openGauss sha256 认证） | host, port(5432，DWS 常见 8000), user, password, database, ssl? | 同 pg 语义（`?` 改写 $n、行集/changes） |
| mssql | mssql ^12.8 | host(server), port(1433), user, password, database, ssl?（ssl=true→encrypt+trustServerCertificate，false→encrypt:false） | SQL；`?` 改写 @pN + request.input（同引号保护）；rowsAffected→changes |
| oracle | oracledb ^26 | host, port(1521), user, password, database=服务名 | SQL；`?` 改写 :n（同引号保护）；OUT_FORMAT_OBJECT；rowsAffected→changes |
| mongodb | mongodb ^7.9 | url?（优先）或 host/port/user/password，database 必填 | **命令文档**：sql 为 JSON 文档（`{"find":"users","filter":{},"limit":10}`）→ db.command → `{driver:'mongodb', output}` |
| redis | redis ^6.4 | host, port(6379), password?, database?(db 序号), ssl?(TLS) | **命令行**：sql 按空白/引号切参（`GET mykey`）→ sendCommand → `{driver:'redis', output}` |

- 通用机制不变：指纹池复用（探活 SELECT 1 / PING / command({ping:1})）、MAX_ROWS=1000 截断、close/closeAll、UNSUPPORTED_DRIVER 只给未知 type、错误归一 DbError（连接/认证失败 CONNECTION_ERROR，执行错 SQL_ERROR）。
- 可选注入缝（只增）：`createDbService({ drivers })` 供测试注入 fake 驱动工厂。
- output 值 JSON 安全化：bigint→字符串、Buffer→base64；UI 的 DB 页签对 `output` 渲染 JSON 块。

### 9.3 项目设置全族（settings 增补字段）

`project.settings` 新增（DEFAULT_SETTINGS 同步）：

```jsonc
"settings": {
  // ……既有 mockPort/proxyUrl/requestTimeoutMs/historyLimit/dbConnections 不变
  "globalParams": { "headers": [], "query": [], "cookies": [] },   // ParamTable 行结构
  "globalAuth":   { "type": "none|bearer|basic|apikey", "token": "", "username": "", "password": "", "key": "", "value": "", "addTo": "header" },
  "preScript":   "",   // 项目级前置脚本（先于接口前置脚本）
  "postScript":  ""    // 项目级后置脚本（后于接口后置脚本）
}
```

- saveProjectSettings 额外语义：入参含 `name` / `description` 时同步写 project.name / project.description（其余键仍浅合并）。
- request.send 新可选入参（只增不改）：`globalParams`（query/headers/cookies 与接口参数合并，同名接口优先）、`globalAuth`（接口 auth.type==='none' 时兜底注入）、`projectPreScript` / `projectPostScript`（在接口脚本前后执行同一沙箱）、`cookies`（接口 cookies 并入 Cookie 头）。

### 9.4 页面约定增补（doc / debug / overview）

- 左树拖拽排序：FolderTree 行 draggable；drop 语义 = 落目录行「移入」、落接口行「同层重排到其前」；禁止拖入自身子孙；持久化走既有 `moveNode`（操作序列由纯函数 `computeTreeMove` 产出，同层 order 归一化 0..n）。
- 右键菜单：`components/ContextMenu.jsx`（fixed 定位、越界翻转、Escape/外点关闭；样式复用 .pp-menu-* 家族）。目录行：新建子目录/新建接口/重命名/删除；接口行：调试页打开/复制 URL/重命名/删除；树空白：新建目录/新建接口；overview 项目卡：重命名/删除。删除一律两段式行内确认（禁 alert/confirm/prompt 不变）。
- debug 页协议族：HTTP / WebSocket / gRPC / Dubbo 四态；gRPC 面板（地址/proto/service/method/消息 JSON/metadata←headers）、Dubbo 面板（地址/interface/version/group/method/parameterTypes/args/generic/attachments←headers）；两协议页签集 = [params, headers]，响应进右侧面板（状态胶囊=statusCode、body=消息 JSON）。
- debug 页新增「项目设置」页签：基本信息/全局参数/全局认证/前置脚本/后置脚本，保存走 renameProject + saveProjectSettings；发送时携带 globalParams/globalAuth/projectPreScript/projectPostScript。
- DB 页签驱动全内置：sqlite/mysql/postgresql 三选一（mysql/pg 增加 ssl 可选开关），移除「需独立驱动」文案。
