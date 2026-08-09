import { XMLParser } from "fast-xml-parser";
import { isPublicHttpsUrl } from "../lib/validate.js";

const parser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  trimValues: true,
});

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function asText(value) {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (!value || typeof value !== "object") return "";
  return asText(value["#text"] ?? value.__cdata ?? value.href ?? "");
}

function rssLink(value) {
  for (const candidate of asArray(value)) {
    const link = asText(candidate);
    if (link) return link;
  }
  return "";
}

function atomLink(value) {
  const links = asArray(value);
  const alternate = links.find((link) => link?.["@_rel"] === "alternate") ?? links[0];
  return asText(alternate?.["@_href"] ?? alternate);
}

function normalizeDate(value) {
  const timestamp = Date.parse(asText(value));
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
}

export function parseFeed(xml, sourceName, filteredAt) {
  let document;
  try {
    document = parser.parse(xml);
  } catch (error) {
    throw new Error(`Unable to parse feed for ${sourceName}: ${error.message}`);
  }

  let entries = [];
  let format = "";
  if (document?.rss?.channel) {
    entries = asArray(document.rss.channel.item);
    format = "rss";
  } else if (document?.feed) {
    entries = asArray(document.feed.entry);
    format = "atom";
  } else {
    throw new Error(`Unsupported feed format for ${sourceName}`);
  }

  return entries.map((entry) => ({
    title: asText(entry.title),
    link: format === "rss" ? rssLink(entry.link) : atomLink(entry.link),
    pubDate: normalizeDate(entry.pubDate ?? entry.published ?? entry.updated),
    source: sourceName,
    filteredAt,
  })).filter((item) => item.title && isPublicHttpsUrl(item.link) && item.pubDate);
}
