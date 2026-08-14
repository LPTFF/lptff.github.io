(() => {
  function textOf(node) {
    return String(node?.textContent || "").replace(/\s+/g, " ").trim();
  }

  function labeledValue(label) {
    const header = Array.from(document.querySelectorAll("th")).find((node) => textOf(node) === label);
    const value = header?.nextElementSibling;
    return value?.tagName === "TD" ? textOf(value) : "";
  }

  function sectionValue(label) {
    const heading = Array.from(document.querySelectorAll("h4 .left, h4.t label")).find((node) => textOf(node) === label);
    const box = heading?.closest(".boxitem");
    return textOf(box?.querySelector("p"));
  }

  function codeOf() {
    const pathMatch = location.pathname.match(/_(\d{6})\.html$/i);
    if (pathMatch) return pathMatch[1];
    const textMatch = document.title.match(/\((\d{6})\)/);
    return textMatch ? textMatch[1] : "";
  }

  function collectProfile() {
    const fundCode = codeOf();
    const fundType = labeledValue("基金类型");
    const benchmark = labeledValue("业绩比较基准");
    const trackedIndexText = labeledValue("跟踪标的");
    const profile = {
      fundCode,
      fundName: labeledValue("基金简称") || undefined,
      fundType: fundType || undefined,
      benchmark: benchmark || undefined,
      trackedIndexText: trackedIndexText || undefined,
      investmentObjective: sectionValue("投资目标") || undefined,
      investmentScope: sectionValue("投资范围") || undefined,
      sourceUrl: location.href,
    };
    const observed = Boolean(fundCode && (fundType || benchmark || trackedIndexText));
    return observed
      ? { ok: true, data: profile }
      : { ok: false, error: "公开基金概况页未返回可识别字段" };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (
      message?.type !== "COLLECT_PUBLIC_FUND_PROFILE"
      && !(message?.type === "AUTO_COLLECT_PAGE" && message?.mode === "public-profile")
    ) return undefined;
    try {
      sendResponse(collectProfile());
    } catch (error) {
      sendResponse({
        ok: false,
        error: `公开基金概况读取失败：${error instanceof Error ? error.message : "未知错误"}`,
      });
    }
    return false;
  });
})();
