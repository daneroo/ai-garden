# Honor Band 6 → Xiaomi Smart Band 10 migration (Pixel 9)

## Context and constraints

- Current device: **Honor Band 6** (vendor app: **Huawei Health**).
- You also have an **iPad**; your Honor Band 6 has been syncing to **Huawei
  Health via the iPad**, continuously building your history there.
- On iPad, Huawei Health is syncing to **Apple Health** continuously.
- Target device: **Xiaomi Smart Band 10**.
- Phone: **Pixel 9**.
- Non-negotiables:

  - **No subscriptions** to access your own data.
  - Data must remain **open / accessible** (exportable, portable).
  - Maintain **Google Fit / Health Sync** as a **sink** (for continuity +
    migration).
  - Home Assistant integration is optional; prefer solutions that don’t lock you
    into a cloud.

## Plan of record (execution)

Follow this section first. Use the rest of this document as reference.

If this feels like too much, start with `smart-band/SMART-BAND-MIGRATION-VALIDATION.md`.

### Definition of done

- [ ] You have an offline archive you own (Apple Health export ZIP and/or Huawei
      Privacy Centre ZIP).
- [ ] Ongoing flow is stable: Band 10 -> Mi Fitness -> Health Connect (canonical).
- [ ] Google Fit is a viewer/sink only (ideally reading from Health Connect, not
      a parallel write target).
- [ ] No obvious duplication (steps, sleep, workouts, HR) after 1-2 days of
      syncing.

### Steps (do these in order)

1. Preflight (iPad)

   - [ ] Do a final sync: open Huawei Health and confirm the latest data is
         present.

2. Take offline backups (recommended regardless of legacy import choice)

   - [ ] iPad: confirm Huawei Health -> Apple Health sync is enabled (it is
         already continuous in your setup); then run Apple Health "Export All
         Health Data" (offline ZIP).
   - [ ] Web: Huawei ID -> Privacy Centre -> "Request Your Data"; download/store
         the ZIP.
   - [ ] Optional: Google Takeout for Google Fit (archive whatever lands there).

3. Set the Pixel hub (Pixel 9)

   - [ ] Health Connect is the canonical store (enable it, confirm it is working).
   - [ ] Configure Google Fit to read from Health Connect (treat Fit as a
         sink/viewer).

4. Decision gate: do you want legacy Honor history inside Health Connect?

   - If no: keep Huawei/Apple exports as your archive and skip to step 5.
   - If yes:

     - [ ] Pixel 9: install Huawei Health, sign into the same Huawei ID, and
           confirm history downloads locally.
     - [ ] Pixel 9: install Health Sync and configure Huawei Health -> Health
           Connect.
     - [ ] Run historical sync (may require a one-time unlock).
     - [ ] Verify history in Health Connect, then stop/limit extra paths to
           avoid duplicates.

5. Onboard Band 10 (Pixel 9)

   - [ ] Pair Band 10 with Mi Fitness.
   - [ ] Grant Mi Fitness write permissions in Health Connect.
   - [ ] Wait 24-48h, then verify sleep + HR + workouts are actually writing.

6. De-dup + stabilize (Pixel 9)

   - [ ] Prefer one canonical write path per metric into Health Connect.
   - [ ] If Google Fit is reading from Health Connect, avoid also writing the
         same data directly into Fit from apps (common duplicate source).
   - [ ] Spot-check steps/sleep/workouts/HR for duplication after each
         integration change.

7. Optional experiments (later)

   - [ ] Gadgetbridge evaluation (pairing + data types + firmware constraints).
   - [ ] Home Assistant integration (decide sensors vs summaries).

## Glossary (keep this straight)

### Huawei Health

- Current collector/app for **Honor Band 6**.
- In your setup, it has been running on **iPad** and continuously accumulating
  your historical data.
- It is the source for legacy migration (via Health Sync) and for offline
  exports (Huawei Privacy Centre export and/or Apple Health export).

### Apple Health (iPad)

- In your setup, Huawei Health is **already syncing to Apple Health
  continuously**.
- Apple Health’s built-in export is a practical offline archive route.

### Google Fit

- A Google _health data store / app ecosystem_.
- The **Google Fit APIs are being deprecated in 2026**. Treat Fit as a **legacy
  sink** going forward, not the core architecture.
- Export path exists via **Google Takeout** (useful for archiving whatever lands
  in Fit).

