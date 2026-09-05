# 项目上下文

这里记录仍然能帮助维护者理解项目、做取舍和避免重复试错的事实。当前源码和真实运行结果优先于旧记录；无法确认的内容保留为未知。

## 技术与结构

- 技术栈：Vue 3、Vue Router 4、Vite 6.4.3、JavaScript、TypeScript；npm 管理依赖。
- 入口：`index.html` → `src/main.js` → `src/App.vue` → `src/router/index.js`。
- 页面位于 `src/views/`，页面内容与唯一消费者放在一起：博客文章、职业方向和面试归档位于 `src/views/Blog/articles/`，投资协议位于 `src/views/investment/`；应用数据位于 `src/data/`，应用资源位于 `src/assets/`；项目支持区位于 `project-support/`。
- Element Plus 是默认 UI 基础；新增或重构页面优先复用现有组件和页面模式。
- 面试 Markdown 与投资脱敏快照由 Vite 直接从各自唯一源文件生成构建资源，不维护 `public` 副本；`dist/`、`auto-imports.d.ts` 和 `components.d.ts` 由构建或开发工具生成。

## 产品与业务

- 产品方向是利用私人数据持续改善重要决策的个人高收益软件。交易复盘是第一主线，职业资产和健康精力是后续候选。
- Contract Review 只保留为冻结的验证原型：不提供默认交易参数、安全或执行许可结论；Investment Review 完成 3–5 个真实复盘周期并证明减少遗漏、重复错误或复盘时间前，不启动其他完整产品建设。
- 职业方向以真实招聘市场为输入、浏览器插件为现场入口、AI 为信息和知识加工层；LeetCode、技术论坛、GitHub Trending、静态 BOSS 列表和独立面试页面已退出一级产品。高级搜索与资讯文章仍为归档内容，历史页面重定向到博客且不得恢复交互入口；与“薅羊毛”现有消费者直接相关的公开关键词检索已改为无界面定时采集、Gemini 筛选和统一发布后处理，其余归档采集器只允许手动按需运行。
- 旧加密货币策略展示页已退出一级产品，`/cryptocurrency` 重定向到产品复盘文章；剩余旧基金持仓页 `/fundHoldInfoMsg` 已直接删除，不并入 Investment Review。
- 福利后台同时运行两条通道：固定公开页面/API 直接采集，以及复用历史高级搜索思路的 Google `site:` 定向发现（GitHub、Telegram、Bilibili）。两路候选均经规则、Gemini 或对应的确定性护栏后发布；福利页显示两条链路、当前来源及准入数，但不恢复通用高级搜索表单或独立路由。
- 产品闭环：记录 → 分析 → 改进 → 验证。
- 决策模型：目标 → 信息 → 判断 → 行动 → 预期 → 结果 → 错误归因 → 修改规则。
- 通用聊天壳、普通待办/日报/摘要、无反馈 AI 建议、纯仪表盘和复杂多 Agent 系统不是当前核心方向。
- 个人数据默认本地优先；云端同步、远程埋点和第三方复用需要单独评估隐私与责任边界。
- 当前产品方向、优先级和资料入口见 [产品工作台](../product/README.md)；Investment Review 的当前事实、目标和本次分工统一见[人的产品审查正文](../product/investment-review.md)，不能把目标规划当成已实现能力。

## 数据与发布

- Live2D 模型是锁文件管理的开发依赖，Vite 在开发时直接提供并在构建时写入产物；`npm run serve` 和 `npm run build` 不执行额外脚本或资源下载。CI 保持既有安装、采集、构建、404 和部署流程。
- 采集器和生成链的成功不能只由退出码、HTTP 200 或 JSON 可解析证明；需要确认真实产物和现有页面消费者。
- 来源暂时不可采时，优先保留产品目标与历史合同，明确 `preserved`、`skipped` 或 `blocked`，不伪造新鲜数据或绕过授权边界。
- 账号态、凭据和个人宿主配置不属于项目资料，不写入仓库。
- 天天基金采集插件已采用接口优先的本地导出边界：持仓、单基金详情和交易记录来自真实页面成功发出的业务接口响应；接口快照递归脱敏后才进入 `fund-data.json`，页面 DOM 仅用于触发筛选和分页，不作为业务字段来源。
- 插件自动采集使用最多 4 路单基金详情并发、当前/历史交易独立页面并发；未实际加载的历史范围或分页不视为已采集。名称以 `/request/hold` 的 `fundName` 为准，避免 single 页面名称回退覆盖持仓接口字段。
- 维护资料与运行时文件按实际消费者隔离：`agent/` 只供维护者阅读，禁止 `src/`、Vite、npm scripts 或 CI 依赖它；边界与不可移动清单见 `agent/context/project-file-boundaries.md`。
- `project-support/extension/lptff-investment-assistant/` 是项目功能；`project-support/scripts/` 和 `project-support/crawl/` 是构建、采集和发布链路。

