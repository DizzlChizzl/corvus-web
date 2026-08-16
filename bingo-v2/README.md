# RF GGD Bingo 2.0 engine

This directory is a non-live Phase-2 implementation. The root `index.html` and `data/bingo-fields.json` remain Bingo 1.0.

## Truth boundaries

- `data/bingo-fields-v2.mjs` is a versioned implementation snapshot of the GGD003 75-field canonical pool.
- Wednesday 19:00–21:00 Europe/Berlin resolves only the same-date `PRODUCTIVE` + non-test + `RUNWAY_READY` runtime session state.
- The browser contains no Google service-account credentials. `runtime-adapter.mjs` accepts only a separately authorized public-safe JSON snapshot endpoint.
- If Wednesday map truth is unavailable, the resolver fails closed to explicit map selection.
- Outside the RF window, explicit playable-map selection is required.
- Map-specific fields are filtered before card generation.
- Family/risk caps prevent one role family or win type from flooding a card.
- Each user has their own card seed while sharing the same session/map eligibility context.
- Intelligence probabilities remain `UNKNOWN / PENDING_EVENT_HARVEST` until event extraction supplies real denominators.

## Validation

`node --test tests/bingo-v2-engine.test.mjs`

The suite maps to the T01–T20 contract from GGD003. No deployment or live route change is part of this branch.
