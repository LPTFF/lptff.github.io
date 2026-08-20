import assert from "node:assert/strict";
import test from "node:test";
import "../../../extension/lptff-investment-assistant/public-fund-metadata.js";

const { marketEvidenceFromSections } = globalThis.LPTFFPublicFundMetadata;

test("基金档案明确描述主要投资市场时生成短证据", () => {
  assert.deepEqual(marketEvidenceFromSections({
    投资目标: "本基金主要投资美国纳斯达克交易所上市股票。",
    投资范围: "本基金主要投资的境外市场为美国市场。",
  }), [{ region: "美国", sourceField: "投资目标" }]);
});

test("宽泛可投资品种不会被误当成主要投资市场", () => {
  assert.deepEqual(marketEvidenceFromSections({
    投资范围: "本基金可投资美国存托凭证、港股通股票及全球证券市场中的其他金融工具。",
  }), []);
});
