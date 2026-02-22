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
`@bun-one/vtt` helper `parseComposition(str, { strict: true })`, and attaching
the returned `value` to the `RunResult`.

Because `parseComposition` strictly returns a `<ParseResult<VttComposition>>`
which looks like `{ value: VttComposition, warnings: string[] }`, reading the
file back inherently gives us the perfectly typed artifact while still surfacing
any schema or monotonicity violations via the `warnings` array.

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
   use `parseTranscription(content, {strict: true})`. If the parser returns
   warnings (e.g., legacy format or monotonicity errors), the function should
1. **Cache Read Validation:** When reading a cached VTT file, the function must
   use `parseTranscription(content, {strict: true})`. If the parser returns
   warnings (e.g., legacy format or monotonicity errors), the function should
   **throw an error** rather than silently regenerating. This ensures we fail
   loudly on corrupted or outdated cache data.
1. **Generation from Raw:** If generating from scratch, `whisper-cli` gives raw
   cues. We read it, use `parseRaw`, construct a strictly typed
   `ProvenanceTranscription`, and assemble a full `VttTranscription` object in
   memory.
1. **Writing to Disk:** We require a new local utility file (e.g.,
   `lib/vtt-writer.ts`) that exposes _exactly_ two formatting methods: one for
   `writeVttTranscription` and one for `writeVttComposition`. It will replace
   the legacy `writeVtt` string-array method.

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

1. Iterate over the `wavSegs` array (which contains the `startSec` offset for
   each chunk) to find the generated `.vtt` paths.
2. Read and natively parse each file using
   `parseTranscription(content, {strict: true})`.
3. Construct the canonical `ProvenanceComposition` object for the overall run
   header.
4. Call `stitchVttConcat(inputs, headerProvenance)` passing in the array of
   `transcription` objects paired with their `startOffset` (`seg.startSec`).
5. Write it to `result.outputPath` using `writeVttComposition`.

This completely drops the legacy artifacts of the previous implementation and
keeps the logic linear and typed inside the main runner.

## 4. Trace: The CLI Consumer (`whisper.ts`)

Because we changed the `RunResult` output in step 1, the downstream consumer
`apps/whisper/whisper.ts` will break. It currently relies on manual array
searching to print the execution summary:

```typescript
// Derive timing from VTT provenance (reflects original transcription time)
const audioDur = result.vttSummary?.durationSec ?? 0;
const headerProv = result.vttSummary
  ? getHeaderProvenance(result.vttSummary.provenance)
  : undefined;
const elapsedMs = headerProv?.elapsedMs ?? 0;
```

**Implication 4:** The CLI will be updated to read data natively from the
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
