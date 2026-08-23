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
    account: state.account,
    portfolio: state.portfolio,
    assets: state.assets,
    allocationDrift,
    actions: state.actions,
    transactions: state.transactions,
    dailyPnl: state.dailyPnl,
    decisionRecords: state.decisionRecords,
    activeVersions: state.activeVersions,
    strategyRuleVersions: state.strategyRuleVersions,
    coverage: state.coverage,
    sourceCapture: state.latestSourceCapture?.payload,
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
  async function openChatGpt(): Promise<void> {
    // 不通过 URL 参数传递投资上下文：既避免长度/编码兼容问题，也避免敏感内容进入 URL 与浏览器历史。
    // 先同步打开页面，避免 await clipboard 后被浏览器判定为非用户手势而拦截弹窗。
    window.open("https://chatgpt.com/", "_blank", "noopener");
    try {
      await navigator.clipboard.writeText(fc.text);
      ElMessage.success("完整上下文已复制并打开 ChatGPT，请直接粘贴发送");
    } catch {
      ElMessage.warning("已打开 ChatGPT；自动复制失败，请在弹窗内手动复制后粘贴发送");
    }
  }

  return { fc, openFocused, openFull, copy, openChatGpt };
}
