# checkfiles-claude-opus-46

Filesystem validation CLI/TUI experiment using the `checkfiles` seed.

## Usage

- `deno task run` — run checkfiles (configure `ROOT_PATH` in `.env`)
- `deno task ci` — lint, type-check, test, format-check

## Harness / Workflow

- Agent: Claude Code (Opus 4.6)
- Harness: `deno task ci` loop per AGENTS.md
- Seed: `seeds/checkfiles.md`

## Problem / Code Goal

Deterministic filesystem validator that recursively traverses a root path,
inspects files and directories, and verifies required properties (permissions,
xattrs, no hidden entries, no symlinks). Interactive TUI displays progress and
results with sorting, filtering, and violation highlighting.

## Tech Stack

- Deno runtime
- OpenTUI + React for TUI
- `commander` for argument parsing
- System `xattr` command for extended attributes
