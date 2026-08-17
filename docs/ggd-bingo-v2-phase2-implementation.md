# RF GGD Bingo 2.0 — Phase 2 implementation

Status: non-live implementation branch.

## Implemented

- 75-field canonical snapshot from GGD003 Phase-1 truth.
- Europe/Berlin Wednesday 19:00–21:00 resolver using same-date PRODUCTIVE, non-test, RUNWAY_READY session truth.
- Explicit manual map override at all times.
- Outside the RF window, map selection is required.
- Stale prior-week runtime state cannot resolve current Wednesday.
- The Lounge is not in the playable map set.
- Map-specific and role-derived map eligibility is applied before card generation.
- 24 event fields plus a Royal Family free center.
- Shared session/map eligibility context with separate per-user card seed.
- Family caps, map-flavor floor/ceiling, win caps, social/voice caps and provisional rarity caps.
- Detailed trigger/not-trigger data for tap/hover explanations.
- Intelligence remains UNKNOWN / PENDING_EVENT_HARVEST.
- Browser runtime adapter contains no Google credentials and fails closed without a public-safe snapshot source.
- T01–T20 regression suite and Node 20/22 PR CI.

## Explicitly not changed

- root `index.html`
- `data/bingo-fields.json`
- live Bingo 1.0 route
- production/runtime deployment
- public website integration

## Next gate

CI must reproduce T01–T20. After that, a separate authorized runtime-snapshot adapter and later live migration can be evaluated. No service-account credential may be exposed to the browser.
