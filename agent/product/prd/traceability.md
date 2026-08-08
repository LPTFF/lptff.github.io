# 需求追踪

| 能力 | 规划位置 | 项目实现/支持区 | 验证 |
| --- | --- | --- | --- |
| 页面与应用源码 | Agent A | `src/views/`、`src/components/`、`src/utils/` | `npm run typecheck`、`npm run build` |
| 运行时投资协议 | Shared / Agent A | `src/views/investment/investment-assistant.md` | 投资导入页浏览验证 |
| Chrome 投资助手 | Agent B | `project-support/extension/` | 扩展打包和 `node --check` |
| 构建与采集 | Shared | `project-support/scripts/`、`project-support/crawl/` | collector、Python tests、CI |
| 静态发布资源 | Shared | `project-support/public/`、Vite `publicDir` | `dist` 产物比对 |
| Mock 与 Core | Agent A | `src/` 测试和领域逻辑 | fixture 矩阵、typecheck、build |
| Eastmoney 真实适配 | Agent B | 扩展 Adapter 和脱敏验证资料 | 单接口单场景协议 |
| 产品维护资料 | Shared | `agent/` | 路径残留和隔离检查 |

规划文件不代表能力已经实现；只有源码、测试和运行证据同时通过，才可记录为当前事实。
