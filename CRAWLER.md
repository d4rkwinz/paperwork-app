# CRAWLER.md - scoring a crawler run against Paperwork v1.1.0

This is the scoring rubric for the Paperwork fixture. The ground truth is `crawler-expected-graph.json` (54 routes, 100 edges, 504 param instances, 29 declared traps), regenerated from `src/data.js`'s `ROUTE_META` by `yarn graph` and byte-guarded by `yarn check-graph`. The tables below marked GENERATED are produced from that JSON by `yarn gen-docs`, so they cannot drift from the graph.

## 1. What this measures

The fixture has two deliberately different tiers, and a run must be scored as **two numbers, never one**:

- **Tier A - intelligence** (20 routes, one hand-written trap each). Every interactive element is exhaustively addressed with a `testID`. Tier A is scored on exact testIDs reached and traps escaped: the traps are gates that require typing, waiting, precondition satisfaction, format validation, typed confirmation, or recognizing state aliasing.
- **Tier B - scale** (22 generated routes). Deliberately **sparsely** addressed: only `${testPrefix}-primary` and `${testPrefix}-list` carry testIDs; every other element (list rows, inputs, secondary buttons) is reachable only by accessibility label, text, or vision. Tier B is scored on reached routes and cross-cluster edges, not on element-level testIDs - there are almost none to score. Consequence: Tier B's trap anchors are **not** mechanically verifiable by `yarn check-graph` at element granularity; the check verifies route/edge structure only.

The remaining 12 routes are the v1.0 core (booking, requests, profile), exhaustively addressed; one v1 route (`Requests`) gained a trap in v1.1 (the bottom-sheet filter).

Merging the two tiers into one coverage percentage hides which capability failed: a crawler can ace Tier A's puzzles while never penetrating Tier B's label-only fan-out, or sweep Tier B's lists while bouncing off every Tier A gate. Report Tier A and Tier B separately.

## 2. Trap rubric

**Trust note before you consume this table:** roughly two-thirds of these rows encode runtime constants (delays, tap counts, literal confirmation strings, hardware-back semantics) that no automated check reads and no device has confirmed - see section 6 for exactly which surface is device-verified.

<!-- BEGIN GENERATED: TRAP RUBRIC (yarn gen-docs) -->
One row per declared trap (29 total). "Correct behavior" is the
graph's `escape` field; the anchors are the route's declared testIDs, which are
what a scored run must show it reached.

