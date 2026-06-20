# Three-Path EPUB Inspection Findings

Date: 2026-06-19

## Gate 1: Empty Full-Corpus Loop and Reports

Status: approved.

The identity-only runner completed all configured roots sequentially:

- `test`: 4 EPUB files
- `drop`: 708 EPUB files
- `space`: 589 EPUB files
- Total observations: 1,301

The generated current-truth report contains 1,301 per-book JSON files plus
`run.json` and `index.md`. The report tree is approximately 5.9 MB before any
parser observations are added.

There are 537 SHA-256 groups containing byte-identical EPUB files in more than
one root. Those files share the same seven-character SHA prefix and remain
separate root observations. No seven-character collision between distinct full
SHA-256 values required a longer prefix in this corpus.

The report inventory, root counts, parser placeholders, links, relative paths,
and absence of absolute machine paths were validated. Representative book JSON
from every root was inspected.

Two unchanged complete runs produced byte-identical hashes for all 1,303 report
files. A deliberately inconsistent candidate inventory failed validation before
replacement, and every accepted report file remained byte-identical. A normal
complete run then removed the failed candidate directory.

Inspection found one Markdown rendering defect for a source path containing
`[Omnibus]`. The index generator now escapes backslashes, brackets, and table
separators in link labels. The complete reports were regenerated and again
verified deterministic after the fix.

Report replacement uses a validated candidate directory, a backup rename, and
rollback on replacement failure. This provides transactional preservation of
the previous current-truth report. It is not a single filesystem operation for
replacing a non-empty directory.

No EPUB parser was installed or invoked in this gate. Every book explicitly
records all three parser paths and comparison as `not-implemented`.

## Gate 2: Typed Playwright Browser Boundary

Status: evidence verified across the full corpus; awaiting approval.

Playwright 1.61.0 requires its matching Chromium build. The isolated package
therefore installs Chromium from its `postinstall` script so the documented
`bun install` followed by `bun run inspect` setup remains complete.

Chromium cannot launch inside the current macOS command sandbox because its
Mach rendezvous service is denied. The complete browser run requires normal
unsandboxed local execution. Infrastructure failures occurred before report
replacement, so the approved Gate 1 reports remained unchanged.

The first transport implementation used Playwright `route.fulfill({ body })`.
It worked for ordinary EPUBs but reproducibly terminated Chromium on a 94.6 MB
EPUB (`Arcanum Unbounded.epub`). This transported the entire book through
Playwright's control channel and is rejected as the browser boundary.

The replacement starts an ephemeral same-origin Bun HTTP server and streams the
current EPUB with `new Response(Bun.file(path))`. Playwright controls page
lifecycle and bundle injection but no longer carries EPUB bytes. The browser
still fetches an `ArrayBuffer` and returns its byte length and SHA-256 through
the typed harness.

The complete unsandboxed corpus run was then executed. All 1,301 books across
`test`, `drop`, and `space` transported successfully. The browser byte length
and SHA-256 matched the host for every EPUB, including the largest books in the
corpus — `Mary Beard - Twelve Caesars.epub` (186 MB), `Rhythm of War` (110 MB),
`Oathbringer` (103 MB), and `Arcanum Unbounded.epub` (90 MB) — confirming the
streaming boundary handles arbitrary sizes where `route.fulfill` did not.

Determinism was verified by manifest hash across three independent full runs
(the originally recorded run plus two consecutive re-runs); all three produced a
byte-identical report tree. No Chromium process or `inspect` job remained after
each run completed. Across all 1,301 books, zero console or page-error
diagnostics were emitted, so the structured-diagnostics and progress-separation
paths are verified by construction and code review rather than by a live
diagnostic event.

## Gate 3: Browser epub.ts Open Outcomes

Status: evidence verified across the full corpus; awaiting approval.

The browser harness now opens each book with epub.ts (`ePub(bytes)` reusing the
already-fetched, integrity-checked bytes; `await book.opened`), records the
outcome, and tears the book down with `book.destroy()`. `epubts-node` and
`storyteller-node` remain `not-implemented`. The report schema was raised to
version 2: the `epubts-browser` attempt drops the placeholder `parserStatus`
and gains a nested `open` outcome.

Full-corpus results: all 1,301 books **opened** under the browser path, with
zero open failures, across `test`, `drop`, and `space`. epub.ts opens both
EPUB 2 and EPUB 3 books here (the EPUB-version split surfaces only once
storyteller-node is added, at Gate 4B).

