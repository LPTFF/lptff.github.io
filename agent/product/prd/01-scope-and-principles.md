# 范围与原则

## 当前目标

Investment OS 以本地优先的投资记录、数据可信度、规则执行和行为复盘为主线，形成“记录 → 分析 → 改进 → 验证”的闭环。

## 三层项目结构

- `src/` 是页面与应用源码区。
- `project-support/` 是项目运行支持区，包含 Chrome 扩展、采集器、爬虫、静态发布资源、构建和部署工具。
- `agent/` 是维护工作台，不能成为运行时依赖。

## 产品原则

1. Fact、Inference、Suggestion 分离。
2. 数据来源、时间范围、Coverage、失败和未知状态可见。
3. Local-first；云端同步、远程埋点和第三方复用单独评估。
4. 先建立可信账本，再扩展 Exposure、Policy、Behavior 和 Evidence。
5. 不为缺失数据伪造新鲜度、完整性或确定性结论。
6. 真实环境验证必须脱敏，并与 Mock/Core 开发隔离。

## 明确不做

- 不保存密码、Cookie、Token、登录状态或完整网络日志。
- 不把真实账户 HTML、JSON、Raw Snapshot、银行卡、个人资产或交易明细写入工作台。
- Agent A 不访问真实账户环境；Agent B 不借真实环境修改 Core 产品逻辑。
- 不以新增通用聊天壳、普通待办或无证据 AI 建议替代投资闭环。
