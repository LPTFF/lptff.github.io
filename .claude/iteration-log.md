## 2026-08-01 — 保留 0818 数据目标并恢复 HTTPS 索引消费

- 任务基线：用户明确纠正“因官方 HTTPS 不可用就删除 collector、快照和消费者”的做法，要求保留 `0818tuan.py`、`0818tuanTop.py` 及 0818 产品目标，并优先改变采集方法。继续禁止 HTTP fallback、关闭 TLS、直接 IP/伪造 Host、代理绕过、登录/CAPTCHA、stealth 或对第三方 403 做检测规避。
- 实际变更/偏离控制：恢复两个 collector 文件和 0818 品牌资源；普通列表改为从公开 `rsshub.rssforever.com/tophub/4MdAkn1oxD` HTTPS RSS 路由读取 TopHub 的 0818 索引，严格校验 channel 标题、TopHub node URL、RSSHub generator、更新时间和每条原始 `www.0818tuan.com/xbhd/<id>.html` 目标。消费者只接收唯一 TopHub HTTPS 索引 URL，并明确 `sourceType/sourceProvider/timestampMeaning/originalHost`，不保存或打开原始 HTTP 详情。由于没有显式 HTTPS 置顶证据，`0818tuanTop` 保留 registry/文件合同但返回 skipped，删除不符合当前 HTTPS Schema 的 2023 旧 top 快照，不把榜首伪造成置顶。`/welfare` 恢复 0818 普通数据和图标，来源标为“0818团（HTTPS 公共索引）”。
- 文件：`src/crawl/lib/welfare_sources.py`、`src/crawl/welfare/0818tuan.py`、`0818tuanTop.py`、`src/crawl/run_collectors.py`、`src/crawl/tests/test_collectors.py`、`src/public/data/welfare/0818tuan.json`、`src/views/home/welfare/index.vue`、0818 图标、业务说明、项目上下文和本日志；忽略型证据位于 `docs/verification-reports/current/assets/`。
- 验证证据：官方 `www` HTTPS 仍因证书 hostname mismatch 失败、裸域 443 拒绝连接；TopHub 透明 requests 随后返回 403/503 安全验证，未绕过。公开 RSSHub HTTPS 路由连续读取成功并发布 49 条当前 0818 索引，49 个唯一 HTTPS 消费链接、0 HTTP 详情、0 敏感字段，时间明确为 RSS `lastBuildDate`。后续一次真实运行新增 9 个 URL 并正确报告 `freshCandidate=true`，紧接着稳定重复新 URL 为 0 且 `freshCandidate=false`，证明不会单因索引时间推进误报新候选；top collector 明确 skipped 0。Python crawler 38/38、compileall、typecheck 和 production build 通过。首次独立 preview `43217` 与 feed 更新后重新构建的最终 preview `43219` 均在桌面 `1365×768` 与 mobile/touch `390×844` 显示 49 条 0818 / 共 168 卡片，0 原站 HTTP link、0 破图、无横向溢出、console error/warn/issue 为 0。
- 剩余风险/责任人：RSSHub 镜像与 TopHub 索引是第三方可用性依赖，不等同于 0818 官方 HTTPS，也不能证明单条内容发布时间或原始详情可安全打开；当前 TopHub 页面会返回安全验证，因此只保留索引跳转语义且不作绕过。显式置顶来源仍未解决，由采集维护者继续寻找合法 HTTPS 证据；外部条款、转载授权和长期可用性由项目所有者/合规责任人确认。本轮未触发 Actions、部署、提交或推送。

## 2026-08-01 — 保留 Boss 招聘能力并改用官方公开城市页

- 任务基线：用户明确要求保留 Boss/Zhipin 招聘业务与 `src/views/home/bossZhipin/index.vue`，并进一步纠正“可改变采集方法但不能改变采集目标”；因此第三方 Ashby 职位不能作为 Boss 产品数据。继续禁止登录、Cookie、CAPTCHA、stealth、安全挑战绕过和 robots 禁止的 query 搜索页。
- 实际变更/偏离控制：移除 OpenAI/Replit/Ramp Ashby 目标和 provenance；`zhipin` collector 改为只访问 Boss 官方 `https://www.zhipin.com/<city>/` 无查询参数城市首页，读取公开职位卡与 JSON-LD `upDate`，筛选前端/客户端相关职位。详情 URL 仅允许 `www.zhipin.com/job_detail/*.html`，不请求详情页或内部 API；公开页缺失的薪资和职位说明不伪造。首页保留全部职位卡和已修复的视口内滚动弹窗，来源提示改为 Boss 官方公开页语义。
- 文件：`src/crawl/zhipin.py`、`src/crawl/tests/test_collectors.py`、`src/public/data/zhipin.json`、`src/views/home/bossZhipin/index.vue`、`docs/business-function-overview.md`、`.claude/project-context.md`、`.claude/iteration-log.md`；忽略型报告和证据位于 `docs/verification-reports/current/`。
- 验证证据：robots 真实读取确认旧 query 路径被禁止；旧筛选页和具体详情页真实浏览器会进入 security/login，未作绕过；`/sitemap.xml` 重定向目标返回 `NoSuchKey`。无查询城市首页通过安全 HTTP 客户端返回公开 HTML；真实采集首次 `success 3`、3 个新 Boss URL、时间戳推进，重复运行 `changed=false` 且 `freshCandidate=false`。产物 3 条、3 个唯一 `www.zhipin.com` HTTPS 详情、来源页和时间字段完整、无第三方招聘目标；Python 36/36、compileall 通过。production build 与桌面/移动消费者证据见本轮权威本地验证报告。
- 剩余风险/责任人：公开城市页只提供有限热门职位，当前候选少且薪资/完整说明可能缺失；详情跳转可能触发登录或安全验证，项目不保证职位持续有效。外部条款、robots 和转载授权仍由项目所有者/合规责任人确认。任何后续入口变更都必须保持 Boss 为采集目标并重新验证；不得恢复 Ashby 替代目标。本轮未触发 Actions、部署、提交或推送。

## 2026-08-01 — 关闭 V2EX 采集限制（0818 与 Zhipin 结论随后修正）

- 任务基线：权威报告仍有 `COLLECTOR-LIMITS`，分别缺少 0818 严格 HTTPS、V2EX 当前新候选和 Zhipin 自然非挑战新职位证据；旧的 2023 快照仍被静态消费。验收采用“本轮合法新候选或从活跃 collector/消费者合同明确退役”，不以旧快照、退出码、HTTP 降级、关闭 TLS、登录/Cookie、CAPTCHA 或 stealth 代替成功。
- 实际变更/偏离控制：公共 HTTP 客户端新增重定向链和最终 URL 的 HTTPS/exact-host 复核；runner 使用有限脱敏失败分类，现有快照与候选统一校验唯一键；collector summary v2 增加新 URL、最大时间戳推进和 `freshCandidate`。该批次曾因无官方可验证 HTTPS 将 0818 退役，也曾将 Zhipin 退役并短暂采用第三方职位源；两项均已被用户纠正并由上方 0818 HTTPS 公共索引与 Boss 官方城市页实现取代。V2EX 三个官方 HTTPS endpoint 当前仍不可用且没有新候选，退役其 registry、2023 JSON 和 `/tech-forum` 消费。高级搜索/导航专区中的普通外部网站入口不属于上述快照合同，予以保留。
- 文件：`src/crawl/lib/http.py`、`runner.py`、`validate.py`、`welfare_sources.py`、`run_collectors.py`、`v2ex.py`、`src/crawl/tests/`、`src/views/home/news/index.vue`、`welfare/index.vue`、0818/V2EX 退役数据/资源、`docs/business-function-overview.md`、`.claude/project-context.md`、`.claude/iteration-log.md`；忽略型报告和证据位于 `docs/verification-reports/current/`。该批次对 Zhipin 页面/数据的删除及随后的第三方替代目标均已被上方官方 Boss 城市页实现取代。
- 验证证据：该批次 Python 回归 37/37 与 compileall 通过；V2EX 真实运行 preserved 7、`freshCandidate=false`、新 URL 0、最大时间戳未前进；直接 Boss 旧 query 流程真实运行 preserved 60、`freshCandidate=false`、新 URL 0，证明该入口受 challenge 限制。该批次的 0818/Zhipin 退役构建和消费者观察均已被上方恢复实现及其 production preview 验收取代。
- 剩余风险/责任人：不能证明外部源未来恢复、站点条款/转载授权、未推送变更已部署或 GitHub Secrets/远程定时任务有效；由项目所有者和合规责任人承担。V2EX 的未来恢复需要重新完成合法源与消费者验收；0818 与 Boss 产品当前状态以上方后续实现为准。本轮未触发 Actions、部署、提交或推送。

## 2026-08-01 — 全面复核产品任务、真实数据链与验证总览

