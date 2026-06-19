# Three-Path EPUB Inspection Feasibility Design

Date: 2026-06-19

## Status

Design reference. Execution status is tracked in
`PLAN-three-parser-inspect-2026-06-19.md`.

Every phase below is a feasibility gate. Complete the gate over all configured
corpus roots, inspect its committed evidence, and obtain explicit approval
before starting the next phase.

## Objective

Determine whether a new, isolated runner can produce inspectable and
reproducible observations from three EPUB parser paths:

1. `epubts-browser`: `@likecoin/epub-ts` running with a browser-native DOM.
2. `epubts-node`: `@likecoin/epub-ts/node` running with LinkeDOM.
3. `storyteller-node`: `@storyteller-platform/epub` using its XML model.

The experiment uses parser agreement only to discover cases requiring
investigation. Agreement does not prove correctness, a two-to-one result does
not establish a winner, and disagreement does not by itself establish a defect.

The eventual purpose is to identify a reliable EPUB extraction path for
ebook-to-audiobook alignment and to define requirements that can be validated
without treating another parser as an oracle.

## Isolation

Build the experiment entirely under `inspect/`, with its own Bun setup and no
imports from the existing `epub-split` implementation:

```text
inspect/
  package.json
  bun.lock
  tsconfig.json
  src/
  reports/
```

The existing project, reports, plans, and findings remain historical evidence.
Do not refactor or reuse the legacy adapters or comparator in the new runner.

Use Bun for dependency installation, scripts, type checking, and browser
bundling. Do not use `pnpm`, `pnpx`, or `tsx` inside `inspect/`.

## Non-Negotiable Run Model

The runner has one operational mode: a complete run.

- Discover EPUBs under `test`, `drop`, and `space` on every run.
- Process the roots sequentially in that order.
- Process every discovered EPUB sequentially.
- Invoke every implemented parser path for every book.
- Do not expose root selection, parser selection, sampling, deduplication, or
  early-acceptance modes.
- Process byte-identical books independently in every root where they occur.
- Record book/parser failures and continue with the remaining work.
- Abort on infrastructure failures that invalidate the run.
- Replace the current reports only after the complete run finishes and the
  report set passes its integrity checks.

Counts and conclusions remain separate by root because `drop` and `space`
substantially overlap.

## Current-Truth Reports

Maintain one stable report tree with no timestamped run directories:

```text
inspect/reports/
  run.json
  index.md
  books/
    <short-sha>--<root>--<normalized-relative-path>.json
  details/
    <short-sha>--<root>--<normalized-relative-path>.md
```

Report rules:

- JSON is the authoritative evidence format.
- Markdown is a deterministic projection of the JSON.
- `run.json` inventories every discovered book and links to its book JSON.
- Each book JSON contains the observations from every implemented parser path
  and the derived comparison for that book.
- `index.md` summarizes each root separately and links to every book JSON.
- Generate detail Markdown only for books with parser failures or
  disagreements; link each detail report to its book JSON.
- Do not put evidence in Markdown that is absent from the JSON.
- Sort roots, books, parser names, fields, and findings deterministically.
- Exclude timestamps, durations, hostnames, and absolute paths from committed
  reports.
- Record report schema, parser package, runtime, browser, and runner versions in
  `run.json`.

### Book Identity

Hash the exact bytes of each `.epub` with SHA-256.

- Begin filenames with the first seven hexadecimal characters of the SHA-256.
- Extend only colliding prefixes to the shortest unique length required by the
  current complete corpus.
- Include the root name and a normalized root-relative source path after the
  hash.
- Keep the complete SHA-256 and original root-relative path in the book JSON.
- Truncate only the readable filename component if required by filesystem
  limits.

The hash prefix causes byte-identical `drop` and `space` files to sort together
without deduplicating their runs.

## Observation and Comparison Boundaries

Each parser adapter returns plain serializable observations. Adapters do not
normalize values to make parsers agree.

The comparison stage consumes completed observations and classifies each
implemented field as:

- all three agree;
- two agree and one differs;
- all three differ;
- unavailable because one or more parsers failed.

The report must preserve raw parser observations alongside every derived
comparison. Any later comparison-only normalization requires a documented
corpus example, explicit approval, and both raw and normalized results.

