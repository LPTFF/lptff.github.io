// 多平台观察采集桥（MAIN world，document_start 注入）。
// 与基金 network-bridge 同构：只捕获页面自身发出的业务请求，不复制认证头、不重发请求。
// 拦截核心（fetch/XHR/WebSocket/Worker + 快照归并 + 容量上限 + 脱敏）平台无关，
// 平台差异（候选端点、排除路径、敏感字段、WS 分类）由 PLATFORMS 配置表按
// location.hostname 选择。当前接入：binance（合约）/ zhipin（BOSS直聘）/
// kuaishou / douyin。统一保留观察报告；经真实登录环境确认的响应同时由
// source-extractor.js 提取为 <platform>-source-capture/1.0 白名单实体。
(() => {
  if (globalThis.__LPTFF_OBSERVATION_BRIDGE_READY__) return;
  globalThis.__LPTFF_OBSERVATION_BRIDGE_READY__ = true;

  // 通用敏感字段基底：认证/会话/凭据类一律剥离；平台专属字段由配置附加。
  const BASE_SENSITIVE_KEY = /^(?:authorization|access[-_]?token|token|cookie|set[-_]?cookie|session(?:[-_]?id)?|password|passphrase|secret|mnemonic|seed|private[-_]?key|api[-_]?key|apisecret|signature|csrftoken|csrf|client[-_]?id|client[-_]?type|device[-_]?id|fingerprint|uid)$/i;
  const BASE_SENSITIVE_PART = /(?:authorization|csrf|token|cookie|session|password|passphrase|mnemonic|seed|private.?key|api.?key|apisecret|signature|email|phone|mobile|identity|idcard|passport|google.?auth|otp|2fa|wallet|address|bank(?:card)?|card(?:no)?|pay(?:ee|ment)?|beneficiar)/i;

  // 平台配置：hostRe 限定注入域；restPathRe 是候选端点宽匹配；excludedPathRe 是
  // 与采集目标无关且强敏感的路径（宁可少采不多采）；extraSensitiveKey/Part 是平台
  // 专属敏感字段（key 全名匹配，part 子串匹配）；classifyWs/sanitizeWsUrl 定义 WS
  // 流的分类与 URL 脱敏（默认不分类、不脱敏）。
  const PLATFORMS = [
    {
      id: "binance",
      hostRe: /(^|\.)binance\.com$/i,
      // 真实登录观察确认正式数据全部来自 futures bapi 与公开 fapi。收紧到这两类后，
      // accounts/compliance/KYC/支付/提现等与合约复盘无关的数据根本不会进入内存。
      restPathRe: /^\/(?:bapi\/futures|fapi)\//i,
      excludedPathRe: null,
      extraSensitiveKey: /^(?:bnc[-_]?uuid|listen[-_]?key)$/i,
      extraSensitivePart: /(?:listen.?key|bnc.?uuid)/i,
      classifyWs(rawUrl) {
        try {
          const pathname = new URL(rawUrl).pathname;
          return /\/ws\//i.test(pathname) && !/@/.test(rawUrl) ? "user-stream" : "market-stream";
        } catch {
          return "websocket";
        }
      },
      // listenKey 是认证凭据且出现在 URL 路径中，必须先脱敏再入库。
      sanitizeWsUrl(rawUrl) {
        try {
          const parsed = new URL(rawUrl);
          if (/^\/ws\/([^/?]+)$/i.test(parsed.pathname)) parsed.pathname = "/ws/<LISTENKEY-MASKED>";
          return parsed.toString();
        } catch {
          return String(rawUrl || "");
        }
      },
    },
    {
      id: "zhipin",
      hostRe: /(^|\.)zhipin\.com$/i,
      // 只接收职位搜索/推荐/详情；用户资料、简历、登录安全、私信聊天均不进入观察。
      restPathRe: /^\/wapi\/zpgeek\/(?:search|recommend|feed|job|pc\/recommend)(?:\/|$)/i,
      excludedPathRe: null,
      extraSensitiveKey: /^(?:zp[-_]?token|stoken|jsessionid|encrypt[-_]?user[-_]?id|security[-_]?id|lid)$/i,
      extraSensitivePart: /(?:zp.?token|stoken|encrypt.?user)/i,
    },
    {
      id: "kuaishou",
      hostRe: /(^|\.)kuaishou\.com$/i,
      // 2026-08-24 真实 Chrome 已确认推荐流迁移到 /rest/v/feed/hot；保留 GraphQL
      // 兼容作者主页旧链路，只观察视频/主页数据，明确排除评论与日志接口。
      restPathRe: /^\/(?:graphql|rest\/v\/(?:feed|profile)(?:\/|$))/i,
      excludedPathRe: /^\/rest\/v\/(?:photo\/comment|log)(?:\/|$)/i,
      extraSensitiveKey: /^(?:pass[-_]?token|web[-_]?api[-_]?client[-_]?key|did)$/i,
      extraSensitivePart: /(?:pass.?token|web.?api.?client.?key)/i,
    },
    {
      id: "douyin",
      hostRe: /(^|\.)douyin\.com$/i,
      // 只观察视频列表/详情/收藏与精选流；IM、通知、社交关系和用户设置全部排除。
      restPathRe: /^\/aweme\/v1\/web\/(?:aweme\/(?:detail|favorite|post|feed|list)|feed|favorite|mix\/(?:aweme|list)|douyin\/select)(?:\/|$)/i,
      excludedPathRe: null,
      extraSensitiveKey: /^(?:ms[-_]?token|a[-_]?bogus|x[-_]?bogus|ttwid|s[-_]?v[-_]?web[-_]?id|verify[-_]?fp|web[-_]?id)$/i,
      extraSensitivePart: /(?:ms.?token|a.?bogus|ttwid|verify.?fp)/i,
    },
  ];

  const platform = PLATFORMS.find((item) => item.hostRe.test(location.hostname)) || null;
  if (!platform) return;

  function isSensitiveKey(key) {
    return BASE_SENSITIVE_KEY.test(key) || (platform.extraSensitiveKey ? platform.extraSensitiveKey.test(key) : false);
  }

  function isSensitivePart(key) {
    return BASE_SENSITIVE_PART.test(key) || (platform.extraSensitivePart ? platform.extraSensitivePart.test(key) : false);
  }

  const MAX_REST_SNAPSHOTS = 400;
  const MAX_RESPONSE_SAMPLE_BYTES = 96 * 1024;
  const MAX_KEY_PATHS = 300;
  const MAX_WS_STREAMS = 40;
  const MAX_WS_SAMPLES_PER_STREAM = 5;
  const MAX_WS_SAMPLE_BYTES = 4096;
  const MAX_WORKERS = 40;

  const restSnapshots = new Map();
  const wsStreams = new Map();
  const workerScripts = new Map();
  // 只在币安页面 MAIN world 内存中保留一份已登录私有请求模板。模板可能包含
  // 页面生成的认证头，因此绝不经过 postMessage、扩展消息、storage 或来源包；
  // 主动历史采集仅克隆其请求上下文并替换只读端点与请求体。
  const privateRequestTemplates = new Map();
  let binanceHistoryCollection = null;
  let capturedSince = Date.now();

  function safeValue(value, key = "") {
    if (isSensitiveKey(key) || isSensitivePart(key)) return undefined;
    if (Array.isArray(value)) return value.map((item) => safeValue(item)).filter((item) => item !== undefined);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value)
        .filter(([name]) => !isSensitiveKey(name) && !isSensitivePart(name))
        .map(([name, item]) => [name, safeValue(item, name)])
        .filter(([, item]) => item !== undefined));
    }
    return value;
  }

  // URL query 单独处理：敏感参数保留参数名、值替换为掩码——观察报告需要呈现
  // 「该端点携带 csrftoken/msToken 等参数」这一契约事实，但绝不保留参数值。
  function safeQuery(query) {
    return Object.fromEntries(Object.entries(query).map(([name, value]) => [
      name,
      isSensitiveKey(name) || isSensitivePart(name) ? "<MASKED>" : value,
    ]));
  }

  function parseBody(body) {
    if (body === undefined || body === null || body === "") return undefined;
    if (typeof body !== "string") return safeValue(String(body));
    try {
      return safeValue(JSON.parse(body));
    } catch {
      try {
        const params = new URLSearchParams(body);
        if ([...params.keys()].length && body.includes("=")) {
          return safeValue(Object.fromEntries(params.entries()));
        }
      } catch {
        // 非 JSON / 表单请求体保留为安全字符串。
      }
      return safeValue(body);
    }
  }

  // 收集响应对象的前 3 层字段名，用于超大响应只留字段清单不留全量值。
  function collectKeyPaths(value, prefix = "", depth = 3, paths = new Set()) {
    if (paths.size >= MAX_KEY_PATHS || depth < 0) return paths;
    if (Array.isArray(value)) {
      if (value.length) collectKeyPaths(value[0], `${prefix}[]`, depth - 1, paths);
      return paths;
    }
    if (value && typeof value === "object") {
      for (const [name, item] of Object.entries(value)) {
        const path = prefix ? `${prefix}.${name}` : name;
        if (paths.size >= MAX_KEY_PATHS) break;
        paths.add(path);
        collectKeyPaths(item, path, depth - 1, paths);
      }
    }
    return paths;
  }

  function requestInfo(url) {
    try {
      const parsed = new URL(url, location.href);
      if (!platform.hostRe.test(parsed.hostname)) return null;
      if (!platform.restPathRe.test(parsed.pathname)) return null;
      if (platform.excludedPathRe && platform.excludedPathRe.test(parsed.pathname)) return null;
      return { hostname: parsed.hostname, pathname: parsed.pathname, query: Object.fromEntries(parsed.searchParams.entries()) };
    } catch {
      return null;
    }
  }

  function parseJsonLoose(text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  function responseSample(text, size, parsedPayload) {
    const payload = parsedPayload === undefined ? parseJsonLoose(text) : parsedPayload;
    if (size > MAX_RESPONSE_SAMPLE_BYTES) {
      return {
        truncated: true,
        size,
        fieldNames: payload ? [...collectKeyPaths(payload)] : [],
        sampleHead: payload ? undefined : text.slice(0, 2048),
      };
    }
    return payload !== null ? safeValue(payload) : safeValue(text.slice(0, 8192));
  }

  function storeSnapshot(info, method, body, status, contentType, text, size) {
    const request = parseBody(body);
    const parsedResponse = parseJsonLoose(text);
    // 同一端点的轮询按「方法+路径+参数键集合+operationName+请求体键集合」归并，
    // 只保留最新样本并记录命中次数。operationName 用于区分同一路径上的多个
    // GraphQL 查询（如快手 /graphql 的不同 operation），避免归并成一条。
    const operationName = request && typeof request === "object" && typeof request.operationName === "string"
      ? request.operationName
      : "";
    const fingerprint = [
      method,
      info.hostname + info.pathname,
      Object.keys(info.query).sort().join(","),
      operationName,
      request && typeof request === "object" ? Object.keys(request).sort().join(",") : "",
    ].join("|");
    const existing = restSnapshots.get(fingerprint);
    if (existing) {
      existing.hitCount += 1;
      existing.lastSeenAt = new Date().toISOString();
      return;
    }
    if (restSnapshots.size >= MAX_REST_SNAPSHOTS) {
      const oldest = restSnapshots.keys().next().value;
      if (oldest !== undefined) restSnapshots.delete(oldest);
    }
    restSnapshots.set(fingerprint, {
      method,
      host: info.hostname,
      path: info.pathname,
      query: safeQuery(info.query),
      operationName: operationName || undefined,
      requestBody: request,
      status,
      contentType,
      responseSize: size,
      response: responseSample(text, size, parsedResponse),
      // 大响应可以在观察报告里截断，但正式来源实体必须在原始响应仍在内存时完成
      // 白名单提取；提取器不保留 Cookie/认证头，也不会把整份响应复制到 sourceData。
      sourceData: safeValue(globalThis.LPTFFMultiDomainSourceExtractor?.extractSnapshot(platform.id, {
        path: info.pathname,
        query: safeQuery(info.query),
        request,
        response: parsedResponse,
        capturedAt: new Date().toISOString(),
      }) || {}),
      capturedAt: new Date().toISOString(),
      hitCount: 1,
    });
  }

  function saveResponse(url, method, body, response) {
    const info = requestInfo(url);
    if (!info) return;
    const contentType = response.headers.get("content-type") || "";
    response.clone().text().then((text) => {
      storeSnapshot(info, method, body, response.status, contentType, text, text.length);
    }).catch(() => {});
  }

  const originalFetch = window.fetch.bind(window);
  function privateFetchTemplate(url, request, init) {
    if (platform.id !== "binance") return null;
    const info = requestInfo(url);
    if (!info || !/^\/bapi\/futures\/v1\/private\/future\//i.test(info.pathname)) return null;
    try {
      const template = request instanceof Request ? request.clone() : new Request(new URL(url, location.href).toString(), init || {});
      return { path: info.pathname, template };
    } catch {
      // 模板记录失败不影响页面原请求；采集状态会明确报告认证模板缺失。
      return null;
    }
  }

  window.fetch = async (...args) => {
    const request = args[0];
    const init = args[1] || {};
    const url = typeof request === "string" ? request : request?.url;
    const method = String(init.method || request?.method || "GET").toUpperCase();
    let body = init.body;

    const templateCandidate = url ? privateFetchTemplate(url, request, init) : null;

    if (url && requestInfo(url) && body === undefined && request instanceof Request) {
      try {
        body = await request.clone().text();
      } catch {
        body = undefined;
      }
    }

    const response = await originalFetch(...args);
    if (templateCandidate && response.ok) privateRequestTemplates.set(templateCandidate.path, templateCandidate.template);
    if (url && requestInfo(url)) saveResponse(url, method, body, response);
    return response;
  };

  const HISTORY_ENDPOINTS = Object.freeze({
    firstTradeTime: "/bapi/futures/v1/private/future/user-data/get-first-trade-time",
    orderHistory: "/bapi/futures/v1/private/future/order/order-history",
    conditionalOrderHistory: "/bapi/futures/v1/private/future/order/get-all-algo-order",
    tradeHistory: "/bapi/futures/v1/private/future/user-data/trade-history",
    positionHistory: "/bapi/futures/v1/private/future/user-data/position/history",
    transactionHistory: "/bapi/futures/v1/private/future/user-data/transaction-history",
  });
  const HISTORY_LABELS = Object.freeze({
    orderHistory: "合约订单历史",
    tradeHistory: "交易历史",
    positionHistory: "持仓历史",
    transactionHistory: "资金流水",
  });
  const HISTORY_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;
  const HISTORY_PAGE_SIZE = 200;
  const ORDER_HISTORY_PAGE_SIZE = 100;
  const HISTORY_MAX_REQUESTS = 5000;

  function publicHistoryState(includeChunks = false) {
    if (!binanceHistoryCollection) return null;
    const { chunks, ...state } = binanceHistoryCollection;
    return safeValue(includeChunks ? { ...state, chunks } : state);
  }

  function updateHistoryBranch(dataset, patch) {
    if (!binanceHistoryCollection) return;
    binanceHistoryCollection.branches[dataset] = {
      ...binanceHistoryCollection.branches[dataset],
      ...patch,
    };
    binanceHistoryCollection.updatedAt = new Date().toISOString();
  }

  function privateTemplateFor(path) {
    return privateRequestTemplates.get(path)
      || [...privateRequestTemplates.values()][0]
      || null;
  }

  async function privateHistoryRequest(path, body, dataset) {
    const state = binanceHistoryCollection;
    if (!state) throw new Error("历史采集状态不存在");
    if (state.requestCount >= HISTORY_MAX_REQUESTS) throw new Error(`只读请求超过安全上限 ${HISTORY_MAX_REQUESTS}`);
    const template = privateTemplateFor(path);
    if (!template) throw new Error("尚未观察到已登录私有请求模板");
    const headers = new Headers(template.headers);
    const response = await originalFetch(new URL(path, location.origin).toString(), {
      method: "POST",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: template.credentials || "include",
      mode: template.mode === "navigate" ? "cors" : template.mode,
      cache: "no-store",
      redirect: template.redirect,
      referrer: template.referrer,
      referrerPolicy: template.referrerPolicy,
    });
    state.requestCount += 1;
    const json = await response.json();
    if (!response.ok || json?.success === false) {
      throw new Error(`${HISTORY_LABELS[dataset] || dataset}读取失败（${json?.code || response.status}）`);
    }
    const capturedAt = new Date().toISOString();
    const sourceData = globalThis.LPTFFMultiDomainSourceExtractor?.extractSnapshot("binance", {
      path,
      request: safeValue(body),
      response: json,
      capturedAt,
      collectionDataset: dataset,
    }) || {};
    if (Object.keys(sourceData).length) state.chunks.push({ sourceData });
    return json;
  }

  function timeWindows(startAt, endAt) {
    const windows = [];
    for (let start = startAt; start <= endAt; start += HISTORY_WINDOW_MS) {
      windows.push([start, Math.min(endAt, start + HISTORY_WINDOW_MS - 1)]);
    }
    return windows;
  }

  function countChunkRows(chunks, dataset) {
    const rows = chunks.flatMap((item) => Array.isArray(item?.sourceData?.[dataset]) ? item.sourceData[dataset] : []);
    const keyOf = {
      orderHistory: (row) => row?.historyId || `${row?.recordType || "order"}:${row?.algoId || row?.orderId || ""}`,
      tradeHistory: (row) => row?.tradeId,
      positionHistory: (row) => `${row?.positionId || row?.recordId}:${row?.updatedAt || row?.closedAt || ""}`,
      transactionHistory: (row) => `${row?.recordId || row?.transactionId}:${row?.time || ""}:${row?.type || ""}:${row?.amount || ""}:${row?.symbol || ""}`,
    }[dataset];
    if (!keyOf) return rows.length;
    return new Set(rows.map(keyOf).filter((value) => value !== undefined && value !== null && value !== "").map(String)).size;
  }

  async function collectPagedTimeHistory(dataset, path, windows) {
    let expected = 0;
    let pageCount = 0;
    let complete = true;
    for (let index = 0; index < windows.length; index += 1) {
      const [startTime, endTime] = windows[index];
      let page = 1;
      let loaded = 0;
      let total = 0;
      do {
        const json = await privateHistoryRequest(path, { startTime, endTime, page, rows: HISTORY_PAGE_SIZE }, dataset);
        const rows = Array.isArray(json?.data) ? json.data : [];
        total = Math.max(0, Number(json?.total ?? rows.length) || 0);
        loaded += rows.length;
        pageCount += 1;
        updateHistoryBranch(dataset, { status: "running", windowsCompleted: index, pageCount, recordCount: countChunkRows(binanceHistoryCollection.chunks, dataset) });
        if (!rows.length || loaded >= total) break;
        page += 1;
      } while (page <= Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE)) + 1);
      expected += total;
      if (loaded < total) complete = false;
      updateHistoryBranch(dataset, { windowsCompleted: index + 1, pageCount, recordCount: countChunkRows(binanceHistoryCollection.chunks, dataset) });
    }
    return { complete, expected, pageCount };
  }

  async function collectPositionWindow(startDay, endDay, depth = 0) {
    const dataset = "positionHistory";
    const json = await privateHistoryRequest(HISTORY_ENDPOINTS.positionHistory, { startDay, endDay, rows: HISTORY_PAGE_SIZE }, dataset);
    const rows = Array.isArray(json?.data) ? json.data : [];
    const total = Math.max(0, Number(json?.total ?? rows.length) || 0);
    if (rows.length >= total) return { complete: true, expected: total, leaves: 1 };
    if (startDay >= endDay || depth >= 40) return { complete: false, expected: total, leaves: 1 };
    const middle = Math.floor((startDay + endDay) / 2);
    const left = await collectPositionWindow(startDay, middle, depth + 1);
    const right = await collectPositionWindow(middle + 1, endDay, depth + 1);
    return { complete: left.complete && right.complete, expected: left.expected + right.expected, leaves: left.leaves + right.leaves };
  }

  async function collectOrderHistorySource({ path, bodyOf }, windows) {
    const dataset = "orderHistory";
    let pageCount = 0;
    let expected = 0;
    let complete = true;
    for (let index = 0; index < windows.length; index += 1) {
      const [startTime, endTime] = windows[index];
      let page = 1;
      let loaded = 0;
      let total = 0;
      do {
        const json = await privateHistoryRequest(path, bodyOf({ startTime, endTime, page }), dataset);
        const rows = Array.isArray(json?.data) ? json.data : [];
        total = Math.max(0, Number(json?.total ?? rows.length) || 0);
        loaded += rows.length;
        pageCount += 1;
        updateHistoryBranch(dataset, { status: "running", pageCount, windowsCompleted: index, recordCount: countChunkRows(binanceHistoryCollection.chunks, dataset) });
        if (!rows.length || loaded >= total) break;
        page += 1;
      } while (page <= Math.max(1, Math.ceil(total / ORDER_HISTORY_PAGE_SIZE)) + 1);
      expected += total;
      if (loaded < total) complete = false;
      updateHistoryBranch(dataset, { windowsCompleted: index + 1, pageCount, recordCount: countChunkRows(binanceHistoryCollection.chunks, dataset) });
    }
    return { complete, expected, pageCount };
  }

  async function collectOrderHistory(windows) {
    const [regular, conditional] = await Promise.all([
      collectOrderHistorySource({
        path: HISTORY_ENDPOINTS.orderHistory,
        bodyOf: ({ startTime, endTime, page }) => ({
          startTime,
          endTime,
          accountType: "MAIN",
          statusList: ["CANCELED", "EXPIRED", "FILLED", "PARTIALLY_FILLED", "EXPIRED_IN_MATCH"],
          rows: ORDER_HISTORY_PAGE_SIZE,
          page,
        }),
      }, windows),
      collectOrderHistorySource({
        path: HISTORY_ENDPOINTS.conditionalOrderHistory,
        bodyOf: ({ startTime, endTime, page }) => ({
          startTime,
          endTime,
          algoType: "CONDITIONAL",
          sort: "desc",
          statusList: ["CANCELED", "EXPIRED", "REJECTED", "TRIGGERED", "FINISHED"],
          rows: ORDER_HISTORY_PAGE_SIZE,
          page,
        }),
      }, windows),
    ]);
    return {
      complete: regular.complete && conditional.complete,
      expected: regular.expected + conditional.expected,
      pageCount: regular.pageCount + conditional.pageCount,
      regularCount: regular.expected,
      conditionalCount: conditional.expected,
    };
  }

  async function runBinanceHistoryCollection() {
    const state = binanceHistoryCollection;
    try {
      state.stage = "waitingForAuthenticatedTemplate";
      for (const dataset of Object.keys(HISTORY_LABELS)) updateHistoryBranch(dataset, { status: "running" });
      const waitStarted = Date.now();
      while (!privateTemplateFor(HISTORY_ENDPOINTS.firstTradeTime) && Date.now() - waitStarted < 15000) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      if (!privateTemplateFor(HISTORY_ENDPOINTS.firstTradeTime)) throw new Error("币安页面未产生可复用的登录请求，请确认登录状态");
      state.stage = "collectingHistory";
      const first = await privateHistoryRequest(HISTORY_ENDPOINTS.firstTradeTime, undefined, "tradeHistory");
      const now = Date.now();
      const firstTradeTime = Number(first?.data);
      const startAt = Number.isFinite(firstTradeTime) && firstTradeTime > 0 ? firstTradeTime : now;
      const windows = timeWindows(startAt, now);
      state.range = { startAt, endAt: now, firstTradeTime, windowDays: HISTORY_WINDOW_MS / 86400000, windowCount: windows.length };
      for (const dataset of Object.keys(HISTORY_LABELS)) updateHistoryBranch(dataset, {
        status: "running",
        requestedStartAt: startAt,
        requestedEndAt: now,
        windowsTotal: windows.length,
      });

      const positionTask = (async () => {
        let complete = true;
        let expected = 0;
        let leaves = 0;
        for (let index = 0; index < windows.length; index += 1) {
          const result = await collectPositionWindow(windows[index][0], windows[index][1]);
          complete = complete && result.complete;
          expected += result.expected;
          leaves += result.leaves;
          updateHistoryBranch("positionHistory", { status: "running", windowsCompleted: index + 1, pageCount: leaves, recordCount: countChunkRows(state.chunks, "positionHistory") });
        }
        return { complete, expected, leaves };
      })();
      const [order, trades, positions, transactions] = await Promise.all([
        collectOrderHistory(windows),
        collectPagedTimeHistory("tradeHistory", HISTORY_ENDPOINTS.tradeHistory, windows),
        positionTask,
        collectPagedTimeHistory("transactionHistory", HISTORY_ENDPOINTS.transactionHistory, windows),
      ]);

      updateHistoryBranch("tradeHistory", { status: trades.complete ? "completed" : "partial", completeness: trades.complete ? "complete" : "partial", expectedCount: trades.expected, recordCount: countChunkRows(state.chunks, "tradeHistory") });
      updateHistoryBranch("positionHistory", { status: positions.complete ? "completed" : "partial", completeness: positions.complete ? "complete" : "partial", expectedCount: positions.expected, recordCount: countChunkRows(state.chunks, "positionHistory") });
      updateHistoryBranch("transactionHistory", { status: transactions.complete ? "completed" : "partial", completeness: transactions.complete ? "complete" : "partial", expectedCount: transactions.expected, recordCount: countChunkRows(state.chunks, "transactionHistory") });

      const uniqueOrderRows = new Map();
      for (const row of state.chunks.flatMap((item) => item?.sourceData?.orderHistory || [])) {
        const key = String(row?.historyId || `${row?.recordType || "order"}:${row?.algoId || row?.orderId || ""}`);
        if (key && !uniqueOrderRows.has(key)) uniqueOrderRows.set(key, row);
      }
      const orderRecordCount = countChunkRows(state.chunks, "orderHistory");
      const regularOrderCount = [...uniqueOrderRows.values()].filter((row) => row?.recordType === "regularOrderHistory").length;
      const conditionalOrderCount = [...uniqueOrderRows.values()].filter((row) => row?.recordType === "conditionalOrderHistory").length;
      const orderComplete = order.complete;
      updateHistoryBranch("orderHistory", {
        status: orderComplete ? "completed" : "partial",
        completeness: orderComplete ? "complete" : "partial",
        pageCount: order.pageCount,
        expectedCount: orderComplete ? orderRecordCount : order.expected,
        recordCount: orderRecordCount,
        rawResponseCount: order.expected,
        duplicateResponseCount: Math.max(0, order.expected - orderRecordCount),
        regularOrderCount,
        conditionalOrderCount,
        missingOrderCount: orderComplete ? 0 : Math.max(0, order.expected - orderRecordCount),
        limitation: orderComplete ? undefined : `币安官方历史委托分页未遍历到底：原始响应声明 ${order.expected} 条，实际取得 ${orderRecordCount} 条唯一记录`,
      });
      state.stage = "completed";
      state.running = false;
      state.completedAt = new Date().toISOString();
    } catch (error) {
      state.stage = "error";
      state.running = false;
      state.error = error instanceof Error ? error.message : "币安历史采集失败";
      for (const dataset of Object.keys(HISTORY_LABELS)) {
        if (state.branches[dataset].status === "running" || state.branches[dataset].status === "pending") {
          updateHistoryBranch(dataset, { status: "failed", completeness: "failed", error: state.error });
        }
      }
    }
  }

  function startBinanceHistoryCollection() {
    if (platform.id !== "binance") return null;
    if (binanceHistoryCollection?.running) return publicHistoryState(false);
    const branches = Object.fromEntries(Object.entries(HISTORY_LABELS).map(([dataset, label]) => [dataset, {
      dataset, label, status: "pending", completeness: "unknown", recordCount: 0, pageCount: 0, windowsCompleted: 0, windowsTotal: 0,
    }]));
    binanceHistoryCollection = {
      running: true,
      stage: "preparing",
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requestCount: 0,
      branches,
      chunks: [],
    };
    runBinanceHistoryCollection();
    return publicHistoryState(false);
  }

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.open = function open(method, url, ...rest) {
    this.__lptffObservationRequest = { method: String(method || "GET").toUpperCase(), url, headers: new Headers() };
    return originalOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.setRequestHeader = function setRequestHeader(name, value) {
    try {
      this.__lptffObservationRequest?.headers?.append(name, value);
    } catch {
      // 页面原始请求仍照常设置。
    }
    return originalSetRequestHeader.call(this, name, value);
  };
  XMLHttpRequest.prototype.send = function send(body) {
    const request = this.__lptffObservationRequest;
    if (request && requestInfo(request.url)) {
      this.addEventListener("load", () => {
        const info = requestInfo(request.url);
        if (!info) return;
        if (platform.id === "binance" && this.status >= 200 && this.status < 300 && /^\/bapi\/futures\/v1\/private\/future\//i.test(info.pathname)) {
          try {
            privateRequestTemplates.set(info.pathname, new Request(new URL(request.url, location.href).toString(), {
              method: request.method,
              headers: request.headers,
              body: request.method === "GET" || request.method === "HEAD" ? undefined : body,
              credentials: "include",
            }));
          } catch {
            // 同 fetch 模板：只损失主动历史读取，不影响页面。
          }
        }
        const text = this.responseText || "";
        storeSnapshot(info, request.method, body, this.status, this.getResponseHeader("content-type") || "", text, text.length);
      });
    }
    return originalSend.call(this, body);
  };

  // WebSocket 观察样本：分类与 URL 脱敏由平台配置决定（币安区分行情流/用户数据流，
  // 用户数据流 URL 中的 listenKey 必须脱敏；其他平台默认统一 kind: websocket）。
  function wsEntry(rawUrl) {
    const url = platform.sanitizeWsUrl ? platform.sanitizeWsUrl(rawUrl) : String(rawUrl);
    let entry = wsStreams.get(url);
    if (!entry) {
      if (wsStreams.size >= MAX_WS_STREAMS) {
        const oldest = wsStreams.keys().next().value;
        if (oldest !== undefined) wsStreams.delete(oldest);
      }
      entry = { url, kind: platform.classifyWs ? platform.classifyWs(rawUrl) : "websocket", messageCount: 0, sentCount: 0, firstMessages: [], firstSends: [], capturedAt: new Date().toISOString() };
      wsStreams.set(url, entry);
    }
    return entry;
  }

  function recordWsMessage(rawUrl, data) {
    try {
      const entry = wsEntry(rawUrl);
      entry.messageCount += 1;
      if (entry.firstMessages.length < MAX_WS_SAMPLES_PER_STREAM && typeof data === "string" && data.length) {
        const payload = parseJsonLoose(data);
        const sample = payload !== null ? safeValue(payload) : safeValue(data.slice(0, MAX_WS_SAMPLE_BYTES));
        if (sample !== undefined) entry.firstMessages.push(sample);
      }
    } catch {
      // 观察不能破坏页面自身的 WS 处理。
    }
  }

  function recordWsSend(rawUrl, data) {
    try {
      const entry = wsEntry(rawUrl);
      entry.sentCount += 1;
      if (entry.firstSends.length < MAX_WS_SAMPLES_PER_STREAM && typeof data === "string" && data.length) {
        const payload = parseJsonLoose(data);
        const sample = payload !== null ? safeValue(payload) : safeValue(data.slice(0, MAX_WS_SAMPLE_BYTES));
        if (sample !== undefined) entry.firstSends.push(sample);
      }
    } catch {
      // 同上。
    }
  }

  try {
    const OriginalWebSocket = window.WebSocket;
    class ObservedWebSocket extends OriginalWebSocket {
      constructor(url, protocols) {
        super(url, protocols);
        const streamUrl = this.url;
        wsEntry(streamUrl);
        let onmessageHandler = null;
        let nativeWrapper = null;
        const nativeAdd = this.addEventListener.bind(this);
        const nativeRemove = this.removeEventListener.bind(this);
        Object.defineProperty(this, "onmessage", {
          configurable: true,
          enumerable: true,
          get: () => onmessageHandler,
          set: (handler) => {
            onmessageHandler = typeof handler === "function" ? handler : null;
            if (nativeWrapper) {
              nativeRemove("message", nativeWrapper);
              nativeWrapper = null;
            }
            if (typeof handler === "function") {
              nativeWrapper = (event) => {
                recordWsMessage(streamUrl, event.data);
                return onmessageHandler.call(this, event);
              };
              nativeAdd("message", nativeWrapper);
            }
          },
        });
        this.addEventListener = (type, listener, options) => {
          if (type === "message" && typeof listener === "function") {
            const wrapped = (event) => {
              recordWsMessage(streamUrl, event.data);
              return listener.call(this, event);
            };
            return nativeAdd(type, wrapped, options);
          }
          return nativeAdd(type, listener, options);
        };
        const nativeSend = this.send.bind(this);
        this.send = (data) => {
          recordWsSend(streamUrl, data);
          return nativeSend(data);
        };
      }
    }
    window.WebSocket = ObservedWebSocket;
  } catch {
    // 页面自身的 WebSocket 实现优先于观察；补丁失败时只损失观察样本。
  }

  // 页面可能把网络流放进 Worker（跨标签共享）。Worker 内部的 WS 我们看不到，
  // 但 Worker 脚本 URL 的存在本身就是「流在 Worker 中」的证据，属于观察报告的重要事实。
  try {
    const OriginalWorker = window.Worker;
    class ObservedWorker extends OriginalWorker {
      constructor(url, options) {
        super(url, options);
        noteWorker(url, "worker");
      }
    }
    window.Worker = ObservedWorker;
  } catch {
    // 同上。
  }
  try {
    if (window.SharedWorker) {
      const OriginalSharedWorker = window.SharedWorker;
      class ObservedSharedWorker extends OriginalSharedWorker {
        constructor(url, options) {
          super(url, options);
          noteWorker(url, "shared-worker");
        }
      }
      window.SharedWorker = ObservedSharedWorker;
    }
  } catch {
    // 同上。
  }

  function noteWorker(url, kind) {
    if (workerScripts.size >= MAX_WORKERS) return;
    workerScripts.set(String(url), { url: String(url), kind, capturedAt: new Date().toISOString() });
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== location.origin) return;
    if (event.data?.type === "LPTFF_OBS_PING") {
      window.postMessage({
        source: "lptff-investment-assistant",
        type: "LPTFF_OBS_PONG",
        data: { url: location.href, platform: platform.id },
      }, location.origin);
      return;
    }
    if (event.data?.type === "LPTFF_OBS_GET_DATA") {
      window.postMessage({
        source: "lptff-investment-assistant",
        type: "LPTFF_OBS_DATA",
        data: {
          platform: platform.id,
          pageUrl: location.href,
          capturedSince: new Date(capturedSince).toISOString(),
          restSnapshots: [...restSnapshots.values()],
          wsStreams: [...wsStreams.values()],
          workers: [...workerScripts.values()],
          historyCollection: publicHistoryState(true),
        },
      }, location.origin);
      return;
    }
    if (event.data?.type === "LPTFF_BINANCE_HISTORY_START") {
      window.postMessage({
        source: "lptff-investment-assistant",
        type: "LPTFF_BINANCE_HISTORY_STATE",
        data: startBinanceHistoryCollection(),
      }, location.origin);
      return;
    }
    if (event.data?.type === "LPTFF_BINANCE_HISTORY_STATUS") {
      window.postMessage({
        source: "lptff-investment-assistant",
        type: "LPTFF_BINANCE_HISTORY_STATE",
        data: publicHistoryState(false),
      }, location.origin);
      return;
    }
    if (event.data?.type === "LPTFF_SOURCE_GET_DATA") {
      const data = {
        platform: platform.id,
        pageUrl: location.href,
        capturedSince: new Date(capturedSince).toISOString(),
        restSnapshots: [...restSnapshots.values()],
        wsStreams: [...wsStreams.values()],
        workers: [...workerScripts.values()],
        historyCollection: publicHistoryState(true),
      };
      window.postMessage({
        source: "lptff-investment-assistant",
        type: "LPTFF_SOURCE_DATA",
        data: globalThis.LPTFFMultiDomainSourceExtractor?.buildSourceCapture(platform.id, {
          capturedAt: new Date().toISOString(),
          data,
        }) || null,
      }, location.origin);
      return;
    }
    if (event.data?.type === "LPTFF_OBS_RESET") {
      restSnapshots.clear();
      wsStreams.clear();
      workerScripts.clear();
      binanceHistoryCollection = null;
      capturedSince = Date.now();
      window.postMessage({
        source: "lptff-investment-assistant",
        type: "LPTFF_OBS_RESET_OK",
      }, location.origin);
    }
  });
})();
