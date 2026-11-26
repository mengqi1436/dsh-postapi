# 全页面 / 页签 / 功能截图与 Apifox 完整性对标审计（2026-11-26）

> 角色：ticket `ui-full-parity-audit`（全页面分页功能截图，对标 Apifox 完整性，包括图标使用）。
> 基线：`docs/apifox-visual-parity-spec.md`（Apifox 2.8.55 渲染器 CSS 实测）+ `docs/feature-matrix.md`（功能全表）。
> 截图环境：真实 client 源码（esbuild 打包）+ 真实 host 桥（`handlePostapiRequest` 全服务装配）+ 种子演示项目「订单中心」；chromium 1440×900 @2x，fullPage。
> 产物：本目录 43 张 PNG（31 个页面/页签/交互场景 + 图标清单页 + 暗色抽样）+ `dom-facts.json`（37 项渲染态断言，全部通过）。
> 复现：`node <harness>/shoot-full.mjs <REPO> <OUT>` 与 `node <harness>/dom-facts.mjs <REPO> <OUT_JSON>`（harness 位于工作区 postapi-uievidence/harness，随审计工单留存）。

## 1. 覆盖清单（页面 → 页签/状态 → 截图 → 对标结论）

### 壳级（Apifox 顶栏 48px / 侧栏 240px / 主页签条 44px 骨架）
| 场景 | 截图 | 结论 |
|---|---|---|
| 总览默认态 | `overview.png` | ✅ 顶栏（品牌/面包屑/搜索/新建/环境/主题/设置/帮助）+ 侧栏 5 组 12 项 + 页签条，与 Apifox 三段骨架同构 |
| 项目卡片右键菜单 | `overview-context.png` | ✅ 重命名/删除两段式确认入口，对齐 Apifox 项目卡片菜单 |
| 新建三级菜单 | `overview-new-menu.png` | ✅ 一级 8 项 → 二级分组 → 三级叶子（接口/目录/数据模型/导入/测试），Apifox「+」同构 |
| 帮助卡 | `overview-help.png` | ✅ 「当前页面」说明卡（原右栏上下文收编） |
| 暗色主题抽样 | `overview-dark.png` / `debug-dark.png` | ✅ `[data-theme=dark]` 四 token 生效，无漏色 |

### 接口文档 #/doc
| 场景 | 截图 | 结论 |
|---|---|---|
| 默认态（左树 + 正文 + 锚点条） | `doc.png` | ✅ 9 章锚点 chips（基本信息/Path/Query/请求头/Cookies/请求体/认证/响应/代码生成）；TOC 刻意改为顶部横向 chips（窄容器让宽，见源码注释） |
| 目录行右键菜单 | `doc-context-menu.png` | ✅ 新建子目录/新建接口/重命名/删除（**本次修复：行菜单此前被 root 菜单冒泡覆盖，全部失效，见 §3**） |
| 新建接口行内表单 | `doc-new-endpoint-form.png` | ✅ 方法下拉 + 名称输入，Enter/Escape，无模态框 |
| 多响应页签 | `doc-response-404.png` | ✅ 200 成功 / 404 订单不存在 双响应切换，body/只读保存态齐 |
| 拖拽跨目录移动 | `doc-drag-move.png` | ✅ 未归类接口拖入「支付」目录，`moveNode` 落库断言通过 |

