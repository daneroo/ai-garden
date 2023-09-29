import { walk } from "@root/walk";
import { basename, extname } from "node:path";
import { promises as fs } from "node:fs";
// import ePub from "epubjs";
import { Book } from "epubjs";
import { parseEpub } from "@gxl/epub-parser";

// until we resolve epubjs issues from node.
const useEpubParser = true;

const defaultRootPath =
  "/Users/daniel/Library/CloudStorage/Dropbox/A-Reading/EBook";
// const defaultRootPath = "/Volumes/Reading/audiobooks/";

await main();

async function main() {
  console.log(
    `# Extracting structure and content of ePub books with ${
      useEpubParser ? "epub-parser" : "epubjs"
    }\n`
  );
  console.log(`Searching books in ${defaultRootPath}...`);
  const bookPaths = await findBookPaths(defaultRootPath);
  console.log(`Found ${bookPaths.length} books.`);

  // find any books with a matching name (case insensitive)
  const matchingBookPaths = bookPaths.filter((book) => {
    const regex = /two towers/i;
    // const regex = /space 01/i;
    return regex.test(book);
    // return true || regex.test(book);
  });
  console.log(`Found ${matchingBookPaths.length} matching books.`);
  for (const bookPath of matchingBookPaths) {
    console.log(`\n## ${basename(bookPath)}\n`);
    try {
      if (useEpubParser) {
        const toc = await getEPubParserTOC(bookPath);
        showEPubParserTOC(toc);
      } else {
        const toc = await getTOC(bookPath);
        showTOC(toc);
      }
    } catch (error) {
      console.error("MyCatch: Error:", error.message);
    }
  }
}

function showEPubParserTOC(toc, level = 0) {
  // These are the (nested elements) of the (await parseEpub())?.structure
  // {
  //   "name": "BOOK THREE",
  //   "path": "Text/part0005.html",
  //   "playOrder": "4",
  //   "children": [
  //     {
  //       "name": "CHAPTER 1: THE DEPARTURE OF BOROMIR",
  //       "path": "Text/part0006.html",
  //       "playOrder": "5"
  //     }
  // }
  if (!toc || !Array.isArray(toc)) {
    return;
  }

  toc.forEach((item) => {
    // print the indented title of the item *trimmed* (remove leading and trailing whitespace)
    const indent = " ".repeat(level * 2);
    console.log(`${indent}- ${item?.name} (#${item?.playOrder})`);
    if (item.children) {
      showEPubParserTOC(item.children, level + 1);
    }
  });
}
async function getEPubParserTOC(bookPath) {
  const epubObj = await parseEpub(bookPath, {
    type: "path",
  });
  // console.log("epubObj:", epubObj);
  // console.log("TOC :", epubObj.structure);
  // {
  //   "name": "BOOK THREE",
  //   "path": "Text/part0005.html",
  //   "playOrder": "4",
  //   "children": [
  //     {
  //       "name": "CHAPTER 1: THE DEPARTURE OF BOROMIR",
  //       "path": "Text/part0006.html",
  //       "playOrder": "5"
  //     }
  // }

  // console.log("epubObj", epubObj);

  // ****
  // Exploring the sections and markdown content
  // ****
  // console.log("book info", epubObj.info);
  // console.log("the book has", epubObj.sections.length, "sections");
  // console.log(epubObj.sections);
  // console.log(epubObj.sections[0]);
  // const showSection = (idx) => {
  //   const section = epubObj.sections[idx];
  //   console.log(`-------- section index ${idx} (id=${section?.id}) --------`);
  //   console.log(section);
  //   console.log("toMarkdown");
  //   console.log(epubObj.sections[idx].toMarkdown());
  //   // console.log('toHtmlObjects')
  //   // const htmlObjects = epubObj.sections[idx].toHtmlObjects()
  //   // console.log(htmlObjects)
  // };

  // showSection(2);

  return epubObj?.structure;
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
  await book.opened;
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

/**
 * Finds all books in the specified directory and its subdirectories.
 * @param {string} rootPath - The root directory to search for books.
 * @returns {Promise<Array<string>>} - A promise that resolves to an array of book file paths.
 */
async function findBookPaths(rootPath) {
  /**
   * An array of file paths.
   * @type {Array<string>}
   */
  const files = [];

  // use @root/walk to find all .epub files in the rootPath (recursively)
  const walker = async (err, pathname, dirent) => {
    if (err !== null && err !== undefined) {
      // throw an error to stop walking (or return to ignore and keep going)
      console.warn("fs stat error for %s: %s", pathname, err.message);
      return false;
    }
    if (dirent.isDirectory()) {
      return true;
    } else if (dirent.isFile()) {
      const extension = extname(pathname);
      if (extension === ".epub") {
        files.push(pathname);
      }
    }
    return false;
  };
  await walk(rootPath, walker);
  return files;
}
