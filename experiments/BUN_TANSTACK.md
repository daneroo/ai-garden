# Bun + TanStack Start Notes

Reusable runbook for Bun + TanStack Start scaffolding in this repo.

## Preferred Bootstrap Path

- Use this command (replaces deprecated
  `bun create @tanstack/start@latest ...`).

```bash
bunx --bun @tanstack/cli create <experiment-dir> --package-manager bun --framework React --add-ons nitro --no-git
```

- `--no-git` confirmed: no nested `.git` directory is created.
- Known working on 2026-02-13 with `@tanstack/cli@0.59.3` (`@latest` at the
  time).

## Bun Docs Alignment (Nitro)

- Source: `https://bun.com/docs/guides/ecosystem/tanstack-start`
- Keep Nitro Vite plugin with Bun preset.

```ts
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    tanstackStart(),
    nitro({ preset: "bun" }),
  ],
});
```

## Router Scaffold Status

- Current status: recent TanStack CLI scaffolds appear to include
  `src/router.tsx` correctly.
- Keep the fallback below because scaffold behavior can drift across versions.
- Observed issue in earlier runs: generated app can miss `src/router.tsx`.
- Symptom on `dev`/`build`:
  - `Could not resolve entry for router entry: router in <project>/src`
- Why this breaks:
  - TanStack Start expects a router entry file (`src/router.tsx`) exporting
    `getRouter()`.
  - `src/routes/__root.tsx` is only the root route/layout file, not the router
    instance entry.
- Docs references:
  - `https://tanstack.com/start/latest/docs/framework/react/guide/routing`
  - `https://tanstack.com/start/latest/docs/framework/react/build-from-scratch`
- Fallback workaround: add `src/router.tsx` manually.

```ts
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export async function getRouter() {
  const router = createRouter({ routeTree });
  return router;
}
```

## Import Path Aliases (Recommended)

- Configure path aliases early to avoid fragile deep relative imports,
  especially in nested `src/routes/api/**` handlers.
- Typical alias pattern:
  - `@/*` -> `./src/*`
- Ensure `tsconfig.json` and Vite/TanStack resolution agree before broad usage.

## Script Baseline

- Align runtime scripts to Bun execution of Vite.

```json
{
  "scripts": {
    "dev": "bun --bun vite dev --port 3000",
    "build": "bun --bun vite build",
    "preview": "bun --bun vite preview",
    "start": "bun run .output/server/index.mjs",
    "test": "vitest run --passWithNoTests",
    "test:e2e": "RUN_E2E_TESTS=1 vitest run --passWithNoTests",
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

- To support `fmt`/`lint` scripts, install and configure Prettier + ESLint.

```bash
bun add -d eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals prettier
```

- Why these ESLint packages are included:
  - `@eslint/js`: baseline JavaScript recommended rules.
  - `typescript-eslint`: TypeScript parser + TS rule presets.
  - `eslint-plugin-react-hooks`: hooks correctness rules.
  - `eslint-plugin-react-refresh`: Vite fast-refresh export safety rule.
  - `globals`: browser global symbols in flat config.
  - `prettier`: formatting for `fmt` / `fmt:check`.

- Add `eslint.config.mjs` (flat config) before running `bun run lint`.
- Add `.prettierignore` to exclude generated output (`.output`, `node_modules`,
  `src/routeTree.gen.ts`).

## Quick Validation

```bash
# 1) install + run
bun install
bun --bun run dev

# 2) build
bun --bun run build
```

- Build log note: `[@tanstack/devtools-vite] Removed devtools code ...` is
  expected for production builds (devtools is stripped from prod output).

## Starter Cleanup Checklist (Do Immediately)

- Replace `src/routes/index.tsx` with app-specific landing shell.
- Update title in `src/routes/__root.tsx` from starter text to app title.
- Remove starter header/nav if not used (`src/components/Header.tsx` and import
  in `src/routes/__root.tsx`).
- Remove TanStack-branded starter assets if unused (`public/tanstack-*`).
- Keep `lucide-react` and include a minimal icon exemplar in app UI:
  - `<CircleCheck className="h-4 w-4" />`
  - or `<BookOpenText />` when a header exists.
- Confirm route set only contains app routes (no leftover demo routes).

## Post-Cleanup Verification

- `/` loads app shell (not TanStack starter marketing content).
- `bun --bun run build` succeeds.
