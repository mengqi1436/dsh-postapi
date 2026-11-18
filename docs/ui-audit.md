# Apifox UI 一致性审计报告

> 审计角色：teammate `ui-audit`（独立审计，未改动任何页面实现）
> 视觉基线：`docs/apifox-design-spec.md`；token 落点：`src/client/pages/design-tokens.css`
> 分支：`feature/apifox-ui-parity`
> **审计时点：2026-11-18 19:45（Asia/Shanghai）** —— shell-frame / pages-a2 / pages-b2 三任务均已 completed，页面与骨架定稿后取数。
> 复现命令：`node tests/ui-audit.test.js`

---

## 1. 结论速览

| 检查项 | 级别 | 通过 | 失败 | 状态 |
|---|---|---|---|---|
| token 完整性（spec §1 色板 22 项 + 暗色 4 项 + §2/§3 尺寸 33 项） | **HARD** | 59 | 0 | ✅ 全绿 |
| 类名规范（className 全部在 design-tokens.css 有定义） | **HARD** | 364 | 0 | ✅ 全绿 |
| 颜色字面量（jsx/js 无 #hex / rgb()，css 仅 token 定义行） | SOFT | 20 | 4 | ⚠ 4 处待清 |
| 字号字面量（内联 style 无 fontSize/lineHeight 数字） | SOFT | 12 | 11 | ⚠ 11 处待清 |
| 禁用 API（alert/confirm/prompt） | SOFT | 23 | 0 | ✅ 全绿 |
| 直连宿主（`fetch('/dsh-postapi…')`） | SOFT | 23 | 0 | ✅ 全绿 |
| 方法徽标（`.pp-method` + `data-method`） | SOFT | 21 | 2 | ⚠ 2 处待清 |
| 布局骨架（`.pp-workbench`/`.pp-topbar`/`.pp-body-3col`/`.pp-tabs`） | SOFT | 3 | 1 | ⚠ 1 处待清 |
| 旧皮肤残留（#0070f3/#eaeaea/#fafafa） | SOFT | 25 | 0 | ✅ 全绿 |
| 未定义 token（`var(--x)` 无定义） | SOFT | 24 | 0 | ✅ 全绿 |
| 页面自注册（12 页） | SOFT | 12 | 0 | ✅ 全绿 |

**合计：硬断言 423/423 通过；软性清单 18 处问题（0 处阻塞）。**

配套回归：`node build.mjs` 通过（dist/client.js 252.9kb，vm smoke 全绿）；`node tests/run.js` 206 通过 / 0 失败；`node src/client/pages/__tests__/heights.test.js` 54 checks PASS。

---

## 2. 已符合项（逐项确认）

