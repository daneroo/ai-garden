# Better Plan (GPT-5.3, 2026-02-10)

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

1. Wait for Huawei export package, then inspect structure and coverage.
2. Choose backfill method:
   - No-code bridge: Huawei app + Health Sync migration path
   - Code path: parse Huawei export and import into Health Connect via Android app
3. Backfill only after live Mi Fitness pipeline is stable.

## Decision Rule

- Prioritize continuity first (`new data flowing now`), then completeness (`historical backfill`).

## 48h Validation Checklist

- [ ] Band 10 data present in Mi Fitness.
- [ ] Chosen canonical route configured (A or B).
- [ ] No duplicate writers for `steps`, `sleep`, `HR`, `workouts`.
- [ ] Daily totals look sane across app views.
- [ ] Huawei export package downloaded or status checked.
