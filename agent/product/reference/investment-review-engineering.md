# Investment Review 工程附录

> **用途**：服务实现、深度审查和回归验证。产品目的、当前范围、A/B 分工和人的验收以[人的产品审查正文](../investment-review.md)为准；理解产品不需要先读本附录。
>
> **状态（2026-08-14）**：P0 纪律与执行复盘（WP0-1~WP0-4）的运行时已实现；真实来源未提供的 requested/partial/failed/cancelled 等语义继续保持 unknown。P1~P4 仍为目标工程契约，未启动。

## 1. 分层与复用边界

```text
Comprehensive Source Capture
→ Page Consumption Adapter
→ Normalized Facts + DataCoverage
→ InvestmentScope + versioned ex-ante rules/plans
→ deterministic Judgment Engines
→ Review findings + resolution/recheck
→ Performance Measurement
→ Attribution / Appraisal / Behavior
→ StrategyHypothesis
→ optional AI explanation
```

`deterministic` 指同一有效输入必然得到相同核心结果的普通代码，不由 LLM 自由判断。Core 不读取真实页面 DOM、Cookie、Token、Raw Snapshot、登录态或完整 Network Logs；Adapter 只转换已观察的真实来源事实。

### 来源采集层与页面消费层

天天基金链路明确分成两个稳定边界：

1. **全面来源采集层**输出 `eastmoney-source-capture/1.0`。它保留账户/持仓来源字段、单基金份额/盈亏/定投表格、按时间范围和页码组织的交易记录、公开基金全部键值字段与章节，以及 Coverage、warning 和聚合性能指标。它不按当前页面需要裁剪字段，也不生成领域判断。
2. **页面消费加工层**在网站侧把来源采集包投影为 `InvestmentDataset 2.0`。账户、持仓、交易状态、每日盈亏、资产分类和 Coverage 的产品语义都在 Adapter 中形成；页面或领域模型变化只调整这一层，不反向修改已观察来源事实。

扩展 staging 保存来源采集包并维持一次性 ACK 生命周期；读取端继续兼容旧 `InvestmentDataset 2.0` 和 `1.1` 备份。仓库内只保留由用户真实采集包生成的**法律关键脱敏快照**（`eastmoney-source-desensitized.json`）：保留真实基金代码/名称/净值/金额/日期等非个人识别数据，仅掩盖个人金融账户、银行卡尾号、交易与追踪标识，由 `node project-support/scripts/investment/desensitize-source.js <真实采集包路径>` 生成并自检。该快照可用于开发时观察数据结构和页面消费，但不能替代真实 Chrome、真实扩展和实际登录来源下的验收。真实采集包、认证字段和真实个人账户/银行卡号/交易追踪标识不得写入仓库。

### 当前运行时基础

- `InvestmentScope`、`PortfolioSnapshot`、`HoldingSnapshot`、`Transaction` 与按问题传播的 Coverage；
- `InvestmentPolicyVersion`、`StrategyRuleVersion`、不可变 `DecisionRecord` / `OperationPlan` 与 `ExecutionLink`；
- IndexedDB Ledger、同步 receipt、ReviewAction、ReductionPlan 和 reload 恢复；
- operation/position/trailing-stop/take-profit/reduction 确定性引擎及 review orchestrator；
- Portfolio、Policies、Actions、Data、Evidence 和 canonical Review 页面。

运行时存在不等于所有外部事实都已被证明：

- “大额主动买入”仍只是一种统计信号，不能替代计划/规则相对的异常判断；
- ReviewAction 的关闭或等待状态不能证明真实交易已确认或处理后仓位已经恢复；
- 真实来源只有日期时，同日计划不能自动证明事前性；
- 来源分页 partial、NAV stale 或 basis 不清时，只降级依赖它们的判断；
- 来源没有提供 requested、partially_confirmed、cancelled 等阶段时，对应判断保持 unknown。

## 2. P0 已实现领域对象

以下对象已进入 P0 运行时契约；P1–P4 对象仍是后续目标，命名可在进入实现前根据现有 idiom 微调，但语义不得折叠。

### `InvestmentScope`

定义一次复盘包含什么：

- `scopeId`、`scopeType: ACCOUNT | DECLARED_PORTFOLIO`；
- 包含的账户/资产引用和明确排除项；
- 基准币种；初始 A 股人民币基金通常为 CNY；
- 仓位分母的来源、估值时间和 Coverage；
- 有效期与版本；
- `managementStartedAt`：首次由系统管理该范围的稳定时间，后续同步不得覆盖；
- `operationReviewFrom`：用户启用事前计划核对的起始日，缺省表示尚未启用。

真实来源只有日期而没有可信交易时刻时，基线当日归入历史背景，`operationReviewFrom` 最早为事前记录保存后的下一日。既有数据升级时以当前采集建立管理基线，不从历史交易反推过去何时开始管理。

