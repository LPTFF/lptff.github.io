/**
 * fund-storage：localStorage 持久化封装。
 * 基金数据完全由用户控制，不上传服务器。
 */
import type { FundData } from "./fund-schema";

const STORAGE_KEY = "fundData";

/** 读取已保存的基金数据，无数据返回 null */
export function loadFundData(): FundData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as FundData;
    if (!obj || typeof obj !== "object") return null;
    return obj;
  } catch {
    return null;
  }
}

/** 保存基金数据到 localStorage */
export function saveFundData(data: FundData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** 清空基金数据 */
export function clearFundData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** 是否已存在数据 */
export function hasFundData(): boolean {
  return !!localStorage.getItem(STORAGE_KEY);
}