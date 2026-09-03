# 07 非功能与运维

**来源**：PRD 第 13–15、30、52–66 节；当前仓库脚本和 CI。**状态**：交付与维护约束。

## 项目运行区

以下是项目功能或交付链路，不能移动到 `agent/`：

- `src/`、`project-support/public/`、`project-support/crawl/`、`project-support/extension/lptff-investment-assistant/`
- `project-support/scripts/extension/build-zip.js`
- `project-support/scripts/sync-findJob-summary.js`、`project-support/scripts/copy-404.js`
- `project-support/scripts/collectors/**`
- `package.json`、`vite.config.ts`、`project-support/build.sh`、`.github/workflows/ci.yml`
- `src/views/investment/investment-assistant.md`（被 Vite `?raw` 作为用户可见内容编译）

这些路径分别被页面、npm scripts、Vite 开发下载端点、RSS 数据生成、GitHub Actions 或发布流程直接消费。目录名看起来像“辅助”不改变其项目功能属性。

## 本地开发与构建

- `npm run serve`：先同步面试摘要，再以严格 8090 端口启动 Vite。
- `npm run typecheck`：运行 `vue-tsc`。
- `npm run build`：同步摘要、类型检查、Vite 构建、生成 404。
- `npm run test:collectors`：离线验证 RSS/Atom 解析、白名单、校验和原子写出。
- `npm run collect:rss:site`：生成被 Git 忽略的 `project-support/public/data/recommendArticleData.json`。
- `node project-support/scripts/extension/build-zip.js`：生成被忽略的 `dist-extension/lptff-investment-assistant.zip`。

## CI 与发布

`.github/workflows/ci.yml` 运行 collector 测试、RSS 采集、Python crawl、构建、生产数据比对、扩展打包和 GitHub Release/Pages 发布。任何路径迁移都必须同步检查 workflow 的硬编码路径和 shell 工作目录。

## 生成物规则

`dist/`、`dist-extension/`、动态 RSS JSON、`.artifacts/`、缓存、日志、原始网络数据和真实验证输出不作为手写资料或工作台内容。凭据只能通过安全宿主配置提供，不能写入源码、PRD、agent 或日志。
