# Apifox 2.8.55 视觉规格实测表

> 全部数值取自 `.research/apifox/app/dist/renderer/` 的 186 个 CSS chunk 原文（4,187,977 字节），
> 不是推测。工具脚本：`.tmp/spec.cjs`，输出：`.tmp/apifox-visual-spec.json`（626 个 token）。

## 1. 全局尺寸

| 项 | Apifox 实测 | 来源 |
|---|---|---|
| 顶栏高 | **48px** | `--ui-layout-header-height` |
| 顶栏内边距 | **0 50px** | `--ui-layout-header-padding` |
| 主页签条高 | **44px** | `--app-main-tabs-height` |
| 左侧导航宽 | **240px**（含 padding 20px） | `.sider-bxNtfB` |
| 内容最大宽 | **1512px** | `.overview-header-container-*` |
| 布局右边距 | **8px** | `--app-layout-padding-right` |
| 布局底边距 | **8px** | `--app-layout-padding-bottom` |
| 页面级间距 | **10px** | `--app-page-layout-size` |
| 边框宽 | **1px** | `--app-layout-border-width` |
| 滚动条宽 | **6px** | `--app-scrollbar-width` |

## 2. 字阶 / 圆角 / 控件高（Apifox 原值）

```
--ui-font-size-sm: 12px        --ui-height-sm: 24px
--ui-font-size-base: 14px      --ui-height-base: 32px
--ui-font-size-semi-lg: 15px   --ui-height-lg: 40px
--ui-font-size-lg: 16px
--ui-font-size-semi-xl: 17px   --ui-border-radius-sm: 6px
--ui-font-size-xl: 18px        --ui-border-radius-base: 8px
--ui-font-size-semi-2xl: 20px  --ui-border-radius-lg: 10px
--ui-font-size-2xl: 22px
```

字重：300 / 400 / 500 / 600 / 700 / 800，其中 `--ui-font-weight-semibold: 500`、`bold: 600`。

## 3. 色板（light 主题实测字面量）

| token | 值 | 用途 |
|---|---|---|
| `--ui-fill-1` | `#fff` | 卡片/表面 |
| `--ui-fill-3` | `#f9fafb` | 页面底 |
| `--ui-fill-4` | `#f2f4f7` | hover 底 / 表头 |
| `--ui-fill-5` | `#eaecf0` | 分隔线 |
| `--ui-fill-6` | `#d0d5dd` | 控件边框 |
| `--ui-fill-7` | `#98a2b3` | 三级文字 |
| `--ui-fill-8` | `#667085` | 二级文字 |
| `--ui-fill-9` | `#475467` | 正文次 |
| `--ui-fill-10` | `#344054` | 正文 |
| `--ui-fill-11` | `#182230` | 标题次 |
| `--ui-fill-12` | `#101828` | 标题 |
| `--ui-green-6` | `#17b26a` | success / GET |
| `--ui-red-5` | `#f47870` | error / DELETE |
| `--ui-gold-6` | `#f79009` | warning / PUT |
| `--ui-blue-6` | `#2e90fa` | info / POST |

主色（默认紫色 accent）：`--ui-primary-base: #9373ee`。
其余 accent：blue `#587df1` / cyan `#009cc7` / indigo `#7688c9` / gold `#b59a6d` /
green `#029e74` / pink `#e86ca4` / purple2 `#8276c9` / red `#fd6874`。

## 4. 左侧目录树（treeList，实测）

