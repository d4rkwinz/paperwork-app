# Paperwork v1.1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grow Paperwork from 12 routes to ~54 so it can serve as a scored fixture for an in-house mobile app crawler, with a machine-checkable ground-truth graph.

**Architecture:** Split the single 1246-line `App.js` into focused modules; replace the `{route.name === "X" && <XScreen/>}` chain with a keyed `ROUTES` map; add 20 hand-written adversarial trap screens and 22 data-driven bulk screens; emit `crawler-expected-graph.json` from the same seed data the app renders from, validated by `scripts/check-graph.js`.

**Tech Stack:** Expo ~55, React Native 0.83, React 19.2, plain JavaScript (no TypeScript), yarn 1.22.22, Node 22.22.0. No new runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-08-23-paperwork-v1.1.0-crawler-graph-design.md`

## How to read this plan

There is **no test framework in this repo and none is being added** — no jest, no
`@testing-library/react-native`. That is deliberate: the fixture must stay
dependency-free per the spec's non-goals. Consequences for every task below:

- **Pure logic** (nav stack math, form validators, graph generation, seed-data
  invariants) lives in **CommonJS modules with no JSX**, so plain `node` can
  `require()` them. These get real assert-based tests. This is the TDD surface.
- **Screen components** (JSX) cannot be loaded by plain `node`. They are verified
  by (a) `yarn bundle-check`, which fails on any broken import, unresolved
  module, or syntax error across the whole graph, and (b) a manual smoke
  checklist against the four documented v1.0 flows in `GUIDELINES.md`.
- **Screen tasks carry a contract table** (route name, testIDs, fields,
  validation, edges, trap, escape) rather than pasted JSX. The table is the
  authoritative spec for that screen, and `scripts/check-graph.js` mechanically
  verifies the implementation matches it. This is a deliberate deviation from
  "paste complete code in every step": for 20 structurally similar screens the
  table is more precise than prose-wrapped JSX and it is machine-checked, which
  pasted code is not. Infrastructure code is given in full.

## Global Constraints

- Node 22.22.0 (`.nvmrc`). Package manager is **yarn 1.22.22** (`packageManager` field) — `GUIDELINES.md` and `README.md` currently say `npm`, which is stale and is fixed in Task 15.
- No new runtime dependencies. `Modal`, `TextInput`, `ScrollView`, `Switch`, `setTimeout` cover everything.
- No native-only modules — iOS and Android must both run from the same Expo project (`GUIDELINES.md:154`).
- **Element addressing is split by tier.** Tier A (the 20 adversarial routes) and all v1.0 routes: every interactive element carries both `testID` and `accessibilityLabel`, matching existing v1.0 convention. Tier B (the 22 bulk routes): testIDs **only** on the route's primary action button and its list container; list rows, secondary buttons and detail fields carry `accessibilityLabel` alone, so the crawler must use text, the a11y tree, or vision. Never add a `testID` to a Tier B row.
- Branch is `v1.1.0-crawler-graph`, off `main@1e81d25`. Do not commit to `main`.
- **Android verification requires a release APK**: `yarn android --variant release`. Metro debug builds do not load on a physical Android device here — RN's new-architecture ReactHost red-boxes with "Unable to load script." The release build embeds the JS bundle. Output: `android/app/build/outputs/apk/release/app-release.apk`.
- **All v1.0 testIDs and all four documented v1.0 flows are preserved byte-for-byte.** Only new edges are added. Existing crawl runs must stay comparable.
- Every new conditional render uses `?:` or `!!` — never `{value && <Text/>}` where `value` can be `0` or `""`.
- Pure-logic modules are CommonJS (`module.exports`), no JSX, so `node` can require them. Component modules are ESM + JSX.
- Every list and generator is provably bounded. The app must terminate for a crawler that runs to exhaustion.
- `slug()` is the single source of truth for testID derivation; it already exists at `App.js:744` and moves to `src/ui.js` unchanged.
- Version is `1.1.0` in both `package.json` and `app.json`.

## File Structure

| File | Responsibility | Loadable by `node`? |
| --- | --- | --- |
| `App.js` | `ROUTES` map, nav wiring, shell flags, app state bag. ~140 lines. | No (JSX) |
| `src/navcore.js` | Pure stack math: `entry`, `push`, `replace`, `back`, `root`. | **Yes** |
| `src/validate.js` | Pure form validators (card number, expiry, cvv, typed-confirmation). | **Yes** |
| `src/data.js` | All seed data + `ROUTE_META` (the route/edge/trap registry). | **Yes** |
| `src/graph.js` | Builds the expected-graph object from `ROUTE_META` + seed data. | **Yes** |
| `src/styles.js` | Shared `StyleSheet`. | No (RN import) |
| `src/ui.js` | Shared primitives + `NotFound`, `slug`. | No (JSX) |
| `src/screens/generic.js` | `ListScreen`, `DetailScreen`, `FormScreen`, `WizardScreen`. | No (JSX) |
| `src/screens/Auth.js` | `Login`, `ForgotPassword`, `Onboarding`. | No (JSX) |
| `src/screens/Booking.js` | Existing booking chain (5 screens). | No (JSX) |
| `src/screens/Requests.js` | Existing requests chain + `Reschedule` + filter sheet. | No (JSX) |
| `src/screens/Billing.js` | Billing/payment chain + `Documents`, `DocumentDetail`. | No (JSX) |
| `src/screens/Profile.js` | Existing profile chain + `HelpCenter`, `SupportFaq`, `Referral`, `DangerZone`, `DeleteAccount`. | No (JSX) |
| `src/screens/Misc.js` | `Search`, `Activity`, `SupportChat`, `LegalTerms`. | No (JSX) |
| `scripts/check-graph.js` | Asserts app and ground truth agree. | **Yes** |
| `crawler-expected-graph.json` | Generated ground truth. Committed. | — |
| `CRAWLER.md` | Per-trap scoring rubric. | — |

Deliberately **not** created (per code-master review): `src/nav.js` (zero
importers — nav is constructed in `App` and passed down), any Context provider,
any reducer, any per-route prop-mapper functions.

---

### Task 1: Test harness, bundle check, version bump

Establishes the two verification commands every later task uses. Nothing else can be verified until this exists.

**Files:**
- Create: `scripts/selfcheck.js`
- Modify: `package.json` (version + scripts)
- Modify: `app.json` (version)

**Interfaces:**
- Consumes: nothing.
- Produces: `yarn selfcheck` (runs every `scripts/*.test.js` file via node), `yarn bundle-check` (Metro bundles the app; fails on any broken import or syntax error).

- [ ] **Step 1: Write the failing test**

Create `scripts/selfcheck.js`:

```js
// Runs every scripts/*.test.js under plain node. No test framework by design.
const fs = require("fs");
const path = require("path");

const dir = __dirname;
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".test.js")).sort();

if (files.length === 0) {
  console.error("selfcheck: no *.test.js files found in scripts/");
  process.exit(1);
}

let failed = 0;
for (const file of files) {
  try {
    require(path.join(dir, file));
    console.log(`PASS ${file}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${file}`);
    console.error(err.message);
  }
}

console.log(`\n${files.length - failed}/${files.length} files passed`);
process.exit(failed === 0 ? 0 : 1);
```

Create `scripts/harness.test.js` — a test that proves the harness reports failures, then is left in place as a permanent smoke test of the harness itself:

```js
const assert = require("assert");

// The harness must be able to require a file and run asserts in it.
assert.strictEqual(1 + 1, 2, "arithmetic works");

// The harness must surface a thrown assert as a failure. Verified manually in
// Step 2 by temporarily inverting this assertion.
assert.ok(true, "harness reaches the end of the file");
```

- [ ] **Step 2: Run it to verify the harness detects failure**

Temporarily change the first assert in `scripts/harness.test.js` to `assert.strictEqual(1 + 1, 3, "arithmetic works")`, then run:

```bash
node scripts/selfcheck.js
```

Expected output contains `FAIL harness.test.js` and the process exits non-zero (`echo $?` prints `1`).

Now restore the assert to `2` and run again. Expected: `PASS harness.test.js`, `1/1 files passed`, exit code `0`.

- [ ] **Step 3: Add the scripts and bump the version**

In `package.json`, set `"version": "1.1.0"` and add to `scripts`:

```json
"selfcheck": "node scripts/selfcheck.js",
"bundle-check": "expo export --platform ios --platform android --output-dir .expo/bundle-check --clear"
```

In `app.json`, set `"version": "1.1.0"`.

Add to `.gitignore`:

```
.expo/bundle-check
```

- [ ] **Step 4: Verify both commands pass against the untouched v1.0 app**

```bash
yarn selfcheck
```
Expected: `PASS harness.test.js`, exit 0.

```bash
yarn bundle-check
```
Expected: Metro bundles both platforms and exits 0. If it fails with `EMFILE: too many open files`, run `ulimit -n 65536` first (documented at `GUIDELINES.md:11`). **Record the wall-clock time of this command** — it is the per-task verification cost for the rest of the plan.

- [ ] **Step 5: Commit**

```bash
git add scripts package.json app.json .gitignore
git commit -m "build: add node selfcheck harness and bundle check, bump to 1.1.0"
```

**Amendment (applied during execution).** The `harness.test.js` shown in Step 1
above is a tautology — `1+1 === 2` and `assert.ok(true)` can never fail, so
nothing re-verifies that the harness can detect a failure once Step 2's one-time
manual inversion is over. Review also found two real defects in the Step 1
`selfcheck.js`: `throw null` / `throw undefined` in a test file makes `err.message`
throw inside the `catch`, which skips every remaining test file; and an assertion
inside a `setTimeout` or promise callback silently reports PASS, because
`process.exit()` runs before the callback fires.

Resolution, committed on top of Task 1: `selfcheck.js` takes an optional target
directory (default `__dirname`, so `yarn selfcheck` is unchanged), formats any
thrown value totally, and carries a `ponytail:` comment naming the synchronous-only
ceiling. `harness.test.js` is now a real meta-test that spawns `selfcheck.js`
against fixture directories under `scripts/fixtures/` and asserts exit codes for
four cases: a throwing test, a passing test, an empty directory, and a `throw null`
file followed by a second file that must still run. **`scripts/` is the source of
truth for this code — the Step 1 blocks above are the superseded first draft.**

---

### Task 2: Extract modules from App.js — no behavior change

Pure mechanical extraction. Zero logic changes, so any smoke-test regression here is an extraction bug and is easy to localize. Doing this before the `ROUTES` refactor keeps the two reviewable independently.

**Files:**
- Create: `src/data.js`, `src/styles.js`, `src/ui.js`, `src/screens/Booking.js`, `src/screens/Requests.js`, `src/screens/Profile.js`
- Create: `scripts/data.test.js`
- Modify: `App.js` (down to router + state only)

**Interfaces:**
- Consumes: `yarn selfcheck`, `yarn bundle-check` from Task 1.
- Produces:
  - `src/data.js` exports (CommonJS): `SERVICES`, `DATES`, `TIMES`, `PRIORITIES`, `ADDRESSES`, `INITIAL_REQUESTS`, `ANDROID_NAV_BAR_GAP_ANDROID`, `TAB_BAR_HEIGHT`. The `Platform` check that turns `ANDROID_NAV_BAR_GAP_ANDROID` into `ANDROID_NAV_BAR_GAP` lives in `src/styles.js`, because importing `Platform` here would make the module un-`require`-able from node.
  - `src/styles.js` default-exports the `StyleSheet` object as `styles`.
  - `src/ui.js` exports `PrimaryButton`, `SecondaryButton`, `ChoiceRow`, `ReviewBlock`, `ToggleRow`, `Metric`, `Tab`, `slug`, `notificationSummary`.
  - `src/screens/Booking.js` exports `HomeScreen`, `ServiceDetailScreen`, `BookingFormScreen`, `BookingReviewScreen`, `BookingConfirmationScreen`.
  - `src/screens/Requests.js` exports `RequestsScreen`, `RequestDetailScreen`, `EditRequestScreen`, `EditRequestReviewScreen`.
  - `src/screens/Profile.js` exports `ProfileScreen`, `PreferencesScreen`, `AddressesScreen`.

Every screen keeps its **current** props signature in this task. Prop signatures change in Task 3, not here.

- [ ] **Step 1: Write the failing test**

Create `scripts/data.test.js`:

```js
const assert = require("assert");
const data = require("../src/data.js");

const { SERVICES, DATES, TIMES, PRIORITIES, ADDRESSES, INITIAL_REQUESTS } = data;

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
```

- [ ] **Step 2: Run it to verify it fails**

```bash
yarn selfcheck
```
Expected: `FAIL data.test.js` with `Cannot find module '../src/data.js'`, exit 1.

- [ ] **Step 3: Create `src/data.js`**

Move `SERVICES`, `DATES`, `TIMES`, `PRIORITIES`, `INITIAL_REQUESTS`, `ADDRESSES`, `ANDROID_NAV_BAR_GAP`, `TAB_BAR_HEIGHT` from `App.js:16-104` verbatim. `ANDROID_NAV_BAR_GAP` needs `Platform`, which would make the module un-`require`-able from node, so invert it — keep the platform check in `src/styles.js` and export the raw tunable here:

```js
// src/data.js  (CommonJS: must be require()-able by scripts/*.test.js under plain node)

const SERVICES = [ /* ...verbatim from App.js:16-57... */ ];
const DATES = ["Today", "Tomorrow", "Fri Apr 26", "Sat Apr 27"];
const TIMES = ["8:00 AM", "10:30 AM", "1:00 PM", "4:30 PM"];
const PRIORITIES = ["Normal", "High", "Urgent"];
const INITIAL_REQUESTS = [ /* ...verbatim from App.js:63-100... */ ];
const ADDRESSES = ["Home - 24 Cedar Street", "Office - 9 Market Plaza", "Gym - 12 Lake Avenue"];

