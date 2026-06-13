# Hermes

After expermienting with `openclaw` for a month, I have decided to migrate to
`hermes` to see if it has a better experience.

- Main site: <https://hermes-agent.nousresearch.com/>
- Docs: <https://hermes-agent.nousresearch.com/docs/>
- GitHub: <https://github.com/NousResearch/hermes-agent>

## Usage

```bash
journalctl --user -u hermes-gateway -f  # View logs
```

## TODO

- [x] install on dizzy (proxmox vmid 121)
- [x] reuse telegram?
  - [ ] tested
- [x] migrate from openclaw ( part of install)
- [x] remove openclaw
- [ ] no web ui?

```txt
One important gotcha:
- Hermes .env currently has:
  MESSAGING_CWD=/home/daniel/.openclaw/workspace
  So Telegram-triggered terminal/file work will still default to the old OpenClaw workspace unless we change that.
```

## Installation

```bash
hermes gateway install
hermes gateway start
```

### Initial Setup

```bash
# Linux / macOS / WSL2
# canonical hermes install
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

- Install homebrew
- Installed codex with brew

```bash
brew install --cask codex
codex login
```

Got some keys for

- [firecrawl](https://www.firecrawl.dev/app/api-keys)
- [fal.ai (image gen)](https://fal.ai/dashboard/keys)

## Setup Logs (reused from openclaw dizzy machine)

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
    - no longer used: should be removed , ad re-added when WEB-UI is considered
- Install Hermes see above

- Telegram (migrated from openclaw)
  - Create account with 2FA and recovery email
  - Open Telegram and chat with @BotFather (confirm the handle is exactly
    @BotFather).
  - Run /newbot, follow prompts, and save the token
  - Dizzy / claw_dizzy_bot
  - openclaw pairing approve telegram <redacted>
  - "allowFrom": ["8324777864"]

- Slack - Removed
