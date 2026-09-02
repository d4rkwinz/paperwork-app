#!/usr/bin/env node
// render-check: OPTIONAL render-level verification for the Paperwork fixture.
//
// Babel-compiles App.js + src/ with the project's own babel-preset-expo
// (caller metro/ios), renders every route in App.js's ROUTES map under a
// mock react-native host via react-test-renderer, and asserts:
//   1. no primitive (number, non-empty string) is a direct child of a
//      non-<Text> host component (the bare-`0` RN hard-crash class)
//   2. every element with an onPress has an accessibilityLabel or a testID
//   3. ROUTE_META addressing: "sparse" routes emit at most 2 testIDs,
//      "exhaustive" routes emit at least their declared anchors
//   4. the seed collections in src/data.js are deep-frozen first, so any
//      in-place mutation during render throws
//
// This is NOT part of `yarn selfcheck` and must never gate the build:
// react-test-renderer is present in node_modules but deliberately undeclared
// (deprecated in React 19), so if it or babel-preset-expo cannot be
// resolved we print why and exit 0. Exit is non-zero ONLY on a real
// assertion failure.
"use strict";

const path = require("path");
const Module = require("module");

const APP = path.join(__dirname, "..");
// Seam so the skip path is testable: point this at an unresolvable name.
const RTR_NAME = process.env.RENDER_CHECK_RTR || "react-test-renderer";

function resolveOpt(name) {
  try {
    return require.resolve(name, { paths: [APP] });
  } catch {
    return null;
  }
}

const missing = [RTR_NAME, "babel-preset-expo", "@babel/core", "react"].filter(
  (n) => !resolveOpt(n)
);
if (missing.length) {
  console.log(
    `render-check: SKIPPED (exit 0) — optional module(s) not resolvable: ${missing.join(", ")}.`
  );
  console.log(
    "render-check is optional tooling (react-test-renderer is deliberately undeclared); the required gate is `yarn selfcheck`."
  );
  process.exit(0);
}

// ---- react-native mock: string host types; unknown components resolve to
// their own name so newly-used RN components don't break this harness ----
const rnSpecial = {
  __esModule: true,
  Platform: { OS: "ios", Version: 17, select: (o) => (o.ios !== undefined ? o.ios : o.default) },
  StyleSheet: { create: (s) => s, flatten: (s) => s, hairlineWidth: 1, absoluteFill: {}, absoluteFillObject: {} },
  Dimensions: { get: () => ({ width: 390, height: 844 }) },
  useWindowDimensions: () => ({ width: 390, height: 844 }),
  BackHandler: { addEventListener: () => ({ remove() {} }), removeEventListener() {} },
  Alert: { alert() {} },
  Keyboard: { dismiss() {} },
  Linking: { openURL: async () => {} }
};
const rnMock = new Proxy(rnSpecial, {
  get: (t, k) => (k in t ? t[k] : typeof k === "string" ? k : undefined)
});
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === "react-native") return "react-native-mock";
  return origResolve.call(this, request, ...rest);
};
require.cache["react-native-mock"] = {
  id: "react-native-mock",
  filename: "react-native-mock",
  loaded: true,
  exports: rnMock
};

// ---- babel-compile App.js and src/*.js on the fly with the project's own
// preset; append an export so ROUTES is resolved from App.js dynamically ----
const babel = require(resolveOpt("@babel/core"));
const presetExpo = resolveOpt("babel-preset-expo");
const APP_JS = path.join(APP, "App.js");
const SRC = path.join(APP, "src") + path.sep;
const origJs = Module._extensions[".js"];
Module._extensions[".js"] = function (mod, filename) {
  if (filename === APP_JS || filename.startsWith(SRC)) {
    let { code } = babel.transformFileSync(filename, {
      presets: [[presetExpo, { jsxRuntime: "automatic" }]],
      babelrc: false,
      configFile: false,
      caller: { name: "metro", platform: "ios" }
    });
    if (filename === APP_JS) {
      code += "\n;module.exports.__RENDER_CHECK_ROUTES__ = typeof ROUTES !== 'undefined' ? ROUTES : null;";
    }
    return mod._compile(code, filename);
  }
  return origJs(mod, filename);
};