| Route | Tier | Trap | Correct behavior | Anchors |
| --- | --- | --- | --- | --- |
| `Login` | A | Gate: crawler must type into two fields to progress | Type both fields and submit, or tap login-guest | `login-submit` |
| `ForgotPassword` | A | Off-path branch; 2 states on 1 route | Reachable from login-forgot; forgot-back returns to Login | `forgot-back` |
| `Onboarding` | A | State aliasing - 3 near-identical states on one route | 3 distinct states recorded, terminates at step 3; onboarding-skip is the shortcut. Below step 3, onboarding-next re-pushes this same route with step + 1 (the declared self-edge) | `onboarding-next` |
| `Requests` | v1 | Overlay state that is not a route - the filter lives in a bottom-sheet Modal, so request-filter-* options exist only while the sheet is open, and opening/closing it changes screen state, never the route | Tap open-filter-sheet, then tap a request-filter-{value} option (applies the filter and closes the sheet); close-filter-sheet or Android hardware back dismisses without changing the filter | `open-filter-sheet` |
| `Reschedule` | A | Precondition-gated edge - reschedule-request renders on RequestDetail only while request.status is Active, so this route is invisible from Completed/Canceled requests | Enter from an Active request (e.g. REQ-1042 or REQ-1038); Completed REQ-0977 legitimately has no reschedule-request control - the missing edge is correct, not a crawler gap | `reschedule-submit` |
| `Search` | A | Requires generated input - results render only when the trimmed query is >= 2 chars, so a crawler that never types sees 0 new edges | Type at least 2 characters into search-input (e.g. "pl" matches Plumber); a single character still shows search-empty; tap a search-result-{serviceId} row to reach ServiceDetail | `search-input` |
| `Activity` | A | In-screen state vs navigation - three segments swap the list content while the route never changes | Tap activity-seg-all, activity-seg-alerts, activity-seg-receipts and record 3 states for 1 route - not 3 routes, and not 1 state | `activity-seg-all` |
| `SupportChat` | A | Slow load - support-loading renders for 1500ms after every mount (screens remount per push, so the delay replays on every visit) before support-message-{n} and support-reply appear | Poll until support-loading is gone before snapshotting - settled content appears ~1.5s after entry | `support-title` |
| `LegalTerms` | A | Dead end - no top back button and no tab bar; Android hardware back backgrounds the app instead of navigating | Find and tap the in-content legal-close (calls nav.back) - it is the only exit | `legal-close` |
| `Billing` | A | 4th tab root - starts the app's deepest chain (Billing -> PaymentMethods -> AddCard and Billing -> PaymentReview -> PaymentResult); seeded INV-2405 has amount: 0 and INV-2408 has status: '' to exercise falsy-and rendering | Reachable from tab-billing in the tab bar; tap any billing-invoice-{id} row to reach PaymentReview, or open-payment-methods to go deeper via cards | `open-payment-methods` |
| `PaymentMethods` | A | Depth - second level of the billing chain; add-card is the only edge deeper | Reached via open-payment-methods on Billing; tap add-card to reach AddCard, nav-back returns to Billing | `add-card` |
| `AddCard` | A | Format validation - card-submit stays disabled until src/validate.js cardValid passes on all four fields; non-empty garbage does not enable it | Type 16 digits into card-number (spaces/dashes allowed), MM/YY with month 01-12 into card-expiry, exactly 3 digits into card-cvv, and any non-blank card-name; card-submit then enables and returns to PaymentMethods | `card-submit` |
| `PaymentReview` | A | Branch point - the simulate-decline Switch decides which of PaymentResult's two terminal states payment-pay produces | simulate-decline is reachable before paying; leave it off and tap payment-pay for success, flip it on and pay again for the declined state | `payment-pay` |
| `PaymentResult` | A | Two terminal states on one route - success renders payment-success + payment-done, declined renders payment-declined + payment-retry; only payment-result is present in both | Reach both states by flipping simulate-decline on PaymentReview; payment-retry replaces back to PaymentReview, payment-done returns to the Billing root | `payment-result` |
| `Documents` | A | Load-more growth - docs-load-more appends the next 10 of 60 docs in place, so the same route gains new doc-{id} rows after each tap; the crawler must re-enqueue the changed screen and still terminate | Tap docs-load-more repeatedly; it disappears after exactly 5 taps (6 pages, docs-count reads '60 of 60'), so the growth is bounded and exhaustion terminates | `docs-count` |
| `DocumentDetail` | A | Param explosion - one route reachable with 60 distinct docId params; the correct model is 1 route with 60 instances, not 60 routes and not 1 state | Each doc-{id} row on Documents pushes here with its own docId; doc-detail-back returns to Documents - or to NotificationDetail when entered via its deep link, since nav.back targets whichever route pushed this one | `doc-detail-title` |
| `HelpCenter` | A | Alias A - renders byte-identical output (heading, body, HELP_TOPICS list, testIDs) to SupportFaq from the same shared component; only the route name and entry point differ | Record 2 distinct nodes keyed by route, not by rendered content - a crawler that dedups on screen hash merges this with SupportFaq and reports 1 where the truth is 2 | `help-contact` |
| `SupportFaq` | A | Alias B - byte-identical rendered output and testIDs to HelpCenter; reached from Preferences (open-faq) instead of Profile (open-help) | Record 2 distinct nodes keyed by route, not by rendered content - identical appearance, distinct route | `help-contact` |
| `Referral` | A | Cycle - referral-open-profile pushes Profile, and Profile's open-referral pushes Referral, so the stack can grow Referral -> Profile -> Referral forever | Detect the loop by route identity and stop re-expanding visited routes; do not recurse indefinitely | `referral-code` |
| `DangerZone` | A | Destructive path entry - open-delete-account leads one hop deeper to the typed-confirmation reset | The screen itself is safe; the destructive action lives on DeleteAccount and requires typing the exact literal DELETE | `danger-warning` |
| `DeleteAccount` | A | Self-destruction - delete-submit resets requests, profile, paymentMethods, and session to seed and roots the stack at Login; it stays disabled until confirmsDelete passes on the exact literal DELETE (trimmed, case-sensitive - lowercase delete does not enable it) | Recover after the reset: the app lands on Login with seed data restored; any stale param id pushed afterwards must hit the NotFound guards, not a crash | `delete-submit` |
| `NotificationDetail` | B | Conditional cross-cluster deep link - the accessibilityLabel-only 'Open linked item' button renders on just 8 of 25 instances (the NOTIFICATION_LINKS indices), fanning out into the requests, billing, insurance, and documents clusters | Enumerate all 25 notificationId instances from inbox rows; on the 8 linked ones, find 'Open linked item' via the accessibility tree (it has no testID) - it pushes the linked route with that notification's deepLink params | `notification-detail-primary` |
| `NotificationSettings` | B | Param aliasing - entered from 25 NotificationDetail instances, each push carrying that notification's notificationId, which this form ignores; all 25 instances render identical content | Model 25 instances but recognize the rendered state is param-independent; fill the required 'Daily summary time' field to enable notification-settings-primary, which returns to Inbox | `notification-settings-primary` |
| `ClaimWizard` | B | Wizard step params - renders steps[params.step - 1] and NotFound on a missing, non-numeric, or out-of-range step, so entry MUST pass step: 1; the Next button re-pushes this same route with step + 1 (a self-edge, not a new route) | Enter via claim-start-primary (pushes step: 1); tap claim-wizard-primary through steps 2 and 3; the step-3 press lands on ClaimSubmitted with the static seeded claimId CLM-01 | `claim-wizard-primary` |
| `MessageThread` | B | Param aliasing - entered from 30 ProviderDetail instances, each push carrying providerId, which this shared thread ignores; all 30 instances render the same 6 seeded messages | Model 30 instances but recognize the rendered state is param-independent; tapping any message row (accessibilityLabel only) opens the reply composer | `message-thread-list` |
| `RemindersDay` | B | Per-instance filtered content - the same route renders a different 5-reminder subset per dayId; an unknown or missing dayId falls back to all 45 so the anchor list renders in every state | Visit all 9 dayId instances from RemindersMonth rows to see all 45 reminders; do not merge the instances just because the route name repeats | `reminders-day-list` |
| `RecurrencePicker` | B | Param aliasing - entered from 45 ReminderDetail instances, each push carrying reminderId, which this picker ignores; all 45 instances render the same 4 recurrence options | Model 45 instances but recognize the rendered state is param-independent; tapping a recurrence row (accessibilityLabel only) opens the creation form | `recurrence-picker-list` |
| `Security` | B | Hub list - unlike every other Tier B list, each row navigates to a DIFFERENT route via its item.link (linkField shape), and the TwoFactorSetup row must pass { step: 1 } or the wizard renders NotFound | Tap each of the 3 rows (accessibilityLabel only) to fan out to ChangePassword, TwoFactorSetup (step 1), and DataExport (EXP-01) | `security-list` |
| `TwoFactorSetup` | B | Wizard step params - renders steps[params.step - 1] and NotFound on a bad step, so entry MUST pass step: 1; the Next button re-pushes this same route with step: 2 (a self-edge) | Enter from Security's two-factor row (pushes step: 1); tap twofactor-setup-primary twice - the step-2 press returns to Security | `twofactor-setup-primary` |
<!-- END GENERATED: TRAP RUBRIC -->

