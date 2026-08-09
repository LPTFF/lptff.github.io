import type { InvestmentDataset } from "../domain";
import { dedupDailyPnl, dedupTransactions } from "./dedup";
import { InvestmentLedger } from "../ledger/repository";

export type ExtensionSyncPhase =
  | "checking"
  | "reading"
  | "importing"
  | "acknowledging"
  | "completed"
  | "up-to-date"
  | "failed";

export interface CollectionProgress {
  running: boolean;
  stage: "idle" | "hold" | "single" | "transactions" | "downloading" | "completed" | "error";
  fundTotal: number;
  completedFunds: number;
  transactionSnapshots: number;
  activeFunds: string[];
  warnings: string[];
}

export interface InvestmentTransferReceipt {
  protocol: string;
  capturedAt: string;
  acknowledgedAt?: string;
  status: "pending" | "imported" | "discarded";
}

export interface InvestmentExtensionStatus {
  pending: boolean;
  receipt: InvestmentTransferReceipt | null;
  collection: CollectionProgress;
}

export interface ExtensionSyncProgress {
  phase: ExtensionSyncPhase;
  message: string;
}

export interface ExtensionSyncResult {
  outcome: "imported" | "up-to-date" | "not-collected" | "collecting";
  capturedAt?: string;
  addedTransactions: number;
  duplicateTransactions: number;
  addedDailyPnl: number;
  duplicateDailyPnl: number;
  warnings: string[];
  failures: string[];
  status: InvestmentExtensionStatus;
}

interface StagingResponse {
  ok: boolean;
  staging?: { protocol: string; capturedAt: string; status: string; dataset: InvestmentDataset } | null;
  status?: InvestmentExtensionStatus;
  error?: string;
}

