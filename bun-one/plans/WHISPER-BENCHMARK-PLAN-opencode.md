# Benchmark Consolidation Plan

## Context

Task derived from `CONSOLIDATING-whisper-v2.md`:

> **Benchmarking: bash or ts? output location? Needs Research and Planning!**
>
> - leaning to `.ts` script - isolated from other sources
> - results: single/itemized `.json` files + markdown summary
> - perhaps incrementally regenerated from .json and call `uvx` to make plots?

Decisions:

- Runner: TypeScript (bun) instead of Bash, for better integration and maintenance.
- Location: `bun-one/apps/whisper/scripts/benchmarks/` for code, `bun-one/reports/benchmarks/` for outputs.
- Strategy: Micro-benchmarking with a specific grid (Input × Model × Duration).
- Output: JSON per run (flat files), consolidated Markdown summary, and Python/Matplotlib plots (via `uvx`).

## Scope

- Benchmark the Bun pipeline using a simple grid:
  - input_file_name (m4b)
  - model
  - duration_hours (1, 2, 3)
- Missing detection uses only those three keys (KISS).

## Runner

- File: bun-one/apps/whisper/scripts/benchmarks/run-bench.ts
- Uses internal pipeline functions (same entry points as integration tests).
- Produces new JSON only for missing grid entries.

## Output Layout

- JSON per run: bun-one/reports/benchmarks/<date>-<host>.json
- Summary: bun-one/reports/benchmarks/summary.md (overwritten each run)
- Plot: bun-one/reports/benchmarks/bench-plot.png (overwritten each run)

## Data Schema (per result)

Core fields:

- input_file_name
- model
- duration_hours
- elapsed_sec
- speedup

Provenance fields (captured, not emphasized):

- date_utc
- hostname
- arch
- threads
- input_path
- duration_sec

## Behavior

- Load all bun-one/reports/benchmarks/\*.json
- Build the desired grid (inputs × models × durations)
- Compute missing entries using {input_file_name, model, duration_hours}
- Run only missing entries
- Write new results to <date>-<host>.json
- Regenerate summary.md + bench-plot.png from all JSON files

## CLI

- --dry-run / -n: print missing matrix only (table output)
- --list: print existing grid (table output)
  Columns: input_file_name | model | duration_hours | source_json

## Plotting

- run-bench.ts invokes uvx + matplotlib to write bench-plot.png
- summary.md references the plot image

## Notes

- Duplicate keys across JSON files are unlikely; if they occur, they are ignored for missing detection.
- Extra entries (if the grid changes) won’t affect missing detection.