## 3. Scoring under a bounded budget

The graph deliberately exceeds a bounded crawl budget: 504 param instances across 54 routes, with 60-document and 45-reminder fan-outs, cannot be exhausted in a typical bounded run, and that is the point. Raw coverage under a budget mostly measures the budget.

Report instead:

- **Coverage-per-step**: distinct `(route, params)` instances discovered divided by actions taken. Rewards crawlers that recognize aliasing and stop re-visiting identical states.
- **Cluster spread**: how many of the tab clusters (Home, Requests, Billing, Profile) and the pre-auth cluster the run penetrated, and how many cross-tab edges it exercised - against the *achievable* cross-tab denominator below, not the raw count. A run that exhausts one cluster and never leaves it should not outscore a run that reached all five.
- Tier A trap escapes (section 2) as their own count.

<!-- BEGIN GENERATED: ACHIEVABLE DENOMINATORS (yarn gen-docs) -->
**Achievable denominators - computed from the graph, not hand-counted.** 17 of the 100 edges are gated `NotFound -> Home` fallbacks that **cannot be triggered from the UI**: every collection is static, every list/action/deep-link push is asserted to resolve, wizard entries always pass `step: 1`, and the destructive reset roots the stack, so no stale param ever reaches a NotFound guard in normal operation. They are declared-but-unreachable guard documentation, not crawlable paths. Score against the achievable denominators: **83 of 100 edges** and **6 of 20 cross-tab edges** (cross-tab = both endpoints tab-owned, tabs differ). The exercisable cross-tab edges are: `BookingConfirmation -> RequestDetail`, `DocumentDetail -> NotificationDetail`, `NotificationDetail -> RequestDetail`, `NotificationDetail -> PaymentReview`, `NotificationDetail -> PolicyDetail`, `NotificationDetail -> DocumentDetail`.
<!-- END GENERATED: ACHIEVABLE DENOMINATORS -->