Declared EPUB version is reported as `skipped` for every book. epub.ts reads the
OPF package `version` attribute but discards it (`e==null||e.getAttribute(
"version")` assigns nowhere), so this parser path cannot surface the declared
2.0/3.0 version. The field is modelled as a tagged `DeclaredVersion`
(`exposed`/`skipped`) so a parser that does expose it can populate it later.
Version reporting is intentionally not a blocker for the body-text/spine work.

A first implementation produced a non-deterministic report tree (two runs
disagreed). The cause: epub.ts, with its default archive `replacements`
("blobUrl"), asynchronously builds cover/CSS blob URLs *after* `book.opened`
resolves. On 18 books that pass emitted a console error (a `replaceCss`
`TypeError`, and a cover `EpubError`) whose timing raced page teardown, so the
errors landed in `diagnostics[]` inconsistently. Those messages also embedded
the absolute bundle path. The no-diff invariant caught both. The fix opens with
`replacements: "none"`, which scopes the operation to container + package parse
(the actual definition of "open") and removes the asynchronous resource side
effect entirely. After the fix, two consecutive full runs are byte-identical,
diagnostics are empty for all 1,301 books, and no report file contains an
absolute path. Report validation was also hardened to scan every per-book JSON
for absolute-path leaks, not only `run.json`.

## Gate 4A: Node epub.ts Open Outcomes

Status: evidence verified across the full corpus; awaiting approval.

The epubts-node path opens each book with `@likecoin/epub-ts/node`. The node
build imports LinkeDOM itself and installs the DOMParser/document globals it
needs, so no global wiring is required. Opening is scoped with
`replacements: "none"`, matching the browser path.

Runtime decision (Bun hosting). Bun hosts the node export reliably only when the
entry resolves from the project's node_modules; a script run from outside the
project resolves epub-ts from Bun's global cache, where the bare
`import "linkedom"` cannot be found. The in-project adapter resolves correctly,
so no bundling is required.

Synchronous hang. At least nine distinct books drive LinkeDOM into a
**synchronous** busy loop (≈99% CPU, never returns) during open — confirmed by
running each in isolation with a 120s cap, where every one was killed without
finishing. A synchronous hang blocks the event loop, so an in-process timer
cannot interrupt it. Each book is therefore opened in a dedicated subprocess
(`node-open-one.ts`) that the parent hard-kills on a deadline. Because the hangs
are infinite and legitimate opens complete in well under a second, a 10s
deadline separates the two cleanly with a wide margin, so the Timeout outcome is
deterministic. `process.exit(0)` guarantees shutdown despite any handles left by
killed children.

Full-corpus results: 1,286 books opened, 15 timed out (nine distinct books, the
rest drop/space duplicates); every timeout is the deterministic infinite hang
above, not a slow parse. Declared version is `skipped` for every opened book
(epub.ts discards the OPF version on the node path too). No per-book report
contains an absolute path. Browser observations are unchanged from Gate 3. Two
full runs produce a byte-identical report tree.

The report schema was raised to version 3: epubts-node now carries a real open
outcome (`node-opened` / `node-open-failed`) instead of `not-implemented`; only
storyteller-node remains `not-implemented`.

## Gate 4B: Storyteller Open Outcomes

Status: evidence verified across the full corpus; awaiting approval.

The storyteller-node path opens each book with `@storyteller-platform/epub`
(0.6.2) via `Epub.using(MemoryAdapter).from(bytes, { readonly: true })` — an
in-memory, read-only open that never unpacks the archive to disk. The reader is
disposed with `discardAndClose()`. Bun hosts the package directly with no
special wiring, so no runtime decision was required.

Each book is opened in a dedicated hard-killable subprocess
(`storyteller-open-one.ts`) on the same 10s deadline as the epubts-node path.
Storyteller has not exhibited the LinkeDOM synchronous hang, but the guard is
kept so any future synchronous stall cannot freeze the whole run.

EPUB-version split. Storyteller validates EPUB 3 and rejects EPUB 2 with a clear
message ("This is not a valid EPUB 3 publication … Use Epub.upgrade(path)"),
surfaced as a `storyteller-open-failed` outcome. This is the first parser path
that distinguishes the two versions: EPUB 3 books open, EPUB 2 books fail by
design (no automatic upgrade). Confirmed on samples — EPUB 3 books opened and
EPUB 2 books failed with that message; the full split count comes from the
corpus run.

