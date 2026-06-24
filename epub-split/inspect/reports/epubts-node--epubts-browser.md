# epubts-node vs epubts-browser

- parserA: epubts-node
- parserB: epubts-browser
- both-opened (distinct books): 756

## Per-field outcomes

mismatch = differ + a-only + b-only.

| field | agree | differ | a-only | b-only | both-null | mismatch |
|---|---:|---:|---:|---:|---:|---:|
| title | 750 | 5 | 0 | 0 | 1 | 5 |
| creator | 754 | 1 | 0 | 0 | 1 | 1 |
| date | 630 | 0 | 0 | 0 | 126 | 0 |

## Spine comparison

| status | distinct books |
|---|---:|
| agree | 756 |
| differ | 0 |

## Manifest comparison

| status | distinct books |
|---|---:|
| agree | 756 |
| differ | 0 |

## Spine content hashes

| status | distinct books |
|---|---:|
| agree | 756 |
| differ | 0 |

per-book distinct spine-content sha256s / total spine positions (from epubts-node): 37537 / 37714

within-book extra positions: 177
= 146 repeated "<unreadable>" sentinel positions
+ 31 readable repeated-content positions
cross-book identical pages are not counted here.

unreadable spine positions: 147 across 1 book(s)
- Les Rois Maudits - L'intégrale (ccabb1879c87746a…): 147 positions share 1 sha256 ("<unreadable>") → 146 extra positions

within-book readable repeats: 31 extra positions across 4 book(s)
- Circe (0295fa5dc63f325b…): 4 positions share 1 readable sha256 → 3 extra positions
- The Murder of Roger Ackroyd (6d339de9584556e6…): 27 positions share 1 readable sha256 → 26 extra positions
- Wonderful Life: The Burgess Shale and the Nature of History (d86061d5178d463a…): 2 positions share 1 readable sha256 → 1 extra positions
- Apex (dc14cc18aacb1ff4…): 2 positions share 1 readable sha256 → 1 extra positions

## TOC comparison

Labels and tree shape compared; hrefs excluded (parsers use different href baselines).

| status | distinct books |
|---|---:|
| agree | 754 |
| differ | 2 |

### TOC href direct-manifest misses

Per-parser diagnostic: TOC hrefs (fragment stripped) with no DIRECT match in
the parser's own manifest. Most misses are valid nav-relative links (the spec
allows hrefs relative to the nav document) and would match once resolved
against the nav base — they are NOT broken links. Treat as a rough signal, not
a validity verdict; precise resolution is deferred (needs nav-base capture).

| parser | books with misses | direct-manifest misses |
|---|---:|---:|
| epubts-node | 85 | 3167 |
| epubts-browser | 85 | 3167 |

## Not compared

| reason | distinct books |
|---|---:|
| epubts-node not opened | 0 |
| epubts-browser not opened | 0 |
| neither opened | 0 |

## Mismatches

### space

- [Cory Doctorow - Reverse Centaurs Guide To Life After AI/Cory Doctorow - Reverse Centaurs Guide To Life After AI.epub](details/bcb9a94e6205a4ddda56120009abff08cf5c9a49ad0ae00467439c03229a9710.md) — title: epubts-node ≠ epubts-browser
- [David Mitchell - The Thousand Autumns of Jacob de Zoet/David Mitchell - The Thousand Autumns of Jacob De Zoet.epub](details/49b2c222abaf049262a28df800c7798536ceed42098d789a1d809d4755dcac33.md) — toc: differ
- [Naomi Novik - Temeraire/Naomi Novik - Temeraire 01 - His Majestys Dragon/Naomi Novik - Temeraire 01 - His Majestys Dragon.epub](details/f5ba6d57e7b1f97bb624dc93bd75eedf5ace39950cb30de304c8ac98f37fd3c1.md) — title: epubts-node ≠ epubts-browser
- [Terry Pratchett - Discworld/Terry Pratchett - Discworld 34 - Thud!/Terry Pratchett - Discworld 34 - Thud!.epub](details/f3225a4b5348b945865ba89004e37377c7c9ded0a85150eabeefad869fa82da2.md) — toc: differ
- [Travis Baldree - Legends & Lattes/Travis Baldree - Legends & Lattes 1 - Legends & Lattes/Travis Baldree - Legends & Lattes 1 - Legends & Lattes.epub](details/b5575577b723da6f1223382c3e744ff0592d7006ee9c0e4d6c00558496476a1f.md) — title: epubts-node ≠ epubts-browser
- [Travis Baldree - Legends & Lattes/Travis Baldree - Legends & Lattes 2 - Bookshops & Bonedust/Travis Baldree - Legends & Lattes 2 - Bookshops & Bonedust.epub](details/84b753d6894ffcf1b6f6f0d7c63cfdfa7ec605c030f16286a77030fdb20323e9.md) — title: epubts-node ≠ epubts-browser

### drop

- [Homer - The Iliad - t. Robert Fagles.epub](details/9f53fad364f25ad21f5503667ef525008bc49cf55351abf64a85b3538055ebd3.md) — creator: epubts-node ≠ epubts-browser
- [Leigh Phillips - Austerity Ecology & the Collapse-Porn Addicts.epub](details/00c4aa14f4b31c4a6f81ae9c4ab812a73a717d641a896c582e5e6efb72e981eb.md) — title: epubts-node ≠ epubts-browser
