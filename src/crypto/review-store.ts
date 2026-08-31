import type { ContractReviewManagementState } from "./domain";
import { EMPTY_CONTRACT_RISK_RULES } from "./review-engine";

const STORAGE_KEY = "contract-review-management/1.0";

export function defaultContractReviewManagementState(): ContractReviewManagementState {
  return {
    rules: { ...EMPTY_CONTRACT_RISK_RULES },
    rulesConfirmed: false,
    acknowledgedFindingIds: [],
    conclusions: [],
    preflightHistory: [],
  };
}

export function loadContractReviewManagementState(): ContractReviewManagementState {
  const fallback = defaultContractReviewManagementState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<ContractReviewManagementState>;
    return {
      rules: { ...fallback.rules, ...(parsed.rules ?? {}) },
      rulesConfirmed: parsed.rulesConfirmed === true,
      acknowledgedFindingIds: Array.isArray(parsed.acknowledgedFindingIds)
        ? parsed.acknowledgedFindingIds.map(String)
        : [],
      conclusions: Array.isArray(parsed.conclusions) ? parsed.conclusions.slice(0, 50) : [],
      preflightHistory: Array.isArray(parsed.preflightHistory) ? parsed.preflightHistory.slice(0, 30) : [],
    };
  } catch {
    return fallback;
  }
}

export function saveContractReviewManagementState(state: ContractReviewManagementState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...state,
    conclusions: state.conclusions.slice(0, 50),
    preflightHistory: state.preflightHistory.slice(0, 30),
  }));
}