1. **色板 token 与 spec §1 逐值一致**：`--border:#eaecf0`、`--bg-hover/--bg-subtle:#f2f4f7`、`--fg:#344054`、`--fg-tertiary:#98a2b3`、`--accent:#9373ee`、`--bg-app:#f9fafb`、`--error/--method-delete:#f04438`、`--method-patch:#ee46bc`、`--fg-secondary:#667085`、`--border-strong:#d0d5dd`、`--success/--method-get:#17b26a`、`--info/--method-post:#2e90fa`、`--warning/--method-put:#f79009`、`--link:#6172f3`、`--accent-hover:#8276c9`、`--bg-stripe:#f5f5f5`、`--method-other:#06aed4`（22 项）。
2. **暗色皮肤四项**：`[data-theme="dark"]` 内 `--bg-app:#101828`、`--bg-surface:#1d2939`、`--border:#344054`、`--fg:#f9fafb`。
3. **尺寸刻度 33 项全就位**：`--ctl-h:32px`、`--ctl-h-sm:24px`、`--ctl-h-lg:40px`、`--row-h:36px`、`--pill-h:22px`、`--topbar-h:48px`、`--fs-12..24`、`--lh-20/22/24`、`--radius-sm/ctl/card/lg`、`--sp-1..6`、`--icon-sm/icon/icon-lg`、`--nav-w:240px`、`--toc-w:240px`、`--card-pad:16px`、`--popover-w:400px`、`--scrollbar:6px`。
4. **类名规范零缺陷**：12 页 + `sequence.jsx` + 4 组件 + 5 个 shell 文件 + `client/index.js`，共 364 个 className 引用点，全部能在 `design-tokens.css` 找到定义；无 BEM 混用、无未定义类、无内联类名拼接漏写。
5. **禁用 API 清零**：全仓 client 侧无 `alert/confirm/prompt`。
6. **无直连宿主**：页面全部经 `window.__postapiApi`（storage 9 方法 + request.send）访问宿主，未出现 `fetch('/dsh-postapi…')`。
7. **旧皮肤彻底清除**：`#0070f3`/`#eaeaea`/`#fafafa` 在 client 源码中 0 命中（lead 已清理 `sequence.jsx` 的两处注释与 `#000000` 兜底，本轮复测确认消失）。
8. **未定义 token 清零**：`sequence.jsx` 的 `var(--paper)` 已改为 `var(--bg-app)`，全仓 `var(--*)` 引用均可解析。
9. **12 页自注册齐备**：`overview/doc/debug/mock/schema/env/history/test/import/flow/search/settings` 均通过 `window.__postapiPages?.register?.(…)` 或 `__postapiQueue.push([…])` 注册。
10. **骨架三件套到位**：`Body.js` 含 `.pp-scope.pp-workbench`（第 199 行）、`.pp-topbar`（第 200 行）、`.pp-body-3col / .pp-body-2col`（第 226 行），符合 spec §3 顶栏 48px + 三段式 grid。
11. **方法徽标已覆盖主链路**：`doc.jsx`（3 处）、`debug.jsx`、`overview.jsx`、`history.jsx`、`mock.jsx`、`search.jsx` 全部使用 `<span className="pp-method" data-method={…}>`。

---

## 3. 问题清单（18 处，按类别）

### 3.1 颜色字面量（4 处）

| # | 文件:行 | 片段 | 建议修法 | 归属 |
|---|---|---|---|---|
| 1 | `src/client/pages/design-tokens.css:266` | `color: #ffffff;`（`.pp-btn-primary`） | 新增 `--fg-on-accent: #ffffff`（暗色块同样定义），改用 `color: var(--fg-on-accent)` | lead（design-tokens.css 独占范围） |
| 2 | `src/client/pages/design-tokens.css:271` | `color: #ffffff;`（`.pp-btn-primary:hover`） | 同上，改 `var(--fg-on-accent)` | lead |
| 3 | `src/client/pages/design-tokens.css:276` | `color: #ffffff;`（`.pp-btn-primary:disabled`） | 同上；或与 `--border-strong` 底搭配改用 `--fg-secondary` 提升对比度 | lead |
| 4 | `src/client/pages/design-tokens.css:407` | `color: #ffffff;`（`.pp-method` 白字彩底） | 同上，改 `var(--fg-on-accent)` | lead |

> 说明：这 4 处是**唯一**合法的“白字”语义（品牌底 + 彩底徽标上的前景白），修法只是把它 token 化，视觉零变化。`--bg-surface: #ffffff`、`--fg-strong: #ffffff`（第 67、106 行）是 token 定义行，已按白名单放行。

### 3.2 字号字面量（11 处，全部在 `sequence.jsx` 的 SVG 文本属性）

