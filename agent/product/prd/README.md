# Investment OS PRD 工作台

## 来源与使用边界

- 来源：维护者提供的《LPTFF Investment OS 产品需求文档（PRD）》。
- 原文归档：[`source/LPTFF-Investment-OS-PRD.md`](source/LPTFF-Investment-OS-PRD.md)。
- 本目录只服务产品规划、Agent 协作和验收，不被 Vite、npm、CI 或浏览器运行时代码读取。
- 当前实现事实、产品判断和后续规划分开记录；规划不能冒充已交付能力。

## 总览

- [00-product-brief.md](00-product-brief.md)：产品目标和核心闭环。
- [01-scope-and-principles.md](01-scope-and-principles.md)：范围、原则和不做事项。
- [02-system-map.md](02-system-map.md)：系统边界、数据流和依赖方向。
- [shared/](shared/)：A/B 共同遵守的领域契约、数据协议、验收标准和测试矩阵。
- [agent-a/](agent-a/)：Agent A 的 Core、Mock、Ledger、Web 和产品能力工作台。
- [agent-b/](agent-b/)：Agent B 的 Eastmoney 适配和真实环境验证工作台。
- [roadmap/](roadmap/)：版本顺序、指标和证据积累。
- [traceability.md](traceability.md)：需求到代码、支持链路和验证的追踪。

## 分工原则

| 角色 | 负责 | 不负责 |
| --- | --- | --- |
| Agent A | Domain/Core、Mock、Ledger、Web、Exposure、Policy、Behavior、Evidence | 真实账户数据、Cookie、Token、Raw Snapshot、登录态和真实资产判断 |
| Agent B | Eastmoney Adapter、selector、接口 mapping、分页、登录状态、失败和 Schema Drift、真实验证 | 页面设计、Core 领域逻辑和未授权的数据处理 |
| Shared | 协议、Coverage、fixture/真实场景对应关系、Definition of Done 和阻塞回传 | 替代 A/B 执行具体任务 |

每个任务都必须写清输入、输出、改动范围、测试、构建、边界场景、证据和依赖。Agent B 的结果必须脱敏，只保留 PASS/FAIL/BLOCKED、缺失字段、未知状态、Required change 和 Sensitive data exposed 等结论。

## 项目目录边界

- `src/`：页面、应用逻辑、运行时内容、应用数据和资源。
- `project-support/`：扩展、脚本、爬虫、静态发布资源、依赖和部署入口。
- `agent/`：维护工作台。

运行时代码不得依赖 `agent/`。投资导入页使用的协议文档位于 [`src/content/investment/investment-assistant.md`](../../../src/content/investment/investment-assistant.md)，不是本目录的维护资料。
