/**
 * Investment Ledger 仓储：对 db 提供领域化读写原语（PRD §30）。
 *
 * 存储时附加去重索引字段（transactions.dedupKey、dailyPnl.id），读回时剥除，保证
 * 调用方拿到的始终是标准 Domain 对象。
 */
import type {
  AccountSnapshot,
  Action,
  AssetMetadata,
  DataCoverage,
  DailyPnL,
  DecisionRecord,
  DetectedPattern,
  ExecutionLink,
  InvestmentScope,
  OperationPlan,
  Policy,
  PolicyVersion,
  PortfolioSnapshot,
  ReductionPlan,
  ReviewAction,
  ReviewSnapshot,
  StrategyRuleVersion,
  Transaction,
} from "../domain";
import { dailyPnlKey } from "../sync/keys";
import { transactionKey } from "../sync/keys";
import { explicitThemesFromSourceText } from "../metadata/themes";
import {
  openInvestmentDB,
  reqToPromise,
  StoreName,
  txDone,
} from "./db";

export interface ImportRecord {
  id: string;
  capturedAt: string;
  source: string;
  scenario?: string;
  addedTransactions: number;
  duplicateTransactions: number;
  addedDailyPnl: number;
  duplicateDailyPnl: number;
  failures: string[];
  warnings: string[];
  status: "ok" | "partial" | "failed";
}

export interface MockDataCleanupResult {
  cleaned: boolean;
  accounts: number;
  portfolios: number;
  transactions: number;
  dailyPnl: number;
  assets: number;
  imports: number;
  derivedRecords: number;
}

/** 持久化的移动止损状态（跨复盘保留 high-water mark / stop line，保证单调不降）。 */
export interface StoredTrailingStopState {
  id: string;
  scopeId: string;
  assetId: string;
  ruleVersionId: string;
  previousHighWaterMark?: number;
  currentHighWaterMark?: number;
  stopLine?: number;
  navBasis: "nav_adjusted" | "nav_unadjusted" | "unknown";
  asOf?: string;
  triggered: boolean;
}

const MOCK_ASSET_ID = /^F00[1-5]$/;
const MOCK_SOURCE = /^mock(?:-|$)/;
const MOCK_WARNING = /^(?:mock|empty|partial|stale|failed|complex|large):/;
const DEMO_REVIEW_SCOPE_IDS = new Set(["scope:sim", "scope:combined", "scope:demo"]);
const DEMO_POLICY_IDS = new Set(["policy:demo-us-tech"]);
const IMPORT_RETENTION_COUNT = 20;

function isMockAssetId(assetId: unknown): boolean {
  return MOCK_ASSET_ID.test(String(assetId || ""));
}

function dateRange(values: string[]): Array<{ start: string; end: string }> {
  const dates = values.filter(Boolean).sort();
  return dates.length ? [{ start: dates[0], end: dates[dates.length - 1] }] : [];
}

function mergeAssetMetadata(existing: AssetMetadata | undefined, incoming: AssetMetadata): AssetMetadata {
  if (!existing) return incoming;
  const qualityRank = { unknown: 0, classified: 1, extracted: 2, source: 3 } as const;
  const dimensions = ["regions", "indexes", "currencies", "themes"] as const;
  const merged: AssetMetadata = {
    ...existing,
    ...incoming,
    evidence: { ...existing.evidence, ...incoming.evidence },
    industryAllocations: incoming.industryAllocations?.length
      ? incoming.industryAllocations
      : existing.industryAllocations,
    industryEvidence: incoming.industryAllocations?.length
      ? incoming.industryEvidence
      : existing.industryEvidence,
  };

  for (const dimension of dimensions) {
    const previousQuality = existing.provenance?.[dimension] ?? "unknown";
    const incomingQuality = incoming.provenance?.[dimension] ?? (incoming[dimension].length ? "source" : "unknown");
    if (!incoming[dimension].length || qualityRank[incomingQuality] < qualityRank[previousQuality]) {
      merged[dimension] = existing[dimension];
      merged.provenance = { ...merged.provenance, [dimension]: previousQuality } as AssetMetadata["provenance"];
      merged.evidence = { ...merged.evidence, [dimension]: existing.evidence?.[dimension] };
    }
  }

  const previousAssetClassQuality = existing.provenance?.assetClass ?? (existing.assetClass === "other" ? "unknown" : "source");
  const incomingAssetClassQuality = incoming.provenance?.assetClass ?? (incoming.assetClass === "other" ? "unknown" : "source");
  if (incoming.assetClass === "other" || qualityRank[incomingAssetClassQuality] < qualityRank[previousAssetClassQuality]) {
    merged.assetClass = existing.assetClass;
    merged.provenance = { ...merged.provenance, assetClass: previousAssetClassQuality } as AssetMetadata["provenance"];
  }
  return merged;
}

/**
 * 兼容 2026-08-20 之前的适配结果：当时 HYPZ 接口直接返回的行业名称被误标为 classified。
 * 旧版只有非商品类六位天天基金代码会走这条行业配置分支；商品主题仍保留为来源推导。
 * 旧账本没有保存披露日期，升级读取时只补可核实页面锚点，不伪造日期。
 */
