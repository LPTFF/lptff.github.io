const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const repo = path.resolve(__dirname, "../../..");
const extension = path.join(repo, "project-support/extension/lptff-investment-assistant");
const reference = path.join(repo, "agent/references/boss-helper-upstream/.output/chrome-mv3");

const artifacts = [
  ["boss.js", "boss.js", "5ED579E656680582FF95A82381D7651EC02A9AF735494BE216E2BDF9AE2B510A"],
  ["boss-helper-upstream-background.js", "background.js", "B122428F1ADBA16C2CCCA11CFD7DA968824DA814BD9D68D196E02E3FF164105D"],
  ["content/boss-helper-upstream.js", "content-scripts/content.js", "E586F0D58A3F56A9C1B614E431191BC5B79A64C3D6F1DA97AAE15766E73F2C16"],
  ["content/boss-helper-upstream.css", "content-scripts/content.css", "E98D15F61A6C95E85FB531D0CC925D6F83E59E9886DA8FC89B4DC59AA299A34A"],
];

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex").toUpperCase();
}

for (const [vendoredName, upstreamName, expectedHash] of artifacts) {
  const vendored = path.join(extension, vendoredName);
  assert.equal(fs.existsSync(vendored), true, `缺少上游产物: ${vendoredName}`);
  assert.equal(sha256(vendored), expectedHash, `${vendoredName} 已偏离 Boss-Helper 0.5.2.2 构建产物`);
  const built = path.join(reference, upstreamName);
  if (fs.existsSync(built)) {
    assert.equal(sha256(vendored), sha256(built), `${vendoredName} 与当前上游构建结果不一致`);
  }
}

const manifest = JSON.parse(fs.readFileSync(path.join(extension, "manifest.json"), "utf8"));
const upstreamScript = manifest.content_scripts.find((item) => item.js?.includes("content/boss-helper-upstream.js"));
assert.ok(upstreamScript, "manifest 未加载上游 BOSS content script");
assert.deepEqual(upstreamScript.css, ["content/boss-helper-upstream.css"]);
assert.equal(upstreamScript.run_at, "document_start");
assert.ok(manifest.permissions.includes("notifications"));
assert.ok(manifest.host_permissions.includes("http://*/*"));
assert.ok(manifest.host_permissions.includes("https://*/*"));
assert.ok(manifest.web_accessible_resources.some((item) => item.resources.includes("boss.js")));
assert.equal(fs.existsSync(path.join(extension, "content/boss-helper.js")), false, "旧版自写 BOSS 工作台仍存在");
assert.equal(fs.existsSync(path.join(extension, "popup/boss-helper.js")), false, "旧版自写 BOSS Popup 仍存在");

const background = fs.readFileSync(path.join(extension, "background.js"), "utf8");
assert.match(background, /boss-helper-upstream-background\.js/);
const popup = fs.readFileSync(path.join(extension, "popup/popup.html"), "utf8");
assert.doesNotMatch(popup, /boss-helper\.js/);

const appSource = fs.readFileSync(path.join(repo, "agent/references/boss-helper-upstream/src/App.vue"), "utf8");
assert.doesNotMatch(appSource, /components\/Tabs\/About\.vue/, "仍在加载关于与赞赏页面");
assert.doesNotMatch(appSource, /slot:\s*['"]about['"]/, "仍注册关于与赞赏标签");
assert.doesNotMatch(appSource, />\s*反馈\s*</, "仍显示反馈入口");
assert.doesNotMatch(appSource, /label=['"]帮助['"]/, "仍显示帮助入口");
assert.doesNotMatch(appSource, /helpVisible|isFeatureEnabled|updateOverlay/, "帮助模式逻辑仍存在");
const bossBundle = fs.readFileSync(path.join(extension, "boss.js"), "utf8");
assert.doesNotMatch(bossBundle, /关于&赞赏|赞赏|反馈|帮助/, "生产包仍包含已删除入口或文案");

console.log("Boss-Helper curated parity verification passed: upstream 0.5.2.2 core plus approved UI removals.");
