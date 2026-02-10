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

- [ ] Open Mi Fitness at least twice daily (background sync may not trigger
      automatically on all devices).
- [ ] Run for 48 hours and verify no doubled `steps` and no duplicate `sleep`
      sessions.
- [ ] Verify HR and SpO2 entries come from Mi Fitness only (check individual
      data points).
- [ ] If gaps appear, open Mi Fitness and check whether data backfills.

## Quick Name Map

- `Huawei Health`: legacy vendor app holding Honor Band history.
- `Health Sync`: Android bridge app by appyhapps. Free 7-day trial; one-time
  purchase for permanent license. Historical backfill requires paid license.
  Available on Google Play Store.
- `Health Connect`: Android on-device health data hub on Pixel.
- `Google Fit`: optional viewer/sink layer (API shut down June 2025; app still
  works as standalone tracker but is being phased out).

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

Trigger conditions (any of these):

- Mi Fitness cannot connect/write to Health Connect.
- One or more priority metrics (`steps`, `sleep`, `HR`, `SpO2`) are missing in
  Health Connect after 48h.
- Mi Fitness -> Health Connect is unstable after re-auth/reinstall and
  permission reset.

Fallback steps (in order):

1. Reinstall Mi Fitness, re-grant Health Connect permissions, retry.
2. Clear Health Connect cache, reset app priority, retry.
3. If still failing: use `Health Sync` as bridge from Mi Fitness to Health
   Connect (same bridge app used for backfill).
4. Last resort: use Google Fit as viewer only (note: Google Fit API was shut
   down June 2025; Fit app still works but is being deprecated in favor of
   Fitbit. Do not rely on Fit as a long-term writer).

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

### About Health Sync

- Android app by **appyhapps**
  ([Play Store](https://play.google.com/store/apps/details?id=nl.appyhapps.healthsync),
  [healthsync.app](https://healthsync.app)).
- Acts as a bridge between health platforms (reads from one, writes to another).
- **Free trial**: 7 days (live sync only, no historical backfill).
- **Paid license**: one-time purchase for permanent license (historical backfill
  requires paid license).
- Supports Huawei Health as source and Health Connect as direct destination (no
  Google Fit intermediary needed).
- Confirmed metrics from Huawei Health: `steps`, `sleep` (light/deep/REM), `HR`
  (continuous + resting), `SpO2`.
- Historical backfill syncs backward in time, 1+ days per batch every 15
  minutes.

### Backfill Approach: Temporary Huawei Install on Pixel 9

- Health Sync requires the Huawei Health app installed locally (no cloud-only or
  credential-based access).
- Huawei Health APK can be sideloaded from APKMirror (no AppGallery needed), but
  HMS Core is also required for it to function.
- Strategy: install temporarily, run backfill, verify, then uninstall Huawei
  Health + HMS Core and clear app data.

### Prerequisites

- Huawei Health data synced to Huawei's cloud (verify via iPad Huawei Health app
  before installing on Pixel 9).
- Paid Health Sync license (one-time purchase, required for historical
  backfill).

### Backfill Steps

1. Wait for Huawei export package, then inspect structure and coverage
   (`validated`).
2. Backfill only after Mi Fitness sync is stable (`engineering recommendation`).
3. **Temporary install on Pixel 9**:
   - Sideload Huawei Health APK + HMS Core from APKMirror.
   - Sign in with Huawei ID; confirm historical data is visible.
   - Install Health Sync from Play Store; purchase license.
   - Configure Health Sync source: `Huawei Health`, destination:
     `Health Connect` (direct, no Google Fit needed).
   - Test with 1-day historical window to verify `steps`, `sleep`, `HR`, `SpO2`
     appear in Health Connect.
   - Run full historical sync.
4. **Verify backfill** in Health Connect before cleanup.
5. **Cleanup**: uninstall Huawei Health + HMS Core, clear residual app data.
6. Fallback if sideloading Huawei Health on Pixel 9 fails:
   - Use Pixel 6 as staging device instead (install Huawei stack there, backfill
     to Health Connect on Pixel 6, then transfer via Health Connect
     backup/restore ZIP export/import).
   - Code fallback: parse Huawei Privacy Centre export ZIP and write directly to
     Health Connect via Android API (`validated API method`).

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
  Health Connect sync (steps, HR, sleep, SpO2 confirmed).
- `Validated`: `Health Sync` supports Huawei Health as source and Health Connect
  as direct destination. Supports `steps`, `sleep`, `HR`, `SpO2`.
- `Validated`: Health Sync supports historical backfill (paid license required).
- `Validated`: Health Connect backup and restore (added late 2024) supports
  cross-device transfer via ZIP export/import (Pixel 6 fallback path).
- `Constraint`: Health Sync requires Huawei Health app installed locally; Huawei
  Health APK can be sideloaded from APKMirror without AppGallery, but HMS Core
  is also required. Temporary install on Pixel 9, uninstall after backfill.
- `Caveat`: Mi Fitness background sync may require app to be actively opened on
  some devices (user reports from Oct 2025).
- `Caveat`: Huawei Health data must be synced to Huawei cloud for Health Sync to
  access it.
- `Inferred`: Health Connect ZIP export preserves full metric fidelity across
  devices (not yet tested on this exact setup; Pixel 6 fallback only).
- `Inferred`: Metric parity for `sleep`, `HR`, and `SpO2` will be complete
  without gaps or transformations on your exact setup.
- `Recommendation`: stabilize live Mi Fitness flow first, then run historical
  backfill as a separate operation.
