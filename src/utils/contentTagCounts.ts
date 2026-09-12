const aliases: Record<string, string> = { vps: "VPS", github: "GitHub", bilibili: "Bilibili", gemini: "Gemini", "amd epyc": "AMD EPYC", cn2gia: "CN2 GIA", "cn2 gia": "CN2 GIA" };
export function normalizedTag(value: unknown): string {
  if (typeof value !== "string") return "";
  const text = value.trim().replace(/\s+/g, " ");
  return aliases[text.toLowerCase()] || text;
}
export function contentTags(item: any): string[] {
  const category = normalizedTag(item.ecosystem?.category);
  return [...new Set<string>((Array.isArray(item.ecosystem?.signals) ? item.ecosystem.signals : []).map(normalizedTag).filter((s: string) => s && s !== category))];
}
export function allContentCategories(item: any): string[] {
  return [...new Set([normalizedTag(item.ecosystem?.category), ...contentTags(item)].filter(Boolean))];
}
export function countContentTags(items: any[], includeCategory = false): Map<string, number> {
  const byItem = new Map<string, Set<string>>();
  items.forEach((item, index) => {
    const id = String(item.link || item.url || item.detailUrl || `index:${index}`);
    const tags = byItem.get(id) || new Set<string>();
    (includeCategory ? allContentCategories(item) : contentTags(item)).forEach(tag => tags.add(tag));
    byItem.set(id, tags);
  });
  const counts = new Map<string, number>();
  for (const tags of byItem.values()) for (const tag of tags) counts.set(tag, (counts.get(tag) || 0) + 1);
  return counts;
}
