# 项目上下文

这是当前项目事实和决策的持久化来源。在进行广泛探索之前先阅读本文档。除非任务改变了相关区域或仓库与之矛盾，否则相信已记录的事实；只验证受影响的那些事实，而不是重新发现整个项目。

## 当前架构

- Agent 资产统一维护在 `agent/`：`standards/` 保存执行、项目与代码组织规范，`product/` 保存业务基线、规划、产品设计和研究，`context/` 保存项目事实与迭代记录，`verification/` 保存验收手册和被忽略的本地证据，`collaboration/` 保存外部协作资料，`tools/` 保存生命周期工具。根 `AGENTS.md`、`CLAUDE.md` 和 `.opencode/instructions.md` 仅作为工具发现入口，不复制完整规范。
- 技术栈：Vue 3、Vue Router 4、Vite 6.4.3、JavaScript 和 TypeScript；npm 管理依赖。
- UI 设计约定：Element Plus 是项目的基础组件库；后续新增或重构页面默认遵循 Element Plus 设计语言、主题变量、布局和交互模式，优先复用组件与现有页面模式，仅以少量业务 CSS 完成布局和品牌调整；确需偏离时记录原因和影响范围。
- 入口流程：`index.html` → `src/main.js` → `src/App.vue` → `src/router/index.js`。
- 页面位于 `src/views/`；主要路由分组为首页、博客、求职/生活、登录、留言/理财工具，以及通过导航专区进入的独立功能页。
- 业务功能说明统一维护在 `agent/product/business-overview.md`，按用户入口、业务域、典型流程和当前业务边界描述现有能力；该文档不作为未来规划或技术设计文档。
- 业务演进规划统一维护在 `agent/product/business-planning.md`，记录产品假设、阶段路线、验证指标、决策规则和后续实施清单；规划内容必须与当前已实现能力分开标记。
- 外部项目的优秀思路统一记录在 `agent/product/research/`：保留来源、许可证、观察事实、适用边界和最小验证实验；其中内容属于研究材料或待验证假设，验证通过前不作为当前项目事实或实施承诺。
- 最新产品方向已从“个人综合信息工作台扩展”收敛为“利用私人数据持续改善重要决策的个人高收益软件”：交易复盘是第一主线，职业资产和健康精力是后续候选，通用个人决策复盘引擎需在具体场景完成闭环后再抽象；通用聊天壳、普通待办/日报/摘要、无反馈 AI 建议、纯仪表盘和复杂多 Agent 系统不是当前核心方向。
- 产品方向统一采用“记录 → 分析 → 改进 → 验证”闭环和“目标 → 信息 → 判断 → 行动 → 预期 → 结果 → 错误归因 → 修改规则”决策模型；个人数据默认本地优先，云端同步、远程埋点和外部复用需单独评估隐私与责任边界。
- 面向外部开发者的交流资料统一维护在 `agent/collaboration/`，公开 Agent 管理方法论、脱敏与发布审批边界、开源反哺流程和沟通模板；不复制公司内部 Agent 管理模板，不放置内部项目、客户、凭据或未公开决策。
- 外部协作资料同时提供 `templates/context-kit/` 可复制模板包，用于将 Agent 工作规则、项目入口、当前事实、迭代证据、业务基线和未来规划分开维护；复制者必须用目标项目的实际事实和命令替换占位符。
- 首页顶部保留热门资讯、吾爱破解、导航专区、Boss直聘、豆瓣电影；PC 默认选中导航专区，移动端默认选中热门资讯。首页菜单使用稳定 key 配置，滚动位置按功能 key 缓存。Boss 招聘产品能力必须保留；其现有组件仍为 `src/views/home/bossZhipin/index.vue`，只消费 Boss 官方公开城市页生成的职位快照，并展示来源/更新时间状态。
- 独立功能页包括 `/welfare`、`/advanced-search`、`/tech-forum`、`/github-trending`、`/leetcode`、`/interview`，共享 `src/views/home/StandaloneFeatureLayout.vue`，入口位于导航专区 `InternalWebsite` 分类；共享布局沿用首页的白色背景、1200px 内容宽度、固定顶部品牌区和移动端紧凑间距。
- 首页列表组件的 location prop 仅用于首页内部滚动增量；薅羊毛、技术论坛、GitHub Trending 独立路由未传 prop 时展示完整数据快照。
- 博客路由嵌套在 `/blog` 下；旧版归档、读书、关于、笔记本和带日期的文章 URL 都重定向到当前博客路由。
- 面向用户的 Markdown 内容位于 `src/content/blog/` 和 `src/content/interview/`。
- 运行时/静态资源位于 `public/`；大型爬虫数据快照位于 `src/public/data/`。
- 个人 Claude Code + GitHub Copilot gateway 配置放在被 `*.local` 忽略的 `.claude/settings.local.json` 中；可提交的接入说明位于 `agent/tools/github-copilot-gateway.md`，不把个人 gateway 地址和模型映射写入项目级 `.claude/settings.json`。

