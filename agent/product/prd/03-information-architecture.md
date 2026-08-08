# 03 信息架构

**来源**：PRD 第 16–30 节。**状态**：规划基线与现有 Investment 页面映射。

## 主导航

```text
投资
├── 控制台       /investment
├── 组合         /investment/portfolio
├── 规则         /investment/policies
├── 行动         /investment/actions
├── 证据         /investment/evidence
└── 数据         /investment/data
```

其中控制台、规则、行动、证据和 Data Center 是 PRD 的目标信息架构；当前仓库已经存在的基金导入、Dashboard、Holding、Performance、Transaction、Review 页面，应通过 [09-traceability.md](09-traceability.md) 与目标架构逐项对照，不能把规划路由当成已实现路由。

## 页面职责

- **控制台**：10 秒内回答投资系统是否正常、是否需要做事；显示账户指标、最大风险摘要、Action 数量和最近变化。
- **组合**：回答资金实际承担什么风险；展示账户、持仓、资产元数据、指数/地区/资产类型/币种/主题暴露和重复暴露。
- **规则**：将投资方法转换为可运行、可版本化和可验证的 Policy。
- **行动**：系统唯一集中用户主动处理投资判断的地方，包含规则触发、风险复核、未知/异常交易和数据请求。
- **证据**：按 Policy 和行为展示长期表现、对比结果与 Evidence Strength。
- **数据**：明确系统知道什么、不知道什么、覆盖到哪里，以及数据缺口对分析的影响。

## 现有网站关系

仓库同时包含首页、博客、求职/面试资料、资讯、基金分析和其他个人工具页面。Investment 是其中的业务域，不应通过 PRD 资料改变其他页面的运行时路径。产品资料留在 `agent/product/prd/`，页面和运行时内容仍留在 `src/`、`public/` 与扩展目录。

## 默认首页状态

优先展示“系统正常、当前无需操作”，而不是制造机会或提示用户频繁打开。异常才进入 Action，并提供事实、规则和可选处理方式。
