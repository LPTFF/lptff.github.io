# Fixture 与 Test Matrix

Agent A 只使用人工构造、不可还原真实账户的 fixture。Agent B 的真实环境验证只产生字段级语义和脱敏结论，不产生可复制的真实 fixture。

## 基础场景

| fixture | Agent A Oracle | Agent B 对应语义 |
| --- | --- | --- |
| `normal` | 完整解析、Ledger merge、计算和页面下钻 | 授权环境接口成功、字段完整 |
| `empty` | 空组合/交易/Review 的合法状态 | 无持仓或无交易的字段形态 |
| `partial` | Coverage 降级，局部 metric 不越界发布 | 分页或历史范围不完整 |
| `stale` | 保留旧事实，停止依赖新鲜度的判断 | Position/NAV/benchmark 过旧 |
| `failed` | 保留账本，显示失败和恢复路径 | 网络/接口失败 |
| `unknown-schema` | 未知枚举/类型进入 unknown | Schema Drift 与 Required change |
| `complex` | 多基金、现金、多币种、多版本和未知元数据 | 字段能力与关联限制 |
| `large` | 分页、幂等、性能和稳定渲染 | 返回上限和分页结论 |

## P0 — Measurement

| fixture | 最小构造 | 独立 Oracle |
| --- | --- | --- |
| `no-cashflow-return` | 期初/期末估值，无外部现金流 | 手算 period return，TWR 与 MWR 可调和 |
| `external-flow-timing` | 价格路径固定，中途大额流入 | TWR 不因流入本身上升；MWR 按日期反映资金体验 |
| `irregular-cashflows` | 多次不规则日期流入/流出与终值 | 独立 XIRR residual 在容差内 |
| `cash-included-vs-omitted` | 同一路径，组合现金纳入/遗漏 | 遗漏结果不得发布为完整 Portfolio Return |
| `fee-included-vs-omitted` | 相同交易，不同费用口径 | gross/net 结果不同且 basis 可见 |
| `target-beat-benchmark-miss` | Target 达成但落后 Benchmark | Target completion = achieved；Excess < 0 |
| `benchmark-beat-target-miss` | 跑赢 Benchmark 但未达 Target | Excess > 0；Target completion = missed |
| `period-mismatch` | Portfolio 与 benchmark 日期不同 | `INSUFFICIENT_DATA`，不裁剪后偷偷比较 |
| `currency-mismatch` | 币种不同且无可信 FX | `INSUFFICIENT_DATA` |
| `return-type-mismatch` | portfolio total return vs benchmark price return | `INSUFFICIENT_DATA` |
| `benchmark-version-change` | 历史期绑定 v1，当前改 v2 | 历史结果仍使用 v1 |
| `eleven-month-period` | 精确 11 个月实绩 | 只显示期间收益，不年化 |
| `drawdown-curve` | 已知 peak/trough/recovery 的净值序列 | 手算 maximum drawdown 与 duration |
| `daily-pnl-not-drawdown` | 现金基数不同但累计 PnL 相同 | 不接受累计金额差作为百分比回撤 |

## P1 — Decision / Execution / Appraisal

| fixture | 最小构造 | 独立 Oracle |
| --- | --- | --- |
| `profitable-breach` | 事前规则上限 5%，确认 12%，结果盈利 | Process = BREACH；Outcome = POSITIVE；无 GOOD_DECISION |
| `compliant-loss` | 计划与规则均合规，结果亏损 | Process = COMPLIANT；Outcome = NEGATIVE；无 BAD_DECISION |
| `unplanned-operation` | Transaction 早于任何 Decision | unplanned；不允许事后伪造 Decision |
| `plan-execution-deviation` | 对象/方向/数量/时间至少一项偏离 | 每项 deviation 独立输出，与 Outcome 无关 |
| `partial-confirmation` | 请求量大于确认量 | 不 completed，保留 remaining amount |
| `failed-or-cancelled` | 申请后失败或撤销 | 不进入 confirmed/post-state verified |
| `policy-version-change` | 相同事实跨两个 Policy 阈值版本 | 历史 Appraisal 保留旧版本 |
| `decision-immutable` | 事后尝试覆盖 thesis/invalidation | 拒绝覆盖，只能追加 annotation |
| `stop-ratchet` | 创新高后回落、再创新高 | high-water mark 和 stop line 单调不降 |
| `stale-nav-stop` | 最新 NAV 超过 staleness | 不推进高水位，不生成确定性触发 |
| `partial-reduction` | 计划赎回大于确认赎回 | 按确认量重算剩余偏离 |
| `snapshot-unlinked` | 交易与前后快照关联歧义 | Execution/Appraisal 为 partial/unknown |

## P2 — Attribution / Behavior