global.IS_REACT_ACT_ENVIRONMENT = true;
const origConsoleError = console.error;
console.error = (...args) => {
  // react-test-renderer is deprecated in React 19; we know — that is exactly
  // why this script is optional. Keep every other error visible.
  if (typeof args[0] === "string" && args[0].includes("react-test-renderer is deprecated")) return;
  // Param probing renders on purpose with wrong params; some throw and React
  // then emits act-hygiene warnings for its recovery work. Not actionable here.
  if (typeof args[0] === "string" && args[0].includes("was not wrapped in act(")) return;
  origConsoleError(...args);
};

const React = require(resolveOpt("react"));
const TestRenderer = require(resolveOpt(RTR_NAME));
const DATA = require(path.join(APP, "src/data.js"));

// ---- deep-freeze every exported seed collection BEFORE rendering, so any
// in-place mutation during render throws (strict mode) ----
function deepFreeze(o) {
  if (o && typeof o === "object" && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const k of Object.keys(o)) deepFreeze(o[k]);
  }
  return o;
}
for (const v of Object.values(DATA)) deepFreeze(v);

const ROUTES = require(APP_JS).__RENDER_CHECK_ROUTES__;
if (!ROUTES || typeof ROUTES !== "object" || !Object.keys(ROUTES).length) {
  console.error("render-check: FAILED — could not extract the ROUTES map from App.js (was it renamed?). Update scripts/render-check.js.");
  process.exit(1);
}
const META = new Map((DATA.ROUTE_META || []).map((m) => [m.name, m]));
const BULK = DATA.BULK || {};

// ---- render + tree helpers ----
function makeApp() {
  return {
    requests: DATA.INITIAL_REQUESTS,
    setRequests() {},
    profile: DATA.INITIAL_PROFILE,
    setProfile() {},
    session: { signedIn: true, guest: false },
    setSession() {},
    paymentMethods: DATA.PAYMENT_METHODS,
    setPaymentMethods() {}
  };
}
const noopNav = { push() {}, replace() {}, back() {}, root() {} };

function tryRender(Comp, params) {
  let renderer;
  try {
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        React.createElement(Comp, { nav: noopNav, params, app: makeApp() })
      );
    });
    const tree = renderer.toJSON();
    return { ok: true, tree, unmount: () => TestRenderer.act(() => renderer.unmount()) };
  } catch (error) {
    if (renderer) try { renderer.unmount(); } catch {}
    return { ok: false, error };
  }
}

function walk(json, fn) {
  if (json == null) return;
  if (Array.isArray(json)) return json.forEach((c) => walk(c, fn));
  if (typeof json !== "object") return;
  fn(json);
  walk(json.children, fn);
}

function collect(tree) {
  const testIDs = [], pressables = [], bare = [];
  walk(tree, (n) => {
    if (n.props && n.props.testID !== undefined) testIDs.push(n.props.testID);
    if (n.props && typeof n.props.onPress === "function") pressables.push(n);
    // bare primitive child under a non-text host = RN hard crash ({value && <Text>} / bare 0)
    if (n.type !== "Text" && n.type !== "TextInput" && Array.isArray(n.children)) {
      for (const c of n.children) {
        if (typeof c === "number" || (typeof c === "string" && c.length > 0)) {
          bare.push({ parent: n.type, child: c });
        }
      }
    }
  });
  return { testIDs, pressables, bare };
}

function isNotFound(tree) {
  let found = false;
  walk(tree, (n) => { if (n.props && n.props.testID === "notfound-home") found = true; });
  return found;
}

// ---- params derivation: BULK config first (authoritative for Tier B
// generic routes), else probe which params keys the component reads and try
// first-item ids from every seed collection. No route names hardcoded. ----
const ID_CANDIDATES = [...new Set(
  Object.values(DATA)
    .filter((v) => Array.isArray(v) && v[0] && typeof v[0] === "object" && v[0].id !== undefined)
    .map((v) => v[0].id)
)];
const CANDIDATES = [...ID_CANDIDATES, 1]; // 1 covers step-style params

function paramsFromBulk(cfg) {
  if (cfg.kind === "list" || cfg.kind === "form") return {};
  if (cfg.kind === "wizard") return { step: 1 };
  if (cfg.kind === "detail") {
    const coll = DATA[cfg.collection];
    if (Array.isArray(coll) && coll[0]) return { [cfg.param]: coll[0].id };
    return null;
  }
  return null;
}

