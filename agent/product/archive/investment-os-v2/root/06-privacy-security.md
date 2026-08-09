# 06 隐私与安全

**来源**：PRD 第 6、14–15、32、34–41、60、64–65 节。**状态**：P0 安全边界。

## Local-first

第一阶段私人投资数据只在用户浏览器、本地下载文件和本地 Ledger 中处理与保存；不上传真实账户数据、不建设远程账户数据库、不做远程埋点。GitHub Pages 静态站点不承担后端账户服务。

## 扩展禁止事项

- 不保存密码、Cookie、登录状态或银行卡信息。
- 不读取 `document.cookie`，不申请 cookies 权限，不读取认证请求头中的令牌。
- 不后台无限采集，不自动买卖，不生成投资推荐。
- 只获取支持现有判断的最小数据；未实际加载的范围不得伪造成已采集。
- Raw Snapshot 仅用于本地备份、调试、迁移和必要的 Adapter 定位，不进入普通流程。

## 数据分层

```text
Source Raw Data → Adapter → Normalized Fact → Inference → Decision
```

Fact、Inference、Suggestion 必须分开保存和展示。真实平台原始字段不能直接进入业务页面；数据不完整时必须标明覆盖范围和分析影响。

## Mock 与 Git

Mock 必须完全人工构造，真实时间、金额、基金组合、交易组合不能被反推。真实账户 HTML、接口响应、Raw Snapshot、个人资产金额、收益、持仓、交易流水、Cookie、Token 和账号态不得进入 Git。动态生成 JSON、ZIP、日志和临时验证输出也不属于 `agent/`。

## 双 Agent 隔离

Agent A 只能使用 Mock、脱敏结果、协议和项目源码；禁止访问真实资产、原始快照、Cookie、登录状态和未脱敏响应。Agent B 只处理真实平台适配和小范围验证，输出固定摘要格式，不输出可识别个人的原始资料。