// ponytail: hardcoded guess for the Android system nav bar, carried over from
// v1.0. A 4th tab tightens the tab bar and this is the knob that shifts.
// Upgrade path: react-native-safe-area-context, if Expo already provides it.
const ANDROID_NAV_BAR_GAP_ANDROID = 48;
const TAB_BAR_HEIGHT = 72;

module.exports = {
  SERVICES, DATES, TIMES, PRIORITIES, INITIAL_REQUESTS, ADDRESSES,
  ANDROID_NAV_BAR_GAP_ANDROID, TAB_BAR_HEIGHT
};
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
yarn selfcheck
```
Expected: `PASS data.test.js`, `PASS harness.test.js`, exit 0.

- [ ] **Step 5: Create `src/styles.js`**

Move the entire `StyleSheet.create({...})` block from `App.js:748-1246` verbatim. Add at the top:

```js
import { Platform, StyleSheet } from "react-native";
import { ANDROID_NAV_BAR_GAP_ANDROID, TAB_BAR_HEIGHT } from "./data";

export const ANDROID_NAV_BAR_GAP = Platform.OS === "android" ? ANDROID_NAV_BAR_GAP_ANDROID : 0;
export { TAB_BAR_HEIGHT };

const styles = StyleSheet.create({ /* ...verbatim... */ });
export default styles;
```

- [ ] **Step 6: Create `src/ui.js`**

Move `Metric` (`App.js:650`), `ChoiceRow` (659), `ReviewBlock` (682), `ToggleRow` (695), `PrimaryButton` (704), `SecondaryButton` (720), `Tab` (243), `notificationSummary` (734), `slug` (744) verbatim. Export each as a named export. Import `styles` from `./styles`.

- [ ] **Step 7: Create the three screen modules**

Move the screen functions verbatim into `src/screens/Booking.js`, `src/screens/Requests.js`, `src/screens/Profile.js` per the Interfaces block above. Each imports what it needs from `../data`, `../ui`, `../styles`. Do not change any prop signature, any `testID`, or any visible string.

- [ ] **Step 8: Reduce App.js**

`App.js` keeps `export default function App()`, `ScreenFrame`, the state, the `nav` object, and the `{route.name === "X" && ...}` chain **unchanged**. It now imports the screens. Expected size: ~110 lines.

- [ ] **Step 9: Verify the bundle and smoke-test flow 1**

```bash
yarn selfcheck && yarn bundle-check
```
Expected: both exit 0.

Then run the app (`yarn ios` or `yarn android`) and walk **Flow 1 from `GUIDELINES.md:35-65`** exactly: `service-plumbing` → `book-service` → `date-tomorrow` → `time-8-00-am` → keep address → `review-booking` → `submit-booking` → `view-created-request`. Expected: a new `REQ-####` detail screen. If any tap does nothing, an extraction dropped a prop.

- [ ] **Step 10: Commit**

```bash
git add src App.js scripts/data.test.js
git commit -m "refactor: extract data, styles, ui and screens from App.js"
```

---

### Task 3: ROUTES map, keyed remounting, shell flags

The one refactor with a real regression risk. It is isolated in its own task for exactly that reason.

**Files:**
- Create: `src/navcore.js`, `scripts/navcore.test.js`
- Modify: `App.js`, `src/ui.js` (add `NotFound`), `src/styles.js` (content margin fix)
- Modify: every screen module — props become the uniform `{ nav, params, app }`

**Interfaces:**
- Consumes: all Task 2 exports.
- Produces:
  - `src/navcore.js` (CommonJS): `entry(name, params) -> {key, name, params}`, `push(stack, name, params) -> stack`, `replace(stack, name, params) -> stack`, `back(stack) -> stack`, `root(name, params) -> stack`, `_resetSeq()` (test-only).
  - Every screen component now has the signature `({ nav, params, app })`. `params` is the route params object; `app` is the state bag `{ requests, setRequests, profile, setProfile }`.
  - `src/ui.js` adds `NotFound({ label, nav })`.

- [ ] **Step 1: Write the failing test**

Create `scripts/navcore.test.js`:

```js
const assert = require("assert");
const nav = require("../src/navcore.js");

nav._resetSeq();

// entry() assigns a unique key even for the same route name.
const a = nav.entry("Home");
const b = nav.entry("Home");
assert.notStrictEqual(a.key, b.key, "two entries for the same name get different keys");
assert.strictEqual(a.name, "Home");
assert.deepStrictEqual(a.params, {}, "params defaults to an empty object");

// push appends without mutating.
const s0 = nav.root("Home");
const s1 = nav.push(s0, "ServiceDetail", { serviceId: "plumbing" });
assert.strictEqual(s0.length, 1, "push does not mutate the input stack");
assert.strictEqual(s1.length, 2);
assert.strictEqual(s1[1].name, "ServiceDetail");
assert.strictEqual(s1[1].params.serviceId, "plumbing");

// replace swaps the top and keeps the length.
const s2 = nav.replace(s1, "BookingForm", { serviceId: "plumbing" });
assert.strictEqual(s2.length, 2, "replace keeps stack length");
assert.strictEqual(s2[1].name, "BookingForm");
assert.notStrictEqual(s2[1].key, s1[1].key, "replace assigns a fresh key so the screen remounts");

// back pops, and is identity at the root.
const s3 = nav.back(s2);
assert.strictEqual(s3.length, 1);
const s4 = nav.back(s3);
assert.strictEqual(s4, s3, "back at the root returns the same reference");

// root resets to a single entry.
const s5 = nav.root("Requests");
assert.strictEqual(s5.length, 1);
assert.strictEqual(s5[0].name, "Requests");

// THE REGRESSION THIS TASK RISKS: navigating between two routes that share one
// component must produce different keys, or React reuses the instance and
// useState initializers never re-run, leaking form drafts across routes.
const alias1 = nav.push(nav.root("Billing"), "HelpCenter");
const alias2 = nav.replace(alias1, "SupportFaq");
assert.notStrictEqual(alias1[1].key, alias2[1].key, "aliased routes get distinct keys");

// Keys must be unique across a long session including cycles.
let stack = nav.root("Home");
for (let i = 0; i < 50; i += 1) {
  stack = nav.push(stack, i % 2 === 0 ? "Referral" : "Profile");
}
const keys = stack.map((e) => e.key);
assert.strictEqual(new Set(keys).size, keys.length, "50 pushes through a cycle produce unique keys");
```

