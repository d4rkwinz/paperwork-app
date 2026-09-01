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

const source = fs.readFileSync(path.join(__dirname, "..", "App.js"), "utf8");
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

// Regenerate and diff, so a stale committed JSON fails the check.
const expected = JSON.stringify(graph, null, 2) + "\n";
const onDisk = fs.readFileSync(path.join(__dirname, "..", "crawler-expected-graph.json"), "utf8");
assert.strictEqual(onDisk, expected, "crawler-expected-graph.json is stale - run `yarn graph`");

console.log(`check-graph: ${graph.nodes.length} routes, ${graph.edges.length} edges, OK`);
