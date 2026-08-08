# 04 功能需求与验收

**来源**：PRD 第 8–31、42–51、65–66 节。**状态**：按阶段交付的需求清单。

## 第一阶段：可信投资账本

### 架构与数据

- 建立 `InvestmentSourceAdapter`、Domain Model 和 `MockInvestmentSourceAdapter`。
- 用人工构造的 normal、empty、partial、stale、failed、complex、large fixture 覆盖边界；不得从真实数据简单改名或缩放生成。
- IndexedDB Ledger 规划 stores：accounts、portfolioSnapshots、holdingSnapshots、transactions、dailyPnl、dataCoverage、assets、policies、policyVersions、observations、actions、evidence。

### Sensor 与同步

- 识别 source status：unsupported、ready、loading、authentication_required、error。
- 增量合并 DailyPnL（`fundCode + date`）和 Transaction（优先 sourceTransactionId，否则使用日期、基金、类型、金额、状态指纹）。
- 记录 known ranges、completeness、lastSyncedAt 和 warningCodes。
- 页面未打开时允许 Extension Staging DB，下一次启动 merge；JSON 保留为备份和迁移入口。

### Web 基础

- Console：账户状态、当前持仓盈亏、累计盈亏、最大回撤、风险摘要和 Action。
- Portfolio：账户、持仓表和基础暴露视图。
- Data：覆盖时间轴、健康状态、缺口影响。

## 后续引擎

- **Exposure**：资产元数据、指数/地区/资产类型聚合和重复暴露。
- **Policy**：Policy、PolicyVersion、目标配置、定投、暂停、复核和 Action 生成。
- **Behavior**：系统定投、主动交易、异常金额、未知交易和重复模式。
- **Evidence**：XIRR、TWR、回撤、规则表现、行为比较、版本比较和证据强度。

## 共通验收

功能完成至少需要：Mock Test、Typecheck、Build、Edge Case 均通过；正常、Empty、Partial、Failed 场景可用；未知数据不能被错误展示。依赖真实平台时，还要有 Agent B 脱敏验证、无 Schema Drift、无敏感信息泄漏。

## Agent 分工

- Agent A：Investment Core、Product UI、Mock、单元测试、Ledger、Exposure、Policy、Behavior、Evidence。
- Agent B：Eastmoney Adapter、真实 selector/API mapping、登录/分页/失败验证、Real Data Smoke Test 和 Schema Drift；每次只处理单一接口、场景和验证目标。

Agent B 的反馈只使用 PASS/FAIL/BLOCKED、缺失字段、未知状态、Mapping 问题和敏感信息摘要，不输出基金名称、金额、收益、原始 JSON/HTML、银行卡、完整网络日志或可组合识别个人的日期金额。
