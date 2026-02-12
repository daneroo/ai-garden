# Plan: bookfinder-opencode-gemini-3-pro

## Goal

Build `bookfinder-opencode-gemini-3-pro`, an audiobook scanner CLI, to evaluate OpenCode/Gemini-3-Pro
harness.

## Milestones

- [x] **Scaffold**: Project structure, config, deps
- [x] **Docs**: README.md, AGENTS.md, PLAN.md
- [x] **CLI Basic**: Argument parsing and entry point
- [x] **Core**: File scanning and `ffprobe` metadata extraction
- [x] **Output**: JSON output mode
- [x] **TUI**: Interactive table (OpenTUI)
- [x] **Polish**: CI pass, error handling, formatting

## Session Audit

- 2026-02-01: Experiment initialized.
- 2026-02-01: Implemented CLI, Scanner, Prober, and JSON output. CI green.
- 2026-02-01: Implemented TUI with OpenTUI, fixed TypeScript definitions, passed
  all CI checks.
- 2026-02-01: Enhanced Progress View with ETA, elapsed time, and in-flight file
  list.

## Learnings & Retrospective

### OpenTUI / React TUI

- **Intrinsic Elements (Fixed)**: Initially used manual `d.ts` patching, but the
  correct solution is using `"jsxImportSource": "@opentui/react"` in
  `tsconfig.json`. This gives full type safety for `<box>`, `<text>`, etc.
- **Styling**: Props are `fg`/`bg` (TUI terms) not `color`/`backgroundColor`
  (Web terms).
- **Attributes**: Bold/styles require `attributes` bitmask (e.g.,
  `TextAttributes.BOLD`) rather than boolean props.
- **Layout**: `<box>` defaults to `flexDirection: "column"`. Explicit `row` is
  required for tabular layouts (like table headers).
- **Clean Exit**: `createCliRenderer({ useAlternateScreen: true, exitOnCtrlC: true })`
  plus explicit `renderer.destroy()` is required to restore the terminal state
  cleanly. `process.exit()` alone leaves artifacts.

### TUI Layout & Responsiveness

- **Layout Strategy**: `gemibooks` used Flexbox (`<box flexDirection="row">`) for
  table rows/headers. This preserves semantic structure but requires careful
  `flexDirection` management (defaults to column). Alternative approach seen in
  other harnesses ("String Builder": `[col1, col2].join(" ")`) offers more
  predictable alignment but less styling granularity.
- **Column Widths**: Currently using fixed character widths. A better approach
  (seen in cohorts) is dynamic calculation based on `terminalWidth` to fully
  utilize the screen.

### Architecture

- **Worker Pool**: Implementing `onItemStart`/`onItemFinish` callbacks in the
  worker pool was essential for the "In-flight" file visualization, which
  greatly improves perceived responsiveness.
- **Concurrency Consensus**: The "Atomic Index" pattern (shared index counter)
  proved robust and leak-free, aligning with findings from other agents.
