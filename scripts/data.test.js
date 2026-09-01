const assert = require("assert");
const fs = require("fs");
const path = require("path");
const data = require("../src/data.js");
const { slug } = require("../src/slug.js");

const { SERVICES, DATES, TIMES, PRIORITIES, ADDRESSES, INITIAL_REQUESTS, ROUTE_META } = data;

// slug() is the single source of truth for testID derivation across the
// whole project (screens, ui.js, and this test all use src/slug.js) - a
// later task generates 22 more routes' testIDs from it, so pin its known
// mappings here to catch any accidental behavior change at the source.
assert.strictEqual(slug("8:00 AM"), "8-00-am", 'slug("8:00 AM") is stable');
assert.strictEqual(
  slug("Office - 9 Market Plaza"),
  "office-9-market-plaza",
  'slug("Office - 9 Market Plaza") is stable'
);

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

// Every anchor must be a real testID in the specific file that renders the
// route declaring it - not merely somewhere in the union of all screen
// sources. A global union lets a copy-paste mistake in a ROUTE_META entry
// (e.g. RequestDetail claiming Login's "login-submit") pass silently, since
// that testID is real, just not RequestDetail's. This is a plain text/regex
// scan of source (same technique scripts/wiring.test.js already uses on
// App.js, and scripts/check-graph.js later uses too) - it has no idea what
// actually renders at runtime.
//
// What it catches: typos, renames, deletions, and copy-paste mistakes -
// anchors that quietly stop existing in the route's own source. What it
// CANNOT catch: whether an anchor is conditionally rendered (i.e. only
// present in some states of a route, like forgot-submit disappearing after
// ForgotPassword's "sent" state) - that judgement stays manual.
const screensDir = path.join(__dirname, "..", "src", "screens");

// Resolve route name -> component identifier from App.js's ROUTES map
// (App.js is JSX and can't be require()'d from plain node).
const appSrc = fs.readFileSync(path.join(__dirname, "..", "App.js"), "utf8");
const routesBlockMatch = appSrc.match(/const ROUTES = \{([\s\S]*?)\n\};/);
assert.ok(routesBlockMatch, "expected a `const ROUTES = { ... };` map in App.js");
const routeToComponent = {};
for (const rawEntry of routesBlockMatch[1].split(",").map((s) => s.trim()).filter(Boolean)) {
  const [routeName, component] = rawEntry.split(":").map((s) => s.trim());
  routeToComponent[routeName] = component;
}

// Resolve each component identifier to the file that exports it, by
// scanning src/screens/*.js and src/ui.js for `export function <Identifier>`.
const screenFilePaths = fs
  .readdirSync(screensDir)
  .filter((f) => f.endsWith(".js"))
  .map((f) => path.join(screensDir, f));
const uiPath = path.join(__dirname, "..", "src", "ui.js");
const sourceFilePaths = screenFilePaths.concat([uiPath]);

const fileTextByPath = new Map();
const componentToFile = {};
for (const filePath of sourceFilePaths) {
  const text = fs.readFileSync(filePath, "utf8");
  fileTextByPath.set(filePath, text);
  for (const m of text.matchAll(/export function (\w+)/g)) {
    componentToFile[m[1]] = filePath;
  }
}

// Dynamic testIDs (testID={`...`}) can't be matched by exact string, and a
// generic wildcard regex here is actively dangerous: e.g. Requests.js's card
// testID={`request-${request.id}`} would make a regex like /^request-.*$/
// match almost any broken anchor that happens to start with "request-",
// including a typo'd "request-detail" - exactly the bug class this check
// exists to catch. Instead, reconstruct the real, finite set of values each
// dynamic testID can take from the same data this app renders from, which
// this test already has (SERVICES, ADDRESSES, and each ChoiceRow's declared
// options) - scoped to only the file whose text actually contains that
// dynamic template, so the reconstruction doesn't leak values into files
// that never render them.
const KNOWN_OPTION_LISTS = { DATES, TIMES, PRIORITIES, ADDRESSES };
function buildTestIdsForFile(text) {
  const ids = new Set();
  for (const m of text.matchAll(/testID="([^"]+)"/g)) {
    ids.add(m[1]);
  }
  if (text.includes("testID={`service-${service.id}`}")) {
    for (const service of SERVICES) ids.add(`service-${service.id}`);
  }
  if (text.includes("testID={`select-address-${slug(address)}`}")) {
    for (const address of ADDRESSES) ids.add(`select-address-${slug(address)}`);
  }
  // ChoiceRow (src/ui.js) renders one option per <ChoiceRow options={...}
  // testPrefix="..."> call site as testID={`${testPrefix}-${slug(option)}`}.
  // Resolve each call site's options - either an inline string array, or one
  // of this same module's exported option lists - against its testPrefix.
  for (const m of text.matchAll(/<ChoiceRow\s+([^>]*?)\/>/g)) {
    const tag = m[1];
    const prefixMatch = tag.match(/testPrefix="([^"]+)"/);
    const optionsMatch = tag.match(/options=\{(\[[^\]]*\]|[A-Z_]+)\}/);
    if (!prefixMatch || !optionsMatch) continue; // unresolvable shape - anchors relying on it correctly fail below
    const options = optionsMatch[1].startsWith("[") ? JSON.parse(optionsMatch[1]) : KNOWN_OPTION_LISTS[optionsMatch[1]] || [];
    for (const option of options) {
      ids.add(`${prefixMatch[1]}-${slug(option)}`);
    }
  }
  return ids;
}

