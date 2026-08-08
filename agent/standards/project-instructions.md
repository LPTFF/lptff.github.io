# 项目工作说明

这是一个 Vue 3 + Vite 网站，使用 JavaScript、TypeScript 和 npm。应用入口是 `index.html` → `src/main.js` → `src/App.vue` → `src/router/index.js`，页面组件主要位于 `src/views/`。

## 常用命令

- `npm run serve`：同步面试摘要并在 8090 启动开发服务器。
- `npm run preview`：预览生产构建。
- `npm run typecheck`：运行 Vue/TypeScript 类型检查。
- `npm run build`：同步生成文件、类型检查、生产构建并生成 404 页面。
- `npm run test:collectors`：运行 RSS 采集器离线测试。
- `npm run test:crawlers`：运行 Python 采集器测试。
- `npm run crawl` / `npm run crawl:full`：运行对应范围的采集任务；只有确实需要时再运行。

命令是给维护者选择的工具，不是每次改动都必须执行的仪式。根据改动影响选择最能证明结果的检查。

## 项目边界

- 页面在 `src/views/`，路由在 `src/router/`，跨页面纯逻辑在 `src/utils/`。
- 页面使用的 Markdown 内容直接放在对应页面目录：博客文章在 `src/views/Blog/articles/`，面试资料在 `src/views/home/findJob/`，投资协议在 `src/views/investment/`；应用数据在 `src/data/`；项目支持静态资源在 `project-support/public/`。
- `project-support/public/findJob-summary/`、`dist/`、`auto-imports.d.ts` 和 `components.d.ts` 是生成或派生内容，优先修改源文件。
- Element Plus 是默认 UI 基础；新增页面先考虑现有组件和页面模式，再补少量业务样式。
- 个人数据默认本地优先。云同步、远程埋点、第三方上传、凭据和账号态行为需要单独判断授权、隐私和退出方式。
- 除非任务确实涉及爬虫或部署，不运行 `project-support/build.sh` 或 `project-support/deploy/uploadQL.js`。

## 按影响选择验证

- 文档或局部代码：检查内容、链接、`git diff --check`，再运行最相关的测试。
- UI、路由或数据消费者：运行类型检查和构建，并在真实页面中检查关键流程；必要时检查移动视口。
- 采集或生成链：检查真实产物的结构、完整性和消费者，不以 HTTP 200、退出码 0 或 JSON 可解析单独判断成功。
- 依赖或构建链：关注 lockfile、安装结果、构建和受影响运行时。

验证的目的，是帮助人知道结果是否可靠、哪里仍未知以及下一步由谁处理；不要求固定报告目录或机器索引。
