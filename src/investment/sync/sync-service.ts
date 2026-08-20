/**
 * SyncService：增量同步入口（PRD §13、§45 SYNC-001~004）。
 *
 * 调用 Adapter 获取新增事实，按稳定键与 Ledger 现有记录去重后写入；失败或部分成功时
 * 保留最后有效账本，不覆盖为零值（PRD §15、shared/03）。
 *
 * 重复同步幂等：同样输入下 added 应为 0，importId 仍递增以审计。
 */
import type {
  HoldingSnapshot,
  PortfolioSnapshot,
} from "../domain";
import type { InvestmentSourceAdapter } from "../adapter/InvestmentSourceAdapter";
import type { InvestmentLedger, ImportRecord } from "../ledger/repository";
import { dailyPnlKey, transactionKey } from "./keys";
import { mergeCoverage, deriveHealth, type SensorHealth } from "../sensor/coverage";

export interface SyncResult {
  importId: string;
  capturedAt: string;
  source: string;
  scenario?: string;
  status: ImportRecord["status"];
  addedTransactions: number;
  duplicateTransactions: number;
  addedDailyPnl: number;
  duplicateDailyPnl: number;
  failures: string[];
  warnings: string[];
  health: SensorHealth;
}

export class SyncService {
  constructor(
    private adapter: InvestmentSourceAdapter,
    private ledger: InvestmentLedger,
  ) {}

  async run(): Promise<SyncResult> {
    const failures: string[] = [];
    const warnings: string[] = [];

    // 1. Account（失败则整体 failed，不再继续）
    const account = await this.adapter.getAccount();
    await this.ledger.putAccount(account);
    const capturedAt = account.capturedAt;

    // 2. Holdings → 组合快照
    const holdings = await this.adapter.getHoldings();
    const holdingValue = holdings.reduce((s, h: HoldingSnapshot) => s + (h.marketValue || 0), 0);
    const cashDifference = account.totalAsset - holdingValue;
    const cashTolerance = Math.max(0.01, Math.abs(account.totalAsset) * 0.0001);
    const cash = cashDifference >= -cashTolerance
      ? Math.abs(cashDifference) <= cashTolerance ? 0 : cashDifference
      : undefined;
    const portfolio: PortfolioSnapshot = {
      id: `portfolio:${capturedAt}`,
      date: capturedAt.slice(0, 10),
      totalAsset: account.totalAsset,
      holdingValue,
      ...(cash === undefined ? {} : { cash }),
      ...(account.currentHoldingPnl === undefined ? {} : { currentHoldingPnl: account.currentHoldingPnl }),
      holdings,
    };
    await this.ledger.putPortfolio(portfolio);

    // 3. Assets 元数据
    const assets = await this.adapter.getAssets();
    if (assets.length) await this.ledger.putAssets(assets);

    // 4. Transactions —— 去重；失败保留旧账本
    let addedTransactions = 0;
    let duplicateTransactions = 0;
    try {
      const batch = await this.adapter.getTransactions();
      const uniqueIncoming = new Map(batch.transactions.map((transaction) => [transactionKey(transaction), transaction]));
      const existingKeys = await this.ledger.getExistingTransactionKeys([...uniqueIncoming.keys()]);
      const added = [...uniqueIncoming.entries()]
        .filter(([key]) => !existingKeys.has(key))
        .map(([, transaction]) => transaction);
      addedTransactions = added.length;
      duplicateTransactions = batch.transactions.length - added.length;
      // 即使稳定流水已存在，也允许来源把“待确认”更新为“成功”，或应用新版规范化映射。
      // put 使用稳定主键覆盖，不会增加重复存储。
      if (uniqueIncoming.size) await this.ledger.putTransactions([...uniqueIncoming.values()]);
      if (!batch.pagingComplete) warnings.push("sync:transactions-paging-incomplete");
    } catch (e) {
      failures.push(`transactions:${(e as Error).message}`);
    }

    // 5. DailyPnL —— 逐 asset 合并去重；单 asset 失败不致命
    let addedDailyPnl = 0;
    let duplicateDailyPnl = 0;
    try {
      const incoming: { assetId: string; date: string; pnl: number }[] = [];
      for (const h of holdings) {
        try {
          const series = await this.adapter.getDailyPnL(h.assetId);
          incoming.push(...series);
        } catch (e) {
          failures.push(`dailyPnl:${h.assetId}:${(e as Error).message}`);
        }
      }
      const uniqueIncoming = new Map(incoming.map((point) => [dailyPnlKey(point), point]));
      const existingKeys = await this.ledger.getExistingDailyPnlKeys([...uniqueIncoming.keys()]);
      const added = [...uniqueIncoming.entries()]
        .filter(([key]) => !existingKeys.has(key))
        .map(([, point]) => point);
      const duplicates = incoming.length - added.length;
      addedDailyPnl = added.length;
      duplicateDailyPnl = duplicates;
      if (added.length) await this.ledger.putDailyPnl(added);
    } catch (e) {
      failures.push(`dailyPnl:${(e as Error).message}`);
    }

    // 6. Coverage —— merge 保守合并；失败保留旧
    let mergedCoverage = await this.ledger.getCoverage();
    try {
      const incomingCoverage = await this.adapter.getCoverage();
      mergedCoverage = mergeCoverage(mergedCoverage, incomingCoverage);
      await this.ledger.putCoverage(mergedCoverage);
    } catch (e) {
      failures.push(`coverage:${(e as Error).message}`);
    }

    for (const c of mergedCoverage) warnings.push(...c.warningCodes);

    const health = deriveHealth(mergedCoverage, warnings);

    const status: SyncResult["status"] = failures.length === 0 ? "ok" : holdings.length === 0 && addedTransactions === 0 ? "failed" : "partial";

    const priorImports = await this.ledger.getImports();
    const importId = `import:${capturedAt}:${priorImports.length}`;

    const record: ImportRecord = {
      id: importId,
      capturedAt,
      source: this.adapter.source,
      addedTransactions,
      duplicateTransactions,
      addedDailyPnl,
      duplicateDailyPnl,
      failures,
      warnings,
      status,
    };
    await this.ledger.addImport(record);

    return {
      importId,
      capturedAt,
      source: this.adapter.source,
      status,
      addedTransactions,
      duplicateTransactions,
      addedDailyPnl,
      duplicateDailyPnl,
      failures,
      warnings,
      health,
    };
  }
}
