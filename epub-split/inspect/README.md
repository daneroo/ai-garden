# EPUB Validate

A parser-agnostic EPUB validation harness: it opens every book in the `test`,
`space`, and `drop` corpora with three independent parsers, captures a
Zod-validated `ParserOutput` (metadata, spine, manifest, per-item content
SHA-256, TOC tree), and produces a deterministic pairwise comparison report.

Start here:
- [`FINDINGS-epub-validate-2026-06-24.md`](FINDINGS-epub-validate-2026-06-24.md) — **consolidated findings + open TODO** (read this first)
- [`DESIGN-epub-validate-refactor-2026-06-23.md`](DESIGN-epub-validate-refactor-2026-06-23.md) — architecture
- [`PLAN-epub-validate-refactor-2026-06-23.md`](PLAN-epub-validate-refactor-2026-06-23.md) — tracked gates

## TODO

- [ ] Defer text-content extraction (Gate 10B) — raw spine bytes already agree
      across all parsers; only revisit if a downstream need appears.
- [ ] Validate TOC → content through the parser itself (resolve nav hrefs
      against manifest/spine) — would resolve the TOC href-baseline ambiguity.
- [ ] Maintain the problematic-books inventory (candidates for fixing the EPUB
      rather than our code) — see FINDINGS.
- [ ] Investigate the 18 Storyteller "could not read the package document"
      failures (not EPUB 2; both epub.ts paths open them).
- [ ] Investigate the epubts-node jsdom fallback (9 books) — consider forcing
      jsdom always and dropping the LinkeDOM-first hybrid.
- [ ] Directory move: `epub-split/inspect/` → `epub-validate/` (+ rename
      package, settle test-books location). Planned separately.

## Context

The end goal is a **global EPUB parsing approach** for downstream audiobook
alignment work. That parser must run in **Node/Bun only** — invoking a browser
at runtime is not acceptable for the real pipeline.

This experiment presents a three-way comparison, but it is really **two pairs
with different purposes**:

- **epub.ts browser vs epub.ts node** — the browser path is used here *only* to
  bypass LinkeDOM and serve as a trusted reference, confirming our Node/Bun-only
  parsing is truly equivalent. We carry this comparison until we are satisfied —
  likely once we have extracted the spine and actual chapter content. The browser
  is a verification tool, not part of the target pipeline.

- **epub.ts node vs storyteller (@storyteller-platform/epub)** — Storyteller is
  compared because that project has a full alignment solution we may want to
  interoperate with. The goal is to validate whether the two are interchangeable,
  and if not, why not. Storyteller is constrained (by default) to EPUB 3, though
  its EPUB 2-to-3 up-conversion facility may give us some leeway.

## Setup

```bash
bun install
```

## Run

```bash
bun run inspect
```

The run processes every configured root and parser path and replaces the
current reports only after successful completion.

## Browser bundle (`build:browser`)

`bun run inspect` first runs `build:browser`, then the inspector:

```bash
bun build src/browser/entry.ts --target=browser --format=iife \
  --outfile=dist/epubts-browser.js
```

The `epubts-browser` parser path must exercise epub.ts against a **real
browser DOM**, not the Node/LinkeDOM path. To do that, the inspector launches
Chromium (via Playwright) and injects a script into the page. `build:browser`
produces that script: it bundles `src/browser/entry.ts` — which imports
`@likecoin/epub-ts` (the browser build), never `@likecoin/epub-ts/node` — into a
single self-contained IIFE for a browser target. The bundle exposes one narrow
function, `globalThis.epubInspect.transport`, that the host calls inside the
page.

The output, `dist/epubts-browser.js`, is generated (git-ignored) and rebuilt on
every run, so it never goes stale. Before launching, `verifyBrowserBundle`
asserts the bundle contains no LinkeDOM and no `node:` imports — the guarantee
that this path is genuinely browser-side. Run it on its own with:

```bash
bun run build:browser
```

See:

- [FINDINGS-epub-validate-2026-06-24.md](FINDINGS-epub-validate-2026-06-24.md)
  for the consolidated findings, problematic-books inventory, and open TODO.
- [DESIGN-epub-validate-refactor-2026-06-23.md](DESIGN-epub-validate-refactor-2026-06-23.md)
  and [PLAN-epub-validate-refactor-2026-06-23.md](PLAN-epub-validate-refactor-2026-06-23.md)
  for the schema-first architecture and tracked gates.

Historical (the three-parser feasibility experiment, 2026-06-19 → 06-22, now
superseded; git retains the detail):

- [DESIGN-three-parser-inspect-2026-06-19.md](DESIGN-three-parser-inspect-2026-06-19.md),
  [PLAN-three-parser-inspect-2026-06-19.md](PLAN-three-parser-inspect-2026-06-19.md).