### 调试发送 #/debug（Apifox 调试台同位）
| 场景 | 截图 | 结论 |
|---|---|---|
| HTTP Params（默认） | `debug-http-params.png` | ✅ 协议切换（HTTP/WS/gRPC/Dubbo）+ 方法徽标 + URL 40px 行 + 发送/取消 |
| Headers 页签 | `debug-http-headers.png` | ✅ 常用请求头建议下拉（headerPresets→datalist） |
| Body 页签 | `debug-http-body.png` | ✅ 七类型（none/form/urlencoded/json/xml/raw/graphql） |
| Auth 页签 | `debug-http-auth.png` | ✅ none/bearer/basic/apikey（oauth2/digest 规划中占位） |
| 脚本页签 | `debug-http-script.png` | ✅ 前置/后置脚本 + 断言（9 种操作符）+ 提取器 |
| 设置页签 | `debug-http-settings.png` | ✅ 超时/等待等请求级设置 |
| 真实发送 | `debug-send-response.png` | ✅ 对真桥 `/health` 发送，响应面板 status/耗时/大小/headers/body 齐 |
| WebSocket 模式 | `debug-websocket.png` | ✅ 连接/发送消息（断开按钮连接后出现）+ 消息日志位 |
| gRPC 模式 | `debug-grpc.png` | ✅ proto 编辑 + service/method + message JSON（unary 真调用管线） |
| Dubbo 模式 | `debug-dubbo.png` | ✅ interface/method/version/group/parameterTypes/args + 泛化调用开关 |
| 数据库页签 SQLite | `debug-db-sqlite.png` | ✅ 连接表单 + 测试连接/执行/保存/载入 |
| 数据库页签 MySQL | `debug-db-mysql.png` | ✅ 八类型官方驱动下拉切换（MySQL 表单实拍） |
| 项目设置·基本信息 | `debug-proj-basic.png` | ✅ 项目名/描述（saveProjectSettings 同步改名） |
| 项目设置·全局参数 | `debug-proj-vars.png` | ✅ 全局变量表，并入发送管线 |
| 项目设置·全局认证 | `debug-proj-auth.png` | ✅ 全局认证类型/凭据/addTo |
| 项目设置·前后置脚本 | `debug-proj-scripts.png` | ✅ 项目级脚本编辑 |

### 其余 8 页
| 场景 | 截图 | 结论 |
|---|---|---|
| Mock | `mock.png` | ✅ 字段规则表（fixed/regex/increment/random/template）+ 延迟/启用 + 服务启停 + 命中地址 |
| 数据模型 | `schema.png` | ✅ 模型列表 + JSON Schema 编辑 + 校验/示例生成 |
| 环境与变量 | `env.png` / `env-globals.png` / `env-priority.png` | ✅ 三页签（环境变量/全局变量/优先级说明），apiKey/demo-key 种子渲染正确 |
| 请求历史 | `history.png` / `history-detail.png` | ✅ 时间/方法/URL/状态/耗时/大小 + 详情卡 + 回放 + 两段式清空 |
| 自动化测试 | `test-cases.png` / `test-scenarios.png` | ✅ 用例（断言 9 op + 提取器）/ 场景（多步骤 + 变量传递）双页签，种子数据渲染 |
| 导入导出 | `import.png` / `import-export.png` / `import-codegen.png` | ✅ 导入 6 种（OpenAPI/Postman/Apifox JSON/YApi/HAR/cURL）+ 导出 4 种 + 代码生成 |
| 流程图 | `flow.png` | ✅ sequence SVG 渲染（4 步种子：客户端→订单服务→支付服务→回程） |
| 全局搜索 | `search-results.png` | ✅ 「订单」命中接口/模型/目录三分组，高亮 + 跳转 |
| 设置 | `settings.png` | ✅ 存储路径（只读）/主题/语言/Mock 端口/代理/超时/历史条数 |

## 2. 图标使用盘点（含清单页实拍 `icons-sheet.png`）

