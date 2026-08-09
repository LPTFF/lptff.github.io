/**
 * useInvestmentOS：Investment OS 的响应式 Core 入口。
 *
 * 模块级单例 state，由扩展 staging + Ledger 驱动；页面只读 state 并显式读取插件数据。
 * 替代旧 `loadFundData()` 一次性读取（PRD 要求响应式数据源）。
 */
import { reactive } from "vue";
import type {
  AccountSnapshot,
  Action,
  AssetMetadata,
  DailyPnL,
  DataCoverage,
  DetectedPattern,
  Policy,
  PolicyRule,
  PolicyVersion,
  PortfolioSnapshot,
  Transaction,
} from "../domain";
import { InvestmentLedger, type ImportRecord } from "../ledger/repository";
import {
  discardInvestmentStaging,
  importInvestmentStaging,
  listenInvestmentCollectionProgress,
  readInvestmentExtensionStatus,
  startInvestmentCollection,
  type CollectionProgress,
  type ExtensionSyncPhase,
  type InvestmentExtensionStatus,
} from "../sync/extension-sync";
import { deriveHealth, type SensorHealth } from "../sensor/coverage";
import {
  buildPolicyVersion,
  createInitialPolicy,
  diffActions,
  evaluatePolicies,
  nextVersionNumber,
  supersede,
} from "../engines/policy";
import { buildBehaviorActions } from "../engines/behavior";

interface InvestmentOsState {
  loaded: boolean;
  syncing: boolean;
  collecting: boolean;
  syncPhase: ExtensionSyncPhase | "idle";
  syncMessage: string;
  extensionStatus?: InvestmentExtensionStatus;
  collectionProgress?: CollectionProgress;
  lastImport?: ImportRecord;
  account?: AccountSnapshot;
  portfolio?: PortfolioSnapshot;
  transactions: Transaction[];
  dailyPnl: DailyPnL[];
  coverage: DataCoverage[];
  assets: AssetMetadata[];
  warnings: string[];
  health?: SensorHealth;
  policies: Policy[];
  activeVersions: PolicyVersion[];
  actions: Action[];
  patterns: DetectedPattern[];
  pendingActions: number;
  lastSyncStatus?: "ok" | "partial" | "failed";
  lastFailures: string[];
  error?: string;
}

const state = reactive<InvestmentOsState>({
  loaded: false,
  syncing: false,
  collecting: false,
  syncPhase: "idle",
  syncMessage: "尚未检查插件传输状态",
  transactions: [],
  dailyPnl: [],
  coverage: [],
  assets: [],
  warnings: [],
  policies: [],
  activeVersions: [],
  actions: [],
  patterns: [],
  pendingActions: 0,
  lastFailures: [],
});

let ledger: InvestmentLedger | null = null;

function getLedger(): InvestmentLedger {
  if (!ledger) ledger = new InvestmentLedger();
  return ledger;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function loadFromLedger(): Promise<void> {
  const l = getLedger();
  await l.removeMockData();
  const [account, portfolio, transactions, dailyPnl, coverage, assets, policies, activeVersions, actions, patterns, imports] = await Promise.all([
    l.getLatestAccount(),
    l.getLatestPortfolio(),
    l.getAllTransactions(),
    l.getAllDailyPnl(),
    l.getCoverage(),
    l.getAssets(),
    l.getPolicies(),
    l.getActiveVersions(today()),
    l.getActions(),
    l.getPatterns(),
    l.getImports(),
  ]);
  state.account = account;
  state.portfolio = portfolio;
  state.transactions = transactions;
  state.dailyPnl = dailyPnl;
  state.coverage = coverage;
  state.assets = assets;
  state.warnings = coverage.flatMap((c) => c.warningCodes);
  state.health = deriveHealth(coverage, state.warnings);
  state.policies = policies;
  state.activeVersions = activeVersions;
  state.actions = actions;
  state.patterns = patterns;
  state.pendingActions = actions.filter((a) => a.status === "open").length;
  state.lastImport = [...imports]
    .filter((item) => !item.source.startsWith("mock"))
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0];
  state.loaded = true;
}

