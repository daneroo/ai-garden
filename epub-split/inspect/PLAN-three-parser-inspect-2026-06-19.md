# Three-Path EPUB Inspection Execution Plan

Date: 2026-06-19

Design reference:
[`DESIGN-three-parser-inspect-2026-06-19.md`](DESIGN-three-parser-inspect-2026-06-19.md)

## Status

- Overall: `GATE 4B NOT STARTED`
- Current gate: `Gate 4B`
- Next action: begin Gate 4B (Storyteller), reusing the node subprocess+timeout guard

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
| 1 | Empty loop and deterministic reports | `APPROVED` |
| 2 | Typed Playwright browser boundary | `APPROVED` |
| 3 | Browser epub.ts open outcomes | `APPROVED` |
| 4A | Node epub.ts open outcomes | `APPROVED` |
| 4B | Storyteller open outcomes | `NOT STARTED` |
| 4C | Resolve node epub.ts hangs (exploration) | `BLOCKED BY GATE 4B` |
| 5 | Three-parser metadata comparison | `BLOCKED BY GATE 4B` |
| Final | Feasibility decision | `BLOCKED BY GATE 5` |

## Gate 1: Empty Full-Corpus Loop and Reports

Status: `APPROVED`

### Implementation

- [x] Create an isolated Bun package under `inspect/`.
- [x] Add strict TypeScript configuration.
- [x] Add the single full-run `inspect` script.
- [x] Configure the existing `test`, `drop`, and `space` roots.
- [x] Discover every `.epub` under all three roots.
- [x] Process roots sequentially in `test`, `drop`, `space` order.
- [x] Process every discovered book sequentially.
- [x] Read the exact bytes of every EPUB.
- [x] Compute the full SHA-256 of every EPUB.
- [x] Compute seven-character short hashes.
- [x] Extend colliding short hashes to the shortest unique prefix.
- [x] Normalize root-relative paths for report filenames.
- [x] Keep full hashes and original root-relative paths in book JSON.
- [x] Define the first versioned report schema.
- [x] Represent all three parser paths as explicit `not-implemented` attempts.
- [x] Generate one authoritative JSON file per book.
- [x] Generate `run.json` with links to every book JSON.
- [x] Generate deterministic `index.md` with separate root totals.
- [x] Generate detail Markdown only for failures or disagreements.
- [x] Validate that Markdown contains no evidence absent from JSON.
- [x] Sort all generated output deterministically.
- [x] Exclude timestamps, durations, hostnames, and absolute paths.
- [x] Generate reports in a temporary sibling directory.
- [x] Validate report inventory, links, counts, and filename uniqueness.
- [x] Replace `reports/` only after all report validation succeeds.
- [x] Remove stale report files through complete-directory replacement.
- [x] Preserve the previous reports when generation or validation fails.

### Full-Corpus Evidence

- [x] `test` discovery and identity processing completed.
- [x] `drop` discovery and identity processing completed.
- [x] `space` discovery and identity processing completed.
- [x] Every discovered EPUB has exactly one book JSON.
- [x] Every book JSON contains all three parser placeholders.
- [x] `run.json` inventory counts match generated book files.
- [x] `index.md` root counts match `run.json`.
- [x] Byte-identical books across roots share the same hash prefix.
- [x] Byte-identical books remain separate root observations.
- [x] All report links resolve.
- [x] A deliberately failed run leaves previous reports unchanged.
- [x] A second unchanged complete run produces no report diff.

### Review and Approval

- [x] Report filenames and flat directory structure reviewed.
- [x] Per-book JSON inspected on representative `test`, `drop`, and `space`
  books.
- [x] `run.json` inspected for traceability and reproducibility.
- [x] `index.md` inspected for useful corpus visibility.
- [x] Failure behavior inspected.
- [x] Gate findings recorded in the design or a dedicated findings document.
- [x] Gate checkpoint committed.
- [x] **APPROVED: proceed to Gate 2.**

Checkpoint subject:

```text
feat(inspect): establish deterministic full-corpus reports
```

## Gate 2: Typed Playwright Browser Boundary

Status: `APPROVED`

### Implementation

- [x] Add Playwright and the browser epub.ts package dependency.
- [x] Write a browser-only TypeScript entrypoint.
- [x] Import `@likecoin/epub-ts`, never `@likecoin/epub-ts/node`, in the
  browser entrypoint.
- [x] Bundle the browser entrypoint with Bun for a browser target.
- [x] Verify the bundle does not contain LinkeDOM or unresolved Node imports.
- [x] Expose one narrow typed harness function on `globalThis`.
- [x] Define a shared serializable browser/host protocol.
- [x] Add runtime validation for values returned across Playwright.
- [x] Launch one browser process for the complete run.
- [x] Establish a clean page or context boundary between books.
- [x] Load the generated bundle through Playwright's script-loading API.
- [x] Stream each exact EPUB through a same-origin localhost HTTP server.
- [x] Fetch each EPUB as an `ArrayBuffer` inside the browser.
- [x] Return a constant typed response, byte length, and SHA-256 only.
- [x] Capture page errors as structured browser-attempt diagnostics.
- [x] Capture browser console errors without writing into report/progress
  output.
- [x] Close each per-book browser boundary reliably.
- [x] Bound shared-browser shutdown and stop the localhost server reliably.
- [x] Keep epub.ts parsing disabled throughout this gate.

### Full-Corpus Evidence

- [x] `test` browser transport completed.
- [x] `drop` browser transport completed.
- [x] `space` browser transport completed.
- [x] Every book has one successful or structured failed browser attempt.
- [x] Browser byte lengths match host byte lengths for every EPUB.
- [x] Browser SHA-256 values match host SHA-256 values for every EPUB.
- [x] Page state from one book does not affect the next book.
- [x] Console and page errors are visible in structured observations.
- [x] Terminal progress remains intact when browser diagnostics occur.
- [x] No browser process or page remains after the run.
- [x] A second unchanged complete run produces no report diff.

