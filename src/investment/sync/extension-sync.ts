import type { DataCoverage, InvestmentDataset, InvestmentScope } from "../domain";
import { migrateLegacyFundData } from "../adapter/legacy-migration";
import { DatasetSourceAdapter } from "../adapter/InvestmentSourceAdapter";
import {
  EASTMONEY_SOURCE_CAPTURE_PROTOCOL,
  toInvestmentDataset,
  type EastmoneySourceCapture,
} from "../adapter/EastmoneySourceCaptureAdapter";
import { InvestmentLedger } from "../ledger/repository";
import { SyncService } from "./sync-service";

export type ExtensionSyncPhase =
  | "checking"
  | "reading"
  | "importing"
  | "acknowledging"
  | "completed"
  | "up-to-date"
  | "failed";

export interface CollectionBranchProgress {
  label: string;
  status: "pending" | "running" | "completed" | "partial";
  completed: number;
  total: number;
  durationMs: number;
}

export interface CollectionProgress {
  running: boolean;
  stage: "idle" | "preparing" | "hold" | "collecting" | "processing" | "completed" | "error";
  warnings: string[];
  branches: Record<"privateDetails" | "publicFunds" | "transactions", CollectionBranchProgress>;
  metrics: {
    startedAt: string;
    elapsedMs?: number;
    totalMs: number;
    requestCount: number;
    transactionPages: number;
    stagingBytes: number;
    temporaryTabPeak: number;
  };
}

export interface InvestmentTransferSummary {
  holdingCount: number;
  transactionCount: number;
  totalMs?: number;
  temporaryTabPeak?: number;
  coverage: Array<{
    dataset: string;
    completeness: "complete" | "partial" | "unknown" | "failed";
    warningCount: number;
  }>;
}

export interface InvestmentTransferReceipt {
  protocol: string;
  capturedAt: string;
  acknowledgedAt?: string;
  status: "pending" | "imported" | "discarded";
  summary?: InvestmentTransferSummary;
}

