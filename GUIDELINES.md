# Paperwork Mobile Agent Test Guidelines

Paperwork is an Expo React Native app for exercising mobile agents across realistic multi-screen flows. It uses local seeded state only, so every test can run without accounts, backend services, or payment setup.

For crawler scoring - the trap rubric, tier split, and what the fixture does and does not verify - see `CRAWLER.md`.

## Environment

- Use Node 22. The included `.nvmrc` is set to `22.22.0`.
- The package manager is yarn (`packageManager: yarn@1.22.22`).
- Install dependencies with `yarn install`.
- Start iOS with `yarn ios`.
- Start Android with `yarn android`.
- If Metro fails with `EMFILE: too many open files`, raise the shell file limit before starting:

```sh
ulimit -n 65536
yarn start
```

## App Map

<!-- BEGIN GENERATED: APP MAP (yarn gen-docs) -->
54 routes (12 v1 / 20 Tier A / 22 Tier B), 100 edges, 504 param instances - counts computed from `crawler-expected-graph.json`. Tier A routes are exhaustively addressed (every interactive element carries a `testID`); Tier B routes are deliberately sparse - only `${testPrefix}-primary` and `${testPrefix}-list` carry testIDs, everything else is addressable by accessibility label or text only. See `CRAWLER.md` for what that split measures.

### Pre-auth and untabbed

| Route | Tier | Instances | Purpose |
| --- | --- | --- | --- |
| `Login` | A | 1 | Auth gate: email + password sign-in, guest entry, forgot-password branch |
| `ForgotPassword` | A | 1 | Password-reset branch off Login; forgot-back returns |
| `Onboarding` | A | 3 | 3-step intro after sign-in; onboarding-skip shortcuts to Home |
| `LegalTerms` | A | 1 | Dead-end legal text: no top back button, no tab bar |

### Home tab

| Route | Tier | Instances | Purpose |
| --- | --- | --- | --- |
| `Home` | v1 | 1 | Service category cards; entries to Search, Activity, Inbox |
| `ServiceDetail` | v1 | 24 | Service description, pricing, and booking entry point |
| `BookingForm` | v1 | 24 | Date, time, address, priority, and notes entry |
| `BookingReview` | v1 | 1 | Booking confirmation review before submission |
| `BookingConfirmation` | v1 | 1 | Created-request summary and request-detail handoff |
| `Search` | A | 1 | Query input; results render only once the trimmed query is 2+ chars |
| `Activity` | A | 1 | Segmented activity feed; segments swap content without a route change |
| `Inbox` | B | 1 | Notification list |
| `NotificationDetail` | B | 25 | One notification; some carry a cross-cluster deep-link button |
| `NotificationSettings` | B | 25 | Notification settings form; entry param is ignored (aliased) |

### Requests tab

| Route | Tier | Instances | Purpose |
| --- | --- | --- | --- |
| `Requests` | v1 | 1 | Request list; the status filter lives in a bottom-sheet overlay |
| `RequestDetail` | v1 | 40 | Request summary, status timeline, edit/reschedule/cancel actions |
| `Reschedule` | A | 15 | Date/time-only reschedule; entry renders only while the request is Active |
| `EditRequest` | v1 | 15 | Mutable date, time, priority, and notes (Active requests only) |
| `EditRequestReview` | v1 | 15 | Request-change review before saving |
| `RemindersMonth` | B | 1 | Month view listing reminder days |
| `RemindersDay` | B | 9 | Per-day reminder list; each day filters to its own subset |
| `ReminderDetail` | B | 45 | One reminder |
| `RecurrencePicker` | B | 45 | Recurrence options; entry param is ignored (aliased) |
| `CreateReminder` | B | 4 | New-reminder form |

### Billing tab

