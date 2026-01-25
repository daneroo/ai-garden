# Benchmarking Subsystem Design (Experiment Focused)

## Goals

1. **Experimentation**: Collect data while varying parameters (model, duration,
   etc.) during test development.
2. **Provenance**: Record context (hostname, arch) for each data point.
3. **Visualization**: Plot results based on the varied parameters.

## Architecture

### 1. Data Storage

A single JSON file collecting results from one or more runs.

- **File**: `apps/whisper/reports/benchmark-results.json`
- **Behavior**: Append-only.

### 2. Data Schema

The JSON file will contain an array of `BenchmarkRecord` items. We extract only
the relevant "Variables" from the run configuration and "Metrics" from the
result.

```typescript
interface BenchmarkRecord {
  // Provenance (Who/When)
  timestamp: string;
  hostname: string;
  arch: string;

  // Variables (From RunConfig)
  model: string; // config.modelShortName
  duration: number; // config.durationSec
  threads: number; // config.threads
  inputBase: string; // basename(config.input)

  // Metrics (From RunResult)
  elapsedSec: number; // result.elapsedSec
  speedup: number; // result.speedup (parsed as float)
  audioDurationSec: number; // result.processedAudioDurationSec
}
```

### 3. The Script (`scripts/bench.ts`)

- **Execution**:
  1. User defines the experiment loops in `bench.ts` (e.g.
     `for model in [tiny, base]...`).
  2. Script calls `whisper.ts --json` for each iteration.
  3. Script parses the full JSON output, maps it to `BenchmarkRecord`, and
     appends to `benchmark-results.json`.
- **Visualization**:
  - Embeds Python script (string template).
  - Runs `uv run python -` piping the JSON data.
  - Generates `reports/plot.png`.

## Workflow

1. **Define**: Edit `bench.ts` to set the loops (e.g. testing `threads`
   scaling).
2. **Run**: `bun run scripts/bench.ts`.
3. **View**: Open `reports/plot.png` (or `reports/BENCHMARK.md`).
