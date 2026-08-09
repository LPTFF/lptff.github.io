# 真实验证协议

每次验证前写明：接口、场景、目标、授权范围、预期字段和停止条件。执行后只输出脱敏摘要：

```text
状态：PASS / FAIL / BLOCKED
接口：脱敏标识
场景：正常 / 空 / 失败 / 分页 / 重复 / Drift
目标：
缺少字段：
未知状态：
Required change：
Sensitive data exposed：否 / 是（立即停止并清理）
Coverage：
Agent A 依赖：
```

禁止把原始 HTML、JSON、Cookie、Token、银行卡、基金名称、金额、收益、完整 Network Log 或截图带入仓库和 Agent 工作台。未授权、登录失效或无法安全脱敏时必须 BLOCKED。
