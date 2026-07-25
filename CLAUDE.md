# Claude Code 项目说明

## 项目事实

- 这是一个使用 JavaScript 和 TypeScript 的 Vue 3 + Vite 网站。
- 包管理器为 npm；保持 `package-lock.json` 与依赖变更同步。
- 应用入口为 `index.html` → `src/main.js` → `src/App.vue` → `src/router/index.js`。
- 页面组件位于 `src/views/`。
- 面向用户的 Markdown 内容位于 `src/content/blog/` 和 `src/content/interview/`。
- 运行时/静态资源位于 `public/`；大型导入的数据快照位于 `src/public/data/`。

## 命令

- `npm run serve`：同步面试摘要，然后在端口 8080 启动 Vite 开发服务器。
- `npm run build`：同步面试摘要，运行 `vue-tsc --noEmit`，用 Vite 构建，然后创建 `dist/404.html`。
- `npm run preview`：预览构建输出。
- `npm run iteration:report`：根据当前 Git 工作区生成迭代日志草稿；默认只预览，确认后可追加 `--write --summary "本轮摘要"`。
- `npm run context:check`：检查高影响路径是否同步更新项目上下文和迭代日志；这是只读检查，不会自动改写文件。
- 除非用户明确请求爬虫或部署工作，否则不要运行 `build.sh` 或 `uploadQL.js`。

## 生成和派生文件

- `public/findJob-summary/full.md` 和 `public/findJob-summary/chain.md` 由 `scripts/sync-findJob-summary.js` 从 `src/content/interview/full.md` 和 `src/content/interview/chain.md` 生成。
- `dist/` 是构建输出。
- `auto-imports.d.ts` 和 `components.d.ts` 是自动生成的声明文件；除非任务直接针对生成输出，否则避免直接编辑它们。
- `src/public/data/` 包含大型爬虫/数据快照。仅当任务涉及数据源或消费者时才读取特定文件。
- `public/image/` 包含博客内容使用的已发布图片 URL；未经检查兼容性路径，请勿移动或重命名。

## 工作规则

- 普通任务默认在当前 checkout 中定向探索并进行最小修改，不创建隔离副本。
- 不默认启动并行 Agent、Plan Agent 或分阶段流程。仅当依赖/构建链迁移、跨领域变更、破坏性操作或实质模糊的需求需要回滚边界时，才按 `AGENTS.md` 的高风险升级流程处理。
- 使用 `.claude/project-context.md` 中已确认的事实和决策，避免重复全仓库发现；仅验证任务影响区域内的事实，优先使用当前源码/配置、项目上下文、定向搜索和生成输出，并将结论标记为已确认、推断或未解决。
- 如果当前代码与上下文矛盾，相信代码，验证受影响的路径，并在同一迭代中更新上下文。
- 保持变更最小化并限定在用户请求范围内。仅当一个未解决的抉择会改变行为、兼容性、架构或不可逆操作时才向用户询问；先将其记录在`未解决问题`下。
- 仅当项目事实、约定或复杂迭代证据实际变化时，更新 `.claude/project-context.md`、本文件或 `.claude/iteration-log.md`；本项目提供 `iteration:report` 生成日志草稿、`context:check` 检查高影响变更是否漏记。局部 UI/内容编辑仍由 Agent 判断是否需要持久化。完成代码迭代后默认运行这两个命令，确认并补充草稿，不要把推断直接写成事实。
- 优先选择 `src/`、`scripts/`、`vite.config.ts`、`package.json` 和 `tsconfig*.json` 下的源文件，而非生成输出。
- 对于广泛搜索，排除 `node_modules/`、`dist/`、`.git/`、`src/public/data/`、`public/image/`、`package-lock.json`、`auto-imports.d.ts` 和 `components.d.ts`；仅在相关时明确包含它们。
- 仅当 VS Code/LSP 上下文、符号、引用或当前编辑器有用时才使用 `vscode-context-mcp`；普通仓库搜索、文件读写不使用它。
- 不要从此仓库修改用户级别的 Claude 配置、记忆、`.claude.json` 或全局设置。
- 除非用户明确要求，否则不要添加自动钩子或定时任务。

## 依赖安全与构建链基线

- 依赖安全和构建链的高风险升级才使用 `AGENTS.md` 中的升级流程；普通任务不默认并行探索或 Plan Agent。
- `npm audit --registry=https://registry.npmjs.org` 统计的是依赖树漏洞，GitHub Dependabot 的告警条数可能因公告、节点和历史告警而不同；必须通过 `npm ls` 和 `npm explain` 追踪实际链路。
- 生产依赖与开发依赖分开报告：同时运行完整审计和 `npm audit --omit=dev`，不要把构建工具漏洞误报成线上运行时漏洞。
- 直接依赖替换前先搜索实际 API 使用边界；本项目的 Excel 功能只写出工作簿，因此用 `write-excel-file` 替代 `xlsx`，并通过 [src/utils/exportExcel.ts](src/utils/exportExcel.ts) 保持页面调用一致和动态加载。
- 构建工具升级要保留中间版本和回滚边界：本次先从 Vite 4 升到 Vite 5，Vite/esbuild 残余告警不通过强制升级处理，留待另行规划 Vite 6+、插件兼容性和 Node 基线。
- Windows 上 `npm ci` 可能因开发服务器残留的 `esbuild.exe` 或 Rollup 原生模块文件锁失败；先停止相关 Node/esbuild 进程后再重试，并在日志中记录该环境因素。
- `npm run serve` 返回首页 HTTP 200 不等于浏览器流程验证成功；如果 Vite 依赖预构建出现 504、HMR 或控制台错误，必须明确标记导出按钮等交互验证为未完成。

## 验证

- 对代码变更优先运行 `npm run build`；仅类型检查使用 `npx vue-tsc --noEmit`。
- 浏览器相关变更运行 `npm run serve` 并检查受影响流程；如实报告失败或跳过的验证。