const testIdsByFile = new Map();
for (const [filePath, text] of fileTextByPath) {
  testIdsByFile.set(filePath, buildTestIdsForFile(text));
}

for (const entry of ROUTE_META) {
  const component = routeToComponent[entry.name];
  assert.ok(
    component,
    `ROUTE_META.${entry.name} has no matching entry in App.js's ROUTES map - cannot resolve which file renders it`
  );
  const file = componentToFile[component];
  assert.ok(
    file,
    `ROUTE_META.${entry.name}'s component "${component}" has no "export function ${component}" found under src/screens/*.js or src/ui.js`
  );
  const fileTestIds = testIdsByFile.get(file);
  for (const anchor of entry.anchors) {
    assert.ok(
      fileTestIds.has(anchor),
      `ROUTE_META.${entry.name} declares anchor "${anchor}", but no testID matching it was found in ${path.relative(path.join(__dirname, ".."), file)} (the file that renders ${entry.name}) - check for a typo, a rename, a copy-paste from another route's anchor, or an anchor that only exists in some of the route's states`
    );
  }
}

// Edge drift check: every literal nav.push("X") / nav.replace("X") /
// nav.root("X") target in a screen file must appear as an edge `to` on at
// least one ROUTE_META entry whose component is exported from that same
// file. This catches the drift class where a screen gains (or keeps) a nav
// call whose target no route in the file declares as an edge.
//
// What it CANNOT catch - these remain governed by the manual convention in
// src/data.js's ROUTE_META comment and are invisible to this per-file
// literal scan:
//   - nav.back() edges (e.g. card-submit -> PaymentMethods, legal-close ->
//     Preferences): back has no literal target to scan for.
//   - Edges arising from shared components rendered by a screen, such as
//     ui.js's NotFound (notfound-home -> nav.root("Home")): the literal
//     lives in ui.js, not the screen file.
//   - Attribution to the RIGHT route within a file: it only proves SOME
//     route in the file declares the edge, not that the correct one does.
const fileToEdgeTargets = new Map();
for (const entry of ROUTE_META) {
  const file = componentToFile[routeToComponent[entry.name]];
  if (!fileToEdgeTargets.has(file)) fileToEdgeTargets.set(file, new Set());
  for (const edge of entry.edges) fileToEdgeTargets.get(file).add(edge.to);
}
for (const filePath of screenFilePaths) {
  const text = fileTextByPath.get(filePath);
  const declaredTargets = fileToEdgeTargets.get(filePath) || new Set();
  for (const m of text.matchAll(/nav\.(push|replace|root)\("([^"]+)"/g)) {
    assert.ok(
      declaredTargets.has(m[2]),
      `${path.relative(path.join(__dirname, ".."), filePath)} calls nav.${m[1]}("${m[2]}"), but no ROUTE_META entry rendered from that file declares an edge to "${m[2]}" - add the edge to the route whose control makes this call (this scan cannot tell which route that is)`
    );
  }
}

const { DOCUMENTS, DOCS_PAGE_SIZE, INVOICES } = data;

assert.strictEqual(DOCUMENTS.length, 60, "DOCUMENTS is exactly 60 items");
const docIds = DOCUMENTS.map((d) => d.id);
assert.strictEqual(new Set(docIds).size, 60, "document ids are unique");
for (const d of DOCUMENTS) {
  assert.ok(d.title, `document ${d.id} has a title`);
  assert.strictEqual(typeof d.sizeKb, "number", `document ${d.id} sizeKb is numeric`);
}

// The load-more generator must be provably bounded: a finite number of taps
// exhausts it. This is what lets a run-to-exhaustion crawler terminate.
assert.ok(DOCS_PAGE_SIZE > 0, "page size is positive");
const pages = Math.ceil(DOCUMENTS.length / DOCS_PAGE_SIZE);
assert.ok(Number.isFinite(pages) && pages <= 10, `load-more terminates in ${pages} taps`);

// At least one invoice with a zero amount and one with an empty status, to keep
// the falsy-and regression covered by seed data rather than by memory.
assert.ok(INVOICES.some((i) => i.amount === 0), "an invoice with amount 0 exists");
assert.ok(INVOICES.some((i) => i.status === ""), "an invoice with an empty status exists");