## Gate 1: Empty Full-Corpus Loop and Reports

Prove the execution and evidence mechanics before installing or invoking an
EPUB parser.

Implementation scope:

- Create the isolated Bun project and strict TypeScript configuration.
- Configure the existing `test`, `drop`, and `space` roots without copying
  absolute machine paths into reports.
- Discover every `.epub` in all three roots.
- Read and SHA-256 every EPUB file.
- Produce one book observation containing identity only and an explicit
  `not-implemented` parser state for each of the three parser paths.
- Generate the complete JSON and Markdown report tree.
- Generate reports into a temporary sibling directory.
- Validate report linkage, inventory counts, parser-slot completeness,
  filename uniqueness, and absence of stale files.
- Atomically replace `inspect/reports/` only after successful validation.

Acceptance evidence:

- All three roots complete in one run.
- Every discovered EPUB has exactly one book JSON.
- Every book JSON has placeholders for all three parser paths.
- `run.json` counts match the generated files and `index.md` counts.
- Byte-identical books across roots share the same hash prefix and sort
  together.
- A deliberately interrupted or failed run leaves the previous report tree
  unchanged.
- A second unchanged run produces no report diff.

Stop after this gate. Review the report layout and committed diff before adding
any parser dependency.

Checkpoint subject:

```text
feat(inspect): establish deterministic full-corpus reports
```

## Gate 2: Browser Execution Boundary

Determine how browser-side epub.ts will be built, loaded, supplied an EPUB, and
return typed observations. Do not add the server parsers in this gate.

Proposed design to prove rather than assume:

- Write a browser-only TypeScript entrypoint under `src/browser/`.
- Import the browser export `@likecoin/epub-ts`, never the `/node` export.
- Bundle the entrypoint and its dependencies with Bun for a browser target.
- Expose one narrow harness function on `globalThis`.
- Launch Playwright once for the complete run.
- Use a clean page or context boundary between books, while reusing the browser
  process unless isolation testing proves that unsafe.
- Load the generated bundle with Playwright's supported script-loading API.
- Supply the exact EPUB bytes through a synthetic same-origin browser route and
  fetch them as an `ArrayBuffer`; do not use an HTML file input.
- Return only plain serializable data through `page.evaluate`.
- Share compile-time protocol types between browser and host code and validate
  returned observations at runtime.
- Capture browser console errors and unhandled page errors as structured
  parser-attempt diagnostics rather than allowing them to corrupt progress or
  report output.

This gate initially asks the browser harness only to return a constant typed
response plus the received EPUB byte length and hash. It does not parse EPUB
metadata yet. This isolates bundling, transport, lifecycle, serialization, and
error capture from parser behavior.

Acceptance evidence:

- The browser bundle contains no Node or LinkeDOM path.
- Playwright loads the bundle without legacy source injection.
- The browser receives the exact bytes for every EPUB in all three roots, as
  demonstrated by matching byte lengths and SHA-256 values.
- Every book receives one successful or structured failed browser attempt.
- Page state from one book cannot affect the next book.
- Browser console output does not corrupt terminal progress or reports.
- The complete run finishes without browser-process leakage.
- A second unchanged run produces no report diff.

Stop after this gate. Decide whether the demonstrated Playwright/bundle design
is acceptable before allowing epub.ts to parse a book.

Checkpoint subject:

```text
feat(inspect): prove typed Playwright browser boundary
```

## Gate 3: Browser epub.ts Open Outcome

Use the proven browser harness to open every EPUB with browser epub.ts.

Implementation scope:

- Record open success or a structured failure.
- Record the declared EPUB version when exposed.
- Do not extract metadata, manifest, spine, TOC, or content.
- Preserve browser/page diagnostics separately from the parser outcome.
- Keep the other two parser paths as explicit `not-implemented` observations.

Acceptance evidence:

- Every EPUB in every root receives a browser epub.ts outcome.
- No single book failure terminates the corpus run.
- No parser exception is present only as console text.
- Repeated runs are deterministic except for explicitly prohibited transient
  data, which must not enter reports.

Stop and review all browser failures before adding another parser path.

