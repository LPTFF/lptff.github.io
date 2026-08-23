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
  DecisionRecord,
  DetectedPattern,
  ExecutionLink,
  InvestmentScope,
  OperationPlan,
  PlanDirection,
  PlanValueUnit,
  Policy,
  PolicyRule,
  PolicyVersion,
  PortfolioSnapshot,
  ReductionPlan,
  StrategyRule,
  StrategyRuleVersion,
  Transaction,
} from "../domain";
import { InvestmentLedger, type ImportRecord } from "../ledger/repository";
import { DatasetSourceAdapter } from "../adapter/InvestmentSourceAdapter";
import { SyncService } from "../sync/sync-service";
import {
  EASTMONEY_SOURCE_CAPTURE_PROTOCOL,
  toInvestmentDataset,
  type EastmoneySourceCapture,
} from "../adapter/EastmoneySourceCaptureAdapter";
import {
  buildRealAccountScope,
  discardInvestmentStaging,
  importInvestmentStaging,
  InvestmentCollectionRequestError,
  listenInvestmentCollectionProgress,
  readInvestmentExtensionStatus,
  startInvestmentCollection,
  type CollectionProgress,
  type ExtensionSyncPhase,
  type ExtensionSyncResult,
  type InvestmentExtensionStatus,
} from "../sync/extension-sync";
import { deriveHealth, type SensorHealth } from "../sensor/coverage";
import {
  buildPolicyVersion,
  createInitialPolicy,
  evaluatePolicies,
  nextVersionNumber,
  supersede,
} from "../engines/policy";
import { buildBehaviorActions } from "../engines/behavior";
import { assertDecisionImmutable } from "../engines/review/operation-compliance";
import { calculateReductionQuantity } from "../engines/review/reduction";

export interface InvestmentOsState {
  loaded: boolean;
  syncing: boolean;
  collecting: boolean;
  syncPhase: ExtensionSyncPhase | "idle";
  syncMessage: string;
  importContext?: {
    kind: "plugin-staging" | "bundled-snapshot" | "local-file";
    label: string;
  };
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
  activeScope?: InvestmentScope;
  strategyRuleVersions: StrategyRuleVersion[];
  decisionRecords: DecisionRecord[];
  operationPlans: OperationPlan[];
  reductionPlans: ReductionPlan[];
  executionLinks: ExecutionLink[];
  actions: Action[];
  patterns: DetectedPattern[];
  pendingActions: number;
  lastSyncStatus?: "ok" | "partial" | "failed";
  lastFailures: string[];
  error?: string;
  collectionRecovery?: "login-required";
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
  strategyRuleVersions: [],
  decisionRecords: [],
  operationPlans: [],
  reductionPlans: [],
  executionLinks: [],
  activeScope: undefined,
  actions: [],
  patterns: [],
  pendingActions: 0,
  lastFailures: [],
});

let ledger: InvestmentLedger | null = null;
let ledgerCompaction: Promise<void> | null = null;
let captureImportStartedAt = 0;
const MIN_IMPORT_FEEDBACK_MS = 1200;