### Health Connect

- Android’s newer **on-device health data broker**: apps can read/write health
  data with user-granted permissions.
- Pixel-first future: use Health Connect as the **primary hub**, then optionally
  mirror to Fit.
- It supports **export/import backup** (Android 14+), which is your built-in
  escape hatch for the future.

### Health Sync (appyhapps)

- A **third-party sync/bridge app** (not a framework).
- Can sync between many sources/destinations including **Google Fit** and
  **Health Connect**.
- Not a subscription product in the sense of “pay monthly to access your data,”
  but it may require a **one-time payment** to unlock certain features (notably
  historical sync after trial).

### Gadgetbridge

- FOSS Android companion app that aims for **local-first** wearable integration.
- For Xiaomi devices: support exists broadly, but **newer Xiaomi ‘protobuf’
  devices can be finicky**, and pairing may fail depending on firmware.
- For Mi Band 10 specifically: treat Gadgetbridge support as **experimental /
  verify before committing**.

## Data flows (legacy + transition + target)

This section is the combined picture (Honor legacy on iPad → migration → Xiaomi
future on Pixel). The authoritative view is the graph below.

## Combined dataflow graph (legacy + migration + future)

```
LEGACY (Honor Band 6, currently via iPad)

  Honor Band 6
      │ (BT)
      ▼
  iPad: Huawei Health  ───────────────────────────────────────────────┐
      │                                                              │
      │ (writes continuously)                                        │
      ├──────────────► iPad: Apple Health ──► Export All Health Data │
      │                                         (offline ZIP)       │
      │                                                              │
      │ (optional: offline archive)                                  │
      └──────────────► Huawei ID Privacy Centre ─► Request Your Data │
                            (offline ZIP archive)                    │

MIGRATION BRIDGE (one-time or ongoing)

  Huawei Health (iPad)  ──►  Pixel 9: Health Sync  ──►  Health Connect  ──►  Google Fit app
                                (bridge app)            (canonical hub)     (viewer/sink)

FUTURE (Xiaomi Smart Band 10)

  Xiaomi Smart Band 10
      │ (BT)
      ▼
  Pixel 9: Mi Fitness  ──►  Health Connect  ──►  Google Fit app
        (collector)         (canonical hub)     (viewer/sink)

  Optional: Pixel 9: Health Sync can be used in this future path too,
  but prefer Mi Fitness → Health Connect directly if it works for all your data types.
```

Notes

- Google Fit can **read shared data from Health Connect** when linked in Fit
  settings.
- Health Sync explicitly supports using **Health Connect as a destination**, and
  linking Google Fit to read via Health Connect.
- Treat Google Fit as a **sink/viewer**; treat Health Connect as **canonical**.

## Migration problem #1: legacy Honor Band 6 data

### Reality check

Your historical data is already inside **Huawei Health** (and in your case, it’s
been maintained via the iPad).

### Migration / extraction options (pick one)

**Critical constraint:** Health Sync runs on **Android** and can only sync from
sources it can access on the Pixel (either via an installed app on Pixel or via
a supported cloud login). Since your Huawei Health history currently lives on
**iPad**, plan on one of these being true for option (2):

- You can **install Huawei Health on Pixel**, sign into the same Huawei ID, and
  confirm the history downloads/syncs locally on Pixel.
- Or you use an **offline export** route (options 3/4) and treat it as an
  archive (not an in-place import into Health Connect).

1. **Clean break**

- Leave history in Huawei Health and start fresh with Band 10.

2. **One-time bridge into Google’s ecosystem (recommended if you want continuity
   on Pixel)**

- Use **Health Sync** (third-party bridge app) one time: Huawei Health →
  **Health Connect** (preferred) and/or Google Fit.
- This often requires enabling “historical sync” (commonly a paid unlock after
  trial).

3. **Huawei ‘Request Your Data’ archive (best for long-term ownership, but you
   must parse it)**

- Use Huawei ID Privacy Centre (“Request Your Data”) to obtain a downloadable
  archive that includes Health data.
- Store this ZIP as your canonical offline backup; optionally convert/import
  later.

4. **Apple Health as an intermediate (because your source device is already the
   iPad)**

- In your setup, Huawei Health is already writing to **Apple Health** on the
  iPad.
- Use Apple Health’s built-in **Export All Health Data** (XML ZIP) for an
  offline archive.

### Decision point

