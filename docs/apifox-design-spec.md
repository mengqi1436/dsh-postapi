# Apifox 设计语言规范（UI 复刻基线）

> lead 产出 · 2026-11-18 · 分支 feature/apifox-ui-parity
> 数据来源：`.research/apifox/app/dist/renderer/*.css`（165 个 CSS chunk，Apifox 2.8.55）全量统计
> 所有页面改造必须遵守本文档；token 落在 `src/client/pages/design-tokens.css`，页面只消费变量。

## 1. 色板（按 CSS 出现频次排序，取前 20 为正式 token）

| 用途 | Apifox 原值 | 出现次数 | 我们的 token |
|---|---|---|---|
| 主分割线 / 卡片边框 | `#eaecf0` | 94 | `--border` |
| 次级背景 / hover 底 | `#f2f4f7` | 53 | `--bg-hover` / `--bg-subtle` |
| 正文前景 | `#344054` | 42 | `--fg` |
| 三级文字 / 占位 | `#98a2b3` | 39 | `--fg-tertiary` |
| 品牌主色（Apifox 紫） | `#9373ee` | 39 | `--accent` |
| 应用底色 | `#f9fafb` | 37 | `--bg-app` |
| 危险 / DELETE | `#f04438` | 20 | `--error` / `--method-delete` |
| PATCH / 紫红 | `#ee46bc` | 30 | `--method-patch` |
| 次级文字 | `#667085` | 18 | `--fg-secondary` |
| 强边框 | `#d0d5dd` | 12 | `--border-strong` |
| 成功 / GET | `#17b26a` | 17 | `--success` / `--method-get` |
| POST / 信息蓝 | `#2e90fa` | 15 | `--info` / `--method-post` |
| 警告 / PUT | `#f79009` | 15 | `--warning` / `--method-put` |
| 链接 / 次级蓝 | `#6172f3` | 15 | `--link` |
| 主色 hover | `#8276c9` | 10 | `--accent-hover` |
| 表格斑马 | `#f5f5f5` | 9 | `--bg-stripe` |
| 青色（HEAD/OPTIONS） | `#06aed4` | 15 | `--method-other` |

暗色皮肤：`#101828`（底）/`#1d2939`（面）/`#344054`（边框）/`#f9fafb`（前景）。

## 2. 尺寸刻度（按频次）

| 类别 | Apifox 高频值 | 我们的 token |
|---|---|---|
| 控件高 | **32px**（377 次，绝对主力）、24px（254）、40px（136）、28px（83） | `--ctl-h: 32px` / `--ctl-h-sm: 24px` / `--ctl-h-lg: 40px` |
| 表格行高 | 40px / 48px | `--row-h: 36px`（紧凑文档感，介于两者） |
| 标签/胶囊高 | 22px（88） | `--pill-h: 22px` |
| 字号 | **12px**（255）、13px（101）、14px（99）、16px（101）、20px、24px | `--fs-12`…`--fs-24` |
| 行高 | **22px**（523，配 14px）、20px（319，配 13px）、24px（216） | `--lh-20: 20px` / `--lh-22: 22px` / `--lh-24: 24px` |
| 圆角 | **8px**（311）、12px（208）、6px（131）、10px（110）、4px（86） | `--radius-ctl: 6px` / `--radius-card: 8px` / `--radius-lg: 12px` / `--radius-sm: 4px` |
| 间距 | **8px**（389）、4px（259）、12px（114）、16px（86）、20px（181）、24px（80） | `--sp-1..--sp-6`（4/8/12/16/20/24） |
| 图标 | 16px（100）、24px（124）、14px（50）、18px（37）、20px（35） | `--icon-sm: 14px` / `--icon: 16px` / `--icon-lg: 20px` |
| 左树宽 | 240px（24 次）/ 216px（28 次） | `--nav-w: 240px` |
| 右 TOC 宽 | 240px | `--toc-w: 240px` |
| 卡片内边距 | 12px（213）/ 16px（177）/ 20px（181） | `--card-pad: 16px` |
| 弹层最大宽 | 400px（32）/ 720px（26） | `--popover-w: 400px` |
| 滚动条 | 6px | `--scrollbar: 6px` |

