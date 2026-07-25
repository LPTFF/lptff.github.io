import type { BlogArticle, SearchResult } from "./types";

const normalize = (value: string) => value.toLocaleLowerCase().replace(/\s+/g, " ").trim();

const plainText = (value: string) => value
  .replace(/<[^>]+>/g, " ")
  .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
  .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
  .replace(/[#*_>`~-]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

export function searchArticles(articles: BlogArticle[], query: string): SearchResult[] {
  const terms = normalize(query).split(" ").filter(Boolean);
  if (!terms.length) return articles.map((article) => ({ article, snippet: article.summary, matchedTerms: [] }));

  return articles.flatMap((article) => {
    const searchable = normalize([
      article.title,
      article.summary,
      article.category,
      article.tags.join(" "),
      plainText(article.content),
    ].join(" "));
    const matchedTerms = terms.filter((term) => searchable.includes(term));
    if (matchedTerms.length !== terms.length) return [];

    const body = plainText(article.content);
    const firstTerm = matchedTerms.find((term) => body.includes(term)) || matchedTerms[0];
    const matchIndex = Math.max(0, body.indexOf(firstTerm));
    const start = Math.max(0, matchIndex - 55);
    const snippet = `${start > 0 ? "…" : ""}${body.slice(start, start + 180)}${start + 180 < body.length ? "…" : ""}`;
    return [{ article, snippet, matchedTerms }];
  });
}
