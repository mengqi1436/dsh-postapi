# Apifox 2.8.55 全部工作台页面静态拆解与实现规格

> 交付物：`docs/apifox-research/pages-spec.md`（本文件）+ `docs/apifox-research/chunks.md`（chunk 映射表）
> 取证对象：`.research/apifox/app/dist/renderer/`（Apifox 2.8.55 Windows x64，1528 文件 / 124 MB，minified）
> 取证方式：webpack 映射表解析 + chunk 字面量正则抽取 + 页面级 CSS 规则解析 + `locale.zh-CN` 键值对齐；**全程未运行 Apifox**。
> 中间产物：`.tmp/apifox-rea-*.json`（chunk 名称表 / css hash 表 / 各页语义类名 / 各页 own 规则 / 各页中文键值）

## 0. 取证元信息与证据

### 0.1 REA 证据

| 项 | 值 |
|---|---|
| 分析工具 | `mcp__rea__analyze_javascript_application`（input = `D:/Code/DSH-Postapi/.research/apifox/app/dist/renderer`） |
| 证据 id（view） | `ev_18352431fe3fdf5c3666973384b308e2e14dae41c7ba2dde42a8beb175c362d8` |
| 父证据 id | `ev_9892bc6427b9dd5dd6f0ec97670b8c1da6aaaba477b34f30653ce9efbd952a1f` |
| view digest | `e2176ab44e382193b49e8cd95d2794e0a8bd59c268e447e8d52d68c817d37539` |
| source_paths | `["32636.00189f99.async.js", "23168.03b4fd45.async.js"]`（概览 + panel_api 两个 chunk，作为语义图基线） |
| coverage | `{"status":"complete-within-view","examined":1476,"total":1476,"next_offset":null,"exhausted":true}` |
| artifact sha256 | `77aa42bfd50d2f5677c4578f6dd074661de00750a6bb1edad357c482b17f9bbc`（目录级） |
| 前置证据（概览页） | `ev_b84ffb5ac652176d9243c7ce47b0ef3347572ce26409b79796b9cc97d658c828`（见 `overview-rebuild.md`） |
| 已知限制 | 静态语法观察不证明运行时执行；CSS Modules 映射在压缩后大部分退化为字面量字符串，语义名以 **CSS 选择器前缀** 为准；`27733`（async_http_api_case）无独立 JS 文件，组件实际打进 `75562` chunk |

**方法学说明（为什么以 CSS 选择器前缀为语义来源）**：Apifox 用 CSS Modules，类名形如 `.tree-title-Z15otb`、`.card-R2lvj9`。chunk 内的 `{"treeTitle":"tree-title-Z15otb"}` 映射表在 minify 后大量被内联为裸字符串常量，直接正则只能捞到少数成对项（api_case 4 对、overview 1 对、org_settings 8 对）。因此本规格统一采用 **CSS 选择器前缀** 作为语义类名（`.tree-title-Z15otb` → `tree-title`），并按选择器原文还原嵌套关系（后代选择器 `A B` = B 在 A 内；`A>B` = 直接子元素）。

### 0.2 尺寸/色板基线（引自 `docs/apifox-visual-parity-spec.md`，本规格只引用不重复推导）

| token | Apifox 实测 | 来源 |
|---|---|---|
| 顶栏高 | 48px | `--ui-layout-header-height`（`index.efe6d7b0.css`） |
| 顶栏内边距 | 0 50px | `--ui-layout-header-padding`（同上） |
| 主页签条高 | 44px | `--app-main-tabs-height` |
| 左侧导航宽/内边距 | 240px / 20px | `.sider-bxNtfB`（`22260.490ca644.css`） |
| 页面级间距 | 10px | `--app-page-layout-size` |
| 布局右/底边距 | 8px | `--app-layout-padding-right/bottom` |
| 内容最大宽 | 1512px | `.overview-header-container` |

dsh-postapi 对应 token（`src/client/pages/design-tokens.css`）：`--topbar-h:48px`、`--tabbar-h:44px`、`--sider-w:240px`、`--sider-pad:20px`、`--page-pad:10px`、`--layout-pad:8px`、`--content-max-w:1512px`、`--tree-row-h:22px`、`--ctl-h:32px`、`--ctl-h-sm:24px`、`--ctl-h-lg:40px`、`--row-h:32px`、`--pill-h:22px`、`--panel-w:240px`、`--panel-w-max:320px`、`--card-pad:16px`、`--empty-w:360px`。

---

## 1. 骨架（chunk 93666 = `layouts__AppLayout` / 49423 = `layouts__BasicLayout` / 80115 = 侧栏与页签组件，css `layouts__AppLayout.82e9bb98.css` / `layouts__BasicLayout.bea2f0dc.css` / `50278.0c151859.css` / `22260.490ca644.css`）

对应 dsh-postapi：`src/client/shell/Body.js`。

### 1.1 结构（类名 → 语义，缩进表示嵌套）

```
.pp-workbench-v2                      整页 2 行网格：顶栏 + 主体（dsh 现有，Apifox 对应 AppLayout 的 grid 行）
├ header（Apifox 无独立 header 类名，高度由 --ui-layout-header-height 控制）
│  ├ brand / crumb                    面包屑：项目 › 模块
│  ├ search（顶栏搜索入口，点开为全局搜索面板）
│  ├ 环境选择器（environment-select）
│  ├ icon 动作（主题 / 设置 / 帮助）
├ .pp-shell                           grid: --sider-w | 1fr
│  ├ nav.pp-sider                     .sider-bxNtfB：240 宽 / padding 20 / 右 1px 分隔 / overflow auto
│  │  ├ .pp-sider-group               .ui-menu-item-group-title：高 24 / margin-bottom 8 / padding 0 16
│  │  └ .pp-sider-item                .ui-menu-item：高 32
│  └ main
│     ├ .pp-tabbar                    .layoutTabBar：高 44（--app-main-tabs-height）
│     │  └ .pp-tabbar-item            .ui-tabs-tab：高 44 / 左右 1px 分隔 / 激活项顶部 2px 主色条
│     └ .pp-main-v2                   页面容器（container-type: inline-size）
```

### 1.2 关键 CSS 实测值

| 选择器 | 属性 | 值 | 来源 |
|---|---|---|---|
| `.sider-bxNtfB` | width / padding / border-right / overflow | 240px / 20px / 1px solid split / auto | `22260.490ca644.css` |
| `.sider-bxNtfB` | `--ui-menu-item-group-height` / `--ui-menu-item-height` / `--ui-menu-item-boundary-margin` | 24px / 32px / 0 | `22260.490ca644.css` |
| `.sider-bxNtfB .ui-menu-item-group-title` | margin-bottom / padding | 8px / 0 16px | 同上 |
| `.sider-bxNtfB .ui-menu-item-group + .ui-menu-item-group` | margin-top | 12px | 同上 |
| `.layoutTabBar-* > .ui-tabs-nav` | height / box-shadow / margin-bottom / `--ui-tabs-card-gutter` | `var(--app-main-tabs-height,44px)` / none / 0 / 0 | `50278.0c151859.css` |
| `.layoutTabBar-* .ui-tabs-tab` | height / opacity / background / border-bottom | 44px / .72 / `var(--ui-body-background)` / 1px split | 同上 |
| `.layoutTabBar-* .ui-tabs-tab.ui-tabs-tab-active` | opacity / border-left/right / ::before | 1 / 1px split / 顶部 2px `var(--ui-primary-color)` 满宽 | 同上 |
| `.layoutTabBar-* .ui-tabs-tab + .ui-tabs-tab:before`（未激活相邻） | width / height / background / left | 1px / 24px / `var(--ui-legacy-bg-300)` / 0 | 同上 |
| `.LayoutTabBar-phTOvc`（panel_api 内嵌页签条） | width | `calc(100% - 207px)` | `async_panel_api.014078b9.css` |
| `.header-l81YB_`（AppLayout 头部） | height / padding / border-radius | 36px / 12px 12px 0 / 8px 8px 0 0 | `layouts__AppLayout.82e9bb98.css` |
| `.specNavTreeHeader-a4zDz_` | height / min-height / padding-left/right / gap | 44px / 44px / 8px / 4px / 8px | `layouts__BasicLayout.bea2f0dc.css` |
| `.all-projects-container-CKLyvV` | width / height | `calc(100vw - 300px)` / `calc(100vh - var(--ui-layout-header-height))` | `p__entry__Main.3e1827b9.css` |

### 1.3 文案（i18n key → 中文）

骨架文案来自 `menu.*` / `aside.*` / `component.globalHeader.*` 键族（`locale.zh-CN.b5edca87b11f70ed.js`）：

| key | 中文 |
|---|---|
| `component.globalHeader.search` | 站内搜索 |
| `component.search` | 搜索 |
| `component.search.noMatch` | 未匹配到相关条目 |
| `menu.projectSettings` | 项目设置 |
| `menu.projectSettings.common` | 通用设置 |
| `menu.projectSettings.common.basic` | 基本设置 |
| `menu.projectSettings.common.members` | 成员管理 |
| `menu.projectSettings.common.featureSetting` | 功能设置 |
| `menu.projectSettings.common.featureSetting.mock` | Mock 设置 |
| `menu.projectSettings.common.notification` | 通知设置 |
| `environment.Management` | 管理环境 |
| `environment.createNew` | 新建环境 |

### 1.4 数据来源与交互

- 当前项目：`localStorage` 键 `Context:currentProject`（REA 分析 `analysis.md` §5 已记录），路由 `/project/:id?`，id 可选。
- 环境列表：`/api/v1/environments`、`/api/v1/environments/ordering`、`/api/v1/environments/duplicate`。
- 页签状态：`LayoutTabBar` 维护打开的 tab 栈；关闭菜单 key 族 `closeTab.all` / `closeTab.selected` / `closeTab.other` / `pinTab.current` / `unpinTab.current`（见 §2.3 panel_api）。
- 主题：`[data-theme=dark]` 覆盖（`async_side_apidoc.01bdbc18.css` 有 `[data-theme=dark] .card-*` 双写示例）。

### 1.5 对 dsh-postapi 的映射建议

**可复用现有类**（`design-tokens.css` 已定义，勿改）：

| Apifox | dsh-postapi 现有类 | 备注 |
|---|---|---|
| `.sider-bxNtfB` | `.pp-sider` | 已 240/20px，`border-right: 1px solid var(--border)` |
| `.ui-menu-item-group-title` | `.pp-sider-group` | 已 `--sider-group-h` + `--sp-3` margin-top |
| `.ui-menu-item` | `.pp-sider-item` | 已 `--sider-item-h` |
| `.layoutTabBar` | `.pp-tabbar` | 已 `--tabbar-h`（44px） |
| `.ui-tabs-tab` | `.pp-tabbar-item` | 已含左 1px 分隔 |
| 顶栏 | `.pp-topbar` / `.pp-topbar-brand` / `.pp-topbar-search` / `.pp-topbar-spacer` / `.pp-crumb` / `.pp-crumb-sep` | 已 `--topbar-h` + `padding: 0 50px` |
| 主体网格 | `.pp-workbench-v2` / `.pp-shell` / `.pp-main-v2` | 已就位 |

**需要新增的类**：

| 需要新增的类名 | 语义 | 期望样式 |
|---|---|---|
| `.pp-tabbar-item[data-active="true"]` | 激活页签 | `border-left/right: 1px solid var(--border); border-bottom-color: transparent;` + `::before { content:""; position:absolute; top:0; left:0; width:100%; height:2px; background: var(--accent); }`，需 `.pp-tabbar-item { position: relative }` 配合 |
| `.pp-tabbar-item + .pp-tabbar-item::before` | 未激活页签之间的 1px 竖线 | `width:1px; height:24px; background: var(--border-strong); position:absolute; left:0; top:50%; transform:translateY(-50%)`；仅当两侧都非激活时显示（可用 `[data-active="true"] + *` 排除） |
| `.pp-tabbar-pin` | 页签固定图标位 | `flex:none; width:12px; height:12px; color: var(--fg-tertiary); margin-left: var(--sp-1)` |

---

## 2. 路由 → 页面 → chunk 总表

| dsh-postapi 路由 | 页面文件 | Apifox 主 chunk（id = name） | 页面 CSS | 本规格节 |
|---|---|---|---|---|
| `#/overview` | `overview.jsx` | 32636 = `async_project_overview` | `async_project_overview.dbd5908b.css` | §3（已完成，指向 `overview-rebuild.md`） |
| `#/doc/:id` | `doc.jsx` | 51863 = `async_doc`（组件实现在 39622）；23168 = `async_panel_api`；14346 = `async_doc_redirect_rules` | `async_doc.7694005c.css` / `async_panel_api.014078b9.css` / `async_doc_redirect_rules.12c2d91e.css` | §4 |
| `#/debug` | `debug.jsx` | 27733 = `async_http_api_case`（JS 内联在 index；组件体在 75562） | `async_http_api_case.4459d613.css` / `75562.06930afc.css` | §5 |
| `#/mock` | `mock.jsx` | 27733 的 mock 子面板（`mockExampleCode`）+ 79800 = mock 规则块 + `panel_settings` 的 Mock 设置 | `79800.4ac1dbcb.css` / `async_panel_settings.b8c96200.css` | §6 |
| `#/schema` | `schema.jsx` | 22718 = `async_data_schema_folder`；39475 = `async_json_editor`；57839 = `async_data_schema` | `async_data_schema_folder.1310deed.css` / `async_json_editor.72baf7ed.css` | §7 |
| `#/env` | `env.jsx` | 11113 = `async_global_component`（`environment-manage-modal-container` 环境管理）；58320 = `async_side_settings` | `async_global_component.f40f381e.css` / `async_side_settings.30c3c6f4.css` | §8 |
| `#/history` | `history.jsx` | 17888 = `async_http_request_history`；61133 = `async_request_history_side`；88598 = `async_request_history_panel` | `async_http_request_history.f1b86d50.css` | §9 |
| `#/test` | `test.jsx` | 44118 = `async_panel_test`；34914 = `async_test_scenario`；25980 = `async_api_test_report_list`；23377 = `async_api_test_report_group`；37914 = `async_test_case_group_run` | 各自同名 css | §10 |
| `#/import` | `import.jsx` | 78203（导入面板 + 预览树）；`exportData.*` 键族在 32636 内 | `78203.83fd9b69.css` | §11 |
| `#/flow` | `flow.jsx` | 34914 = `async_test_scenario`（场景编排） | `async_test_scenario.99d5f5a6.css` | §12 |
| `#/search` | `search.jsx` | 无独立 chunk：搜索面板在 94743 / 49423（`overview-header-container` + `search-arrow`）与 `api.action.processor.Search` | `94743.17ac1c15.css` | §13 |
| `#/settings` | `settings.jsx` | 33943 = `async_panel_settings`；11929 = `p__organization-settings`；9995 = `settings_content`；58320 = `async_side_settings` | `async_panel_settings.b8c96200.css` / `p__organization-settings.6a729b9d.css` | §14 |
| 骨架 | `shell/Body.js` | 93666 / 49423 / 80115 | `layouts__AppLayout.82e9bb98.css` / `layouts__BasicLayout.bea2f0dc.css` / `50278.0c151859.css` | §1 |

## 3. 概览 `#/overview`（chunk 32636 = `async_project_overview`，css `async_project_overview.dbd5908b.css`）

已在 `docs/apifox-research/overview-rebuild.md` 完成拆解与重建，此处只补该文件未覆盖的三项实测值。

### 1. 结构（类名 → 语义）

```
.container-LUodZ0                    内容列：max-width 1200 / margin 0 auto / padding-top 20
├ .card-R2lvj9                       统计卡
│  ├ .card__title-lFTvgU             卡片标题 14px/500
│  ├ .projectSummary__num-GoEUj6     大数字
│  ├ .projectSummary__des-lRYmOn     描述 12px
│  └ .statisticsContainer-vJJN2J     auto-fit minmax(140px,1fr) / gap 16
├ .container-FmdDnj                  模块卡（max-width 640）
│  ├ .counts-Q2yB8W / .count1..3 / .line-ol7fgn
│  └ .functions-VkPW1t → .left-Gj8Uxk / .right-GH0jb9 → .rightAction-CUSGuy
└ .card-WoMhzt → .card__title-t8MpFB / .card__info-a9aCfT / .card__bgIcon-Ez5IlL
```

### 2. 关键 CSS 实测值（本文件新增，补充 overview-rebuild.md）

| 选择器 | 属性 | 值 | 来源 |
|---|---|---|---|
| `.card-WoMhzt` | border-radius / height | `var(--ui-border-radius-lg)`(10px) / 100% | `async_project_overview.dbd5908b.css` |
| `.card__title-t8MpFB` | font-weight / font-size / margin-bottom / display | `--ui-font-weight-semibold`(500) / `--ui-font-size-base`(14px) / 4px / flex | 同上 |
| `.card__infoIcon-nHdgVA` | font-size / margin-right | 14px / 6px | 同上 |
| `.card__bgIcon-Ez5IlL` | opacity / position / bottom / right | .3 / absolute / -28px / -28px | 同上 |
| `.cardShareDoc__title-MZVBDN` | color | `var(--ui-green-9)` | 同上 |
| `.cardShareDoc__btn-ngXt5v` | color / border | `var(--ui-green-6)` / 1px solid `var(--ui-green-2)` | 同上 |
| `.cardAutoImport__title-CK7uxk` | color | `var(--ui-purple-9)` | 同上 |

### 3. 文案（i18n key → 中文）

| key | 中文 |
|---|---|
| `overView.onlineShare` | 分享列表 |
| `overView.usageTips` | 将接口文档以 URL 形式分享出去，方便外部团队在线查看 |
| `overView.newShare` | 新建分享 |
| `overView.publish` | 发布 |
| `overView.autoImport` | 自动导入 |
| `overView.autoImport.usageTips` | 自动将 OpenAPI（Swagger）或 apiDoc 格式的在线 URL 接口数据定时导入到 {appName}。 |
| `overView.importNow` | 立即导入 |
| `overView.codeGenerate` | 代码生成 |
| `overView.accessLink` | 链接: {url}  访问密码: {password} |
| `overView.isCopied` / `overView.CopingInProgress` / `overView.failToCopied` | 已复制 / 复制中 / 复制失败，请手动复制 |
| `overView.syncImportSuccess` | 同步导入数据成功 |

### 4. 数据来源与交互

- `/api/v1/project-states?moduleId=`（计数条三块数字的唯一来源，不是本地估算）
- `/api/v1/shared-docs`（分享列表）、`/api/v1/auto-import-settings`（自动导入）、`/api/v1/export-data`（代码生成/导出）
- 当前项目：`localStorage` 的 `Context:currentProject`；无项目时渲染引导态

### 5. 对 dsh-postapi 的映射建议