- [ ] **Step 2: Run it to verify it fails**

```bash
yarn selfcheck
```
Expected: `FAIL navcore.test.js` with `Cannot find module '../src/navcore.js'`, exit 1.

- [ ] **Step 3: Write `src/navcore.js`**

```js
// src/navcore.js  (CommonJS: require()-able by scripts/*.test.js under plain node)

let seq = 0;

function entry(name, params = {}) {
  seq += 1;
  return { key: `${name}#${seq}`, name, params };
}

function push(stack, name, params) {
  return [...stack, entry(name, params)];
}

function replace(stack, name, params) {
  return [...stack.slice(0, -1), entry(name, params)];
}

function back(stack) {
  return stack.length > 1 ? stack.slice(0, -1) : stack;
}

function root(name, params) {
  return [entry(name, params)];
}

function _resetSeq() {
  seq = 0;
}

module.exports = { entry, push, replace, back, root, _resetSeq };
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
yarn selfcheck
```
Expected: `PASS navcore.test.js`, exit 0.

- [ ] **Step 5: Add `NotFound` to `src/ui.js`**

Guards every param lookup. `ROUTES`' own fallback catches bad route *names*; this catches bad *params*, which is a different failure and is reachable on purpose after the destructive reset.

```js
export function NotFound({ label, nav }) {
  return (
    <View style={styles.centered}>
      <Text style={styles.h2}>{label} not found</Text>
      <Text style={styles.bodyText}>
        This item no longer exists. It may have been removed or the app was reset.
      </Text>
      <SecondaryButton label="Go home" testID="notfound-home" onPress={() => nav.root("Home")} />
    </View>
  );
}
```

- [ ] **Step 6: Rewrite App.js around a ROUTES map**

```js
const ROUTES = {
  Home: HomeScreen,
  ServiceDetail: ServiceDetailScreen,
  BookingForm: BookingFormScreen,
  BookingReview: BookingReviewScreen,
  BookingConfirmation: BookingConfirmationScreen,
  Requests: RequestsScreen,
  RequestDetail: RequestDetailScreen,
  EditRequest: EditRequestScreen,
  EditRequestReview: EditRequestReviewScreen,
  Profile: ProfileScreen,
  Preferences: PreferencesScreen,
  Addresses: AddressesScreen
};

const NO_TABS = new Set();
const NO_BACK = new Set();

export default function App() {
  const [stack, setStack] = useState(() => navcore.root("Home"));
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [profile, setProfile] = useState({ /* ...verbatim from App.js:109-118... */ });

  const route = stack[stack.length - 1];

  const nav = {
    push: (name, params) => setStack((s) => navcore.push(s, name, params)),
    replace: (name, params) => setStack((s) => navcore.replace(s, name, params)),
    back: () => setStack((s) => navcore.back(s)),
    root: (name, params) => setStack(navcore.root(name, params))
  };

  const app = { requests, setRequests, profile, setProfile };
  const Screen = ROUTES[route.name] || NotFound;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScreenFrame
        canBack={stack.length > 1 && !NO_BACK.has(route.name)}
        showTabs={!NO_TABS.has(route.name)}
        onBack={nav.back}
        onTab={nav.root}
        activeRoot={stack[0].name}
      >
        <Screen key={route.key} nav={nav} params={route.params} app={app} />
      </ScreenFrame>
    </SafeAreaView>
  );
}
```

`createRequest`, `updateRequest` and `cancelRequest` move out of `App.js` into the screens that call them, deriving from `app`. `App.js` no longer does `requests.find(...)` — `RequestDetailScreen` does its own lookup from `app.requests` and renders `<NotFound label="Request" nav={nav} />` when it misses.

- [ ] **Step 7: Update `ScreenFrame` for `showTabs`**

```js
function ScreenFrame({ children, canBack, showTabs, onBack, onTab, activeRoot }) {
  return (
    <View style={styles.shell}>
      <View style={styles.topBar}>
        {canBack ? (
          <Pressable testID="nav-back" accessibilityRole="button" accessibilityLabel="Go back"
            onPress={onBack} style={styles.iconButton}>
            <Text style={styles.iconButtonText}>{"<"}</Text>
          </Pressable>
        ) : (
          <View style={styles.iconButtonMuted} />
        )}
        <Text style={styles.brand}>Paperwork</Text>
        <View style={styles.iconButtonMuted} />
      </View>
      <View style={[styles.content, !showTabs && { marginBottom: 0 }]}>{children}</View>
      {showTabs ? (
        <View style={styles.tabBar}>
          <Tab label="Home" active={activeRoot === "Home"} onPress={() => onTab("Home")} />
          <Tab label="Requests" active={activeRoot === "Requests"} onPress={() => onTab("Requests")} />
          <Tab label="Profile" active={activeRoot === "Profile"} onPress={() => onTab("Profile")} />
        </View>
      ) : null}
    </View>
  );
}
```

Two behavior changes, both intentional and both required by the spec: the back
button is now **absent** rather than disabled when it cannot be used (a
present-but-inert `testID="nav-back"` reads as a broken app rather than a trap),
and hiding the tab bar removes the 72-120px of dead space `styles.content` would
otherwise reserve.

- [ ] **Step 8: Update every screen to the uniform props signature**

Each screen changes from e.g. `function ServiceDetailScreen({ nav, serviceId })` to `function ServiceDetailScreen({ nav, params, app })` and reads `params.serviceId`. Add a `NotFound` guard to every screen that does a `.find()`: `ServiceDetailScreen`, `BookingFormScreen`, `RequestDetailScreen`, `EditRequestScreen`.

- [ ] **Step 9: Verify**

```bash
yarn selfcheck && yarn bundle-check
```
Expected: both exit 0.

Run the app and walk **all four** documented flows from `GUIDELINES.md:35-141`. All four must pass unchanged — this is the regression gate for the whole refactor. Additionally verify the keying fix by hand: open `BookingReview`, tap `edit-booking-details` (which calls `nav.replace`), and confirm the form shows the draft values rather than a stale or empty form.

- [ ] **Step 10: Commit**

```bash
git add App.js src scripts/navcore.test.js
git commit -m "refactor: route map with keyed remounting, shell flags, param guards"
```

---

### Task 4: P0 hardening — Android back and falsy-and audit

**Files:**
- Modify: `App.js` (BackHandler effect)
- Modify: `src/screens/Requests.js` (`onRequestClose` on the cancel-confirm modal)
- Modify: all screen modules (falsy-and audit)

**Interfaces:**
- Consumes: `NO_BACK` from Task 3.
- Produces: nothing new — this task only removes crash and dead-end modes.

- [ ] **Step 1: Add the BackHandler effect to App.js**

Without this, Android's system back button **exits the app from any depth**. A crawler that presses system back once records "app crashed" instead of "went back one screen," which would corrupt a large share of every crawl run.

```js
useEffect(() => {
  const sub = BackHandler.addEventListener("hardwareBackPress", () => {
    if (stack.length > 1 && !NO_BACK.has(route.name)) {
      nav.back();
      return true;
    }
    return false; // dead-end routes and the root: let the OS have it
  });
  return () => sub.remove();
}, [stack, route.name]);
```

Add `BackHandler` and `useEffect` to the imports.

- [ ] **Step 2: Add `onRequestClose` to the cancel-confirm modal**

In `src/screens/Requests.js`, the cancel-confirm `Modal` (was `App.js:483`) currently swallows Android back, leaving the agent with only two on-screen buttons:

```js
<Modal
  visible={confirmingCancel}
  animationType="fade"
  transparent
  onRequestClose={() => setConfirmingCancel(false)}
