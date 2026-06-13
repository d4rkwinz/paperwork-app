# LifeAdmin

A small Expo React Native app for testing mobile agents on realistic multi-screen flows.

## What It Tests

- Booking a home service through category, detail, form, review, and confirmation screens.
- Finding, editing, and canceling existing requests.
- Updating profile preferences, notification channels, and saved addresses.

## Run

This project is pinned to Node 22 because Expo's local port scanner can fail on Node 25.

```sh
nvm use
npm install
npm run ios
```

or:

```sh
npm run android
```

The UI uses seeded local state only, so no backend is required.

See `GUIDELINES.md` for the screen map, mobile-agent task prompts, and important test IDs.
