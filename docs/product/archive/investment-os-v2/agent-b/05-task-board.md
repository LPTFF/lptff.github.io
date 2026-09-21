# Agent B 任务板

**安全边界**：只在用户明确授权的真实环境、单一来源能力和只读验证目标内执行。禁止输出/保存真实基金名称、金额、收益、可组合识别个人的日期金额、Raw JSON/HTML、Cookie、Token、银行卡、登录状态或完整 Network Logs；禁止申购、赎回、买卖、撤单、转账或修改账户。

**职责边界**：Agent B 证明来源事实的字段语义、时点、Coverage 和状态，不设计 Core 规则，不设定风险预算，不判断仓位/减仓是否合适。固定输出模板见 [真实场景矩阵](02-real-scenario-matrix.md)。任务状态初始均为“待授权/待开始”。

## 任务总表

| ID | 优先级 | 单一目标 | 状态 | Agent A 消费方 |
| --- | --- | --- | --- | --- |
| `B-FIELD-001` | P0 | 仓位与现金护栏字段语义 | 待授权/待开始 | `A-DISC-002` |
| `B-NAV-001` | P1 前置 | 日净值历史与 basis 语义 | 待授权/待开始 | `A-STOP-001` |
| `B-TX-001` | P0/P1 前置 | 交易申请与确认状态语义 | 待授权/待开始 | `A-DISC-003`、`A-REDUCE-001` |
| `B-SNAPSHOT-001` | P0/P1 前置 | 交易与前后快照可关联性 | 待授权/待开始 | `A-DISC-003`、`A-REDUCE-001` |
| `B-REAL-001` | P0 验收 | 操作纪律复核只读 smoke test | 待授权/待开始 | `A-UI-001` |

> 若一个任务实际涉及多个 endpoint，可在同一来源能力内逐个执行并分别报告；不得把多个目标合成一次宽泛网络采集。

---

## `B-FIELD-001`：仓位与现金护栏字段语义

- **单一目标**：确认 Core 计算单基金、总风险资产和现金底线所需账户/持仓字段是否存在且语义可靠。
- **授权范围**：用户授权的真实 Chrome 中，持仓/账户只读页面及其已发出的目标业务接口；不导出账户内容。
- **观察字段**：稳定资产标识、持有/可用份额、市值、总资产/净资产/可投资资产、现金/余额/可用资金、估值日期、快照时间、币种/单位。
- **验证**：字段 present/absent/conditional；分母口径；待确认资金/份额是否包含；空值和零值；接口时间与估值日期。
- **输出**：PASS/FAIL/BLOCKED、字段级语义、Coverage、unknown、Required change、Sensitive data exposed。
- **Agent A 影响**：更新 Shared mapping 和 `position-breach`/`cash-floor` fixture 语义，不回传真实值。
- **停止条件**：出现凭据/银行卡/非目标敏感内容；需要修改账户；字段只能通过猜测推导；授权范围外跳转。

## `B-NAV-001`：日净值历史与 basis 语义

- **单一目标**：确认移动止损所需日净值历史是否具有可比较 basis、足够范围和明确新鲜度。
- **授权范围**：用户授权的真实 Chrome 中，一个已加载的净值历史来源能力；不选择或输出基金身份。
- **观察字段**：净值日期、单位/累计净值、历史范围、分页、最新日期、缺口、分红/拆分/再投资/复权语义、修订和重复记录。
- **验证**：序列顺序和日期；basis 是否能跨分红比较；最新日期与接口时间；历史加载上限；不同基金类型的条件性。
- **输出**：PASS/FAIL/BLOCKED、basis 结论、Coverage、新鲜度、unknown、Required change。
- **Agent A 影响**：决定 `A-STOP-001` 可接入的 Shared 字段和必须保留的 unknown 路径；不由 B 计算止损。
- **停止条件**：需要下载/保存原始全量响应；basis 无法证明；页面要求进行账户操作；出现授权外敏感信息。

## `B-TX-001`：交易申请与确认状态语义

- **单一目标**：确认现有历史交易能否区分申请、部分确认、确认、失败、撤销、费用和确认日期。
- **授权范围**：只读观察用户已存在的当前/历史交易来源能力；绝不创建或修改交易。
- **观察字段**：sourceTransactionId、方向、申请金额/份额与时间、确认金额/份额/净值/日期、费用、状态、分页和状态更新。
- **验证**：当前与历史记录重叠；申请量与确认量是否独立；状态枚举；稳定键；失败/撤销/部分确认若未实际观察则如实标记未验证。
- **输出**：PASS/FAIL/BLOCKED、字段/状态 mapping、Coverage、unknown、Required change。
- **Agent A 影响**：为 `A-DISC-003` 和 `A-REDUCE-001` 提供抽象状态语义；fixture 由 A 人工构造。
- **停止条件**：任何需要提交/撤销交易的步骤；无法在不暴露真实交易内容下形成结论；稳定键或状态只能猜测。

## `B-SNAPSHOT-001`：交易与前后快照可关联性

- **单一目标**：验证持仓快照能否可靠关联到已存在交易的操作前/后状态。
- **授权范围**：只读使用 `B-FIELD-001` 与 `B-TX-001` 已确认的字段能力；不扩大来源范围。
- **观察字段**：稳定交易标识、申请/确认时间、快照时间、待确认份额/资金、同一资产多笔交易消歧。
- **验证**：是否存在可靠关联键；时间邻近的歧义；部分确认后的快照语义；没有操作前快照时的 Coverage。
- **输出**：reliable/partial/BLOCKED（映射至 PASS/FAIL/BLOCKED）、歧义、Coverage、Required change。
- **Agent A 影响**：决定 OperationReview 可自动关联还是必须等待用户确认/保持 unknown。
- **停止条件**：只能通过真实值人工比对猜测；需要保存原始记录；多笔交易无法消歧。

## `B-REAL-001`：P0 操作纪律复核只读 smoke test

- **单一目标**：在用户明确授权的真实 Chrome 中验证 P0 的“同步 → 可判断性 → 偏离/unknown → 处置表示 → 重载”只读闭环是否与真实来源语义一致。
- **前置依赖**：`A-DISC-001/002/003`、P0 部分的 `A-UI-001` 完成；`B-FIELD-001`、`B-TX-001`、`B-SNAPSHOT-001` 已有结论。
- **授权范围**：真实已登录 Chrome；仅触发已有同步和本地 UI 操作，不创建第三方交易，不修改真实账户。
- **验证步骤**：
  1. 同步后来源、时间和 Coverage 是否正确；
  2. Core 只在已确认字段范围内给出 pass/violation，其他为 unknown/partial；
  3. Action 展示的规则版本和事实范围可追溯；
  4. 本地处置原因/计划动作保存后重载仍存在；
  5. 页面和日志没有泄漏敏感数据。
- **输出**：每一步 PASS/FAIL/BLOCKED、归属（Adapter/Core/UI）、Required change、Sensitive data exposed；不输出真实业务值。
- **Agent A 影响**：Adapter 问题由 B 在授权范围修复后复验；Core/UI 问题回传 `A-UI-001` 或对应 A 任务。
- **停止条件**：需要交易、需要扩大授权、发现敏感数据将被记录/输出、真实 Chrome 无法接管。隔离 profile 成功不得替代 BLOCKED 的真实验收。

## 固定回传要求

每项任务完成或阻塞时必须包含：

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

原始网络材料只在用户授权的浏览器会话中临时观察，不复制到仓库、任务板、日志摘要或 fixture。
