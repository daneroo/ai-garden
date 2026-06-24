# EPUB Validate — Consolidated Findings

Date: 2026-06-24

This document is the single source of truth for what the `epub-validate` tool
has established. It absorbs the surviving conclusions of the three-parser
feasibility experiment (2026-06-19 → 06-22) and every structural finding from
the schema-first refactor (Gates 6–10). The original
`FINDINGS-three-parser-inspect-2026-06-19.md` is superseded; git retains it.

---

## TODO / Open items

- [ ] **Defer text-content extraction (Gate 10B).** Raw spine bytes are already
      proven byte-identical across all parsers (Finding 7), so the only thing
      10B could add is DOM-interpretation divergence (entity decoding,
      whitespace). Not worth it yet — revisit only if a downstream alignment
      need appears.
- [ ] **Validate TOC → content through the parser itself.** Resolve each TOC
      href against its nav-document base and confirm it lands on a real spine /
      manifest target. This would (a) replace the coarse "direct-manifest-miss"
      diagnostic with a real validity check, and (b) resolve the cross-parser
      TOC href-baseline ambiguity (Finding 4) by comparing *resolved targets*
      instead of raw hrefs. Needs the nav-document base path captured in
      `ParserOutput`.
- [ ] **Maintain the problematic-books list** (below) as a living inventory of
      EPUBs that are candidates for fixing the *book*, not our code.
- [ ] **Investigate the 18 Storyteller "could not read the package document"
      failures.** These are not EPUB 2 (those are reported separately as
      `epub2-unsupported`). Both epub.ts paths open them, so this is Storyteller
      package-parse strictness, not corruption. Characterise the exact OPF
      construct Storyteller rejects.
- [ ] **Investigate the epubts-node jsdom fallback (9 books); consider forcing
      jsdom always.** LinkeDOM infinite-loops on these; jsdom opens them. If
      jsdom opens the whole corpus with no regressions, dropping the
      LinkeDOM-first / jsdom-on-timeout hybrid for a single jsdom path would
      remove the timeout machinery entirely. Verify jsdom parity on the books
      LinkeDOM currently handles before switching.

---

## Corpus & method

- **756 distinct books** (by SHA-256) across the `test`, `space`, `drop` roots.
- **Three parsers**, two comparison pairs:
  - `epubts-node` — `@likecoin/epub-ts/node` on Bun (the target pipeline parser).
  - `epubts-browser` — `@likecoin/epub-ts` in real Chromium via Playwright
    (a trusted reference that bypasses LinkeDOM).
  - `storyteller` — `@storyteller-platform/epub`, in-memory, read-only.
- Each book is opened once per parser; metadata, spine, manifest, per-spine-item
  content SHA-256, and the TOC tree are captured into a Zod-validated
  `ParserOutput`. Comparison is pairwise and parser-agnostic.
- The report tree is deterministic (byte-identical across re-runs); no wall-clock
  or machine path is ever written.

### Parser open outcomes (denominator 756 distinct books)

| parser | opened | open-failed | epub2-unsupported | jsdom fallback |
|---|---:|---:|---:|---:|
| epubts-browser | 756 | 0 | 0 | 0 |
| epubts-node | 756 | 0 | 0 | 9 |
| storyteller | 213 | 18 | 525 | 0 |

epub.ts (both paths) opens essentially everything. Storyteller opens only the
~28% of the corpus that is conformant EPUB 3.

---

## Headline: the parsers agree on structure

For every book both parsers in a pair opened:

| dimension | node × browser (756) | node × storyteller (213) |
|---|---|---|
| spine (ordered hrefs) | 756 agree / 0 differ | 213 / 0 |
| manifest (href set) | 756 / 0 | 213 / 0 |
| spine content SHA-256 | 756 / 0 | 213 / 0 |
| TOC labels + tree shape | 754 / **2** | 213 / 0 |
| metadata title | 750 / **5** (1 both-null) | 211 / **2** |
| metadata creator | 754 / **1** (1 both-null) | 213 / 0 |
| metadata date | 630 / 0 (126 both-null) | 168 / 0 (45 both-null) |

Structure (spine, manifest, raw content bytes) is **identical** across all
parsers everywhere. Every remaining disagreement is metadata-text or TOC-tree,
and each one is explained below.

---

## Finding 1 — epub.ts node truncates metadata text at XML entities (LinkeDOM)

