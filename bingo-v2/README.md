# RF GGD Bingo 2.0 engine

This directory is a non-live Phase-2 implementation. The root `index.html` and `data/bingo-fields.json` remain Bingo 1.0.

## Truth boundaries

- `data/bingo-fields-v2.mjs` is a versioned implementation snapshot of the GGD003 75-field canonical pool.
- Wednesday 19:00–21:00 Europe/Berlin resolves only the sanitized Djehuty public snapshot for the same RF occurrence.
- The private `SHEET__RF_GGD_RUNTIME / session_state` is never fetched by the browser.
- `runtime-adapter.mjs` rejects raw row payloads and any unexpected field, including accidental lobby-code/Discord/Stream-Together leakage.
- A READY snapshot must match the current `RF_GGD_YYYY-MM-DD`, current date, fixed source/currentness classes, same-date map-selection timestamp and its 19:00–21:00 validity window.
- If Wednesday map truth is unavailable or stale, the resolver fails closed to explicit map selection.
- Outside the RF window, explicit playable-map selection is required.
- Map-specific fields are filtered before card generation.
- Family/risk caps prevent one role family or win type from flooding a card.
- Each user has their own card seed while sharing the same session/map eligibility context.
- Intelligence probabilities remain `UNKNOWN / PENDING_EVENT_HARVEST` until event extraction supplies real denominators.

## Djehuty producer boundary

The matching producer is implemented separately in Djehuty PR #75 (`agent/ggd-bingo-v2-runtime-snapshot`). It reads the private Sheet with Djehuty credentials and writes a local sanitized JSON file. It does not host or publish that file.

Serving the sanitized JSON, merging this PR, and changing the live Bingo route are separate release actions.

## Validation

`node --test tests/bingo-v2-engine.test.mjs`

The suite retains T01–T20 and adds browser-side schema/leak rejection tests. No deployment or live route change is part of this branch.