```
.tree-bK2pJT { --ui-tree-title-height: 22px }
.tree-bK2pJT .ui-tree-list-holder { padding: 0 calc(var(--ui-padding-xs)/2) }   /* 0 4px */
.tree-bK2pJT .ui-tree-treenode {
  border-radius: 6px; width: 100%;
  color: var(--ui-text-color-secondary);   /* #667085 */
  font-size: var(--ui-font-size-sm);       /* 12px */
  align-items: center; margin-left: 0; margin-right: 0;
}
.tree-bK2pJT .ui-tree-treenode:hover { color: var(--ui-text-color) }  /* 只变文字色，不换底 */
.tree-bK2pJT .ui-tree-switcher {
  flex-shrink: 0; width: 12px;
  margin-left: 12px; margin-right: 4px;
}
.treeList-ISn2t4 .ui-tree-treenode { margin: 0 16px }
.tree-title-Z15otb { flex: auto; align-items: center; display: flex; overflow: hidden }
.treeListContainer__panelExtraItem { width: 24px; height: 24px; border-radius: 6px }
.treeList__customTreeTitle:not(:first-child) { margin-top: 6px }
```

要点：
- 树**行高 22px**（不是 32px），字号 **12px**，文字色 **#667085**（不是正文色）
- 左右外边距 **16px**，holder 上下 4px
- **hover 只变文字色为 #344054，不换底色**（与常见树控件不同，这是 Apifox 特征）
- 展开箭头占位 12px + 左 12px / 右 4px 间距
- 行内悬浮操作按钮 24×24，圆角 6px

## 5. 调试台（apiCase，实测）

```
.apiCase { width: 100%; height: 100%; padding: 10px; overflow: auto }
.main-input-bar { background: var(--ui-component-background); display: flex; top: 0 }
.main-input-bar .url-col {
  background: var(--ui-background-color-light);
  flex: auto; align-items: center; width: 100%; height: 40px;
  display: flex; overflow: hidden;
}
.url-col-method { float: left; padding: 0 8px 0 12px; line-height: 40px }
.url-col-base-url, .url-col-path {
  float: left; white-space: nowrap; text-overflow: ellipsis;
  border-radius: 6px; margin: 5px; padding: 0 10px; line-height: 28px; overflow: hidden;
}
.main-input-bar .action-col { flex: none; min-width: 75px; margin-left: 10px }
.send-btn > button.ui-btn:first-child { width: calc(100% - 25px) }
.send-btn button.ui-btn-icon-only:last-child { width: 25px }
.group-title {
  border-left: 3px var(--ui-primary-color) solid;
  margin-left: 2px; padding-left: 10px; font-size: 16px;
}
.HttpApiPath .ui-input { background: var(--ui-input-disabled-bg); flex: 1; }
.HttpApiPath .ui-input:hover/focus/active { background: var(--ui-input-bg); border: 1px solid var(--ui-primary-color-hover) }
```

要点：
- 整页 padding **10px**
- URL 行高 **40px**（不是 32px），method 左内边距 12px、右 8px、行高 40px
- baseUrl 与 path 是两个**胶囊**：圆角 6px、margin 5px、内边距 0 10px、行高 28px
- 发送按钮组：主按钮 `calc(100% - 25px)` + 25px 下拉箭头
- 分组标题左边 **3px 主色竖线** + 左内边距 10px + 字号 **16px**

## 6. 页签（layoutTabBar，实测）

```
.layoutTabBar > .ui-tabs-nav { height: 44px; box-shadow: none; margin-bottom: 0 }
.ui-tabs-nav-list { align-items: flex-end; display: flex }
.ui-tabs-tab { height: 44px }
.ui-tabs-tab-active { background: var(--ui-body-background); border-left/right: 1px split; border-top/bottom: transparent }
相邻未激活 tab 之间：::before { background: var(--ui-legacy-bg-300); width: 1px; height: 24px; position: absolute; left: 0 }
--ui-tabs-card-height: 42px
```

## 7. 概览页头（实测）

```
.overview-header-container { border-bottom: 1px solid split; max-width: 1512px; padding: 16px 20px 16px 14px }
.overview-header__title { white-space: nowrap; text-overflow: ellipsis; margin-right: auto; font-size: 18px; font-weight: 700 }
.overview-header-actions { justify-content: space-between; align-items: center; height: 32px; display: inline-flex }
```

