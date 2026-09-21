# 项目业务演进与执行计划

> 文档版本：2026-08-09
> 文档责任：只维护站点级产品组合、当前方向和跨领域优先级。Investment 领域的具体需求、任务和状态由 [Investment Review PRD](prd/README.md) 唯一负责。

当前实现事实见 [业务功能说明](business-overview.md)，历史实施证据见 [迭代日志](../context/iteration-log.md)。规划不能覆盖源码和真实验证事实。

## 产品方向

项目从“扩展个人综合信息门户”收敛为“利用私人数据持续改善重要决策的个人软件”。功能是否值得投入，优先看：

1. 是否影响金钱、职业、健康或大量时间；
2. 是否积累随时间增值的个人事实；
3. 是否形成“记录 → 分析 → 改进 → 验证”的闭环；
4. 是否降低完整任务成本，而不只是取数或展示成本；
5. 是否能用真实使用与可信 Oracle 决定继续、降级或停止。

需求分析遵循 [业务任务分析执行规范](../standards/business-task-analysis.md)。功能名称只是候选手段；业务证据不足时保留 unknown，不为规划完整性虚构目的。

## 当前产品组合

| 方向 | 定位 | 当前优先级 | 启动/继续条件 |
| --- | --- | --- | --- |
| Investment Review | 第一主线：投资过程测量、归因、评价和学习 | **P0** | 先完成可信 Measurement，再按 P1–P4 演进 |
| 职业资产 | 第二主线候选：沉淀可复用的项目成果与证据 | P1 候选 | Investment 至少完成一轮真实复盘闭环，且出现明确工作/面试/谈薪需求 |
| 健康精力 | 第三主线候选：观察行为与工作状态关系 | P2 候选 | 记录习惯、隐私和非医疗解释边界明确 |
| 通用决策复盘引擎 | 长期抽象 | 暂不实施 | 至少一个领域证明稳定共性，避免提前做通用表单 |
| 导航、资讯、博客、学习 | 入口和内容资产 | 维护/支撑 | 有明确访问、检索或复用问题时才扩展 |
| 通用聊天壳/复杂多 Agent | 非目标 | 不做 | 只有服务已验证闭环且可审查时才重新评估 |

职业与健康不与 Investment 主线同时建设完整模块。

## 当前主线：Investment Review

业务目标是改善未来可重复的、风险调整后的决策过程，不承诺持续盈利，不鼓励未经证据支持的金融杠杆。

```text
目标与约束
→ 事前判断
→ 执行
→ Performance Measurement
→ Risk / Attribution
→ Decision Appraisal
→ Behavioral Review
→ Strategy Hypothesis
→ 下一版本规则
```

当前源码已经有数据采集、Normalized Facts、Coverage、本地 Ledger、部分 Exposure/Policy/Behavior/Action/Evidence 基础，但对完整基金复盘任务的 Task–Technology Fit 仍低。准确状态见 [Current State](prd/current-state.md)。

当前执行顺序由 canonical PRD 管理：

1. [P0 Measurement](prd/requirements/p0-measurement.md)；
2. [P1 Decision Journal](prd/requirements/p1-decision-journal.md)；
3. [P2 Attribution + Behavior](prd/requirements/p2-attribution-and-behavior.md)；
4. [P3 Strategy Hypothesis](prd/requirements/p3-strategy-hypothesis.md)；
5. [P4 AI Review](prd/requirements/p4-ai-review.md)。

过去的 `INV-DATA-001`、`INV-PLAN-001`、`INV-REVIEW-001`、`INV-RULE-001` 和 `INV-RISK-001` 不再作为活动任务板：其有效意图已分别进入 P0–P3、Shared DoD 与 Agent A/B 任务。历史判断从 git/迭代日志或 PRD archive 追溯，不在这里维护第二份任务正文。

## 站点级决策规则

### 进入开发

候选能力应回答：

- 用户最终需要作出什么判断或行动；
- 所需私人/外部数据是什么，来源与删除边界是否清楚；
- 系统要承担哪些获取、清洗、计算、比较、追踪工作；
- 本轮降低的是局部操作成本还是完整 sensemaking 成本；
- 使用三到五次后，用什么证据决定保留、优化、合并、降级或删除。

### 状态优先级

```text
真实运行与可信验证
→ 当前源码
→ current-state / business-overview
→ canonical PRD
→ 本文站点级规划
→ 历史资料
```

无法核验的能力不标“已完成”。任务执行状态与产品假设状态分开：实现完成不等于用户价值已验证。

### 明确非目标

- 自动买入、卖出、申购、赎回、调仓、转账或跟单；
- 托管资产或保存第三方交易凭据；
- 用盈利等同好决策，或用 AI 猜测归因/市场；
- 没有行动反馈的纯仪表盘、摘要和 AI 建议；
- 账号、收费、云同步或远程埋点，除非单独完成必要性和隐私评估；
- 健康诊断、治疗建议和未经验证的高敏感推断；
- 没有使用证据支撑的平台化、服务化和大规模路由重构。

## 维护方式

- 站点产品组合或优先级改变时更新本文；
- 当前功能改变时更新 [business-overview.md](business-overview.md)；
- Investment 领域对象、需求或任务改变时只更新 [prd/](prd/README.md) 的 canonical owner；
- 真实结果改变实施判断时记录到迭代日志；
- 不在本文新增领域级长任务卡、fixture、A/B 分工或第二份 roadmap。
