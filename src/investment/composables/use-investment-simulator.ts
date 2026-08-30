/**
 * 牛熊周期模拟器 composable（真实持仓演练）。
 *
 * 用真实持仓（导入的采集快照或插件采集数据）+ 通过 normalizeIndexId 映射到 IndexId 净值曲线
 * 逐期推进，行为模型生成交易，观察真实组合在牛熊周期的市值/规则偏离演变。
 * 演练用 clearImportedFacts 保留 rules/assets/scope；结束可一键 loadBundledSnapshot 恢复脱敏采集快照。
 * 不再支持 F001-F007 虚构沙盒。
 */
import { reactive, computed } from "vue";
import type {
  AccountSnapshot,
  AssetMetadata,
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
  PHASE_LABEL,
  TOTAL_PERIODS,
  dateOf,
  marketAssetForIndex,
  navOf,
  navByIndexId,
  phaseOf,
  type MarketAssetId,
} from "../simulation/market";
import { normalizeIndexId, type IndexId } from "../engines/scenario/historical-cycles";
import { generateActions, defaultToggles, type BehaviorLogEntry, type BehaviorToggles, type SimBehaviorHolding } from "../engines/review/simulator-behavior";
import { advanceTrailingStop } from "../engines/review/trailing-stop";
import { useInvestmentReview } from "./use-investment-review";
import { useInvestmentOS } from "./use-investment-os";

const SCOPE_ID = "scope:sim";
const RULE_VERSION_ID = "srv:sim:v1";

function simulationCoverage(input: Pick<DataCoverage, "dataset" | "knownRanges" | "completeness">): DataCoverage {
  return { ...input, lastSyncedAt: `${input.knownRanges.at(-1)?.end ?? "2024-01-01"}T15:00:00+08:00`, warningCodes: [] };
}

function simulationTrailingStop(input: StoredTrailingStopState): StoredTrailingStopState {
  return input;
}

interface SimHolding {
  shares: number;
  costValue: number;
}

export interface SimAssetPoint {
  round: number;
  asOf: string;
  phase: MarketPhase;
  totalAsset: number;
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
  /** 每只持仓（assetId）对应的 IndexId（净值曲线键），由 normalizeIndexId 从真实指数名映射。 */
  holdingIndex: Record<string, IndexId>;
  /** 真实持仓中文名（写 Ledger holding.name 用）。 */
  holdingNames: Record<string, string | undefined>;
  /** 规律定投标的 assetId。 */
  regularInvestAssetId: string | undefined;
  /** 演练开始前各基金最近真实交易日期（YYYY-MM-DD），供发现同时展示真实日期供核实。 */
  realTransactionsByAsset: Record<string, string>;
  /** 逐期总资产轨迹（演练内存态，不持久化；刷新续演只保留恢复点）。 */
  assetHistory: SimAssetPoint[];
  /** 是否可回退上一轮（依赖内存快照栈；刷新续演后为 false，只能向前推进）。 */
  canRewind: boolean;
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
  holdingIndex: {},
  holdingNames: {},
  regularInvestAssetId: undefined,
  realTransactionsByAsset: {},
  assetHistory: [],
  canRewind: false,
});

/** 每期推进后的完整快照（回退用）：内存态 + 当期写入 Ledger 的增量。 */
interface SimRoundSnapshot {
  round: number;
  holdings: Record<string, SimHolding>;
  behaviorLog: BehaviorLogEntry[];
  assetHistory: SimAssetPoint[];
  transactions: Transaction[];
  decisions: DecisionRecord[];
  links: ExecutionLink[];
  trailingStates: StoredTrailingStopState[];
}

/** 回退快照栈（模块级内存态，不持久化）：栈底为第 0 期初始态，栈顶为最近完成期。 */
let rewindStack: SimRoundSnapshot[] = [];

let ledger: InvestmentLedger | null = null;
function getLedger(): InvestmentLedger {
  if (!ledger) ledger = new InvestmentLedger();
  return ledger;
}

