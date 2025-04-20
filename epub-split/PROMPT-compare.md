# Prompt for TOC Compare

## Context

- I am parsing **EPub** files using two different parsers (lingo‑reader and epubjs).
- I wish to compare the results of the two parsers.
- I will eventually compare **all aspects** of the data structures (metadata, manifest, spine, toc, …).
- We will first concentrate on the TOC (Table of Contents).
- The TOC is a list of all the chapters/sections in a book
  - It is a tree structure
- It is not sufficient to decide if the two Toc's are identical
  - we wish to break down criteria to be more fine grained, to report more specific differences

## General coding style

- The code is TypeScript and functional (no classes).
- When you write functions, always put **calling code before called code**.
- Always use proper `function (){}` syntax, not arrow functions.
- Logic and presentation **must be separated**:
  - `compareXXX` → **pure** comparison logic, no console output.
  - `showXXX` → presentation layer (console, UTF‑8 ✓/✗, never emojis).
- Tiny re‑usable helpers (e.g. `_showListItem`) are allowed inside *showXXX*.

## Normalization rules

- TOC entries are normalized as follows:
  - href:
    - Remove `epub:` prefix - lingo‑reader already does this; epubjs doesn’t
    - Strip container root (`OEBPS/`, `OPS/`, `EPUB/`) by taking basename
  - label:
    - Trim leading/trailing whitespace and collapse internal whitespace (`\s+` → single space)

## Comparison axes

Implement at least the following:

- Label‑set comparison
- Href‑set comparison
- Label‑order comparison – After dropping non‑common labels; report index + differing labels.
- Tree‑structure comparison – If one TOC is fully flat (depth 0) and the other nested, show a concise summary; otherwise list per‑label depth mismatches.
- Id-set comparison
- PlayOrder comparison
- Feel free to add more (ids, playOrder) later.

## Presentation requirements

- Each section begins with a one‑line summary, e.g. `Label set comparison (3 differences):`.
- Long diff lists are truncated: show first **N** lines (default 15) then `… n more`.
- Use UTF‑8 `✓` and `✗` markers never emojis.

## Configuration interface

```ts
interface CompareOptions {
  maxLines?: number;       // default 15
  normalizeHref?: boolean; // default true
  normalizeLabel?: boolean;// default true
}
```

Public API:

```ts
export function compareToc(
  tocLingo: Toc,
  tocEpubjs: Toc,
  options?: Partial<CompareOptions>
): void;
```

## TOC data structure

```ts
export interface TocEntry {
  id: string;       // unique identifier
  href: string;     // resource path
  label: string;    // display text
  playOrder?: string;
  children?: TocEntry[];
}
export type Toc = TocEntry[];
```

## Required implementation outline

1. `flattenToc` – depth‑first traversal returning `{ id, href, label, depth }[]` with normalization applied.
2. `compareLabelSet` / `showLabelSetDiff`
3. `compareHrefSet` / `showHrefSetDiff`
4. `compareLabelOrder` / `showLabelOrderDiff`
5. `compareTreeDepth` / `showDepthDiff`
6. Helper utilities: `summary`, `list`, `ok`, `fail`.

## Starter stub

```ts
import { Toc } from "./types";

export function compareToc(
  tocLingo: Toc,
  tocEpubjs: Toc,
  options: Partial<CompareOptions> = {}
): void {
  // 1. Flatten & normalize
  // 2. Run compareXXX helpers
  // 3. Run showXXX helpers
}
```
