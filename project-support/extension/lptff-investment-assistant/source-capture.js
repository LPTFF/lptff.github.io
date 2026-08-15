(() => {
  const PROTOCOL = "eastmoney-source-capture/1.0";
  const SENSITIVE_KEY = /(?:authorization|access[-_]?token|token|cookie|set[-_]?cookie|session(?:[-_]?id)?|password|secret|bank(?:card)?|cardNo|phone|mobile|email|identity|idCard|cert(?:ificate)?(?:No|Id)?|(?:user|customer|account)(?:Name|No|Id))/i;
  const CODE_KEY = /^(?:fund|product|asset)?code$/i;
  const NAME_KEY = /^(?:fund|product|asset)?name$/i;
  const ID_KEY = /(?:^id$|Id$|No$|serial|order)/i;
  const DATE_KEY = /(?:date|time|At$|JZRQ)/i;
  const FINANCIAL_KEY = /(?:amount|asset|profit|pnl|value|shares?|nav|count|cost|rate|percent|weight|ZJZBL)/i;
  const SAFE_TEXT_KEY = /(?:type|status|unit|currency|business|dataset|completeness|method|path|contentType|className|protocol|source|key)/i;
  const MAX_SAMPLE_ARRAY = 2;

  function safeValue(value, key = "") {
    if (SENSITIVE_KEY.test(key)) return undefined;
    if (Array.isArray(value)) return value.map((item) => safeValue(item)).filter((item) => item !== undefined);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value)
        .filter(([name]) => !SENSITIVE_KEY.test(name))
        .map(([name, item]) => [name, safeValue(item, name)])
        .filter(([, item]) => item !== undefined));
    }
    return value;
  }

  function uniqueText(values) {
    return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
  }

  function buildCapture(input) {
    const warnings = uniqueText([
      ...(input.warnings || []),
      ...(input.fundDetails || []).flatMap((item) => item.warnings || []),
      ...(input.publicFunds || []).flatMap((item) => item.warnings || []),
      ...(input.transactionRanges || []).flatMap((item) => item.warnings || []),
    ]);
    return safeValue({
      protocol: PROTOCOL,
      source: "1234567",
      capturedAt: input.capturedAt || new Date().toISOString(),
      account: input.account,
      holdings: input.holdings || [],
      fundDetails: input.fundDetails || [],
      publicFunds: input.publicFunds || [],
      transactionRanges: input.transactionRanges || [],
      coverage: input.coverage || [],
      warnings,
      metrics: input.metrics || {},
    });
  }

  function inventoryOf(value) {
    const inventory = new Map();
    function visit(item, path) {
      const type = item === null ? "null" : Array.isArray(item) ? "array" : typeof item;
      const key = path || "$";
      if (!inventory.has(key)) inventory.set(key, new Set());
      inventory.get(key).add(type);
      if (Array.isArray(item)) {
        item.forEach((child) => visit(child, `${key}[]`));
      } else if (item && typeof item === "object") {
        Object.entries(item).forEach(([name, child]) => visit(child, key === "$" ? name : `${key}.${name}`));
      }
    }
    visit(value, "$");
    return [...inventory.entries()]
      .map(([path, types]) => ({ path, types: [...types].sort() }))
      .sort((a, b) => a.path.localeCompare(b.path));
  }

  function stableNumber(seed, key, value) {
    if (/pageNum|pageSize|expectedPages|requestCount|warningCount/i.test(key)) {
      return Math.max(1, Math.min(2, Number(value) || 1));
    }
    if (/totalCount|fundCount|holdingCount|transactionCount/i.test(key)) {
      return Math.max(1, Math.min(12, Number(value) || 1));
    }
    const sign = Number(value) < 0 ? -1 : 1;
    if (/rate|percent|weight|ZJZBL/i.test(key)) return sign * (5 + (seed % 4) * 7.5);
    if (/nav/i.test(key)) return Number((0.8 + (seed % 7) * 0.17).toFixed(4));
    if (/shares?/i.test(key)) return sign * (100 + (seed % 8) * 25);
    if (FINANCIAL_KEY.test(key)) return sign * (1000 + (seed % 9) * 500);
    return Number.isInteger(value) ? seed % 5 : Number((0.1 + (seed % 9) * 0.1).toFixed(2));
  }

  function createDevelopmentSample(capture) {
    const codeMap = new Map();
    const nameMap = new Map();
    const idMap = new Map();
    let seed = 0;

    function mapped(map, value, prefix, width = 2) {
      const source = String(value || "");
      if (!map.has(source)) map.set(source, `${prefix}${String(map.size + 1).padStart(width, "0")}`);
      return map.get(source);
    }

    function sampleValue(value, key = "", path = "$") {
      seed += 1;
      if (SENSITIVE_KEY.test(key)) return undefined;
      if (Array.isArray(value)) {
        return value.slice(0, MAX_SAMPLE_ARRAY).map((item, index) => sampleValue(item, key, `${path}[${index}]`));
      }
      if (value && typeof value === "object") {
        return Object.fromEntries(Object.entries(value)
          .filter(([name]) => !SENSITIVE_KEY.test(name))
          .map(([name, item]) => [name, sampleValue(item, name, `${path}.${name}`)])
          .filter(([, item]) => item !== undefined));
      }
      if (typeof value === "number") return stableNumber(seed, key, value);
      if (typeof value === "boolean" || value === null || value === undefined) return value;
      const text = String(value);
      if (CODE_KEY.test(key) || /^\d{6}$/.test(text)) return mapped(codeMap, text, "9000");
      if (NAME_KEY.test(key)) return mapped(nameMap, text, "样本基金");
      if (ID_KEY.test(key)) return mapped(idMap, text, "sample-id-");
      if (DATE_KEY.test(key) || /^20\d{2}[-/.年]/.test(text)) return /T|:\d{2}/.test(text) ? "2025-01-15T10:00:00.000Z" : "2025-01-15";
      if (/url/i.test(key)) return "https://example.invalid/sample";
      if (/^[-+]?\d[\d,.]*\s*%?$/.test(text)) {
        const sampledNumber = stableNumber(seed, key, Number(text.replace(/,/g, "").replace(/%$/, "")));
        return `${sampledNumber}${/%$/.test(text) ? "%" : ""}`;
      }
      if (SAFE_TEXT_KEY.test(key)) {
        return text
          .replace(/(?<!\d)\d{6}(?!\d)/g, (code) => mapped(codeMap, code, "9000"))
          .replace(/20\d{2}[年./-]\d{1,2}(?:[月./-]\d{1,2}日?)?/g, "2025-01-15")
          .slice(0, 80);
      }
      if (!text) return text;
      return `样本文本:${path.split(".").pop()}`;
    }

    const counts = {
      holdingCount: Array.isArray(capture?.holdings) ? capture.holdings.length : 0,
      fundDetailCount: Array.isArray(capture?.fundDetails) ? capture.fundDetails.length : 0,
      publicFundCount: Array.isArray(capture?.publicFunds) ? capture.publicFunds.length : 0,
      transactionRangeCount: Array.isArray(capture?.transactionRanges) ? capture.transactionRanges.length : 0,
      transactionCount: Array.isArray(capture?.transactionRanges)
        ? capture.transactionRanges.reduce((sum, range) => sum + (range.pages || []).reduce((pageSum, page) => pageSum + (page.records || []).length, 0), 0)
        : 0,
    };
    const fieldInventory = inventoryOf(capture);
    const sampled = sampleValue(capture);
    return {
      ...sampled,
      capturedAt: "2025-01-15T10:00:00.000Z",
      sampleMeta: {
        sanitized: true,
        generatedFrom: PROTOCOL,
        arrayLimit: MAX_SAMPLE_ARRAY,
        originalCounts: counts,
        fieldCount: fieldInventory.length,
        fieldInventory,
      },
    };
  }

  function validateDevelopmentSample(sample) {
    const errors = [];
    function visit(value, key = "", path = "$") {
      if (SENSITIVE_KEY.test(key)) errors.push(`${path}: sensitive key`);
      if (Array.isArray(value)) {
        if (value.length > MAX_SAMPLE_ARRAY && path !== "$.sampleMeta.fieldInventory") errors.push(`${path}: array too large`);
        value.forEach((item, index) => visit(item, key, `${path}[${index}]`));
      } else if (value && typeof value === "object") {
        Object.entries(value).forEach(([name, item]) => visit(item, name, `${path}.${name}`));
      } else if (typeof value === "string") {
        if (CODE_KEY.test(key) && !/^9000\d{2}$/.test(value)) errors.push(`${path}: unmasked code`);
        if (NAME_KEY.test(key) && !/^样本基金\d{2}$/.test(value)) errors.push(`${path}: unmasked name`);
      }
    }
    if (sample?.protocol !== PROTOCOL) errors.push("$: unsupported protocol");
    if (sample?.sampleMeta?.sanitized !== true) errors.push("$: missing sanitized marker");
    visit(sample);
    return { ok: errors.length === 0, errors, fieldCount: sample?.sampleMeta?.fieldCount || 0 };
  }

  globalThis.LPTFFSourceCapture = Object.freeze({
    PROTOCOL,
    buildCapture,
    createDevelopmentSample,
    validateDevelopmentSample,
  });
})();