const review = useInvestmentReview();
const os = useInvestmentOS();

const phaseLabel = computed(() => PHASE_LABEL[state.phase]);
const isLastRound = computed(() => state.round >= TOTAL_PERIODS - 1);

function round2(n: number): number { return Math.round(n * 100) / 100; }
function round4(n: number): number { return Math.round(n * 10000) / 10000; }

/** 取某资产某期 NAV：holdingIndex→marketAssetForIndex→navOf；未匹配返回 1（净值不变，不伪造）。 */
function navOfAsset(assetId: string, period: number): number {
  const ix = state.holdingIndex[assetId];
  if (ix) {
    const maid = marketAssetForIndex(ix);
    if (maid) return navOf(maid, period);
    return 1;
  }
  return 1;
}

/** 真实持仓 asset → IndexId：normalizeIndexId 优先，无匹配取 indexes[0] 兜底。 */
function resolveIndexFromMeta(meta: AssetMetadata | undefined): IndexId {
  if (!meta || !meta.indexes.length) return "CSI300";
  for (const ix of meta.indexes) {
    const nid = normalizeIndexId(ix);
    if (nid) return nid;
  }
  return meta.indexes[0] as IndexId;
}

/** 定投标的：优先 CSI300（沪深300）下首只，否则首只持仓。 */
function pickRegularInvestAsset(): string | undefined {
  const assetIds = Object.keys(state.holdings).filter((aid) => (state.holdings[aid]?.shares ?? 0) > 0);
  if (!assetIds.length) return undefined;
  const csi = assetIds.find((aid) => state.holdingIndex[aid] === "CSI300");
  return csi ?? assetIds[0];
}

/** 从 Ledger 恢复演练状态：真实持仓演练续；旧虚构残留（F001-F007）拒绝恢复（由 OSLayout 清除）。 */
function restoreFromLedgerState(): boolean {
  if (os.state.account?.source !== "sim" || !os.state.portfolio) return false;
  if (os.state.portfolio.holdings.some((h) => MARKET_ASSET_IDS.includes(h.assetId as MarketAssetId))) return false;
  const asOf = os.state.account.capturedAt.slice(0, 10);
  const round = Array.from({ length: TOTAL_PERIODS }, (_, index) => dateOf(index)).indexOf(asOf);
  if (round < 0) return false;
  const holdings: Record<string, SimHolding> = {};
  const holdingIndex: Record<string, IndexId> = {};
  const holdingNames: Record<string, string | undefined> = {};
  for (const holding of os.state.portfolio.holdings) {
    holdings[holding.assetId] = {
      shares: holding.shares ?? 0,
      costValue: holding.costValue ?? holding.marketValue,
    };
    const meta = os.state.assets.find((a) => a.assetId === holding.assetId);
    holdingIndex[holding.assetId] = resolveIndexFromMeta(meta);
    holdingNames[holding.assetId] = holding.name ?? meta?.name;
  }
  state.round = round;
  state.asOf = asOf;
  state.phase = phaseOf(round);
  state.holdings = holdings;
  state.holdingIndex = holdingIndex;
  state.holdingNames = holdingNames;
  state.regularInvestAssetId = pickRegularInvestAsset();
  state.behaviorLog = [];
  // 刷新续演：逐期历史无法从 Ledger 恢复，以当前期为新起点（曲线从恢复点开始记录）。
  state.assetHistory = [];
  recordAssetHistory();
  // 快照栈同为内存态：刷新后丢失，回退不可用，只能向前推进。
  rewindStack = [];
  state.canRewind = false;
  state.initialized = true;
  state.running = false;
  return true;
}

