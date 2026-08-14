/**
 * A 股基金牛熊周期模拟器 composable。
 *
 * 管理模拟时钟（24 期月度）、持仓、止损历史状态，逐期推进：市场净值演变 → 行为模型生成交易 →
 * 更新持仓快照 → 写 Ledger → 触发复盘重跑。用户在规则页改规则、行动页处置后，下一轮复盘信号
 * 减少，体现"持续亏损 → 小亏 → 小赚 → 稳定盈利"的改善路径。全部虚构，不自动交易。
 */
import { reactive, computed } from "vue";
import type {
  AccountSnapshot,
  DataCoverage,
  DecisionRecord,
  ExecutionLink,
  HoldingSnapshot,
  InvestmentScope,
  PerJudgmentCoverage,
  PortfolioSnapshot,
  StrategyRule,
  StrategyRuleVersion,
  TrailingStopRule,
  Transaction,
} from "../domain";
import { InvestmentLedger, type StoredTrailingStopState } from "../ledger/repository";
import {
  MARKET_ASSET_IDS,
  MARKET_ASSETS,
  PHASE_LABEL,
  TOTAL_PERIODS,
  dateOf,
  navRow as navRowOf,
  phaseOf,
  type MarketAssetId,
} from "../__fixtures__/review/market";
import { generateActions, defaultToggles, type BehaviorLogEntry, type BehaviorToggles } from "../engines/review/simulator-behavior";
import { advanceTrailingStop } from "../engines/review/trailing-stop";
import { makeStoredTrailingStopState, makeCoverage } from "../__fixtures__/review/builders";
import { useInvestmentReview } from "./use-investment-review";
import { useInvestmentOS } from "./use-investment-os";

const SCOPE_ID = "scope:sim";
const RULE_VERSION_ID = "srv:sim:v1";

interface SimHolding {
  shares: number;
  costValue: number;
}

interface SimulatorState {
  round: number;
  asOf: string;
  phase: MarketPhase;
  toggles: BehaviorToggles;
  behaviorLog: BehaviorLogEntry[];
  initialized: boolean;
  running: boolean;
  holdings: Record<string, SimHolding>;
}

type MarketPhase = ReturnType<typeof phaseOf>;

const state = reactive<SimulatorState>({
  round: 0,
  asOf: dateOf(0),
  phase: phaseOf(0),
  toggles: defaultToggles(),
  behaviorLog: [],
  initialized: false,
  running: false,
  holdings: {},
});

let ledger: InvestmentLedger | null = null;
function getLedger(): InvestmentLedger {
  if (!ledger) ledger = new InvestmentLedger();
  return ledger;
}

const review = useInvestmentReview();
const os = useInvestmentOS();

const phaseLabel = computed(() => PHASE_LABEL[state.phase]);
const isLastRound = computed(() => state.round >= TOTAL_PERIODS - 1);

function restoreFromLedgerState(): boolean {
  if (os.state.account?.source !== "sim" || !os.state.portfolio) return false;
  const asOf = os.state.account.capturedAt.slice(0, 10);
  const round = Array.from({ length: TOTAL_PERIODS }, (_, index) => dateOf(index)).indexOf(asOf);
  if (round < 0) return false;
  const holdings: Record<string, SimHolding> = {};
  for (const holding of os.state.portfolio.holdings) {
    holdings[holding.assetId] = {
      shares: holding.shares ?? 0,
      costValue: holding.costValue ?? holding.marketValue,
    };
  }
  state.round = round;
  state.asOf = asOf;
  state.phase = phaseOf(round);
  state.holdings = holdings;
  state.behaviorLog = [];
  state.initialized = true;
  state.running = false;
  return true;
}

function buildSimRules(): StrategyRule[] {
  const rules: StrategyRule[] = [];
  for (const aid of MARKET_ASSET_IDS) {
    rules.push({ kind: "position_band", assetId: aid, minPct: 0, maxPct: 0.25, targetPct: 0.15 });
  }
  for (const aid of MARKET_ASSET_IDS) {
    rules.push({ kind: "trailing_stop", assetId: aid, basis: "nav_adjusted", drawdownPct: 0.1, effectiveFrom: "2024-01-01" });
    rules.push({ kind: "reduction_target", assetId: aid, targetMinPct: 0.1, targetMaxPct: 0.2 });
  }
  return rules;
}

function fullCoverage(): DataCoverage[] {
  return [
    makeCoverage({ dataset: "account", knownRanges: [{ start: "2024-01-01", end: dateOf(state.round) }], completeness: "complete" }),
    makeCoverage({ dataset: "holdings", knownRanges: [{ start: "2024-01-01", end: dateOf(state.round) }], completeness: "complete" }),
    makeCoverage({ dataset: "dailyPnl", knownRanges: [{ start: "2024-01-01", end: dateOf(state.round) }], completeness: "complete" }),
    makeCoverage({ dataset: "transactions", knownRanges: [{ start: "2024-01-01", end: dateOf(state.round) }], completeness: "complete" }),
    makeCoverage({ dataset: "fundDetail", knownRanges: [{ start: "2024-01-01", end: dateOf(state.round) }], completeness: "complete" }),
  ];
}

