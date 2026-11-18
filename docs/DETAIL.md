# PostAPI

![Composer dock badge](preview.svg)

DeepSeek Harness 的 PostAPI 插件项目，当前为初始骨架，仅提供一条最小可见能力：会话输入框底栏右侧显示一枚纸飞机徽章（`conversation.composer.dock` slot，order 5），用于验证插件的 Host 补丁、Client 模块加载与 Slot 注册链路。

宿主侧入口 `index.js` 暂未注册任何工具、事件或状态；后续在此文件按 `apply(ctx, config)` 约定扩展。待实现能力清单见仓库 README。