function buildSimRules(assetIds: string[]): StrategyRule[] {
  const rules: StrategyRule[] = [];
  for (const aid of assetIds) {
    rules.push({ kind: "position_band", assetId: aid, minPct: 0, maxPct: 0.25, targetPct: 0.15 });
  }
  for (const aid of assetIds) {
    rules.push({ kind: "trailing_stop", assetId: aid, basis: "nav_adjusted", drawdownPct: 0.1, effectiveFrom: "2024-01-01" });
    rules.push({ kind: "reduction_target", assetId: aid, targetMinPct: 0.1, targetMaxPct: 0.2 });
  }
  return rules;
}

function fullCoverage(): DataCoverage[] {
  return [
    simulationCoverage({ dataset: "account", knownRanges: [{ start: "2024-01-01", end: dateOf(state.round) }], completeness: "complete" }),
    simulationCoverage({ dataset: "holdings", knownRanges: [{ start: "2024-01-01", end: dateOf(state.round) }], completeness: "complete" }),
    simulationCoverage({ dataset: "dailyPnl", knownRanges: [{ start: "2024-01-01", end: dateOf(state.round) }], completeness: "complete" }),
    simulationCoverage({ dataset: "transactions", knownRanges: [{ start: "2024-01-01", end: dateOf(state.round) }], completeness: "complete" }),
    simulationCoverage({ dataset: "fundDetail", knownRanges: [{ start: "2024-01-01", end: dateOf(state.round) }], completeness: "complete" }),
  ];
}

const stubCoverage: PerJudgmentCoverage = {
  judgmentId: "trailing_stop:sim",
  sources: ["dailyPnl", "fundDetail"],
  warnings: [],
  affectedJudgmentIds: [],
};

function holdingName(aid: string): string | undefined {
  return state.holdingNames[aid];
}

function toHoldings(holdings: Record<string, SimHolding>, period: number): HoldingSnapshot[] {
  return Object.keys(holdings).filter((aid) => (holdings[aid]?.shares ?? 0) > 0).map((aid) => {
    const h = holdings[aid];
    const nav = navOfAsset(aid, period);
    return {
      assetId: aid,
      name: holdingName(aid),
      shares: round4(h.shares),
      availableShares: round4(h.shares),
      marketValue: round2(h.shares * nav),
      costValue: round2(h.costValue),
      nav,
      navDate: dateOf(state.round),
    };
  });
}

function toBehaviorHoldings(period: number): SimBehaviorHolding[] {
  return Object.keys(state.holdings).filter((aid) => (state.holdings[aid]?.shares ?? 0) > 0).map((aid) => {
    const h = state.holdings[aid];
    const nav = navOfAsset(aid, period);
    return {
      assetId: aid,
      indexId: state.holdingIndex[aid],
      shares: h.shares,
      costValue: h.costValue,
      marketValue: h.shares * nav,
      name: holdingName(aid),
    };
  });
}

function buildRecentNavsByIndex(period: number): Partial<Record<IndexId, number[]>> {
  const out: Partial<Record<IndexId, number[]>> = {};
  const indexes = new Set<IndexId>(Object.values(state.holdingIndex));
  for (const ix of indexes) {
    const maid = marketAssetForIndex(ix);
    if (!maid) continue;
    const arr: number[] = [];
    for (let k = Math.max(0, period - 3); k <= period; k++) arr.push(navOf(maid, k));
    out[ix] = arr;
  }
  return out;
}

function buildCostNavByAsset(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const aid of Object.keys(state.holdings)) {
    const h = state.holdings[aid];
    if (h && h.shares > 0) out[aid] = h.costValue / h.shares;
  }
  return out;
}

async function writeFactsToLedger(period: number, holdings: Record<string, SimHolding>, realAssets: AssetMetadata[]): Promise<void> {
  const l = getLedger();
  const holdingSnapshots = toHoldings(holdings, period);
  const holdingValue = holdingSnapshots.reduce((s, h) => s + h.marketValue, 0);
  const totalAsset = round2(holdingValue);
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
  await l.putAssets(realAssets);
  await l.putCoverage(fullCoverage());
}

