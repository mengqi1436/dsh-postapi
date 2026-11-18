# dsh-postapi UI 说明（T5 ui-pages）

> 交付范围：src/client/pages/**（五页面 + sequence 组件 + design-tokens.css + 等高静态检查）、docs/flow-reference/sequence-reference.html、本文档。契约基线：docs/interface-contract.md §3 / §5 / §6 / §7。

## 1. 页面结构

五页面均位于 `src/client/pages/`，esbuild automatic JSX（无需 import React 运行时，仅 import hooks）：

| 文件 | 路由 | 结构 |
|---|---|---|
| overview.jsx | #/overview | 项目卡片网格（auto-fill minmax 240px）+ 最近接口表（row-h 32px） |
| doc.jsx | #/doc/:endpointId | 左树 220px（folders → endpoints，pp-tree-row 28px）+ 中正文（Mintlify 密度：1px 分区、表格参数/请求头/请求体/认证 + 响应示例 pre）+ 右 TOC 180px（sticky 锚点，scrollIntoView，不占用路由 hash） |
| debug.jsx | #/debug | 紧凑三栏：接口列表 220px / method+url 行、Params-Headers-Body-Auth 页签、发送 / 响应面板（status 胶囊按 2xx/4xx/其他着色 success/error/warning） |
| flow.jsx | #/flow | SequenceDiagram 渲染 + 导出 SVG/复制 JSON + 步骤编排表（增删步/改序）+ steps>9 拆分提示条 |
| settings.jsx | #/settings | 存储路径 input（mono）+ 主题 select（light/dark，即时切 data-theme）+ 语言 select + 保存 |

公共文件：

- sequence.jsx：SequenceDiagram 组件 + layoutSequence（纯函数布局）+ exportSequenceSvg（导出）
- theme.js：主题/语言 localStorage 草稿（postapi.settings.theme / .locale / .storeRoot）
- design-tokens.css：契约 §5 全量 token + 页面组件样式类（.pp-* 前缀）
- __tests__/heights.test.js：等高一致性静态检查

### 自注册契约

每页模块求值期执行（函数声明提升，顶部调用）：

```js
window.__postapiPages?.register?.('overview', OverviewPage)
```

页面不静态 import shell；shell（B/T2）从 pages/ 引入组件或经 `__postapiPages` 注册表取用均可。

### 数据桩

页面统一走 `window.__postapiApi.storage / .request`，未注入时回退文件内 mock 并显示「示例数据」提示；doc/debug/overview 的 mock 与契约 §1 project.json 结构同构。

## 2. design-tokens.css token 使用说明

全部 token 挂在 `.pp-scope` 上；每页根元素 `<div className="pp-scope pp-page" data-page=… ref={…}>`，主题经 `data-theme="dark"` 切换（theme.js applyTheme）。

| 组 | token | 值（契约 §5） |
|---|---|---|
| 字体 | --font-sans / --font-mono | -apple-system,"Segoe UI",Inter,system-ui / ui-monospace,"Cascadia Code",Consolas |
| 字阶 | --fs-12…--fs-24 | 12/13/14/16/20/24px，基准 13px 行高 1.45（--lh-base），权重 400/500/600 |
| 尺寸 | --ctl-h / --row-h / --pill-h | 28px / 32px / 20px（控件、表行、胶囊统一高度，禁止各自撑高） |
| 布局 | --nav-w / --toc-w / --card-pad | 220px / 180px / 12px |
| 间距 | --sp-1…--sp-6 | 4/8/12/16/24px |
| 圆角 | --radius-ctl / --radius-card / --radius-pill | 6px / 8px / 999px |
| 边框 | --border-light/medium/strong | #eaeaea / #d0d0d0 / #a8a8a8（dark：#333/#444/#666） |
| 前景 | --fg / --fg-secondary | #000 / #666（dark：#fafafa / #888） |
| 状态 | --accent / --success / --warning / --error | #0070f3 / #50e3c2 / #f5a623 / #e5484d |
| 方法徽标 | --method-get/post/put/delete/patch | #22c55e / #3b82f6 / #eab308 / #ef4444 / #a855f7，mono 10px 大写（--method-fs） |

用法要点：

1. 控件高度一律 `height: var(--ctl-h)`；表格行 `height: var(--row-h)`（th/td）；胶囊/徽标 `height: var(--pill-h)`。需要例外时只允许 `calc(...)` 且必须内含尺寸 token 或 100%，以及 `auto/100%` 类自适应值。
2. 方法徽标：`<span className="pp-method" data-method={method}>{method}</span>`，颜色由 data-method 属性选择器驱动。
3. 密度基调：全部分区用 1px `var(--border-light)`，无任何 box-shadow。
4. dark 皮肤的 --paper/--surface（#0a0a0a/#111111）为契约未列出的补充值（契约只给出边框/前景的 dark 值）。

### 等高静态检查（heights.test.js）

```bash
node src/client/pages/__tests__/heights.test.js
```

- mini runner 自检（参考 tests/run.js 模式）：PASS 打印检查数并 exit 0；FAIL 逐条打印违规位置并 exit 1。
- 断言内容：① --ctl-h/--row-h/--pill-h 定义且为 28/32/20；② design-tokens.css 每一条 height/min-height/max-height 声明只引用 token、合规 calc、或 auto/100% 类自适应值；③ 六个组件内联 style 高度同规则；④ 五页面含对应 register 调用。
- vitest 接入：`import { run } from '…/heights.test.js'`，在 test 中断言 `run().failures` 为空（lead 统一配置时挂接）。

## 3. sequence 移植要点（diagram-design skill → React+SVG）

参考底稿：docs/flow-reference/sequence-reference.html（手写 SVG，与组件同几何）。style-guide gate 选 (d) paste tokens：paper #fafafa / ink #000 / accent #0070f3 / border #eaeaea，默认皮肤（#f5f5f5/#2d3142/#bf4520）未使用。

- **几何**：4px 网格；actor 框 132×36 圆角 6；生命线 dashed 3,3（ink@0.20）；激活条 w=8（ink@0.06 填充、muted 0.8 描边）；消息 y 间距 32px（≥24 达标）。
- **消息种类映射**（skill Message kinds）：
  | flow.steps action | 视觉 |
  |---|---|
  | call | 实线 + filled marker（muted） |
  | return | dashed 5,4 + filled marker（muted） |
  | self | U 形短环，label 位于环右侧 |
  | note | 无箭头文本行 |
  | headline:true（扩展字段） | accent 实线 + accent marker，全图 ≤2 处 |
- **alt/opt 最小集**：step 可选字段 `op: 'alt'|'opt'`（frame 起始）、`guard`（区域守卫，mono 8px）、`divider: true`（alt 分隔虚线 4,3）。frame 淡墨填充 ink@0.02、描边 ink@0.22、左上 tab 40×16 mono ALT/OPT。嵌套不支持（skill：max 1 层）；par/critical/break 不做（skill：out of scope）。
- **激活条推导**：target 收到 call 即激活，至其发出的下一条 return；无匹配则至末行。
- **SVG 导出**：导出按钮 clone svg → 序列化 → 将 `var(--x)` 经 getComputedStyle 解析为实际值 → Blob 下载 flow-sequence.svg。页内主题切换即时生效，导出文件为解析后的静态值。
- **steps>9 拆分提示**：flow 页顶部显示 warning 边框提示条（skill 哲学：密度 4/10，超过即拆「主流程 + 分支/异常」两张图），不阻断渲染。
- **可达性**：svg role="img" + aria-labelledby → <title>/<desc>，id 前缀可经 props.idPrefix 区分多实例；图例为底部水平条（skill：不许浮在图内）。

## 4. 与契约的偏离点

1. **register 调用位置**：任务描述「每页顶部调用」——已按字面放在模块顶部，依赖函数声明提升（esbuild automatic 转译后仍成立）。
2. **flow 保存**：契约 §2 storage face 无 saveFlow；编排结果暂存 localStorage（postapi.flow.draft）+ 复制 JSON，host face 由 lead 集成时替换。
3. **settings 持久化**：契约未定义设置 face；主题/语言/存储路径均 localStorage 草稿，存储路径真实值由 host 构造参数注入（页面仅展示默认 E:/User/文档/api）。
4. **响应示例**：契约 §1 endpoint 无 responses 字段；doc 页响应示例为文件内 mock 常量，仅展示不入存储。
5. **dark paper/surface 补充值**：#0a0a0a/#111111 为契约 §5 未列出的补充（契约仅给 dark 边框/前景）。
6. **heights.test.js 运行方式**：契约 §7 说 vitest 由 lead 统一配置；本文件先以 node 直接执行的自建 mini runner 交付（任务要求的「可被 node 直接执行的写法」），vitest 挂接留待 lead。
