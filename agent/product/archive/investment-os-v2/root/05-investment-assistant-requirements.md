# 05 投资助手需求

**来源**：PRD 第 7–15、30–37 节；当前实现参考 `src/views/investment/investment-assistant.md`。**状态**：真实采集基线 + V2 规划，需以源码和验证结果为准。

## 角色

Chrome Extension 是 Investment Sensor，只获取真实投资事实；Investment 页面和 Ledger 负责解析、保存、分析和判断。扩展不能推荐、交易或替用户做策略决定。

## 数据链路

```text
天天基金 → Eastmoney Adapter → Investment Protocol → 本地 Ledger → Core → Investment Web App
```

协议核心实体包括 Account、Holdings、Daily Profit、Transaction、Raw Snapshot 和 Collection Warning。当前仓库已有 `fund-data` 协议和用户主动导入路径；V2 规划进一步引入标准化 Adapter、DataCoverage 和 IndexedDB Ledger。

## Sensor 需求

- 识别支持页面及状态：unsupported、ready、loading、authentication_required、error。
- 默认增量同步，而不是每次全量采集。
- DailyPnL 以 `fundCode + date` 去重；Transaction 优先 `sourceTransactionId`，没有时使用日期、基金、类型、金额、状态构成 fallback fingerprint。
- 明确记录账户、持仓、每日盈亏、交易历史和基金详情的覆盖范围；部分加载不能标记 complete。
- 需要历史分析时，由 Web App 发出 NeedDataRequest，扩展再提示用户补充，不能后台无限采集。

## 同步与备份

正常路径规划为 Extension Storage → Investment Web App → IndexedDB；网页未打开时进入 staging DB。JSON 文件保留为备份、Debug、迁移和手工导入。Raw Snapshot 不进入普通产品流程。

## 当前运行时边界

`project-support/extension/lptff-investment-assistant/` 是项目功能；`project-support/scripts/extension/build-zip.js` 是本地下载和 Release 打包链路；二者不能搬入 `agent/`。`src/views/investment/investment-assistant.md` 虽是 Markdown，但被 `FundImport.vue` 以 `?raw` 编译进用户可见页面，必须留在运行时可读路径。

## 验收重点

正常账户可识别；两次同步不重复交易或 DailyPnL；部分覆盖可见；失败、未登录、空数据可用；用户无需处理原始 JSON；导出可用；不保存密码/Cookie、不新增远程服务器、不后台无限采集。真实验证不得把 Raw Snapshot、账号态或个人资产数据提交到 Git。
