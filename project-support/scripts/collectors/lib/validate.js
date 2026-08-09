const SENSITIVE_FIELD_PATTERN = /(authorization|cookie|password|passwd|secret|token|api[-_]?key|private[-_]?key)/i;
const SENSITIVE_VALUE_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /\b(?:bearer|basic)\s+[a-z0-9._~+/=-]{12,}/i,
  /\b(?:password|passwd|secret|token|api[-_]?key)\s*[:=]\s*\S+/i,
];

function parseDate(value, label) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    throw new Error(`${label} must be a valid date`);
  }
  return timestamp;
}

export function isPublicHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

function assertPublicHttpsUrl(value, label) {
  try {
    new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL`);
  }

  if (!isPublicHttpsUrl(value)) {
    throw new Error(`${label} must be a credential-free HTTPS URL`);
  }
}

function assertNoSensitiveContent(value, path = "dataset") {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoSensitiveContent(entry, `${path}[${index}]`));
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      if (SENSITIVE_FIELD_PATTERN.test(key)) {
        throw new Error(`Sensitive field is not allowed: ${path}.${key}`);
      }
      assertNoSensitiveContent(entry, `${path}.${key}`);
    }
    return;
  }

  if (typeof value === "string" && SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(value))) {
    throw new Error(`Sensitive-looking value is not allowed: ${path}`);
  }
}

export function validateDataset(dataset, {
  maxAgeHours = 24,
  maxBytes = 2_000_000,
  maxItems = 500,
  minItems = 1,
  now = new Date(),
} = {}) {
  if (!dataset || typeof dataset !== "object" || Array.isArray(dataset)) {
    throw new Error("Dataset must be an object");
  }

  if (dataset.schemaVersion !== 1) {
    throw new Error("Unsupported dataset schemaVersion");
  }

  if (typeof dataset.dataset !== "string" || dataset.dataset.length === 0) {
    throw new Error("Dataset name is required");
  }

  const generatedAt = parseDate(dataset.generatedAt, "generatedAt");
  const ageMs = now.getTime() - generatedAt;
  if (ageMs < -5 * 60 * 1000 || ageMs > maxAgeHours * 60 * 60 * 1000) {
    throw new Error("Dataset generatedAt is outside the allowed freshness window");
  }

  if (!Array.isArray(dataset.sources) || dataset.sources.length === 0) {
    throw new Error("Dataset sources are required");
  }

  const sourceNames = new Set();
  for (const [index, source] of dataset.sources.entries()) {
    if (!source || typeof source.name !== "string" || source.name.length === 0) {
      throw new Error(`sources[${index}].name is required`);
    }
    if (sourceNames.has(source.name)) {
      throw new Error(`Duplicate source name: ${source.name}`);
    }
    sourceNames.add(source.name);
    assertPublicHttpsUrl(source.url, `sources[${index}].url`);
  }

  if (!Array.isArray(dataset.items) || dataset.items.length < minItems || dataset.items.length > maxItems) {
    throw new Error(`Dataset item count must be between ${minItems} and ${maxItems}`);
  }

  const links = new Set();
  let previousTimestamp = Number.POSITIVE_INFINITY;
  for (const [index, item] of dataset.items.entries()) {
    for (const field of ["title", "link", "pubDate", "source", "filteredAt"]) {
      if (typeof item?.[field] !== "string" || item[field].trim().length === 0) {
        throw new Error(`items[${index}].${field} is required`);
      }
    }

    if (!sourceNames.has(item.source)) {
      throw new Error(`items[${index}].source is not declared`);
    }

    assertPublicHttpsUrl(item.link, `items[${index}].link`);
    if (links.has(item.link)) {
      throw new Error(`Duplicate item link: ${item.link}`);
    }
    links.add(item.link);

    const pubDate = parseDate(item.pubDate, `items[${index}].pubDate`);
    parseDate(item.filteredAt, `items[${index}].filteredAt`);
    if (pubDate > previousTimestamp) {
      throw new Error("Dataset items must be sorted by pubDate descending");
    }
    previousTimestamp = pubDate;
  }

  assertNoSensitiveContent(dataset);

  const byteLength = Buffer.byteLength(JSON.stringify(dataset));
  if (byteLength > maxBytes) {
    throw new Error(`Dataset exceeds ${maxBytes} bytes`);
  }

  return dataset;
}
