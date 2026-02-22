# VTT Migration Requirements

This document iteratively builds the requirements for migrating `apps/whisper`
to use the `@bun-one/vtt` package.

## 1. Trace: `runWhisper` Signature

We begin by tracing the core entry point, `runWhisper`
(`apps/whisper/lib/runners.ts`).

### Signature

```typescript
export async function runWhisper(
  config: RunConfig,
  deps?: RunDeps,
): Promise<RunResult>;
```

### Output: `RunResult`

**Current State:**

```typescript
export interface RunResult {
  tasks: Task[];
  outputPath: string;
  vttSummary?: VttSummary;
}
```

**Future State:**

```typescript
import type { ParseResult, VttComposition } from "@bun-one/vtt";

export interface RunResult {
  tasks: Task[];
  outputPath: string;
  vttResult?: ParseResult<VttComposition>;
}
```

**Implication 1:** `RunResult` will be kept as a concept, but `VttSummary` and
all the functions that created it (like `summarizeVttFile`) will be completely
eliminated.

Instead, the metadata output will be obtained by simply reading back the final
`outputPath` VTT file that was just produced, parsing it using the specific
`@bun-one/vtt` helper `parseComposition(content)`, and attaching the returned
`value` to the `RunResult`.

> **Note:** `parseTranscription()` and `parseComposition()` do **not** accept a
> `strict` option. Strictness only exists on the generic `parseVtt()` entry
> point. The narrowed parsers already throw on type mismatch and run all
> artifact checkers (monotonicity, segment indices, etc.), so the strict
> behavior is implicit.

Because `parseComposition` returns a `<ParseResult<VttComposition>>` which looks
like `{ value: VttComposition, warnings: string[] }`, reading the file back
inherently gives us the perfectly typed artifact while still surfacing any
schema or monotonicity violations via the `warnings` array.

## 2. Trace: The `tasks` Array (`executeTranscribe`)

The `RunResult` contains an array of tasks executed during the run. The most
relevant one for VTT is the `TranscribeTask`.

```typescript
export interface TranscribeTask {
  kind: "transcribe";
  wavPath: string;
  vttPath: string;
  // ... parameters (model, language, etc.)
  cachePath: string;
  cache: boolean;
}
```

In `apps/whisper/lib/task.ts`, `executeTranscribe` runs the `whisper-cli`
command and waits for the `.vtt` file to be generated. Then it does this:

```typescript
// Inject per-segment provenance into the VTT before caching
const elapsedMs = Date.now() - start;
const parsed = await readVttFile(task.vttPath);
const provenance: VttRunProvenance = {
  input: basename(task.wavPath),
  model: task.model,
  // ...
};
// Rewrite with cues + new provenance, excluding any existing header entries
const segmentOnly = parsed.provenance.filter((p) => "segment" in p);
await writeVtt(task.vttPath, parsed.cues, {
  provenance: [provenance, ...segmentOnly],
});
```

**Implication 2:** `executeTranscribe` produces the foundational VTT data but
**the TypeScript return signature of the task execution itself remains entirely
unchanged.**

The changes are entirely local side-effects inside the function:

1. **Cache Read Validation:** When reading a cached VTT file, the function must
   use `parseTranscription(content)`. If the parser returns warnings (e.g.,
   legacy format or monotonicity errors), the function should **throw an error**
   rather than silently regenerating. This ensures we fail loudly on corrupted
   or outdated cache data.
2. **Generation from Raw:** If generating from scratch, `whisper-cli` gives raw
   cues. We read it with `parseRaw(content)`, then construct a
   `ProvenanceTranscription` from the task fields (`input` ← basename of
   `wavPath`, `model`, `wordTimestamps`, `generated` ← ISO timestamp,
   `elapsedMs`, `durationSec`). The raw cues and the provenance together form a
   complete `VttTranscription` object in memory.
