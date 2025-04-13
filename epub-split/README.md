# epub-split

## Objectives

- Trying to extract structure, then content from epub ebook files.
- Need to validate epub concepts: spine, toc, reading order, links (internal, etc)

## Libraries

- `epubjs`: (last commit 2 years ago) We are using this as this is what the audiobookshelf client uses, but it's not working well outside the browser, and subtle differences between node 16 and 18. (Buffer, ArrayBuffer, Blob, assert,..)
- `@lingo-reader/epub-parser`: (actively maintained and developed) This is a fully typescript implementation, has tests, and is well maintained.
- `@gxl/epub-parser`: (last commit 4 years ago) Deprecated- we are dropping this!

## Development Objectives

- refine error strategy
  - anything that fatal to parsing: throw - should not be captured in ParserResult
  - categorize warnings: add to ParserResult.warnings
- [x] capture all error in epub parsing (3 corpuses)
  - [x] epubjs
  - [x] lingo
- [ ] add spine and guide: just because guide is required, but I don't know why!
- [x] setup multiple parser implementations
  - [x] make an interface to each implementation so we can compare them
- [x] extract TOC structure
- [ ] extract First sentences from each "chapter"
  - [ ] epubjs works for Two Towers, but not Pax
  - [ ] epub-parser has content (markdown) in sections, but _I_ cannot link spine(structure) to sections(content)

## References

- [epubjs ^0.3.93](https://github.com/futurepress/epub.js)
- [@lingo-reader/epub-parser](https://github.com/hhk-png/lingo-reader/blob/main/packages/epub-parser/README.md)
- [@gxl/epub-parser ^2.0.4 (deprecated)](https://github.com/gaoxiaoliangz/epub-parser)
