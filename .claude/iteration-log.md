## 2026-07-25 — 首页功能拆分为独立页面

- 范围：保留首页热门资讯、吾爱破解、导航专区、Boss直聘、豆瓣电影；将薅羊毛、高级搜索、技术论坛、GitHub Trending、LeetCode、面试题迁移为六个独立路由，并通过导航专区的 `InternalWebsite` 分类提供入口。未修改数据源和全局 `App.vue` 外壳。
- 证据/决策：新增共享独立页布局；首页改用稳定 key 配置并保持 PC 默认导航专区、移动端默认热门资讯；三个 location 驱动列表在独立路由未传 prop 时展示全量，在首页继续按滚动增量展示。
- 文件：`src/router/index.js`、`src/views/home/index.vue`、`src/views/home/StandaloneFeatureLayout.vue`、三个列表组件、`src/views/home/tools/websiteGroups.json`、`.claude/project-context.md`。
- 验证：`npm run build` 通过（`vue-tsc`、Vite 构建和 404 复制成功）；开发服务器下直接访问 `/welfare` 和 `/interview` 均加载独立布局与业务内容，首页五项菜单、默认导航专区及 `InternalWebsite` 六个入口已通过浏览器快照检查；未完成移动视口实测。
- 未解决问题：独立页全量薅羊毛列表的移动端滚动性能仍需实际移动视口验证。



- 范围：根据用户决策，将项目工作方式从“不主动创建或重复创建 worktree”收紧为“不使用 Git worktree 隔离”，默认只在主 checkout 中连续迭代；移除仓库内对该临时目录的忽略和文档中的隔离副本表述。未改变应用代码、依赖或部署行为。
- 证据/决策：历史 worktree 已清理，当前只保留主工作区；项目通过 `.claude/project-context.md` 和 `.claude/iteration-log.md` 管理显性事实与迭代记录，不需要 Git worktree 并行隔离。
- 文件：`AGENTS.md`、`CLAUDE.md`、`.claude/project-context.md`、`.gitignore`、`.claude/iteration-log.md`。
- 验证：已运行文档搜索、`git diff --check`、Git worktree 状态和 Git 状态检查；未运行应用构建，因为本次仅调整工作流文档和忽略规则。
- 未解决问题：无。



- 范围：按用户确认移除两个已合并的历史 worktree、对应本地分支和 Git 残留元数据；未修改应用代码、依赖或部署配置。
- 证据/决策：`worktree-agent-aa4cbc11e7e88320d` 和 `worktree-agent-aa50eb930d99e883d` 的提交均已包含在 `master`，且目录无需保留；当前仓库采用单一 checkout 迭代，不主动使用 worktree 隔离。
- 文件：`.claude/iteration-log.md`；清理 `.claude/worktrees/` 下两个历史目录及 `.git/worktrees/` 对应元数据。
- 验证：`git worktree remove`、`git branch -d`、`git worktree prune` 成功；当前 `git worktree list` 仅剩主工作区，`git branch --list 'worktree-*'` 无结果，`.claude/worktrees/` 为空。
- 未解决问题：无。



- 范围：将普通任务明确为当前 checkout/worktree 内的定向探索和最小修改；不再默认并行 Agent、Plan Agent、分阶段流程或主动创建/重复 Git worktree；精简三份指导文档的职责重叠，并移除本地配置中的通配 `git worktree` 权限。未改变应用代码、依赖或部署行为。
- 证据/决策：`.claude/project-context.md` 继续作为事实来源；`AGENTS.md` 仅在跨领域、高风险、破坏性或需要回滚边界时触发升级流程；宿主已经提供隔离 worktree 时继续使用当前目录，但仓库规则不主动新建。`.gitignore` 保留对 `.claude/worktrees/` 的忽略。
- 文件：`AGENTS.md`、`CLAUDE.md`、`.claude/project-context.md`、`.claude/settings.local.json`、`.claude/iteration-log.md`。
- 验证：已运行文档定向搜索、JSON 解析、`git diff --check` 和 Git 状态检查；未运行应用构建，因为本次仅调整工作流文档和本地权限。
- 未解决问题：`.claude/settings.local.json` 中其他历史高影响 allowlist（如 `git push`、进程终止、文件移动和依赖重装）未在本轮清理；宿主层自动隔离行为不受仓库文档控制。



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
