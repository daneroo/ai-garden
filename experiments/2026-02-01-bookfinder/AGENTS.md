# Experiment Agents Guidelines

## Context

Experiment: 2026-02-01-bookfinder

Harness: opencode-gpt-5.2

Seed: experiments/seeds/bookfinder.md

## Rules

- Directory Isolation: Only modify files under `experiments/2026-02-01-bookfinder/`.
- Runtime: Use Bun (not Node.js).
- CLI: Use Commander (not Yargs).

## Enforcement

- Always run `bun run ci` after completing a meaningful task/phase.
- If `bun run ci` fails, fix it before considering the phase complete.
- Prefer recording CI runs and fixes in `PLAN.md` so progress is auditable.
- Add dependencies using `bun add` / `bun add -d` only (never edit `package.json`).

## Dev Commands

- Install: `bun install`
- Run: `bun run src/index.ts --rootpath <path>`
- Check: `bun run check`
- Lint: `bun run lint`
- Tests: `bun run test`
- Format: `bun run fmt`
- CI: `bun run ci`
