# Paperwork v1.1.0 — Deepened Screen Graph for Crawler Evaluation

Date: 2026-08-23
Status: design, pending implementation plan

## Goal

Grow Paperwork from 12 routes to ~54 so it can serve as a scored fixture for an
in-house app crawler. The app is not the product; the *measurement* is. Every
screen added must make some crawler behavior observable as pass/fail.

The crawler runs under a bounded step budget. The graph is therefore sized to
**overflow that budget on purpose**: the primary metric is coverage-per-step and
frontier prioritization, not whether the crawler eventually terminates.

## Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Emphasis | Adversarial graph, plus a bulk scale tier | Signal per screen, with scale pressure layered on top |
| Auth | Login gate at launch, guest escape hatch present | Tests gate traversal; guest path keeps the graph reachable |
| Code layout | Split into `src/` modules | 1246 lines today; ~54 routes in one file is unworkable |
| Route size | ~54 routes | Large enough to overflow budget, small enough that ground truth stays hand-verifiable |
| Bulk screens | 4 generic renderers driven by a data registry | 22 CRUD-shaped routes do not justify 22 bespoke components |
| Base branch | `v1.1.0-crawler-graph`, off `main@1e81d25` | See "Relationship to `local-first-product`" below |
| Element addressing | Split by tier — Tier A exhaustive testIDs, Tier B sparse realistic mix | See "Element addressing policy" below |

## Relationship to the `local-first-product` branch

A separate branch (`local-first-product`, 16 commits ahead of `main`) implements a
different approved spec for this same app: TypeScript, Expo Router, Zustand +
AsyncStorage persistence, and Jest. Its goal is a portfolio-quality local-first
app; this spec's goal is a scored crawler fixture. **They are deliberately kept
as separate directions.** v1.1.0 builds on `main`.

Accepted cost: once `main` carries 42 more routes, `local-first-product` is
effectively unmergeable and its 16 commits become dead work. That was a
deliberate call, not an oversight.

Its `CLAUDE.md` (which is not on `main`) documents two facts that bind this work
regardless: `main` has no test runner and none should be invented, and **Metro
debug builds do not load on a physical Android device here** — RN's
new-architecture ReactHost red-boxes with "Unable to load script." Android
verification requires a standalone release APK (`yarn android --variant
release`), which embeds the JS bundle.

## Element addressing policy

The two tiers are addressed differently, matching what each one measures.

**Tier A (20 adversarial routes): exhaustive.** Every interactive element gets
both `testID` and `accessibilityLabel`. All v1.0 testIDs are preserved
byte-for-byte. Rationale: these routes are the scoring rubric, so each trap needs
a precise, mechanically verifiable anchor. `scripts/check-graph.js` can assert
their presence.

**Tier B (22 bulk routes): sparse and realistic.** testIDs only on stable
navigation anchors — the route's primary action button and its list container.
Individual list rows, secondary buttons and detail fields carry
`accessibilityLabel` only, no `testID`. The crawler must find them via text, the
accessibility tree, or vision. Rationale: real apps do not carry exhaustive IDs,
and Tier B's job is realism at scale.

Consequence for scoring, which must be stated in `CRAWLER.md`: Tier B trap
anchors are **not** mechanically verifiable by `check-graph`. The ground-truth
graph marks each node with `addressing: "exhaustive" | "sparse"`, and the check
asserts anchor presence only for `exhaustive` nodes. Tier B is scored on reached
routes and cross-cluster edges, not on ID-level assertions.

## Two kinds of "more screens"

These are measured separately and must not be collapsed into one number.

- **Routes** — distinct code-level screens. Grows graph *shape*. ~54.
- **States** — param instances of a route (`DocumentDetail` × 60). Grows graph
  *size*, costs seed data only. ~250 instances.

Tier A (adversarial) is hand-written and heterogeneous: it measures crawler
*intelligence*. Tier B (bulk) is generated from data and structurally uniform: a
crawler that solves one bulk cluster solves all of them, so it measures *scale*.
Reporting these as a single coverage percentage would hide which one failed.

## Architecture

### File layout

```
App.js               router: ROUTES map, nav, shell flags, app state (~120 lines)
src/data.js          seed data + bulk route registry
src/ui.js            shared primitives + NotFound
src/styles.js        shared StyleSheet
src/screens/generic.js   ListScreen, DetailScreen, FormScreen, WizardScreen
src/screens/Auth.js      Login, ForgotPassword, Onboarding
src/screens/Booking.js   existing booking chain
src/screens/Requests.js  existing requests chain + Reschedule + filter sheet
src/screens/Billing.js   Billing, PaymentMethods, AddCard, PaymentReview, PaymentResult, Documents, DocumentDetail
src/screens/Profile.js   existing profile chain + HelpCenter, SupportFaq, Referral, DangerZone, DeleteAccount
src/screens/Misc.js      Search, Activity, SupportChat, LegalTerms
```

