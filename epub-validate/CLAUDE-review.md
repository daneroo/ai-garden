# Review: Three-Path EPUB Inspection

Date: 2026-06-19
Reviewer: Claude (read-only review; no code modified)
Scope reviewed: `PLAN`, `DESIGN`, `FINDINGS`, `README`, and Gate-2 source
(`src/index.ts`, `src/browser-transport.ts`, `src/browser/entry.ts`,
`src/types.ts`). Status at review: Gate 2 in progress.

## Summary

A strong reset over the previous `epub-split` comparison plan. The three-parser,
no-oracle stance, the reproducible evidence model, and the gate discipline are
all well-judged. The one strategic caution is that the feasibility decision is
gated on **metadata**, while the project's actual aim (audio-to-text alignment)
rides on **text extraction**, which is deferred to later gates.

## What is excellent

- **No-oracle stance.** Agreement is used only to surface cases to investigate;
  it is explicitly not treated as correctness, a majority is not a winner, and
  disagreement is not a defect. This fixes the deepest flaw in the prior plan,
  which implicitly treated browser epubjs as ground truth.

- **Evidence model.** JSON is authoritative; Markdown is a deterministic
  projection with nothing absent from JSON; timestamps, durations, hostnames,
  and absolute paths are excluded; output is deterministically sorted. The
  "second unchanged run produces no report diff" check is a real, enforceable
  invariant. Report replacement is transactional (candidate directory, validate,
  swap, rollback).

- **Content-addressed identity.** SHA-256 prefixes make byte-identical books
  across `drop` and `space` sort together while remaining separate observations,
  cleanly handling the corpus overlap (537 duplicate groups found in Gate 1).

- **Gate 2 isolates transport from parser.** Returning only a constant plus byte
  length and SHA-256 before enabling epub.ts parsing correctly separates
  bundling, lifecycle, serialization, and error capture from parser behavior.

- **The 94.6 MB finding is the gate process working as intended.** Discovering
  that Playwright `route.fulfill({ body })` terminates Chromium on
  `Arcanum Unbounded.epub` and pivoting to a localhost streaming server is
  exactly the empirical edge case the staged approach exists to catch. It
  characterizes the concern the prior `playwrightMaxSize.ts` only gestured at.

## Strategic caution: metadata-first vs text-first

The aim is audio-to-text alignment. Per `DESIGN-epub-indexing` (in the parent
project), the load-bearing invariants are about the text stream: round-trip
determinism, cross-engine text equality, reading-order monotonicity, and stable
source locations. Those live in the deferred "Planned Later Gates" (#5 body-text
extraction, #6 alignment invariants). Gate 5 — the stage the feasibility
decision hinges on — is metadata, the lowest-stakes stage for alignment.

Metadata-first is defensible: it is the cheapest real payload to prove the
harness mechanics (open outcomes, observation schema, comparison classification,
no-oracle discipline) before the harder text work, and `HYPOTHESES.md` correctly
captures the text concerns as questions rather than golden values.

Recommendation: make the **Final Feasibility Decision criteria explicitly judge
text-extraction readiness**, not only whether metadata comparison worked.
Otherwise a green light on the easy stage may not de-risk the actual goal.
Suggested addition to the Final Decision section: "Decide whether the harness and
observation model extend to reproducible body-text extraction with stable source
locations."

## Gate-2 specific notes

- **Per-book overhead.** `BrowserTransport.inspect()` does
  `newContext` → `newPage` → `goto` → `addScriptTag({ path })` per book, and
  `addScriptTag({ path })` re-reads the bundle from disk for all 1,301 books.
  Per-context isolation is reasonable, but read the bundle once into memory (or
  serve it as `<script src>` from the existing Bun server) instead of re-reading
  per book. Waste at corpus scale, not a correctness issue.
  (`src/browser-transport.ts:108`)

- **Shared mutable `serverState.path`.** The localhost server serves whatever
  `serverState.path` currently points at. This is correct only because books are
  processed strictly sequentially. Safe today, but a landmine if concurrency is
  ever introduced. Worth a comment pinning the sequential invariant.
  (`src/browser-transport.ts:57`, `src/browser-transport.ts:88`)

- **Diagnostics are the determinism risk.** Everything else is content-addressed
  and sorted, but `diagnostics[]` captures browser console/page-error text,
  whose content and ordering can be non-deterministic. The no-diff rerun check
  will catch it, but this is the field most likely to break byte-stability. Watch
  it specifically. (`src/browser-transport.ts:93`, `src/types.ts:15`)

- **Sandbox means a human in the loop for every gate.** The Mach-rendezvous
  denial prevents Chromium from launching inside the agent sandbox, so each
  gate's full-corpus acceptance evidence requires a manual unsandboxed run. This
  is consistent with the approval gates but means no gate's evidence can be
  agent-self-certified.

## Smaller items

- **"Normalization" is overloaded across documents.** Here it means
  comparison-only normalization to force parser agreement (rightly forbidden and
  deferred). In `DESIGN-epub-indexing` it means the canonical text transform the
  alignment key is built on (essential). Same word, opposite role. Keep the two
  senses distinct when text gates arrive, so neither is conflated.

- **Storyteller is EPUB 3 oriented.** It will structurally fail to open EPUB 2
  books, so the Gate-5 three-way comparison will frequently be two parsers plus
  one unavailable. The plan already classifies this ("unavailable because one or
  more parsers failed"), and measuring how much of the corpus is EPUB 2 is itself
  a legitimate feasibility result. Noted, not a defect.

- **Stray character.** `PLAN-three-parser-inspect-2026-06-19.md` line 1 begins
  with a stray `w` before the heading. Cosmetic.

## Net

The method is sound, the discipline is real, and the three-parser no-oracle
pivot is the right call. The only substantive push is to ensure the post-Gate-5
feasibility decision explicitly evaluates text-extraction readiness, since that —
not metadata — is what the alignment goal depends on.
</content>
