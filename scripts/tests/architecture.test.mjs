import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { ref, nextTick, effectScope } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { computeWebDigest } from '../lib/build-tags.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));
let cacheDirectory;
let server, market, useMarketSnapshot, useGeminiConfig, router;
before(async () => {
  // Load real TypeScript modules with Vite, without starting a web server or loading public/private data.
  cacheDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lptff-test-cache-'));
  server = await createServer({ root, cacheDir: cacheDirectory, configFile: false, optimizeDeps: { noDiscovery: true, include: [], entries: [] }, server: { middlewareMode: true, watch: null }, appType: 'custom' });
  market = await server.ssrLoadModule('/src/career/market.ts');
  ({ useMarketSnapshot } = await server.ssrLoadModule('/src/career/composables/use-market-snapshot.ts'));
  ({ useGeminiConfig } = await server.ssrLoadModule('/src/career/composables/use-gemini-config.ts'));
  const { routes } = await server.ssrLoadModule('/src/router/routes.js');
  router = createRouter({ history: createMemoryHistory(), routes });
});
after(async () => { await server?.close(); if (cacheDirectory) fs.rmSync(cacheDirectory, { recursive: true, force: true }); });

const job = (id, overrides = {}) => ({
  jobNum: id, brandLogo: '', brandName: 'Example Company', bossTitle: 'Vue Engineer',
  brandIndustry: 'Software', salaryDesc: '', skills: ['Vue', 'TypeScript'],
  job_detail: `https://example.com/jobs/${id}`, jobDesc: 'Remote · Team', time: '2026-01-01',
  timestamp: 1, website: 'zhipin', sourcePage: '/shenzhen/', ...overrides,
});
const all = { city: 'all', skill: 'all', query: '' };

test('city normalization preserves explicit city, legacy slug and unknown fallback', () => {
  assert.equal(market.formatCityName(job(1, { cityName: '上海' })), '上海');
  assert.equal(market.formatCityName(job(1, { sourcePage: '/SHENZHEN/' })), '深圳');
  assert.equal(market.formatCityName(job(1, { sourcePage: '' })), '全网');
  assert.equal(market.formatCityName(job(1, { sourcePage: '/unknown/' })), 'unknown');
  assert.deepEqual(market.parseJobDescChips(' Remote · · Team '), ['Remote', 'Team']);
});

test('combined city, skill and case-insensitive query preserve order and input', () => {
  const jobs = [job(1), job(2, { cityName: '北京' }), job(3, { skills: ['Go'] }), job(4)];
  const original = structuredClone(jobs);
  assert.deepEqual(market.filterMarketJobs(jobs, { city: '深圳', skill: 'Vue', query: ' TYPEscript ' }).map(j => j.jobNum), [1, 4]);
  assert.deepEqual(jobs, original);
  assert.equal(market.filterMarketJobs(jobs, all).length, 4);
  assert.equal(market.filterMarketJobs(jobs, { ...all, query: 'not-present' }).length, 0);
});

for (const [field, value] of Object.entries({ bossTitle: 'Needle Engineer', brandName: 'Needle Inc', brandIndustry: 'Needle Industry', jobDesc: 'Needle description', skills: ['Needle'] })) {
  test(`search includes ${field}`, () => {
    assert.equal(market.filterMarketJobs([job(1, { [field]: value })], { ...all, query: 'needle' }).length, 1);
  });
}

test('empty snapshot and missing optional fields are supported', () => {
  assert.deepEqual(market.filterMarketJobs([], all), []);
  const sparse = job(1, { skills: undefined, bossTitle: undefined, brandName: undefined, brandIndustry: undefined, jobDesc: undefined });
  assert.equal(market.filterMarketJobs([sparse], { ...all, query: '深圳' }).length, 1);
  assert.equal(market.filterMarketJobs([sparse], { ...all, skill: 'Vue' }).length, 0);
});

