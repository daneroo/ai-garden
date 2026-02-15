# Agent Workflow & Rules: BookPlayer

This document defines the rules, workflow, and tooling for the BookPlayer experiment.

## Core Mandates

1.  **Bun Runtime**: Use `bun` for all package management and runtime execution.
2.  **TanStack Start**: Use TanStack Start for routing and server-side logic.
3.  **Local-First**: App runs locally, scanning local directories (`AUDIOBOOKS_ROOT`).
4.  **No Auth**: Single-user, no authentication required.
5.  **Strict CI Loop**: Run `bun run ci` after meaningful changes. Fix failures immediately.

## Tooling & Verification

### Required Capabilities

- **Docs**: Use `context7_query-docs` (or `webfetch`) to validate framework details.
- **Browser**: Use `playwright_*` tools for UI validation. **Do not claim UI completion without visual verification.**
- **File System**: Use absolute paths for all file operations.

### Verification Loop

After significant code changes:

1.  Run `bun run ci`.
2.  If `fmt:check` fails, run `bun run fmt`, then rerun `bun run ci`.
3.  **Do not mark a phase complete until CI is green.**

### Browser Verification (Playwright)

- Validate `/` (Landing) and `/player/$bookId` (Player).
- Check desktop AND mobile viewports.
- Verify reader containment (no overflow).
- Verify player controls are usable.
- **Screenshot Evidence**: Record paths of screenshots taken during verification.

## Project Setup (Reference `experiments/BUN_TANSTACK.md`)

### Bootstrap Command

```bash
bunx --bun @tanstack/cli create . --package-manager bun --framework React --add-ons nitro --no-git
```

### Script Baseline (`package.json`)

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

### Dev Dependencies (Add Immediately)

```bash
bun add -d eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals prettier
```

### Project Dependencies (Add as needed)

- `epubjs` (Required)
- `lucide-react` (Keep if present)

## Configuration (`.env`)

Required environment variables:

- `AUDIOBOOKS_ROOT`: Absolute path to audiobooks directory.
- `VTT_DIR`: Absolute path to transcript directory.

## App Architecture (Reference `seeds/bookplayer.md`)

### Routes

- `/`: Landing page (Book directory).
- `/player/$bookId`: Player page (Audio + eBook).

### Data Model

- **Source**: Recursive scan of `AUDIOBOOKS_ROOT`.
- **Grouping**: Folder-based. Valid book = 1+ `.m4b` AND 1+ `.epub`.
- **ID**: Short digest of normalized `.m4b` basename.

### Player Layout (Hard Requirements)

- **Reader-First**: EPUB content dominates viewport.
- **Containment**: Reader wrapper must handle overflow (`overflow: hidden`).
- **Controls**: Compact header/footer. No floating overlays obscuring text.
- **Transcript**: Scrollable strip, syncs with audio.

### Styling (Reference `experiments/STYLING.md`)

- **Theme**: Slate hierarchy (`bg-slate-900` shell, `text-slate-300`).
- **Contrast**: High contrast for reading surface.
- **Typography**: `tabular-nums` for time displays.

## Reference Docs

- `experiments/BUN_TANSTACK.md` (Setup/Runtime)
- `experiments/STYLING.md` (Visuals)
- `seeds/bookplayer.md` (Requirements)