function applyTx(tx: Transaction, period: number): void {
  const aid = tx.assetId;
  const h = state.holdings[aid];
  if (!h) return;
  const nav = navOfAsset(aid, period);
  if (tx.type === "BUY") {
    h.costValue += tx.amount;
    h.shares += nav > 0 ? tx.amount / nav : 0;
  } else if (tx.type === "SELL") {
    const sellShares = nav > 0 ? tx.amount / nav : 0;
    const ratio = h.shares > 0 ? Math.min(1, sellShares / h.shares) : 0;
    h.costValue = h.costValue * (1 - ratio);
    h.shares = Math.max(0, h.shares - sellShares);
  }
  state.holdings[aid] = h;
}

function navOfAssetByIndex(ix: IndexId, period: number): number {
  const maid = marketAssetForIndex(ix);
  return maid ? navOf(maid, period) : 1;
}

/** 轨迹维护（纯函数，便于单测）：同 round 重复推进时覆盖末点，否则追加；返回新数组不改入参。 */
export function upsertSimAssetPoint(history: SimAssetPoint[], point: SimAssetPoint): SimAssetPoint[] {
  const last = history.at(-1);
  if (last && last.round === point.round) return [...history.slice(0, -1), point];
  return [...history, point];
}

/** 逐期总资产轨迹记录：演练曲线数据源（内存态，不持久化）；同 round 重复推进时覆盖末点。 */
function recordAssetHistory(): void {
  const totalAsset = round2(Object.keys(state.holdings)
    .filter((aid) => (state.holdings[aid]?.shares ?? 0) > 0)
    .reduce((s, aid) => s + state.holdings[aid].shares * navOfAsset(aid, state.round), 0));
  state.assetHistory = upsertSimAssetPoint(state.assetHistory, {
    round: state.round, asOf: state.asOf, phase: state.phase, totalAsset,
  });
}

/**
 * 启动真实持仓演练。forceReset=true 强制重开；options.useRealHoldings=true 用当前真实持仓。
 * 无 options 调用时仅尝试恢复已有演练（OSLayout 刷新续演）；恢复失败返回不初始化。
 */