>
```

- [ ] **Step 3: Audit every conditional render**

```bash
grep -rn "&& <" src/ App.js
```

For each hit, confirm the left operand can only be `true`/`false`/`undefined` — never `0` or `""`. Rewrite any that can be numeric or empty-string as `?: null` or prefix with `!!`. v1.0 is accidentally safe (`saved` is `undefined`, `.length === 0` is a boolean), but Tasks 7-13 add balances, item counts and page counts, where `balance: 0` renders a bare `0` outside `<Text>` and hard-crashes.

Expected result of this step: every hit is either provably boolean or rewritten. Record the count in the commit message.

- [ ] **Step 4: Verify**

```bash
yarn selfcheck && yarn bundle-check
```
Expected: both exit 0.

Build and install a **release** APK — a Metro debug build will not load on a physical Android device here:

```bash
yarn android --variant release
```

Then verify: from `BookingReview` (4 screens deep), press the system back button. Expected: navigates to `BookingForm`. Press it 3 more times to reach `Home`, then once more. Expected: the app backgrounds (OS default), does not crash. Then open the cancel-confirm modal on an active request and press system back. Expected: the modal dismisses and the request is **not** canceled.

- [ ] **Step 5: Commit**

```bash
git add App.js src
git commit -m "fix: handle Android hardware back, add modal onRequestClose, audit falsy-and renders"
```

---

### Task 5: Auth cluster and the pre-auth gate

**Files:**
- Create: `src/screens/Auth.js`
- Modify: `App.js` (session state, `NO_TABS`/`NO_BACK` entries, initial route)
- Modify: `src/data.js` (add `ROUTE_META` entries for these three routes)

**Interfaces:**
- Consumes: `app` bag from Task 3.
- Produces: `app.session` (`{ signedIn: boolean, guest: boolean }`, initial `{ signedIn: false, guest: false }`), `app.setSession`. Exports `LoginScreen`, `ForgotPasswordScreen`, `OnboardingScreen`.

**Screen contracts:**

| Route | testIDs | Behavior | Trap | Documented escape |
| --- | --- | --- | --- | --- |
| `Login` | `login-email`, `login-password`, `login-submit`, `login-guest`, `login-forgot` | `login-submit` disabled until both fields non-empty. Submit → `setSession({signedIn:true})` → `nav.root("Onboarding", {step:1})`. `login-guest` → `setSession({guest:true})` → `nav.root("Home")`. In `NO_TABS` and `NO_BACK`. | Gate: crawler must type into two fields to progress | Type both fields and submit, **or** tap `login-guest` |
| `ForgotPassword` | `forgot-email`, `forgot-submit`, `forgot-back` | After submit, same route renders a "check your email" panel instead of the form (local `sent` state). In `NO_TABS`. | Off-path branch; 2 states on 1 route | Reachable from `login-forgot`; `forgot-back` returns to `Login` |
| `Onboarding` | `onboarding-next`, `onboarding-skip`, `onboarding-step-{1,2,3}` (the step indicator) | `params.step` 1→3. `onboarding-next` on step 3 → `nav.root("Home")`. `onboarding-skip` → `nav.root("Home")` from any step. Layout is near-identical across steps; only the heading and body copy differ. In `NO_TABS`. | State aliasing — 3 near-identical states on one route | 3 distinct states recorded, terminates at step 3; `onboarding-skip` is the shortcut |

- [ ] **Step 1: Add `signedIn` gating to App.js**

```js
const [session, setSession] = useState({ signedIn: false, guest: false });
const authed = session.signedIn || session.guest;
const [stack, setStack] = useState(() => navcore.root("Login"));
```

Add `session`/`setSession` to the `app` bag. Add `"Login"`, `"ForgotPassword"`, `"Onboarding"` to `NO_TABS`; add `"Login"` to `NO_BACK`.

Guard against reaching the shell unauthenticated — if `!authed` and the route is not an auth route, force back to `Login`:

```js
const AUTH_ROUTES = new Set(["Login", "ForgotPassword", "Onboarding"]);
const effectiveRoute = authed || AUTH_ROUTES.has(route.name) ? route : navcore.entry("Login");
```

Use `effectiveRoute` for `Screen`, `key`, and the shell flags.

- [ ] **Step 2: Write the three screens per the contract table**

Both text inputs use `secureTextEntry` where appropriate, `testID` **and** `accessibilityLabel`, and `PrimaryButton`'s existing `disabled` prop for the gate. Reuse `styles.singleInput`, `styles.h1`, `styles.kicker`, `styles.inlinePanel` — no new styles.

- [ ] **Step 3: Register the routes**

Add all three to `ROUTES` in `App.js`. Add `ROUTE_META` entries in `src/data.js` following the shape defined in Task 13 (`name`, `tier: "A"`, `noTabs`, `noBack`, `edges`, `trap`, `escape`). If Task 13 has not run yet, append the entries and let `scripts/check-graph.js` validate them when it lands.

- [ ] **Step 4: Verify**

```bash
yarn selfcheck && yarn bundle-check
```
Expected: both exit 0.

Run the app. Expected on launch: `Login`, **no tab bar, no back button, no dead space at the bottom**. Verify `login-submit` is inert until both fields have text. Verify `login-guest` reaches `Home` with the tab bar restored. Relaunch, sign in properly, and confirm `Onboarding` steps 1→2→3 then `Home`. Then re-walk **Flow 1** from `GUIDELINES.md` to confirm the gate did not break the booking flow.

- [ ] **Step 5: Commit**

```bash
git add src App.js
git commit -m "feat: add auth gate with login, forgot-password and onboarding traps"
```

---

### Task 6: Misc traps — Search, Activity, SupportChat, LegalTerms

**Files:**
- Create: `src/screens/Misc.js`
- Modify: `App.js` (`ROUTES`, `NO_TABS`, `NO_BACK`), `src/data.js` (`ROUTE_META`), `src/screens/Booking.js` (Home links to `Search` and `Activity`)

**Interfaces:**
- Consumes: `SERVICES` from `src/data.js`; `app` bag.
- Produces: exports `SearchScreen`, `ActivityScreen`, `SupportChatScreen`, `LegalTermsScreen`.

**Screen contracts:**

| Route | testIDs | Behavior | Trap | Documented escape |
| --- | --- | --- | --- | --- |
| `Search` | `search-input`, `search-result-{serviceId}`, `search-empty` | Results render **only** when the trimmed query is ≥2 chars; filters `SERVICES` on `title` + `category`, case-insensitive. Below 2 chars, renders `search-empty` with "Type at least 2 characters". Results push `ServiceDetail`. | Requires generated input — a crawler that never types sees 0 new edges | Type ≥2 chars; `"a"` alone is not enough, `"pl"` matches Plumber |
| `Activity` | `activity-seg-all`, `activity-seg-alerts`, `activity-seg-receipts`, `activity-item-{id}` | Segmented control over one route; content swaps, route does not. Each segment lists 4-6 seeded items. | In-screen state vs navigation | Record 3 states for 1 route, not 3 routes and not 1 state |
| `SupportChat` | `support-loading`, `support-message-{n}`, `support-reply` | `useEffect` sets `ready` after 1500ms; renders a spinner + `support-loading` until then. **Must** `return () => clearTimeout(t)`. Because screens remount per push, the delay replays on every visit — deliberate. | Requires waiting for settled content | Poll until `support-loading` is gone before snapshotting |
| `LegalTerms` | `legal-close`, `legal-body` | A **normal route** in both `NO_TABS` and `NO_BACK`. The only exit is the in-content `legal-close` → `nav.back()`. Reached from `Preferences`. | Dead end — no top back, no tabs | Find and tap `legal-close` |

`LegalTerms` is deliberately a route and **not** a `<Modal>`: it composes with the router, needs no native modal semantics, and cannot collide with the cancel-confirm modal (two simultaneous `Modal`s break on iOS).

- [ ] **Step 1: Write the four screens per the contract table**

`SupportChatScreen`'s effect, exactly:

```js
const [ready, setReady] = useState(false);
useEffect(() => {
  const t = setTimeout(() => setReady(true), 1500);
  return () => clearTimeout(t);
}, []);
```

- [ ] **Step 2: Add the entry points**

On `HomeScreen`, add two `Pressable`s above the services grid: `open-search` → `nav.push("Search")` and `open-activity` → `nav.push("Activity")`. On `ProfileScreen`, add a `settingRow` `open-support` → `nav.push("SupportChat")`. On `PreferencesScreen`, add `open-legal` → `nav.push("LegalTerms")`.

- [ ] **Step 3: Register the routes**

Add all four to `ROUTES`. Add `"LegalTerms"` to both `NO_TABS` and `NO_BACK`. Add `ROUTE_META` entries.

- [ ] **Step 4: Verify**

```bash
yarn selfcheck && yarn bundle-check
```
Expected: both exit 0.

Run the app and verify each trap behaves as designed: `Search` shows nothing at 1 char and results at 2; `Activity` swaps content without navigating; `SupportChat` shows a spinner for ~1.5s; `LegalTerms` has **no** back button and **no** tab bar, and `legal-close` is the only way out. On Android, also press system back on `LegalTerms` — expected: the app backgrounds rather than navigating, because `LegalTerms` is in `NO_BACK`. That is the intended trap; note it in `CRAWLER.md` in Task 15.

- [ ] **Step 5: Commit**

```bash
git add src App.js
git commit -m "feat: add search, activity, slow-load and dead-end traps"
```

---

### Task 7: Billing tab and the payment chain

The deepest path in the app: `Billing → PaymentMethods → AddCard → PaymentReview → PaymentResult`.

**Files:**
- Create: `src/screens/Billing.js`, `src/validate.js`, `scripts/validate.test.js`
- Modify: `App.js` (4th tab, `ROUTES`), `src/ui.js`/`src/styles.js` if the tab bar needs a 4-up width tweak, `src/data.js` (`INVOICES`, `PAYMENT_METHODS`, `ROUTE_META`)

**Interfaces:**
- Consumes: `app` bag.
- Produces:
  - `src/validate.js` (CommonJS): `cardNumber(v)`, `expiry(v)`, `cvv(v)`, `cardValid(fields)`, `confirmsDelete(v)`.
  - `src/data.js` adds `INVOICES` (12 items: `{id, label, amount, status}`, at least one with `amount: 0` and one with `status: ""` to exercise the falsy-and audit), `PAYMENT_METHODS` (2 seeded cards).
  - `App.js` adds `paymentMethods` / `setPaymentMethods` to the `app` bag, initialized from `PAYMENT_METHODS`. Task 10's `resetAll` depends on `app.setPaymentMethods` existing.
  - `src/screens/Billing.js` exports `BillingScreen`, `PaymentMethodsScreen`, `AddCardScreen`, `PaymentReviewScreen`, `PaymentResultScreen`.

- [ ] **Step 1: Write the failing test**

Create `scripts/validate.test.js`:

```js
const assert = require("assert");
const v = require("../src/validate.js");