- 任务基线：解决 `docs/verification-reports/latest.md` 只按修改时间和关键词生成简陋“部分完成”状态、旧 Python 报告仍保留 LeetCode 3,169 条和远程 CI 未运行等过时结论的问题；全面梳理仍有效的产品与测试缺口，并用真实公共采集、生产构建、桌面/移动浏览器和只读远程证据形成可信事实链。
- 实际变更/偏离控制：新增显式验证报告索引模型、7 项回归测试和 `test:verification-reports`；`verification:refresh` 与 `context:check` 统一使用唯一权威报告、支持/部分被取代关系和显式未解决项，不再猜测状态。未实现待办产品功能，未运行 `build.sh`/`uploadQL.js`，未触发 Actions、部署、提交或推送，未绕过 challenge 或运行未授权账号态采集。
- 文件：`scripts/verification-report-index.js`、`scripts/refresh-verification-reports.js`、`scripts/check-context-maintenance.js`、`scripts/tests/verification-report-index.test.js`、`package.json`、`.claude/project-context.md`、`.claude/iteration-log.md`；被 Git 忽略的 `docs/verification-reports/current/index.json`、综合报告、`latest.md` 和本轮证据。
- 验证证据：报告索引 7/7、RSS 9/9、Python 29/29 和 compileall 通过；真实 core crawl 逐项记录 success/preserved/skipped，RSS 为 2 来源/20 条，LeetCode 在 200.42 秒内 success 4,393 条/88 分块；`npm run build` 通过且 public/dist RSS 字节一致。独立 production preview `4182` 完成 RSS、welfare、tech-forum、GitHub Trending、LeetCode、Boss、豆瓣和投资页面的桌面/移动定向验收；LeetCode 两个视口各三次随机并取得远程分块 200 JSON。公共 API 证明 HEAD `a88c5d4` 的 Actions run `30682973877` 完整成功，线上 `/newsArticle` 当前可用。收尾时受跟踪动态快照、忽略型 RSS 和 `dist/` 均恢复到写前基线，6 个目标的存在性、文件数、字节数和 SHA-256 全部一致。
- 关键发现：`INV-DATA-001` 仍为真实 P0 缺口；production preview 中缺失的投资 JSON 被 SPA fallback 返回为 HTTP 200 HTML，FundPilotPlus/Cryptocurrency 随后 JSON parse 失败并只显示空表格，用户看不到来源、失败、过期、旧快照或多数据集独立状态。Weibo 本轮 success 52 但无 Vue 消费者；0818 skipped、V2EX preserved 7、Kuaishou 无凭据 skipped 且只保留旧 43 条。
- 剩余风险/责任人：投资功能维护者优先实现并验证 `INV-DATA-001`；项目所有者决定正式认证、job/life、Weibo 消费者、SFTP 和未用插件去留；采集维护者继续处理 0818/V2EX/Zhipin 及授权账号态来源；外部条款与转载授权由项目所有者/合规责任人确认。本轮未推送代码，因此当前线上成功不能证明本轮本地批次已部署。


- 任务基线：修复 `npm run serve` 在 `8090` 被占用后自动切换到 `8091`、`8092`、`8093`，以及配置热重载后回到旧端口的问题；开发地址必须稳定，端口冲突应显式失败，便于发现残留服务并保持文档、浏览器访问地址和数据代理一致。
- 实际变更/偏离控制：将 `vite.config.ts` 的端口固定为 `8090` 并启用 `strictPort: true`；保留 `0.0.0.0` 监听、CORS 和 `192.168.1.100:5000` 数据代理。同步更新 README、开发环境说明和项目上下文；未修改业务页面或远程服务。
- 文件：`vite.config.ts`、`README.md`、`docs/development-environment.md`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证证据：已运行 `git diff --check` 和 `npm run context:check`，均通过；静态复核确认 `port: 8090` 与 `strictPort: true` 已生效。本轮未启动 Vite 实测，因为当前日志已显示 `8090` 至少被残留服务占用，直接启动只会按预期失败；未执行构建，因为仅修改开发服务器配置和文档。
- 剩余风险/责任人：需要先停止占用 `8090` 的旧 Node/Vite 进程，再运行 `npm run serve`；端口冲突后的排查和进程清理由本地开发者负责。

## 2026-08-01 — 修复 LeetCode 标题缺失导致的整批保留

- 任务基线：处理最新采集报告中 LeetCode 因单条列表记录缺少 `titleCn` 而保留旧 3,169 条快照的问题；同时复核 V2EX、Zhipin 和 0818 的未完成状态，不能降低 HTTPS 边界、绕过登录/安全检查或伪造采集结果。
- 实际变更/偏离控制：LeetCode GraphQL 列表请求增加同源 `title` 字段，并在中文标题为空时将其作为显示标题回退；新增该字段组合的回归测试。V2EX 三个官方 HTTPS 主机仍超时、Zhipin 仍返回登录/安全检查、0818 仍无可用 HTTPS 端点，均保留既有安全失败/快照策略，未作投机性修复。
- 文件：`src/crawl/leetCode.py`、`src/crawl/tests/test_collectors.py`、`.claude/project-context.md`、`.claude/iteration-log.md`；本地忽略的 `docs/verification-reports/2026-08-01-leetcode-title-fallback.md` 保存真实运行证据。
- 验证证据：针对性 LeetCode 回归 3/3 通过，完整 Python 回归 29/29 通过。真实 `run_collectors --only leetCode` 在 195.09 秒内成功发布 4,393 条、88 个分块；manifest 逐分块计数与声明总数一致。随后 `npm run build` 成功（仅保留既有第三方 PURE 注释警告）。动态快照已恢复，不进入源码提交。GitHub-hosted CI 运行 `30681585333` 已成功完成。
- 剩余风险/责任人：新 4,393 条 LeetCode 快照尚未在本轮浏览器重新检查 `/leetcode` 的 DOM、网络和控制台，由前端维护者在下一次可用生产 preview 中完成。V2EX、Zhipin 和 0818 的新候选分别受官方主机超时、源站挑战和无 HTTPS 端点阻断，由采集维护者在来源恢复且不绕过安全边界时复核。

## 2026-08-01 — 重构本地验证报告管理

- 任务基线：解决 `docs/verification-reports/` 中报告、截图、机器摘要平铺堆积，且维护检查只按文件名字母顺序寻找报告、无法反映当前验证状态的问题；保留所有原始证据，不把归档当作删除。
- 实际变更/偏离控制：新增 `npm run verification:refresh`，自动生成中文 `latest.md`，展示最新结论、当前报告、当前证据规模及日期归档；`context:check` 在检查前自动刷新总览。将仍与当前代码相关的两份报告和 51 个证据整理到 `current/` 与 `current/assets/`，将 2026-07-31 的 14 个历史文件移动到 `archive/2026-07-31/`；新增本地 README 说明命名、归档和中文报告规则。未删除或压缩任何原始证据，未改变应用运行时、采集或部署行为。
- 文件：`scripts/refresh-verification-reports.js`、`scripts/check-context-maintenance.js`、`package.json`、`.claude/project-context.md`、`.claude/iteration-log.md`；被 Git 忽略的 `docs/verification-reports/` 管理产物。
- 验证证据：`npm run verification:refresh` 成功生成当前总览；脚本语法检查通过；当前两份 Markdown 报告的证据链接均可解析；`npm run context:check` 成功刷新总览并找到完整可信报告。当前总览为 2 份结论报告、51 个当前证据（14.8 MB）及 14 个历史归档文件（1.1 MB）。
- 剩余风险/责任人：自动总览只汇总报告标题、修改时间、启发式状态和文件规模，不能判断业务结论真实正确；报告编写者仍需填写已证明、未证明和风险。当前证据保留策略尚未设置自动过期清理，以避免未授权删除，由仓库维护者按批次完成状态手动归档。

## 2026-08-01 — 修复 GitHub Actions 运行时与 pip 缓存配置

- 任务基线：GitHub Actions 在 `master` 推送后报告旧版 JavaScript Action 的 Node 20 弃用提示，并且 `actions/setup-python@v5` 的 pip 缓存默认查找 `requirements.txt` 或 `pyproject.toml`，未识别仓库实际的 `requirements-crawl.txt`。本轮只修复 CI 启动配置，不改变采集、构建或部署步骤。
- 实际变更/偏离控制：将 checkout、Node 和 Python Action 分别升级至 Node 24 兼容的 v5、v5、v6；构建运行时从 Node 20 升至 Node 22；为 pip 缓存显式设置根目录 `requirements-crawl.txt`。未更改 Python 版本、依赖内容或密钥边界。
- 文件：`.github/workflows/ci.yml`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证证据：静态复核工作流确认 `cache-dependency-path` 指向已存在的根目录依赖清单，且 Action 版本与 Node 24 迁移要求一致。无法在本地执行 GitHub-hosted runner；下一次 `master` 推送的 Actions 日志将验证缓存恢复与完整采集/部署流程。
- 剩余风险/责任人：GitHub Actions 运行结果尚待远程 workflow 验证，由仓库维护者在 Actions 日志中确认；若后续失败，应以第一个业务命令错误为准而非弃用提示。


