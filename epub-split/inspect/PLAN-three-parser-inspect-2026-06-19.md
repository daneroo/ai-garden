# Three-Path EPUB Inspection Execution Plan

Date: 2026-06-19

Design reference:
[`DESIGN-three-parser-inspect-2026-06-19.md`](DESIGN-three-parser-inspect-2026-06-19.md)

## Status

- Overall: `NOT STARTED`
- Current gate: `Gate 1`
- Next action: implement the empty full-corpus loop and report structure

## Tracking Rules

- `[ ]` means pending.
- `[x]` means completed and supported by inspectable evidence.
- Check implementation tasks as they are completed.
- Check corpus evidence only after one complete run covers `test`, `drop`, and
  `space` sequentially.
- Check review tasks only after the generated evidence has been inspected.
- Check an **APPROVED** item only after Daniel explicitly approves proceeding.
- Do not begin a gate until the preceding gate's **APPROVED** item is checked.
- Update the dashboard and current-gate status whenever task state changes.

## Dashboard

| Gate | Scope | Status |
|---|---|---|
| 1 | Empty loop and deterministic reports | `NOT STARTED` |
| 2 | Typed Playwright browser boundary | `BLOCKED BY GATE 1` |
| 3 | Browser epub.ts open outcomes | `BLOCKED BY GATE 2` |
| 4A | Node epub.ts open outcomes | `BLOCKED BY GATE 3` |
| 4B | Storyteller open outcomes | `BLOCKED BY GATE 4A` |
| 5 | Three-parser metadata comparison | `BLOCKED BY GATE 4B` |
| Final | Feasibility decision | `BLOCKED BY GATE 5` |

## Gate 1: Empty Full-Corpus Loop and Reports

Status: `NOT STARTED`

### Implementation

- [ ] Create an isolated Bun package under `inspect/`.
- [ ] Add strict TypeScript configuration.
- [ ] Add the single full-run `inspect` script.
- [ ] Configure the existing `test`, `drop`, and `space` roots.
- [ ] Discover every `.epub` under all three roots.
- [ ] Process roots sequentially in `test`, `drop`, `space` order.
- [ ] Process every discovered book sequentially.
- [ ] Read the exact bytes of every EPUB.
- [ ] Compute the full SHA-256 of every EPUB.
- [ ] Compute seven-character short hashes.
- [ ] Extend colliding short hashes to the shortest unique prefix.
- [ ] Normalize root-relative paths for report filenames.
- [ ] Keep full hashes and original root-relative paths in book JSON.
- [ ] Define the first versioned report schema.
- [ ] Represent all three parser paths as explicit `not-implemented` attempts.
- [ ] Generate one authoritative JSON file per book.
- [ ] Generate `run.json` with links to every book JSON.
- [ ] Generate deterministic `index.md` with separate root totals.
- [ ] Generate detail Markdown only for failures or disagreements.
- [ ] Validate that Markdown contains no evidence absent from JSON.
- [ ] Sort all generated output deterministically.
- [ ] Exclude timestamps, durations, hostnames, and absolute paths.
- [ ] Generate reports in a temporary sibling directory.
- [ ] Validate report inventory, links, counts, and filename uniqueness.
- [ ] Replace `reports/` only after all report validation succeeds.
- [ ] Remove stale report files through complete-directory replacement.
- [ ] Preserve the previous reports when generation or validation fails.

### Full-Corpus Evidence

- [ ] `test` discovery and identity processing completed.
- [ ] `drop` discovery and identity processing completed.
- [ ] `space` discovery and identity processing completed.
- [ ] Every discovered EPUB has exactly one book JSON.
- [ ] Every book JSON contains all three parser placeholders.
- [ ] `run.json` inventory counts match generated book files.
- [ ] `index.md` root counts match `run.json`.
- [ ] Byte-identical books across roots share the same hash prefix.
- [ ] Byte-identical books remain separate root observations.
- [ ] All report links resolve.
- [ ] A deliberately failed run leaves previous reports unchanged.
- [ ] A second unchanged complete run produces no report diff.

