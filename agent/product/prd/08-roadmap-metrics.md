# 08 路线与指标

**来源**：PRD 第 52–59、66–70 节。**状态**：规划，未实现内容必须与当前代码区分。

## 版本路线

- **V2.1 Trusted Investment Ledger**：Data Coverage、增量同步、Dedup、Direct Sync、Source Status、IndexedDB、Snapshot、DailyPnL、Transaction、Data 页面和基础 Console/Portfolio。
- **V2.2 Exposure**：Asset Metadata、Index/Region/Asset Class、Duplicate Exposure。
- **V2.3 Policy**：Policy、PolicyVersion、Allocation、Regular Investment、Pause、Review Condition、Action。
- **V2.4 Behavior**：定投、主动交易、异常金额、未知交易、重复行为和 Action Confirmation。
- **V2.5 Evidence**：收益、回撤、Systematic/Discretionary、Compliant/Violation、Policy Version Comparison、Evidence Strength。
- **V3 AI Research Assistant**：仅在 Ledger、Policy、Evidence 之上解释、比较、发现模式、归因和总结；不以预测、BUY 或 SELL 为核心。

当前开发顺序为 Adapter/Core 隔离 → Mock Kit → Data Coverage → 增量同步 → IndexedDB Ledger → Console/Portfolio/Data，再进入 Exposure、Policy、Behavior、Evidence。

## 指标

### 数据质量

Transaction Duplicate Rate、DailyPnL Continuity、Coverage Completeness、Parsing Error Rate。

### 自动化能力

Auto Classified Transaction %、Manual Input Count、Monthly User Confirmation Count；目标是人工维护次数随系统成熟下降。

### 行为质量

Policy Coverage %、Policy Violation %、Abnormal Transaction Frequency。

### 投资结果

XIRR、TWR、Maximum Drawdown、Downside Volatility、Policy Performance 和 Policy-Compliant Performance。

## 不使用的指标

不以 DAU、使用时长和打开次数作为主要成功指标；投资软件更少被打开不必然意味着价值降低。所有路线和指标都需结合真实数据覆盖、样本量和隐私边界解释。