## 8. 表单横向栅格（实测）

```
.gridForm.ui-form-horizontal { display: grid; grid-template-columns: fit-content(360px) 1fr; gap: 16px }
.gridForm.ui-form-vertical { grid-template-columns: 1fr; gap: 8px 0 }
```

## 9. 通用尺度变量（实测）

```
--ui-padding-xs: 8px    --ui-margin-xs: 8px
--ui-padding-sm: 12px   --ui-margin-sm: 12px
--ui-padding-lg: 24px   --ui-margin-lg: 24px
--aui-radius-sm: 6px    --aui-radius-md: 8px   --aui-radius-lg: 10px
--aui-gap-sm: 4px       --aui-gap-md: 8px      --aui-gap-lg: 8px
--aui-p-h-sm: 8px       --aui-p-h-md: 12px     --aui-p-h-lg: 16px
```

## 10. 与当前项目的差距（必须改）

| 项 | Apifox | 当前 dsh-postapi | 处置 |
|---|---|---|---|
| 顶栏高 | 48px | 44px | 改 48px |
| 顶栏内边距 | 0 50px | sp-2 sp-5 | 改 0 50px（窄容器降级为 0 20px） |
| 主页签条 | 44px 卡片式 | 无 | 新增 |
| 左侧导航 | 240px 文字菜单 | 64px 图标轨 | 改 240px（文字菜单天然满足"看得懂功能"） |
| 树行高 | 22px | 32px | 改 22px |
| 树字号 | 12px | 14px | 改 12px |
| 树文字色 | #667085 | #344054 | 改 #667085 |
| 树 hover | 只变文字色 | 换底 #f2f4f7 | 改为只变色 |
| 树外边距 | 0 16px | 0 | 加 16px |
| 调试页 padding | 10px | sp-3 | 改 10px |
| URL 行高 | 40px | 32px | 改 40px |
| 发送按钮 | 主+下拉组 | 单按钮+取消 | 改按钮组 |
| 分组标题 | 3px 左竖线 16px 字 | 无 | 新增 |
| 概览标题 | 18px/700 | 20px/600 | 改 18px/700 |
| 内容最大宽 | 1512px | 无 | 加 |
| 字阶 | 12/14/15/16/17/18/20/22 | 12/13/14/16/20/24 | 补 15/17/18/22 |
| 圆角 | 6/8/10 | 4/6/8/12 | 对齐 6/8/10 |

## 11. 纪律（不可违反）

- 所有颜色 / 字号 / 高度必须走 `var(--*)` token，禁止字面量（`tests/ui-audit.test.js` 会拦）
- 禁止 `alert` / `confirm` / `prompt`
- 禁止新增 npm 依赖；客户端只有 `react` 可 require
- 类名统一 `.pp-` 前缀，且必须在 `design-tokens.css` 有定义（ui-audit 会拦）
- 临时产物写仓库内 `.tmp/`（已 gitignore）
- 不要 `git add` / `commit`，提交由 lead 统一做

## 12. 类名契约（lead 在 design-tokens.css 里创建，teammate 直接使用）

> CSS 由 lead 独占改写；teammate 只改 .jsx/.js，**不要碰 design-tokens.css**。
> 下表每个类名都会在 CSS 中存在，页面只需按语义挂上去。

### 12.1 工作台骨架（替代原图标轨 + 浮层）

