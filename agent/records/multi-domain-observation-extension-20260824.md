# 多领域观察采集插件任务记录（三平台升级：BOSS直聘/快手/抖音）

- 日期：2026-08-24
- 目标：把双资产插件（基金 + 币安）升级为三领域多平台插件——金融（基金复盘、加密货币分析）、市场需求（BOSS直聘工作招聘）、娱乐（快手、抖音），新增三个平台的「观察采集」能力。
- 上游输入：[币安观察采集插件任务记录](binance-observation-extension-20260824.md)（本轮重构其文件布局：binance 专属三文件合并为通用观察引擎）、[采集脚本浏览器插件配合评估](../product/research/crawl-extension-assessment.md)、用户本轮口述的三条产品逻辑。
- 本记录取代上一轮记录中的文件布局描述；币安的登录调试清单入口从「加密货币观察 tab」变为「金融 tab 内的币安合约观察卡片」。
- 同日后续修订（v3.4.0）：应用户要求补上「产品数据诉求」层——观察采集不再只有技术操作指引，而是围绕[多领域采集产品数据诉求](../product/source/multi-domain-data-requirements.md)中定义的核心数据实体（每领域产品能力赖以成立的实体×字段）定向触发，观察报告自动输出 coreFields 核对（实体字段确认度 + 来源端点），硬依赖实体零命中聚合为警告。

## 产品定位（用户口述，指导后续正式采集的设计方向）

| 领域 | 平台 | 产品逻辑 |
| --- | --- | --- |
| 金融 | 天天基金（正式采集）/ 币安合约（观察） | 复盘系统：避免一次重大错误导致巨大损失，不做市场预测 |
| 市场需求 | BOSS直聘 | 降低用户搜索成本，快速一键获取高价值信息（职位清单直接拉取，替代逐页搜索） |
| 娱乐 | 快手 / 抖音 | 反平台注意力停留算法：帮助用户高效获取自己感兴趣的娱乐内容，直接进入娱乐消费而不是不断滑动视频增加停留时长 |

## 架构决策

1. **三平台沿用观察采集（observation-first）模式，实测依据**（2026-08-24 无凭据 curl）：`www.zhipin.com/suzhou/` HTTP 200 但 526KB HTML 中 `job-card-wrapper` 0 次（登录墙，与评估文档 2026-08-23 实测一致）；`www.kuaishou.com/graphql` 无 Cookie 返回 `{"result":2}`；`www.douyin.com/` 仅 2397 字节壳页。三平台网络可达但目标数据全在登录墙后，与币安场景同类——只被动捕获已登录页面自身的流量，后台不自行请求。
2. **通用观察引擎替代平台专属脚本**。上一轮 binance-bridge/binance-collector/binance-capture 三文件的拦截核心（fetch/XHR/WS/Worker、快照归并、容量上限）平台无关，本轮抽象为三个通用模块，平台差异全部收敛为配置表：观察桥按 hostname 选平台配置（候选端点正则/排除路径/敏感字段/WS 分类），协议模块按平台定义 coverage dataset 分类器。新增平台 = 加两段配置，不加新文件。
3. **快照归并加入 operationName 维度**（快照指纹：方法+路径+query 键+operationName+请求体键）：快手 `/graphql` 是单一端点多查询，按 operationName 区分才能呈现「端点×查询」清单而非归并成一条。
4. **任务互斥升级为三方互斥**：基金采集 ↔ 任一平台观察（同一时刻只允许一个观察任务运行，与基金采集互斥）。每平台独立暂存/回执/闹钟（键 `observationStaging:<platform>`），旧键 `cryptoObservationStaging` 废弃（观察报告从未导入站点，无需迁移）。
5. **敏感面扩展**：新增中国手机号匿名化（BOSS 场景 HR/求职者联系方式的真实风险，残留自检同步覆盖）；URL query 中命中敏感名的参数保留参数名、值替换 `<MASKED>`（观察报告需要呈现「端点携带 msToken/csrftoken」的契约事实但不保留值）；平台专属敏感键（zhipin 的 zp_token/stoken、kuaishou 的 passToken、douyin 的 msToken/a_bogus/ttwid 等）从捕获时即剥离。排除路径：zhipin 登录安全与私信聊天（聊天是私人对话）、douyin 登录鉴权路径。
6. **基金链路零改动**：基金采集的页面、消息、存储键全部不变；web-bridge 与观察消息零耦合。