- 任务基线：记录本地开发环境、Vite `/data` 代理和经授权的家庭服务器 SSH/远程数据文件关系，降低后续代码理解和维护成本；不在仓库写入密码，不修改远程文件或服务进程。
- 实际变更/偏离控制：确认 Vite 开发服务器当前端口为 `8090`、监听 `0.0.0.0`，`/data` 代理目标为 `http://192.168.1.100:5000`；确认远程 `http-server` 工作目录为 `/root/Test`，`/data/fundHoldData.json` 对应 `/root/Test/data/fundHoldData.json`。新增开发环境架构文档，并同步 README、项目上下文和命令说明；未将密码写入任何文件。
- 文件：`vite.config.ts`、`docs/development-environment.md`、`README.md`、`CLAUDE.md`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证证据：已通过 SSH 检查远程文件路径、HTTP 服务工作目录和监听端口；已验证 `http://192.168.1.100:5000/data/fundHoldData.json` 返回 HTTP 200 JSON；已运行 `git diff --check`（此前代理修改已通过）。本轮仅修改文档和项目事实说明，未运行 `npm run build` 或浏览器流程验证，因为用户已确认此前开发环境测试无问题。
- 剩余风险/责任人：家庭服务器为局域网开发依赖，离线或地址变化时本地基金页面数据请求会失败；后续维护者需在远程服务、`vite.config.ts` 和本文档之间同步变更。SSH 密码由用户/本地安全凭据管理负责，不进入仓库。
## 2026-07-25 — 修复高级搜索页动态模块加载白屏并建立迭代文档自动化

- 范围：排查 `/advanced-search` 首次访问时的 `504 (Outdated Optimize Dep)` 和动态导入失败；将高级搜索页的 Element Plus 搜索图标从嵌套 `<el-icon>` 改为 `el-input` 的 `prefix-icon` 绑定，移除不再需要的 `ElIcon` 注册；新增迭代日志草稿和上下文遗漏检查脚本。未修改路由结构、搜索跳转行为、数据源或部署流程。
- 证据/决策：高级搜索页的动态模块可正常返回并渲染；改用显式 `:prefix-icon="Search"` 后避开了原先的组件注册组合，保持 Element Plus 的按组件导入边界。开发机同时存在多个 Vite 服务，8080、8081、8082 已被占用；旧服务或 `node_modules/.vite` 过期缓存可能继续产生 504，因此调试时应先关闭残留 Node/Vite 进程，必要时清理该缓存。自动化只生成可审查草稿和报告缺失，不根据文件名自动推断架构事实，不挂入 `serve`/`build`，不自动提交或推送。
- 文件：`src/views/home/advancedSearch/index.vue`、`scripts/iteration-report.js`、`scripts/check-context-maintenance.js`、`package.json`、`AGENTS.md`、`CLAUDE.md`、`.claude/project-context.md`。
- 验证：`npm run build` 通过（`vue-tsc`、Vite 构建和 404 复制成功）；浏览器访问 `/advanced-search` 正常展示，控制台无错误和警告；脚本新增后通过 `npm run iteration:report`、`npm run context:check` 和 `git diff --check` 复核。
- 未解决问题：无。



- 范围：保留首页热门资讯、吾爱破解、导航专区、Boss直聘、豆瓣电影；将薅羊毛、高级搜索、技术论坛、GitHub Trending、LeetCode、面试题迁移为六个独立路由，并通过导航专区的 `InternalWebsite` 分类提供入口。未修改数据源和全局 `App.vue` 外壳。
- 证据/决策：新增共享独立页布局；首页改用稳定 key 配置并保持 PC 默认导航专区、移动端默认热门资讯；三个 location 驱动列表在独立路由未传 prop 时展示全量，在首页继续按滚动增量展示。
- 文件：`src/router/index.js`、`src/views/home/index.vue`、`src/views/home/StandaloneFeatureLayout.vue`、三个列表组件、`src/views/home/tools/websiteGroups.json`、`.claude/project-context.md`。
- 验证：`npm run build` 通过（`vue-tsc`、Vite 构建和 404 复制成功）；开发服务器下直接访问 `/welfare` 和 `/interview` 均加载独立布局与业务内容，首页五项菜单、默认导航专区及 `InternalWebsite` 六个入口已通过浏览器快照检查；未完成移动视口实测。
- 未解决问题：独立页全量薅羊毛列表的移动端滚动性能仍需实际移动视口验证。



- 范围：根据用户决策，将项目工作方式从“不主动创建或重复创建 worktree”收紧为“不使用 Git worktree 隔离”，默认只在主 checkout 中连续迭代；移除仓库内对该临时目录的忽略和文档中的隔离副本表述。未改变应用代码、依赖或部署行为。
- 证据/决策：历史 worktree 已清理，当前只保留主工作区；项目通过 `.claude/project-context.md` 和 `.claude/iteration-log.md` 管理显性事实与迭代记录，不需要 Git worktree 并行隔离。
- 文件：`AGENTS.md`、`CLAUDE.md`、`.claude/project-context.md`、`.gitignore`、`.claude/iteration-log.md`。
- 验证：已运行文档搜索、`git diff --check`、Git worktree 状态和 Git 状态检查；未运行应用构建，因为本次仅调整工作流文档和忽略规则。
- 未解决问题：无。



- 范围：按用户确认移除两个已合并的历史 worktree、对应本地分支和 Git 残留元数据；未修改应用代码、依赖或部署配置。
- 证据/决策：`worktree-agent-aa4cbc11e7e88320d` 和 `worktree-agent-aa50eb930d99e883d` 的提交均已包含在 `master`，且目录无需保留；当前仓库采用单一 checkout 迭代，不主动使用 worktree 隔离。
- 文件：`.claude/iteration-log.md`；清理 `.claude/worktrees/` 下两个历史目录及 `.git/worktrees/` 对应元数据。
- 验证：`git worktree remove`、`git branch -d`、`git worktree prune` 成功；当前 `git worktree list` 仅剩主工作区，`git branch --list 'worktree-*'` 无结果，`.claude/worktrees/` 为空。
- 未解决问题：无。



- 范围：将普通任务明确为当前 checkout/worktree 内的定向探索和最小修改；不再默认并行 Agent、Plan Agent、分阶段流程或主动创建/重复 Git worktree；精简三份指导文档的职责重叠，并移除本地配置中的通配 `git worktree` 权限。未改变应用代码、依赖或部署行为。
- 证据/决策：`.claude/project-context.md` 继续作为事实来源；`AGENTS.md` 仅在跨领域、高风险、破坏性或需要回滚边界时触发升级流程；宿主已经提供隔离 worktree 时继续使用当前目录，但仓库规则不主动新建。`.gitignore` 保留对 `.claude/worktrees/` 的忽略。
- 文件：`AGENTS.md`、`CLAUDE.md`、`.claude/project-context.md`、`.claude/settings.local.json`、`.claude/iteration-log.md`。
- 验证：已运行文档定向搜索、JSON 解析、`git diff --check` 和 Git 状态检查；未运行应用构建，因为本次仅调整工作流文档和本地权限。
- 未解决问题：`.claude/settings.local.json` 中其他历史高影响 allowlist（如 `git push`、进程终止、文件移动和依赖重装）未在本轮清理；宿主层自动隔离行为不受仓库文档控制。



- 范围：总结本轮依赖安全 Agent 的探索、规划、实施和验证流程；将可复用的规划经验、审计口径、Windows 文件锁处理和浏览器验证边界写入项目文档；未改变应用行为或依赖版本。
- 证据/决策：依赖任务应先由只读 Agent 按构建链、直接业务依赖、部署/CI 路径并行取证，再由 Plan Agent 统一制定阶段和回滚边界；完整审计与生产审计必须分开报告；首页 HTTP 200 不能替代浏览器交互验证。
- 文件：`AGENTS.md`、`CLAUDE.md`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证：文档内容审查和 `git diff --check`；未运行应用构建，因为本次只更新项目说明和迭代经验。
- 未解决问题：Vite 6+ 迁移及 Node/浏览器基线、Vite 5 开发依赖残余审计告警、手动 SFTP 路径和未使用构建插件是否长期保留。


## 2026-07-25 — README 项目说明同步

- 范围：将 README 从简略的技术栈占位说明更新为当前项目说明，补充技术栈、主要功能、开发/构建命令、目录、部署、安全审计和维护文档入口；未改变应用行为、依赖或部署配置。
- 证据/决策：README 作为面向仓库使用者的入口文档，应反映当前已确认的 Vite 5、`write-excel-file` 延迟导出、GitHub Pages 发布和审计命令；详细 Agent 工作流与持久事实仍分别保留在 `AGENTS.md`、`CLAUDE.md` 和 `.claude/project-context.md`。
- 文件：`README.md`、`.claude/iteration-log.md`。
- 验证：文档内容审查和 `git diff --check`；未运行应用构建，因为本次仅更新项目说明文档。
- 未解决问题：沿用 `.claude/project-context.md` 中记录的 Vite 6+ 迁移、Node/浏览器基线、手动 SFTP 路径和未使用构建插件问题。


## 条目格式

每轮新条目都要形成可审查闭环。审查对象是外部产物和证据，不是 AI 的内部思维过程：

```md
## YYYY-MM-DD — 简短范围

- 任务基线：本轮目标、依据的已确认事实、明确不做什么、完成条件。
- 实际变更/偏离控制：改了什么；如偏离基线，说明触发证据、影响范围和确认状态。
- 文件：重要文件，包括相关生成/派生文件。
- 验证证据：运行了什么、证明了什么、跳过了什么、仍不能证明什么。
- 剩余风险/责任人：无（已核验），或列出风险、影响、责任人和后续动作。
```

历史条目保留原格式，不回写或重解释既有记录。

## 2026-07-25 — 智能体上下文工作流