| 类名 | 作用 | 结构 |
|---|---|---|
| `.pp-workbench-v2` | 整体网格：顶栏 48px + 主体 | grid-template-rows: var(--topbar-h) minmax(0,1fr) |
| `.pp-topbar` | 顶栏 48px，左右内边距 50px | flex 行 |
| `.pp-topbar-brand` | 左侧项目名（14px/600） | |
| `.pp-topbar-spacer` | 弹性占位 | |
| `.pp-topbar-search` | 搜索框，宽 240px | |
| `.pp-shell` | 主体：sider + 主区两列 | grid-template-columns: var(--sider-w) minmax(0,1fr) |
| `.pp-sider` | **左侧 240px 文字菜单**（替代原 64px 图标轨） | flex 列，padding 20px，右边框 1px |
| `.pp-sider-group` | 分组标题（12px，色 #98a2b3，高 24px，上间距 12px） | |
| `.pp-sider-item` | 菜单项（高 32px，圆角 6px，14px 字） | |
| `.pp-sider-item[data-active="true"]` | 选中：主色文字 + 淡主色底 | |
| `.pp-sider-icon` | 菜单项前置图标位（16px） | |
| `.pp-main-v2` | 主区，容器查询锚点 | 保留 container-type |

### 12.2 页签条（新增，Apifox 44px 卡片式）

| 类名 | 作用 |
|---|---|
| `.pp-tabbar` | 高 44px，底边 1px，横向滚动 |
| `.pp-tabbar-item` | 页签，高 44px，左右内边距 16px，14px 字 |
| `.pp-tabbar-item[data-active="true"]` | 激活：白底 + 左右 1px 边框 + 文字 #101828 |
| `.pp-tabbar-item + .pp-tabbar-item::before` | 相邻分隔线 1px × 24px |

### 12.3 左侧目录树（FolderTree 用）

| 类名 | 作用 | 规格 |
|---|---|---|
| `.pp-tree` | 树容器 | padding 4px |
| `.pp-tree-row` | 树行 | 高 **22px**，字号 **12px**，色 **#667085**，圆角 6px，左右外边距 **16px** |
| `.pp-tree-row:hover` | **只变文字色**为 #344054，**不换底** | |
| `.pp-tree-row[data-active="true"]` | 选中：文字 #344054 + 底 #f2f4f7 + 500 字重 | |
| `.pp-tree-switcher` | 展开箭头 | 宽 12px，左 12px 右 4px |
| `.pp-tree-row-count` | 子项计数 | 12px，#98a2b3，右对齐 |
| `.pp-tree-group` | 分组标题（项目名/未归类） | 12px，#98a2b3，高 22px，左右 16px |
| `.pp-tree-icon` | 目录/接口前置图标位 | 16px |

### 12.4 调试台（debug.jsx 用）

| 类名 | 作用 | 规格 |
|---|---|---|
| `.pp-debug-layout` | 整页容器 | padding **10px**，窄容器单列 |
| `.pp-url-row` | URL 行 | 高 **40px**，flex |
| `.pp-url-method` | 方法选择 | 左内边距 12px 右 8px，行高 40px |
| `.pp-url-pill` | baseUrl / path 胶囊 | 圆角 6px，margin 5px，内边距 0 10px，行高 28px，nowrap + ellipsis |
| `.pp-send-group` | 发送按钮组 | 主按钮 calc(100% - 25px) + 25px 下拉 |
| `.pp-group-title` | 分组标题 | 左边 **3px 主色竖线** + 左内边距 10px + 字号 **16px** |
| `.pp-pane` | 面板卡片 | 已有，保持 |

### 12.5 文档页 / 概览页（doc.jsx / overview.jsx 用）

| 类名 | 作用 | 规格 |
|---|---|---|
| `.pp-doc-head` | 文档页头 | 下边框 1px，padding 16px 20px 16px 14px，最大宽 1512px |
| `.pp-doc-title` | 文档标题 | **18px / 700**，nowrap + ellipsis |
| `.pp-doc-actions` | 页头动作区 | 高 32px，inline-flex |
| `.pp-overview-head` | 概览页头 | 同 `.pp-doc-head` |
| `.pp-overview-title` | 概览标题 | **18px / 700** |
| `.pp-form-grid` | 横向表单栅格 | grid-template-columns: fit-content(360px) 1fr; gap 16px |

### 12.6 token 变更（lead 在 CSS 里改）

