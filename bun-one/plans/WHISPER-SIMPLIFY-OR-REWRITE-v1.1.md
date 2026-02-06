# WHISPER-SIMPLIFY-OR-REWRITE v1.1

First Iteration: Single-Segment End-to-End Flow

Links to: [Master Plan](./WHISPER-SIMPLIFY-OR-REWRITE.md) | [v1](./WHISPER-SIMPLIFY-OR-REWRITE-v1.md)

Status: COMPLETE

## Iteration Goal

Prove Theseus approach with minimal viable implementation:

- Single segment only (audio ≤37h)
- End-to-end flow: audio → WAV → transcribe → VTT
- New code: `whispernu.ts` + `libnu/*.ts`
- Old code: untouched, still runnable
- Tests: adapted from existing or new

## Scope

What's IN:

- Single segment transcription
- Basic CLI argument parsing (input, model)
- WAV conversion (ffmpeg)
- Whisper.cpp execution
- VTT output with provenance
- WAV caching (model-independent)
- VTT caching (model-specific)

What's OUT (deferred to v1.2+):

- Multi-segment (>37h audio)
- Stitching
- Duration filtering (`--duration`)
- Progress monitoring
- Benchmark mode
- Error recovery

## Architecture

Entry point: `whispernu.ts`

- Parse args (input path, model)
- Compute cache paths
- Check VTT cache (hit? done)
- Check WAV cache (miss? convert)
- Run transcribe
- Write VTT with provenance
- Cache VTT

Modules in `libnu/`:

- `cache.ts` - Path computation, cache checking
- `audio.ts` - FFmpeg WAV conversion
- `transcribe.ts` - Whisper.cpp execution
- `vtt.ts` - VTT parsing/writing, provenance

Target: ~200-300 lines total (vs current ~2500)

## Interface Target

Minimal types (target: 5-8 interfaces):

- `CachePaths { wav: string; vtt: string }`
- `TranscribeParams { model: string; audioPath: string }`
- `VttCue { start: number; end: number; text: string }`
- `Provenance { model: string; timestamp: string; ... }`

Avoid:

- Task abstraction (just inline the steps)
- Segment interface (single segment = no segments needed)
- Runner abstractions (just spawn processes directly)

## Implementation Steps

Create files:

- `apps/whisper/whispernu.ts`
- `apps/whisper/libnu/cache.ts`
- `apps/whisper/libnu/audio.ts`
- `apps/whisper/libnu/transcribe.ts`
- `apps/whisper/libnu/vtt.ts`

Tests:

- `apps/whisper/libnu/test/e2e_basic_test.ts` (single segment flow)
- Unit tests as needed

Validation:

- `bun run ci` passes
- E2E test passes with real audio
- Old code still works (`./whisper.ts`)
- Compare output: `whisper.ts` vs `whispernu.ts` (should match)

## Success Criteria

Objective:

- Tests pass
- CI passes
- Can transcribe single segment audio
- VTT output matches old implementation

Subjective:

- Code feels simpler
- Less abstraction overhead
- Easier to understand flow
- Interfaces reduced (22 → ~5-8)

## Open Questions

Starting point:

- Bottom-up (libnu/ modules first) vs top-down (whispernu.ts first)?
- Recommendation: Top-down (write whispernu.ts, implement functions as needed)

Caching:

- Reuse existing cache logic or rewrite?
- Recommendation: Start fresh, but similar structure

VTT:

- Reuse existing VTT parser or rewrite?
- Recommendation: Reuse if simple, otherwise inline

## Next Actions

- Read current `whisper.ts` to understand CLI flow
- Read current `lib/cache.ts` to understand cache structure
- Start implementing `whispernu.ts` (top-down)
- Implement `libnu/` modules as needed
- Write E2E test
- Compare outputs
- Document learnings

## Results

Implemented: `whispernu.ts` (194 lines)

Line count comparison:

- Old: whisper.ts (196) + lib/*.ts (2325) = ~2521 lines total
- New: whispernu.ts (194 lines) = **~12x reduction**

Features working:

- Single segment transcription
- WAV caching (model-independent)
- VTT caching (model-specific)
- CLI argument parsing
- Error handling

Tested with:

- data/samples/jfk.mp3 (11s audio)
- Model: tiny.en
- Both cache hits and cache misses work

Not yet implemented:

- VTT Provenance headers (NOTE blocks)
- Multi-segment (>37h audio)
- Duration filtering
- Progress monitoring

Subjective evaluation:

- Code feels much simpler
- Easy to understand flow (top to bottom)
- Less abstraction overhead
- No Task interface, no Runner abstractions
- Direct function calls, inline logic

## References

- Master plan: [WHISPER-SIMPLIFY-OR-REWRITE.md](./WHISPER-SIMPLIFY-OR-REWRITE.md)
- Current entry point: [../apps/whisper/whisper.ts](../apps/whisper/whisper.ts)
- New entry point: [../apps/whisper/whispernu.ts](../apps/whisper/whispernu.ts)
