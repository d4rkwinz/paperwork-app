# Paperwork Mobile Agent Test Guidelines

Paperwork is an Expo React Native app for exercising mobile agents across realistic multi-screen flows. It uses local seeded state only, so every test can run without accounts, backend services, or payment setup.

## Environment

- Use Node 22. The included `.nvmrc` is set to `22.22.0`.
- Install dependencies with `npm install`.
- Start iOS with `npm run ios`.
- Start Android with `npm run android`.
- If Metro fails with `EMFILE: too many open files`, raise the shell file limit before starting:

```sh
ulimit -n 65536
npm start
```

## App Map

- `Home`: service category cards and a suggested agent task.
- `ServiceDetail`: service description, pricing, and booking entry point.
- `BookingForm`: date, time, address, priority, and notes entry.
- `BookingReview`: separate booking confirmation review before submission.
- `BookingConfirmation`: created request summary and request-detail handoff.
- `Requests`: filterable active, completed, canceled, and all requests list.
- `RequestDetail`: request summary, status timeline, edit, and cancel modal.
- `EditRequest`: mutable date, time, priority, and notes.
- `EditRequestReview`: separate request-change review before saving.
- `Profile`: editable contact fields, saved addresses, notification preferences.
- `Addresses`: primary address radio-style selection.
- `Preferences`: notification toggles and derived delivery summary.

## Critical Flows

### 1. Book a Service

Goal: book a plumber for tomorrow morning at the home address.

Expected path, 6 navigated screens:

1. Open `Home`.
2. Tap `Plumber`.
3. Tap `Book this service`.
4. Select `Tomorrow`.
5. Select `8:00 AM` or `10:30 AM`.
6. Keep `Home - 24 Cedar Street`.
7. Optionally set priority and notes.
8. Tap `Review booking`.
9. Tap `Submit booking`.
10. Tap `View request`.
11. Confirm the new request detail appears.

Screen sequence: `Home` -> `ServiceDetail` -> `BookingForm` -> `BookingReview` -> `BookingConfirmation` -> `RequestDetail`.

Important test IDs:

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

Expected path, 6 navigated screens:

1. Open `Home`.
2. Tap the `Requests` tab.
3. Keep the `Active` filter.
4. Open `REQ-1042`.
5. Tap `Edit request`.
6. Choose a different time.
7. Edit notes.
8. Tap `Review changes`.
9. Tap `Save changes`.
10. Verify `Changes saved.` and the new details.

Screen sequence: `Home` -> `Requests` -> `RequestDetail` -> `EditRequest` -> `EditRequestReview` -> `RequestDetail`.

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

Expected path:

1. Open `Requests`.
2. Open `REQ-1038`.
3. Tap `Cancel request`.
4. Confirm with `Yes, cancel`.
5. Return to the request list.
6. Switch the filter to `Canceled`.
7. Verify `REQ-1038` appears with canceled status.

Important test IDs:

- `request-REQ-1038`
- `cancel-request`
- `confirm-cancel-request`
- `request-filter-canceled`

### 4. Update Profile Preferences

Goal: set notifications to email only and change the primary address.

Expected path:

1. Open `Profile`.
2. Open `Notification preferences`.
3. Turn push off, email on, SMS off.
4. Go back.
5. Open `Saved addresses`.
6. Select `Office - 9 Market Plaza`.
7. Go back and verify the profile summary changed.

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

## Notes

- Request IDs seeded at launch are stable except newly created bookings, which use a generated `REQ-####` ID.
- All state resets when the app reloads.
- The app intentionally avoids a backend and native-only modules so both iOS and Android can run from the same Expo project.
