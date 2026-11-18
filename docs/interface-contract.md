# dsh-postapi 接口契约 v1（四方对齐基线）

> T1/T2/T3/T5 四个 teammate 全部按本文档实现；偏离须在汇报中显式标注。技术栈：纯 JS/TS，esbuild 转译 JSX，无 Rust。

## 1. 存储 schema（T3 实现，T1 报告校正差异）

根目录：E:/User/文档/api（默认值，host 构造参数可注入）。

- index.json：`{ "projects": [ { "id", "name", "updatedAt" } ] }`
- <projectId>/project.json：

```jsonc
{
  "id": "proj_xxx", "name": "", "createdAt": "ISO", "updatedAt": "ISO",
  "folders": [ { "id": "fld_xxx", "name": "", "parentId": null } ],
  "endpoints": [ {
    "id": "ep_xxx", "name": "", "folderId": null,
    "method": "GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS", "url": "",
    "params":  [ { "key", "value", "enabled": true } ],
    "pathParams": [],
    "headers": [ { "key", "value", "enabled": true } ],
    "body": { "type": "json|form|raw|none", "content": "" },
    "auth": { "type": "none|bearer|basic", "token": "", "username": "", "password": "" },
    "description": "", "createdAt": "ISO", "updatedAt": "ISO"
  } ],
  "flow": { "name": "", "steps": [ { "actor": "", "action": "call|return|self|note", "target": "", "message": "", "note": "" } ] }
}
```

- id 规则：`proj_/fld_/ep_` + Date.now().toString(36) + 2 位随机；时间一律 new Date().toISOString()
- 损坏隔离：project.json 解析失败 → 原文件改名 .corrupt-<ts> 后重建空结构
- 删除项目：整目录先复制到 .trash/<projectId>-<ts>/ 再删除
- 原子写：tmp 文件 + fs.rename；所有写操作经进程内 promise 串行队列

## 2. host service face 签名（T3 实现；暴露接线方式以 B 的 sidebar-notes 为准，签名固定）

`postapi.storage`：
- listProjects() → [{id,name,updatedAt}]
- createProject(name) → project；renameProject(id,name)；deleteProject(id)
- getProject(id) → project 全量
- saveEndpoint(projectId, endpoint) → endpoint（无 id 新建补 timestamps；有则覆盖并更新 updatedAt）
- deleteEndpoint(projectId, endpointId)；saveFolder(projectId, folder)；deleteFolder(projectId, folderId)（子项 folderId 置 null 不级联删）

`postapi.request`：
- send({ method,url,params,headers,body,auth,timeoutMs=30000 }) → { status,statusText,headers,body,bodySize,timeMs,error? }
- 实现：Node 全局 fetch + AbortController；params 拼 query；auth 注入 Authorization；body 按 type 序列化并补默认 Content-Type；响应 body 文本化，>2MB 截 200KB 且 truncated:true；错误结构化进 error 字段

## 2b. client↔host 通信桥（联调修订：inject face 方案作废）

官方机制核实：宿主 face 总线仅提供内置 face（sidebar-files inject=[slots,locale,sidebarRightTabs,sidebarRight,remote,remote.workspaceFiles]；sidebar-right inject 全内置），插件无法注册 postapi.* 自定义 face。通信改为 dsh-db-tool 同款 webServer prefix 桥（0.2.x 生产验证）：
- host：ctx.effect(() => ctx.webServer 注册 {kind:'prefix', path:'/dsh-postapi/api', handler})，handler 首行 ctx.connection 可选链 requestRejection(req) 栅栏（401/403 写 JSON 返回，宿主 0.2.0-rc.1 起插件前缀路由不经宿主鉴权）
- client：同源相对路径 fetch('/dsh-postapi/api/...')，响应 {ok:true,data} 或 {ok:false,error,code}；失败降级内存 stub（契约 §2 签名不变）
- 路由表：GET /api/health；GET /api/storage/listProjects；POST /api/storage/createProject|renameProject|deleteProject|saveEndpoint|deleteEndpoint|saveFolder|deleteFolder；GET /api/storage/getProject?projectId=；POST /api/request/send
- client inject 数组移除 postapi.storage 与 postapi.request，仅保留宿主 face：[slots,locale,sidebarRightTabs]

## 3. client 页面路由与挂点（B 骨架 + D 页面）