## 构建和生成数据流

- `npm run serve` 在启动 Vite 开发服务器（端口 8090）之前运行 `scripts/sync-findJob-summary.js`。
- `npm run build` 同步面试摘要，运行 `npm run typecheck`（`vue-tsc --noEmit -p tsconfig.json`），用 Vite 构建，然后运行 `scripts/copy-404.js`。
- `npm run iteration:report` 从当前 Git 工作区生成可审查的迭代日志草稿；`npm run verification:refresh` 生成被 Git 忽略的 `agent/verification/reports/latest.md` 当前结论总览；`npm run context:check` 会先刷新该总览，再只读检查高影响路径是否同步更新协作文档。三者不挂载到 `serve`/`build`，也不自动提交或推送。
- `scripts/collectors/` 提供无认证公共数据采集基准：`npm run test:collectors` 使用离线 fixture 验证 HTTP 边界、RSS/Atom 解析、数据校验和失败不覆盖；`npm run collect:rss:fixture` 生成被 Git 忽略的候选 artifact。`npm run verify:rss:local` 会先测试，再通过与 CI 共用的 `npm run collect:rss:site` 访问白名单真实来源并生成根 `public/data/recommendArticleData.json`，执行生产构建后用 `vite preview` 打开现有 `/newsArticle`；页面从 `/data/recommendArticleData.json` 加载真实 JSON。该 JSON 是被 Git 忽略的动态生产构建输入，不随源码提交。原始 RSS 不伪造参考脚本中依赖 LLM 才能生成的阅读评分和推荐理由。验证应优先补齐现有业务页面的数据链路，不新增平行验证页；直接打开 JSON 或独立静态 HTML 不属于页面消费者验证。
- `src/crawl/lib/` 和 `src/crawl/run_collectors.py` 是 Python 采集可靠性基线：公共层统一 HTTPS/白名单（包含重定向链和最终 URL 复核）、超时和有限重试、响应大小与挑战页检查、Schema/最低条数/重复项校验、原子发布及 `success`/`preserved`/`skipped`/`failed` 状态。现有快照和新候选使用相同唯一键约束；汇总会报告新 URL 数、最大时间戳推进和 `freshCandidate`，因此仅退出码成功或保留旧快照不再代表新候选。一个来源可声明多个 allowlisted 官方 HTTPS fallback，仍对每个主机使用有限超时/重试，challenge 不作为普通网络波动跨主机重试。`requirements-crawl.txt` 固定 Python 依赖；`npm run test:crawlers` 运行离线回归测试，`npm run crawl` 运行核心采集器，`npm run crawl:full` 包含 LeetCode、Douban 和 TikTok 长任务。账号态配置只允许通过环境变量或 Actions Secrets 注入；来源失败时保留最后有效快照，required 数据新旧都无效才阻止发布。LeetCode 使用 staging、manifest 和整批替换，避免新旧分块混合；列表的中文标题缺失时安全回退至同一 GraphQL 响应的英文标题，2026-08-01 已真实成功发布 4,393 条完整候选。
- 福利聚合的 HXM5 来源使用其公开前端协议的 HTTPS POST JSON 接口，外部作者图不进入快照；DaydayzhuanTop 和 ZhuanyesTop 只发布能从详情页取得真实日期的置顶项，不用当前时间伪造发布时间。0818 业务目标、普通/置顶 collector 文件、registry、数据文件和 `/welfare` 消费合同均保留：官方内容仍只有 HTTP，因此项目不直接请求原站、不关闭 TLS，也不向消费者暴露 HTTP 详情；普通列表改由 `rsshub.rssforever.com` 的公开 RSSHub HTTPS 路由读取 TopHub 的 0818 公共索引，严格校验 channel 身份、TopHub 节点、RSSHub generator 和每条 `www.0818tuan.com/xbhd/<id>.html` 原始目标，仅发布唯一的 TopHub HTTPS 索引入口。数据时间表示 `lastBuildDate` 索引更新时间，不代表单条发布时间。`0818tuanTop` 在没有显式 HTTPS 置顶证据时明确 skipped，但不再删除历史数据合同；现有 2023 HTTP top 文件保留且不被消费者导入。公开 RSS 的 item 字段及 RSSHub TopHub route 都只有 title/link/description，没有 top/pinned/sticky 字段，因此不能把普通榜首推断成置顶；未来取得显式 HTTPS top 来源后才可原子覆盖历史文件并接入消费者。2026-08-01 真实采集发布 49 条普通列表，Schema/唯一性/provenance 合格，并完成 `/welfare` production preview 桌面和 mobile/touch 消费验收；TopHub 页面随后返回安全验证，因此浏览器验收只核验 DOM 跳转目标，没有绕过或打开该页面。
- Weibo collector 可通过公开 endpoint 的浏览器式请求上下文生成 `src/public/data/weibo.json`，但当前仓库没有导入该文件的 Vue 消费者；采集成功不能被报告为前端消费闭环。V2EX 业务合同保留：`src/crawl/v2ex.py` 继续轮询三个官方 allowlisted HTTPS API，`run_collectors.py` 保留 optional registry，`src/public/data/v2ex.json` 保留最后有效快照，`/tech-forum` 继续消费；2026-08-01 当前环境真实运行仍为 `preserved 7`、无新 URL 且时间戳未推进，因此页面明确显示“保留快照”、最近数据时间和“不代表当前热点”，不把 2023 数据无提示地冒充当前热点。Boss 旧 query 搜索页会触发登录/挑战且被 robots 明确禁止，因此不再使用，也不作登录、Cookie、CAPTCHA 或 stealth 绕过。`zhipin` collector 仅访问 Boss 官方 `https://www.zhipin.com/<city>/` 无查询参数城市首页，读取这些公开页面中已有的职位卡和页面 `upDate`，筛选前端/客户端相关职位；详情 URL 仅允许 `www.zhipin.com/job_detail/*.html`，不请求详情页或内部 API。2026-08-01 真实运行发布 3 条唯一 Boss HTTPS 职位；重复运行内容稳定且不会把无变化误报为新候选。
- `master` push、手动触发和每日北京时间 06:17（UTC 22:17）的 schedule 会运行 `.github/workflows/ci.yml`：使用 Node 22、Python 3.11 和 Node 24 兼容的 `actions/checkout@v5`、`actions/setup-node@v5`、`actions/setup-python@v6`。pip 缓存以根目录 `requirements-crawl.txt` 为依赖清单。依赖安装后先运行 collector 离线测试，再用 `npm run collect:rss:site` 生成真实 RSS JSON，然后继续原有 Python crawl、生产构建和 Pages 部署。RSS 来源独立容错：单个来源失败时记录警告并发布其余成功来源；全部来源失败或最终数据校验失败时停止本次发布。构建后必须确认 `public/data/recommendArticleData.json` 与 `dist/data/recommendArticleData.json` 都存在且逐字节一致，才继续部署。2026-08-01 的 GitHub-hosted Runner 已成功完成该流程。
- `agent/product/research/qinglongBackup/` 是仅供本地研究的嵌套仓库，外层 `.gitignore` 明确排除；其中的账户、交易、SFTP/SSH、青龙管理、代理、浏览器登录和原生工具不进入当前网站或 Actions，脱敏评估见 `agent/product/research/qinglong-backup-assessment.md`。
- `src/content/interview/full.md` 和 `chain.md` 生成 `public/findJob-summary/full.md` 和 `chain.md`。
- `auto-imports.d.ts` 和 `components.d.ts` 是自动生成的声明文件，已纳入 `tsconfig.json`；`npm run typecheck` 是独立的 Vue/TypeScript 类型检查入口。
- `.cspell.json` 是仓库级拼写检查配置：全局检查遵循 `.gitignore`，排除依赖、构建产物、大型数据快照、发布图片、锁文件和自动生成声明；项目专有词统一维护在 `words` 中，不把疑似拼写错误自动当作正确词修改。
- 根 `CLAUDE.md`、`agent/standards/project-instructions.md`、`.claude/skills/vscode-context-mcp/SKILL.md` 和 `.opencode/instructions.md` 中面向协作工具的说明统一使用中文；命令名、工具名、路径和协议名保留原文，以保证可执行性和检索准确性。
- `dist/` 是构建输出；`auto-imports.d.ts` 和 `components.d.ts` 是自动生成的声明文件。
- Vite 将 `write-excel-file` 保留在懒加载的 `xlsx-export` chunk 中，因为基金和加密货币页面只在导出电子表格时才会加载它。

