# Agent B 任务板

**安全边界**：只在用户明确授权的真实环境、单一来源能力和只读目标内执行。禁止输出/保存真实基金名称、金额、收益、可组合识别个人的日期金额、Raw JSON/HTML、Cookie、Token、银行卡信息、登录状态或完整 Network Logs；禁止任何账户操作。

**职责边界**：B 证明来源字段语义、时点、Coverage、状态和可关联性；不计算绩效，不设计 Core 规则，不评价决策、仓位或减仓。初始状态均为“待授权/待开始”。

## 总表

| ID | 阶段 | 单一目标 | Agent A 消费方 | 状态 |
| --- | --- | --- | --- | --- |
| `B-POSITION-001` | P0 | Position、现金与估值时点语义 | A-FOUND、A-MEAS | 待授权/待开始 |
| `B-CASHFLOW-001` | P0 | 申请/确认、CashFlow、费用和分红语义 | A-MEAS、A-EXEC | 待授权/待开始 |
| `B-NAV-001` | P0/P1 | Fund NAV basis、历史 Coverage 与修订 | A-MEAS、A-RISK、A-JOURNAL | 待授权/待开始 |
| `B-BENCH-001` | P0 | Benchmark date/currency/return type/source/许可 | A-BENCH、A-ATTR | 待授权/待开始 |
| `B-LINK-001` | P1 | Decision/Transaction/Snapshot 可关联性 | A-EXEC、A-APPRAISE | 待授权/待开始 |
| `B-REAL-MEAS-001` | P0 验收 | 真实 Chrome 中 Measurement 输入 readiness 脱敏 smoke test | A-MEAS/BENCH/RISK/REVIEW | 待授权/待开始 |

若同一能力涉及多个 endpoint，应逐个执行和分别报告；不得合并成宽泛网络采集。

## 任务规格

### `B-POSITION-001` — Position / Cash

- **目标**：确认持仓、现金及等价物、总资产口径、币种、估值日期和快照时间是否可靠；
- **范围**：授权真实 Chrome 中的账户/持仓只读能力及页面已发出的目标接口；
- **观察**：稳定标识、持有/可用/冻结/待确认份额、市值、现金、总资产/净资产/可投资资产、NAV date、snapshot time；
- **输出**：presence、单位/包含项、as-of、Coverage、unknown、Required change；
- **停止**：需要猜分母、查看授权外信息、保存真实值或执行账户动作。

### `B-CASHFLOW-001` — Transaction / CashFlow

- **目标**：确认申请、部分确认、确认、失败、撤销、外部现金流、费用、税、退款和分红语义；
- **范围**：只读观察已存在记录，绝不创建/修改交易；
- **观察**：稳定 ID、方向、申请/确认日期与字段分离、状态更新、分页、外部/内部现金流分类；
- **输出**：状态/方向 mapping、Coverage、未观察枚举、unknown、Required change；
- **停止**：需要实际交易制造状态，或无法在不暴露真实记录下形成结论。

### `B-NAV-001` — Fund NAV

- **目标**：确认单位/累计/复权 basis、币种、日期、范围、缺口、新鲜度、分红/拆分/修订；
- **范围**：一个已授权、已加载的 NAV 来源能力，不输出基金身份；
- **输出**：basis、时间语义、Coverage、conditional types、PASS/FAIL/BLOCKED；
- **停止**：需要保存全量响应、basis 无法证明或需要账户操作；
- **边界**：B 不计算 return、drawdown 或 stop line。

### `B-BENCH-001` — Benchmark 来源

- **目标**：确认事前 BenchmarkVersion 所需历史数据是否有可靠 source、date、currency、price/total return、frequency、revision 和许可；
- **范围**：当前明确授权来源；若不含 benchmark，不自动扩展；
- **输出**：available/absent/conditional、Coverage、return type、许可/缓存限制、Required change；
- **停止**：只能根据名称猜指标、需要未授权来源、口径不明或需保存受限原始数据；
- **阻断处理**：返回 `BLOCKED`，建议 alternative authorized source、user import 或 product downgrade，不替换 benchmark。

### `B-LINK-001` — Record linking

- **目标**：验证 Decision/Transaction/PositionSnapshot 是否能通过稳定 ID/时间/状态建立可靠关联；
- **范围**：只消费前述任务已确认字段能力，不扩大来源；DecisionRecord 为本地对象，B 不读取其敏感正文；
- **输出**：reliable/partial/blocked、歧义类别、Coverage、Required change；
- **停止**：必须通过真实金额人工比对、需保存原始记录或多笔交易无法消歧。

### `B-REAL-MEAS-001` — P0 real-environment smoke test

- **前置**：A-FOUND/MEAS/BENCH/RISK 的 P0 slice 已完成；B-POSITION/CASHFLOW/NAV/BENCH 有结论；
- **目标**：在用户明确授权真实 Chrome 中验证“同步 → normalized facts → Coverage → measurement readiness → reload”的来源语义与隐私边界；
- **检查**：来源/时间/范围显示，缺口降级，benchmark readiness，历史版本引用，页面/日志无敏感数据；
- **不检查**：不由 B 复算 TWR/XIRR/Excess 或评价决策；数学 Oracle 属于 A；
- **输出**：逐步 PASS/FAIL/BLOCKED、Adapter/Core/UI 归属、Required change、Sensitive data exposed；
- **停止**：需要交易、扩大授权、敏感数据将被记录或真实 Chrome 无法接管。隔离 profile 成功不能替代 BLOCKED。

## 固定回传

```text
Task
Authorization
Environment
Result: PASS | FAIL | BLOCKED
Target capability
Field semantics
Coverage
Unknown
Required change
Sensitive data exposed
Stopped because
Agent A dependency impact
```

原始网络材料只在授权浏览器会话临时观察，不复制到仓库、任务板、日志摘要或 fixture。

## 旧任务映射（不再生效）

| 旧 ID | 状态 | 当前去向 |
| --- | --- | --- |
| `B-FIELD-001` | superseded | `B-POSITION-001` |
| `B-TX-001` | superseded | `B-CASHFLOW-001` |
| `B-SNAPSHOT-001` | superseded | `B-LINK-001` |
| `B-NAV-001` | retained/expanded | 同 ID，范围升级为 P0 Measurement + P1 rule basis |
| `B-REAL-001` | superseded | `B-REAL-MEAS-001` |

旧规格保存在 [archive](../archive/investment-os-v2/agent-b/05-task-board.md)，不得继续领取。