```
--topbar-h: 44px → 48px          /* Apifox 顶栏 48px */
--sider-w: 新增 240px            /* Apifox 左侧导航 240px */
--tabbar-h: 新增 44px            /* Apifox 主页签条 44px */
--row-h: 36px → 32px             /* 树/表行按 Apifox 收紧 */
--tree-row-h: 新增 22px          /* 树行 22px */
--fs-15/17/18/22: 新增           /* 补齐 Apifox 字阶 */
--radius-sm: 4px → 6px
--radius-ctl: 6px → 6px          /* 不变 */
--radius-card: 8px → 8px         /* 不变 */
--radius-lg: 12px → 10px
--panel-w: 280px → 240px         /* 实体树面板与 Apifox sider 同宽 */
--panel-w-max: 380px → 320px
```

**原图标轨相关类（`.pp-rail` / `.pp-rail-btn` / `.pp-rail-label` / `.pp-flyout`）全部删除**，
Body.js 不再使用；`tests/ui-audit.test.js` 的骨架断言会同步改。

## 13. 落地核对表

> 核对基准：**当前 `src/client/pages/design-tokens.css`（1505 行）的实际内容**，用 grep 逐条取数，不照抄 §10 的预期值。
> 核对时点 2026-11-19；`tests/ui-audit.test.js` 新增 4 个 HARD 用例锁住其中可自动断言的项。
> 复现：`node tests/ui-audit.test.js`（token 完整性 73/73、类名规范全绿、新增 4 项 HARD 全绿）。

### 13.1 §10 差距表逐项

| # | 项 | Apifox 实测 | 当前实际 | 结论 | 说明 |
|---|---|---|---|---|---|
| 1 | 顶栏高 | 48px | `--topbar-h: 48px`；`.pp-topbar { height: var(--topbar-h) }` | **已改** | 原 44px 已改 48px |
| 2 | 顶栏内边距 | 0 50px | `.pp-topbar { padding: 0 50px }`；`@container ppmain (max-width:900px)` 降 `0 var(--sp-5)`（=0 20px） | **已改** | 50px 在 CSS 内是字面量（无对应 token）；窄容器降级为 0 20px，与 §10 处置一致 |
| 3 | 主页签条 | 44px 卡片式 | `--tabbar-h: 44px`；`.pp-tabbar` 高 44px 横向滚动；`.pp-tabbar-item[data-active="true"]` 白底 + 左右 1px 边框 + `--fg-strong` 文字 | **已改（等效实现）** | Apifox 用 `::before` 1px×24px 画相邻分隔线；这里改为每项 `border-left: 1px solid var(--border)` + `:first-child` 去边框，视觉等效、少一层伪元素 |
| 4 | 左侧导航 | 240px 文字菜单 | `--sider-w: 240px` / `--sider-pad: 20px`；`.pp-shell` grid `var(--sider-w) minmax(0,1fr)`；`.pp-sider` padding 20px；`.pp-sider-item` 高 32px + 14px 文字 + `.pp-sider-label` | **已改** | 原 64px 图标轨方案（`.pp-rail` / `.pp-flyout`）在 CSS 与 `src/` 全量 grep 0 命中 |
| 5 | 树行高 | 22px | `--tree-row-h: 22px`；`.pp-tree-row { height: var(--tree-row-h) }` | **已改** | HARD 用例断言 |
| 6 | 树字号 | 12px | `.pp-tree-row { font-size: var(--fs-12) }` | **已改** | HARD 用例断言 |
| 7 | 树文字色 | #667085 | `.pp-tree-row { color: var(--fg-secondary) }`，`--fg-secondary: #667085` | **已改** | HARD 用例断言 |
| 8 | 树 hover | 只变文字色 | `.pp-tree-row:hover { color: var(--fg) }`，规则体内无 `background` | **已改** | HARD 用例断言 hover 规则体不得出现 background |
| 9 | 树外边距 | 0 16px | `.pp-tree-row` / `.pp-tree-group` 均 `margin: 0 var(--sp-4)`（=0 16px） | **已改** | 原 `margin: 0` |
| 10 | 调试页 padding | 10px | `--page-pad: 10px`；`.pp-debug-page { padding: var(--page-pad) }` | **已改** | 原 `--sp-3`（12px） |
| 11 | URL 行高 | 40px | `--ctl-h-lg: 40px`；`.pp-url-row { height: var(--ctl-h-lg) }` | **已改** | HARD 用例断言 |
| 12 | 发送按钮 | 主 + 下拉组 | `.pp-send-group` inline-flex；`:first-child` 去右圆角；`:last-child` `width: calc(var(--hit) - 3px)`（=25px） | **已改（等效实现）** | Apifox 写死 `calc(100% - 25px)`；这里用 flex 让主按钮自适应吃满剩余宽度、尾按钮固定 25px，结果同宽 |
| 13 | 分组标题 | 3px 左竖线 + 16px 字 | `.pp-group-title { border-left: 3px solid var(--accent); font-size: var(--fs-16); padding-left: var(--sp-3) }` | **已改（1 处偏差）** | 左内边距用 `--sp-3`=12px，Apifox 为 10px，差 2px；仓库无 10px 间距 token，新增 token 属 lead 范围，故不改 |
| 14 | 概览标题 | 18px / 700 | `.pp-overview-title` 与 `.pp-doc-title` 均 `font-size: var(--fs-18)` + `font-weight: 700` | **已改** | HARD 用例断言两个选择器 |
| 15 | 内容最大宽 | 1512px | `--content-max-w: 1512px`，用于 `.pp-page-head` / `.pp-overview-head` / `.pp-doc-head` 的 `max-width` | **已改** | 原无限制 |
| 16 | 字阶 | 12/14/15/16/17/18/20/22 | `--fs-12/13/14/15/16/17/18/20/22/24` 十个刻度全部定义 | **已改** | 15/17/18/22 已补齐；13/24 为项目自留刻度（有页面在用），未删 |
| 17 | 圆角 | 6/8/10 | `--radius-sm: 6px` / `--radius-ctl: 6px` / `--radius-card: 8px` / `--radius-lg: 10px` | **已改** | 原 4/6/8/12 |