## 3. 布局骨架（Apifox 主工作台）

```
┌──────────────────────────────────────────────────────────────┐
│ 顶栏 48px：项目名 / 环境选择 / 搜索 / 运行 / 保存 / 更多      │  --topbar-h: 48px
├────────────┬─────────────────────────────────┬───────────────┤
│ 左树 240px │ 主区（文档 or 调试）            │ 右栏 240px    │
│ 目录+接口  │ 页签条 40px + 内容区            │ TOC / 响应    │
│ 行高 32px  │ 内容 padding 20px 24px          │ 行高 32px     │
└────────────┴─────────────────────────────────┴───────────────┘
```

- 顶栏：`--topbar-h: 48px`，底部 1px `--border`，白底。
- 三段式用 grid：`grid-template-columns: var(--nav-w) minmax(0,1fr) var(--toc-w)`。
- 页签条：高 40px，页签本身 `--ctl-h` 高，激活态下边框 2px `--accent`。
- 分区一律 1px `--border`，**不投阴影**（Apifox 只在浮层用 `0 4px 16px rgba(0,0,0,.08)`）。
- 表格：表头 `--bg-subtle` 底 + `--fg-secondary` 文字，行 hover `--bg-hover`，选中 `--bg-selected`。

## 4. 组件规格

| 组件 | 规格 |
|---|---|
| 主按钮 | 高 `--ctl-h`、`--accent` 底、白字、圆角 `--radius-ctl`、padding 0 16px、hover `--accent-hover` |
| 次按钮 | 白底、1px `--border-strong`、`--fg` 字、hover 边框 `--accent` |
| 输入框 | 高 `--ctl-h`、1px `--border-strong`、圆角 `--radius-ctl`、focus 边框 `--accent` + 2px `--accent-tint` 外环 |
| 方法徽标 | 高 `--pill-h`、mono `--fs-12`、粗体、圆角 `--radius-sm`、白字彩底（GET 绿 / POST 蓝 / PUT 橙 / DELETE 红 / PATCH 紫红） |
| 状态胶囊 | 高 `--pill-h`、圆角全圆、1px 同色边框 + 同色文字、无底色 |
| 树行 | 高 `--ctl-h`、圆角 `--radius-ctl`、选中 `--bg-selected` + `--accent` 字 |
| 页签 | 高 `--ctl-h`、无底色、激活下边框 2px `--accent` |
| 代码块 | mono `--fs-12`、`--lh-20`、`--bg-subtle` 底、1px `--border`、圆角 `--radius-ctl`、padding 12px |
| 表格 | 行高 `--row-h`、表头 `--bg-subtle`、单元格 padding 0 12px |

## 5. 硬约束（heights.test.js 会静态检查）

1. `design-tokens.css` 里所有 `height/min-height/max-height` 必须是 `var(--ctl-h)` / `var(--row-h)` / `var(--pill-h)`、`100%`/`auto` 等关键字，或含上述 token 的 `calc()`。
2. 页面内联 `style` 只允许 layout（display/flex/grid/gap/width/margin），**禁止颜色与字号字面量**。
3. 禁止 `alert/confirm/prompt`。
4. 禁止新增 npm 依赖；只用 `react` 与本地相对路径。
5. 新增 CSS 类一律 `.pp-` 前缀，写进 `design-tokens.css`（由 design-system 角色统一维护）。

## 6. 与旧皮肤的差异（必须改掉）

| 项 | 旧（Vercel Geist） | 新（Apifox） |
|---|---|---|
| 主色 | `#0070f3` 蓝 | `#9373ee` 紫 |
| 底色 | `#fafafa` | `#f9fafb` |
| 正文 | `#000` 纯黑 | `#344054` 石板灰 |
| 边框 | `#eaeaea` | `#eaecf0` |
| 控件高 | 28px | 32px |
| 行高 | 1.45 倍数 | 固定 20/22/24px |
| 圆角 | 6/8 | 6/8/12 |
| 左树宽 | 220px | 240px |
| 密度 | PostHog/Mintlify 文档感 | Apifox 工作台密度（更松、卡片化） |
