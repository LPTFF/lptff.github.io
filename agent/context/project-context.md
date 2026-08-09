# 项目上下文

这里记录仍然能帮助维护者理解项目、做取舍和避免重复试错的事实。当前源码和真实运行结果优先于旧记录；无法确认的内容保留为未知。

## 技术与结构

- 技术栈：Vue 3、Vue Router 4、Vite 6.4.3、JavaScript、TypeScript；npm 管理依赖。
- 入口：`index.html` → `src/main.js` → `src/App.vue` → `src/router/index.js`。
- 页面位于 `src/views/`，页面内容与唯一消费者放在一起：博客文章位于 `src/views/Blog/articles/`，面试资料位于 `src/views/home/findJob/`，投资协议位于 `src/views/investment/`；应用数据位于 `src/data/`，应用资源位于 `src/assets/`；项目支持区位于 `project-support/`。
- Element Plus 是默认 UI 基础；新增或重构页面优先复用现有组件和页面模式。
- `project-support/public/findJob-summary/`、`dist/`、`auto-imports.d.ts` 和 `components.d.ts` 由源文件或构建过程生成。

## 产品与业务

- 产品方向是利用私人数据持续改善重要决策的个人高收益软件。交易复盘是第一主线，职业资产和健康精力是后续候选。
- 产品闭环：记录 → 分析 → 改进 → 验证。
- 决策模型：目标 → 信息 → 判断 → 行动 → 预期 → 结果 → 错误归因 → 修改规则。
- 通用聊天壳、普通待办/日报/摘要、无反馈 AI 建议、纯仪表盘和复杂多 Agent 系统不是当前核心方向。
- 个人数据默认本地优先；云端同步、远程埋点和第三方复用需要单独评估隐私与责任边界。
- 业务能力和未来规划分别见 `agent/product/business-overview.md`、`agent/product/business-planning.md`，不能把规划假设当成已实现能力。

## 数据与发布

- `npm run serve` 在 8090 启动开发服务器；开发环境的 `/data` 可代理到家庭服务器，生产预览不使用该代理。
- 采集器和生成链的成功不能只由退出码、HTTP 200 或 JSON 可解析证明；需要确认真实产物和现有页面消费者。
- 来源暂时不可采时，优先保留产品目标与历史合同，明确 `preserved`、`skipped` 或 `blocked`，不伪造新鲜数据或绕过授权边界。
- 账号态、凭据和个人宿主配置不属于项目资料，不写入仓库。
- 天天基金采集插件已采用接口优先的本地导出边界：持仓、单基金详情和交易记录来自真实页面成功发出的业务接口响应；接口快照递归脱敏后才进入 `fund-data.json`，页面 DOM 仅用于触发筛选和分页，不作为业务字段来源。
- 插件自动采集使用最多 4 路单基金详情并发、当前/历史交易独立页面并发；未实际加载的历史范围或分页不视为已采集。名称以 `/request/hold` 的 `fundName` 为准，避免 single 页面名称回退覆盖持仓接口字段。
- 维护资料与运行时文件按实际消费者隔离：`agent/` 只供维护者阅读，禁止 `src/`、Vite、npm scripts 或 CI 依赖它；边界与不可移动清单见 `agent/context/project-file-boundaries.md`。
- `project-support/extension/lptff-investment-assistant/` 是项目功能；`project-support/scripts/` 和 `project-support/crawl/` 是构建、采集和发布链路。`src/views/investment/investment-assistant.md` 被投资导入页以 `?raw` 编译，也是运行时输入；不要按文件扩展名把它移动进 `agent/`。

## Investment OS 与采集任务验收

- Investment Protocol v2.0、本地 Investment Ledger 和扩展一次性 staging 已落地。传输生命周期是 `staging → Ledger import → ACK`：Ledger 写入成功后，即使 ACK 失败也不能回滚已导入事实；刷新页面后应从 Ledger、采集进度和 transfer receipt 恢复状态。
- 账户事实保持语义分离：当前持仓浮盈只在逐只持仓盈亏均已知时汇总，不能拿历史累计盈亏代替；cash 只在总资产与持仓市值来自同批快照且差值通过容差检查时派生，未知不能按 0 处理。
- AssetMetadata 按字段记录 `source`、`classified` 或 `unknown` provenance，低质量空值不得覆盖已有高质量标签。风险暴露将已识别与未识别市值分别计量；“未知”不是资产类型或风险结论，不能展示成“未标注 100%”。
- Investment OS 支持重新采集、读取待导入数据、清除投资事实和完全清空 Ledger。清除投资事实保留用户定义的 Policies/PolicyVersions；只有完全清空才删除规则。
- 仓库中的 `project-support/extension/lptff-investment-assistant/` 是扩展唯一维护源。真实诊断曾发现 Chrome 加载的是仓库外的解压副本；重载前必须在扩展管理页核对实际加载目录，并以文件清单或哈希确认它与仓库源码一致。
- 当前真实交易分页仍未完成，Coverage 必须保持 `partial`：timeType 3/4 的成功模板都只确认第 1 页，`pageSize=20`，对应期望页数为 84 和 60；最新脱敏失败分类是 `page_response_missing` 与 `paging_incomplete`。这证明 warning 不是单纯 UI 残留，也不证明后续页请求的根因已经定位。
- 用户已在真实登录环境验证持仓、单基金详情、staging、Ledger 导入和页面消费链路；脚本语法检查、`npm run typecheck`、构建、`git diff --check` 和扩展 zip 构建也已通过。静态证据不替代每次真实登录会话下的 Network、IndexedDB 和页面操作验收，具体边界见 [`verification/playbook.md`](../verification/playbook.md)。

## 已知决策与风险

- Excel 导出使用 `write-excel-file`，通过 `src/utils/exportExcel.ts` 保持页面调用一致并延迟加载。
- Vite 构建链已升级到 6.4.3；`@vitejs/plugin-vue@5.2.4`、`unplugin-vue-markdown@0.26.3` 和当前类型检查已验证兼容。
- `vite-plugin-compression`、`rollup-plugin-visualizer` 和手动 `project-support/deploy/uploadQL.js` 路径是否长期保留，仍是待决定事项。
- 研究目录中的第三方项目只提供待验证思路；采用前要确认许可证、隐私、安全、成本和退出方式。

## 如何维护

只有当一个事实、决策、风险或实验结果会帮助未来的人更快理解项目或避免重复错误时，才更新本文。局部实现细节、一次性过程和自动化工具输出留在代码、提交或临时记录中，不在这里堆积。
