/**
 * 静态文档放在 public/findJob-summary/（full.md / chain.md）
 * 注意：不能使用 /data 前缀，vite.config 里 /data 会代理到远程服务器
 */
const SUMMARY_BASE = `${import.meta.env.BASE_URL}findJob-summary/`;

export const SUMMARY_MD = {
  full: `${SUMMARY_BASE}full.md`,
  chain: `${SUMMARY_BASE}chain.md`,
} as const;

export async function fetchSummaryMarkdown(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`加载文档失败 (${response.status})，请确认已执行 npm run serve 或 build 前的同步脚本`);
  }
  return response.text();
}
