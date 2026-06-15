# EPUB Indexing for Audio-Synced Highlighting

Date: 2026-06-15
Status: design discussion, not yet implemented

## Context

The `epub-split` project began as a multi-parser comparison harness whose
purpose was to prove that a Node-only parser (`@likecoin/epub-ts` + `linkedom`)
reproduces the browser `epubjs`-via-Playwright behavior we depend on. That
validation is complete (see `FINDINGS-epub-ts-2026-06-14.md`): epub.ts is
equivalent or better across the `test`, `space`, and `drop` corpora.

The comparison machinery was always scaffolding. This document describes the
actual downstream use the parser exists to serve, and the addressing scheme that
use requires.

## The Real Aim

Read-along highlighting: given an audiobook and its EPUB, **highlight the word
currently being narrated, in an EPUB viewer, in sync with audio playback.**

The timing comes from a Whisper transcription of the audiobook. The viewer is
EPUB-CFI-capable. A secondary use is matching against the Whisper transcript,
which operates on normalized text.

So the artifact we ultimately produce, per book, is a time-driven map:

```
[ { tStart, tEnd, address }, … ]
```

At playback time `T`, find the interval containing `T` and highlight the word at
`address`. Time is the query key; the address is the payload. The unit under
test is therefore:

```
timecode-interval  →  highlight-target
```

Everything upstream (Whisper, text alignment, extraction) is just how we
*populate* that map. Everything downstream (the viewer) just *queries* it.

## The Problem

What is `address`? It must:

1. Point at a specific word (a character range), not just an element.
2. Resolve correctly in the viewer's DOM at highlight time.
3. Be reproducible: the address computed during indexing must select the same
   word when resolved during rendering.

Requirement 3 is the hard one, and it is where the choice of scheme lives.

### Spine vs TOC

A prerequisite clarification, because the two are routinely conflated:

- **Spine** is the authoritative, complete, linear reading order. Every content
  document is in the spine. It is the traversal backbone for text extraction.
- **TOC** (nav doc / NCX) is a curated, possibly partial, possibly nested set of
  *pointers into* the spine. It is a label/segmentation layer, not a content
  layer.

Extraction traverses the **spine**; the TOC is used only to segment and label.
Traversing by TOC silently drops content the TOC does not reference (front
matter, interstitials). One decision to make explicit: whether `linear="no"`
spine items (footnote pages, popups) are included in the linear text stream.

## Approaches Considered

### 1. EPUB CFI (Canonical Fragment Identifier)

A CFI is the spec's own addressing scheme: a path of child-index steps plus a
character offset, e.g. `epubcfi(/6/4[chap01]!/4/2/1:6)`. `@likecoin/epub-ts`
ports epub.js's full CFI implementation:

- `Section.cfiFromRange(range)` / `EpubCFI.fromRange(...)` — build a CFI from a
  DOM Range (the write side: word → CFI).
- `EpubCFI.toRange(doc)` — resolve a CFI back to a DOM Range (the read side, and
  the round-trip validator).
- `EpubCFI.compare(a, b)` — ordering, useful for monotonicity checks.
- Implements Character Offset and Simple Ranges; deliberately omits Temporal
  (`~`) and Spatial (`@`) offsets, which we do not need (we keep timing in our
  own `tStart`/`tEnd`).

**Strength:** standard; CFI-capable viewers already speak it (interop for free).

**Weakness:** a CFI is an address into a *tree*, not into text. It is meaningful
only relative to a specific DOM. The same XHTML bytes can parse into different
trees in different engines:

- whitespace text nodes kept by one engine, merged/dropped by another, shift
  every sibling index below them;
- HTML parsing inserts a `<tbody>` into tables that XML/XHTML parsing does not,
  so every CFI through a table is off by a whole level.

When the indexer (linkedom) and the viewer (a browser) build different trees
from the same file, an identical CFI string selects different content.
**CFI failures are silent** — it highlights the wrong word with no error.

### 2. Character offset into the extracted linear text (preferred)

Instead of a structural path, address text by its position in the **flattened
text stream**: walk the spine documents in order, walk text nodes in document
order, concatenate their content, and address a word as a `[start, end)`
character range in that stream.

To resolve, the consumer re-walks its own DOM the same way and bisects a small
segment table (offset → text node) to recover a `Range`.

**Why this is better for our case:** the structural divergences that break CFI
(`<tbody>` insertion, whitespace node positions, nesting depth) **vanish under
concatenation** — flattening erases the tree. We trade "the trees must be
isomorphic" (often false) for "the text must be equal" (almost always true).

Two refinements that come naturally:

- **Word ordinal** ("the Nth word") is a coarser view derived by tokenizing the
  stream. The char offset is preferred as the storage key because it is finer
  *and* requires a weaker agreement: an offset needs only walk-order agreement,
  whereas a word ordinal additionally requires agreement on what a word is.
