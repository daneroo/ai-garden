import yargs from "yargs/yargs";
import os from "node:os";
// replace our walk port with fast-glob
// import { walk } from "./lib/walk.ts";
import fg from "fast-glob";

import { extname, basename } from "node:path";

import { parse as parseEpubjs } from "./lib/epubjs-playwright.ts";
import { parse as parseLingo } from "./lib/epub-parser-lingo.ts";
import { showTOC, showSummary, compareToc } from "./lib/showToc.ts";
import { ParserResult } from "./lib/types.ts";
import { exit } from "node:process";

// Wrap in IIFE to support top-level await in CommonJS context (tsx default)
(async () => {
  try {
    await main();
    exit(0);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error:", message);
    exit(1);
  }
})();

async function main(): Promise<void> {
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
    ? bookPaths.filter((book: string) => {
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
        const { toc: tocEpubjs } = await parseEpubjs(bookPath, { verbosity });
        const { toc: tocLingo } = await parseLingo(bookPath, { verbosity });
        compareToc(tocLingo, tocEpubjs, bookPath, bkIndex === 0);
      } else {
        let parseResult: ParserResult; // parseResult is the result of parsing the book
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`\n** Book level error: ${basename(bookPath)}`);
      console.error(`  - ${message}`);
      process.exit(1);
    }
  }
}

/**
 * Resolves a root path shortcut to its actual path and cleans it
 * @example
 * resolveRootPath("test") // returns "./test-books"
 * resolveRootPath("space") // returns "/Volumes/Space/Reading/audiobooks"
 * resolveRootPath("dropbox") // returns "~/Library/CloudStorage/Dropbox/A-Reading/EBook"
 * resolveRootPath("/some/path/") // returns "/some/path"
 */
function resolveRootPath(path: string): string {
  const shortcuts: Record<string, string> = {
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
 */
async function findBookPaths(rootPath: string): Promise<string[]> {
  const files = await fg(`${rootPath}/**/*.epub`, {
    concurrency: 1, // just to be kind
    followSymbolicLinks: false, //just to be safe
    // absolute: true, // not necessary,
  });
  // sort files by path because walk/fast-glob returns potentially unsorted files but only under deno??
  files.sort();
  return files;
}
