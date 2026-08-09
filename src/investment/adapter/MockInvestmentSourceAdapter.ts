/**
 * MockInvestmentSourceAdapter（PRD §37）
 *
 * Agent A 唯一使用的 Adapter 实现。按 fixture 场景返回标准化事实，并模拟字段缺失、
 * 分页未完成和部分成功（methodFailures）。真实环境由 EastmoneyInvestmentSourceAdapter
 * 实现（Agent B 领地），二者对 Core 完全可互换。
 */
import type { AssetId } from "../domain";
import type { InvestmentSourceAdapter, TransactionBatch } from "./InvestmentSourceAdapter";
import { getFixture, type FixtureScenario, type ScenarioName } from "../__fixtures__";

export class MockInvestmentSourceAdapter implements InvestmentSourceAdapter {
  readonly source: string;
  private readonly scenario: FixtureScenario;

  constructor(scenario: ScenarioName | FixtureScenario = "normal") {
    this.scenario = typeof scenario === "string" ? getFixture(scenario) : scenario;
    this.source = this.scenario.dataset.source;
  }

  /** 切换场景（返回新实例，保持不可变）。 */
  withScenario(scenario: ScenarioName | FixtureScenario): MockInvestmentSourceAdapter {
    return new MockInvestmentSourceAdapter(scenario);
  }

  getScenario(): FixtureScenario {
    return this.scenario;
  }

  getDataset() {
    return this.scenario.dataset;
  }

  async getAccount() {
    this.assertNotFailed("getAccount");
    const account = this.scenario.dataset.account;
    if (!account) throw new Error("mock: account missing");
    return account;
  }

  async getHoldings() {
    this.assertNotFailed("getHoldings");
    return this.scenario.dataset.portfolio?.holdings ?? [];
  }

  async getAssets() {
    return this.scenario.dataset.assets ?? [];
  }

  async getTransactions(): Promise<TransactionBatch> {
    this.assertNotFailed("getTransactions");
    return {
      transactions: this.scenario.dataset.transactions,
      pagingComplete: !this.scenario.transactionsPagingIncomplete,
    };
  }

  async getDailyPnL(assetId: AssetId) {
    this.assertNotFailed("getDailyPnL");
    return this.scenario.dataset.dailyPnl.filter((d) => d.assetId === assetId);
  }

  async getCoverage() {
    this.assertNotFailed("getCoverage");
    return this.scenario.dataset.coverage;
  }

  private assertNotFailed(method: "getAccount" | "getHoldings" | "getTransactions" | "getDailyPnL" | "getCoverage"): void {
    const reason = this.scenario.methodFailures?.[method];
    if (reason) throw new Error(reason);
  }
}