| fixture | 最小构造 | 独立 Oracle |
| --- | --- | --- |
| `level1-reconciliation` | Fund、benchmark、cost、timing 和终值完整 | effects/contribution + residual 与总额在容差内调和 |
| `level2-complete` | 目标/实际分类权重和分类 benchmark 完整 | 手算 allocation/selection/interaction |
| `level2-missing-benchmark` | 缺一个分类 benchmark | Level 2 = `INSUFFICIENT_DATA`，回退 Level 1 |
| `attribution-residual` | 故意保留不可解释差 | residual 可见，不强制归零 |
| `disposition-sufficient` | 成本基础和足够 gain/loss opportunities | PGR/PLR 与样本手算一致 |
| `disposition-insufficient` | PGR > PLR 但低于样本门槛 | 不发布稳定 finding |
| `high-turnover-improved-excess` | turnover/cost 上升且 excess 显著改善 | 不仅因交易多标记 overtrading |
| `possible-overtrading` | turnover/cost 上升且无相应改善 | 输出 Possible + samples/limitations，不诊断人格 |
| `outcome-bias-evidence` | 结果已知后 annotation 反转过程描述 | 只显示时间与变更证据，不推测动机 |
| `strategy-drift` | 多次无 Decision 或 Rule breach | 区分单次例外与重复模式 |

## P3 — Strategy Hypothesis

| fixture | 最小构造 | 独立 Oracle |
| --- | --- | --- |
| `single-win` | 新假设仅一个正案例 | 不能升级 `SUPPORTED` |
| `single-loss` | 新假设仅一个负案例 | 不能升级 `CONTRADICTED` |
| `mixed-evidence` | 正、负和 unknown 案例 | 样本统计完整，unknown 不被丢弃 |
| `cherry-picked-sample` | 输入过滤掉已知负案例 | 验收失败 |
| `incomparable-cases` | 期间/benchmark/role 不可比 | `INSUFFICIENT_EVIDENCE` |
| `hypothesis-rule-boundary` | 假设达到 supported 门槛 | 只生成下一 Rule version draft，不自动发布 |

## P4 — AI Review

| fixture | 变形 | Oracle |
| --- | --- | --- |
| `same-facts-different-llm` | 同一 structured input，模型/措辞不同 | 所有 metric、Finding status、appraisal 不变 |
| `ai-disabled` | 关闭 AI | P0–P3 Review 仍可完成 |
| `missing-evidence-ref` | 删除关键引用 | 依赖结论降级或不生成 |
| `attribution-insufficient-ai` | Attribution 为不足 | 不得生成原因故事 |
| `ai-number-mismatch` | 模型复述数字与 metric 不同 | 拒绝发布该陈述 |
| `profitable-breach-narrative` | profitable breach 输入 | 同时保留 positive outcome 与 process breach |
| `compliant-loss-narrative` | compliant loss 输入 | 不得描述为 bad decision |

## 状态机覆盖

```text
Decision: draft → recorded → linked | unlinked → reviewed
Execution: requested → partially_confirmed | confirmed | failed | cancelled
Review: draft → data_ready | insufficient_data → calculated → appraised → closed
Hypothesis: UNTESTED → INSUFFICIENT_EVIDENCE | PRELIMINARY
            → SUPPORTED | CONTRADICTED
```

每个中间/终止状态检查 reload 后持久化。禁止用一条 happy path 代替状态机验证。

## 属性与变形关系

- 对相同 Transaction 批次重复导入，Ledger、现金流和 Review 关联不变；
- 在收益路径不变时加入外部现金流，TWR 不因流入本身变化；
- 改变 Outcome 正负，不改变既有 Process classification；
- 修改当前 Policy/Benchmark/Profile，不改变历史 Review；
- 向止损序列追加低于历史高点的合格值，stop line 不下降；
- 将全额确认改为部分确认，completed 变为进行中并出现 remaining；
- 移除 Attribution 所需字段，只能降级能力，不能由 AI 保持原结论；
- 更换 LLM，只能改变允许变化的 wording，不能改变确定性状态。

## Agent B 场景关联

P0 来源语义分别由 `B-POSITION-001`、`B-CASHFLOW-001`、`B-NAV-001`、`B-BENCH-001`、`B-LINK-001` 验证；端到端脱敏 smoke test 为 `B-REAL-MEAS-001`。B 只提供语义与 Coverage，不提供上述 expected 数值。

## 证据边界

- Agent A 保存人工 fixture、独立 expected、测试输出和页面证据；
- Agent B 只保存 `PASS/FAIL/BLOCKED`、字段存在性、Coverage、unknown、semantic mapping、Required change 与 Sensitive data exposed；
- 两者通过 fixture/scenario ID 和字段语义关联，不通过真实金额、基金名称、Raw Snapshot 或完整网络材料关联。
