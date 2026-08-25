// 多平台观察采集协议模块（background importScripts 引入，与 source-capture.js 同层）。
// 协议定位：<platform>-observation-capture/0.9 是「观察/草稿」版本——在真实登录环境
// 确认各平台私有端点契约（路径、字段语义、流归属）之前，只记录观察窗口内页面自身的
// 网络行为与脱敏样本，供维护者登录调试时导出核对；正式
// <platform>-source-capture/1.0 由 content/source-extractor.js 同批生成。
// 覆盖度词汇：observed / unobserved——观察阶段的诚实词汇，不用 complete/partial
// 冒充正式采集的完成度语义。
(() => {
  const PROTOCOL_VERSION = "0.9";

  const SENSITIVE_KEY = /^(?:authorization|access[-_]?token|token|cookie|set[-_]?cookie|session(?:[-_]?id)?|password|passphrase|secret|mnemonic|seed|private[-_]?key|api[-_]?key|apisecret|signature|csrftoken|csrf|bnc[-_]?uuid|client[-_]?id|client[-_]?type|device[-_]?id|fingerprint|listen[-_]?key|uid)$/i;
  const SENSITIVE_PART = /(?:authorization|csrf|token|cookie|session|password|passphrase|mnemonic|seed|private.?key|api.?key|apisecret|signature|email|phone|mobile|identity|idcard|passport|google.?auth|otp|2fa|listen.?key|wallet|address|bank(?:card)?|card(?:no)?|pay(?:ee|ment)?|beneficiar)/i;

  // 脱敏导出时需要匿名化的业务标识键（观察报告保留字段名与结构，值替换为稳定伪 ID，
  // 保证「同一订单在多处出现仍可关联」的分析能力，与基金 TRACE/TXN 伪 ID 思路一致）。
  const PSEUDO_KEY = /^(?:id|order_?id|order_?ids|trade_?id|client_?order_?id|client_?custom_?id|deal_?id|position_?id|strategy_?id)$/i;
  const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
  // 中国手机号（前后无数字边界）：BOSS直聘场景的真实风险（HR/求职者联系方式），
  // 娱乐平台文案中也可能出现，统一匿名化。
  const PHONE_RE = /(?<![0-9])1[3-9][0-9]{9}(?![0-9])/;

  // 平台覆盖度分类配置。datasets 顺序即互斥分类优先级：一条 REST 快照归入第一个
  // 命中的 dataset；wsKind 只统计对应 kind 的 WS 流；kind: "workers" 统计 Worker。
  // hint 写给人读：登录调试时按 hint 判断报告是否覆盖了想确认的契约。
  // 字段名扫描上限：与观察桥的容量上限同量级，防止恶意超大响应拖慢协议组装。
  const MAX_FIELD_NAME_SCAN = 2000;

  const PLATFORMS = {
    binance: {
      label: "币安合约",
      datasets: [
        { dataset: "bapiPrivateEndpoints", hint: "www.binance.com/bapi/*（页面私有业务接口：持仓/保证金/资金费率/历史成交等）", test: (snap) => String(snap.path || "").startsWith("/bapi/") },
        { dataset: "publicRestEndpoints", hint: "/fapi/*、/api/*（公开行情接口）", test: (snap) => /^\/(?:fapi|api)\//.test(String(snap.path || "")) },
        { dataset: "signedRestEndpoints", hint: "/sapi/*（签名账户接口）", test: (snap) => String(snap.path || "").startsWith("/sapi/") },
        { dataset: "wsMarketStreams", hint: "行情 WebSocket 流（标记价/最新价/深度等）", wsKind: "market-stream" },
        { dataset: "wsUserStream", hint: "用户数据流（订单/成交/保证金推送，URL 中 listenKey 已脱敏）", wsKind: "user-stream" },
        { dataset: "workerScripts", hint: "页面使用的 Worker 脚本（行情流可能运行在 Worker 中）", kind: "workers" },
      ],
      buildWarnings(counts) {
        const warnings = [];
        if (!counts.bapiPrivateEndpoints) {
          warnings.push("未捕获任何 bapi 私有端点：可能未登录币安，或持仓/账户数据在观察窗口开始前已加载完成。请登录后刷新期货页，再执行一次观察采集");
        }
        if (!counts.wsMarketStreams && counts.workerScripts) {
          warnings.push("未观察到页面级行情 WebSocket，但页面使用了 Worker：行情流很可能运行在 Worker 内（页面级补丁看不到），需要后续在 Worker 层面确认");
        }
        if (!counts.wsMarketStreams && !counts.workerScripts) {
          warnings.push("未观察到行情 WebSocket 与 Worker：合约页可能未完全加载，或流建立早于观察窗口");
        }
        return warnings;
      },
    },
    zhipin: {
      label: "BOSS直聘",
      datasets: [
        { dataset: "searchJobList", hint: "/wapi/zpgeek/search/*（搜索职位列表：职位/薪资/公司结构化字段）", test: (snap) => /^\/wapi\/zpgeek\/search\//i.test(String(snap.path || "")) },
        { dataset: "recommendJobFeed", hint: "/wapi/zpgeek/recommend|feed/*（推荐职位流）", test: (snap) => /^\/wapi\/zpgeek\/(?:recommend|feed)\//i.test(String(snap.path || "")) },
        { dataset: "jobDetail", hint: "其他含 job 的路径（职位详情/卡片接口）", test: (snap) => /\/job/i.test(String(snap.path || "")) },
        { dataset: "wapiOthers", hint: "其他 /wapi/*（登录后页面私有接口）", test: (snap) => String(snap.path || "").startsWith("/wapi/") },
        { dataset: "websockets", hint: "页面 WebSocket 流", wsKind: "websocket" },
        { dataset: "workerScripts", hint: "页面使用的 Worker 脚本", kind: "workers" },
      ],
      buildWarnings(counts) {
        const warnings = [];
        if (!counts.searchJobList && !counts.recommendJobFeed) {
          warnings.push("未观察到职位列表端点：可能未登录，或观察窗口内没有触发列表加载。请登录后打开搜索结果页并翻页/筛选，再执行一次观察采集");
        }
        if (!counts.wapiOthers && !counts.searchJobList && !counts.recommendJobFeed && !counts.jobDetail) {
          warnings.push("未观察到任何 /wapi 接口：请确认页面是 www.zhipin.com web 端且已完成登录");
        }
        return warnings;
      },
    },
    kuaishou: {
      label: "快手",
      datasets: [
        { dataset: "recommendVideoFeed", hint: "/rest/v/feed/hot（2026-08-24 真实 Chrome 已确认的推荐视频流）", test: (snap) => /^\/rest\/v\/feed\/hot/i.test(String(snap.path || "")) },
        { dataset: "restVideoFeeds", hint: "其他 /rest/v/feed/* 视频流", test: (snap) => /^\/rest\/v\/feed\//i.test(String(snap.path || "")) },
        { dataset: "profileVideoQueries", hint: "graphql visionProfilePhotoList（主页视频列表：photo/封面/点赞/播放数）", test: (snap) => /profilephoto|photolist/i.test(String(snap.operationName || "")) },
        { dataset: "videoFeedQueries", hint: "其他视频/推荐流 graphql 查询（operationName 含 feed/video/vision/rank）", test: (snap) => /feed|video|vision|rank/i.test(String(snap.operationName || "")) },
        { dataset: "graphQlOthers", hint: "其他 /graphql 查询", test: () => true },
        { dataset: "websockets", hint: "页面 WebSocket 流", wsKind: "websocket" },
        { dataset: "workerScripts", hint: "页面使用的 Worker 脚本", kind: "workers" },
      ],
      buildWarnings(counts) {
        const warnings = [];
        if (!counts.recommendVideoFeed && !counts.restVideoFeeds && !counts.profileVideoQueries && !counts.videoFeedQueries) {
          warnings.push("未观察到视频流接口：可能未登录，或观察窗口内没有触发加载。请登录后打开目标主页或推荐页并滚动几屏，再执行一次观察采集");
        }
        return warnings;
      },
    },
    douyin: {
      label: "抖音",
      datasets: [
        { dataset: "favoriteVideoFeed", hint: "/aweme/v1/web/aweme/favorite/（收藏视频兴趣种子）", test: (snap) => /\/aweme\/v1\/web\/aweme\/favorite\/?$/i.test(String(snap.path || "")) },
        { dataset: "interestSearchFeed", hint: "/aweme/v1/web/*/search/*（按收藏标签自动搜索的候选视频）", test: (snap) => /\/aweme\/v1\/web\/(?:general\/search|search)\//i.test(String(snap.path || "")) },
        { dataset: "videoFeedEndpoints", hint: "/aweme/v1/web/*（视频列表/详情：候选视频补充字段）", test: (snap) => /\/aweme\/v1\/web\/(?:aweme\/detail|aweme\/(?:post|feed|list)|[^/]*(?:feed|video|favorite))/i.test(String(snap.path || "")) },
        { dataset: "commentEndpoints", hint: "/aweme/v1/web/comment/*（评论接口）", test: (snap) => /\/comment/i.test(String(snap.path || "")) },
        { dataset: "awemeOthers", hint: "其他 /aweme/v1/web/* 接口", test: (snap) => String(snap.path || "").startsWith("/aweme/") },
        { dataset: "websockets", hint: "页面 WebSocket 流", wsKind: "websocket" },
        { dataset: "workerScripts", hint: "页面使用的 Worker 脚本", kind: "workers" },
      ],
      buildWarnings(counts) {
        const warnings = [];
        if (!counts.favoriteVideoFeed) {
          warnings.push("未观察到收藏视频端点：请登录抖音并打开“我 → 收藏 → 视频合集”，滚动几屏后重试");
        }
        if (!counts.interestSearchFeed) warnings.push("未观察到标签搜索结果端点，最终感兴趣视频数据集可能为空");
        return warnings;
      },
    },
    hongguo: {
      label: "红果短剧",
      datasets: [
        { dataset: "domCatalog", hint: "官网 Elements 中的公开短剧卡片与详情", kind: "dom" },
      ],
      buildWarnings(counts) {
        return counts.domCatalog ? [] : ["未读取到官网短剧卡片；请打开首页、分类页或由 APP 分享的短剧详情页后重试"];
      },
    },
  };

  // 核心数据实体定义（对齐 agent/product/source/multi-domain-data-requirements.md）：
  // 产品能力赖以成立的实体与字段候选。required: "must" 的实体是第一版产品能力的硬依赖，
  // 观察报告中零命中会聚合为警告；fields 是候选正则（宽松匹配，命中即说明该字段在
  // 响应中存在，登录者对照样本核对语义）；trigger 告诉登录者怎么触发对应页面功能。
  // 这套清单是观察采集的「方向定义」：报告不仅呈现端点覆盖度，还呈现产品数据诉求覆盖度。
  const CORE_ENTITY_RE = {
    binance: [
      {
        entity: "Position",
        label: "头寸（方向/杠杆/爆仓距离）",
        required: "must",
        trigger: "打开持仓面板",
        fields: [["symbol", /symbol/i], ["positionSide", /position_?side/i], ["leverage", /leverage/i], ["entryPrice", /entry_?price/i], ["liquidationPrice", /liquidation_?price/i], ["markPrice", /mark_?price/i], ["positionAmt", /position_?amt/i], ["unRealizedProfit", /un_?reali[sz]ed_?profit/i], ["marginType", /margin_?type/i]],
      },
      {
        entity: "Equity",
        label: "权益（三口径仓位分母）",
        required: "must",
        trigger: "打开账户/资产面板",
        fields: [["totalWalletBalance", /total_?wallet_?balance/i], ["totalMarginBalance", /total_?margin_?balance/i], ["availableBalance", /available_?balance/i], ["totalInitialMargin", /total_?initial_?margin/i]],
      },
      {
        entity: "Order",
        label: "订单（操作对照）",
        required: "must",
        trigger: "打开历史委托与历史成交",
        fields: [["orderId", /order_?id/i], ["side", /^(?:order_?)?side$/i], ["type", /^(?:order_?)?type$/i], ["status", /status/i], ["executedQty", /executed_?qty|cum_?qty/i], ["avgPrice", /avg_?price|average_?price/i], ["time", /time|timestamp/i], ["reduceOnly", /reduce_?only/i]],
      },
      {
        entity: "Funding",
        label: "资金费率（持仓隐性成本）",
        required: "must",
        trigger: "查看资金费率信息",
        fields: [["fundingRate", /funding_?rate/i], ["nextFundingTime", /next_?funding_?time/i]],
      },
    ],
    zhipin: [
      {
        entity: "Job",
        label: "职位（清单主体）",
        required: "must",
        trigger: "搜索职位并翻 2–3 页",
        fields: [["jobName", /job_?name|boss_?title|job_?name_?display/i], ["salary", /salary/i], ["experience", /experience/i], ["degree", /degree|education/i], ["city", /city|district|area/i], ["jobLabels", /job_?label|skill|tag/i], ["jobUrl", /job_?url|job_?detail|link_?url/i], ["activeTime", /active_?time|last_?modify|publish|refresh/i]],
      },
      {
        entity: "Company",
        label: "公司（高价值判断一半）",
        required: "must",
        trigger: "观察职位列表响应（通常内嵌）",
        fields: [["brandName", /brand_?name|company_?name/i], ["brandIndustry", /brand_?industry|industry/i], ["brandLogo", /brand_?logo|logo/i]],
      },
      {
        entity: "Boss",
        label: "招聘者（高价值信号：活跃度）",
        required: "hint",
        trigger: "观察职位列表响应（通常内嵌）",
        fields: [["bossTitle", /boss_?title|boss_?name|hr_?title/i], ["bossActive", /boss_?online|boss_?active|active_?desc|friend/i]],
      },
      {
        entity: "SearchContext",
        label: "搜索上下文（采集自描述）",
        required: "must",
        trigger: "搜索请求的 query 参数与翻页参数",
        fields: [["query", /query|keyword|search_?key/i], ["city", /city/i], ["page", /page/i]],
      },
    ],
    kuaishou: [
      {
        entity: "Video",
        label: "视频（清单主体）",
        required: "must",
        trigger: "打开主页/推荐页并滚动几屏",
        fields: [["caption", /caption|desc/i], ["coverUrl", /cover_?url|cover/i], ["photoUrl", /photo_?url|video_?url|play_?url|play_?addr/i], ["likeCount", /like_?count|digg_?count/i], ["viewCount", /view_?count|play_?count/i], ["timestamp", /timestamp|create_?time/i], ["duration", /duration/i]],
      },
      {
        entity: "Author",
        label: "作者（按兴趣筛选锚点，降级链路缺失）",
        required: "must",
        trigger: "观察视频列表响应（通常内嵌）或点开作者主页",
        fields: [["userName", /user_?name|nickname|author_?name/i], ["userId", /user_?id/i]],
      },
      {
        entity: "FeedContext",
        label: "流上下文（翻页拉全量）",
        required: "must",
        trigger: "滚动触发下一页加载",
        fields: [["pcursor", /pcursor|cursor/i]],
      },
    ],
    douyin: [
      {
        entity: "Video",
        label: "收藏视频（兴趣种子与清单主体）",
        required: "must",
        trigger: "打开“我 → 收藏 → 视频合集”并滚动几屏",
        fields: [["desc", /desc|caption/i], ["tags", /text_?extra|hashtag|tag/i], ["coverUrl", /cover_?url|cover/i], ["playAddr", /play_?addr|video_?url|play_?url/i], ["diggCount", /digg_?count|like_?count/i], ["playCount", /play_?count|view_?count/i], ["createTime", /create_?time|timestamp/i], ["duration", /duration/i]],
      },
      {
        entity: "Author",
        label: "作者（按兴趣筛选锚点，降级链路缺失）",
        required: "must",
        trigger: "观察视频列表响应（通常内嵌）或点开作者主页",
        fields: [["nickname", /nickname|user_?name|author_?name/i], ["secUserId", /sec_?user_?id|user_?id/i]],
      },
      {
        entity: "FeedContext",
        label: "流上下文（翻页拉全量）",
        required: "must",
        trigger: "滚动触发下一页加载",
        fields: [["cursor", /cursor|pcursor/i], ["hasMore", /has_?more/i]],
      },
      {
        entity: "InterestProfile",
        label: "收藏标签搜索画像",
        required: "must",
        trigger: "收藏视频文案或 text_extra 中的 #标签",
        fields: [["tags", /text_?extra|hashtag|tag/i], ["favorite", /favorite/i]],
      },
      {
        entity: "InterestVideo",
        label: "感兴趣视频（最终候选数据集）",
        required: "must",
        trigger: "插件按收藏标签自动打开抖音视频搜索并翻页",
        fields: [["search", /search/i], ["video", /aweme|video/i], ["playAddr", /play_?addr|video_?url|play_?url/i]],
      },
    ],
    hongguo: [
      {
        entity: "Series",
        label: "短剧（筛选基座主体）",
        required: "must",
        trigger: "打开官网片库或 APP 分享的详情链接",
        fields: [["title", /title/i], ["coverUrl", /cover_?url/i], ["episodeCount", /episode_?count/i], ["tags", /tags?/i], ["detailUrl", /detail_?url/i], ["playUrl", /play_?url/i]],
      },
      {
        entity: "CatalogContext",
        label: "片库上下文",
        required: "must",
        trigger: "打开首页、分类页或详情页",
        fields: [["pageType", /page_?type/i], ["pageUrl", /page_?url/i]],
      },
    ],
  };

  function platformConfig(platformId) {
    const config = PLATFORMS[platformId];
    if (!config) throw new Error(`未知观察平台：${platformId}`);
    return config;
  }

  function protocolOf(platformId) {
    return `${platformId}-observation-capture/${PROTOCOL_VERSION}`;
  }

  // REST 快照按 dataset 顺序优先互斥归入第一命中类；WS 与 Worker 单独计数。
  function buildCoverage(platformId, data) {
    const config = platformConfig(platformId);
    const counts = Object.fromEntries(config.datasets.map((row) => [row.dataset, 0]));
    for (const snapshot of data?.restSnapshots || []) {
      for (const row of config.datasets) {
        if (row.test && row.test(snapshot)) {
          counts[row.dataset] += 1;
          break;
        }
      }
    }
    for (const row of config.datasets) {
      if (row.kind === "workers") counts[row.dataset] = (data?.workers || []).length;
      if (row.kind === "dom") counts[row.dataset] = (data?.domSnapshots || []).length;
      if (row.wsKind) counts[row.dataset] = (data?.wsStreams || []).filter((ws) => ws?.kind === row.wsKind).length;
    }
    return config.datasets.map((row) => ({
      dataset: row.dataset,
      hint: row.hint,
      observedCount: counts[row.dataset] || 0,
      completeness: (counts[row.dataset] || 0) > 0 ? "observed" : "unobserved",
    }));
  }

  // 从观察快照的响应中递归提取字段名集合：普通对象收集键名；超大响应的
  // fieldNames 路径清单按 . 与 [] 分段；字符串样本无法可靠提取则跳过。
  function collectFieldNames(value, names = new Set()) {
    if (names.size >= MAX_FIELD_NAME_SCAN) return names;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (names.size >= MAX_FIELD_NAME_SCAN) break;
        collectFieldNames(item, names);
      }
      return names;
    }
    if (value && typeof value === "object") {
      for (const [name, item] of Object.entries(value)) {
        if (name === "fieldNames" && Array.isArray(item)) {
          for (const path of item) {
            for (const segment of String(path).split(/[.\[\]]+/)) {
              if (segment) names.add(segment);
            }
          }
          continue;
        }
        if (names.size >= MAX_FIELD_NAME_SCAN) break;
        names.add(name);
        collectFieldNames(item, names);
      }
    }
    return names;
  }

  // 产品数据诉求核对：每实体统计命中字段（候选正则任一名命中）与来源端点，
  // 让观察报告直接回答「产品能力依赖的数据能不能采到」。
  function buildCoreFieldCoverage(platformId, data) {
    const entities = CORE_ENTITY_RE[platformId] || [];
    const stats = new Map(entities.map((entity) => [entity.entity, { ...entity, hitFields: [], endpoints: new Set() }]));
    for (const snapshot of [...(data?.restSnapshots || []), ...(data?.domSnapshots || [])]) {
      // 字段名三处来源：响应体、URL query 参数（已脱敏但参数名保留）、请求体——
      // 分页参数与游标（SearchContext/FeedContext 类实体）在请求侧，也是待确认契约。
      const names = new Set([
        ...collectFieldNames(snapshot?.response),
        ...collectFieldNames(snapshot?.query),
        ...collectFieldNames(snapshot?.requestBody),
        ...collectFieldNames(snapshot?.sourceData),
      ]);
      if (!names.size) continue;
      const endpoint = `${String(snapshot?.method || "GET")} ${String(snapshot?.path || "")}${snapshot?.operationName ? ` (${snapshot.operationName})` : ""}`;
      for (const entity of entities) {
        const stat = stats.get(entity.entity);
        for (const [name, re] of entity.fields) {
          if (stat.hitFields.some(([hitName]) => hitName === name)) continue;
          if ([...names].some((observed) => re.test(observed))) {
            stat.hitFields.push([name, endpoint]);
            stat.endpoints.add(endpoint);
          }
        }
      }
    }
    return entities.map((entity) => {
      const stat = stats.get(entity.entity);
      // endpoints 在返回前转为排序数组：safeValue 不处理 Set（会被转成空对象）。
      return {
        entity: entity.entity,
        label: entity.label,
        required: entity.required,
        trigger: entity.trigger,
        totalFieldCount: entity.fields.length,
        hitFields: stat.hitFields.map(([name, endpoint]) => ({ name, endpoint })),
        observedFieldCount: stat.hitFields.length,
        endpoints: [...stat.endpoints].sort(),
        completeness: stat.hitFields.length > 0 ? "observed" : "unobserved",
      };
    });
  }

  function buildCoreFieldWarnings(coreFields) {
    const warnings = [];
    const missing = coreFields.filter((item) => item.required === "must" && item.completeness === "unobserved");
    for (const item of missing) {
      warnings.push(`核心实体「${item.entity}」（${item.label}）未观察到任何字段。产品能力依赖此实体；触发方式：${item.trigger}`);
    }
    return warnings;
  }

  function buildObservationWarnings(platformId, data) {
    const config = platformConfig(platformId);
    const coverage = buildCoverage(platformId, data);
    const counts = Object.fromEntries(coverage.map((row) => [row.dataset, row.observedCount]));
    const warnings = config.buildWarnings(counts);
    for (const item of buildCoreFieldWarnings(buildCoreFieldCoverage(platformId, data))) warnings.push(item);
    return warnings;
  }

  function safeValue(value, key = "") {
    if (SENSITIVE_KEY.test(key) || SENSITIVE_PART.test(key)) return undefined;
    if (Array.isArray(value)) return value.map((item) => safeValue(item)).filter((item) => item !== undefined);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value)
        .filter(([name]) => !SENSITIVE_KEY.test(name) && !SENSITIVE_PART.test(name))
        .map(([name, item]) => [name, safeValue(item, name)])
        .filter(([, item]) => item !== undefined));
    }
    return value;
  }

  function buildObservationCapture(platformId, input) {
    const config = platformConfig(platformId);
    const data = input.data || {};
    const coverage = buildCoverage(platformId, data);
    const coreFields = buildCoreFieldCoverage(platformId, data);
    const warnings = [...(input.warnings || []), ...buildObservationWarnings(platformId, data)];
    return safeValue({
      protocol: protocolOf(platformId),
      kind: "observation",
      source: platformId,
      sourceLabel: config.label,
      capturedAt: input.capturedAt || new Date().toISOString(),
      observedSince: data.capturedSince,
      observedUntil: input.observedUntil,
      pageUrl: data.pageUrl,
      restSnapshots: data.restSnapshots || [],
      domSnapshots: data.domSnapshots || [],
      wsStreams: data.wsStreams || [],
      workers: data.workers || [],
      coverage,
      coreFields,
      warnings: [...new Set(warnings.map((item) => String(item || "").trim()).filter(Boolean))],
      metrics: input.metrics || {},
    });
  }

  // 脱敏导出：观察报告结构保留，业务标识值替换为稳定伪 ID；同时记录被替换的原值清单
  // 供残留自检使用。与基金 desensitizeSource 不同点：文本值中的邮箱与手机号一律匿名化。
  function desensitizeObservation(capture) {
    const idMap = new Map();
    const maskedOriginals = new Set();
    let seq = 0;
    function pseudo(value, prefix) {
      const source = String(value);
      if (!idMap.has(source)) {
        seq += 1;
        idMap.set(source, `${prefix}-${String(seq).padStart(4, "0")}`);
      }
      return idMap.get(source);
    }
    function mask(value, key) {
      if (Array.isArray(value)) return value.map((item) => mask(item, key));
      if (value && typeof value === "object") {
        return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, mask(item, name)]));
      }
      if (typeof value !== "string" || !value) return value;

      if (PSEUDO_KEY.test(key)) {
        maskedOriginals.add(value);
        return pseudo(value, "ORDER");
      }
      // 邮箱与手机号：无论出现在哪个字段都匿名化。
      if (EMAIL_RE.test(value)) {
        maskedOriginals.add(value);
        return "EMAIL-MASKED";
      }
      if (PHONE_RE.test(value)) {
        maskedOriginals.add(value.match(PHONE_RE)[0]);
        return value.replace(PHONE_RE, "PHONE-MASKED");
      }
      return value;
    }
    const desensitized = mask(capture, "$");
    return { desensitized, maskedOriginals: [...maskedOriginals] };
  }

  // 残留自检：被脱敏的原值不允许残留；文本中不允许出现邮箱与手机号。
  function residualCheck(desensitized, maskedOriginals) {
    const text = JSON.stringify(desensitized);
    const residual = [];
    for (const original of maskedOriginals || []) {
      if (original && original.length >= 6 && text.includes(original)) {
        residual.push(`残留敏感原值：${original.slice(0, 2)}***`);
      }
    }
    if (EMAIL_RE.test(text)) residual.push("文本中残留邮箱地址");
    if (PHONE_RE.test(text)) residual.push("文本中残留手机号");
    return residual;
  }

  function summarizeObservation(capture) {
    const coverage = Array.isArray(capture?.coverage)
      ? capture.coverage.map((item) => ({
          dataset: item?.dataset || "other",
          completeness: ["observed", "unobserved"].includes(item?.completeness) ? item.completeness : "unobserved",
          observedCount: Number(item?.observedCount) || 0,
        }))
      : [];
    const coreFields = Array.isArray(capture?.coreFields)
      ? capture.coreFields.map((item) => ({
          entity: item?.entity || "other",
          required: item?.required === "must" ? "must" : "hint",
          completeness: ["observed", "unobserved"].includes(item?.completeness) ? item.completeness : "unobserved",
          observedFieldCount: Number(item?.observedFieldCount) || 0,
          totalFieldCount: Number(item?.totalFieldCount) || 0,
        }))
      : [];
    return {
      source: capture?.source || "",
      sourceLabel: capture?.sourceLabel || "",
      restEndpointCount: Array.isArray(capture?.restSnapshots) ? capture.restSnapshots.length : 0,
      domSnapshotCount: Array.isArray(capture?.domSnapshots) ? capture.domSnapshots.length : 0,
      wsStreamCount: Array.isArray(capture?.wsStreams) ? capture.wsStreams.length : 0,
      workerCount: Array.isArray(capture?.workers) ? capture.workers.length : 0,
      warningCount: Array.isArray(capture?.warnings) ? capture.warnings.length : 0,
      coverage,
      coreFields,
      totalMs: Number(capture?.metrics?.totalMs) || 0,
    };
  }

  globalThis.LPTFFObservationCapture = Object.freeze({
    platforms: () => Object.keys(PLATFORMS),
    platformLabel: (platformId) => platformConfig(platformId).label,
    protocolOf,
    buildObservationCapture,
    buildObservationWarnings,
    desensitizeObservation,
    residualCheck,
    summarizeObservation,
  });
})();