- 范围：使仓库指导文档显式化，并针对定向探索进行了优化；新增了持久化迭代日志，未改变应用行为。
- 证据/决策：`.claude/project-context.md` 是当前项目事实的来源；结论必须区分已确认、推断和未解决的项；规划阶段保留给架构性、跨领域、破坏性或实质上模糊的工作。
- 文件：`AGENTS.md`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证：仅文档审查；未运行应用构建，因为本次迭代未改变运行时代码和依赖。
- 未解决问题：本次文档变更未引入新问题。现有项目问题保留在 `.claude/project-context.md` 中。

## 2026-07-25 — 依赖安全分阶段修复

- 范围：升级 `archiver`、Vite 5 构建链、PostCSS、visualizer 和 `vue-tsc`；将三个页面的五个 Excel 导出入口从 `xlsx` 迁移到共享的 `write-excel-file` 浏览器适配器；未执行真实 SFTP 部署、`npm audit fix --force`、提交或推送。
- 证据/决策：生产依赖审计已为 0 个漏洞；完整开发依赖审计剩余 Vite 5 链路中的 2 个漏洞（Vite/esbuild），留待未来 Vite 6+ 或更高版本迁移；导出库保持动态加载并生成独立的 `xlsx-export` chunk。
- 文件：`package.json`、`package-lock.json`、`vite.config.ts`、`src/utils/exportExcel.ts`、`src/views/Message/FundPilotV1.vue`、`FundPilotPlus.vue`、`Cryptocurrency.vue`、`.claude/project-context.md`。
- 验证：`npm ci` 成功（Windows 文件锁释放后）；`npm run build` 成功；生产 `npm audit --registry=https://registry.npmjs.org --omit=dev` 报告 0 个漏洞；完整审计报告 2 个开发依赖漏洞；开发服务器首页曾返回 200，但浏览器检查遇到 Vite 预构建依赖 504/HMR 配置错误，未完成导出按钮的真实下载验证。
- 未解决问题：Vite 5 的开发依赖审计残留、Vite 6+ 迁移目标及 Node/浏览器基线；`uploadQL.js` 的手动 SFTP 路径和未使用构建插件是否长期保留。

## 2026-07-25 — 统一独立功能页与首页视觉风格并完善迭代记录

- 范围：将共享独立功能页布局的背景、顶部固定区域、最大宽度、品牌标识、标题、返回链接、底部边框和内容留白统一为首页的视觉风格，并保留现有路由、页面标题和返回首页行为；同步记录本轮 Agent 规划经验和验证结果。未修改业务组件、路由结构、数据源或部署流程。
- 证据/决策：对照 `src/views/home/index.vue` 已确认首页使用白色背景、`1200px` 内容宽度、固定顶部区域、`35px` 圆形 Logo、`21px` 品牌标题和 `rgb(44, 62, 80)` 主色；独立布局采用相同视觉基线，并为固定头部补充内容顶部留白、为头部底部增加 `#ebeef5` 分隔线，移动端保留紧凑布局。该变更属于局部 UI 调整，不需要并行 Agent、Plan Agent 或架构级上下文改动；后续同类任务应先读取项目上下文，再定向对照目标页面、最小修改、运行基线构建和上下文检查，最后由用户确认后再提交/推送。
- 文件：`src/views/home/StandaloneFeatureLayout.vue`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证：`npm run build` 通过（面试摘要同步、`vue-tsc --noEmit`、Vite 构建和 404 复制成功）；`npm run context:check` 通过，确认本轮没有需要持久化的高影响项目事实；`npm run iteration:report -- --write --summary "统一独立功能页与首页视觉风格并完善迭代记录"` 已追加本条记录；未启动开发服务器或执行浏览器/移动视口验证，本轮视觉效果由用户确认。
- 未解决问题：无；本次尚未执行 Git commit 或 push，等待用户确认推送前的工作区检查。

## 2026-07-25 — 新增业务功能说明文档并同步 README 入口

- 范围：新增 `docs/business-function-overview.md`，按当前源码、路由、首页导航和功能页整理产品定位、业务能力地图、用户流程、入口总表及正式/演示/待开发边界；README 增加文档入口。未修改应用代码、路由行为、数据源、依赖或部署流程。
- 证据/决策：业务说明以 `src/router/index.js`、`src/views/home/tools/websiteGroups.json` 和各页面当前可见交互为主要依据；将基金和加密货币页面定义为信息展示、辅助判断、外部跳转和导出，不定义为交易执行；将 `/loginFund` 标记为演示/状态待确认，将 `/job` 和 `/life` 标记为待开发；业务说明不替代后续技术设计或产品规划。
- 文件：`docs/business-function-overview.md`、`README.md`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证：`npm run iteration:report` 已生成并写入日志；`npm run context:check` 通过；`git diff --check` 通过。未运行 `npm run build`、开发服务器或浏览器验证，因为本轮仅新增和同步 Markdown 文档。
- 未解决问题：登录入口未来是下线、保留演示还是接入正式认证，仍待后续单独决定；`job` 和 `life` 的业务方向仍未定义。

## 2026-07-25 — 确立 Element Plus 统一 UI 设计约定

- 范围：在 `README.md`、`CLAUDE.md`、`AGENTS.md` 和 `.claude/project-context.md` 中确立 Element Plus 统一 UI 设计约定：后续新增或重构页面优先复用 Element Plus 组件、主题变量、布局和交互模式，以少量业务 CSS 完成页面搭建；未修改现有页面样式、应用代码、依赖或路由行为。
- 证据/决策：项目已将 Element Plus 作为基础组件库，现有页面已使用布局、卡片、表格、表单、标签、弹窗、加载和分页等组件。为降低 UI 设计难度并保持页面一致性，默认采用“业务结构 → Element Plus 组件组合 → 少量业务样式”的设计顺序；只有明确品牌或交互理由时才允许偏离，并记录原因和影响范围。
- 文件：`README.md`、`CLAUDE.md`、`AGENTS.md`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证：`npm run iteration:report` 已生成并写入日志；`npm run context:check` 通过；`git diff --check` 通过。未运行 `npm run build`、开发服务器或浏览器验证，因为本轮仅更新项目约定文档。
- 未解决问题：无。

## 2026-07-25 — 升级 Vite 6 并收紧本地开发服务器

- 范围：将开发依赖 Vite 从 5.4.21 升级到 6.4.3，随 Vite 将 esbuild 更新到 0.25.12；删除开发服务器的全网卡监听和全来源 CORS 配置，使其恢复本机默认行为。保留现有插件、端口、代理目标、业务代码、CI、提交和推送流程，未执行 `npm audit fix --force`。
- 证据/决策：官方 registry 完整审计和生产依赖审计均为 0 个漏洞；`@vitejs/plugin-vue@5.2.4`、`unplugin-vue-markdown@0.26.3` 与 Vite 6 的依赖声明兼容。`npm ci` 首次因 Windows 上残留 `esbuild.exe`/Rollup 原生模块文件锁失败，停止 Node/esbuild 进程后重试成功；不通过手工修改锁文件解决。
- 文件：`.claude/project-context.md`、`CLAUDE.md`、`README.md`、`package-lock.json`、`package.json`、`vite.config.ts`、`.claude/iteration-log.md`。
- 验证：`npm ci --registry=https://registry.npmjs.org` 成功（释放 Windows 文件锁后）；`npm run build` 通过（摘要同步、`vue-tsc --noEmit`、Vite 6 构建和 404 复制成功，仅有既有 `@vueuse/core` PURE 注释警告）；`npm ls`/`npm explain` 确认 Vite 6.4.3、esbuild 0.25.12 及无 peer 冲突；两次官方 registry 审计均报告 0 个漏洞。`npm run serve` 输出仅有 Local 地址并提示需 `--host` 才暴露，`curl http://localhost:8080/` 返回 200；第二个路由请求因服务在重启窗口结束而未完成，未连接 Chrome 浏览器 MCP，故未完成完整浏览器流程检查。
- 未解决问题：Vite 7/8、Node/浏览器基线、手动 SFTP 路径和未使用构建插件是否长期保留，仍待后续单独决定。

## 2026-07-25 — 修复 Element Plus 类型声明解析并增加独立类型检查

- 范围：将根目录由 `unplugin-auto-import` 和 `unplugin-vue-components` 生成的 `auto-imports.d.ts`、`components.d.ts` 纳入 `tsconfig.json`；新增 `npm run typecheck` 并让 `npm run build` 复用该命令。未添加 `declare module` any shim、未修改第三方声明、源码导入路径、依赖版本或 CI 部署流程。
- 证据/决策：`element-plus@2.14.2` 已提供 `es/index.d.ts`，项目源码从包名导入且 `npx vue-tsc --noEmit -p tsconfig.json` 通过，因此采用修正 TypeScript 项目边界而不是掩盖类型错误。后续插件类型问题可通过 `npm run typecheck` 在本地和现有构建/CI 链路中自动发现并阻止继续。
- 文件：`tsconfig.json`、`package.json`、`CLAUDE.md`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证：`npm run typecheck` 通过；`npm run build` 通过（摘要同步、类型检查、Vite 构建和 404 复制成功，仅有既有 `@vueuse/core` PURE 注释警告）；`npm run context:check` 和 `git diff --check` 通过。VS Code 诊断当前仅剩 cSpell 对业务词 `pojie` 的 information 提示，未再报告 Element Plus 类型错误；未修改该拼写检查提示。
- 未解决问题：若编辑器缓存仍显示旧诊断，应选择工作区 TypeScript 并重启 Vue/TypeScript 语言服务；不要添加 any shim。