// Card number: exactly 16 digits, separators ignored.
assert.strictEqual(v.cardNumber("4111111111111111"), true);
assert.strictEqual(v.cardNumber("4111 1111 1111 1111"), true, "spaces are ignored");
assert.strictEqual(v.cardNumber("4111-1111-1111-1111"), true, "dashes are ignored");
assert.strictEqual(v.cardNumber("411111111111111"), false, "15 digits is not enough");
assert.strictEqual(v.cardNumber("41111111111111111"), false, "17 digits is too many");
assert.strictEqual(v.cardNumber(""), false);
assert.strictEqual(v.cardNumber(undefined), false, "undefined must not throw");

// Expiry: MM/YY with a real month.
assert.strictEqual(v.expiry("04/27"), true);
assert.strictEqual(v.expiry("12/30"), true);
assert.strictEqual(v.expiry("00/27"), false, "month 00 is invalid");
assert.strictEqual(v.expiry("13/27"), false, "month 13 is invalid");
assert.strictEqual(v.expiry("4/27"), false, "single-digit month is rejected");
assert.strictEqual(v.expiry("0427"), false, "missing separator is rejected");
assert.strictEqual(v.expiry(""), false);
assert.strictEqual(v.expiry(undefined), false);

// CVV: exactly 3 digits.
assert.strictEqual(v.cvv("123"), true);
assert.strictEqual(v.cvv("12"), false);
assert.strictEqual(v.cvv("1234"), false);
assert.strictEqual(v.cvv("abc"), false);

// cardValid requires all four fields.
assert.strictEqual(v.cardValid({ number: "4111111111111111", expiry: "04/27", cvv: "123", name: "A Morgan" }), true);
assert.strictEqual(v.cardValid({ number: "4111111111111111", expiry: "04/27", cvv: "123", name: "  " }), false, "whitespace name is rejected");
assert.strictEqual(v.cardValid({ number: "4111", expiry: "04/27", cvv: "123", name: "A" }), false);
assert.strictEqual(v.cardValid({}), false, "empty object must not throw");

// Typed confirmation is exact and case-sensitive, trimmed.
assert.strictEqual(v.confirmsDelete("DELETE"), true);
assert.strictEqual(v.confirmsDelete("  DELETE  "), true, "surrounding whitespace is trimmed");
assert.strictEqual(v.confirmsDelete("delete"), false, "must be uppercase");
assert.strictEqual(v.confirmsDelete("DELETE ACCOUNT"), false);
assert.strictEqual(v.confirmsDelete(""), false);
assert.strictEqual(v.confirmsDelete(undefined), false);
```

- [ ] **Step 2: Run it to verify it fails**

```bash
yarn selfcheck
```
Expected: `FAIL validate.test.js` with `Cannot find module '../src/validate.js'`, exit 1.

- [ ] **Step 3: Write `src/validate.js`**

```js
// src/validate.js  (CommonJS: require()-able by scripts/*.test.js under plain node)

function digits(value) {
  return String(value == null ? "" : value).replace(/\D/g, "");
}

function cardNumber(value) {
  return digits(value).length === 16;
}

function expiry(value) {
  const match = /^(\d{2})\/(\d{2})$/.exec(String(value == null ? "" : value).trim());
  if (!match) return false;
  const month = Number(match[1]);
  return month >= 1 && month <= 12;
}

function cvv(value) {
  return digits(value).length === 3;
}

function cardValid(fields) {
  const f = fields || {};
  return (
    cardNumber(f.number) &&
    expiry(f.expiry) &&
    cvv(f.cvv) &&
    String(f.name == null ? "" : f.name).trim().length > 0
  );
}

function confirmsDelete(value) {
  return String(value == null ? "" : value).trim() === "DELETE";
}