单只基金是范围内的分析对象，不自动成为仓位分母。未声明的其他资产既不能自动纳入，也不能当作不存在。

### 事前规则与计划

- `InvestmentPolicyVersion`：目标、风险承受、期限、流动性和总体约束；
- `StrategyRuleVersion`：per-fund position band、regular investment、pause、trailing stop、reduction target 等 variants；
- `DecisionRecord` / `OperationPlan`：事前对象、方向、金额/份额/比例、允许时间窗、依据、失效条件及 scope/policy/rule refs；
- `TrailingStopRule`：适用基金、basis、高水位输入口径、回撤阈值和有效期；
- `ReductionPlan`：触发依据、目标区间、计划量、允许执行窗口和规则版本。

事前核心字段不可被执行或事后解释覆盖；修订创建新版本或追加 annotation。

### 执行与事实

- `Transaction`：保留现有事实，并扩展/映射 `requested | partially_confirmed | confirmed | failed | cancelled | unknown`；
- `ExecutionLink`：连接计划、来源申请和确认，记录关联方法与置信边界；无法可靠关联时保持 unlinked，不按相近金额自动猜测；
- `PositionSnapshot`：范围、基金持仓、现金（若适用）、分母、估值时点和 Coverage；
- `MarketDataSnapshot`：基金 NAV、日期、分红/复权 basis、修订和 Coverage；
- `DataCoverage`：来源、范围、时间窗、分页、采集时间、完整性、新鲜度、warning 及受影响的 `judgmentIds`。

申请不等于确认。部分确认、失败、撤销、过期和 unlinked 必须作为业务状态持久化。

### P0 确定性输出

- `JudgmentResult<T>`：`judgmentId`、用户问题、状态、结论值、reason、required/missing evidence、仍可回答的问题、next step、规则版本和 evidence refs；
- `OperationComplianceResult`：计划存在性、对象/方向/数量/时间偏离、pause conflict、execution status；它是 P0 的规则对照，不是需要 Measurement/Attribution 的完整 Performance Appraisal，也不读取最终收益；
- `PositionJudgment`：分母资格、实际比例、规则区间、deviation 和 limitation；
- `TrailingStopState`：previous/current high-water mark、stop line、NAV basis、triggered、as-of 和状态；
- `ReductionProgress`：planned/requested/confirmed/remaining、post-position、restored 与 limitation；
- `ReviewAction` / resolution history：待人处理、用户处置、来源执行状态和复核状态分开。

### P1–P4 条件性对象

- P1：`ReviewPeriod`、`CashFlow`、`PerformanceSnapshot`、`RiskSnapshot`、独立 Outcome；
- P2：`BenchmarkVersion`、`AttributionResult`、深化的 `DecisionAppraisal`、`BehaviorFinding`；
- P3：`StrategyHypothesis`、版本化 evidence status、`RuleUpdateDraft`；
- P4：`ReviewFinding`，只使用 `FACT | INFERENCE | HYPOTHESIS` 和稳定 evidence refs。

Benchmark 不是 P0 的共同依赖；只有相对表现、Excess Return 或特定归因问题需要它。CashFlow、费用、税、FX 同样按使用它们的判断启用。

## 3. 关系与状态契约

### P0 主关系

```text
InvestmentScope
  ├── InvestmentPolicyVersion
  └── StrategyRuleVersion
              ↓ as-of
    DecisionRecord / OperationPlan
              ↓ link, never overwrite
 Transaction requests + confirmations
              ↓
 PositionSnapshot + MarketDataSnapshot
              ↓
 OperationComplianceResult
 PositionJudgment
 TrailingStopState
 ReductionProgress
              ↓
 JudgmentResult + ReviewAction
              ↓ user resolution / new facts
          post-state recheck
```

### 状态

通用判断结果可使用：

```text
VALID
PARTIAL
STALE
INSUFFICIENT_DATA
FAILED
UNKNOWN
```

状态必须属于具体 `judgmentId`。页面不能把若干判断聚合成无条件的全局 `normal`；摘要必须同时给出已检查、违反、unknown 和未覆盖数量。

过程合规使用：

```text
COMPLIANT
PARTIAL
BREACH
INSUFFICIENT_DATA
```

Outcome 在 P1 单独使用 `POSITIVE | NEGATIVE | NEUTRAL | INSUFFICIENT_DATA`。不生成 `GOOD_DECISION`、`BAD_DECISION` 或综合 Investment Score。

最小状态机：

```text
Plan: draft → recorded → linked | unlinked → reviewed
Execution: requested → partially_confirmed | confirmed | failed | cancelled
Reduction: planned → requested → partially_confirmed → confirmed
           → restored | confirmed_not_restored | failed | cancelled
Review action: open → acknowledged → waiting_execution → waiting_confirmation
               → waiting_recheck → resolved | dismissed_with_reason
```