- If you want continuity in a Pixel-first workflow: do **(2)** and treat
  **Health Connect** as canonical.
- If you want an offline archive you own: do **(3)** and/or **(4)** regardless.

## Migration problem #2: ongoing data for Xiaomi Smart Band 10

### Target ongoing flow (Pixel-friendly)

- Smart Band 10 → **Mi Fitness** → **Health Connect** → **Google Fit app**

  - Health Connect is canonical.
  - Google Fit is a viewer/sink.
  - Optional: use Health Sync only if Mi Fitness → Health Connect is missing a
    data type you care about.

### Recommended default (Pixel-friendly)

**Mi Fitness → Health Connect** as the primary.

- Health Connect becomes your canonical store.
- Google Fit stays as a sink only if you still have consumers depending on it.

### Gadgetbridge as an ongoing solution (what to verify)

Before choosing Gadgetbridge as your daily driver for Band 10:

- Confirm Band 10 is supported in your chosen build/channel.
- Confirm pairing works with your firmware (Xiaomi protobuf caveats).
- Confirm it captures the data types you care about (sleep, HR, workouts,
  notifications, etc.).

## Home Assistant implications

### Future considerations (local-first / Gadgetbridge)

- Local-first via Gadgetbridge is a **stretch goal**, not part of the initial
  plan.
- Likely shape (later): **Health Connect → (export/ETL) → Gadgetbridge/local DB
  → (export/sync out)** (or a direct Band→Gadgetbridge path if it becomes
  reliable).
- If you go Gadgetbridge later, you can publish metrics to HA via a bridge
  (commonly MQTT). This is more work but avoids vendor clouds.

### Low-effort path

- If your primary hub is **Health Connect**, you can treat your **phone** as the
  bridge and selectively surface metrics into Home Assistant.

## Expanded checklist (by area)

If you are executing the migration, use "Plan of record (execution)" first.
This section is the longer checklist grouped by topic.

### Guardrails (avoid data loops / double counting)

- [ ] Prefer **one canonical write path** into Health Connect for each metric
      type.
- [ ] If Google Fit is reading from Health Connect, avoid also writing the same
      data directly into Google Fit from vendor apps (can cause duplicates).
- [ ] Spot-check: steps, workouts, sleep, HR for duplication after each
      integration is enabled.

### A) Legacy Honor Band 6 data

- [ ] Decide: **clean break** vs **one-time extraction** vs **offline archive**.
- [ ] If extracting into Google/Android:

  - [ ] Keep Huawei Health on iPad temporarily.
  - [ ] On Pixel 9: install Health Sync.
  - [ ] Configure Huawei Health as source → **Health Connect** as destination
        (preferred).
  - [ ] Run historical sync (if available / required).
  - [ ] Verify history in Health Connect.
- [ ] If archiving offline:

  - [ ] Huawei route: Huawei ID → Privacy Centre → Request Your Data → download
        ZIP.
  - [ ] Apple route: iPad Health app → Export All Health Data → store ZIP (Huawei
        Health -> Apple Health is already continuous).
- [ ] Optional: Google Fit sink archive via Google Takeout.

### B) Xiaomi Smart Band 10 onboarding

- [ ] Pair Band 10 with **Mi Fitness**.
- [ ] Enable **Health Connect write permissions** for Mi Fitness.
- [ ] Verify which data types are actually writing (steps, HR, sleep, workouts).
- [ ] Optional: enable Mi Fitness → Google Fit third-party sync (only if you
      still want Fit populated).

### C) Gadgetbridge evaluation (Band 10)

- [ ] Check current Gadgetbridge support status for Band 10 (stable vs
      experimental).
- [ ] Attempt pairing.
- [ ] Validate: notifications, HR, sleep, workouts.
- [ ] Decide: keep Mi Fitness primary, or switch to Gadgetbridge primary.

### D) Home Assistant (optional)

- [ ] Decide whether HA needs: daily summary metrics only, or near-real-time
      sensors.
- [ ] If Health Connect hub: identify which metrics can be surfaced via the
      phone.
- [ ] If Gadgetbridge hub: choose MQTT bridge approach and map sensors.

## Open questions (to resolve during research)

- Exact best method to export Huawei Health history in your region/account.
- Whether Mi Fitness writes all desired metrics to Health Connect on Pixel 9.
- Whether Band 10 is reliably supported by Gadgetbridge (and what firmware
  constraints exist).
