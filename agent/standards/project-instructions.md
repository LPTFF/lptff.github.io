# 项目工作说明

这是一个 Vue 3 + Vite 网站，使用 JavaScript、TypeScript 和 npm。应用入口是 `index.html` → `src/main.js` → `src/App.vue` → `src/router/index.js`，页面组件主要位于 `src/views/`。

## 常用命令

- `npm run serve`：直接在 8090 启动 Vite，不执行同步或联网准备。
- `npm run preview`：预览生产构建。
- `npm run typecheck`：运行 Vue/TypeScript 类型检查。
- `npm run build`：只执行 Vite 生产构建；Live2D 模型由 Vite 从已安装依赖提供并写入构建产物。404 页面继续由原 CI 步骤生成。
- Python 采集按需直接运行 `project-support/crawl/run_collectors.py` 或 `project-support/build.sh`，不再通过 package scripts 转发。

命令是给维护者选择的工具，不是每次改动都必须执行的仪式。根据改动影响选择最能证明结果的检查。

## 项目边界

- 页面在 `src/views/`，路由在 `src/router/`，跨页面纯逻辑在 `src/utils/`。
- 页面使用的 Markdown 内容直接放在对应页面目录：博客文章在 `src/views/Blog/articles/`，面试资料在 `src/views/home/findJob/`，投资协议在 `src/views/investment/`；应用数据在 `src/data/`；项目支持静态资源在 `project-support/public/`。
- `dist/`、`auto-imports.d.ts` 和 `components.d.ts` 是生成或派生内容，优先修改源文件。面试 Markdown 只保留 `src/views/home/findJob/` 下的唯一源文件，投资脱敏快照只保留 `project-support/fixtures/investment/` 下的唯一源文件。
- Element Plus 是默认 UI 基础；新增页面先考虑现有组件和页面模式，再补少量业务样式。
- 个人数据默认本地优先。云同步、远程埋点、第三方上传、凭据和账号态行为需要单独判断授权、隐私和退出方式。
- 除非任务确实涉及爬虫或部署，不运行 `project-support/build.sh` 或 `project-support/deploy/uploadQL.js`。

## 按影响选择验证

- 文档或局部代码：检查内容、链接和 `git diff --check`；这些检查只证明对应静态性质，不构成项目验收。
- UI、路由或数据消费者：类型检查和构建只用于发现实现问题；验收必须在实际部署页面和目标浏览器中操作关键流程，必要时检查移动视口。
- 采集或生成链：检查真实产物的结构、完整性和消费者，不以 HTTP 200、退出码 0 或 JSON 可解析单独判断成功。
- 依赖或构建链：关注 lockfile、安装结果、构建和受影响运行时。

项目验收只以目标真实环境中的实际操作结果符合预期为准。静态检查、构建、脱敏快照、模拟数据、Mock、人工 fixture 和自设测试工具都不能替代验收，也不能据此宣称功能完成；未完成真实操作时必须标记为未验收、无法验证或未知。

## Chrome DevTools MCP 唯一验收基准

- 页面、路由、浏览器存储和浏览器扩展变更，只允许使用 Chrome DevTools MCP（工具名 `mcp__chrome_devtools__*`）接管用户实际 Chrome 验收。
- 验收环境必须是用户实际 profile、实际加载目录、真实登录态、真实来源和实际消费者页面；必须观察 Elements、Network、Console、路由、存储、刷新、失败与恢复。
- 禁止使用 Browser/Chrome 插件控制器、Playwright、Puppeteer、Selenium、Computer Use、隔离浏览器或任何其他页面自动化工具执行项目页面验收。
- 截图、HTTP 请求、源码阅读、类型检查和构建结果只能辅助定位，不能替代 Chrome DevTools MCP 的真实浏览器结果，也不能单独支持 `PASS`。
- Chrome DevTools MCP 无法接管目标环境时，必须保持 `BLOCKED` 或“未验收”；不得切换到其他浏览器或页面测试工具继续验收，不得以任何降级方案宣布完成。

## 提交与推送审核卡点

1. Agent 先完成实现、真实环境验收和静态排错，整理准确的待提交路径；只暂存已确认属于当前任务的文件。
2. 在任何 `git commit` 前，向维护者展示待提交范围、重要差异、删除项、真实验收证据、失败或未知、目标分支与远程，并明确请求审查。
3. 只有维护者对当前暂存版本明确回复“审查通过”并授权提交推送后，才允许执行 `git commit` 和 `git push`。任务开始时的笼统推送要求、Agent 自审、自动检查或以前的批准均不算本次审核通过。
4. 审核通过后若工作区、暂存树、提交范围、目标分支或远程有任何变化，批准失效；必须重新展示并重新取得审核通过。
5. 推送完成只需确认远程分支已接收目标提交；任务完成依据是受影响范围已经在本地完成对应静态检查、构建和真实环境验收。默认不等待、不轮询 GitHub Actions、发布资产或目标部署，也不把远程 CI/部署状态作为本地任务的完成条件；只有维护者明确要求时才检查或跟进这些远程流程。

## Git 提交信息规范

参考 Vue 官方项目的提交约定，本项目固定使用 `<type>(<scope>): <中文摘要>`；不需要 scope 时使用 `<type>: <中文摘要>`。

- `type` 只使用以下稳定集合：`feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`build`、`ci`、`chore`、`types`、`revert`。
- `scope` 可选，仅在能明确定位变更时填写，使用小写、稳定的模块名，例如 `home`、`live2d`、`router`、`assets`、`build`、`agent`、`deps`；不要为一次提交临时创造冗长 scope。
- 摘要使用简洁中文说明“做了什么”，不加句号，最长 50 个字符；禁止混用 `功能：`、`修复：` 等中文类型前缀、无类型裸标题或同一项目内不断变化的格式。
- 一个提交只包含一个完整且相关的关注点。互不相关的功能、修复、文档或依赖变更应拆分提交；不要用一个宽泛标题掩盖多个独立改动。
- 正文可选，使用中文解释原因、关键取舍、影响范围和必要的验证信息；标题不要复述实现细节。
- 回滚提交使用 `revert: <中文摘要>`。重大不兼容变化在正文中单独写明，不在标题中引入项目未约定的变体。

示例：

- `feat(live2d): 增加模型切换与资源按需加载`
- `fix(home): 恢复导航图标降级`
- `perf(assets): 延迟加载模型预览`
- `docs(agent): 统一页面验收与提交规范`
- `chore(deps): 更新前端依赖锁文件`