### Review and Approval

- [ ] Report filenames and flat directory structure reviewed.
- [ ] Per-book JSON inspected on representative `test`, `drop`, and `space`
  books.
- [ ] `run.json` inspected for traceability and reproducibility.
- [ ] `index.md` inspected for useful corpus visibility.
- [ ] Failure behavior inspected.
- [ ] Gate findings recorded in the design or a dedicated findings document.
- [ ] Gate checkpoint committed.
- [ ] **APPROVED: proceed to Gate 2.**

Checkpoint subject:

```text
feat(inspect): establish deterministic full-corpus reports
```

## Gate 2: Typed Playwright Browser Boundary

Status: `BLOCKED BY GATE 1`

### Implementation

- [ ] Add Playwright and the browser epub.ts package dependency.
- [ ] Write a browser-only TypeScript entrypoint.
- [ ] Import `@likecoin/epub-ts`, never `@likecoin/epub-ts/node`, in the
  browser entrypoint.
- [ ] Bundle the browser entrypoint with Bun for a browser target.
- [ ] Verify the bundle does not contain LinkeDOM or Node-only imports.
- [ ] Expose one narrow typed harness function on `globalThis`.
- [ ] Define a shared serializable browser/host protocol.
- [ ] Add runtime validation for values returned across Playwright.
- [ ] Launch one browser process for the complete run.
- [ ] Establish a clean page or context boundary between books.
- [ ] Load the generated bundle through Playwright's script-loading API.
- [ ] Serve each exact EPUB through a synthetic same-origin browser route.
- [ ] Fetch each EPUB as an `ArrayBuffer` inside the browser.
- [ ] Return a constant typed response, byte length, and SHA-256 only.
- [ ] Capture page errors as structured browser-attempt diagnostics.
- [ ] Capture browser console errors without writing into report/progress
  output.
- [ ] Close each per-book browser boundary reliably.
- [ ] Close the shared browser process reliably.
- [ ] Keep epub.ts parsing disabled throughout this gate.

### Full-Corpus Evidence

- [ ] `test` browser transport completed.
- [ ] `drop` browser transport completed.
- [ ] `space` browser transport completed.
- [ ] Every book has one successful or structured failed browser attempt.
- [ ] Browser byte lengths match host byte lengths for every EPUB.
- [ ] Browser SHA-256 values match host SHA-256 values for every EPUB.
- [ ] Page state from one book does not affect the next book.
- [ ] Console and page errors are visible in structured observations.
- [ ] Terminal progress remains intact when browser diagnostics occur.
- [ ] No browser process or page remains after the run.
- [ ] A second unchanged complete run produces no report diff.

### Review and Approval

- [ ] Browser bundle contents and build command reviewed.
- [ ] Playwright lifecycle and isolation reviewed.
- [ ] EPUB byte transport reviewed.
- [ ] Browser/host type and runtime-validation boundary reviewed.
- [ ] Structured diagnostics reviewed.
- [ ] Gate findings recorded.
- [ ] Gate checkpoint committed.
- [ ] **APPROVED: proceed to Gate 3.**

Checkpoint subject:

```text
feat(inspect): prove typed Playwright browser boundary
```

## Gate 3: Browser epub.ts Open Outcomes

Status: `BLOCKED BY GATE 2`

### Implementation

- [ ] Enable browser epub.ts parsing in the proven browser harness.
- [ ] Record open success as a structured observation.
- [ ] Record open failure with stage, category, and message.
- [ ] Record declared EPUB version when exposed.
- [ ] Preserve browser/page diagnostics separately from parser outcomes.
- [ ] Guarantee book cleanup after every attempt.
- [ ] Keep `epubts-node` and `storyteller-node` as `not-implemented`.
- [ ] Do not extract metadata, manifest, spine, TOC, or content.
- [ ] Do not repair, retry, or normalize failing EPUBs.