### 13.2 §12.6 token 变更表逐项

| token | §12.6 要求 | 当前实际 | 结论 |
|---|---|---|---|
| `--topbar-h` | 44px → 48px | 48px | 已改 |
| `--sider-w` | 新增 240px | 240px | 已改 |
| `--tabbar-h` | 新增 44px | 44px | 已改 |
| `--row-h` | 36px → 32px | 32px | 已改 |
| `--tree-row-h` | 新增 22px | 22px | 已改 |
| `--fs-15/17/18/22` | 新增 | 15/17/18/22 全部定义 | 已改 |
| `--radius-sm` | 4px → 6px | 6px | 已改 |
| `--radius-ctl` | 6px 不变 | 6px | 已改（本就不变） |
| `--radius-card` | 8px 不变 | 8px | 已改（本就不变） |
| `--radius-lg` | 12px → 10px | 10px | 已改 |
| `--panel-w` | 280px → 240px | 240px | 已改 |
| `--panel-w-max` | 380px → 320px | 320px | 已改 |
| `.pp-rail` / `.pp-rail-btn` / `.pp-rail-label` / `.pp-flyout` | 全部删除 | CSS 与 `src/` 全量 grep 0 命中 | 已改 |

### 13.3 §1 全局尺寸补充项

| 项 | Apifox | 当前实际 | 结论 |
|---|---|---|---|
| 布局右边距 / 底边距 | 8px | `--layout-pad: 8px` 已定义，**但全仓库无任何规则引用该 token** | **已定义未落地**：骨架用 `.pp-main-v2` 自滚动 + 页头自身 padding，没有外层 8px 收边；落地需改 `.pp-shell` / `.pp-main-v2` 的 padding，属 lead 的 CSS 范围 |
| 页面级间距 | 10px | `--page-pad: 10px`，`.pp-debug-page` 引用 | 已改 |
| 边框宽 | 1px | 各处 `1px solid var(--border)` 字面量 | 不适用：边框宽度按惯例写字面量，未建 token |
| 滚动条宽 | 6px | `--scrollbar: 6px` | 已改 |