## 部署和运维路径

- `.github/workflows/ci.yml` 安装依赖、运行爬虫工作、构建站点，并将 `dist/` 直接推送到 `gh-pages` 分支；未使用 `gh-pages` npm 包。
- Vite 构建未使用预渲染插件。
- Vite 开发服务器严格固定在 `8090` 端口、监听 `0.0.0.0` 并启用 CORS；`strictPort: true` 会在端口被占用时直接报错，不自动顺延到其他端口。开发服务器的 `/data` 代理到家庭服务器 `http://192.168.1.100:5000`，但生产 `vite preview` 显式禁用该代理并直接读取 `dist/data/`，避免生产构建验收误命中家庭服务器的历史数据。远程 HTTP 服务工作目录为 `/root/Test`，因此开发代理下的 `/data/fundHoldData.json` 对应远程文件 `/root/Test/data/fundHoldData.json`。基金持仓页面通过 `/data/fundHoldData.json` 相对路径读取，不能将远程绝对地址硬编码到组件中；详见 [`docs/development-environment.md`](../../docs/development-environment.md)。
- `uploadQL.js` 是一个单独的手动 SFTP 部署路径，需要 `archiver`、`ssh2` 和 `ssh2-sftp-client`。
- 除非明确要求爬虫或部署工作，否则不要运行 `build.sh` 或 `uploadQL.js`。

