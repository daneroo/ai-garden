# epu-split

Trying to extract structure, then content from epub ebook files.

We are using `epubjs` as this is what the audiobookshelf client uses, but it's not working well outside the browser, and subtle difference between node 16 and 18. (Buffer, ArrayBuffer, Blob, assert,..)

As a fallnack we have added `epub-parser` which doesn;t do as much, but is meant for node.

Objectives (for now):

- [x] extract TOC structure
- [ ] extract First sentences from each "chapter"