- **Key on normalized text.** `textContent` preserves raw inter-tag whitespace,
  the one part of the stream that can differ across engines. Define the key
  against normalized (whitespace-collapsed) text, and let each consumer keep its
  own local `normalized → raw` offset map built during its own walk. This is the
  same normalization Whisper alignment already needs — one normalization, reused
  as the addressing basis.

### Rejected: character range in the source XHTML bytes

Tempting because the file bytes are immutable, but **not resolvable in the
viewer**: browser (and most) parsers discard source byte positions when building
the DOM. There is no API to map "source offset 4521" to a DOM node without
shipping a position-preserving parser into the viewer.

## The textContent Reproducibility Assumption

The preferred scheme reduces to one assumption: **given the same XHTML bytes,
two engines produce the same character stream when text-node content is
concatenated in document order.**

This is far weaker and safer than CFI's tree-isomorphism assumption, but it is
not unconditional. Where it can fail, in order of concern:

1. **Whitespace.** `textContent` does not collapse whitespace and engines can
   differ by a character. *Mitigation:* key on normalized text; the class
   disappears.
2. **`<script>`/`<style>`/`<head>`.** `textContent` includes them. *Mitigation:*
   use a filtered walk that skips them, applied identically on both ends. A
   walk-rule decision, not a reproducibility risk.
3. **Malformed documents.** Error recovery differs between engines, so streams
   can genuinely diverge. The corpus already exhibits this (the ~8
   "reference bug fixed by candidate" books). Well-formed: safe. Malformed: not
   guaranteed — these become a flagged exception list.
4. **Hidden content** (`display:none`): `textContent` includes it. Safe as long
   as both ends use textContent-style extraction and neither sanitizes; a
   problem only if one side uses `innerText` or strips content.

The decisive advantage over CFI: **failures are detectable, not silent.** If the
streams diverge you can diff them and find the exact location; it surfaces as an
alignment break or text mismatch. A wrong CFI just quietly highlights the wrong
word.

## Where the Matching Runs

The cross-engine divergence risk exists only because addressing (indexer) and
rendering (viewer) happen in two different DOMs that must agree. **Moving address
resolution into the viewer at book-load time eliminates the second DOM** — the
thing highlighted is computed against the exact tree that renders it.
Reproducibility becomes tautological rather than verified.

This enables shipping a **DOM-independent key** (normalized char offset / word
ordinal) instead of a CFI, and resolving it locally:

```
server ships:   (tStart, tEnd  →  spineIndex + normalized char range)
viewer at load: walk its own DOM → tokenize → build normalized→raw map
                → resolve range → DOM Range → highlight
```

What stays server-side is the heavy, DOM-independent work:

- **Whisper** (audio → timed words) — never needed a DOM.
- **Alignment** (Whisper words ↔ book words) — pure text, done once. This is
  fuzzy, gap-tolerant sequence alignment, since narration and text are not
  character-identical (skipped front matter, spoken "Chapter One", dropped or
  reordered footnotes, occasional abridgement). Keep it mentally separate:
  extraction+addressing is deterministic and provably correct; alignment is
  statistical and tuned.

Only the light final join moves client-side. Cost is small: parsing is already
~0.06s/book; tokenizing and lazily building Ranges for the current chapter is
milliseconds. No `cfiFromRange`/`toRange` cost at all, because we no longer
transport structural addresses.

The contract shrinks to one thing we fully control: **a deterministic
tokenizer/walk rule, shipped as the same code to both ends.** Same function,
same input text, same output offsets — a far smaller, more auditable surface
than "two third-party DOM engines must count nodes identically."

This requires **owning the viewer** (to run the walk + highlight in it). The
same condition governs the id-injection question below.

## Highlighting Without DOM Mutation

Existing read-along viewers (Storyteller, Elevenreader) typically pre-process the
EPUB to inject `<span id=…>` around segments. That solved two problems at once:

1. **Addressing** — an id gives `getElementById`, O(1) and unambiguous.
2. **Rendering** — historically the only cross-browser way to color a sub-string
   of a text node was to split it and wrap it in a styleable element.

The **CSS Custom Highlight API** (`Highlight`, `CSS.highlights`,
`::highlight()`) eliminates problem 2: build a `Range`, register it, style it,
and the browser paints it **without touching the DOM** — no span, no id. The
historical reason for injection is gone; those viewers largely predate the API
shipping broadly.

Id injection also provided a third thing: **immunity to tree divergence** (an id
resolves the same regardless of how the tree is counted). But if we own the
viewer and resolve a text-offset key against the viewer's own DOM, there is no
second tree to diverge from — so id injection buys nothing, and the book stays
pristine. If the Highlight API is unavailable, a fallback is to *transiently*
wrap only the current word and remove it when playback moves on; the stored book
is never mutated.

