## 2026-07-25 — Agent 规划与项目文档经验沉淀

- 范围：总结本轮依赖安全 Agent 的探索、规划、实施和验证流程；将可复用的规划经验、审计口径、Windows 文件锁处理和浏览器验证边界写入项目文档；未改变应用行为或依赖版本。
- 证据/决策：依赖任务应先由只读 Agent 按构建链、直接业务依赖、部署/CI 路径并行取证，再由 Plan Agent 统一制定阶段和回滚边界；完整审计与生产审计必须分开报告；首页 HTTP 200 不能替代浏览器交互验证。
- 文件：`AGENTS.md`、`CLAUDE.md`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证：文档内容审查和 `git diff --check`；未运行应用构建，因为本次只更新项目说明和迭代经验。
- 未解决问题：Vite 6+ 迁移及 Node/浏览器基线、Vite 5 开发依赖残余审计告警、手动 SFTP 路径和未使用构建插件是否长期保留。


## 2026-07-25 — README 项目说明同步

- 范围：将 README 从简略的技术栈占位说明更新为当前项目说明，补充技术栈、主要功能、开发/构建命令、目录、部署、安全审计和维护文档入口；未改变应用行为、依赖或部署配置。
- 证据/决策：README 作为面向仓库使用者的入口文档，应反映当前已确认的 Vite 5、`write-excel-file` 延迟导出、GitHub Pages 发布和审计命令；详细 Agent 工作流与持久事实仍分别保留在 `AGENTS.md`、`CLAUDE.md` 和 `.claude/project-context.md`。
- 文件：`README.md`、`.claude/iteration-log.md`。
- 验证：文档内容审查和 `git diff --check`；未运行应用构建，因为本次仅更新项目说明文档。
- 未解决问题：沿用 `.claude/project-context.md` 中记录的 Vite 6+ 迁移、Node/浏览器基线、手动 SFTP 路径和未使用构建插件问题。


## 条目格式

```md
## YYYY-MM-DD — 简短范围

- 范围：变更了什么，以及有意未改动什么。
- 证据/决策：影响未来工作的已确认事实或用户批准的决策。
- 文件：变更的重要文件，包括相关情况下的生成/派生文件。
- 验证：运行的命令及其结果；明确说明跳过的检查项。
- 未解决问题：未解决的抉择，或 `无`。
```

## 2026-07-25 — 智能体上下文工作流

- 范围：使仓库指导文档显式化，并针对定向探索进行了优化；新增了持久化迭代日志，未改变应用行为。
- 证据/决策：`.claude/project-context.md` 是当前项目事实的来源；结论必须区分已确认、推断和未解决的项；规划阶段保留给架构性、跨领域、破坏性或实质上模糊的工作。
- 文件：`AGENTS.md`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证：仅文档审查；未运行应用构建，因为本次迭代未改变运行时代码和依赖。
- 未解决问题：本次文档变更未引入新问题。现有项目问题保留在 `.claude/project-context.md` 中。

## 2026-07-25 — 依赖安全分阶段修复

- 范围：升级 `archiver`、Vite 5 构建链、PostCSS、visualizer 和 `vue-tsc`；将三个页面的五个 Excel 导出入口从 `xlsx` 迁移到共享的 `write-excel-file` 浏览器适配器；未执行真实 SFTP 部署、`npm audit fix --force`、提交或推送。
- 证据/决策：生产依赖审计已为 0 个漏洞；完整开发依赖审计剩余 Vite 5 链路中的 2 个漏洞（Vite/esbuild），留待未来 Vite 6+ 或更高版本迁移；导出库保持动态加载并生成独立的 `xlsx-export` chunk。
- 文件：`package.json`、`package-lock.json`、`vite.config.ts`、`src/utils/exportExcel.ts`、`src/views/Message/FundPilotV1.vue`、`FundPilotPlus.vue`、`Cryptocurrency.vue`、`.claude/project-context.md`。
- 验证：`npm ci` 成功（Windows 文件锁释放后）；`npm run build` 成功；生产 `npm audit --registry=https://registry.npmjs.org --omit=dev` 报告 0 个漏洞；完整审计报告 2 个开发依赖漏洞；开发服务器首页曾返回 200，但浏览器检查遇到 Vite 预构建依赖 504/HMR 配置错误，未完成导出按钮的真实下载验证。
- 未解决问题：Vite 5 的开发依赖审计残留、Vite 6+ 迁移目标及 Node/浏览器基线；`uploadQL.js` 的手动 SFTP 路径和未使用构建插件是否长期保留。
