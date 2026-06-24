# EPUB Validate

A parser-agnostic EPUB validation harness: it opens every book in the `test`,
`space`, and `drop` corpora with three independent parsers, captures a
Zod-validated `ParserOutput` (metadata, spine, manifest, per-item content
SHA-256, TOC tree), and produces a deterministic pairwise comparison report.

**Read first:**
[`FINDINGS-epub-validate-2026-06-24.md`](docs/FINDINGS-epub-validate-2026-06-24.md)
— consolidated findings and problematic-books inventory that inform the TODO
list below. Remove this notice once those TODOs no longer need that context.

## TODO

- [ ] Defer text-content extraction (Gate 10B) — raw spine bytes already agree
      across all parsers; only revisit if a downstream need appears.
- [ ] Validate TOC → content through the parser itself (resolve nav hrefs
      against manifest/spine) — would resolve the TOC href-baseline ambiguity.
- [ ] Maintain the problematic-books inventory (candidates for fixing the EPUB
      rather than our code) — see `docs/FINDINGS-epub-validate-2026-06-24.md`.
- [ ] Investigate the 18 Storyteller "could not read the package document"
      failures (not EPUB 2; both epub.ts paths open them).
- [ ] Investigate the epubts-node jsdom fallback (9 books) — consider forcing
      jsdom always and dropping the LinkeDOM-first hybrid.
- [ ] Static HTML report — replace file-tree output with a self-contained HTML
      view; defer if migrating to prosodio first.
- [ ] Markdown lint — enforce consistent formatting via `markdownlint` (CI +
      VSCode + fork-safe); align config so IDE and CI agree.
- [ ] Move loose config values (timeouts, concurrency limits, etc.) into
      `src/config.ts`.
- [ ] Migrate to `prosodio` monorepo — coordinate with whisper, match, align,
      and demo UI work; will touch many other things.

## Operations

```bash
bun install        # deps + Chromium (via postinstall)
bun run validate    # full corpus run: build browser bundle, then validate
bun run ci          # typecheck + test (run before committing)
```

`bun run validate` processes every configured root and parser path and replaces
the current reports only after successful completion (atomic swap). The corpus
roots are defined in [`src/config.ts`](src/config.ts) (`test` → `../test-books`,
`space` → a mounted volume, `drop` → a Dropbox path).

Individual scripts:

```bash
bun run typecheck      # tsc --noEmit
bun run test           # bun test
bun run build:browser   # rebuild the browser bundle only (see Setup)
```

## Setup

`bun install` is all that is required; the `postinstall` hook installs the
Chromium build Playwright needs. Dependencies are managed with Bun — add with
`bun add <pkg>` / `bun add -d <pkg>`.

### Browser bundle (`build:browser`)

The `epubts-browser` parser path must exercise epub.ts against a **real browser
DOM**, not the Node/LinkeDOM path. The inspector launches Chromium (via
Playwright) and injects a script into the page. `build:browser` produces that
script:

```bash
bun build src/browser/entry.ts --target=browser --format=iife \
  --outfile=dist/epubts-browser.js
```

It bundles `src/browser/entry.ts` — which imports `@likecoin/epub-ts` (the
browser build), never `@likecoin/epub-ts/node` — into a single self-contained
IIFE. The bundle exposes one narrow function, `globalThis.epubInspect.transport`,
that the host calls inside the page. The output `dist/epubts-browser.js` is
generated (git-ignored) and rebuilt on every `validate` run, so it never goes
stale. Before launching, `verifyBrowserBundle` asserts the bundle contains no
LinkeDOM and no `node:` imports — the guarantee that this path is genuinely
browser-side.

## Context

The end goal is a **global EPUB parsing approach** for downstream audiobook
alignment work. That parser must run in **Node/Bun only** — invoking a browser
at runtime is not acceptable for the real pipeline.

The three-way comparison is really **two pairs with different purposes**:

- **epub.ts browser vs epub.ts node** — the browser path is used *only* to
  bypass LinkeDOM and serve as a trusted reference, confirming our Node/Bun-only
  parsing is equivalent. It is a verification tool, not part of the target
  pipeline. (It has already earned its keep — it caught the node-path metadata
  entity-truncation bug and the Thud! TOC failure; see
  `docs/FINDINGS-epub-validate-2026-06-24.md`.)

- **epub.ts node vs storyteller (@storyteller-platform/epub)** — Storyteller has
  a full alignment solution we may want to interoperate with. The goal is to
  validate whether the two are interchangeable, and if not, why not. Storyteller
  is constrained (by default) to EPUB 3, though its EPUB 2-to-3 up-conversion
  facility may give some leeway.

### Documents

`docs/` holds active plans and designs. `docs/archive/` holds completed or
superseded plans, designs, and findings. Keep the live TODO in this README; move
supporting evidence or historical context into docs as it ages out of active
work.
