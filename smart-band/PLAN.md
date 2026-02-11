# Honor Band 6 → Xiaomi Smart Band 10 (Pixel 9)

## Summary

- Goal: Move to Xiaomi Smart Band 10 without losing access to data
- Strategy: Prioritize continuity first (new data flowing now), then
  completeness (historical backfill)
- Default architecture: Health Connect is canonical; Google Fit is a viewer/sink
- Rule: One writer per metric type into Health Connect (avoid duplicates)

## Execution Checklist (Now to 48h)

### Pre-flight (Before Pairing)

- [x] Confirm Google Takeout export is downloaded and archived.
- [ ] Check Huawei export status; download and archive package if ready.
      (Checked 2026-02-10: request confirmed, still in flight.)
- [x] In Health Connect → App permissions, screenshot current writers for
      `steps`, `sleep`, `HR`, `SpO2`. (Only Google Fit writing; 1 of 4 apps has
      access.)
- [x] Verify Mi Fitness app shows Health Connect in permissions list (install
      app, don't pair yet). (Confirmed: "Health Connect" tag on Play Store
      listing.)
- [x] In Google Fit → Profile → Settings (gear icon) → Track your activities,
      **disable phone activity tracking**. (Also disabled "Use your location".)
- [x] In Health Connect, audit current data sources and disable any unwanted
      writers before pairing. (Disabled all Fit write permissions; Fit is
      read-only now.)

### Pair and Configure

- [x] Pair Band 10 to `Mi Fitness` on Pixel 9. (Paired; Xiaomi account created;
      notifications allowed; battery set to Unrestricted; firmware updated to
      3.2.7.)
- [x] In Mi Fitness, enable write access to Health Connect. (Allow All granted
      via Health Connect → App permissions → Mi Fitness.)
- [x] Confirm new `steps`, `sleep`, `HR`, and `SpO2` records appear in Health
      Connect. (First sync at 15:47; Activity + Vitals writing confirmed. Fix:
      Mi Fitness app's "Fitness and Wellness" permission was off by default —
      Settings → Apps → Mi Fitness → Permissions → Allow All.)
- [x] In Health Connect → Data sources and priority, set device priority: Mi
      Fitness, Pixel 9, Fit.

### Validate (Completed 2026-02-11)

- [x] Open Mi Fitness at least twice daily.
- [x] Run for 48 hours and verify no doubled `steps` and no duplicate `sleep`.
- [x] Verify HR/SpO2 entries come from Mi Fitness only.
- [x] Monitor for gaps.
- **Validation Result**: SUCCESS.
  - **Steps/Sleep/HR**: Flowing correctly. No duplicates.
  - **Activities**: Flowing correctly (Walk, Treadmill).
  - **SpO2**: Flow to Health Connect unconfirmed (likely UI issue in Fit),
    non-blocking.
- Validation log (2026-02-11, ~22h into 48h window):
  - Sleep: Mi Fitness 7h24, visible in Health Connect and Fit. Honor Band 6
    recorded 6h47 (different algorithm, expected discrepancy).
  - Steps: 5946 (Mi Band = Mi Fitness), 5932 (Fit). No duplicates.
  - HR: Full data in Mi Fitness and Health Connect. Fit surfaces RHR only.
  - SpO2: Full data in Mi Fitness. **Health Connect status UNCONFIRMED** (needs
    check in Data and access → Vitals → Oxygen saturation). **Not visible in
    Fit.**
  - Activities: Treadmill + outdoor walk visible in Mi Fitness and Fit. Labels
    differ; map data from Mi Fitness does not transfer to Fit.

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
- Device timeline:
  - `Pixel 3`: ordered 2019-08-29, CA$999.
  - `Honor Band 5`: ordered 2020-04-25, CA$55.
  - `Honor Band 6`: ordered 2021-03-14, CA$93.
  - `Pixel 6`: ordered 2021-10-24, CA$799.
  - `Pixel 9 Pro`: purchased 2025-09-13 (used, Marketplace), CA$870.
  - `Xiaomi Smart Band 10`: ordered 2026-01-26, paired 2026-02-10, CA$99.
  - `Health Sync`: Google account access granted 2022-12-18 (free trial; license
    not purchased — will need to buy for Phase 2 backfill).
- Current state:
  - Huawei data export request submitted (`2026-02-10 14:29:54`).
  - Google Takeout export requested for `Fit` + `Timeline`
    (`2026-02-10 1:41 AM`).
- Takeout findings:
  - 33 sleep sessions in Fit archive, spanning 2020-11 to 2023-10.
  - Source includes `nl.appyhapps.heal` (Health Sync) — confirms prior use of
    Health Sync to push Honor Band sleep data into Fit.
  - This data reached Fit's cloud and appears in Takeout, confirming Health
    Connect/Fit cloud-sync path for backfilled data.
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
5. Recheck after 24-48h
   - steps trend is plausible and not suddenly doubled
   - sleep sessions are singular, not overlapping duplicates
   - HR/SpO2 entries come from expected source only

