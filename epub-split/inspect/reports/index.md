# EPUB Validate Report

- Run manifest schema: 1
- Runner: epub-inspect 0.1.0
- Bun: 1.3.14
- Chromium: 149.0.7827.55
- epub.ts: 0.6.7
- Storyteller: not-run
- Playwright: 1.61.0
- Occurrences: 1304
- Distinct content: 756

## Corpora discovery

deduped = sha256 already seen earlier in scan order (test, space, drop).

| root | found | deduped | distinct |
|---|---:|---:|---:|
| test | 4 | 0 | 4 |
| space | 590 | 7 | 583 |
| drop | 710 | 541 | 169 |
| total | 1304 | 548 | 756 |

## Parser open outcomes

Occurrence-weighted (denominator 1304).

| parser | opened | open-failed | epub2-unsupported | jsdom fallback |
|---|---:|---:|---:|---:|
| epubts-browser | 1304 | 0 | 0 | 0 |
| epubts-node | 1304 | 0 | 0 | 15 |
| storyteller | not-run | not-run | not-run | not-run |

## Open failures

Genuine open failures only; epub2-unsupported is expected and excluded.

None.

## Comparison pairs

None (fewer than two parsers run).
