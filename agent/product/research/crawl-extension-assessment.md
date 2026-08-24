# 采集脚本浏览器插件配合评估

- **状态**：已分析
- **评估对象**：`project-support/crawl/` 全部采集器（`run_collectors.py` 注册的 18 个 + 诊断脚本）
- **评估日期**：2026-08-23
- **关联**：插件模式参照 `project-support/extension/lptff-investment-assistant/` 与 `src/investment/sync/extension-sync.ts`

## 判定标准

参照 src/investment（基金复盘助手）的插件配合模式——扩展在用户已登录的真实浏览器内采集，经协议化 capture 导入本站，CI 全程不接触凭据——一个采集功能是否需要插件，看三问：

1. 数据是否需要登录态或个人账户？
2. 是否必须真实浏览器环境（JS 渲染、滚动加载、反爬指纹）？
3. 数据是否属于私人数据（不应进入公共 CI 产物）？

三问皆否 → 纯 HTTP collector；任一为是 → 评估浏览器插件或前端手动导入；无外部数据 → 纯前端。

## 分类结论

### 纯 HTTP、无需插件（CI 全自动，占绝大多数）

| 采集器 | 数据源 | 说明 |
| --- | --- | --- |
| weibo | `weibo.com/ajax/side/hotSearch` | 公开热搜接口，仅浏览器 UA/Referer，无 Cookie |
| infzm / juejin / meituanTech / githubTrending / 52pojie / v2ex | 文章 / RSS / 公开 API | 标准 HttpClient 采集 |
| welfare 及 welfare/ 下 6 个（0818tuan、zhuanyes、daydayzhuan 及各自 Top） | 福利页 | 全部纯 HTTP |
| douban | `movie.douban.com/j/search_subjects` | 公开接口 + 海报下载转 data URL |
| leetCode | leetcode.cn 公开题库 GraphQL | `LEETCODE_COOKIE` 仅可选增强，主体是公开数据 |

以上均受 `crawl/lib/http.py` 统一保护：HTTPS-only、域名白名单、响应大小限制、重试、挑战页检测；改为插件会引入人工触发依赖，不建议。

### 需要或适合插件配合（依赖登录态 / 浏览器环境）

| 采集器 | 现状 | 评估 |
| --- | --- | --- |
| tiktokData（抖音） | 唯一真浏览器采集器：selenium 无头滚动收集链接 + `DOUYIN_COOKIE` 逐页解析 | 最适合插件化：个人主页视频 = 登录态私人数据，与 investment 持仓采集同类；插件可在已登录页面直接采集，去掉 selenium 与 Cookie 手工维护 |
| kuaishou（快手） | 脚本强依赖 `KUAISHOU_COOKIE`（无 Cookie 直接保留旧快照），CI 已配 secret；实测无 Cookie 时 GraphQL 返回 `result:2` 零数据，未登录浏览器访问个人主页 0 个作品；现存 `kuaishouData.json` 为 2023 年 Cookie 有效期的存量 | 与 tiktokData 同类：个人主页视频需登录态，适合并入插件采集；纯 HTTP 仅在 Cookie 新鲜时可用且需人工维护 |
| zhipin（BOSS直聘） | 公开城市页纯 HTML 解析是登录墙下的降级方案：实测无 Cookie 每城仅解析 0–1 条，总产出 10 条且 100% 薪资字段降级为“薪资以 Boss 职位页为准”；未登录真实浏览器城市页 0 个职位卡片（仅导航与分类目录） | 更好的数据（完整列表/薪资/职位详情）需登录态，是插件化候选；若维持现状则是公开数据降级展示 |
| leetCode（个人提交记录） | 目前只采公开题库 | 需要个人数据时适合插件；现状无需 |
| eastmoney | `eastmoney_rank_diagnostic.py` 仅诊断用，`EASTMONEY_COOKIE` 可选 | 正式投资数据已由 lptff-investment-assistant 扩展承接（即 src/investment 模式本身） |

## 实测验证记录（2026-08-23）

- **kuaishou**：curl 无 Cookie POST `www.kuaishou.com/graphql`（visionProfilePhotoList）→ `{"result":2}`；Chrome 未登录打开 profile 页 → 0 个作品，仅登录引导。
- **zhipin**：curl 无 Cookie GET 城市页 → HTML 527KB 中 `job-card-wrapper` 0 次，用脚本解析函数实测仅解出 1 条且无薪资；Chrome 未登录打开并滚动到底 → 0 个职位卡片。与 `src/data/zhipin.json`（10 条、薪资 100% 降级）印证。
- 早期版本曾将 kuaishou 误判为“公开 GraphQL 无登录”（未读脚本 Cookie 依赖部分）、将 zhipin 误判为“公开城市页已足够”，本次以实测纠正。

## 插件配合模式参照（src/investment 链路）

manifest（host_permissions 限定目标域名）→ content/network-bridge.js（MAIN world 拦截）+ content/collector.js（已登录页面采集）→ capture JSON 下载/推送 → content/web-bridge.js 与本站页面通信 → `src/investment/sync/extension-sync.ts`（协议校验 + adapter 转换）→ ledger 存储 → 前端消费。关键特征：采集发生在用户已登录的真实浏览器，凭据不进仓库与 CI。

## 插件侧进展（2026-08-24）

lptff-investment-assistant v3.5.1 已在真实登录 Chrome 中确认 binance/zhipin/kuaishou/douyin 四平台契约，并交付 `<platform>-source-capture/1.0` 正式白名单来源包、Coverage、完整/脱敏双导出；观察报告继续作为契约证据保留。币安已升级为一次点击后自动复制后台合约页、30 秒采集并关闭，不再要求用户刷新或切换页面标签；空数据集 Coverage 语义与全市场无关配置裁剪也已修复。站点侧 adapter 与产品页面消费仍待实现。详见 [多领域观察采集插件任务记录](../../records/multi-domain-observation-extension-20260824.md)。

## 复审触发条件

- 新增采集器时按"判定标准"三问归类后再实现。
- tiktokData 若决定插件化，先在扩展中新增对应 host_permissions 与采集分支，再下线 selenium 路径。
