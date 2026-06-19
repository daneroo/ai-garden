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
