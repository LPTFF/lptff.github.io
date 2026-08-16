/**
 * A 股基金牛熊周期模拟器：用户非理性行为模型（纯函数）。
 *
 * 四种行为可组合开关：追涨杀跌 / 重仓猛干 / 浮盈加仓 / 规律定投（对照组）。
 * 行为基于 (assetId + indexId) 维度：每只持仓按其 indexId 的净值曲线判断，对 assetId 生成交易。
 * 真实持仓（017437 等，indexId 由 normalizeIndexId 从真实指数名映射）走此引擎。
 * 交易只写 Ledger 供复盘判定，不自动下单。
 */
import type { IndexId } from "../../engines/scenario/historical-cycles";
import { MARKET_INDEX_IDS, dateOf } from "../../__fixtures__/review/market";
import type { DecisionRecord, ExecutionLink, Transaction } from "../../domain";
import { makeTransaction, makeDecisionRecord, makeExecutionLink } from "../../__fixtures__/review/builders";

export interface BehaviorToggles {
  chaseTrend: boolean;
  heavyPosition: boolean;
  profitAdd: boolean;
  regularInvest: boolean;
}

/** 行为模型持仓：assetId（真实代码）+ indexId（净值曲线键）+ 持仓事实。 */
export interface SimBehaviorHolding {
  assetId: string;
  indexId: IndexId;
  shares: number;
  costValue: number;
  marketValue: number;
  name?: string;
}

export interface BehaviorInput {
  period: number;
  scopeId: string;
  /** 当期各 IndexId 的 NAV。 */
  navByIndex: Record<IndexId, number>;
  /** 上期各 IndexId 的 NAV（算本期涨幅找领涨）；period 0 省略。 */
  prevNavByIndex?: Record<IndexId, number>;
  /** 每个 IndexId 最近 4 期 NAV 升序 [n-3..n]，用于追涨杀跌连涨/连跌判断。 */
  recentNavsByIndex: Partial<Record<IndexId, number[]>>;
  /** 当前持仓（含 assetId / indexId / shares / marketValue）。 */
  holdings: SimBehaviorHolding[];
  /** 每个资产（按 assetId）的持仓成本 NAV，用于浮盈判断。 */
  costNavByAsset: Record<string, number>;
  toggles: BehaviorToggles;
  /** 规律定投标的 assetId（真实模式选 CSI300 下首只）。 */
  regularInvestAssetId?: string;
}

export interface BehaviorLogEntry {
  behavior: string;
  text: string;
  /** 该笔交易涉及的基金 assetId，用于演练发现绑定到具体基金/市场历史周期。 */
  assetId?: string;
}

export interface BehaviorOutput {
  transactions: Transaction[];
  decisions: DecisionRecord[];
  links: ExecutionLink[];
  logs: BehaviorLogEntry[];
}

const DEFAULT_TOGGLES: BehaviorToggles = {
  chaseTrend: true,
  heavyPosition: true,
  profitAdd: true,
  regularInvest: true,
};

export function defaultToggles(): BehaviorToggles {
  return { ...DEFAULT_TOGGLES };
}

let txSeq = 0;
function makeTx(assetId: string, type: "BUY" | "SELL", amount: number, period: number, sid?: string): Transaction {
  const occurredAt = dateOf(period);
  const base = makeTransaction({ occurredAt, assetId, type, amount, sourceTransactionId: sid ?? `sim-${period}-${assetId}-${type}-${txSeq + 1}`, status: "confirmed" });
  txSeq++;
  return { ...base, id: `sim-tx:${period}:${txSeq}:${assetId}:${type}:${amount}` };
}

/** 重置内部交易序号（测试用）。 */
export function resetBehaviorSeq(): void {
  txSeq = 0;
}

function nameOf(h: SimBehaviorHolding): string {
  return h.name ?? h.assetId;
}

/**
 * 生成本期交易。行为可组合，默认全开。基于 (assetId + indexId) 维度。
 * - 追涨杀跌：持仓 indexId 近 3 期连涨→加仓；连跌→赎回 30%。
 * - 重仓猛干：本期领涨 IndexId（>3%）下市值最大的持仓买入 8000。
 * - 浮盈加仓：持仓 indexId 当前 NAV > 成本 NAV*1.05 → 追加 2000。
 * - 规律定投：regularInvestAssetId 每期 1000，带 DecisionRecord+ExecutionLink（计划内）。
 */