## Phase 2: Historical Backfill (Execution Plan)

### Prerequisites

- [ ] Huawei Health Data: Synced to cloud (verified on iPad).
- [ ] Huawei Export: Request confirmed (keep as backup/archive).
- [ ] Tools: Huawei Health (App) + HMS Core (App) + Health Sync (App).

### Prepare Source Data (Pixel 9)

- [ ] Download APKs: Since Huawei apps are not in Play Store, download recent
      versions from a trusted source (e.g., APKMirror): - Huawei Health (base
      app) - Huawei Mobile Services (HMS Core - required for login)
- [ ] Install & Login: Install both. Open Huawei Health, sign in with Huawei ID.
- [ ] Verify Source: Confirm your history (Steps, Sleep, etc.) is visible inside
      the Huawei Health app on Pixel 9.

### Configure Bridge (Health Sync)

- [ ] Install: Download Health Sync (by appyhapps) from Play Store.
- [ ] License: Purchase lifetime license (~CA$10) after trial start.
- [ ] Sync Config: - First Source: Select Huawei Health. - Destination: Select
      Health Connect (directly). - Metrics: Select Steps, Sleep, Heart Rate,
      Oxygen Saturation. - Granularity: Enable high precision if offered.

### Test Backfill (Small Batch)

- [ ] Select Window: In Health Sync, choose "Historical Data" and select a
      recent 1-week period (e.g., last week of Jan 2026).
- [ ] Run Sync: Allow it to complete.
- [ ] Verify: Open Health Connect (or Fit) and check that week. - Are steps
      doubled? (Should not be if priorities are right). - Is sleep detailed?
      (REM/Light/Deep).

### Full Backfill & Cleanup

- [ ] Run Full History: Select all available years (2020–2025). This may take
      hours as it processes in batches.
- [ ] Final Audit: Spot check random dates in 2021, 2023, 2024.
- [ ] Cleanup: Once confirmed safe in Health Connect: - Uninstall Huawei Health.
      - Uninstall HMS Core. - Keep Health Sync installed (passive, or uninstall
      if one-off).

### Phase 2 Confidence (Validated vs Inferred)

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

## Appendix: Sleep Data Coverage

Known sleep data sources as of 2026-02-10, from Google Takeout and Huawei Health
inspection:

| Source               | Coverage            | Notes                                        |
| -------------------- | ------------------- | -------------------------------------------- |
| Huawei Health (iPad) | May 2020 → present  | Complete, unbroken, both Honor bands         |
| Google Takeout / Fit | 33 scattered nights | 3 clusters: Nov 2020, May/Jun 2022, Oct 2023 |
| Health Connect       | Not yet             | Waiting for first Mi Fitness sleep           |

Takeout sleep clusters (from `Fit/All Sessions/*_SLEEP.json`):

- **Nov 2020** (Honor Band 5, Pixel 3): 10 nights + 1 in Dec.
- **May/Jun 2022** (Honor Band 6, Pixel 6): 9 consecutive nights with detailed
  sleep stages (30–50 segments each). Source: `nl.appyhapps.healthsync`.
- **Oct 2023** (Honor Band 6, Pixel 6): 12 sessions including naps. Source:
  `nl.appyhapps.healthsync`.

The Takeout data confirms the Health Sync → Fit → cloud → Takeout pipeline works
for sleep, including detailed sleep stage segments. Phase 2 backfill should
replicate this for the full Huawei Health dataset (~6 years).

Future possibilities:

- Custom Android app (vibe-coded) to read Health Connect data locally.
- Home Assistant integration for health dashboards.
- Health Connect ZIP export → Synology for local archival and analysis.

## Appendix: Device History

| Date       | Device                        | Type   | Price (CA$) | Notes               |
| ---------- | ----------------------------- | ------ | ----------- | ------------------- |
| ~Sep 2008  | iPhone 3G                     | phone  | TBD         | Register 2008-09-09 |
| ~2010      | Nexus One                     | phone  | TBD         | Release 2010-03     |
| ~Dec 2012  | Nexus 7                       | tablet | used        | Register 2012-12-26 |
| 2014-03-05 | Nexus 5 (32GB, Black)         | phone  | $399        | Google Play order   |
| 2016-05-21 | Nexus 5X (32GB, Carbon)       | phone  | $499        | Google Store order  |
| 2019-08-29 | Pixel 3 (64GB, Just Black)    | phone  | $999        |                     |
| 2020-04-25 | Honor Band 5                  | band   | $55         | Amazon, KelinkaUS   |
| 2021-03-14 | Honor Band 6                  | band   | $93         | Amazon, DirectA     |
| 2021-10-24 | Pixel 6 (128GB, Stormy Black) | phone  | $799        |                     |
| 2025-09-13 | Pixel 9 Pro                   | phone  | $870        | Used, Marketplace   |
| 2026-01-26 | Xiaomi Smart Band 10          | band   | $99         | Paired 2026-02-10   |
