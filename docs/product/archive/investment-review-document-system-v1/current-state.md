# Current State — Investment Review

**审计日期**：2026-08-09
**责任**：这里只记录当前源码与可信验证能证明的事实；目标需求见 [Canonical PRD](README.md)。规划、Mock 或文档不能把状态升级为已交付。

## 状态定义

- **已实现**：当前代码存在完整能力和匹配的可执行证据；
- **局部实现**：有可复用基础，但不能完成 canonical 用户任务；
- **未实现**：当前运行时代码没有该领域对象或闭环；
- **未验证**：实现可能存在，但本次没有与声明匹配的 Oracle/真实环境证据。

## 当前路由事实

当前 canonical OS 路由为：

```text
/investment
├── portfolio
├── policies
├── actions
├── data
└── evidence
```

另有 `/investment/legacy/*` 历史页面。目标 `/investment/review` 尚不存在，legacy 的 `/investment/legacy/review` 不具备新版 ReviewPeriod 语义。

## 能力矩阵

| 能力 | 状态 | 当前证据/限制 | Canonical 去向 |
| --- | --- | --- | --- |
| Eastmoney/扩展数据进入标准化事实 | 局部实现 | 已有 adapter/sensor、Coverage 和同步入口；真实来源字段仍受授权验证与页面漂移约束 | P0 输入基础 |
| 本地 IndexedDB Ledger | 局部实现 | 可保存部分 portfolio/transaction/policy/action/pattern/evidence；缺 canonical 对象及 migration | Foundation |
| Portfolio/Holding/Transaction/Coverage | 局部实现 | 已有类型与页面，但现金流、费用、确认阶段、估值边界和完整历史 Coverage 不足 | P0 |
| Asset metadata / exposure aggregation | 局部实现 | 能做部分分类暴露；不是完整 position/cash/underlying exposure 风险模型 | P0/P1 |
| Policy / PolicyVersion | 局部实现 | 有版本结构和少量规则；不是完整 InvestmentPolicy、Benchmark/Profile/Rule version 图 | P1 |
| Policy engine | 局部实现 | 主要能检测部分最大暴露超限；缺 target/min band、现金底线、Decision-relative 规则与完整执行语义 | P1 |
| Behavior engine | 局部实现 | 当前主要识别相对历史基线的异常大额主动买入；不是 Policy-relative appraisal 或行为金融复盘 | P2 |
| Action/Evidence 页面 | 局部实现 | 可展示和改变部分状态；处置理由、真实执行、确认和操作后复核没有完整持久化 | P1/Review |
| Absolute Return / professional portfolio return | 未实现 | 当前没有以现金流、估值边界、费用和资本基数调和的 canonical engine | P0 |
| TWR | 未实现 | 无现金流分段和子期间链接 | P0 |
| MWR/XIRR | 未实现 | 无 dated cash-flow solver 与终值调和 | P0 |
| Benchmark / BenchmarkVersion | 未实现 | 无事前版本、币种、price/total return 和期间适配对象 | P0 |
| Excess Return / Target Completion 分离 | 未实现 | 当前无法可靠计算，Target/Benchmark 也未建模 | P0 |
| RiskSnapshot | 未实现 | 现有累计 DailyPnL 金额差计算不等于专业组合百分比 drawdown；无 duration/volatility 适用边界 | P0 |
| InvestmentPolicy / StrategyRule canonical model | 未实现 | 当前 Policy 只是可迁移基础 | P1 |
| FundStrategyProfile / portfolio role | 未实现 | 没有版本化 profile 与事前 benchmark 绑定 | P1 |
| DecisionRecord | 未实现 | 无不可覆盖的 thesis/trigger/invalidation 与计划量 | P1 |
| Decision → Execution comparison | 未实现 | Transaction 没有形成计划/申请/确认/失败/部分确认闭环 | P1 |
| DecisionAppraisal | 未实现 | 无 process/outcome 分离的多维确定性评价 | P1 |
| Trailing stop / reduction plan | 未实现 | PRD 已定义规则变体，runtime 未交付 | P1 |
| Attribution Level 1/2 | 未实现 | 无 deterministic contribution/effects/residual | P2 |
| Outcome Bias / Disposition / Possible Overtrading | 未实现 | 当前 Behavior pattern 不能证明这些模型 | P2 |
| StrategyHypothesis | 未实现 | 无证据状态和历史版本 | P3 |
| ReviewPeriod orchestrator | 未实现 | 无固定 Objective → Measurement → Risk → Attribution → Appraisal → Behavior → Update 闭环 | Review |
| AI-assisted Review | 未实现 | 无只读 deterministic Findings 的可追溯 AI 契约 | P4 |
| 自动交易 | 不在范围 | 未授权，也不是产品目标 | Non-goal |

## 当前可证明的产品价值

当前实现主要降低：

- 从来源读取和归一化部分账户/基金事实的成本；
- 查看 Coverage、持仓、暴露、Policy Action 和 Evidence 的访问成本；
- 在本地 Ledger 保留部分事实的成本。

它尚不能可靠回答：

1. 本期真实组合收益是多少，TWR 与资金体验分别如何；
2. 是否达到 Target、是否跑赢事前 Benchmark；
3. 收益来自市场、配置、选择、现金时点、成本还是无法解释项；
4. 某次操作是否符合事前策略、风险和执行计划；
5. 盈利是否掩盖违规，亏损是否其实来自合规过程；
6. 是否出现 disposition、overtrading、strategy drift 等可复核模式；
7. 哪些经验已经形成可支持的 StrategyHypothesis；
8. 下一周期应保持还是创建新规则版本。

因此，对完整基金复盘任务的当前 Task–Technology Fit 仍为 **LOW**。这是产品差距，不是对现有数据基础的否定。

## 状态升级规则

任何条目从“未实现/局部实现”升级，至少需要：

1. canonical domain contract；
2. deterministic implementation；
3. 手算、性质或不变量 Oracle；
4. Coverage 与 `INSUFFICIENT_DATA` 行为；
5. 若声明真实来源可用，则需要 Agent B 在明确授权真实环境中的脱敏证据；
6. UI 存在时，还需证明用户能完成相应判断，而不只是看到数据。

本文件必须随实现和验证同步更新；仅更新 PRD 或任务板不得更新状态。
