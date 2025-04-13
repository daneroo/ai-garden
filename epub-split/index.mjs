import yargs from "yargs/yargs";
import os from "node:os";
import { walk } from "@root/walk";
import { extname, basename } from "node:path";

import { parse as parseEpubjs } from "./lib/epubjs-playwright.mjs";
import { parse as parseLingo } from "./lib/epub-parser-lingo.mjs";
import { showTOC, showSummary, compareToc } from "./lib/showToc.mjs";
import { exit } from "node:process";

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
      default: "space",
      describe:
        "Path of the root directory to search from (can be a path or one of: test, space, drop[box])",
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

  // resolve the root path (includes cleaning)
  const rootPath = resolveRootPath(unverifiedRootPath);
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
        const { toc: tocLingo } = await parseLingo(bookPath, { verbosity });
        const { toc: tocEpubjs } = await parseEpubjs(bookPath, { verbosity });
        compareToc(tocLingo, tocEpubjs, bookPath, bkIndex === 0);
      } else {
        let parseResult; // parseResult is the result of parsing the book
        if (parser === "lingo") {
          parseResult = await parseLingo(bookPath, { verbosity });
        } else if (parser === "epubjs") {
          parseResult = await parseEpubjs(bookPath, { verbosity });
        } else {
          throw new Error(`Unknown parser: ${parser}`);
        }

        if (verbosity > 1) {
          const { errors, warnings, toc } = parseResult;
          // console.log(
          //   `## ${basename(bookPath)} ${parser} e:${errors.length} w:${
          //     warnings.length
          //   } toc:${toc.length}`
          // );
          continue;
        }

        if (summary) {
          showSummary(parseResult.toc, bookPath, bkIndex === 0);
          if (
            parseResult.errors.length > 0 ||
            parseResult.warnings.length > 0
          ) {
            // console.log(`\n## ${basename(bookPath)}\n`);
            if (parseResult.errors.length > 0) {
              console.log(
                `|   |       |       | found ${parseResult.errors.length} errors |`
              );
              for (const error of parseResult.errors) {
                console.log(`|   |       |       | - ${error} |`);
              }
            }
            if (parseResult.warnings.length > 0) {
              console.log(
                `|   |       |       | found ${parseResult.warnings.length} warnings |`
              );
              for (const warning of parseResult.warnings) {
                console.log(`|   |       |       | - ${warning} |`);
              }
            }
          }
        } else {
          console.log(`\n## ${basename(bookPath)}\n`);
          showTOC(parseResult.toc);
          if (parseResult.errors.length > 0) {
            console.log(`\n### Errors\n`);
            console.log(parseResult.errors.join("\n"));
          }
          if (parseResult.warnings.length > 0) {
            console.log(`\n### Warnings\n`);
            console.log(parseResult.warnings.join("\n"));
          }
        }
      }
    } catch (error) {
      console.error(`\n** Book level error: ${basename(bookPath)}`);
      console.error(`  - ${error.message}`);
      process.exit(1);
    }
  }
}

/**
 * Resolves a root path shortcut to its actual path and cleans it
 * @param {string} path - The path or shortcut to resolve
 * @returns {string} The resolved and cleaned path (no trailing slash)
 * @example
 * resolveRootPath("test") // returns "./test-books"
 * resolveRootPath("space") // returns "/Volumes/Space/Reading/audiobooks"
 * resolveRootPath("dropbox") // returns "~/Library/CloudStorage/Dropbox/A-Reading/EBook"
 * resolveRootPath("/some/path/") // returns "/some/path"
 */
function resolveRootPath(path) {
  const shortcuts = {
    test: "./test-books",
    space: "/Volumes/Space/Reading/audiobooks/",
    drop: `${os.homedir()}/Library/CloudStorage/Dropbox/A-Reading/EBook`,
    dropbox: `${os.homedir()}/Library/CloudStorage/Dropbox/A-Reading/EBook`,
  };

  // Resolve shortcut or use the path as is
  const resolvedPath = shortcuts[path] || path;

  // Remove trailing slash and return
  return resolvedPath.replace(/\/$/, "");
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