## 2026-07-26 — 建立全局拼写检查配置并总结 Agent 规划经验

- 范围：针对编辑器报告的 `pojie` 未知词提示，新增根目录 `.cspell.json`，从仓库可检查文本文件执行一次全局 cSpell 扫描，将已确认的项目专有词、技术术语、爬虫字段和既有内容中的专有名词集中加入词典；配置遵循 `.gitignore` 并排除依赖、构建产物、大型数据快照、发布图片、锁文件和自动生成声明。同步在 `README.md`、`CLAUDE.md`、`AGENTS.md` 和 `.claude/project-context.md` 补充配置用途、运行方式与维护边界，未修改业务代码、依赖、路由或部署流程。
- 证据/决策：本轮是清晰、低风险的编辑器配置与文档同步任务，因此未启动并行 Agent、Plan Agent、worktree 或分阶段编排；采用“定向确认现有配置 → 全局扫描收集词项 → 最小配置和文档更新 → 全局复核”的单 Agent 规划。扫描发现的 `deafault`、`dislpay`、`Javscript`、`asycn`、`funtion` 等疑似真实拼写错误没有直接加入词典作为正确词，而是在文档中明确后续需单独确认修正，避免以消除告警为目的掩盖内容错误。可复用经验：cSpell 配置应区分“已确认专有词”和“疑似拼写错误”，全局扫描应明确排除生成物与大数据，并将命令和排除边界写入项目文档。
- 文件：`.cspell.json`、`README.md`、`CLAUDE.md`、`AGENTS.md`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证：使用 Node 兼容的临时 `cspell@8.17.5` 完成仓库全局扫描并以 `cspell-exit=0` 通过；`git diff --check` 通过；`npm run iteration:report` 已生成本轮草稿；`npm run context:check` 通过，确认本轮项目上下文已同步；未运行 `npm run build`、开发服务器或浏览器验证，因为本轮仅修改拼写配置和协作文档。
- 未解决问题：全局扫描中识别出的疑似真实拼写错误尚未修改，需后续逐项确认其是否为内容错误；cSpell CLI 未固定为项目依赖，当前通过 `npx --yes cspell@8.17.5` 临时复核。

## 2026-07-26 — 逐项确认并修正疑似拼写错误

- 范围：对全局 cSpell 扫描中定位到的疑似错误逐项核对上下文后修正：`deafault` → `default`、`containingblock` → `containing block`、`dislpay` → `display`、`CmmonJS` → `CommonJS`、`promise.allsettled` → `promise.allSettled`、`documen.write` → `document.write`、`jasmin` → `jasmine`、`Javscript` → `JavaScript`、`asycn` → `async`、`funtion` → `function`、`jsencrpt` → `jsencrypt`，并将访谈内容中的 `eventbus` → `event bus`、`nexttick` → `nextTick`、`tostring` → `toString` 统一为正确技术术语。面试源 Markdown 同步生成的 `public/findJob-summary/full.md` 已更新；未修改仅为合法专有名词、Cookie/接口字段或爬虫随机标识的词项。
- 证据/决策：源码、脚本和技术内容中的上述词均有明确标准拼写或可由上下文确认；`event bus` 作为普通技术术语采用带空格写法，`nextTick`、`toString`、`allSettled` 保留标准 API 大小写。修正后从 `.cspell.json` 移除对应的错误词条，不再通过词典掩盖问题；README 中原先用于举例的错误词也改为泛化描述。
- 文件：`build.sh`、`src/content/interview/full.md`、`public/findJob-summary/full.md`、`src/views/Login/FundLogin.vue`、`.cspell.json`、`README.md`、`.claude/iteration-log.md`。
- 验证：`node ./scripts/sync-findJob-summary.js` 成功；全局 `npx --yes cspell@8.17.5 --no-progress --no-summary .` 通过且无剩余发现；`npm run typecheck` 通过；`npm run build` 通过（包含摘要同步、Vite 构建和 404 复制，仅有既有 `@vueuse/core` PURE 注释警告）；`npm run serve` 已验证同步后的摘要包含 `event bus`，但因 8080–8083 均已有服务，临时服务自动顺延端口；`npm run context:check` 和 `git diff --check` 通过。
- 未解决问题：无。`cspell` 仍未固定为项目依赖，仅使用 Node 兼容版本临时执行全局复核。

## 2026-07-26 — 统一协作工具说明的中文表达

- 范围：全局检查项目协作说明中的英文段落，将 `CLAUDE.md` 中 VS Code Context MCP 的标题、介绍、工具分组、工具说明和使用注意事项翻译为中文；同步翻译 `.claude/skills/vscode-context-mcp/SKILL.md` 与 `.opencode/instructions.md`。工具名称、命令、路径、协议名称和代码标识保留原文，避免影响实际调用和检索。未修改应用代码、依赖、路由或部署配置。
- 证据/决策：本轮检查确认主要面向开发者的英文说明集中在上述三个协作文档中；README、AGENTS 和项目上下文已有中文说明，代码、命令、文件路径及 MCP 工具标识不应意译。采用“保留可执行标识、翻译自然语言说明”的最小文档变更策略。
- 文件：`CLAUDE.md`、`.claude/skills/vscode-context-mcp/SKILL.md`、`.opencode/instructions.md`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证：全局 `npx --yes cspell@8.17.5 --no-progress --no-summary .` 通过；`git diff --check` 通过；`npm run iteration:report` 已生成本轮草稿；待项目上下文和本条日志同步后运行 `npm run context:check`；未运行 `npm run build`、开发服务器或浏览器验证，因为本轮仅修改协作文档。
- 未解决问题：无。

## 2026-07-26 — 补充可复制的上下文管理机制

- 任务基线：补充外部开发者可以直接理解和复制的上下文管理机制，说明文件职责、信息更新时机、最小落地步骤和验收标准；提供不含内部事实、凭据或公司模板原文的公开模板包，不修改应用代码、依赖或部署行为。
- 实际变更/偏离控制：新增 `05-context-management-guide.md`，将规则、项目入口、当前事实、迭代证据、业务基线和未来规划拆分说明；新增 `templates/context-kit/`，提供 `AGENTS.md`、`CLAUDE.md`、`.claude/project-context.md`、`.claude/iteration-log.md` 和两份业务文档模板；在外部协作 README 和项目上下文中增加复制入口及占位符替换边界。没有复制本项目的业务事实或内部 Agent 配置。
- 文件：`docs/external-developer-collaboration/05-context-management-guide.md`、`docs/external-developer-collaboration/templates/context-kit/`、`docs/external-developer-collaboration/README.md`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证证据：已检查新增文档的 15 个 Markdown 文件及其相对链接，未发现缺失目标；已运行 `git diff --check`、`npm run context:check` 和 `npm run iteration:report`。`context:check` 确认项目上下文和迭代日志已包含在本轮长期事实变更中；`iteration:report` 生成了本轮记录草稿。未运行 `npm run build`、开发服务器或浏览器验证，因为本轮只修改公开协作文档和模板；文档检查不能证明外部团队已经正确适配模板，复制者仍需补充自身项目事实并负责验证。
- 剩余风险/责任人：模板只提供方法和占位符，不自动生成真实项目上下文，也不替代公司内部审批；采用模板的开发者负责补充命令、路径、权限、数据边界和测试证据。


- 任务基线：为公司内部适配 Agent 管理模板、开源方法论来源和经脱敏审批后反哺开源的工作方式建立对外沟通资料；不公开公司内部模板、项目、客户、凭据或未公开决策，不修改应用行为、依赖或部署流程。
- 实际变更/偏离控制：新增 `docs/external-developer-collaboration/`，包含目录说明、协作模型、Agent 管理方法论、脱敏与发布审批、开源反馈闭环以及外部问题、改进提案和上游 PR 模板；在 `README.md`、`CLAUDE.md` 和 `.claude/project-context.md` 增加入口与职责边界。内容采用组织无关表述，没有复制内部模板或加入真实业务材料。
- 文件：`docs/external-developer-collaboration/README.md`、`01-collaboration-model.md`、`02-agent-management-methodology.md`、`03-sanitization-and-approval.md`、`04-open-source-feedback-loop.md`、`templates/external-question.md`、`templates/change-proposal.md`、`templates/upstream-pr.md`、`README.md`、`CLAUDE.md`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证证据：已审查新增文档的目录链接、职责边界、脱敏检查项和审批状态；已运行 `git diff --check`、`npm run context:check` 和 `npm run iteration:report`。`context:check` 确认 `project-context` 和 `iteration-log` 已包含在本轮长期事实变更中；`iteration:report` 生成了本轮记录草稿。未运行 `npm run build`、开发服务器或浏览器验证，因为本轮只新增和同步 Markdown 协作文档；这些检查不能证明公司内部审批已经完成，发布责任仍由实际审批人承担。
- 剩余风险/责任人：本目录是公开沟通模板，不替代公司法务、安全、隐私或发布审批制度；任何实际对外文档或开源 PR 仍需由对应脱敏审查人、技术审查人和发布审批人确认。


