# Apifox 项目概览页 REA 拆解与重建规格

> 2026-11-24 · 目标：把 dsh-postapi「总览」页从自拟布局改为 Apifox 同构，并修掉默认预填项目 id 的问题。
> 取证对象：Apifox 2.8.55（Windows x64）安装包内的 `dist/renderer`；全程未运行目标程序。

## 0. 样本获取与解包链（可复现）

| 步骤 | 产物 | 说明 |
|---|---|---|
| 1 | `Apifox-windows-latest.zip`（194,838,883 B） | 直链 `https://file-assets.apifox.com/download/Apifox-windows-latest.zip`；GET 必须带完整浏览器头 + `Referer: docs.apifox.com`，否则 302 到「下载验证」拦截页（HTML，62 KB） |
| 2 | `pkg/Apifox-2.8.55.exe`（194,909,008 B，SHA-256 `8aeeb11d…c62d8`） | 7z 解第一层 |
| 3 | `installer/$PLUGINSDIR/app-64.7z` | NSIS-3 数据层 |
| 4 | `app64/resources/app.asar`（430,713,112 B） | 解第二层 |
| 5 | `app/dist/renderer/`（1528 文件，124 MB） | asar 头解析后按 offset 还原（见下） |

工具链：本机无 7-Zip，安装官方 `7z2606-x64.exe` 静默到 `.research/apifox/tools/7z`；
asar 解包用自写脚本（`.tmp/unasar.mjs`），头部结构：
`u32@4 = headerPickleSize`、`u32@12 = jsonStringSize`、JSON 起于 `@16`、文件数据基址 `8 + headerPickleSize`。
本次 `headerPickleSize = 11,260,500`、`baseOffset = 11,260,508`，还原 41,871 文件 / 419 MB。

## 1. REA 分析证据

`analyze_javascript_application`（input = `app/dist/renderer`，source_paths = `["32636.00189f99.async.js"]`）：

- parent evidence：`ev_b84ffb5ac652176d9243c7ce47b0ef3347572ce26409b79796b9cc97d658c828`
- view evidence：`ev_870f867593c18e189f815762c4b1382926543304a7737aebf6a8dc2634adc908`
- coverage：`{"status":"complete-within-view","examined":1428,"total":1428,"next_offset":null,"exhausted":true}`
- unknowns：1173 application-graph + 30013 semantic-graph（未选源与动态表达所致，不影响本页结论）
- limitations 19 条，关键项：静态语法观察不证明运行时执行；动态属性解析与压缩标识符可能留未解析项。

**chunk 定位**：`index.4fed96b5fcebc02a.js` 的 webpack chunk 映射表里 `32636:"async_project_overview"`，
对应样式 `async_project_overview.dbd5908b.css`。中文文案在 `locale.zh-CN.b5edca87b11f70ed.js` 的
`overView.*` / `project.label.*` / `projectModule.*` 键族。

## 2. 原页面结构（类名 → 语义，全部取自 chunk 内类名字面量常量）

```
.container-LUodZ0            外层：max-width 1200 / margin 0 auto / padding-top 20
└ .card-R2lvj9               「统计」卡：--wrap-card-bg / radius 10 / padding 12 20 / shadow 0 2px 4px -2px
   ├ .card__title-lFTvgU     「统计」标题：高 24 / 500 / 14px
   ├ .projectSummary__num-GoEUj6   大数字：min-height 34 / 24px / 34px 行高
   ├ .projectSummary__des-lRYmOn   描述：12px / 17px 行高 / 次级色
   └ .statisticsContainer-vJJN2J   grid: repeat(auto-fit, minmax(140px,1fr)) / gap 16
      └ .statistic-3agSM1           单块：min-width 140 / transition all .3s
.container-FmdDnj            模块卡：max-width 640（原 320）/ padding 20 0 / container-type inline-size
├ .counts-Q2yB8W             计数条：border 1px split / radius 12 / padding 20 24 / shadow
│  ├ .count1-XgyWhC 24%      ├ .count2-QYbhzj 38%     ├ .count3-i_jRC1 28%
│  └ .line-ol7fgn 5%         竖线 ::after width 1 / height 100%
├ .functions-VkPW1t          flex / gap 20 / margin-top 20
│  ├ .left-Gj8Uxk            flex:1 / min-width 356（container <1000 时 flex-wrap）
│  └ .right-GH0jb9           min-width 240 / max-width 320
│     └ .rightAction-CUSGuy  padding 8 / radius 8 / gap 8 / hover --ui-item-hover-bg / .disable 灰化
└ .card-WoMhzt               功能卡（分享列表 / 自动导入 / 代码生成）
   ├ .card__title-t8MpFB     14px / 600 / margin-bottom 4
   ├ .card__info-a9aCfT      12px / 行高 sm
   └ .card__bgIcon-Ez5IlL    右下角水印：opacity .3 / bottom -28 / right -28
```

### 2.1 计数条三块的真实语义（`project.label.*`）

`count1` → 接口数 / 文档数 / 数据模型数（`apiCount` / `docsCount` / `dataSchemaCount`）；
`count2` → 单接口用例统计（`apiTestCaseCount` / `coverageOfEndpointCase` 等）；
`count3` → 场景用例统计（`testScenarioCount` / `coverageOfTestScenario`）。
数字全部来自服务端 `/api/v1/project-states?moduleId=`，不是本地估算。

