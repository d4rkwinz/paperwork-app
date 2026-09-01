// The divergence guard: App.js's ROUTES map, data.js's ROUTE_META, and the
// committed crawler-expected-graph.json must all agree, or the fixture is no
// longer the measurement its rubric claims.
//
// ponytail: text-scans App.js for ROUTES keys because App.js contains JSX and
// cannot be require()d under plain node (same technique as wiring.test.js and
// data.test.js). Upgrade path: if App.js ever gains a build step, import the
// map directly.
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { buildGraph } = require("../src/graph.js");

const raw = fs.readFileSync(path.join(__dirname, "..", "App.js"), "utf8");
// Strip /* */ block comments first: a block-commented-out route would still
// match the per-line key regex below and silently pass the scan.
const source = raw.replace(/\/\*[\s\S]*?\*\//g, "");
const block = /const ROUTES = \{([\s\S]*?)\n\};/.exec(source);
assert.ok(block, "found the ROUTES map in App.js");
const declared = block[1]
  .split("\n")
  .map((line) => /^\s*([A-Za-z0-9_]+)\s*:/.exec(line))
  .filter(Boolean)
  .map((m) => m[1]);

const graph = buildGraph();
const inGraph = new Set(graph.nodes.map((n) => n.name));
const inApp = new Set(declared);

const missingFromGraph = declared.filter((n) => !inGraph.has(n));
const missingFromApp = [...inGraph].filter((n) => !inApp.has(n));

assert.deepStrictEqual(missingFromGraph, [], `routes in App.js but not in ROUTE_META: ${missingFromGraph}`);
assert.deepStrictEqual(missingFromApp, [], `routes in ROUTE_META but not in App.js: ${missingFromApp}`);

// Shell-chrome contracts: the graph's noBack/noTabs flags and its reachability
// model (tab bar reaches every tab root) are promises about App.js's NO_BACK /
// NO_TABS sets and ScreenFrame's tab bar. Verify membership in both directions
// so both an added and a removed member fail.
function parseAppSet(name) {
  const m = new RegExp(`const ${name} = new Set\\(\\[([^\\]]*)\\]\\)`).exec(source);
  assert.ok(m, `found the ${name} set in App.js`);
  return new Set([...m[1].matchAll(/"([A-Za-z0-9_]+)"/g)].map((x) => x[1]));
}
for (const [setName, flag] of [["NO_BACK", "noBack"], ["NO_TABS", "noTabs"]]) {
  const appSet = parseAppSet(setName);
  const graphSet = new Set(graph.nodes.filter((n) => n[flag]).map((n) => n.name));
  for (const r of appSet) {
    assert.ok(
      graphSet.has(r),
      `App.js ${setName} contains "${r}" but the graph declares ${flag}: false for it - ` +
        `either restore App.js, or set ${flag} in ROUTE_META and run \`yarn graph\``
    );
  }
  for (const r of graphSet) {
    assert.ok(
      appSet.has(r),
      `graph declares ${flag}: true for "${r}" but App.js ${setName} does not contain it - ` +
        `either restore App.js, or clear ${flag} in ROUTE_META and run \`yarn graph\``
    );
  }
}

// Tab bar rows: graph.test.js's reachability BFS assumes the tab bar reaches
// every tab root. Make that real: ScreenFrame must render exactly one <Tab>
// row per distinct tab root referenced by the graph's nodes.
const frame = /function ScreenFrame[\s\S]*/.exec(source);
assert.ok(frame, "found ScreenFrame in App.js");
const tabRows = new Set(
  [...frame[0].matchAll(/<Tab\s[\s\S]*?onTab\("([A-Za-z0-9_]+)"\)/g)].map((m) => m[1])
);
const tabRoots = new Set(graph.nodes.map((n) => n.tab).filter(Boolean));
for (const t of tabRoots) {
  assert.ok(
    tabRows.has(t),
    `graph routes use tab root "${t}" but ScreenFrame's tab bar has no <Tab> row for it - ` +
      `that whole chain is unreachable on device; restore the row, or remodel ROUTE_META and run \`yarn graph\``
  );
}
for (const t of tabRows) {
  assert.ok(
    tabRoots.has(t),
    `ScreenFrame's tab bar has a <Tab> row for "${t}" but no graph route uses it as a tab root - ` +
      `the graph under-models reachability; remove the row, or update ROUTE_META and run \`yarn graph\``
  );
}

// Regenerate and diff, so a stale committed JSON fails the check.
const expected = JSON.stringify(graph, null, 2) + "\n";
const onDisk = fs.readFileSync(path.join(__dirname, "..", "crawler-expected-graph.json"), "utf8");
assert.strictEqual(onDisk, expected, "crawler-expected-graph.json is stale - run `yarn graph`");

console.log(`check-graph: ${graph.nodes.length} routes, ${graph.edges.length} edges, OK`);
