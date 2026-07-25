## 2026-07-25 — 修复高级搜索页动态模块加载白屏并建立迭代文档自动化

- 范围：排查 `/advanced-search` 首次访问时的 `504 (Outdated Optimize Dep)` 和动态导入失败；将高级搜索页的 Element Plus 搜索图标从嵌套 `<el-icon>` 改为 `el-input` 的 `prefix-icon` 绑定，移除不再需要的 `ElIcon` 注册；新增迭代日志草稿和上下文遗漏检查脚本。未修改路由结构、搜索跳转行为、数据源或部署流程。
- 证据/决策：高级搜索页的动态模块可正常返回并渲染；改用显式 `:prefix-icon="Search"` 后避开了原先的组件注册组合，保持 Element Plus 的按组件导入边界。开发机同时存在多个 Vite 服务，8080、8081、8082 已被占用；旧服务或 `node_modules/.vite` 过期缓存可能继续产生 504，因此调试时应先关闭残留 Node/Vite 进程，必要时清理该缓存。自动化只生成可审查草稿和报告缺失，不根据文件名自动推断架构事实，不挂入 `serve`/`build`，不自动提交或推送。
- 文件：`src/views/home/advancedSearch/index.vue`、`scripts/iteration-report.js`、`scripts/check-context-maintenance.js`、`package.json`、`AGENTS.md`、`CLAUDE.md`、`.claude/project-context.md`。
- 验证：`npm run build` 通过（`vue-tsc`、Vite 构建和 404 复制成功）；浏览器访问 `/advanced-search` 正常展示，控制台无错误和警告；脚本新增后通过 `npm run iteration:report`、`npm run context:check` 和 `git diff --check` 复核。
- 未解决问题：无。



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

## 2026-07-25 — 统一独立功能页与首页视觉风格并完善迭代记录

- 范围：将共享独立功能页布局的背景、顶部固定区域、最大宽度、品牌标识、标题、返回链接、底部边框和内容留白统一为首页的视觉风格，并保留现有路由、页面标题和返回首页行为；同步记录本轮 Agent 规划经验和验证结果。未修改业务组件、路由结构、数据源或部署流程。
- 证据/决策：对照 `src/views/home/index.vue` 已确认首页使用白色背景、`1200px` 内容宽度、固定顶部区域、`35px` 圆形 Logo、`21px` 品牌标题和 `rgb(44, 62, 80)` 主色；独立布局采用相同视觉基线，并为固定头部补充内容顶部留白、为头部底部增加 `#ebeef5` 分隔线，移动端保留紧凑布局。该变更属于局部 UI 调整，不需要并行 Agent、Plan Agent 或架构级上下文改动；后续同类任务应先读取项目上下文，再定向对照目标页面、最小修改、运行基线构建和上下文检查，最后由用户确认后再提交/推送。
- 文件：`src/views/home/StandaloneFeatureLayout.vue`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证：`npm run build` 通过（面试摘要同步、`vue-tsc --noEmit`、Vite 构建和 404 复制成功）；`npm run context:check` 通过，确认本轮没有需要持久化的高影响项目事实；`npm run iteration:report -- --write --summary "统一独立功能页与首页视觉风格并完善迭代记录"` 已追加本条记录；未启动开发服务器或执行浏览器/移动视口验证，本轮视觉效果由用户确认。
- 未解决问题：无；本次尚未执行 Git commit 或 push，等待用户确认推送前的工作区检查。

## 2026-07-25 — 新增业务功能说明文档并同步 README 入口

- 范围：新增 `docs/business-function-overview.md`，按当前源码、路由、首页导航和功能页整理产品定位、业务能力地图、用户流程、入口总表及正式/演示/待开发边界；README 增加文档入口。未修改应用代码、路由行为、数据源、依赖或部署流程。
- 证据/决策：业务说明以 `src/router/index.js`、`src/views/home/tools/websiteGroups.json` 和各页面当前可见交互为主要依据；将基金和加密货币页面定义为信息展示、辅助判断、外部跳转和导出，不定义为交易执行；将 `/loginFund` 标记为演示/状态待确认，将 `/job` 和 `/life` 标记为待开发；业务说明不替代后续技术设计或产品规划。
- 文件：`docs/business-function-overview.md`、`README.md`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证：`npm run iteration:report` 已生成并写入日志；`npm run context:check` 通过；`git diff --check` 通过。未运行 `npm run build`、开发服务器或浏览器验证，因为本轮仅新增和同步 Markdown 文档。
- 未解决问题：登录入口未来是下线、保留演示还是接入正式认证，仍待后续单独决定；`job` 和 `life` 的业务方向仍未定义。

