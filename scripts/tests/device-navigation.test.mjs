import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';

const source = fs.readFileSync(new URL('../../src/utils/utils.js', import.meta.url), 'utf8')
  .replace(/export \{ isPC, gotoOutPage, initEruda \}\s*;?\s*$/, 'globalThis.navigationUtils = { isPC, gotoOutPage };');
const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/142.0.0.0 Safari/537.36';
const cases = [
  { name: 'desktop at 1000px', width: 1000, desktop: true },
  { name: 'desktop at phone width with coarse pointer', width: 390, finePointer: false, desktop: true },
  { name: 'wide desktop', width: 1440, desktop: true },
  { name: 'desktop WeChat', ua: `${desktopUA} MicroMessenger/4.0`, desktop: true },
  { name: 'Android at desktop width with mouse', ua: 'Mozilla/5.0 (Linux; Android 15) Chrome/142.0 Mobile', width: 1440, desktop: false },
  { name: 'iPhone', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', desktop: false },
  { name: 'iPad desktop UA', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Safari/605.1.15', platform: 'MacIntel', touchPoints: 5, desktop: false },
  { name: 'Mac with trackpad', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Safari/605.1.15', platform: 'MacIntel', touchPoints: 0, desktop: true },
  { name: 'mobile client hints with reduced UA', mobileHint: true, desktop: false },
];

for (const scenario of cases) {
  test(`${scenario.name}: detects device and preserves its navigation behavior`, () => {
    const opened = [];
    const context = {
      navigator: {
        userAgent: scenario.ua || desktopUA,
        platform: scenario.platform || 'Win32',
        maxTouchPoints: scenario.touchPoints || 0,
        ...(scenario.mobileHint === undefined ? {} : { userAgentData: { mobile: scenario.mobileHint } }),
      },
      window: {
        innerWidth: scenario.width || 390,
        matchMedia: () => ({ matches: scenario.finePointer !== false }),
        open: (...args) => opened.push(args),
        location: { href: '/original' },
      },
    };
    vm.runInNewContext(source, context);
    assert.equal(context.navigationUtils.isPC(), scenario.desktop);
    context.navigationUtils.gotoOutPage('https://example.com/');
    assert.deepEqual(opened, scenario.desktop ? [['https://example.com/', '_blank']] : []);
    assert.equal(context.window.location.href, scenario.desktop ? '/original' : 'https://example.com/');
  });
}
