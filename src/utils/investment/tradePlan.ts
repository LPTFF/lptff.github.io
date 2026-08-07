// 交易前计划数据模型 + localStorage 存取（INV-PLAN-001）
// 数据存浏览器 localStorage，无后端，符合 INV-DATA-001 "不引入远程存储/账号" 边界。
import type { Ref } from "vue";

export type PlanStatus = "draft" | "pending" | "executed";
export type PlanDirection = "buy" | "sell";
export type SignalSource = "technical" | "fundamental" | "news" | "other";

export interface TradePlan {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: PlanStatus;
  symbol: string;
  direction: PlanDirection;
  targetPrice?: number;
  stopLossPrice?: number;
  positionRatio?: number;
  expectedHoldDays?: number;
  entryReason: string;
  exitCondition?: string;
  signalSource: SignalSource;
}

const STORAGE_KEY = "tradePlans";

export function loadPlans(): TradePlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr)
      ? arr.sort((a: TradePlan, b: TradePlan) => b.createdAt - a.createdAt)
      : [];
  } catch {
    return [];
  }
}

export function savePlans(plans: TradePlan[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function addPlan(input: Omit<TradePlan, "id" | "createdAt" | "updatedAt">): TradePlan {
  const now = Date.now();
  const plan: TradePlan = {
    ...input,
    id: `plan_${now}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
  };
  const plans = loadPlans();
  plans.unshift(plan);
  savePlans(plans);
  return plan;
}

export function updatePlan(id: string, patch: Partial<TradePlan>): void {
  const plans = loadPlans().map((p) =>
    p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p
  );
  savePlans(plans);
}

export function deletePlan(id: string): void {
  savePlans(loadPlans().filter((p) => p.id !== id));
}

export function exportPlans(): string {
  return JSON.stringify(loadPlans(), null, 2);
}

export function importPlans(json: string): void {
  const arr = JSON.parse(json);
  if (!Array.isArray(arr)) throw new Error("invalid json: not an array");
  savePlans(arr as TradePlan[]);
}

// mock 持仓数据：Cryptocurrency.json 缺失时演示标的下拉。
// 真实投资数据链路恢复后，可由 fetch Cryptocurrency.json 持仓替换；手动输入始终可用。
export const MOCK_HOLDINGS: { symbol: string; name: string }[] = [
  { symbol: "BTC", name: "比特币" },
  { symbol: "ETH", name: "以太坊" },
  { symbol: "AAPL", name: "苹果" },
  { symbol: "510300", name: "沪深300ETF" },
  { symbol: "600519", name: "贵州茅台" },
];

// 复用类型，便于组件 ref 标注
export type PlansRef = Ref<TradePlan[]>;