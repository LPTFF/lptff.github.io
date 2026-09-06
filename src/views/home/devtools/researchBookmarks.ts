export const RESEARCH_BOOKMARKS_MARKDOWN_PATH = "/data/research-bookmarks.md";
export const MAX_BOOKMARKS_PER_ISSUE = 10;
export const MAX_BOOKMARK_FILE_SIZE = 10 * 1024 * 1024;

export interface BrowserBookmark {
  key: string;
  title: string;
  url: string;
}

export interface BrowserBookmarkImportResult {
  bookmarks: BrowserBookmark[];
  skipped: number;
  duplicates: number;
  truncated: boolean;
}

interface ResearchBookmarkIssueItem {
  url: string;
  title: string;
  researchGoal: string;
  tags: string[];
  status: "inbox";
}

const GITHUB_NEW_ISSUE_URL = "https://github.com/LPTFF/lptff.github.io/issues/new";
const ISSUE_START_MARKER = "<!-- research-bookmarks:start -->";
const ISSUE_END_MARKER = "<!-- research-bookmarks:end -->";
const MAX_IMPORTED_BOOKMARKS = 5_000;
const MAX_URL_LENGTH = 4_096;
const MAX_ISSUE_BODY_LENGTH = 60_000;
// Conservative product limit for the encoded URL; GitHub does not publish a fixed limit.
const MAX_PREFILLED_ISSUE_URL_LENGTH = 7_000;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const TRACKING_PARAMETERS = new Set(["fbclid", "gclid", "dclid", "msclkid", "mc_cid", "mc_eid"]);
const SENSITIVE_PARAMETER_PATTERN = /(?:^|[_-])(access[_-]?token|id[_-]?token|token|api[_-]?key|secret|client[_-]?secret|signature|credential|authorization|password|passwd)(?:$|[_-])/i;
const SENSITIVE_PARAMETER_EXACT = new Set([
  "key",
  "sig",
  "auth",
  "jwt",
  "awsaccesskeyid",
  "x-amz-signature",
  "x-amz-credential",
  "x-goog-signature",
  "x-goog-credential",
  "key-pair-id",
]);

function truncateText(value: string, maxLength: number): string {
  return Array.from(value).slice(0, maxLength).join("");
}

