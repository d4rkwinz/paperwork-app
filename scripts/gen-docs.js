// Regenerates the graph-derived sections of GUIDELINES.md and CRAWLER.md
// from crawler-expected-graph.json, so the docs cannot drift from the
// committed graph. Run `yarn gen-docs` after `yarn graph`; a dirty
// `git diff` on the two .md files afterwards means the docs were stale.
//
// Everything between a pair of
//   <!-- BEGIN GENERATED: <name> (yarn gen-docs) -->
//   <!-- END GENERATED: <name> -->
// markers is owned by this script. Hand-edits inside markers are lost.
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const graph = require("../crawler-expected-graph.json");

// One-line purpose per route. Hand-written prose keyed by route name; the
// asserts below fail the script if a route is added to (or removed from)
// the graph without updating this map, so the prose cannot silently drift.
const PURPOSE = {
  Login: "Auth gate: email + password sign-in, guest entry, forgot-password branch",
  ForgotPassword: "Password-reset branch off Login; forgot-back returns",
  Onboarding: "3-step intro after sign-in; onboarding-skip shortcuts to Home",
  LegalTerms: "Dead-end legal text: no top back button, no tab bar",
  Home: "Service category cards; entries to Search, Activity, Inbox",
  ServiceDetail: "Service description, pricing, and booking entry point",
  BookingForm: "Date, time, address, priority, and notes entry",
  BookingReview: "Booking confirmation review before submission",
  BookingConfirmation: "Created-request summary and request-detail handoff",
  Search: "Query input; results render only once the trimmed query is 2+ chars",
  Activity: "Segmented activity feed; segments swap content without a route change",
  Inbox: "Notification list",
  NotificationDetail: "One notification; some carry a cross-cluster deep-link button",
  NotificationSettings: "Notification settings form; entry param is ignored (aliased)",
  Requests: "Request list; the status filter lives in a bottom-sheet overlay",
  RequestDetail: "Request summary, status timeline, edit/reschedule/cancel actions",
  EditRequest: "Mutable date, time, priority, and notes (Active requests only)",
  EditRequestReview: "Request-change review before saving",
  Reschedule: "Date/time-only reschedule; entry renders only while the request is Active",
  RemindersMonth: "Month view listing reminder days",
  RemindersDay: "Per-day reminder list; each day filters to its own subset",
  ReminderDetail: "One reminder",
  RecurrencePicker: "Recurrence options; entry param is ignored (aliased)",
  CreateReminder: "New-reminder form",
  Billing: "4th tab root; entry to the app's deepest chains",
  PaymentMethods: "Saved cards list; add-card goes one level deeper",
  AddCard: "Card form; submit stays disabled until the card format validates",
  PaymentReview: "Invoice review; a simulate-decline switch picks the result branch",
  PaymentResult: "Terminal payment outcome: success or decline on one route",
  Documents: "Document list; load-more appends 10 of 60 per tap, in place",
  DocumentDetail: "One document, reachable with 60 distinct docId params",
  Policies: "Insurance policy list",
  PolicyDetail: "One policy",
  ClaimStart: "Claim entry per policy; begins the claim wizard at step 1",
  ClaimWizard: "3-step wizard keyed on params.step; Next re-pushes the same route",
  ClaimSubmitted: "Claim receipt (static seeded CLM-01)",
  Profile: "Contact fields plus entries to addresses, preferences, support, referral",
  Preferences: "Notification toggles and derived delivery summary",
  Addresses: "Primary address radio-style selection",
  SupportChat: "Support chat; renders a loading state for 1500 ms after every mount",
  HelpCenter: "Help topics; renders byte-identical to SupportFaq",
  SupportFaq: "Help topics; renders byte-identical to HelpCenter",
  Referral: "Referral code; its open-profile button pushes Profile again (cycle)",
  DangerZone: "Destructive-path entry, one hop above DeleteAccount",
  DeleteAccount: "Typed-DELETE confirmation; resets all state and signs out",
  Directory: "Provider directory",
  ProviderDetail: "One provider",
  MessageThread: "Provider message thread; entry param is ignored (aliased)",
  ComposeMessage: "New-message form; entry param is ignored (aliased)",
  Security: "Hub list: each row navigates to a different route",
  ChangePassword: "Password-change form",
  TwoFactorSetup: "2-step wizard keyed on params.step",
  DataExport: "Data-export request form",
  ExportStatus: "Export status page"
};