const stubCoverage: PerJudgmentCoverage = {
  judgmentId: "trailing_stop:sim",
  sources: ["dailyPnl", "fundDetail"],
  warnings: [],
  affectedJudgmentIds: [],
};

function toHoldings(holdings: Record<string, SimHolding>, navRow: Record<MarketAssetId, number>): HoldingSnapshot[] {
  return MARKET_ASSET_IDS.filter((aid) => (holdings[aid]?.shares ?? 0) > 0).map((aid) => {
    const h = holdings[aid];
    const nav = navRow[aid];
    return {
      assetId: aid,
      name: MARKET_ASSETS.find((a) => a.assetId === aid)?.name,
      shares: Math.round(h.shares * 10000) / 10000,
      availableShares: Math.round(h.shares * 10000) / 10000,
      marketValue: Math.round(h.shares * nav * 100) / 100,
      costValue: Math.round(h.costValue * 100) / 100,
      nav,
      navDate: dateOf(state.round),
    };
  });
}

function buildRecentNavs(period: number): Partial<Record<MarketAssetId, number[]>> {
  const out: Partial<Record<MarketAssetId, number[]>> = {};
  for (const aid of MARKET_ASSET_IDS) {
    const arr: number[] = [];
    for (let k = Math.max(0, period - 3); k <= period; k++) arr.push(navRowOf(k)[aid]);
    out[aid] = arr;
  }
  return out;
}

function buildCostNav(holdings: Record<string, SimHolding>): Partial<Record<MarketAssetId, number>> {
  const out: Partial<Record<MarketAssetId, number>> = {};
  for (const aid of MARKET_ASSET_IDS) {
    const h = holdings[aid];
    if (h && h.shares > 0) out[aid] = h.costValue / h.shares;
  }
  return out;
}

async function writeFactsToLedger(period: number, holdings: Record<string, SimHolding>): Promise<void> {
  const l = getLedger();
  const navRow = navRowOf(period);
  const holdingSnapshots = toHoldings(holdings, navRow);
  const holdingValue = holdingSnapshots.reduce((s, h) => s + h.marketValue, 0);
  const totalAsset = Math.round(holdingValue * 100) / 100;
  const account: AccountSnapshot = {
    id: `acct:sim:${dateOf(period)}`,
    source: "sim",
    capturedAt: `${dateOf(period)}T15:00:00+08:00`,
    totalAsset,
  };
  const portfolio: PortfolioSnapshot = {
    id: `portfolio:sim:${dateOf(period)}`,
    date: dateOf(period),
    totalAsset,
    holdingValue,
    holdings: holdingSnapshots,
  };
  await l.putAccount(account);
  await l.putPortfolio(portfolio);
  await l.putAssets(MARKET_ASSETS);
  await l.putCoverage(fullCoverage());
}

function applyTx(tx: Transaction, navRow: Record<MarketAssetId, number>): void {
  const aid = tx.assetId as MarketAssetId;
  if (!MARKET_ASSET_IDS.includes(aid)) return;
  const nav = navRow[aid];
  const h = state.holdings[aid] ?? { shares: 0, costValue: 0 };
  if (tx.type === "BUY") {
    const buyShares = tx.amount / nav;
    h.costValue += tx.amount;
    h.shares += buyShares;
  } else if (tx.type === "SELL") {
    const sellShares = tx.amount / nav;
    const ratio = h.shares > 0 ? Math.min(1, sellShares / h.shares) : 0;
    h.costValue = h.costValue * (1 - ratio);
    h.shares = Math.max(0, h.shares - sellShares);
  }
  state.holdings[aid] = h;
}