function requestId(): string {
  return `investment-staging:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function requestBridge<T>(type: string, responseType: string, timeoutDuration = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = requestId();
    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      reject(new Error("Investment 插件未响应。请确认扩展已重新加载，并刷新当前 Investment OS 页面"));
    }, timeoutDuration);
    function onMessage(event: MessageEvent) {
      if (
        event.source !== window ||
        event.origin !== location.origin ||
        event.data?.source !== "lptff-investment-assistant" ||
        event.data?.type !== responseType ||
        event.data?.requestId !== id
      ) return;
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      resolve(event.data.response as T);
    }
    window.addEventListener("message", onMessage);
    window.postMessage({ type, requestId: id }, location.origin);
  });
}

export async function readInvestmentStaging(): Promise<StagingResponse["staging"]> {
  const response = await requestBridge<StagingResponse>("LPTFF_INVESTMENT_GET_STAGING", "LPTFF_INVESTMENT_STAGING");
  if (!response.ok) throw new Error(response.error || "Investment 插件未响应，请在 chrome://extensions 刷新插件后重试");
  return response.staging || null;
}

export async function readInvestmentExtensionStatus(): Promise<InvestmentExtensionStatus> {
  const response = await requestBridge<StagingResponse>("LPTFF_INVESTMENT_GET_STATUS", "LPTFF_INVESTMENT_STATUS");
  if (!response.ok || !response.status) throw new Error(response.error || "无法读取 Investment 插件状态");
  return response.status;
}

async function acknowledgeInvestmentStaging(): Promise<void> {
  const response = await requestBridge<StagingResponse>("LPTFF_INVESTMENT_ACK_STAGING", "LPTFF_INVESTMENT_STAGING_ACKNOWLEDGED");
  if (!response.ok) throw new Error(response.error || "Investment 插件确认失败，请在 chrome://extensions 刷新插件后重试");
}

export async function discardInvestmentStaging(): Promise<void> {
  const response = await requestBridge<StagingResponse>("LPTFF_INVESTMENT_DISCARD_STAGING", "LPTFF_INVESTMENT_STAGING_DISCARDED");
  if (!response.ok) throw new Error(response.error || "插件待导入数据未确认清除");
}

export async function startInvestmentCollection(): Promise<void> {
  const response = await requestBridge<{ ok: boolean; error?: string }>(
    "LPTFF_INVESTMENT_START_COLLECTION",
    "LPTFF_INVESTMENT_COLLECTION_STARTED",
    30 * 60 * 1000,
  );
  if (!response.ok) throw new Error(response.error || "Investment 插件采集失败");
}

export function listenInvestmentCollectionProgress(listener: (progress: CollectionProgress) => void): () => void {
  function onMessage(event: MessageEvent) {
    if (
      event.source === window &&
      event.origin === location.origin &&
      event.data?.source === "lptff-investment-assistant" &&
      event.data?.type === "LPTFF_INVESTMENT_COLLECTION_PROGRESS"
    ) listener(event.data.progress as CollectionProgress);
  }
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}

const EMPTY_COUNTS = {
  addedTransactions: 0,
  duplicateTransactions: 0,
  addedDailyPnl: 0,
  duplicateDailyPnl: 0,
};

export async function importInvestmentStaging(
  ledger: InvestmentLedger,
  onProgress?: (progress: ExtensionSyncProgress) => void,
): Promise<ExtensionSyncResult> {
  onProgress?.({ phase: "checking", message: "正在检查插件采集和待导入状态…" });
  let extensionStatus = await readInvestmentExtensionStatus();
  if (extensionStatus.collection.running) {
    return {
      outcome: "collecting",
      ...EMPTY_COUNTS,
      warnings: [],
      failures: [],
      status: extensionStatus,
    };
  }

  onProgress?.({ phase: "reading", message: "正在读取插件待导入数据…" });
  const staging = await readInvestmentStaging();
  if (!staging?.dataset) {
    const imports = await ledger.getImports();
    const latestImport = [...imports].filter((item) => !item.source.startsWith("mock")).sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0];
    const imported = extensionStatus.receipt?.status === "imported" || Boolean(latestImport);
    onProgress?.({
      phase: imported ? "up-to-date" : "completed",
      message: imported
        ? "没有待导入批次；最近一批已写入本地 Ledger，插件暂存已清除。"
        : "插件尚未生成待导入数据，请先开始采集。",
    });
    return {
      outcome: imported ? "up-to-date" : "not-collected",
      capturedAt: extensionStatus.receipt?.capturedAt || latestImport?.capturedAt,
      ...EMPTY_COUNTS,
      warnings: [],
      failures: [],
      status: extensionStatus,
    };
  }

  const dataset = staging.dataset;
  if (dataset.version !== "2.0") throw new Error(`不支持的 Investment Protocol：${dataset.version}`);

  onProgress?.({ phase: "importing", message: "正在写入账户、持仓、交易和覆盖范围…" });
  await ledger.removeMockData();
  if (dataset.account) await ledger.putAccount(dataset.account);
  if (dataset.portfolio) await ledger.putPortfolio(dataset.portfolio);
  if (dataset.assets.length) await ledger.putAssets(dataset.assets);

  const existingTransactions = await ledger.getAllTransactions();
  const transactionResult = dedupTransactions(existingTransactions, dataset.transactions);
  if (transactionResult.added.length) await ledger.putTransactions(transactionResult.added);

  const existingDailyPnl = await ledger.getAllDailyPnl();
  const dailyResult = dedupDailyPnl(existingDailyPnl, dataset.dailyPnl);
  if (dailyResult.added.length) await ledger.putDailyPnl(dailyResult.added);

  const existingCoverage = await ledger.getCoverage();
  const incomingDatasets = new Set(dataset.coverage.map((item) => item.dataset));
  const retainedCoverage = existingCoverage.filter((item) => !incomingDatasets.has(item.dataset));
  await ledger.putCoverage([...retainedCoverage, ...dataset.coverage]);
  await ledger.addImport({
    id: `import:extension:${dataset.capturedAt}:${Date.now()}`,
    capturedAt: dataset.capturedAt,
    source: dataset.source,
    addedTransactions: transactionResult.added.length,
    duplicateTransactions: transactionResult.duplicates,
    addedDailyPnl: dailyResult.added.length,
    duplicateDailyPnl: dailyResult.duplicates,
    failures: [],
    warnings: dataset.warnings,
    status: "ok",
  });

  onProgress?.({ phase: "acknowledging", message: "数据已写入 Ledger，正在确认清除插件一次性暂存…" });
  const failures: string[] = [];
  try {
    await acknowledgeInvestmentStaging();
  } catch (error) {
    failures.push(error instanceof Error ? `插件 staging 尚未确认清除：${error.message}` : "插件 staging 尚未确认清除");
  }
  try {
    extensionStatus = await readInvestmentExtensionStatus();
  } catch {
    // 导入已完成；状态查询失败不回滚 Ledger。
  }

  onProgress?.({
    phase: "completed",
    message: failures.length
      ? "数据已写入 Ledger，但插件暂存尚未确认清除。"
      : "数据已写入本地 Ledger，插件一次性暂存已清除。",
  });
  return {
    outcome: "imported",
    capturedAt: dataset.capturedAt,
    addedTransactions: transactionResult.added.length,
    duplicateTransactions: transactionResult.duplicates,
    addedDailyPnl: dailyResult.added.length,
    duplicateDailyPnl: dailyResult.duplicates,
    warnings: [...dataset.warnings],
    failures,
    status: extensionStatus,
  };
}
