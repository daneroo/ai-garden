import { promises as fs } from "node:fs";
import { basename, extname } from "node:path";
import { Book } from "epubjs";

export async function show(bookPath) {
  const toc = await getTOC(bookPath);
  showTOC(toc);
}

function showTOC(toc, level = 0) {
  // {
  //   "id": "8a3b7da4-92e6-45e8-b523-8b018dc12000",
  //   "href": "Text/part0030.html",
  //   "label": "\r\n        COPYRIGHT\r\n      ",
  //   "subitems": []
  // }
  toc.forEach((item) => {
    // print the indented title of the item *trimmed* (remove leading and trailing whitespace)
    const indent = " ".repeat(level * 2);
    console.log(`${indent}- ${item.label.trim()} (${item?.href})`);
    if (item.subitems) {
      showTOC(item.subitems, level + 1);
    }
  });
}

/**
 * Splits the specified book into chapters and saves them as separate files.
 * @param {string} bookPath - The path of the book file to split.
 * @returns {Promise<void>} - A promise that resolves when the book has been split into chapters.
 */
async function getTOC(bookPath) {
  // var book = new Book(bookPath);
  // const bookBuffer = await fs.readFile(bookPath);
  const buffer = await fs.readFile(bookPath);
  const bookBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
  console.log(`debug:Buffer (${buffer.byteLength}) ${basename(bookPath)}`);
  const book = new Book(bookBuffer);
  // console.log(`book`, book);
  await book.opened;
  console.log("I never got here");
  await book.loaded.navigation;

  // console.log("book", book);
  // console.log("spine", book.spine);
  // console.log("package", book.package);
  // navigation
  // console.log("navigation", book.navigation);
  // console.log("navigation.toc", JSON.stringify(book.navigation.toc, null, 2));
  const toc = book.navigation.toc;
  return toc;
}