Action 被关闭不能跳过 execution 或 post-state recheck。每个中间态和终止态检查 reload 后持久化。

## 4. 按问题的证据门槛与不变量

### 全局

1. Adapter 输出来自真实来源的标准化事实；Core 不直接依赖来源页面或账户凭据。
2. 缺失、Schema Drift、partial/stale 和 unknown 进入相关判断的 Coverage，不静默猜测。
3. 同步与重算使用稳定业务键，重复导入幂等。
4. InvestmentScope、Policy、Rule 和 Decision 按事实发生时的有效版本解析；当前修改不改变历史。
5. 事前记录与执行事实不可互相覆盖。
6. 没有用户规则时，不生成合理仓位、止损或减仓阈值。
7. 一个判断证据不足不自动阻断无依赖关系的判断。
8. AI、更换模型或关闭 AI 不改变任何 P0–P3 核心状态。
9. 系统不自动申购、赎回、调仓、转账或交易。
10. `managementStartedAt` 和 `operationReviewFrom` 是稳定边界；新采集只能追加事实，不能把边界移动到最近同步日。
11. 管理基线之前及来源只有日期的启用当日操作不产生计划 breach；缺少历史计划 Coverage 不等于确定“无计划”。

### 操作计划与执行

最小证据：有效计划/规则、来源操作、申请与确认状态、稳定关联依据。

- 计划核对未启用或交易早于 `operationReviewFrom` 时，只保留为历史基线，不产生计划合规 Judgment；
- 核对生效后的无记录操作与已有计划但未关联分开；前者是管理流程记录缺口，后者等待用户显式关联，两者都不等于投资结果错误；
- 历史金额偏离只能增加一个 `historical_amount_signal`，不能直接产生规则 breach；
- Transaction 发生后不得补写成“事前计划”；来源只有日期时，同日记录不能证明在先，因此拒绝关联；
- 关联不确定时输出 unlinked/unknown，不以金额或日期相近强行关联；
- partial、failed、cancelled 不进入 confirmed/post-state restored。

### 仓位

最小证据：InvestmentScope、同一估值边界的分母和基金市值、当时生效的区间规则。

```text
positionPct = eligibleFundMarketValue / eligibleScopeDenominator
```

- 分母缺失、范围不一致或估值时点不可比时，PositionJudgment 为 `INSUFFICIENT_DATA` 或 `UNKNOWN`；
- 不能拿单只基金自身市值作分母后声称仓位 100%；
- Cash 只有在范围和分母定义要求时参与，未知不能按 0；
- 仓位 unknown 不阻断只依赖交易/计划或 NAV/止损规则的判断。

### 移动止损

最小证据：适用基金、规则版本、previous state、合格 NAV/date 和一致的分红/复权 basis。

```text
newHighWaterMark = max(previousHighWaterMark, eligibleCurrentNAV)
newStopLine = max(previousStopLine, newHighWaterMark × (1 - drawdownPct))
```

- 创新高时 high-water mark 和 stop line 按规则上移；
- 未创新高时 stop line 不动，绝不下移；
- stale、partial、unknown NAV 或 basis 不一致时不推进状态；
- basis 变化需要可验证转换、新规则版本或停止比较；
- triggered 只创建复核/减仓事项，不执行交易。

### 减仓与恢复

最小证据：触发依据、用户目标区间、合格分母/持仓、计划量、申请/确认事实和操作后快照。

- 计划量只用于恢复到用户区间，不预测卖点；
- remaining 依据真实确认量和新 PositionSnapshot 重算；
- 部分确认保持进行中；
- 全额确认但仍越界为 `confirmed_not_restored`；
- 只有确认且新快照回到规则范围才为 `restored`；
- 赎回费用影响确认量或结果时纳入对应判断，不要求无关场景预先提供通用税费清单。

### P1 绩效与 P2 归因

P1 仍遵守：

- 外部现金流切分 TWR 子期间，不能直接虚增收益；
- MWR/XIRR 使用带日期现金流和可调和终值；
- TWR 与 MWR 分别表达策略路径与个人资金体验；
- Drawdown 使用有资本基数的价值/收益序列，不以累计 DailyPnL 金额差替代；
- 少于一年只展示期间实绩，不伪装成年化。

Benchmark/Excess gate：相同期间、相同币种或可验证 FX、相同 return type、兼容费用口径、足够 Coverage。任一不满足，只阻断相对表现，不阻断 P0 或可独立计算的绝对结果。

P2 Attribution 只有 Measurement 可信且数据粒度满足时运行。Level 1/Level 2 无法调和时显示 residual 和 limitation，不强制归零，也不由 AI 生成原因故事。

