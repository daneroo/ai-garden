# epu-split

Trying to extract structure, then content from epub ebook files.

We are using `epubjs` as this is what the audiobookshelf client uses, but it's not working well outside the browser, and subtle difference between node 16 and 18. (Buffer, ArrayBuffer, Blob, assert,..)

As a fallback we have added `epub-parser` which doesn't do as much, but is meant for node.

Objectives (for now):

- [x] extract TOC structure
- [ ] extract First sentences from each "chapter"

## References

- [epubjs ^0.3.93](https://github.com/futurepress/epub.js)
- [@gxl/epub-parser ^2.0.4](https://github.com/gaoxiaoliangz/epub-parser)