**可复用现有类**：`.pp-overview-head` / `.pp-overview-title` / `.pp-overview-actions` / `.pp-overview-content` / `.pp-ov-summary` / `.pp-ov-summary-num` / `.pp-ov-summary-desc` / `.pp-stats` / `.pp-stat` / `.pp-stat-value` / `.pp-stat-label` / `.pp-ov-modules` / `.pp-ov-counts` / `.pp-ov-count` / `.pp-ov-count-num` / `.pp-ov-count-label` / `.pp-ov-divider` / `.pp-ov-functions` / `.pp-ov-left` / `.pp-ov-right` / `.pp-ov-action` / `.pp-ov-cards` / `.pp-ov-card` / `.pp-ov-card-title` / `.pp-ov-card-info` / `.pp-overview-grid`。

**需要新增的类**：无（概览页类已齐备；若补 `.card__bgIcon` 右下水印，用 `.pp-ov-card` 的 `::after` 实现即可，不必新增类）。

---

## 4. 文档 `#/doc/:id`（chunk 51863 = `async_doc`（组件在 39622）；23168 = `async_panel_api`；14346 = `async_doc_redirect_rules`，css `async_doc.7694005c.css` / `async_panel_api.014078b9.css` / `async_doc_redirect_rules.12c2d91e.css`）

### 1. 结构（类名 → 语义，缩进表示嵌套）

```
.doc-container-qAT1NT                 文档页外壳：width 100% / overflow-y hidden
└ .overview-container-rXgCmv         复用概览页容器（文档页与概览页共用同一套头部/内容）
   ├ .overview-header-container-KvD3qB   页头：border-bottom 1px split / max-width 1512 / padding 16 20 16 14
   │  ├ .overview-header__title-QwLVPE   标题：18px / 700 / 省略号 / margin-right auto
   │  ├ .overview-header__visibility-LnJ5P6  可见性下拉（.ui-select-selection-item padding-right 0）
   │  └ .overview-header-actions-HCFzN9  动作区：inline-flex / height 32 / space-between
   └ .overview-content-XXx2Nf           内容区：padding 16 / overflow-y auto
      └ bytemd 编辑器（.bytemd / .bytemd-toolbar / .bytemd-status / .bytemd-preview / .bytemd-sidebar）
         └ .CodeMirror（.cm-header 等）
.docTagsPopoverContainer-jn22kj      标签弹层内容：flex / wrap / gap 8
```

文档重定向规则（14346）结构：`.table` → `.ui-drawer` → `.slug-form-item` → `.slug-form-item-conflict` → `.destination-resource-tree`。

### 2. 关键 CSS 实测值

| 选择器 | 属性 | 值 | 来源 |
|---|---|---|---|
| `.doc-container-qAT1NT` | width / overflow-y | 100% / hidden | `async_doc.7694005c.css` |
| `.overview-header-container-KvD3qB` | border-bottom / max-width / padding | 1px solid split / 1512px / **16px 20px 16px 14px** | 同上 |
| `.overview-header__title-QwLVPE` | font-size / font-weight / margin-right / 溢出 | **18px** / **700** / auto / nowrap+ellipsis | 同上 |
| `.overview-header__visibility-LnJ5P6 .ui-select-selection-item` | padding-right | 0 !important | 同上 |
| `.overview-header-actions-HCFzN9` | display / height / justify-content | inline-flex / **32px** / space-between | 同上 |
| `.overview-content-XXx2Nf` | padding / overflow-y | **16px** / auto | 同上 |
| `body .bytemd` | height / border-top | 100% / 1px solid `--md-color-border` | 同上 |
| `body .bytemd-toolbar` | border-bottom | 1px solid `--md-color-border` | 同上 |
| `body .bytemd-toolbar .tippy-box` | border-radius / min-width | `--ui-border-radius-lg`(10px) / 120px | 同上 |
| `body .bytemd-toolbar-icon-more` | color / padding / line-height | #52c41a / 0 6px / 24px | 同上 |
| `body .bytemd-preview` | border-left | 1px solid `--md-color-border` | 同上 |
| `.docTagsPopoverContainer-jn22kj` | flex-wrap / gap | wrap / 8px | 同上 |
| `.slug-form-item`（doc_redirect） | — | 该 css 仅 613 B，规则全部作用于 `.ui-form-item-control` 间距 | `async_doc_redirect_rules.12c2d91e.css` |

### 3. 文案（i18n key → 中文）

| key | 中文 |
|---|---|
| `doc.constant.defaultName` | 未命名文档 |
| `doc.documentation` / `doc.documentation.modify` | 文档 / 编辑 |
| `doc.action.edit` / `doc.action.submit` / `doc.action.exitEdit` | 编辑 / 保存 / 退出编辑 |
| `doc.editor.notSave.title` / `.content` | 有修改的内容未保存 / 确定退出编辑? |
| `message.updateFailure` | 修改出错 |
| `doc.SidebarTitle` | 目录树中显示的名称 |
| `doc.sidebarTitle.description` | 如果你希望目录树中显示的名称和文档标题不一样，可在此处选择"自定义"进行设置 |
| `doc.UseDocumentTitle` / `doc.CustomTitle` | 使用文档标题 / 自定义 |
| `doc.AddTag` | 添加标签 |
| `comments.comments` | 评论 |
| `seo.setting` | SEO 设置 |
| `specs.jumpToSpec.error` | 跳转到规范文件失败 |
| `apiDoc.publishSettings.redirectRules.title` | 文档重定向规则 |
| `apiDoc.publishSettings.docRedirectRules.source.slug` | 源 slug |
| `apiDoc.publishSettings.docRedirectRules.destination.resource` | 目标资源 |
| `apiDoc.publishSettings.docRedirectRules.emptyState.redirectRules` | 暂无重定向规则 |
| `apiDoc.publishSettings.docRedirectRules.button.newRedirectRule` | 新建重定向规则 |
| `seo.custom.url.rule.tip` | URL Slug 只能包含小写字母、数字、横线、下划线、斜杠 |

### 4. 数据来源与交互

- `/api/v1/doc`（单文档读写）、`/api/v1/docs`（文档树）、`/api/v1/doc/upload-image`（图片上传）、`/api/v1/doc-duplicate`
- 编辑态：`doc.action.edit` → 保存走 `/api/v1/doc` PATCH；未保存退出时用 `doc.editor.notSave.*` 两段式确认
- 标签：`doc.AddTag` + `.docTagsPopoverContainer`；可见性：`.overview-header__visibility` 下拉
- 重定向规则：`/api/v1/shared-docs` 关联的发布设置，源 slug 唯一性校验（`.slug-form-item-conflict`）

### 5. 对 dsh-postapi 的映射建议

**可复用现有类**：`.pp-page` / `.pp-page-flush` / `.pp-split`（左树右正文）/ `.pp-doc-main` / `.pp-doc-head` / `.pp-doc-title` / `.pp-doc-h1` / `.pp-doc-h2` / `.pp-doc-h3` / `.pp-doc-section` / `.pp-anchor-bar` / `.pp-anchor-chip` / `.pp-md-list` / `.pp-pre` / `.pp-pre-scroll` / `.pp-toolbar-inline` / `.pp-group-title` / `.pp-url-row` / `.pp-url-pill` / `.pp-send-group` / `.pp-textarea` / `.pp-pill` / `.pp-pill-accent` / `.pp-overview-actions`。

**需要新增的类**：

| 需要新增的类名 | 语义 | 期望样式 |
|---|---|---|
| `.pp-doc-visibility` | 页头可见性下拉槽 | `flex: none; width: 120px;`（对齐 Apifox `.overview-header__visibility` 的紧凑下拉） |
| `.pp-doc-tag-pop` | 标签弹层内容容器 | `display: flex; flex-wrap: wrap; gap: var(--sp-2); padding: var(--sp-2);`（对应 `.docTagsPopoverContainer`） |
| `.pp-doc-tag-chip` | 单个标签胶囊 | `display: inline-flex; align-items: center; height: var(--pill-h); padding: 0 var(--sp-2); font-size: var(--fs-12); border: 1px solid var(--border-strong); border-radius: var(--radius-pill);` |
| `.pp-editor-shell` | Markdown 编辑器外壳（bytemd 对应物） | `display: flex; flex-direction: column; height: 100%; border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden;` |
| `.pp-editor-toolbar` | 编辑器工具条 | `display: flex; align-items: center; gap: var(--sp-1); height: var(--ctl-h-lg); padding: 0 var(--sp-2); border-bottom: 1px solid var(--border);` |
| `.pp-editor-status` | 编辑器状态条 | `display: flex; align-items: center; justify-content: flex-end; height: var(--ctl-h-sm); padding: 0 var(--sp-2); font-size: var(--fs-12); color: var(--fg-tertiary); border-top: 1px solid var(--border);` |

---

## 5. 调试台 `#/debug`（chunk 27733 = `async_http_api_case`（JS 内联 index，组件体在 75562），css `async_http_api_case.4459d613.css` + `75562.06930afc.css`）

### 1. 结构（类名 → 语义，缩进表示嵌套）

```
.apiCase-CnGjmI                       整页：width/height 100% / padding 10 / overflow auto
├ .main-input-bar                     请求行：display flex / position sticky / top 0 / z-index 9
│  ├ .url-col                         URL 胶囊容器（新版 32px / 经典 40px，两版并存）
│  │  ├ .url-col-method               method 前缀
│  │  ├ .url-col-base-url             环境前置 URL 胶囊
│  │  └ .url-col-path                 路径胶囊
│  └ .action-col                      动作列：flex none / min-width 75 / margin-left 10
│     └ .send-btn                     发送组：主按钮 calc(100% - 25px) + 25px 下拉
├ .apiDebug-wciE_S                    调试主体（history 页复用同一套）
│  └ .topBar-xk8hJs                   sticky 顶栏：z-index 9 / width 100%
│     ├ .topFormWrap-pKpKjt           表单包裹 → .formItem-WOSzs4（margin-bottom 0/6）
│     └ .actions-wrap                 .save-button / .run-button / .more-button 各 width 105 / margin-left 10
├ .tabBar-UlXIwQ                      请求页签条：height 40 / border-bottom 1px split
├ .responseTable-zivs7L               响应表
└ 分组标题 .group-title               border-left 3px 主色 / margin-left 2 / padding-left 10 / font-size 16
```

### 2. 关键 CSS 实测值

| 选择器 | 属性 | 值 | 来源 |
|---|---|---|---|
| `.apiCase-CnGjmI` | width / height / padding / overflow | 100% / 100% / **10px** / auto | `75562.06930afc.css` |
| `.apiCase-CnGjmI .main-input-bar` | background / display / top | `var(--ui-component-background)` / flex / 0 | 同上 |
| `.apiCase-CnGjmI .main-input-bar .url-col` | height / flex / width / overflow | **40px** / auto / 100% / hidden | 同上 |
| `.url-col-method` | padding / line-height | **0 8px 0 12px** / **40px** | 同上 |
| `.url-col-base-url`,`.url-col-path` | border-radius / margin / padding / line-height | 6px / **5px** / **0 10px** / **28px** | 同上 |
| `.main-input-bar .action-col` | flex / min-width / margin-left | none / **75px** / **10px** | 同上 |
| `.main-input-bar .action-send` | width | **95px** | 同上 |
| `.send-btn > button.ui-btn:first-child` | width | `calc(100% - 25px)` | 同上 |
| `.send-btn button.ui-btn.ui-btn-icon-only:last-child` | width / border-left | 25px / 1px solid #00000012 | 同上 |
| `.no-response-wrap` | padding | 20px | 同上 |
| `.ui-spin.ui-spin-spinning` | max-height | 200px | 同上 |
| `.container-ZbOHiC .main-input-bar` | padding / position / top / z-index | **12px 20px** / sticky / 0 / 9 | `async_http_api_case.4459d613.css` |
| `.container-ZbOHiC .url-col` | height / border-radius / padding / gap / background | **32px** / `var(--aui-radius-md)`(8px) / **4px** / **4px** / `var(--ui-fill-3)` | 同上 |
| `.container-ZbOHiC .url-col[data-focused=true]` | border-color / background | `var(--ui-primary-color)` / `var(--ui-input-bg)` | 同上 |
| `.container-ZbOHiC .url-col-method` | padding / border-radius | **1px 8px** / 4px | 同上 |
| `.container-ZbOHiC .url-col-base-url`,`.url-col-path` | height / font-size | **32px** / 14px | 同上 |
| `.container-ZbOHiC .send-btn button.ui-btn:first-child` | width | `calc(100% - 28px)` | 同上 |
| `.container-ZbOHiC .action-col` | margin-left | 8px | 同上 |
| `.group-title` | border-left / margin-left / padding-left / font-size | **3px solid 主色** / 2px / **10px** / **16px** | `75562.06930afc.css`（`.container-nnioQJ`/`.container-Se57bt` 作用域） |
| `.tabBar-UlXIwQ` | height / border-bottom / align-items | **40px** / 1px split / center | `async_http_api_case.4459d613.css` |
| `.json-viewer__btn-XWfdxG` | width / height / border-radius | **24px** / **24px** / 6px | 同上 |
| `.action-qW72Ta` | width / height / border-radius | **24px** / **24px** / 6px | 同上 |
| `.tooltip-TLRiNe` | `--ui-tooltip-max-width` / font-size / line-height | **336px** / 14px / 22px | 同上 |
| `.overlay-nuZkLR` | min-width / max-width | **335px** / **400px** | 同上 |
| `.tips-sQEkfB` | font-size / line-height / margin-bottom | 14px / 22px / **20px** | 同上 |
| `.dashLine-z_BoRo` | border-top / width / height / margin | 1px dashed / 100% / 1px / 8px 0 | 同上 |
| `.wrapper-p5N9xF` | border / border-radius | 1px solid `var(--ui-border-color-split,#f2f4f7)` / 8px | 同上 |

**两版 URL 行的差异（重要）**：`75562.06930afc.css` 是 40px 单色行 + 28px 胶囊（旧版）；`async_http_api_case.4459d613.css` 的 `.container-ZbOHiC` 是 32px 灰底胶囊容器（`--ui-fill-3`）+ 内嵌 32px 胶囊 + focus 换主色边框（新版）。dsh-postapi 的 `.pp-url-row`（`min-height: var(--ctl-h-lg)` = 40px）目前对齐旧版，若要复刻新版需把行高降到 32px 并把 method/baseUrl/path 收进一个灰底容器。

### 3. 文案（i18n key → 中文）

| key | 中文 |
|---|---|
| `apiCase.message.notSelectEnvironment` | 请先选择环境 |
| `processor.label.assertion.add` | 添加断言 |
| `processor.label.extraVariable` | 提取变量 |
| `apiTest.label.successExample` / `.exceptionExample` | 成功示例 / 异常示例 |
| `api.label.dataConstruct` | 数据结构 |
| `api.label.responses` / `api.label.responseExamples` | （响应 / 响应示例，键族在 api.*） |
| `response.label.code` / `.name` / `.contentType` | HTTP 状态码 / 名称 / 内容格式 |
| `response.label.codeIncorrect` | 请输入 1-9 位数字的正确 HTTP 状态码 |
| `apiTest.extractResponse.success.message` | 提取成功 |
| `apiTest.extractResponse.sse.extractPartial` | 仅提取部分消息 |
| `copyForAI.instruction` | 请根据以上信息，分析报错原因，修复相关代码 |
| `copyForAI.success` | 已复制调试信息 |
| `validate.messageWith` / `validate.messageWith.select` | 请输入{name} / 请选择{name} |
| `apiCase.action.saveAsCase` | 保存为用例 |
| `apiTestCase.title.saveApi` | 保存为接口 |
| `apiCase.label.caseName` / `apiCase.validate.name.message` | 用例名称 / 用例名不能为空 |
| `apiCase.label.saveResponse` | 同时保存响应 |
| `message.cURlFormatError` | cURL 命令有误 |
| `quickDebug.placeHolder.error` / `.detail` | URL格式不正确 , {detail} / 输入 http 或 https 起始的完整 URL |
| `message.hasNoBodyParameter` | 该请求没有 Body |

### 4. 数据来源与交互

- 发送：`/api/v1/http-requests`（快捷请求）；保存为用例：`/api/v1/api-cases`；保存为接口：`/api/v1/api-details`
- 环境：`/api/v1/environments`；前置 URL 来自环境 `servers`（`.url-col-base-url`）
- 断言/提取：处理器定义走 `/api/v1/api-case-scripts`；SSE 部分提取由 `apiTest.extractResponse.sse.*` 控制
- 响应示例提取：`apiTest.extractResponse.overwriteResponse` / `overwriteExample` → 写回 `/api/v1/api-responses`

### 5. 对 dsh-postapi 的映射建议

**可复用现有类**：`.pp-debug-page` / `.pp-debug-split` / `.pp-debug-request` / `.pp-debug-response` / `.pp-debug-meta` / `.pp-debug-tabbody` / `.pp-pane` / `.pp-url-row` / `.pp-url-method` / `.pp-url-pill` / `.pp-url-pill-grow` / `.pp-send-group` / `.pp-group-title` / `.pp-group-head` / `.pp-form-row` / `.pp-form-label` / `.pp-table` / `.pp-table-wrap` / `.pp-table-params` / `.pp-cell-input` / `.pp-tabs` / `.pp-tab` / `.pp-note` / `.pp-note-warn` / `.pp-note-bad` / `.pp-method` / `.pp-mono` / `.pp-ellipsis` / `.pp-btn-link`。

**需要新增的类**：

| 需要新增的类名 | 语义 | 期望样式 |
|---|---|---|
| `.pp-url-bar` | 新版 URL 行外壳（灰底胶囊容器） | `display: flex; align-items: center; gap: var(--sp-1); height: var(--ctl-h); padding: var(--sp-1); background: var(--bg-subtle); border: 1px solid var(--border); border-radius: var(--radius-card); transition: border-color .2s ease-in-out;` |
| `.pp-url-bar[data-focused="true"]` | 聚焦态 | `border-color: var(--accent); background: var(--bg-surface);` |
| `.pp-url-bar-method` | 新版 method 前缀胶囊 | `flex: none; padding: 1px var(--sp-2); border-radius: var(--radius-sm); background: var(--bg-hover);` |
| `.pp-send-split` | 发送按钮组（主按钮 + 25/28px 下拉） | `.pp-send-split > .pp-btn:first-child { width: calc(100% - 25px); } .pp-send-split > .pp-btn:last-child { width: 25px; border-left: 1px solid var(--border); }` |
| `.pp-response-bar` | 响应区顶栏（状态码 + 耗时 + 大小） | `display: flex; align-items: center; gap: var(--sp-2); min-height: var(--ctl-h); padding: 0 var(--sp-2); border-bottom: 1px solid var(--border);` |
| `.pp-json-viewer-btn` | JSON 视图 24×24 图标按钮 | `display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: var(--radius-sm); color: var(--fg-secondary);` |
| `.pp-dashline` | 虚线分隔（1px dashed，上下 8px） | `border-top: 1px dashed var(--border); width: 100%; height: 1px; margin: var(--sp-2) 0; box-sizing: border-box;` |