- 范围：新增 `docs/business-evolution-plan.md`，将用户提供的业务演进方向整理为独立规划文件，包含产品演进原则、业务方向、阶段路线、P0/P1/P2/P3 实施清单、代码落点、决策机制和验收标准；README 增加规划文档入口；项目上下文补充规划文件与当前业务基线的分工。未修改应用代码、路由、数据源、依赖、认证行为或部署流程。
- 证据/决策：保留 `docs/business-function-overview.md` 作为当前源码和路由的业务基线，将未来假设与已实现能力分开维护；当前只落地规划文件，后续按“使用观测与数据可信度 → 投资判断和复盘 → 高频工作台 → 知识资产 → 外部复用验证”逐步实施；第一阶段不引入账号、远程埋点、交易执行或云端同步。
- 文件：`docs/business-evolution-plan.md`、`README.md`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证：`npm run iteration:report -- --write --summary "落地业务演进规划文件并同步项目文档入口"` 已追加本条记录；`npm run context:check` 已检查项目上下文同步；`git diff --check` 通过；未运行 `npm run build`、开发服务器或浏览器验证，因为本轮只新增和同步 Markdown 文档。
- 未解决问题：无；下一轮具体实施范围按规划文件中的阶段 0/P0 清单确认。

## 2026-07-26 — 收敛个人高收益软件产品方向并更新业务演进路线

- 任务基线：在现有业务演进规划基础上，吸收新的产品结论，将项目从“个人综合信息工作台持续扩展”收敛为利用私人数据持续改善重要决策的个人高收益软件；只更新规划与长期事实，不修改应用行为。
- 实际变更/偏离控制：在 `docs/business-evolution-plan.md` 增加五项需求判断标准、通用决策复盘模型和产品边界；将交易复盘明确为 P0 第一主线，职业资产、健康精力列为后续候选，通用复盘引擎延后到具体场景闭环验证后抽象；补充交易、职业、健康的阶段路线、任务看板、验收问题和非目标，明确通用聊天壳、普通待办/日报/摘要、无反馈 AI 建议、纯仪表盘和复杂多 Agent 为当前非目标；同步 `.claude/project-context.md` 的长期产品事实。未新增路由、依赖、数据存储、账号、远程埋点、交易执行或健康诊断能力。
- 文件：`docs/business-evolution-plan.md`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证证据：已运行 `npm run iteration:report -- --write --summary "收敛个人高收益软件产品方向并更新业务演进路线"`、`npm run context:check` 和 `git diff --check`；检查证明规划文档、项目上下文和迭代日志已同步，文档无空白错误。未运行 `npm run build`、开发服务器或浏览器验证，因为本轮只修改 Markdown 规划和项目事实，不改变运行时代码；静态文档检查不能证明产品假设或后续交易复盘闭环已经验证。
- 剩余风险/责任人：产品方向仍属于待验证假设，交易复盘的实际使用频率、记录负担和是否能改变行动尚无运行证据；由项目所有者在完成 `INV-DATA-001` 后，通过最小交易记录和多次复盘验证。职业资产与健康精力暂不并行开发，通用引擎不得提前抽象。

## 2026-07-30 — 固化 Agent 运行标准

- 任务基线：将用户提供的 Agent Operating Standard 纳入项目，作为后续 Agent 执行参考；沿用现有协作规范入口，不修改应用代码、依赖、用户级配置或自动化钩子；完成条件为标准内容完整落盘、Claude 项目入口可发现并通过文档检查。
- 实际变更/偏离控制：在 `AGENTS.md` 新增“Agent 运行标准”，覆盖使命、优先级、任务定义、基准交付、探索模式、决策、实施、验证和最终报告；在 `CLAUDE.md` 增加执行入口，在项目上下文记录长期工作偏好。未另建重复规范文件，也未改变现有普通任务最小修改和高风险升级边界。
- 文件：`AGENTS.md`、`CLAUDE.md`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证证据：已审查既有协作规范并运行 `git diff --check`（通过，仅有 Windows 工作区 LF/CRLF 转换提示）、`npm run iteration:report`（成功生成草稿）和 `npm run context:check`；首次 `context:check` 正确指出长期事实及日志尚未同步，随后已补齐。未运行应用构建、开发服务器或浏览器验证，因为本轮仅修改 Markdown 协作规范，不改变运行时代码；文档检查不能保证所有非 Claude Agent 自动读取这些文件，具体工具仍需将 `AGENTS.md` 或 `CLAUDE.md` 设为规则入口。
- 剩余风险/责任人：项目内 Claude Code 可通过 `CLAUDE.md` 发现该标准；其他 Agent 工具是否自动读取 `AGENTS.md` 取决于各自的加载机制，由后续接入者确认并配置入口。

## 2026-07-30 — 明确远程提交目标分支确认规则

- 任务基线：记录本轮纠正后的 Git 推送偏好：当用户只要求提交到远程但未指定目标分支时，Agent 应先确认目标，不擅自创建远程分支；本轮用户已明确授权直接推送到 `master`。不修改应用代码、依赖或部署配置。
- 实际变更/偏离控制：在 `AGENTS.md`、`CLAUDE.md` 和项目上下文中增加目标分支确认规则；保留推送前检查远程状态和快进边界的安全要求。随后将既有 Agent 标准提交和本轮规则提交快进合入并推送到 `origin/master`；不创建新的远程分支或 merge commit。
- 文件：`AGENTS.md`、`CLAUDE.md`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证证据：计划运行 `git diff --check`、`npm run context:check` 和 `npm run iteration:report` 验证文档与记录完整性；推送前获取 `origin/master` 并验证本地合并可快进，推送后检查远程引用。未运行应用构建或浏览器验证，因为本轮仅修改 Markdown 协作规则。
- 剩余风险/责任人：远程功能分支 `origin/docs/agent-operating-standard` 是上一轮已创建的历史分支，本轮不擅自删除；如需清理，由用户另行授权。

## 2026-07-30 — 建立项目参考与借鉴目录

- 任务基线：创建一个用于学习其他项目优秀思路的项目内目录，支持来源追溯、适用性分析和后续验证；不引入第三方代码、依赖或未经验证的项目结论。完成条件为目录入口清晰、模板可直接复用，并与项目事实和业务规划职责分离。
- 实际变更/偏离控制：新增 `docs/project-references/README.md`，定义研究材料、状态、流程以及安全和许可证边界；新增 `project-template.md`，统一记录来源、观察事实、借鉴点、不适用内容和最小验证实验；在 README 增加目录和维护入口，在项目上下文记录其长期职责。未收录具体外部项目，也未改变应用行为。
- 文件：`docs/project-references/README.md`、`docs/project-references/project-template.md`、`README.md`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证证据：已审查新增文档的相对链接，确认项目上下文、业务演进规划和模板目标均存在；已运行 `git diff --check`、`npm run context:check` 和 `npm run iteration:report`，文档格式检查通过，长期职责和迭代记录已同步。未运行应用构建、开发服务器或浏览器验证，因为本轮仅新增和同步 Markdown 文档；这些检查不能证明未来收录的借鉴方案有效，仍需按模板执行最小实验。
- 剩余风险/责任人：目录不会自动验证第三方主张或许可证兼容性；每个参考项目的记录人负责核对来源、许可、隐私边界和实验结果，项目所有者负责决定是否进入正式规划。

## 2026-07-31 — 建立并真实验证公共数据采集安全基准

