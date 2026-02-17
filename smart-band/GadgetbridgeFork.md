# Gadgetbridge Fork: Server-Push MVP

- [Gadgetbridge](https://codeberg.org/Freeyourgadget/Gadgetbridge) (AGPL v3)
- [Fork](https://github.com/daneroo/Gadgetbridge) — branch `imetrical`

## Why Fork

Gadgetbridge is the only open source option with Honor Band / Mi Band BLE
protocols. No outgoing push exists — must be added.

## Setup and Build

```bash
# Prerequisites (Mac)
brew install android-platform-tools   # adb only

# Clone upstream and create working branch
cd smart-band
git clone https://codeberg.org/Freeyourgadget/Gadgetbridge.git
cd Gadgetbridge
git checkout -b imetrical

# Push fork to GitHub (keeps upstream origin for pulling updates)
gh repo create daneroo/Gadgetbridge --public
git remote add github git@github.com:daneroo/Gadgetbridge.git
git branch -m master main        # rename to main
git push github main              # push upstream baseline
git push -u github imetrical     # push working branch

# Generate persistent debug keystore (one-time)
# Lives at Gadgetbridge/.debug.keystore (gitignored)
# Referenced in app/build.gradle signingConfigs.debug
# Without this, each docker run --rm gets a throwaway key
docker run --rm -v $(pwd):/out -w /out mingc/android-build-box \
  keytool -genkey -v -keystore .debug.keystore -storepass android \
  -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 \
  -validity 10000 -dname "CN=Android Debug,O=Android,C=US"

# Build via Docker
# mingc/android-build-box by Ming Chen — JDK 8/11/17/21, SDK 28-35
# https://github.com/mingchen/docker-android-build-box
# NOTE: amd64-only image, runs under emulation on Apple Silicon (~6min)
# NOTE: GB ships .devcontainer/Dockerfile using alpine-android:android-33-jdk21
#       (ARM-native but SDK 33, needs 36) — potential faster alternative
docker run --rm --name androideroo -v "$(pwd)":/project -w /project \
  mingc/android-build-box ./gradlew assembleMainlineDebug
# APK: app/build/outputs/apk/mainline/debug/app-mainline-debug.apk

# Useful: shell into running build container
docker exec -it androideroo bash

# Deploy to phone (Pixel 6 + GrapheneOS)
# First time: Settings > About phone > tap Build number 7x
#             Settings > System > Developer options > USB debugging ON
#             Plug USB, authorize Mac on phone popup ("Always allow")
adb devices                  # verify: device ID + "device"
adb install app/build/outputs/apk/mainline/debug/app-mainline-debug.apk    # first install
adb install -r app/build/outputs/apk/mainline/debug/app-mainline-debug.apk # reinstall (same key)
# If INSTALL_FAILED_UPDATE_INCOMPATIBLE: signing key changed, must uninstall first:
adb uninstall nodomain.freeyourgadget.gadgetbridge
```

## The Change

1. Remove `tools:node="remove"` from INTERNET permission in
   `AndroidManifest.xml` (line 56 — keeps the permission from line 8)
2. On-sync hook in `HuaweiSyncState.updateState` — POST to ntfy after
   each completed sync (reports battery + steps)
3. Periodic heartbeat timer in `DeviceCommunicationService` (every 5min)
   — reports device name, state, battery, steps
4. `NtfyHelper.getTodaySteps()` queries `DailyTotals` DB for current day
   step count across all devices
5. Push via ntfy.sh — no server, no auth, markdown enabled
   ```bash
   # im=imetrical, qcic=quis custodiet ipsos custodes
   topic=$(echo -n 'im.qcic' | sha256sum | awk '{print $1}')

   # Sync event
   curl -H "Title: GB Sync" -H "Tags: zap" -H "Markdown: yes" \
     -d "**battery** 85% **steps** 1234" "ntfy.sh/${topic}"

   # Periodic heartbeat
   curl -H "Title: GB Heartbeat" -H "Tags: heartbeat_selector" -H "Markdown: yes" \
     -d "**Honor Band 6** connected battery 56%
   **steps** 1234" "ntfy.sh/${topic}"
   ```
6. Subscribe to topic on phone/desktop — alert if heartbeats stop

## Key Files

| What                   | Where                                              |
| ---------------------- | -------------------------------------------------- |
| Huawei/Honor support   | `service/devices/huawei/`                          |
| Sync complete hook     | `service/devices/huawei/HuaweiSyncState.java`      |
| Heartbeat timer        | `service/DeviceCommunicationService.java`          |
| Ntfy helper            | `util/NtfyHelper.java`                             |
| Manifest               | `app/src/main/AndroidManifest.xml`                 |
| Debug signing config   | `app/build.gradle` (signingConfigs.debug)          |
| About string (fork ID) | `app/src/main/res/values/strings.xml`              |

## Current Setup

- **Phone**: Pixel 6, GrapheneOS (fresh install)
- **Band**: Honor Band 6, paired via Gadgetbridge fork
- **Branch**: `imetrical` (off upstream main)
- **Signing**: persistent `.debug.keystore` — `adb install -r` works across rebuilds

## Task List

- Phase 1 — Vanilla Build + Deploy (done)
  - [x] Clone, build unmodified, deploy to Pixel 6, pair Honor Band 6
  - [x] Verify data collection (manual sync fetches steps, heart rate, battery)
- Phase 2 — Trivial Change (done)
  - [x] Add "(iMetrical Fork)" to about description, rebuild, deploy
  - [x] Set up persistent .debug.keystore in build.gradle for stable signing
- Phase 3 — Server-Push MVP (done)
  - [x] Enable INTERNET permission (AndroidManifest.xml)
  - [x] NtfyHelper: fire-and-forget HTTP POST to ntfy.sh (markdown, tags)
  - [x] On-sync hook: HuaweiSyncState.updateState posts "GB Sync" with battery
  - [x] Heartbeat timer: DeviceCommunicationService posts "GB Heartbeat" with
        device name, state, battery every 5min
  - [x] Verified both messages arrive on ntfy.sh
  - [x] Commit, push to GitHub
- Phase 4 — Enrich messages
  - [x] Add current day step count to both sync and heartbeat messages
        (NtfyHelper.getTodaySteps() queries DailyTotals across all devices)
  - [x] Set heartbeat to 5min (was 2min for testing)
  - [x] Fix Timer death: uncaught exception in TimerTask.run() kills the Timer
        silently — wrapped body in try/catch
  - [x] Build, deploy, verify step count appears in ntfy messages
  - [x] Commit, push to GitHub
- Phase 5 — Weather screen as server dashboard
  - [ ] Repurpose weather widget to show server health info
  - [ ] Push mock data (uptime, CPU, disk?) via the existing weather path
  - [ ] Later: fetch real metrics from a server endpoint
- Backlog
  - Trigger activity sync from heartbeat timer (ensure fresh steps even when phone stays locked)
  - Redeploy loses device connectivity in the app — "Add device" restores it without re-pairing
  - Custom build flavor with just Honor + Mi Band? (smaller APK, faster build)
  - Add staleness detection (SharedPreferences: last_sync_age > threshold)

## Rollout

1. **Pixel 6 + GrapheneOS**: Fork dev/test with Honor Band 6
2. **Pixel 9**: Honor Band on GB fork, Mi Band stays on vendor stack (Health
   Connect)
3. **Eventually**: Both bands on GB fork, full redundancy/failover