function sensitiveParameterName(url: URL): string | null {
  const parameterNames = [
    ...Array.from(url.searchParams.keys()),
    ...Array.from(new URLSearchParams(url.hash.replace(/^#/, "")).keys()),
  ];
  for (const rawName of parameterNames) {
    const name = rawName.trim().toLowerCase();
    if (SENSITIVE_PARAMETER_EXACT.has(name) || SENSITIVE_PARAMETER_PATTERN.test(name)) return rawName;
  }
  return null;
}

function parseIpv6Hostname(hostname: string): number[] | null {
  if (!hostname.includes(":")) return null;
  const halves = hostname.split("::");
  if (halves.length > 2) return null;
  const parseHalf = (value: string): number[] | null => {
    if (!value) return [];
    const parts = value.split(":");
    if (parts.some((part) => !/^[0-9a-f]{1,4}$/i.test(part))) return null;
    return parts.map((part) => Number.parseInt(part, 16));
  };
  const left = parseHalf(halves[0]);
  const right = parseHalf(halves[1] ?? "");
  if (!left || !right) return null;
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;
  return [...left, ...Array.from({ length: missing }, () => 0), ...right];
}

function isPrivateHostname(rawHostname: string): boolean {
  const hostname = rawHostname.toLocaleLowerCase().replace(/^\[|\]$/g, "").replace(/\.+$/, "");
  if (!hostname) return true;
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) return true;
  if ((!hostname.includes(".") && !hostname.includes(":")) || hostname.includes("%")) return true;

  const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const values = ipv4.slice(1).map(Number);
    if (values.some((value) => value > 255)) return true;
    const [first, second, third] = values;
    return first === 0
      || first === 10
      || first === 127
      || first >= 224
      || (first === 100 && second >= 64 && second <= 127)
      || (first === 169 && second === 254)
      || (first === 172 && second >= 16 && second <= 31)
      || (first === 192 && second === 168)
      || (first === 192 && second === 0 && third === 0)
      || (first === 192 && second === 0 && third === 2)
      || (first === 192 && second === 88 && third === 99)
      || (first === 198 && (second === 18 || second === 19 || (second === 51 && third === 100)))
      || (first === 203 && second === 0 && third === 113);
  }

  const ipv6 = parseIpv6Hostname(hostname);
  if (!ipv6) return hostname.includes(":");
  const [first, second] = ipv6;
  if ((first & 0xe000) !== 0x2000) return true;
  if (first === 0x2001 && second < 0x0200) return true;
  if (first === 0x2001 && second === 0x0db8) return true;
  return first === 0x3fff && second < 0x1000;
}

export function validateResearchUrl(rawValue: string): string {
  const value = rawValue.trim();
  if (!value) throw new Error("资料地址为空");
  if (value.length > MAX_URL_LENGTH) throw new Error("资料地址过长");
  if (CONTROL_CHARACTERS.test(value)) throw new Error("资料地址包含不可见字符");

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("资料地址格式无效");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("只允许 http 或 https 地址");
  if (url.username || url.password) throw new Error("地址包含账号或密码");
  if (isPrivateHostname(url.hostname)) throw new Error("地址不是公开网站");
  if (!url.hostname.startsWith("[")) url.hostname = url.hostname.replace(/\.+$/, "");

  const sensitiveName = sensitiveParameterName(url);
  if (sensitiveName) throw new Error(`地址包含疑似凭据参数「${sensitiveName}」`);

  const retainedParameters = new URLSearchParams();
  for (const [name, parameterValue] of url.searchParams.entries()) {
    const lowered = name.toLocaleLowerCase();
    if (!lowered.startsWith("utm_") && !TRACKING_PARAMETERS.has(lowered)) {
      retainedParameters.append(name, parameterValue);
    }
  }
  url.search = retainedParameters.toString();
  return url.toString();
}

function researchUrlIdentity(rawValue: string): string {
  const url = new URL(validateResearchUrl(rawValue));
  const identityPath = !url.search && !url.hash ? url.pathname.replace(/\/$/, "") : url.pathname;
  return JSON.stringify([
    url.protocol,
    url.hostname,
    url.port,
    identityPath,
    Array.from(url.searchParams.entries()),
    url.hash,
  ]);
}

export function parseBrowserBookmarksHtml(source: string): BrowserBookmarkImportResult {
  const document = new DOMParser().parseFromString(source, "text/html");
  const bookmarks: BrowserBookmark[] = [];
  const seen = new Set<string>();
  let skipped = 0;
  let duplicates = 0;
  let truncated = false;

  for (const anchor of Array.from(document.querySelectorAll("a[href]"))) {
    if (bookmarks.length >= MAX_IMPORTED_BOOKMARKS) {
      truncated = true;
      break;
    }
    const rawUrl = anchor.getAttribute("href") ?? "";
    try {
      const url = validateResearchUrl(rawUrl);
      const key = researchUrlIdentity(url);
      if (seen.has(key)) {
        duplicates += 1;
        continue;
      }
      seen.add(key);
      const title = truncateText((anchor.textContent ?? "").replace(/\s+/g, " ").trim(), 160);
      bookmarks.push({ key, url, title: title || new URL(url).hostname.replace(/^\[|\]$/g, "") });
    } catch {
      skipped += 1;
    }
  }

  return { bookmarks, skipped, duplicates, truncated };
}

function issueItems(bookmarks: BrowserBookmark[]): ResearchBookmarkIssueItem[] {
  return bookmarks.map((bookmark) => ({
    url: validateResearchUrl(bookmark.url),
    title: truncateText(bookmark.title.trim(), 160),
    researchGoal: "",
    tags: [],
    status: "inbox",
  }));
}

export function buildResearchBookmarksIssueBody(bookmarks: BrowserBookmark[]): string {
  if (!bookmarks.length) throw new Error("请先选择书签");
  if (bookmarks.length > MAX_BOOKMARKS_PER_ISSUE) {
    throw new Error(`每个 Issue 最多放 ${MAX_BOOKMARKS_PER_ISSUE} 条资料`);
  }
  const payload = { schemaVersion: 1 as const, bookmarks: issueItems(bookmarks) };
  const body = [
    "请在下方 JSON 中补充 researchGoal（研究目标）和 tags（标签）；status 可使用 inbox、researching 或 done。",
    "请保留两个同步标记、字段名和 JSON 格式。填写完成后直接创建 Issue，资料会在下一次网站 CI 构建时更新。",
    "",
    ISSUE_START_MARKER,
    JSON.stringify(payload, null, 2),
    ISSUE_END_MARKER,
  ].join("\n");
  if (body.length > MAX_ISSUE_BODY_LENGTH) throw new Error("所选资料内容过长，请减少条目后分批复制");
  return body;
}

export function buildResearchBookmarksIssueDraft(bookmarks: BrowserBookmark[]): {
  body: string;
  url: string;
  bodyPrefilled: boolean;
} {
  const body = buildResearchBookmarksIssueBody(bookmarks);
  const url = new URL(GITHUB_NEW_ISSUE_URL);
  url.searchParams.set("title", `[研究资料] 新增 ${bookmarks.length} 条收藏`);
  url.searchParams.set("body", body);
  const bodyPrefilled = url.toString().length <= MAX_PREFILLED_ISSUE_URL_LENGTH;
  if (!bodyPrefilled) url.searchParams.delete("body");
  return { body, url: url.toString(), bodyPrefilled };
}