## 2026-07-25 — 确立 Element Plus 统一 UI 设计约定

- 范围：在 `README.md`、`CLAUDE.md`、`AGENTS.md` 和 `.claude/project-context.md` 中确立 Element Plus 统一 UI 设计约定：后续新增或重构页面优先复用 Element Plus 组件、主题变量、布局和交互模式，以少量业务 CSS 完成页面搭建；未修改现有页面样式、应用代码、依赖或路由行为。
- 证据/决策：项目已将 Element Plus 作为基础组件库，现有页面已使用布局、卡片、表格、表单、标签、弹窗、加载和分页等组件。为降低 UI 设计难度并保持页面一致性，默认采用“业务结构 → Element Plus 组件组合 → 少量业务样式”的设计顺序；只有明确品牌或交互理由时才允许偏离，并记录原因和影响范围。
- 文件：`README.md`、`CLAUDE.md`、`AGENTS.md`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证：`npm run iteration:report` 已生成并写入日志；`npm run context:check` 通过；`git diff --check` 通过。未运行 `npm run build`、开发服务器或浏览器验证，因为本轮仅更新项目约定文档。
- 未解决问题：无。

## 2026-07-25 — 升级 Vite 6 并收紧本地开发服务器

- 范围：将开发依赖 Vite 从 5.4.21 升级到 6.4.3，随 Vite 将 esbuild 更新到 0.25.12；删除开发服务器的全网卡监听和全来源 CORS 配置，使其恢复本机默认行为。保留现有插件、端口、代理目标、业务代码、CI、提交和推送流程，未执行 `npm audit fix --force`。
- 证据/决策：官方 registry 完整审计和生产依赖审计均为 0 个漏洞；`@vitejs/plugin-vue@5.2.4`、`unplugin-vue-markdown@0.26.3` 与 Vite 6 的依赖声明兼容。`npm ci` 首次因 Windows 上残留 `esbuild.exe`/Rollup 原生模块文件锁失败，停止 Node/esbuild 进程后重试成功；不通过手工修改锁文件解决。
- 文件：`.claude/project-context.md`、`CLAUDE.md`、`README.md`、`package-lock.json`、`package.json`、`vite.config.ts`、`.claude/iteration-log.md`。
- 验证：`npm ci --registry=https://registry.npmjs.org` 成功（释放 Windows 文件锁后）；`npm run build` 通过（摘要同步、`vue-tsc --noEmit`、Vite 6 构建和 404 复制成功，仅有既有 `@vueuse/core` PURE 注释警告）；`npm ls`/`npm explain` 确认 Vite 6.4.3、esbuild 0.25.12 及无 peer 冲突；两次官方 registry 审计均报告 0 个漏洞。`npm run serve` 输出仅有 Local 地址并提示需 `--host` 才暴露，`curl http://localhost:8080/` 返回 200；第二个路由请求因服务在重启窗口结束而未完成，未连接 Chrome 浏览器 MCP，故未完成完整浏览器流程检查。
- 未解决问题：Vite 7/8、Node/浏览器基线、手动 SFTP 路径和未使用构建插件是否长期保留，仍待后续单独决定。

## 2026-07-25 — 修复 Element Plus 类型声明解析并增加独立类型检查

- 范围：将根目录由 `unplugin-auto-import` 和 `unplugin-vue-components` 生成的 `auto-imports.d.ts`、`components.d.ts` 纳入 `tsconfig.json`；新增 `npm run typecheck` 并让 `npm run build` 复用该命令。未添加 `declare module` any shim、未修改第三方声明、源码导入路径、依赖版本或 CI 部署流程。
- 证据/决策：`element-plus@2.14.2` 已提供 `es/index.d.ts`，项目源码从包名导入且 `npx vue-tsc --noEmit -p tsconfig.json` 通过，因此采用修正 TypeScript 项目边界而不是掩盖类型错误。后续插件类型问题可通过 `npm run typecheck` 在本地和现有构建/CI 链路中自动发现并阻止继续。
- 文件：`tsconfig.json`、`package.json`、`CLAUDE.md`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证：`npm run typecheck` 通过；`npm run build` 通过（摘要同步、类型检查、Vite 构建和 404 复制成功，仅有既有 `@vueuse/core` PURE 注释警告）；`npm run context:check` 和 `git diff --check` 通过。VS Code 诊断当前仅剩 cSpell 对业务词 `pojie` 的 information 提示，未再报告 Element Plus 类型错误；未修改该拼写检查提示。
- 未解决问题：若编辑器缓存仍显示旧诊断，应选择工作区 TypeScript 并重启 Vue/TypeScript 语言服务；不要添加 any shim。