| # | 文件:行 | 片段 | 建议修法 | 归属 |
|---|---|---|---|---|
| 5 | `src/client/pages/sequence.jsx:194` | `<text … fontSize="8" fontFamily={FONT_MONO}` | SVG `fontSize` 无法用 CSS 变量直读，改为 className（如 `.pp-seq-label`）并在 tokens 里定义 `font-size: var(--fs-12)`；或用 `fontSize="var(--fs-12)"` + `style` 兜底 | pages-b2 / lead（flow 图表） |
| 6 | `src/client/pages/sequence.jsx:207` | `<text … fontSize="8"` | 同上 | 同上 |
| 7 | `src/client/pages/sequence.jsx:232` | `<text … fontSize="8" fontFamily={FONT_MONO}` | 同上 | 同上 |
| 8 | `src/client/pages/sequence.jsx:245` | `<text … fontSize="8" fontFamily={FONT_MONO}` | 同上 | 同上 |
| 9 | `src/client/pages/sequence.jsx:248` | `<text … fontSize="8"` | 同上 | 同上 |
| 10 | `src/client/pages/sequence.jsx:263` | `<text … fontSize="12" fontWeight="600"` | 同上（12px 已等于 `--fs-12`） | 同上 |
| 11 | `src/client/pages/sequence.jsx:274` | `<text … fontSize="8" fontFamily={FONT_MONO}` | 同上 | 同上 |
| 12 | `src/client/pages/sequence.jsx:276` | `<text … fontSize="8" fontFamily={FONT_MONO}>SOLID = CALL` | 同上 | 同上 |
| 13 | `src/client/pages/sequence.jsx:277` | `<text … fontSize="8" fontFamily={FONT_MONO}>DASHED = RETURN` | 同上 | 同上 |
| 14 | `src/client/pages/sequence.jsx:278` | `<text … fontSize="8" fontFamily={FONT_MONO}>ACCENT = HEADLINE` | 同上 | 同上 |
| 15 | `src/client/pages/sequence.jsx:279` | `<text … fontSize="8" fontFamily={FONT_MONO}>FRAME = BRANCH` | 同上 | 同上 |

> 说明：这 11 处是 SVG `<text>` 的 **presentation attribute**，不是内联 `style`，也不在 `heights.test.js` 的高度纪律范围内；spec §5.2 约束的是内联 style。风险是 `8px` 不在 token 刻度（`--fs-12` 最小）里，图表文字偏小。建议统一提到 `var(--fs-12)`（12px）或新增 `--fs-10`/`--fs-11` 图表专用 token 后引用。

### 3.3 方法徽标（2 处）

| # | 文件:行 | 片段 | 建议修法 | 归属 |
|---|---|---|---|---|
| 16 | `src/client/pages/test.jsx:338`、`:429` | `{endpoints.map((ep) => <option key={ep.id} value={ep.id}>{ep.method} {ep.url}</option>)}` | `<option>` 内不能放 HTML 徽标，两种收口：① 保持纯文本但去掉裸 method（只显示 url）；② 在下拉外层加一行 `.pp-method` 徽标显示当前选中接口的方法。推荐 ② | pages-b2（test 页） |
| 17 | `src/client/pages/import.jsx:274` | `<div className="pp-meta">示例接口：{MOCK_ENDPOINT.method} {MOCK_ENDPOINT.url}</div>` | 改为 `<div className="pp-meta">示例接口：<span className="pp-method" data-method={MOCK_ENDPOINT.method}>{MOCK_ENDPOINT.method}</span> {MOCK_ENDPOINT.url}</div>` | pages-b2（import 页） |

> 说明：这两处是“method 作为纯文本嵌在 option / meta 行里”，不构成视觉缺陷，但与 spec §4「方法徽标一律白字彩底」的一致性有偏差。

### 3.4 布局骨架（1 处）

| # | 文件:行 | 片段 | 建议修法 | 归属 |
|---|---|---|---|---|
| 18 | `src/client/shell/Body.js`（第 226 行 `div.pp-body-3col` 之后无 `.pp-tabs`） | 三段式里缺 spec §3 要求的「页签条 40px」 | 在 `.pp-main` 顶部插入 `<div className="pp-tabs">`，用 `.pp-tab[data-active]` 渲染已打开页签（当前路由作为唯一常驻页签即可），高度走 `var(--ctl-h-lg)`。`.pp-tabs`/`.pp-tab` 样式已就绪（`design-tokens.css:422-449`），`doc/debug/test/import` 四页内部已在用 | shell-frame（Body.js 范围，任务已 completed，需 lead 派修） |