## Content Model: Measure, Do Not Assume

It is tempting to assume "all text is in level-1 `<p>`." This is too strong.
Real trade EPUBs wrap content in `<div>`/`<section>`, and put narrated text in
`<h1>`–`<h6>`, `<li>`, `<blockquote><p>`, `<td>`, `<figcaption>`, `<aside>`, and
verse blocks, with inline markup (`<em>`, `<a>`, `<sup>`, `<span>`, `<br>`)
splitting text within a block.

Two points:

- The addressing scheme **does not need** this assumption — the flatten-walk is
  structure-agnostic, so container shape is irrelevant to correctness.
- Acting on a too-tight assumption is actively dangerous: if the walk skips text
  the narrator actually reads (chapter titles, epigraphs, lists), the linear
  stream desyncs from Whisper and every subsequent offset is wrong. The walk
  must be **inclusive** of all narrated text; content-model knowledge is used
  only to decide what to carefully and *symmetrically* exclude (page numbers,
  running heads, hidden nav).

Since parsing is essentially free, turn the assumption into data: per text node,
record its nearest block ancestor and depth, and histogram across the library.
This yields the actual content model ("97% of text in `{p, h1–h6, li,
blockquote}`, max depth 4, here are the 9 outliers") and hands you the exception
list directly.

## Validation Strategy (Full e2e)

The validation stratifies into three layers, each proving a distinct claim.
Together they constitute the end-to-end confirmation, run across multiple
browsers and the full library.

### Layer 1 — Self-consistency (no browser)

The shared tokenizer/walk + `normalized → raw` map round-trips within a single
engine (linkedom): every word's range resolves back to that word.

```
for each spine section:
  doc = load(section)
  for each text node, in order:
    for each word in node:
      range = makeRange(node, wordStart, wordEnd)   // start == end container
      key   = offsetOf(range)                        // forward
      back  = resolve(key, doc)                      // inverse
      assert  rawTextOf(back) === word               // compare RAW, exact
```

Notes: compare raw substrings (normalize neither side); keep words within a
single text node; keep walk/filter rules identical on both directions. Bonus
from the same pass: confirm offsets are monotonically non-decreasing in walk
order (the "reading order is acceptable" invariant), and the same loop that
validates is the loop that *produces* the word → address map.

Catches our own bugs. Runs over the whole library in minutes; embarrassingly
parallel per book.

### Layer 2 — Cross-engine text equality (the actual assumption)

Per book, diff the normalized, filtered text stream produced by the indexer
(linkedom) against the stream produced by each **browser** engine. This directly
tests the textContent reproducibility assumption against the engines we ship on.
Every failure is a readable diff, so this run *produces the malformed-book
exception list* rather than hiding drift.

### Layer 3 — End-to-end highlight

Feed a `(time → range)` entry into the real viewer, resolve range → `Range` →
Highlight, and assert it lands on the intended word. Sample across the library
plus seeded edge cases.

### Multiple browsers

Layers 2 and 3 must run on Chromium, WebKit, and Gecko, which differ in both
parsing (layer 2) and highlight rendering (layer 3).

Note: **Playwright is the right harness for this.** The tool being retired as
the *parser reference* is exactly the tool to keep as the *cross-browser viewer
validator*. Its role flips. Removing epub.js (the parser) and removing Playwright
(the test driver) are therefore two separate decisions with different answers —
drop the first, keep the second for a new purpose.

### Edge cases to seed deliberately

Most already surfaced by the corpus:

- tables (the `<tbody>` case), nested inline (`Sara<i>jevo</i>`), heavy
  whitespace
- the ~8 malformed books (Sacks head-markup-as-text, the control-char Unicode
  cases in Browder and Butcher)
- the legacy `opf:` prefix books, the Druon missing-resource book, the Pratchett
  unserializable book
- entities / `&nbsp;`, CDATA, comments, RTL

## Performance Notes

- Full parse + chapter content extraction over `space` (588 books) measured at
  ~34s with Bun, avg ~0.06s/book. Parsing the whole corpus is ~1 minute and is
  effectively free.
- A CFI-based round-trip would have added ~80,000 words/book × `cfiFromRange` +
  `toRange`. At an estimated 30–80µs each, ~30–70 min single-threaded for 1,000
  books, minutes when parallel. The text-offset scheme avoids this cost entirely
  at runtime.
- A 300-page book is roughly 80,000–100,000 words.

## Open Questions

- Confirm the viewer engine(s) and whether we own the rendering end (governs
  text-offset-vs-CFI and the id-injection question).
- Decide `linear="no"` handling in the linear text stream.
- Decide the exact normalization rule (the shared tokenizer contract).
- Decide what non-narrated text to exclude, kept symmetric across ends.
</content>
</invoke>
