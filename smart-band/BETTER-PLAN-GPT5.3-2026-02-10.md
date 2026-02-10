# Better Plan (GPT-5.3, 2026-02-10)

## Decision Rule

- Prioritize continuity first (`new data flowing now`), then completeness (`historical backfill`).

## 48h Validation Checklist

- [ ] Band 10 data present in Mi Fitness.
- [ ] Chosen canonical route configured (A or B).
- [ ] No duplicate writers for `steps`, `sleep`, `HR`, `workouts`.
- [ ] Daily totals look sane across app views.
- [ ] Huawei export package downloaded or status checked.

## Quick Name Map

- `Huawei Health`: legacy vendor app holding Honor Band history.
- `Health Sync`: bridge app used to migrate/sync between ecosystems.
- `Health Connect`: Android on-device health data hub on Pixel.
- `Google Fit`: optional viewer/sink layer.

## Context

- Objective: move from `Honor Band 6` to `Xiaomi Smart Band 10` without losing data.
- Current state:
  - Huawei data export request submitted (`2026-02-10 14:29:54`).
  - Google Takeout export requested for `Fit` + `Timeline` (`2026-02-10 1:41 AM`).
- Constraint: avoid lock-in and avoid duplicate metrics across apps.

## Key Correction

- `Xiaomi Smart Band 10` should be paired with `Mi Fitness` (not Zepp Life).

## Shortest Working Plan

1. Pair Band 10 to `Mi Fitness` on Pixel 9 and confirm data is arriving.
2. Pick one canonical route for daily data:
   - Route A: `Mi Fitness -> Google Fit`
   - Route B: `Mi Fitness -> Health Connect`, then Fit reads from Health Connect
3. Keep exactly one writer per metric (`steps`, `sleep`, `HR`, `workouts`).
4. Run for 48 hours and validate no duplicate totals.
5. Leave Huawei history as a second phase until export package arrives.

## Legacy Backfill Strategy (Phase 2)

1. Wait for Huawei export package, then inspect structure and coverage (`validated`).
2. Default backfill method: no-code bridge with `Health Sync` (`real workflow`, metric coverage must be tested).
3. No-code bridge flow:
   - Install/sign in Huawei Health where needed for source visibility.
   - Configure `Health Sync` source `Huawei Health` and destination `Health Connect`.
   - Run historical sync and validate `steps`, `sleep`, `HR`, `workouts`.
4. Fallback method if no-code coverage is incomplete:
   - Code path: parse Huawei export and import into Health Connect via Android app (`validated API path`).
5. Backfill only after live Mi Fitness pipeline is stable (`engineering recommendation`).

## Phase 2 Confidence (Validated vs Inferred)

- `Validated`: Huawei provides account data-copy export flow and downloadable package via Privacy Centre.
- `Validated`: Health Connect supports app writes/import, including setting source metadata.
- `Validated`: Smart Band 10 pairs with Mi Fitness, and Mi Fitness exposes third-party sync flow.
- `Validated`: `Health Sync` is an established generic bridge app used for Huawei-to-Health-Connect migration workflows.
- `Inferred`: A no-code bridge can backfill all needed Huawei metrics with acceptable fidelity on your exact setup.
- `Inferred`: Metric parity for `sleep`, `HR`, and `workouts` will be complete without gaps or transformations.
- `Recommendation`: stabilize live Mi Fitness flow first, then run historical backfill as a separate operation.
