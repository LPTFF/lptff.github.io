/* Douyin LAN bridge: signed public snapshots; credentials are HTTPS-only and opt-in. */
(() => {
  const CONFIG_KEY = "lptffDouyinLanBridgeV1";
  const STATUS_KEY = "lptffDouyinLanBridgeStatusV1";

  const encode = (value) => new TextEncoder().encode(value);
  const hex = (buffer) => [...new Uint8Array(buffer)].map((value) => value.toString(16).padStart(2, "0")).join("");

  function isLanHost(hostname) {
    if (["localhost", "127.0.0.1", "[::1]"].includes(hostname)) return true;
    const parts = hostname.split(".");
    if (parts.length !== 4 || !parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)) return false;
    const [a, b] = parts.map(Number);
    return a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
  }

  function normalizeBaseUrl(value) {
    const url = new URL(String(value || "").trim());
    if (!["http:", "https:"].includes(url.protocol) || !isLanHost(url.hostname) || url.username || url.password) {
      throw new Error("桥接地址必须是家庭局域网内的 HTTP(S) 地址");
    }
    return `${url.protocol}//${url.host}`;
  }

  async function config() {
    const stored = (await chrome.storage.local.get(CONFIG_KEY))[CONFIG_KEY] || {};
    return {
      enabled: Boolean(stored.enabled),
      baseUrl: String(stored.baseUrl || ""),
      secret: String(stored.secret || ""),
      syncCookie: Boolean(stored.syncCookie),
    };
  }

  async function saveConfig(next) {
    const current = await config();
    const baseUrl = next.baseUrl ? normalizeBaseUrl(next.baseUrl) : "";
    const secret = String(next.secret || current.secret || "").trim();
    const value = {
      enabled: Boolean(next.enabled),
      baseUrl,
      secret,
      syncCookie: Boolean(next.syncCookie),
    };
    if (value.enabled && (!value.baseUrl || value.secret.length < 24)) {
      throw new Error("启用桥接前需填写局域网地址和至少 24 位独立配对密钥");
    }
    if (value.syncCookie && !value.baseUrl.startsWith("https://")) {
      throw new Error("Cookie 自动同步只允许使用 HTTPS 局域网地址");
    }
    await chrome.storage.local.set({ [CONFIG_KEY]: value });
    return publicConfig(value);
  }

  function publicConfig(value) {
    return {
      enabled: value.enabled,
      baseUrl: value.baseUrl,
      hasSecret: value.secret.length >= 24,
      syncCookie: value.syncCookie,
    };
  }

  async function signedFetch(path, body, method = "POST") {
    const current = await config();
    if (!current.enabled) return { ok: false, state: "disabled" };
    const baseUrl = normalizeBaseUrl(current.baseUrl);
    if (current.secret.length < 24) throw new Error("桥接配对密钥未配置");
    const raw = body == null ? "" : JSON.stringify(body);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonce = hex(crypto.getRandomValues(new Uint8Array(16)));
    const payloadHash = hex(await crypto.subtle.digest("SHA-256", encode(raw)));
    const key = await crypto.subtle.importKey("raw", encode(current.secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = hex(await crypto.subtle.sign("HMAC", key, encode(`${method}\n${path}\n${timestamp}\n${nonce}\n${payloadHash}`)));
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Bridge-Timestamp": timestamp,
        "X-Bridge-Nonce": nonce,
        "X-Bridge-Signature": signature,
      },
      body: method === "GET" ? undefined : raw,
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      signal: AbortSignal.timeout(12000),
    });
    const result = await response.json().catch(() => ({ ok: false, error: `HTTP ${response.status}` }));
    if (!response.ok || !result.ok) throw new Error(`bridge_http_${response.status}`);
    return result;
  }

  async function updateStatus(patch) {
    const previous = (await chrome.storage.local.get(STATUS_KEY))[STATUS_KEY] || {};
    const next = { ...previous, ...patch, updatedAt: Date.now() };
    await chrome.storage.local.set({ [STATUS_KEY]: next });
    return next;
  }

  async function syncCookieIfEnabled() {
    const current = await config();
    if (!current.enabled || !current.syncCookie) return { ok: false, state: "disabled" };
    if (!current.baseUrl.startsWith("https://")) throw new Error("credential_sync_requires_https");
    const cookies = await chrome.cookies.getAll({ url: "https://www.douyin.com/" });
    const cookie = cookies
      .filter((item) => item.name && typeof item.value === "string" && /^(?:\.)?(?:www\.)?douyin\.com$/.test(item.domain))
      .map((item) => `${item.name}=${item.value}`)
      .join("; ");
    if (!cookie) throw new Error("douyin_cookie_unavailable");
    return signedFetch("/api/collector/v2/credentials/douyin", { cookie });
  }

  async function syncAfterCollection(items, sources) {
    const current = await config();
    if (!current.enabled) return updateStatus({ state: "disabled" });
    try {
      const snapshot = await signedFetch("/api/collector/v2/browser-snapshots/douyin", {
        schemaVersion: 1,
        collectedAt: new Date().toISOString(),
        items,
        sources,
      });
      let credentialState = "disabled";
      if (current.syncCookie) {
        try { await syncCookieIfEnabled(); credentialState = "updated"; }
        catch { return updateStatus({ state: "credential-failed", itemCount: snapshot.itemCount || items.length, credentialState: "failed", error: "credential_sync_failed" }); }
      }
      return updateStatus({ state: "synced", itemCount: snapshot.itemCount || items.length, credentialState, error: "" });
    } catch (error) {
      return updateStatus({ state: "waiting-lan", error: "bridge_unavailable_or_rejected" });
    }
  }

  async function status() {
    const current = await config();
    const local = (await chrome.storage.local.get(STATUS_KEY))[STATUS_KEY] || { state: "idle" };
    return { ...publicConfig(current), status: local };
  }

  globalThis.LPTFFDouyinBridge = { saveConfig, status, syncAfterCollection };
})();
