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
  DetectedPattern,
  Policy,
  PolicyVersion,
  PortfolioSnapshot,
  Transaction,
} from "../domain";
import { dailyPnlKey } from "../sync/keys";
import { transactionKey } from "../sync/keys";
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

const MOCK_ASSET_ID = /^F00[1-5]$/;
const MOCK_SOURCE = /^mock(?:-|$)/;
const MOCK_WARNING = /^(?:mock|empty|partial|stale|failed|complex|large):/;

function isMockAssetId(assetId: unknown): boolean {
  return MOCK_ASSET_ID.test(String(assetId || ""));
}

function dateRange(values: string[]): Array<{ start: string; end: string }> {
  const dates = values.filter(Boolean).sort();
  return dates.length ? [{ start: dates[0], end: dates[dates.length - 1] }] : [];
}

function mergeAssetMetadata(existing: AssetMetadata | undefined, incoming: AssetMetadata): AssetMetadata {
  if (!existing) return incoming;
  const qualityRank = { unknown: 0, classified: 1, source: 2 } as const;
  const dimensions = ["regions", "indexes", "currencies", "themes"] as const;
  const merged: AssetMetadata = { ...existing, ...incoming };

  for (const dimension of dimensions) {
    const previousQuality = existing.provenance?.[dimension] ?? "unknown";
    const incomingQuality = incoming.provenance?.[dimension] ?? (incoming[dimension].length ? "source" : "unknown");
    if (!incoming[dimension].length || qualityRank[incomingQuality] < qualityRank[previousQuality]) {
      merged[dimension] = existing[dimension];
      merged.provenance = { ...merged.provenance, [dimension]: previousQuality } as AssetMetadata["provenance"];
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
    tx.objectStore(StoreName.accounts).put(account);
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
    tx.objectStore(StoreName.portfolioSnapshots).put(snapshot);
    await txDone(tx);
  }

  async getLatestPortfolio(): Promise<PortfolioSnapshot | undefined> {
    const db = await this.db();
    const tx = db.transaction(StoreName.portfolioSnapshots, "readonly");
    const all = await reqToPromise(tx.objectStore(StoreName.portfolioSnapshots).getAll());
    if (!all.length) return undefined;
    return [...all].sort((a, b) => (b.date > a.date ? 1 : -1))[0] as PortfolioSnapshot;
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
    return (await reqToPromise(tx.objectStore(StoreName.assets).getAll())) as AssetMetadata[];
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
    tx.objectStore(StoreName.imports).put(record);
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
    ];
    const tx = db.transaction(stores as string[], "readwrite");
    for (const store of stores) tx.objectStore(store).clear();
    await txDone(tx);
  }

  // ---- 清空（兼容既有测试入口） ----

  async clearAll(): Promise<void> {
    await this.clearEverything();
  }
}