## Investment OS 与采集任务验收

- Investment Protocol v2.0、本地 Investment Ledger 和扩展一次性 staging 已落地。传输生命周期是 `staging → Ledger import → ACK`：Ledger 写入成功后，即使 ACK 失败也不能回滚已导入事实；刷新页面后应从 Ledger、采集进度和 transfer receipt 恢复状态。
- 账户事实保持语义分离：当前持仓浮盈只在逐只持仓盈亏均已知时汇总，不能拿历史累计盈亏代替；cash 只在总资产与持仓市值来自同批快照且差值通过容差检查时派生，未知不能按 0 处理。
- AssetMetadata 按字段记录 `source`、`classified` 或 `unknown` provenance，低质量空值不得覆盖已有高质量标签。风险暴露将已识别与未识别市值分别计量；“未知”不是资产类型或风险结论，不能展示成“未标注 100%”。
- Investment OS 支持重新采集、读取待导入数据、清除投资事实和完全清空 Ledger。清除投资事实保留用户定义的 Policies/PolicyVersions；只有完全清空才删除规则。
- Ledger 存储按“重复采集不增长、真实新增事实才增长”压缩：账户只留最新一条，组合每天最多一条，导入摘要最多 20 条，同一范围同日复盘只留当前 revision；交易按来源稳定键、DailyPnL 按基金+日期去重。旧版按采集次数累积的账户/同日组合/导入摘要会在进入页面时幂等压缩；同步只查询稳定键是否存在，不再为了去重把全部历史对象读入内存。
- 仓库中的 `project-support/extension/lptff-investment-assistant/` 是扩展唯一维护源。真实诊断曾发现 Chrome 加载的是仓库外的解压副本；重载前必须在扩展管理页核对实际加载目录，并以文件清单或哈希确认它与仓库源码一致。
- 2026-08-20 用户提供的新真实采集包已证明近一年交易分页完成：timeType 3、`pageSize=20`、72/72 页、1427/1427 笔、0 条来源/范围 warning；经法律关键脱敏后更新为仓库内真实来源快照，Adapter 判定 `complete`。此前只确认第 1 页的失败记录保留为历史诊断，不再代表当前 Coverage；该快照只用于开发输入，不能替代真实环境验收。
- 未分类交易行动只针对“来源业务类型未映射”且已确认的事实；待确认/失败/撤单以及买卖、分红、费用、账户转账等已知语义不生成该行动。自动派生行动进入页面时与当前事实对账，撤销已不成立的 open 项且不重新打开用户已处理项；证据页必须展示日期、基金、金额和流水锚点。
- 本轮修复包括：来源页面内存中临时复用分页所需请求头、校验页集合/记录总数/跨页重复、允许新 `complete` Coverage 修复旧 `partial`，并停止自动导入旧的 1/73 页内置快照。若未来来源接口变化，仍必须按实际页集合和记录数降级，不能用 HTTP 200 或无 warning 单独宣称完整。
- 用户已在真实登录环境验证持仓、单基金详情、staging、Ledger 导入和页面消费链路；脚本语法检查、`npm run typecheck`、构建、`git diff --check` 和扩展 zip 构建也已通过。静态证据不替代每次真实登录会话下的 Network、IndexedDB 和页面操作验收，具体边界见 [`verification/playbook.md`](../verification/playbook.md)。

## 已知决策与风险

- Excel 导出使用 `write-excel-file`，通过 `src/utils/exportExcel.ts` 保持页面调用一致并延迟加载。
- Vite 构建链已升级到 6.4.3；`@vitejs/plugin-vue@5.2.4`、`unplugin-vue-markdown@0.26.3` 和当前类型检查已验证兼容。
- `vite-plugin-compression`、`rollup-plugin-visualizer` 和手动 `project-support/deploy/uploadQL.js` 路径是否长期保留，仍是待决定事项。
- 研究目录中的第三方项目只提供待验证思路；采用前要确认许可证、隐私、安全、成本和退出方式。

## 如何维护

只有当一个事实、决策、风险或实验结果会帮助未来的人更快理解项目或避免重复错误时，才更新本文。局部实现细节、一次性过程和自动化工具输出留在代码、提交或临时记录中，不在这里堆积。
