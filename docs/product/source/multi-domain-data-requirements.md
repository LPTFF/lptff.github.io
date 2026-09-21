# 多领域采集产品数据诉求（待审查上游输入）

- 日期：2026-08-24
- 定位：回答"浏览器插件第一版必须采到哪些核心数据，才能保证各领域产品能力成立"。观察采集（`<platform>-observation-capture/0.9`）是确认这些数据可得性的手段——本文档是观察采集的**方向定义**：每个平台的观察操作都围绕下表实体触发，观察报告自动对照核心字段清单（插件 v3.4.0 起内置 coreFields 核对），登录调试时直接看到"产品数据诉求覆盖度"而非只有"端点覆盖度"。
- 上游输入：[多领域观察采集插件任务记录](../../records/multi-domain-observation-extension-20260824.md)（产品逻辑口述）、[加密货币复盘助手产品分析](crypto-review-product-analysis.md)（合约对象模型 3.1 节）、现有降级链路消费 schema（`src/data/zhipin.json`/`kuaishouData.json`/`tiktok.json`）与[BOSS 字段验证报告](../../docs/verification-reports/current/2026-08-05-boss-zhipin-fields.md)的降级教训。
- 方法：每个领域先声明第一版产品能力 → 推导产品赖以成立的核心数据实体 → 给每个实体参考字段描述（字段名候选来自现有消费 schema 与平台接口惯例，最终以登录观察报告确认的契约为准）。降级链路已经缺的字段是优先确认对象。

## 1. 金融：币安合约（复盘防重大错误）

**第一版产品能力**：判断"仓位是否越界（三口径）/距爆仓多远/止损是否触发/开平仓是否符合计划/资金费率侵蚀了多少收益"。数据不足以判断的问题按 Coverage/unknown 如实呈现（沿用基金复盘内核）。

| 核心实体 | 为什么需要 | 参考字段描述（登录观察确认候选名） |
| --- | --- | --- |
| **Position 头寸** | 一切纪律判断的对象：方向/杠杆/爆仓距离 | symbol、positionSide（多空方向）、leverage（杠杆）、entryPrice（开仓均价）、liquidationPrice（爆仓价）、markPrice（标记价）、positionAmt（数量）、unRealizedProfit（未实现盈亏）、marginType（全仓/逐仓） |
| **Equity 权益** | 三口径仓位计算的分母 | totalWalletBalance（钱包余额）、totalMarginBalance（保证金余额）、availableBalance（可用余额）、totalInitialMargin（保证金占用） |
| **Order 订单** | 操作对照：计划内/外开平仓、未成交/部分成交 | orderId、side、type（市价/限价）、status（成交状态）、executedQty（已成交量）、avgPrice（成交均价）、time、reduceOnly（是否只减仓） |
| **Funding 资金费率** | 长期持仓的隐性成本，盈亏口径必需 | fundingRate（当期费率）、nextFundingTime（下次结算时间） |

观察待确认：各实体分别来自哪条 bapi 路径；分页参数（历史订单怎么翻页）；字段是否在响应样本/字段清单中出现。爆仓事件（Liquidation）暂无独立实体诉求——爆仓价 + 维持保证金率从 Position 推导即可。

## 2. 市场需求：BOSS直聘（一键高价值职位清单）

**第一版产品能力**：登录态下一次采集，直接产出"可决策的职位清单"——不再逐页搜索。清单每行必须可比较、可筛选、可回访（链接）。

**降级链路教训**（现状=公开页采集）：薪资 100% 降级占位文案、每城 0–1 条、无城市/经验/学历独立字段。登录态采集正是为了补齐这些。

| 核心实体 | 为什么需要 | 参考字段描述 |
| --- | --- | --- |
| **Job 职位**（必须完整） | 清单主体：标题/薪资/要求可比较、链接可回访 | jobName/bossTitle（职位名）、salaryDesc（薪资，如 20-35K·14薪）、postExperience/jobExperience（经验要求）、postDegree/jobDegree（学历要求）、city/areaDistrict（地区）、jobLabels/skills（技能标签）、jobUrl/job_detail（详情链接）、lastModifyTime/activeTimeDesc（发布/活跃时间） |
| **Company 公司**（必须完整） | 高价值判断的一半：什么公司在招 | brandName（公司名）、brandIndustry（行业+规模+融资阶段，现有 schema 已有）、brandLogo |
| **Boss 招聘者**（高价值线索） | "一键高价值"的核心信号：活跃 Boss = 高回复率 | bossTitle（招聘者职位）、bossOnline/bossActive（在线/活跃状态） |
| **SearchContext 搜索上下文**（采集自描述） | 清单要能回答"这批数据是什么条件下采的" | query（搜索词）、city（城市码）、page（页码）、筛选项（经验/薪资档/行业） |

观察待确认：职位列表端点（`/wapi/zpgeek/search/*` 推测）的分页参数与游标形式；一条职位记录里上述字段实际叫什么；薪资是明文还是编码；活跃度字段是否存在。

## 3. 娱乐：快手/抖音（反注意力停留算法的视频清单）

**第一版产品能力**：把推荐流/主页视频拉成**离线清单**——封面+标题+统计+直达链接，用户按兴趣挑选直接消费，不为算法贡献停留时长。清单必须可排序（按热度/时间）、可回放（直达链接）。

**降级链路教训**（现状）：快手纯 HTTP 依赖手工维护 Cookie（已过期，现存 2023 存量）；抖音 selenium 滚动+逐页解析，维护成本高。且两者都缺**作者与时长**字段——清单没有作者无法按兴趣筛选，没有时长无法预估消费成本。

| 核心实体 | 为什么需要 | 参考字段描述 |
| --- | --- | --- |
| **Video 视频**（必须完整） | 清单主体：标题/封面/直达链接/统计 | caption/originCaption/desc（文案）、coverUrl/captionUrl（封面）、photoUrl/videoUrl/playAddr（播放地址）、likeCount/diggCount（点赞）、viewCount/playCount（播放）、timestamp/createTime（发布时间）、duration（时长，**降级链路缺失**） |
| **Author 作者**（必须完整，降级链路缺失） | 按兴趣筛选的锚点：清单要能"只看这个作者" | userName/nickname/authorName（昵称）、userId/secUserId（作者标识） |
| **FeedContext 流上下文**（采集自描述） | 清单要能翻页拉全量（不止首屏） | operationName（哪个查询，如 visionProfilePhotoList）、pcursor/cursor（分页游标） |

观察待确认：视频列表响应中作者信息是内嵌还是需单独查询；播放地址是否有有效期（决定"直达链接"形态是播放地址还是详情页链接）；分页游标怎么传递；抖音 `/aweme/v1/web/*` 的字段是否如 `aweme_list[].desc` 结构（selenium 链路已证明 RENDER_DATA 有 detail 结构，但 web API 形态待确认）。

## 4. 与插件的联动

- 插件 v3.4.0 起观察报告内置 `coreFields` 核对：上表参考字段作为正则候选写进协议模块，观察到的响应样本自动对照，报告直接给出每个实体的字段确认度（observedKeys + 来源端点），未观察到的实体聚合为警告。
- 登录调试操作因此有了明确目的：**每个实体至少触发一次对应页面功能**（BOSS 搜索翻页=Job/SearchContext、点公司=Company；快手抖音滚动=Video/FeedContext、点作者主页=Author）。
- 观察报告回来后，本文档的参考字段列即被确认为正式 `<platform>-source-capture/1.0` 的 schema 起点，adapter 直接照此实现——这就是"降低执行生成成本"的落点。
