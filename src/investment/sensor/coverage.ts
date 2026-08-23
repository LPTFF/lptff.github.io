/**
 * Sensor：Data Coverage 合并与健康汇总（PRD §11、§17、§29）。
 *
 * 合并策略保留“最后有效事实”：一次完整采集可以修复旧 partial/unknown；后续失败或
 * partial 也不能抹掉已经验证完整的数据（PRD §15）。knownRanges 取并集（允许重叠）；
 * lastSyncedAt 取较新。升级为更强 Coverage 时同时丢弃旧批次的过期 warning。
 */
import type { CoverageCompleteness, DataCoverage } from "../domain";

const COMPLETENESS_RANK: Record<CoverageCompleteness, number> = {
  complete: 2,
  partial: 1,
  unknown: 0,
};

function newer(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
}

/** 合并两条同 dataset 的 Coverage。 */
export function mergeCoverageEntry(a: DataCoverage, b: DataCoverage): DataCoverage {
  if (a.dataset !== b.dataset) {
    throw new Error(`mergeCoverageEntry: dataset 不一致 ${a.dataset} vs ${b.dataset}`);
  }
  const seen = new Set<string>();
  const knownRanges = [...a.knownRanges, ...b.knownRanges].filter((r) => {
    const key = `${r.start}~${r.end}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const aRank = COMPLETENESS_RANK[a.completeness];
  const bRank = COMPLETENESS_RANK[b.completeness];
  const strongest = bRank > aRank ? b : a;
  const latest = !a.lastSyncedAt || (b.lastSyncedAt && b.lastSyncedAt >= a.lastSyncedAt) ? b : a;
  const warningCodes = aRank === bRank
    ? Array.from(new Set([...a.warningCodes, ...b.warningCodes]))
    : [...strongest.warningCodes];
  return {
    dataset: a.dataset,
    knownRanges,
    completeness: strongest.completeness,
    latestSyncStatus: latest.latestSyncStatus ?? latest.completeness,
    syncObservedCount: latest.syncObservedCount,
    syncExpectedCount: latest.syncExpectedCount,
    observedCount: latest.observedCount,
    observationUnit: latest.observationUnit,
    observationNote: latest.observationNote,
    lastSyncedAt: aRank === bRank ? newer(a.lastSyncedAt, b.lastSyncedAt) : strongest.lastSyncedAt,
    warningCodes,
  };
}

/** 合并两组 Coverage（按 dataset 分组）。 */
export function mergeCoverage(existing: DataCoverage[], incoming: DataCoverage[]): DataCoverage[] {
  const map = new Map<string, DataCoverage>();
  for (const c of existing) map.set(c.dataset, { ...c });
  for (const c of incoming) {
    const prev = map.get(c.dataset);
    map.set(c.dataset, prev ? mergeCoverageEntry(prev, c) : { ...c });
  }
  return Array.from(map.values());
}

export type HealthLevel = "normal" | "needs_attention" | "blocked" | "unknown";

export interface SensorHealth {
  level: HealthLevel;
  /** 数据缺口：partial/unknown 的 dataset。 */
  gaps: DataCoverage[];
  warnings: string[];
  summary: string;
}

/** 含 blocked：完全无数据或来源失败；needs_attention：存在 partial；unknown：缺少账户/持仓。 */
export function deriveHealth(coverage: DataCoverage[], warnings: string[]): SensorHealth {
  const gaps = coverage.filter((c) => c.completeness !== "complete");
  const accountCov = coverage.find((c) => c.dataset === "account");
  const holdingsCov = coverage.find((c) => c.dataset === "holdings");

  let level: HealthLevel = "normal";
  if (
    (accountCov && accountCov.completeness === "unknown") ||
    (holdingsCov && holdingsCov.completeness === "unknown")
  ) {
    level = "blocked";
  } else if (gaps.length > 0) {
    level = "needs_attention";
  }

  const summary =
    level === "normal"
      ? "同步任务完成；实际观测覆盖需单独核对"
      : level === "blocked"
        ? "账户或持仓数据缺失，无法判断"
        : gaps.length > 0
          ? `${gaps.length} 个数据集存在缺口`
          : "未知状态";

  return { level, gaps, warnings: [...warnings], summary };
}