module.exports = { cardNumber, expiry, cvv, cardValid, confirmsDelete };
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
yarn selfcheck
```
Expected: `PASS validate.test.js`, exit 0.

- [ ] **Step 5: Add the 4th tab**

`ScreenFrame`'s tab bar gains a fourth `Tab label="Billing"`. `styles.tab` already uses `flex: 1`, so four tabs fit; verify the label does not wrap at 13px on a small device and drop `styles.tabBar` `gap` from 8 to 6 if it does. `Billing` is a genuine root (it owns invoices and documents), not a dumping ground for traps.

- [ ] **Step 6: Write the five screens**

| Route | testIDs | Behavior | Trap | Documented escape |
| --- | --- | --- | --- | --- |
| `Billing` | `billing-invoice-{id}`, `open-payment-methods`, `open-documents` | Lists 12 invoices; tapping one pushes `PaymentReview` with `{invoiceId}`. Renders `amount` with `?:` — one seeded invoice has `amount: 0`. | 4th tab root | Reachable from the tab bar |
| `PaymentMethods` | `method-{id}`, `add-card` | Lists 2 seeded cards plus `add-card` → `AddCard`. | Depth | — |
| `AddCard` | `card-number`, `card-expiry`, `card-cvv`, `card-name`, `card-submit` | `card-submit` disabled until `cardValid(fields)`. On submit, appends to `app.paymentMethods` and `nav.back()`. | Format validation, not just non-empty | 16 digits, `MM/YY` with month 01-12, 3-digit CVV, non-blank name |
| `PaymentReview` | `payment-amount`, `simulate-decline`, `payment-pay` | Shows the invoice; a `Switch` (`simulate-decline`) chooses the outcome. `payment-pay` → `PaymentResult` with `{invoiceId, declined}`. | Branch point | Toggle reachable before paying |
| `PaymentResult` | `payment-success`, `payment-declined`, `payment-retry`, `payment-done` | Two terminal states. Declined renders `payment-retry` → `nav.replace("PaymentReview", ...)`. Success renders `payment-done` → `nav.root("Billing")`. | Two terminal states on one route | Reach **both** by flipping `simulate-decline` |

- [ ] **Step 7: Verify**

```bash
yarn selfcheck && yarn bundle-check
```
Expected: both exit 0.

Run the app. Verify `card-submit` stays inert for `4111` and for `4111111111111111` + expiry `13/27`, and activates only on a fully valid card. Verify both `PaymentResult` branches. Verify the `amount: 0` invoice renders without a red screen — that is the falsy-and regression this seed data exists to catch.

- [ ] **Step 8: Commit**

```bash
git add src scripts/validate.test.js App.js
git commit -m "feat: add billing tab, payment chain and format-validated card form"
```

---

### Task 8: Documents — load-more and param explosion

**Files:**
- Modify: `src/screens/Billing.js` (add `DocumentsScreen`, `DocumentDetailScreen`), `src/data.js` (`DOCUMENTS`), `App.js` (`ROUTES`)
- Modify: `scripts/data.test.js` (bounds assertions)

**Interfaces:**
- Consumes: `INVOICES` from Task 7.
- Produces: `src/data.js` adds `DOCUMENTS` (60 items: `{id, title, kind, sizeKb, year}`) and `DOCS_PAGE_SIZE = 10`.

**Screen contracts:**

| Route | testIDs | Behavior | Trap | Documented escape |
| --- | --- | --- | --- | --- |
| `Documents` | `doc-{id}`, `docs-load-more`, `docs-count` | Renders `page * DOCS_PAGE_SIZE` of 60 docs, starting at page 1. `docs-load-more` increments the page and **disappears** once all 60 are shown (6 pages). `docs-count` shows "N of 60". Stays a `ScrollView` + `.map` — bounded at 60 items, so no `FlatList` restructure is warranted. | Content grows in place; the screen must be re-enqueued after each tap | Tap `docs-load-more` until it disappears; the list is bounded and terminates |
| `DocumentDetail` | `doc-detail-title`, `doc-detail-back` | One route, 60 param instances via `params.docId`. Guards with `<NotFound label="Document" nav={nav} />`. | Param explosion | Correct answer is 1 route / 60 instances — not 1 state and not 60 routes |

- [ ] **Step 1: Add the bounds test**

Append to `scripts/data.test.js`:

```js
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
```

- [ ] **Step 2: Run it to verify it fails**

```bash
yarn selfcheck
```
Expected: `FAIL data.test.js` with `DOCUMENTS is exactly 60 items` (or a destructuring failure on `undefined`), exit 1.

- [ ] **Step 3: Add the seed data**

Generate 60 documents in `src/data.js` with a bounded loop over fixed inputs — no randomness, because the ground-truth graph must be reproducible:

```js
const DOC_KINDS = ["Invoice", "Receipt", "Policy", "Statement", "Notice", "Contract"];
const DOCUMENTS = [];
for (let i = 0; i < 60; i += 1) {
  const kind = DOC_KINDS[i % DOC_KINDS.length];
  DOCUMENTS.push({
    id: `DOC-${1000 + i}`,
    title: `${kind} ${2024 + (i % 3)}-${String((i % 12) + 1).padStart(2, "0")}`,
    kind,
    sizeKb: 40 + ((i * 17) % 900),
    year: 2024 + (i % 3)
  });
}
const DOCS_PAGE_SIZE = 10;
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
yarn selfcheck
```
Expected: `PASS data.test.js`, exit 0.

- [ ] **Step 5: Write the two screens per the contract table, register them, and link from `Billing`**

- [ ] **Step 6: Verify**

```bash
yarn selfcheck && yarn bundle-check
```
Expected: both exit 0.

Run the app. Verify `docs-load-more` appears exactly 5 more times after the initial page and then disappears with all 60 rows shown. Open a document, then use the tab bar to leave and come back — the page count resets to 1, which is correct (screens remount per push).

- [ ] **Step 7: Commit**

```bash
git add src scripts/data.test.js App.js
git commit -m "feat: add documents load-more list and 60-instance detail route"
```

---

### Task 9: Requests — filter sheet and Reschedule

**Files:**
- Modify: `src/screens/Requests.js`, `App.js` (`ROUTES`), `src/data.js` (`ROUTE_META`)

**Interfaces:**
- Consumes: `app.requests`, `app.setRequests`.
- Produces: exports `RescheduleScreen`.

**Contracts:**

| Change | testIDs | Behavior | Trap | Documented escape |
| --- | --- | --- | --- | --- |
| Filter becomes a sheet | `open-filter-sheet`, `filter-sheet`, `request-filter-{value}`, `close-filter-sheet` | The existing inline `ChoiceRow` moves into a bottom-sheet `Modal` opened by `open-filter-sheet`. **The `request-filter-*` testIDs are preserved exactly** — they are documented in `GUIDELINES.md:115` and existing runs depend on them. Needs `onRequestClose`. | Overlay state that is not a route | Open the sheet, pick a filter, close it |
| `Reschedule` | `reschedule-date`, `reschedule-time`, `reschedule-submit` | Pushed from `RequestDetail`, **only rendered for `status === "Active"`**. On submit, updates the request and appends `"Rescheduled"` to its timeline. | Precondition-gated edge — invisible on Completed/Canceled requests | Reach it from an Active request; Completed ones legitimately have no such edge |

Note: this changes Flow 3's step 6 (`GUIDELINES.md:108`) from "switch the filter" to "open the sheet, then switch the filter" — one extra tap. Update `GUIDELINES.md` in Task 15 and record it as an intentional flow change, since it is the one place this plan alters a documented v1.0 flow.

- [ ] **Step 1: Move the filter into a `Modal`, preserving all `request-filter-*` testIDs, with `onRequestClose`**

- [ ] **Step 2: Add `RescheduleScreen` and gate its entry point on `request.status === "Active"`**

- [ ] **Step 3: Verify**

```bash
yarn selfcheck && yarn bundle-check
```
Expected: both exit 0.

Run the app and re-walk **Flow 3** from `GUIDELINES.md:97-116` with the extra sheet tap. Verify `REQ-1038` reaches Canceled. Confirm `reschedule-submit` is absent on a Completed request (`REQ-0977`) and present on an Active one.

- [ ] **Step 4: Commit**

```bash
git add src App.js
git commit -m "feat: move request filter into a sheet, add gated reschedule flow"
```

---

### Task 10: Profile traps — aliases, cycle, destructive reset

**Files:**
- Modify: `src/screens/Profile.js`, `App.js` (`ROUTES`), `src/data.js` (`ROUTE_META`)

**Interfaces:**
- Consumes: `confirmsDelete` from `src/validate.js` (Task 7); the full `app` bag.
- Produces: exports `HelpCenterScreen`, `SupportFaqScreen`, `ReferralScreen`, `DangerZoneScreen`, `DeleteAccountScreen`.

**Screen contracts:**

| Route | testIDs | Behavior | Trap | Documented escape |
| --- | --- | --- | --- | --- |
| `HelpCenter` | `help-topic-{n}` (n=1..5), `help-contact` | Renders a fixed 5-topic list. | Alias A | 2 nodes |
| `SupportFaq` | `help-topic-{n}` (n=1..5), `help-contact` | **Byte-identical** rendered output and testIDs to `HelpCenter` — same heading, same body, same list. Only the route name differs. Reached from a different entry point (`Preferences`, vs `HelpCenter` from `Profile`). | Alias B — identical appearance, distinct route | 2 nodes, not merged by appearance. A crawler that dedups on screen hash reports 1 and fails |
| `Referral` | `referral-code`, `referral-open-profile`, `referral-share` | `referral-open-profile` → `nav.push("Profile")`, and `Profile` has `open-referral` → `nav.push("Referral")`. | Cycle: `Referral → Profile → Referral` | Detect the loop; do not recurse indefinitely |
| `DangerZone` | `open-delete-account`, `danger-warning` | Entry point only, reached from `Profile`. | Destructive path | — |
| `DeleteAccount` | `delete-confirm-input`, `delete-submit` | `delete-submit` disabled until `confirmsDelete(text)`. On submit: resets `requests`, `profile`, `paymentMethods`, and `session` to seed **and** calls `nav.root("Login")`. | Self-destruction — requires typing the exact literal `DELETE` | Recover after the reset. Any stale param id pushed afterwards must hit `NotFound`, not a crash — that is what the Task 3 guards are for |

- [ ] **Step 1: Write the five screens per the contract table**

The reset is one plain function calling four setters — React 19 auto-batches, so no reducer is warranted. It **must** also call `nav.root("Login")`, or the app lands on a route whose params point at deleted data:

```js
const resetAll = () => {
  app.setRequests(INITIAL_REQUESTS);
  app.setProfile(INITIAL_PROFILE);
  app.setPaymentMethods(PAYMENT_METHODS);
  app.setSession({ signedIn: false, guest: false });
  nav.root("Login");
};
```

This requires extracting the inline initial profile object in `App.js` to an exported `INITIAL_PROFILE` in `src/data.js`.

- [ ] **Step 2: Add entry points**

On `ProfileScreen`: `open-help` → `HelpCenter`, `open-referral` → `Referral`, `open-danger-zone` → `DangerZone`. On `PreferencesScreen`: `open-faq` → `SupportFaq`.

- [ ] **Step 3: Verify**

```bash
yarn selfcheck && yarn bundle-check
```
Expected: both exit 0.

Run the app. Verify `HelpCenter` and `SupportFaq` are visually indistinguishable. Walk the `Referral → Profile → Referral` cycle three times without a crash. Then the critical one: type `delete` (lowercase) and confirm `delete-submit` stays inert; type `DELETE` and confirm the app resets to `Login` with all seeded requests restored and no crash.

- [ ] **Step 4: Commit**

```bash
git add src App.js
git commit -m "feat: add alias pair, referral cycle and typed-confirmation destructive reset"
```

---

### Task 11: Generic renderers for Tier B

**Files:**
- Create: `src/screens/generic.js`
- Modify: `src/data.js` (`BULK` registry)

**Interfaces:**
- Consumes: `src/ui.js` primitives, `src/styles.js`.
- Produces: `ListScreen`, `DetailScreen`, `FormScreen`, `WizardScreen`, each with the uniform `({ nav, params, app })` signature, configured by a `BULK[routeName]` entry.

Registry shape, defined once here and consumed by Tasks 12 and 13:

```js
// src/data.js
const BULK = {
  Policies: {
    kind: "list",
    title: "Insurance",
    heading: "Policies",
    collection: "POLICIES",     // key into the data module
    itemLabel: (item) => item.name,
    itemSub: (item) => item.provider,
    itemRoute: "PolicyDetail",
    itemParam: "policyId",
    testPrefix: "policy"
  },
  PolicyDetail: {
    kind: "detail",
    collection: "POLICIES",
    param: "policyId",
    label: "Policy",            // used by NotFound
    titleField: "name",
    rows: [["Provider", "provider"], ["Premium", "premium"], ["Renews", "renews"]],
    actions: [{ label: "Start a claim", testID: "start-claim", route: "ClaimStart" }],
    testPrefix: "policy-detail"
  }
  // ...one entry per Tier B route, added in Task 12
};
```

`kind: "form"` entries declare `fields: [{key, label, testID, multiline?, required?}]`, `submitLabel`, `submitTestID`, `nextRoute`. `kind: "wizard"` entries declare `steps: [{heading, fields}]` and use `params.step`.

**Addressing (Tier B is sparse — this is the one place the renderers differ from every v1.0 screen):** each generic renderer emits a `testID` on exactly two things — the route's primary action button (`${testPrefix}-primary`) and its list container (`${testPrefix}-list`). Every other element (list rows, secondary buttons, detail field values, form inputs) gets an `accessibilityLabel` **and no `testID`**, so the crawler must locate it via text, the accessibility tree, or vision. `cfg.testPrefix` therefore names only those two anchors; it is not a row-ID prefix.

- [ ] **Step 1: Write the four renderers**

`ListScreen` maps the collection to `Pressable` rows. `DetailScreen` looks up by `params[param]` and renders `<NotFound label={cfg.label} nav={nav} />` on a miss, then a `ReviewBlock` from `cfg.rows`. `FormScreen` holds local state per field, disables submit until every `required` field is non-blank, and pushes `cfg.nextRoute`. `WizardScreen` renders `cfg.steps[params.step - 1]` and pushes itself with `step + 1` until the last step, then `cfg.nextRoute`.

`WizardScreen` must bound itself: if `params.step` is out of range, render `NotFound`. An unbounded wizard would break the termination guarantee.

- [ ] **Step 2: Verify**

```bash
yarn selfcheck && yarn bundle-check
```
Expected: both exit 0. No visible change yet — no route uses these until Task 12.

- [ ] **Step 3: Commit**

```bash
git add src
git commit -m "feat: add generic list, detail, form and wizard renderers"
```

---

### Task 12: Tier B clusters — 22 data-driven routes

**Files:**
- Modify: `src/data.js` (5 collections + 22 `BULK` entries + 22 `ROUTE_META` entries), `App.js` (`ROUTES`)
- Modify: `scripts/data.test.js`

**Interfaces:**
- Consumes: the `BULK` shape and the four renderers from Task 11.
- Produces: 22 new routes wired into `ROUTES`, each mapping to one of the four generic components.

| Cluster | Routes | Seed collection |
| --- | --- | --- |
| Notifications | `Inbox` (list), `NotificationDetail` (detail), `NotificationSettings` (form) | `NOTIFICATIONS` × 25 |
| Insurance | `Policies` (list), `PolicyDetail` (detail), `ClaimStart` (detail), `ClaimWizard` (wizard, 3 steps), `ClaimSubmitted` (detail) | `POLICIES` × 6 |
| Providers | `Directory` (list), `ProviderDetail` (detail), `MessageThread` (list), `ComposeMessage` (form) | `PROVIDERS` × 30 |
| Reminders | `RemindersMonth` (list), `RemindersDay` (list), `ReminderDetail` (detail), `CreateReminder` (form), `RecurrencePicker` (list) | `REMINDERS` × 45 |
| Security & data | `Security` (list), `ChangePassword` (form), `TwoFactorSetup` (wizard, 2 steps), `DataExport` (detail), `ExportStatus` (detail) | — |

**The highest-value part of this task:** `NotificationDetail` items carry a
`deepLink` field (`{route, params}`) and render a `notification-open-target`
button that pushes it. Seed the 25 notifications so that at least 6 point into
*other clusters* — `RequestDetail` for request notifications, `PaymentReview` for
invoice ones, `PolicyDetail` for insurance ones, `DocumentDetail` for document
ones. These cross-cutting edges are what turn a clean tree into a graph, which is
where naive crawlers regress.

- [ ] **Step 1: Add the deep-link integrity test**

Append to `scripts/data.test.js`:

```js
const { NOTIFICATIONS, POLICIES, PROVIDERS, REMINDERS, BULK, ROUTE_META } = data;