---
## 6. Mock `#/mock`（chunk 27733 的 mock 子面板 + 79800 mock 规则块 + `panel_settings` 的 Mock 设置，css `79800.4ac1dbcb.css` / `async_http_api_case.4459d613.css` / `async_panel_settings.b8c96200.css`）

### 1. 结构（类名 → 语义）

```
.mock-collapse-f_zKpF                  Mock 折叠面板：font-weight 400 / 内容区 padding 0
└ .ui-collapse-item > .ui-collapse-header   header：width fit-content / color 次级 / padding 0 32 0 0
.mockExampleCode-G6uQuM               Mock 示例代码入口：color 主色
.mockTips-OfhznI                      Mock 空态：flex column / 居中 / padding 40 0
.editableTableMockList-whsZri         表格内 Mock 列表
├ .editableTableMockListButton-5s7BEq 行内按钮：默认 display none
└ tr:hover .editableTableMockListButton   hover 时 display block
```

项目设置里的 Mock 设置（`menu.projectSettings.common.featureSetting.mock`）：基础设置（Mock 引擎库 / 默认 Mock 方式 / Faker.js 默认语言 / 时间设置）+ 智能 Mock 匹配规则 + 云端 Mock 设置 + 服务端 Mock 设置。

### 2. 关键 CSS 实测值

| 选择器 | 属性 | 值 | 来源 |
|---|---|---|---|
| `.mock-collapse-f_zKpF` | font-weight | `var(--ui-font-weight-400)` | `79800.4ac1dbcb.css` |
| `.mock-collapse-f_zKpF .ui-collapse-content-box` | padding | 0 !important | 同上 |
| `.mock-collapse-f_zKpF .ui-collapse-item > .ui-collapse-header` | width / color / padding | fit-content / `var(--ui-text-color-secondary)` / **0 32px 0 0** | 同上 |
| `.mockExampleCode-G6uQuM` | color | `var(--ui-primary-color)` | 同上 |
| `.mockTips-OfhznI` | padding / display / 居中 | **40px 0** / flex / column + center | 同上 |
| `.editableTableMockList-whsZri tr:hover .editableTableMockListButton` | display | block !important | 同上 |
| `.editableTableMockListButton-5s7BEq` | display | none（默认） | 同上 |

### 3. 文案（i18n key → 中文）

| key | 中文 |
|---|---|
| `mock.service.canNotCopy` | Mock 服务不可复制 |
| `mock.service.canNotDelete` | Mock 服务不可删除 |
| `mock.httpApiMock.tab.body` / `.headers` / `.settings` | Body / Headers / 更多设置 |
| `environment.item.localMock` / `.label` | 本地 Mock / Mock |
| `environment.item.cloudMock` | 云端 Mock |
| `environment.item.serverMock` | 服务端 Mock |
| `environment.Mock` | Mock环境 |
| `menu.projectSettings.common.featureSetting.mock` | Mock 设置 |
| `menu.projectSettings.common.featureSetting.mock.baseSettings` | 基础设置 |
| `menu.projectSettings.common.featureSetting.mock.selectEngine` | Mock 引擎库 |
| `menu.projectSettings.common.featureSetting.mock.mockType` | 默认 Mock 方式 |
| `menu.projectSettings.common.featureSetting.mock.mockType.smartMockFirst` | 智能 Mock 优先 |
| `menu.projectSettings.common.featureSetting.mock.mockType.smartMockFirstTip` | 接口 Mock 引擎生效顺序：高级 Mock 期望 > 智能 Mock |
| `menu.projectSettings.common.featureSetting.mock.mockType.responseExampleFirst` | 响应示例优先 |
| `menu.projectSettings.common.featureSetting.mock.mockType.responseExampleFirstTip` | 接口 Mock 引擎生效顺序：高级 Mock 期望 > 响应示例 > 智能 Mock |
| `menu.projectSettings.common.featureSetting.mock.fakerLocale` | Faker.js 默认语言 |
| `menu.projectSettings.common.featureSetting.mock.timeSettings.format` | 默认时间格式 |
| `menu.projectSettings.common.featureSetting.mock.timeSettings.timezone` | 默认时区 |
| `menu.projectSettings.common.featureSetting.mockRules` | 智能 Mock 匹配规则 |
| `environment.web.mockServer.disabled` | WEB 版暂不支持 Mock 服务，请下载桌面版使用 |

### 4. 数据来源与交互

- Mock 规则 CRUD：`/api/v1/api-mocks`、`/api/v1/api-mocks-ordering`、`/api/v1/duplicate-api-mocks`
- Mock 服务：本地 Mock 走 renderer 内进程；云端/服务端 Mock 由 `/api/v1/gateways` 与项目设置驱动
- 生效顺序由 `mockType` 决定（smartMockFirst / responseExampleFirst），期望匹配优先于两者
- Faker 语言与时区来自项目级设置，影响智能 Mock 生成值

### 5. 对 dsh-postapi 的映射建议

**可复用现有类**：`.pp-mock-layout` / `.pp-mock-side` / `.pp-panel` / `.pp-tree` / `.pp-tree-group` / `.pp-tree-row` / `.pp-card` / `.pp-card-title` / `.pp-form-grid` / `.pp-form-label` / `.pp-input` / `.pp-input-mono` / `.pp-input-sm` / `.pp-group-title` / `.pp-pre` / `.pp-table` / `.pp-table-wrap` / `.pp-cell-input` / `.pp-btn-ghost` / `.pp-btn-danger` / `.pp-table-add` / `.pp-note` / `.pp-overview-head` / `.pp-overview-title` / `.pp-overview-actions` / `.pp-overview-content`。

**需要新增的类**：

| 需要新增的类名 | 语义 | 期望样式 |
|---|---|---|
| `.pp-mock-code` | Mock 示例代码入口（主色文字按钮） | `display: inline-flex; align-items: center; height: var(--ctl-h-sm); color: var(--accent); background: transparent; border: none; cursor: pointer;` |
| `.pp-mock-empty` | Mock 空态（居中 40px 上下留白） | `display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--ctl-h-lg) 0;` |
| `.pp-mock-row-action` | 表格行内 Mock 动作按钮 | `display: none; ` + 父行 `tr:hover` 时 `display: inline-flex`（`.pp-table tbody tr:hover .pp-mock-row-action { display: inline-flex; }`） |

---

## 7. 数据结构 `#/schema`（chunk 22718 = `async_data_schema_folder`；39475 = `async_json_editor`；57839 = `async_data_schema`，css `async_data_schema_folder.1310deed.css` / `async_json_editor.72baf7ed.css`）

### 1. 结构（类名 → 语义，缩进表示嵌套）

```
.mainTabs-duT_o3                      目录设置页签：height 100% / margin 0
└ .content-PEa5n_                     内容列：max-width 640 / margin 20 0
   ├ .content__block-da9J66            区块：margin-bottom 20
   │  ├ .content__block__title-In0EcA  区块标题：14px→--ui-font-size-lg(16px) / semibold / margin-bottom 20
   │  ├ .content__block__sub-title-hF5Omz  副标题：14px / margin-bottom 6
   │  └ .content__block__description-dtAZ0l  说明：12px / 次级色
   ├ .content__basic-ZnsPUE            基本信息（.ui-form-item-label + .ui-form-item）
   │  └ .content__basic__description-dpBWDh  描述输入：filled bg / 无边框 / min-height 44
   ├ .content__doc-IQrXhH              文档块：--ui-fill-3 底 / radius 8 / padding 16 / gap 16
   │  └ .content__doc__field-title-P3ZKSf   字段标题 14px / line-height 22
   ├ .content__expand-mode__label-kBosvv     展开模式标签
   │  ├ .content__expand-mode__expand-w94GBj  展开文字 14px / line-height 20
   │  └ .content__expand-mode__popup-uB1qOy   弹出选项
   │     └ .content__expand-mode__popup__icon-A33BB5  图标 42×42
   ├ .content__server-select-Bu9qx3    服务选择胶囊：--ui-fill-4 底 / radius 14 / padding 6
   ├ .content__alert-rjlUY5            提示块：1px 边框 / padding 16 20 20 / margin-top 30
   ├ .base-settings__badge-G5VMEV      徽标点：主色
   └ .popover-editor-jheqYp            悬浮编辑钮：18×18 / radius 2 / 绝对定位 top 4 right 4
```

JSON 编辑器（39475）：`.container-SyoA8q`（collapse 透明）→ `.form-item-fJieGj`（margin-bottom 8）/ `.container-AJDpEm`（表单项 margin-bottom 8、label 左对齐）。

### 2. 关键 CSS 实测值

| 选择器 | 属性 | 值 | 来源 |
|---|---|---|---|
| `.content-PEa5n_` | max-width / margin | **640px** / **20px 0** | `async_data_schema_folder.1310deed.css` |
| `.content__block-da9J66` | margin-bottom | **20px** | 同上 |
| `.content__block__title-In0EcA` | font-size / font-weight / margin-bottom | `--ui-font-size-lg`(**16px**) / semibold(500) / **20px** | 同上 |
| `.content__block__sub-title-hF5Omz` | font-size / margin-bottom | **14px** / **6px** | 同上 |
| `.content__block__description-dtAZ0l` | font-size / color | **12px** / 次级 | 同上 |
| `.content__basic__description-dpBWDh` | min-height / border-color | **44px** / transparent | 同上 |
| `.content__doc-IQrXhH` | padding / gap / border-radius | **16px** / **16px** / **8px** | 同上 |
| `.content__doc__field-title-P3ZKSf` | font-size / line-height / margin-bottom | 14px / **22px** / 4px | 同上 |
| `.content__expand-mode__expand-w94GBj` | font-size / line-height | 14px / **20px** | 同上 |
| `.content__expand-mode__popup__icon-A33BB5` | width / height | **42px** / **42px** | 同上 |
| `.content__server-select-Bu9qx3` | border-radius / padding / margin-top | **14px** / **6px** / **8px** | 同上 |
| `.content__alert-rjlUY5` | border / padding / margin-top | 1px solid alert-help / **16px 20px 20px** / **30px** | 同上 |
| `.circle` | min-width/min-height / padding / font-size / line-height / border-radius | **16px** / 0 4px / **12px** / **16px** / 100px | 同上 |
| `.popover-editor-jheqYp` | width / height / border-radius / top / right | **18px** / **18px** / **2px** / **4px** / **4px** | 同上 |
| `.mainTabs-duT_o3` | height / margin | 100% / 0 | 同上 |
| `.form-item-fJieGj` | margin-bottom | **8px** | `async_json_editor.72baf7ed.css` |
| `.container-AJDpEm .ui-form-item-label` | text-align | left | 同上 |

### 3. 文案（i18n key → 中文）

| key | 中文 |
|---|---|
| `api.management.tabTitle.basic` | 基本信息 |
| `api.management.tabTitle.group` | 目录设置 |
| `api.management.groupItem` | 目录名称 |
| `api.management.groupRules` | 目录名称不能为空 |
| `api.management.tabTitle.basic.folderId` | 目录ID |
| `api.management.tabTitle.basic.update` | 更新 |

### 4. 数据来源与交互

- 目录 CRUD：`/api/v1/api-schema-folders`、`/api/v1/api-schema-folders/duplicate`、`/api/v1/schema-tree-list/ordering`
- 模型：`/api/v1/api-schemas`、`/api/v1/schemas-tree-list`、`/api/v1/duplicate-api-schema`
- 展开模式（`.content__expand-mode__*`）控制结构在文档中的默认展开层级；目录 ID 只读展示
- JSON 编辑器（39475）负责字段级 schema 编辑，输出被 `/api/v1/api-schemas` 接受

### 5. 对 dsh-postapi 的映射建议

**可复用现有类**：`.pp-debug-layout`（左树右详情）/ `.pp-panel` / `.pp-env-side-head` / `.pp-card-title` / `.pp-tree` / `.pp-tree-group` / `.pp-tree-row` / `.pp-pane` / `.pp-io-head` / `.pp-io-title` / `.pp-seg` / `.pp-form-grid` / `.pp-form-label` / `.pp-input` / `.pp-json-editor` / `.pp-table` / `.pp-table-wrap` / `.pp-table-wide` / `.pp-table-mono` / `.pp-pill` / `.pp-toolbar` / `.pp-toolbar-inline` / `.pp-toolbar-spacer` / `.pp-note` / `.pp-note-bad` / `.pp-note-ok` / `.pp-pre` / `.pp-pre-scroll` / `.pp-btn-sm` / `.pp-btn-ghost` / `.pp-btn-accent` / `.pp-btn-primary` / `.pp-btn-danger`。

**需要新增的类**：

| 需要新增的类名 | 语义 | 期望样式 |
|---|---|---|
| `.pp-form-block` | 表单区块（对应 `.content__block`） | `margin-bottom: var(--sp-5);`（20px） |
| `.pp-form-block-title` | 区块标题 | `font-size: var(--fs-16); font-weight: var(--fw-medium); margin-bottom: var(--sp-5);` |
| `.pp-form-block-subtitle` | 区块副标题 | `font-size: var(--fs-14); margin-bottom: var(--sp-1);` |
| `.pp-form-block-desc` | 区块说明 | `font-size: var(--fs-12); color: var(--fg-secondary);` |
| `.pp-field-filled` | filled 风格描述输入（无边框 + 底色） | `min-height: calc(var(--row-h) + var(--sp-3)); background: var(--bg-subtle); border-color: transparent; padding: var(--sp-2) var(--sp-3);` |
| `.pp-doc-block` | 灰底文档块 | `display: flex; flex-direction: column; gap: var(--sp-4); padding: var(--sp-4); background: var(--bg-subtle); border-radius: var(--radius-card);` |
| `.pp-chip` | 计数小胶囊（`.circle` 对应物） | `display: inline-flex; align-items: center; justify-content: center; min-width: 16px; min-height: 16px; padding: 0 var(--sp-1); margin-left: var(--sp-1); font-size: var(--fs-12); line-height: 16px; border-radius: var(--radius-pill); background: var(--bg-hover);` |
| `.pp-popover-edit` | 悬浮编辑钮（18×18 绝对定位） | `position: absolute; top: var(--sp-1); right: var(--sp-1); width: 18px; height: 18px; border-radius: 2px;` |

---

## 8. 环境 `#/env`（chunk 11113 = `async_global_component`（`environment-manage-modal-container`）；58320 = `async_side_settings`，css `async_global_component.f40f381e.css` / `async_side_settings.30c3c6f4.css`）

### 1. 结构（类名 → 语义）

```
.environment-manage-modal-container    环境管理弹层外壳（背景 --ui-body-background）
├ .side-menu                          左侧环境列表
│  └ .environment-menu-item           条目：radius 8 / padding 4 8 4 4
│     ├ .menu-item-left-icon          左图标：opacity .2（hover .5）
│     ├ .drag-handler                 拖拽柄：hover 时 opacity .56
│     ├ .tree-node-action-item        行内动作：28×28 / 默认 display none / hover 显示
│     └ .selected                     选中态：menu-highlight 色 + item-active 底
├ .servers-kWhRu0                     前置 URL 区（label width 100%）
│  └ .server-pcM1QV                   server 行：14px / flex
│     ├ .protocol-hbUjGM              协议：无右框 / padding 0
│     ├ .protocolSeparator-znzxLK     分隔：max-width 32 / padding 0
│     ├ .portSeparator-l_JgjI         端口分隔：max-width 20
│     └ .portInput-RBWohI             端口输入：width fit-content
├ .variables-L1AYo1                   变量表区（label width 100%）
│  └ .environment-variable-name-input-group-qq8LCW   变量名输入组（相对定位，warning 图标绝对右上）
├ .environment-radio-colors           颜色选择：grid auto-fill 32px / gap 12
│  └ .environment-radio-color         32×32 圆形色块 / transition color .24s
└ .environment-tag-lsz_ed             环境标签胶囊：margin-right 4
```

### 2. 关键 CSS 实测值

| 选择器 | 属性 | 值 | 来源 |
|---|---|---|---|
| `.environment-manage-modal-container .side-menu .environment-menu-item` | border-radius / padding | `var(--ui-border-radius-base)`(8px) / **4px 8px 4px 4px** | `async_global_component.f40f381e.css` |
| `.environment-menu-item:hover` | background-color | `var(--ui-legacy-bg-300)` | 同上 |
| `.environment-menu-item .menu-item-left-icon` | opacity（常态 / hover） | **.2** / **.5** | 同上 |
| `.environment-menu-item:hover .drag-handler` | opacity | **.56** | 同上 |
| `.environment-menu-item .tree-node-action-item` | width / height / display | **28px** / **28px** / none（hover 显示） | 同上 |
| `.environment-radio-colors` | grid-template-columns / gap | `repeat(auto-fill,32px)` / **12px** | 同上 |
| `.environment-radio-color` | width / height / border-radius / transition | **32px** / **32px** / 50% / color .24s | 同上 |
| `.environment-variable-name-input-group-qq8LCW .warning-icon-hdRKYR` | height / right / display | **32px** / **5px** / none（出错时显示） | 同上 |
| `.servers-kWhRu0 label`,`.variables-L1AYo1 label` | width | 100% | 同上 |
| `.environment-tag-lsz_ed` | margin-right | 4px !important | 同上 |
| `.server-pcM1QV` | font-size / line-height / display | **14px** / **22px** / flex | 同上 |
| `.server-dElMV3` | font-size / line-height | **12px** / **20px** | 同上 |
| `.server-pcM1QV .protocolSeparator-znzxLK` | max-width / padding | **32px** / 0 | 同上 |
| `.server-pcM1QV .portSeparator-l_JgjI` | max-width / padding | **20px** / 0 | 同上 |
| `.environment-modal-title` | line-height | **32px** | 同上 |
| `.container-eXQ_D9 .ui-menu-inline > .ui-menu-item` | height / margin / line-height | **32px** / 0 0 4px / 32px | `async_side_settings.30c3c6f4.css` |
| `.container-eXQ_D9 .ui-menu-sub.ui-menu-inline > .ui-menu-item` | width / height | `calc(100% - 24px)` / 32px | 同上 |
| `.container-eXQ_D9 .icon-sub-menu-RGPhhL` | color / transition | `var(--ui-disabled-color)` / transform .3s cubic-bezier(.645,.045,.355,1) | 同上 |

### 3. 文案（i18n key → 中文）