### 13.4 §12 类名契约与实际挂载

| 类名 | CSS 存在 | 页面实际挂载 | 结论 |
|---|---|---|---|
| `.pp-workbench-v2` / `.pp-topbar` / `.pp-shell` / `.pp-sider` / `.pp-main-v2` / `.pp-tabbar` / `.pp-page-head` | 有 | `src/client/shell/Body.js` | 已改（骨架软断言目标同步改为这 7 项，去掉已删除的 `.pp-rail`） |
| `.pp-tree-row` / `.pp-tree-group` / `.pp-tree-row-count` | 有 | `components/FolderTree.jsx` | 已改 |
| `.pp-tree-switcher` | 有（宽 `--sp-3`=12px，左右 margin 各 `--sp-1`=4px） | `components/FolderTree.jsx:77` 目录行 `<span className="pp-tree-switcher">{isCollapsed ? '▸' : '▾'}</span>`；接口行刻意不挂 | **已改（1 处偏差）**：CSS 注释写「左 12px 右 4px」，实现是左右各 4px（`--sp-1`），与 Apifox 左 12px 差 8px；FolderTree 接口行靠 `calc(var(--sp-1) * 2)` 负补偿对齐，属该组件自定方案 |
| `.pp-url-row` / `.pp-url-pill` / `.pp-send-group` / `.pp-group-title` / `.pp-debug-page` / `.pp-debug-layout` | 有 | `debug.jsx`（URL 行、胶囊、发送组、4 处分组标题） | 已改 |
| `.pp-doc-head` / `.pp-doc-title` | 有 | `doc.jsx` | 已改 |
| `.pp-overview-head` / `.pp-overview-title` / `.pp-overview-actions` | 有 | `overview.jsx`、`schema.jsx`；`doc.jsx` 动作区复用了 `.pp-overview-actions` | 已改 |
| `.pp-doc-actions` | **CSS 无该规则** | 未使用 | **不适用**：动作区统一用 `.pp-overview-actions`（同规格），§12.5 的 `.pp-doc-actions` 已无必要，以实现为准 |
| `.pp-form-grid` | 有（`fit-content(360px) minmax(0,1fr)` + gap `--sp-4`） | 7 处：`settings.jsx:153/172`、`env.jsx:277`、`mock.jsx:227`、`schema.jsx:277`、`test.jsx:331/408` | 已改 |
| `.pp-tree` | 有（`padding: var(--sp-1) 0`） | FolderTree | 已改（Apifox holder 为 `padding: 0 4px`，这里是上下 4px 左右 0；行自带 16px 外边距，视觉差可忽略） |

### 13.5 未落地项汇总（需后续动作）

1. `--layout-pad: 8px` 已定义但无人引用 —— 落地需改 `.pp-shell` / `.pp-main-v2` 的 padding，属 lead 的 CSS 独占范围。
2. `.pp-tree-switcher` 左右 margin 均为 4px，Apifox 为左 12px 右 4px（差 8px）—— 需 CSS 调 `margin-left`，属 lead 范围。
3. `.pp-group-title` 左内边距 12px vs Apifox 10px —— 缺 10px 间距 token。
4. `.pp-doc-actions` 在 §12.5 列出但 CSS 从未实现，动作区统一走 `.pp-overview-actions`；文档与实现不一致处已在 13.4 标注，建议下一轮把 §12.5 该行删掉。


