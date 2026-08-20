# 真实场景矩阵

**执行边界**：所有场景需要用户对本次来源能力、页面/接口和环境的明确授权。真实已登录 Chrome 是目标时，隔离 profile 不能替代。禁止通过创建或修改真实交易制造测试状态。

## 场景

| 场景 ID | 单一观察目标 | 当前任务 | 脱敏输出 |
| --- | --- | --- | --- |
| `real-position-cash` | Position、现金、估值和时点语义 | `B-POSITION-001` | presence、单位/口径、as-of、Coverage |
| `real-cashflow-status` | 申请/确认、外部现金流、费用/分红语义 | `B-CASHFLOW-001` | 状态/方向 mapping、Coverage、unknown |
| `real-nav-history` | Fund NAV basis、历史范围、新鲜度和修订 | `B-NAV-001` | basis、范围、缺口、PASS/BLOCKED |
| `real-benchmark-history` | Benchmark return type、币种、日期、许可和范围 | `B-BENCH-001` | 来源能力、Coverage、Required change |
| `real-record-link` | Decision/Transaction/Snapshot 可关联性 | `B-LINK-001` | reliable/partial/blocked、歧义 |
| `real-p0-measurement` | P0 只读同步和计算输入 readiness | `B-REAL-MEAS-001` | 步骤 PASS/FAIL/BLOCKED、归属、敏感泄漏类别 |

## 通用来源状态

每个能力还需考虑：正常授权、授权失效、空结果、接口失败/超时、分页/历史范围、重复同步和 Schema Drift。空结果不能自动当失败，登录失效不能当空账户。

## 专项限制

### Position / Cash

- 缺独立现金字段只报告 absent/conditional；
- 总资产、净资产、可投资资产分别说明，不回传真实值；
- NAV 日期、估值日期与接口时间分开；
- 不从页面汇总数字反推来源没有提供的字段。

### CashFlow / Transaction

- 只观察已存在历史事实，不提交、撤销或修改交易；
- 真实金额、份额、费用和值不出现在输出；
- 未观察到 partial/failed/cancelled 实例时，不能因枚举存在声称完整 PASS；
- 无法区分 external cash flow 和 internal trade 时阻断 TWR/MWR 对应语义。

### NAV

- 不选择或输出具体基金来制造特定走势；
- B 不计算 stop line、drawdown 或 return；
- 分红/复权 basis 无法证明时返回 BLOCKED。

### Benchmark

- 不事后选择最有利 benchmark；
- 不在当前来源时明确 BLOCKED，不擅自扩大到其他服务；
- price/total return、币种、期间或许可不明时不标 PASS；
- 不下载或保存未经授权的全量历史数据。

### Linking

- 时间邻近不等于因果；
- 多笔相近交易无稳定 ID 时 partial/BLOCKED；
- 无可靠关联时要求 Agent A 保持 unknown 或等待用户确认。

### P0 smoke test

- 只验证事实进入系统后的来源、Coverage、时点、比较 readiness 和敏感数据边界；
- B 不复算或判定 TWR/XIRR/Excess 是否数学正确，该 Oracle 属于 Agent A；
- 不验证 P1–P4 的投资评价，不执行交易。

## 固定结果

```text
Task: B-...
Authorization: authorized | not-authorized
Environment: real Chrome | other
Result: PASS | FAIL | BLOCKED
Target capability: <one capability>
Field semantics:
  - <Shared field>: present | absent | conditional | unknown; <redacted meaning>
Coverage: <range/completeness only>
Unknown: <what cannot be established>
Required change: <Adapter | Shared | Agent A | alternative source | product downgrade>
Sensitive data exposed: no | yes (<category only>)
Stopped because: <condition | none>
Agent A dependency impact: <task IDs and capability only>
```

任何输出包含真实基金名称、金额、收益、原始响应、凭据、登录状态或完整网络材料，都视为验收失败并立即停止。
