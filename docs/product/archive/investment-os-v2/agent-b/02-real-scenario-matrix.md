# 真实场景矩阵

**执行边界**：所有场景都需要用户对本次来源能力和环境的明确授权。目标若是用户真实已登录 Chrome，隔离 profile 不能替代验收。禁止通过创建真实交易来制造测试状态。

## 基础来源场景

| 场景 | 单一观察目标 | 结果必须包含 |
| --- | --- | --- |
| 正常登录 | 目标接口的成功语义 | PASS/FAIL、字段存在性、Coverage、时间语义 |
| 未登录或授权失效 | 权限状态识别 | BLOCKED/FAIL、Required change；不得输出登录详情 |
| 空持仓/空交易 | 空结果不是失败 | PASS、空状态、Coverage 和判空依据 |
| 接口失败/超时 | 错误分类 | FAIL、unknown、可恢复边界；不清空旧事实 |
| 分页/历史范围 | 实际加载边界 | Coverage、已加载/未加载范围、分页终止条件 |
| 重复同步 | 稳定键和幂等输入 | 重复项语义、状态更新方式、Agent A 依赖 |
| 字段缺失/变化 | Schema Drift | 缺失字段、unknown、mapping Required change |

## 纪律专项来源场景

| 场景 ID | 场景 | 单一验证目标 | 对应任务 | 脱敏输出 |
| --- | --- | --- | --- | --- |
| `real-position-fields` | 正常持仓视图/接口 | 验证份额、市值、总资产/现金和快照时点语义 | `B-FIELD-001` | 字段 present/absent/conditional、单位、as-of、Coverage |
| `real-nav-history` | 单一支持基金的历史净值能力 | 验证日净值 basis、历史范围、新鲜度和分红/复权语义 | `B-NAV-001` | basis 结论、日期/范围、缺口、PASS/BLOCKED |
| `real-transaction-status` | 已存在的历史交易状态 | 验证申请与确认字段、部分/失败/撤销枚举和费用 | `B-TX-001` | 状态 mapping、字段存在性、Coverage；不输出交易内容 |
| `real-snapshot-link` | 已存在交易与快照 | 验证稳定键/时序能否支持前后关联 | `B-SNAPSHOT-001` | reliable/partial/blocked、歧义、Required change |
| `real-p0-review` | P0 操作复核只读流程 | 验证同步→偏离/unknown→处置表示的真实可用性 | `B-REAL-001` | PASS/FAIL/BLOCKED、受影响步骤、Sensitive data exposed |

## 场景限制

### Position / Cash

- 若账户没有独立现金字段，只能验证 absent/conditional，不得以真实金额计算后回传。
- 总资产、净资产、可投资资产口径必须分别标记；无法判定分母时 BLOCKED。
- 持仓接口时间与估值日期不同必须分别记录语义。

### NAV

- 不为制造 stop-triggered 场景选择或输出具体真实基金。
- 只验证来源序列语义，不在 Agent B 判断止损线或应否赎回。
- 分红/复权无法证明时返回 BLOCKED，不由 B 自行处理序列。

### Transaction

- 只观察已存在历史事实，不提交、撤销或修改真实交易。
- 申请金额、确认金额、份额、费用和状态只报告字段语义，不报告真实值。
- 来源不含部分确认实例时可报告“枚举/字段存在但真实场景未观察”，不能声称完整 PASS。

### Snapshot association

- 时间邻近不自动证明因果关联。
- 同一基金有多笔接近交易而无稳定标识时返回 partial/BLOCKED。
- 不能可靠关联时要求 Agent A 的 OperationReview 保持 unknown。

## 固定结果模板

```text
Task: B-...
Authorization: authorized / not-authorized
Environment: real Chrome / other (cannot substitute when real Chrome required)
Result: PASS | FAIL | BLOCKED
Target capability: <one capability>
Field semantics:
  - <Shared field>: present | absent | conditional | unknown; <redacted meaning>
Coverage: <range/completeness only>
Unknown: <what cannot be established>
Required change: <Adapter | Shared | Agent A | product downgrade>
Sensitive data exposed: no | yes (category only, no value)
Stopped because: <condition or none>
```

任何输出如包含真实基金名称、金额、收益、原始响应、凭据、登录状态或完整网络材料，都视为验收失败并立即停止。
