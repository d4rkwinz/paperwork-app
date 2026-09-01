const assert = require("assert");
const fs = require("fs");
const path = require("path");
const data = require("../src/data.js");
const { slug } = require("../src/slug.js");

const { SERVICES, DATES, TIMES, PRIORITIES, ADDRESSES, INITIAL_REQUESTS, ROUTE_META, BULK } = data;

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

// Tier B routes render through src/screens/generic.js, whose only testIDs
// are the dynamic templates `${cfg.testPrefix}-list` (ListScreen's
// ScrollView) and `${cfg.testPrefix}-primary` (detail primary action / form
// submit / wizard next). Reconstruct the exact, per-route set from BULK -
// stronger than the per-file scoping above, since two Tier B routes share
// the same source file but must never claim each other's anchors. A detail
// route with no actions renders NO primary button, so it legitimately has
// zero addressable testIDs and any anchor on it must fail.
function bulkTestIds(cfg) {
  return cfg.kind === "list"
    ? new Set([`${cfg.testPrefix}-list`])
    : cfg.kind === "detail" && !(cfg.actions && cfg.actions.length)
      ? new Set()
      : new Set([`${cfg.testPrefix}-primary`]);
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
  const bulkCfg = BULK[entry.name];
  const fileTestIds = bulkCfg ? bulkTestIds(bulkCfg) : testIdsByFile.get(file);
  for (const anchor of entry.anchors) {
    assert.ok(
      fileTestIds.has(anchor),
      `ROUTE_META.${entry.name} declares anchor "${anchor}", but no testID matching it was found in ${bulkCfg ? `its BULK config (kind ${bulkCfg.kind}, testPrefix ${bulkCfg.testPrefix})` : `${path.relative(path.join(__dirname, ".."), file)} (the file that renders ${entry.name})`} - check for a typo, a rename, a copy-paste from another route's anchor, or an anchor that only exists in some of the route's states`
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

// ---------------------------------------------------------------------------
// BULK sanity (Task 12). BULK configs are executed blind by the generic
// renderers: a typo'd `collection` is an immediate `undefined.map` TypeError
// at runtime, and a push whose params don't resolve in the target's
// collection lands on NotFound. What this pass covers:
//   - shape/keys per kind, collection existence, unique ids, testPrefixes
//   - EVERY push shape generic.js can produce resolves: list rows
//     (itemRoute + { [itemParam]: item.id }), detail actions
//     ({ [cfg.param]: id, ...action.params }), deep links (linkField /
//     deepLinkField), and form/wizard exits (nextRoute + nextParams)
//   - Tier B edge parity in BOTH directions: derived nav targets ==
//     declared ROUTE_META edges (modulo the gated NotFound -> Home edge)
//   - detail instances counts equal their collection's length
// What it still CANNOT catch:
//   - Tier A screens' own hardcoded pushes (outside BULK; the literal nav
//     scan above checks their edge names but not their params)
//   - params pushed into a Tier A route missing from
//     TIER_A_PARAM_COLLECTIONS (assertParamsResolve fails loudly instead
//     of guessing, but only when data actually carries such a push)
//   - instances for param-aliased routes (e.g. NotificationSettings 25,
//     RecurrencePicker 45) and wizard step counts - still hand-derived
//   - edge FLAGS (requiresInput/gated/cycle) and anything about runtime
//     state, conditional rendering, or filter behavior

const KIND_KEYS = {
  list: ["title", "heading", "collection", "itemLabel", "testPrefix"],
  detail: ["collection", "param", "label", "titleField", "rows", "testPrefix"],
  form: ["title", "heading", "fields", "submitLabel", "nextRoute", "testPrefix"],
  wizard: ["title", "label", "route", "steps", "submitLabel", "nextRoute", "testPrefix"]
};

// Where params pushed into a route must resolve. Tier B routes resolve via
// their own BULK config; these are the Tier A param-taking routes that Tier B
// deep links target.
const TIER_A_PARAM_COLLECTIONS = {
  RequestDetail: ["requestId", INITIAL_REQUESTS],
  PaymentReview: ["invoiceId", INVOICES],
  DocumentDetail: ["docId", DOCUMENTS],
  ServiceDetail: ["serviceId", SERVICES]
};

// Assert that pushing `route` with `params` lands on a found state, not
// NotFound - for every navigation whose params are DATA (list rows, detail
// actions, deep links, Security's link rows, form/wizard nextParams), where
// a stale id would otherwise fail silently at runtime.
function assertParamsResolve(route, params, context) {
  const target = BULK[route];
  if (target && target.kind === "detail") {
    const id = params ? params[target.param] : undefined;
    assert.ok(
      data[target.collection].some((item) => item.id === id),
      `${context} pushes ${route} with ${target.param}=${JSON.stringify(id)}, which is not an id in ${target.collection} - it would render NotFound`
    );
  } else if (target && target.kind === "wizard") {
    const step = params ? params.step : undefined;
    assert.ok(
      Number.isInteger(step) && step >= 1 && step <= target.steps.length,
      `${context} pushes wizard ${route} with step=${JSON.stringify(step)} (valid: integer 1..${target.steps.length}) - it would render NotFound`
    );
  } else if (target) {
    // BULK lists and forms ignore params (param aliasing is by design).
  } else if (TIER_A_PARAM_COLLECTIONS[route]) {
    const [param, collection] = TIER_A_PARAM_COLLECTIONS[route];
    const id = params ? params[param] : undefined;
    assert.ok(
      collection.some((item) => item.id === id),
      `${context} pushes ${route} with ${param}=${JSON.stringify(id)}, which is not a seeded id - it would render NotFound`
    );
  } else {
    // A Tier A route this test cannot classify: rather than silently
    // accepting params we cannot verify, fail loudly and force a decision.
    assert.ok(
      !params || Object.keys(params).length === 0,
      `${context} pushes ${route} with params ${JSON.stringify(params)}, but this test does not know how ${route} consumes params - add it to TIER_A_PARAM_COLLECTIONS if it dereferences an id, or drop the params if it ignores them`
    );
  }
}

const bulkNames = Object.keys(BULK);
assert.ok(bulkNames.length > 0, "BULK is populated");

// BULK and tier-B ROUTE_META must be the same set of routes.
const tierBNames = ROUTE_META.filter((entry) => entry.tier === "B").map((entry) => entry.name);
assert.deepStrictEqual(
  [...bulkNames].sort(),
  [...tierBNames].sort(),
  "BULK keys and tier-B ROUTE_META entries must be the same route set"
);

// testPrefixes must be unique - two routes sharing one would emit identical
// testIDs on distinct routes, silently aliasing their anchors.
const prefixes = bulkNames.map((name) => BULK[name].testPrefix);
assert.strictEqual(new Set(prefixes).size, prefixes.length, "BULK testPrefixes are unique");

for (const [name, cfg] of Object.entries(BULK)) {
  const meta = ROUTE_META.find((entry) => entry.name === name);
  assert.ok(meta.addressing === "sparse", `BULK.${name}'s ROUTE_META entry must be addressing: "sparse"`);
  assert.ok(meta.anchors.length <= 2, `BULK.${name} is sparse - at most 2 anchors, got ${meta.anchors.length}`);

  assert.ok(KIND_KEYS[cfg.kind], `BULK.${name}.kind "${cfg.kind}" is not list|detail|form|wizard`);
  for (const key of KIND_KEYS[cfg.kind]) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(cfg, key),
      `BULK.${name} (kind ${cfg.kind}) is missing required key "${key}"`
    );
  }

  const declaredEdges = new Set(meta.edges.map((edge) => edge.to));
  // Every nav target this config can produce must be a real route AND a
  // declared edge on this route's ROUTE_META entry (the Tier B analog of the
  // literal nav-scan drift check above, which cannot see dynamic targets).
  const navTargets = [];

  if (cfg.kind === "list" || cfg.kind === "detail") {
    const collection = data[cfg.collection];
    assert.ok(
      Array.isArray(collection) && collection.length > 0,
      `BULK.${name}.collection "${cfg.collection}" does not resolve to a non-empty exported array - DATA[collection].map would throw at runtime`
    );
    const itemIds = collection.map((item) => item.id);
    assert.strictEqual(
      new Set(itemIds).size,
      itemIds.length,
      `BULK.${name}.collection "${cfg.collection}" has duplicate ids - ids are row keys and route params`
    );
    for (const id of itemIds) {
      assert.ok(id !== undefined && id !== null && String(id).length > 0, `BULK.${name}.collection "${cfg.collection}" has an item with no id`);
    }
  }

  if (cfg.kind === "list") {
    for (const item of data[cfg.collection]) {
      assert.ok(String(cfg.itemLabel(item)).length > 0, `BULK.${name}.itemLabel is empty for item ${item.id}`);
      if (cfg.itemSub) {
        assert.ok(String(cfg.itemSub(item)).length > 0, `BULK.${name}.itemSub is empty for item ${item.id}`);
      }
    }
    if (cfg.linkField) {
      // Hub list: every row MUST carry a link, or that row has nowhere to go.
      for (const item of data[cfg.collection]) {
        const link = item[cfg.linkField];
        assert.ok(link && typeof link.route === "string", `BULK.${name} uses linkField "${cfg.linkField}" but item ${item.id} has no ${cfg.linkField}.route`);
        navTargets.push(link.route);
        assertParamsResolve(link.route, link.params, `BULK.${name} row ${item.id}`);
      }
    } else {
      assert.ok(cfg.itemRoute && cfg.itemParam, `BULK.${name} is a list with neither linkField nor itemRoute+itemParam - its rows have nowhere to go`);
      navTargets.push(cfg.itemRoute);
      // Every row pushes itemRoute with { [itemParam]: item.id } - the same
      // shape ListScreen produces. Each of those pushes must resolve, or a
      // whole list's rows dead-end on NotFound (e.g. a list whose collection
      // is not the one its detail route reads).
      for (const item of data[cfg.collection]) {
        assertParamsResolve(cfg.itemRoute, { [cfg.itemParam]: item.id }, `BULK.${name} row ${item.id}`);
      }
    }
  }

  if (cfg.kind === "detail") {
    const collection = data[cfg.collection];
    for (const item of collection) {
      assert.ok(item[cfg.titleField] !== undefined, `BULK.${name}.titleField "${cfg.titleField}" is missing on item ${item.id}`);
    }
    assert.ok(Array.isArray(cfg.rows) && cfg.rows.length > 0, `BULK.${name}.rows must be a non-empty array`);
    for (const row of cfg.rows) {
      assert.ok(Array.isArray(row) && row.length === 2, `BULK.${name} has a malformed row ${JSON.stringify(row)} - expected [label, field]`);
      for (const item of collection) {
        assert.ok(item[row[1]] !== undefined, `BULK.${name} row field "${row[1]}" is missing on item ${item.id}`);
      }
    }
    // instances is hand-written in ROUTE_META, but for a detail route it is
    // by definition one per collection item - pin the two together.
    assert.strictEqual(
      meta.instances,
      collection.length,
      `ROUTE_META.${name}.instances is ${meta.instances}, but its collection ${cfg.collection} has ${collection.length} items - a detail route has exactly one instance per item`
    );
    const actions = cfg.actions ? cfg.actions : [];
    for (const action of actions) {
      assert.ok(action.label && action.route, `BULK.${name} has an action missing label or route`);
      navTargets.push(action.route);
      // Every action pushes { [cfg.param]: id, ...action.params } - the same
      // shape DetailScreen produces - for each of this detail's instances.
      // This is what requires wizard targets to carry step: 1 in
      // action.params, and detail targets to share resolvable ids.
      for (const item of collection) {
        assertParamsResolve(
          action.route,
          { [cfg.param]: item.id, ...action.params },
          `BULK.${name} action "${action.label}" (from item ${item.id})`
        );
      }
    }
    // A detail with no actions emits ZERO testIDs; its ROUTE_META anchors
    // are already checked against the derived (empty) set above.
    if (cfg.deepLinkField) {
      let linked = 0;
      for (const item of collection) {
        const link = item[cfg.deepLinkField];
        if (!link) continue;
        linked += 1;
        assert.ok(typeof link.route === "string", `BULK.${name} item ${item.id} deep link has no route`);
        navTargets.push(link.route);
        assertParamsResolve(link.route, link.params, `BULK.${name} item ${item.id} deep link`);
      }
      assert.ok(linked > 0, `BULK.${name} declares deepLinkField "${cfg.deepLinkField}" but no item in ${cfg.collection} carries it`);
    }
  }

  if (cfg.kind === "form" || cfg.kind === "wizard") {
    const fieldGroups = cfg.kind === "form" ? [cfg.fields] : cfg.steps.map((step) => step.fields);
    assert.ok(fieldGroups.length > 0, `BULK.${name} has no fields/steps`);
    for (const fields of fieldGroups) {
      assert.ok(Array.isArray(fields) && fields.length > 0, `BULK.${name} has an empty field group`);
      for (const field of fields) {
        assert.ok(field.key && field.label, `BULK.${name} has a field missing key or label`);
      }
    }
    if (cfg.kind === "wizard") {
      assert.strictEqual(cfg.route, name, `BULK.${name}.route must be the wizard's own route name, got "${cfg.route}"`);
      for (const step of cfg.steps) {
        assert.ok(step.heading, `BULK.${name} has a step with no heading`);
      }
      navTargets.push(cfg.route); // the step-advance self-push
    }
    navTargets.push(cfg.nextRoute);
    // The final push carries only cfg.nextParams; if the exit target needs
    // params (a detail or wizard), nextParams must fully satisfy it.
    assertParamsResolve(cfg.nextRoute, cfg.nextParams, `BULK.${name} ${cfg.kind} exit`);
  }

  for (const target of navTargets) {
    assert.ok(routeNameSet.has(target), `BULK.${name} navigates to "${target}", which is not a real ROUTE_META route`);
    assert.ok(
      declaredEdges.has(target),
      `BULK.${name} can navigate to "${target}", but ROUTE_META.${name} declares no edge to it - the ground-truth graph would be missing a real edge`
    );
  }

  // Reverse edge parity (Tier B only): every DECLARED edge must be a target
  // some BULK control can actually produce - a phantom edge would put an
  // untraversable edge in the ground-truth graph and penalize any crawler
  // that (correctly) never finds it. The one legitimate exception is the
  // gated NotFound -> Home edge on routes that can render the NotFound
  // guard: details (params miss) and wizards (bad step). Lists and forms
  // never render NotFound, so they may not declare it either.
  const derivedTargets = new Set(navTargets);
  const canNotFound = cfg.kind === "detail" || cfg.kind === "wizard";
  for (const edge of meta.edges) {
    if (edge.to === "Home" && edge.gated && canNotFound) continue;
    assert.ok(
      derivedTargets.has(edge.to),
      `ROUTE_META.${name} declares an edge to "${edge.to}", but no BULK.${name} control (row, action, deep link, or exit) can produce that navigation - phantom edge in the ground-truth graph`
    );
  }
  if (canNotFound) {
    assert.ok(
      meta.edges.some((edge) => edge.to === "Home" && edge.gated),
      `ROUTE_META.${name} is a ${cfg.kind} (renders NotFound on a bad param) but declares no gated Home edge for notfound-home`
    );
  }
}
