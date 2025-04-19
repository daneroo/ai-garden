# Prompt for TOC Compare

- I am parsing EPub files using two different parsers (lingo-reader and epubjs)
- I wish to compare the results of the two parsers
- I will eventually compare all aspects of the data structures (metadata, manifest, spine, toc,...)
- We will first concentrate on the TOC: Table of Contents
- We are using Typescript in a functional style (no classes)
- We wish to separate the logic of the comparison from it's presentation
- The TOC is a list of all the chapters/sections in a book
  - It is a tree structure
- It is not sufficient to decide if the two Toc's are identical
  - we wish to break down criteria to be more fine grained, to report more specific differences
- You may use multiple function to implement this
- If you use multiple functions all ways put calling code before called code.
- use the prefix showXXX for presentation functions
- use the prefix compareXXX for comparison functions
- you may make use of reuseable auxiliary function (flatten, extractField, etc.)
- in the showXXX functions you can also make use of auxiliary functions for similar output utility
  - e.g. _showListItem(checkOrXmark, label,depth)
  - you may use utf-8 symbols for check/x marks, but never emojis
- You may want to compare the ids, labels, hrefs idepentantly first.
- You should include these specific normalization transformations:
  - href: remove "epub:" prefix (lingo does this, epubjs does not)
  - href: strip common container root directories (OEBPS/, OPS/, EPUB/) – simple rule: take the basename
  - label: trim leading and trailing whitespace
- Validation should therefore be broken down into separate comparisons, both for logic and presentation, for example, but not limited to (you may propose others):
  - label Set comparison
  - href Set comparison
  - label order comparison accounting for missing labels (should indicate where missing labels should go)
  - label tree structure comparison
- You should be smart about comparisons, for example, if you know that there is a missing label in one of the toc's, you can account for this in the label order comparison.

e.g.:

```typescript
function callingFunction() {
  const result = calledFunction();
  return result;
}

function calledFunction() {
  return "result";
}
```

## TOC data structure

```typescript
/**
 * Represents a single entry in the table of contents
 */
export interface TocEntry {
  /** Unique identifier for the TOC entry */
  id: string;
  /** Resource path or reference */
  href: string;
  /** Display text of the TOC entry */
  label: string;
  /** Reading order sequence (from lingo-reader) */
  playOrder?: string;
  /** Nested sub-entries */
  children?: TocEntry[];
}

/**
 * Table of contents as an array of entries
 */
export type Toc = TocEntry[];
```

Please write a `compare.ts` file that compares the two TOC data structures.
Include a detailed plan of the implementation design.

```typescript
import { Toc } from "./types";

export function compareToc(tocLingo: Toc, tocEpubjs: Toc): void {
  // TODO: Implement the comparison logic
  // compare the label entries in the flattened toc's symmetric differences
  //   e.g. labels lingo only: {Table of Contents} epubjs only: {} 

  // TODO: Present the results.
}
```