async function refreshExtensionStatus(): Promise<void> {
  try {
    state.extensionStatus = await readInvestmentExtensionStatus();
    state.collectionProgress = state.extensionStatus.collection;
    state.collecting = state.extensionStatus.collection.running;
    if (state.syncPhase === "idle") {
      if (state.extensionStatus.pending) {
        state.syncMessage = "插件中有一批采集完成的数据等待导入";
      } else if (state.extensionStatus.receipt?.status === "imported" || state.lastImport) {
        state.syncPhase = "up-to-date";
        state.syncMessage = "最近一批已写入本地 Ledger，插件一次性暂存已清除";
      } else {
        state.syncMessage = "插件尚未生成待导入数据";
      }
    }
  } catch {
    // 页面仍可读取已有 Ledger；用户显式操作时再展示桥接错误。
  }
}

async function syncFromExtension(): Promise<void> {
  if (state.syncing || state.collecting) return;
  state.syncing = true;
  state.error = undefined;
  state.lastFailures = [];
  try {
    const result = await importInvestmentStaging(getLedger(), (progress) => {
      state.syncPhase = progress.phase;
      state.syncMessage = progress.message;
    });
    state.extensionStatus = result.status;
    if (result.outcome === "collecting") {
      state.collecting = true;
      state.collectionProgress = result.status.collection;
      state.syncMessage = "插件正在采集，请等待完成后导入";
      return;
    }
    if (result.outcome === "not-collected") {
      state.syncPhase = "idle";
      state.syncMessage = "插件尚未生成待导入数据，可点击“重新采集投资数据”开始";
      return;
    }
    await loadFromLedger();
    if (result.outcome === "imported") await evaluateAndPersistActions();
    state.lastSyncStatus = result.failures.length ? "partial" : "ok";
    state.lastFailures = result.failures;
  } catch (e) {
    state.error = (e as Error).message;
    state.syncPhase = "failed";
    state.syncMessage = "读取插件数据失败";
    state.lastSyncStatus = "failed";
  } finally {
    state.syncing = false;
  }
}

async function startCollection(): Promise<void> {
  if (state.syncing || state.collecting) return;
  if (!state.extensionStatus) await refreshExtensionStatus();
  if (state.extensionStatus?.pending) {
    state.syncPhase = "completed";
    state.syncMessage = "插件中已有一批数据等待导入，请先读取或在数据页清除后重新录入";
    return;
  }
  state.collecting = true;
  state.error = undefined;
  state.syncPhase = "checking";
  state.syncMessage = "正在启动插件采集…";
  try {
    await startInvestmentCollection();
    await refreshExtensionStatus();
    state.collecting = false;
    state.syncPhase = "completed";
    state.syncMessage = "采集完成，新批次正在等待导入";
  } catch (e) {
    state.collecting = false;
    state.syncPhase = "failed";
    state.syncMessage = "插件采集失败";
    state.error = (e as Error).message;
  }
}

async function clearImportedFacts(): Promise<void> {
  state.error = undefined;
  await discardInvestmentStaging();
  await getLedger().clearImportedFacts();
  resetFactState();
  await loadFromLedger();
  state.syncPhase = "idle";
  state.syncMessage = "投资事实已清除，用户规则已保留；可重新采集";
  await refreshExtensionStatus();
}

async function clearEverything(): Promise<void> {
  state.error = undefined;
  await discardInvestmentStaging();
  await getLedger().clearEverything();
  resetFactState();
  state.policies = [];
  state.activeVersions = [];
  await loadFromLedger();
  state.syncPhase = "idle";
  state.syncMessage = "Investment Ledger 已全部清空，可重新采集";
  await refreshExtensionStatus();
}