test('snapshot counts, progressive expansion and reset retain their behavior', async () => {
  const scope = effectScope();
  try {
    const jobs = ref(Array.from({ length: 8 }, (_, i) => job(i, { cityName: i < 6 ? '深圳' : '北京' })));
    const outcomes = [];
    const state = scope.run(() => useMarketSnapshot(jobs, outcome => outcomes.push(outcome)));
    assert.deepEqual(state.distinctCitiesInSnapshot.value, [{ city: '深圳', count: 6 }, { city: '北京', count: 2 }]);
    assert.deepEqual(state.distinctSkillsInSnapshot.value, [{ skill: 'Vue', count: 8 }, { skill: 'TypeScript', count: 8 }]);
    assert.equal(state.distinctCompaniesCount.value, 1);
    assert.equal(state.displayedPublicJobs.value.length, 5);
    state.toggleSnapshotLimit();
    assert.equal(state.displayedPublicJobs.value.length, 8);
    state.toggleSnapshotLimit();
    assert.equal(state.displayedPublicJobs.value.length, 5);
    state.snapshotSelectedCity.value = '深圳';
    await nextTick();
    assert.equal(state.filteredPublicJobs.value.length, 6);
    // Preserve the existing observation behavior: the first filter change is skipped.
    assert.deepEqual(outcomes, []);
    state.snapshotSearchQuery.value = 'no results';
    await nextTick();
    assert.deepEqual(outcomes, ['empty']);
    state.toggleJobDetail('example');
    assert.equal(state.expandedJobDetails.value.example, true);
    state.resetSnapshotFilters();
    await nextTick();
    assert.equal(state.displayedPublicJobs.value.length, 5);
    assert.equal(state.filteredPublicJobs.value.length, 8);
    assert.equal(state.expandedJobDetails.value.example, true);
    assert.deepEqual(outcomes, ['empty', 'success']);
    jobs.value = [];
    assert.equal(state.snapshotLastTime.value, '');
    assert.equal(state.filteredPublicJobs.value.length, 0);
  } finally { scope.stop(); }
});

function configHarness(overrides = {}, uiOverrides = {}) {
  const status = ref({ connected: true, hasGeminiKey: false, model: '', currentProfileMeta: null });
  const api = {
    revealCareerGeminiKey: async () => 'synthetic-test-value',
    saveCareerGeminiConfig: async payload => ({ model: payload.model, hasGeminiKey: true }),
    testCareerGemini: async () => ({ model: 'synthetic-model', durationMs: 1 }),
    clearCareerGeminiKey: async () => {},
    ...overrides,
  };
  return { status, config: useGeminiConfig(status, api, { message: { success() {}, error() {} }, confirm: async () => {}, ...uiOverrides }) };
}

test('Gemini settings use default model and trim only the submitted key', async () => {
  let payload;
  const { status, config } = configHarness({ saveCareerGeminiConfig: async p => { payload = p; return { model: p.model, hasGeminiKey: true }; } });
  await config.toggleGeminiConfig();
  assert.equal(config.showGeminiConfig.value, true);
  assert.equal(config.geminiForm.value.model, 'gemini-3.5-flash-lite');
  config.geminiForm.value.key = ' synthetic-test-value ';
  await config.handleSaveGeminiOnly();
  assert.deepEqual(payload, { model: 'gemini-3.5-flash-lite', geminiKey: 'synthetic-test-value' });
  assert.equal(status.value.hasGeminiKey, true);
  assert.equal(config.savingGemini.value, false);
  assert.equal(config.isKeyRevealed.value, false);
});

test('saved Gemini config loads only when a saved key exists', async () => {
  let reads = 0;
  const { status, config } = configHarness({ revealCareerGeminiKey: async () => { reads++; return 'synthetic-test-value'; } });
  await config.loadSavedGeminiKey();
  assert.equal(reads, 0);
  status.value.hasGeminiKey = true;
  await config.loadSavedGeminiKey();
  assert.equal(reads, 1);
  assert.equal(config.isKeyRevealed.value, false);
});

test('saving an empty key preserves the existing saved credential', async () => {
  let payload;
  const { status, config } = configHarness({ saveCareerGeminiConfig: async p => { payload = p; return { model: p.model, hasGeminiKey: true }; } });
  status.value.hasGeminiKey = true;
  config.geminiForm.value.key = '   ';
  await config.handleSaveGeminiOnly();
  assert.equal(Object.hasOwn(payload, 'geminiKey'), false);
  assert.equal(status.value.hasGeminiKey, true);
});

test('canceling clear never invokes the extension or clears form state', async () => {
  let cleared = false;
  const { status, config } = configHarness({ clearCareerGeminiKey: async () => { cleared = true; } }, { confirm: async () => { throw 'cancel'; } });
  status.value.hasGeminiKey = true;
  config.geminiForm.value.key = 'synthetic-test-value';
  await config.handleClearGeminiKey();
  assert.equal(cleared, false);
  assert.equal(status.value.hasGeminiKey, true);
  assert.equal(config.geminiForm.value.key, 'synthetic-test-value');
  assert.equal(config.clearingGemini.value, false);
});

