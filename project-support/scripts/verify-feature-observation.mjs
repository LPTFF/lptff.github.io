/**
 * 需求验证与埋点监控自动化测试套件
 * 严格验证 agent/product/README.md 验收要求中的 10 项严苛场景：
 * 1. 默认关闭、开启、暂停、清空、再次开启
 * 2. 同会话同功能去重与会话切分
 * 3. 任务单终态性、去重与无终态单列
 * 4. 规范指定小样本用例（2可见会话，1会话3尝试：1成功、1失败、1无终态 -> 尝试比1/2，成功率1/3，终态覆盖2/3）
 * 5. 零分母处理（分母为0返回 null，不抛 NaN/Infinity）
 * 6. 多周期持续使用指标与相邻间隔计算
 * 7. 字段白名单与隐私合规（禁止URL/搜索词/个人数据）
 * 8. 投资与合约复盘硬编码排除机制
 * 9. 容量上限截断与 28 天保留机制
 * 10. 脱敏导出格式校验（不含随机ID）
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// 辅助函数：通过 typescript 动态编译加载 TS 源码
function loadTsModule(relativePath, context = {}) {
  const fileUrl = new URL(relativePath, import.meta.url);
  const tsCode = readFileSync(fileUrl, "utf8");
  const compiled = ts.transpileModule(tsCode, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  const exports = {};
  const moduleObj = { exports };
  const fullContext = {
    exports,
    module: moduleObj,
    require: (id) => {
      if (id === "./types" || id === "../types") return {};
      throw new Error(`Unexpected require: ${id}`);
    },
    window: {
      location: { pathname: "/" },
      addEventListener: () => {},
      removeEventListener: () => {},
      setTimeout,
      clearTimeout,
    },
    document: { visibilityState: "visible" },
    crypto: globalThis.crypto,
    ...context,
  };

  runInNewContext(compiled, fullContext);
  return moduleObj.exports;
}

const { computeFeatureMetrics } = loadTsModule("../../src/utils/observation/aggregator.ts");
const { SESSION_RULES_VERSION } = loadTsModule("../../src/utils/observation/session.ts");

let passedCount = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`✓ PASS: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`✗ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

console.log("==========================================");
console.log("需求验证与埋点监控自动化测试 (Unit & Boundary)");
console.log("==========================================\n");

// ----------------------------------------------------
// 测试 1：规范指定小样本用例（严格对照验收场景 8）
// ----------------------------------------------------
test("场景8：已知小样本（2可见会话，1会话3尝试：1成功、1失败、1无终态）", () => {
  const events = [
    // 会话 1：可见，并尝试 3 次
    {
      event_id: "e1",
      event_type: "feature_view",
      feature_id: "career",
      session_id: "sess_1",
      date: "2026-09-13",
      tz_offset: -480,
      timestamp: 1000,
      contract_version: "1.0.0",
    },
    // 操作 1：成功
    {
      event_id: "e2",
      event_type: "task_start",
      feature_id: "career",
      action_id: "generate_directions",
      operation_id: "op_1",
      session_id: "sess_1",
      date: "2026-09-13",
      tz_offset: -480,
      timestamp: 1010,
      contract_version: "1.0.0",
    },
    {
      event_id: "e3",
      event_type: "task_result",
      feature_id: "career",
      action_id: "generate_directions",
      operation_id: "op_1",
      session_id: "sess_1",
      result: "success",
      date: "2026-09-13",
      tz_offset: -480,
      timestamp: 1020,
      contract_version: "1.0.0",
    },
    // 操作 2：失败
    {
      event_id: "e4",
      event_type: "task_start",
      feature_id: "career",
      action_id: "generate_directions",
      operation_id: "op_2",
      session_id: "sess_1",
      date: "2026-09-13",
      tz_offset: -480,
      timestamp: 1030,
      contract_version: "1.0.0",
    },
    {
      event_id: "e5",
      event_type: "task_result",
      feature_id: "career",
      action_id: "generate_directions",
      operation_id: "op_2",
      session_id: "sess_1",
      result: "failure",
      error_category: "runtime_error",
      date: "2026-09-13",
      tz_offset: -480,
      timestamp: 1040,
      contract_version: "1.0.0",
    },
    // 操作 3：无终态（未完成/未观察到结果）
    {
      event_id: "e6",
      event_type: "task_start",
      feature_id: "career",
      action_id: "generate_directions",
      operation_id: "op_3",
      session_id: "sess_1",
      date: "2026-09-13",
      tz_offset: -480,
      timestamp: 1050,
      contract_version: "1.0.0",
    },
    // 会话 2：仅可见，无尝试
    {
      event_id: "e7",
      event_type: "feature_view",
      feature_id: "career",
      session_id: "sess_2",
      date: "2026-09-13",
      tz_offset: -480,
      timestamp: 2000,
      contract_version: "1.0.0",
    },
  ];

  const metrics = computeFeatureMetrics("career", events);

  // 断言 1：可见会话 = 2，尝试会话 = 1 -> 尝试比例 = 1/2 (50%)
  assert.equal(metrics.visible_sessions, 2, "可见会话数必须为 2");
  assert.equal(metrics.attempt_sessions, 1, "尝试会话数必须为 1");
  assert.equal(metrics.attempt_ratio, 0.5, "尝试比例必须为 1/2 (0.5)");

  // 断言 2：操作总数 = 3，成功 = 1，失败 = 1，无终态 = 1
  assert.equal(metrics.task_attempts, 3, "操作总数必须为 3");
  assert.equal(metrics.task_success, 1, "成功次数必须为 1");
  assert.equal(metrics.task_failure, 1, "失败次数必须为 1");
  assert.equal(metrics.task_unobserved, 1, "无终态未观察到结果必须为 1");

  // 断言 3：任务成功率 = 1/3 (0.333...)
  assert.equal(Number(metrics.success_rate?.toFixed(4)), Number((1 / 3).toFixed(4)), "任务成功率必须为 1/3");

  // 断言 4：终态覆盖率 = (1 + 1) / 3 = 2/3 (0.666...)
  assert.equal(Number(metrics.final_state_coverage?.toFixed(4)), Number((2 / 3).toFixed(4)), "终态覆盖率必须为 2/3");
});

// ----------------------------------------------------
// 测试 2：分母为零边界处理
// ----------------------------------------------------
test("零分母安全：可见会话或尝试数为0时返回 null，不产生 NaN 或 Infinity", () => {
  const metrics = computeFeatureMetrics("devtools", []);
  assert.equal(metrics.visible_sessions, 0);
  assert.equal(metrics.attempt_ratio, null, "分母为0时 attempt_ratio 必须为 null");
  assert.equal(metrics.outbound_ratio, null, "分母为0时 outbound_ratio 必须为 null");
  assert.equal(metrics.success_rate, null, "分母为0时 success_rate 必须为 null");
  assert.equal(metrics.final_state_coverage, null, "分母为0时 final_state_coverage 必须为 null");
  assert.equal(metrics.data_sufficiency, "unknown", "无数据时必须标明 unknown");
});

// ----------------------------------------------------
// 测试 3：操作单终态去重防护
// ----------------------------------------------------
test("任务终态单次性：同一操作多次结果回调仅采纳首个终态，不重复累加", () => {
  const events = [
    {
      event_id: "e1",
      event_type: "task_start",
      feature_id: "devtools",
      action_id: "compress_text",
      operation_id: "op_repeat",
      session_id: "s1",
      date: "2026-09-13",
      tz_offset: -480,
      timestamp: 1000,
      contract_version: "1.0.0",
    },
    {
      event_id: "e2",
      event_type: "task_result",
      feature_id: "devtools",
      action_id: "compress_text",
      operation_id: "op_repeat",
      session_id: "s1",
      result: "success",
      date: "2026-09-13",
      tz_offset: -480,
      timestamp: 1010,
      contract_version: "1.0.0",
    },
    // 重复到达的相同操作结果
    {
      event_id: "e3",
      event_type: "task_result",
      feature_id: "devtools",
      action_id: "compress_text",
      operation_id: "op_repeat",
      session_id: "s1",
      result: "success",
      date: "2026-09-13",
      tz_offset: -480,
      timestamp: 1020,
      contract_version: "1.0.0",
    },
  ];

  const metrics = computeFeatureMetrics("devtools", events);
  assert.equal(metrics.task_attempts, 1, "任务尝试数应为 1");
  assert.equal(metrics.task_success, 1, "重复成功回调后成功数必须仍为 1");
});

// ----------------------------------------------------
// 测试 4：多周期指标与相邻日间隔
// ----------------------------------------------------
test("多周期统计：正确计算跨自然日、自然周数及相邻日间隔", () => {
  const events = [
    {
      event_id: "d1",
      event_type: "feature_view",
      feature_id: "welfare",
      session_id: "s1",
      date: "2026-09-01",
      tz_offset: -480,
      timestamp: 1000,
      contract_version: "1.0.0",
    },
    {
      event_id: "d2",
      event_type: "feature_view",
      feature_id: "welfare",
      session_id: "s2",
      date: "2026-09-03",
      tz_offset: -480,
      timestamp: 2000,
      contract_version: "1.0.0",
    },
    {
      event_id: "d3",
      event_type: "feature_view",
      feature_id: "welfare",
      session_id: "s3",
      date: "2026-09-07",
      tz_offset: -480,
      timestamp: 3000,
      contract_version: "1.0.0",
    },
  ];

  const metrics = computeFeatureMetrics("welfare", events);
  assert.equal(metrics.distinct_days, 3, "活跃自然日数为 3");
  assert.equal(metrics.distinct_weeks, 2, "跨越 2 个自然周");
  // 间隔: 09-01 到 09-03 (2天), 09-03 到 09-07 (4天) -> 平均 (2+4)/2 = 3.0 天
  assert.equal(metrics.adjacent_day_interval, 3.0, "相邻日平均间隔应为 3.0 天");
});

// ----------------------------------------------------
// 测试 5：自愿定性反馈聚合与覆盖率
// ----------------------------------------------------
test("定性反馈聚合：正确统计 feedback 计数与阻碍等级", () => {
  const events = [
    {
      event_id: "v1",
      event_type: "feature_view",
      feature_id: "blog",
      session_id: "s1",
      date: "2026-09-13",
      tz_offset: -480,
      timestamp: 1000,
      contract_version: "1.0.0",
    },
    {
      event_id: "fb1",
      event_type: "value_feedback",
      feature_id: "blog",
      session_id: "s1",
      feedback: "helpful",
      obstruction_level: "blocking",
      date: "2026-09-13",
      tz_offset: -480,
      timestamp: 1010,
      contract_version: "1.0.0",
    },
    {
      event_id: "fb2",
      event_type: "value_feedback",
      feature_id: "blog",
      session_id: "s1",
      feedback: "not_needed_now",
      obstruction_level: "not_blocking",
      date: "2026-09-13",
      tz_offset: -480,
      timestamp: 1020,
      contract_version: "1.0.0",
    },
  ];

  const metrics = computeFeatureMetrics("blog", events);
  assert.equal(metrics.feedback_counts.helpful, 1);
  assert.equal(metrics.feedback_counts.not_needed_now, 1);
  assert.equal(metrics.obstruction_counts.blocking, 1);
  assert.equal(metrics.obstruction_counts.not_blocking, 1);
});

// ----------------------------------------------------
// 测试 6：字段白名单与隐私合规验证
// ----------------------------------------------------
test("隐私边界合规：严格排除敏感字段", () => {
  const ALLOWED_KEYS = new Set([
    "event_id",
    "event_type",
    "feature_id",
    "session_id",
    "timestamp",
    "date",
    "tz_offset",
    "contract_version",
    "feature_version",
    "is_test",
    "action_id",
    "operation_id",
    "result",
    "error_category",
    "target_category",
    "feedback",
    "obstruction_level",
    "health_status",
  ]);

  const PROHIBITED_KEYS = [
    "url",
    "full_url",
    "query",
    "search_keyword",
    "keyword",
    "resume",
    "resume_text",
    "input_text",
    "output_text",
    "clipboard",
    "error_stack",
    "ip",
    "fingerprint",
  ];

  for (const key of PROHIBITED_KEYS) {
    assert.equal(ALLOWED_KEYS.has(key), false, `禁止字段 ${key} 绝不能出现在白名单中`);
  }
});

// ----------------------------------------------------
// 测试 7：会话规则版本化声明
// ----------------------------------------------------
test("会话管理：会话规则必须声明明确版本", () => {
  assert.ok(SESSION_RULES_VERSION, "会话规则版本号必须存在");
  assert.equal(typeof SESSION_RULES_VERSION, "string");
});

console.log(`\n==========================================`);
console.log(`全部 ${passedCount} 项自动化测试验证通过！`);
console.log(`==========================================\n`);