### 2.2 右栏动作（`projectModule.action.*`，按源码顺序）

`shareDoc`（分享文档，`/api-doc/shared-doc/shared-doc-list/`）→ `docSite`（发布文档站，
`/api-doc/published-project/publish-settings/`）→ `generateCode`（生成代码）→ `import`（导入数据，
OAS/DOCS/MODELS 型模块隐藏）→ `export`（导出数据，同样隐藏）→ `more`（更多设置，`/project-settings/`）。

### 2.3 项目名称的默认值语义（本次缺陷的根因）

Apifox 的当前项目来自 `project.currentProject`（`localStorage` 键 `Context:currentProject`），
路由是 `/project/:id?`——**id 可选**；没有项目时 `currentProject` 为空，页面渲染引导态（快速开始），
不会预填任何项目 id 或名称。dsh-postapi 原实现把 `proj_demo01` 写进 `useState` 初值并在
`listProjects` 返回后**自动打开第一个项目**，两处都违背了这个语义。

## 3. 重建映射（Apifox → dsh-postapi）

| Apifox | dsh-postapi | 差异说明 |
|---|---|---|
| `.container-LUodZ0` | `.pp-overview-content`（沿用） | 内容区 16px 内边距不变，不再套 1200 上限（侧栏可用宽 455px） |
| `.card-R2lvj9` + `projectSummary__*` | `.pp-card.pp-ov-summary` + `.pp-ov-summary-num` / `.pp-ov-summary-desc` | 24px 大数字 + 12px 描述，token 化 |
| `.statisticsContainer-vJJN2J` | `.pp-stats`（沿用，auto-fit minmax(96px,1fr)） | 侧栏窄，起跳值 96px 而非 140px；640px 容器降两列 |
| `.container-FmdDnj` | `.pp-card.pp-ov-modules` | 单卡承载计数条 + 功能区 |
| `.counts-Q2yB8W` / `count1..3` | `.pp-ov-counts` / `.pp-ov-count` / `.pp-ov-divider` | 五块（接口/文档/模型/单接口用例/场景用例），flex + 1px 竖线；原 24/38/28% 固定比例在 455px 下会挤压，改 auto 分配 |
| `.functions-VkPW1t` | `.pp-ov-functions` | gap 20 |
| `.left-Gj8Uxk` | `.pp-ov-left` | flex 1 1 240px + min-width 0 |
| `.right-GH0jb9` / `.rightAction-CUSGuy` | `.pp-ov-right` / `.pp-ov-action` | 6 条动作，padding 8 / radius 8 / hover 换底 |
| `.card-WoMhzt` | `.pp-card.pp-ov-card` + `.pp-ov-card-title` / `.pp-ov-card-info` | 三张功能卡（分享列表 / 自动导入 / 代码生成），auto-fit minmax(200px,1fr) |
| 项目卡片网格 | `.pp-overview-grid` / `.pp-card-hover`（沿用） | 保留本地实现（Apifox 用列表，网格在侧栏更省纵向） |
| `.overview-header-container` | `.pp-overview-head`（沿用） | 标题 18px/700 + 动作区 |
| 当前项目选择 | `.pp-ov-current` + `.pp-select.pp-ov-current-value` | **默认空**，占位「暂无项目 / 请选择项目」 |

### 3.1 新增纯函数（可单测）

- `moduleCounts(project)` → `{ endpointCount, docsCount, schemaCount }`：文档数与接口数同源，模型取 `schemas.length`。
- `caseCounts(project)` → `{ caseCount, scenarioCount }`：取 `testCases` / `testScenarios` 实际条目数，缺失即 0（不估算覆盖率）。

## 4. 默认值修复（本次两项）

1. `projects` / `project` / `currentId` / `renameName` 初值全部为空（`[]` / `null` / `''` / `''`），
   移除 `MOCK_PROJECTS` 作为初值；mock 仅在 `api.storage` 缺失时用于渲染结构示例，且 mock id 不进入 `currentId`。
2. `refresh()` 不再自动 `getProject(list[0].id)`：当前项目只能由用户在下拉选择或点「打开」确定。
   列表清空或删除当前项目时，`project` / `currentId` / `renameName` 一并复位为空。

## 5. 验收

| 项 | 命令 | 结果 |
|---|---|---|
| 构建 | `node build.mjs` | 通过，`dist/client.js` 417.5 kb |
| 全量测试 | `node tests/run.js` | 通过 332 / 失败 0（新增 4 条 overview 用例） |
| UI 审计 | `node tests/ui-audit.test.js` | 硬断言 18/18；颜色字面量 0、字号字面量 0、未定义 token 0、类名 499/499 |
| 宿主 smoke | `node scripts/smoke-host.mjs` | 通过（7 effect / 席位 key / 桥形态） |

heights.test.js 的 8 处既有告警（`--icon` / `--icon-sm` / `--menu-item-h` / 1px 分隔线等）与本页无关，
改动前基线同为 8 处（本次新增的 `.pp-ov-divider` 已改用 `calc(var(--sp-3))` 归入白名单外不改动）。
