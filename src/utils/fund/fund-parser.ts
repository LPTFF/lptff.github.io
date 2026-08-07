/**
 * fund-parser：把上传的文件 / 文本解析为标准 FundData。
 * 仅依赖 fund-schema 的校验逻辑，纯前端运行。
 */
import { validateFundData, type FundData, type ValidationResult } from "./fund-schema";

/** 读取浏览器 File 对象为文本 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("文件读取失败"));
    reader.readAsText(file);
  });
}

/** 把 JSON 文本解析并校验为 FundData */
export function parseFundJson(text: string): ValidationResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (e) {
    return { ok: false, errors: [`JSON 解析失败：${(e as Error).message}`], data: null };
  }
  return validateFundData(json);
}

/** 直接解析 File */
export async function parseFundFile(file: File): Promise<ValidationResult> {
  const text = await readFileAsText(file);
  return parseFundJson(text);
}

/** 轻量判断 JSON 文本是否可能是 fund-data */
export function lookLikeFundData(text: string): boolean {
  return /"(holdings|account|transactions)"/.test(text);
}

export type { FundData };