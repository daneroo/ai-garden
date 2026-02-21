# Vtt Parser

As was always the intention, the VTT parser should be a standalone library in
`packages/vtt`.

- Implementation plans have `[ ]` for not started, `[x]` for done
- Before checking any box: `bun run ci` must pass
- Before committing an issue: user reviews changes
- We should always identify the issue we are working on

## Goal

- Implement standalone parser stack in `packages/vtt`
- Keep browser-safe logic in `packages/vtt/vtt.ts`
- Keep server-side file I/O in `packages/vtt/vtt-server.ts`
- Build replacement in parallel, then substitute callers later
- Loosely based on <https://github.com/w3c/webvtt.js/tree/main> and the
  [W3C Standard](https://w3c.github.io/webvtt/)

## Decisions

- [x] Do not replace `vtt.ts` / `vtt-server.ts` yet
- [x] Build bottom-up:
  - `vtt-time`
  - `vtt-block-parser`
  - schemas
  - `vtt-parser`
- [x] Keep discriminator-field-free unions (tagless by field presence)
- [x] Top-level parser return artifacts are:
  - `VttRaw`
  - `VttTranscription`
  - `VttComposition`
- [x] `VttSegment` is nested inside `VttComposition` (not top-level)
- [x] Keep both schema implementations for now (`zod`, `valibot`)
- [x] Strictness model:
  - strict `true` throws on violations
  - strict `false` tolerates conventions but still returns schema-valid output
- [ ] Decide canonical runtime validator after parity period
- [ ] Decide if parser should collect all issues before throwing or fail fast

## Emerging Structure

- `packages/vtt/vtt-time.ts`
  - Time conversion primitives
- `packages/vtt/vtt-block-parser.ts`
  - Block aggregation and low-level classification from lines
  - Convention checks (ordering and required blocks)
- `packages/vtt/vtt-schema-zod.ts`
- `packages/vtt/vtt-schema-valibot.ts`
  - Same semantic model in two validators
- `packages/vtt/vtt-parser.ts` (next)
  - Top-level parser over block parser + schema(s)
  - Main parse entrypoint(s)
- `packages/vtt/vtt-stitch.ts`
  - Stitch/composition helpers over typed artifacts

## Types

There are two unions in play.

- `Provenance` union:
  - `ProvenanceTranscription`
  - `ProvenanceSegment`
  - `ProvenanceComposition`
- `VttFile` artifact union:
  - `VttRaw`
  - `VttTranscription`
  - `VttSegment`
  - `VttComposition`

Each artifact pairs with a provenance type, discriminated by field presence:

| Artifact           | Provenance                | Discriminant            | Data                     | Stage                         |
| ------------------ | ------------------------- | ----------------------- | ------------------------ | ----------------------------- |
| `VttRaw`           | (none)                    | —                       | `cues: VttCue[]`         | Raw Whisper output            |
| `VttTranscription` | `ProvenanceTranscription` | no `segment`/`segments` | `cues: VttCue[]`         | Single transcription run      |
| `VttSegment`       | `ProvenanceSegment`       | `segment` + `startSec`  | `cues: VttCue[]`         | Segment within a composition  |
| `VttComposition`   | `ProvenanceComposition`   | `segments: number`      | `segments: VttSegment[]` | Stitched multi-segment result |

Top-level parser returns `VttRaw | VttTranscription | VttComposition`
(`VttSegment` is nested inside `VttComposition`, not a top-level return).

### `durationSec` convention

`durationSec` is optional on all provenance types but its presence follows a
strict convention:

- `ProvenanceTranscription`: present only when the transcription was run with an
  explicit duration limit (the audio was clipped). In a multi-segment run, this
  is the last segment only.
- `ProvenanceSegment`: carries through from the source transcription. At most
  one segment in a composition will have it, and it must be the last element of
  `VttComposition.segments`.
- `ProvenanceComposition`: present iff the last segment has `durationSec`. Value
  equals `lastSegment.startSec + lastSegment.durationSec`.

Convention rule to enforce: if any `ProvenanceSegment` in a composition has
`durationSec`, it must be the final segment.

### How Standard Schema fits in

- Standard Schema is the interface that can make Zod vs Valibot less coupled to
  consumers
- Both schema libraries can be parity-tested against the same fixture corpus
- Tagless discrimination remains in our data model (no manual `kind` field)

## Implementation Plan

- [x] Initial type flavors and provenance extensions in schemas
- [x] Finalize provenance subtype naming and exported type surface
- [x] vtt-time - validate and add tests (`vtt-time.test.ts`)
- [x] Initial block parser draft (`vtt-block-parser.ts`)
  - [ ] document relative to w3c, and ref implementsation - describing what we
        ommited - and why (Also in readme)
  - [x] Add fixture corpus from known-good whisper-produced files
  - [x] require `WEBVTT` on first non-empty line
  - [ ] BAD IDEA? Preserve cue text lines (no trim mutation)
  - [x] Aggregate blocks from line stream using blank-line boundaries
  - [ ] Add line indexes/positions for diagnostics and later parser stages
- [x] Block checkers (checkNoStyleBlocksConvention, checkNoRegionBlocksConvention,
      checkOnlyProvenanceNotesConvention)
- [x] Block parser tests (`vtt-block-parser.test.ts`)
- [x] Fixture catalog expanded (raw, multi-segment composition, invalid cases)
- [x] Reuse the same fixture corpus for both zod and valibot validation
  - [x] use schema-standard invocation for parity!
- [x] Finalize `vtt-parser.ts` call signatures
  - Generic: `parseVttFile(input, { strict?, schema? })` →
    `{ value: VttFile, warnings: string[] }`
  - Sugar: `parseTranscription(input, schema)` → `VttTranscription` (strict,
    narrowed)
  - Sugar: `parseComposition(input, schema)` → `VttComposition`
  - Sugar: `parseRaw(input, schema)` → `VttRaw`
- [x] Implement parser strictness behavior (`strict: boolean`)
- [x] Enforce composed conventions (root provenance ordering, segment structure)
- [x] Data-driven parser tests (`vtt-parser.test.ts`) — both zod and valibot
- [x] Review and rework `vtt-stitch.ts`
- [x] Cross-segment monotonicity checking (cues that overstep segment bounds)
- [x] Decide trim vs warn strategy for boundary violations
- [ ] Swap callers to replacement parser when stable
- [ ] Add/finish `packages/vtt/README.md` once parser signatures settle

## Backlog

- Evaluate single canonical runtime validator after parity
- Move/align related tooling (`vtt-compare`, `vtt-monotonicity`) after parser
  stabilizes
