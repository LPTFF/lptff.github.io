/**
 * Browser localStorage Data Migration Helper.
 * Exports browser-local collected items, analysis, and contract reviews
 * into standard exchange package format for importing into the private platform.
 */

export interface BrowserExportPackage {
  formatVersion: "private-platform-exchange/1.0";
  source: "lptff-browser-local";
  exportedAt: string;
  summary: {
    total_records: number;
    authorized_content_count: number;
    content_analyses_count: number;
    contract_review_count: number;
  };
  records: Array<{
    id: string;
    category: "knowledge" | "work" | "life" | "health" | "finance" | "digital";
    title: string;
    body: string;
    confidentiality: "normal" | "private" | "strict_private";
    source_type: string;
    source_time?: string;
    metadata?: Record<string, any>;
  }>;
}

export function exportBrowserDataPackage(): BrowserExportPackage {
  const records: BrowserExportPackage["records"] = [];
  let authCount = 0;
  let analysisCount = 0;
  let contractCount = 0;

  // 1. Authorized Content (bilibili, douyin, etc.)
  try {
    const rawAuth = localStorage.getItem("lptff-authorized-content-v1");
    if (rawAuth) {
      const parsed = JSON.parse(rawAuth);
      for (const [platform, container] of Object.entries(parsed as Record<string, any>)) {
        const items = container?.items;
        if (Array.isArray(items)) {
          for (const item of items) {
            authCount++;
            records.push({
              id: `auth-${platform}-${btoa(item.detailUrl || String(Math.random())).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32)}`,
              category: "digital",
              title: item.desc ? item.desc.slice(0, 80) : `来源收藏: ${platform}`,
              body: JSON.stringify({
                author: item.authorName,
                authorPage: item.authorPage,
                detailUrl: item.detailUrl,
                desc: item.desc,
                platform,
                likeCount: item.likeCount,
                time: item.time,
              }, null, 2),
              confidentiality: "normal",
              source_type: `browser_collected_${platform}`,
              source_time: item.time || new Date().toISOString(),
              metadata: {
                platform,
                author: item.authorName,
                url: item.detailUrl,
              },
            });
          }
        }
      }
    }
  } catch (e) {
    console.warn("Failed to export authorized content:", e);
  }

  // 2. Content Analyses (welfare, pojie)
  try {
    const rawAnalysis = localStorage.getItem("lptff-content-analysis-v1");
    if (rawAnalysis) {
      const parsed = JSON.parse(rawAnalysis);
      for (const [domain, items] of Object.entries(parsed as Record<string, any>)) {
        if (items && typeof items === "object") {
          for (const [url, entry] of Object.entries(items as Record<string, any>)) {
            analysisCount++;
            records.push({
              id: `analysis-${domain}-${btoa(url).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32)}`,
              category: domain === "welfare" ? "life" : "knowledge",
              title: entry.title ? entry.title.slice(0, 80) : `资讯分析: ${url}`,
              body: JSON.stringify({
                url,
                title: entry.title,
                domain,
                analysis: entry.analysis,
              }, null, 2),
              confidentiality: "normal",
              source_type: `browser_analysis_${domain}`,
              source_time: new Date().toISOString(),
              metadata: {
                domain,
                url,
                analysis: entry.analysis,
              },
            });
          }
        }
      }
    }
  } catch (e) {
    console.warn("Failed to export content analysis:", e);
  }

  // 3. Contract Review Management
  try {
    const rawContract = localStorage.getItem("contract-review-management/1.0");
    if (rawContract) {
      const parsed = JSON.parse(rawContract);
      contractCount++;
      records.push({
        id: "contract-review-state-local",
        category: "finance",
        title: "合约复盘助手规则与复盘历史",
        body: JSON.stringify(parsed, null, 2),
        confidentiality: "private",
        source_type: "browser_contract_review",
        source_time: new Date().toISOString(),
        metadata: {
          conclusionsCount: parsed.conclusions?.length || 0,
          preflightCount: parsed.preflightHistory?.length || 0,
        },
      });
    }
  } catch (e) {
    console.warn("Failed to export contract review state:", e);
  }

  return {
    formatVersion: "private-platform-exchange/1.0",
    source: "lptff-browser-local",
    exportedAt: new Date().toISOString(),
    summary: {
      total_records: records.length,
      authorized_content_count: authCount,
      content_analyses_count: analysisCount,
      contract_review_count: contractCount,
    },
    records,
  };
}
