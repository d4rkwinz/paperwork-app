const assert = require("assert");
const { buildGraph } = require("../src/graph.js");

const g = buildGraph();

assert.strictEqual(g.version, "1.1.0", "graph is stamped with the app version");
assert.ok(typeof g.keying === "string" && g.keying.length > 50, "graph documents its instance-keying contract");
assert.ok(Array.isArray(g.nodes) && Array.isArray(g.edges), "graph has nodes and edges");

// Route count is the headline number in CRAWLER.md; hold it to the spec.
assert.ok(g.nodes.length >= 50 && g.nodes.length <= 58, `~54 routes, got ${g.nodes.length}`);

const names = new Set(g.nodes.map((n) => n.name));
assert.strictEqual(names.size, g.nodes.length, "route names are unique");

// Every edge must land on a real route.
for (const e of g.edges) {
  assert.ok(names.has(e.from), `edge source ${e.from} is a real route`);
  assert.ok(names.has(e.to), `edge target ${e.to} is a real route`);
}

// Every trap needs a non-empty escape. A trap with no correct answer measures
// nothing, so this is the assertion that keeps the rubric honest.
for (const n of g.nodes) {
  if (n.trap) {
    assert.ok(n.escape && n.escape.length > 10, `trap ${n.name} documents an escape`);
  }
}
// The traps summary must bind to the data, not merely mirror buildGraph()'s
// own derivation: hold it to the spec count and to real routes with escapes.
assert.strictEqual(g.traps.length, 29, `trap count matches the spec (29), got ${g.traps.length}`);
for (const t of g.traps) {
  assert.ok(names.has(t.route), `traps summary route ${t.route} is a real route`);
  assert.ok(t.escape && t.escape.length > 10, `traps summary for ${t.route} carries a non-empty escape`);
}

// Every no-back route must have at least one outbound edge, or it is a genuine
// soft-lock rather than a solvable dead end.
for (const n of g.nodes.filter((x) => x.noBack)) {
  assert.ok(
    g.edges.some((e) => e.from === n.name),
    `no-back route ${n.name} has an in-content exit`
  );
}

// Every node reachable from the entry route. An unreachable route inflates the
// denominator and makes 100% coverage impossible. Reachability = in-content
// edges PLUS the tab bar: per the ROUTE_META edge convention, shell chrome
// (tab bar, chrome back) is not modeled as edges, but any route with
// noTabs === false shows the tab bar, which reaches every tab root.
const tabRoots = [...new Set(g.nodes.map((n) => n.tab).filter(Boolean))];
for (const t of tabRoots) {
  assert.ok(names.has(t), `tab root ${t} is a real route`);
}
const byName = new Map(g.nodes.map((n) => [n.name, n]));
const adjacency = new Map(g.nodes.map((n) => [n.name, []]));
for (const e of g.edges) adjacency.get(e.from).push(e.to);
const seen = new Set(["Login"]);
const queue = ["Login"];
while (queue.length) {
  const current = queue.shift();
  const targets = adjacency.get(current).slice();
  if (!byName.get(current).noTabs) targets.push(...tabRoots);
  for (const next of targets) {
    if (!seen.has(next)) { seen.add(next); queue.push(next); }
  }
}
const orphans = g.nodes.map((n) => n.name).filter((n) => !seen.has(n));
assert.deepStrictEqual(orphans, [], `every route is reachable from Login; orphans: ${orphans}`);

// Tier A and Tier B must both be non-empty and scored separately.
assert.ok(g.nodes.filter((n) => n.tier === "A").length >= 20, "at least 20 Tier A routes");
assert.ok(g.nodes.filter((n) => n.tier === "B").length >= 22, "at least 22 Tier B routes");

// Param instances must be finite - the termination guarantee. The total is the
// second headline number: 504 (route, params) pairs across 54 routes.
for (const n of g.nodes) {
  assert.ok(Number.isFinite(n.instances) && n.instances >= 1, `${n.name} has a finite instance count`);
}
assert.strictEqual(
  g.nodes.reduce((sum, n) => sum + n.instances, 0),
  504,
  "total param instances match the spec (504)"
);
assert.strictEqual(g.edges.length, 100, "edge count matches the spec (100)");

// Addressing policy: Tier A and v1 routes are exhaustively addressed and must
// declare at least one testID anchor, so check-graph can verify them. Tier B is
// sparse by design and declares at most the two generic anchors, so its traps
// are NOT mechanically verifiable - that limitation is documented in CRAWLER.md
// rather than asserted away here.
for (const n of g.nodes) {
  assert.ok(["exhaustive", "sparse"].includes(n.addressing), `${n.name} declares an addressing mode`);
  if (n.tier === "B") {
    assert.strictEqual(n.addressing, "sparse", `Tier B route ${n.name} is sparsely addressed`);
    assert.ok(n.anchors.length <= 2, `Tier B route ${n.name} declares at most 2 anchors, got ${n.anchors.length}`);
  } else {
    assert.strictEqual(n.addressing, "exhaustive", `${n.tier} route ${n.name} is exhaustively addressed`);
    assert.ok(n.anchors.length >= 1, `${n.name} declares at least one testID anchor`);
  }
  if (n.trap && n.addressing === "exhaustive") {
    assert.ok(n.anchors.length >= 1, `trap ${n.name} has a verifiable anchor`);
  }
}
