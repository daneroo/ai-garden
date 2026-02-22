# @bun-one/vtt

Standalone VTT parsing and utility package for this monorepo.

## Usage

All imports come from `@bun-one/vtt`. The package hides Standard Schema
plumbing — callers select a schema by name (`"zod"` or `"valibot"`, defaults
to `"zod"`).

### Convenience functions (typical use)

When you know what to expect — strict mode, narrowed return type:

```ts
import { parseTranscription, parseComposition } from "@bun-one/vtt";

// Returns VttTranscription directly — throws on any warning or type mismatch
const { value } = parseTranscription(vttText);
console.log(value.provenance.model);

// Same for compositions
const { value: comp } = parseComposition(vttText);
console.log(comp.segments.length);
```

### Generic function (batch processing, lenient mode)

When validating files you didn't write, or collecting warnings without throwing:

```ts
import { parseVtt } from "@bun-one/vtt";

const { value: classified, warnings } = parseVtt(vttText);

switch (classified.type) {
  case "composition":
    console.log(classified.value.segments.length);
    break;
  case "transcription":
    console.log(classified.value.cues.length);
    break;
  case "raw":
    console.log(classified.value.cues.length);
    break;
}
```

With `strict: true`, throws after collecting all warnings.

### Schema selection

```ts
const result = parseVtt(vttText, { schema: "valibot" });
```

## Module Structure

- `vtt.ts` — barrel re-export (public API)
- `vtt-parser.ts` — semantic parser: blocks to typed artifacts, checkers, schema validation
- `vtt-block-parser.ts` — low-level block parsing and block-level convention checks
- `vtt-time.ts` — time conversion primitives
- `vtt-stitch.ts` — segment stitching and cue shifting
- `vtt-schema-zod.ts` / `vtt-schema-valibot.ts` — shared model in two validators

## Data Model

Each artifact pairs with a provenance type, discriminated by field presence:

| Artifact           | Provenance                | Discriminant            | Data                     | Stage                         |
| ------------------ | ------------------------- | ----------------------- | ------------------------ | ----------------------------- |
| `VttRaw`           | (none)                    | —                       | `cues: VttCue[]`         | Raw Whisper output            |
| `VttTranscription` | `ProvenanceTranscription` | no `segment`/`segments` | `cues: VttCue[]`         | Single transcription run      |
| `VttSegment`       | `ProvenanceSegment`       | `segment` + `startSec`  | `cues: VttCue[]`         | Segment within a composition  |
| `VttComposition`   | `ProvenanceComposition`   | `segments: number`      | `segments: VttSegment[]` | Stitched multi-segment result |

Top-level parser returns `ClassifiedVttFile`, a discriminated union wrapping
`VttFile = VttRaw | VttTranscription | VttComposition`.
`VttSegment` is nested inside `VttComposition`, not a top-level return.

### `durationSec` convention

Optional on all provenance types, but presence is meaningful:

- `ProvenanceTranscription`: set only when transcription had an explicit duration
  limit. In a multi-segment run, last segment only.
- `ProvenanceSegment`: carries through from source transcription. Only the last
  element of `VttComposition.segments` may have it.
- `ProvenanceComposition`: present iff the last segment has `durationSec`.
  Value equals `lastSegment.startSec + lastSegment.durationSec`.

## Checker Architecture

Two tiers of validation run during parsing:

- **BlockCheckers** — syntactic checks on `VttBlock[]` (no style blocks, no region blocks, only provenance notes)
- **ArtifactCheckers** — semantic checks on the constructed `VttFile` (cue monotonicity, segment indices, segment count, durationSec placement)

Warnings accumulate and are returned alongside the parsed value. In strict mode,
any warning causes a throw.
