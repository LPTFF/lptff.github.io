(function attachPublicFundMetadata(root) {
  "use strict";

  const MARKET_SECTIONS = ["投资目标", "投资范围", "风险收益特征"];
  const MARKET_RULES = [
    {
      region: "美国",
      pattern: /主要投资(?:的境外市场)?(?:于|为)?美国(?:证券)?市场|主要投资美国纳斯达克交易所|主要投资于美国证券市场/,
    },
    {
      region: "中国香港",
      pattern: /主要投资(?:的境外市场)?(?:于|为)(?:中国)?香港(?:证券)?市场|主要投资于港股/,
    },
    {
      region: "中国内地",
      pattern: /主要投资于(?:中国)?境内证券市场|主要投资于A股市场/,
    },
    {
      region: "全球",
      pattern: /主要投资于全球(?:证券)?市场/,
    },
  ];

  function recordOf(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  /**
   * 从已采集的基金档案栏目中提取明确的主要投资市场。
   * 只保存地区和栏目名，不复制网页长正文，既可核验又不会扩大 Chrome 存储。
   */
  function marketEvidenceFromSections(rawSections) {
    const sections = recordOf(rawSections);
    const evidence = [];
    const seen = new Set();
    for (const sourceField of MARKET_SECTIONS) {
      const text = String(sections[sourceField] || "").replace(/\s+/g, " ").trim();
      if (!text) continue;
      for (const rule of MARKET_RULES) {
        if (!seen.has(rule.region) && rule.pattern.test(text)) {
          seen.add(rule.region);
          evidence.push({ region: rule.region, sourceField });
        }
      }
    }
    return evidence;
  }

  function enrichCapture(capture) {
    if (!capture || typeof capture !== "object") return capture;
    const publicFunds = Array.isArray(capture.publicFunds) ? capture.publicFunds : [];
    return {
      ...capture,
      publicFunds: publicFunds.map((fund) => {
        const marketEvidence = marketEvidenceFromSections(fund?.sections);
        return marketEvidence.length ? { ...fund, marketEvidence } : fund;
      }),
    };
  }

  root.LPTFFPublicFundMetadata = Object.freeze({
    enrichCapture,
    marketEvidenceFromSections,
  });
})(globalThis);
