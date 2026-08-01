import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchText } from "../lib/http.js";
import { writeDatasetAtomically } from "../lib/output.js";
import { validateDataset } from "../lib/validate.js";
import { RSS_ALLOWED_HOSTNAMES, RSS_SOURCES } from "./config.js";
import { parseFeed } from "./parse.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(currentDirectory, "../../..");
const defaultOutputPath = path.join(repositoryRoot, ".artifacts/collectors/rss/public-rss-articles.json");
const fixtureDirectory = path.join(repositoryRoot, "scripts/collectors/fixtures/rss");

function parseArguments(argumentsList) {
  const options = {
    fixture: false,
    outputPath: defaultOutputPath,
  };

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--fixture") {
      options.fixture = true;
    } else if (argument === "--output") {
      options.outputPath = path.resolve(argumentsList[index + 1]);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return options;
}

async function loadFixture(source) {
  const fileName = source.name === "Hacker News" ? "rss.xml" : "atom.xml";
  return readFile(path.join(fixtureDirectory, fileName), "utf8");
}

export function buildDataset(
  sourceResults,
  generatedAt = new Date().toISOString(),
  sources = RSS_SOURCES,
) {
  const itemsByLink = new Map();
  for (const items of sourceResults) {
    for (const item of items) {
      if (!itemsByLink.has(item.link)) itemsByLink.set(item.link, item);
    }
  }

  const items = [...itemsByLink.values()]
    .sort((left, right) => Date.parse(right.pubDate) - Date.parse(left.pubDate));

  return {
    schemaVersion: 1,
    dataset: "public-rss-articles",
    generatedAt,
    sources: sources.map(({ name, url }) => ({ name, url })),
    items,
  };
}

export async function collectRss({
  fetchFeed = (source) => fetchText(source.url, { allowedHostnames: RSS_ALLOWED_HOSTNAMES }),
  generatedAt = new Date().toISOString(),
  onSourceError = (source, error) => console.warn(`Skipped RSS source ${source.name}: ${error.message}`),
  outputPath = defaultOutputPath,
} = {}) {
  const sourceResults = [];
  const successfulSources = [];
  for (const source of RSS_SOURCES) {
    try {
      const xml = await fetchFeed(source);
      sourceResults.push(parseFeed(xml, source.name, generatedAt));
      successfulSources.push(source);
    } catch (error) {
      onSourceError(source, error);
    }
  }

  if (successfulSources.length === 0) {
    throw new Error("All RSS sources failed");
  }

  const dataset = buildDataset(sourceResults, generatedAt, successfulSources);
  await writeDatasetAtomically(
    outputPath,
    dataset,
    (value) => validateDataset(value, { now: new Date(generatedAt) }),
  );
  return dataset;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const dataset = await collectRss({
    fetchFeed: options.fixture ? loadFixture : undefined,
    outputPath: options.outputPath,
  });
  console.info(`Collected ${dataset.items.length} RSS items from ${dataset.sources.length} sources.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`RSS collection failed: ${error.message}`);
    process.exitCode = 1;
  });
}