const stopCollectionProgressListener = typeof window === "undefined"
  ? () => undefined
  : listenInvestmentCollectionProgress((progress) => {
    state.collectionProgress = progress;
    state.collecting = progress.running;
    const labels: Record<CollectionProgress["stage"], string> = {
      idle: "等待采集",
      hold: "正在采集全部持仓…",
      single: `正在采集基金详情（${progress.completedFunds}/${progress.fundTotal}）…`,
      transactions: `正在采集当前和历史交易（已捕获 ${progress.transactionSnapshots} 个分页请求）…`,
      downloading: "正在整理数据并生成本地备份…",
      completed: "采集完成，新批次等待导入",
      error: "插件采集失败",
    };
    state.syncMessage = labels[progress.stage];
    if (progress.stage === "completed") state.syncPhase = "completed";
    if (progress.stage === "error") state.syncPhase = "failed";
  });
void stopCollectionProgressListener;

async function evaluateAndPersistActions(): Promise<void> {
  if (!state.portfolio) return;
  const l = getLedger();
  const activeVersions = await l.getActiveVersions(today());
  const policyActions = evaluatePolicies({
    portfolio: state.portfolio,
    assets: state.assets,
    activeVersions,
    today: today(),
  });
  const { actions: behaviorActions, patterns } = buildBehaviorActions(state.transactions, today());
  const incoming = [...policyActions, ...behaviorActions];
  const existing = await l.getActions();
  const toAdd = diffActions(existing, incoming);
  for (const a of toAdd) await l.putAction(a);
  for (const p of patterns) await l.putPattern(p);
  await loadFromLedger();
}

interface CreatePolicyInput {
  name: string;
  objective: string;
  effectiveFrom: string;
  rules: PolicyRule[];
  changeReason?: string;
}

async function createPolicy(input: CreatePolicyInput): Promise<void> {
  const l = getLedger();
  const id = `policy:${input.name}:${Date.now()}`;
  const { policy, version } = createInitialPolicy({
    id,
    name: input.name,
    objective: input.objective,
    effectiveFrom: input.effectiveFrom,
    rules: input.rules,
    changeReason: input.changeReason,
  });
  await l.putPolicy(policy);
  await l.putPolicyVersion(version);
  await loadFromLedger();
}

async function createPolicyVersion(
  policyId: string,
  input: { effectiveFrom: string; rules: PolicyRule[]; changeReason?: string },
): Promise<void> {
  const l = getLedger();
  const policy = await l.getPolicy(policyId);
  if (!policy) throw new Error(`createPolicyVersion: policy ${policyId} 不存在`);
  const versions = await l.getPolicyVersions(policyId);
  const latest = versions[versions.length - 1];
  const num = nextVersionNumber(versions);
  const newVersion = buildPolicyVersion(policyId, num, input);
  if (latest) {
    await l.putPolicyVersion(supersede(latest, newVersion.effectiveFrom));
  }
  await l.putPolicyVersion(newVersion);
  await l.putPolicy({ ...policy, currentVersionId: newVersion.id });
  await loadFromLedger();
}

async function processAction(
  actionId: string,
  resolution: "pause-new" | "adjust-policy" | "ignore",
): Promise<void> {
  const l = getLedger();
  const status: Action["status"] = resolution === "ignore" ? "ignored" : "resolved";
  await l.updateActionStatus(actionId, status, today());
  await loadFromLedger();
}

function resetFactState(): void {
  state.account = undefined;
  state.portfolio = undefined;
  state.transactions = [];
  state.dailyPnl = [];
  state.coverage = [];
  state.assets = [];
  state.warnings = [];
  state.health = undefined;
  state.lastImport = undefined;
  state.lastSyncStatus = undefined;
  state.lastFailures = [];
  state.loaded = false;
  state.actions = [];
  state.patterns = [];
  state.pendingActions = 0;
}

async function clearAll(): Promise<void> {
  await clearEverything();
}

export function useInvestmentOS() {
  return {
    state,
    syncFromExtension,
    startCollection,
    refreshExtensionStatus,
    loadFromLedger,
    clearImportedFacts,
    clearEverything,
    clearAll,
    createPolicy,
    createPolicyVersion,
    evaluateAndPersistActions,
    processAction,
    getVersions: (policyId: string) => getLedger().getPolicyVersions(policyId),
  };
}
