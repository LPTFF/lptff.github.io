/**
 * Sensor：Data Coverage 合并与健康汇总（PRD §11、§17、§29）。
 *
 * 合并策略保守：任一方 partial/unknown 不得被升级为 complete（PRD §15）。
 * knownRanges 取并集（允许重叠）；lastSyncedAt 取较新；warningCodes 取并集。
 */
import type { CoverageCompleteness, DataCoverage } from "../domain";

const COMPLETENESS_RANK: Record<CoverageCompleteness, number> = {
  complete: 2,
  partial: 1,
  unknown: 0,
};

/** 取两者中较弱的 completeness，保证不静默升级。 */
function weaker(a: CoverageCompleteness, b: CoverageCompleteness): CoverageCompleteness {
  return COMPLETENESS_RANK[a] <= COMPLETENESS_RANK[b] ? a : b;
}

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
  return {
    dataset: a.dataset,
    knownRanges,
    completeness: weaker(a.completeness, b.completeness),
    lastSyncedAt: newer(a.lastSyncedAt, b.lastSyncedAt),
    warningCodes: Array.from(new Set([...a.warningCodes, ...b.warningCodes])),
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
      ? "数据完整，无需操作"
      : level === "blocked"
        ? "账户或持仓数据缺失，无法判断"
        : gaps.length > 0
          ? `${gaps.length} 个数据集存在缺口`
          : "未知状态";

  return { level, gaps, warnings: [...warnings], summary };
}
