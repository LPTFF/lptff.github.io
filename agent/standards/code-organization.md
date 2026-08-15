# 代码组织参考

这些约定帮助维护者快速找到代码和资料，不是提交格式或 Agent 流程要求。

- 页面与局部组件：`src/views/<domain>/`。
- 路由入口：`src/router/`。
- 跨页面纯逻辑：`src/utils/<domain>/`。
- 用户内容：直接放在唯一消费者的页面目录，例如 `src/views/Blog/articles/`、`src/views/home/findJob/` 和 `src/views/investment/`。
- 用户内容和应用资源：页面内容直接随消费者组织，应用数据在 `src/data/`，应用资源在 `src/assets/`。
- 项目支持区：`project-support/public/`、`project-support/scripts/`、`project-support/crawl/`、`project-support/extension/`、`project-support/deploy/`。
- 运行时可读的产品文档：明确由页面导入的文档仍属于项目功能，例如 `src/views/Blog/articles/**/*.md` 由 `import.meta.glob` 以 `?raw` 编译。
- 项目事实、产品判断、研究资料和有长期价值的复盘：`agent/`。
- 维护文档且没有运行时消费者：`agent/docs/`。
- 生成声明、构建目录、动态快照和临时验证输出不是优先手写源文件。

新增或修改内容时，先问它的实际消费者是谁、以后谁需要理解它、能否沿用已有模式。避免为了抽象而抽象，也避免把运行时需要的产品内容藏进仅维护者可见的资料目录。
