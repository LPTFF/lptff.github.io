/**
 * Investment Review P0 引擎：投资范围与按问题数据状态（WP0-1）。
 *
 * 投资范围（InvestmentScope）是复盘的计算与评价边界：仓位分母必须来自该范围内可靠的总
 * 资产或可投资资金。单只基金是范围内的分析对象，不自动成为分母。一个问题缺数据只降级该
 * 问题的判断，不阻断无依赖关系的判断（工程附录 §4 全局不变量 2/7）。
 *
 * 纯函数：不直接读取 DOM、Cookie 或 Token，只消费 Ledger 中的真实来源标准化事实。
 */
import type {
  AccountSnapshot,
  AssetMetadata,
  AssetId,
  DailyPnL,
  DataCoverage,
  HoldingSnapshot,
  InvestmentScope,
  PerJudgmentCoverage,
  PortfolioSnapshot,
  Transaction,
} from "../../domain";

/** 复盘输入事实：来自 Ledger 的真实来源标准化事实。 */
export interface ReviewFacts {
  account?: AccountSnapshot;
  portfolio?: PortfolioSnapshot;
  assets: AssetMetadata[];
  transactions: Transaction[];
  dailyPnl: DailyPnL[];
  coverage: DataCoverage[];
}

/** 按 scope 过滤后、喂给各判断的事实集。 */
export interface ScopeFacts {
  scope: InvestmentScope;
  holdings: HoldingSnapshot[];
  transactions: Transaction[];
  assets: AssetMetadata[];
  dailyPnl: DailyPnL[];
  /** 范围内基金市值合计（分子用）。 */
  eligibleFundMarketValue: number;
  /** 仓位分母（总资产/可投资资金）。 */
  denominatorValue?: number;
  /** 分母是否合格：有值且分母 Coverage 不是 unknown/partial。 */
  denominatorEligible: boolean;
  /** inScopeAssetIds：实际纳入的资产集合。 */
  inScopeAssetIds: AssetId[];
}

/** 当时生效的 scope：effectiveFrom <= today 且未过期，取最高版本。 */
export function resolveActiveScope(scopes: InvestmentScope[], today: string): InvestmentScope | undefined {
  const active = scopes
    .filter((s) => s.effectiveFrom <= today && (!s.effectiveTo || s.effectiveTo >= today))
    .sort((a, b) => a.version - b.version);
  return active[active.length - 1];
}

function isInScope(assetId: AssetId, scope: InvestmentScope): boolean {
  if (scope.excludedAssetIds?.includes(assetId)) return false;
  if (!scope.includedAssetIds.length) return true; // 未指定则全部纳入
  return scope.includedAssetIds.includes(assetId);
}

/**
 * 按 scope 收集事实：过滤 holdings/transactions/dailyPnl 到范围内资产，
 * 并计算仓位分母。分母缺失时只标记 denominatorEligible=false，不抛错、不阻断其他判断。
 */
export function gatherScopeFacts(scope: InvestmentScope, facts: ReviewFacts): ScopeFacts {
  const inScopeAssetIds = (facts.portfolio?.holdings ?? [])
    .map((h) => h.assetId)
    .filter((id) => isInScope(id, scope));
  const inScopeSet = new Set(inScopeAssetIds);

  const holdings = (facts.portfolio?.holdings ?? []).filter((h) => inScopeSet.has(h.assetId));
  const transactions = facts.transactions.filter((t) => inScopeSet.has(t.assetId));
  const dailyPnl = facts.dailyPnl.filter((p) => inScopeSet.has(p.assetId));
  const assets = facts.assets.filter((a) => inScopeSet.has(a.assetId));

  const eligibleFundMarketValue = holdings.reduce((sum, h) => sum + (h.marketValue || 0), 0);

  const denominatorValue = computeDenominator(scope, facts);
  const denominatorCoverage = scope.denominatorCoverage;
  const denominatorCoverageComplete =
    !denominatorCoverage ||
    denominatorCoverage.completeness === "complete" ||
    (denominatorCoverage.completeness === undefined && denominatorCoverage.warningCodes.length === 0);
  const denominatorEligible = denominatorValue !== undefined && denominatorValue > 0 && denominatorCoverageComplete;

  return {
    scope,
    holdings,
    transactions,
    assets,
    dailyPnl,
    eligibleFundMarketValue,
    denominatorValue,
    denominatorEligible,
    inScopeAssetIds,
  };
}

function computeDenominator(scope: InvestmentScope, facts: ReviewFacts): number | undefined {
  switch (scope.denominatorSource) {
    case "account_total_asset":
      return facts.account?.totalAsset;
    case "declared_investable":
      return facts.portfolio?.totalAsset;
    case "none":
    default:
      return undefined;
  }
}

const JUDGMENT_DATASET_DEPS: Record<string, DataCoverage["dataset"][]> = {
  operation: ["transactions"],
  position: ["holdings", "account"],
  trailing_stop: ["dailyPnl", "fundDetail"],
  reduction: ["transactions", "holdings"],
  take_profit: ["holdings"],
};

function findCoverage(coverage: DataCoverage[], dataset: DataCoverage["dataset"]): DataCoverage | undefined {
  return coverage.find((c) => c.dataset === dataset);
}

/**
 * 为每个用户问题构造独立的 PerJudgmentCoverage。
 * 一个判断的证据不足只出现在它自己的 coverage.warnings + affectedJudgmentIds，
 * 不污染其他判断——这是"一个问题 unknown 不让整个复盘失效"的工程落点。
 */
export function buildPerJudgmentCoverage(
  scope: InvestmentScope,
  facts: ReviewFacts,
  asOf: string,
): PerJudgmentCoverage[] {
  const make = (
    judgmentId: string,
    deps: DataCoverage["dataset"][],
    extraWarnings: string[] = [],
  ): PerJudgmentCoverage => {
    const warnings: string[] = [];
    let pagingComplete = true;
    let freshness: "fresh" | "stale" | "unknown" = "fresh";
    const sources: string[] = [];
    for (const dep of deps) {
      const cov = findCoverage(facts.coverage, dep);
      sources.push(dep);
      if (!cov) {
        warnings.push(`coverage:${dep}:missing`);
        freshness = "unknown";
        continue;
      }
      if (cov.completeness === "partial") warnings.push(`coverage:${dep}:partial`);
      if (cov.completeness === "unknown") {
        warnings.push(`coverage:${dep}:unknown`);
        freshness = freshness === "fresh" ? "unknown" : freshness;
      }
      warnings.push(...cov.warningCodes);
      if (cov.lastSyncedAt && cov.lastSyncedAt.slice(0, 10) < asOf.slice(0, 10) && freshness === "fresh") {
        freshness = "stale";
      }
    }
    const finalWarnings = Array.from(new Set([...warnings, ...extraWarnings]));
    const affected = finalWarnings.length ? [judgmentId] : [];
    return {
      judgmentId,
      sources,
      pagingComplete,
      freshness,
      warnings: finalWarnings,
      affectedJudgmentIds: affected,
    };
  };

  return [
    make("operation", JUDGMENT_DATASET_DEPS.operation),
    make("position", JUDGMENT_DATASET_DEPS.position, scope.denominatorSource === "none" ? ["denominator:none"] : []),
    make("trailing_stop", JUDGMENT_DATASET_DEPS.trailing_stop),
    make("reduction", JUDGMENT_DATASET_DEPS.reduction),
    make("take_profit", JUDGMENT_DATASET_DEPS.take_profit),
  ];
}
