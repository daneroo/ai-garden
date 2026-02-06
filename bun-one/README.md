# Bun Workspaces Monorepo

A Bun workspace with shared packages and multiple apps.

## TODO

- [ ] VTT headers - Original Move and stitch/concat
- [ ] Move `data/` directory to top of repo
- [ ] try an experiment/seed for whisper and/or bun-one
- [ ] openai-whisper - try it out
- [ ] Refine per-app type checking (Vite version conflicts - see
      docs/WORKSPACE-BUN.md)

## Directory Structure

See [`docs/WORKSPACE-BUN.md`](./docs/WORKSPACE-BUN.md) for a detailed directory
structure.

- `packages`: libraries like `vtt`
- `components`: UI components like `timer`
- `apps`: cli and (future) web apps

## Usage

```bash
# Monorepo Tasks
bun run ci           # Format + lint + check + test
bun run fmt          # Format code
bun run check        # Type check (recursive)
bun test             # Run tests (recursive)
bun run test:e2e     # Run long e2e tests (skipped by default)

# CLI Example
bun run apps/cli/cli.ts time 3661.5
bun run apps/cli/cli.ts --help

# Whisper Transcription (cwd = apps/whisper)
cd apps/whisper
# Demo script (full + segmented + expected overlap failure)
./scripts/demo/demo.sh
## OR manually
bun run whisper.ts -i data/samples/hobbit-30m.m4b
bun run whisper.ts -i data/samples/hobbit-30m.m4b --segment 10m -m tiny.en
# overlap is intentionally blocked until smart stitching exists
bun run whisper.ts -i data/samples/hobbit-30m.m4b --segment 10m --overlap 30s -m tiny.en

# Whisper Benchmarks (cwd = apps/whisper)
bun run scripts/benchmarks/run-bench.ts
# Output: scripts/benchmarks/summary.md, execution-time.png, speedup.png

# Vite Web App
(cd apps/vite-one && bun run dev)

# Starlight Docs
(cd apps/starlight && bun run dev)

# TanStack Start
(cd apps/tan-one && bun run dev)
(cd apps/tan-one && bun run build && bun run start)
```

## Testing

We have started adding integrations tests, we may have to define a common
strategy for excluding longer running tests from CI, if the times get too long;
i.e. quick,unit,e2e,slow,...

## Add a New Package

```bash
mkdir -p packages/foo
cd packages/foo
bun init -y
# Edit package.json name to @bun-one/foo
```

Import anywhere: `import { bar } from "@bun-one/foo";`

## Manage Dependencies

```bash
bun add -d typescript        # Add to root (shared)
bun add foo --filter @bun-one/vtt  # Add to specific member
# or cd into directory
cd packages/vtt && bun add foo
```