const names = graph.nodes.map((n) => n.name);
assert.deepStrictEqual(
  names.filter((n) => !(n in PURPOSE)),
  [],
  "route in graph but missing from PURPOSE map in scripts/gen-docs.js"
);
assert.deepStrictEqual(
  Object.keys(PURPOSE).filter((n) => !names.includes(n)),
  [],
  "route in PURPOSE map but no longer in the graph"
);

// Routes whose inherited param does not change the rendered output. Value =
// number of DISTINCT rendered states the route actually has; the per-route
// declared `instances` count comes from the graph, so the alias shortfall
// below is computed, not quoted. Reviewed against the renderers in
// src/screens/generic.js (ListScreen/DetailScreen/FormScreen/WizardScreen).
const ALIAS_RENDERED_STATES = {
  NotificationSettings: 1,
  RecurrencePicker: 1,
  MessageThread: 1,
  ComposeMessage: 1,
  CreateReminder: 1,
  ClaimWizard: 3 // steps 1-3 differ; the 6 policyId step-1 variants do not
};

const md = (s) => String(s).replace(/\|/g, "\\|");
const byName = Object.fromEntries(graph.nodes.map((n) => [n.name, n]));

function counts() {
  const tier = { v1: 0, A: 0, B: 0 };
  let instances = 0;
  for (const n of graph.nodes) {
    tier[n.tier] += 1;
    instances += n.instances;
  }
  return { tier, instances };
}

function appMap() {
  const { tier, instances } = counts();
  const groups = [
    ["Pre-auth and untabbed", null],
    ["Home tab", "Home"],
    ["Requests tab", "Requests"],
    ["Billing tab", "Billing"],
    ["Profile tab", "Profile"]
  ];
  const lines = [];
  lines.push(
    `${graph.nodes.length} routes (${tier.v1} v1 / ${tier.A} Tier A / ${tier.B} Tier B), ` +
      `${graph.edges.length} edges, ${instances} param instances - counts computed from ` +
      "`crawler-expected-graph.json`. Tier A routes are exhaustively addressed (every " +
      "interactive element carries a `testID`); Tier B routes are deliberately sparse - only " +
      "`${testPrefix}-primary` and `${testPrefix}-list` carry testIDs, everything else is " +
      "addressable by accessibility label or text only. See `CRAWLER.md` for what that split measures."
  );
  for (const [title, tab] of groups) {
    const nodes = graph.nodes.filter((n) => (n.tab || null) === tab);
    if (nodes.length === 0) continue;
    lines.push("", `### ${title}`, "");
    lines.push("| Route | Tier | Instances | Purpose |");
    lines.push("| --- | --- | --- | --- |");
    for (const n of nodes) {
      lines.push(`| \`${n.name}\` | ${n.tier} | ${n.instances} | ${md(PURPOSE[n.name])} |`);
    }
  }
  return lines.join("\n");
}

function trapRubric() {
  const lines = [];
  lines.push(`One row per declared trap (${graph.traps.length} total). "Correct behavior" is the`);
  lines.push("graph's `escape` field; the anchors are the route's declared testIDs, which are");
  lines.push("what a scored run must show it reached.");
  lines.push("");
  lines.push("| Route | Tier | Trap | Correct behavior | Anchors |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const t of graph.traps) {
    const n = byName[t.route];
    assert.ok(n, `trap route ${t.route} not in nodes`);
    assert.ok(t.escape && t.escape.trim(), `trap on ${t.route} has no escape text`);
    const anchors = n.anchors.map((a) => `\`${a}\``).join(", ");
    lines.push(`| \`${t.route}\` | ${n.tier} | ${md(t.trap)} | ${md(t.escape)} | ${anchors} |`);
  }
  return lines.join("\n");
}

