# Agent A 任务板

**安全边界**：Agent A 只使用人工构造 fixture。禁止访问真实账户、真实资产/交易、Cookie、Token、Raw Snapshot、登录态和完整 Network Logs。需要来源事实时只消费 Agent B 的脱敏字段语义与 PASS/FAIL/BLOCKED 结论。

**统一完成标准**：每项任务必须满足 [Shared Definition of Done](../shared/02-definition-of-done.md)，并记录实际修改文件、测试命令、页面证据、未验证内容和停止条件。任务状态初始均为“待开始”。

## 依赖顺序

```text
Shared 契约冻结
├── A-DISC-001
└── B 字段结论 + A fixture 可并行

A-DISC-001
→ A-DISC-002
→ A-DISC-003
→ A-UI-001（P0 UI）

B-NAV-001 → A-STOP-001 ┐
B-TX-001  → A-REDUCE-001 ├→ A-UI-001（P1 UI）
B-SNAPSHOT-001 ──────────┘

P0/P1 记录与足够历史 Coverage → A-EVID-001 → A-UI-001（P2 UI）
```

## 任务总表

| ID | 优先级 | 任务 | 状态 | 主要依赖 |
| --- | --- | --- | --- | --- |
| `A-DISC-001` | P0 | 纪律领域契约与 Ledger migration | 待开始 | Shared 契约 |
| `A-DISC-002` | P0 | 风险护栏与操作前后组合模拟 | 待开始 | `A-DISC-001`、`B-FIELD-001` |
| `A-DISC-003` | P0 | Action 处置、执行和结果闭环 | 待开始 | `A-DISC-001/002`、`B-TX-001`、`B-SNAPSHOT-001` |
| `A-UI-001` | P0→P2 | 任务导向 Investment OS 页面 | 待开始 | 对应 Core 切片完成 |
| `A-STOP-001` | P1 | 移动止损状态机 | 待开始 | `A-DISC-001`、`B-NAV-001` |
| `A-REDUCE-001` | P1 | 目标区间减仓计划 | 待开始 | `A-DISC-002/003`、`B-TX-001`、`B-SNAPSHOT-001` |
| `A-EVID-001` | P2 | Policy/Version Evidence 与归因 | 待开始 | P0/P1 真实记录、历史 Coverage |

---

## `A-DISC-001`：纪律领域契约与 Ledger migration

- **目标**：建立 `InvestmentPlan`、`RiskBudget`、`OperationReview`、`ActionResolution` 及共享状态类型，使事前、执行和结果可分别保存与追溯。
- **输入**：[纪律需求](../05-investment-discipline-requirements.md)、[领域契约](../shared/00-domain-contracts.md)、现有 `src/investment/domain/types.ts` 和 Ledger repository。
- **输出**：领域类型、schema/version、IndexedDB migration、repository API、序列化/重载测试。
- **源码范围**：优先限定 `src/investment/domain/`、`src/investment/ledger/` 与对应测试；本任务不改页面。
- **Mock**：`plan-deviation`、`unplanned-operation`、`policy-version-change`。
- **独立 Oracle**：状态转换表、不可覆盖字段清单、migration 前后等价表；expected 不调用 repository 生产转换函数生成。
- **测试**：新建/升级数据库、旧记录迁移、round-trip、不可变事前字段、PolicyVersion 引用、unknown 字段兼容。
- **Agent B 依赖**：无阻塞；字段先用抽象语义和 fixture，禁止猜测 Eastmoney 原字段。
- **停止条件**：若现有 DB 版本或迁移策略无法安全保留用户 Policy/Action，停止实现并先提交 migration 决策；不得清库规避迁移。

## `A-DISC-002`：风险护栏与组合模拟

- **目标**：实现单基金、总风险资产、现金底线和底层暴露的 current/after-plan 评估，生成可解释偏离。
- **输入**：`RiskBudget`、持仓/现金/资产元数据、统一估值时点、Coverage、计划量。
- **输出**：pass/violation/unknown/partial/stale 结果，包含 current、target band、deviation、denominator、asOf、Coverage、PolicyVersion 和 contributing holdings。
- **源码范围**：`src/investment/engines/policy/`、`engines/exposure/`、必要 selectors 与测试；不在 Vue 组件中计算。
- **Mock**：`position-breach`、`cash-floor`、`partial`、`stale`、`complex`。
- **独立 Oracle**：小型固定组合手算表；边界包含关系和数值精度单独规定。
- **测试**：各护栏、恰好边界、未知资产、分母为零/未知、时点不一致、模拟操作改善一项但恶化另一项、属性测试。
- **Agent B 依赖**：`B-FIELD-001` 提供份额/市值/现金/快照字段语义；未通过前真实映射保持 unknown，但 Mock Core 可继续。
- **停止条件**：若总资产/现金或快照时点无法可靠定义，不得把相应护栏标记为可运行；返回 BLOCKED dependency。

## `A-DISC-003`：Action 处置、执行和结果闭环

- **目标**：替换“只改状态却提示已记录”的路径，持久化用户原因、计划动作、截止时间、交易执行、操作后状态和结果。
- **输入**：Action、ActionResolution、InvestmentPlan、交易申请/确认、前后快照、PolicyVersion。
- **输出**：可重载状态机、OperationReview、剩余偏离、超期/失败恢复路径。
- **源码范围**：`src/investment/composables/use-investment-os.ts`、Ledger repository、Actions 相关 Core/composable 和测试；页面改造留给 `A-UI-001`。
- **Mock**：`plan-deviation`、`partial-redemption`、`failed-redemption`、`snapshot-unlinked`。
- **独立 Oracle**：合法/非法状态转换表、每个状态必填字段表、规则恢复手算结果。
- **测试**：重载持久化、ignore 不消除偏离、pause-new 语义、adjust-policy 新建版本、部分确认、失败/撤销、操作后仍越界、actual 不覆盖 plan。
- **Agent B 依赖**：`B-TX-001` 的状态语义和稳定键、`B-SNAPSHOT-001` 的前后快照关联结论。
- **停止条件**：来源无法区分申请与确认或无法关联快照时，状态停在 submitted/partial/unknown；不得自动 completed。

