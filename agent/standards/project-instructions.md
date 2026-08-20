# 项目工作说明

这是一个 Vue 3 + Vite 网站，使用 JavaScript、TypeScript 和 npm。应用入口是 `index.html` → `src/main.js` → `src/App.vue` → `src/router/index.js`，页面组件主要位于 `src/views/`。

## 常用命令

- `npm run serve`：同步面试摘要并在 8090 启动开发服务器。
- `npm run preview`：预览生产构建。
- `npm run typecheck`：运行 Vue/TypeScript 类型检查。
- `npm run build`：同步生成文件、类型检查、生产构建并生成 404 页面。
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

- 文档或局部代码：检查内容、链接和 `git diff --check`；这些检查只证明对应静态性质，不构成项目验收。
- UI、路由或数据消费者：类型检查和构建只用于发现实现问题；验收必须在实际部署页面和目标浏览器中操作关键流程，必要时检查移动视口。
- 采集或生成链：检查真实产物的结构、完整性和消费者，不以 HTTP 200、退出码 0 或 JSON 可解析单独判断成功。
- 依赖或构建链：关注 lockfile、安装结果、构建和受影响运行时。

项目验收只以目标真实环境中的实际操作结果符合预期为准。静态检查、构建、脱敏快照、模拟数据、Mock、人工 fixture 和自设测试工具都不能替代验收，也不能据此宣称功能完成；未完成真实操作时必须标记为未验收、无法验证或未知。

## Chrome DevTools MCP 验收基准

- 页面、路由、浏览器存储和浏览器扩展变更，默认使用 Chrome DevTools MCP 接管用户实际 Chrome 验收。
- 验收环境必须是用户实际 profile、实际加载目录、真实登录态、真实来源和实际消费者页面；必须观察 Elements、Network、Console、路由、存储、刷新、失败与恢复。
- 不能用其他浏览器控制器、隔离 profile、截图、源码阅读或构建结果替代 Chrome DevTools MCP 的真实浏览器结果。
- Chrome DevTools MCP 无法接管目标环境时，保持 `BLOCKED` 或“未验收”，不得降级成更容易通过的替代方案后宣布完成。

## 提交与推送审核卡点

1. Agent 先完成实现、真实环境验收和静态排错，整理准确的待提交路径；只暂存已确认属于当前任务的文件。
2. 在任何 `git commit` 前，向维护者展示待提交范围、重要差异、删除项、真实验收证据、失败或未知、目标分支与远程，并明确请求审查。
3. 只有维护者对当前暂存版本明确回复“审查通过”并授权提交推送后，才允许执行 `git commit` 和 `git push`。任务开始时的笼统推送要求、Agent 自审、自动检查或以前的批准均不算本次审核通过。
4. 审核通过后若工作区、暂存树、提交范围、目标分支或远程有任何变化，批准失效；必须重新展示并重新取得审核通过。
5. 推送后核对远程提交、CI、发布资产和目标部署；它们失败时如实报告并继续处理，但不能倒推为提交前审核已经通过。
