export interface BlogArticle {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  summary: string;
  cover: string;
  sourcePath: string;
  legacyPaths: string[];
  content: string;
  component: () => Promise<unknown>;
}

export interface SearchResult {
  article: BlogArticle;
  snippet: string;
  matchedTerms: string[];
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}