| Route | Tier | Instances | Purpose |
| --- | --- | --- | --- |
| `Billing` | A | 1 | 4th tab root; entry to the app's deepest chains |
| `PaymentMethods` | A | 1 | Saved cards list; add-card goes one level deeper |
| `AddCard` | A | 1 | Card form; submit stays disabled until the card format validates |
| `PaymentReview` | A | 12 | Invoice review; a simulate-decline switch picks the result branch |
| `PaymentResult` | A | 24 | Terminal payment outcome: success or decline on one route |
| `Documents` | A | 1 | Document list; load-more appends 10 of 60 per tap, in place |
| `DocumentDetail` | A | 60 | One document, reachable with 60 distinct docId params |
| `Policies` | B | 1 | Insurance policy list |
| `PolicyDetail` | B | 6 | One policy |
| `ClaimStart` | B | 6 | Claim entry per policy; begins the claim wizard at step 1 |
| `ClaimWizard` | B | 8 | 3-step wizard keyed on params.step; Next re-pushes the same route |
| `ClaimSubmitted` | B | 1 | Claim receipt (static seeded CLM-01) |

### Profile tab

| Route | Tier | Instances | Purpose |
| --- | --- | --- | --- |
| `Profile` | v1 | 1 | Contact fields plus entries to addresses, preferences, support, referral |
| `Preferences` | v1 | 1 | Notification toggles and derived delivery summary |
| `Addresses` | v1 | 1 | Primary address radio-style selection |
| `SupportChat` | A | 1 | Support chat; renders a loading state for 1500 ms after every mount |
| `HelpCenter` | A | 1 | Help topics; renders byte-identical to SupportFaq |
| `SupportFaq` | A | 1 | Help topics; renders byte-identical to HelpCenter |
| `Referral` | A | 1 | Referral code; its open-profile button pushes Profile again (cycle) |
| `DangerZone` | A | 1 | Destructive-path entry, one hop above DeleteAccount |
| `DeleteAccount` | A | 1 | Typed-DELETE confirmation; resets all state and signs out |
| `Directory` | B | 1 | Provider directory |
| `ProviderDetail` | B | 30 | One provider |
| `MessageThread` | B | 30 | Provider message thread; entry param is ignored (aliased) |
| `ComposeMessage` | B | 6 | New-message form; entry param is ignored (aliased) |
| `Security` | B | 1 | Hub list: each row navigates to a different route |
| `ChangePassword` | B | 1 | Password-change form |
| `TwoFactorSetup` | B | 2 | 2-step wizard keyed on params.step |
| `DataExport` | B | 1 | Data-export request form |
| `ExportStatus` | B | 1 | Export status page |
<!-- END GENERATED: APP MAP -->

## The auth gate

The app launches on `Login`; every flow below starts behind it. Two ways in:

- **Guest**: tap `login-guest` - lands directly on `Home`.
- **Sign in**: type anything into `login-email` and `login-password` (submit stays disabled while either is empty), tap `login-submit` - lands on `Onboarding`; tap `onboarding-skip` (or `onboarding-next` three times) to reach `Home`.

Auth test IDs: `login-email`, `login-password`, `login-submit`, `login-guest`, `login-forgot`, `forgot-email`, `forgot-submit`, `forgot-back`, `onboarding-next`, `onboarding-skip`.

## v1.0 -> v1.1 test ID changes

**Single breaking change**: `missing-request-back` ("Go to requests") no longer exists. Every screen's params-dereference failure now renders the shared `NotFound` component, whose escape is `notfound-home` ("Go home"). Everything else is additive.

New test IDs external suites may want:

- `reschedule-request` on `RequestDetail` - renders only while the request's status is Active.
- `reschedule-date-*` and `reschedule-time-*` are ChoiceRow **prefixes**, not elements: the full IDs follow the same `slug()` convention as `edit-date-*` (e.g. `reschedule-time-8-00-am`, `reschedule-date-tomorrow`). No bare `reschedule-date` element exists.
- `reschedule-submit` confirms the reschedule. Note that `Reschedule` shows **no** "Changes saved." notice afterwards - that notice requires `params.saved`, which only the Edit flow (`save-request-changes`) sets.
- `open-filter-sheet` / `close-filter-sheet` on `Requests` - the status filter moved into a bottom-sheet overlay, so `request-filter-*` options exist only while the sheet is open.

## Critical Flows

All four flows assume the auth gate has been passed (see above); `login-guest` is the shortest way in.

### 1. Book a Service

Goal: book a plumber for tomorrow morning at the home address.

Expected path:

