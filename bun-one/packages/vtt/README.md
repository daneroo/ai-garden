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

- Provenance union has 3 extensions from `ProvenanceBase`
- Flavor union has 4 schemas:
  - `VttRaw`
  - `VttTranscription`
  - `VttSegment`
  - `VttComposition`
- Top-level parser return is 3 flavors:
  - `VttRaw`
  - `VttTranscription`
  - `VttComposition`

`VttSegment` remains nested inside `VttComposition`.

## Strictness

- Schema-valid output is always required
- `strict: boolean` controls convention behavior
  - strict throws
  - tolerant allows convention drift but keeps schema-valid output