### Full-Corpus Evidence

- [ ] `test` browser epub.ts open run completed.
- [ ] `drop` browser epub.ts open run completed.
- [ ] `space` browser epub.ts open run completed.
- [ ] Every book has exactly one browser epub.ts outcome.
- [ ] No book failure terminates the complete run.
- [ ] No parser failure exists only as console output.
- [ ] Open failures are individually inspectable.
- [ ] A second unchanged complete run produces no report diff.

### Review and Approval

- [ ] All browser epub.ts failures reviewed.
- [ ] Failure classifications reviewed for lost information.
- [ ] Browser cleanup behavior reviewed.
- [ ] Gate findings recorded.
- [ ] Gate checkpoint committed.
- [ ] **APPROVED: proceed to Gate 4A.**

Checkpoint subject:

```text
feat(inspect): record browser epubts open outcomes
```

## Gate 4A: Node epub.ts Open Outcomes

Status: `BLOCKED BY GATE 3`

### Implementation

- [ ] Add `@likecoin/epub-ts/node` and its LinkeDOM peer dependency.
- [ ] Implement an independent server adapter.
- [ ] Read or pass exact EPUB bytes using the documented API.
- [ ] Record open success as a structured observation.
- [ ] Record open failure with stage, category, and message.
- [ ] Record declared EPUB version when exposed.
- [ ] Guarantee parser cleanup after every attempt.
- [ ] Keep Storyteller as `not-implemented`.
- [ ] Do not add compatibility retries or repair input files.
- [ ] Confirm whether Bun hosts the Node export reliably.
- [ ] Stop for an explicit runtime decision if Bun incompatibility is found.

### Full-Corpus Evidence

- [ ] `test` Node epub.ts open run completed.
- [ ] `drop` Node epub.ts open run completed.
- [ ] `space` Node epub.ts open run completed.
- [ ] Every book has exactly one Node epub.ts outcome.
- [ ] Browser epub.ts observations remain unchanged.
- [ ] Runtime failures are distinguishable from EPUB parse failures.
- [ ] EPUB-version failures remain distinguishable from malformed input.
- [ ] No parser resources remain after the run.
- [ ] A second unchanged complete run produces no report diff.

### Review and Approval

- [ ] All Node epub.ts failures reviewed.
- [ ] Browser-versus-LinkeDOM outcome differences reviewed.
- [ ] Bun runtime suitability reviewed explicitly.
- [ ] Gate findings recorded.
- [ ] Gate checkpoint committed.
- [ ] **APPROVED: proceed to Gate 4B.**

Checkpoint subject:

```text
feat(inspect): record node epubts open outcomes
```

## Gate 4B: Storyteller Open Outcomes

Status: `BLOCKED BY GATE 4A`

### Implementation

- [ ] Add `@storyteller-platform/epub`.
- [ ] Implement an independent Storyteller adapter.
- [ ] Read or pass exact EPUB bytes using the documented API.
- [ ] Record open success as a structured observation.
- [ ] Record open failure with stage, category, and message.
- [ ] Record declared EPUB version when exposed.
- [ ] Guarantee parser cleanup after every attempt.
- [ ] Do not invoke EPUB 2-to-3 conversion automatically.
- [ ] Do not repair, retry, or normalize failing EPUBs.
- [ ] Confirm whether Bun hosts Storyteller reliably.
- [ ] Stop for an explicit runtime decision if Bun incompatibility is found.

### Full-Corpus Evidence

- [ ] `test` Storyteller open run completed.
- [ ] `drop` Storyteller open run completed.
- [ ] `space` Storyteller open run completed.
- [ ] Every book has exactly one Storyteller outcome.
- [ ] Both epub.ts parser-path observations remain unchanged.
- [ ] EPUB 2 rejection remains distinguishable from malformed input.
- [ ] Runtime failures remain distinguishable from parser failures.
- [ ] No parser resources remain after the run.
- [ ] A second unchanged complete run produces no report diff.