- 任务基线：分析并分类本地 `qinglongBackup` 参考仓库的能力，优先用其中安全的 RSS 聚合思路补齐项目已有 `/newsArticle` 页面缺失且未经验证的数据链路；不新增平行验证页，不迁移账户、交易、SFTP/SSH、青龙管理、浏览器或原生二进制任务，不改变旧 Python crawl、`python-crawl` 和 `gh-pages` 的既有写入目标。完成条件为本地证明“真实公开来源采集 → 有效 JSON → 现有 Vue 页面消费 → 桌面及移动浏览器证据”，并让 `master` push 与定时 CI 自动复用同一采集命令、校验构建产物后沿原有 Pages 链发布。
- 实际变更/偏离控制：外层 `.gitignore` 排除嵌套参考仓库和本地 artifact；新增脱敏评估文档，将能力分为“现在值得做、验证后再做、暂时不能做”。新增 Node collector 公共库，实现 HTTPS 域名白名单、禁止 URL 凭据和隐式重定向、超时与有限重试、响应类型/大小检查、统一数据元信息、非空/新鲜度/URL/敏感字段校验和原子输出；新增两条公共 RSS/Atom 白名单、离线 fixtures 和 `node:test`。两个来源独立容错，单个来源失败时保留其余成功来源，全部来源失败仍阻止输出；测试覆盖部分成功与全部失败不覆盖。定向检查现有消费者和参考脚本后，确认 `qinglongBackup/rssSub.js` 最终产物正是 `recommendArticleData.json`，而项目 `/newsArticle` 已请求该数据但仓库中没有对应文件，因此删除探索阶段创建的独立静态预览和 `CollectorPreview.vue`/`/collector-preview`。新增 `collect:rss:site` 生成被 Git 忽略的 `public/data/recommendArticleData.json`，`verify:rss:local` 先运行测试、真实采集和生产构建，再用 `vite preview` 打开现有 `/newsArticle`；页面兼容原数组与带 `items` 的 collector 包装结构，补充加载、错误、空状态和生成时间。正式 `ci.yml` 在 `master` push、手动触发和每日北京时间 06:17 的 schedule 下自动运行同一测试和采集命令，随后继续旧 Python crawl、构建和 Pages 部署；构建后通过文件非空及逐字节比对确认 JSON 已进入 `dist/data`，不新增 artifact、secret、分支写入或部署目标。
- 文件：`.gitignore`、`.github/workflows/ci.yml`、`scripts/collectors/`、`src/views/Message/NewsArticle.vue`、`vite.config.ts`、`package.json`、`package-lock.json`、`docs/project-references/`、`README.md`、`AGENTS.md`、`CLAUDE.md`、`.claude/project-context.md`、`.claude/iteration-log.md`。
- 验证证据：`npm ci --registry=https://registry.npmjs.org` 已成功，证明锁文件可重现安装；`npm run test:collectors` 最终通过 9 项离线测试，覆盖 RSS/Atom 规范化、去重排序、空/格式错误、非 HTTPS、URL 凭据、重复链接、敏感字段、域名白名单、响应类型/大小、有限重试、原子替换、单来源失败继续、全部来源失败不覆盖和无网络候选写入；`npm run collect:rss:fixture` 生成 2 个来源、3 条候选，最终真实 `npm run collect:rss:site` 从 Hacker News 和美团技术团队生成 20 条有效数据。新增 `fast-xml-parser@5.3.8` 首次审计出现 1 个高危公告，未运行 `npm audit fix`，定向升级至 `5.10.1` 后完整及 `--omit=dev` 官方 registry 审计均为 0 个漏洞。完整本地生产链再次运行 collector 测试、真实采集、`npm run build`，并通过非空及 `cmp` 验证 `public/data` 与 `dist/data` 文件逐字节一致。生产预览在桌面和 390×844 移动视口均通过 `/data/recommendArticleData.json` 渲染 20 条外链、生成时间和来源，网络请求为 200、控制台无 error/warning/issue、移动端无横向溢出，也未显示不存在的阅读评分或推荐理由；证据保存在被 Git 忽略的 `docs/verification-reports/2026-07-31-rss-production-automation.md`。线上现有数据端点在本轮检查时返回 404，确认没有可依赖的旧 RSS 快照。CI diff 静态确认仅新增 schedule、测试、采集及构建产物一致性校验，不新增 artifact、secret、分支目标或部署目标。
- 剩余风险/责任人：本地证据不能证明 GitHub Runner 可稳定访问 RSS 来源，首次远程 CI 和线上 Pages 仍须在明确授权推送后核验；单个来源失败不会阻断，但全部来源失败会按设计停止本次发布，旧 `gh-pages` 内容保持不变。维护者负责检查 Actions 中的 collector、旧 crawl、构建产物校验和部署步骤，并核验线上 `/data/recommendArticleData.json` 与 `/newsArticle`。RSS 来源条款、robots 和转载许可由数据所有者在正式发布前确认；参考仓库曾暴露的凭据由该仓库所有者负责撤销、轮换和清理历史。现有 Python collector 的强推、失败覆盖和采集/部署耦合仍需仓库维护者后续单独规划。

## 2026-07-31 — 补齐 52pojie 旧采集链浏览器验证报告与持久证据

- 任务基线：针对用户指出的“执行结果没有生成报告、浏览器检查没有可复核依据”，将已经完成的 `52pojie.py` 真实采集与现有首页消费者验证重新执行并持久化；完成条件为保存采集校验、桌面和移动截图、页面指标、关键网络状态、控制台摘要以及包含未验证边界的报告。只验证无需凭据和副作用的 52pojie 最小旧采集链，不执行含硬编码 Cookie、通知或 Selenium 的其他旧脚本。
- 实际变更/偏离控制：在被 Git 忽略的 `docs/verification-reports/` 生成 52pojie 本地端到端报告、截图及机器可读证据；报告明确区分 `52pojie` 业务分块成功与导航专区外部豆瓣 favicon 404。本地报告用于复核但不纳入提交范围。将“复杂数据流、UI 或部署验收不能只在对话中叙述，需生成本地报告和按需证据”的要求同步到 `AGENTS.md`、`CLAUDE.md` 和项目上下文；简单文档和局部代码修改不机械生成报告。首次尝试新启预览时发现 4173 已被已有预览占用，因此复用已确认运行的生产预览，没有终止未知进程或切换为开发代理路径。
- 文件：`AGENTS.md`、`CLAUDE.md`、`.claude/project-context.md`、`.claude/iteration-log.md`、`.gitignore`；`docs/verification-reports/` 和 `src/public/data/52pojie.json` 均为本地验证产物，前者被 Git 忽略，后者在证据保存后恢复 Git 基线，均未纳入待审查变更。
- 验证证据：真实运行 `python ./src/crawl/52pojie.py`，目标返回 HTTP 200 并生成 48 条数据；机器校验确认非空、必需字段完整、0 条无效记录、0 个重复 URL、48/48 HTTPS，且首条由 Git 基线的 2023 年记录更新为 2026-07-30 记录。`npm run build` 通过类型检查和 Vite 生产构建。Chrome 在 1365×768 和 390×844 下进入首页现有“吾爱破解”标签：新首条标题正常展示，`scrollWidth` 等于视口宽度，业务分块 `assets/52pojie-DoyFtcig.js` HTTP 200；移动端重新选择该标签后控制台无 error/warning/issue。桌面导航阶段仅有 `icons.duckduckgo.com/ip3/movie.douban.com.ico` 外部 favicon 404，已在报告中标为与 52pojie 无关的非阻断噪声。截图、指标、资源状态和控制台摘要均已保存并由报告链接。完整 `build.sh` 未运行，因为 Windows 明确不支持且其余旧脚本混有硬编码会话与副作用；本地结果不能证明 GitHub Actions 和线上 Pages。
- 剩余风险/责任人：其他旧 Python 脚本仍需由仓库维护者先去除硬编码凭据、隔离通知/浏览器副作用并增加失败不覆盖校验；外部 favicon 404 由前端维护者后续决定是否增加本地 fallback；首次远程 Actions、artifact 和线上 Pages 验收须在用户明确授权推送后由仓库维护者执行。本轮没有提交或推送。

## 2026-08-01 — 修复 Python 采集可靠性并建立可信事实链

- 任务基线：对 `src/crawl/` 全部旧脚本建立统一的失败语义、Schema、原子发布和 last-known-good 基线；账号态仅通过环境变量/Actions Secrets；保持既有 JSON 和 Vue 消费者契约。完成口径不是退出码、HTTP 200 或构建通过，而是“真实采集 → 产物完整性 → 生产 Vue 消费 → 页面/网络/控制台证据”。不提交动态数据、凭据或本地报告，不执行远程推送。
- 实际变更/偏离控制：新增 `src/crawl/lib/`、统一 runner、固定 Python 依赖和回归测试；重构资讯、福利、LeetCode、Douban、Boss、TikTok/Kuaishou 和通知脚本，移除本轮触及的硬编码会话并增加 `success/preserved/skipped/failed`、原子/事务发布、Selenium 生命周期和 LeetCode staging/manifest。CI 复用统一 runner、保留既有 `python-crawl`/`gh-pages` 目标。将用户纠正的证据等级、报告和工具环境要求写入 Agent 规则、playbook 与只读检查。真实验收发现豆瓣海报代理被 ORB/CORB 阻断，后续定向修复为采集阶段验证并保存同批 data URL、构建阶段从本地 JSON 按需加载，移除浏览器 jsDelivr/weserv 链；动态 `src/public/data/` 在验收后恢复 Git 基线。
- 文件：`src/crawl/`、`requirements-crawl.txt`、`build.sh`、`package.json`、`.github/workflows/ci.yml`、`scripts/check-context-maintenance.js`、`AGENTS.md`、`CLAUDE.md`、`docs/agent-verification-playbook.md`、`.claude/project-context.md`；被忽略的完整报告为 `docs/verification-reports/2026-08-01-python-collector-reliability.md`。
- 验证证据：Python 23 项和 Node RSS 9 项测试通过，`compileall`、`npm run typecheck`、`npm run build` 通过；真实来源中 Infzm、Juejin、GitHub Trending、52pojie、Meituan、Zhuanyes、Daydayzhuan、Douban 和 RSS 成功发布，数据扫描敏感字段 0、乱码替代符文件 0。生产 preview 4177/4178 验证 `/welfare`、`/tech-forum`、`/github-trending`、`/leetcode`、`/newsArticle` 及首页 Boss/豆瓣；RSS 完成桌面/移动闭环，LeetCode 随机换题交互通过，Boss 显示 59 个职位标题且图片无破损。LeetCode 第三次全量运行耗时 195.92 秒仍为 preserved 3169，未发布半成品；豆瓣定向首次真实采集产生 50 部电影和 50 张同批海报，ID 完全匹配，生产豆瓣页面 9/9 为本地 JPEG data URL，fallback 与破图均为 0，加载 9 个本地 poster chunk，jsDelivr/weserv/doubanio 海报请求均为 0，未再出现 ORB/CORB。收尾复跑遇到图片源挑战，完整性检查正确 `preserved`；恢复 Git 基线后当前 50 个电影 ID 仍全部有已跟踪海报。
- 剩余风险/责任人：新版 LeetCode 全量 success、Zhipin/网络波动源的新候选、0818/福利聚合、账号态 Kuaishou/TikTok 均未证明；由采集维护者继续定向修复和补证。GitHub Actions、Secrets、`python-crawl` 与 Pages 未远程实跑，由仓库维护者在获得明确目标分支推送授权后验收。豆瓣海报 glob 路径、同批 ID 和 MIME 契约由前端与采集维护者后续变更时共同回归。外部来源许可由项目所有者确认。