async function init(forceReset = false): Promise<void> {
  if (!forceReset && restoreFromLedgerState()) {
    await review.loadReviewFromLedger(state.asOf);
    return;
  }
  const simulatorScopeActive = os.state.activeScope?.scopeId === SCOPE_ID;
  const hasUserManagedData = Boolean(
    (os.state.account && os.state.account.source !== "sim")
    || (os.state.activeScope && !simulatorScopeActive)
    || (!simulatorScopeActive && (os.state.transactions.length || os.state.assets.length)),
  );
  if (hasUserManagedData) {
    throw new Error("检测到已有投资数据，模拟器不会覆盖；请先在数据页明确清空后再启动");
  }
  const l = getLedger();
  await l.clearEverything();
  const startHoldings: Record<string, SimHolding> = {
    F001: { shares: 1100, costValue: 1100 },
    F002: { shares: 1100, costValue: 1100 },
    F003: { shares: 900, costValue: 900 },
    F005: { shares: 700, costValue: 700 },
    F006: { shares: 700, costValue: 700 },
  };
  state.holdings = startHoldings;
  state.round = 0;
  state.asOf = dateOf(0);
  state.phase = phaseOf(0);
  state.toggles = defaultToggles();
  state.behaviorLog = [];
  const scope: InvestmentScope = {
    scopeId: SCOPE_ID,
    scopeType: "DECLARED_PORTFOLIO",
    includedAssetIds: MARKET_ASSET_IDS,
    baseCurrency: "CNY",
    denominatorSource: "account_total_asset",
    denominatorAsOf: dateOf(0),
    denominatorCoverage: makeCoverage({ dataset: "account", knownRanges: [{ start: "2024-01-01", end: dateOf(0) }], completeness: "complete" }),
    effectiveFrom: "2024-01-01",
    version: 1,
  };
  await l.putInvestmentScope(scope);
  const ruleVersion: StrategyRuleVersion = {
    id: RULE_VERSION_ID,
    scopeId: SCOPE_ID,
    version: 1,
    effectiveFrom: "2024-01-01",
    rules: buildSimRules(),
    changeReason: "模拟器初始规则",
  };
  await l.putStrategyRuleVersion(ruleVersion);
  await writeFactsToLedger(0, startHoldings);
  for (const aid of MARKET_ASSET_IDS) {
    await l.putTrailingStopState(
      makeStoredTrailingStopState({
        id: `tss:${SCOPE_ID}:${aid}`,
        scopeId: SCOPE_ID,
        assetId: aid,
        ruleVersionId: RULE_VERSION_ID,
        previousHighWaterMark: 1.0,
        currentHighWaterMark: 1.0,
        stopLine: 0.9,
        navBasis: "nav_adjusted",
        asOf: dateOf(0),
      }),
    );
  }
  state.initialized = true;
  await os.loadFromLedger();
  await review.loadReviewFromLedger(dateOf(0));
}

async function advance(): Promise<void> {
  if (state.running) return;
  const newRound = state.round + 1;
  if (newRound >= TOTAL_PERIODS) return;
  state.running = true;
  try {
    const l = getLedger();
    const period = newRound;
    const navRow = navRowOf(period);
    const prevNavRow = navRowOf(period - 1);
    const recentNavs = buildRecentNavs(period);
    const holdingsSnapshot = toHoldings(state.holdings, prevNavRow);
    const costNav = buildCostNav(state.holdings);
    const out = generateActions({
      period,
      scopeId: SCOPE_ID,
      navRow,
      prevNavRow,
      recentNavs,
      holdings: holdingsSnapshot,
      costNav,
      toggles: state.toggles,
    });
    for (const tx of out.transactions) applyTx(tx, navRow);
    for (const d of out.decisions) await l.putDecisionRecord(d);
    for (const lk of out.links) await l.putExecutionLink(lk);
    if (out.transactions.length) await l.putTransactions(out.transactions);
    // 累积移动止损历史状态（每标的用上期 state + 当期 nav 推进）。
    const trailingRules = buildSimRules().filter((r) => r.kind === "trailing_stop") as TrailingStopRule[];
    for (const aid of MARKET_ASSET_IDS) {
      const states = (await l.getTrailingStopStates(SCOPE_ID)).filter((s) => s.assetId === aid);
      const prev = states[states.length - 1];
      const rule = trailingRules.find((r) => r.assetId === aid);
      if (!rule) continue;
      const res = advanceTrailingStop({
        scopeId: SCOPE_ID,
        assetId: aid,
        rule,
        ruleVersionId: RULE_VERSION_ID,
        previousState: prev,
        currentNav: navRow[aid],
        navAsOf: dateOf(period),
        navFresh: true,
        coverage: { ...stubCoverage, judgmentId: `trailing_stop:${aid}` },
        asOf: dateOf(period),
      });
      await l.putTrailingStopState(res.nextState);
    }
    // 先更新模拟时钟，使 writeFacts 的 holding.navDate 用本期日期（否则复盘把 NAV 判为陈旧）。
    state.round = period;
    state.asOf = dateOf(period);
    state.phase = phaseOf(period);
    await writeFactsToLedger(period, state.holdings);
    state.behaviorLog = out.logs;
    await os.loadFromLedger();
    await review.loadReviewFromLedger(dateOf(period));
  } finally {
    state.running = false;
  }
}

async function reset(): Promise<void> {
  await init(true);
}

function toggleBehavior(name: keyof BehaviorToggles): void {
  state.toggles[name] = !state.toggles[name];
}

export function useInvestmentSimulator() {
  return {
    state,
    phaseLabel,
    isLastRound,
    init,
    advance,
    reset,
    toggleBehavior,
  };
}