# epub.ts Validation Findings

Date: 2026-06-14

## Standalone Parser Baseline

The browser epub.js reference reproduced its historical behavior on the grown
corpora:

- `space`: 587/587 attempted, zero reported parser errors.
- `drop`: 706/706 attempted, zero reported parser errors.

The only differences from the December 2025 reports are corpus counts, which
grew from 517 to 587 for `space` and from 635 to 706 for `drop`.

The Node epub.ts candidate completed both current corpora with zero parse
failures after the compatibility handling described below:

- `space`: 587/587 attempted; 581 direct parses and 6 compatibility retries.
- `drop`: 706/706 attempted; 697 direct parses and 9 compatibility retries.

Evidence:

- `data/reports/parser-validation-space-epubjs.md`
- `data/reports/parser-validation-drop-epubjs.md`
- `data/reports/parser-validation-space-epubts.md`
- `data/reports/parser-validation-drop-epubts.md`

## Legacy OPF Namespace Prefixes

Classification: `normalization needed`

Some valid EPUB 2 package documents use prefixed element names such as
`<opf:package>`, `<opf:metadata>`, `<opf:manifest>`, and `<opf:spine>`.
Browser epub.js accepts these books. The `@likecoin/epub-ts/node` parsing chain
uses linkedom, and its unprefixed package selectors fail to find these elements,
causing `Book.open()` to reject with `No Metadata Found`.

The epub.ts adapter retries only that exact failure. It creates an in-memory
copy of the EPUB, removes the `opf:` prefix from OPF element names, and parses
the normalized copy. It does not modify the source EPUB, attributes, metadata,
manifest entries, spine entries, or content documents.

Every retry is surfaced as this parser warning:

```text
Normalized legacy opf: element prefixes for epub-ts/linkedom compatibility
```

This workaround must remain visible during comparison and must not be treated
as proof of stock epub.ts equivalence. It is adapter compatibility behavior for
a documented candidate regression.

## Parse Outcome and Manifest Comparison

Classification: no differences found

The fixed epub.js-reference versus epub.ts-candidate comparison completed all
books in both current corpora:

- `space`: 587/587 compared with zero parse-outcome or strict manifest
  differences.
- `drop`: 706/706 compared with zero parse-outcome or strict manifest
  differences.

No manifest normalization was added. The legacy OPF namespace workaround above
remains visible in the standalone epub.ts reports, but the resulting manifests
are strictly equal to the browser epub.js reference.

Local generated evidence:

- `data/reports/epubjs-vs-epubts-space.md`
- `data/reports/epubjs-vs-epubts-drop.md`

## Metadata Comparison

Classification: `candidate regression with adapter compatibility handling`

Both libraries expose the same epub.js-derived, single-value package metadata
surface. Strict comparison initially found 337 field differences on `space`:
298 descriptions, 23 publishers, 11 rights values, and 5 titles. The epub.ts
values were truncated at escaped markup or named entities, often to just `<`.

The package documents are valid. linkedom represents decoded XML entities as
separate text nodes, while epub.ts reads only the first child node's value.
The epub.ts adapter therefore reconstructs the same fields from each element's
complete `textContent`. It emits this standalone parser warning whenever that
changes stock epub.ts output:

```text
Reconstructed metadata from full element textContent for epub-ts/linkedom compatibility
```

This is candidate compatibility behavior, not proof that stock epub.ts metadata
is equivalent to browser epub.js. Unlike comparison-only normalization, it is
needed to prevent data loss if epub.ts becomes the sole parser.

After reconstruction, six `space` descriptions and one `drop` identifier
differed only by CRLF versus LF. Metadata comparison normalizes line endings
only; raw metadata remains unchanged. This line-ending normalization must be
removed with `compare` unless a later validator independently requires it.

- `test`: 4/4 compared with zero metadata differences.
- `space`: 587/587 compared with zero metadata differences.
- `drop`: 706/706 compared with zero metadata differences.

The cumulative reports retain only the previously classified David Mitchell
TOC difference.

## Spine and Reading Order Comparison

Classification: no differences found

Both adapters now expose the ordered package spine using the same minimal
representation: `idref`, `href`, `linear`, and `properties`. Comparison is
strict and ordered; no normalization is applied.

- `test`: 4/4 compared with zero spine differences.
- `space`: 587/587 compared with zero spine differences.
- `drop`: 706/706 compared with zero spine differences.

The existing local comparison reports now cover parse outcome, manifest, and
spine equivalence.

## TOC Label Normalization

Classification: `comparison-only normalization`

Strict comparison first exposed 2,796 label differences on `space`. These were
serialization differences rather than TOC structure differences: CRLF versus
LF, repeated whitespace, and serialized character references retained by
epub.ts but omitted by browser epub.js.

TOC comparison, and only TOC comparison, normalizes labels by:

- Treating CRLF and LF as equivalent.
- Collapsing surrounding and repeated whitespace.
- Removing serialized HTML character references such as `&hellip;`,
  `&ldquo;`, and `&rdquo;`.

The adapters retain their raw labels. This normalization exists only to compare
the browser epub.js reference with epub.ts and must be removed with `compare`
when epub.js is retired, unless the later single-parser validator independently
justifies a display-label normalization invariant.

