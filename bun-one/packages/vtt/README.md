# @bun-one/vtt

Standalone VTT parsing and utility package for this monorepo.

## Scope

- Keep browser-safe parser logic in `vtt.ts`
- Keep server-only file I/O in `vtt-server.ts`
- Provide a layered parser stack for block parsing, schema validation, and composition

## Module Structure

- `vtt.ts`
  - Public browser-safe entrypoint
- `vtt-server.ts`
  - Node-only read helpers
- `vtt-time.ts`
  - Time conversion primitives
- `vtt-block-parser.ts`
  - Low-level block parsing and convention checks
- `vtt-schema-zod.ts`
- `vtt-schema-valibot.ts`
  - Shared model in two validators
- `vtt-parser.ts`
  - Top-level parser over blocks + schemas

## Data Model

Each artifact pairs with a provenance type, discriminated by field presence:

| Artifact           | Provenance                | Discriminant            | Data                     | Stage                         |
| ------------------ | ------------------------- | ----------------------- | ------------------------ | ----------------------------- |
| `VttRaw`           | (none)                    | —                       | `cues: VttCue[]`         | Raw Whisper output            |
| `VttTranscription` | `ProvenanceTranscription` | no `segment`/`segments` | `cues: VttCue[]`         | Single transcription run      |
| `VttSegment`       | `ProvenanceSegment`       | `segment` + `startSec`  | `cues: VttCue[]`         | Segment within a composition  |
| `VttComposition`   | `ProvenanceComposition`   | `segments: number`      | `segments: VttSegment[]` | Stitched multi-segment result |

Top-level parser returns `VttFile = VttRaw | VttTranscription | VttComposition`.
`VttSegment` is nested inside `VttComposition`, not a top-level return.

`Provenance = ProvenanceTranscription | ProvenanceSegment | ProvenanceComposition`

### `durationSec` convention

Optional on all provenance types, but presence is meaningful:

- `ProvenanceTranscription`: set only when transcription had an explicit duration
  limit. In a multi-segment run, last segment only.
- `ProvenanceSegment`: carries through from source transcription. Only the last
  element of `VttComposition.segments` may have it.
- `ProvenanceComposition`: present iff the last segment has `durationSec`.
  Value equals `lastSegment.startSec + lastSegment.durationSec`.

## Strictness

- Schema-valid output is always required
- `strict: boolean` controls convention behavior
  - strict throws
  - tolerant allows convention drift but keeps schema-valid output