## 实现内容（v3.3.0 → v3.4.0）

v3.4.0 增量（产品数据诉求核对）：

- `observation-capture.js` 新增 CORE_ENTITY_RE 核心实体配置（对齐数据诉求文档）：binance 的 Position/Equity/Order/Funding，zhipin 的 Job/Company/Boss/SearchContext，kuaishou/douyin 的 Video/Author/FeedContext；每实体带 required（must=硬依赖/hint=高价值线索）、trigger（触发方式提示）、字段候选正则。
- 观察报告新增 `coreFields` 块：每实体输出命中字段清单（字段名+来源端点）、observedFieldCount/totalFieldCount、completeness。字段名扫描三处来源——响应体（含超大响应的 fieldNames 路径分段）、URL query 参数（已脱敏但参数名保留）、请求体（分页游标在请求侧，也是待确认契约）。
- 硬依赖实体零命中聚合为警告（含触发方式指引），popup 卡片在报告就绪时直接展示核心字段确认度与缺失实体点名。
- 登录调试指引升级为按实体触发（如币安「依次打开持仓面板/账户资产/历史委托与成交/资金费率」分别触发四类核心数据）。

v3.3.0 主体：

| 文件 | 角色 |
| --- | --- |
| `content/observation-bridge.js`（新，替代 binance-bridge.js） | MAIN world 通用观察桥：四平台（binance/zhipin/kuaishou/douyin）配置表 + fetch/XHR/WS/Worker 拦截 + 快照归并（含 operationName）+ query 敏感参数掩码 + 容量上限 |
| `content/observation-collector.js`（新，替代 binance-collector.js） | ISOLATED 通用中继：chrome.runtime ↔ window.postMessage（OBSERVATION_PING/READ/RESET） |
| `observation-capture.js`（新，替代 binance-capture.js） | 多平台协议组装：`<platform>-observation-capture/0.9`、每平台 coverage dataset 分类器与警告、脱敏（伪 ID/邮箱/手机号）、残留自检（含手机号） |
| `background.js`（改） | 观察编排平台参数化：`observationTasks` Map、`findOrCreateObservationTab`（平台 tab 模式与 fallback URL 配置）、alarms 按平台派生、存储键按平台派生、`GET_OBSERVATION_STATUS` 一次返回全平台状态；基金入口互斥检查参数化 |
| `collection-policy.js`（改） | `cryptoCollectionOptions` → `observationCollectionOptions`（仍仅 popup 可启动） |
| `popup.*`（改） | 三领域 tab（金融/市场需求/娱乐）+ 四张动态生成的观察卡片（每张：开始/提前结束/时长配置/双导出/丢弃/登录指引）；观察时长为全局配置（四平台共用） |
| `manifest.json` | v3.2.0→3.3.0：+`zhipin.com`/`kuaishou.com`/`douyin.com` host_permissions；币安期货页两组脚本改为通用观察脚本；zhipin/kuaishou/douyin 各两组（MAIN document_start + ISOLATED document_idle）；共 11 组 content_scripts |
| 已删除 | `binance-bridge.js`、`binance-collector.js`、`binance-capture.js`（合并进通用引擎） |

## 各平台候选端点（观察桥宽匹配范围，待登录报告确认）

