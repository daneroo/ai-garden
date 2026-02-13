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

- [x] Mi Band 10 Data start:`2026-02-10T14:00:00-05:00`
  - `Mi Band -> Pixel 9 -> Health Connect`
- [x] Honor Band 6 was powered off:`2026-02-11T15:00:00-05:00`.
- [x] Huawei Health Data: Synced to cloud (verified on iPad).
  - [x] Manual sync on iPad Huawei Health (after Honor power off) at
        `2026-02-11T15:20:00-05:00`.
- [x] Confirmed overlap: about 25h of steps and one overnight sleep record
      (already observed during validation).
- [x] Selective backfill cutoff defined: backfill Huawei data only for
      timestamps `<= 2026-02-10T13:59:59-05:00` to avoid overlap with Mi Band
      era.
- [ ] Huawei Export: Request confirmed (keep as backup/archive) - Still
      pending - but we are proceeding anyways

### Prepare Source Data (Pixel 9)

- [x] Tools: Huawei Health (App) + HMS Core (App) + Health Sync (App).
- [x] Download APKs from APKMirror (see justification in Phase 2 Confidence):
  - HMS Core 6.15.4.342 (arm64-v8a + arm-v7a, Android 5.0+).
  - Huawei Health 16.1.1.310 (arm64-v8a, Android 8.0+).
  - Enabled "Install unknown apps" for Files by Google to sideload.
- [x] Install & Login: Installed HMS Core first, then Huawei Health. Signed in
      with Huawei ID. Cloud sync completed — full history visible (steps and
      sleep back to May 2020; 2,654,007 steps in 2020).
- [x] **Huawei Health has no Health Connect access.** Never appeared in Health
      Connect → App permissions. No action needed.
- [x] Verify Source: History confirmed in Huawei Health on Pixel 9.

### Configure Bridge (Health Sync)

- [x] Install: Health Sync (by appyhapps) from Play Store.
- [x] License: Purchased lifetime license (CA$4.93).
- [x] Sync Config: Source: Huawei Health Kit. Destination: Health Connect.
      Metrics: Steps, Activities, Sleep, Heart rate, Weight, Blood pressure,
      Blood sugar, Oxygen saturation. Health Connect write permissions granted
      (Allow All).

### Test Backfill (Small Batch)

- [x] Daily sync ran automatically on first connect; "Period already synced"
      showed Jan 1, 1970 – Feb 10, 2026 (epoch = "from the beginning").
- [x] Historical sync test: Sleep, HR, SpO2 for Feb 7–9, 2026. Sleep confirmed
      in Fit back to Feb 2 (timezone boundary). HR and SpO2 not visible in Fit
      (Fit display limitation — likely in Health Connect).
- [x] Observation: Health Sync has daily resync rate limits. Historical sync
      processes in batches over hours/days, not instantly.

### Full Backfill (In Progress)

- [x] Historical sync configured: Sleep, HR, SpO2 from Jan 1, 2020 → Feb 9,
      2026. "Don't sync daily data, only historical data" enabled.
- [ ] Monitor: Check Fit periodically for sleep data appearing further back.
      Target: sleep records back to May 2020.
- [ ] Steps & Activities: Run separately after sleep/HR/SpO2 completes (steps
      may conflict with Pixel 9 phone-counted steps; needs separate evaluation).
- [ ] Final Audit: Spot check random dates in 2021, 2023, 2024.
- Note (2026-02-11 ~17:30): Backfill progress and observations.
  - Sleep/vitals working backwards, currently at 2026-01-13 → 2025-01-01.
  - Step inflation observed: Fit 11,798 vs Mi Fitness 10,653 today (Health Sync
    wrote Honor Band steps alongside Mi Fitness + Pixel phone steps).
  - Will likely skip steps backfill — Honor Band and Pixel 9 overlap for the
    entire historical period, so duplication would be systemic.
- Note (2026-02-12 ~13:30): Backfill timing update.
  - Currently at 2025-09-27, ~4.5 months covered in ~21h (~0.2 months/hour).
  - Estimated ~13 days to reach May 2020 at current rate.
  - Plan: let current batch finish to 2025-01-01, then set a single range
    2020-01-01 → 2024-12-31 for the remainder.
- Note (2026-02-13 ~16:00): At 2025-01-30, nearly done with 2025.
  - ~47h elapsed, ~12.5 months covered (~0.27 months/hour — slightly faster).
  - Revised estimate: ~19 days remaining for 2020-01 → 2024-12.
  - Next: set range 2020-01-01 → 2024-12-31 once 2025 batch completes.

### Pending Undo Actions (Do Not Forget)

These were introduced during Phase 2 and must be reversed after backfill:

- [ ] Revoke Health Sync's Health Connect write access (Allow All → deny).
- [ ] Uninstall Huawei Health.
- [ ] Uninstall HMS Core.
- [ ] Remove Huawei account: Settings → Accounts → Huawei → Remove.
- [ ] Check Settings → Apps for leftover Huawei services.
- [ ] Re-disable "Install unknown apps" for Files by Google: Settings → Apps →
      Files by Google → Install unknown apps → off.
- [ ] Evaluate: keep Health Sync installed (for Drive Sync / future use) or
      uninstall.

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
- `Validated`: APKMirror is a safe source for sideloading Huawei APKs. Every APK
  is cryptographically signature-verified against the original developer and
  manually reviewed before publishing. APKMirror is operated by the Android
  Police / APKMirror team (est. 2014) and does not host modified APKs. Preferred
  over Huawei AppGallery because it avoids installing yet another store app.
  Refs: [APKMirror FAQ](https://www.apkmirror.com/faq/),
  [XDA Forums discussion](https://xdaforums.com/t/sideloading-are-apkmirror-apkpure-and-f-droid-safe-to-use.4549165/).
- `Constraint`: Health Sync requires Huawei Health app installed locally; Huawei
  Health APK can be sideloaded from APKMirror without AppGallery, but HMS Core
  is also required. Temporary install on Pixel 9, uninstall after backfill.
- `Risk-low`: Temporary Huawei app install. HMS Core registers background
  services and notification channels but has no system-partition access on stock
  Pixel. Cleanup: uninstall both apps, remove Huawei account from Settings →
  Accounts, verify no leftover services in Settings → Apps.
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
