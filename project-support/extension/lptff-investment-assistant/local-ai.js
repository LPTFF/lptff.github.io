// Shared local AI settings. Keep the legacy storage key for existing assistants.
async function loadLocalGeminiConfig() {
  const raw = (await chrome.storage.local.get("lptffBossAutopilot")).lptffBossAutopilot || {};
  return { geminiKey: String(raw.geminiKey || ""), model: raw.model || "gemini-3.5-flash-lite" };
}

async function localAiConfig(patch) {
  if (patch) {
    const stored = (await chrome.storage.local.get("lptffBossAutopilot")).lptffBossAutopilot || {};
    if (patch.model && !GEMINI_MODELS.has(patch.model)) throw new Error("不支持的模型");
    if (patch.model) stored.model = patch.model;
    if (patch.geminiKey?.trim()) stored.geminiKey = String(patch.geminiKey).trim().slice(0, 500);
    await chrome.storage.local.set({ lptffBossAutopilot: stored });
  }
  const config = await loadLocalGeminiConfig();
  return { ok: true, hasKey: Boolean(config.geminiKey), model: config.model };
}

const localAnalysisInFlight = new Map();
async function analyzeLocalContent(domain, input, cacheOnly = false) {
  if (!["welfare", "pojie"].includes(domain) || !Array.isArray(input) || !input.length || input.length > (cacheOnly ? 500 : 6)) {
    throw new Error("每批仅支持 1–6 条资讯");
  }
  const contract = (await (await fetch(chrome.runtime.getURL("content-analysis.json"))).json())[domain];
  const categories = contract.schema.properties.results.items.properties.category.enum;
  const usable = value => value && categories.includes(value.category) && (cacheOnly || value.category !== "待分类");
  const entries = input.map((item, index) => {
    const url = new URL(item.url);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || !String(item.title || "").trim()) throw new Error("资讯格式无效");
    return { id: String(index), url: url.href, title: String(item.title).slice(0, 1500) };
  });
  const hash = async (text) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))), b => b.toString(16).padStart(2, "0")).join("");
  const keys = await Promise.all(entries.map(item => hash(JSON.stringify([1, domain, item.url, item.title]))));
  if (cacheOnly) {
    const cache = (await chrome.storage.local.get(`lptffContentAnalysis-${domain}`))[`lptffContentAnalysis-${domain}`] || {};
    return { ok: true, results: entries.flatMap((entry, index) => usable(cache[keys[index]]) ? [{ url: entry.url, title: entry.title, analysis: cache[keys[index]] }] : []) };
  }
  const batchKey = keys.join(":");
  if (localAnalysisInFlight.has(batchKey)) return localAnalysisInFlight.get(batchKey);
  const work = (async () => {
    const cacheKey = `lptffContentAnalysis-${domain}`;
    const cache = (await chrome.storage.local.get(cacheKey))[cacheKey] || {};
    const missing = entries.filter((_, index) => !usable(cache[keys[index]]));
    if (missing.length) {
      // Gemini responseSchema represents nullable fields differently from JSON Schema.
      const geminiSchema = (node) => {
        if (Array.isArray(node)) return node.map(geminiSchema);
        if (!node || typeof node !== "object") return node;
        const result = Object.fromEntries(Object.entries(node).map(([key, value]) => [key, geminiSchema(value)]));
        if (Array.isArray(node.type)) { result.type = node.type.find(type => type !== "null"); result.nullable = node.type.includes("null"); }
        return result;
      };
      const result = await callLocalGemini({ system: contract.system, prompt: JSON.stringify(missing), schema: geminiSchema(contract.schema), maxOutputTokens: 6000, maxAttempts: 1 });
      const analyses = result.results;
      const spec = contract.schema.properties.results.items;
      const ids = new Set();
      if (!Array.isArray(analyses) || analyses.length !== missing.length) throw new Error("分析条数不完整，保留已有结果");
      const validate = (value, rule) => {
        if (value === null) return Array.isArray(rule.type) && rule.type.includes("null");
        if (rule.enum && !rule.enum.includes(value)) return false;
        const type = Array.isArray(rule.type) ? rule.type[0] : rule.type;
        if (type === "integer" || type === "number") return Number.isFinite(value) && (type !== "integer" || Number.isInteger(value)) && value >= (rule.minimum ?? -Infinity) && value <= (rule.maximum ?? Infinity);
        if (type === "array") return Array.isArray(value) && value.length <= (rule.maxItems || 20) && value.every(v => validate(v, rule.items));
        return typeof value === type && (type !== "string" || value.length <= 2000);
      };
      for (const item of analyses) {
        if (!missing.some(entry => entry.id === item.id) || ids.has(item.id) || !item.summary?.trim()
          || !spec.required.every(field => validate(item[field], spec.properties[field]))) throw new Error("分析字段校验失败，保留已有结果");
        ids.add(item.id);
      }
      // Commit only validated batches; merge with other completed requests.
      const current = (await chrome.storage.local.get(cacheKey))[cacheKey] || {};
      for (const item of analyses) {
        const analysis = Object.fromEntries(spec.required.filter(field => field !== "id").map(field => [field, item[field]]));
        current[keys[Number(item.id)]] = { ...analysis, model: result.__lptffModel, analyzedAt: Date.now() };
      }
      const retained = Object.fromEntries(Object.entries(current).sort((a, b) => b[1].analyzedAt - a[1].analyzedAt).slice(0, 1500));
      await chrome.storage.local.set({ [cacheKey]: retained });
      Object.assign(cache, current);
    }
    return { ok: true, results: entries.map((entry, index) => ({ url: entry.url, title: entry.title, analysis: cache[keys[index]] })) };
  })();
  localAnalysisInFlight.set(batchKey, work);
  try { return await work; } finally { localAnalysisInFlight.delete(batchKey); }
}
