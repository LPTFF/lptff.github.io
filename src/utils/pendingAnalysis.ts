import { analysisFor, hasContentAnalysis } from "./contentAnalysis";
import { bilibiliItemsFor } from "./bilibiliSources";

import oldWelfareSource from "../data/welfare.json";
import tuanSource from "../data/welfare/0818tuan.json";
import tuanTopSource from "../data/welfare/0818tuanTop.json";
import zhuanyesSource from "../data/welfare/zhuanyes.json";
import zhuanyesTopSource from "../data/welfare/zhuanyesTop.json";
import daydayzhuanSource from "../data/welfare/daydayzhuan.json";
import daydayzhuanTopSource from "../data/welfare/daydayzhuanTop.json";
import zhujicepingSource from "../data/welfare/zhujiceping.json";
import hamibotSource from "../data/welfare/hamibot.json";
import keywordSearchSource from "../data/welfare/keyword-search.json";
import welfareRadar from "../data/welfare-ecosystem.json";

import pojieNews from "../data/52pojie.json";
import kanxueNews from "../data/kanxue.json";
import pojieEcosystemRadar from "../data/52pojie-ecosystem.json";

export interface PendingCandidate {
  domain: "welfare" | "pojie";
  url: string;
  title: string;
  source: string;
}

const welfareRadarMap = new Map<string, any>(
  ((welfareRadar as any).items || []).map((item: any) => [item.link, item])
);

const pojieRadarMap = new Map<string, any>(
  ((pojieEcosystemRadar as any).items || []).map((item: any) => [item.url || item.link, item])
);

function isValidUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return ["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

export function getWelfarePendingCandidates(): PendingCandidate[] {
  const allWelfareRaw = [
    ...bilibiliItemsFor("welfare"),
    ...tuanTopSource,
    ...zhuanyesTopSource,
    ...daydayzhuanTopSource,
    ...oldWelfareSource,
    ...tuanSource,
    ...zhuanyesSource,
    ...daydayzhuanSource,
    ...zhujicepingSource,
    ...hamibotSource,
    ...keywordSearchSource,
  ];

  const seenUrls = new Set<string>();
  const candidates: PendingCandidate[] = [];

  for (const item of allWelfareRaw) {
    const rawUrl = (item as any).link || (item as any).url;
    const rawTitle = (item as any).title || (item as any).desc;
    if (!rawUrl || !rawTitle || typeof rawTitle !== "string" || !rawTitle.trim()) continue;

    const url = rawUrl.trim();
    if (seenUrls.has(url) || !isValidUrl(url)) continue;
    seenUrls.add(url);

    const title = rawTitle.trim();
    const local = analysisFor("welfare", url, title);
    const radar = welfareRadarMap.get(url);
    const existing = local || radar;

    if (!hasContentAnalysis("welfare", existing)) {
      candidates.push({
        domain: "welfare",
        url,
        title,
        source: (item as any).authorName || (item as any).website || "福利来源",
      });
    }
  }

  return candidates;
}

export function getPojiePendingCandidates(): PendingCandidate[] {
  const allPojieRaw = [
    ...bilibiliItemsFor("pojie"),
    ...pojieNews,
    ...kanxueNews,
  ];

  const seenUrls = new Set<string>();
  const candidates: PendingCandidate[] = [];

  for (const item of allPojieRaw) {
    const rawUrl = (item as any).link || (item as any).url;
    const rawTitle = (item as any).title || (item as any).desc;
    if (!rawUrl || !rawTitle || typeof rawTitle !== "string" || !rawTitle.trim()) continue;

    const url = rawUrl.trim();
    if (seenUrls.has(url) || !isValidUrl(url)) continue;
    seenUrls.add(url);

    const title = rawTitle.trim();
    const local = analysisFor("pojie", url, title);
    const radar = pojieRadarMap.get(url);
    const existing = local || radar;

    if (!hasContentAnalysis("pojie", existing)) {
      candidates.push({
        domain: "pojie",
        url,
        title,
        source: (item as any).authorName || (item as any).website || "安全社区",
      });
    }
  }

  return candidates;
}

export function getPendingAnalysisCandidates(): {
  welfare: PendingCandidate[];
  pojie: PendingCandidate[];
  total: number;
} {
  const welfare = getWelfarePendingCandidates();
  const pojie = getPojiePendingCandidates();
  return {
    welfare,
    pojie,
    total: welfare.length + pojie.length,
  };
}
