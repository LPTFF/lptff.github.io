/**
 * 深度分析上下文弹窗共享逻辑：聚焦单偏离 / 全量整体 两种模式，复制 + 一键跳转 ChatGPT。
 * 抽出自 ReviewView / PoliciesView / ActionsView 三处重复实现。
 */
import { reactive } from "vue";
import { ElMessage } from "element-plus";
import type { AllocationDrift, ContextPackageInput } from "./selectors";
import { buildFocusedDriftContextPackage, buildInvestmentContextPackage } from "./selectors";
import type { InvestmentOsState } from "./use-investment-os";

/** 从 OS state 构造 ContextPackageInput；allocationDrift 由调用方算好传入。 */
export function buildContextInput(state: InvestmentOsState, allocationDrift: AllocationDrift[] = []): ContextPackageInput {
  return {
    policies: state.policies,
    scope: state.activeScope,
    portfolio: state.portfolio,
    assets: state.assets,
    allocationDrift,
    actions: state.actions,
    transactions: state.transactions,
    decisionRecords: state.decisionRecords,
    activeVersions: state.activeVersions,
    strategyRuleVersions: state.strategyRuleVersions,
    coverage: state.coverage,
    asOf: new Date().toISOString().slice(0, 10),
    isSimulator: state.account?.source === "sim",
  };
}

export function directionText(direction: AllocationDrift["direction"]): string {
  return direction === "over" ? "超上限" : direction === "under" ? "低下限" : "区间内";
}

export function useFocusedContext() {
  const fc = reactive({ visible: false, text: "", label: "" });

  function openFocused(d: AllocationDrift, input: ContextPackageInput): void {
    fc.label = `深度分析：${d.label} · ${directionText(d.direction)}`;
    fc.text = buildFocusedDriftContextPackage(d, input).text;
    fc.visible = true;
  }
  function openFull(input: ContextPackageInput): void {
    fc.label = "整体组合深度分析";
    fc.text = buildInvestmentContextPackage(input).text;
    fc.visible = true;
  }
  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(fc.text);
      ElMessage.success("已复制，可粘贴到 ChatGPT 等模型");
    } catch {
      ElMessage.warning("复制失败，请在弹窗内手动选中复制");
    }
  }
  function openChatGpt(): void {
    const encoded = encodeURIComponent(fc.text);
    if (encoded.length > 6000) ElMessage.warning("上下文较长，ChatGPT 可能截断；若被截断请改用复制粘贴");
    window.open(`https://chatgpt.com/?q=${encoded}`, "_blank", "noopener");
  }

  return { fc, openFocused, openFull, copy, openChatGpt };
}