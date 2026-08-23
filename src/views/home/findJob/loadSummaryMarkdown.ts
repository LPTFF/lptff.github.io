import fullSummaryUrl from "./full.md?url";
import chainSummaryUrl from "./chain.md?url";

export const SUMMARY_MD = {
  full: fullSummaryUrl,
  chain: chainSummaryUrl,
} as const;

export async function fetchSummaryMarkdown(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`加载文档失败 (${response.status})`);
  }
  return response.text();
}
