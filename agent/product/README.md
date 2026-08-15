# 产品工作台

这里首先帮助人理解产品，而不是展示 Agent 的文件组织。当前产品需求、分工和验收应在一次主文档阅读中完成；工程细节按需下钻，不作为理解产品的前置条件。

## 当前主线

| 项目 | 当前判断 |
| --- | --- |
| 产品 | **Investment Review**：用私人数据改善基金纪律、复盘和未来决策过程 |
| 当前交付 | **P0 纪律与执行复盘**：按用户自己的计划与规则检查操作异常、仓位边界、移动止损、减仓进度和真实恢复 |
| 实现状态 | 产品逻辑已定义，运行时未交付；当前 `/investment` 只有可复用的数据、Ledger、Coverage 和局部 Policy/Behavior/Action 基础 |
| 人的审查入口 | [Investment Review：人的基金复盘产品审查](investment-review.md) |
| 本次分工 | 在同一审查正文的 `WP0-1` 至 `WP0-4` 中按用户结果查看分工；Agent A 是承担绝大多数交付的主力 Agent，Agent B 只在维护者授权后填补私人真实环境证据缺口 |
| 协作方式 | [主力 Agent—授权验证 Agent—人类裁决者协作标准](../standards/main-agent-authorized-validation.md)，不建立 A/B 平行任务板 |
| 工程深审 | [Investment Review 工程附录](reference/investment-review-engineering.md)，可选阅读 |

若要回答“这次为什么做、做什么、谁做、怎样验收、是否对人友好”，只读[人的产品审查正文](investment-review.md)，不要从工程附录、source 或 archive 开始。

**待审查新诉求（2026-08-15）**：[基金复盘助手：核心产品定义](source/fund-review-assistant-product-definition.md) 已作为上游输入入库，尚未与当前 Investment Review 主线合并审查。它强调“账户状态 + 投资纪律 + 异常检测”、四层模型与 LLM escalation；是否调整当前 P0 主线，按[业务任务分析规范](../standards/business-task-analysis.md)核对后再决定。

## 站点产品组合

| 方向 | 定位 | 当前优先级 | 启动或继续条件 |
| --- | --- | --- | --- |
| Investment Review | 第一主线：先完成个人投资纪律与执行闭环，再逐步测量、归因、评价和学习 | **P0** | 先交付操作/仓位/止损/减仓复盘；绩效链按具体证据条件在 P1–P4 启动 |
| 职业资产 | 第二主线候选：沉淀可复用的项目成果与证据 | P1 候选 | Investment 至少完成一轮真实复盘闭环，且出现明确工作、面试或谈薪需求 |
| 健康精力 | 第三主线候选：观察行为与工作状态关系 | P2 候选 | 记录习惯、隐私和非医疗解释边界明确 |
| 通用决策复盘引擎 | 长期抽象 | 暂不实施 | 至少一个领域证明稳定共性，避免提前做通用表单 |
| 导航、资讯、博客、学习 | 入口和内容资产 | 维护/支撑 | 有明确访问、检索或复用问题时才扩展 |
| 通用聊天壳、复杂多 Agent | 非目标 | 不做 | 只有服务已验证闭环且可审查时才重新评估 |

职业与健康不与 Investment 主线同时建设完整模块。站点现有路由和功能事实需要深查时，看[站点能力清单](reference/site-capability-inventory.md)。

## 产品判断规则

候选能力进入开发前，应能回答：

1. 用户最终需要作出什么判断或行动；
2. 所需私人或外部数据是什么，来源与删除边界是否清楚；
3. 系统承担哪些获取、清洗、计算、比较和追踪工作；
4. 本轮降低的是局部操作成本还是完整 sensemaking 成本；
5. 用户是否能理解结果意味着什么、不能证明什么、下一步是什么；
6. 使用三到五次后，用什么证据决定保留、优化、合并、降级或删除。

需求分析遵循[业务任务分析执行规范](../standards/business-task-analysis.md)，页面和交互遵循[产品设计标准](../standards/product-design.md)。功能名称只是候选手段；证据不足时保留 unknown，不为文档完整性虚构目的。

## 冲突时相信什么

```text
真实运行与匹配的可信验证
→ 当前源码
→ 活动产品正文中的 Current State
→ 目标产品与工程契约
→ source / archive 历史资料
```

下层事实可以否证上层规划。PRD、Mock、构建成功、HTTP 200 或页面出现都不能单独把能力升级为已实现。

## 资料边界

- [investment-review.md](investment-review.md)：当前需求、当前事实、分工、状态和人的验收的唯一 owner。
- [reference/investment-review-engineering.md](reference/investment-review-engineering.md)：领域对象、公式、不变量、fixture、隐私协议和历史任务映射；不维护另一份产品状态。
- [reference/site-capability-inventory.md](reference/site-capability-inventory.md)：基于源码的站点级能力清单，不描述未来规划。
- [source/](source/)：用户输入和历史来源，只用于追溯。
- [archive/](archive/)：已被替代的 PRD 和文档体系，不参与当前任务解析。
- [research/](research/)：外部研究和比较，不自动成为产品规则。

不要新增并行 roadmap、Agent 独立任务板、第二份 current-state 或 traceability。只有新资料能减少人的搜索、识别、比较或整合成本时才创建文件。
