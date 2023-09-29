import { walk } from "@root/walk";
import { basename, extname } from "node:path";
import { show as showEpubJS } from "./lib/epubjs-playwright.mjs";
import { show as showEPubParser } from "./lib/epub-parser.mjs";

// until we resolve epubjs issues from node.
const useEpubParser = false;

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
        await showEPubParser(bookPath);
      } else {
        await showEpubJS(bookPath);
      }
    } catch (error) {
      console.error("MyCatch: Error:", error.message);
    }
  }
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
