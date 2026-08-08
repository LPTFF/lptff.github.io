(() => {
  const paths = {
    hold: "/request/hold",
    single: "/http/single/get",
    delegate: "/queryapi/trading/Query/DelegateList",
  };
  const captured = { hold: null, single: {}, delegate: [], snapshots: [] };
  const snapshotIndex = new Map();
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
      return safeValue(body);
    }
  }

  function saveResponse(url, method, requestBody, response) {
    const info = requestInfo(url);
    if (!info) return;
    response.clone().text().then((text) => {
      let payload;
      try {
        payload = JSON.parse(text);
      } catch {
        return;
      }
      const accepted = (info.key === "hold" || info.key === "single") ? payload?.succeed : payload?.code === 1200;
      if (!accepted) return;
      const safePayload = safeValue(payload);
      const request = parseBody(requestBody);
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
    }).catch(() => {});
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
    if (url && requestInfo(url)) saveResponse(url, method, body, response);
    return response;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function open(method, url, ...rest) {
    this.__lptffRequest = { method: String(method || "GET").toUpperCase(), url };
    return originalOpen.call(this, method, url, ...rest);
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
        saveResponse(request.url, request.method, body, response);
      });
    }
    return originalSend.call(this, body);
  };

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.data?.type !== "LPTFF_GET_NETWORK_DATA") return;
    window.postMessage({
      source: "lptff-investment-assistant",
      type: "LPTFF_NETWORK_DATA",
      data: captured,
    }, location.origin);
  });
})();