## 依赖决策

- 移除了 `gh-pages` 和 `vite-plugin-prerender`，因为仓库搜索确认它们未被使用；这移除了它们过时的部署/预渲染依赖树。
- 只要 `uploadQL.js` 还在使用，就保留 `archiver`；当前已升级到 `archiver@8`。
- 电子表格导出已从有安全通告且无官方修复的 `xlsx` 切换到浏览器端 `write-excel-file@4.1.1`，当前仅生成工作簿，不解析上传文件。
- 构建工具已从 Vite 4 升级到 Vite 6.4.3，`@vitejs/plugin-vue` 为 5.2.4；`vue-tsc` 已升级到 3.3.8，PostCSS 锁定到 8.5.18。
- `vite-plugin-compression` 和 `rollup-plugin-visualizer` 已声明但尚未配置；visualizer 当前升级到 5.14.0，预期用途仍未确认。

## 验证和安全基线

- 默认代码验证：`npm run build`。
- 仅类型验证：`npx vue-tsc --noEmit`。
- 浏览器相关变更：运行 `npm run serve` 并在浏览器中检查受影响的流程。
- 数据采集、生成链或消费者发生变化时，fixture、单元测试和构建只作为前置证据；先识别并补齐项目中已经依赖该类数据的真实业务页面，不新增平行验证页绕过既有功能缺口。环境与权限允许时必须运行真实采集/生成命令，通过项目实际前端框架和数据接口启动既有消费者，并在桌面及相关移动视口检查真实产物的页面展示、网络请求和控制台。直接打开 JSON、独立静态 HTML 或确认文件存在不能替代前后端消费闭环；任一环节无法完成时，端到端验证必须明确标记为未完成。复杂数据流、UI 或部署的浏览器验收应在被 Git 忽略的 `agent/verification/reports/` 保存本地报告和按需生成的截图、页面指标、关键网络状态及控制台摘要，不能只在对话中描述结论；报告至少记录基线、工具与启动条件、脱敏执行、Schema/完整性、页面/网络/控制台、失败与跳过及剩余风险责任。这些本地验收产物不纳入提交范围，简单文档或局部代码修改不机械生成报告。
- 完成声明遵循证据等级：源码/配置证明实现意图，fixture/测试/编译证明局部契约，退出码和 HTTP 状态只证明运行达到某一步，经过 Schema 和完整性校验的真实产物证明可发布候选，现有业务页面在生产预览中正确消费并通过网络/控制台检查才证明前后端闭环。`agent/verification/playbook.md` 是高影响任务的执行清单；`npm run context:check` 对采集器、生成链、消费者和 CI/部署变更只读检查本地报告必需章节、项目上下文和迭代日志；该检查不判断业务结果正确。
- 本地验证报告按“当前 + 归档”管理：`agent/verification/reports/current/` 只保存仍与当前代码相关的中文结论报告，关联原始证据位于 `current/assets/`；已结束批次移至 `archive/YYYY-MM-DD/`。`current/index.json` 显式声明唯一权威报告、支持/部分被取代关系、状态和产品/验证/外部未解决项；其中 `claims` 是当前关键结论的机器可检查合同，每项必须记录事实观察、推导结论，并直接链接至少一份存在的 collector/接口、产物、浏览器、网络、截图、来源或 CI 证据。`latest.md` 从该索引确定性生成，未解决项可跳到对应推导链，不再用文件修改时间、正文关键词或只有目录的“证据”推断业务状态。无效索引、缺少 inference、缺失/越界证据文件会阻止刷新，`context:check` 与总览使用同一权威报告，并要求高影响报告包含“关键结论证据导航”。
- 依赖审计必须使用 `npm audit --registry=https://registry.npmjs.org`，因为配置的 npm 镜像没有审计端点。
- 完整依赖审计和生产依赖审计均为 0 个 npm 漏洞；Vite 6.4.3 已将 esbuild 更新到 0.25.12，现有 Vue/Markdown 插件和 CI Node 20 构建已通过验证。
- Python 采集依赖中的 `requests` 已固定到 2.33.0，修复 `GHSA-gc5v-m9x4-r6x2` / `CVE-2026-25645`（`extract_zipped_paths()` 可预测临时路径复用）；当前采集代码未调用该工具函数，但低于 2.33.0 仍会触发 Dependabot。隔离环境以 `pip-audit` 检查 `requirements-crawl.txt` 为 0 个已知漏洞。
- `npm run build` 已在 Vite 6、vue-tsc 3 和新的浏览器导出适配器下通过；构建会保留独立的 `xlsx-export` 延迟加载 chunk。