export interface InvestmentExtensionStatus {
  extensionVersion?: string;
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

interface InvestmentStagingBatch {
  protocol: string;
  capturedAt: string;
  status: string;
  capture?: EastmoneySourceCapture;
  dataset?: InvestmentDataset | ({ version: "1.1" } & Record<string, unknown>);
}

interface StagingResponse {
  ok: boolean;
  staging?: InvestmentStagingBatch | null;
  status?: InvestmentExtensionStatus;
  error?: string;
  reason?: "login-required";
}

export class InvestmentCollectionRequestError extends Error {
  constructor(message: string, readonly reason?: StagingResponse["reason"]) {
    super(message);
    this.name = "InvestmentCollectionRequestError";
  }
}

function requestId(): string {
  return `investment-staging:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function requestBridge<T>(type: string, responseType: string, timeoutDuration = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = requestId();
    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      reject(new Error("采集插件未响应。请确认扩展已重新加载，并刷新当前基金复盘助手页面"));
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
  if (!response.ok) throw new Error(response.error || "采集插件未响应，请在 chrome://extensions 刷新插件后重试");
  return response.staging || null;
}

export async function readInvestmentExtensionStatus(): Promise<InvestmentExtensionStatus> {
  const response = await requestBridge<StagingResponse>("LPTFF_INVESTMENT_GET_STATUS", "LPTFF_INVESTMENT_STATUS");
  if (!response.ok || !response.status) throw new Error(response.error || "无法读取采集插件状态");
  return response.status;
}

async function acknowledgeInvestmentStaging(): Promise<void> {
  const response = await requestBridge<StagingResponse>("LPTFF_INVESTMENT_ACK_STAGING", "LPTFF_INVESTMENT_STAGING_ACKNOWLEDGED");
  if (!response.ok) throw new Error(response.error || "采集插件确认失败，请在 chrome://extensions 刷新插件后重试");
}

export async function discardInvestmentStaging(): Promise<void> {
  const response = await requestBridge<StagingResponse>("LPTFF_INVESTMENT_DISCARD_STAGING", "LPTFF_INVESTMENT_STAGING_DISCARDED");
  if (!response.ok) throw new Error(response.error || "插件待导入数据未确认清除");
}

export async function startInvestmentCollection(): Promise<void> {
  const response = await requestBridge<StagingResponse>(
    "LPTFF_INVESTMENT_START_COLLECTION",
    "LPTFF_INVESTMENT_COLLECTION_STARTED",
    30 * 60 * 1000,
  );
  if (!response.ok) {
    throw new InvestmentCollectionRequestError(response.error || "采集插件采集失败", response.reason);
  }
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

export interface RealAccountScopeInput {
  includedAssetIds: string[];
  capturedAt: string;
  hasAccount: boolean;
  accountCoverage?: DataCoverage;
}

/** 合并真实账户范围时保留首次管理与计划核对边界，避免最近同步时间覆盖历史。 */
export function buildRealAccountScope(
  existingScope: InvestmentScope | undefined,
  input: RealAccountScopeInput,
): InvestmentScope {
  const capturedDate = input.capturedAt.slice(0, 10);
  return {
    ...existingScope,
    scopeId: "scope:real-account",
    scopeType: "ACCOUNT",
    includedAssetIds: [...new Set(input.includedAssetIds)],
    baseCurrency: existingScope?.baseCurrency ?? "CNY",
    denominatorSource: input.hasAccount ? "account_total_asset" : "none",
    denominatorAsOf: input.hasAccount ? capturedDate : undefined,
    denominatorCoverage: input.accountCoverage,
    effectiveFrom: existingScope?.effectiveFrom ?? capturedDate,
    managementStartedAt: existingScope?.managementStartedAt ?? input.capturedAt,
    operationReviewFrom: existingScope?.operationReviewFrom,
    version: existingScope?.version ?? 1,
  };
}

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
  if (!staging?.dataset && !staging?.capture) {
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

  let normalized: InvestmentDataset;
  if (staging.capture) {
    if (staging.capture.protocol !== EASTMONEY_SOURCE_CAPTURE_PROTOCOL) {
      throw new Error(`不支持的来源采集协议：${staging.capture.protocol}`);
    }
    normalized = toInvestmentDataset(staging.capture);
  } else if (staging.dataset?.version === "2.0") {
    normalized = staging.dataset;
  } else if (staging.dataset?.version === "1.1") {
    // 旧版插件 / JSON 备份：走 legacy 迁移降级为 v2.0（含 coverage + warnings=legacy:*），再统一走 SyncService。
    normalized = migrateLegacyFundData(staging.dataset as unknown);
  } else {
    throw new Error(`不支持的 Investment Protocol：${staging.protocol}`);
  }

  onProgress?.({ phase: "importing", message: "正在写入账户、持仓、交易和覆盖范围…" });
  await ledger.removeMockData();
  await ledger.removeDemoReviewConfiguration();
  // 委托 SyncService 统一去重 / coverage 保守合并 / 审计 / health。
  const syncResult = await new SyncService(new DatasetSourceAdapter(normalized), ledger).run();
  if (staging.capture) {
    // 在确认清除插件一次性暂存前，先把完整原始采集对象写入本地事实档案。
    // 标准化失败会阻止走到这里；写档案失败同样不 ACK，避免原始信息不可逆丢失。
    await ledger.putSourceCaptureArchive({
      id: `source-capture:${normalized.capturedAt}`,
      capturedAt: normalized.capturedAt,
      protocol: staging.capture.protocol,
      source: normalized.source,
      payload: staging.capture,
    });
  }
  const includedAssetIds = normalized.portfolio?.holdings.map((holding) => holding.assetId) ?? [];
  if (includedAssetIds.length) {
    const accountCoverage = normalized.coverage.find((item) => item.dataset === "account");
    const existingScope = (await ledger.getScopes()).find(
      (scope) => scope.scopeId === "scope:real-account",
    );
    await ledger.putInvestmentScope(buildRealAccountScope(existingScope, {
      includedAssetIds,
      capturedAt: normalized.capturedAt,
      hasAccount: Boolean(normalized.account),
      accountCoverage,
    }));
  }

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
    capturedAt: syncResult.capturedAt,
    addedTransactions: syncResult.addedTransactions,
    duplicateTransactions: syncResult.duplicateTransactions,
    addedDailyPnl: syncResult.addedDailyPnl,
    duplicateDailyPnl: syncResult.duplicateDailyPnl,
    warnings: syncResult.warnings,
    failures: [...failures, ...syncResult.failures],
    status: extensionStatus,
  };
}
