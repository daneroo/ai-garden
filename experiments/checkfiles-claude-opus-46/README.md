# checkfiles-claude-opus-46

Filesystem validation CLI/TUI experiment using the `checkfiles` seed.

## Usage

- `bun run start` — run checkfiles (configure `ROOT_PATH` in `.env` or pass `-r <path>`)
- `bun run ci` — format-check, lint, type-check, test
- `bun run fmt` — auto-format with prettier

## Keybindings (results view)

- up/down — navigate rows
- shift-up/shift-down/r — reverse sort direction
- v — toggle violations-only filter (ancestors shown dim)
- g/G — jump to top/bottom
- q/esc — quit

## Harness / Workflow

- Agent: Claude Code (Opus 4.6)
- Harness: `bun run ci` loop per AGENTS.md
- Seed: `seeds/checkfiles.md`

## Problem / Code Goal

Deterministic filesystem validator that recursively traverses a root path,
inspects files and directories, and verifies required properties (permissions,
xattrs, no hidden entries, no symlinks). Interactive TUI displays progress and
results with sorting, filtering, and violation highlighting.

## Tech Stack

- Bun runtime
- OpenTUI + React for TUI
- `commander` for argument parsing
- System `xattr` command for extended attributes
