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

  // 多平台观察采集（金融/市场需求/娱乐）只允许扩展自己的 popup 页面启动。
  // 同一页面既可作为工具栏弹窗，也可固定成独立扩展标签页；两种形态的来源 URL
  // 完全相同，普通网页无法伪造 chrome-extension:// 来源。
  function observationCollectionOptions(message, sender, extensionOrigin) {
    const popupUrl = `${extensionOrigin}popup/popup.html`;
    const senderUrl = typeof sender?.url === "string" ? sender.url : "";
    const fromPopup = senderUrl === popupUrl;
    let fromDouyinFavoritePage = false;
    if (message?.platform === "douyin" && sender?.tab && senderUrl) {
      try {
        const url = new URL(senderUrl);
        fromDouyinFavoritePage = url.hostname === "www.douyin.com"
          && url.pathname === "/user/self"
          && url.searchParams.get("showTab") === "favorite_collection";
      } catch {
        fromDouyinFavoritePage = false;
      }
    }
    if (!fromPopup && !fromDouyinFavoritePage) throw new Error("采集只能从插件界面启动；抖音数据集也可从我的收藏页启动");
    return { fromPopup: !sender?.tab && fromPopup, fromExtensionTab: Boolean(sender?.tab) && fromPopup, fromDouyinFavoritePage };
  }

  function binanceCollectionOptions(_message, sender, extensionOrigin) {
    const popupUrl = `${extensionOrigin}popup/popup.html`;
    const senderUrl = typeof sender?.url === "string" ? sender.url : "";
    const fromPopup = senderUrl === popupUrl;
    let fromContractReviewPage = false;
    try {
      fromContractReviewPage = Boolean(sender?.tab) && /\/(?:contract-review)(?:\/|$)/.test(new URL(senderUrl).pathname);
    } catch {
      fromContractReviewPage = false;
    }
    if (!fromPopup && !fromContractReviewPage) throw new Error("只能从插件 popup 或合约复盘页面启动采集");
    return { fromPopup, fromContractReviewPage };
  }

  globalThis.LPTFFCollectionPolicy = Object.freeze({ collectionOptions, observationCollectionOptions, binanceCollectionOptions, summarizeCapture });
})();