| 图标族 | 实现 | 使用位置 | 对标 |
|---|---|---|---|
| 侧栏/顶栏导航图标 18 个 | `Body.js ICON_PATHS`（grid/layers/db/check/sliders/sun/moon/gear/help/plus/close/book/send/cube/clock/swap/flow/search，24 viewBox 1.6 stroke） | 侧栏 12 项 + 顶栏主题/设置/帮助 + 新建菜单 | ✅ 与 Apifox 顶栏/侧栏同位图标一一对位 |
| 插件入口图标 | `definition.js PostApiIcon`（内联 svg，React 组件） | 宿主右栏 guide 入口 | ✅ 缺省时官方 guide 画立方体占位的坑已规避 |
| 空态图标 | `EmptyState.jsx`（box/search/file 三种 + 可 null） | 各页空态 | ✅ |
| 方法徽标 | `.pp-method[data-method]`（GET/POST/PUT/DELETE/PATCH/HEAD/OPTIONS + WS/RPC/GraphQL 彩色语义） | doc/debug/overview/history/mock/search/test | ✅ 对齐 Apifox 方法色规范（visual-parity-spec §3） |
| 树字形 | 目录 `▦` + 折叠箭头 `▸/▾` + 菜单箭头 `›` | FolderTree / 菜单 | ✅ Apifox 树 switcher 同位 |
| 图标纪律 | 全部走 `Icon`/字形，无第三方图标库，尺寸走 `--icon*` token | — | ✅ |

DOM 实测：整站渲染过的 svg path 指纹 18 种（与 ICON_PATHS 全集一致，无死图标）；方法徽标实际使用 GET/POST/DELETE/WS/RPC。

## 3. 本次发现并修复的缺陷（2 个，均已带回归测试）

1. **行级右键菜单全部失效**（`FolderTree.jsx`）：行 `onContextMenu` 未 `stopPropagation`，事件冒泡到 `.pp-tree`/`.pp-tree-group` 的 root 兜底 handler 后二次 setState，行菜单被根级「新建目录/新建接口」覆盖——目录行的新建子目录/重命名/删除、接口行的调试页打开/复制 URL/重命名/删除在真机全部不可达。修复：行 handler 阻断冒泡；`tree.test.js` 增加 stopPropagation 断言；实拍 `doc-context-menu.png` 验证。
2. **ParamTable `<datalist>` 非法嵌套**（`ParamTable.jsx`）：datalist 作为 `<table>` 直接子元素违反 HTML 嵌套规则，每次渲染 Headers 表 React `validateDOMNesting` 都报控制台红错。修复：有建议下拉时用 Fragment 使 datalist 与 table 成兄弟节点；无建议时保持裸 table 根（历史契约不变）。`body-editor.test.js` 增加「datalist 不在 table 子树」断言；整站控制台复查仅剩 harness 自身 favicon 404，产品零红错。

## 4. 渲染态断言（`dom-facts.json`，37/37 通过）

覆盖：壳级 5（侧栏 12 项/右键菜单/三级菜单/帮助卡/暗色）、文档 4（树/锚点条/多响应/拖拽落库）、调试 12（7 页签/真发送/3 协议/数据库/项目设置 4 子页签合并计数）、其余页 15（Mock/Schema/Env×3/History×2/Test×2/Import×3/Flow/Search/Settings）+ datalist 嵌套纪律 1。断言口径以修复后的真实 DOM 为准（TOC=锚点条、WS 断开按钮连接后出现、断言操作符为英文 op 等，均与源码实现核对）。

## 5. 对标 Apifox 的剩余差距（记录，不在本票扩权范围）

- 云端协作/团队/在线分享/SSO/AI 生成用例：明确不做（feature-matrix §5 边界）。
- Tars / Socket.IO：仅协议位，无真实收发（gRPC/Dubbo/WS 已真实现）。
- Apifox 左树行内悬浮操作按钮（24×24）：本实现同等能力收进右键菜单（行内悬浮按钮与 22px 行高冲突，取舍已记录于 visual-parity-spec §4）。
- gRPC 仅 unary；Mock 服务为本地单端口（无 Apifox 云端 Mock）。

## 6. 验证

- `npm run verify`：build（vm smoke 全绿）+ 413 用例 + 冒烟 30 项全绿。
- `node src/client/pages/__tests__/tree.test.js`：16/16；`tests/body-editor.test.js`：11/11；`apifox-ui.test.js`：11/11。
- 整站控制台复查：0 产品红错（仅 harness favicon 404）。
