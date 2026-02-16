# AGENTS.md

## Agent Preflight

At session start, explicitly state available capabilities:

- docs tooling (Context7/WebFetch equivalents)
- browser automation/screenshot tooling (Playwright MCP or equivalent)

If browser tooling is unavailable, say so immediately and do not claim visual
verification. If required but missing, request setup early.

For framework-specific APIs (TanStack Start routes/server behavior), check docs
before implementation and record what was validated.

## Workflow

- Run `bun run ci` after completing a meaningful task/phase.
- If `fmt:check` fails, run `bun run fmt`, then rerun `bun run ci`.
- Do not mark a phase complete until CI is green.
- For UI/layout phases, perform Playwright-based visual verification before
  phase completion.
- CI pipeline: fmt:check, lint, check (tsc --noEmit), test (vitest).
- `build` is a separate verification step (not part of default `ci` loop).
- Dependencies must be added with `bun add` / `bun add -d` (never by editing
  `package.json` directly).

## Playwright MCP Enforcement

- If Playwright MCP is connected, browser verification MUST use MCP Playwright
  tools.
- Do not install project-local Playwright tooling as a substitute.
- Forbidden unless user explicitly requests it:
  - `bun add playwright`
  - `bun add -d @playwright/test`
  - `npx playwright install`
  - adding Playwright config/scaffolding only to replace MCP screenshots
- If Playwright MCP is unavailable, pause UI/layout completion and report a
  blocker requesting MCP setup.

## Browser Usability Verification

- Do not claim UI/layout completion without Playwright checks on both routes:
  - `/`
  - `/player/$bookId`
- Validate both desktop and mobile viewport behavior.
- Validate with real configured roots (`AUDIOBOOKS_ROOT`, `VTT_DIR`), not only
  fixture/demo data.
- Record screenshot paths and explicit pass/fail notes in the session output.
- Include a verification note that no local Playwright dependencies were added
  to `package.json` unless explicitly requested by the user.

## Doc Validation

Before coding scaffold-sensitive details (routing, server functions, plugins),
query the latest TanStack Start docs (prefer Context7 when available) to confirm
current API patterns.

- Then verify by running scaffold CLI help locally and reading generated
  `package.json`.
- If docs and CLI output conflict, follow current CLI output.
- Treat scaffold output as source of truth for framework versions/scripts.

## Tooling

- Runtime: Bun (use `bun --bun` prefix for vite commands)
- Framework: TanStack Start (file-based routing in src/routes/)
- Language: TypeScript (strict mode)
- Testing: Vitest
- Linting: ESLint (flat config)
- Formatting: Prettier

## Code Standards

- Functional components, no class components
- Use TanStack Router's loader for data fetching
- Server functions via `createServerFn` for server-side logic
- Prefer named exports
- Use `node:` prefix for built-in modules

## Bootstrap Reference (from experiments/BUN_TANSTACK.md)

### Preferred Bootstrap Command

```bash
bunx --bun @tanstack/cli create bookplayer-agy-opus46 --package-manager bun --framework React --add-ons nitro --no-git
```

### Script Baseline

```json
{
  "scripts": {
    "dev": "bun --bun vite dev --port 3000",
    "build": "bun --bun vite build",
    "preview": "bun --bun vite preview",
    "start": "bun run .output/server/index.mjs",
    "test": "vitest run --passWithNoTests",
    "check": "tsc --noEmit",
    "fmt": "bunx prettier --write .",
    "fmt:check": "bunx prettier --check .",
    "lint": "bunx eslint .",
    "ci": "bun run fmt:check && bun run lint && bun run check && bun run test",
    "clean-reinstall": "rm -rf node_modules **/node_modules && bun install",
    "outdated": "bun outdated -r"
  }
}
```

### Dev Tooling Install

```bash
bun add -d eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals prettier
```

- Add `eslint.config.mjs` (flat config) before running `bun run lint`.
- Add `.prettierignore` to exclude `.output`, `node_modules`,
  `src/routeTree.gen.ts`.

### Known Scaffold Gap

- Generated app can miss `src/router.tsx`.
- Symptom: `Could not resolve entry for router entry: router in <project>/src`
- Workaround: add `src/router.tsx` manually:

```ts
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export async function getRouter() {
  const router = createRouter({ routeTree })
  return router
}
```

### Nitro Bun Preset (vite.config.ts)

```ts
import { nitro } from 'nitro/vite'

export default defineConfig({
  plugins: [tanstackStart(), nitro({ preset: 'bun' })],
})
```

### Starter Cleanup Checklist (Do Immediately After Scaffold)

- Replace `src/routes/index.tsx` with BookPlayer landing shell.
- Update title in `src/routes/__root.tsx` to "BookPlayer".
- Remove starter header/nav if not used.
- Remove TanStack-branded starter assets (`public/tanstack-*`).
- Keep `lucide-react` and include a minimal icon exemplar.
- Confirm route set only contains app routes.

## Styling Reference (from experiments/STYLING.md)

### Theme Direction

- Prefer a deliberate palette over default framework styles.
- For dark-shell reader/player apps, use a `slate` hierarchy:
  - `bg-slate-900`: page background
  - `bg-slate-800`: cards/panels/controls
  - `bg-slate-700`: active states
  - `border-slate-700` / `border-slate-600`: separators/inputs
  - `text-white`, `text-slate-300`, `text-slate-400`, `text-slate-500`: text
    hierarchy

### Practical Patterns

- Keep reading surface high contrast (white reader on dark shell).
- Use `tabular-nums` for time displays to prevent layout jitter.
- Use subtle `transition-colors` on hoverable cards.
- Keep media/control accents in-palette.

### Verification Checklist

- Desktop and mobile both usable.
- Keyboard focus visible on controls and links.
- No starter visual branding remains after cleanup.
