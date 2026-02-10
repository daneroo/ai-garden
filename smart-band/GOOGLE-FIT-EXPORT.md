# Google Fit Export (Takeout)

## Context

- Goal: secure an offline export of Google Fit data during migration.
- Export method: `Google Takeout` on computer.
- Current selection: `2 of 82` products (`Fit` and `Timeline`).

## Current Status

- Takeout job created: `2026-02-10 1:41 AM`
- State: ✅ **Export ready** (completed `2026-02-10`)
- Confirmation received: Google emailed that archive creation was requested for
  `daniel.lauzon@gmail.com`.
- Completion notice: ✅ Received `2026-02-10`
- **Download deadline: `2026-02-17`** (7-day availability window)

## Selected Products

- `Fit`
- `Timeline` (Maps Timeline)

## Quick Task List

- [x] Opened `takeout.google.com`.
- [x] Limited selection to `Fit` + `Timeline`.
- [x] Created export job (`2026-02-10 1:41 AM`).
- [x] Received Google confirmation email for archive request.
  - [x] [GMail](https://mail.google.com/mail/u/0/#inbox/FMfcgzQfBkPmLvGJtMCTHTMSxpgNWzdD)
- [x] Wait for completion email.
- [x] Download archive before link expires.
- [x] Unzip and verify expected folders/files.
- [ ] Archive to local + backup storage.

**Working directory**: `/Users/daniel/Code/iMetrical/ai-garden/smart-band/data/`

## Archive Details

- **Filename**: `takeout-20260210T064151Z-3-001.tgz`
- **Path**: `/Volumes/Space/archive/personal/health/`
- **Size**: 195,818,027 bytes (~187 MB)
- **Downloaded**: `2026-02-10 11:54`
- **SHA256**: `cabcb3bddbc55ce60074cee7718502c2c5ff6b8db1c68edba5c591932c1609c1`

## Verify After Download

✅ **Verified `2026-02-10 11:58`**

```
data/Takeout/
├── Fit/
│   ├── Activities/
│   ├── All Data/
│   ├── All Sessions/
│   └── Daily activity metrics/
└── Timeline/
    ├── Encrypted Backups.txt
    └── Settings.json
```

All expected folders present.

### ⚠️ Timeline Data Issue

The `Timeline` export contains **only settings and metadata, not actual location
history data**:

- `Encrypted Backups.txt` states: "You have encrypted Timeline backups stored on
  Google servers."
- `Settings.json` contains configuration only

**Possible reasons:**

1. Timeline backups are encrypted and Google Takeout doesn't decrypt them for
   export
2. A different export option or separate request is needed for actual Timeline
   location history
3. Timeline/Location History may be disabled or deleted in Google account
   settings

**TODO**: Investigate if Timeline location history data is needed and how to
obtain it:

- [ ] Check Google account Timeline/Location History settings
- [ ] Review Google Takeout export options for Timeline-specific data export
- [ ] Determine if Timeline data is required for migration (not critical for
      health metrics)

**Note**: Timeline is Maps location history, separate from Fit health metrics
(steps, sleep, HR, SpO2). For Smart Band migration purposes, the Fit export is
sufficient.

## Links

- `https://takeout.google.com`
- `https://support.google.com/fit/answer/3024190`
