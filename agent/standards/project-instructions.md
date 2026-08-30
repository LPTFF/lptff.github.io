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
- 页面使用的 Markdown 内容直接放在对应页面目录：博客文章和面试归档在 `src/views/Blog/articles/`，投资协议在 `src/views/investment/`；应用数据在 `src/data/`，职业原始资料在 `src/data/career/` 和 `src/data/findJobMarkDown/`；项目支持静态资源在 `project-support/public/`。
- `dist/`、`auto-imports.d.ts` 和 `components.d.ts` 是生成或派生内容，优先修改源文件。面试知识树与项目串联稿只保留 `src/views/Blog/articles/2026/` 下的博客源文件，投资脱敏快照只保留 `project-support/data-snapshots/investment/` 下的唯一源文件。
- Element Plus 是默认 UI 基础；新增页面先考虑现有组件和页面模式，再补少量业务样式。
- 个人数据默认本地优先。云同步、远程埋点、第三方上传、凭据和账号态行为需要单独判断授权、隐私和退出方式。
- 除非任务确实涉及爬虫或部署，不运行 `project-support/build.sh` 或 `project-support/deploy/uploadQL.js`。

## 验证与交付

- 验收统一遵循[真实环境验收原则](trusted-verification.md)；本页不重复浏览器、结论状态和隐私规则。
- 文档与局部代码先检查内容、链接和差异；UI、数据、采集和部署继续在对应真实消费者中完成操作闭环。
- 依赖或构建链关注 lockfile、安装结果、构建和受影响运行时；这些结果只证明相应静态或运行条件。
- 提交、推送遵循[人机协作边界](agent-execution.md)：只暂存当前任务文件，向人展示确定版本和证据并取得本次明确批准；批准后内容或目标变化则重新审查。

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
