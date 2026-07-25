import type { BlogArticle } from "./types";

interface Frontmatter {
  title: string;
  date: string;
  slug: string;
  category: string;
  tags: string[];
  summary: string;
  cover: string;
  legacyPaths: string[];
}

const markdownModules = import.meta.glob("../../../study/notebook/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const componentModules = import.meta.glob("../../../study/notebook/**/*.md") as Record<string, () => Promise<unknown>>;

function parseFrontmatter(source: string): { metadata: Frontmatter; content: string } {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) throw new Error("博客文章缺少 frontmatter");
  const values: Record<string, string | string[]> = {};
  let currentList: string[] | undefined;
  for (const line of match[1].split(/\r?\n/)) {
    const listItem = line.match(/^\s+-\s+["']?(.*?)["']?\s*$/);
    if (listItem && currentList) { currentList.push(listItem[1]); continue; }
    const item = line.match(/^([\w-]+):\s*(.*)$/);
    if (!item) continue;
    const [, key, raw] = item;
    if (!raw.trim()) { currentList = []; values[key] = currentList; continue; }
    currentList = undefined;
    if (raw.startsWith("[")) values[key] = raw.slice(1, -1).split(",").map((value) => value.trim().replace(/^['"]|['"]$/g, ""));
    else values[key] = raw.trim().replace(/^['"]|['"]$/g, "");
  }
  const required = ["title", "date", "slug", "category", "summary", "cover"];
  for (const key of required) if (typeof values[key] !== "string" || !values[key]) throw new Error(`博客文章元数据缺少 ${key}`);
  return {
    metadata: {
      title: values.title as string,
      date: values.date as string,
      slug: values.slug as string,
      category: values.category as string,
      tags: (values.tags as string[] | undefined) || [],
      summary: values.summary as string,
      cover: values.cover as string,
      legacyPaths: (values.legacyPaths as string[] | undefined) || [],
    },
    content: match[2],
  };
}

const articleEntries = Object.entries(markdownModules).map(([sourcePath, source]) => {
  const { metadata, content } = parseFrontmatter(source);
  return { ...metadata, sourcePath, content, component: componentModules[sourcePath] } as BlogArticle;
});

const seenSlugs = new Set<string>();
for (const article of articleEntries) {
  if (seenSlugs.has(article.slug)) throw new Error(`博客文章 slug 重复: ${article.slug}`);
  seenSlugs.add(article.slug);
}

export const articles = articleEntries.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
export const articlesBySlug = new Map(articles.map((article) => [article.slug, article]));
export const articlesByLegacyPath = new Map(
  articles.flatMap((article) => article.legacyPaths.map((path) => [normalizeLegacyPath(path), article] as const)),
);

export function normalizeLegacyPath(path: string) {
  let normalized = decodeURIComponent(path).replace(/\\/g, "/");
  normalized = normalized.replace(/\/index\.html?$/, "").replace(/\.html?$/, "").replace(/\/$/, "");
  return normalized || "/";
}

export function getArticle(slug: string) { return articlesBySlug.get(slug); }
export function getYearArticles(year: string) { return articles.filter((article) => article.date.startsWith(year)); }
export function getCategoryArticles(category: string) { return articles.filter((article) => article.category === category); }