| 平台 | 候选 | 排除 |
| --- | --- | --- |
| binance | `/bapi/* /fapi/* /api/* /sapi/*` | pay/p2p/kyc/提现等强敏感路径 |
| zhipin | `/wapi/*`（web 端私有接口） | zppassport 登录安全、zprelation/chat/msg 私信聊天 |
| kuaishou | `/graphql`（POST，含 operationName） | 无 |
| douyin | `/aweme/v1/web/*` | passport/login/auth 鉴权路径 |

## 安全边界

- 不读取 `document.cookie`；不保存任何认证字段（通用清单 + 平台专属清单双层剥离）；query 敏感参数值即捕即掩码。
- 不替用户向任何平台发送业务请求；观察桥只读，crypto 侧的分页重放模式不引入。
- 私信聊天、登录安全、支付提现路径宁可少采不多采。
- 脱敏导出残留自检（原值/邮箱/手机号）失败即拒绝生成；完整备份仅限本地。
- 观察数据只在页面内存与本地 storage，不外传。

## 验收状态

已验证：全部脚本 `node --check` 通过（background/popup/observation-bridge/observation-collector/observation-capture）；manifest JSON 校验通过（v3.4.0，11 组 content_scripts，7 个 host_permissions）；旧引用零残留扫描通过（仅剩有意的旧配置键向后兼容读取与废弃注释）；协议模块运行时 smoke test 通过——四平台模拟数据跑完整链路，含 v3.4.0 回归：核心字段命中/缺失警告聚合（binance 故意缺 Order/Funding 响应→警告正确点名两实体）/请求侧字段（BOSS SearchContext、快手 FeedContext 游标）核对/超大响应 fieldNames 路径分段命中/脱敏链路不破坏 coreFields；`node project-support/scripts/extension/build-zip.js` 生成 `dist-extension/lptff-investment-assistant.zip`（55481 bytes）。

未验证（按[可信验证](../standards/trusted-verification.md)如实声明）：**真实 Chrome 登录态下四平台的端到端观察流程未执行**——属维护者的登录调试环节。未加载验证前，本记录不声称观察采集可用，只声称静态交付完成 + 协议模块逻辑经模拟数据验证。

## 维护者登录调试清单（你来做，每平台约 2 分钟）

前提：Chrome 已加载新 zip（v3.4.0），或加载已解压目录 `project-support/extension/lptff-investment-assistant/`。

**通用流程**：登录平台 → 打开目标页 → popup 对应领域 tab → 该平台卡片「开始观察采集」（默认 90 秒）→ 在页面里按实体触发操作 → 倒计时结束自动生成报告（卡片直接显示核心字段确认度与缺失实体点名）→ 「下载脱敏观察报告」→ 把 `<platform>-observation-desensitized.json` 给我。

| 平台 | popup 位置 | 按实体触发的操作（括号内为目标实体） | 期望确认的契约 |
 --- | --- | --- | --- |
| 币安合约 | 金融 tab | 打开持仓面板（Position）/账户资产（Equity）/历史委托与成交（Order）/资金费率（Funding） | 各实体字段在哪个 bapi 端点、字段实际命名 |
| BOSS直聘 | 市场需求 tab | 搜索并翻 2–3 页（Job+SearchContext，分页参数）；点开 1–2 个职位详情 | `/wapi/zpgeek/search/*` 职位列表字段结构（名称/薪资/经验/学历/地区）与分页形式 |
| 快手 | 娱乐 tab | 滚动 3–4 屏（Video+FeedContext 游标；作者信息通常内嵌在视频响应，若 Author 零命中则点开一个作者主页） | feeds 字段结构 + 作者内嵌情况 + pcursor 形式 |
| 抖音 | 娱乐 tab | 同快手 | `/aweme/v1/web/*` 字段结构（aweme_list/desc/statistics/author）+ cursor/has_more |

各平台失败排查：报告端点数为 0 → 未登录或数据早于观察窗口加载 → 刷新目标页后立即重新观察一次。

## 同日后续：v3.5.0 正式来源采集与真实 Chrome 验收