## Table of Contents Comparison

Strict recursive comparison preserves entry position, IDs, hrefs including
fragments, labels, sibling counts, and nesting. It does not use the previous
set-based comparison, so duplicate labels and hrefs remain independently
observable.

- `test`: 4/4 compared with zero TOC differences.
- `space`: 587/587 compared; 586 equal and 1 classified difference.
- `drop`: 706/706 compared; 705 equal and the same 1 classified difference.

The sole remaining difference is `David Mitchell - The Thousand Autumns of
Jacob De Zoet.epub`: browser epub.js returns only `Cover` and `Author's Note`
at the root, while epub.ts also returns the five valid part entries and their
chapter descendants. Classification: `reference bug fixed by candidate`.
The difference remains reported as `toc.length`; it is not normalized away.

Local generated evidence:

- `data/reports/epubjs-vs-epubts-space.md`
- `data/reports/epubjs-vs-epubts-drop.md`

## Chapter Content Comparison

Classification: no candidate regressions found

Each adapter now loads every ordered spine entry and records its `idref`, href,
raw serialized XHTML, deterministic DOM representation, and extracted text.
A chapter is compared at progressively looser levels: raw XHTML, canonical DOM,
then normalized text. Raw equality is never inferred from a looser match.

Canonical comparison sorts attributes and omits the parser-injected `<base>`
element. Extracted-text comparison normalizes line endings and whitespace and
decodes serialized HTML entities retained by linkedom, notably `&nbsp;`. These
are comparison-only transformations and must be removed with `compare` unless
the later single-parser validator independently requires them.

Corpus results:

- `test`: 4/4 books; 112 canonical DOM matches, zero text-only matches,
  mismatches, or load failures.
- `space`: 588/588 books; 4,023 canonical DOM matches, 25,996 normalized-text
  matches, 8 content differences, and 334 symmetric chapter-load failures.
- `drop`: 707/707 books; 4,974 canonical DOM matches, 30,296 normalized-text
  matches, 38 content differences, and 270 symmetric chapter-load failures.

No raw XHTML matches occurred because the browser and linkedom serializers
represent loaded documents differently. The canonical and text levels therefore
carry the useful equivalence evidence.

All eight `space` content differences favor epub.ts:

- Browser epub.js corrupts `€` to a control character in two chapters of
  `Bill Browder - Freezing Order.epub`.
- Browser epub.js corrupts `Ž` to a control character in five chapters of
  `Tim Butcher - The Trigger.epub`.
- Browser epub.js treats valid head markup as literal chapter text in
  `Oliver Sacks - The Man Who Mistook His Wife for a Hat.epub`; epub.ts returns
  the actual body text.

Dropbox repeats those differences and adds 30 instances of the same malformed
XHTML recovery difference in `Bart Van Loo - The Burgundians.epub`,
`Sanderson, Brandon - Cosmere 10 - Sixth of the Dusk.epub`, and
`Richard Dawkins - Flights of Fancy.epub`. Browser epub.js includes serialized
head markup as text; epub.ts extracts the body content. Classification:
`reference bug fixed by candidate`.

Chapter loading is captured per spine entry so one bad resource no longer hides
the rest of a book. Every reported load failure occurred in both parsers:

- `Maurice Druon - Les Rois Maudits - Complet.epub` references missing footnote
  resources. It appears twice in `space` and once in `drop`.
- `Terry Pratchett - Discworld 38 - I Shall Wear Midnight.epub` contains 40
  sections neither parser can serialize.
- Dropbox additionally contains `Joe Abercrombie - First Law 5 The Heroes.epub`,
  with 83 sections neither parser can serialize.

These are source-book/load limitations, not candidate regressions. The reports
show at most 15 details per mismatch category at verbosity 1 while retaining
complete comparison totals.

Local generated evidence:

- `data/reports/epubjs-vs-epubts-test.md`
- `data/reports/epubjs-vs-epubts-space.md`
- `data/reports/epubjs-vs-epubts-drop.md`

## Final Decision

The epub.ts adapter is accepted as equivalent or better for the EPUB behavior
this project requires across the checked-in test books and both real-world
corpora. No candidate content regression remains unresolved.

This conclusion applies to the adapter implemented here, not unmodified stock
`@likecoin/epub-ts`. The adapter must retain its visible compatibility handling
for legacy OPF namespace prefixes and linkedom metadata text-node behavior.
Comparison-only TOC, metadata, canonical-DOM, and text normalizations must be
removed with the comparison stack unless the future single-parser validator
independently justifies them as EPUB invariants.

Accepted epub.ts improvements over browser epub.js are:

- More complete TOC extraction for the David Mitchell book.
- Correct Unicode decoding where browser epub.js produced control characters.
- Correct body-text extraction for malformed XHTML that browser epub.js exposed
  as serialized head markup.

The symmetric chapter-load failures identify broken or unsupported source-book
content and should become explicit validation findings in the later
single-parser EPUB validator.

Tracked final evidence:

- `reports/epubjs-vs-epubts-test.md`
- `reports/epubjs-vs-epubts-space.md`
- `reports/epubjs-vs-epubts-drop.md`

Removal of epub.js and Playwright remains explicitly gated on user approval.
