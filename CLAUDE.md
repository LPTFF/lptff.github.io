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
- 除非用户明确请求爬虫或部署工作，否则不要运行 `build.sh` 或 `uploadQL.js`。

## 生成和派生文件

- `public/findJob-summary/full.md` 和 `public/findJob-summary/chain.md` 由 `scripts/sync-findJob-summary.js` 从 `src/content/interview/full.md` 和 `src/content/interview/chain.md` 生成。
- `dist/` 是构建输出。
- `auto-imports.d.ts` 和 `components.d.ts` 是自动生成的声明文件；除非任务直接针对生成输出，否则避免直接编辑它们。
- `src/public/data/` 包含大型爬虫/数据快照。仅当任务涉及数据源或消费者时才读取特定文件。
- `public/image/` 包含博客内容使用的已发布图片 URL；未经检查兼容性路径，请勿移动或重命名。

## 工作规则

- 每项任务开始时先阅读 `.claude/project-context.md`；使用其已确认的事实和决策，而不是重新发现它们。
- 首先对请求进行分类。对于清晰、低风险的工作，直接执行；将冗长的规划保留给架构性、跨领域、破坏性或实质上模糊的变更。
- 仅验证任务影响区域内的事实。优先使用当前源码/配置，然后是项目上下文、定向搜索和生成输出。将结论标记为已确认、推断或未解决，而不是猜测。
- 如果当前代码与上下文矛盾，相信代码，验证受影响的路径，并在同一迭代中更新上下文。
- 保持变更最小化并限定在用户请求范围内。仅当一个未解决的抉择会改变行为、兼容性、架构或不可逆操作时才向用户询问；先将其记录在`未解决问题`下。
- 交接前，当持久化事实发生变化时更新 `.claude/project-context.md`，并将该次迭代追加到 `.claude/iteration-log.md`。
- 优先选择 `src/`、`scripts/`、`vite.config.ts`、`package.json` 和 `tsconfig*.json` 下的源文件，而非生成输出。
- 对于广泛搜索，排除 `node_modules/`、`dist/`、`.git/`、`.claude/worktrees/`、`src/public/data/`、`public/image/`、`package-lock.json`、`auto-imports.d.ts` 和 `components.d.ts`；仅在相关时明确包含它们。
- 仅当 VS Code/LSP 上下文、符号、引用或当前编辑器有用时才使用 `vscode-context-mcp`；普通的仓库搜索可以使用标准文件工具。
- 不要从此仓库修改用户级别的 Claude 配置、记忆、`.claude.json` 或全局设置。
- 除非用户明确要求，否则不要添加自动钩子或定时任务。

## 依赖安全与 Agent 规划经验

- 依赖安全任务采用“基线审计 → 并行只读探索 → Plan Agent 汇总 → 分阶段实施 → 每阶段重新安装/构建/审计”的流程；不要直接运行 `npm audit fix --force`。
- `npm audit --registry=https://registry.npmjs.org` 统计的是依赖树漏洞，GitHub Dependabot 的告警条数可能因公告、节点和历史告警而不同；必须通过 `npm ls` 和 `npm explain` 追踪实际链路。
- 生产依赖与开发依赖分开报告：同时运行完整审计和 `npm audit --omit=dev`，不要把构建工具漏洞误报成线上运行时漏洞。
- 直接依赖替换前先搜索实际 API 使用边界；本项目的 Excel 功能只写出工作簿，因此用 `write-excel-file` 替代 `xlsx`，并通过 [src/utils/exportExcel.ts](src/utils/exportExcel.ts) 保持页面调用一致和动态加载。
- 构建工具升级要保留中间版本和回滚边界：本次先从 Vite 4 升到 Vite 5，Vite/esbuild 残余告警不通过强制升级处理，留待另行规划 Vite 6+、插件兼容性和 Node 基线。
- Windows 上 `npm ci` 可能因开发服务器残留的 `esbuild.exe` 或 Rollup 原生模块文件锁失败；先停止相关 Node/esbuild 进程后再重试，并在日志中记录该环境因素。
- `npm run serve` 返回首页 HTTP 200 不等于浏览器流程验证成功；如果 Vite 依赖预构建出现 504、HMR 或控制台错误，必须明确标记导出按钮等交互验证为未完成。


- 对于代码变更，优先使用 `npm run build`。
- 对于仅类型检查，使用 `npx vue-tsc --noEmit`。
- 对于浏览器相关变更，运行 `npm run serve` 并检查 Vite 应用。
- 如实报告失败的测试或跳过的验证。

## 持续上下文维护

`.claude/project-context.md` 是维护的项目上下文记录。每次迭代如果改变了架构、目录、路由、构建行为、依赖、生成文件或数据流，都必须更新其基线和维护检查清单。小型独立的 UI 编辑只需检查清单即可。