## `A-STOP-001`：移动止损状态机

- **目标**：实现开放式基金的高水位、只上移止损线、触发复核和 unknown 路径。
- **输入**：`TrailingStopRule`、按已确认 basis 排序的日净值、Coverage、PolicyVersion。
- **输出**：高水位、止损线、当前回撤、ratcheted/triggered/pass/unknown/stale 和可解释 Action。
- **源码范围**：新增/扩展 `src/investment/engines/` 中独立 stop 模块、领域类型、Ledger state 和测试；不自动交易。
- **Mock**：`stop-ratchet`、`stop-triggered`、`stale-nav`、`dividend-unknown`、`policy-version-change`。
- **独立 Oracle**：`max` 公式与预先列出的序列手算；生产函数不得生成 expected。
- **测试**：示例测试 + 属性测试（任意合格序列止损线单调不降）、重复日期、乱序、阈值版本变化、stale/partial 不推进。
- **Agent B 依赖**：`B-NAV-001` 必须确认净值 basis、日期、新鲜度、历史范围和分红/复权语义。
- **停止条件**：basis 或分红语义 BLOCKED 时不接真实来源，只保留 Mock 能力并在产品层标记未验证/unknown。

## `A-REDUCE-001`：目标区间减仓计划

- **目标**：按用户目标区间计算计划赎回量，模拟多规则影响，并在确认后复核剩余偏离。
- **输入**：RiskBudget、触发 Action、事前组合、目标区间、估值/份额、费用假设、申请与确认。
- **输出**：ReductionPlan、计划后组合、误差范围、申请/部分确认/确认状态和剩余偏离。
- **源码范围**：独立 reduction planner、Ledger/review 集成和测试；不提交真实赎回。
- **Mock**：`position-breach`、`partial-redemption`、`failed-redemption`、`cash-floor`。
- **独立 Oracle**：固定组合和目标区间手算；验证计划量、确认量和剩余量。
- **测试**：单规则、多规则冲突、费用、净值变化、金额/份额舍入、部分确认、失败/撤销、目标区间未知。
- **Agent B 依赖**：`B-TX-001`、`B-SNAPSHOT-001`；现金影响还依赖 `B-FIELD-001`。
- **停止条件**：没有用户目标区间或必要事实时返回 unknown，不输出推荐量；来源只提供申请而无确认时不得完成复盘。

## `A-EVID-001`：Policy/Version Evidence 与归因

- **目标**：按 PolicyVersion 建立计划内外、规则内外和版本比较；在数据允许时加入现金流调整绩效、风险与归因。
- **输入**：OperationReview、PolicyVersion、交易现金流、组合估值序列、Coverage、可比较基准。
- **输出**：执行指标、XIRR/TWR、百分比回撤/恢复期、版本比较、Evidence Strength 和 limitation。
- **源码范围**：Evidence engine、领域类型、Ledger、selectors 和测试；页面由 `A-UI-001` 消费。
- **Mock**：`cash-flow`、`policy-version-change`、`profitable-violation`、`partial`。
- **独立 Oracle**：已知现金流手算/可信数学库对照、固定 NAV 路径、Strength 决策表；禁止用生产实现生成期望。
- **测试**：外部现金流不虚增 TWR、XIRR 日期、回撤百分比、Coverage 降级、盈利违规分类不变、版本窗口不可混合。
- **Agent B 依赖**：P0/P1 真实记录和足够历史 Coverage；缺失字段另拆 Agent B 单目标任务，不扩大当前授权。
- **停止条件**：现金流/估值/基准不可比或样本不足时只输出执行事实和 `INSUFFICIENT/WEAK`，不得输出策略有效结论。

## `A-UI-001`：任务导向 Investment OS 页面

- **目标**：按每个已完成 Core 切片改造 Console、Portfolio、Policies、Actions、Evidence，使用户直接完成判断，而不是浏览更多数据卡片。
- **输入**：已验证的 Core selectors/DTO，不在页面重算领域规则。
- **输出**：今日纪律体检、当前/目标/偏离、规则支持状态、处置/执行时间线、Policy Evidence 和 unknown 恢复路径。
- **源码范围**：`src/views/investment/ConsoleView.vue`、`PortfolioView.vue`、`PoliciesView.vue`、`ActionsView.vue`、`EvidenceView.vue` 及必要展示组件。
- **Mock**：所有与当前切片相关的 fixture；P0 页面不提前展示 P1/P2 为已运行。
- **独立 Oracle**：页面文案/状态与 Core DTO 映射表；浏览器验收从 fixture 输入检查用户可回答的问题。
- **测试**：桌面和相关移动视口、空/partial/stale/failed、重载、无关键横向溢出、无误导性“系统正常”。
- **Agent B 依赖**：P0 完成后由 `B-REAL-001` 做授权真实 Chrome smoke test；失败按 Adapter/Core/UI 归属回传。
- **停止条件**：Core 尚未提供语义时不在 UI 临时推断；真实验证 BLOCKED 时明确标记未验证，不以 Mock 替代。