| key | 中文 |
|---|---|
| `environment.manageModal.title` | 环境管理 |
| `environment.Management` / `environment.createNew` | 管理环境 / 新建环境 |
| `environment.environmentSelect.placeholder` | 请选择环境 |
| `environment.envName.development` / `.test` / `.prod` | 开发环境 / 测试环境 / 正式环境 |
| `environment.Test` / `.Official` / `.Mock` | 测试环境 / 正式环境 / Mock环境 |
| `environment.noVariables` | 没有变量 |
| `environment.title.variableName` / `.placeholder` | 变量名 / 添加变量 |
| `environment.title.variableValue` | 变量值 |
| `environment.title.parameterName` / `.parameterValue` | 参数名 / 参数值 |
| `environment.title.parameterInitialValue` / `.parameterCurrentValue` | 远程值 / 本地值 |
| `environment.title.follow` | 跟随远程值 |
| `environment.title.description` / `.placeholder` | 说明 / 输入描述 |
| `environment.title.require` / `.securityType` | 必需 / 类型 |
| `environmentDetail.label.name` / `.visibility` | 环境名称 / 可见性 |
| `environmentDetail.label.servers` / `.variables` | 前置 URL / 环境变量 |
| `variable.globals` | 全局变量 |
| `variable.environment` / `.module` / `.local` | 环境变量 / 模块变量 / 临时变量 |
| `variable.shareScope.project` / `.team` | 项目 / 团队 |

### 4. 数据来源与交互

- 环境 CRUD：`/api/v1/environments`、`/api/v1/environments/ordering`、`/api/v1/environments/duplicate`、`/api/v1/environments/export`、`/api/v1/environments/import`
- 全局变量：`/api/v1/global-variables`（+ `/export`、`/import`）
- 公共参数：`/api/v1/common-parameters`（+ `/export`、`/import`）
- 优先级：`variable.shareScope` 三级（项目 / 团队 / 模块），生效顺序决定同名变量取值
- 本地值 / 远程值双列：本地值仅本机生效，跟随远程值由 `environment.title.follow` 控制

### 5. 对 dsh-postapi 的映射建议

**可复用现有类**：`.pp-env-layout` / `.pp-env-side` / `.pp-env-side-head` / `.pp-env-main` / `.pp-env-pane` / `.pp-env-fields` / `.pp-env-field` / `.pp-env-field-row` / `.pp-env-check` / `.pp-env-tree` / `.pp-env-vars-empty` / `.pp-table.pp-table-vars` / `.pp-tree` / `.pp-tree-row` / `.pp-tree-row-count` / `.pp-priority-list` / `.pp-priority-item` / `.pp-priority-level` / `.pp-priority-body` / `.pp-priority-scope` / `.pp-priority-note` / `.pp-tabs` / `.pp-tab` / `.pp-toolbar` / `.pp-toolbar-inline` / `.pp-toolbar-spacer` / `.pp-note` / `.pp-note-bad` / `.pp-note-ok` / `.pp-overview-head` / `.pp-overview-title` / `.pp-overview-actions` / `.pp-overview-content` / `.pp-icon-btn`。

**需要新增的类**：

| 需要新增的类名 | 语义 | 期望样式 |
|---|---|---|
| `.pp-env-menu-item` | 左列表环境条目 | `display: flex; align-items: center; gap: var(--sp-1); height: var(--ctl-h); padding: var(--sp-1) var(--sp-2) var(--sp-1) var(--sp-1); border-radius: var(--radius-ctl); cursor: pointer;` |
| `.pp-env-menu-item[data-active="true"]` | 选中态 | `color: var(--accent); background: var(--bg-selected);` |
| `.pp-env-menu-item .pp-env-menu-action` | 行内动作（28×28，hover 才显） | `display: none; width: 28px; height: 28px; border-radius: var(--radius-sm); align-items: center; justify-content: center;` + `.pp-env-menu-item:hover .pp-env-menu-action { display: inline-flex; }` |
| `.pp-color-swatches` | 环境颜色选择网格 | `display: grid; grid-template-columns: repeat(auto-fill, 32px); gap: var(--sp-3);` |
| `.pp-color-swatch` | 32px 圆形色块 | `width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: color .24s;` |
| `.pp-server-row` | 前置 URL 行（协议 + 主机 + 端口） | `display: flex; align-items: center; gap: 0; font-size: var(--fs-14); line-height: var(--lh-22);` |
| `.pp-server-sep` | 协议/端口分隔符 | `text-align: center; pointer-events: none; padding: 0;`（协议后 `max-width: 32px`，端口前 `max-width: 20px`） |
| `.pp-env-tag` | 环境标签胶囊 | `cursor: pointer; margin-right: var(--sp-1);`（叠加 `.pp-pill` 使用） |

---
## 9. 历史 `#/history`（chunk 17888 = `async_http_request_history`；61133 = `async_request_history_side`；88598 = `async_request_history_panel`，css `async_http_request_history.f1b86d50.css`）

### 1. 结构（类名 → 语义，缩进表示嵌套）

```
.pui-components-api-runner-split-pane-index-container   上下分栏外壳：border-top 1px 表格边框色
├ .split-mask-IYOZmG                    拖拽遮罩（hover 显示 .split-btn-uQ8Jrh）
│  └ .split-btn-uQ8Jrh                  分栏按钮（默认 display none，遮罩 hover 显示）
├ .split-mask-right-mEh6Of              右侧遮罩（背景 --ui-component-code-editor）
└ .split-popup-ks9Xin                   分栏弹出菜单
   └ .split-popup__menu-imQ3Ea          → .ui-menu-item（height 32 / line-height 32）
.apiDebug-wciE_S                        调试主体（与调试台同构）
├ .topBar-xk8hJs                        sticky 顶栏：z-index 9 / width 100% / top 0
│  ├ .path-wrap .ui-form-item           margin-bottom 0
│  └ .actions-wrap                      → .save-button / .run-button / .more-button 各 width 105 / margin-left 10
├ .topFormWrap-pKpKjt                   → .formItem-WOSzs4（margin-bottom 0/6）
│  └ .base-info-section                 float left / width calc(100% - 80px)
└ .responseTable-zivs7L                 响应表（.ui-empty-image 隐藏 / .ui-empty-normal margin 10 0）
.highlightBlock-ecqvoW                  高亮块：box-shadow 0 0 0 4px 主色 32% / radius 10
```

### 2. 关键 CSS 实测值

| 选择器 | 属性 | 值 | 来源 |
|---|---|---|---|
| `.pui-components-api-runner-split-pane-index-container` | border-top | 1px solid `var(--ui-table-border-color)` | `async_http_request_history.f1b86d50.css` |
| `.split-mask-IYOZmG:hover .split-btn-uQ8Jrh` | display | block | 同上 |
| `.split-mask-IYOZmG .split-btn-uQ8Jrh` | display | none | 同上 |
| `.split-popup-ks9Xin .ui-popover-inner-content` | padding | **4px** | 同上 |
| `.split-popup__menu-imQ3Ea .ui-menu-item` | height / margin / line-height | **32px** / 0 / **32px** | 同上 |
| `.split-popup__menu-imQ3Ea .ui-menu-title-content` | gap / display | **0 12px** / flex | 同上 |
| `.topBar-xk8hJs` | z-index / width / position / top | **9** / 100% / sticky / 0 | 同上 |
| `.topBar-xk8hJs .actions-wrap .save-button`,`.run-button`,`.more-button` | width / margin-left | **105px** / **10px** | 同上 |
| `.topFormWrap-pKpKjt .formItem-WOSzs4` | margin-bottom | **6px** | 同上 |
| `.formItem-WOSzs4` | margin-bottom | 0 | 同上 |
| `.topFormWrap-pKpKjt .base-info-section` | width | `calc(100% - 80px)` | 同上 |
| `.responseTable-zivs7L .ui-empty-normal` | margin-top / margin-bottom | **10px** / **10px** | 同上 |
| `.highlightBlock-ecqvoW` | box-shadow / border-radius / transition | `0 0 0 4px rgba(var(--ui-primary-base-p),.32)` / `--ui-border-radius-lg`(10px) / box-shadow .3s | 同上 |
| `.apiDebug-wciE_S .send-btn button.ui-btn:first-child` | width | `calc(100% - 25px)` | 同上 |
| `.apiDebug-wciE_S .send-btn button.ui-btn.ui-btn-icon-only:last-child` | width | **25px** | 同上 |
| `.apiDebug-wciE_S .ui-spin.ui-spin-spinning` | max-height | **200px** | 同上 |
| `.parameters-atLSbR .upload-xrm0Yi` | max-width | **500px** | 同上 |
| `.description-dh1s8n` | color / font-weight | 次级色 / 400 | 同上 |

### 3. 文案（i18n key → 中文）

| key | 中文 |
|---|---|
| `parameter.text` | 参数 |
| `message.queryParameter` / `.pathParameter` | Query 参数 / Path 参数 |
| `message.hasNoBodyParameter` | 该请求没有 Body |
| `api.button.close` | 断开 |
| `apiTestSuite.message.requestError` | 接口请求异常 |
| `message.cURlFormatError` | cURL 命令有误 |
| `quickDebug.placeHolder.error` | URL格式不正确 , {detail} |
| `quickDebug.placeHolder.detail` | 输入 http 或 https 起始的完整 URL |
| `apiCase.action.saveAsCase` | 保存为用例 |
| `apiTestCase.title.saveApi` | 保存为接口 |
| `apiCase.saveRunModal.title` | 保存为用例 |
| `apiCase.label.caseName` / `apiCase.validate.name.message` | 用例名称 / 用例名不能为空 |
| `apiCase.label.saveResponse` | 同时保存响应 |
| `apiTestCase.apiName` / `.apiPath` / `.apiGroup` | 接口名称 / 接口路径 / 接口目录 |
| `apiTestCase.saveIntactUrl` | 保留完整 URL 路径 |
| `menu.more` | 更多 |

### 4. 数据来源与交互

- 历史记录：`/api/v1/http-requests`（列表 + `/duplicate`）；`/api/v1/user-data/visited` 记录最近访问
- 回放：点历史项把 method/url/headers/body 回填调试台；`.highlightBlock` 用于定位刚回放的条目
- 保存为用例：`/api/v1/api-cases`（`apiTestCase.saveIntactUrl` 控制是否保留完整 URL）
- 上下分栏比例由 `.split-mask` 拖拽维护，不写进持久化数据

### 5. 对 dsh-postapi 的映射建议

**可复用现有类**：`.pp-page` / `.pp-overview-head` / `.pp-overview-title` / `.pp-overview-actions` / `.pp-overview-content` / `.pp-toolbar` / `.pp-toolbar-spacer` / `.pp-toolbar-inline` / `.pp-card` / `.pp-card-title` / `.pp-table` / `.pp-table-wrap` / `.pp-table-mono` / `.pp-method` / `.pp-ellipsis` / `.pp-btn-sm` / `.pp-btn-danger` / `.pp-muted` / `.pp-pane` / `.pp-pre` / `.pp-pre-scroll` / `.pp-note` / `.pp-note-bad` / `.pp-note-ok` / `.pp-input-sm` / `.pp-select` / `.pp-meta`。

**需要新增的类**：

| 需要新增的类名 | 语义 | 期望样式 |
|---|---|---|
| `.pp-split-pane` | 上下分栏外壳（对应 `split-pane-index-container`） | `display: flex; flex-direction: column; min-height: 0; border-top: 1px solid var(--border);` |
| `.pp-split-mask` | 分栏拖拽条 | `position: relative; flex: none; height: var(--sp-2); cursor: row-resize; background: var(--bg-subtle);` |
| `.pp-split-btn` | 分栏按钮（hover 才显） | `display: none; position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: var(--ctl-h-sm); height: var(--ctl-h-sm); border-radius: var(--radius-sm);` + `.pp-split-mask:hover .pp-split-btn { display: inline-flex; }` |
| `.pp-history-actions` | 顶栏动作组（保存/运行/更多 105px 等宽） | `display: flex; align-items: center; gap: 0;` + `.pp-history-actions > .pp-btn { width: 105px; margin-left: var(--sp-2); }` |
| `.pp-highlight-block` | 回放高亮块 | `box-shadow: 0 0 0 4px var(--accent-tint); border-radius: var(--radius-lg); transition: box-shadow .3s;` |

---

## 10. 测试 `#/test`（chunk 44118 = `async_panel_test`；34914 = `async_test_scenario`；25980 = `async_api_test_report_list`；23377 = `async_api_test_report_group`；37914 = `async_test_case_group_run`，css `async_panel_test.ed8d50bd.css` / `async_api_test_report_list.3e5dcd93.css` / `async_test_scenario.99d5f5a6.css`）

### 1. 结构（类名 → 语义，缩进表示嵌套）

测试页在 Apifox 里是「用例 / 场景 / 测试套件 / 报告」四段，dsh-postapi 的 `test.jsx` 对应前两段 + 报告列表。

```
报告列表（25980）：
.tableWrapper-T0FPBO                   整表容器：flex column / width+height 100% / --ui-table-border-radius-base 0
├ .header-WI00Y3                       表头条：height 50 / padding 8 12 / radius 10 10 0 0 / overflow-x auto
│  ├ .searchInput-cpr5Qa               搜索框：width 216 / height 32 / margin-left auto
│  ├ .select-OKNsUA                    下拉：width 120 / margin-right 4
│  └ .filterSelect-u88JEd              筛选下拉：width 148 / min-width 120 / margin-right 4
├ .overlay-VAIJlx                      筛选弹层：width 320
├ .empty-eLxn61                        空态：flex column / 居中 / gap 8 / margin 16 0 32
│  ├ .iconWrapper-XYL1x2               外圈：border 2px / radius 26 / padding 6
│  ├ .iconInner-LfuJzx                 内圈：radius 20 / padding 14
│  └ .icon-kwWrD6                      图标：font-size 32
├ .reportInfoCell-GKHHO2               报告信息单元格（cursor pointer；hover 时 .name 变主色）
│  ├ .name-yfNzQN                      名称：14px / line-height 22 / 省略号
│  └ .description-luH8_8               描述：12px / line-height 20 / 省略号
├ .wrapper-JfRdbt / .reportInfo-HgHZPx / .wrapper-bKjlKL   信息行容器（gap 6 / gap 2）
├ .gap-tiJOX7                          竖分隔：width 1 / height 12 / margin 0 8
├ .actions-DR3SPm / .actions-NGcuWs    动作组：gap 8 / margin-left auto
├ .progress-sXRR53                     进度：居中
└ 状态色 .runningColor(蓝) / .successColor(绿) / .failColor(红) / .pauseColor(橙)
```

场景编排（34914）与 `#/flow` 共用，详见 §12。

用例面板（44118）：`.wrap-HSg47t`（modal 头高 40 / 标题字号 14）→ `.title-SfpiMx`（12px / `--ui-fill-2` 底 / padding 6 12）→ `.tips-zbjE_h`（12px / padding 7 12）→ `.description-BfJD1V`（`--ui-legacy-bg-200` 底 / radius 10 / padding 16）→ `.form-block-container-buUUlJ`（灰底 / 1px 边框 / radius 10 / padding 20）→ `.test-action-container-liiBtx`（右对齐 / padding-top 20）。

### 2. 关键 CSS 实测值

| 选择器 | 属性 | 值 | 来源 |
|---|---|---|---|
| `.tableWrapper-T0FPBO` | width / height / display / `--ui-table-border-radius-base` | 100% / 100% / flex column / **0** | `async_api_test_report_list.3e5dcd93.css` |
| `.header-WI00Y3` | height / padding / border-radius / overflow-x | **50px** / **8px 12px** / 10px 10px 0 0 / auto | 同上 |
| `.searchInput-cpr5Qa` | width / min-width / height / margin-left | **216px** / 216px / **32px** / auto | 同上 |
| `.select-OKNsUA` | width / min-width / margin-right | **120px** / 120px / **4px** | 同上 |
| `.filterSelect-u88JEd` | width / min-width / margin-right | **148px** / **120px** / **4px** | 同上 |
| `.overlay-VAIJlx` | width | **320px** | 同上 |
| `.empty-eLxn61` | gap / margin | **8px** / **16px 0 32px** | 同上 |
| `.iconWrapper-XYL1x2` | border / border-radius / padding | 2px solid split / **26px** / **6px** | 同上 |
| `.iconInner-LfuJzx` | border-radius / padding | **20px** / **14px** | 同上 |
| `.icon-kwWrD6` | font-size | **32px** | 同上 |
| `.name-yfNzQN` | font-size / line-height | 14px / **22px** | 同上 |
| `.description-luH8_8` | font-size / line-height | **12px** / **20px** | 同上 |
| `.gap-tiJOX7` | width / height / margin | **1px** / **12px** / **0 8px** | 同上 |
| `.reportInfo-HgHZPx` | gap / padding | **2px** / **1px 0** | 同上 |
| `.actions-DR3SPm` | gap / margin-left | **8px** / auto | 同上 |
| `.header-PKFhXR` | height / padding / border-bottom | **49px** / **8px 22px** / 1px split | 同上 |
| `.stepDetailResultWrapper-WYbrFi` | padding / flex | **20px 20px 40px** / `1 0 500px` | 同上 |
| `.testScenarioTabList-xtD8dG > .ui-tabs-nav` | height / margin | **48px** / **0 16px** | `async_test_scenario.99d5f5a6.css` |
| `.tab-ftAvdI` | min-width / font-size / gap | **76px** / **12px** / **4px** | 同上 |
| `.container-VzOr4a` | padding | **16px** | 同上 |
| `.formWrapper-IO3n45` | gap | **12px** | 同上 |
| `.appCLICode-RiOWjI` | padding / padding-right / margin-top / radius | **8px 12px** / **40px** / **12px** / 6px | 同上 |
| `.refreshBtn-_KNY4H` | width / height / radius | **24px** / **24px** / 6px | 同上 |
| `.title-HTqeS4` | font-size / line-height | 16px / **24px** | 同上 |
| `.content-o32jNt` | padding / border-radius / margin | **20px** / **8px** / **0 4px 4px** | 同上 |
| `.container-DTXzmT` | padding / height | **16px** / 100% | 同上 |
| `.testCICDList-IVJdL5` | border-radius / border | `--ui-border-radius-lg`(10px) / 1px solid base | 同上 |
| `.testCICDList-IVJdL5 .actionBtn` | padding / margin-right / font-size | **5px 6px** / **4px** / **12px** | 同上 |
| `.wrap-HSg47t` | `--ui-modal-header-height` / `--ui-modal-header-title-font-size` | **40px** / 14px | `async_panel_test.ed8d50bd.css` |
| `.title-SfpiMx` | padding / font-size / line-height | **6px 12px** / 12px / **20px** | 同上 |
| `.tips-zbjE_h` | padding / font-size / line-height | **7px 12px** / 12px / **18px** | 同上 |
| `.description-BfJD1V` | padding / border-radius | **16px** / 10px | 同上 |
| `.form-block-title-lLN_fv` | margin / line-height | **20px 0 8px** / **22px** | 同上 |
| `.form-block-container-buUUlJ` | padding / border-radius / border | **20px** / **10px** / 1px solid split | 同上 |
| `.test-action-container-liiBtx` | padding-top / text-align | **20px** / right | 同上 |
| `.single-flow-container-fXLDDq` | margin-bottom | **20px** | 同上 |
| `.multiple-flows-container-kgqzwV` | border-radius / padding / border | **0 10px 10px** / **0 20px 20px** / 1px solid split | 同上 |
| `.scopes-container-GpzXhY` | padding / border-radius | **8px 12px** / **8px** | 同上 |
| `.projectModuleNameTag-gOyRwa` | padding / margin / border-radius | **0 6px** / **0 8px** / **6px** | 同上 |
| `.overlaySub-z9iwXW` | max-width | **220px** !important | 同上 |