维护者授权 Chrome DevTools MCP 接管已登录的币安合约、BOSS直聘、快手和抖音页面后，观察阶段的关键 unknown 已消除。插件在保留 `<platform>-observation-capture/0.9` 证据包的同时，新增 `<platform>-source-capture/1.0` 正式来源包。

### 真实契约与实现修订

| 平台 | 真实端点/结构 | 正式实体结果 |
| --- | --- | --- |
| 币安合约 | `user-position`、`user-balance`、`symbol-config`、`open-orders`、`filled-order`、`trade-history`、`premiumIndex`、资金费率历史 | Position/Equity/Order/Funding 白名单归一化；实际响应超过 96KB 时在原始响应仍在页面内存时先提取实体，观察报告仍按容量上限截断 |
| BOSS直聘 | `GET /wapi/zpgeek/search/joblist.json`，`zpData.jobList`；请求上下文含 query/city/page/pageSize | Job（含 Company/Boss）+ SearchContext；职位直达链接由 `encryptJobId` 生成 |
| 快手 | 当前推荐流已从旧推测 GraphQL 迁移为 `POST /rest/v/feed/hot`，响应 `feeds[].photo + feeds[].author + pcursor` | Video/Author/FeedContext；保留 `/graphql` 兼容作者主页旧链路 |
| 抖音 | `/aweme/v1/web/aweme/detail/`、`/aweme/v1/web/aweme/favorite/` 等，核心为 aweme/video/statistics/author | Video/Author/FeedContext；详情与列表响应均可归一化 |

新增 `content/source-extractor.js`，由 MAIN world 和 background service worker 共用。观察桥只保存正式提取器返回的白名单实体，不复制认证头/Cookie；background 在观察结束时同时暂存观察报告和正式来源包；popup 增加正式来源包完整/脱敏双导出并显示实体计数与正式 Coverage。

真实观察同时证明旧宽匹配存在不必要的私人数据面，因此 v3.5.0 收紧为：币安仅 futures bapi/fapi；BOSS 仅职位 search/recommend/feed/job；快手仅 feed/profile/兼容 GraphQL；抖音仅视频列表/详情/收藏/精选。账户/KYC/支付提现、简历/聊天、IM/通知/社交关系/用户设置不再进入观察内存。

### 真实验收结果（2026-08-24，同一用户 Chrome）

- Chrome 实际加载目录确认是仓库 `project-support/extension/lptff-investment-assistant/`，扩展从 v3.1.1 重载到 v3.5.0；manifest errors、runtime errors、runtime warnings 均为 0。
- 币安：2 条 Position、11 条 Equity、37 条 Order、875 条当期 Funding、20 条 FundingHistory；Position/Equity/Funding 为 complete。Order 为 partial（2/37 完整）：35 条历史成交列表没有返回订单 type，插件不猜测、不用默认值补齐。
- 快手：17 条 Video，Video/Author/时长/直达链接字段 17/17 complete；2 个 FeedContext 中 1 个带 pcursor，数据集 complete。
- 抖音：10 条 Video，Video/Author/时长/直达链接字段 10/10 complete；3 个 FeedContext 中 1 个带 cursor/has_more，数据集 complete。
- BOSS：同源职位列表 HTTP 200、业务 code 0，最终复测 30 条 Job 与 SearchContext 均 complete；前一轮同样 30 条的响应曾有 1 条缺经验字段并正确降级为 partial，证明 Coverage 会随平台当批真实字段变化，不把缺值补成完整。
- 四个平台正式来源包脱敏残留自检均为 0：币安替换 39 个、快手 34 个、抖音 18 个、BOSS 30 个业务标识。这里只记录聚合计数，不记录账户、职位或视频内容。
- 刷新/扩展重载恢复：币安、快手、抖音多轮强制刷新后桥与正式提取器均恢复；BOSS 在 DevTools 环境会调用 `window.close`/反复导航，验收时只在导航前阻止 `window.close` 并暂停页面脚本，再对已确认的同源只读职位端点取字段结构。插件没有加入绕过代码，正常用户页面仍按被动捕获边界工作。

