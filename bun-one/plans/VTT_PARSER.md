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
- [x] Top-level parser return flavors are:
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

- Provenance union:
  - `ProvenanceTranscription`
  - `ProvenanceSegment`
  - `ProvenanceComposition`
- Flavor union:
  - `VttRaw`
  - `VttTranscription`
  - `VttSegment`
  - `VttComposition`

All provenance types extend `ProvenanceBase` and are distinguished by field
presence (`segment`, `segments`, or neither).

| Flavor             | Key 1: provenance                            | Key 2: Data              | Workflow Stage                               |
| ------------------ | -------------------------------------------- | ------------------------ | -------------------------------------------- |
| `VttRaw`           | (None)                                       | `cues: VttCue[]`         | Raw output from Whisper (or similar).        |
| `VttTranscription` | Base + `durationSec?`                        | `cues: VttCue[]`         | Enriched local run with invocation metadata. |
| `VttSegment`       | Base + `segment`, `startSec`, `durationSec?` | `cues: VttCue[]`         | A transcription transformed for inclusion.   |
| `VttComposition`   | Base + `segments: number`, `durationSec?`    | `segments: VttSegment[]` | Final stitched result with global metadata.  |

Top-level parser returns a union of
`VttRaw | VttTranscription | VttComposition (which nests VttSegment[])`.

### How Standard Schema fits in

- Standard Schema is the interface that can make Zod vs Valibot less coupled to
  consumers
- Both schema libraries can be parity-tested against the same fixture corpus
- Tagless discrimination remains in our data model (no manual `kind` field)

## Implementation Plan

- [x] Initial type flavors and provenance extensions in schemas
- [ ] Finalize provenance subtype naming and exported type surface
- [x] Initial block parser draft (`vtt-block-parser.ts`)
- [ ] Refine block parser to line-accurate behavior without mutating cue text
- [ ] Add fixture corpus from known-good whisper-produced files
- [ ] Reuse the same fixture corpus for both zod and valibot validation
- [ ] Finalize `vtt-parser.ts` call signatures
- [ ] Implement parser strictness behavior (`strict: boolean`)
- [ ] Enforce composed conventions (root provenance ordering, segment structure)
- [ ] Swap callers to replacement parser when stable
- [ ] Add/finish `packages/vtt/README.md` once parser signatures settle

## Backlog

- Evaluate single canonical runtime validator after parity
- Move/align related tooling (`vtt-compare`, `vtt-monotonicity`) after parser
  stabilizes
