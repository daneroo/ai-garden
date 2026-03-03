# checkfiles-opencode-gpt-53

Filesystem validation CLI/TUI experiment using the `checkfiles` seed.

## Usage

- `bun run start` - run checkfiles (`ROOT_PATH` from `.env` or pass
  `--rootpath <path>`)
- `bun run ci` - format-check, lint, type-check, test
- `bun run fmt` - auto-format with prettier

## Keybindings (results view)

- `up` / `down` - move row cursor
- `shift-up` / `shift-down` / `r` - reverse sort direction
- `v` - toggle `all` / `violations-only`
- `cmd-up` / `cmd-down` - jump to top / bottom
- `g` / `G` - fallback top / bottom jump
- `q` / `esc` - quit

## Harness / Workflow

- Agent: OpenCode (`openai/gpt-5.3-codex`)
- Process: user reviews and commits after each phase in `PLAN.md`
- Seed: `seeds/checkfiles.md`

## Problem / Code Goal

Build a deterministic filesystem validator that recursively scans a root path,
validates required filesystem properties (modes, xattrs, hidden entries,
symlinks), and displays progress/results in an interactive TUI.