export function generateActions(input: BehaviorInput): BehaviorOutput {
  const { period, scopeId, navByIndex, holdings, costNavByAsset, toggles, regularInvestAssetId } = input;
  const transactions: Transaction[] = [];
  const decisions: DecisionRecord[] = [];
  const links: ExecutionLink[] = [];
  const logs: BehaviorLogEntry[] = [];

  // 追涨杀跌
  if (toggles.chaseTrend && period >= 3) {
    for (const h of holdings) {
      const navs = input.recentNavsByIndex[h.indexId];
      if (!navs || navs.length < 4) continue;
      const up3 = navs[1] < navs[2] && navs[2] < navs[3];
      const down3 = navs[1] > navs[2] && navs[2] > navs[3];
      if (up3) {
        const amt = 3000;
        transactions.push(makeTx(h.assetId, "BUY", amt, period));
        logs.push({ behavior: "追涨杀跌", text: `连涨 3 期加仓 ${nameOf(h)} ${amt} 元`, assetId: h.assetId });
      } else if (down3 && h.shares > 0) {
        const nav = navByIndex[h.indexId];
        const sellAmt = Math.round(h.shares * 0.3 * nav);
        if (sellAmt > 0) {
          transactions.push(makeTx(h.assetId, "SELL", sellAmt, period));
          logs.push({ behavior: "追涨杀跌", text: `连跌 3 期赎回 ${nameOf(h)} 30%（约 ${sellAmt} 元）`, assetId: h.assetId });
        }
      }
    }
  }

  // 重仓猛干：找领涨 IndexId，对该 IndexId 下市值最大持仓买入
  if (toggles.heavyPosition && input.prevNavByIndex) {
    let leaderIndex: IndexId | undefined;
    let maxGain = -Infinity;
    for (const ix of MARKET_INDEX_IDS) {
      const prev = input.prevNavByIndex[ix];
      if (prev === undefined || prev === 0) continue;
      const g = (navByIndex[ix] - prev) / prev;
      if (g > maxGain) {
        maxGain = g;
        leaderIndex = ix;
      }
    }
    if (leaderIndex && maxGain > 0.03) {
      const target = holdings
        .filter((h) => h.indexId === leaderIndex)
        .sort((a, b) => b.marketValue - a.marketValue)[0];
      if (target) {
        const amt = 8000;
        transactions.push(makeTx(target.assetId, "BUY", amt, period));
        logs.push({ behavior: "重仓猛干", text: `追领涨的 ${nameOf(target)} 重仓买入 ${amt} 元`, assetId: target.assetId });
      }
    }
  }

  // 浮盈加仓
  if (toggles.profitAdd) {
    for (const h of holdings) {
      const cn = costNavByAsset[h.assetId];
      if (cn !== undefined && navByIndex[h.indexId] > cn * 1.05) {
        const amt = 2000;
        transactions.push(makeTx(h.assetId, "BUY", amt, period));
        logs.push({ behavior: "浮盈加仓", text: `${nameOf(h)} 浮盈加仓 ${amt} 元`, assetId: h.assetId });
      }
    }
  }

  // 规律定投（对照组）
  if (toggles.regularInvest && period >= 1 && regularInvestAssetId) {
    const target = holdings.find((h) => h.assetId === regularInvestAssetId) ?? holdings[0];
    if (target) {
      const amt = 1000;
      const tx = makeTx(target.assetId, "BUY", amt, period, `sim-dingtou-${period}`);
      transactions.push(tx);
      const dec = makeDecisionRecord({
        id: `dec:sim:dingtou:${period}`,
        scopeId,
        direction: "BUY",
        assetId: target.assetId,
        plannedAmount: amt,
        allowedWindow: { start: dateOf(period), end: dateOf(period) },
        decidedAt: dateOf(period),
        rationale: `月度定投 ${nameOf(target)}`,
      });
      decisions.push(dec);
      links.push(makeExecutionLink({ transactionId: tx.id, decisionRecordId: dec.id, linkMethod: "declared", confidence: "high" }));
      logs.push({ behavior: "规律定投", text: `按计划定投 ${nameOf(target)} ${amt} 元`, assetId: target.assetId });
    }
  }

  return { transactions, decisions, links, logs };
}