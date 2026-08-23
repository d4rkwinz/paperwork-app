const assert = require("assert");
const data = require("../src/data.js");

const { SERVICES, DATES, TIMES, PRIORITIES, ADDRESSES, INITIAL_REQUESTS, ROUTE_META } = data;

assert.ok(Array.isArray(SERVICES) && SERVICES.length > 0, "SERVICES is a non-empty array");

// Every service has the fields the screens dereference without guarding.
for (const s of SERVICES) {
  for (const field of ["id", "title", "category", "short", "details", "price", "eta", "accent"]) {
    assert.ok(s[field], `service ${s.id} has ${field}`);
  }
  assert.match(s.accent, /^#[0-9A-Fa-f]{6}$/, `service ${s.id} accent is a hex color`);
}

// Service ids must be unique - they are used as route params.
const ids = SERVICES.map((s) => s.id);
assert.strictEqual(new Set(ids).size, ids.length, "service ids are unique");

// Every seeded request points at a real service and a real address.
for (const r of INITIAL_REQUESTS) {
  assert.ok(ids.includes(r.serviceId), `request ${r.id} references a real service`);
  assert.ok(ADDRESSES.includes(r.address), `request ${r.id} uses a seeded address`);
  assert.ok(DATES.includes(r.date) || /^[A-Z][a-z]{2} [A-Z][a-z]{2} \d+$/.test(r.date), `request ${r.id} date is a choice or a literal date`);
  assert.ok(TIMES.includes(r.time), `request ${r.id} time is one of TIMES`);
  assert.ok(PRIORITIES.includes(r.priority), `request ${r.id} priority is one of PRIORITIES`);
  assert.ok(Array.isArray(r.timeline) && r.timeline.length > 0, `request ${r.id} has a timeline`);
}

// Request ids must be unique - they are route params and testID suffixes.
const reqIds = INITIAL_REQUESTS.map((r) => r.id);
assert.strictEqual(new Set(reqIds).size, reqIds.length, "request ids are unique");

// ROUTE_META is the ground-truth source Task 14's crawler-graph checker
// builds from. Validate its shape here so a bad entry fails loudly at the
// data layer instead of silently corrupting a later task's graph.
assert.ok(Array.isArray(ROUTE_META) && ROUTE_META.length > 0, "ROUTE_META is a non-empty array");

const REQUIRED_FIELDS = [
  "name",
  "tier",
  "addressing",
  "anchors",
  "tab",
  "instances",
  "noBack",
  "noTabs",
  "terminal",
  "trap",
  "escape",
  "edges"
];

for (const entry of ROUTE_META) {
  for (const field of REQUIRED_FIELDS) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(entry, field),
      `ROUTE_META entry "${entry.name}" is missing field "${field}"`
    );
  }
  assert.ok(Array.isArray(entry.anchors), `ROUTE_META.${entry.name}.anchors must be an array`);
  for (const anchor of entry.anchors) {
    assert.ok(
      typeof anchor === "string" && anchor.length > 0,
      `ROUTE_META.${entry.name} has an anchor that is not a non-empty string: ${JSON.stringify(anchor)}`
    );
  }
  assert.ok(Array.isArray(entry.edges), `ROUTE_META.${entry.name}.edges must be an array`);
  if (entry.trap !== null) {
    assert.ok(
      typeof entry.escape === "string" && entry.escape.length > 0,
      `ROUTE_META.${entry.name} has a trap but no non-empty escape - a trap with no documented correct answer measures nothing`
    );
  }
}

// Route names must be unique - they are the graph's node identifiers.
const routeNames = ROUTE_META.map((entry) => entry.name);
assert.strictEqual(new Set(routeNames).size, routeNames.length, "ROUTE_META names are unique");

// Every edge must point at a real ROUTE_META entry - a dangling edge would
// make the ground-truth graph unbuildable.
const routeNameSet = new Set(routeNames);
for (const entry of ROUTE_META) {
  for (const edge of entry.edges) {
    assert.ok(
      routeNameSet.has(edge.to),
      `ROUTE_META.${entry.name} has an edge to "${edge.to}", which is not a real ROUTE_META entry`
    );
  }
}