### Review and Approval

- [x] Browser bundle contents and build command reviewed.
- [x] Playwright lifecycle and isolation reviewed.
- [x] EPUB byte transport reviewed.
- [x] Browser/host type and runtime-validation boundary reviewed.
- [x] Structured diagnostics reviewed.
- [x] Gate findings recorded.
- [x] Gate checkpoint committed.
- [x] **APPROVED: proceed to Gate 3.**

Checkpoint subject:

```text
feat(inspect): prove typed Playwright browser boundary
```

## Gate 3: Browser epub.ts Open Outcomes

Status: `APPROVED`

### Implementation

- [x] Enable browser epub.ts parsing in the proven browser harness.
- [x] Record open success as a structured observation.
- [x] Record open failure with stage, category, and message.
- [x] Record declared EPUB version when exposed.
- [x] Preserve browser/page diagnostics separately from parser outcomes.
- [x] Guarantee book cleanup after every attempt.
- [x] Keep `epubts-node` and `storyteller-node` as `not-implemented`.
- [x] Do not extract metadata, manifest, spine, TOC, or content.
- [x] Do not repair, retry, or normalize failing EPUBs.

### Full-Corpus Evidence

- [x] `test` browser epub.ts open run completed.
- [x] `drop` browser epub.ts open run completed.
- [x] `space` browser epub.ts open run completed.
- [x] Every book has exactly one browser epub.ts outcome.
- [x] No book failure terminates the complete run.
- [x] No parser failure exists only as console output.
- [x] Open failures are individually inspectable.
- [x] A second unchanged complete run produces no report diff.

### Review and Approval

- [x] All browser epub.ts failures reviewed.
- [x] Failure classifications reviewed for lost information.
- [x] Browser cleanup behavior reviewed.
- [x] Gate findings recorded.
- [x] Gate checkpoint committed.
- [x] **APPROVED: proceed to Gate 4A.**

Checkpoint subject:

```text
feat(inspect): record browser epubts open outcomes
```

## Gate 4A: Node epub.ts Open Outcomes

Status: `APPROVED`

### Implementation

- [x] Add `@likecoin/epub-ts/node` and its LinkeDOM peer dependency.
- [x] Implement an independent server adapter.
- [x] Read or pass exact EPUB bytes using the documented API.
- [x] Record open success as a structured observation.
- [x] Record open failure with stage, category, and message.
- [x] Record declared EPUB version when exposed.
- [x] Guarantee parser cleanup after every attempt.
- [x] Keep Storyteller as `not-implemented`.
- [x] Do not add compatibility retries or repair input files.
- [x] Confirm whether Bun hosts the Node export reliably.
- [x] Stop for an explicit runtime decision if Bun incompatibility is found.

### Full-Corpus Evidence

- [x] `test` Node epub.ts open run completed.
- [x] `drop` Node epub.ts open run completed.
- [x] `space` Node epub.ts open run completed.
- [x] Every book has exactly one Node epub.ts outcome.
- [x] Browser epub.ts observations remain unchanged.
- [x] Runtime failures are distinguishable from EPUB parse failures.
- [x] EPUB-version failures remain distinguishable from malformed input.
- [x] No parser resources remain after the run.
- [x] A second unchanged complete run produces no report diff.

### Review and Approval

- [x] All Node epub.ts failures reviewed.
- [x] Browser-versus-LinkeDOM outcome differences reviewed.
- [x] Bun runtime suitability reviewed explicitly.
- [x] Gate findings recorded.
- [x] Gate checkpoint committed.
- [x] **APPROVED: proceed to Gate 4B.**

Checkpoint subject:

```text
feat(inspect): record node epubts open outcomes
```

## Gate 4B: Storyteller Open Outcomes

Status: `BLOCKED BY GATE 4A`

### Implementation

- [ ] Add `@storyteller-platform/epub`.
- [ ] Implement an independent Storyteller adapter.
- [ ] Open each book in a hard-killable subprocess with a timeout (reuse the
  `node-open-one.ts` pattern) so a synchronous hang cannot freeze the run.
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

## Gate 4C: Resolve Node epub.ts Hangs (Exploration)

Status: `BLOCKED BY GATE 4B`

Gate 4A found that at least nine distinct books drive `@likecoin/epub-ts/node`
(LinkeDOM) into a synchronous infinite loop on open, currently contained by a
hard-killed subprocess and recorded as `Timeout`. This gate explores whether
those hangs can be resolved rather than only contained.

### Implementation

- [ ] Catalogue the hanging books and confirm the set is stable.
- [ ] Reduce one hanging book to a minimal reproduction.
- [ ] Locate where the loop occurs (LinkeDOM parse vs epub.ts unpack).
- [ ] Test whether epub.ts/LinkeDOM options avoid the loop without repair.
- [ ] Determine whether a LinkeDOM or epub.ts version changes the outcome.
- [ ] Decide: upstream fix, option change, or keep the subprocess timeout guard.
- [ ] Do not silently repair or normalize input EPUBs.

### Full-Corpus Evidence

- [ ] Hanging-book set reproduced deterministically.
- [ ] Any option or version change re-validated across the full corpus.
- [ ] A second unchanged complete run produces no report diff.

### Review and Approval

- [ ] Root-cause findings reviewed.
- [ ] Resolution decision recorded with rationale.
- [ ] Gate findings recorded.
- [ ] Gate checkpoint committed.
- [ ] **APPROVED.**

Checkpoint subject:

```text
docs(inspect): resolve or characterize node epubts hangs
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