function getLedger(): InvestmentLedger {
  if (!ledger) ledger = new InvestmentLedger();
  return ledger;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function nextCalendarDate(date: string): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

function recordId(prefix: string, timestamp: string): string {
  return `${prefix}:${timestamp.replace(/[^0-9]/g, "")}`;
}

export interface DecisionPlanInput {
  assetId: string;
  direction: PlanDirection;
  value: number;
  unit: PlanValueUnit;
  window: { start: string; end: string };
  rationale?: string;
  failsIf?: string;
}

export function buildStrategyRuleVersionWithRule(
  scope: InvestmentScope,
  versions: StrategyRuleVersion[],
  newRule: StrategyRule,
  effectiveFrom: string,
  changeReason?: string,
): StrategyRuleVersion {
  if (!versions.length) {
    return {
      id: `srv:${scope.scopeId}:v1`,
      scopeId: scope.scopeId,
      version: 1,
      effectiveFrom,
      rules: [newRule],
      changeReason: changeReason ?? `建立首版 ${newRule.kind} 规则`,
    };
  }
  const latest = [...versions].sort((a, b) => a.version - b.version).at(-1)!;
  const newAssetId = (newRule as { assetId?: string }).assetId;
  const kept = latest.rules.filter(
    (rule) => !(rule.kind === newRule.kind && (rule as { assetId?: string }).assetId === newAssetId),
  );
  const version = latest.version + 1;
  return {
    id: `srv:${scope.scopeId}:v${version}`,
    scopeId: scope.scopeId,
    version,
    effectiveFrom,
    rules: [...kept, newRule],
    changeReason: changeReason ?? `新增 ${newRule.kind} 规则`,
  };
}

async function loadFromLedger(): Promise<void> {
  const l = getLedger();
  // 清理旧版本可能遗留的演示事实，再压缩真实采集历史；每次会话只做一次。
  await l.removeMockData();
  if (!ledgerCompaction) ledgerCompaction = l.compactCollectionHistory();
  await ledgerCompaction;
  const [account, portfolio, transactions, dailyPnl, coverage, assets, policies, activeVersions, actions, patterns, imports, scopes] = await Promise.all([
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
    l.getScopes(),
  ]);
  const activeScope = scopes
    .filter((s) => s.effectiveFrom <= today() && (!s.effectiveTo || s.effectiveTo >= today()))
    .sort((a, b) => a.version - b.version)
    .at(-1);
  const [strategyRuleVersions, decisionRecords, operationPlans, reductionPlans, executionLinks] = activeScope
    ? await Promise.all([
        l.getStrategyRuleVersions(activeScope.scopeId),
        l.getDecisionRecords(activeScope.scopeId),
        l.getOperationPlans(activeScope.scopeId),
        l.getReductionPlans(activeScope.scopeId),
        l.getExecutionLinks(),
      ])
    : [[], [], [], [], []];
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
  state.activeScope = activeScope;
  state.strategyRuleVersions = strategyRuleVersions;
  state.decisionRecords = decisionRecords;
  state.operationPlans = operationPlans;
  state.reductionPlans = reductionPlans;
  state.executionLinks = executionLinks;
  state.actions = actions;
  state.patterns = patterns;
  state.pendingActions = actions.filter((a) => a.status === "open").length;
  state.lastImport = [...imports]
    .filter((item) => !item.source.startsWith("mock"))
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0];
  state.loaded = true;
}

async function refreshExtensionStatus(): Promise<InvestmentExtensionStatus | undefined> {
  try {
    state.extensionStatus = await readInvestmentExtensionStatus();
    state.collectionProgress = state.extensionStatus.collection;
    state.collecting = state.extensionStatus.collection.running;
    const latestCollectionSucceeded =
      state.extensionStatus.collection.stage === "completed"
      && !state.extensionStatus.collection.running
      && state.extensionStatus.collection.warnings.length === 0;
    if (latestCollectionSucceeded) {
      state.error = undefined;
      state.collectionRecovery = undefined;
      if (state.syncPhase === "failed") {
        state.syncPhase = state.extensionStatus.pending ? "completed" : "up-to-date";
        state.syncMessage = state.extensionStatus.pending
          ? "全面来源采集完成，新批次等待导入"
          : "最近一次采集已完成，当前没有待导入数据";
      }
    }
    if (state.syncPhase === "idle") {
      if (state.extensionStatus.pending) {
        state.syncMessage = "插件中有一批采集完成的数据等待导入";
      } else if (state.extensionStatus.receipt?.status === "imported" || state.lastImport) {
        state.syncPhase = "up-to-date";
        state.syncMessage = "最近一批已写入本地账本，插件一次性待导入数据已清除";
      } else {
        state.syncMessage = "插件尚未生成待导入数据";
      }
    }
    return state.extensionStatus;
  } catch {
    // 页面仍可读取已有 Ledger；用户显式操作时再展示桥接错误。
    return undefined;
  }
}

