# PostAPI

Apifox 风格的接口工作区，运行在 DeepSeek Harness 官方右侧栏的 `postapi` 页签里。

## 能力

- 12 个页面：总览、接口文档、调试发送、Mock、数据模型、环境与变量、历史、自动化测试、导入导出、流程图、全局搜索、设置。
- 宿主桥 48 条路由，覆盖项目/目录/接口/模型/环境/全局变量/Mock/测试用例/测试场景/流程图/设置的完整 CRUD，以及请求发送、脚本执行、Schema 校验、导入导出与代码生成。
- 数据落盘为本地 JSON，默认目录 `~/.dsh/postapi`，可用 `POSTAPI_DATA_DIR` 或宿主 config 覆盖。

## 接线

- 右栏页签由 `ctx.sidebarRightTabs.register` 注册（id/kind 均为 `postapi`，`keepMounted`，guide 单入口）。
- 页签主体挂在 `sidebar.right.pane.tab`（key=`postapi`），标题挂在 `sidebar.right.pane.tab.title`。
- 数据经 `/dsh-postapi/api` 同源 prefix 桥传输，host 侧先过 `connection.requestRejection` 鉴权栅栏。
- 样式表以文本形式打进 `dist/client.js`，由 client 在 apply 时注入带 `data-plugin="dsh-postapi"` 的 `<style>`。

## 开发

```bash
npm install
npm run build     # esbuild 打包 + vm smoke
npm test          # 328 用例
npm run smoke     # 宿主端到端 27 项
```

契约与视觉规格见 `docs/interface-contract-v2.md`、`docs/apifox-visual-parity-spec.md`、`docs/feature-matrix.md`。
