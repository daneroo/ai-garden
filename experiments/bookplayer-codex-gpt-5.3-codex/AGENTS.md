# Experiment Agents Guidelines

## Context

- Experiment: `bookplayer-codex-gpt-5.3-codex`
- Harness: `codex-gpt-5.3-codex`
- Seed: `experiments/seeds/bookplayer.md`

## Scope

- Modify files only under
  `experiments/bookplayer-codex-gpt-5.3-codex/` unless the user explicitly says
  otherwise.
- Use Bun as runtime/package manager. Do not switch to Node/npm/pnpm/yarn.
- Do not assume Claude availability.

## Session Preflight (Required)

At the start of each implementation session, explicitly state available
capabilities:

1. Docs tooling availability (Context7/WebFetch equivalents).
2. Browser automation/screenshot tooling availability (Playwright MCP or
   equivalent).

If browser tooling is unavailable:

- say so immediately,
- do not claim visual verification,
- request setup early before UI-heavy phases.

For framework-specific APIs (TanStack Start routing/server behavior), check docs
before implementation and record what was validated.

## Scaffold-Sensitive Validation Rule (Required)

Before changing scaffold-sensitive details (scripts, dependency shape, framework
flags):

1. Query latest TanStack Start docs first (prefer Context7).
2. Verify by running local CLI help (`bunx --bun @tanstack/cli create --help`).
3. Verify generated `package.json`.
4. If docs and CLI output conflict, follow current CLI/package output as source
   of truth.

## Bootstrap Baseline

- Preferred scaffold command:

```bash
bunx --bun @tanstack/cli create <experiment-dir> --package-manager bun --framework React --add-ons nitro --no-git
```

- Keep Nitro Bun preset in Vite config:

```ts
nitro({ preset: 'bun' })
```

- Starter cleanup immediately after scaffold:
  - Replace starter `/` route with BookPlayer shell.
  - Set app title to `BookPlayer`.
  - Remove starter header/nav if unused.
  - Ensure `/player/$pairId` route exists (placeholder shell is acceptable for
    bootstrap).
  - Ensure `/` uses real server data flow (no fake static placeholder data).

## Dependencies and Package Changes

- Add dependencies with `bun add` / `bun add -d` only.
- Never add dependencies by editing `package.json` directly.

Required project dependency:

- `epubjs`

## Required CI Loop

After meaningful modifications:

1. Run `bun run ci`.
2. If `fmt:check` fails, run `bun run fmt`, then rerun `bun run ci`.
3. Do not mark a phase complete until CI is fully green.

## Commands

- Install: `bun install`
- Dev: `bun run dev`
- Build: `bun run build`
- Test: `bun run test`
- Typecheck: `bun run check`
- Lint: `bun run lint`
- Format: `bun run fmt`
- CI: `bun run ci`

## Environment Requirements

Use `.env` with local values and keep `.env.example` updated with required keys:

```dotenv
AUDIOBOOKS_ROOT=/Volumes/Space/Reading/audiobooks/
VTT_DIR=../../bun-one/apps/whisper/data/output/
```

Validate both paths as existing, readable directories and fail clearly if
invalid.

## Styling Direction

Use a deliberate dark-shell palette and maintain a clear hierarchy:

- Page shell: `bg-slate-900`
- Panels/cards: `bg-slate-800`
- Active states: `bg-slate-700`
- Borders: `border-slate-700`, `border-slate-600`
- Text hierarchy: `text-white`, `text-slate-300`, `text-slate-400`,
  `text-slate-500`

Also:

- Keep reader surface high-contrast against shell.
- Use `tabular-nums` for time displays.
- Prefer subtle `transition-colors`; avoid over-animation.
- Verify desktop/mobile usability and visible keyboard focus.
