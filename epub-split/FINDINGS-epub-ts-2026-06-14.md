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