仍未通过 Chrome 工具栏实际点击 popup 的完整按钮路径（Chrome DevTools MCP 不能控制浏览器工具栏）；popup/background 已加载且扩展运行错误为 0，但按钮→暂存→下载的 UI 路径仍需维护者实际点击一次确认，不能由源码或 MAIN-world 直测替代。

### 后续产品工作（不属于本次浏览器插件范围）

1. 市场需求侧站点 adapter/页面消费 BOSS 正式来源包，替代 zhipin.py 公开页降级链路；
2. 娱乐侧站点 adapter/离线清单消费快手、抖音正式来源包，替代 selenium 与 Cookie 手工维护链路；
3. crypto Ledger/domain/engine 消费币安正式来源包，落实三口径暴露与防爆仓判断；
4. 上述消费者真实验收后，再评估下线对应 Python 降级采集器。

## 同日修复：v3.5.1 币安零操作自动采集

维护者提供的首份 `binance-source-capture.json` 只有 7 条 Trade，Position/Equity/Order/Funding 均为 0 且 Coverage 为 unknown。Chrome DevTools MCP 同时确认真实合约页首屏已经请求 `user-position`、`user-balance`、`symbol-config`、`open-orders`、`filled-order` 与 `premiumIndex`。根因是扩展复用已加载页面后执行 RESET，把首屏响应清空；观察窗口内只有 `trade-history` 再次轮询。

v3.5.1 改为币安专属的零操作流程：复制当前合约 URL 到同一真实 profile 的不激活后台标签页，manifest 在 `document_start` 注入观察桥，保留完整首屏响应；固定观察 30 秒后自动生成来源包并关闭后台页。用户原合约页不刷新、不关闭，也不需要切换仓位/资产/历史标签。独立打开的同源扩展 popup 页面也可启动采集，仍拒绝任何普通网页来源。

Coverage 同时修复“已观察端点合法返回空数组却记为 unknown”的语义：是否观察到数据集由 `sourceData` 自有属性判定，空仓位或空委托可正确记为 complete/0。币安全市场 `premiumIndex` 与 872 条 `symbol-config` 不再整包导出，正式来源只保留当前页面、仓位、订单或成交涉及的合约，避免无关全市场数据进入个人来源包。

### Chrome DevTools MCP 真实复测

- Chrome 加载 v3.5.1 后，从扩展 popup 点击一次“开始正式来源采集”；后台副本自动创建、30 秒收尾并关闭，原 ETHUSDT 标签页始终保留，最终仅剩一个币安合约页。
- 自动捕获 53 个白名单 REST 端点、6 类 WS；正式实体为 Position 2、Equity 11、Order 37、Funding 1、FundingHistory 20、SymbolConfig 1。Position/Equity/Funding complete；Order partial 2/37，因为 `filled-order` 的 35 条历史记录真实缺少 type，未猜测补值。
- 正式包从未裁剪时约 640KB 降至 37,458 bytes；完整包与脱敏包均由真实扩展下载完成。完整包覆盖写入 `C:\Users\TFF001\Desktop\binance-source-capture.json`，脱敏包写入相邻的 `binance-source-desensitized.json`。
- 正式包未发现 Authorization/Cookie/Token/API Key 等凭据键；脱敏替换 39 个业务标识，残留检查 0。
- 真实 popup Console 无 error/warn；首次复测发现并修复 `platformId` 变量名错误，随后清除 Chrome 历史错误记录，扩展页不再显示错误入口。

因此 v3.5.0 记录中的“工具栏 popup 按钮路径未验证”已由 v3.5.1 的同源 popup 页面真实按钮链路（按钮→后台副本→暂存→完整/脱敏下载）补齐。Chrome DevTools MCP 仍不能点击浏览器工具栏图标本身，但这不再阻断 popup 产品逻辑的真实验收。
