# epubts-node vs storyteller

- parserA: epubts-node
- parserB: storyteller
- both-opened (distinct books): 213

## Per-field outcomes

mismatch = differ + a-only + b-only.

| field | agree | differ | a-only | b-only | both-null | mismatch |
|---|---:|---:|---:|---:|---:|---:|
| title | 211 | 2 | 0 | 0 | 0 | 2 |
| creator | 213 | 0 | 0 | 0 | 0 | 0 |
| date | 168 | 0 | 0 | 0 | 45 | 0 |

## Spine comparison

| status | distinct books |
|---|---:|
| agree | 213 |
| differ | 0 |

## Manifest comparison

| status | distinct books |
|---|---:|
| agree | 213 |
| differ | 0 |

## Spine content hashes

| status | distinct books |
|---|---:|
| agree | 213 |
| differ | 0 |

per-book distinct spine-content sha256s / total spine positions (from epubts-node): 10601 / 10601

## TOC comparison

Labels and tree shape compared; hrefs excluded (parsers use different href baselines).

| status | distinct books |
|---|---:|
| agree | 213 |
| differ | 0 |

### TOC href integrity

TOC hrefs (fragment stripped) absent from the parser's own manifest — per-parser self-check.

| parser | books with orphans | total orphaned hrefs |
|---|---:|---:|
| epubts-node | 64 | 2645 |
| storyteller | 64 | 2645 |

## Not compared

| reason | distinct books |
|---|---:|
| epubts-node not opened | 0 |
| storyteller not opened | 543 |
| neither opened | 0 |

## Mismatches

### space

- [Cory Doctorow - Reverse Centaurs Guide To Life After AI/Cory Doctorow - Reverse Centaurs Guide To Life After AI.epub](details/bcb9a94e6205a4ddda56120009abff08cf5c9a49ad0ae00467439c03229a9710.md) — title: epubts-node ≠ storyteller
- [Travis Baldree - Legends & Lattes/Travis Baldree - Legends & Lattes 2 - Bookshops & Bonedust/Travis Baldree - Legends & Lattes 2 - Bookshops & Bonedust.epub](details/84b753d6894ffcf1b6f6f0d7c63cfdfa7ec605c030f16286a77030fdb20323e9.md) — title: epubts-node ≠ storyteller
