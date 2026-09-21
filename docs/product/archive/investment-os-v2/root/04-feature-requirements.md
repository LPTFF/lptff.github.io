# 04 功能需求与验收

**来源**：原始 PRD 第 8–31、42–51、65–66 节与 [05 投资纪律需求](05-investment-discipline-requirements.md)。**状态**：可信账本已有局部实现；P0/P1/P2 为规划切片，完成度见 [09 需求追踪矩阵](09-traceability.md)。

## 已有基础：可信投资账本与局部引擎

当前代码已有以下基础，但不等于投资纪律闭环已完成：

- `InvestmentSourceAdapter`/标准化事实、Extension Staging 与本地 IndexedDB Ledger；
- Data Coverage、来源、同步时间、warning 和缺口影响；
- Console/Portfolio/Data 等主页面；
- 资产元数据与部分指数、地区、主题等暴露；
- Policy/PolicyVersion 和以最大暴露为主的有限规则评估；
- 定投/主动交易分类、异常大额主动买入与有限 Action；
- 汇总交易、盈亏和数据充分性的简化 Evidence。

当前缺口是：引擎和页面尚不能把事前规则、操作计划、真实确认、操作后状态和长期证据串成闭环。

## P0：操作纪律复核

### 业务结果

用户能回答：当前数据是否足以判断、仓位是否越界、最近操作是否按计划、处置是否真正执行，以及最终是否恢复规则范围。

### 能力范围

1. 建立 `InvestmentPlan`、`RiskBudget`、`OperationReview` 和语义化 `ActionResolution`；
2. 支持单基金、总风险资产、现金底线和底层暴露护栏；
3. 在操作前模拟计划后的组合，明确规则改善/恶化；
4. 将计划与交易申请、确认和操作后快照关联；
5. 持久化用户原因、计划动作、截止时间、实际执行和结果；
6. stale/partial/unknown 时停止受影响的确定性判断；
7. Console/Portfolio/Policies/Actions 改为任务导向表示。

### P0 验收

- 买入造成越界时，能从事实、计算和 PolicyVersion 追溯到 Action；
- 无计划操作被标为待复核，不自动判错，也不能事后伪造成事前计划；
- Action 关闭、交易申请、交易确认和规则恢复分别存储；
- 部分确认不会进入 completed；
- 页面刷新或重开后处置原因、计划和结果仍存在；
- 数据不足时显示 Required data，不给确定性减仓动作；
- 所有 Core 规则有独立业务 Oracle、单元/属性/状态机测试和脱敏 fixture。

## P1：移动止损与分档减仓

### 业务结果

用户能判断止损线是否按自己的规则上移、是否触发复核，以及减仓计划能否把仓位恢复到目标区间。

### 能力范围

1. `TrailingStopRule/State`：净值基准、高水位、止损线、回撤、Coverage 和触发状态；
2. 只上移不下移不变量和 PolicyVersion 变更边界；
3. stale NAV、历史 partial、分红/复权未知时的停止路径；
4. `ReductionPlan`：触发原因、目标区间、计划量、模拟组合、申请/确认与剩余偏离；
5. 开放式基金日净值和申赎确认延迟的产品提示。

### P1 验收

- 任意合格净值序列下止损线单调不降；
- 新高使止损线上移，没有新高时不变化；
- stale/partial/unknown 净值不推进状态或制造确定性触发；
- 减仓量只相对用户目标区间计算，并展示分母、时点和误差；
- 部分确认后按确认量和新快照重算，不以申请量冒充完成；
- 不输出脱离 Policy 的权威 SELL，不自动提交赎回。

## P2：Policy Evidence 与归因

### 业务结果

用户能在证据边界内比较规则版本和操作纪律，而不是只看累计盈亏。

### 能力范围

1. 按 Policy/PolicyVersion 划分规则内外、计划内外和执行完成状态；
2. 先建立 Coverage、样本和可比较性，再计算绩效；
3. 使用真实现金流和组合估值支持 XIRR、TWR、百分比回撤、恢复期和下行波动；
4. 在基准语义可靠时进行基准比较；
5. 在证据允许时进行收益、风险和行为归因；
6. Evidence Strength 明确不能证明的内容。

### P2 验收

- 外部现金流不会直接虚增 TWR；
- 简单累计 DailyPnL 金额不标记为专业组合最大回撤；
- 盈利但规则外的操作仍分类为 violation/unplanned；
- 缺少现金流、估值、基准或 Coverage 时对应结论降级；
- 规则有效性不能只由交易数量或单次结果决定。

## 共通验收

- **Agent A**：Mock、独立 Oracle、单元测试、属性测试/状态机测试（适用时）、typecheck、build 和关键页面验证。
- **Agent B**：在明确授权范围内验证来源字段的语义、时间粒度、历史范围、状态和可关联性，不只证明字段存在。
- 正常、empty、partial、stale、failed 以及纪律专项 fixture 均有明确结果。
- 真实平台不足时返回 BLOCKED/unknown 和 Required change，不用猜测补齐。
- 规划文档、Mock 通过或接口成功均不能单独证明真实产品能力已交付。

## Agent 分工

- Agent A：Domain/Core、Mock、Ledger、产品 UI、规则状态机和 Evidence；禁止访问真实账户。
- Agent B：Eastmoney 字段语义、Adapter mapping、分页/登录/失败、授权真实验证和 Schema Drift；不设计 Core 规则，不判断减仓是否合适。
- Shared：领域契约、不变量、fixture/真实场景映射、DoD 和阻塞回传。

具体任务见 [Agent A 任务板](agent-a/06-task-board.md) 与 [Agent B 任务板](agent-b/05-task-board.md)。