function migrateLegacyEastmoneyThemeProvenance(asset: AssetMetadata): AssetMetadata {
  const explicitThemes = /^\d{6}$/.test(asset.assetId)
    ? explicitThemesFromSourceText([asset.name, ...asset.indexes])
    : [];
  if (explicitThemes.length) {
    return {
      ...asset,
      themes: explicitThemes,
      provenance: { ...asset.provenance!, themes: "extracted" },
      evidence: {
        ...asset.evidence,
        themes: {
          sourceUrl: `https://fundf10.eastmoney.com/jbgk_${asset.assetId}.html`,
          sourceField: "fund-profile",
        },
      },
    };
  }
  const isLegacyDirectIndustry = /^\d{6}$/.test(asset.assetId)
    && asset.assetClass !== "commodity"
    && Boolean(asset.themes.length)
    && asset.provenance?.themes === "classified"
    && !asset.evidence?.themes;
  if (!isLegacyDirectIndustry) return asset;
  return {
    ...asset,
    provenance: { ...asset.provenance!, themes: "source" },
    evidence: {
      ...asset.evidence,
      themes: {
        sourceUrl: `https://fundf10.eastmoney.com/hytz_${asset.assetId}.html`,
        sourceField: "industry-allocation",
      },
    },
  };
}

function sameStoredValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export class InvestmentLedger {
  private dbPromise: Promise<IDBDatabase>;

  constructor(dbName?: string) {
    this.dbPromise = openInvestmentDB(dbName);
  }

  private async db(): Promise<IDBDatabase> {
    return this.dbPromise;
  }

  async close(): Promise<void> {
    const db = await this.db();
    db.close();
  }

  // ---- Account / Portfolio ----

  async putAccount(account: AccountSnapshot): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(StoreName.accounts, "readwrite");
    const store = tx.objectStore(StoreName.accounts);
    // 账户是当前状态，不承担历史分析；固定只保留最新采集，避免按点击次数增长。
    store.clear();
    store.put(account);
    await txDone(tx);
  }

  async getLatestAccount(): Promise<AccountSnapshot | undefined> {
    const db = await this.db();
    const tx = db.transaction(StoreName.accounts, "readonly");
    const all = await reqToPromise(tx.objectStore(StoreName.accounts).getAll());
    if (!all.length) return undefined;
    return [...all].sort((a, b) => (b.capturedAt > a.capturedAt ? 1 : -1))[0] as AccountSnapshot;
  }

  async putPortfolio(snapshot: PortfolioSnapshot): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(StoreName.portfolioSnapshots, "readwrite");
    const store = tx.objectStore(StoreName.portfolioSnapshots);
    const sameDayKeys = await reqToPromise(store.index("byDate").getAllKeys(snapshot.date));
    for (const key of sameDayKeys) store.delete(key);
    // 日级快照足以支持仓位/减仓复核；同一天重复采集覆盖，不按采集次数累积。
    store.put(snapshot);
    await txDone(tx);
  }

  async getPortfolioSnapshots(): Promise<PortfolioSnapshot[]> {
    const db = await this.db();
    const tx = db.transaction(StoreName.portfolioSnapshots, "readonly");
    const all = (await reqToPromise(
      tx.objectStore(StoreName.portfolioSnapshots).getAll(),
    )) as PortfolioSnapshot[];
    return all.sort((a, b) => a.date.localeCompare(b.date));
  }

  async getLatestPortfolio(): Promise<PortfolioSnapshot | undefined> {
    const all = await this.getPortfolioSnapshots();
    return all.at(-1);
  }

  // ---- Assets ----

  async putAssets(assets: AssetMetadata[]): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(StoreName.assets, "readwrite");
    const store = tx.objectStore(StoreName.assets);
    for (const asset of assets) {
      const existing = await reqToPromise(store.get(asset.assetId)) as AssetMetadata | undefined;
      store.put(mergeAssetMetadata(existing, asset));
    }
    await txDone(tx);
  }

  async getAssets(): Promise<AssetMetadata[]> {
    const db = await this.db();
    const tx = db.transaction(StoreName.assets, "readonly");
    const assets = (await reqToPromise(tx.objectStore(StoreName.assets).getAll())) as AssetMetadata[];
    return assets.map(migrateLegacyEastmoneyThemeProvenance);
  }

  // ---- Transactions ----

  async putTransactions(txs: Transaction[]): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(StoreName.transactions, "readwrite");
    const store = tx.objectStore(StoreName.transactions);
    for (const t of txs) {
      store.put({ ...t, dedupKey: transactionKey(t) });
    }
    await txDone(tx);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    const db = await this.db();
    const tx = db.transaction(StoreName.transactions, "readonly");
    const all = (await reqToPromise(tx.objectStore(StoreName.transactions).getAll())) as Array<Transaction & { dedupKey?: string }>;
    return all
      .map(({ dedupKey: _dedupKey, ...rest }) => rest)
      .sort((a, b) => (a.occurredAt < b.occurredAt ? -1 : 1));
  }

  /** 只查询传入稳定键是否已存在，避免同步时把全部交易对象读入内存。 */
  async getExistingTransactionKeys(keys: string[]): Promise<Set<string>> {
    const unique = [...new Set(keys)];
    if (!unique.length) return new Set();
    const db = await this.db();
    const tx = db.transaction(StoreName.transactions, "readonly");
    const index = tx.objectStore(StoreName.transactions).index("byDedupKey");
    const found = await Promise.all(unique.map(async (key) => ({
      key,
      primaryKey: await reqToPromise(index.getKey(key)),
    })));
    await txDone(tx);
    return new Set(found.filter((item) => item.primaryKey !== undefined).map((item) => item.key));
  }

  // ---- DailyPnL ----

  async putDailyPnl(list: DailyPnL[]): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(StoreName.dailyPnl, "readwrite");
    const store = tx.objectStore(StoreName.dailyPnl);
    for (const p of list) {
      store.put({ ...p, id: dailyPnlKey(p) });
    }
    await txDone(tx);
  }

  async getAllDailyPnl(): Promise<DailyPnL[]> {
    const db = await this.db();
    const tx = db.transaction(StoreName.dailyPnl, "readonly");
    const all = (await reqToPromise(tx.objectStore(StoreName.dailyPnl).getAll())) as Array<DailyPnL & { id?: string }>;
    return all.map(({ id: _id, ...rest }) => rest).sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  /** DailyPnL 的主键就是 assetId+date，只读取键存在性，不加载历史对象。 */
  async getExistingDailyPnlKeys(keys: string[]): Promise<Set<string>> {
    const unique = [...new Set(keys)];
    if (!unique.length) return new Set();
    const db = await this.db();
    const tx = db.transaction(StoreName.dailyPnl, "readonly");
    const store = tx.objectStore(StoreName.dailyPnl);
    const found = await Promise.all(unique.map(async (key) => ({
      key,
      primaryKey: await reqToPromise(store.getKey(key)),
    })));
    await txDone(tx);
    return new Set(found.filter((item) => item.primaryKey !== undefined).map((item) => item.key));
  }

  // ---- Coverage ----

  async putCoverage(list: DataCoverage[]): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(StoreName.dataCoverage, "readwrite");
    const store = tx.objectStore(StoreName.dataCoverage);
    for (const c of list) store.put(c);
    await txDone(tx);
  }

  async getCoverage(): Promise<DataCoverage[]> {
    const db = await this.db();
    const tx = db.transaction(StoreName.dataCoverage, "readonly");
    return (await reqToPromise(tx.objectStore(StoreName.dataCoverage).getAll())) as DataCoverage[];
  }

  // ---- Imports 审计 ----

  async addImport(record: ImportRecord): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(StoreName.imports, "readwrite");
    const store = tx.objectStore(StoreName.imports);
    store.put(record);
    const all = (await reqToPromise(store.getAll())) as ImportRecord[];
    const expired = all
      .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt) || b.id.localeCompare(a.id))
      .slice(IMPORT_RETENTION_COUNT);
    for (const item of expired) store.delete(item.id);
    await txDone(tx);
  }

  /**
   * 压缩旧版本按采集次数累积的数据。保留最新账户、每天最新组合及最近导入摘要；
   * 交易、DailyPnL、规则和行动均不删除。重复调用幂等。
   */
  async compactCollectionHistory(): Promise<void> {
    const db = await this.db();
    const stores = [StoreName.accounts, StoreName.portfolioSnapshots, StoreName.imports];
    const tx = db.transaction(stores as string[], "readwrite");
    const accountStore = tx.objectStore(StoreName.accounts);
    const portfolioStore = tx.objectStore(StoreName.portfolioSnapshots);
    const importStore = tx.objectStore(StoreName.imports);
    const [accounts, portfolios, imports] = await Promise.all([
      reqToPromise(accountStore.getAll()) as Promise<AccountSnapshot[]>,
      reqToPromise(portfolioStore.getAll()) as Promise<PortfolioSnapshot[]>,
      reqToPromise(importStore.getAll()) as Promise<ImportRecord[]>,
    ]);

    const latestAccount = [...accounts].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0];
    for (const account of accounts) {
      if (account.id !== latestAccount?.id) accountStore.delete(account.id);
    }

    const latestPortfolioByDate = new Map<string, PortfolioSnapshot>();
    for (const portfolio of portfolios) {
      const existing = latestPortfolioByDate.get(portfolio.date);
      if (!existing || portfolio.id.localeCompare(existing.id) > 0) latestPortfolioByDate.set(portfolio.date, portfolio);
    }
    const keptPortfolioIds = new Set([...latestPortfolioByDate.values()].map((item) => item.id));
    for (const portfolio of portfolios) {
      if (!keptPortfolioIds.has(portfolio.id)) portfolioStore.delete(portfolio.id);
    }

    const keptImportIds = new Set([...imports]
      .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt) || b.id.localeCompare(a.id))
      .slice(0, IMPORT_RETENTION_COUNT)
      .map((item) => item.id));
    for (const item of imports) {
      if (!keptImportIds.has(item.id)) importStore.delete(item.id);
    }
    await txDone(tx);
  }

  async getImports(): Promise<ImportRecord[]> {
    const db = await this.db();
    const tx = db.transaction(StoreName.imports, "readonly");
    return (await reqToPromise(tx.objectStore(StoreName.imports).getAll())) as ImportRecord[];
  }

  // ---- Policies / PolicyVersions（PRD §19-20，版本不可覆盖） ----

  async putPolicy(policy: Policy): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(StoreName.policies, "readwrite");
    tx.objectStore(StoreName.policies).put(policy);
    await txDone(tx);
  }

  async getPolicies(): Promise<Policy[]> {
    const db = await this.db();
    const tx = db.transaction(StoreName.policies, "readonly");
    return (await reqToPromise(tx.objectStore(StoreName.policies).getAll())) as Policy[];
  }

  async getPolicy(id: string): Promise<Policy | undefined> {
    const db = await this.db();
    const tx = db.transaction(StoreName.policies, "readonly");
    return (await reqToPromise(tx.objectStore(StoreName.policies).get(id))) as Policy | undefined;
  }

  async putPolicyVersion(version: PolicyVersion): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(StoreName.policyVersions, "readwrite");
    tx.objectStore(StoreName.policyVersions).put(version);
    await txDone(tx);
  }

  async getPolicyVersions(policyId: string): Promise<PolicyVersion[]> {
    const db = await this.db();
    const tx = db.transaction(StoreName.policyVersions, "readonly");
    const index = tx.objectStore(StoreName.policyVersions).index("byPolicy");
    const all = (await reqToPromise(index.getAll(policyId))) as PolicyVersion[];
    return all.sort((a, b) => a.version - b.version);
  }

  /** 当前生效版本：effectiveFrom <= today 且未过期。 */
  async getActiveVersions(today: string): Promise<PolicyVersion[]> {
    const db = await this.db();
    const tx = db.transaction(StoreName.policyVersions, "readonly");
    const all = (await reqToPromise(tx.objectStore(StoreName.policyVersions).getAll())) as PolicyVersion[];
    return all
      .filter((v) => v.effectiveFrom <= today && (!v.effectiveTo || v.effectiveTo >= today))
      .sort((a, b) => a.version - b.version);
  }

  // ---- Actions（PRD §22） ----

  async putAction(action: Action): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(StoreName.actions, "readwrite");
    tx.objectStore(StoreName.actions).put(action);
    await txDone(tx);
  }

  /**
   * 让自动派生的待办与当前事实保持一致：移除已经不再成立的 open 项，并避免把用户
   * 已处理/忽略的同一交易重新打开。规则、异常和未分类行动都属于可重新计算的派生数据。
   */
  async reconcileDerivedActions(incoming: Action[]): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(StoreName.actions, "readwrite");
    const store = tx.objectStore(StoreName.actions);
    const existing = (await reqToPromise(store.getAll())) as Action[];
    const isDerived = (action: Action): boolean =>
      action.id.startsWith("act:policy:")
      || action.id.startsWith("act:abnormal:")
      || action.id.startsWith("act:unclassified:");
    const identity = (action: Action): string =>
      action.transactionId
        ? `${action.type}:transaction:${action.transactionId}`
        : action.id;
    const incomingIdentities = new Set(incoming.map(identity));
    const existingIdentities = new Set(existing.map(identity));

    for (const action of existing) {
      if (isDerived(action) && action.status === "open" && !incomingIdentities.has(identity(action))) {
        store.delete(action.id);
      }
    }
    for (const action of incoming) {
      // 任一状态的同源行动都算已存在；用户处理过的项目不能在下次复盘时被重新打开。
      if (!existingIdentities.has(identity(action))) store.put(action);
    }
    await txDone(tx);
  }

  async getActions(): Promise<Action[]> {
    const db = await this.db();
    const tx = db.transaction(StoreName.actions, "readonly");
    const all = (await reqToPromise(tx.objectStore(StoreName.actions).getAll())) as Action[];
    return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async getOpenActions(): Promise<Action[]> {
    return (await this.getActions()).filter((a) => a.status === "open");
  }

  async updateActionStatus(id: string, status: Action["status"], resolvedAt: string): Promise<void> {
    const existing = await this.getActions();
    const target = existing.find((a) => a.id === id);
    if (!target) throw new Error(`updateActionStatus: action ${id} 不存在`);
    await this.putAction({ ...target, status, resolvedAt });
  }

  // ---- Patterns（V2.4 DetectedPattern） ----

  async putPattern(pattern: DetectedPattern): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(StoreName.patterns, "readwrite");
    tx.objectStore(StoreName.patterns).put(pattern);
    await txDone(tx);
  }

  async getPatterns(): Promise<DetectedPattern[]> {
    const db = await this.db();
    const tx = db.transaction(StoreName.patterns, "readonly");
    return (await reqToPromise(tx.objectStore(StoreName.patterns).getAll())) as DetectedPattern[];
  }

  /**
   * 清理由早期页面演示入口写入的 Mock 事实。
   *
   * 只匹配 fixture 的稳定 source / id / assetId，并重建 Coverage；Policies 与
   * PolicyVersions 属于用户输入，始终保留。Actions、Patterns、Evidence 缺少来源字段，
   * 一旦检测到 Mock 事实便清空，随后由真实账本重新派生。
   */
  async removeMockData(): Promise<MockDataCleanupResult> {
    const db = await this.db();
    const stores = [
      StoreName.accounts,
      StoreName.portfolioSnapshots,
      StoreName.transactions,
      StoreName.dailyPnl,
      StoreName.dataCoverage,
      StoreName.assets,
      StoreName.imports,
      StoreName.patterns,
      StoreName.actions,
      StoreName.evidence,
      StoreName.reviewSnapshots,
      StoreName.reviewActions,
    ];
    const tx = db.transaction(stores as string[], "readwrite");
    const [accounts, portfolios, transactions, dailyPnl, coverage, assets, imports, patterns, actions, evidence] = await Promise.all([
      reqToPromise(tx.objectStore(StoreName.accounts).getAll()) as Promise<AccountSnapshot[]>,
      reqToPromise(tx.objectStore(StoreName.portfolioSnapshots).getAll()) as Promise<PortfolioSnapshot[]>,
      reqToPromise(tx.objectStore(StoreName.transactions).getAll()) as Promise<Array<Transaction & { dedupKey?: string }>>,
      reqToPromise(tx.objectStore(StoreName.dailyPnl).getAll()) as Promise<Array<DailyPnL & { id?: string }>>,
      reqToPromise(tx.objectStore(StoreName.dataCoverage).getAll()) as Promise<DataCoverage[]>,
      reqToPromise(tx.objectStore(StoreName.assets).getAll()) as Promise<AssetMetadata[]>,
      reqToPromise(tx.objectStore(StoreName.imports).getAll()) as Promise<ImportRecord[]>,
      reqToPromise(tx.objectStore(StoreName.patterns).getAll()) as Promise<DetectedPattern[]>,
      reqToPromise(tx.objectStore(StoreName.actions).getAll()) as Promise<Action[]>,
      reqToPromise(tx.objectStore(StoreName.evidence).getAll()) as Promise<Array<{ id: string }>>,
    ]);

    const mockAccounts = accounts.filter((item) => MOCK_SOURCE.test(item.source));
    const mockPortfolios = portfolios.filter((item) =>
      item.id.startsWith("portfolio:") && item.holdings.every((holding) => isMockAssetId(holding.assetId)),
    );
    const mockTransactions = transactions.filter((item) => isMockAssetId(item.assetId));
    const mockDailyPnl = dailyPnl.filter((item) => isMockAssetId(item.assetId));
    const mockAssets = assets.filter((item) => isMockAssetId(item.assetId));
    const mockImports = imports.filter((item) => MOCK_SOURCE.test(item.source));
    const mockFacts = mockAccounts.length + mockPortfolios.length + mockTransactions.length + mockDailyPnl.length + mockAssets.length + mockImports.length;

    if (!mockFacts) {
      await txDone(tx);
      return {
        cleaned: false,
        accounts: 0,
        portfolios: 0,
        transactions: 0,
        dailyPnl: 0,
        assets: 0,
        imports: 0,
        derivedRecords: 0,
      };
    }

    for (const item of mockAccounts) tx.objectStore(StoreName.accounts).delete(item.id);
    for (const item of mockPortfolios) tx.objectStore(StoreName.portfolioSnapshots).delete(item.id);
    for (const item of mockTransactions) tx.objectStore(StoreName.transactions).delete(item.id);
    for (const item of mockDailyPnl) tx.objectStore(StoreName.dailyPnl).delete(item.id || dailyPnlKey(item));
    for (const item of mockAssets) tx.objectStore(StoreName.assets).delete(item.assetId);
    for (const item of mockImports) tx.objectStore(StoreName.imports).delete(item.id);

    tx.objectStore(StoreName.patterns).clear();
    tx.objectStore(StoreName.actions).clear();
    tx.objectStore(StoreName.evidence).clear();
    tx.objectStore(StoreName.dataCoverage).clear();
    // P0 派生复盘结果依赖来源事实，mock facts 清除时一并重置（用户规则类 stores 保留）。
    tx.objectStore(StoreName.reviewSnapshots).clear();
    tx.objectStore(StoreName.reviewActions).clear();

    const realAccounts = accounts.filter((item) => !mockAccounts.includes(item));
    const realPortfolios = portfolios.filter((item) => !mockPortfolios.includes(item));
    const realTransactions = transactions.filter((item) => !mockTransactions.includes(item));
    const realDailyPnl = dailyPnl.filter((item) => !mockDailyPnl.includes(item));
    const realImports = imports.filter((item) => !mockImports.includes(item));
    const hasRealFacts = Boolean(
      realAccounts.length || realPortfolios.length || realTransactions.length || realDailyPnl.length || realImports.length,
    );
    const latestRealSync = [...realAccounts.map((item) => item.capturedAt), ...realImports.map((item) => item.capturedAt)].filter(Boolean).sort().at(-1);
    const currentCoverage = new Map(coverage.map((item) => [item.dataset, item]));
    const portfolioDates = realPortfolios.map((item) => item.date);
    const realHoldings = realPortfolios.flatMap((item) => item.holdings);
    const detailComplete = realHoldings.length > 0 && realHoldings.every((item) =>
      item.shares !== undefined || item.availableShares !== undefined || item.nav !== undefined || Boolean(item.navDate),
    );

    const rebuild = (
      dataset: DataCoverage["dataset"],
      ranges: DataCoverage["knownRanges"],
      completeness?: DataCoverage["completeness"],
    ): DataCoverage | undefined => {
      const existing = currentCoverage.get(dataset);
      if (!hasRealFacts || (!existing && !completeness)) return undefined;
      const resolvedCompleteness = completeness ?? existing?.completeness ?? "unknown";
      return {
        dataset,
        knownRanges: ranges,
        completeness: resolvedCompleteness,
        lastSyncedAt: latestRealSync ?? existing?.lastSyncedAt,
        warningCodes: (existing?.warningCodes || []).filter((warning) => !MOCK_WARNING.test(warning)),
      };
    };

    const rebuiltCoverage = [
      rebuild("account", dateRange(realAccounts.map((item) => item.capturedAt.slice(0, 10))), realAccounts.length ? "complete" : undefined),
      rebuild("holdings", dateRange(portfolioDates), realPortfolios.length ? "complete" : undefined),
      rebuild("transactions", dateRange(realTransactions.map((item) => item.occurredAt.slice(0, 10)))),
      rebuild("dailyPnl", dateRange(realDailyPnl.map((item) => item.date)), realDailyPnl.length ? "complete" : undefined),
      rebuild("fundDetail", dateRange(portfolioDates), detailComplete ? "complete" : undefined),
    ].filter((item): item is DataCoverage => Boolean(item));

    const coverageStore = tx.objectStore(StoreName.dataCoverage);
    for (const item of rebuiltCoverage) coverageStore.put(item);
    await txDone(tx);

    return {
      cleaned: true,
      accounts: mockAccounts.length,
      portfolios: mockPortfolios.length,
      transactions: mockTransactions.length,
      dailyPnl: mockDailyPnl.length,
      assets: mockAssets.length,
      imports: mockImports.length,
      derivedRecords: patterns.length + actions.length + evidence.length,
    };
  }

  async removeDemoReviewConfiguration(): Promise<void> {
    const db = await this.db();
    const stores = [
      StoreName.investmentScopes,
      StoreName.strategyRuleVersions,
      StoreName.decisionRecords,
      StoreName.operationPlans,
      StoreName.trailingStopStates,
      StoreName.reductionPlans,
      StoreName.reviewSnapshots,
      StoreName.reviewActions,
      StoreName.policies,
      StoreName.policyVersions,
    ];
    const tx = db.transaction(stores as string[], "readwrite");
    for (const storeName of stores) {
      const store = tx.objectStore(storeName);
      const records = await reqToPromise(store.getAll()) as Array<Record<string, unknown>>;
      for (const record of records) {
        const belongsToDemoScope = DEMO_REVIEW_SCOPE_IDS.has(String(record.scopeId || ""));
        const belongsToDemoPolicy = DEMO_POLICY_IDS.has(String(record.id || record.policyId || ""));
        if (belongsToDemoScope || belongsToDemoPolicy) {
          const key = store.keyPath && typeof store.keyPath === "string" ? record[store.keyPath] : undefined;
          if (key !== undefined) store.delete(key as IDBValidKey);
        }
      }
    }
    await txDone(tx);
  }

  /** 清除来源事实和所有派生结果，保留用户定义的 Policies / PolicyVersions。 */
  async clearImportedFacts(): Promise<void> {
    const db = await this.db();
    const stores = [
      StoreName.accounts,
      StoreName.portfolioSnapshots,
      StoreName.transactions,
      StoreName.dailyPnl,
      StoreName.dataCoverage,
      StoreName.assets,
      StoreName.imports,
      StoreName.patterns,
      StoreName.actions,
      StoreName.evidence,
      StoreName.reviewSnapshots,
      StoreName.reviewActions,
    ];
    const tx = db.transaction(stores as string[], "readwrite");
    for (const store of stores) tx.objectStore(store).clear();
    await txDone(tx);
  }

  /** 清空 Investment Ledger，包括用户定义的 Policies / PolicyVersions。 */
  async clearEverything(): Promise<void> {
    const db = await this.db();
    const stores = [
      StoreName.accounts,
      StoreName.portfolioSnapshots,
      StoreName.transactions,
      StoreName.dailyPnl,
      StoreName.dataCoverage,
      StoreName.assets,
      StoreName.imports,
      StoreName.policies,
      StoreName.policyVersions,
      StoreName.patterns,
      StoreName.actions,
      StoreName.evidence,
      StoreName.investmentScopes,
      StoreName.strategyRuleVersions,
      StoreName.decisionRecords,
      StoreName.operationPlans,
      StoreName.executionLinks,
      StoreName.trailingStopStates,
      StoreName.reductionPlans,
      StoreName.reviewSnapshots,
      StoreName.reviewActions,
    ];
    const tx = db.transaction(stores as string[], "readwrite");
    for (const store of stores) tx.objectStore(store).clear();
    await txDone(tx);
  }

  // ---- 清空（兼容既有测试入口） ----

  async clearAll(): Promise<void> {
    await this.clearEverything();
  }

  // ---- P0：InvestmentScope ----

  async putInvestmentScope(scope: InvestmentScope): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(StoreName.investmentScopes, "readwrite");
    tx.objectStore(StoreName.investmentScopes).put(scope);
    await txDone(tx);
  }

  async getScopes(): Promise<InvestmentScope[]> {
    const db = await this.db();
    const tx = db.transaction(StoreName.investmentScopes, "readonly");
    return (await reqToPromise(tx.objectStore(StoreName.investmentScopes).getAll())) as InvestmentScope[];
  }

  /** 当时生效的 scope：effectiveFrom <= today 且未过期，取最高版本。 */
  async getActiveScope(today: string): Promise<InvestmentScope | undefined> {
    const all = await this.getScopes();
    const active = all
      .filter((s) => s.effectiveFrom <= today && (!s.effectiveTo || s.effectiveTo >= today))
      .sort((a, b) => a.version - b.version);
    return active[active.length - 1];
  }

  // ---- P0：StrategyRuleVersion ----

  async putStrategyRuleVersion(version: StrategyRuleVersion): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(StoreName.strategyRuleVersions, "readwrite");
    const store = tx.objectStore(StoreName.strategyRuleVersions);
    const existing = (await reqToPromise(store.get(version.id))) as StrategyRuleVersion | undefined;
    if (existing && !sameStoredValue(existing, version)) {
      await txDone(tx);
      throw new Error(`putStrategyRuleVersion: 规则版本 ${version.id} 已存在且内容不同，不得覆盖历史`);
    }
    if (!existing) store.add(version);
    await txDone(tx);
  }

  async getStrategyRuleVersions(scopeId: string): Promise<StrategyRuleVersion[]> {
    const db = await this.db();
    const tx = db.transaction(StoreName.strategyRuleVersions, "readonly");
    const index = tx.objectStore(StoreName.strategyRuleVersions).index("byScope");
    const all = (await reqToPromise(index.getAll(scopeId))) as StrategyRuleVersion[];
    return all.sort((a, b) => a.version - b.version);
  }

  async getActiveStrategyRules(scopeId: string, today: string): Promise<StrategyRuleVersion[]> {
    const all = await this.getStrategyRuleVersions(scopeId);
    return all.filter((v) => v.effectiveFrom <= today && (!v.effectiveTo || v.effectiveTo >= today));
  }

  // ---- P0：DecisionRecord / OperationPlan / ExecutionLink ----

  async putDecisionRecord(record: DecisionRecord): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(StoreName.decisionRecords, "readwrite");
    tx.objectStore(StoreName.decisionRecords).put(record);
    await txDone(tx);
  }

  /** 原子写入事前决策、操作计划与首次计划核对边界。 */
  async recordDecisionPlan(
    record: DecisionRecord,
    plan: OperationPlan,
    scope: InvestmentScope,
  ): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(
      [StoreName.decisionRecords, StoreName.operationPlans, StoreName.investmentScopes],
      "readwrite",
    );
    tx.objectStore(StoreName.decisionRecords).put(record);
    tx.objectStore(StoreName.operationPlans).put(plan);
    tx.objectStore(StoreName.investmentScopes).put(scope);
    await txDone(tx);
  }

  async getDecisionRecords(scopeId: string): Promise<DecisionRecord[]> {
    const db = await this.db();
    const tx = db.transaction(StoreName.decisionRecords, "readonly");
    const index = tx.objectStore(StoreName.decisionRecords).index("byScope");
    return (await reqToPromise(index.getAll(scopeId))) as DecisionRecord[];
  }

  async getDecisionRecord(id: string): Promise<DecisionRecord | undefined> {
    const db = await this.db();
    const tx = db.transaction(StoreName.decisionRecords, "readonly");
    return (await reqToPromise(tx.objectStore(StoreName.decisionRecords).get(id))) as DecisionRecord | undefined;
  }

  async putOperationPlan(plan: OperationPlan): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(StoreName.operationPlans, "readwrite");
    tx.objectStore(StoreName.operationPlans).put(plan);
    await txDone(tx);
  }

  async getOperationPlans(scopeId: string): Promise<OperationPlan[]> {
    const db = await this.db();
    const tx = db.transaction(StoreName.operationPlans, "readonly");
    const index = tx.objectStore(StoreName.operationPlans).index("byScope");
    return (await reqToPromise(index.getAll(scopeId))) as OperationPlan[];
  }

  async putExecutionLink(link: ExecutionLink): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(StoreName.executionLinks, "readwrite");
    tx.objectStore(StoreName.executionLinks).put(link);
    await txDone(tx);
  }

  async getExecutionLinks(): Promise<ExecutionLink[]> {
    const db = await this.db();
    const tx = db.transaction(StoreName.executionLinks, "readonly");
    return (await reqToPromise(tx.objectStore(StoreName.executionLinks).getAll())) as ExecutionLink[];
  }

  async getExecutionLinksByTransaction(transactionId: string): Promise<ExecutionLink[]> {
    const db = await this.db();
    const tx = db.transaction(StoreName.executionLinks, "readonly");
    const index = tx.objectStore(StoreName.executionLinks).index("byTransaction");
    return (await reqToPromise(index.getAll(transactionId))) as ExecutionLink[];
  }

  // ---- P0：TrailingStopState / ReductionPlan ----

  async putTrailingStopState(state: StoredTrailingStopState): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(StoreName.trailingStopStates, "readwrite");
    const store = tx.objectStore(StoreName.trailingStopStates);
    const existing = (await reqToPromise(store.get(state.id))) as StoredTrailingStopState | undefined;

    if (existing?.asOf && (!state.asOf || state.asOf < existing.asOf)) {
      await txDone(tx);
      return;
    }
    if (
      existing?.currentHighWaterMark !== undefined
      && (state.currentHighWaterMark === undefined || state.currentHighWaterMark < existing.currentHighWaterMark)
    ) {
      await txDone(tx);
      throw new Error(`putTrailingStopState: ${state.id} 的高水位不得下降`);
    }
    if (
      existing?.stopLine !== undefined
      && (state.stopLine === undefined || state.stopLine < existing.stopLine)
    ) {
      await txDone(tx);
      throw new Error(`putTrailingStopState: ${state.id} 的止损线不得下降`);
    }
    if (!existing || !sameStoredValue(existing, state)) store.put(state);
    await txDone(tx);
  }

  async getTrailingStopStates(scopeId: string): Promise<StoredTrailingStopState[]> {
    const db = await this.db();
    const tx = db.transaction(StoreName.trailingStopStates, "readonly");
    const index = tx.objectStore(StoreName.trailingStopStates).index("byScope");
    return (await reqToPromise(index.getAll(scopeId))) as StoredTrailingStopState[];
  }

  async putReductionPlan(plan: ReductionPlan): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(StoreName.reductionPlans, "readwrite");
    const store = tx.objectStore(StoreName.reductionPlans);
    const existing = (await reqToPromise(store.get(plan.id))) as ReductionPlan | undefined;
    if (existing && !sameStoredValue(existing, plan)) {
      await txDone(tx);
      throw new Error(`putReductionPlan: 减仓计划 ${plan.id} 已存在且内容不同，不得覆盖历史`);
    }
    if (!existing) store.add(plan);
    await txDone(tx);
  }

  async getReductionPlans(scopeId: string): Promise<ReductionPlan[]> {
    const db = await this.db();
    const tx = db.transaction(StoreName.reductionPlans, "readonly");
    const index = tx.objectStore(StoreName.reductionPlans).index("byScope");
    return (await reqToPromise(index.getAll(scopeId))) as ReductionPlan[];
  }

  // ---- P0：ReviewSnapshot / ReviewAction ----

  async putReviewSnapshot(snapshot: ReviewSnapshot): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(StoreName.reviewSnapshots, "readwrite");
    const store = tx.objectStore(StoreName.reviewSnapshots);
    const existing = (await reqToPromise(store.get(snapshot.id))) as ReviewSnapshot | undefined;
    if (existing && !sameStoredValue(existing, snapshot)) {
      await txDone(tx);
      throw new Error(`putReviewSnapshot: 复盘快照 ${snapshot.id} 已存在且内容不同，不得覆盖历史`);
    }
    if (!existing) store.add(snapshot);
    const sameScope = (await reqToPromise(store.index("byScope").getAll(snapshot.scopeId))) as ReviewSnapshot[];
    for (const item of sameScope) {
      if (item.asOf === snapshot.asOf && item.id !== snapshot.id) store.delete(item.id);
    }
    await txDone(tx);
  }

  async getReviewSnapshots(scopeId: string): Promise<ReviewSnapshot[]> {
    const db = await this.db();
    const tx = db.transaction(StoreName.reviewSnapshots, "readonly");
    const index = tx.objectStore(StoreName.reviewSnapshots).index("byScope");
    return (await reqToPromise(index.getAll(scopeId))) as ReviewSnapshot[];
  }

  /** 最新一版复盘快照（按 asOf 降序）。 */
  async getLatestReviewSnapshot(scopeId: string): Promise<ReviewSnapshot | undefined> {
    const all = await this.getReviewSnapshots(scopeId);
    return [...all].sort((a, b) => (a.asOf < b.asOf ? 1 : -1))[0];
  }

  async putReviewAction(action: ReviewAction): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(StoreName.reviewActions, "readwrite");
    tx.objectStore(StoreName.reviewActions).put(action);
    await txDone(tx);
  }

  async getReviewActions(scopeId?: string): Promise<ReviewAction[]> {
    const db = await this.db();
    const tx = db.transaction(StoreName.reviewActions, "readonly");
    if (!scopeId) {
      return (await reqToPromise(tx.objectStore(StoreName.reviewActions).getAll())) as ReviewAction[];
    }
    const index = tx.objectStore(StoreName.reviewActions).index("byScope");
    return (await reqToPromise(index.getAll(scopeId))) as ReviewAction[];
  }

  async getOpenReviewActions(scopeId: string): Promise<ReviewAction[]> {
    return (await this.getReviewActions(scopeId)).filter(
      (a) => a.kind !== "resolved" && a.kind !== "dismissed_with_reason",
    );
  }

  async updateReviewActionStatus(
    id: string,
    kind: ReviewAction["kind"],
    resolvedAt: string,
    note?: string,
  ): Promise<void> {
    const all = await this.getReviewActions();
    const target = all.find((a) => a.id === id);
    if (!target) throw new Error(`updateReviewActionStatus: review action ${id} 不存在`);
    await this.putReviewAction({ ...target, kind, resolvedAt, note: note ?? target.note });
  }
}
