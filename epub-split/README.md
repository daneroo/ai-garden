# epub-split

## Objectives

- Trying to extract structure, then content from epub ebook files.
- Need to validate epub concepts: spine, toc, reading order, links (internal, etc)

## Libraries

- `epubjs`: (last commit 2 years ago) We are using this as this is what the audiobookshelf client uses, but it's not working well outside the browser, and subtle differences between node 16 and 18. (Buffer, ArrayBuffer, Blob, assert,..)
- `@lingo-reader/epub-parser`: (actively maintained and developed) This is a fully typescript implementation, has tests, and is well maintained.
- `@gxl/epub-parser`: (last commit 4 years ago) Deprecated- we are dropping this!

## Development Objectives

- [ ] use createProgress on stderr (show.ts)
- [ ] look at [zod v4](https://v4.zod.dev/v4) - z.prettifyError?
- [ ] look at [markitdown epub converter](https://github.com/microsoft/markitdown/blob/main/packages/markitdown/src/markitdown/converters/_epub_converter.py)
- [ ] consider fresh for ui instead of error reporting?
- refine error strategy
  - anything that fatal to parsing: throw - should not be captured in ParserResult
  - categorize warnings: add to ParserResult.warnings
- [x] capture all error in epub parsing (3 corpora)
  - [x] epubjs
  - [x] lingo
- [ ] add spine and guide: just because guide is required, but I don't know why!
- [x] setup multiple parser implementations
  - [x] make an interface to each implementation so we can compare them
- [x] extract TOC structure
- [ ] extract First sentences from each "chapter"
  - [ ] epubjs works for Two Towers, but not Pax
  - [ ] epub-parser has content (markdown) in sections, but _I_ cannot link spine(structure) to sections(content)

## Usage (Development)

```bash
# unzip a book into data/ebooks/slog-of-book/
time pnpx tsx index.ts -r space --unzip -s Real.epub
```

```bash
time pnpx tsx index.ts -r space -p compare -v | tee coco.md | gum format
time pnpx tsx index.ts -r space -p compare | tee coco.md | gum format

time pnpx tsx index.ts -r space -p compare
time pnpx tsx index.ts -r drop -p compare

time pnpx tsx index.ts -p lingo -r drop --summary > data/summary.lingo.drop.md
time pnpx tsx index.ts -p lingo -r space --summary > data/summary.lingo.space.md

time pnpx tsx index.ts -p epubjs -r drop --summary > data/summary.epubjs.drop.md
time pnpx tsx index.ts -p epubjs -r space --summary > data/summary.epubjs.space.md
```

## Compare TOC

To compare and validate that two TOCs are the same, we divide the problem thus:

A toc is defined as {id, label, href, children[]}

- flatten the tree structure of each toc:
  - each entry becomes {id, label, href, depth}
  - implemented in flattenToc

- compare the sets of labels
  - find labels present in one TOC but not the other
  - implemented in compareLabelSet and diffToWarnings
  - ✓ handles missing labels
  - ✗ does not yet handle duplicate labels

- compare the sets of hrefs
  - find hrefs present in one TOC but not the other
  - implemented in compareHrefSet and diffToWarnings
  - ✓ handles missing hrefs
  - ✗ does not yet handle duplicate hrefs

- compare the order of labels
  - verify that common labels appear in the same sequence
  - implemented in compareLabelOrder
  - ✓ handles mismatched order
  - ✗ does not yet verify href order matches label order

- compare the depth of the tree
  - check that common labels have the same nesting level
  - implemented in compareTreeDepth
  - ✓ handles flat vs nested and mismatched depths
  - ✗ does not yet verify tree structure isomorphism

The comparison is considered successful when all warnings are empty, indicating that:

- all labels and hrefs are present in both TOCs
- common labels appear in the same order
- common labels have the same nesting depth

## References

- [epubjs ^0.3.93](https://github.com/futurepress/epub.js)
- [@lingo-reader/epub-parser](https://github.com/hhk-png/lingo-reader/blob/main/packages/epub-parser/README.md)
- [@gxl/epub-parser ^2.0.4 (deprecated)](https://github.com/gaoxiaoliangz/epub-parser)
