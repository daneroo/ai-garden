# Scrobble Steps: Health Connect Data Exporter

Personal Android app for extracting Health Connect data on demand via NATS,
with per-app zero-trust networking via embedded Tailscale.

## Problem

- Health Connect is the canonical health data store on Android (Pixel 9).
- No good way to extract data off-device without cloud dependencies.
- Google Fit is being deprecated; Health Connect has no built-in export API
  beyond manual ZIP.
- Tailscale Android app claims the VPN slot, breaking other VPNs and confusing
  apps with network detection (podcasts, etc.).

## Architecture

```text
[Any machine on tailnet]           [Home Assistant]
        |                                |
     nats req                      nats subscribe
        |                                |
   [NATS server (Synology / HA)]
        |
   tailscale (over internet or LAN)
        |
   [Pixel 9: Scrobble Steps app]
   ├── Kotlin: Foreground service + Health Connect SDK
   └── Go (via gomobile): tsnet + NATS client
```

### Data Flow

1. App starts foreground service (persistent notification).
2. Go layer: `tsnet` establishes outbound Tailscale connection (no VPN slot,
   no TUN/TAP). Connects to NATS server.
3. Go layer: subscribes to `health.>` subjects.
4. External request arrives (e.g., `nats req health.sleep '{"from":"2024-01-01"}'`).
5. Go layer receives request, calls back into Kotlin.
6. Kotlin layer reads Health Connect via SDK, returns JSON.
7. Go layer publishes response on NATS.

All connections are outbound-only. NATS handles bidirectional data flow over
the single outbound TCP connection (pub and sub).

## Components

### Go Library (`tsnet-android`)

Compiled to AAR via `gomobile bind`. Reusable across any Android app that wants
per-app Tailscale + NATS.

```text
tsnet-android/
├── node.go        # tsnet setup, auth key, state dir
├── nats.go        # connect, pub, sub, request-reply
├── bridge.go      # callback interface for Go → Kotlin calls
└── Makefile       # gomobile bind → .AAR
```

Exported API (simple types only — gomobile constraint):

```go
func StartNode(authKey string, stateDir string, natsURL string) error
func Publish(subject string, data []byte) error
func SetRequestHandler(handler RequestHandler)  // callback interface
```

### Android App (`scrobble-steps`)

Kotlin. Minimal UI — just a setup screen and status indicator.

```text
app/
├── MainActivity.kt          # Setup: auth key entry, permissions grant
├── ScrobbleService.kt       # Foreground service lifecycle
├── HealthConnectReader.kt   # Health Connect SDK reads
└── RequestRouter.kt         # Maps NATS subjects → HC queries
```

### NATS API (TBD)

Subject hierarchy and message formats to be designed later. Likely needs:
discovery (what metrics exist), digest/sync (what changed since last check),
and export (bulk data extraction). The connection topology is the important
part — the API can evolve once the plumbing works.

## Per-App Zero Trust Pattern

Each app embeds `tsnet-android` with its own Tailscale auth key:

- Own Tailscale node identity (visible in admin console).
- Own ACLs: "scrobble-steps can reach nats-server:4222, nothing else."
- Revoke one app without affecting the device or other apps.
- No VPN slot consumed — multiple apps coexist independently.
- Works identically in Docker containers (outbound-only, no host networking).

```text
Pixel 9
├── Scrobble Steps    ← tsnet node "scrobble-steps" (auth key A)
├── Some Other App    ← tsnet node "other-app" (auth key B)
└── (no Tailscale VPN app needed)

Docker host
├── container-foo     ← tsnet node "foo" (auth key C)
├── container-bar     ← tsnet node "bar" (auth key D)
└── (no sidecar, no host networking)
```

## Tech Stack

- Language: Kotlin (Android) + Go (networking)
- Bridge: `gomobile bind` → AAR
- Health Connect: Jetpack Health Connect SDK
- Tailscale: `tsnet` (Go, embedded, userspace)
- Messaging: NATS (`jnats` not needed — Go client via `tsnet-android`)
- Target: Pixel 9, Android 14+, arm64, personal use only

## Constraints

- `gomobile` exported functions limited to simple types (string, []byte, int,
  error). Complex data crosses the boundary as serialized JSON.
- `tsnet` auth: pre-auth key stored in app private storage. Configure
  non-expiring key in Tailscale admin.
- Foreground service required for persistent NATS connection. Shows
  notification ("Scrobble Steps: connected").
- Health Connect initial permission grant requires UI (one-time). Subsequent
  reads work from foreground service.
- Self-signed APK (debug or personal keystore). No Play Store distribution.

## Future Possibilities

- Home Assistant integration: HA subscribes to `health.>`, builds dashboards.
- Synology archival: cron job does `nats req health.export` → writes to NAS.
- Multi-device: same pattern on a tablet, second phone, etc.
- Backfill tool: NATS request to bulk-export historical data to JSON files.
- Health Connect to Drive Sync (via Health Sync) as a complementary backup path.