No `src/nav.js` — `nav` is constructed in `App` and passed down; nothing would
import it. No Context and no reducer: render depth is permanently 1, because
`App` renders exactly one `<Screen>`. Prop-threading a single `app` state bag is
the correct call at this depth. Revisit the reducer at the third distinct action
that must mutate 3+ domains atomically (there is currently exactly one: the
destructive reset).

### Route table

```js
const ROUTES = { Home: HomeScreen, Login: LoginScreen, /* ...54 lines */ };
const Screen = ROUTES[route.name] || NotFound;
<Screen key={route.key} nav={nav} params={route.params} app={app} />
```

Uniform props; screens derive their own data from `app`. No per-route prop-mapper
functions. `App.js` stops knowing screen internals — the existing
`requests.find(...)` in `App.js` moves into `RequestDetailScreen`.

**`route.key` is load-bearing.** The current `{route.name === "X" && <XScreen/>}`
chain gives every route its own position in the children array, so React
unmounts and remounts across each navigation for free. A single `<Screen>` slot
loses that: two routes sharing a component (aliased routes, `replace` to the same
screen) would reuse the instance, `useState` initializers would not re-run, and
form drafts would leak between routes. Nav assigns keys from a counter:

```js
let seq = 0;
const entry = (name, params = {}) => ({ key: `${name}#${++seq}`, name, params });
```

`key={route.name}` is insufficient — it breaks on the deliberate cycles.
Remounting on every push is a *feature* here: it makes forms reset and the app
deterministic for a crawler. No screen caching.

### Shell configuration

Two booleans exist, so two Sets — not an options schema:

```js
const NO_TABS = new Set(["Login", "ForgotPassword", "Onboarding", "LegalTerms"]);
const NO_BACK = new Set(["Login", "LegalTerms"]);
```

- `styles.content` hardcodes `marginBottom: TAB_BAR_HEIGHT + ANDROID_NAV_BAR_GAP`.
  With tabs hidden that leaves 72–120 px of dead space; needs
  `!showTabs && { marginBottom: 0 }`.
- On `NO_BACK` routes the back `Pressable` renders as `null`, not `disabled`. A
  present-but-inert `testID="nav-back"` reads as a broken app rather than a trap
  and pollutes the signal. Absence is unambiguous.
- Promote to per-route option objects when a third flag appears. The likely third
  is a route title — the top bar currently hardcodes `"Paperwork"`.

### Pre-existing hardening (P0, blocks the eval)

1. **Android hardware back is unhandled.** With no navigation library,
   `hardwareBackPress` exits the app from any depth. A crawler tapping system
   back once would record "app crashed" instead of "went back one screen,"
   invalidating a large share of runs. Add a `BackHandler` effect in `App.js`
   that calls `nav.back()` when `stack.length > 1` and the route is not a
   deliberate dead end, else returns `false`.
2. **Modals swallow Android back.** The existing cancel-confirm modal has no
   `onRequestClose`, so the agent is stuck with only the two on-screen buttons.
   Add it. Where a trap swallows back deliberately, comment that it is deliberate.
3. **Unguarded param lookups.** `ServiceDetailScreen` and `BookingFormScreen`
   call `SERVICES.find(...)` then dereference without a guard. Param-aliased
   routes plus a crawler re-pushing a stale id after the destructive reset makes
   `undefined.title` reachable. Add one shared `<NotFound label nav />` to
   `src/ui.js` and guard every lookup screen. The `ROUTES` fallback does not
   cover this — it catches bad route *names*, not bad params.
4. **`{value && <Text/>}` with numeric/empty-string values.** Today's file is
   accidentally safe. New screens carry balances, item counts and page counts,
   where `balance: 0` renders a bare `0` outside `<Text>` and hard-crashes. All
   new conditionals use `?:` or `!!`.
5. **`setTimeout` cleanup.** The slow-loading screen returns
   `() => clearTimeout(t)`. Because screens remount per push, screen-local
   `ready` state replays the delay on every visit; that is the intended
   behavior, chosen deliberately rather than discovered.

Out of scope but noted: `SafeAreaView` from `react-native` is deprecated in 0.83
and is a no-op on Android, and `ANDROID_NAV_BAR_GAP = 48` is a hardcoded guess
that a 4th tab will stress. Leave `48` as a named tuning knob.

## Tier A — adversarial routes (20, hand-written)

Each row lists the trap and the documented escape. **A trap with no correct
answer measures nothing**, so the escape is part of the spec, not an afterthought.

| Route | Trap | Correct crawler behavior |
| --- | --- | --- |
| `Login` | Gate. Sign-in disabled until email + password non-empty | Type into both fields and submit, or take `Continue as guest` |
| `ForgotPassword` | Off-path branch; post-submit "sent" state on the same route | Discover it at all; record 2 states for 1 route |
| `Onboarding` | State aliasing: `param.step` 1→3, near-identical layout | 3 distinct states, no infinite loop |
| `Search` | Results render only at ≥2 typed chars | Generate input; empty query yields 0 edges |
| `Activity` | Segmented control (All/Alerts/Receipts); content swaps, route does not | Record 3 states without recording 3 routes |
| `SupportChat` | 1.5 s simulated load → spinner → content | Wait for settled content; snapshotting the spinner is a fail |
| `Billing` | New 4th tab root | Reachable from the tab bar |
| `PaymentMethods` | Depth | — |
| `AddCard` | Format validation: 16-digit number, MM/YY, 3-digit CVV | Satisfy format constraints, not just non-empty |
| `PaymentReview` | Depth | — |
| `PaymentResult` | Two terminal states off a "simulate decline" toggle | Find both outcomes |
| `Documents` | Load-more, 10 at a time, 6 pages, then the button disappears | Re-enqueue a screen whose content changed; terminate |
| `DocumentDetail` | Param explosion: 60 ids on one route | Report 1 route / 60 instances, not 1 or 60 |
| `LegalTerms` | Dead end: normal route in `NO_BACK` + `NO_TABS`; exit only via in-content `Close` | Find the in-content exit |
| `Reschedule` | Reachable only from Active requests | Precondition-gated edge |
| `HelpCenter` | Alias A | 2 nodes |
| `SupportFaq` | Alias B — byte-identical UI and testIDs, different route | 2 nodes, not merged by appearance |
| `Referral` | Cycle: `Referral → Profile → Referral` | Loop detection |
| `DangerZone` | Destructive entry point | — |
| `DeleteAccount` | Must type the literal string `DELETE`; resets all state to seed and `nav.root("Login")` | Recover after self-inflicted reset; stale param ids must not crash |

Plus one non-route trap: the `Requests` filter becomes a bottom-sheet `Modal`
(overlay state that is not a route). The `LegalTerms` dead end is a *route*, not
a `Modal` — simpler, composes with the router, and cannot collide with the
cancel-confirm modal (two simultaneous `Modal`s break on iOS).

## Tier B — bulk routes (22, generic renderers)

Four renderers in `src/screens/generic.js` — `ListScreen`, `DetailScreen`,
`FormScreen`, `WizardScreen` — driven by a registry in `src/data.js`. Per the
element addressing policy, these routes get testIDs **only** on the primary
action button and the list container; rows and fields carry `accessibilityLabel`
alone.

| Cluster | Routes |
| --- | --- |
| Notifications | `Inbox`, `NotificationDetail`, `NotificationSettings` |
| Insurance | `Policies`, `PolicyDetail`, `ClaimStart`, `ClaimWizard` (3 steps), `ClaimSubmitted` |
| Providers | `Directory`, `ProviderDetail`, `MessageThread`, `ComposeMessage` |
| Reminders | `RemindersMonth`, `RemindersDay`, `ReminderDetail`, `CreateReminder`, `RecurrencePicker` |
| Security & data | `Security`, `ChangePassword`, `TwoFactorSetup`, `DataExport`, `ExportStatus` |

`Inbox` items **deep-link into other clusters** (a notification about a request
opens `RequestDetail`; one about an invoice opens `PaymentReview`). These
cross-cutting edges are the highest-value part of Tier B — they turn a clean tree
into a graph, which is where naive crawlers regress.

## Data multiplication (~250 states, no new code)

| Collection | v1.0 | v1.1.0 |
| --- | --- | --- |
| Services | 4 | 24 |
| Requests | 3 | 40 |
| Documents | — | 60 |
| Invoices | — | 12 |
| Notifications | — | 25 |
| Policies | — | 6 |
| Providers | — | 30 |
| Reminders | — | 45 |

Every generator is provably bounded, so the app terminates even for a crawler
that runs to exhaustion. Unbounded variants can be added later behind a flag.

## Ground truth artifact

`crawler-expected-graph.json` — nodes (route name, param instances, testIDs) and
edges (source, target, whether the edge requires typed input, whether it is
precondition-gated), plus expected terminal states. Generated from the same
`src/data.js` the app renders from, so it cannot drift; the tradeoff is that a
data bug corrupts app and rubric together, which the check below catches.

`CRAWLER.md` — per-trap rubric: what the trap is, what correct recovery looks
like, expected testIDs. `GUIDELINES.md` is the existing eval contract and is
updated in the same change: leaving it enumerating 12 screens would make it
actively wrong, which is worse than having no doc for a test fixture.

All v1.0 testIDs and the four documented v1.0 flows are preserved unchanged —
only new edges are added — so existing crawl runs stay comparable across versions.

## Verification

One runnable check, `scripts/check-graph.js` (plain Node, assert-based, no test
framework):

- every route in `ROUTES` appears as a node in `crawler-expected-graph.json`, and
  every node maps to a real route
- every edge targets an existing route
- every route marked as a trap has a non-empty documented escape
- every `NO_BACK` route has at least one in-content exit edge
- every generator is bounded (node count is finite and matches seed data)

This fails if the app and the rubric diverge, which is the only failure mode that
silently invalidates every score.

## Non-goals

No backend, no accounts, no payments, no native-only modules, no new
dependencies — `Modal`, `TextInput`, `FlatList` and `setTimeout` cover
everything. No list virtualization library: the load-more list is bounded at 60
items, so `ScrollView` + `.map` holds. State still resets on reload.
