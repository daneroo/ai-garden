# OpenClaw

Note:**Renamed to Moltbot and again to OpenClaw**

- Main site: <https://openclaw.ai/>
- Docs: <https://docs.openclaw.ai/start/getting-started>
- GitHub: <https://github.com/openclaw/openclaw>
- Uninstall: <https://docs.openclaw.ai/install/uninstall>
- Skills: <https://clawdhub.com/>

## TODO

- [x] Complete reinstall using openclaw

## Installation

```bash
npm i -g openclaw
openclaw onboard

# or
curl -fsSL https://openclaw.ai/install.sh | bash
```

## Uninstall (tested)

- Uninstall which components?
  - Gateway service (launchd / systemd / schtasks)
  - State + config (~/.clawdbot)
  - Workspace (agent files)
  - macOS app

```bash
openclaw uninstall --dry-run

openclaw uninstall
```
