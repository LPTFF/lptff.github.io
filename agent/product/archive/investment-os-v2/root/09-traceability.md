# 09 需求追踪矩阵

**核验日期**：2026-08-09。
**依据**：当前源码优先于旧 PRD；“局部实现”表示存在相关代码，不表示已满足业务闭环或真实验收。

## 当前实现事实

| 能力 | 状态 | 当前实现/入口 | 已知边界与下一缺口 |
| --- | --- | --- | --- |
| Investment 主路由 | 已实现 | `src/router/index.js`、`src/views/investment/OSLayout.vue` | Console/Portfolio/Policies/Actions/Data/Evidence 路由存在；页面存在不等于目标任务完成 |
| Extension → Staging → Ledger | 局部实现 | `project-support/extension/lptff-investment-assistant/`、`src/investment/composables/use-investment-os.ts`、`src/investment/ledger/repository.ts` | 仍需逐字段验证时间语义、历史范围和真实确认状态 |
| 标准化事实与 Coverage | 局部实现 | `src/investment/domain/types.ts`、`src/views/investment/DataView.vue` | 已显式处理来源、范围和缺口；纪律判断所需 cash/NAV/确认语义尚需验证 |
| 本地 IndexedDB Ledger | 局部实现 | `src/investment/ledger/repository.ts` | 可存事实、Policy、Action 等；尚无完整 InvestmentPlan、OperationReview、语义 ActionResolution 状态机 |
| 组合与底层暴露 | 局部实现 | `src/investment/engines/exposure/`、`src/investment/composables/selectors.ts`、`src/views/investment/PortfolioView.vue` | 能展示部分指数/地区/主题等聚合；缺目标区间、现金/风险资产护栏、操作前后模拟和偏离归因 |
| Policy 与版本 | 局部实现 | `src/investment/domain/types.ts`、`src/investment/engines/policy/policy.ts`、`src/views/investment/PoliciesView.vue` | 版本不可变基础已存在；当前评估主要检查最大暴露，target/min 和其他规则未形成完整执行语义 |
| Behavior | 局部实现 | `src/investment/engines/behavior/behavior.ts` | 能识别部分定投/主动交易；异常主要指相对基线异常大的主动买入，不是 Policy-relative 操作异常 |
| Action | 局部实现 | `src/views/investment/ActionsView.vue`、`src/investment/composables/use-investment-os.ts`、`src/investment/ledger/repository.ts` | 当前主要更新 open/resolved/ignored 状态；UI 选择的原因、计划动作、真实执行和结果没有完整持久化 |
| Evidence | 局部实现 | `src/views/investment/EvidenceView.vue`、`src/investment/composables/selectors.ts` | 当前主要汇总交易、买入、DailyPnL、规则与异常数量；不是按 PolicyVersion 的现金流调整证据 |
| 最大回撤 | 简化实现 | `src/investment/composables/selectors.ts` | 由 DailyPnL 金额累计计算，未处理现金流、组合 NAV 和变化的资本基数，不能标为专业组合百分比最大回撤 |
| 操作纪律复核 | 未实现 | 规划见 [05 投资纪律需求](05-investment-discipline-requirements.md) | 缺事前计划、完整风险预算、计划—实际对照、处置/执行/结果闭环 |
| 移动止损 | 未实现 | 规划任务 `A-STOP-001` / `B-NAV-001` | 缺高水位状态、只上移不变量和可靠净值/分红语义 |
| 目标区间减仓 | 未实现 | 规划任务 `A-REDUCE-001` / `B-TX-001` | 缺计划量计算、申请/部分确认/结果复核 |
| Policy Evidence 与归因 | 未实现 | 规划任务 `A-EVID-001` | 缺规则内外/计划内外/版本比较、现金流调整绩效、基准和归因 |

## P0/P1/P2 追踪

| 需求 | Agent A | Agent B | Shared/Oracle | 完成证据 |
| --- | --- | --- | --- | --- |
| P0 领域契约与 Ledger migration | `A-DISC-001` | 字段结论作为后续输入 | `shared/00-domain-contracts.md`、migration round-trip | 源码、migration test、fixture、重载证据 |
| P0 仓位/现金/暴露护栏 | `A-DISC-002` | `B-FIELD-001` | 独立手算 current/after-state | 单元/属性测试、字段语义结论、页面追溯 |
| P0 Action 处置闭环 | `A-DISC-003` | `B-TX-001`、`B-SNAPSHOT-001` | 状态机和不可覆盖事前事实 | 重载、部分确认、失败和操作后恢复案例 |
| P0 真实 smoke test | `A-UI-001` 提供流程 | `B-REAL-001` | 脱敏 PASS/FAIL/BLOCKED | 用户授权的真实 Chrome 结论；隔离 profile 不可替代 |
| P1 移动止损 | `A-STOP-001` | `B-NAV-001` | 止损线单调不降属性 | NAV 语义通过、序列属性测试、stale/partial 路径 |
| P1 减仓计划 | `A-REDUCE-001` | `B-TX-001`、`B-SNAPSHOT-001` | 目标区间与部分确认手算 | 计划模拟、确认关联、剩余偏离复核 |
| P2 Policy Evidence | `A-EVID-001` | 来源字段按缺口追加单目标任务 | 现金流与风险指标独立 Oracle | 足够历史 Coverage、版本样本和可重算指标 |

## 已有其他项目入口

| 能力 | 当前实现/入口 | 验证边界 |
| --- | --- | --- |
| Legacy 基金导入与页面 | `src/views/investment/legacy/`、`src/utils/fund/` | 与 Investment OS 主路由分别核验；旧页面存在不证明新闭环完成 |
| Investment 助手文案 | `src/views/investment/investment-assistant.md` | 构建可见性不证明真实来源字段正确 |
| 扩展 ZIP 构建/发布 | `vite.config.ts`、`project-support/scripts/extension/build-zip.js`、`.github/workflows/ci.yml` | 构建与 ZIP 结构不替代授权真实数据验证 |

## 状态规则

- **已实现**：源码存在且该限定能力有匹配的验证证据；不自动扩展到更高层业务结论。
- **局部实现**：存在基础结构或部分路径，但缺少业务语义、边界、Oracle 或闭环。
- **未实现**：只有 PRD/任务，或当前代码不能完成该判断。
- 规划、Mock、HTTP 成功、字段存在和 UI 文案都不得单独标为完成。
- 真实平台字段不足时标记 BLOCKED/unknown，不使用猜测数据补齐。
- 每次更新只记录能帮助未来判断的事实、证据和遗留限制。
