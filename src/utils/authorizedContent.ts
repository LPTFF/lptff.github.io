import sources from "../../project-support/extension/lptff-investment-assistant/content-sources.json";

const KEY = "lptff-authorized-content-v1";
const PER_AUTHOR_LIMIT = 60;
type Item = Record<string, any>;

const inFlightQueries = new Map<string, Promise<any>>();

export function authorizedRequest(action: string, payload: Record<string, unknown> = {}): Promise<any> {
  const isQuery = action === "STATUS" && Object.keys(payload).length === 0;
  if (isQuery && inFlightQueries.has(action)) {
    return inFlightQueries.get(action)!;
  }

  const p = new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    const isAi = ["AI_ANALYZE", "AI_TEST"].includes(action);
    const timeoutMs = isAi ? 65000 : action === "STATUS" ? 2500 : 8000;
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", receive);
      reject(new Error("尚未检测到采集扩展，请确认扩展已启用；若已安装可稍候或点击检查连接"));
    }, timeoutMs);

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

  if (isQuery) {
    inFlightQueries.set(action, p);
    p.finally(() => inFlightQueries.delete(action));
  }

  return p;
}

export function normalizeContentCover(platform: string, value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.startsWith("//") ? `https:${value}` : value);
    if (platform === "bilibili" && url.protocol === "http:" && (url.hostname === "hdslb.com" || url.hostname.endsWith(".hdslb.com"))) {
      url.protocol = "https:";
    }
    return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
  } catch { return ""; }
}

export function validItems(platform: string, items: unknown): Item[] {
  if (!Array.isArray(items)) return [];
  const pages = new Set(sources.filter((source) => source.platform === platform).map((source) => platform === "douyin"
    ? `https://www.douyin.com/user/${source.uid}` : `https://space.bilibili.com/${source.uid}/dynamic`));

  const filtered = items.filter((item) => item && pages.has(item.authorPage) && item.website === platform
    && Number.isFinite(item.timestamp) && item.timestamp > 0 && typeof item.desc === "string"
    && (platform === "douyin" ? /^https:\/\/www\.douyin\.com\/video\/\d+$/ : /^https:\/\/(?:www\.bilibili\.com\/video\/BV[\da-z]+|t\.bilibili\.com\/\d+)$/i).test(item.detailUrl))
    .map((item) => ({
      detailUrl: item.detailUrl, videoUrl: item.detailUrl, desc: item.desc.slice(0, 4000),
      captionUrl: normalizeContentCover(platform, item.captionUrl),
      authorName: String(item.authorName || "UP主").slice(0, 100), authorPage: item.authorPage,
      website: platform, timestamp: item.timestamp, time: new Date(item.timestamp).toISOString(),
      likeCount: Number(item.likeCount) || 0,
    }));

  // 按作者分组，每位作者独立保留最近 60 条，防止单一高产作者挤占其他作者展示空间
  const byAuthor = new Map<string, Item[]>();
  for (const item of filtered) {
    const list = byAuthor.get(item.authorPage) || [];
    list.push(item);
    byAuthor.set(item.authorPage, list);
  }

  const result: Item[] = [];
  for (const list of byAuthor.values()) {
    result.push(...list.sort((a, b) => b.timestamp - a.timestamp).slice(0, PER_AUTHOR_LIMIT));
  }

  return result.sort((a, b) => b.timestamp - a.timestamp);
}

function saved(): Record<string, any> {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; }
  catch { return {}; }
}

export function saveAuthorizedItems(
  platform: string,
  items: unknown,
  collection?: { updatedAt?: number; state?: string; sources?: any[]; resultVersion?: number }
) {
  const data = saved();
  const existingItems: Item[] = data[platform]?.items || [];
  const validIncoming = validItems(platform, items);

  // 合并旧条目与新条目，以 detailUrl 稳定去重并更新标题、封面和点赞数
  const mergedMap = new Map<string, Item>(existingItems.map((item) => [item.detailUrl, item]));
  for (const incoming of validIncoming) {
    const old = mergedMap.get(incoming.detailUrl);
    if (old) {
      mergedMap.set(incoming.detailUrl, {
        ...old,
        desc: incoming.desc || old.desc,
        captionUrl: incoming.captionUrl || old.captionUrl,
        likeCount: incoming.likeCount ?? old.likeCount,
        authorName: incoming.authorName || old.authorName,
      });
    } else {
      mergedMap.set(incoming.detailUrl, incoming);
    }
  }

  // 再次按作者截断（每作者 60 条）
  const finalItems = validItems(platform, [...mergedMap.values()]);

  // 合法空列表或失败时，不得清空既有内容
  if (!finalItems.length && !existingItems.length && !validIncoming.length) return 0;

  data[platform] = {
    items: finalItems.length ? finalItems : existingItems,
    updatedAt: collection?.updatedAt || data[platform]?.updatedAt || Date.now(),
    state: collection?.state || data[platform]?.state || "unknown",
    sources: collection?.sources || data[platform]?.sources || [],
    resultVersion: collection?.resultVersion || data.resultVersion || Date.now(),
  };
  data.resultVersion = collection?.resultVersion || data.resultVersion || Date.now();

  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("保存授权采集内容到 localStorage 失败", err);
  }

  // 触发响应式更新事件，通知当前页面各消费组件无刷新更新
  window.dispatchEvent(new CustomEvent("lptff-authorized-content-updated", { detail: { platform } }));

  return finalItems.length;
}

export function authorizedCollectionMeta(platform: string) {
  const { updatedAt = 0, state = "unknown", sources = [], resultVersion = 0 } = saved()[platform] || {};
  return { updatedAt, state, sources, resultVersion };
}

export function getSavedResultVersion(): number {
  return saved().resultVersion || 0;
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

export function onAuthorizedContentUpdated(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener("lptff-authorized-content-updated", handler);
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) callback();
  });
  return () => {
    window.removeEventListener("lptff-authorized-content-updated", handler);
    window.removeEventListener("storage", handler);
  };
}
