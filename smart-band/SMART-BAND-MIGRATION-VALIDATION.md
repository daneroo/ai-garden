# Smart Band migration - validate the plan (Pixel 9 + iPad)

Goal: confirm the data paths work before you invest time (or pay for apps).

This checklist is intentionally short. Once it passes, follow
`smart-band/SMART-BAND-MIGRATION.md`.

## What you decide at the end

- Legacy history: import into Health Connect? (yes/no)
- Future pipeline: Mi Fitness -> Health Connect works for your metrics? (yes/no)
- Google Fit: read-only viewer vs direct writes? (prefer read-only)

## Validation gates

### Gate 1: offline escape hatch exists (iPad + web) (10-20 min)

- [ ] iPad Health app: "Export All Health Data"; confirm you can access the ZIP.
- [ ] Huawei ID Privacy Centre: "Request Your Data"; confirm you can download and
      store the ZIP.
- [ ] Record where the ZIP(s) live (folder name, drive, etc.).

Pass criteria: you have at least one ZIP you can keep long-term.

### Gate 2: legacy import is feasible on Pixel (10-30 min)

Only do this if you care about legacy history inside Android.

- [ ] Pixel 9: install Huawei Health; sign into the same Huawei ID.
- [ ] Confirm your history appears on Pixel (not just new data).
- [ ] Pixel 9: install Health Sync; confirm Huawei Health is available as a
      source.
- [ ] Optional: check whether historical sync requires a one-time unlock.

Pass criteria: history is visible locally on Pixel and Health Sync can see it.

Fail fallback: keep legacy history as an offline archive only; start fresh in
Health Connect.

### Gate 3: future pipeline works (after Band 10 pairing) (1-2 days)

- [ ] Pair Band 10 with Mi Fitness.
- [ ] Grant Mi Fitness write permissions in Health Connect.
- [ ] After 24-48h: check Health Connect has the metrics you care about (steps,
      sleep, HR, workouts).

Pass criteria: the metrics you care about land in Health Connect without needing
a second bridge.

Fail fallback: use Health Sync as a bridge if needed (or accept that some metrics
stay only in the vendor app).

### Gate 4: duplication risk is controlled (5-15 min)

- [ ] For each metric type, pick one writer into Health Connect.
- [ ] If Google Fit reads from Health Connect, avoid parallel writes to Fit from
      apps.
- [ ] Spot-check steps/sleep/workouts/HR for duplication after each change.

Pass criteria: no obvious duplicates over a day.

## Decision record (fill in)

- Date:
- Legacy history inside Health Connect: yes/no (why)
- Future writer into Health Connect: Mi Fitness / Health Sync / other
- Google Fit mode: read from Health Connect only / other
- Notes:
