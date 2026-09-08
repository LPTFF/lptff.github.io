// Adapted from qinglongBackup/research/zhipin/extension/inject.js (v3.1).
// Site-specific compatibility shim; see agent/verification/boss-devtools-debugging.md.
// Must run synchronously in MAIN at document_start, before the site's bundles.
(() => {
  "use strict";

  let hostname = location.hostname;
  if (!hostname && (location.href === "about:blank" || location.href === "about:srcdoc")) {
    try { hostname = parent.location.hostname; } catch { return; }
  }
  if (!/(^|\.)zhipin\.com$/i.test(hostname)) return;
  const marker = "__LPTFF_BOSS_DEVTOOLS_SHIELD__";
  if (Object.prototype.hasOwnProperty.call(globalThis, marker)) return;

  const experimentKey = "nd_result_13912_number_1";
  const exemptResult = "QM&Lb";
  const define = Object.defineProperty;
  const descriptor = Object.getOwnPropertyDescriptor;
  const state = {
    version: "1.0.0", userAgent: false, abData: false, experiment: false,
    lifecycle: false, blockedClose: 0, blockedOpen: 0, blockedBack: 0, failures: [],
  };
  define(globalThis, marker, {
    configurable: true,
    get: () => ({ ...state, failures: [...state.failures] }),
  });
  const attempt = (name, action) => {
    try { action(); } catch { state.failures.push(name); }
  };

  // The referenced noDebug implementation exits for BZLFE on non-touch devices.
  // Keep the real OS and webdriver values; they are unrelated to that branch.
  const rawUa = navigator.userAgent;
  const shieldUa = /BZLFE/i.test(rawUa) ? rawUa : `${rawUa} BZLFE`;
  for (const target of [globalThis.Navigator?.prototype, navigator]) {
    if (!target) continue;
    for (const [key, value] of [["userAgent", shieldUa], ["maxTouchPoints", 0]]) {
      attempt(`navigator.${key}`, () => define(target, key, { configurable: true, get: () => value }));
    }
  }
  state.userAgent = /BZLFE/i.test(navigator.userAgent) && navigator.maxTouchPoints === 0;

  const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  const experimentDefaults = new WeakMap();
  const abDataDefaults = new WeakMap();
  function fallbackFor(cache, receiver, create) {
    if (receiver === null || !["object", "function"].includes(typeof receiver)) return create();
    if (!cache.has(receiver)) cache.set(receiver, create());
    return cache.get(receiver);
  }
  function replaceField(value, key, next) {
    const own = descriptor(value, key);
    const field = { value: next, writable: true, enumerable: own?.enumerable ?? true, configurable: own?.configurable ?? true };
    try { define(value, key, field); return value; } catch {
      // Preserve symbols/non-enumerable metadata as well as ordinary JSON fields.
      const fields = Object.getOwnPropertyDescriptors(value);
      fields[key] = { ...field, configurable: true };
      return Object.create(Object.getPrototypeOf(value), fields);
    }
  }
  function exemptExperiment(value) {
    if (!isRecord(value)) return { result: exemptResult };
    if (value.result === exemptResult) return value;
    // Preserve mutable input identity and other experiment fields. Frozen server
    // data is copied only when necessary; never mutate unrelated experiments.
    return replaceField(value, "result", exemptResult);
  }
  function exemptAbData(value) {
    if (!isRecord(value)) return value;
    const experiment = exemptExperiment(value[experimentKey]);
    const own = descriptor(value, experimentKey);
    if (own && value[experimentKey] === experiment) return value;
    return replaceField(value, experimentKey, experiment);
  }

  // The site reads these fields before its async configuration arrives. Only
  // these two keys receive inherited fallbacks; do not patch JSON/fetch/XHR.
  // Assignments still create enumerable own fields, without helper-key leakage.
  // Object literals/defineProperty bypass inherited setters (see limitations).
  attempt("experiment", () => {
    if (descriptor(Object.prototype, experimentKey)) throw new Error("existing hook");
    define(Object.prototype, experimentKey, {
      configurable: true,
      get() {
        return exemptExperiment(fallbackFor(experimentDefaults, this, () => ({ result: exemptResult })));
      },
      set(value) {
        define(this, experimentKey, {
          value: exemptExperiment(value), writable: true, enumerable: true, configurable: true,
        });
      },
    });
    state.experiment = true;
  });
  attempt("abData", () => {
    if (descriptor(Object.prototype, "abData")) throw new Error("existing hook");
    define(Object.prototype, "abData", {
      configurable: true,
      get() {
        return exemptAbData(fallbackFor(abDataDefaults, this, () => ({ [experimentKey]: { result: exemptResult } })));
      },
      set(value) {
        let current = exemptAbData(value);
        define(this, "abData", {
          configurable: true, enumerable: true,
          get() { current = exemptAbData(current); return current; },
          set(next) { current = exemptAbData(next); },
        });
      },
    });
    state.abData = true;
  });

  // Fallback for the documented synchronous open('', '_self') -> close -> back
  // punishment sequence. Normal history.back and real URL navigation pass through.
  // This cannot intercept DOM clearing, location assignments or renderer crashes.
  const isWorkPage = () => globalThis.top === globalThis.self
    && /(^|\.)zhipin\.com$/i.test(location.hostname)
    && /^\/(?:web\/geek\/|job_detail\/)/.test(location.pathname);
  let punishmentSequence = false;
  const markPunishment = () => {
    punishmentSequence = true;
    queueMicrotask(() => { punishmentSequence = false; });
  };
  attempt("lifecycle", () => {
    const originalClose = window.close;
    const originalOpen = window.open;
    const originalBack = history.back;
    window.close = function close(...args) {
      if (!isWorkPage()) return Reflect.apply(originalClose, this, args);
      state.blockedClose++;
      markPunishment();
    };
    window.open = function open(url, target, ...rest) {
      if (isWorkPage() && typeof target === "string" && target.toLowerCase() === "_self"
        && (url == null || url === "" || url === "about:blank")) {
        state.blockedOpen++;
        markPunishment();
        return window;
      }
      return Reflect.apply(originalOpen, this, arguments);
    };
    history.back = function back(...args) {
      if (isWorkPage() && punishmentSequence) { state.blockedBack++; return; }
      return Reflect.apply(originalBack, this, args);
    };
    state.lifecycle = true;
  });
})();