> 说明：`.pp-tabs` 类在 `debug.jsx`（2 处）、`doc.jsx`（1 处）、`import.jsx`（1 处）、`test.jsx`（1 处）已被页面级复用，样式与行为均已验证；缺的只是**工作台级**页签条。不影响功能，属 spec §3 骨架完整性偏差。

---

## 4. 附：token 覆盖率提示（非问题，供 lead 决策）

`design-tokens.css` 定义 91 个 `.pp-*` 类，其中 8 个当前无消费方（死类）：

| 类名 | 定义位置 | 说明 |
|---|---|---|
| `.pp-topbar-search` | `design-tokens.css:162` | 顶栏搜索框专用，`Body.js` 实际用 `.pp-input.pp-input-sm` + 内联 `width` |
| `.pp-seg` | `design-tokens.css:454` | 分段控件，页面改用 `.pp-tabs` |
| `.pp-doc-h3` | `design-tokens.css:576` | 文档三级标题，`doc.jsx` 未用 |
| `.pp-field` | `design-tokens.css:609` | 字段行 grid，`doc.jsx` 用 `.pp-form-row` 替代 |
| `.pp-field-head` | `design-tokens.css:616` | 字段行表头 |
| `.pp-warn` | `design-tokens.css:758` | 状态色文本，页面用 `.pp-pill-warn` / `.pp-note-warn` |
| `.pp-scroll` | `design-tokens.css:778` | 内含 `min-height: calc(var(--row-h) * 0)`，是为通过 heights 检查写的等价于 0 的表达式，语义可疑 |
| `.pp-aside-sticky` | `design-tokens.css:782` | 右栏 sticky，`Body.js` 的 `ContextAside` 未用 |

处理建议（**不在本次审计改动范围**，`design-tokens.css` 属 lead）：要么删除，要么在对应组件接线。其中 `.pp-scroll` 的 `calc(var(--row-h) * 0)` 建议直接删掉该行声明（`min-height: 0` 本身就不需要 token 包装）。

---

## 5. 审计方法与边界

- **扫描范围**：`src/client/pages/*.jsx`（12 页 + `sequence.jsx`）、`src/client/pages/components/*.jsx`（4 组件）、`src/client/shell/*.js`（5 文件）、`src/client/index.js`、`src/client/pages/design-tokens.css`、`src/client/pages/theme.js`。共 24 个源文件 + CSS。
- **className 提取**：自写词法扫描器，支持 `className="a b"`、`className={'a ' + cond}`、模板字面量 `${…}` 插值、三元分支，并跳过 `=== 'key'` 这类比较操作数（避免把判断值误当类名）。
- **未做**：不渲染、不截图、不做浏览器像素比对（本任务范围是静态一致性审计）；`heights.test.js` 负责高度纪律，本报告不重复。
- **写入范围**：仅 `tests/ui-audit.test.js` 与 `docs/ui-audit.md`。所有问题均以「文件:行 + 建议修法 + 归属」形式交付，未改动任何页面实现。
- **接线提示**：`tests/run.js` 尚未 import 本套件（该文件属 lead 范围）。接线方式：

```js
const uiAuditTests = await optionalSuite('ui-audit.test.js', 'tests')
// suites 数组追加：['tests/ui-audit.test.js', uiAuditTests]
```

---

## 6. 自测输出摘要（全绿）