### 3. 文案（i18n key → 中文）

| key | 中文 |
|---|---|
| `apiTestCase.noData` | 没有数据 |
| `apiManage.action.delete.warning` | 确定删除已选择的 {count} 条记录吗？ |
| `apiManage.action.selected.count` | 已选 {selected}/{total} 项 |
| `apiManage.action.delete` / `.unselect` | 删除 / 取消选择 |
| `apiManage.header.search.placeholder` | 输入关键字进行搜索 |
| `apiTest.report.personal` / `.shared` | 个人 / 共享 |
| `apiTest.functionalTest` / `.performanceTest` | 功能测试 / 性能测试 |
| `apiTestCase.title.creator` | 测试人 |
| `apiTestReport.delete` / `.share` | 删除报告 / 分享测试报告 |
| `apiTestReport.shareMode.overview` / `.all` | 仅分享总览 / 同时分享请求/响应详情 |
| `apiTestReport.copyLink` / `.createShare` | 复制分享链接 / 创建分享 |
| `team.runner.testScheduleTask.runsOn` / `.runner` | 运行于 / Runner |
| `team.runner.testScheduleTask.run.manual` / `.schedule` | 手动 / 定时 |
| `performanceTest.report.info.virtualUsers` / `.runDuration` / `.rampDuration` | 并发用户数 / 运行 / 爬坡 |
| `performanceTest.report.result.totalRequests` / `.duration` / `.passed` / `.failed` | 总请求数： / 总耗时： / 成功： / 失败： |
| `testCase` / `testCaseGroup` | 单接口用例 / 单接口用例目录 |
| `testScenario` / `testScenario.newTestScenario` / `.newTestSuite` | 场景用例 / 新建场景用例 / 新建测试套件 |
| `apiTestSuite.label.importStatus` / `.included` / `.excluded` | 导入状态 / 已导入 / 未导入 |
| `apiTestCase.syncMode.apiCase` / `.api` | 导入方式 / 同步方式 |
| `testScenario.environmentAssociation` / `.title` | 环境关联 / 设置其它项目步骤运行环境 |
| `apiTestCase.ImportFromCurl` / `api.action.pasteCUrlData` | 从 cURL 导入 / 粘贴 cURL 数据 |
| `api.action.ignoreGenericHeader` | 忽略通用 Header |
| `testCase.runMode` / `.serial` / `.parallel` | 运行模式 / 串行 / 并行 |
| `apiTestCase.executeEnvironment` / `.iterationCount` | 运行环境 / 循环次数 |

### 4. 数据来源与交互

- 用例：`/api/v1/api-cases`、`/api/v1/duplicate-api-case`、`/api/v1/api-cases/import-by-api-detail`、`/api/v1/api-case-scripts`
- 用例目录：`/api/v1/api-test/case-folders`、`/api/v1/api-test/case-folders` ordering
- 场景：`/api/v1/test-scenarios` 系（34914 内以 `testScenario` 键族驱动）；套件 `async_test_suite`（67626）
- 报告：`/api/v1/api-test-reports` 系；报告分享走 `apiTestReport.createShare` / `copyLink`
- 批量删除：`apiManage.action.delete.warning` 两段式确认；`.rowSelected` 高亮选中行

### 5. 对 dsh-postapi 的映射建议

**可复用现有类**：`.pp-debug-layout`（左树右详情）/ `.pp-panel` / `.pp-env-side-head` / `.pp-card-title` / `.pp-tabs` / `.pp-tab` / `.pp-tree` / `.pp-tree-group` / `.pp-tree-row` / `.pp-tree-row-count` / `.pp-io-head` / `.pp-io-title` / `.pp-form-grid` / `.pp-form-label` / `.pp-input` / `.pp-input-sm` / `.pp-input-mono` / `.pp-pill` / `.pp-table` / `.pp-table-wrap` / `.pp-table-wide` / `.pp-list` / `.pp-list-row` / `.pp-result-row` / `.pp-note` / `.pp-note-bad` / `.pp-note-ok` / `.pp-toolbar` / `.pp-toolbar-inline` / `.pp-toolbar-spacer` / `.pp-overview-head` / `.pp-overview-title` / `.pp-overview-actions` / `.pp-overview-content` / `.pp-btn-sm` / `.pp-btn-ghost` / `.pp-btn-accent` / `.pp-btn-danger` / `.pp-btn-primary`。

**需要新增的类**：

| 需要新增的类名 | 语义 | 期望样式 |
|---|---|---|
| `.pp-table-toolbar` | 表格上方动作条（搜索 + 筛选 + 动作） | `display: flex; align-items: center; gap: var(--sp-1); height: 50px; padding: var(--sp-2) var(--sp-3); border-bottom: 1px solid var(--border); border-radius: var(--radius-lg) var(--radius-lg) 0 0; overflow-x: auto;` |
| `.pp-table-search` | 表格搜索框 | `width: 216px; min-width: 216px; height: var(--ctl-h); margin-left: auto;` |
| `.pp-table-filter` | 表格筛选下拉 | `width: 148px; min-width: 120px; margin-right: var(--sp-1);` |
| `.pp-cell-title` | 单元格主标题（14px/22 + 省略号） | `width: 100%; font-size: var(--fs-14); line-height: var(--lh-22); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` |
| `.pp-cell-desc` | 单元格副标题（12px/20 + 省略号） | `width: 100%; font-size: var(--fs-12); line-height: var(--lh-20); color: var(--fg-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` |
| `.pp-vdivider` | 表格内竖分隔（1×12） | `width: 1px; height: 12px; margin: 0 var(--sp-2); background: var(--border);` |
| `.pp-empty-ring` | 空态双层圆环 | `.pp-empty-ring { width: 64px; height: 64px; border: 2px solid var(--border); border-radius: var(--radius-pill); display: flex; align-items: center; justify-content: center; padding: var(--sp-1); }` + `.pp-empty-ring > .pp-icon-btn { width: 44px; height: 44px; border-radius: var(--radius-pill); background: var(--bg-app); }` |
| `.pp-status-running` / `.pp-status-success` / `.pp-status-fail` / `.pp-status-pause` | 报告状态色（token 化，勿写字面量） | `color: var(--accent)` / `color: var(--success)` / `color: var(--error)` / `color: var(--warning)`（三个色 token 已在 `design-tokens.css` L117-119 定义，直接复用） |
| `.pp-modal-shell` | 弹层内容外壳（用例面板） | `display: flex; flex-direction: column; min-width: 0;` |
| `.pp-modal-head` | 弹层头部 | `display: flex; align-items: center; justify-content: space-between; height: var(--ctl-h-lg); padding: 0 var(--sp-3); border-bottom: 1px solid var(--border);` |
| `.pp-modal-strip` | 弹层内次级标题条（12px + 灰底） | `display: flex; align-items: center; justify-content: space-between; padding: 6px var(--sp-3); font-size: var(--fs-12); line-height: var(--lh-20); background: var(--bg-app); border-top: 1px solid var(--border);` |
| `.pp-flow-block` | 场景编排块容器 | `padding: var(--sp-5); border: 1px solid var(--border); border-radius: 0 var(--radius-lg) var(--radius-lg);` |

---
## 11. 导入导出 `#/import`（chunk 78203（导入面板 + 预览树）；`exportData.*` 键族在 32636，css `78203.83fd9b69.css`）

### 1. 结构（类名 → 语义，缩进表示嵌套）

```
导入流程（Apifox 是一个弹层内四步）：
.projectDetailImportMode-C59WjZ          导入方式卡：--ui-primary-a 底 / radius 12 / margin-top 12 / padding 8 12 12
├ .inputImportLabelDetail-o7esLW         方式说明行：14px / line-height base / margin-bottom 4
├ .importModeDivider-Vqy5uX              竖分隔：width 1 / height 13 / margin 0 4
└ .importToFormItem-DIiC35               表单行：--ui-input-height-base unset / align-items baseline / flex
.search-input-eGBGSU                     搜索框：width calc(100% - 20px) / margin 0 8 12
.importPreviewSearchInput-sbK0qG         预览树搜索：.ui-input-prefix 用 placeholder 色
.importTooltipOverlay-vkPo5M             导入说明气泡：--ui-tooltip-max-width 550 / inner width 496 / padding 8 / line-height 20
.importTooltipContent-hb6OTH             气泡内容：相对定位
├ .logo-text-La2Omz                     角标文字：16px / 600 / 绝对定位 top 15 right 5
└ svg                                    height 21
.import-result-DxnMjl                    导入结果表：.ui-modal-confirm-content margin 24 0 0 / .ui-table-cell padding 8 16
```

导出（`exportData.*`，无独立 chunk）：格式选择（OpenAPI Spec / HTML / Markdown / PDF / Word / {appName} CLI / Postman / JMeter）+ 基本设置（OpenAPI 版本 3.1/3.0/2.0、是否含扩展字段、目录是否作为 Tags）。

### 2. 关键 CSS 实测值

| 选择器 | 属性 | 值 | 来源 |
|---|---|---|---|
| `.projectDetailImportMode-C59WjZ` | padding / border-radius / margin-top | **8px 12px 12px** / **12px** / **12px** | `78203.83fd9b69.css` |
| `.inputImportLabelDetail-o7esLW` | font-size / line-height / margin-bottom | 14px / base / **4px** | 同上 |
| `.importModeDivider-Vqy5uX` | width / height / margin | **1px** / **13px** / **0 4px** | 同上 |
| `.search-input-eGBGSU` | width / margin | `calc(100% - 20px)` / **0 8px 12px** | 同上 |
| `.importTooltipOverlay-vkPo5M .ui-tooltip-inner` | width / padding / line-height / font-size | **496px** / **8px** / **20px** / **12px** | 同上 |
| `.importTooltipOverlay-vkPo5M .ui-tooltip-inner img` | width / height / border-radius | 100% / auto / **8px** | 同上 |
| `.importTooltipContent-hb6OTH .logo-text-La2Omz` | font-size / line-height / font-weight / top / right | **16px** / **24px** / **600** / **15px** / **5px** | 同上 |
| `.importTooltipContent-hb6OTH .logo-text-La2Omz > svg` | height | **21px** | 同上 |
| `.import-result-DxnMjl .ui-modal-confirm-content` | margin | **24px 0 0** | 同上 |
| `.import-result-DxnMjl .ui-table-cell` | padding | **8px 16px** | 同上 |
| `.menu-wrapper-Si4S6t .team-search-empty-PWQ25V` | color / text-align | 次级色 / center | 同上 |
| `.gitFileModalBody-a8H9EH .searchContainer-WDn4HF` | padding-bottom / position / top | **4px** / sticky / 0 | 同上 |

### 3. 文案（i18n key → 中文）

| key | 中文 |
|---|---|
| `import.importPreview` | 导入预览 |
| `import.confirmImport` | 确认导入 |
| `importData.preview.title` | 选择导入的内容 |
| `importData.tree.checkAll` | 全选 |
| `importData.tab.api` / `.dataSchema` / `.environment` / `.testScenario` / `.markdown` / `.request` / `.component` | 接口 ({count}/{all}) / 数据模型 / 环境 / 场景用例 / Markdown / 快捷请求 / 组件库 |
| `importData.preview.tab.collection` / `.environment` / `.global` | 集合 / 环境变量 / 全局变量 |
| `importData.environment.name` / `.preUrl` | 环境名称 / 前置 URL |
| `import.dataSizeExceedTip` | 导入数据过多导致部分数据导入失败。可以尝试减少导入的数据并重新导入。 |
| `import.message.dataFormatError` | 数据格式错误 |
| `import.message.checkDataFormatError` | 当前内容格式不正确。请检查内容后重试。 |
| `import.message.checkDataFormatError.withFormat` | 当前内容不是有效的 {format}。请检查内容后重试。 |
| `import.message.invalidOpenApiFormat` | 格式无效。请上传包含有效 OpenAPI 或 Swagger 规范的 JSON 或 YAML 文件。 |
| `import.message.invalidOpenApiHtmlFile` | 当前文件是 HTML 页面，请上传 JSON 或 YAML 格式的 OpenAPI 文件。 |
| `import.message.invalidOpenApiUrlProtocol` | 请输入 HTTP(S) 的 OpenAPI 导入 URL。 |
| `import.message.checkUrlAccessError` | 请检查 URL 是否有误或者是否有访问权限限制 |
| `import.message.networkTimeout` | 网络请求超时。 |
| `import.message.openApiImportHelpLink` | 查看 OpenAPI/Swagger 导入说明 |
| `exportData.format` | 格式 |
| `exportData.format.openAPI` / `.html` / `.markdown` / `.pdf` / `.word` | OpenAPI Spec / HTML / Markdown / PDF / Word |
| `exportData.format.appCli` / `.postman` / `.JMeter` | {appName} CLI 格式 / Postman 格式 / JMeter 格式 |
| `exportData.export.basicSetting` | 基本设置 |
| `exportData.export.openapi.version` / `.31` / `.30` / `.20` | OpenAPI Spec 版本 / OpenAPI 3.1 / OpenAPI 3.0 / Swagger 2.0 |
| `exportData.export.openapi.extension` | 包含 {appName} 扩展的 OpenAPI 字段（x-{appNameLower}-***） |
| `exportData.export.openapi.folderTags` | 将 API 文档的目录，作为 Tags 字段导出 |
| `exportDataHelpGuide` | 可能是您导出 Postman 数据方式不正确，请按指引导出数据: {link} |

### 4. 数据来源与交互

- 导入：`/api/v1/import-data`（主入口）；OpenAPI/Swagger、Postman、apiDoc、Apifox、JMeter、Insomnia 等格式由 `importData.tab.*` 决定可选范围
- 导出：`/api/v1/export-data`、`/api/v1/export/openapi`、`/api/v1/export/html`、`/api/v1/export/markdown`、`/api/v1/export/postman`
- 预览树勾选状态决定提交的 payload 子集；`importData.tree.checkAll` 全选/反选
- 失败分支：格式错误 / URL 不可达 / 网络超时 / 数据量超限，四种文案各自独立（见 §3）

### 5. 对 dsh-postapi 的映射建议

**可复用现有类**：`.pp-io-layout` / `.pp-io-body` / `.pp-io-side` / `.pp-io-side-title` / `.pp-io-item` / `.pp-io-main` / `.pp-io-head` / `.pp-io-title` / `.pp-io-input` / `.pp-io-stats` / `.pp-io-pre` / `.pp-io-sample` / `.pp-tabs` / `.pp-tab` / `.pp-toolbar` / `.pp-toolbar-inline` / `.pp-toolbar-spacer` / `.pp-textarea` / `.pp-input` / `.pp-input-sm` / `.pp-card` / `.pp-card-title` / `.pp-pill` / `.pp-pill-ok` / `.pp-pre` / `.pp-pre-scroll` / `.pp-method` / `.pp-mono` / `.pp-note` / `.pp-note-bad` / `.pp-note-ok` / `.pp-ellipsis` / `.pp-overview-head` / `.pp-overview-title` / `.pp-overview-actions` / `.pp-overview-content`。

**需要新增的类**：

| 需要新增的类名 | 语义 | 期望样式 |
|---|---|---|
| `.pp-mode-card` | 导入方式卡（主色浅底） | `padding: var(--sp-2) var(--sp-3) var(--sp-3); margin-top: var(--sp-3); border-radius: var(--radius-lg); background: var(--accent-tint);` |
| `.pp-mode-label` | 方式说明行 | `display: flex; align-items: center; font-size: var(--fs-14); line-height: var(--lh-22); margin-bottom: var(--sp-1);` |
| `.pp-mode-divider` | 方式间竖分隔 | `width: 1px; height: 13px; margin: 0 var(--sp-1); background: var(--border);` |
| `.pp-preview-tree` | 导入预览树容器 | `max-height: calc(var(--row-h) * 14); overflow: auto; padding: var(--sp-1) 0;` |
| `.pp-preview-search` | 预览树搜索框 | `width: calc(100% - var(--sp-5)); margin: 0 var(--sp-2) var(--sp-3);` |
| `.pp-import-result` | 导入结果表 | `margin-top: var(--sp-6);` + `.pp-import-result .pp-table td { padding: var(--sp-2) var(--sp-4); }` |
| `.pp-format-row` | 导出格式单选行 | `display: flex; align-items: center; gap: var(--sp-2); min-height: var(--ctl-h);` |

---

## 12. 场景编排 `#/flow`（chunk 34914 = `async_test_scenario`，css `async_test_scenario.99d5f5a6.css`）

### 1. 结构（类名 → 语义，缩进表示嵌套）

```
.testScenarioTabList-xtD8dG            场景页签容器：height 100% / position relative / overflow hidden
├ .ui-tabs-nav                         页签条：height 48 / margin 0 16 / align-items center / gap 8
├ .tab-ftAvdI                          单个页签：min-width 76 / 12px / flex column / gap 4 / --tab-icon-size 16
├ .ui-tabs-extra-content               右侧附加区：align-items center / gap 8
└ .learnMore-TZ7WZl                    了解更多链接：link 色 / inline-flex / gap 4
.container-VzOr4a                      内容区：width 100% / padding 16
├ .formWrapper-IO3n45                  表单行：space-between / gap 12（内 .ui-form-item margin-bottom 12）
├ .cliTips-gQvQBz                      CLI 说明：14px / line-height 22
├ .appCLICode-RiOWjI                   CLI 命令块：--ui-fill-4 底 / 1px 边框 / radius 6 / padding 8 12 / mono / line-height 22
│  ├ .hasAction                        padding-right 40
│  └ .action                           绝对定位 top 0 right 0 / padding 8
├ .refreshBtn-_KNY4H                   刷新钮：24×24 / radius 6
├ .container-DTXzmT                    列表容器：height 100% / padding 16（表格 cell padding 8 12 / 表头 5 12）
├ .testCICDList-IVJdL5                 CI/CD 列表：1px 边框 / radius 10 / 12px actionBtn
├ .testDataList-INCulw                 测试数据列表：同上
├ .card-Fc0gA6                         卡片：1px 边框 / radius 12 / padding 4
└ .processor-item                      处理器行（含 .dragHandle-Ia0Sr9 拖拽柄，默认 opacity 0）
```