## 2026-07-26 — 建立全局拼写检查配置并总结 Agent 规划经验

- 范围：针对编辑器报告的 `pojie` 未知词提示，新增根目录 `.cspell.json`，从仓库可检查文本文件执行一次全局 cSpell 扫描，将已确认的项目专有词、技术术语、爬虫字段和既有内容中的专有名词集中加入词典；配置遵循 `.gitignore` 并排除依赖、构建产物、大型数据快照、发布图片、锁文件和自动生成声明。同步在 `README.md`、`CLAUDE.md`、`AGENTS.md` 和 `.claude/project-context.md` 补充配置用途、运行方式与维护边界，未修改业务代码、依赖、路由或部署流程。
- 证据/决策：本轮是清晰、低风险的编辑器配置与文档同步任务，因此未启动并行 Agent、Plan Agent、worktree 或分阶段编排；采用“定向确认现有配置 → 全局扫描收集词项 → 最小配置和文档更新 → 全局复核”的单 Agent 规划。扫描发现的 `deafault`、`dislpay`、`Javscript`、`asycn`、`funtion` 等疑似真实拼写错误没有直接加入词典作为正确词，而是在文档中明确后续需单独确认修正，避免以消除告警为目的掩盖内容错误。可复用经验：cSpell 配置应区分“已确认专有词”和“疑似拼写错误”，全局扫描应明确排除生成物与大数据，并将命令和排除边界写入项目文档。
- 文件：`.cspell.json`、`README.md`、`CLAUDE.md`、`AGENTS.md`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证：使用 Node 兼容的临时 `cspell@8.17.5` 完成仓库全局扫描并以 `cspell-exit=0` 通过；`git diff --check` 通过；`npm run iteration:report` 已生成本轮草稿；`npm run context:check` 通过，确认本轮项目上下文已同步；未运行 `npm run build`、开发服务器或浏览器验证，因为本轮仅修改拼写配置和协作文档。
- 未解决问题：全局扫描中识别出的疑似真实拼写错误尚未修改，需后续逐项确认其是否为内容错误；cSpell CLI 未固定为项目依赖，当前通过 `npx --yes cspell@8.17.5` 临时复核。

## 2026-07-26 — 逐项确认并修正疑似拼写错误

- 范围：对全局 cSpell 扫描中定位到的疑似错误逐项核对上下文后修正：`deafault` → `default`、`containingblock` → `containing block`、`dislpay` → `display`、`CmmonJS` → `CommonJS`、`promise.allsettled` → `promise.allSettled`、`documen.write` → `document.write`、`jasmin` → `jasmine`、`Javscript` → `JavaScript`、`asycn` → `async`、`funtion` → `function`、`jsencrpt` → `jsencrypt`，并将访谈内容中的 `eventbus` → `event bus`、`nexttick` → `nextTick`、`tostring` → `toString` 统一为正确技术术语。面试源 Markdown 同步生成的 `public/findJob-summary/full.md` 已更新；未修改仅为合法专有名词、Cookie/接口字段或爬虫随机标识的词项。
- 证据/决策：源码、脚本和技术内容中的上述词均有明确标准拼写或可由上下文确认；`event bus` 作为普通技术术语采用带空格写法，`nextTick`、`toString`、`allSettled` 保留标准 API 大小写。修正后从 `.cspell.json` 移除对应的错误词条，不再通过词典掩盖问题；README 中原先用于举例的错误词也改为泛化描述。
- 文件：`build.sh`、`src/content/interview/full.md`、`public/findJob-summary/full.md`、`src/views/Login/FundLogin.vue`、`.cspell.json`、`README.md`、`.claude/iteration-log.md`。
- 验证：`node ./scripts/sync-findJob-summary.js` 成功；全局 `npx --yes cspell@8.17.5 --no-progress --no-summary .` 通过且无剩余发现；`npm run typecheck` 通过；`npm run build` 通过（包含摘要同步、Vite 构建和 404 复制，仅有既有 `@vueuse/core` PURE 注释警告）；`npm run serve` 已验证同步后的摘要包含 `event bus`，但因 8080–8083 均已有服务，临时服务自动顺延端口；`npm run context:check` 和 `git diff --check` 通过。
- 未解决问题：无。`cspell` 仍未固定为项目依赖，仅使用 Node 兼容版本临时执行全局复核。
