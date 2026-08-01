const DEFAULT_RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

export function assertAllowedUrl(value, allowedHostnames) {
  const url = new URL(value);

  if (url.protocol !== "https:") {
    throw new Error(`Collector only allows HTTPS sources: ${url.origin}`);
  }

  if (!allowedHostnames.includes(url.hostname)) {
    throw new Error(`Source hostname is not allowlisted: ${url.hostname}`);
  }

  if (url.username || url.password) {
    throw new Error("Source URLs must not contain credentials");
  }

  return url;
}

function isExpectedContentType(contentType, expectedContentTypes) {
  const normalized = contentType.split(";", 1)[0].trim().toLowerCase();
  return expectedContentTypes.includes(normalized);
}

function isRetryable(error) {
  return error?.name === "AbortError" || error?.name === "TimeoutError" || error instanceof TypeError;
}

export async function fetchText(value, {
  allowedHostnames,
  expectedContentTypes = [
    "application/atom+xml",
    "application/rss+xml",
    "application/xml",
    "text/xml",
  ],
  fetchImpl = globalThis.fetch,
  maxBytes = 1_000_000,
  retries = 2,
  retryDelayMs = 300,
  sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay)),
  timeoutMs = 10_000,
} = {}) {
  const url = assertAllowedUrl(value, allowedHostnames ?? []);
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        headers: {
          Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
          "User-Agent": "lptff-public-data-collector/1.0",
        },
        redirect: "error",
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        const error = new Error(`Source returned HTTP ${response.status}: ${url.origin}`);
        error.status = response.status;
        throw error;
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!isExpectedContentType(contentType, expectedContentTypes)) {
        throw new Error(`Unexpected content type from ${url.origin}: ${contentType || "missing"}`);
      }

      const contentLength = Number(response.headers.get("content-length"));
      if (Number.isFinite(contentLength) && contentLength > maxBytes) {
        throw new Error(`Source response exceeds ${maxBytes} bytes: ${url.origin}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength > maxBytes) {
        throw new Error(`Source response exceeds ${maxBytes} bytes: ${url.origin}`);
      }

      return buffer.toString("utf8");
    } catch (error) {
      lastError = error;
      const canRetry = attempt < retries
        && (DEFAULT_RETRYABLE_STATUS.has(error?.status) || isRetryable(error));

      if (!canRetry) throw error;
      await sleep(retryDelayMs * (2 ** attempt));
    }
  }

  throw lastError;
}