## 5. 真实环境验收

验收必须在用户实际使用的 Chrome、已加载的仓库扩展、真实天天基金登录态、真实分页接口、本地 Ledger 和实际 Investment OS 页面中完成。需要实际观察采集进度、来源字段、失败原因、一次性暂存、导入确认、刷新后状态、页面结论、Network 与 Console；静态公式、人工场景、fixture、Mock、Test Matrix 或 Agent 自设 Oracle 都不能替代这些结果。

真实来源暂时没有出现某种状态时，该状态保持“未验收”或“未知”，不得为了覆盖它而制造输入并据此宣布通过。

## 6. 当前工作包与旧任务追踪

| 当前工作包 | 活动范围 | 可追溯的历史任务 |
| --- | --- | --- |
| `WP0-1 投资范围、规则与按问题判定的数据状态` | InvestmentScope、JudgmentResult、Coverage、Ledger migration、来源语义 | `A-FOUND-001`、`B-POSITION-001`、`B-NAV-001` 及相关 Cash/Transaction 字段验证 |
| `WP0-2 计划操作与真实执行对照` | Decision/OperationPlan、ExecutionLink、状态机、偏离理由 | `A-JOURNAL-001`、`A-EXEC-001`、`B-CASHFLOW-001`、`B-LINK-001`、旧 Behavior 工作 |
| `WP0-3 仓位、移动止损与减仓恢复` | PositionJudgment、TrailingStopState、ReductionProgress、post-state recheck | `A-STOP-001`、`A-REDUCE-001`、部分 `A-APPRAISE-001` 与 B 的 NAV/position 输入验证 |
| `WP0-4 一页复盘与真实验收` | Review P0 slice、人类审查、脱敏来源 smoke test | `A-REVIEW-001` P0 slice、`A-UI-001`、`B-REAL-001` |
| P1（未来） | Performance/Risk、Process/Outcome 分离 | `A-MEAS-001`、`A-BENCH-001`、`A-RISK-001`、`B-BENCH-001`、`B-REAL-MEAS-001` |
| P2（未来） | Attribution、深化 Appraisal、Behavior | `A-ATTR-001`、`A-BEHAV-001` |
| P3（未来） | StrategyHypothesis | `A-HYP-001` |
| P4（未来） | AI Review | `A-AI-001` |

历史 ID 只用于追踪来源，不构成独立活动任务板。当前状态、范围和角色只在[产品正文](../investment-review.md)维护。

## 7. 私人来源与实现边界

通用权限规则见[最小授权验证](../../standards/main-agent-authorized-validation.md)。Investment Review 只增加以下领域边界：

- Core 只消费已确认语义的标准化事实，明确输入、规则版本、Coverage、状态和 unknown 条件；AI 不作为 Core Oracle，runtime 不依赖 `agent/`。
- 私人来源只用于确认字段有无、语义、时间、Coverage 和页面消费，不用于设计阈值、评价仓位、计算投资结论或执行交易。
- 真实登录 Chrome 是目标时，隔离 profile 不得替代；不能证明的 mapping 保持 unknown。
- 只回传 `REAL_SOURCE_PASS | FAIL | BLOCKED | UNKNOWN`、字段能力、Coverage、必要变更和敏感信息暴露情况；不输出基金名、金额、收益、账户、Raw JSON/HTML、Cookie、Token、银行卡、登录态或完整 Network Log。
- 原始材料只在获批会话临时观察，不进入仓库、fixture、摘要或长期报告。

## 8. Definition of Done

每个 P0 交付项必须同时满足：

1. 目标契约和按问题状态明确；
2. 只消费真实来源标准化事实的确定性实现；
3. 在目标真实环境观察关键来源状态和页面消费结果；
4. 实际出现的 normal/empty/partial/stale/failed/unknown 状态如实展示；
5. migration、round-trip、reload、幂等和历史版本在真实账本操作中可靠；
6. UI 从结论下钻到规则、事实、Coverage、limitation 和下一步；
7. typecheck 和 production build 仅用于开发排错，不作为验收结论；
8. 隐私、真实环境和无自动交易边界；
9. 对应工作包在目标页面完成真实操作验收；
10. 实现和证据完成后才升级状态。

P0 还必须证明：一个问题 unknown 不污染其他问题；历史金额信号不等于规则 breach；止损线单调不降；申请/部分确认/确认/恢复分离；Action 关闭不等于完成；无 Benchmark、FX 或通用税字段时，适用的 A 股人民币基金纪律复盘仍可运行。

P1–P4 只有达到[产品正文](../investment-review.md)的启动条件后才展开。P1 的 Measurement、P2 的 Attribution/Appraisal 专业约束仍然有效，但不再作为 P0 纪律任务的错误前置依赖。