function probeParamKeys(Comp) {
  const keys = new Set();
  const proxy = new Proxy({}, {
    get: (t, k) => { if (typeof k === "string") keys.add(k); return undefined; },
    has: () => true
  });
  const r = tryRender(Comp, proxy);
  if (r.ok) r.unmount();
  return [...keys];
}

function deriveRender(name, Comp) {
  const cfg = BULK[name];
  if (cfg) {
    const params = paramsFromBulk(cfg);
    if (params === null) return { skip: `BULK entry (kind=${cfg.kind}) has no usable collection/params` };
    const r = tryRender(Comp, params);
    if (!r.ok) return { skip: `render threw with BULK-derived params: ${r.error}` , hard: true };
    return { r, params };
  }
  const empty = tryRender(Comp, {});
  if (empty.ok && !isNotFound(empty.tree)) return { r: empty, params: {} };
  if (empty.ok) empty.unmount();

  const keys = probeParamKeys(Comp);
  if (!keys.length) {
    // no params read, yet NotFound or a throw: report it
    return empty.ok
      ? { skip: "renders NotFound with {} and reads no params" }
      : { skip: `render threw with {}: ${empty.error}`, hard: true };
  }
  if (keys.length > 2) return { skip: `reads ${keys.length} params (${keys.join(", ")}); derivation capped at 2` };
  const combos = keys.length === 1
    ? CANDIDATES.map((c) => [c])
    : CANDIDATES.flatMap((a) => CANDIDATES.map((b) => [a, b]));
  for (const combo of combos) {
    const params = Object.fromEntries(keys.map((k, i) => [k, combo[i]]));
    const r = tryRender(Comp, params);
    if (r.ok && !isNotFound(r.tree)) return { r, params };
    if (r.ok) r.unmount();
  }
  return { skip: `could not derive working params for keys [${keys.join(", ")}] from any seed collection id` };
}

// ---- run ----
const rendered = [], skipped = [], failures = [];
let assertions = 0;
function check(route, cond, msg) {
  assertions++;
  if (!cond) failures.push(`${route}: ${msg}`);
}

for (const [name, Comp] of Object.entries(ROUTES)) {
  const meta = META.get(name);
  check(name, !!meta, "route has no ROUTE_META entry (meta is the crawler's ground truth)");

  const d = deriveRender(name, Comp);
  if (d.skip) {
    if (d.hard) check(name, false, d.skip); // a throw on render is a real failure, not a skip
    else skipped.push(`${name}: ${d.skip}`);
    continue;
  }

  const { testIDs, pressables, bare } = collect(d.r.tree);

  check(
    name, bare.length === 0,
    `bare primitive outside <Text>: ${bare.map((b) => `${JSON.stringify(b.child)} in <${b.parent}>`).join(", ")}`
  );

  const dark = pressables.filter(
    (p) => !(typeof p.props.accessibilityLabel === "string" && p.props.accessibilityLabel.length) &&
           p.props.testID === undefined
  );
  check(
    name, dark.length === 0,
    `${dark.length} onPress element(s) with neither accessibilityLabel nor testID (types: ${dark.map((p) => p.type).join(", ")})`
  );

  if (meta) {
    if (meta.addressing === "sparse") {
      check(name, testIDs.length <= 2, `sparse route emits ${testIDs.length} testIDs (${testIDs.join(", ")}); max 2`);
    } else if (meta.addressing === "exhaustive") {
      const missingAnchors = (meta.anchors || []).filter((a) => !testIDs.includes(a));
      check(name, missingAnchors.length === 0, `exhaustive route missing declared anchor(s): ${missingAnchors.join(", ")}`);
    } else {
      check(name, false, `unknown addressing "${meta.addressing}" in ROUTE_META`);
    }
  }

  rendered.push(`${name}${Object.keys(d.params).length ? ` (params ${JSON.stringify(d.params)})` : ""}`);
  d.r.unmount();
}

// ---- summary ----
console.log(`render-check: ${rendered.length} rendered, ${skipped.length} skipped, ${assertions} assertions, ${failures.length} failure(s)`);
for (const s of skipped) console.log(`  skipped  ${s}`);
for (const f of failures) console.log(`  FAILED   ${f}`);
if (!failures.length) console.log("render-check: OK (renders under a mock host; not a device — see scripts/render-check.js header)");
process.exit(failures.length ? 1 : 0);
