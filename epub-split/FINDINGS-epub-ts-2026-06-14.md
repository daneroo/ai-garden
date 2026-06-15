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