## 2026-08-01 — 恢复福利聚合与置顶源并增强网络波动分类

- 任务基线：继续修复 0818、福利聚合、置顶源、Zhipin、Weibo、V2EX 和 GitHub Trending；要求真实执行、Schema/完整性、生产 Vue 消费和可信报告形成事实链。不通过关闭 TLS 校验、HTTP 降级、绕过挑战或伪造发布时间获得“成功”，不提交动态快照或本地报告。
- 实际变更/偏离控制：HXM5 改用公开 HTTPS POST JSON 协议并过滤非同源作者图片；DaydayzhuanTop/ZhuanyesTop 通过有界并发访问详情页取得真实日期，只发布有日期的置顶项；Weibo 补充公开 endpoint 所需请求上下文和成功 envelope，缺少上榜时间时明确使用采集时间；公共 HTTP 层支持 allowlisted 官方 fallback，V2EX 尝试三个官方 HTTPS 主机；Zhipin 在等待失败后再次检查延迟登录/安全重定向。0818 的 HTTPS 证书/边缘节点仍不可用，HTTP-only 来源未采用，历史 49/3 条 HTTP 快照也未被当作有效 last-known-good。福利页面增加图片错误 fallback，但消除 CORB 的根本修复在 collector 层完成。
- 文件：`src/crawl/lib/http.py`、`src/crawl/lib/welfare_sources.py`、`src/crawl/welfare.py`、`src/crawl/weibo.py`、`src/crawl/v2ex.py`、`src/crawl/zhipin.py`、`src/crawl/tests/`、`src/views/home/welfare/index.vue`、`.claude/project-context.md`、`.claude/iteration-log.md`；被忽略的最终报告为 `docs/verification-reports/2026-08-01-python-collector-reliability.md`。
- 验证证据：28 个 Python 测试、9 个 Node collector 测试、`compileall`、类型检查和生产构建通过。真实 collector 最终为 welfare success 25、Weibo success 50、DaydayzhuanTop success 6、ZhuanyesTop success 12、GitHub Trending success 后 preserved 12、V2EX preserved 7、Zhipin challenge 后 preserved 60、两个 0818 skipped；目标数据除两个 0818 历史 HTTP 文件外均通过 Schema、最低条数、唯一键、乱码和敏感字段检查。生产 `/welfare` 桌面/移动显示 129 卡片、0 破图、0 远程作者图、0 横向溢出且控制台无问题；`/github-trending` 显示 12 个唯一仓库、0 破图、无溢出；`/tech-forum` 显示 preserved 的 7 条 V2EX，0 破图且控制台无问题；首页 Boss 显示 preserved 职位数据。仓库没有导入 `weibo.json` 的 Vue 消费者，因此 Weibo 页面闭环明确未完成。
- 剩余风险/责任人：采集维护者需继续寻找满足 HTTPS/Schema 的 0818 来源，在允许网络中复核 V2EX 新候选，并仅在不绕过安全挑战的授权环境验证 Zhipin 新职位；前端维护者决定是否把 Weibo 接入现有业务页面。GitHub Actions、`python-crawl`、`gh-pages` 和线上 Pages 未远程实跑，由仓库维护者在获得明确推送授权后验收。


# 2026-08-01 — 保留 V2EX 与 0818 Top 合同并复核账号态阻断

- 任务基线：纠正通过删除 `src/public/data/v2ex.json` 和 `src/public/data/welfare/0818tuanTop.json` 收口验证项的错误方向；保留 V2EX、0818 普通与置顶业务目标，继续使用合法 HTTPS 与显式数据语义；只在当前环境确有授权凭据时运行账号态 Kuaishou/Douyin，不读取、输出或猜测凭据，不绕过安全验证。
- 实际变更/偏离控制：恢复 V2EX optional registry、历史数据文件和 `/tech-forum` 消费，页面用 Element Plus warning 显示“保留快照”、最近数据时间及“不代表当前热点”；真实官方 V2EX collector 仍为 `preserved 7`，因此没有伪报新候选。移除 0818 Top collector 删除历史文件的逻辑并增加回归测试；置顶文件保留但因三条链接仍为 2023 HTTP 数据而不接入 `/welfare`。调查公开 RSS、TopHub route 源码与页面边界后确认前两者只提供 title/link/description，未提供 top/pinned/sticky 字段，TopHub 页面受安全验证阻断且未绕过，因此不能把普通榜首伪造为置顶。本地 `KUAISHOU_COOKIE`、`DOUYIN_COOKIE` 均未配置；两个 collector 定向运行均真实记录为 skipped 并保留旧快照，没有输出凭据。
- 文件：`src/crawl/lib/welfare_sources.py`、`src/crawl/run_collectors.py`、`src/crawl/tests/test_collectors.py`、`src/views/home/news/index.vue`、`src/public/data/v2ex.json`、`src/public/data/welfare/0818tuanTop.json`、`docs/business-function-overview.md`、`.claude/project-context.md`、`.claude/iteration-log.md`；被忽略证据位于 `docs/verification-reports/current/`。
- 验证证据：Python crawler 39/39、`compileall`、`npm run typecheck`、生产构建通过；V2EX 真实执行为 preserved 7、changed=false、新 URL 0、时间戳未推进。独立 `vite preview` 43223 的 `/tech-forum` 在桌面 1365×768 与 mobile/touch 390×844 均显示 7 个唯一 HTTPS V2EX 链接和保留快照警告，0 破图、无横溢、console error/warn/issue 为 0。`/welfare` 两视口仍只消费 49 个唯一 0818 HTTPS 索引链接，原站链接 0、三条旧 top 标题 0，证明保留文件没有重新接入无效数据。账号态定向结果为 Kuaishou skipped/旧 43 条、Douyin collector（registry 名 tiktok）skipped/旧 270 条。
- 剩余风险/责任人：`0818-TOP-HTTPS` 尚不能由当前公共证据真实关闭；采集维护者需要显式标识置顶且全链 HTTPS 的合法入口，成功前保持合同与历史文件、但不消费旧 HTTP 数据。`ACCOUNT-COLLECTORS` 仍需要项目所有者提供或在执行环境配置已授权且有效的 `KUAISHOU_COOKIE`/`DOUYIN_COOKIE` 后重新运行；无凭据时不能伪造完成。V2EX 当前只是透明展示历史快照，尚无当前新候选。外部来源许可与账号授权由项目所有者/合规责任人确认。本轮未提交、推送、部署或触发 Actions。

## 2026-08-01 — 固化结论—证据可追溯与产品合同保护

- 任务基线：总结本轮多源采集、产品纠正和真实浏览器验收中的优秀 Agent 做法，提升后续管理的效率、准确率和速度；只沉淀可复用规则、playbook、报告索引合同与只读检查，不扩大产品功能、不新增 Hook、不修改用户级配置。
- 实际变更/偏离控制：将有效模式收敛为“先机器证据、后事实观察、再推导结论、最后生成总览”，要求关键结论直接链接 collector/接口、产物、浏览器指标、网络与截图，并区分各证据能证明的层级；`current/index.json` 的 `claims` 成为机器可检查合同，缺少 inference、缺失/越界证据或未知证据类型会阻止刷新，未解决项可从 `latest.md` 跳到对应推导链。将本轮反复出现的失败模式固化为产品合同保护：外部源失败、无新候选、缺凭据或缺显式语义时，默认保留 source/registry/文件/消费者目标，以 preserved/skipped/blocked 或 stale UI 表达；未经用户明确同意不再通过删除数据源、替换采集目标或伪造字段制造完成。为减少重复探索，后续先复用已登记 claims，仅在源码、数据、消费者或运行环境变化时定向重跑对应事实链。
- 文件：`AGENTS.md`、`docs/agent-verification-playbook.md`、`scripts/verification-report-index.js`、`scripts/tests/verification-report-index.test.js`、`scripts/check-context-maintenance.js`、`.claude/project-context.md`、`.claude/iteration-log.md`；被忽略的 `docs/verification-reports/current/index.json`、权威综合报告和自动生成 `latest.md` 同步采用该合同。
- 验证证据：报告治理测试由 7 项增加至 11 项，覆盖确定性生成、缺少 inference、缺少证据、路径越界和未知证据类型；`npm run verification:refresh` 连续两次生成相同 SHA-256，并在总览中为投资缺失状态、Boss、0818 普通/Top、V2EX、账号态 collectors 和 Pages 因果边界生成可点击事实链。`npm run context:check` 读取同一索引并验证权威报告包含“关键结论证据导航”；`git diff --check` 用于收尾。未运行应用构建或重新采集，因为本轮只修改 Agent 治理和报告生成/校验逻辑，引用的是本轮已保存并经过真实执行的现有证据。
- 剩余风险/责任人：结构检查能保证链接存在和字段齐全，不能自动判断截图内容、JSON 字段和推导逻辑是否真实一致；执行 Agent 仍需按证据等级做人工语义审查。被 Git 忽略的本地报告不会随源码提交，长期共享这些证据时需项目所有者另行决定安全的发布或归档方式。
