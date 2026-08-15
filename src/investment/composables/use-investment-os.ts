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
  InvestmentDataset,
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
  discardInvestmentStaging,
  importInvestmentStaging,
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
  diffActions,
  evaluatePolicies,
  nextVersionNumber,
  supersede,
} from "../engines/policy";
import { buildBehaviorActions } from "../engines/behavior";
import { assertDecisionImmutable } from "../engines/review/operation-compliance";
import { calculateReductionQuantity } from "../engines/review/reduction";
import { getReviewScenario } from "../__fixtures__/review";

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
  /** 演示模式：用人工 fixture 灌满 Ledger 供页面审查；真实采集时关闭。 */
  demoMode: boolean;
  demoScenario?: string;
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
  demoMode: false,
});

let ledger: InvestmentLedger | null = null;

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
  // 演示模式下保留 mock 事实供页面审查；真实采集流程会先退出演示模式再清理。
  if (!state.demoMode) await l.removeMockData();
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
    return state.extensionStatus;
  } catch {
    // 页面仍可读取已有 Ledger；用户显式操作时再展示桥接错误。
    return undefined;
  }
}

async function syncFromExtension(): Promise<ExtensionSyncResult | undefined> {
  if (state.syncing || state.collecting) return undefined;
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
  }
}

async function startCollection(): Promise<boolean> {
  if (state.syncing || state.collecting) return false;
  if (!state.extensionStatus) await refreshExtensionStatus();
  if (state.extensionStatus?.pending) {
    state.syncPhase = "completed";
    state.syncMessage = "插件中已有一批数据等待导入，请先读取或在数据页清除后重新录入";
    return false;
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
    return true;
  } catch (e) {
    state.collecting = false;
    state.syncPhase = "failed";
    state.syncMessage = "插件采集失败";
    state.error = (e as Error).message;
    return false;
  }
}

async function clearImportedFacts(): Promise<void> {
  state.error = undefined;
  state.demoMode = false;
  state.demoScenario = undefined;
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
  state.demoMode = false;
  state.demoScenario = undefined;
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

/** 保存一条策略规则版本（仓位区间/移动止损/减仓目标），用于规则页编辑后写回 Ledger。 */
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
    throw new Error("当前仓位分母不可用，不能计算减仓计划量");
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
 * 加载人工演示数据到 Ledger，供页面审查。以 review-demo-combined 为唯一 demo 源：
 * 先把投资范围 + 仓位/止损/减仓规则（规则页独立管理）+ 事实 + 决策/计划/关联 + 止损历史状态 +
 * 配比规则一起灌入，使规则页打开就有规则，复盘页消费这些规则与事实，业务顺序自洽。
 * 真实采集前应先 clearEverything 退出演示模式。
 */
async function loadDemoData(scenario: string = "review-demo-combined"): Promise<void> {
  const l = getLedger();
  state.demoMode = true;
  state.demoScenario = scenario;
  await l.clearImportedFacts();
  const sc = getReviewScenario(scenario);
  await l.putInvestmentScope(sc.scope);
  for (const v of sc.rules) await l.putStrategyRuleVersion(v);
  // 委托 SyncService 写入事实（去重 / coverage 合并 / 审计），与插件导入同路径，统一行为。
  const demoDataset: InvestmentDataset = {
    version: "2.0",
    source: "mock",
    capturedAt: sc.facts.account?.capturedAt ?? today(),
    account: sc.facts.account,
    portfolio: sc.facts.portfolio,
    assets: sc.facts.assets,
    transactions: sc.facts.transactions,
    dailyPnl: sc.facts.dailyPnl,
    coverage: sc.facts.coverage,
    warnings: [],
  };
  await new SyncService(new DatasetSourceAdapter(demoDataset), l).run();
  for (const d of sc.decisions ?? []) await l.putDecisionRecord(d);
  for (const p of sc.plans ?? []) await l.putOperationPlan(p);
  for (const p of sc.reductionPlans ?? []) await l.putReductionPlan(p);
  for (const lk of sc.executionLinks ?? []) await l.putExecutionLink(lk);
  for (const t of sc.previousTrailingStops ?? []) await l.putTrailingStopState(t);
  // 配比规则（PolicyRule 体系，规则页"配比规则"区 + 控制台 POLICY_TRIGGER 用）。
  const { policy, version } = createInitialPolicy({
    id: "policy:demo-us-tech",
    name: "美股科技配置",
    objective: "控制纳斯达克100 暴露并按计划定投",
    effectiveFrom: "2026-01-01",
    rules: [
      { kind: "target_allocation", dimension: "index", value: "NASDAQ100", targetPct: 0.3, minPct: 0, maxPct: 0.4 },
      { kind: "regular_investment", description: "F001 月度定投 600", cadence: "monthly", amount: 600 },
      { kind: "pause", dimension: "index", value: "NASDAQ100", maxPct: 0.6 },
    ],
    changeReason: "演示用初始规则",
  });
  await l.putPolicy(policy);
  await l.putPolicyVersion(version);
  await loadFromLedger();
  await evaluateAndPersistActions();
  state.syncPhase = "up-to-date";
  state.syncMessage = `已加载演示数据（${scenario}），仅供页面审查；真实采集前请清除`;
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
    loadDemoData,
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