## 已验证的工作偏好

- Agent 执行统一遵循 `agent/standards/agent-execution.md`：先建立任务结果、约束和验收条件，优先交付最小可靠基准；仅在架构、重复故障、根本瓶颈、目标冲突或高长期成本等条件下进入探索模式，并以可验证、可回滚的证据报告结果。
- 用户已确认任务目标、边界、验收条件和本轮允许的外部操作后，该授权在当前任务内持续有效；Agent 默认沿可恢复流水线自动推进范围内的本地可逆步骤，不重复请求逐步确认。只有用户可见行为/架构/兼容性变化、未授权提交推送部署或外部消息、破坏性覆盖、凭据/付费资源、安全边界变化，或事实推翻已确认方案时重新确认；宿主工具权限提示不能由项目规则绕过。
- 非简单任务以可见任务状态展示阶段、已完成项、阻断项和下一步，并保留阶段检查点。每一步优先批量处理同构输入：一次覆盖多个文件/来源/视口/用例，独立操作可并行、有依赖操作流水线化，结果可定位到具体输入且失败项可定向重试；破坏性操作不混入批次，外部调用遵守限流。
- 关键结论统一采用“事实观察 → 推导结论 → 直接证据链接”：先保存机器 summary、网络响应和浏览器指标，再生成报告；截图只证明可视状态，不替代接口字段或请求参数，JSON/退出码也不替代现有消费者。对外部阻断默认保留产品目标和数据合同，以 `preserved`/`skipped`/`blocked` 或 stale UI 透明表达；未经用户明确同意不通过删除 source、registry、历史文件或消费者关闭报告项。
- 优先选择小型、可审查的变更，而不是将依赖清理与破坏性迁移混在一起。
- 不要运行 `npm audit fix --force`；明确检查并限定主要升级的范围。
- 除非用户要求，否则不为当前变更执行提交或推送。
- 用户仅要求“提交到远程”但未指定目标分支时，先确认直接更新默认分支还是推送功能分支，不擅自创建远程分支；用户明确指定目标分支后按授权执行。
- 不使用 Git worktree 隔离；默认只在主 checkout 中连续迭代。历史 worktree 已清理，后续任务不要创建隔离副本或 worktree 分支。

## 未解决问题

- `vite-plugin-compression` 和 `rollup-plugin-visualizer` 是为了将来使用而有意保留的，还是应该作为未使用的工具移除？
- 手动 `uploadQL.js` SFTP 部署路径是否应长期保留？


通过将已解答的问题替换为相关部分的已确认事实或决策来解决；不要把已回答的问题留在这里。

## 维护规则

- 本文件只记录当前仍有用的项目事实、决策、验证基线和未解决问题；不记录普通过程日志、提交历史或局部函数细节。
- 当架构、路由、目录、依赖、命令、生成文件、部署、验证或数据流实际变化时，更新相关事实并移除过时条目。
- 小型局部 UI/内容编辑和纯只读说明通常无需更新本文件；有价值的复杂迭代证据再记录到 `agent/context/iteration-log.md`。