async function syncFromExtension(): Promise<ExtensionSyncResult | undefined> {
  if (state.syncing || state.collecting) return undefined;
  state.syncing = true;
  state.importContext = { kind: "plugin-staging", label: "插件待导入批次" };
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
      return result;
    }
    if (result.outcome === "not-collected") {
      state.syncPhase = "idle";
      state.syncMessage = "插件尚未生成待导入数据，可点击“重新采集投资数据”开始";
      return result;
    }
    await loadFromLedger();
    if (result.outcome === "imported") await evaluateAndPersistActions();
    state.lastSyncStatus = result.failures.length ? "partial" : "ok";
    state.lastFailures = result.failures;
    return result;
  } catch (e) {
    state.error = (e as Error).message;
    state.syncPhase = "failed";
    state.syncMessage = "读取插件数据失败";
    state.lastSyncStatus = "failed";
  } finally {
    state.syncing = false;
    if (state.syncPhase !== "failed") state.importContext = undefined;
  }
}

async function startCollection(): Promise<boolean> {
  if (state.syncing || state.collecting) return false;
  state.importContext = undefined;
  // 每次都刷新插件状态，确保 pending 判断基于最新暂存，而非上次采集完成时的陈旧快照。
  await refreshExtensionStatus();
  if (state.extensionStatus?.pending) {
    state.syncPhase = "completed";
    state.syncMessage = "插件中已有一批数据等待导入，请先读取待导入，或重新采集时丢弃这批数据";
    return false;
  }
  state.collecting = true;
  state.error = undefined;
  state.collectionRecovery = undefined;
  state.syncPhase = "checking";
  state.syncMessage = "正在启动插件采集…";
  try {
    await startInvestmentCollection();
    await refreshExtensionStatus();
    state.collecting = false;
    state.syncPhase = "completed";
    state.syncMessage = "采集完成，新批次正在等待导入";
    return true;
  } catch (e) {
    state.collecting = false;
    state.collectionRecovery = e instanceof InvestmentCollectionRequestError ? e.reason : undefined;
    state.syncPhase = state.collectionRecovery === "login-required" ? "idle" : "failed";
    state.syncMessage = state.collectionRecovery === "login-required"
      ? "等待天天基金登录，完成后请重新采集"
      : "插件采集失败";
    state.error = (e as Error).message;
    return false;
  }
}

/** 丢弃插件里已采集但未导入的暂存数据，用于"待导入数据阻塞重新采集"时清场后重采。 */
async function discardStaging(): Promise<void> {
  await discardInvestmentStaging();
  await refreshExtensionStatus();
  state.syncPhase = "idle";
  state.syncMessage = "已丢弃插件待导入数据，可重新采集";
}

async function clearImportedFacts(): Promise<void> {
  state.error = undefined;
  // 本地清空不触碰浏览器扩展桥接（无扩展时 discard/refresh 会 5s 超时卡顿）；扩展暂存由扩展自身管理。
  await getLedger().clearImportedFacts();
  resetFactState();
  await loadFromLedger();
  state.syncPhase = "idle";
  state.syncMessage = "投资数据已清除，规则已保留；可重新采集";
}

async function clearEverything(): Promise<void> {
  state.error = undefined;
  // 本地清空不触碰浏览器扩展桥接（无扩展时 discard/refresh 会 5s 超时卡顿）。
  await getLedger().clearEverything();
  resetFactState();
  state.policies = [];
  state.activeVersions = [];
  await loadFromLedger();
  state.syncPhase = "idle";
  state.syncMessage = "本地账本已全部清空，可重新采集或导入快照";
  // 标记用户显式清空：阻止 OSLayout 下次刷新自动加载真实快照，保持空态等用户主动选择数据源。
  try { localStorage.setItem("investment-manual-clear", "1"); } catch { /* localStorage 不可用忽略 */ }
}