场景编排的画布与步骤列表：Apifox 用「左步骤树 + 右步骤详情」，dsh-postapi `flow.jsx` 用「左步骤列表 + 右画布 + 下方属性面板」。

### 2. 关键 CSS 实测值

| 选择器 | 属性 | 值 | 来源 |
|---|---|---|---|
| `.testScenarioTabList-xtD8dG > .ui-tabs-nav` | height / margin | **48px** / **0 16px** | `async_test_scenario.99d5f5a6.css` |
| `.testScenarioTabList-xtD8dG > .ui-tabs-nav > .ui-tabs-extra-content` | align-items / gap | center / **8px** | 同上 |
| `.tab-ftAvdI` | min-width / font-size / gap / `--tab-icon-size` | **76px** / **12px** / **4px** / **16px** | 同上 |
| `.learnMore-TZ7WZl` | gap / display | **4px** / inline-flex | 同上 |
| `.container-VzOr4a` | padding | **16px** | 同上 |
| `.formWrapper-IO3n45` | gap / justify-content | **12px** / space-between | 同上 |
| `.formWrapper-IO3n45 .ui-col .ui-form-item-label` | padding-bottom | **4px** | 同上 |
| `.appCLICode-RiOWjI` | padding / margin-top / border-radius / line-height | **8px 12px** / **12px** / 6px / **22px** | 同上 |
| `.appCLICode-RiOWjI.hasAction` | padding-right | **40px** | 同上 |
| `.appCLICode-RiOWjI .action` | padding / position / top / right | **8px** / absolute / 0 / 0 | 同上 |
| `.refreshBtn-_KNY4H` | width / height / border-radius | **24px** / **24px** / 6px | 同上 |
| `.title-HTqeS4` | font-size / font-weight / line-height | 16px / semibold(500) / **24px** | 同上 |
| `.label-KyRZp5` | font-size / line-height | 14px / **22px** | 同上 |
| `.content-o32jNt` | padding / border-radius / margin | **20px** / **8px** / **0 4px 4px** | 同上 |
| `.container-DTXzmT` | padding / height / overflow | **16px** / 100% / hidden | 同上 |
| `.container-DTXzmT .ui-table-cell` | padding / line-height | **8px 12px** / **24px** | 同上 |
| `.container-DTXzmT .ui-table-thead .ui-table-cell` | padding | **5px 12px** | 同上 |
| `.testCICDList-IVJdL5` | border / border-radius / font-size | 1px solid base / **10px** / 14px | 同上 |
| `.testCICDList-IVJdL5 .actionBtn` | padding / margin-right / font-size | **5px 6px** / **4px** / **12px** | 同上 |
| `.card-Fc0gA6` | border / border-radius / padding | 1px solid split / **12px** / **4px** | 同上 |
| `.dragHandle-Ia0Sr9` | opacity / position / transform | **0** / absolute / translate(-50%,-50%) | 同上 |
| `.tips-y7csZM` | gap / display / font-size | **8px** / flex column / 14px | 同上 |
| `.tips-y7csZM::before`（项目符号） | width / height / margin | **4px** / **4px** / -3px 8px 0 | 同上 |
| `.tooltip-N2yG6R` | min-width / max-width / white-space | **274px** / min-content / normal | 同上 |
| `.item-ci2T69` | `--ui-form-item-margin-bottom` | **12px** | 同上 |

### 3. 文案（i18n key → 中文）

| key | 中文 |
|---|---|
| `testScenario` | 场景用例 |
| `testScenario.newTestScenario` / `.newTestSuite` / `.addTestScenario` | 新建场景用例 / 新建测试套件 / 添加场景用例 |
| `testScenario.selectTips` | 从左侧选择一个资源 |
| `testScenario.messageError.notExist` | 场景用例不存在 |
| `testScenario.unsaved.title` / `.content` | 有修改的内容未保存 / 确定退出? |
| `testScenario.or` | 或 |
| `testScenario.appCLI.localRunTips1` | 如果想要在本地通过 {appName} CLI 运行此场景用例，则要需 {exportBtn} 该场景用例 {appName} CLI 的 json 文件, 然后使用以下命令本地运行导出数据。 |
| `testScenario.appCLI.localRunTips2` | 谨记 "examples/sample.{appNameLower}-cli.json" 需要被替换成导出 json 文件的正确路径。 |
| `testScenario.appCLI.localEnvironmentTips` | 注意：如果场景用例中使用了环境变量，将使用变量的本地值 |
| `testScenario.appCLI.remoteEnvironmentTips` | 注意：如果场景用例中使用了环境变量，将使用变量的远程值 |
| `testScenario.appCLI.installCLI` | 安装 {appName} CLI，然后运行以下命令即可实时运行在线数据。 |
| `testScenario.appCLI.runOnlineData` / `.runExportData` | 实时运行在线数据 / 导出数据运行 |
| `testScenario.cicd.copyTips` | 将以下代码复制并粘贴到构建配置文件中 |
| `testScenario.cicd.provider` | CI/CD 平台 |
| `testScenario.cicd.moreTips.title` / `.content` | 其 他 / 你可以在 {cli} 中复制命令行后，集成到你的 CI/CD 工具中。 |
| `cliCIForm.downloadDatabaseConfig` | 下载数据库配置文件，在配置文件所在的目录运行以下命令，即可实时运行在线数据。 |
| `cliCIForm.generateCommand` | 保存后会自动生成运行命令 |
| `testScenario.environmentAssociation` / `.title` | 环境关联 / 设置其它项目步骤运行环境 |
| `testScenario.environmentAssociation.tips` | 将 {project} 项目中的环境与当前项目环境对应。{link} |
| `testScenario.label.refTip` / `.selfTip` | 此场景内已直接或间接引用当前场景。不可引用自己 / 此场景为当前场景。不可引用自己 |
| `testScenario.selectTestScenario` / `.importStepsFromTestScenario` | 选择场景用例 / 选择场景用例内的步骤导入 |
| `apiTestCase.executeEnvironment` / `.iterationCount` | 运行环境 / 循环次数 |
| `confirm.delete` | 确定删除？ |

### 4. 数据来源与交互

- 场景 CRUD：`/api/v1/test-scenarios` 系（含 `async_test_scenario_folder` 77913 目录）
- 步骤：每步是一个 endpoint 引用或处理器；处理器定义走 `/api/v1/api-case-scripts`
- 运行：本机 Runner / 自托管 Runner / 云端，`team.runner.testScheduleTask.*` 键族控制通知与调度
- 环境关联：跨项目步骤需要 `testScenario.environmentAssociation` 映射（`testScenario.importFromExternalProject.limit` 有配额限制）
- 未保存保护：`testScenario.unsaved.*` 两段式确认

### 5. 对 dsh-postapi 的映射建议

**可复用现有类**：`.pp-flow-layout` / `.pp-flow-side` / `.pp-flow-side-head` / `.pp-flow-steps` / `.pp-flow-step` / `.pp-flow-step-no` / `.pp-flow-step-body` / `.pp-flow-step-name` / `.pp-flow-step-msg` / `.pp-flow-step-act` / `.pp-flow-main` / `.pp-flow-canvas` / `.pp-flow-props` / `.pp-flow-prop-grid` / `.pp-flow-prop-row` / `.pp-flow-source` / `.pp-flow-name` / `.pp-seq-wrap` / `.pp-split-hint` / `.pp-toolbar` / `.pp-toolbar-inline` / `.pp-toolbar-spacer` / `.pp-overview-head` / `.pp-overview-title` / `.pp-overview-actions` / `.pp-overview-content` / `.pp-panel` / `.pp-card-title` / `.pp-pill` / `.pp-note` / `.pp-note-bad` / `.pp-note-ok` / `.pp-form-label` / `.pp-input` / `.pp-input-sm` / `.pp-input-mono` / `.pp-btn-sm` / `.pp-btn-ghost` / `.pp-btn-accent` / `.pp-btn-primary` / `.pp-btn-danger` / `.pp-env-check` / `.pp-ellipsis` / `.pp-meta` / `.pp-muted` / `.pp-select`。

**需要新增的类**：

| 需要新增的类名 | 语义 | 期望样式 |
|---|---|---|
| `.pp-flow-tabbar` | 场景顶部页签条（48px，与全局 44px 页签条不同） | `display: flex; align-items: center; gap: var(--sp-2); height: var(--ctl-h-lg); margin: 0 var(--sp-4); border-bottom: 1px solid var(--border);`（48px 不在刻度上，若要严格复刻需 lead 加 `--tabbar-lg: 48px`） |
| `.pp-flow-tab` | 场景页签（图标在上、文字在下） | `display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--sp-1); min-width: 76px; font-size: var(--fs-12);` |
| `.pp-cli-block` | CLI 命令块（mono + 可复制） | `position: relative; margin-top: var(--sp-3); padding: var(--sp-2) var(--sp-3); padding-right: var(--ctl-h-lg); font-family: var(--font-mono); font-size: var(--fs-13); line-height: var(--lh-22); background: var(--bg-subtle); border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer;` |
| `.pp-cli-copy` | 命令块内复制钮 | `position: absolute; top: 0; right: 0; padding: var(--sp-2); display: inline-flex; align-items: center; justify-content: center;` |
| `.pp-tips-list` | 项目符号说明列表 | `display: flex; flex-direction: column; gap: var(--sp-2); margin: 0; padding: 0; list-style: none; font-size: var(--fs-14); line-height: var(--lh-22); color: var(--fg-secondary);` |
| `.pp-tips-list > li::before` | 圆点 | `content: ""; display: inline-block; width: 4px; height: 4px; margin: -3px var(--sp-2) 0; border-radius: var(--radius-pill); background: var(--fg-secondary); vertical-align: middle;` |
| `.pp-drag-handle` | 拖拽柄（默认隐藏） | `position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); opacity: 0; cursor: move; color: var(--fg-tertiary);` + `tr:hover .pp-drag-handle { opacity: 1; }` |
| `.pp-form-panel` | 灰底表单块（场景设置） | `padding: var(--sp-5); margin: 0 var(--sp-1) var(--sp-1); border: 1px solid var(--border); border-radius: var(--radius-card); overflow: hidden;` |

---

## 13. 全局搜索 `#/search`（无独立 chunk：搜索入口在 94743 / 49423，`api.action.processor.Search` 键，css `94743.17ac1c15.css`）

### 1. 结构（类名 → 语义）

```
Apifox 的全局搜索是顶栏输入 + 下拉结果面板（不是独立页面）：
overview-header-container-mzEiZK       搜索面板外层（复用概览页头容器）
├ overview-header__title-z7WTXG        标题
└ overview-header-actions-ynyVW3      动作区
search-arrow-6wCe09                   结果行箭头
filter-search-I7383J                  过滤搜索
.list-search-SgG7HF                   列表搜索容器：flex none / padding 8（25879 css）
├ .list-search-input-m3gMHJ           输入框：input font-size 12
└ .list-search-icon-quokJc            图标：disabled 色
.searchInput-gINsGW                   搜索框：width 200 / height 28（25879 css）
```

dsh-postapi 把搜索做成了独立页（`#/search`），结构对应 Apifox 面板内的分组结果列表。

### 2. 关键 CSS 实测值

| 选择器 | 属性 | 值 | 来源 |
|---|---|---|---|
| `.list-search-SgG7HF` | flex / padding | none / **8px** | `25879.fc2daa37.css` |
| `.list-search-input-m3gMHJ input` | font-size | **12px** | 同上 |
| `.searchInput-gINsGW` | width / height | **200px** / **28px** | 同上 |
| `.search-input-eGBGSU` | width / margin | `calc(100% - 20px)` / **0 8px 12px** | `78203.83fd9b69.css` |
| `.all-projects-container-CKLyvV .search-input-Uxervg` | width | **216px** | `p__entry__Main.3e1827b9.css` |
| `.treeList__searchHistory-HKjMzn` | height / font-size | **37px** / **12px** | `async_side_test.5242fca3.css` |
| `.treeList__searchHistory__span--split-g_3eIh` | width / height / background | **1px** / **17px** / legacy-bg-300 | 同上 |

### 3. 文案（i18n key → 中文）

| key | 中文 |
|---|---|
| `component.globalHeader.search` | 站内搜索 |
| `component.search` | 搜索 |
| `component.search.noMatch` | 未匹配到相关条目 |
| `search` / `searchKeyWord` | 搜索 / 搜索关键字 |
| `api.action.processor.Search` | 搜索接口/接口用例/目录 |
| `apiManage.header.search.placeholder` | 输入关键字进行搜索 |
| `apiTestSuite.placeHolder.search` / `.searchSuite` | 搜索目录 / 搜索套件 |
| `environmentDetail.search.servers.placeholder` / `.variables.placeholder` | 搜索前置 URL / 搜索环境变量 |
| `editModal.placeholder.searchMockFunction` / `.searchFakerFunction` | 搜索 Mock 函数 / 搜索 Faker 函数 |
| `apiTestCase.steps.searchPlaceholder` | 搜索步骤 ID、名称 |
| `apiTest.search.exact.tooltip` | 精确搜索已打开。引用场景用例内步骤会被搜索与匹配。 |
| `apiTest.search.exactOff.tooltip` | 精确搜索已关闭。打开后，如果引用的场景用例中也有匹配关键字的步骤，该引用场景用例会被标记匹配。 |
| `menu.sideBar.itemName.admin.project.search` | 搜索项目名/项目 ID |

### 4. 数据来源与交互

- Apifox 的全局搜索是**前端本地索引**（在已加载的项目数据里匹配），没有独立搜索 API；命中项直接跳转到对应路由
- 搜索范围由 `api.action.processor.Search` 定义：接口 / 接口用例 / 目录
- 精确搜索开关影响是否穿透引用场景用例的步骤（`apiTest.search.exact*`）
- 历史关键字存在本地（`.treeList__searchHistory`，高 37px）

### 5. 对 dsh-postapi 的映射建议

**可复用现有类**：`.pp-search-bar` / `.pp-search-project` / `.pp-search-input` / `.pp-search-btn` / `.pp-search-source` / `.pp-search-hint` / `.pp-search-results` / `.pp-search-group` / `.pp-search-group-head` / `.pp-search-caret` / `.pp-search-group-label` / `.pp-search-count` / `.pp-search-list` / `.pp-search-row` / `.pp-search-dot` / `.pp-search-name` / `.pp-search-sub` / `.pp-search-summary` / `.pp-search-mark` / `.pp-list` / `.pp-list-row` / `.pp-method` / `.pp-note` / `.pp-note-bad` / `.pp-ellipsis` / `.pp-overview-head` / `.pp-overview-title` / `.pp-overview-actions` / `.pp-overview-content` / `.pp-toolbar-spacer`。

**需要新增的类**：

| 需要新增的类名 | 语义 | 期望样式 |
|---|---|---|
| `.pp-search-history` | 搜索历史行（37px / 12px） | `display: flex; align-items: center; height: calc(var(--ctl-h) + var(--sp-1)); font-size: var(--fs-12); color: var(--fg-secondary);` |
| `.pp-search-history-sep` | 历史项间竖线（1×17） | `width: 1px; height: 17px; margin: 0 var(--sp-2); background: var(--border);` |
| `.pp-search-exact` | 精确搜索开关行 | `display: inline-flex; align-items: center; gap: var(--sp-1); font-size: var(--fs-12); color: var(--fg-secondary);` |

---

## 14. 设置 `#/settings`（chunk 33943 = `async_panel_settings`；11929 = `p__organization-settings`；9995 = `settings_content`；58320 = `async_side_settings`，css `async_panel_settings.b8c96200.css` / `p__organization-settings.6a729b9d.css` / `settings_content.10b6da72.css` / `async_side_settings.30c3c6f4.css`）

### 1. 结构（类名 → 语义，缩进表示嵌套）

```
.container-eXQ_D9                      设置左侧菜单（async_side_settings）
├ .ui-menu-inline > .ui-menu-item      条目：height 32 / margin 0 0 4px / line-height 32
├ .ui-menu-sub.ui-menu-inline > .ui-menu-item  子项：width calc(100% - 24px) / height 32
├ .item-title-tip                      提示文字（选中/hover 变高亮色）
└ .icon-sub-menu-RGPhhL                子菜单箭头：disabled 色 / transform .3s（.open 时 rotate 90）

右侧内容（async_panel_settings）：
.container-VByeeE                      设置表容器（.ui-collapse-content-box padding 0）
├ th.ui-table-cell                     padding 6 10
├ td.ui-table-cell                     padding 4 10
├ .readonly-value-wrap                 padding 0
└ .auto-import-fail                   td 四边 1px danger 色（失败行整行描边）

.list-ZLxCXH                           设置列表：max-height 348 / overflow-y auto
├ .list-item-CCfyZE                   条目：padding 12 0
└ .list-title__icon-UfxSrA            图标：次级色 / margin-right 8
.name-JUoXra                           主名：14px / 500 / line-height 22
.lastAccessAt-uoAjK8                   次行：12px / disabled 色 / line-height 22
.action-HXBMGE                         行内动作：28×28 / radius 6
.alert-JGTPSM                          提示块：card 底 / radius 10 / 无边框 / margin-top 8
.settingModal-bk2ogj                  设置弹层：.user margin-bottom 25 / .username 12px
.settingActionsWrap-I83jHU             弹层动作：.left-action / .right-action
.table-wrap-GaxSsz                     表格包装：.ui-table line-height 28 / modal 行 cell padding 4 0
.modal-table-wrap-U9PSj8               modal 内表：cell padding 4 0
```

组织设置（11929，`p__organization-settings`）是另一套：AI 功能开关、模型供应商、GitHub Enterprise、组织重命名/移交/解散。

### 2. 关键 CSS 实测值

