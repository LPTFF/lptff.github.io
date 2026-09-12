import sources from "../../project-support/extension/lptff-investment-assistant/content-sources.json";

const KEY = "lptff-authorized-content-v1";
type Item = Record<string, any>;

export function authorizedRequest(action: string, payload: Record<string, unknown> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", receive);
      reject(new Error("尚未连接新版采集扩展，请安装或重载扩展后刷新页面"));
    }, ["AI_ANALYZE", "AI_TEST"].includes(action) ? 65000 : 8000);
    function receive(event: MessageEvent) {
      if (event.source !== window || event.origin !== location.origin
        || event.data?.source !== "lptff-investment-assistant"
        || event.data.type !== "LPTFF_AUTHORIZED_CONTENT_RESPONSE" || event.data.requestId !== requestId) return;
      clearTimeout(timer);
      window.removeEventListener("message", receive);
      if (event.data.response?.ok) resolve(event.data.response);
      else reject(new Error(event.data.response?.error || "采集扩展未响应"));
    }
    window.addEventListener("message", receive);
    window.postMessage({ type: "LPTFF_AUTHORIZED_CONTENT_REQUEST", action, requestId, ...JSON.parse(JSON.stringify(payload)) }, location.origin);
  });
}

export function normalizeContentCover(platform: string, value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.startsWith("//") ? `https:${value}` : value);
    if (platform === "bilibili" && url.protocol === "http:" && (url.hostname === "hdslb.com" || url.hostname.endsWith(".hdslb.com"))) url.protocol = "https:";
    return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
  } catch { return ""; }
}

function validItems(platform: string, items: unknown): Item[] {
  if (!Array.isArray(items)) return [];
  const pages = new Set(sources.filter((source) => source.platform === platform).map((source) => platform === "douyin"
    ? `https://www.douyin.com/user/${source.uid}` : `https://space.bilibili.com/${source.uid}/dynamic`));
  return items.filter((item) => item && pages.has(item.authorPage) && item.website === platform
    && Number.isFinite(item.timestamp) && item.timestamp > 0 && typeof item.desc === "string"
    && (platform === "douyin" ? /^https:\/\/www\.douyin\.com\/video\/\d+$/ : /^https:\/\/(?:www\.bilibili\.com\/video\/BV[\da-z]+|t\.bilibili\.com\/\d+)$/i).test(item.detailUrl))
    .slice(0, 200).map((item) => ({
      detailUrl: item.detailUrl, videoUrl: item.detailUrl, desc: item.desc.slice(0, 4000),
      captionUrl: normalizeContentCover(platform, item.captionUrl),
      authorName: String(item.authorName || "UP主").slice(0, 100), authorPage: item.authorPage,
      website: platform, timestamp: item.timestamp, time: new Date(item.timestamp).toISOString(),
      likeCount: Number(item.likeCount) || 0,
    }));
}

function saved(): Record<string, any> {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; }
  catch { return {}; }
}

export function saveAuthorizedItems(platform: string, items: unknown, collection?: { updatedAt?: number; state?: string; sources?: any[] }) {
  const data = saved();
  const valid = validItems(platform, items);
  if (!valid.length) return 0; // Never clear the previous usable result on a login failure.
  data[platform] = { items: valid, updatedAt: collection?.updatedAt || 0, state: collection?.state || "unknown", sources: collection?.sources || [] };
  localStorage.setItem(KEY, JSON.stringify(data));
  return valid.length;
}

export function authorizedCollectionMeta(platform: string) {
  const { updatedAt = 0, state = "unknown", sources = [] } = saved()[platform] || {};
  return { updatedAt, state, sources };
}

export function mergeAuthorizedItems(platform: string, snapshot: Item[]): Item[] {
  const local = validItems(platform, saved()[platform]?.items);
  const merged = new Map(snapshot.map((item) => [item.detailUrl || item.videoUrl, item]));
  for (const item of local) {
    const previous = merged.get(item.detailUrl);
    merged.set(item.detailUrl, { ...item, captionUrl: item.captionUrl || normalizeContentCover(platform, previous?.captionUrl) });
  }
  return [...merged.values()].sort((a, b) => b.timestamp - a.timestamp);
}