assert.strictEqual(NOTIFICATIONS.length, 25, "25 notifications");
assert.strictEqual(POLICIES.length, 6, "6 policies");
assert.strictEqual(PROVIDERS.length, 30, "30 providers");
assert.strictEqual(REMINDERS.length, 45, "45 reminders");

const routeNames = new Set(ROUTE_META.map((r) => r.name));

// Every deep link must target a real route, or the crawler follows an edge into
// a NotFound and the ground-truth graph is wrong.
const linked = NOTIFICATIONS.filter((n) => n.deepLink);
assert.ok(linked.length >= 6, "at least 6 notifications deep-link into other clusters");
for (const n of linked) {
  assert.ok(routeNames.has(n.deepLink.route), `notification ${n.id} links to a real route: ${n.deepLink.route}`);
}

// Cross-cluster means the target is not itself a notification route.
const notifRoutes = new Set(["Inbox", "NotificationDetail", "NotificationSettings"]);
assert.ok(
  linked.some((n) => !notifRoutes.has(n.deepLink.route)),
  "at least one deep link leaves the notifications cluster"
);

// Every BULK entry must name a collection that exists and a kind we can render.
for (const [name, cfg] of Object.entries(BULK)) {
  assert.ok(["list", "detail", "form", "wizard"].includes(cfg.kind), `${name} has a known kind`);
  if (cfg.collection) {
    assert.ok(Array.isArray(data[cfg.collection]), `${name} collection ${cfg.collection} exists`);
  }
  if (cfg.itemRoute) {
    assert.ok(routeNames.has(cfg.itemRoute), `${name} itemRoute ${cfg.itemRoute} is a real route`);
  }
  if (cfg.nextRoute) {
    assert.ok(routeNames.has(cfg.nextRoute), `${name} nextRoute ${cfg.nextRoute} is a real route`);
  }
}
```

- [ ] **Step 2: Run it to verify it fails**

```bash
yarn selfcheck
```
Expected: `FAIL data.test.js`, exit 1.

- [ ] **Step 3: Add the five collections with bounded, deterministic generators**

No `Math.random()` anywhere — the ground-truth graph must be reproducible across runs. Use index arithmetic as in Task 8.

- [ ] **Step 4: Add the 22 `BULK` entries and register the routes**

Each `ROUTES` value is one of the four generic components. Because several routes share a component, the Task 3 `route.key` counter is what keeps their state from leaking — this is the task that would expose a regression there.

- [ ] **Step 5: Verify**

```bash
yarn selfcheck && yarn bundle-check
```
Expected: both exit 0.

Run the app. Verify each cluster is reachable, that `ClaimWizard` terminates at step 3, and specifically: open `Inbox`, tap a request notification, follow `notification-open-target`, and confirm it lands on the correct `RequestDetail` with the correct request. Then navigate `Inbox → NotificationDetail` for two *different* notifications in a row and confirm the second shows its own content — same component, different route params, which is the state-leak check.

- [ ] **Step 6: Commit**

```bash
git add src scripts/data.test.js App.js
git commit -m "feat: add 22 data-driven Tier B routes with cross-cluster deep links"
```

---

### Task 13: Data multiplication to final counts

**Files:**
- Modify: `src/data.js`, `scripts/data.test.js`

**Interfaces:**
- Consumes: all existing collections.
- Produces: final seed counts. `ROUTE_META` is complete after this task.

| Collection | Now | Target |
| --- | --- | --- |
| `SERVICES` | 4 | 24 |
| `INITIAL_REQUESTS` | 3 | 40 |
| `DOCUMENTS` | 60 | 60 |
| `INVOICES` | 12 | 12 |
| `NOTIFICATIONS` | 25 | 25 |
| `POLICIES` | 6 | 6 |
| `PROVIDERS` | 30 | 30 |
| `REMINDERS` | 45 | 45 |

- [ ] **Step 1: Add the count assertions**

Append to `scripts/data.test.js`:

```js
assert.strictEqual(data.SERVICES.length, 24, "24 services");
assert.strictEqual(data.INITIAL_REQUESTS.length, 40, "40 seeded requests");

// The 4 v1.0 services must survive verbatim - Flow 1 depends on service-plumbing
// and GUIDELINES.md documents these testIDs.
for (const id of ["cleaning", "plumbing", "groceries", "car"]) {
  assert.ok(data.SERVICES.some((s) => s.id === id), `v1.0 service ${id} is preserved`);
}

// The 3 v1.0 request ids must survive - Flows 2 and 3 target them by id.
for (const id of ["REQ-1042", "REQ-1038", "REQ-0977"]) {
  assert.ok(data.INITIAL_REQUESTS.some((r) => r.id === id), `v1.0 request ${id} is preserved`);
}

// Every status must be one the Requests filter can show, or a request becomes
// unreachable and the expected graph overcounts.
const STATUSES = new Set(["Active", "Completed", "Canceled"]);
for (const r of data.INITIAL_REQUESTS) {
  assert.ok(STATUSES.has(r.status), `request ${r.id} status ${r.status} is filterable`);
}

// Total param states, for the CRAWLER.md headline number.
const states =
  data.SERVICES.length + data.INITIAL_REQUESTS.length + data.DOCUMENTS.length +
  data.INVOICES.length + data.NOTIFICATIONS.length + data.POLICIES.length +
  data.PROVIDERS.length + data.REMINDERS.length;
assert.ok(states >= 240 && states <= 260, `param states in the documented range: ${states}`);
```

- [ ] **Step 2: Run it to verify it fails**

```bash
yarn selfcheck
```
Expected: `FAIL data.test.js` with `24 services`, exit 1.

- [ ] **Step 3: Expand the collections**

Keep the 4 original services and 3 original requests **verbatim and first** in their arrays, then append generated entries. Every added request must reference a real service id and a seeded address, or the Task 2 assertions fail.

- [ ] **Step 4: Run the test to verify it passes**

```bash
yarn selfcheck
```
Expected: `PASS data.test.js`, exit 0.

- [ ] **Step 5: Verify**

```bash
yarn bundle-check
```
Expected: exit 0.

Run the app. `Home` now lists 24 service cards in a `ScrollView` — confirm scrolling is smooth and re-walk **Flow 1** to confirm `service-plumbing` is still findable among 24 cards. Confirm the `Requests` list renders 40 rows without visible jank; if it does jank, that is the documented ceiling for converting that one screen to `FlatList`, not a reason to add a list library.

- [ ] **Step 6: Commit**

```bash
git add src scripts/data.test.js
git commit -m "feat: expand seed data to ~250 param states"
```

---

### Task 14: Ground truth graph and check-graph

The task that makes the fixture a *measurement* rather than an app.

**Files:**
- Create: `src/graph.js`, `scripts/check-graph.js`, `scripts/graph.test.js`
- Create: `crawler-expected-graph.json` (generated, committed)
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: `ROUTE_META`, `BULK`, all collections from `src/data.js`.
- Produces:
  - `src/graph.js` (CommonJS): `buildGraph() -> { version, nodes, edges, traps }`.
  - `yarn graph` regenerates `crawler-expected-graph.json`; `yarn check-graph` validates it against `App.js`.

`ROUTE_META` entry shape, finalized:

```js
{
  name: "AddCard",
  tier: "A",                    // "A" | "B" | "v1"
  addressing: "exhaustive",     // "exhaustive" (v1 + Tier A) | "sparse" (Tier B)
  anchors: ["card-submit"],     // testIDs this route guarantees; [] for sparse rows
  tab: "Billing",               // owning tab root, or null for pre-auth
  instances: 1,                 // param instance count; e.g. DocumentDetail: 60
  noBack: false,
  noTabs: false,
  terminal: false,
  trap: "Format validation, not just non-empty",   // null if not a trap
  escape: "16 digits, MM/YY month 01-12, 3-digit CVV, non-blank name",
  edges: [{ to: "PaymentMethods", requiresInput: true, gated: false, cycle: false }]
}
```

- [ ] **Step 1: Write the failing test**

Create `scripts/graph.test.js`:

```js
const assert = require("assert");
const { buildGraph } = require("../src/graph.js");