| 选择器 | 属性 | 值 | 来源 |
|---|---|---|---|
| `.container-eXQ_D9 .ui-menu-inline > .ui-menu-item` | height / margin / line-height | **32px** / **0 0 4px** / **32px** | `async_side_settings.30c3c6f4.css` |
| `.container-eXQ_D9 .ui-menu-item` | width / margin-left | `calc(100% - 16px)` / **16px** | 同上 |
| `.container-eXQ_D9 .ui-menu-sub.ui-menu-inline > .ui-menu-item` | width / height | `calc(100% - 24px)` / **32px** | 同上 |
| `.container-eXQ_D9 .icon-sub-menu-RGPhhL` | color / transition | `var(--ui-disabled-color)` / transform .3s cubic-bezier(.645,.045,.355,1) | 同上 |
| `.list-ZLxCXH` | max-height / overflow-y | **348px** / auto | `async_panel_settings.b8c96200.css` |
| `.list-item-CCfyZE` | padding | **12px 0** | 同上 |
| `.list-title__icon-UfxSrA` | margin-right / color | **8px** / 次级色 | 同上 |
| `.name-JUoXra` | font-size / font-weight / line-height | **14px** / **500** / **22px** | 同上 |
| `.lastAccessAt-uoAjK8` | font-size / line-height | **12px** / **22px** | 同上 |
| `.action-HXBMGE` | width / height / border-radius | **28px** / **28px** / 6px | 同上 |
| `.tips-A1o4tS` | font-size / color | **12px** / tertiary | 同上 |
| `.title-BHDEFI` | font-size / margin-bottom | **14px** / **4px** | 同上 |
| `.description-wJZyFP` | font-size / margin-bottom | **14px** / **20px** | 同上 |
| `.formItem-LC5_OA` | margin-bottom | **16px** | 同上 |
| `.alert-JGTPSM` | border-radius / margin-top / border | `--ui-border-radius-lg`(10px) / **8px** / none | 同上 |
| `.table-wrap-GaxSsz .ui-table` | line-height | **28px** | 同上 |
| `.table-wrap-GaxSsz .ui-table .modal-table-row .ui-table-cell` | padding-top / padding-bottom | **4px** / **4px** | 同上 |
| `.container-VByeeE td.ui-table-cell` | padding | **4px 10px** !important | 同上 |
| `.container-VByeeE th.ui-table-cell` | padding | **6px 10px** !important | 同上 |
| `.settingModal-bk2ogj .user` | margin-bottom | **25px** | 同上 |
| `.settingModal-bk2ogj .user .username` | font-size / margin-left | **12px** / **3px** | 同上 |
| `.container-z0UBUY .top-bar` / `.username` | — | 同结构第二处实现（`table-CqZ8x2` / `.access-token-action`） | 同上 |
| `.c-api-api-manage-import-edas-module__tabs__title` | padding / display | **9px 8px** / flex | 同上 |
| `.c-api-api-manage-import-edas-module__tabs__pane` | width | **400px** | 同上 |
| `.c-environment-dubbo-registration-center-form-registration-center-option__form` | width | **240px** | 同上 |
| `.copyable-RsncZh:hover`（settings_content） | text-decoration | underline dashed | `settings_content.10b6da72.css` |
| `.highlight-bg-xOVEMl` | font-size / line-height | 14px / **22px** | 同上 |
| `.formModalFooter-WVapLT .left-action` | width / line-height | **120px** / **32px** | 同上 |
| `.formModalFooter-WVapLT button + button` | margin-left | **8px** | 同上 |
| `.overlayClassName-Gil1o4 .ui-tooltip-inner` | max-height / overflow-y | **300px** / auto | 同上 |
| `.iframeModal-n_4Gnt .ui-modal-content` | background | #fff（固定浅色，不随主题） | 同上 |

### 3. 文案（i18n key → 中文）

| key | 中文 |
|---|---|
| `menu.projectSettings` | 项目设置 |
| `menu.projectSettings.common` | 通用设置 |
| `menu.projectSettings.common.basic` | 基本设置 |
| `menu.projectSettings.common.gitBranch` | Git & Branches |
| `menu.projectSettings.common.members` | 成员管理 |
| `menu.projectSettings.common.featureSetting` | 功能设置 |
| `menu.projectSettings.common.notification` | 通知设置 |
| `menu.projectSettings.common.notification.events` | 通知事件 |
| `menu.projectSettings.common.notification.events.create` / `.update` | 新建通知事件 / 修改通知事件 |
| `menu.projectSettings.common.notification.settings` | 默认通知设置 |
| `menu.projectSettings.data.dubboImportConfig` | 导入数据 |
| `menu.projectSettings.resource.alibabaCloudConfig` | 阿里云配置 |
| `projectSettings.gitConnection.title` | Git 仓库连接 |
| `projectSettings.gitConnection.repositoryType` / `.repository` | 仓库类型 / 仓库 |
| `projectSettings.gitConnection.deleteModal.title` | 删除 Git 仓库连接 |
| `projectSettings.gitConnection.deleteModal.warning` | 确认删除此仓库吗？删除后，与此仓库关联的模块将无法快速/定时导入数据，自动备份将停止。 |
| `projectSettings.gitConnection.deleteModal.confirmLabel` / `.inputPlaceholder` | 请输入仓库名以确认删除： / 请输入仓库名 |
| `projectSettings.gitConnection.deleteModal.hasRelatedDataSources` | 此 Git 仓库连接关联了 {count} 个数据源，无法直接删除。请先在「绑定数据源」页面解除关联或删除这些数据源。 |
| `autoImport.rootFolder` / `.column.latestImportAt` / `.column.action` / `.column.action.detail` | 根目录 / 最近导入时间 / 操作 / 详情 |
| `autoImport.group.deleted` / `.tooltip` | 目标目录已被删除 / 继续导入将新建目标目录 |
| `message.deleteSuccess` / `message.deleteFailure` | 删除成功 / 删除出错 |
| `confirm.delete` | 确定删除？ |
| `organization.githubEnterprise.title` | GitHub Enterprise Cloud |
| `organization.gitlab.title` | 组织 GitLab |
| `ai.features` / `ai.features.enable.title` | AI 功能 / 开启 AI 功能 |
| `ai.features.llmModel.providers` / `.default` | 模型供应商 / 默认模型 |
| `ai.features.llmModel.provider.add` / `.setup` / `.setup.btn` | 添加供应商 / 编辑供应商 / 编辑 |
| `organization.rename.modal.title` / `.button` | 重命名你的组织？ / 修改组织名称 |
| `organization.rename.error.length` / `.invalid` | 组织名称必须至少包含 3 个字符 / 组织名称无效 |
| `organization.transfer.modal.title` / `.label.recipient` | 移交组织 / 接收人 |
| `organization.dismiss.modal.alert` / `organization.transfer.modal.button.confirm` | 解散<strong>{organizationName}</strong>组织后，该组织下的所有项目都将被同步删除，且不可恢复！ / 解散组织 |
| `organization.githubEnterprise.notConfigured` | 未配置 |

### 4. 数据来源与交互

- 项目设置：`/api/v1/projects`（基本设置）、`/api/v1/project-members`、`/api/v1/auto-import-settings`、`/api/v1/current-user/git-connections`（+ `azure-organizations` / `bitbucket-*` / `github-app/status`）
- 组织设置：`/api/v1/organizations`、`/api/v1/team-members`、`/api/v1/user/notification-settings`、`/api/v1/payment/*`（套餐/试用/账单）
- AI 功能：`ai.features.*` 键族；关闭后全组织隐藏 AI 入口（`ai.features.enable.org.description`）
- 破坏性操作（删 Git 连接 / 解散组织 / 移交）均要求输入名称二次确认（`confirmLabel` + `inputPlaceholder`）

### 5. 对 dsh-postapi 的映射建议

**可复用现有类**：`.pp-cols-2` / `.pp-pane` / `.pp-card` / `.pp-card-title` / `.pp-form-row` / `.pp-form-grid` / `.pp-form-label` / `.pp-input` / `.pp-input-mono` / `.pp-mono` / `.pp-ellipsis` / `.pp-muted` / `.pp-note` / `.pp-note-bad` / `.pp-note-ok` / `.pp-toolbar` / `.pp-toolbar-spacer` / `.pp-overview-head` / `.pp-overview-title` / `.pp-overview-actions` / `.pp-overview-content` / `.pp-btn` / `.pp-btn-primary` / `.pp-btn-sm` / `.pp-btn-danger` / `.pp-select` / `.pp-meta` / `.pp-page` / `.pp-error-text`。

**需要新增的类**：

| 需要新增的类名 | 语义 | 期望样式 |
|---|---|---|
| `.pp-settings-layout` | 设置页左菜单 + 右内容 | `display: grid; grid-template-columns: var(--panel-w) minmax(0, 1fr); gap: var(--sp-4); align-items: start;` |
| `.pp-settings-menu` | 设置左菜单容器 | `display: flex; flex-direction: column; gap: 0; padding: var(--sp-2) 0;` |
| `.pp-settings-menu-item` | 菜单项（32px 高、左缩进 16） | `display: flex; align-items: center; gap: var(--sp-1); width: calc(100% - 16px); height: var(--ctl-h); margin: 0 0 var(--sp-1) var(--sp-4); padding: 0 var(--sp-2); font-size: var(--fs-14); color: var(--fg); border-radius: var(--radius-ctl); cursor: pointer;` |
| `.pp-settings-menu-item[data-active="true"]` | 菜单选中 | `color: var(--accent); background: var(--bg-selected);` |
| `.pp-settings-menu-sub` | 子菜单项（再缩进 8px） | `width: calc(100% - 24px); height: var(--ctl-h); line-height: var(--ctl-h);` |
| `.pp-settings-list` | 设置列表（限高滚动） | `max-height: calc(var(--row-h) * 11); overflow-y: auto;`（≈348px） |
| `.pp-settings-list-item` | 列表条目 | `padding: var(--sp-3) 0;` |
| `.pp-settings-name` | 主名 | `font-size: var(--fs-14); font-weight: var(--fw-medium); line-height: var(--lh-22); color: var(--fg);` |
| `.pp-settings-sub` | 次行（最近访问时间等） | `font-size: var(--fs-12); line-height: var(--lh-22); color: var(--fg-tertiary);` |
| `.pp-row-action` | 表格/列表行内 28×28 动作钮 | `display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: var(--radius-sm);` |
| `.pp-alert` | 提示块（灰底圆角无边框） | `padding: var(--sp-3); margin-top: var(--sp-2); border: none; border-radius: var(--radius-lg); background: var(--bg-subtle); user-select: text;` |
| `.pp-danger-row` | 失败/危险行整行描边 | `.pp-danger-row > td { border-top: 1px solid var(--error); border-bottom: 1px solid var(--error); } .pp-danger-row > td:first-child { border-left: 1px solid var(--error); } .pp-danger-row > td:last-child { border-right: 1px solid var(--error); }` |
| `.pp-confirm-input` | 破坏性操作二次确认输入行 | `display: flex; flex-direction: column; gap: var(--sp-1); margin-top: var(--sp-2);` |

---
## 15. 汇总：lead 需要补的 CSS 类清单

> 说明：以下清单只包含 **§1-§14 中标注"需要新增"** 的类。已存在同名语义类但尺寸/结构与 Apifox 实测不符的，另列在 §15.2。

### 15.1 新增类（按页面归属，83 行 / 81 个唯一类名，其中 `.pp-tabbar-item` 与 `.pp-table` 已存在、只新增状态变体，故真正新增 80 个）

| 归属页 | 类名 | 语义 | 关键样式 |
|---|---|---|---|
| 骨架 | `.pp-tabbar-item[data-active="true"]` | 激活页签 | `border-left/right: 1px solid var(--border);` + `::before{height:2px;background:var(--accent)}`（需 `position: relative`） |
| 骨架 | `.pp-tabbar-item + .pp-tabbar-item::before` | 未激活页签竖线 | `width:1px;height:24px;background:var(--border-strong);left:0;top:50%;translateY(-50%)` |
| 骨架 | `.pp-tabbar-pin` | 页签固定图标 | `flex:none;width:12px;height:12px;color:var(--fg-tertiary);margin-left:var(--sp-1)` |
| doc | `.pp-doc-visibility` | 可见性下拉槽 | `flex:none;width:120px` |
| doc | `.pp-doc-tag-pop` | 标签弹层容器 | `display:flex;flex-wrap:wrap;gap:var(--sp-2);padding:var(--sp-2)` |
| doc | `.pp-doc-tag-chip` | 标签胶囊 | `inline-flex;height:var(--pill-h);padding:0 var(--sp-2);font-size:var(--fs-12);border:1px solid var(--border-strong);border-radius:var(--radius-pill)` |
| doc | `.pp-editor-shell` | Markdown 编辑器外壳 | `flex column;height:100%;border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden` |
| doc | `.pp-editor-toolbar` | 编辑器工具条 | `flex;gap:var(--sp-1);height:var(--ctl-h-lg);padding:0 var(--sp-2);border-bottom:1px solid var(--border)` |
| doc | `.pp-editor-status` | 编辑器状态条 | `flex;justify-content:flex-end;height:var(--ctl-h-sm);padding:0 var(--sp-2);font-size:var(--fs-12);color:var(--fg-tertiary);border-top:1px solid var(--border)` |
| debug | `.pp-url-bar` | 新版 URL 胶囊容器 | `flex;gap:var(--sp-1);height:var(--ctl-h);padding:var(--sp-1);background:var(--bg-subtle);border:1px solid var(--border);border-radius:var(--radius-card);transition:border-color .2s` |
| debug | `.pp-url-bar[data-focused="true"]` | URL 聚焦态 | `border-color:var(--accent);background:var(--bg-surface)` |
| debug | `.pp-url-bar-method` | URL 内 method 胶囊 | `flex:none;padding:1px var(--sp-2);border-radius:var(--radius-sm);background:var(--bg-hover)` |
| debug | `.pp-send-split` | 发送按钮组 | `:first-child{width:calc(100% - 25px)} :last-child{width:25px;border-left:1px solid var(--border)}` |
| debug | `.pp-response-bar` | 响应顶栏 | `flex;gap:var(--sp-2);min-height:var(--ctl-h);padding:0 var(--sp-2);border-bottom:1px solid var(--border)` |
| debug | `.pp-json-viewer-btn` | JSON 视图图标钮 | `inline-flex;center;24×24;border-radius:var(--radius-sm);color:var(--fg-secondary)` |
| debug | `.pp-dashline` | 虚线分隔 | `border-top:1px dashed var(--border);width:100%;height:1px;margin:var(--sp-2) 0;box-sizing:border-box` |
| mock | `.pp-mock-code` | Mock 示例入口 | `inline-flex;height:var(--ctl-h-sm);color:var(--accent);background:transparent;border:none;cursor:pointer` |
| mock | `.pp-mock-empty` | Mock 空态 | `flex column;center;padding:var(--ctl-h-lg) 0` |
| mock | `.pp-mock-row-action` | 行内 Mock 动作 | `display:none` + `.pp-table tbody tr:hover .pp-mock-row-action{display:inline-flex}` |
| schema | `.pp-form-block` | 表单区块 | `margin-bottom:var(--sp-5)` |
| schema | `.pp-form-block-title` | 区块标题 | `font-size:var(--fs-16);font-weight:var(--fw-medium);margin-bottom:var(--sp-5)` |
| schema | `.pp-form-block-subtitle` | 区块副标题 | `font-size:var(--fs-14);margin-bottom:var(--sp-1)` |
| schema | `.pp-form-block-desc` | 区块说明 | `font-size:var(--fs-12);color:var(--fg-secondary)` |
| schema | `.pp-field-filled` | filled 描述输入 | `min-height:calc(var(--row-h) + var(--sp-3));background:var(--bg-subtle);border-color:transparent;padding:var(--sp-2) var(--sp-3)` |
| schema | `.pp-doc-block` | 灰底文档块 | `flex column;gap:var(--sp-4);padding:var(--sp-4);background:var(--bg-subtle);border-radius:var(--radius-card)` |
| schema | `.pp-chip` | 计数小胶囊 | `inline-flex;center;min-width:16px;min-height:16px;padding:0 var(--sp-1);margin-left:var(--sp-1);font-size:var(--fs-12);line-height:16px;border-radius:var(--radius-pill);background:var(--bg-hover)` |
| schema | `.pp-popover-edit` | 悬浮编辑钮 | `position:absolute;top:var(--sp-1);right:var(--sp-1);width:18px;height:18px;border-radius:2px` |
| env | `.pp-env-menu-item` | 环境列表条目 | `flex;gap:var(--sp-1);height:var(--ctl-h);padding:var(--sp-1) var(--sp-2) var(--sp-1) var(--sp-1);border-radius:var(--radius-ctl);cursor:pointer` |
| env | `.pp-env-menu-item[data-active="true"]` | 条目选中 | `color:var(--accent);background:var(--bg-selected)` |
| env | `.pp-env-menu-action` | 条目行内动作 | `display:none;28×28;border-radius:var(--radius-sm)` + hover 显示 |
| env | `.pp-color-swatches` | 颜色网格 | `grid;repeat(auto-fill,32px);gap:var(--sp-3)` |
| env | `.pp-color-swatch` | 圆形色块 | `32×32;border-radius:50%;flex center;transition:color .24s` |
| env | `.pp-server-row` | 前置 URL 行 | `flex;font-size:var(--fs-14);line-height:var(--lh-22)` |
| env | `.pp-server-sep` | URL 分隔符 | `text-align:center;pointer-events:none;padding:0` |
| env | `.pp-env-tag` | 环境标签 | `cursor:pointer;margin-right:var(--sp-1)` |
| history | `.pp-split-pane` | 上下分栏外壳 | `flex column;min-height:0;border-top:1px solid var(--border)` |
| history | `.pp-split-mask` | 分栏拖拽条 | `position:relative;flex:none;height:var(--sp-2);cursor:row-resize;background:var(--bg-subtle)` |
| history | `.pp-split-btn` | 分栏按钮 | `display:none;absolute;center;var(--ctl-h-sm)²;border-radius:var(--radius-sm)` + mask hover 显示 |
| history | `.pp-history-actions` | 顶栏动作组 | `flex` + `.pp-history-actions > .pp-btn{width:105px;margin-left:var(--sp-2)}` |
| history | `.pp-highlight-block` | 回放高亮 | `box-shadow:0 0 0 4px var(--accent-tint);border-radius:var(--radius-lg);transition:box-shadow .3s` |
| test | `.pp-table-toolbar` | 表格动作条 | `flex;gap:var(--sp-1);height:50px;padding:var(--sp-2) var(--sp-3);border-bottom:1px solid var(--border);border-radius:var(--radius-lg) var(--radius-lg) 0 0;overflow-x:auto` |
| test | `.pp-table-search` | 表格搜索框 | `width:216px;min-width:216px;height:var(--ctl-h);margin-left:auto` |
| test | `.pp-table-filter` | 表格筛选 | `width:148px;min-width:120px;margin-right:var(--sp-1)` |
| test | `.pp-cell-title` | 单元格主标题 | `width:100%;font-size:var(--fs-14);line-height:var(--lh-22);nowrap+ellipsis` |
| test | `.pp-cell-desc` | 单元格副标题 | `width:100%;font-size:var(--fs-12);line-height:var(--lh-20);color:var(--fg-secondary);nowrap+ellipsis` |
| test | `.pp-vdivider` | 竖分隔 | `width:1px;height:12px;margin:0 var(--sp-2);background:var(--border)` |
| test | `.pp-empty-ring` | 空态双层圆环 | `64×64;border:2px solid var(--border);border-radius:var(--radius-pill);flex center;padding:var(--sp-1)` |
| test | `.pp-status-running` / `.pp-status-success` / `.pp-status-fail` / `.pp-status-pause` | 报告状态色 | 分别 `var(--accent)` / `var(--success)` / `var(--error)` / `var(--warning)`（三个色 token 均已存在，见 15.3） |
| test | `.pp-modal-shell` | 弹层外壳 | `flex column;min-width:0` |
| test | `.pp-modal-head` | 弹层头部 | `flex;space-between;height:var(--ctl-h-lg);padding:0 var(--sp-3);border-bottom:1px solid var(--border)` |
| test | `.pp-modal-strip` | 弹层次级标题条 | `flex;space-between;padding:6px var(--sp-3);font-size:var(--fs-12);line-height:var(--lh-20);background:var(--bg-app);border-top:1px solid var(--border)` |
| test | `.pp-flow-block` | 编排块容器 | `padding:var(--sp-5);border:1px solid var(--border);border-radius:0 var(--radius-lg) var(--radius-lg)` |
| import | `.pp-mode-card` | 导入方式卡 | `padding:var(--sp-2) var(--sp-3) var(--sp-3);margin-top:var(--sp-3);border-radius:var(--radius-lg);background:var(--accent-tint)` |
| import | `.pp-mode-label` | 方式说明行 | `flex;font-size:var(--fs-14);line-height:var(--lh-22);margin-bottom:var(--sp-1)` |
| import | `.pp-mode-divider` | 方式竖分隔 | `width:1px;height:13px;margin:0 var(--sp-1);background:var(--border)` |
| import | `.pp-preview-tree` | 预览树 | `max-height:calc(var(--row-h) * 14);overflow:auto;padding:var(--sp-1) 0` |
| import | `.pp-preview-search` | 预览树搜索 | `width:calc(100% - var(--sp-5));margin:0 var(--sp-2) var(--sp-3)` |
| import | `.pp-import-result` | 导入结果表 | `margin-top:var(--sp-6)` + `td{padding:var(--sp-2) var(--sp-4)}` |
| import | `.pp-format-row` | 导出格式行 | `flex;gap:var(--sp-2);min-height:var(--ctl-h)` |
| flow | `.pp-flow-tabbar` | 场景页签条（48px） | `flex;gap:var(--sp-2);height:var(--ctl-h-lg);margin:0 var(--sp-4);border-bottom:1px solid var(--border)`（严格 48px 需 `--tabbar-lg`） |
| flow | `.pp-flow-tab` | 场景页签 | `flex column;center;gap:var(--sp-1);min-width:76px;font-size:var(--fs-12)` |
| flow | `.pp-cli-block` | CLI 命令块 | `position:relative;margin-top:var(--sp-3);padding:var(--sp-2) var(--sp-3);padding-right:var(--ctl-h-lg);font-family:var(--font-mono);font-size:var(--fs-13);line-height:var(--lh-22);background:var(--bg-subtle);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer` |
| flow | `.pp-cli-copy` | 复制钮 | `position:absolute;top:0;right:0;padding:var(--sp-2);inline-flex;center` |
| flow | `.pp-tips-list` | 项目符号列表 | `flex column;gap:var(--sp-2);margin:0;padding:0;list-style:none;font-size:var(--fs-14);line-height:var(--lh-22);color:var(--fg-secondary)` |
| flow | `.pp-tips-list > li::before` | 列表圆点 | `content:"";inline-block;4×4;margin:-3px var(--sp-2) 0;border-radius:var(--radius-pill);background:var(--fg-secondary);vertical-align:middle` |
| flow | `.pp-drag-handle` | 拖拽柄 | `absolute;top/left 50%;translate(-50%,-50%);opacity:0;cursor:move;color:var(--fg-tertiary)` + row hover 显示 |
| flow | `.pp-form-panel` | 灰底表单块 | `padding:var(--sp-5);margin:0 var(--sp-1) var(--sp-1);border:1px solid var(--border);border-radius:var(--radius-card);overflow:hidden` |
| search | `.pp-search-history` | 搜索历史行 | `flex;height:calc(var(--ctl-h) + var(--sp-1));font-size:var(--fs-12);color:var(--fg-secondary)` |
| search | `.pp-search-history-sep` | 历史竖线 | `width:1px;height:17px;margin:0 var(--sp-2);background:var(--border)` |
| search | `.pp-search-exact` | 精确搜索开关 | `inline-flex;gap:var(--sp-1);font-size:var(--fs-12);color:var(--fg-secondary)` |
| settings | `.pp-settings-layout` | 设置页布局 | `grid;var(--panel-w) minmax(0,1fr);gap:var(--sp-4);align-items:start` |
| settings | `.pp-settings-menu` | 设置菜单容器 | `flex column;gap:0;padding:var(--sp-2) 0` |
| settings | `.pp-settings-menu-item` | 菜单项 | `flex;gap:var(--sp-1);width:calc(100% - 16px);height:var(--ctl-h);margin:0 0 var(--sp-1) var(--sp-4);padding:0 var(--sp-2);font-size:var(--fs-14);border-radius:var(--radius-ctl);cursor:pointer` |
| settings | `.pp-settings-menu-item[data-active="true"]` | 菜单选中 | `color:var(--accent);background:var(--bg-selected)` |
| settings | `.pp-settings-menu-sub` | 子菜单项 | `width:calc(100% - 24px);height:var(--ctl-h);line-height:var(--ctl-h)` |
| settings | `.pp-settings-list` | 设置列表 | `max-height:calc(var(--row-h) * 11);overflow-y:auto` |
| settings | `.pp-settings-list-item` | 列表条目 | `padding:var(--sp-3) 0` |
| settings | `.pp-settings-name` | 主名 | `font-size:var(--fs-14);font-weight:var(--fw-medium);line-height:var(--lh-22);color:var(--fg)` |
| settings | `.pp-settings-sub` | 次行 | `font-size:var(--fs-12);line-height:var(--lh-22);color:var(--fg-tertiary)` |
| settings | `.pp-row-action` | 行内 28×28 动作钮 | `inline-flex;center;28×28;border-radius:var(--radius-sm)` |
| settings | `.pp-alert` | 提示块 | `padding:var(--sp-3);margin-top:var(--sp-2);border:none;border-radius:var(--radius-lg);background:var(--bg-subtle);user-select:text` |
| settings | `.pp-danger-row` | 危险行描边 | 四边 `1px solid var(--error)`（`td:first-child` 左、`td:last-child` 右） |
| settings | `.pp-confirm-input` | 二次确认输入行 | `flex column;gap:var(--sp-1);margin-top:var(--sp-2)` |

