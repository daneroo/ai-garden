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