### Review and Approval

- [ ] All Storyteller failures reviewed.
- [ ] EPUB 2 behavior reviewed explicitly.
- [ ] Bun runtime suitability reviewed explicitly.
- [ ] Three-path open-outcome reports reviewed.
- [ ] Gate findings recorded.
- [ ] Gate checkpoint committed.
- [ ] **APPROVED: proceed to Gate 5.**

Checkpoint subject:

```text
feat(inspect): record storyteller open outcomes
```

## Gate 5: Three-Parser Metadata Comparison

Status: `BLOCKED BY GATE 4B`

### Schema Investigation

- [ ] Inventory each parser's low-level metadata API.
- [ ] Inventory each parser's semantic convenience metadata API.
- [ ] Define metadata entries without flattening repeated fields.
- [ ] Preserve source ordering where exposed.
- [ ] Preserve exact values.
- [ ] Preserve element or property names.
- [ ] Preserve attributes.
- [ ] Preserve refinements and relationships.
- [ ] Keep semantic convenience values separate from low-level entries.
- [ ] Version the expanded observation schema.
- [ ] Obtain explicit schema review before the full implementation run.

### Implementation

- [ ] Extract metadata independently in browser epub.ts.
- [ ] Extract metadata independently in Node epub.ts.
- [ ] Extract metadata independently in Storyteller.
- [ ] Record metadata-stage failures separately from open failures.
- [ ] Preserve raw metadata observations for all three parsers.
- [ ] Compare exact typed values without normalization.
- [ ] Compare field presence.
- [ ] Compare multiplicity.
- [ ] Compare entry ordering where represented.
- [ ] Compare attributes and refinements.
- [ ] Compare exact values.
- [ ] Classify all-three agreement, two-to-one difference, all-three
  difference, and unavailable comparisons.
- [ ] Link every comparison directly to its source observations.
- [ ] Do not declare a majority parser correct.
- [ ] Do not normalize entities, markup, whitespace, or line endings.

### Full-Corpus Evidence

- [ ] `test` three-parser metadata run completed.
- [ ] `drop` three-parser metadata run completed.
- [ ] `space` three-parser metadata run completed.
- [ ] Every successfully opened book has metadata or a structured metadata
  failure for every parser.
- [ ] Raw metadata remains inspectable per parser and book.
- [ ] Every aggregate count traces to individual books and fields.
- [ ] Entity and escaped-markup cases have concrete before/after observations.
- [ ] No generic compatibility warning replaces actual differing values.
- [ ] A second unchanged complete run produces no report diff.

### Review and Approval

- [ ] Representative all-three agreements reviewed.
- [ ] Representative two-to-one differences reviewed.
- [ ] Representative all-three differences reviewed.
- [ ] Every recurring metadata difference class investigated.
- [ ] Any proposed normalization deferred to a separately approved gate.
- [ ] Report usefulness for future structural/content work assessed.
- [ ] Gate findings recorded.
- [ ] Gate checkpoint committed.
- [ ] **APPROVED: make the final feasibility decision.**

Checkpoint subject:

```text
feat(inspect): compare three-parser metadata observations
```

## Final Feasibility Decision

Status: `BLOCKED BY GATE 5`

- [ ] Review Gate 1 through Gate 5 evidence and findings.
- [ ] Decide whether the runner produces useful, traceable evidence.
- [ ] Decide whether all three parser paths remain justified.
- [ ] Decide whether Bun remains the accepted host runtime.
- [ ] Decide whether to plan manifest and resource-existence observations.
- [ ] Decide whether to stop or continue the experiment.
- [ ] Record the decision and its evidence in the design/findings documents.
- [ ] Commit the approved feasibility conclusion.

Exactly one outcome must be checked:

- [ ] **CONTINUE:** write a separately approved plan for structural gates.
- [ ] **NARROW:** remove one or more paths based on demonstrated limitations.
- [ ] **STOP:** the experiment does not improve confidence or support the
  alignment objective.