1. Pass the auth gate (tap `login-guest`, or sign in and skip onboarding).
2. Open `Home`.
3. Tap `Plumber`.
4. Tap `Book this service`.
5. Select `Tomorrow`.
6. Select `8:00 AM` or `10:30 AM`.
7. Keep `Home - 24 Cedar Street`.
8. Optionally set priority and notes.
9. Tap `Review booking`.
10. Tap `Submit booking`.
11. Tap `View request`.
12. Confirm the new request detail appears.

Screen sequence: `Login` -> `Home` -> `ServiceDetail` -> `BookingForm` -> `BookingReview` -> `BookingConfirmation` -> `RequestDetail`.

Important test IDs:

- `login-guest` (or `login-email`, `login-password`, `login-submit`, `onboarding-skip`)
- `service-plumbing`
- `book-service`
- `date-tomorrow`
- `time-8-00-am`
- `address-home-24-cedar-street`
- `booking-notes`
- `review-booking`
- `submit-booking`
- `view-created-request`

### 2. Manage an Existing Request

Goal: find an active cleaning request, update its time and notes, then verify the detail screen changed.

Expected path:

1. Pass the auth gate.
2. Tap the `Requests` tab.
3. Keep the default `Active` filter (the filter options live in the bottom sheet behind `open-filter-sheet`; no tap is needed for Active).
4. Open `REQ-1042`.
5. Tap `Edit request`.
6. Choose a different time.
7. Edit notes.
8. Tap `Review changes`.
9. Tap `Save changes`.
10. Verify `Changes saved.` and the new details.

Screen sequence: `Login` -> `Home` -> `Requests` -> `RequestDetail` -> `EditRequest` -> `EditRequestReview` -> `RequestDetail`.

Important test IDs:

- `tab-requests`
- `request-filter-active`
- `request-REQ-1042`
- `edit-request`
- `edit-time-1-00-pm`
- `edit-request-notes`
- `review-request-changes`
- `save-request-changes`

### 3. Cancel a Request

Goal: cancel an active grocery request and verify it moves out of the active list.

Expected path (one tap longer than v1.0: the filter now lives in a bottom sheet):

1. Pass the auth gate.
2. Tap `tab-requests`.
3. Open `request-REQ-1038`.
4. Tap `cancel-request`.
5. Confirm with `confirm-cancel-request`.
6. Return to the request list (`nav-back`).
7. Tap `open-filter-sheet`.
8. Tap `request-filter-canceled` - selecting a filter applies it **and closes the sheet**; do not tap `close-filter-sheet`.
9. Verify `REQ-1038` appears with canceled status.

Important test IDs:

- `request-REQ-1038`
- `cancel-request`
- `confirm-cancel-request`
- `nav-back`
- `open-filter-sheet`
- `request-filter-canceled`

### 4. Update Profile Preferences

Goal: set notifications to email only and change the primary address.

Expected path:

1. Pass the auth gate.
2. Tap `tab-profile`.
3. Open `Notification preferences`.
4. Turn push off, email on, SMS off.
5. Go back.
6. Open `Saved addresses`.
7. Select `Office - 9 Market Plaza`.
8. Go back and verify the profile summary changed.

Important test IDs:

- `tab-profile`
- `open-preferences`
- `toggle-push`
- `toggle-email`
- `toggle-sms`
- `open-addresses`
- `select-address-office-9-market-plaza`

## Agent Evaluation Ideas

- Require the agent to recover after tapping the wrong tab.
- Ask the agent to verify final state from visible UI text, not from assumptions.
- Ask for destructive actions, such as cancellation, and require confirmation handling.
- Ask for edits that require scrolling to lower form fields.
- Ask the agent to compare active and canceled filters after a state change.
- Point a crawler at the app and score it against `crawler-expected-graph.json` (see `CRAWLER.md`).

## Notes

- Request IDs seeded at launch are stable except newly created bookings, which use a generated `REQ-####` ID (and newly saved cards, which use `pm-####`).
- All state resets when the app reloads.
- The app intentionally avoids a backend and native-only modules so both iOS and Android can run from the same Expo project.
- The App Map above is generated from `crawler-expected-graph.json` by `yarn gen-docs`; edit `scripts/gen-docs.js` and rerun it rather than hand-editing between the markers.
