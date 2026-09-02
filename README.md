# Paperwork

A small Expo React Native app for testing mobile agents and app crawlers on realistic multi-screen flows.

## What It Tests

- Signing in (or entering as guest) through the auth gate.
- Booking a home service through category, detail, form, review, and confirmation screens.
- Finding, editing, rescheduling, and canceling existing requests.
- Updating profile preferences, notification channels, and saved addresses.
- Crawler-scale navigation: 54 routes across 4 tabs, with a machine-readable ground-truth graph in `crawler-expected-graph.json`.

## Run

This project is pinned to Node 22 because Expo's local port scanner can fail on Node 25. The package manager is yarn (`packageManager: yarn@1.22.22`).

```sh
nvm use
yarn install
yarn ios
```

or:

```sh
yarn android
```

The UI uses seeded local state only, so no backend is required.

## Docs

- `GUIDELINES.md` - the screen map, mobile-agent task prompts, and important test IDs.
- `CRAWLER.md` - how to score a crawler run against this fixture, the trap rubric, and what the fixture does and does not verify.
- `CLAUDE.md` - working-on-this-repo notes (build, device, architecture constraints).
