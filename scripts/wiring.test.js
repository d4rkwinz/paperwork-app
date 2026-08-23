// ponytail: this is a text scan of App.js, not a render test. It cannot prove
// runtime behavior (React reconciliation, actual remounts, actual prop
// values) - it only catches the four named regressions at the source-text
// level. Upgrade path: a real render test (e.g. @testing-library/react-native
// snapshotting mounted instances across navigations) if App.js ever gains a
// build step / test framework. Until then, this is the only plain-node way
// to guard the <Screen key={route.key} .../> call site, since App.js is JSX
// and cannot be require()'d (same constraint scripts/check-graph.js works
// around by reading App.js as text).
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const appSrc = fs.readFileSync(path.join(__dirname, "..", "App.js"), "utf8");

// 1. The single screen slot must be keyed by route.key, not route.name or
// route.params. See src/navcore.js: `key` is a monotonic counter, unique per
// navigation even when two routes share a name or a component. If the call
// site keyed by route.name instead, React would reuse the component instance
// across a nav.replace to the same route name (or across two routes that
// happen to share a component), so useState initializers would not re-run
// and form drafts would leak between screens.
const screenTagMatch = appSrc.match(/<Screen\s+key=\{([^}]*)\}/);
assert.ok(
  screenTagMatch,
  "expected a `<Screen key={...}>` call site in App.js - without it, the keyed-slot invariant this test guards cannot be located at all"
);
const keyExpr = screenTagMatch[1].trim();
assert.notStrictEqual(
  keyExpr,
  "route.name",
  "regression: Screen is keyed by route.name - React would reuse the component instance across two routes sharing a component, or across a nav.replace to the same route name, so useState initializers would not re-run and form drafts would leak between screens"
);
assert.ok(
  !/^route\.params/.test(keyExpr),
  `regression: Screen is keyed by "${keyExpr}" (route.params...) - a params-derived key is not guaranteed unique per navigation and can repeat, causing the same stale-instance-reuse bug as keying by route.name`
);
assert.strictEqual(
  keyExpr,
  "route.key",
  `Screen must be keyed by route.key (the monotonic per-navigation id minted in src/navcore.js), got key={${keyExpr}}`
);

// 2. Exactly one <Screen ...> element, so the keyed-slot invariant above
// can't be quietly bypassed by adding a second, unkeyed screen slot
// elsewhere in the tree.
const screenElementMatches = appSrc.match(/<Screen(?=[\s/>])/g) || [];
assert.strictEqual(
  screenElementMatches.length,
  1,
  `expected exactly one <Screen ...> element in App.js so the keyed <Screen key={route.key}> slot is the only render path for route components; found ${screenElementMatches.length}`
);

// 3. Every ROUTES value is a bare component identifier - not an inline arrow
// function or JSX literal, which would bypass the keyed slot entirely and
// reintroduce the remount bug the key exists to prevent.
const routesMatch = appSrc.match(/const ROUTES = \{([\s\S]*?)\n\};/);
assert.ok(routesMatch, "expected a `const ROUTES = { ... };` map in App.js");
const routeEntries = routesMatch[1]
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
assert.ok(routeEntries.length > 0, "ROUTES map is present but has no entries");
for (const entry of routeEntries) {
  const parts = entry.split(":");
  assert.strictEqual(
    parts.length,
    2,
    `ROUTES entry "${entry}" is not a simple "Name: Component" pair - cannot verify its value is a bare identifier`
  );
  const routeName = parts[0].trim();
  const value = parts[1].trim();
  assert.ok(
    /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value),
    `ROUTES.${routeName} must map to a bare component identifier, got "${value}" - an inline arrow function or JSX literal here renders outside the keyed <Screen key={route.key}> slot and reintroduces the state-leak bug that key exists to prevent`
  );
}

// 4. NO_BACK and NO_TABS are declared as Sets and are actually referenced in
// the canBack / showTabs expressions passed to ScreenFrame. Both sets are
// empty today and their code paths are dead until a later task populates
// them - exactly the condition under which a silent miswiring (e.g. the
// expression forgetting to consult the set) would go unnoticed by every
// other check.
assert.ok(
  /const\s+NO_TABS\s*=\s*new Set\(/.test(appSrc),
  "NO_TABS must be declared as `new Set(...)` - showTabs below assumes Set#has"
);
assert.ok(
  /const\s+NO_BACK\s*=\s*new Set\(/.test(appSrc),
  "NO_BACK must be declared as `new Set(...)` - canBack below assumes Set#has"
);

const canBackMatch = appSrc.match(/canBack=\{([^}]*)\}/);
assert.ok(canBackMatch, "expected a canBack={...} prop passed to ScreenFrame");
assert.ok(
  canBackMatch[1].includes("NO_BACK"),
  `canBack expression "${canBackMatch[1]}" does not reference NO_BACK - NO_BACK is currently empty so this path is dead code today, which is exactly when a silently dropped wiring would go unnoticed until a later task populates the set`
);

const showTabsMatch = appSrc.match(/showTabs=\{([^}]*)\}/);
assert.ok(showTabsMatch, "expected a showTabs={...} prop passed to ScreenFrame");
assert.ok(
  showTabsMatch[1].includes("NO_TABS"),
  `showTabs expression "${showTabsMatch[1]}" does not reference NO_TABS - same silent-miswiring risk as canBack/NO_BACK above`
);