- 页签内 hash 路由：#/overview（项目总览）、#/doc/:endpointId（接口文档）、#/debug（调试发送）、#/flow（流程图）、#/settings（设置）
- B 产出：src/client/index.js（__ModuleLoader__ 入口）、src/client/shell/{definition,ApiTitle,locales}.js、路由挂点组件（从 src/client/pages/ 引入五页；pages 暂缺时渲染占位）
- D 产出：src/client/pages/{overview,doc,debug,flow,settings}.jsx/js + design-tokens.css + 公共组件
- 数据访问：client 经 inject face 调 postapi.storage/request（B 按 ui-sidebar-files 样板接线；D 页面先用注入的 api 对象桩开发，联调由 lead 完成）

## 4. 侧边栏双栏策略（官方组件，禁止自制侧边栏框架）

右栏：@deepseek-ai/dsh-client-ui-sidebar-right@0.2.2-rc.3 契约——sidebarRightTabs.register({id:'postapi',kind,title,guide,keepMounted:true}) + slots sidebar.right.pane.tab / sidebar.right.pane.tab.title；席位 key 取 definition.id 不拼 localeKey；priority 不写即 extension；宿主 fiber effect 须 ctx.effect 包 disposer；guide 单入口直接打开页签。

左栏：官方 @deepseek-ai/dsh-client-ui-sidebar@0.0.1-rc.1（会话多级树/搜索/分组/状态点）。T2(B) 拉包侦察其是否提供插件可用的左栏扩展点（slots/registry/face）：有 → 插件注册轻量 PostAPI 入口；无 → 左栏走桌面端原生，插件不注册、不自制。结论写入 docs/sidebar-notes.md。

保留：骨架已验证的 conversation.composer.dock 徽章（官方 slot）作为会话输入框快捷入口。

## 5. 设计 token（Vercel Geist；D 落地为 design-tokens.css，尺寸统一在 token 层）

- 字体：sans -apple-system,"Segoe UI",Inter,system-ui；mono ui-monospace,"Cascadia Code",Consolas
- 字阶 12/13/14/16/20/24px；权重 400/500/600；基准 13px、行高 1.45
- 边框三档：light #eaeaea/#d0d0d0/#a8a8a8；dark #333/#444/#666
- 前景：light #000/次级 #666；dark #fafafa/次级 #888；accent #0070f3；成功 #50e3c2、警告 #f5a623、错误 #e5484d
- 圆角：控件 6px、卡片 8px、胶囊全圆
- 尺寸统一 token（禁止控件各自 padding/字号撑高）：控件高 --ctl-h:28px；表行高 --row-h:32px；胶囊高 --pill-h:20px；间距刻度 4/8/12/16/24；卡片 padding 12px；左导航 220px；右 TOC 180px
- 方法徽标：GET #22c55e / POST #3b82f6 / PUT #eab308 / DELETE #ef4444 / PATCH #a855f7，mono 10px 大写
- 密度基调：PostHog/Mintlify 文档感——1px 边框分区、不投阴影

## 6. sequence 流程图（D）

- 数据：project.json.flow.steps（见 §1）；页内可视化编排（增删步/改序）+渲染
- 实现：先调 diagram-design skill，style-guide gate 选 (d) paste tokens：paper #fafafa / ink #000 / accent #0070f3 / border #eaeaea（不得用默认 #f5f5f5/#2d3142/#bf4520 皮肤）；参照 HTML 存 docs/flow-reference/；移植 React+SVG 组件：生命线/激活条/消息箭头/自消息/alt-opt 片段最小集 + SVG 导出按钮
- skill 哲学：密度 4/10；steps>9 提示拆分为两张图

## 7. 测试要求

- vitest（lead 统一配置）；T3 按 TDD：先失败测试后实现
- storage.test.js：项目建列删、endpoint upsert 补 timestamps、folder 增删、损坏隔离、原子写读回、10 并发写不丢
- request.test.js：node:http 本地 echo（不依赖外网）：query 拼接、POST json、header 透传、超时 abort、非 2xx 返回 status、错误结构
- 等高一致性：D 在 src/client/pages/ 下写静态检查测试，固化「所有控件高度来自 token」约束

## 8. 写范围总表（越界即违规）

| 角色 | 可写 |
|---|---|
| T1 apifox-rea | .research/apifox/**、docs/apifox-research/** |
| T2 sidebar-shell | src/client/shell/**、src/client/index.js、docs/sidebar-notes.md、.research/sidebar/** |
| T3 storage-core | src/host/**、tests/** |
| T5 ui-pages | src/client/pages/**、docs/flow-reference/**、docs/ui-notes.md |
| T4 lead | package.json、cordis.patch.yml、index.js、client.js、.gitignore、docs/interface-contract.md、集成接线 |

红线：全程不 git commit/push；不修改其他插件与 desktop profile 既有 bundles（新增除外）。
