# Apifox 视觉复刻交付总结（feature/apifox-ui-parity）

> 交付日 2026-11-18 · 分支 `feature/apifox-ui-parity`（3 个提交，可逐条回滚）
> 视觉基线：`docs/apifox-design-spec.md`（从 Apifox 2.8.55 的 165 个 CSS chunk 统计得出）
> 审计报告：`docs/ui-audit.md`

## 1. 结论

插件从 Vercel Geist 皮肤整体切换到 **Apifox 工作台视觉**：紫主色、32px 控件、240px 左树、1px 边框卡片化、白字彩底方法徽标、固定行高 20/22/24。12 页全部重排，骨架改为「顶栏 + 全局页签条 + 三段式」。

五道验收全绿：

| 验收 | 命令 | 结果 |
|---|---|---|
| 构建 + 产物 smoke | `node build.mjs` | exit 0，7 个 effect（含样式注入），12 页注册 |
| 单元/集成测试 | `node tests/run.js` | **247 通过 / 0 失败**（9 套件） |
| 宿主端到端冒烟 | `node scripts/smoke-host.mjs` | **27 项通过 / 0 失败** |
| 高度纪律 | `node src/client/pages/__tests__/heights.test.js` | **PASS (54 checks)** |
| UI 一致性审计 | `node tests/ui-audit.test.js` | **12 通过 / 0 失败，软清单 0 问题**（硬断言 423/423） |

真机截图验证：desktop profile 页签内 12 条导航 + 4 块统计 + 项目卡片 + 最近接口表全部按 Apifox 样式渲染，左树无链接下划线，窄栏表格不竖排。

## 2. 设计基线（从 Apifox 实测提取）

| 项 | Apifox 实测 | 落地 token |
|---|---|---|
| 主色 | `#9373ee`（紫，39 次） | `--accent` |
| 底色 | `#f9fafb` | `--bg-app` |
| 正文 | `#344054`（石板灰，42 次） | `--fg` |
| 边框 | `#eaecf0`（94 次） | `--border` |
| 次级底 / hover | `#f2f4f7`（53 次） | `--bg-subtle` / `--bg-hover` |
| 三级文字 | `#98a2b3` | `--fg-tertiary` |
| 控件高 | 32px（377 次，绝对主力） | `--ctl-h` |
| 行高 | 固定 20/22/24px | `--lh-20/22/24` |
| 圆角 | 4/6/8/12px | `--radius-sm/ctl/card/lg` |
| 左树宽 | 240px | `--nav-w` |
| 顶栏高 | 48px | `--topbar-h` |
| 方法徽标 | 白字彩底（GET 绿/POST 蓝/PUT 橙/DELETE 红/PATCH 紫红） | `--method-*` |

完整色板 22 项 + 尺寸 33 项见规范文档，审计套件逐值断言。

## 3. 并行分工

| teammate | 任务 | 写范围 | 产出 |
|---|---|---|---|
| shell-frame | task-6 | shell/Body.js、locales.js、ApiTitle.js、tests/shell-frame.test.js | 工作台骨架（顶栏 + 12 条全局页签 + 左树竖排 + 右上下文栏），18 条测试 |
| pages-a2 | task-7 | doc.jsx、debug.jsx、components/** | 文档页三段式 + 调试台（URL 行/四页签/响应面板）+ 4 组件 Apifox 化，11 条新测试（pages-a 16→27） |
| pages-b2 | task-8 | 其余九页 + tests/pages-b.test.js | 九页重排（统计块/卡片网格/表格/胶囊/JSON 编辑器），12 条新测试（70→82） |
| ui-audit | task-9 | tests/ui-audit.test.js、docs/ui-audit.md | 独立审计（硬断言 2 项 + 软清单 9 项），定位 18 处问题 |
| lead | 集成 | design-tokens.css、build.mjs、client/index.js、pages-entry.js、tests/run.js、docs/** | 设计规范、token 全量重写、样式注入、问题收口、真机验证 |

## 4. lead 修掉的三个关键缺陷

### 4.1 样式表根本没被加载（最严重）

`design-tokens.css` 只被注释引用，从未被 import 或注入。宿主 `__ModuleLoader__` 只加载 CJS 模块、没有 CSS 入口，因此**所有 `.pp-*` 类完全不生效**，页面是无样式裸 HTML（第一次截图就是这个状态）。

修法：`build.mjs` 加 `loader: { '.css': 'text' }` 把样式表以文本打进产物；`src/client/index.js` 在 apply 首步插 `<style data-plugin="dsh-postapi">`，并在 disposer 里移除。构建 smoke 增加「产物必须含 `--ctl-h`」断言。

### 4.2 左树链接下划线泄漏

骨架的左树条目是 `<a href="#/...">`，`.pp-tree-row` 没有 `text-decoration: none`，整列变成带下划线的蓝色链接。已补 `text-decoration: none` + 显式 `color`，`.pp-list-row` 同样处理。

### 4.3 窄栏表格中文竖排

侧边栏宽度约 500px，`.pp-table td` 原用 `word-break: break-word`，中文被逐字断行，「查询订单列表」变成一列竖排字。改为 `white-space: nowrap` + 省略号，并新增 `.pp-table-wrap` 横向滚动容器。

## 5. 审计发现与收口

审计首轮报 18 处问题，已全部清零：

| 类别 | 首轮 | 定稿 | 处理 |
|---|---|---|---|
| 颜色字面量 | 7 | **0** | 新增 `--fg-on-accent`；徽章 `#247bbf` → `currentColor` |
| 字号字面量 | 11 | **0** | 新增 `--fs-chart: 10px`；SVG 11 处改 token |
| 方法徽标缺失 | 2 | **0** | test 场景步骤 + import 示例接口补 `.pp-method[data-method]` |
| 布局骨架缺失 | 1 | **0** | Body.js 补工作台级 `.pp-tabs` |
| 旧皮肤残留 | 2 | **0** | sequence.jsx `--paper` → `--bg-app`，兜底色 → `currentColor` |

## 6. 提交历史（逐条可回滚）

```
6dbfbe9 新增(界面): 全站 Apifox 视觉复刻（工作台骨架/紫主色/12 页重排/样式注入）
c9750e7 新增(设计): Apifox 设计规范与全量 token 重写（紫主色/32px 控件/240 树宽）
2966224 修复(测试): 临时产物改落仓库内 .tmp，绕开 Windows 临时目录写入拒绝
```

回滚方式：`git revert 6dbfbe9` 退回 Vercel Geist 皮肤；`git reset --hard 76c2fbe` 回到分支起点（master）。

## 7. 遗留待办

1. **顶栏环境下拉**只有「默认环境」占位——骨架拿不到 projectId（取项目是页面职责），要真下拉需给骨架一个「当前项目」来源。
2. **doc 页双层右栏**：骨架给 doc 出右栏（页面说明+快捷入口），doc 页自身又有右 TOC，视觉上多一层 240px。需要决定是让 doc 在骨架内走两栏，还是骨架对 doc 不出右栏。
3. **「新建接口」按钮**只跳 `#/doc`（无 saveEndpoint 的 projectId 来源，不做假写库）。
4. `.pp-seg`/`.pp-field`/`.pp-field-head`/`.pp-warn`/`.pp-scroll`/`.pp-aside-sticky` 为预留工具类，当前无页面使用。