const stopCollectionProgressListener = typeof window === "undefined"
  ? () => undefined
  : listenInvestmentCollectionProgress((progress) => {
    state.collectionProgress = progress;
    state.collecting = progress.running && !["completed", "error"].includes(progress.stage);
    const activeBranches = Object.values(progress.branches ?? {})
      .filter((branch) => branch.status === "running")
      .map((branch) => branch.total ? `${branch.label} ${branch.completed}/${branch.total}` : branch.label)
      .join("、");
    const labels: Record<CollectionProgress["stage"], string> = {
      idle: "等待采集",
      preparing: "正在准备高效采集环境…",
      hold: "正在读取账户与全部持仓…",
      collecting: activeBranches ? `正在并行采集：${activeBranches}` : "正在并行采集基金详情、公开档案和交易分页…",
      processing: "正在构建全面来源采集包…",
      completed: "全面来源采集完成，新批次等待导入",
      error: "插件采集失败",
    };
    state.syncMessage = labels[progress.stage] ?? "插件正在采集数据…";
    if (["preparing", "hold", "collecting", "processing"].includes(progress.stage)) {
      state.error = undefined;
      state.collectionRecovery = undefined;
      state.syncPhase = "checking";
    }
    if (progress.stage === "completed") {
      state.syncPhase = "completed";
      if (progress.warnings.length === 0) {
        state.error = undefined;
        state.collectionRecovery = undefined;
      }
    }
    if (progress.stage === "error") {
      state.syncPhase = "failed";
      state.error = progress.warnings.filter(Boolean).join("；") || "插件采集失败，请检查天天基金登录状态后重试";
    }
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
  await l.reconcileDerivedActions(incoming);
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
  state.decisionRecords = [];
  state.operationPlans = [];
  state.reductionPlans = [];
  state.executionLinks = [];
  state.patterns = [];
  state.pendingActions = 0;
}

async function clearAll(): Promise<void> {
  await clearEverything();
}

/** 保存一条策略规则版本（仓位区间/移动止损/减仓目标），用于纪律页编辑后写回 Ledger。 */
async function saveStrategyRuleVersion(version: StrategyRuleVersion): Promise<void> {
  await getLedger().putStrategyRuleVersion(version);
  await loadFromLedger();
}

/**
 * 新增一条单标的策略规则（仓位上限 / 移动止损 等），追加到当前生效的 StrategyRuleVersion。
 * 同标的同类型规则在新的完整规则版本中替换；旧版本保持只读，不原地覆盖。
 */
async function addStrategyRule(newRule: StrategyRule, changeReason?: string): Promise<void> {
  const scope = state.activeScope;
  if (!scope) throw new Error("尚无投资范围，请先导入真实账户数据");
  await saveStrategyRuleVersion(buildStrategyRuleVersionWithRule(
    scope,
    state.strategyRuleVersions,
    newRule,
    today(),
    changeReason,
  ));
}

/** 只记录本地事前计划，不触发任何真实账户操作。 */
async function recordDecisionPlan(input: DecisionPlanInput): Promise<DecisionRecord> {
  const scope = state.activeScope;
  if (!scope) throw new Error("尚无投资范围，请先导入真实账户数据");
  if (!scope.includedAssetIds.includes(input.assetId)) {
    throw new Error("所选基金不在当前投资范围内");
  }
  if (!Number.isFinite(input.value) || input.value <= 0) {
    throw new Error("计划量必须大于 0");
  }
  if (!input.window.start || !input.window.end || input.window.end < input.window.start) {
    throw new Error("请选择有效的执行窗口");
  }

  const decidedAt = new Date().toISOString();
  const reviewFrom = scope.operationReviewFrom ?? nextCalendarDate(decidedAt.slice(0, 10));
  if (input.window.start < reviewFrom) {
    throw new Error(`来源交易只有日期，首个可核对执行日为 ${reviewFrom}`);
  }
  const id = recordId("decision", decidedAt);
  const latestRuleVersion = state.strategyRuleVersions.at(-1);
  const record: DecisionRecord = {
    id,
    scopeId: scope.scopeId,
    strategyRuleVersionId: latestRuleVersion?.id,
    assetId: input.assetId,
    direction: input.direction,
    plannedAmount: input.unit === "CNY" ? input.value : undefined,
    plannedShares: input.unit === "shares" ? input.value : undefined,
    plannedPct: input.unit === "pct" ? input.value : undefined,
    allowedWindow: input.window,
    rationale: input.rationale?.trim() || undefined,
    decidedAt,
    failsIf: input.failsIf?.trim() || undefined,
    status: "recorded",
    annotations: [],
    immutable: true,
  };
  const plan: OperationPlan = {
    id: recordId("operation-plan", decidedAt),
    decisionRecordId: record.id,
    scopeId: scope.scopeId,
    plannedValue: input.value,
    unit: input.unit,
    executionWindow: input.window,
    ruleVersionRefs: latestRuleVersion ? [latestRuleVersion.id] : [],
  };
  const updatedScope: InvestmentScope = {
    ...scope,
    managementStartedAt: scope.managementStartedAt ?? decidedAt,
    operationReviewFrom: reviewFrom,
  };
  await getLedger().recordDecisionPlan(record, plan, updatedScope);
  await loadFromLedger();
  return record;
}

export interface CreateReductionPlanInput {
  assetId: string;
  triggerJudgmentId: string;
  unit: "CNY" | "shares";
}

/** 用当前合格分母和用户事前减仓目标计算并保存计划；只写本地，不提交交易。 */
async function createReductionPlan(input: CreateReductionPlanInput): Promise<ReductionPlan> {
  const scope = state.activeScope;
  const portfolio = state.portfolio;
  if (!scope || !portfolio) throw new Error("尚无可复算的投资范围与组合快照");
  if (scope.denominatorSource !== "account_total_asset" || !Number.isFinite(portfolio.totalAsset) || portfolio.totalAsset <= 0) {
    throw new Error("当前账户总额不可用，不能计算减仓计划量");
  }
  const holding = portfolio.holdings.find((item) => item.assetId === input.assetId);
  if (!holding) throw new Error("当前范围内没有这只基金的持仓");
  const version = [...state.strategyRuleVersions]
    .filter((item) => item.scopeId === scope.scopeId && item.effectiveFrom <= today() && (!item.effectiveTo || item.effectiveTo >= today()))
    .sort((a, b) => a.version - b.version)
    .at(-1);
  const rule = version?.rules.find(
    (item) => item.kind === "reduction_target" && item.assetId === input.assetId,
  );
  if (!version || !rule || rule.kind !== "reduction_target") {
    throw new Error("请先为这只基金声明减仓目标区间");
  }
  const planned = calculateReductionQuantity({
    marketValue: holding.marketValue,
    denominatorValue: portfolio.totalAsset,
    targetMaxPct: rule.targetMaxPct,
    unit: input.unit,
    nav: holding.nav,
  });
  if (planned <= 0) throw new Error("当前仓位已在减仓目标上限内，无需创建计划");
  const createdAt = state.account?.source === "sim"
    ? `${state.account.capturedAt.slice(0, 10)}T15:30:00+08:00`
    : new Date().toISOString();
  const plan: ReductionPlan = {
    id: recordId(`reduction-plan:${input.assetId}`, createdAt),
    scopeId: scope.scopeId,
    assetId: input.assetId,
    triggerJudgmentId: input.triggerJudgmentId,
    targetBand: { minPct: rule.targetMinPct, maxPct: rule.targetMaxPct },
    planned,
    unit: input.unit,
    ruleVersionRefs: [version.id],
    createdAt,
  };
  await getLedger().putReductionPlan(plan);
  await loadFromLedger();
  return plan;
}

/** 用户显式声明计划与来源交易的关系；不做相似度自动匹配。 */
async function linkDecisionToTransaction(
  transactionId: string,
  decisionRecordId: string,
): Promise<ExecutionLink> {
  const transaction = state.transactions.find((item) => item.id === transactionId);
  const decision = state.decisionRecords.find((item) => item.id === decisionRecordId);
  if (!transaction || !decision) throw new Error("未找到待关联的交易或事前计划");
  assertDecisionImmutable(decision, transaction.occurredAt);
  if (decision.status !== "recorded") throw new Error("只有尚未复核的事前计划可以关联");
  if (decision.assetId && decision.assetId !== transaction.assetId) {
    throw new Error("事前计划与交易基金不一致");
  }
  if (transaction.type !== decision.direction) {
    throw new Error("事前计划与交易方向不一致");
  }
  const existing = state.executionLinks.find(
    (link) => link.transactionId === transactionId && link.linkMethod !== "unlinked",
  );
  if (existing) throw new Error("这笔交易已经存在显式计划关联");

  const link: ExecutionLink = {
    id: `link:declared:${transactionId}:${decisionRecordId}`,
    transactionId,
    decisionRecordId,
    linkMethod: "declared",
    confidence: "high",
    note: "由用户显式选择；系统未做自动匹配",
  };
  await getLedger().putExecutionLink(link);
  await loadFromLedger();
  return link;
}

/**
 * 导入一份来源采集包（协议 eastmoney-source-capture/1.0）到 Ledger：校验协议后复用
 * toInvestmentDataset 转换，再走与插件导入完全相同的 SyncService → scope:real-account 路径。
 * 内置脱敏快照（fetch）与本地 JSON 文件导入共用此链路。
 */
async function importSourceCapture(capture: EastmoneySourceCapture, successMessage: string): Promise<boolean> {
  // 显式导入真实采集包覆盖"已清空"意图，清除标记。
  try { localStorage.removeItem("investment-manual-clear"); } catch { /* ignore */ }
  try {
    if (capture.protocol !== EASTMONEY_SOURCE_CAPTURE_PROTOCOL) {
      throw new Error(`采集包协议不匹配：${capture.protocol ?? "（缺失）"}，当前支持 ${EASTMONEY_SOURCE_CAPTURE_PROTOCOL}`);
    }
    state.syncPhase = "checking";
    state.syncMessage = "正在校验采集协议和数据完整性…";
    const normalized = toInvestmentDataset(capture);
    const l = getLedger();
    state.syncPhase = "importing";
    state.syncMessage = "正在写入账户、持仓、交易和覆盖范围…";
    await l.clearImportedFacts();
    await l.removeMockData();
    await l.removeDemoReviewConfiguration();
    // 委托 SyncService 统一去重 / coverage 保守合并 / 审计。
    const syncResult = await new SyncService(new DatasetSourceAdapter(normalized), l).run();
    const includedAssetIds = normalized.portfolio?.holdings.map((holding) => holding.assetId) ?? [];
    if (includedAssetIds.length) {
      const accountCoverage = normalized.coverage.find((item) => item.dataset === "account");
      const existingScope = (await l.getScopes()).find((scope) => scope.scopeId === "scope:real-account");
      await l.putInvestmentScope(buildRealAccountScope(existingScope, {
        includedAssetIds,
        capturedAt: normalized.capturedAt,
        hasAccount: Boolean(normalized.account),
        accountCoverage,
      }));
    }
    await loadFromLedger();
    await evaluateAndPersistActions();
    if (state.extensionStatus?.pending) {
      state.syncPhase = "acknowledging";
      state.syncMessage = "数据已写入，正在清除未采用的插件待导入批次…";
      await discardInvestmentStaging();
      await refreshExtensionStatus();
    }
    state.lastSyncStatus = syncResult.failures.length ? "partial" : "ok";
    state.lastFailures = syncResult.failures;
    state.syncPhase = "up-to-date";
    state.syncMessage = successMessage;
    return true;
  } catch (e) {
    state.error = (e as Error).message;
    state.syncPhase = "failed";
    state.syncMessage = "导入采集包失败";
    state.lastSyncStatus = "failed";
    return false;
  } finally {
    const feedbackRemaining = MIN_IMPORT_FEEDBACK_MS - (Date.now() - captureImportStartedAt);
    if (feedbackRemaining > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, feedbackRemaining));
    }
    state.syncing = false;
    if (state.syncPhase !== "failed") state.importContext = undefined;
  }
}

