import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fetchText } from "../lib/http.js";
import { writeDatasetAtomically } from "../lib/output.js";
import { validateDataset } from "../lib/validate.js";
import { buildDataset, collectRss } from "../rss/collect.js";
import { parseFeed } from "../rss/parse.js";

const generatedAt = "2026-07-30T12:00:00.000Z";
const rssFixture = `<?xml version="1.0"?><rss version="2.0"><channel><item><title>Older</title><link>https://example.com/older</link><pubDate>2026-07-29T10:00:00Z</pubDate></item><item><title>Shared</title><link>https://example.com/shared</link><pubDate>2026-07-30T10:00:00Z</pubDate></item></channel></rss>`;
const atomFixture = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Newest</title><link href="https://example.com/newest" rel="alternate"/><updated>2026-07-30T11:00:00Z</updated></entry><entry><title>Shared duplicate</title><link href="https://example.com/shared"/><updated>2026-07-30T10:00:00Z</updated></entry></feed>`;
const mixedSafetyRssFixture = `<?xml version="1.0"?><rss version="2.0"><channel><item><title>Safe</title><link>https://example.com/safe</link><pubDate>2026-07-30T11:00:00Z</pubDate></item><item><title>HTTP</title><link>http://example.com/http</link><pubDate>2026-07-30T10:00:00Z</pubDate></item><item><title>Credentials</title><link>https://user:password@example.com/private</link><pubDate>2026-07-30T09:00:00Z</pubDate></item><item><title>Malformed</title><link>not-a-url</link><pubDate>2026-07-30T08:00:00Z</pubDate></item></channel></rss>`;
const mixedSafetyAtomFixture = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Safe Atom</title><link href="https://example.com/safe-atom"/><updated>2026-07-30T11:00:00Z</updated></entry><entry><title>HTTP Atom</title><link href="http://example.com/http-atom"/><updated>2026-07-30T10:00:00Z</updated></entry></feed>`;

function validDataset() {
  return buildDataset([
    parseFeed(rssFixture, "Hacker News", generatedAt),
    parseFeed(atomFixture, "美团技术团队", generatedAt),
  ], generatedAt);
}

test("RSS and Atom feeds normalize, deduplicate and sort", () => {
  const dataset = validDataset();

  assert.deepEqual(dataset.items.map((item) => item.title), ["Newest", "Shared", "Older"]);
  assert.equal(dataset.items[0].pubDate, "2026-07-30T11:00:00.000Z");
  assert.equal(dataset.items.every((item) => item.filteredAt === generatedAt), true);
  assert.doesNotThrow(() => validateDataset(dataset, { now: new Date(generatedAt) }));
});

test("RSS and Atom feeds skip unsafe article links", () => {
  assert.deepEqual(
    parseFeed(mixedSafetyRssFixture, "Hacker News", generatedAt).map((item) => item.title),
    ["Safe"],
  );
  assert.deepEqual(
    parseFeed(mixedSafetyAtomFixture, "美团技术团队", generatedAt).map((item) => item.title),
    ["Safe Atom"],
  );
});

test("unsupported and empty feeds fail validation", () => {
  assert.throws(() => parseFeed("<html><body>error</body></html>", "broken", generatedAt), /Unsupported feed format/);

  const dataset = validDataset();
  dataset.items = [];
  assert.throws(() => validateDataset(dataset, { now: new Date(generatedAt) }), /item count/);
});

test("non-HTTPS URLs, duplicate links and sensitive fields are rejected", () => {
  const insecure = validDataset();
  insecure.items[0].link = "http://example.com/insecure";
  assert.throws(() => validateDataset(insecure, { now: new Date(generatedAt) }), /credential-free HTTPS URL/);

  const duplicate = validDataset();
  duplicate.items[1].link = duplicate.items[0].link;
  assert.throws(() => validateDataset(duplicate, { now: new Date(generatedAt) }), /Duplicate item link/);

  const sensitive = validDataset();
  sensitive.items[0].apiToken = "not-allowed";
  assert.throws(() => validateDataset(sensitive, { now: new Date(generatedAt) }), /Sensitive field/);
});

test("HTTP client enforces host, content type, size and bounded retries", async () => {
  await assert.rejects(
    fetchText("http://allowed.example/feed", { allowedHostnames: ["allowed.example"] }),
    /only allows HTTPS/,
  );

  await assert.rejects(
    fetchText("https://user:password@allowed.example/feed", { allowedHostnames: ["allowed.example"] }),
    /must not contain credentials/,
  );

  await assert.rejects(
    fetchText("https://not-allowed.example/feed", { allowedHostnames: ["allowed.example"] }),
    /not allowlisted/,
  );

  let attempts = 0;
  const result = await fetchText("https://allowed.example/feed", {
    allowedHostnames: ["allowed.example"],
    fetchImpl: async () => {
      attempts += 1;
      if (attempts === 1) return new Response("retry", { status: 503 });
      return new Response("<rss />", { headers: { "content-type": "application/rss+xml" } });
    },
    retries: 1,
    retryDelayMs: 0,
    sleep: async () => {},
  });
  assert.equal(result, "<rss />");
  assert.equal(attempts, 2);

  await assert.rejects(
    fetchText("https://allowed.example/feed", {
      allowedHostnames: ["allowed.example"],
      fetchImpl: async () => new Response("<html />", { headers: { "content-type": "text/html" } }),
      retries: 0,
    }),
    /Unexpected content type/,
  );

  await assert.rejects(
    fetchText("https://allowed.example/feed", {
      allowedHostnames: ["allowed.example"],
      fetchImpl: async () => new Response("too large", { headers: { "content-type": "text/xml" } }),
      maxBytes: 2,
      retries: 0,
    }),
    /exceeds 2 bytes/,
  );
});

test("valid output atomically replaces an existing artifact", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "collector-valid-output-"));
  const outputPath = path.join(directory, "dataset.json");
  await writeFile(outputPath, "previous-valid-artifact\n", "utf8");

  const dataset = validDataset();
  await writeDatasetAtomically(
    outputPath,
    dataset,
    (value) => validateDataset(value, { now: new Date(generatedAt) }),
  );

  assert.deepEqual(JSON.parse(await readFile(outputPath, "utf8")), dataset);
  await rm(directory, { recursive: true, force: true });
});

test("invalid output never replaces the previous valid artifact", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "collector-output-"));
  const outputPath = path.join(directory, "dataset.json");
  const original = "previous-valid-artifact\n";
  await writeFile(outputPath, original, "utf8");

  const invalid = validDataset();
  invalid.items = [];

  await assert.rejects(
    writeDatasetAtomically(outputPath, invalid, (dataset) => validateDataset(dataset, { now: new Date(generatedAt) })),
    /item count/,
  );
  assert.equal(await readFile(outputPath, "utf8"), original);
  await rm(directory, { recursive: true, force: true });
});

test("collector skips unsafe entries without dropping the source", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "collector-rss-unsafe-entry-"));
  const outputPath = path.join(directory, "dataset.json");

  const dataset = await collectRss({
    fetchFeed: async (source) => source.name === "Hacker News" ? mixedSafetyRssFixture : mixedSafetyAtomFixture,
    generatedAt,
    outputPath,
  });

  assert.deepEqual(dataset.sources.map((source) => source.name), ["Hacker News", "美团技术团队"]);
  assert.deepEqual(dataset.items.map((item) => item.title), ["Safe", "Safe Atom"]);
  assert.doesNotThrow(() => validateDataset(dataset, { now: new Date(generatedAt) }));
  assert.deepEqual(JSON.parse(await readFile(outputPath, "utf8")), dataset);
  await rm(directory, { recursive: true, force: true });
});

test("collector keeps successful sources when one source fails", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "collector-rss-partial-"));
  const outputPath = path.join(directory, "dataset.json");
  const sourceErrors = [];

  const dataset = await collectRss({
    fetchFeed: async (source) => {
      if (source.name === "Hacker News") throw new Error("temporary outage");
      return atomFixture;
    },
    generatedAt,
    onSourceError: (source, error) => sourceErrors.push(`${source.name}: ${error.message}`),
    outputPath,
  });

  assert.deepEqual(dataset.sources.map((source) => source.name), ["美团技术团队"]);
  assert.equal(dataset.items.length, 2);
  assert.deepEqual(sourceErrors, ["Hacker News: temporary outage"]);
  assert.doesNotThrow(() => validateDataset(dataset, { now: new Date(generatedAt) }));
  await rm(directory, { recursive: true, force: true });
});

test("collector fails without replacing output when all sources fail", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "collector-rss-total-failure-"));
  const outputPath = path.join(directory, "dataset.json");
  const original = "previous-valid-artifact\n";
  await writeFile(outputPath, original, "utf8");

  await assert.rejects(
    collectRss({
      fetchFeed: async () => { throw new Error("temporary outage"); },
      generatedAt,
      onSourceError: () => {},
      outputPath,
    }),
    /All RSS sources failed/,
  );
  assert.equal(await readFile(outputPath, "utf8"), original);
  await rm(directory, { recursive: true, force: true });
});

test("collector writes a validated candidate without network access", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "collector-rss-"));
  const outputPath = path.join(directory, "dataset.json");
  const fixtures = new Map([
    ["Hacker News", rssFixture],
    ["美团技术团队", atomFixture],
  ]);

  const dataset = await collectRss({
    fetchFeed: async (source) => fixtures.get(source.name),
    generatedAt,
    outputPath,
  });

  assert.equal(dataset.items.length, 3);
  assert.deepEqual(JSON.parse(await readFile(outputPath, "utf8")), dataset);
  await rm(directory, { recursive: true, force: true });
});
