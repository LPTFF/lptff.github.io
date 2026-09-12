const key = "lptff-content-analysis-v1";
export function analysisFor(domain: string, url: string, title: string) {
  try {
    const item = JSON.parse(localStorage.getItem(key) || "{}")[domain]?.[url];
    if (domain === "welfare" && item?.analysis?.category === "其他福利") return undefined;
    return item?.title === title.slice(0, 1500) ? item.analysis : undefined;
  } catch { return undefined; }
}
export function saveAnalyses(domain: string, results: any[]) {
  let stored: Record<string, any> = {};
  try { stored = JSON.parse(localStorage.getItem(key) || "{}"); } catch { /* Keep other usable batches when possible. */ }
  const entries = stored[domain] || {};
  for (const item of results) entries[item.url] = { title: item.title, analysis: item.analysis };
  stored[domain] = Object.fromEntries(Object.entries(entries).slice(-1500));
  localStorage.setItem(key, JSON.stringify(stored));
  window.dispatchEvent(new CustomEvent("lptff-analysis-updated", { detail: domain }));
}

export function analysesForItems(domain: string, items: any[]) {
  return items.flatMap(item => {
    const url = item.link || item.url, title = item.title || item.desc || "";
    const analysis = analysisFor(domain, url, title);
    return analysis ? [{ url, title, analysis }] : [];
  });
}