## 4. How instances are keyed - read this before scoring coverage

**One instance per distinct `(route, params)` pair that a real in-app control produces - NOT per distinct rendered state.** This is the graph's declared keying rule (its top-level `keying` field).

Several routes ignore the param they are pushed with and render byte-identically for every value. Under the keying rule they still count once per distinct param, because a real control produced each pair:

<!-- BEGIN GENERATED: ALIAS TABLE (yarn gen-docs) -->
| Route | Declared instances | Distinct rendered states | Shortfall under rendered-state dedupe |
| --- | --- | --- | --- |
| `NotificationSettings` | 25 | 1 | 24 |
| `RecurrencePicker` | 45 | 1 | 44 |
| `MessageThread` | 30 | 1 | 29 |
| `ComposeMessage` | 6 | 1 | 5 |
| `CreateReminder` | 4 | 1 | 3 |
| `ClaimWizard` | 8 | 3 | 5 |

A crawler that dedupes by rendered state reports **105** fewer instances across the fully param-aliased routes, and **110** fewer if it also collapses `ClaimWizard`'s policyId step-1 variants. Both figures are computed from the graph's declared `instances` by this script - do not hand-derive them from prose.
<!-- END GENERATED: ALIAS TABLE -->

**A crawler that dedupes by rendered state will legitimately report the shortfall above and must not be scored short for it.** If your scorer prefers rendered-state keying, that is defensible - but apply it consistently to both the expected and observed counts, using the table above.

Reconciling one inconsistency in the graph: `ComposeMessage` and `CreateReminder` have exactly the same param-aliasing property as `NotificationSettings`, `RecurrencePicker`, and `MessageThread`, but carry `trap: null` while those three declare aliasing as their trap. That is deliberate triage, not an oversight: the trap field marks the *scored* traps, and the three declared ones carry the alias pressure at scale (25/45/30 instances) while `ComposeMessage` (6) and `CreateReminder` (4) repeat the same lesson at sizes too small to score separately. For instance-counting purposes treat all five identically - the alias table above already does.