function aliasTable() {
  const rows = [];
  let fullyAliased = 0;
  let total = 0;
  for (const [name, states] of Object.entries(ALIAS_RENDERED_STATES)) {
    const n = byName[name];
    assert.ok(n, `alias route ${name} not in graph`);
    const fewer = n.instances - states;
    total += fewer;
    if (states === 1) fullyAliased += fewer;
    rows.push(`| \`${name}\` | ${n.instances} | ${states} | ${fewer} |`);
  }
  const lines = [];
  lines.push("| Route | Declared instances | Distinct rendered states | Shortfall under rendered-state dedupe |");
  lines.push("| --- | --- | --- | --- |");
  lines.push(...rows);
  lines.push("");
  lines.push(
    `A crawler that dedupes by rendered state reports **${fullyAliased}** fewer instances across the ` +
      `fully param-aliased routes, and **${total}** fewer if it also collapses \`ClaimWizard\`'s ` +
      "policyId step-1 variants. Both figures are computed from the graph's declared `instances` " +
      "by this script - do not hand-derive them from prose."
  );
  return lines.join("\n");
}

// Scoring denominators, computed from the graph so they cannot drift.
// "Cross-tab" = both endpoints owned by a tab and the tabs differ (the
// definition behind the historical 19). Gated edges targeting Home are the
// NotFound fallbacks: declared guard documentation that no UI control can
// trigger, so they are excluded from the achievable denominators.
function achievableDenominators() {
  const tab = Object.fromEntries(graph.nodes.map((n) => [n.name, n.tab]));
  const isGatedHome = (e) => e.gated && e.to === "Home";
  const gatedHome = graph.edges.filter(isGatedHome);
  const crossTab = graph.edges.filter(
    (e) => tab[e.from] && tab[e.to] && tab[e.from] !== tab[e.to]
  );
  const ctExercisable = crossTab.filter((e) => !isGatedHome(e));
  const ctList = ctExercisable.map((e) => `\`${e.from} -> ${e.to}\``).join(", ");
  return [
    `**Achievable denominators - computed from the graph, not hand-counted.** ` +
      `${gatedHome.length} of the ${graph.edges.length} edges are gated \`NotFound -> Home\` ` +
      "fallbacks that **cannot be triggered from the UI**: every collection is static, every " +
      "list/action/deep-link push is asserted to resolve, wizard entries always pass `step: 1`, " +
      "and the destructive reset roots the stack, so no stale param ever reaches a NotFound " +
      "guard in normal operation. They are declared-but-unreachable guard documentation, not " +
      "crawlable paths. Score against the achievable denominators: " +
      `**${graph.edges.length - gatedHome.length} of ${graph.edges.length} edges** and ` +
      `**${ctExercisable.length} of ${crossTab.length} cross-tab edges** ` +
      `(cross-tab = both endpoints tab-owned, tabs differ). The exercisable cross-tab edges ` +
      `are: ${ctList}.`
  ].join("\n");
}

function splice(file, sections) {
  const p = path.join(__dirname, "..", file);
  let text = fs.readFileSync(p, "utf8");
  for (const [name, body] of Object.entries(sections)) {
    const begin = `<!-- BEGIN GENERATED: ${name} (yarn gen-docs) -->`;
    const end = `<!-- END GENERATED: ${name} -->`;
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`${esc(begin)}[\\s\\S]*?${esc(end)}`);
    assert.ok(re.test(text), `${file}: missing ${begin} / ${end} markers`);
    text = text.replace(re, `${begin}\n${body}\n${end}`);
  }
  fs.writeFileSync(p, text);
  console.log(`gen-docs: wrote ${file} (${Object.keys(sections).join(", ")})`);
}

splice("GUIDELINES.md", { "APP MAP": appMap() });
splice("CRAWLER.md", {
  "TRAP RUBRIC": trapRubric(),
  "ALIAS TABLE": aliasTable(),
  "ACHIEVABLE DENOMINATORS": achievableDenominators()
});
