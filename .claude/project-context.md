# 项目上下文

这是当前项目事实和决策的持久化来源。在进行广泛探索之前先阅读本文档。除非任务改变了相关区域或仓库与之矛盾，否则相信已记录的事实；只验证受影响的那些事实，而不是重新发现整个项目。

## 当前架构

- 技术栈：Vue 3、Vue Router 4、Vite 4、JavaScript 和 TypeScript；npm 管理依赖。
- 入口流程：`index.html` → `src/main.js` → `src/App.vue` → `src/router/index.js`。
- 页面位于 `src/views/`；主要路由分组为首页、博客、求职/生活、登录、留言/理财工具。
- 博客路由嵌套在 `/blog` 下；旧版归档、读书、关于、笔记本和带日期的文章 URL 都重定向到当前博客路由。
- 面向用户的 Markdown 内容位于 `src/content/blog/` 和 `src/content/interview/`。
- 运行时/静态资源位于 `public/`；大型爬虫数据快照位于 `src/public/data/`。

## 构建和生成数据流

- `npm run serve` 在启动 Vite 开发服务器（端口 8080）之前运行 `scripts/sync-findJob-summary.js`。
- `npm run build` 同步面试摘要，运行 `vue-tsc --noEmit`，用 Vite 构建，然后运行 `scripts/copy-404.js`。
- `src/content/interview/full.md` 和 `chain.md` 生成 `public/findJob-summary/full.md` 和 `chain.md`。
- `dist/` 是构建输出；`auto-imports.d.ts` 和 `components.d.ts` 是自动生成的声明文件。
- Vite 将 `xlsx` 保留在懒加载 chunk 中，因为基金和加密货币页面只在导出电子表格时才会加载它。

## 部署和运维路径

- `.github/workflows/ci.yml` 安装依赖、运行爬虫工作、构建站点，并将 `dist/` 直接推送到 `gh-pages` 分支；未使用 `gh-pages` npm 包。
- Vite 构建未使用预渲染插件。
- `uploadQL.js` 是一个单独的手动 SFTP 部署路径，需要 `archiver`、`ssh2` 和 `ssh2-sftp-client`。
- 除非明确要求爬虫或部署工作，否则不要运行 `build.sh` 或 `uploadQL.js`。

## 依赖决策

- 移除了 `gh-pages` 和 `vite-plugin-prerender`，因为仓库搜索确认它们未被使用；这移除了它们过时的部署/预渲染依赖树。
- 只要 `uploadQL.js` 还在使用，就保留 `archiver`。
- 只要电子表格导出功能还在使用，就保留 `xlsx`。当前用法是从应用程序数据生成工作簿，不解析上传的工作簿；其未解决的安全通告仍需要未来做替换决策。
- 保留 Vite 4，直到单独规划的大版本迁移获得批准并通过浏览器测试。
- `vite-plugin-compression` 和 `rollup-plugin-visualizer` 已声明但尚未配置。它们预期的未来用途未确认；移除前需询问。

## 验证和安全基线

- 默认代码验证：`npm run build`。
- 仅类型验证：`npx vue-tsc --noEmit`。
- 浏览器相关变更：运行 `npm run serve` 并在浏览器中检查受影响的流程。
- 依赖审计必须使用 `npm audit --registry=https://registry.npmjs.org`，因为配置的 npm 镜像没有审计端点。
- 移除未使用的部署/预渲染包后，本地 npm 审计基线为 8 个受影响包：7 个高危和 1 个中危，直接根源于 Vite 和 `xlsx`。

## 已验证的工作偏好

- 优先选择小型、可审查的变更，而不是将依赖清理与破坏性迁移混在一起。
- 不要运行 `npm audit fix --force`；明确检查并限定主要升级的范围。
- 除非用户要求，否则不为当前变更执行提交或推送。
- 当缺少持久化的事实时，只检查足够的仓库状态来确认它。如果无法从代码推导出意图，将其添加到**未解决问题**中并向用户询问，而不是反复猜测。

## 未解决问题

- `vite-plugin-compression` 和 `rollup-plugin-visualizer` 是为了将来使用而有意保留的，还是应该作为未使用的工具移除？
- 手动 `uploadQL.js` SFTP 部署路径是否应长期保留？
- 如果导出兼容性允许替换，哪个受维护的电子表格库应该替换 `xlsx`？
- 未来的 Vite 迁移应使用哪个 Vite 目标版本和浏览器支持基线？

通过将已解答的问题替换为相关部分的已确认事实或决策来解决；不要把已回答的问题留在这里。

## 迭代维护

每个完成的项目迭代在交接前必须审查此文件。

1. 当架构、路由、目录、依赖、命令、生成文件、部署、验证或数据流发生变化时，就地更新已有事实。
2. 添加新验证的持久化事实，以避免未来的仓库搜索或重复澄清。
3. 将未解决的意图放入**未解决问题**中，仅当它阻塞当前任务时才询问用户。
4. 移除过时的事实和已解决的问题；此文件描述的是当前项目，而非历史。
5. 在 `.claude/iteration-log.md` 中添加一条简洁的、带日期的记录，描述范围、证据/决策、变更的文件、验证和未解决的问题。将当前事实保留在此处；将演进历史保留在日志中。
6. 在最终回复中，声明 `project context updated` 或 `project context reviewed; no durable facts changed`。

小的 UI/内容编辑通常只需要第 5 步。不要添加任务日志、临时调试结果、提交历史或从单个局部函数就能看出来的事实。