## 5. `instances` are seed-state counts, not live counts

The fixture is stateful and two flows create entities at runtime with `Math.random()` ids:

- Completing the booking flow creates a new request with a generated `REQ-####` id (seeded range plus `REQ-1100..1899`), adding `RequestDetail` instances.
- Saving a card in `AddCard` creates a `pm-####` payment method, adding `PaymentMethods` rows.

A thorough crawler that completes these flows will therefore observe **more** instances than the graph declares, with ids that differ between runs. This is correct behavior by the crawler and by the fixture. A scorer that treats `instances` as an exact expected count will penalise precisely the most thorough crawler; treat declared counts as the seeded floor, and treat extra `REQ-####` / `pm-####` entities as evidence of flow completion, not as noise.

## 6. What is NOT verified - trust limits

Be clear about what the ground truth actually guarantees. `yarn check-graph` verifies the route set, anchors, edge structure, shell flags, and byte-stale JSON against the committed source. It does **not** verify runtime behavior:

- The prose `trap`/`escape` fields encode runtime constants - the 1500 ms `SupportChat` delay, the literal `DELETE` confirmation gate, the 5-tap `docs-load-more` exhaustion, "Android hardware back backgrounds the app on `LegalTerms`" - that **no automated check reads and no device has confirmed**. The device-verified surface is exactly: the auth gate (`Login` / `ForgotPassword` / `Onboarding`), the four documented v1 flows in `GUIDELINES.md` (book a service, manage an existing request, cancel a request, update profile preferences), and hardware-back semantics on the v1 routes. Everything else - including every Tier B route, the billing/documents/support Tier A traps, and all the runtime constants above - is *asserted from source, not observed on a device*. Roughly two-thirds of the traps in section 2 fall on the unverified side.

Four things would make the ground truth untrustworthy, in order of likelihood (recorded in `docs/superpowers/plans/2026-08-23-paperwork-v1.1.0.md`, "ground-truth trust"):

1. **A future `App.js` shell edit** - `NO_BACK`/`NO_TABS` membership or a tab-bar row. Currently closed: `check-graph` verifies both in both directions. Keep it closed.
2. **A fabricated in-content edge on a Tier A route.** The nav-literal scan checks app -> meta only for Tier A (Tier B has two-way parity via `BULK`), so a declared edge that no control actually produces would be accepted. Pre-existing, documented in `scripts/data.test.js`.
3. **Drift in the prose `trap`/`escape` fields** (the runtime constants above) - no check reads them; only a device can confirm them.
4. **Hand-derived instance counts for param-aliased routes** - documented as unchecked; the alias table in section 4 is the mitigation, computed from declared counts, not re-derived from source.

One more trust limit that cuts the other way: the gated `NotFound -> Home` fallback edges are declared-but-unreachable guard documentation, not crawlable paths. A scorer that uses the raw edge or cross-tab totals as denominators penalizes every crawler for edges no UI control can produce - use the achievable denominators computed in section 3.

## 7. Known non-coverage

The fixture is hermetic by design: no backend, no network, all state in memory. It therefore cannot test, and a run against it says nothing about:

- network latency, flakiness, or server errors
- OS permission dialogs
- WebViews
- inbound deep links
- real identity-provider login
- rotation or varied screen sizes

A crawler that aces Paperwork has proven it can navigate; it has **not** proven it survives a real app.

## 8. How to verify the fixture itself

```sh
yarn selfcheck && yarn check-graph && yarn bundle-check
```

All three must exit 0. Optionally `yarn render-check` renders every route under a mock host (it exits 0 with an explanation if `react-test-renderer` is unavailable; it proves render safety and testID discipline, not native behavior). After editing `ROUTE_META`, run `yarn graph` then `yarn gen-docs` and commit the regenerated JSON and doc sections together - `check-graph` fails on a stale JSON, and a dirty `git diff` after `yarn gen-docs` means these tables were stale.
