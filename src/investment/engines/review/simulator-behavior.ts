/**
 * A 股基金牛熊周期模拟器：用户非理性行为模型（纯函数）。
 *
 * 四种行为可组合开关：追涨杀跌 / 重仓猛干 / 浮盈加仓 / 规律定投（对照组）。
 * 每种行为按当期净值与历史走势生成本期交易；交易只写 Ledger 供复盘判定，不自动下单。
 * 全部人工虚构，不涉及真实账户。
 */
import type { DecisionRecord, ExecutionLink, HoldingSnapshot, Transaction } from "../../domain";
import { MARKET_ASSET_IDS, MARKET_ASSETS, type MarketAssetId, navOf, dateOf } from "../../__fixtures__/review/market";
import { makeTransaction } from "../../__fixtures__/review/builders";
import { makeDecisionRecord, makeExecutionLink } from "../../__fixtures__/review/builders";

export interface BehaviorToggles {
  chaseTrend: boolean;
  heavyPosition: boolean;
  profitAdd: boolean;
  regularInvest: boolean;
}

export interface BehaviorInput {
  period: number;
  scopeId: string;
  /** 当期各标的 NAV。 */
  navRow: Record<MarketAssetId, number>;
  /** 上期各标的 NAV（用于算本期涨幅，找领涨标的）。无上期（period 0）时省略。 */
  prevNavRow?: Record<MarketAssetId, number>;
  /** 每标的最近 4 期 NAV 升序 [n-3, n-2, n-1, n]，用于追涨杀跌判断连涨/连跌。 */
  recentNavs: Partial<Record<MarketAssetId, number[]>>;
  /** 当前持仓（含 shares / costValue）。 */
  holdings: HoldingSnapshot[];
  /** 每标的持仓成本 NAV，用于浮盈判断。 */
  costNav: Partial<Record<MarketAssetId, number>>;
  toggles: BehaviorToggles;
}

export interface BehaviorLogEntry {
  behavior: string;
  text: string;
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

function fundName(aid: MarketAssetId): string {
  return MARKET_ASSETS.find((a) => a.assetId === aid)?.name ?? aid;
}

let txSeq = 0;
function makeTx(assetId: MarketAssetId, type: "BUY" | "SELL", amount: number, period: number, sid?: string): Transaction {
  const occurredAt = dateOf(period);
  const base = makeTransaction({ occurredAt, assetId, type, amount, sourceTransactionId: sid ?? `sim-${period}-${assetId}-${type}-${txSeq + 1}`, status: "confirmed" });
  txSeq++;
  return { ...base, id: `sim-tx:${period}:${txSeq}:${assetId}:${type}:${amount}` };
}

/** 重置内部交易序号（测试用）。 */
export function resetBehaviorSeq(): void {
  txSeq = 0;
}

/**
 * 生成本期交易。行为可组合，默认全开。
 * - 追涨杀跌：近 3 期连涨→加仓；连跌→赎回 30%。
 * - 重仓猛干：本期涨幅领先且>3%→大额买入 8000。
 * - 浮盈加仓：浮盈 5%+→追加 2000。
 * - 规律定投：F001 沪深300 每期 1000，带 DecisionRecord+ExecutionLink（计划内）。
 */
export function generateActions(input: BehaviorInput): BehaviorOutput {
  const { period, scopeId, navRow, holdings, costNav, toggles } = input;
  const transactions: Transaction[] = [];
  const decisions: DecisionRecord[] = [];
  const links: ExecutionLink[] = [];
  const logs: BehaviorLogEntry[] = [];
  const inScope = (aid: string): aid is MarketAssetId => MARKET_ASSET_IDS.includes(aid as MarketAssetId);

  // 追涨杀跌
  if (toggles.chaseTrend && period >= 3) {
    for (const aid of MARKET_ASSET_IDS) {
      const navs = input.recentNavs[aid];
      if (!navs || navs.length < 4) continue;
      const up3 = navs[1] < navs[2] && navs[2] < navs[3];
      const down3 = navs[1] > navs[2] && navs[2] > navs[3];
      if (up3) {
        const amt = 3000;
        transactions.push(makeTx(aid, "BUY", amt, period));
        logs.push({ behavior: "追涨杀跌", text: `连涨 3 期加仓 ${fundName(aid)} ${amt} 元` });
      } else if (down3) {
        const h = holdings.find((x) => x.assetId === aid);
        if (h && h.shares && h.shares > 0) {
          const sellAmt = Math.round(h.shares * 0.3 * navRow[aid]);
          if (sellAmt > 0) {
            transactions.push(makeTx(aid, "SELL", sellAmt, period));
            logs.push({ behavior: "追涨杀跌", text: `连跌 3 期赎回 ${fundName(aid)} 30%（约 ${sellAmt} 元）` });
          }
        }
      }
    }
  }

  // 重仓猛干
  if (toggles.heavyPosition && input.prevNavRow) {
    let leader: MarketAssetId | undefined;
    let maxGain = -Infinity;
    for (const aid of MARKET_ASSET_IDS) {
      const prev = input.prevNavRow[aid];
      if (prev === undefined || prev === 0) continue;
      const g = (navRow[aid] - prev) / prev;
      if (g > maxGain) {
        maxGain = g;
        leader = aid;
      }
    }
    if (leader && maxGain > 0.03) {
      const amt = 8000;
      transactions.push(makeTx(leader, "BUY", amt, period));
      logs.push({ behavior: "重仓猛干", text: `追领涨的 ${fundName(leader)} 重仓买入 ${amt} 元` });
    }
  }

  // 浮盈加仓
  if (toggles.profitAdd) {
    for (const h of holdings) {
      if (!inScope(h.assetId)) continue;
      const cn = costNav[h.assetId as MarketAssetId];
      if (cn && navRow[h.assetId as MarketAssetId] > cn * 1.05) {
        const amt = 2000;
        transactions.push(makeTx(h.assetId as MarketAssetId, "BUY", amt, period));
        logs.push({ behavior: "浮盈加仓", text: `${fundName(h.assetId as MarketAssetId)} 浮盈加仓 ${amt} 元` });
      }
    }
  }

  // 规律定投（对照组）
  if (toggles.regularInvest && period >= 1) {
    const amt = 1000;
    const tx = makeTx("F001", "BUY", amt, period, `sim-dingtou-${period}`);
    transactions.push(tx);
    const dec = makeDecisionRecord({
      id: `dec:sim:dingtou:${period}`,
      scopeId,
      direction: "BUY",
      assetId: "F001",
      plannedAmount: amt,
      allowedWindow: { start: dateOf(period), end: dateOf(period) },
      decidedAt: dateOf(period),
      rationale: "月度定投沪深300",
    });
    decisions.push(dec);
    links.push(makeExecutionLink({ transactionId: tx.id, decisionRecordId: dec.id, linkMethod: "declared", confidence: "high" }));
    logs.push({ behavior: "规律定投", text: `按计划定投 ${fundName("F001")} ${amt} 元` });
  }

  void navOf;
  return { transactions, decisions, links, logs };
}