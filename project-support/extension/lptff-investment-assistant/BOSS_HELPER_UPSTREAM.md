# Boss-Helper 上游集成

本扩展的 BOSS 直聘核心交互基于开源项目 `Ocyss/boss-helper`，固定版本为 `0.5.2.2`，提交为 `ddc15026e8c9c04e4243d98379c85856eba43ab3`。许可证见 `BOSS_HELPER_UPSTREAM_LICENSE.txt`。

## 功能边界

页面中的统计、BOSS 原生筛选区、配置、AI、日志、职位卡片横向队列、对话框、自动投递和翻页行为均来自同一份上游源码。按产品要求，已从源码中删除“关于&赞赏”“反馈”“帮助”三个非核心入口及帮助模式逻辑。旧版自写的右侧悬浮工作台、主开关、快捷搜索词、卡片高亮/虚化、独立 Popup 配置和自写投递流程也已删除。

上游明确未实现或禁用的 AI 自动回复等能力不会在本扩展中另行伪造。

## 更新与验证

1. 在 `agent/references/boss-helper-upstream` 切换到明确的上游 tag，并初始化 Git 子模块。
2. 使用上游锁文件安装依赖并执行 `build:chrome`。
3. 将 `.output/chrome-mv3` 中的 `boss.js`、`background.js`、`content-scripts/content.js` 和 `content-scripts/content.css` 同步到本目录现有对应文件。
4. 重新应用本项目批准的精简项，更新 `verify-boss-helper-upstream-parity.cjs` 中的版本、提交和四个 SHA-256。
5. 运行 `npm run test:boss-helper-parity`，再执行扩展整体构建与普通 Chrome 真实页面验收。