3. **Writing to Disk:** We introduce a new local utility file
   `lib/vtt-writer.ts` that exposes _exactly_ two formatting methods:
   `writeVttTranscription` and `writeVttComposition`. Each serializes the typed
   artifact to the canonical VTT text format:
   `WEBVTT\n\nNOTE Provenance\n{JSON}\n\n...cues...` (matching the
   `NOTE Provenance\n{single-line JSON}` convention that the `@bun-one/vtt`
   parser expects). This file lives in `apps/whisper/lib/` until proven general
   enough to move into `packages/vtt`.

## 3. Trace: Stitching the Segments

After the individual task array execution loop completes, the current run
delegates to `stitchSegments` by mapping over `wavSegs` to create a custom
`segmentVtts` array.

```typescript
// Stitch VTTs from all segments
const segmentVtts = wavSegs.map((seg, i) => ({
  segment: i,
  // ... custom paths
}));

await stitchSegments(segmentVtts, result.outputPath, config);
```

**Implication 3:** We will eliminate the `stitchSegments` function and the
intermediate `segmentVtts` shape entirely.

Instead, we will embrace `@bun-one/vtt` natively right inside `runWhisper`:

1. Iterate over the `wavSegs` array to find the generated `.vtt` paths.
2. Read and parse each file using `parseTranscription(content)`. Each returned
   `VttTranscription` already contains the `provenance.durationSec` that was
   baked in during step 2.
3. Construct the `initialProvenance` object (the fields of
   `ProvenanceComposition` _excluding_ `segments`, `elapsedMs`, and
   `durationSec` — those are computed by the stitcher).
4. Call `stitchVttConcat(transcriptions, initialProvenance)`. The stitcher
   accepts `VttTranscription[]` and derives segment offsets by accumulating each
   transcription's `provenance.durationSec` — it does **not** accept per-segment
   `startSec` offsets directly.
5. Write the returned `VttComposition` to `result.outputPath` using
   `writeVttComposition`.

This completely drops the legacy artifacts of the previous implementation and
keeps the logic linear and typed inside the main runner.

## 4. Trace: The CLI Consumer (`whisper.ts`) and `runWhisper` Logging

Because we changed the `RunResult` output in step 1, two downstream consumers
will break:

**4a. `runWhisper` internal summary** (`runners.ts` lines 115–123): currently
calls `summarizeVttFile` and `getHeaderProvenance` to derive elapsed time and
audio duration for the reporter's `finish()` call. This will be updated to read
directly from `result.vttResult?.value.provenance`.

**4b. `whisper.ts` CLI output** (lines 188–192): currently relies on manual
array searching to print the execution summary:

```typescript
// Derive timing from VTT provenance (reflects original transcription time)
const audioDur = result.vttSummary?.durationSec ?? 0;
const headerProv = result.vttSummary
  ? getHeaderProvenance(result.vttSummary.provenance)
  : undefined;
const elapsedMs = headerProv?.elapsedMs ?? 0;
```

**Implication 4:** Both sites will be updated to read data natively from the
strictly typed composition artifact without helper functions:

```typescript
const provenance = result.vttResult?.value.provenance;
const audioDur = provenance?.durationSec ?? 0;
const elapsedMs = provenance?.elapsedMs ?? 0;
```

## 5. Summary: Dead Code Elimination

**Implication 5:** Because we have natively traced the VTT lifecycle from task
execution through stitching and up back to the CLI consumer without using any
legacy string or array manipulations, the entirety of `apps/whisper/lib/vtt.ts`
and `apps/whisper/lib/vtt-stitch.ts` are rendered obsolete. They will be
deleted.

## 6. Collateral: Tests and Benchmarks

**Implication 6:** The following files will require updates:

- `lib/vtt.test.ts` — tests the legacy parser, `writeVtt`, and roundtrip. Will
  be **deleted** along with `lib/vtt.ts`.
- `lib/task.test.ts` — `executeTranscribe` tests that validate provenance
  injection. Will be updated to assert the new `VttTranscription` format.
- `lib/runners.test.ts` — dry-run integration tests. May need minor updates if
  `RunResult` shape assertions change.
- `scripts/benchmarks/run-bench.ts` — has its own `VttSummarySchema` and
  references `vttSummary`. Deferred to a separate backlog item.
