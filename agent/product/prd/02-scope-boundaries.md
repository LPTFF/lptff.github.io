# 02 产品范围与边界

**来源**：PRD 第 3、6、8、15、32–41、67 节。**状态**：P0 边界。

## 当前范围

- 天天基金作为第一真实数据源。
- Chrome Extension 作为 Investment Sensor，获取事实、识别覆盖缺口并写入标准协议。
- 本地 Investment Ledger 保存账户、持仓、交易、每日盈亏、Coverage、资产、规则、行动和证据。
- Investment Web App 展示控制台、组合、规则、行动、证据和数据健康。
- 第一阶段围绕基金闭环，先建立可信事实账本，再逐步增加 Exposure、Policy、Behavior 和 Evidence。

## 明确不做

当前阶段不做股票券商账户、Crypto 真实账户、银行资产、自动买卖基金、AI 自动交易、实时行情、大规模财经新闻采集、云端账号、多用户、社区和策略市场。基金闭环稳定后才评估扩展。

## 功能边界

扩展禁止负责投资推荐、策略判断、风险判断、AI 建议和自动交易；Web App 负责理解事实、形成规则、检查偏差和验证结果。JSON 继续作为备份、调试、迁移和手工导入，不是正常同步的唯一通道。

## 判断边界

数据必须分层：

```text
Source Raw Data → Adapter → Normalized Fact → Inference → Decision
```

Raw 平台字段不得直接进入业务页面；重复暴露只报告事实，不自动评价对错；数据缺口必须说明影响什么、不能支持什么，而不是笼统说“不完整”。

## 依赖边界

`agent/` 是维护工作台，不是运行时资源目录。`src/`、Vite、npm scripts、CI 和扩展不得 import 或执行 `agent/` 文件。实际运行功能和构建发布工具仍属于项目区，即使其目录名是 `extension/` 或 `scripts/`。
