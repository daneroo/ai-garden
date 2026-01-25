# Whisper Benchmark Plan

## TODO

- [ ] Implement plots via embedded Python template with `uvx` and matplotlib
  - Suggested plots from plan:
    - X: duration, Y: speedup, grouped by model
    - X: model, Y: elapsed time, grouped by duration

## Context

Task derived from `CONSOLIDATING-whisper-v2.md`:

> Benchmarking: Implement runner based on plan.

Two prior plans were evaluated:

- Plan 1: `WHISPER-BENCHMARK-PLAN-opencode.md` — grid-based, incremental, CLI
  flags
- Plan 2: `WHISPER-BENCHMARK-PLAN-gemini.md` — experiment-focused, append-only
  single file

This plan adopts the OpenCode architecture with refinements based on design
discussion.

## Design Philosophy

The benchmark system is a **data pipeline with clear phase separation**:

```text
[Read existing JSON] → [Compute missing] → [Execute missing] → [Write new JSON] → [Regenerate presentation]
```

Key principles:

- Separation of concerns: Runner script, data storage, and presentation are
  independent
- Data as first-class artifacts: Each benchmark run produces one JSON file
- Transparent schema: Store raw `whisper --json` output verbatim, no translation
  layer
- Idempotent execution: Re-run anytime; script determines what's missing
- Inspectable state: CLI flags expose internal state before committing to work
- Portable outputs: JSON files are consumable by other tools (websites,
  dashboards, etc.)

## Architecture

```text
bun-one/
├── apps/whisper/scripts/benchmarks/
│   └── run-bench.ts              # orchestration
└── reports/benchmarks/
    ├── *.json                    # raw whisper output
    └── summary.md, *.png         # derived
```

## Data Schema

Each JSON file contains the unmodified output of `whisper --json` for a single
run.

The schema evolves with whisper itself — no custom mapping required.

File naming is arbitrary and human-friendly (e.g.,
`2024-01-25-macbook-tiny-1h.json`). The naming scheme is not used for
programmatic lookups; files are parsed to determine content.

## Grid Configuration

The test matrix is defined as a simple object at the top of the script:

```typescript
const grid = {
  inputs: ["file1.m4b", "file2.m4b"],
  models: ["tiny.en", "small.en"],
  durations: ["1h", "2h"],
  wordTimestamps: [false],
};
```

The outer product of all dimensions constitutes the items to be tested.

Specific values are deferred to implementation — start simple and expand as
needed.

## Script Behavior

### Phase: Inventory

- Glob all `bun-one/reports/benchmarks/*.json`
- Parse each file to extract comparison keys (input, model, duration, etc.)
- Build set of existing data points

### Phase: Compute Missing

- Generate outer product of grid dimensions
- Subtract existing data points
- Result: list of missing configurations

### Phase: Execute

- For each missing configuration, invoke whisper
- Write raw JSON output to new file in `bun-one/reports/benchmarks/`

### Phase: Present

- Re-read all JSON files
- Generate `summary.md` with tabular results
- Generate plot(s) via embedded Python template run with `uvx`

## CLI Interface

- `bun run scripts/benchmarks/run-bench.ts` — full run (execute missing,
  regenerate presentation)
- `--list` — print existing data points as table, flag any duplicates, then exit
- `--dry-run` / `-n` — print missing configurations, flag any duplicates, then
  exit (no execution)

Duplicate flagging assists manual data curation (e.g., removing redundant or
stale runs).

## Presentation

### Summary Markdown

A `summary.md` file with:

- Static table of all results
- Reference to generated plot image(s)

The markdown table is not dynamically sortable. For interactive behavior, the
presentation layer could be replaced with HTML or integrated into a web
framework (e.g., Astro) that consumes the same JSON data files.

Specifics deferred to implementation.

### Plots

Embedded Python template string executed via `uvx` with matplotlib.

Plot types and axes deferred to implementation — likely:

- X: duration, Y: speedup, grouped by model
- X: model, Y: elapsed time, grouped by duration

Results are checked into git, so `uvx` availability is only required on dev
machines.

## Implementation Notes

### Whisper Invocation

Two options available since script lives in same app:

- Import `runWhisper`: Convenient, automatic TypeScript types
- Spawn CLI: Dogfoods the actual tool, cleaner separation

Recommendation: Start with `runWhisper` import for convenience; migrate to CLI
spawn later if desired.

### Duplicate Handling

If multiple JSON files contain the same configuration (same grid keys), this is
allowed. The script counts the configuration as "present" — duplicates are
flagged by `--list` and `--dry-run` for manual review but do not block
execution.

### Future Flexibility

This architecture supports:

- Moving the script to an independent package
- Consuming JSON data from a web presentation layer (Astro, etc.)
- Adding new grid dimensions without changing storage format
- Parallel execution of missing benchmarks (future enhancement)
