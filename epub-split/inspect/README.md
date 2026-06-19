# EPUB Inspect

Three-path EPUB inspection experiment covering the complete `test`, `drop`,
and `space` corpora.

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
