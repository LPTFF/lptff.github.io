# GitHub Trending 商业价值筛选与 Investment Review 融合评估

评估日期：2026-08-30  
榜单范围：<https://github.com/trending?since=weekly>  
目标项目：`lptff.github.io` / Investment Review

## 结论

本周候选中，最值得融合的是 [Apache Maka](https://github.com/apache/maka) 的“规范化、追加式运行事件日志”原则。它没有作为新的 GitHub Trending 页面或通用 Agent 控制台进入产品，而是落在现有 Investment Ledger 与“明细”页：关键本地操作形成 SHA-256 哈希链，用户可以确认导入、规则、计划和清除动作的链内顺序与内容是否一致。

这项选择符合当前产品“记录 → 分析 → 改进 → 验证”闭环，也遵守 GitHub Trending 已退出一级产品、个人数据本地优先、UI 不重算 Core 的既有边界。

## 商业价值排序

每项 20 分，总分 100；“契合度”按当前 Investment Review 和站点产品方向评估，不按通用 AI 项目估算。

| 排名 | 候选需求 / 项目 | 可变现 | 痛点 | 易落地 | 契合度 | 可复制 | 总分 | 当前判断 |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | [apache/maka](https://github.com/apache/maka)：本地审计、恢复、运行可追溯 | 19 | 19 | 16 | 20 | 19 | **93** | 直接增强 Investment Ledger 的证据可信度；Apache-2.0；可抽取为纯本地边界 |
| 2 | [tt-a1i/archify](https://github.com/tt-a1i/archify)：可验证架构与流程图 | 15 | 13 | 18 | 10 | 17 | **73** | 对维护资料有用，但不直接改善投资复盘主任务 |
| 3 | [tinyhumansai/openhuman](https://github.com/tinyhumansai/openhuman)：本地记忆与工作流 | 18 | 17 | 8 | 10 | 16 | **69** | 个人记忆方向相关，但当前项目明确不提前建设复杂多 Agent；GPL-3.0 和 Rust/Tauri 体量重 |
| 4 | [MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search)：求职自动化 | 18 | 18 | 16 | 7 | 9 | **68** | 对职业资产候选方向有价值，但当前主线仍是 Investment Review，且招聘平台规则/隐私边界较重 |
| 5 | [tashfeenahmed/freellmapi](https://github.com/tashfeenahmed/freellmapi)：多模型路由与故障切换 | 17 | 17 | 12 | 9 | 8 | **63** | 当前产品不需要常驻模型网关；README 明示个人实验，上游服务条款风险不能由 MIT 代码许可消除 |
| 6 | [freestylefly/awesome-gpt-image-2](https://github.com/freestylefly/awesome-gpt-image-2)：图像提示词模板 | 14 | 12 | 18 | 5 | 12 | **61** | 易复用但与私人投资决策闭环弱，护城河有限 |
| 7 | [K-Dense-AI/scientific-agent-skills](https://github.com/K-Dense-AI/scientific-agent-skills)：科研 Agent 能力包 | 16 | 15 | 12 | 4 | 13 | **60** | 专业价值高，但与当前消费者、数据和行动链不匹配 |
| 8 | [AprilNEA/OpenLogi](https://github.com/AprilNEA/OpenLogi)：本地外设控制 | 14 | 15 | 9 | 1 | 11 | **50** | 硬件兼容维护重，与当前项目没有可信产品链路 |

## 拉取与代码审查

| 仓库 | 固定提交 | 审查范围 | 结论 |
| --- | --- | --- | --- |
| `apache/maka` | `d2346707d65144682d45e905a378ee57be469769` | README、ARCHITECTURE、canonical runtime event、runtime event persistence、storage 依赖 | 采用“规范事实流 + 投影”原则；不整包引入其 monorepo、SQLite 和运行时 |
| `tinyhumansai/openhuman` | `20a7c0e1a05c5533d5334da134564e54e796b482` | README、混合记忆检索、memory provider、工作流/编排 | 能力强，但 GPL-3.0、Rust/Tauri 和本地推理体系不适合本轮最小融合 |
| `tashfeenahmed/freellmapi` | `b235b7e879de2e59f854f8cb14c28173f2886b67` | README、动态路由、限流、健康检查、fallback 测试、供应商适配 | 路由实现成熟；当前项目需求不匹配，免费上游商业风险高 |

## 融合设计

### WHY

Investment Review 已能保存来源原档、标准化账本和派生判断，但用户还不能快速回答：

- 哪一次关键操作实际写入了本地账本；
- 规则或计划是否形成过新版本；
- 账本清除和重新导入的先后关系；
- 操作摘要记录是否在本地被修改。

### HOW

- IndexedDB 升级到 v4，新增 `auditEvents` store。
- 事件只保存动作摘要、计数、类型和业务主键，不保存账户、持仓、交易或原始采集正文。
- 写入前规范化 JSON，详情只保留逐事件允许字段；每条 SHA-256 绑定上一条哈希。
- 关键业务记录与审计事件同事务提交；页面内共享队列并在可用时使用 Web Locks，避免多实例和多标签页争抢同一序号。
- 模拟器重放不进入真实操作链；自动维护、数据导入和用户主动操作保留不同来源。
- 导入、事实清除、完全清空、纪律版本、事前计划、执行关联和减仓计划形成事件。
- “明细”页显示链内一致性、最近 8 条关键操作、链上短锚点和明确的证明边界。

Task-Technology Fit：**HIGH**。它直接降低投资事实和规则变更的追溯成本；用户不再需要从多个页面、IndexedDB store 和导入状态拼接操作历史。

## 变更文件

- `src/investment/audit/trail.ts`
- `src/investment/ledger/db.ts`
- `src/investment/ledger/repository.ts`
- `src/investment/composables/use-investment-os.ts`
- `src/views/investment/EvidenceView.vue`
- `agent/product/investment-review.md`
- 本评估文档

## 验证状态

- `npm run typecheck`：通过。
- `npm run build`：通过，Vite 生产构建完成；既有 VueUse 注释和 chunk size warning 保留，不由本变更新增。
- 类型检查与构建只用于静态排错，不作为验收结论。
- Chrome 真实操作、刷新恢复、IndexedDB v3 → v4 迁移和页面消费必须按真实环境手册执行；在实际操作完成前保持未验收。

## 风险与后续

1. 哈希链能发现链内局部修改、插入或删除，但不能独立证明整链未被重写或尾部未被截断；高保证场景需要把头部哈希周期性写入外部可信锚点。
2. 单次关键业务记录与审计事件已经同事务提交；但完整数据导入仍是多个事实 store 的分阶段同步，最终导入记录只能总结本批次成功、部分成功或失败，不能把整个批次提升为一个跨 store 的全有或全无事务。
3. 完全清空尊重本地数据删除权：旧操作链会删除，并以新的 `ledger.reset` 作为新链起点。
4. 审计记录不上传；如未来增加同步、导出或远程埋点，必须重新评估隐私、删除和访问控制边界。
