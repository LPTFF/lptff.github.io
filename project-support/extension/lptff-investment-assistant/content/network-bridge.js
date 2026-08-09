(() => {
  const paths = {
    hold: "/request/hold",
    single: "/http/single/get",
    delegate: "/queryapi/trading/Query/DelegateList",
  };
  const captured = { hold: null, single: {}, delegate: [], snapshots: [] };
  const snapshotIndex = new Map();
  const delegateHeaders = new Map();
  const SENSITIVE_KEY = /^(?:authorization|access[-_]?token|token|cookie|set[-_]?cookie|session(?:[-_]?id)?|password|secret)$/i;
  const SENSITIVE_PART = /(?:authorization|access[-_]?token|session|password|secret|token|cookie)/i;

  function requestInfo(url) {
    try {
      const parsed = new URL(url, location.href);
      const key = Object.entries(paths).find(([, path]) => parsed.pathname === path)?.[0] || "";
      if (!key) return null;
      return { key, path: parsed.pathname, query: Object.fromEntries(parsed.searchParams.entries()) };
    } catch {
      return null;
    }
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

  function safeHeaders(headers) {
    const allowed = new Set(["accept", "content-type", "x-requested-with"]);
    try {
      return Object.fromEntries(
        Array.from(new Headers(headers || {}).entries()).filter(([name]) => allowed.has(name.toLowerCase())),
      );
    } catch {
      return {};
    }
  }

  function saveResponse(url, method, requestBody, response, requestHeaders) {
    const info = requestInfo(url);
    if (!info) return Promise.resolve(false);
    return response.clone().text().then((text) => {
      let payload;
      try {
        payload = JSON.parse(text);
      } catch {
        return false;
      }
      const accepted = (info.key === "hold" || info.key === "single") ? payload?.succeed : payload?.code === 1200;
      if (!accepted) return false;
      const safePayload = safeValue(payload);
      const request = parseBody(requestBody);
      if (info.key === "delegate" && request?.timeType !== undefined) {
        delegateHeaders.set(String(request.timeType), safeHeaders(requestHeaders));
      }
      const fingerprint = JSON.stringify({ key: info.key, method, query: info.query, request });
      const snapshot = {
        key: info.key,
        method,
        path: info.path,
        query: info.query,
        requestBody: request,
        status: response.status,
        contentType: response.headers.get("content-type") || "",
        response: safePayload,
      };
      const index = snapshotIndex.get(fingerprint);
      if (index === undefined) {
        snapshotIndex.set(fingerprint, captured.snapshots.length);
        captured.snapshots.push(snapshot);
      } else {
        captured.snapshots[index] = snapshot;
      }
      captured[info.key] = info.key === "single"
        ? { ...captured.single, [request?.dt || "unknown"]: safePayload }
        : safePayload;
      if (info.key === "delegate") captured.delegate = captured.snapshots.filter((item) => item.key === "delegate");
      return true;
    }).catch(() => false);
  }

  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const request = args[0];
    const init = args[1] || {};
    const url = typeof request === "string" ? request : request?.url;
    const method = String(init.method || request?.method || "GET").toUpperCase();
    let body = init.body;

    if (url && requestInfo(url) && body === undefined && request instanceof Request) {
      try {
        body = await request.clone().text();
      } catch {
        body = undefined;
      }
    }

    const response = await originalFetch(...args);
    if (url && requestInfo(url)) saveResponse(url, method, body, response, init.headers || request?.headers);
    return response;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function open(method, url, ...rest) {
    this.__lptffRequest = { method: String(method || "GET").toUpperCase(), url };
    return originalOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.setRequestHeader = function setRequestHeader(name, value) {
    if (this.__lptffRequest) {
      this.__lptffRequest.headers = { ...(this.__lptffRequest.headers || {}), [name]: value };
    }
    return originalSetRequestHeader.call(this, name, value);
  };
  XMLHttpRequest.prototype.send = function send(body) {
    const request = this.__lptffRequest;
    if (request && requestInfo(request.url)) {
      this.addEventListener("load", () => {
        const info = requestInfo(request.url);
        if (!info) return;
        const response = new Response(this.responseText, {
          status: this.status,
          headers: { "content-type": this.getResponseHeader("content-type") || "" },
        });
        saveResponse(request.url, request.method, body, response, request.headers);
      });
    }
    return originalSend.call(this, body);
  };

  async function fetchDelegatePage(requestId, timeType, pageNum) {
    const snapshots = captured.delegate || [];
    const templateSnapshot = [...snapshots].reverse().find((snapshot) =>
      String(snapshot.requestBody?.timeType) === String(timeType),
    );
    if (!templateSnapshot?.requestBody) {
      window.postMessage({
        source: "lptff-investment-assistant",
        type: "LPTFF_DELEGATE_PAGE_RESULT",
        requestId,
        ok: false,
        error: `交易时间范围 ${timeType} 缺少请求模板`,
      }, location.origin);
      return;
    }

    const requestBody = { ...templateSnapshot.requestBody, pageNum };
    const templateHeaders = delegateHeaders.get(String(timeType)) || {};
    const contentType = templateHeaders["content-type"] || "application/json";
    const body = /application\/x-www-form-urlencoded/i.test(contentType)
      ? new URLSearchParams(Object.entries(requestBody).map(([name, value]) => [name, String(value)])).toString()
      : JSON.stringify(requestBody);
    try {
      const response = await window.fetch(paths.delegate, {
        method: "POST",
        credentials: "include",
        headers: { ...templateHeaders, "content-type": contentType },
        body,
      });
      const payload = await response.clone().json();
      const stored = await saveResponse(paths.delegate, "POST", body, response, templateHeaders);
      const list = payload?.data?.list;
      window.postMessage({
        source: "lptff-investment-assistant",
        type: "LPTFF_DELEGATE_PAGE_RESULT",
        requestId,
        ok: response.ok && payload?.code === 1200 && stored,
        pageNum,
        listCount: Array.isArray(list) ? list.length : 0,
        totalCount: Number(payload?.data?.totalCount) || 0,
        error: response.ok && payload?.code === 1200 && stored ? "" : `交易接口返回 ${payload?.code || response.status} 或快照未写入`,
      }, location.origin);
    } catch (error) {
      window.postMessage({
        source: "lptff-investment-assistant",
        type: "LPTFF_DELEGATE_PAGE_RESULT",
        requestId,
        ok: false,
        error: error instanceof Error ? error.message : "交易分页请求失败",
      }, location.origin);
    }
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== location.origin) return;
    if (event.data?.type === "LPTFF_GET_NETWORK_DATA") {
      window.postMessage({
        source: "lptff-investment-assistant",
        type: "LPTFF_NETWORK_DATA",
        data: captured,
      }, location.origin);
      return;
    }
    if (event.data?.type === "LPTFF_FETCH_DELEGATE_PAGE") {
      fetchDelegatePage(event.data.requestId, event.data.timeType, event.data.pageNum);
    }
  });
})();