Declared version is now genuinely **exposed**: `getVersion()` returns the OPF
package version (e.g. "3.0"), so the `DeclaredVersion` `exposed` branch is
populated for the first time (both epub.ts paths report `skipped`).

The report schema was raised to version 4: storyteller-node now carries a real
open outcome (`storyteller-opened` / `storyteller-open-failed`); no parser path
remains `not-implemented`. The run report also records the Storyteller package
version alongside epub.ts and Playwright.

Full-corpus results (1,301 observations; 754 distinct books by SHA-256):

- epubts-browser: 1,301 opened, 0 failed (unchanged from Gate 3).
- epubts-node: 1,286 opened, 15 timed out (unchanged from Gate 4A; the LinkeDOM
  infinite hangs).
- storyteller: 368 opened, 933 failed.

Storyteller failure breakdown (distinct books):

- 523 EPUB 2 rejections ("not a valid EPUB 3 … use Epub.upgrade") — the genuine
  version split; ~69% of the distinct library is EPUB 2.
- 213 EPUB 3 opened (~28%); every one reports declared version `3.0`.
- 17 "could not read the package document" — stricter than epub.js: 30 of the 36
  raw occurrences opened in BOTH epub.ts paths, so these are parser strictness,
  not version. Distinct titles include the Maurice Druon Accursed Kings series,
  several Revelation Space, Lightbringer, Black Company, Nexus, Pratchett
  Sourcery/Thud!, and Expeditionary Force.
- 1 "End of Central Directory Record not found" (bad zip) — Madeline Miller,
  Circe — rejected by @zip.js though epub.js reads it.

Determinism was verified with git: the run-1 report tree was staged, the full
corpus was run a second time, and the working tree showed zero differences from
the staged tree (a byte-identical second run). Report validation passed for both
runs (counts reconcile across roots; no per-book JSON or run.json contained an
absolute path).

Notable cross-parser signal for the comparison gate: Storyteller is the strictest
of the three. epub.js (both browser and node) opens nearly everything; Storyteller
only opens conformant EPUB 3. This makes the declared version trustworthy where it
opens, but means two-thirds of the corpus has no Storyteller path without an
EPUB 2 to 3 upgrade.

## Gate 4C log

Reproduction book: Terry Pratchett - Discworld 05 - Sourcery (550 KB, sha
`bdcc1dc`) — the smallest of the 15 node timeouts.

- E0. Confirmed the hang reproduces with the current worker on this one book:
  killed at 11s (exit 124), no stdout emitted before the kill. The loop starts
  before any result is written.
- E1. stderr capture: LinkeDOM/epub.ts print NOTHING before spinning (silent
  hang). The shipped worker's `stderr: "ignore"` is not hiding a diagnostic in
  this case; there is no pre-hang output to capture.
- E2. Stage localized with markers: reaches "bytes read" and "Book constructed"
  but never "opened". The loop is inside `await book.opened` (container/package
  XML parse via LinkeDOM), not byte read and not construction. `replacements:
  "none"` is already set, so resource replacement is not the cause.
- E3. epub.ts 0.6.7 BookOptions are requestMethod, encoding, replacements,
  canonical, openAs, store. None affect the XML parser; they govern input
  transport, asset replacement, and caching. Since the loop is inside the
  LinkeDOM parse during `opened`, no constructor option can avoid it. The real
  lever is the global DOMParser that `@likecoin/epub-ts/node` installs from
  LinkeDOM. Next: try swapping the DOM implementation (E4), not options.
- E4. Root cause confirmed. `epub.node.js` installs LinkeDOM's DOMParser only
  when `globalThis.DOMParser` is undefined (line 6722) and the parse calls the
  global `DOMParser` (line 151). Bun 1.3.14 ships no native DOMParser
  (`typeof globalThis.DOMParser === "undefined"`), so LinkeDOM is the engine and
  LinkeDOM's `parseFromString` is where the infinite loop lives, on the
  container/OPF XML. The override hook (set `globalThis.DOMParser` before open)
  is feasible, but testing an alternative parser (e.g. @xmldom/xmldom, jsdom)
  needs an isolated scratch install and changes parse semantics for ALL books.
