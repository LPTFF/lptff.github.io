# 基金复盘产品定义

**状态**：Canonical 产品定义，不代表运行时已实现。
**领域依据**：[投资绩效与决策复盘理论框架](../../../theories/investment-performance-and-decision-review.md)。

## 产品不是什​​么

- 不是基金收益展示工具；
- 不是 AI 买卖建议工具；
- 不是市场预测或自动交易系统；
- 不是证明过去决定“总是正确”的叙事工具。

## 核心目标

> 通过记录事前决策、实际执行、最终结果和风险暴露，对投资过程进行可重复的绩效评价，从而逐步提高用户未来的决策质量。

目标是改善过程一致性、错误可见性和风险调整后的长期结果；不承诺持续盈利，也不鼓励未经验证的金融杠杆。

## 产品主干

```text
目标与约束
→ 事前判断
→ 投资执行
→ Performance Measurement
→ Risk Measurement
→ Performance Attribution
→ Decision Appraisal
→ Behavioral Review
→ Strategy Hypothesis Update
→ 下一版本 Policy / Rule
```

## 三层绩效评价

1. **Measurement**：客观发生了什么？
2. **Attribution**：当前数据能可靠说明为什么吗？
3. **Appraisal**：这些证据对投资过程质量说明什么？

顺序不可反转。没有可靠 Measurement，不做归因；没有可支持的归因和过程事实，不生成确定性 appraisal。

## 最高原则：Process 与 Outcome 分离

- `OutcomeQuality`：最终获得什么收益、亏损和风险结果；
- `DecisionQuality`：在当时可用信息和事前规则下，过程是否合理、一致、可解释。

收益指标不得直接参与 process compliance 的计算。系统保留四象限，而不是把两者压成分数：

| 过程 | 结果 | 产品表示 |
| --- | --- | --- |
| 合规/合理 | 正 | 好过程 + 正结果 |
| 合规/合理 | 负 | 好过程 + 不利结果 |
| 违规/证据不足 | 正 | 过程问题 + 幸运或未解释结果 |
| 违规/证据不足 | 负 | 过程问题 + 负结果 |

“幸运”只能在能支持该解释时使用；否则只陈述 process breach + positive outcome。

## 产品最终回答的八个问题

1. 我的目标、风险和约束是什么？
2. 本期实际获得了什么结果？
3. 事前指定的 Benchmark 在相同期间怎样？
4. 为结果承担了多少风险？
5. 数据能否说明收益来自市场、配置、选择、时机、成本或汇率？
6. 决策与执行是否符合当时的 Policy 和 StrategyRule？
7. 行为中是否出现持续、可验证的偏差信号？
8. 证据是否足以更新 StrategyHypothesis 或下一版本规则？

只有第 8 个问题完成，Review 才形成闭环。

## 目标任务链

```text
业务目的：提高未来决策质量
→ 用户任务：事前记录、执行对照、绩效评价、规则更新
→ 判断：结果/风险/原因/合规/行为/证据是否充分
→ 信息：Policy、Benchmark、Fund role、Decision、Transaction、CashFlow、NAV、Position
→ 加工：Return、Risk、Comparison、Attribution、Appraisal、Behavior statistics
→ 表示：ReviewPeriod + traceable Findings
→ 行动：保留/修改/停止 Hypothesis、Policy 或 Rule
```

## 成功标准

- 历史复盘能重现当时的 Policy、Benchmark、Fund profile 和 DecisionRecord；
- 用户能同时看到 Target 完成度、Portfolio、Benchmark 和 Excess Return；
- 盈利违规与亏损合规不会被结果反转；
- 数据不足时系统停止并列出缺口；
- 规则更新来自累积证据，不来自单次胜负；
- AI 可以改变解释文字，不能改变核心指标、规则状态或 deterministic appraisal。

## 非目标

- BUY/SELL/STRONG BUY/STRONG SELL；
- 综合 `Investment Score`；
- 事后更换 benchmark 为结果辩护；
- AI 猜测收益原因或心理动机；
- 自动申购、赎回、转账、下单或跟单；
- 用 PRD、Mock 或单次真实 smoke test 声称长期决策质量已改善。
