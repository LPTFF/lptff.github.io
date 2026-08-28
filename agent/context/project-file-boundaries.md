# 项目文件边界

**目的**：按实际消费者区分项目功能与维护工作台，防止为了目录整齐而破坏运行时、构建或发布链路。

## 三个区域

### 应用源码区 `src/`

页面、组件、路由、应用逻辑、运行时内容、打包数据和资源。

### 项目支持区 `project-support/`

会被 Vite、npm、CI、扩展发布或数据链路消费的支持代码和资源：

- `project-support/extension/lptff-investment-assistant/`
- `project-support/scripts/`
- `project-support/crawl/`
- `project-support/public/`
- `project-support/requirements-crawl.txt`
- `project-support/build.sh`
- `project-support/deploy/`

### `agent/` 维护工作台

这里放产品定位、PRD、业务规划、研究、长期记录、代码组织说明、验收方法和其他只供维护者阅读的材料。`agent/references/` 可以保存固定版本的外部参考源码用于差异分析，但不能成为产品构建或运行依赖。

## 依赖方向

```text
src/ 页面与应用 → src/ 内容与数据、project-support/ 运行支持
project-support/ → 构建、CI、扩展发布和静态资源
维护者 → agent/ 工作台
```

禁止 `src/`、Vite 配置、npm scripts、扩展打包器或 CI import、执行或发布 `agent/` 内容。参考源码只用于阅读和重新生成经校验的项目产物；不要在其中保留 `node_modules`、`dist`、`.output` 等可重建内容。

## 迁移后的路径

- `project-support/extension/lptff-investment-assistant/**`
- `project-support/scripts/extension/build-zip.js`
- `project-support/scripts/collectors/**`
- `project-support/crawl/**`、`project-support/build.sh`
- `project-support/public/**`
- `src/data/**`、`src/assets/**`
- `src/views/Blog/articles/**`、`src/views/home/findJob/full.md`、`src/views/home/findJob/chain.md`
- `vite.config.ts`、`package.json`、`.github/workflows/ci.yml`

这些路径被页面、Vite、package scripts 或 CI 调用。变更前先做调用图检查，不按目录名称判断能否迁移。

## 可进入工作台的资料

没有运行时消费者的维护文档可以放在 `agent/docs/`，当前迁移的是 [`agent/docs/development-environment.md`](../docs/development-environment.md)。根 README 和文档相对链接必须同步更新。

## 禁止放入工作台

凭据、密码、Cookie、Token、登录状态、真实账户 HTML/JSON、个人资产或交易明细、Raw Snapshot、完整 Network Log、动态 JSON、ZIP、dist、缓存、日志和临时验证输出。真实验证只能保存脱敏摘要和结论。
