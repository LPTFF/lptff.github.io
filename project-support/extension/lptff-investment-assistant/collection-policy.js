(() => {
  const SAFE_COVERAGE_DATASETS = new Set(["account", "fundDetails", "publicFunds", "transactions"]);

  function collectionOptions(_message, sender, extensionOrigin) {
    const popupUrl = `${extensionOrigin}popup/popup.html`;
    const senderUrl = typeof sender?.url === "string" ? sender.url : "";
    const fromPopup = !sender?.tab && senderUrl === popupUrl;
    let fromInvestmentPage = false;
    if (sender?.tab && senderUrl) {
      try {
        fromInvestmentPage = /\/(?:investment)(?:\/|$)/.test(new URL(senderUrl).pathname);
      } catch {
        fromInvestmentPage = false;
      }
    }
    if (!fromPopup && !fromInvestmentPage) throw new Error("只能从插件 popup 或 Investment 页面启动采集");
    return { fromPopup, fromInvestmentPage };
  }

  function summarizeCapture(capture) {
    const warningCounts = {
      account: 0,
      fundDetails: Array.isArray(capture?.fundDetails)
        ? capture.fundDetails.reduce((sum, item) => sum + (Array.isArray(item?.warnings) ? item.warnings.length : 0), 0)
        : 0,
      publicFunds: Array.isArray(capture?.publicFunds)
        ? capture.publicFunds.reduce((sum, item) => sum + (Array.isArray(item?.warnings) ? item.warnings.length : 0), 0)
        : 0,
      transactions: Array.isArray(capture?.transactionRanges)
        ? capture.transactionRanges.reduce((sum, item) => sum + (Array.isArray(item?.warnings) ? item.warnings.length : 0), 0)
        : 0,
    };
    const coverage = Array.isArray(capture?.coverage)
      ? capture.coverage.map((item) => ({
          dataset: SAFE_COVERAGE_DATASETS.has(item?.dataset) ? item.dataset : "other",
          completeness: ["complete", "partial", "unknown"].includes(item?.completeness)
            ? item.completeness
            : "unknown",
          warningCount: warningCounts[item?.dataset] || 0,
        }))
      : [];
    const transactionCount = Array.isArray(capture?.transactionRanges)
      ? capture.transactionRanges.reduce((sum, range) => sum + (range.pages || []).reduce((pageSum, page) => pageSum + (page.records || []).length, 0), 0)
      : 0;
    return {
      holdingCount: Array.isArray(capture?.holdings) ? capture.holdings.length : 0,
      transactionCount,
      coverage,
      totalMs: Number(capture?.metrics?.totalMs) || 0,
      temporaryTabPeak: Number(capture?.metrics?.temporaryTabPeak) || 0,
    };
  }

  globalThis.LPTFFCollectionPolicy = Object.freeze({ collectionOptions, summarizeCapture });
})();