function beginCaptureImport(
  kind: NonNullable<InvestmentOsState["importContext"]>["kind"],
  label: string,
  message: string,
): void {
  captureImportStartedAt = Date.now();
  state.syncing = true;
  state.importContext = { kind, label };
  state.error = undefined;
  state.lastFailures = [];
  state.syncPhase = "reading";
  state.syncMessage = message;
}

function failCaptureImport(error: unknown, message: string): false {
  state.error = error instanceof Error ? error.message : String(error);
  state.syncPhase = "failed";
  state.syncMessage = message;
  state.lastSyncStatus = "failed";
  state.syncing = false;
  return false;
}

/**
 * 加载脱敏采集快照到 Ledger，供页面结构审查。数据源是天天基金扩展采集的脱敏 JSON（协议
 * eastmoney-source-capture/1.0），通过 fetch public 副本读取后走 importSourceCapture。
 * 该快照由用户显式导入，不作为当前账户默认数据。
 */
async function loadRealFixtureSnapshot(): Promise<boolean> {
  beginCaptureImport("bundled-snapshot", "内置脱敏快照", "正在读取内置脱敏快照…");
  try {
    const res = await fetch("/fixtures/investment/eastmoney-source-desensitized.json");
    if (!res.ok) throw new Error(`读取采集快照失败：HTTP ${res.status}`);
    const capture = await res.json() as EastmoneySourceCapture;
    return await importSourceCapture(capture, "已加载脱敏采集快照（天天基金采集 2026-08-20，交易 72/72 页），仅供结构审查");
  } catch (e) {
    return failCaptureImport(e, "加载真实脱敏快照失败");
  }
}

