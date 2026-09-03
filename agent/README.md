# agent/：人的项目工作台

`agent/` 用来降低理解、判断和验证成本，不是 Agent 的控制面。执行原则以根目录 [AGENTS.md](../AGENTS.md) 为准；这里只提供项目事实和任务入口。

## 工作方式

- 从用户结果出发，直接读取受影响代码和一份最相关资料；不为“完整理解”遍历文档。
- 优先复用有效能力，以最小、可撤销的改动解决问题；不因惯例或已有实现限制方案空间。
- 在授权范围内主动自动化搜索、比较、实现、排错和真实重测，直到结果收敛或出现明确阻塞。
- 真实环境结果优先于源码推断；无法观察的部分保持未知，不用整齐的报告掩盖证据不足。
- 私人数据、本机状态和外部副作用按最小权限处理；人负责价值取舍、高风险授权以及提交、推送前的最终审查。

## 按任务读取

| 当前问题 | 读取 |
| --- | --- |
| 项目现状或文件归属 | [项目上下文](context/project-context.md)、[文件边界](context/project-file-boundaries.md) |
| 产品价值或范围 | [产品入口](product/README.md) 与对应产品正文 |
| Investment Review | [产品正文](product/investment-review.md)；实现细节才读[工程附录](product/reference/investment-review-engineering.md) |
| 本地运行或构建 | [项目工作说明](standards/project-instructions.md) |
| 页面、数据或部署验收 | [真实环境验收原则](standards/trusted-verification.md) |
| 外部资讯源、AI 筛选或定时采集接入 | [外部资讯源接入手册](verification/external-content-source-integration.md) |
| BOSS 扩展验收 | [BOSS 专用手册](verification/boss-extension-real-validation.md) |
| 代码或产品组织 | [代码组织](standards/code-organization.md)、[产品设计](standards/product-design.md) |
| 外部项目商业研究 | [研究入口](product/research/README.md) |

`archive/` 只用于追溯旧决策，不能覆盖当前代码和当前产品正文。

## 仅保留的人工卡点

- 未明确授权时，不进入私人登录环境，不扩大观察字段，不执行交易、删除、外发或其他高风险动作。
- 每次提交和推送前，人必须审查确定的待提交版本、真实证据、未知、分支和远程；批准后内容变化则重新审查。
- 真实页面或截图仍需人查看时先完成证据交付，再关闭页面、服务或临时环境。

## 目录边界

- `src/` 与 `project-support/` 保存产品代码和交付链；`agent/` 保存仍有长期价值的事实、产品判断和参考资料。
- 不把可重新安装的依赖、凭据、登录态、真实私人数据、原始网络日志、临时测试产物或截图提交到仓库。
- 好的交接只说明目标、已证实结果、失败或未知、变更、证据和下一步；没有长期价值的过程材料应删除。
