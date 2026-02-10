# Honor Band 6 → Xiaomi Smart Band 10 (Pixel 9)

> **Authorship**: OpenAI GPT-5.3, Anthropic Claude Sonnet 4.5\
> **Last Updated**: 2026-02-10

## Summary

- Goal: Move to Xiaomi Smart Band 10 without losing access to data
- Strategy: Prioritize continuity first (new data flowing now), then
  completeness (historical backfill)
- Default architecture: Health Connect is canonical; Google Fit is a viewer/sink
- Rule: One writer per metric type into Health Connect (avoid duplicates)

## Execution Checklist (Now to 48h)

### Pre-flight (Before Pairing)

- [ ] Confirm Google Takeout export is downloaded and archived.
- [ ] Check Huawei export status; download and archive package if ready.
- [ ] In Health Connect → App permissions, screenshot current writers for
      `steps`, `sleep`, `HR`, `SpO2`.
- [ ] Verify Mi Fitness app shows Health Connect in permissions list (install
      app, don't pair yet).
- [ ] In Google Fit → Profile → Settings (gear icon) → Track your activities,
      **disable phone activity tracking**.
- [ ] In Health Connect, audit current data sources and disable any unwanted
      writers before pairing.

### Pair and Configure

- [ ] Pair Band 10 to `Mi Fitness` on Pixel 9.
- [ ] In Mi Fitness, enable write access to Health Connect.
- [ ] Confirm new `steps`, `sleep`, `HR`, and `SpO2` records appear in Health
      Connect.
- [ ] In Health Connect → Data sources and priority → Steps, set Mi Fitness as
      **priority 1**.
- [ ] In Health Connect → Data sources and priority → Sleep, set Mi Fitness as
      **priority 1**.
- [ ] In Health Connect → Data sources and priority → Heart rate, set Mi Fitness
      as **priority 1**.
- [ ] In Health Connect → Data sources and priority → Oxygen saturation, set Mi
      Fitness as **priority 1**.

### Validate (48 Hours)

- [ ] Run for 48 hours and verify no doubled `steps` and no duplicate `sleep`
      sessions.
- [ ] Verify HR and SpO2 entries come from Mi Fitness only (check individual
      data points).

## Quick Name Map

- `Huawei Health`: legacy vendor app holding Honor Band history.
- `Health Sync`: bridge app used to migrate/sync between ecosystems.
- `Health Connect`: Android on-device health data hub on Pixel.
- `Google Fit`: optional viewer/sink layer.

## Context

- Objective: move from `Honor Band 6` to `Xiaomi Smart Band 10` without losing
  data.
- Current state:
  - Huawei data export request submitted (`2026-02-10 14:29:54`).
  - Google Takeout export requested for `Fit` + `Timeline`
    (`2026-02-10 1:41 AM`).
- Constraint: avoid lock-in and avoid duplicate metrics across apps.

## Metric Priority

- Priority order: `steps`, `sleep`, `HR`, `SpO2`.

## Key Correction

- `Xiaomi Smart Band 10` should be paired with `Mi Fitness` (not Zepp Life).

## Fallback (Only If Mi Fitness -> Health Connect Fails)

- Use `Mi Fitness -> Google Fit` only if one of these failures happens:
  - Mi Fitness cannot connect/write to Health Connect.
  - One or more priority metrics (`steps`, `sleep`, `HR`, `SpO2`) are missing in
    Health Connect after 48h.
  - Mi Fitness -> Health Connect is unstable after re-auth/reinstall and
    permission reset.
- If you switch:
  - Let Google Fit be the only writer for those metrics.
  - Disable other writers for those metrics to avoid duplicates.

## One Writer Per Metric (What This Means)

- For each metric, choose exactly one app that writes data:
  - `steps`: Mi Fitness (or phone/Fit, but not both)
  - `sleep`: Mi Fitness only
  - `HR`: Mi Fitness only
  - `SpO2`: Mi Fitness only
- Why this matters:
  - Health Connect deduplicates based on **time windows and data type**:
    - `steps`: Deduped when same time range + similar count
    - `sleep`: Deduped when overlapping time sessions
    - `HR`/`SpO2`: Typically **not** deduped if from different sources
  - Risk isn't just inflation - it's also **app priority conflicts**
  - Duplicate `steps` is the most likely issue if phone-based tracking is
    enabled

## Pixel 9 Fix + Confirm Flow

1. In `Health Connect`, open `App permissions` and ensure only intended apps can
   write each metric.
2. In `Google Fit`, disable phone step tracking (`Track your activities`) if Mi
   Fitness is your step source.
3. In `Health Connect`, check metric entries and source apps:
   - `Data and access -> Activity -> Steps -> See all entries`
   - `Data and access -> Sleep -> See all entries`
   - `Data and access -> Vitals -> Heart rate / Oxygen saturation -> See all entries`
4. For `Activity` and `Sleep`, set app priority so Mi Fitness is first if
   multiple sources exist.
5. Recheck after 24-48h:
   - steps trend is plausible and not suddenly doubled
   - sleep sessions are singular, not overlapping duplicates
   - HR/SpO2 entries come from expected source only

## Legacy Backfill Strategy (Phase 2)

1. Wait for Huawei export package, then inspect structure and coverage
   (`validated`).
2. Default backfill method: no-code bridge with `Health Sync` (`real workflow`,
   metric coverage must be tested).
3. No-code bridge flow:
   - Install/sign in Huawei Health where needed for source visibility.
   - Configure `Health Sync` source `Huawei Health` and destination
     `Health Connect`.
   - Run historical sync and validate `steps`, `sleep`, `HR`, `SpO2`.
4. Fallback method if no-code coverage is incomplete:
   - Code option: parse Huawei export and import into Health Connect via Android
     app (`validated API method`).
5. Backfill only after Mi Fitness sync is stable (`engineering recommendation`).
6. Test Health Sync with 1-day historical window to verify Huawei→Health Connect
   supports `steps`, `sleep`, `HR`, `SpO2` before full backfill.

### Phase 2 Stability Criteria

Before proceeding with historical backfill, verify Mi Fitness → Health Connect
is stable:

- [ ] After 7 consecutive days with no missing hourly HR samples
- [ ] No duplicate sleep sessions during validation period
- [ ] Steps count is plausible (no sudden doubling or missing days)
- [ ] SpO2 data appears as expected (during sleep or manual measurements)

## Phase 2 Confidence (Validated vs Inferred)

- `Validated`: Huawei provides account data-copy export flow and downloadable
  package via Privacy Centre.
- `Validated`: Health Connect supports app writes/import, including setting
  source metadata.
- `Validated`: Smart Band 10 pairs with Mi Fitness, and Mi Fitness exposes
  third-party sync flow.
- `Validated`: `Health Sync` is an established generic bridge app used for
  Huawei-to-Health-Connect migration workflows.
- `Inferred`: A no-code bridge can backfill all needed Huawei metrics with
  acceptable fidelity on your exact setup.
- `Inferred`: Metric parity for `sleep`, `HR`, and `SpO2` will be complete
  without gaps or transformations.
- `Recommendation`: stabilize live Mi Fitness flow first, then run historical
  backfill as a separate operation.
