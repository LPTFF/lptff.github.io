# 09 需求追踪矩阵

**来源**：PRD 第 42–51、61–66 节；实现路径为当前仓库观察结果。**状态**：初始矩阵，需求完成度需按验证结果更新。

| 需求 | 当前实现/入口 | 验证 |
| --- | --- | --- |
| 基金协议导入与归一化 | `src/views/investment/FundImport.vue`、`src/utils/fund/fund-parser.ts`、`project-support/public/fund/sample-fund-data.json` | `npm run typecheck`、`npm run build`、浏览器导入示例 |
| 基金资产/持仓/收益/交易/复盘 | `src/views/investment/`、`src/utils/fund/` | `/investment` 主流程、空数据和错误数据 |
| Investment 助手产品文案 | `src/views/investment/investment-assistant.md` 被 `FundImport.vue` `?raw` 导入 | 构建成功、导入页文档可见 |
| Chrome 扩展采集 | `project-support/extension/lptff-investment-assistant/` | 扩展脚本 `node --check`、真实登录下按授权范围 Smoke Test |
| 扩展 ZIP 下载/发布 | `vite.config.ts`、`project-support/scripts/extension/build-zip.js`、`.github/workflows/ci.yml` | `node project-support/scripts/extension/build-zip.js`、ZIP 结构检查 |
| 面试摘要同步 | `project-support/scripts/sync-findJob-summary.js`、`src/views/home/findJob/`、`project-support/public/findJob-summary/` | `npm run serve`、`npm run build` |
| 404 构建产物 | `project-support/scripts/copy-404.js` | 检查 `dist/404.html` |
| RSS 采集 | `project-support/scripts/collectors/`、`src/views/Message/NewsArticle.vue`、`project-support/public/data/` | `npm run test:collectors`、fixture/site 构建后页面请求 |
| Data Coverage / 增量同步 / IndexedDB Ledger | PRD 规划；需先检查 `src/investment/` 是否已落地 | Mock、typecheck、build、边界场景和真实验证 |
| Exposure / Policy / Behavior / Evidence | PRD 后续规划 | 按对应 Epic 建立实现和测试后再标记完成 |

## 状态规则

- **已存在**不代表已满足 PRD 的全部 V2 验收条件。
- **规划**不得在页面、记录或 Agent 反馈中写成已实现。
- 真实平台字段不足时标记 BLOCKED，不使用猜测数据补齐。
- 每次更新矩阵只记录能帮助未来判断的事实、证据和遗留限制，不复制代码实现。