async function init(forceReset = false, options?: { useRealHoldings?: boolean }): Promise<void> {
  if (!forceReset && restoreFromLedgerState()) {
    await review.loadReviewFromLedger(state.asOf);
    return;
  }
  const useReal = Boolean(options?.useRealHoldings && os.state.portfolio && os.state.portfolio.holdings.length > 0);
  if (!useReal) return;
  // 演练开始前捕获各基金最近真实交易日期，供演练发现同时展示"模拟日期 + 真实交易日期"供核实。
  const realTxByAsset: Record<string, string> = {};
  for (const t of os.state.transactions ?? []) {
    const d = (t.occurredAt ?? "").slice(0, 10);
    if (t.assetId && d && (!realTxByAsset[t.assetId] || d > realTxByAsset[t.assetId])) realTxByAsset[t.assetId] = d;
  }
  state.realTransactionsByAsset = realTxByAsset;
  const l = getLedger();
  // 真实持仓演练：clearImportedFacts 保留 rules/assets/scope；reactive 对象需深拷贝为 plain 再写 IndexedDB。
  const realAssets: AssetMetadata[] = JSON.parse(JSON.stringify(os.state.assets));
  const realUserRulesRaw = os.state.strategyRuleVersions.at(-1)?.rules;
  const realUserRules = realUserRulesRaw ? (JSON.parse(JSON.stringify(realUserRulesRaw)) as StrategyRule[]) : undefined;
  await l.clearImportedFacts(false);
  const holdings: Record<string, SimHolding> = {};
  const holdingIndex: Record<string, IndexId> = {};
  const holdingNames: Record<string, string | undefined> = {};
  for (const h of os.state.portfolio!.holdings) {
    const meta = realAssets.find((a) => a.assetId === h.assetId);
    const ix = resolveIndexFromMeta(meta);
    const nav0 = navOfAssetByIndex(ix, 0);
    const shares = h.shares ?? (nav0 > 0 ? h.marketValue / nav0 : 0);
    const costValue = h.costValue ?? (h.marketValue - (h.pnl ?? 0));
    holdings[h.assetId] = { shares, costValue: costValue > 0 ? costValue : h.marketValue };
    holdingIndex[h.assetId] = ix;
    holdingNames[h.assetId] = h.name ?? meta?.name;
  }
  state.holdings = holdings;
  state.holdingIndex = holdingIndex;
  state.holdingNames = holdingNames;
  state.regularInvestAssetId = pickRegularInvestAsset();
  const assetIds = Object.keys(holdings);
  const scope: InvestmentScope = {
    scopeId: SCOPE_ID, scopeType: "DECLARED_PORTFOLIO", includedAssetIds: assetIds, baseCurrency: "CNY",
    denominatorSource: "account_total_asset", denominatorAsOf: dateOf(0),
    denominatorCoverage: simulationCoverage({ dataset: "account", knownRanges: [{ start: "2024-01-01", end: dateOf(0) }], completeness: "complete" }),
    effectiveFrom: "2024-01-01", version: 1,
  };
  await l.putInvestmentScope(scope);
  const ruleVersion: StrategyRuleVersion = {
    id: RULE_VERSION_ID, scopeId: SCOPE_ID, version: 1, createdAt: "2024-01-01T00:00:00.000Z", effectiveFrom: "2024-01-01",
    rules: realUserRules?.length ? realUserRules : buildSimRules(assetIds),
    changeReason: "真实持仓演练初始规则",
  };
  await l.putStrategyRuleVersion(ruleVersion, false);
  state.round = 0; state.asOf = dateOf(0); state.phase = phaseOf(0);
  state.toggles = defaultToggles(); state.behaviorLog = [];
  state.assetHistory = [];
  recordAssetHistory();
  await writeFactsToLedger(0, state.holdings, realAssets);
  const initialTrailingStates: StoredTrailingStopState[] = [];
  for (const aid of assetIds) {
    const initial = simulationTrailingStop({
      id: `tss:${SCOPE_ID}:${aid}`, scopeId: SCOPE_ID, assetId: aid, ruleVersionId: RULE_VERSION_ID,
      previousHighWaterMark: 1.0, currentHighWaterMark: 1.0, stopLine: 0.9, navBasis: "nav_adjusted", asOf: dateOf(0), triggered: false,
    });
    initialTrailingStates.push(initial);
    await l.putTrailingStopState(initial);
  }
  // 栈底压入第 0 期初始快照：回退到第 0 期时仍可恢复初始持仓与止损状态。
  rewindStack = [{
    round: 0,
    holdings: JSON.parse(JSON.stringify(state.holdings)),
    behaviorLog: [],
    assetHistory: [...state.assetHistory],
    transactions: [],
    decisions: [],
    links: [],
    trailingStates: initialTrailingStates,
  }];
  state.canRewind = false;
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
    const navByIndex = navByIndexId(period);
    const prevNavByIndex = navByIndexId(period - 1);
    const recentNavsByIndex = buildRecentNavsByIndex(period);
    const behaviorHoldings = toBehaviorHoldings(period - 1);
    const costNavByAsset = buildCostNavByAsset();
    const out = generateActions({
      period,
      scopeId: SCOPE_ID,
      navByIndex,
      prevNavByIndex,
      recentNavsByIndex,
      holdings: behaviorHoldings,
      costNavByAsset,
      toggles: state.toggles,
      regularInvestAssetId: state.regularInvestAssetId,
    });
    for (const tx of out.transactions) applyTx(tx, period);
    for (const d of out.decisions) await l.putDecisionRecord(d);
    for (const lk of out.links) await l.putExecutionLink(lk, false);
    if (out.transactions.length) await l.putTransactions(out.transactions);
    const assetIds = Object.keys(state.holdings);
    const trailingRules = buildSimRules(assetIds).filter((r): r is TrailingStopRule => r.kind === "trailing_stop");
    const roundTrailingStates: StoredTrailingStopState[] = [];
    for (const aid of assetIds) {
      const states = (await l.getTrailingStopStates(SCOPE_ID)).filter((s) => s.assetId === aid);
      const prev = states[states.length - 1];
      const rule = trailingRules.find((r) => r.assetId === aid);
      if (!rule) continue;
      const res = advanceTrailingStop({
        scopeId: SCOPE_ID, assetId: aid, rule, ruleVersionId: RULE_VERSION_ID,
        previousState: prev, currentNav: navOfAsset(aid, period), navAsOf: dateOf(period),
        navFresh: true, coverage: { ...stubCoverage, judgmentId: `trailing_stop:${aid}` }, asOf: dateOf(period),
      });
      await l.putTrailingStopState(res.nextState);
      roundTrailingStates.push(res.nextState);
    }
    state.round = period;
    state.asOf = dateOf(period);
    state.phase = phaseOf(period);
    recordAssetHistory();
    const realAssets: AssetMetadata[] = JSON.parse(JSON.stringify(os.state.assets));
    await writeFactsToLedger(period, state.holdings, realAssets);
    state.behaviorLog = out.logs;
    // 压入本期完整快照，供回退时恢复内存态与重放 Ledger 增量。
    rewindStack.push({
      round: period,
      holdings: JSON.parse(JSON.stringify(state.holdings)),
      behaviorLog: [...out.logs],
      assetHistory: [...state.assetHistory],
      transactions: out.transactions,
      decisions: out.decisions,
      links: out.links,
      trailingStates: roundTrailingStates,
    });
    // 续演场景栈内无第 0 期基线（首次推进后栈长为 1），同样不可回退。
    state.canRewind = rewindStack.length > 1;
    await os.loadFromLedger();
    await review.loadReviewFromLedger(dateOf(period));
  } finally {
    state.running = false;
  }
}

