import yargs from "yargs/yargs";
import { walk } from "@root/walk";
import { extname, basename } from "node:path";

import { parse as parseEpubjs } from "./lib/epubjs-playwright.mjs";
import { parse as parseLingo } from "./lib/epub-parser-lingo.mjs";
import { showTOC, showSummary, compareToc } from "./lib/showToc.mjs";
import { exit } from "node:process";

// const defaultRootPath = "test-books";
// const defaultRootPath =
//   "/Users/daniel/Library/CloudStorage/Dropbox/A-Reading/EBook";
const defaultRootPath = "/Volumes/Space/Reading/audiobooks/";

try {
  await main();
  exit(0);
} catch (error) {
  console.error("Error:", error.message);
  exit(1);
}

async function main() {
  const argv = await yargs(process.argv.slice(2))
    .option("rootPath", {
      alias: "r",
      type: "string",
      demandOption: true,
      default: defaultRootPath,
      describe: "Path of the root directory to search from",
    })
    .option("parser", {
      alias: "p",
      type: "string",
      choices: ["epubjs", "lingo", "compare"],
      default: "lingo",
      describe: "Parse epub files withe the given library",
    })
    .option("search", {
      alias: "s",
      type: "string",
      describe: "Search for books with a matching name",
    })
    .option("summary", {
      type: "boolean",
      default: false,
      describe: "Show summary table instead of full TOC",
    })
    .count("verbose")
    .alias("v", "verbose")
    .help()
    .alias("h", "help")
    .parseAsync();

  // destructure arguments
  const {
    rootPath: unverifiedRootPath,
    verbose: verbosity,
    parser,
    search,
    summary,
  } = argv;

  // clean the root path by removing trailing slash
  const rootPath = unverifiedRootPath.replace(/\/$/, "");
  console.log(
    `# Extracting structure and content of ePub books with ${parser}\n`
  );
  console.log(`Searching books in ${rootPath}...`);
  const bookPaths = await findBookPaths(rootPath);
  console.log(`Found ${bookPaths.length} books.`);

  // find any books matching search criteria (case insensitive)
  // if no search criteria is specified, use all books
  const matchingBookPaths = search
    ? bookPaths.filter((book) => {
        // make a regex from a search string
        const regex = new RegExp(search, "i");
        return regex.test(book);
      })
    : bookPaths;
  console.log(`Found ${matchingBookPaths.length} matching books.`);

  for (const [bkIndex, bookPath] of matchingBookPaths.entries()) {
    try {
      if (parser === "compare") {
        // do these sequentially
        const { toc: tocLingo } = await parseLingo(bookPath);
        const { toc: tocEpubjs } = await parseEpubjs(bookPath);
        compareToc(tocLingo, tocEpubjs, bookPath, bkIndex === 0);
      } else {
        let parseResult; // parseResult is the result of parsing the book
        if (parser === "lingo") {
          parseResult = await parseLingo(bookPath);
        } else if (parser === "epubjs") {
          parseResult = await parseEpubjs(bookPath);
        } else {
          throw new Error(`Unknown parser: ${parser}`);
        }

        if (summary) {
          showSummary(parseResult.toc, bookPath, bkIndex === 0);
          // should distinguish between warnings and error
          if (parseResult.errors.length > 0 && parseResult.toc.length === 0) {
            // console.log(`\n## ${basename(bookPath)}\n`);
            console.log(
              `|   |       |       | found ${parseResult.errors.length} errors/warnings |`
            );
            for (const error of parseResult.errors) {
              console.log(`|   |       |       | - ${error} |`);
            }
          }
        } else {
          console.log(`\n## ${basename(bookPath)}\n`);
          showTOC(parseResult.toc);
          if (parseResult.errors.length > 0) {
            console.log(`\n### Errors\n`);
            console.log(parseResult.errors.join("\n"));
          }
        }
      }
    } catch (error) {
      console.error(`Book level error: ${error.message}`);
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
