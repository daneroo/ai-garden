# checkfiles-claude-opus-46

Filesystem validation CLI/TUI experiment using the `checkfiles` seed.

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
- `@std/cli` for argument parsing
- System `xattr` command for extended attributes
