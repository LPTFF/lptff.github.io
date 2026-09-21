(() => {
  const PROTOCOL = "eastmoney-source-capture/1.0";
  const SENSITIVE_KEY = /(?:authorization|access[-_]?token|token|cookie|set[-_]?cookie|session(?:[-_]?id)?|password|secret|bank(?:card)?|cardNo|phone|mobile|email|identity|idCard|cert(?:ificate)?(?:No|Id)?|(?:user|customer|account)(?:Name|No|Id))/i;

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

  // 法律意义上的关键脱敏：只掩盖能定位到「某个账户/某张银行卡/某次交易」的个人识别信息，
  // 其余字段（基金代码、名称、金额、净值、日期、公开基金资料等）保留真实值，不破坏数据真实性。
  // 识别信息有两种出现形式：命名字段（id/traceNo/traceId/account/bkAcc）与表格单元格文本（如「关联支付账户」列），
  // 因此按「字段名 + 值模式」双重匹配。
  function desensitizeSource(capture) {
    const idMap = new Map();
    let seq = 0;
    function pseudo(value, prefix) {
      const source = String(value);
      if (!idMap.has(source)) {
        seq += 1;
        idMap.set(source, `${prefix}-${String(seq).padStart(4, "0")}`);
      }
      return idMap.get(source);
    }
    function mask(value, key) {
      if (Array.isArray(value)) return value.map((item) => mask(item, key));
      if (value && typeof value === "object") {
        return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, mask(item, name)]));
      }
      if (typeof value !== "string" || !value) return value;

      if (key === "traceNo" || key === "traceId") return pseudo(value, "TRACE");
      if (key === "account") return pseudo(value, "ACCT");

      // 银行卡/支付账户尾号：保留银行名，抹掉账号数字。覆盖 bkAcc 字段与表格单元格文本两种形式。
      if (/^(\S+?)\s*[|｜]\s*\d+$/.test(value)) {
        return value.replace(/^(\S+?)\s*[|｜]\s*\d+$/, "$1 | ****");
      }

      // 32 位十六进制交易/追踪标识：无论出现在哪个位置都匿名化。
      if (/^[0-9a-f]{32}$/i.test(value)) return pseudo(value, "TXN");

      // 命名字段兜底：非标准格式的 id / bkAcc 仍要脱敏。
      if (key === "id") return pseudo(value, "TXN");
      if (key === "bkAcc") return pseudo(value, "ACCT");

      return value;
    }
    return mask(capture, "$");
  }

  globalThis.LPTFFSourceCapture = Object.freeze({
    PROTOCOL,
    buildCapture,
    desensitizeSource,
  });
})();
