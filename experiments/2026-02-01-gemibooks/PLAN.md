# gemibooks Plan

## Goal

Build `gemibooks`, an audiobook scanner CLI, to evaluate OpenCode/Gemini-3-Pro
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

- **Intrinsic Elements**: Use `<box>` and `<text>` instead of imported
  components. Requires manual `d.ts` for strict TypeScript
  `JSX.IntrinsicElements` support.
- **Styling**: Props are `fg`/`bg` (TUI terms) not `color`/`backgroundColor`
  (Web terms).
- **Attributes**: Bold/styles require `attributes` bitmask (e.g.,
  `TextAttributes.BOLD`) rather than boolean props.
- **Layout**: `<box>` defaults to `flexDirection: "column"`. Explicit `row` is
  required for tabular layouts.

### Architecture

- **Worker Pool**: Implementing `onItemStart`/`onItemFinish` callbacks in the
  worker pool was essential for the "In-flight" file visualization, which
  greatly improves perceived responsiveness.
