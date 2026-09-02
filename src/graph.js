// Builds the crawler ground-truth graph from ROUTE_META + BULK + the seed
// collections. CommonJS, no JSX - `node -e "require('./src/graph.js')"` works.
//
// Output is deterministic: nodes/edges follow ROUTE_META order, and every
// value is derived from committed data, so two runs are byte-identical.
const data = require("./data.js");
const pkg = require("../package.json");

// Instance keying contract - emitted into the JSON so consumers never guess.
const KEYING =
  "One instance per distinct (route, params) pair a real in-app control " +
  "produces - NOT per distinct rendered state. Some routes ignore an " +
  "inherited param and render identically for every value (e.g. " +
  "NotificationSettings x25, RecurrencePicker x45, MessageThread x30); a " +
  "crawler that dedupes by rendered state will legitimately report ~110 " +
  "fewer instances and must not be scored short for it.";

// For a BULK detail route, instances is by definition one per item in its
// collection - resolve it from the collection so the graph cannot drift from
// the seed data. Every other route's count is context-dependent (inbound
// param fan-in), so ROUTE_META's hand-derived number is the source of truth
// (scripts/data.test.js cross-checks those against the collections).
function resolveInstances(meta) {
  const cfg = data.BULK[meta.name];
  if (cfg && cfg.kind === "detail") return data[cfg.collection].length;
  return meta.instances;
}

function buildGraph() {
  const nodes = data.ROUTE_META.map((m) => ({
    name: m.name,
    tier: m.tier,
    addressing: m.addressing,
    anchors: m.anchors,
    tab: m.tab,
    instances: resolveInstances(m),
    noBack: m.noBack,
    noTabs: m.noTabs,
    terminal: m.terminal,
    trap: m.trap,
    escape: m.escape
  }));

  const edges = [];
  for (const m of data.ROUTE_META) {
    for (const e of m.edges) {
      edges.push({
        from: m.name,
        to: e.to,
        requiresInput: e.requiresInput,
        gated: e.gated,
        cycle: e.cycle
      });
    }
  }

  const traps = nodes
    .filter((n) => n.trap)
    .map((n) => ({ route: n.name, trap: n.trap, escape: n.escape }));

  return { version: pkg.version, keying: KEYING, nodes, edges, traps };
}

module.exports = { buildGraph };