const g = buildGraph();

assert.strictEqual(g.version, "1.1.0", "graph is stamped with the app version");
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

// Every no-back route must have at least one outbound edge, or it is a genuine
// soft-lock rather than a solvable dead end.
for (const n of g.nodes.filter((x) => x.noBack)) {
  assert.ok(
    g.edges.some((e) => e.from === n.name),
    `no-back route ${n.name} has an in-content exit`
  );
}

// Every node reachable from the entry route. An unreachable route inflates the
// denominator and makes 100% coverage impossible.
const adjacency = new Map(g.nodes.map((n) => [n.name, []]));
for (const e of g.edges) adjacency.get(e.from).push(e.to);
const seen = new Set(["Login"]);
const queue = ["Login"];
while (queue.length) {
  for (const next of adjacency.get(queue.shift())) {
    if (!seen.has(next)) { seen.add(next); queue.push(next); }
  }
}
const orphans = g.nodes.map((n) => n.name).filter((n) => !seen.has(n));
assert.deepStrictEqual(orphans, [], `every route is reachable from Login; orphans: ${orphans}`);

// Tier A and Tier B must both be non-empty and scored separately.
assert.ok(g.nodes.filter((n) => n.tier === "A").length >= 20, "at least 20 Tier A routes");
assert.ok(g.nodes.filter((n) => n.tier === "B").length >= 22, "at least 22 Tier B routes");

// Param instances must be finite - the termination guarantee.
for (const n of g.nodes) {
  assert.ok(Number.isFinite(n.instances) && n.instances >= 1, `${n.name} has a finite instance count`);
}

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
```

- [ ] **Step 2: Run it to verify it fails**

```bash
yarn selfcheck
```
Expected: `FAIL graph.test.js` with `Cannot find module '../src/graph.js'`, exit 1.

- [ ] **Step 3: Write `src/graph.js`**

`buildGraph()` maps `ROUTE_META` to nodes, resolving `instances` from the referenced collection length (so `DocumentDetail` reports 60 without hardcoding it), and flattens `edges` into `{from, to, requiresInput, gated, cycle}`. Stamp `version` from `package.json`.

- [ ] **Step 4: Run the test to verify it passes**

```bash
yarn selfcheck
```
Expected: `PASS graph.test.js`, exit 0. Fix `ROUTE_META` until every assertion holds — the orphan and escape assertions will find real gaps left by Tasks 5-13.

- [ ] **Step 5: Write `scripts/check-graph.js`**

This is the one check that catches app/rubric divergence. `App.js` contains JSX so node cannot import it; read it as text and extract the `ROUTES` keys:

```js
// ponytail: text-scans App.js for ROUTES keys because App.js contains JSX and
// cannot be require()d under plain node. Upgrade path: if App.js ever gains a
// build step, import the map directly.
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
```

Add to `package.json` scripts:

```json
"graph": "node -e \"const fs=require('fs');const {buildGraph}=require('./src/graph.js');fs.writeFileSync('crawler-expected-graph.json',JSON.stringify(buildGraph(),null,2)+'\\n')\"",
"check-graph": "node scripts/check-graph.js"
```

- [ ] **Step 6: Generate and verify**

```bash
yarn graph && yarn check-graph
```
Expected: `check-graph: 54 routes, N edges, OK`, exit 0.

Then prove the check actually catches divergence: temporarily add `Bogus: HomeScreen,` to the `ROUTES` map in `App.js` and run `yarn check-graph`. Expected: fails with `routes in App.js but not in ROUTE_META: [ 'Bogus' ]`. Remove it and re-run to confirm it passes.

- [ ] **Step 7: Commit**

```bash
git add src scripts crawler-expected-graph.json package.json
git commit -m "feat: generate and validate the crawler ground-truth graph"
```

---

### Task 15: Documentation — GUIDELINES.md and CRAWLER.md

`GUIDELINES.md` is the eval contract. Leaving it enumerating 12 screens after this change makes it actively wrong, which is worse than having no doc for a test fixture.

**Files:**
- Modify: `GUIDELINES.md`, `README.md`
- Create: `CRAWLER.md`, `CLAUDE.md`

- [ ] **Step 0: Bring `CLAUDE.md` onto this branch and correct it**

`main` has no `CLAUDE.md`; a good one exists only on the `local-first-product` branch. Recover it and fix the parts v1.1.0 invalidates:

```bash
git show local-first-product:CLAUDE.md > CLAUDE.md
```

Keep verbatim: the yarn/Node 22/`ulimit` commands, the release-APK workflow and Appium caps, the `slug()` testID convention, and the "no backend, no navigation library, no platform-specific module" constraint. Rewrite: the "entire app is one file `App.js`" architecture section (now `App.js` + `src/`), the `{route.name === "X" && ...}` description (now a keyed `ROUTES` map), and "no test runner — don't invent `yarn test`" (now `yarn selfcheck`, `yarn check-graph`, `yarn bundle-check`, but still no test *framework*). Add the tier-split addressing policy, since it is the rule most likely to be violated by future edits.

- [ ] **Step 1: Fix the stale package manager instructions**

`GUIDELINES.md:8-16` and `README.md:17-24` say `npm install` / `npm run ios`, but `package.json` declares `packageManager: yarn@1.22.22` and the repo standardized on yarn in commit `742763d`. Replace all `npm` invocations with `yarn` equivalents (`yarn`, `yarn ios`, `yarn android`, `yarn start`).

- [ ] **Step 2: Rewrite the `GUIDELINES.md` App Map**

Replace the 12-entry list at `GUIDELINES.md:18-31` with all ~54 routes, grouped by tab root and tier, each with a one-line purpose. Generate the list from `crawler-expected-graph.json` so it cannot drift.

- [ ] **Step 3: Update the four documented flows**

Flows 1, 2 and 4 gain a preceding auth step (sign in, or tap `login-guest`). Flow 3 gains the extra `open-filter-sheet` tap from Task 9. All existing testIDs stay as written. Add the new auth testIDs to Flow 1's list.

- [ ] **Step 4: Write `CRAWLER.md`**

Sections, in order:

1. **What this fixture measures** — Tier A (intelligence) and Tier B (scale), scored as **two numbers, never one**, and why merging them hides which failed. Include the addressing split: Tier A is exhaustively addressed and scored on exact testIDs; Tier B is sparsely addressed, so it is scored on reached routes and cross-cluster edges only, and its trap anchors are **not** mechanically verifiable by `check-graph`. State that limitation plainly — a rubric that implies more precision than it has is worse than one that admits its edges.
2. **Trap rubric** — one row per Tier A trap: route, trap, correct behavior, common wrong behavior, the testIDs that prove it. Generated from `crawler-expected-graph.json` so it cannot drift from the app.
3. **Scoring under a bounded budget** — the graph deliberately exceeds the crawl budget; report coverage-per-step and cluster spread, not raw coverage.
4. **Known non-coverage** — the fixture is hermetic, so it cannot test network latency or flakiness, OS permission dialogs, WebViews, inbound deep links, real IdP login, rotation, varied screen sizes, or server errors. A crawler that aces Paperwork has proven it can navigate; it has not proven it survives a real app.
5. **How to verify the fixture itself** — `yarn selfcheck && yarn check-graph && yarn bundle-check`.

- [ ] **Step 5: Verify**

```bash
yarn selfcheck && yarn check-graph && yarn bundle-check
```
Expected: all three exit 0.

Cross-check by hand: pick three routes at random from `GUIDELINES.md`'s new App Map and confirm each exists in `ROUTES` and behaves as documented. Confirm every Tier A trap in `CRAWLER.md` has a non-empty "correct behavior" cell.

- [ ] **Step 6: Commit**

```bash
git add GUIDELINES.md README.md CRAWLER.md
git commit -m "docs: document the v1.1.0 route map and crawler scoring rubric"
```

---

## Verification summary

Three commands, runnable at any point after Task 14:

```bash
yarn selfcheck      # pure-logic asserts: navcore, validate, data, graph
yarn check-graph    # app ROUTES map and ground truth agree, JSON not stale
yarn bundle-check   # Metro bundles both platforms; catches every broken import
```

Manual verification is limited to the four documented flows plus the per-task
trap walkthroughs, because there is no UI test framework and adding one is out of
scope. Android hardware back (Task 4) **must** be verified on a real Android
device or emulator — it cannot be covered by any of the three commands above.

## Deferred, with triggers

| Deferred | Add when |
| --- | --- |
| Reducer for app state | A third distinct action must mutate 3+ domains atomically (currently only the destructive reset does) |
| Per-route options object instead of `NO_TABS`/`NO_BACK` Sets | A third shell flag appears; the likely third is a per-route title, since the top bar hardcodes `"Paperwork"` |
| `FlatList` on `Requests` or `Documents` | Measured jank at 40/60 rows, not before |
| `react-native-safe-area-context` | Only if Expo already provides it; `ANDROID_NAV_BAR_GAP_ANDROID = 48` stays a named knob until then |
| Unbounded generators | A crawler passes the bounded fixture and you need termination pressure |
| UI test framework | Manual flow-walking becomes the bottleneck, not the fixture |

## Verified environment facts (recorded during execution)

- `--platform all` fails: this app has no `react-native-web` dependency or web config, and adding one would violate the no-new-dependencies constraint. The working invocation bundles only the platforms the app supports, with the flag repeated (`--platform ios,android` is not accepted). Consequence: `bundle-check` cannot catch web-only breakage. No task in this plan targets web, and `yarn web` is already non-functional on `main`.
- `yarn bundle-check` cold-cache wall clock: **~15 s**. Cheap enough to run on every task without batching.