test('confirmed clear resets the form only after the extension succeeds', async () => {
  let cleared = false;
  const { status, config } = configHarness({ clearCareerGeminiKey: async () => { cleared = true; } });
  status.value.hasGeminiKey = true;
  config.geminiForm.value.key = 'synthetic-test-value';
  await config.handleClearGeminiKey();
  assert.equal(cleared, true);
  assert.equal(status.value.hasGeminiKey, false);
  assert.equal(config.geminiForm.value.key, '');
  assert.equal(config.clearingGemini.value, false);
});

test('Gemini failure restores busy state and leaves connection status unchanged', async () => {
  const { status, config } = configHarness({ testCareerGemini: async () => { throw Error('synthetic failure'); } });
  await config.handleSaveAndTestGemini();
  assert.equal(config.testingGemini.value, false);
  assert.equal(config.geminiTestSuccess.value, false);
  assert.equal(status.value.hasGeminiKey, false);
  assert.match(config.geminiTestFeedback.value, /synthetic failure/);
});

function redirectTarget(url) {
  const resolved = router.resolve(url);
  const redirect = resolved.matched.at(-1)?.redirect;
  return typeof redirect === 'function' ? redirect(resolved) : redirect;
}

test('legacy public URLs keep their redirects and query parameters', () => {
  for (const url of ['/fundPilot', '/fundPilotPlus', '/fundPilotV1', '/message']) assert.equal(redirectTarget(url), '/blog/articles/fund-tools-evolution');
  for (const url of ['/tech-forum', '/github-trending', '/leetcode']) assert.equal(redirectTarget(url), '/blog/articles/career-tools-evolution');
  assert.equal(redirectTarget('/archives/2019'), '/blog/archives/2019');
  assert.equal(redirectTarget('/boss-zhipin'), '/career');
  assert.deepEqual(redirectTarget('/welfare'), { path: '/', query: { tab: 'welfare' } });
  assert.deepEqual(redirectTarget('/entertainment'), { path: '/', query: { tab: 'entertainment' } });
  assert.deepEqual(redirectTarget('/community'), { path: '/', query: { tab: 'pojie' } });
  assert.deepEqual(redirectTarget('/observation'), { path: '/', query: { observation: '1' } });
  assert.equal(redirectTarget('/missing-page'), '/');
});

test('product and tool routes preserve names, titles and lazy loaders', () => {
  const expected = [
    ['/career', 'career-discovery', '求职机会发现'],
    ['/contract-review', 'contract-review', '合约复盘助手'],
    ['/todo', 'project-todo', '项目待办'],
    ['/investment', 'os-console', '总览'],
    ['/investment/review', 'os-review', '复盘'],
    ['/devtools/json-formatter', 'devtools-json-formatter', 'JSON 格式化'],
    ['/blog/articles/example', 'blog-article', undefined],
  ];
  for (const [url, name, title] of expected) {
    const resolved = router.resolve(url);
    assert.equal(resolved.name, name);
    assert.equal(resolved.meta.title, title);
    assert.equal(typeof resolved.matched.at(-1).components.default, 'function');
  }
  assert.equal(redirectTarget('/devtools'), '/devtools/text-compress');
  assert.equal(router.resolve('/study/notebook/a/b').matched.at(-1).path, '/study/notebook/:pathMatch(.*)*');
});

test('build digest tracks extracted modules, CSS and file moves, excluding generated tags', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lptff-digest-'));
  try {
    fs.mkdirSync(path.join(directory, 'src/career'), { recursive: true });
    fs.mkdirSync(path.join(directory, 'scripts/vite'), { recursive: true });
    for (const file of ['index.html', 'package.json', 'package-lock.json', 'vite.config.ts', 'src/career/module.ts', 'src/career/style.css']) fs.writeFileSync(path.join(directory, file), 'initial');
    const initial = computeWebDigest(directory);
    fs.writeFileSync(path.join(directory, 'src/build-info.ts'), 'generated');
    assert.equal(computeWebDigest(directory), initial);
    fs.writeFileSync(path.join(directory, 'src/career/module.ts'), 'changed');
    const updated = computeWebDigest(directory);
    assert.notEqual(updated, initial);
    fs.renameSync(path.join(directory, 'src/career/module.ts'), path.join(directory, 'src/career/moved.ts'));
    assert.notEqual(computeWebDigest(directory), updated);
    const moved = computeWebDigest(directory);
    fs.writeFileSync(path.join(directory, 'src/career/style.css'), 'changed');
    assert.notEqual(computeWebDigest(directory), moved);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
