import yargs from "yargs/yargs";
import { walk } from "@root/walk";
import { basename, extname } from "node:path";
import { show as showEpubJS } from "./lib/epubjs-playwright.mjs";
import { show as showEPubParser } from "./lib/epub-parser.mjs";
import { exit } from "node:process";

const defaultRootPath =
  "/Users/daniel/Library/CloudStorage/Dropbox/A-Reading/EBook";
// const defaultRootPath = "/Volumes/Reading/audiobooks/";

try {
  await main();
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
      choices: ["epubjs", "epub-parser"], // Limit the options to 'check' or 'fix'
      default: "epubjs",
      describe: "Parse epub files withe the given library",
    })
    .count("verbose")
    .alias("v", "verbose")
    .help()
    .alias("h", "help")

    .parseAsync();

  // destructure arguments
  const { rootPath: unverifiedRootPath, verbose: verbosity, parser } = argv;

  // clean the root path by removing trailing slash
  const rootPath = unverifiedRootPath.replace(/\/$/, "");
  console.log(
    `# Extracting structure and content of ePub books with ${parser}\n`
  );
  console.log(`Searching books in ${rootPath}...`);
  const bookPaths = await findBookPaths(rootPath);
  console.log(`Found ${bookPaths.length} books.`);

  // find any books with a matching name (case insensitive)
  const matchingBookPaths = bookPaths.filter((book) => {
    const regex = /two towers/i;
    // const regex = /pax/i;
    // const regex = /space 01/i;
    return regex.test(book);
    // return true || regex.test(book);
  });
  console.log(`Found ${matchingBookPaths.length} matching books.`);

  for (const bookPath of matchingBookPaths) {
    console.log(`\n## ${basename(bookPath)}\n`);
    try {
      if (parser === "epub-parser") {
        await showEPubParser(bookPath);
      } else if (parser === "epubjs") {
        await showEpubJS(bookPath);
      } else {
        throw new Error(`Unknown parser: ${parser}`);
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
