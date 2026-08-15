const PROFILE_URL = (code) => `https://fundf10.eastmoney.com/jbgk_${encodeURIComponent(code)}.html`;
const CURRENCY_URL = (code) => `https://fund.eastmoney.com/${encodeURIComponent(code)}.html`;
const INDUSTRY_URL = (code) => `https://api.fund.eastmoney.com/f10/HYPZ/?fundCode=${encodeURIComponent(code)}&year=${new Date().getFullYear()}`;

function textOf(node) {
  return String(node?.textContent || "").replace(/\s+/g, " ").trim();
}

function normalizedCode(value) {
  const match = String(value || "").match(/\b\d{6}\b/);
  return match ? match[0] : "";
}

function fieldMap(documentNode) {
  const fields = {};
  for (const row of documentNode.querySelectorAll("tr")) {
    const cells = Array.from(row.querySelectorAll(":scope > th, :scope > td"));
    for (let index = 0; index < cells.length - 1; index += 1) {
      if (cells[index].tagName !== "TH") continue;
      const label = textOf(cells[index]);
      const value = textOf(cells[index + 1]);
      if (label && value && !fields[label]) fields[label] = value;
    }
  }
  return fields;
}

function sectionMap(documentNode) {
  const sections = {};
  for (const box of documentNode.querySelectorAll(".boxitem")) {
    const heading = textOf(box.querySelector("h4 .left, h4.t label, h4"));
    if (!heading) continue;
    const content = textOf(box.querySelector("p, .txt_in, .box"));
    if (content) sections[heading] = content;
  }
  return sections;
}

function sleep(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

async function fetchWithRetry(url, options = {}, retries = 2, baseDelay = 700) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(baseDelay * (attempt + 1));
    }
  }
  throw lastError;
}

async function collectProfile(code) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetchWithRetry(PROFILE_URL(code), { credentials: "omit" });
    if (!response.ok) {
      if (attempt < 2) await sleep(700 * (attempt + 1));
      continue;
    }
    const html = await response.text();
    const documentNode = new DOMParser().parseFromString(html, "text/html");
    const fields = fieldMap(documentNode);
    const sections = sectionMap(documentNode);
    if (Object.keys(fields).length || Object.keys(sections).length) {
      return {
        fields,
        sections,
        fundName: fields["基金简称"] || undefined,
        fundType: fields["基金类型"] || undefined,
        benchmark: fields["业绩比较基准"] || undefined,
        trackedIndexText: fields["跟踪标的"] || undefined,
        investmentObjective: sections["投资目标"] || undefined,
        investmentScope: sections["投资范围"] || undefined,
        sourceUrl: PROFILE_URL(code),
      };
    }
    if (attempt < 2) await sleep(700 * (attempt + 1));
  }
  throw new Error("基金概况未返回结构化字段（重试后仍失败）");
}

async function collectCurrency(code) {
  const response = await fetchWithRetry(CURRENCY_URL(code), { credentials: "omit" });
  if (!response.ok) throw new Error(`基金详情请求失败（HTTP ${response.status}）`);
  const html = await response.text();
  const match = html.match(/\bvar\s+currency\s*=\s*["']([^"']+)["']/i);
  return match ? String(match[1]).trim() : "";
}

async function collectIndustry(code) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetchWithRetry(INDUSTRY_URL(code), {
      credentials: "omit",
      headers: { Accept: "application/json" },
    });
    if (response.ok) {
      const payload = await response.json();
      if (payload?.ErrCode === 0) {
        const latest = Array.isArray(payload?.Data?.QuarterInfos) ? payload.Data.QuarterInfos[0] : null;
        return {
          asOf: latest?.JZRQ || undefined,
          industries: Array.isArray(latest?.HYPZInfo) ? latest.HYPZInfo : [],
        };
      }
    }
    if (attempt < 2) await sleep(700 * (attempt + 1));
  }
  throw new Error("行业配置未返回有效数据（重试后仍失败）");
}

async function collectFund(holding) {
  const fundCode = normalizedCode(holding?.fundCode || holding?.code);
  if (!fundCode) return { fundCode: "", warnings: ["持仓缺少基金代码"] };
  const settled = await Promise.allSettled([
    collectProfile(fundCode),
    collectCurrency(fundCode),
    collectIndustry(fundCode),
  ]);
  const warnings = [];
  const profile = settled[0].status === "fulfilled" ? settled[0].value : {};
  const currency = settled[1].status === "fulfilled" ? settled[1].value : "";
  const industry = settled[2].status === "fulfilled" ? settled[2].value : { industries: [] };
  if (settled[0].status === "rejected") warnings.push(`${fundCode}：${settled[0].reason?.message || "基金概况采集失败"}`);
  if (settled[1].status === "rejected") warnings.push(`${fundCode}：${settled[1].reason?.message || "计价币种采集失败"}`);
  if (settled[2].status === "rejected") warnings.push(`${fundCode}：${settled[2].reason?.message || "行业配置采集失败"}`);
  return {
    fundCode,
    ...profile,
    currency: currency || undefined,
    industryAsOf: industry.asOf,
    industries: industry.industries,
    warnings,
  };
}

async function collectPublicFunds(holdings, concurrency, onProgress) {
  const results = new Array(holdings.length);
  let nextIndex = 0;
  let completed = 0;
  async function worker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= holdings.length) return;
      results[index] = await collectFund(holdings[index]);
      completed += 1;
      chrome.runtime.sendMessage({
        type: "SOURCE_BRANCH_PROGRESS",
        branch: "publicFunds",
        completed,
        total: holdings.length,
      }).catch(() => {});
      onProgress?.(completed);
    }
  }
  await Promise.all(Array.from({ length: Math.min(Math.max(1, concurrency || 4), holdings.length || 1) }, worker));
  return results.filter(Boolean);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "OFFSCREEN_COLLECT_PUBLIC_FUNDS") return undefined;
  collectPublicFunds(message.holdings || [], message.concurrency || 4)
    .then((items) => sendResponse({ ok: true, items }))
    .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "公开基金档案采集失败" }));
  return true;
});