The node path (epub.ts via LinkeDOM) truncates metadata strings at the first XML
character reference (`&`, `'`/`’` written as `&#x2019;`, etc.). The browser path
decodes the entity and returns the full value. This is the *only* metadata
disagreement in the corpus — confirmed on 5 titles + 1 creator:

| book | node (truncated) | browser (full) |
|---|---|---|
| Austerity Ecology & the Collapse-Porn Addicts… | `Austerity Ecology` | full title |
| Bookshops & Bonedust | `Bookshops` | `Bookshops & Bonedust` |
| Legends & Lattes… | `Legends` | `Legends & Lattes: …` |
| The Reverse Centaur’s Guide to Life After AI | `The Reverse Centaur` | full title |
| His Majesty’s Dragon | `His Majesty` | `His Majesty’s Dragon` |
| (creator) Robert Homer & Fagles | `Robert Homer` | `Robert Homer & Fagles` |

This is a real interoperability defect in epub.ts/LinkeDOM's metadata text
parsing (the splitter sees a raw `&`/entity and stops). Structural extraction
(spine, manifest, content) is unaffected. The node path cannot be trusted for
metadata-dependent work until this is fixed upstream or worked around.

## Finding 2 — Storyteller returns raw HTML entities in metadata text

For EPUB 3 books, Storyteller's `getMetadata()` returns OPF text verbatim,
including undecoded entities. Example (same book as above):

- browser: `The Reverse Centaur’s Guide to Life After AI` (decoded)
- node: `The Reverse Centaur` (truncated — Finding 1)
- storyteller: `The Reverse Centaur&#x2019;s Guide to Life After AI` (raw entity)

Attributably equivalent, but not lexically identical for any value containing a
character reference. Accounts for the 2 node × storyteller title "differs".

## Finding 3 — TOC label/tree agreement is total except for 2 genuine cases

Cross-parser TOC comparison is **labels + tree shape only** (see Finding 4 for
why hrefs are excluded). node × storyteller is a clean 213 / 0. node × browser
is 754 / 2, and both differs are real epub.ts node-vs-browser divergences:

- **Thud!** (Terry Pratchett) — opened via the jsdom fallback. node extracts
  **0** TOC items; browser extracts **91**. The node path fails TOC extraction
  for this book entirely.
- **The Thousand Autumns of Jacob de Zoet** (David Mitchell) — node returns all
  **7** parts (with subitems); browser truncates to **2** top-level entries.

These are worth keeping visible; they are exactly the kind of signal the
cross-check exists to surface.

## Finding 4 — TOC href baselines differ across parsers (hrefs excluded from comparison)

The parsers report TOC hrefs against different, incompatible baselines:

- epub.ts (node and browser): relative to the nav document
  (e.g. `001_cover.xhtml` when nav lives in `xhtml/`).
- storyteller: also nav-relative (after reverting an attempted `resolveToRoot`
  normalisation that prepended the OPF directory and produced 186 spurious
  "differs").

Comparing raw hrefs is therefore meaningless; the **label hierarchy** is the
semantically meaningful content, so the comparator uses labels + tree shape and
excludes hrefs. A coarse per-parser "direct-manifest-miss" diagnostic is
reported (TOC href with no exact manifest match), but **most misses are valid
nav-relative links**, not broken ones — e.g. TOC href `001_cover.xhtml` vs
manifest `xhtml/001_cover.xhtml` is the same file. ~3167 such "misses" across 85
books per epub.ts path are almost all valid nav-relative links. Proper
validation (resolve against nav base, then match) is the second TODO item.

## Finding 5 — Storyteller is EPUB 3 only, and stricter than epub.ts on EPUB 3

- **525 books** are EPUB 2 → Storyteller reports `epub2-unsupported` by design
  (no auto-upgrade). ~69% of the corpus.
- **18 books** are not EPUB 2 yet Storyteller still fails:
  - 17 × "This is not a valid EPUB publication. Could not read the package
    document." — both epub.ts paths open these, so it is Storyteller
    package-parse strictness, not corruption.
  - 1 × "End of Central Directory Record not found" (**Circe**, Madeline Miller)
    — a malformed zip that @zip.js rejects but epub.js tolerates.

Any workflow needing Storyteller across the whole corpus would require EPUB 2→3
up-conversion plus a fix for the 18 strict-parse rejections.

## Finding 6 — LinkeDOM infinite-loops on 9 books; jsdom fallback resolves all

epub.ts on the node path uses LinkeDOM as its DOM engine (Bun ships no native
`DOMParser`). LinkeDOM enters a **synchronous** infinite loop during package
parse on 9 distinct books, so each book is opened in a hard-killable subprocess;
on timeout it is retried once with jsdom injected as the DOM parser. jsdom opens
all 9. The fallback books:

