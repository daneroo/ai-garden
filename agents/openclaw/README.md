# OpenClaw

Note:**Moving to Hermes, openclaw has been a great disapointment**

Note:**Renamed from ClawdBot to Moltbot and again to OpenClaw**

- Main site: <https://openclaw.ai/>
- Docs: <https://docs.openclaw.ai/start/getting-started>
- GitHub: <https://github.com/openclaw/openclaw>
- Uninstall: <https://docs.openclaw.ai/install/uninstall>
- Skills: <https://clawdhub.com/>

## Usage

```bash
# ssh dizzy
openclaw tui
openclaw logs --follow
openclaw gateway restart
```

## TODO

- [x] Provision a ubuntu vm on hilbert (Proxmox)
  - [ ] Reserve dhcp (failed) - on giga router: 192.168.2.104
- [ ] restore - from backup?
- [ ] borg backup?
- [ ] Openclaw docs setup

## Uninstall (2026-03-29)

```bash
daniel@dizzy:~$ openclaw uninstall

🦞 OpenClaw 2026.3.28 (f9b1079) — More integrations than your therapist's intake form.

│
◇  Uninstall which components?
│  Gateway service, State + config, Workspace
│
◇  Proceed with uninstall?
│  Yes
Recommended first: openclaw backup create
Gateway service disabled.
Removed ~/.openclaw
Removed ~/.openclaw/workspace
CLI still installed. Remove via npm/pnpm if desired.
daniel@dizzy:~$ which openclaw
/home/daniel/.npm-global/bin/openclaw
daniel@dizzy:~$ npm ls -g
/home/daniel/.npm-global/lib
├── @tobilu/qmd@2.0.1
└── openclaw@2026.3.28

daniel@dizzy:~$ npm uninstall -g openclaw

removed 478 packages in 959ms
daniel@dizzy:~$
```

## Setup Logs

- Provisioned Proxmox VM - 8GB RAM/64GB disk/
  - from `nix-garden:/e2e/ubuntu/provision.sh --vmid 121`
  - packages: ubuntu-desktop-minimal
  - [RustDesk from deb](https://github.com/rustdesk/rustdesk/releases)
  - Reserve dhcp **(failed)** - on giga router:
  - rename host `sudo hostnamectl set-hostname dizzy.imetrical.com`
    - remove all traces of cloud-init which was resetting hostname on reboot
  - dizzy.imetrical.com -> 192.168.2.104
  - dizzy.ts.imetrical.com -> 100.78.4.24 (tailscale)
    - `sudo tailscale serve --bg 127.0.0.1:18789` probably how it was setup
- Install OpenClaw
  - `curl -fsSL https://openclaw.ai/install.sh | bash`

- Telegram
  - Create account with 2FA and recovery email
  - Open Telegram and chat with @BotFather (confirm the handle is exactly
    @BotFather).
  - Run /newbot, follow prompts, and save the token
  - Dizzy / claw_dizzy_bot
  - openclaw pairing approve telegram <redacted>
  - "allowFrom": ["8324777864"]

- Slack - Removed