/**
 * 从本地 JSON 文件导入插件导出的采集包（popup「下载完整本地备份」或「下载脱敏快照」产物），
 * 不依赖插件运行时；换浏览器/换电脑时无需重新采集。协议与链路同内置快照。
 */
async function importCaptureFile(file: File): Promise<boolean> {
  beginCaptureImport("local-file", `本地 JSON 文件（${file.name}）`, `正在读取本地文件 ${file.name}…`);
  let capture: EastmoneySourceCapture;
  try {
    capture = JSON.parse(await file.text()) as EastmoneySourceCapture;
  } catch {
    return failCaptureImport(new Error(`文件 ${file.name} 不是合法 JSON，无法导入`), "导入采集文件失败");
  }
  const capturedAt = (capture.capturedAt ?? "").slice(0, 10) || "未知时间";
  return importSourceCapture(capture, `已导入采集包 ${file.name}（采集于 ${capturedAt}）`);
}

export function useInvestmentOS() {
  return {
    state,
    syncFromExtension,
    startCollection,
    discardStaging,
    refreshExtensionStatus,
    loadFromLedger,
    clearImportedFacts,
    clearEverything,
    clearAll,
    loadRealFixtureSnapshot,
    importCaptureFile,
    createPolicy,
    createPolicyVersion,
    evaluateAndPersistActions,
    processAction,
    saveStrategyRuleVersion,
    addStrategyRule,
    recordDecisionPlan,
    createReductionPlan,
    linkDecisionToTransaction,
    getVersions: (policyId: string) => getLedger().getPolicyVersions(policyId),
  };
}
