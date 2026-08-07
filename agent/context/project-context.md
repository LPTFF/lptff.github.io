# 项目上下文

这里记录仍然能帮助维护者理解项目、做取舍和避免重复试错的事实。当前源码和真实运行结果优先于旧记录；无法确认的内容保留为未知。

## 技术与结构

- 技术栈：Vue 3、Vue Router 4、Vite 6.4.3、JavaScript、TypeScript；npm 管理依赖。
- 入口：`index.html` → `src/main.js` → `src/App.vue` → `src/router/index.js`。
- 页面位于 `src/views/`，用户内容位于 `src/content/`，运行时资源位于 `public/`，大型数据快照位于 `src/public/data/`。
- Element Plus 是默认 UI 基础；新增或重构页面优先复用现有组件和页面模式。
- `public/findJob-summary/`、`dist/`、`auto-imports.d.ts` 和 `components.d.ts` 由源文件或构建过程生成。

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

## 投资助手采集任务验收

- 用户已在本地浏览器验证扩展采集流程可用。
- 静态证据：扩展脚本 `node --check` 通过，`npm run typecheck` 通过，`git diff --check` 通过，`node scripts/extension/build-zip.js` 可生成 zip。
- 限制：当前记录不替代每次真实登录会话下的 Network 逐请求核验；导出内容仍受账户授权、站点接口、时间范围和分页实际加载结果限制。

## 已知决策与风险

- Excel 导出使用 `write-excel-file`，通过 `src/utils/exportExcel.ts` 保持页面调用一致并延迟加载。
- Vite 构建链已升级到 6.4.3；`@vitejs/plugin-vue@5.2.4`、`unplugin-vue-markdown@0.26.3` 和当前类型检查已验证兼容。
- `vite-plugin-compression`、`rollup-plugin-visualizer` 和手动 `uploadQL.js` 路径是否长期保留，仍是待决定事项。
- 研究目录中的第三方项目只提供待验证思路；采用前要确认许可证、隐私、安全、成本和退出方式。

## 如何维护

只有当一个事实、决策、风险或实验结果会帮助未来的人更快理解项目或避免重复错误时，才更新本文。局部实现细节、一次性过程和自动化工具输出留在代码、提交或临时记录中，不在这里堆积。