Checkpoint subject:

```text
feat(inspect): record browser epubts open outcomes
```

## Gate 4: Server Parser Open Outcomes

Add `epubts-node`, then Storyteller, as separate sub-gates. A parser must complete
the full corpus before adding the next parser.

For each server parser:

- Open every EPUB independently from exact file bytes or the parser's documented
  file API.
- Record success, declared EPUB version when exposed, and structured failure.
- Guarantee cleanup after every attempt.
- Do not add compatibility retries or repair input files.
- Do not normalize failures between parsers.
- Confirm whether Bun can host the parser reliably. If Bun incompatibility is
  demonstrated, stop and decide explicitly whether a compiled Node host is
  acceptable; do not silently change runtime.

Acceptance evidence for each sub-gate:

- Every book has exactly one outcome for that parser.
- Full-corpus completion and cleanup are demonstrated.
- EPUB 2 rejection, malformed-input rejection, and runtime failures remain
  distinguishable.
- Adding the parser does not alter prior parser observations.
- A second unchanged run produces no report diff.

Stop after `epubts-node`, and again after Storyteller.

Checkpoint subjects:

```text
feat(inspect): record node epubts open outcomes
feat(inspect): record storyteller open outcomes
```

## Gate 5: Metadata Observations and Comparison

Only after all three open paths are trustworthy, extract metadata from all three
parsers over the complete corpus.

Metadata observations must preserve, where exposed:

- repeated entries;
- source ordering;
- exact values;
- element or property names;
- attributes;
- refinements and relationships;
- the parser's semantic convenience values separately from lower-level entries.

Do not force metadata into the old single-string `ParserResult` shape. Define
the observation schema from the actual APIs and corpus evidence gathered during
this gate.

Comparison begins with exact typed values. Differences are reported by field,
entry position, multiplicity, attributes, and value. Do not introduce entity,
markup, whitespace, or line-ending normalization in this gate.

Acceptance evidence:

- Every successfully opened book has a metadata observation or a structured
  metadata-stage failure from each parser.
- Raw metadata remains inspectable per parser in each book JSON.
- Every comparison links directly to the three source observations.
- Aggregate counts can be traced to individual books and fields.
- Previously observed entity/markup cases appear as inspectable evidence rather
  than a generic warning.
- A second unchanged run produces no report diff.

Stop after this gate and decide whether the three paths and report model are
useful enough to continue the project.

Checkpoint subject:

```text
feat(inspect): compare three-parser metadata observations
```

## Planned Later Gates

These are directions, not approved implementation phases. Define each gate in
detail only after the metadata feasibility decision.

1. Manifest entries and resource existence.
2. Ordered spine and itemref resolution.
3. TOC structure and target resolution.
4. Direct XHTML resource loading without rendering hooks.
5. Body-text extraction with stable source locations.
6. Alignment-oriented invariants independent of parser agreement.

Every later gate must run all roots and all three parsers, preserve raw
observations, regenerate the entire current-truth report set, and stop for
approval.

## Historical Findings as Hypotheses

Create an `inspect/HYPOTHESES.md` catalogue before defining post-metadata
invariants. Translate earlier findings into unverified questions, including:

- Can valid namespace-prefixed OPF documents be opened without repair?
- Do metadata values containing entities or escaped markup remain complete?
- Which observations differ between browser DOM and LinkeDOM?
- Can extraction avoid `Section.render()` and rendering-hook behavior?
- Are extensionless spine resources classified from manifest media type rather
  than filename extension?
- Does extracted text preserve Unicode without replacement characters or C1
  control substitutions?
- Can head markup leak into extracted body text?
- Do TOC entries and fragments resolve to actual resources?
- Are missing manifest and spine resources reported precisely?

The previous reports remain exploratory source material. Do not import their
comparisons as expected values, golden files, or proof that any parser was
correct.

## Final Feasibility Decision

After Gate 5, explicitly choose one outcome:

- Continue adding structural and content gates because the runner produces
  useful, traceable evidence.
- Narrow the parser matrix based on demonstrated operational limitations.
- Stop the experiment because the reports do not improve confidence or support
  the alignment objective.

Do not proceed by inertia.
