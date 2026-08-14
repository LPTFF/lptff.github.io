(() => {
  const SAFE_COVERAGE_DATASETS = new Set([
    "account",
    "portfolio",
    "holdings",
    "transactions",
    "dailyPnl",
    "assets",
    "nav",
    "fundDetail",
  ]);

  function collectionOptions(message, sender, extensionOrigin) {
    const popupUrl = `${extensionOrigin}popup/popup.html`;
    return {
      downloadBackup: Boolean(
        message?.downloadBackup === true
        && !sender?.tab
        && sender?.url === popupUrl,
      ),
    };
  }

  function persistencePlan(options) {
    return {
      stageDataset: true,
      downloadBackup: options?.downloadBackup === true,
    };
  }

  function summarizeDataset(dataset, backupDownloaded) {
    const coverage = Array.isArray(dataset?.coverage)
      ? dataset.coverage.map((item) => ({
          dataset: SAFE_COVERAGE_DATASETS.has(item?.dataset) ? item.dataset : "other",
          completeness: ["complete", "partial", "unknown", "failed"].includes(item?.completeness)
            ? item.completeness
            : "unknown",
          warningCount: Array.isArray(item?.warningCodes) ? item.warningCodes.length : 0,
        }))
      : [];
    return {
      holdingCount: Array.isArray(dataset?.portfolio?.holdings) ? dataset.portfolio.holdings.length : 0,
      transactionCount: Array.isArray(dataset?.transactions) ? dataset.transactions.length : 0,
      coverage,
      backupDownloaded: backupDownloaded === true,
    };
  }

  globalThis.LPTFFCollectionPolicy = Object.freeze({
    collectionOptions,
    persistencePlan,
    summarizeDataset,
  });
})();
