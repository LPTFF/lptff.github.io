import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { unzipSync } from "fflate";
import { buildExtensionZip } from "../extension/build-zip.js";
import { needsExtensionRelease } from "../extension/release-policy.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));

test("concurrent ZIP requests produce one complete archive with every source byte", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "lptff-zip-test-"));
  try {
    const output = path.join(directory, "extension.zip");
    const first = buildExtensionZip(output);
    assert.equal(buildExtensionZip(output), first);
    assert.equal(await first, output);
    const files = unzipSync(fs.readFileSync(output));
    const expected = [];
    function verify(relative = "") {
      for (const entry of fs.readdirSync(path.join(root, "extension", relative), { withFileTypes: true })) {
        const name = relative + entry.name;
        if (entry.isDirectory()) verify(name + "/");
        else {
          expected.push(name);
          assert.deepEqual(Buffer.from(files[name]), fs.readFileSync(path.join(root, "extension", name)), name);
        }
      }
    }
    verify();
    assert.deepEqual(Object.keys(files).filter((name) => !name.endsWith("/")).sort(), expected.sort());
    assert.ok(files["manifest.json"]);
    assert.deepEqual(fs.readdirSync(directory), ["extension.zip"]);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test("failed ZIP replacement keeps existing data and removes partial files", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "lptff-zip-error-"));
  const output = path.join(directory, "existing-directory");
  fs.mkdirSync(output);
  fs.writeFileSync(path.join(output, "keep.txt"), "existing data");
  try {
    await assert.rejects(buildExtensionZip(output));
    assert.equal(fs.readFileSync(path.join(output, "keep.txt"), "utf8"), "existing data");
    assert.deepEqual(fs.readdirSync(directory), ["existing-directory"]);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

function fixture(run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "lptff-release-test-"));
  const hooks = path.join(directory, "empty-hooks");
  fs.mkdirSync(hooks);
  function git(...args) {
    return execFileSync("git", ["-c", `core.hooksPath=${hooks}`, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", ...args], {
      cwd: directory, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  }
  function write(name, value) {
    const file = path.join(directory, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, value);
  }
  try {
    git("init", "-q", "-b", "main");
    write("extension/background.js", "initial");
    git("add", "extension/background.js");
    git("commit", "-qm", "Initial fixture");
    const commit = git("rev-parse", "HEAD");
    const release = { body: `Published commit ${commit}`, assets: [{ name: "lptff-investment-assistant.zip", state: "uploaded" }] };
    run({ directory, git, write, release });
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
}

test("data rebuilds, website changes and generated timestamps reuse the published extension", () => fixture(({ directory, git, write, release }) => {
  assert.equal(needsExtensionRelease(release, directory), false);
  write("src/page.vue", "website-only change");
  write("extension/build-info.js", "new generated timestamp");
  write("docs/guide.md", "documentation change");
  git("add", ".");
  git("commit", "-qm", "Website and metadata only");
  assert.equal(needsExtensionRelease(release, directory), false);
}));

for (const changed of ["extension/background.js", "extension/boss.js", "scripts/extension/build-zip.js", "scripts/generate-build-tags.mjs", "scripts/lib/build-tags.mjs", "package.json", "package-lock.json", ".github/workflows/code-deployment.yml"]) {
  test(`release includes changed input: ${changed}`, () => fixture(({ directory, git, write, release }) => {
    write(changed, "changed input");
    git("add", ".");
    git("commit", "-qm", "Packaging input changed");
    assert.equal(needsExtensionRelease(release, directory), true);
  }));
}

test("deleting extension code is a release change", () => fixture(({ directory, git, release }) => {
  git("rm", "extension/background.js");
  git("commit", "-qm", "Remove extension input");
  assert.equal(needsExtensionRelease(release, directory), true);
}));

test("missing assets, invalid metadata and unavailable history require a release", () => fixture(({ directory, release }) => {
  for (const value of [null, {}, { body: 1, assets: {} }, { ...release, assets: [] },
    { ...release, assets: [{ name: "lptff-investment-assistant.zip", state: "new" }] },
    { ...release, body: `Published commit ${"0".repeat(40)}` }]) {
    assert.equal(needsExtensionRelease(value, directory), true);
  }
}));