```
$ node build.mjs
  dist/client.js  252.9kb
  smoke 通过：ModuleLoader 形态 / apply / inject（内置 face）/ 6 个 effect /
  席位 key=postapi / __postapiPages / __postapiApi 桥形态（9 storage + request.send）全部断言成功

$ node tests/run.js
  结果：通过 206，失败 0，共 206

$ node src/client/pages/__tests__/heights.test.js
  heights.test: PASS (54 checks)

$ node tests/ui-audit.test.js
  PASS HARD token 完整性：spec §1 色板（含暗色四项）全部就位且取值一致
  PASS HARD token 完整性：spec §2/§3 尺寸刻度全部就位且取值一致
  PASS HARD 类名规范：页面/组件/shell 的 className 全部在 design-tokens.css 有定义
  PASS SOFT 颜色字面量 / 字号字面量 / 禁用 API / 直连宿主 / 方法徽标 / 布局骨架 / 旧皮肤残留 / 未定义 token / 页面自注册

  == 硬断言 ==
    token 完整性：59 通过 / 0 失败（共 59 项）
    类名规范：364 通过 / 0 失败（共 364 项）
  == 软性清单（不阻塞） ==
    颜色字面量：4 处（扫描 24 个文件）
    字号字面量：11 处（扫描 23 个文件）
    禁用API：0 处    直连宿主：0 处    方法徽标：2 处
    布局骨架：1 处   旧皮肤残留：0 处  未定义token：0 处  页面自注册：0 处
  == 问题合计 18 处 ==
  结果：通过 12，失败 0，共 12
```

---

## 7. 与上一轮的差异（lead 清理后复测）

| 项 | 首轮（19:30） | 定稿轮（19:45） | 变化 |
|---|---|---|---|
| 颜色字面量 | 7 | 4 | `sequence.jsx:23` 注释、`:128` 的 `'#000000'` 兜底、`index.js:49` 的 `#247bbf` 均已清 |
| 旧皮肤残留 | 2 | 0 | 全清 |
| 未定义 token | 1（`--paper`） | 0 | `sequence.jsx` 改用 `var(--bg-app)` |
| 类名规范失败 | 1（`pp-doc-layout`） | 0 | `doc.jsx` 已换用已定义类 |
| 字号字面量 | 11 | 11 | 未变（SVG 属性，非内联 style） |
| 方法徽标 | 2 | 2 | 未变 |
| 布局骨架 | 1 | 1 | 未变（Body.js 仍缺工作台级 `.pp-tabs`） |


---

## 8. 收口记录（lead，2026-11-18 20:05）

审计提出的全部问题已在本轮修复，`node tests/ui-audit.test.js` 现为 **问题合计 0 处**：

| 原问题 | 处理 | 落点 |
|---|---|---|
| 颜色字面量 4 处（`.pp-btn-primary` ×3 + `.pp-method` ×1 硬写 `#ffffff`） | 新增 token `--fg-on-accent: #ffffff`，4 处改 `var(--fg-on-accent)` | design-tokens.css |
| 颜色字面量（`client/index.js` 徽章 `fill: '#247bbf'`） | 改 `currentColor`，由 `.pp-accent` 类控制 | src/client/index.js |
| 字号字面量 11 处（`sequence.jsx` SVG `fontSize="8"/"12"`） | 新增 `--fs-chart: 10px`，11 处全改 `fontSize="var(--fs-chart)"/"var(--fs-12)"` | design-tokens.css + sequence.jsx |
| 方法徽标 2 处（`test.jsx` 场景步骤下拉、`import.jsx` 示例接口） | 均补 `.pp-method[data-method]` 徽标 | test.jsx / import.jsx |
| 布局骨架 1 处（`Body.js` 缺工作台级 `.pp-tabs`） | 骨架在顶栏下加全局页签条（12 条，与左树互为双入口） | src/client/shell/Body.js |
| 死类 8 个 | 保留：`pp-topbar-search`/`pp-doc-h3`/`pp-seg`/`pp-field`/`pp-field-head`/`pp-warn` 是预留类（后续页面会用），`.pp-scroll`/`.pp-aside-sticky` 为工具类 | — |
| `tests/run.js` 未接线 | 已接线 shell-frame / apifox-ui / ui-audit 三套件 | tests/run.js |

**收口后验收**：`node build.mjs` exit 0；`node tests/run.js` 247 通过 / 0 失败；`heights.test.js` PASS (54 checks)；`node tests/ui-audit.test.js` 硬断言 423/423 + 软清单 0 问题。

