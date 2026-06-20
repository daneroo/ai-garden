# EPUB Inspect

Three-path EPUB inspection experiment covering the complete `test`, `drop`,
and `space` corpora.

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

- [DESIGN-three-parser-inspect-2026-06-19.md](DESIGN-three-parser-inspect-2026-06-19.md)
  for the architecture, evidence model, and feasibility-gate rationale.
- [PLAN-three-parser-inspect-2026-06-19.md](PLAN-three-parser-inspect-2026-06-19.md)
  for implementation, evidence, review, and approval status.
- [FINDINGS-three-parser-inspect-2026-06-19.md](FINDINGS-three-parser-inspect-2026-06-19.md)
  for evidence and conclusions recorded at each gate.