### 15.2 可复用的现有类（按语义分组，252 个 `.pp-*`，占 `design-tokens.css` 全部 255 个 `.pp-*` 类的 98.8%）

| 语义组 | 现有类 |
|---|---|
| 骨架/布局 | `pp-scope` `pp-workbench-v2` `pp-topbar` `pp-topbar-brand` `pp-topbar-title` `pp-topbar-spacer` `pp-topbar-search` `pp-crumb` `pp-crumb-sep` `pp-shell` `pp-sider` `pp-sider-group` `pp-sider-item` `pp-sider-icon` `pp-sider-label` `pp-sider-spacer` `pp-tabbar` `pp-tabbar-item` `pp-tabbar-close` `pp-main-v2` `pp-page` `pp-page-flush` `pp-page-head` `pp-page-head-main` `pp-page-title` `pp-page-desc` `pp-page-actions` `pp-body-2col` `pp-body-3col` `pp-col` `pp-col-left` `pp-col-right` `pp-split` `pp-split-wide` `pp-pane` `pp-panel` |
| 页头（12 页共用） | `pp-overview-head` `pp-overview-title` `pp-overview-actions` `pp-overview-content` |
| 控件 | `pp-btn` `pp-btn-primary` `pp-btn-sm` `pp-btn-ghost` `pp-btn-danger` `pp-btn-accent` `pp-btn-link` `pp-icon-btn` `pp-input` `pp-input-sm` `pp-input-mono` `pp-select` `pp-textarea` `pp-json-editor` `pp-seg` |
| 容器 | `pp-card` `pp-card-title` `pp-card-hover` `pp-empty` `pp-empty-icon` `pp-empty-text` `pp-empty-action` `pp-note` `pp-note-ok` `pp-note-warn` `pp-note-bad` `pp-error-text` |
| 树/列表 | `pp-tree` `pp-tree-group` `pp-tree-row` `pp-tree-switcher` `pp-tree-icon` `pp-tree-row-count` `pp-list` `pp-list-row` `pp-result-row` `pp-toc` `pp-toc-item` `pp-md-list` |
| 表格 | `pp-table` `pp-table-wrap` `pp-table-wide` `pp-table-params` `pp-table-vars` `pp-table-mono` `pp-table-add` `pp-cell-input` `pp-field` `pp-field-head` |
| 页签 | `pp-tabs` `pp-tab` `pp-toolbar` `pp-toolbar-inline` `pp-toolbar-spacer` `pp-group-title` `pp-group-head` |
| 表单 | `pp-form-grid` `pp-form-row` `pp-form-label` `pp-cols-2` `pp-body-head` |
| 文档 | `pp-doc-head` `pp-doc-main` `pp-doc-title` `pp-doc-h1` `pp-doc-h2` `pp-doc-h3` `pp-doc-section` `pp-anchor-bar` `pp-anchor-chip` `pp-pre` `pp-pre-scroll` `pp-aside-sticky` `pp-scroll` |
| 调试台 | `pp-debug-page` `pp-debug-split` `pp-debug-request` `pp-debug-response` `pp-debug-meta` `pp-debug-tabbody` `pp-url-row` `pp-url-method` `pp-url-pill` `pp-url-pill-grow` `pp-send-group` `pp-resp-tabs` `pp-resp-bar` `pp-resp-count` `pp-json-tree` `pp-script-block` |
| 概览 | `pp-ov-summary` `pp-ov-summary-num` `pp-ov-summary-desc` `pp-stats` `pp-stat` `pp-stat-value` `pp-stat-label` `pp-ov-modules` `pp-ov-counts` `pp-ov-count` `pp-ov-count-num` `pp-ov-count-label` `pp-ov-divider` `pp-ov-functions` `pp-ov-left` `pp-ov-right` `pp-ov-action` `pp-ov-current` `pp-ov-current-value` `pp-ov-form` `pp-ov-cards` `pp-ov-card` `pp-ov-card-title` `pp-ov-card-info` `pp-overview-grid` |
| 环境 | `pp-env-layout` `pp-env-side` `pp-env-side-head` `pp-env-main` `pp-env-pane` `pp-env-fields` `pp-env-field` `pp-env-field-row` `pp-env-check` `pp-env-tree` `pp-env-vars-empty` `pp-priority-list` `pp-priority-item` `pp-priority-level` `pp-priority-body` `pp-priority-scope` `pp-priority-note` |
| Mock | `pp-mock-layout` `pp-mock-side` |
| 导入导出 | `pp-io-layout` `pp-io-body` `pp-io-side` `pp-io-side-title` `pp-io-item` `pp-io-main` `pp-io-head` `pp-io-title` `pp-io-input` `pp-io-stats` `pp-io-pre` `pp-io-sample` |
| 流程 | `pp-flow-layout` `pp-flow-side` `pp-flow-side-head` `pp-flow-steps` `pp-flow-step` `pp-flow-step-no` `pp-flow-step-body` `pp-flow-step-name` `pp-flow-step-msg` `pp-flow-step-act` `pp-flow-main` `pp-flow-canvas` `pp-flow-props` `pp-flow-prop-grid` `pp-flow-prop-row` `pp-flow-source` `pp-flow-name` `pp-seq-wrap` `pp-split-hint` |
| 搜索 | `pp-search-bar` `pp-search-project` `pp-search-input` `pp-search-btn` `pp-search-source` `pp-search-hint` `pp-search-results` `pp-search-group` `pp-search-group-head` `pp-search-caret` `pp-search-group-label` `pp-search-count` `pp-search-list` `pp-search-row` `pp-search-dot` `pp-search-name` `pp-search-sub` `pp-search-summary` `pp-search-mark` |
| 原子 | `pp-method` `pp-pill` `pp-pill-ok` `pp-pill-warn` `pp-pill-bad` `pp-pill-accent` `pp-meta` `pp-muted` `pp-faint` `pp-mono` `pp-ellipsis` `pp-ok` `pp-warn` `pp-bad` `pp-accent` |
| 菜单/浮层 | `pp-menu` `pp-menu-item` `pp-menu-anchor` `pp-menu-arrow` `pp-menu-group` `pp-menu-hint` `pp-menu-label` `pp-menu-scroll` `pp-menu-sep` `pp-help-card` `pp-help-card-head` `pp-help-card-title` `pp-help` |

### 15.3 缺失的 token（lead 需补）

| token | 建议值 | 用途 | 依据 |
|---|---|---|---|
| `--tabbar-lg` | `48px` | 场景页签条严格 48px（`testScenarioTabList > .ui-tabs-nav height 48`） | `async_test_scenario.99d5f5a6.css` |
| `--toolbar-h` | `50px` | 报告表头高 50px（`.header-WI00Y3 height 50`） | `async_api_test_report_list.3e5dcd93.css` |

> 注：色 token 已齐备，**无需新增**。实测 `design-tokens.css` 中 `.pp-ok { color: var(--success); }`（L937）、`.pp-warn { color: var(--warning); }`（L938）、`--error` 均已有定义，本规格的 `.pp-status-*` 直接复用这三个 token。仅 `--tabbar-lg`（48px）与 `--toolbar-h`（50px）两个尺寸 token 是可选新增——若 lead 不接受新增 token，可用 `height: var(--ctl-h-lg)`（40px）与 `height: calc(var(--row-h) + var(--sp-4))`（48px）近似。

### 15.4 契约偏离

本任务**未改动任何 `src/` 与 `tests/` 文件**，无契约偏离。规格中标注的偏离仅为"Apifox 原值与 dsh 现有实现不同"，供 lead 决策：

| # | 项 | Apifox 实测 | dsh-postapi 现状 | 建议 |
|---|---|---|---|---|
| 1 | 调试台 URL 行高 | 旧版 40px / 新版 32px（`.container-ZbOHiC`） | `.pp-url-row` 用 `--ctl-h-lg`(40px) | 复刻旧版即可；若复刻新版需改用 `.pp-url-bar`（32px 灰底胶囊） |
| 2 | 场景页签条高 | 48px | `.pp-tabbar` 是全局 44px | 加 `--tabbar-lg` 或直接写 `height: var(--ctl-h-lg)`（40px，视觉差异 8px） |
| 3 | 报告表头高 | 50px | 无对应类 | 新增 `.pp-table-toolbar`（50px） |
| 4 | 文档页内容 padding | 16px | `.pp-doc-main` 无内边距（由子块承担） | 保持现状，用 `.pp-doc-section` 的 padding-top 达成同样观感 |
| 5 | 设置列表限高 | 348px | 无对应类 | `.pp-settings-list` 用 `calc(var(--row-h) * 11)` = 352px（近似，避免硬编码） |

### 15.5 遗留问题

1. **27733（`async_http_api_case`）没有独立 JS 文件**：chunk 名与 CSS 都存在，但组件模块内联进 `index.4fed96b5fcebc02a.js`。本规格对调试台的类名证据来自 `75562.c28acf4d.async.js`（组件体）+ 两套 CSS，未能从 `27733` 直接抽类名序列——若后续需要调试台组件的精确 JSX 结构，须对 `index` 全量跑 REA（会超出当前 retained representation 额度，需先 `export_evidence_bundle` 或重置会话）。
2. **CSS Modules 语义映射在 minify 后大量丢失**：本规格用 CSS 选择器前缀做语义名（`.tree-title-Z15otb` → `tree-title`），成对映射只捞到 api_case 4 对、overview 1 对、org_settings 8 对、global_component 9 对。若某类名的语义前缀本身被压缩（如 `.left-Gj8Uxk`、`.right-GH0jb9`、`.info-_GGeg_`），语义由上下文推断，已在 §1-§14 标注。
3. **全局搜索无独立 chunk**：Apifox 的搜索是顶栏输入 + 下拉面板（`api.action.processor.Search`），不是独立页面；`#/search` 是 dsh-postapi 的本地设计。§13 的映射建议按"面板结果列表"给出，若要 1:1 复刻需把搜索改成顶栏 popover（属结构改动，需 lead 决策）。
4. **REA retained representation 额度**：单次 `analyze_javascript_application` 在选 20 个 chunk 时触发 `resource_constraint`（`retained_representation_bytes 395326342` / `maximum 1066360540`）。本规格最终取证用的是 2 个 chunk（`32636` + `23168`）的 view，其余页面证据走静态正则 + CSS 解析。后续若需扩大 REA 覆盖，须先 `reset_investigation` 或 `export_evidence_bundle`。
5. **`sequence.jsx` 无对应路由**：`src/client/pages/sequence.jsx` 存在但不在 12 条路由内，也无 `__postapiQueue` 自注册；本规格未拆解（Apifox 无对应物）。
6. **主题深色值**：本规格只抽浅色字面量；Apifox 深色覆盖散落在各页 CSS（如 `async_side_apidoc.01bdbc18.css` 的 `[data-theme=dark] .card-*`），dsh-postapi 的 `.pp-scope[data-theme="dark"]` 已有 8 个 token 覆盖，未逐页比对深色差异。

---

## 16. 验收

| 项 | 命令 | 结果 |
|---|---|---|
| 全量测试 | `node tests/run.js` | 通过 346 / 失败 0（本任务未改代码，基线未回退） |
| 构建 | `node build.mjs` | 未执行（本任务不产出构建物） |
| 页面自注册 | `node tests/pages-b.test.js` | 未执行（本任务不产出页面） |
| 文档结构 | 本文件 §1-§14 每节 5 个子节（结构 / CSS 实测值 / 文案 / 数据来源 / 映射建议） | 齐全 |
| 数值来源 | 每条 CSS 值标注来源文件 | 齐全 |
| 映射建议 | 每节 §5 分列「可复用现有类」与「需要新增的类」 | 齐全 |

---

> 本文件为静态取证结论，未运行 Apifox 程序；所有数值均可在 `.research/apifox/app/dist/renderer/` 对应 CSS 文件中用选择器原文检索复核。


**27733 的特殊性**：webpack 名称表给出 `27733:"async_http_api_case"` 与 `cssHash 4459d613`，但目录内没有 `27733.*.async.js`——该 chunk 的模块被内联进 `index.4fed96b5fcebc02a.js`，只有 CSS 单独落盘。调试台组件实体（含 `apiCase-CnGjmI` 类名）在 `75562.c28acf4d.async.js` + `75562.06930afc.css`。引用调试台尺寸时两处都要看：`75562.06930afc.css` 是**经典 40px URL 行**版本，`async_http_api_case.4459d613.css` 是**新版 32px 胶囊 URL 行**版本（`.container-ZbOHiC` 作用域下）。

---