`Faithful & the Fallen 02 – Valour`, `Shakespeare – Four Great Histories`,
`Revelation Space`, `Sourcery`, `Steve Jobs`, `The Malazan Empire`,
`The Rapture of the Nerds`, `The Veiled Throne`, `Thud!`.

Root cause is LinkeDOM-specific (jsdom and standalone LinkeDOM parses of the
container/OPF both complete instantly; the loop lives deeper in epub.ts's
packaging parse under LinkeDOM). See the fifth TODO item re: forcing jsdom
always.

## Finding 7 — Spine content is byte-identical across parsers

Every parser reads the same zip bytes, so per-spine-item content SHA-256s agree
100% across all pairs. The only within-book hash repeats are fully accounted:

- **Les Rois Maudits – L'intégrale**: 147 spine positions are unreadable
  (`<unreadable>` sentinel) → 146 within-book repeats. The single largest
  extraction anomaly in the corpus.
- 31 readable repeated-content positions across 4 books (Circe, The Murder of
  Roger Ackroyd, Wonderful Life, Apex) — duplicate pages within a book.

Because raw extraction already agrees everywhere, body-text divergence (if any)
could only come from DOM interpretation — the rationale for deferring Gate 10B.

---

## Problematic books (candidates for fixing the EPUB, not our code)

Books that fail to open in some parser or diverge across parsers. Several appear
in multiple categories — those are the most structurally unusual.

| book | issues |
|---|---|
| **Thud!** (Pratchett) | LinkeDOM hang (jsdom fallback) · Storyteller package-parse fail · TOC differs node/browser (node 0 / browser 91) |
| **Revelation Space** (Reynolds) | LinkeDOM hang (jsdom fallback) · Storyteller package-parse fail |
| **Sourcery** (Pratchett) | LinkeDOM hang (jsdom fallback) · Storyteller package-parse fail |
| Accursed Kings series (Druon ×8): Iron King, Strangled Queen, Poisoned Crown, Royal Succession, She Wolf, Lily and the Lion, King Without a Kingdom, White Rose | Storyteller package-parse fail (all 8) |
| Les Rois Maudits – L'intégrale (Druon, FR omnibus) | 147 unreadable spine positions (node × browser) |
| Diamond Dogs / Turquoise Days, Mavericks, Nexus, Redemption Ark | Storyteller package-parse fail |
| The Blinding Knife, The Broken Eye (Weeks) | Storyteller package-parse fail |
| Circe (Miller) | malformed zip — Storyteller "EOCD not found" |
| The Thousand Autumns of Jacob de Zoet (Mitchell) | TOC differs node/browser (node 7 parts / browser 2) |
| Valour, Four Great Histories, Steve Jobs, The Malazan Empire, The Rapture of the Nerds, The Veiled Throne | LinkeDOM hang (jsdom fallback) |
| The Beartown Trilogy (Backman) | Storyteller leaks filesystem path in TOC hrefs (cross-directory nav); sanitised to `<temp-root>` for determinism |
| Bookshops & Bonedust, Legends & Lattes, His Majesty's Dragon, The Reverse Centaur's Guide…, Austerity Ecology… | node metadata entity-truncation (Finding 1) |

---

## Parser scope decision

- **epubts-node — keep.** The target pipeline parser. Bun-native, opens the whole
  corpus (with the jsdom fallback), structurally faithful. Its one defect is
  metadata entity-truncation (Finding 1).
- **epubts-browser — keep.** Retained as the trusted reference that bypasses
  LinkeDOM. It is the only way to catch node-path defects like Finding 1 and the
  Thud! TOC failure. Not part of the runtime pipeline; it is the cross-check.
- **storyteller — keep (scoped).** Valuable as an independent EPUB 3 validator
  and for interop, but EPUB 3-only and stricter; cannot cover the EPUB 2 majority
  without up-conversion.

---

## Runtime & determinism

- **Bun** is the confirmed runtime across browser bundling (Playwright), node
  subprocess workers, and dependency management.
- Reports are deterministic: two consecutive full runs produce a byte-identical
  tree. Storyteller's leaked filesystem temp paths (5 books) are collapsed to a
  stable `<temp-root>` marker at write time, keeping `ParserOutput` faithful in
  memory while reports stay reproducible; `assertNoMachinePaths` rejects
  `/Users/`, `/Volumes/`, and `var/folders/` as a backstop.