/**
 * 回退上一轮：恢复上一期完整状态（持仓/行为日志/资产轨迹），并重放 Ledger 至该期——
 * account/portfolio/coverage 逐期重写，决策/止损状态先按 scope 清场再重放
 * （高水位防回退保护不允许降级写入）；行为开关不回退，便于换行为重跑同一期。
 */
async function rewind(): Promise<void> {
  if (state.running || rewindStack.length <= 1) return;
  const popped = rewindStack.pop()!;
  const target = rewindStack[rewindStack.length - 1];
  state.running = true;
  try {
    const l = getLedger();
    await l.clearImportedFacts(false);
    await l.deleteDecisionRecordsByScope(SCOPE_ID);
    await l.deleteExecutionLinks(popped.links.map((lk) => lk.id));
    await l.deleteTrailingStopStatesByScope(SCOPE_ID);
    const realAssets: AssetMetadata[] = JSON.parse(JSON.stringify(os.state.assets));
    for (const snap of rewindStack) {
      if (snap.transactions.length) await l.putTransactions(snap.transactions);
      for (const d of snap.decisions) await l.putDecisionRecord(d);
      for (const lk of snap.links) await l.putExecutionLink(lk, false);
      for (const ts of snap.trailingStates) await l.putTrailingStopState(ts);
      await writeFactsToLedger(snap.round, snap.holdings, realAssets);
    }
    state.round = target.round;
    state.asOf = dateOf(target.round);
    state.phase = phaseOf(target.round);
    state.holdings = JSON.parse(JSON.stringify(target.holdings));
    state.behaviorLog = [...target.behaviorLog];
    state.assetHistory = [...target.assetHistory];
    state.canRewind = rewindStack.length > 1;
    await os.loadFromLedger();
    await review.loadReviewFromLedger(state.asOf);
  } finally {
    state.running = false;
  }
}

async function reset(): Promise<void> {
  await init(true, { useRealHoldings: true });
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
    rewind,
    reset,
    toggleBehavior,
  };
}
