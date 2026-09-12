import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { webcrypto } from "node:crypto";
import ts from "typescript";

const compiled = ts.transpileModule(readFileSync(new URL("../../src/utils/contentAnalysis.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const exports = {};
const storage = new Map();
runInNewContext(compiled, { exports, localStorage: {
  getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value),
}, window: { dispatchEvent() {} }, CustomEvent: class {} });
const result = { url: "https://example.com/item", title: "Public title", analysis: { category: "待分类" } };
assert.equal(exports.hasContentAnalysis("welfare", undefined), false);
assert.equal(exports.hasContentAnalysis("welfare", { category: "其他福利" }), false);
assert.equal(exports.hasContentAnalysis("welfare", result.analysis), true);
exports.saveAnalyses("welfare", [result]);
assert.equal(exports.analysesForItems("welfare", [{ link: result.url, title: result.title }]).length, 1);
assert.equal(exports.analysisFor("welfare", result.url, "Changed title"), undefined);

// A completed, unclassified result must be reused without another paid model call.
const hash = Buffer.from(await webcrypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([1, "welfare", result.url, result.title])))).toString("hex");
const cache = { [hash]: result.analysis };
const context = {
  chrome: { runtime: { getURL: value => value }, storage: { local: { get: async key => ({ [key]: cache }) } } },
  fetch: async () => ({ json: async () => ({ welfare: { schema: { properties: { results: { items: { properties: { category: { enum: ["待分类", "银行优惠"] } } } } } } } }) }),
  crypto: webcrypto, TextEncoder, URL,
  callLocalGemini: () => { throw new Error("Completed analysis must not call Gemini again"); },
};
runInNewContext(readFileSync(new URL("../extension/lptff-investment-assistant/local-ai.js", import.meta.url), "utf8") + "\nthis.analyze = analyzeLocalContent;", context);
for (const cacheOnly of [true, false]) {
  const response = await context.analyze("welfare", [result], cacheOnly);
  assert.equal(response.results.length, 1);
  assert.equal(response.results[0].analysis.category, "待分类");
}
console.log("PASS: analysis completion, cache reload, title invalidation, and no repeat Gemini request");
