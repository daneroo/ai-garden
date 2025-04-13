import { initEpubFile } from "@lingo-reader/epub-parser";
import { promises as fs } from "node:fs";

/**
 * @typedef {import('./types.mjs').TocEntry} TocEntry
 * @typedef {import('./types.mjs').Toc} Toc
 * @typedef {import('./types.mjs').ParserResult} ParserResult
 */

// This is where lingo puts it's unavoidably saved images
const DEFAULT_RESOURCE_SAVE_DIR = "./data/images";
/**
 * @param {string} bookPath
 * @returns {Promise<ParserResult>}
 */
export async function parse(
  bookPath,
  resourceSaveDir = DEFAULT_RESOURCE_SAVE_DIR
) {
  // Ensure directory exists
  await fs.mkdir(resourceSaveDir, { recursive: true });

  const {
    result: epub,
    warnings: initWarnings,
    errors: initErrors,
  } = await withAsyncErrorAndWarningCapture(async () =>
    initEpubFile(bookPath, resourceSaveDir)
  );

  if (!epub) {
    return {
      parser: "lingo",
      toc: [],
      errors: initErrors,
      warnings: initWarnings,
    };
  }

  // const fileInfo = epub.getFileInfo();
  // console.log("fileInfo", fileInfo);

  // const spine = epub.getSpine();
  // console.log("### spine");
  // spine.forEach((item) =>
  //   console.log(`${item.id}, ${item.href}, ${item.linear}`)
  // );

  // Note: lingo-reader's EpubToc type is compatible with our Toc type
  // Both use 'children' for nested entries and have the same structure
  const {
    result: toc,
    warnings: tocWarnings,
    errors: tocErrors,
  } = await withAsyncErrorAndWarningCapture(async () => epub.getToc());
  // toc might be empty, undefined or empty?
  return {
    parser: "lingo",
    toc,
    errors: [...initErrors, ...tocErrors],
    warnings: [...initWarnings, ...tocWarnings],
  };
}

/**
 * Intercepts console.warn calls and catches errors during the execution of an async function.
 * Warnings are prefixed with 'warning:' and errors with 'error:' in the messages array.
 * @param {() => Promise<any>} fn - The async function to execute
 * @returns {Promise<{result: any, warnings: string[], errors: string[]}>} Object containing the function result and collected warnings and errors
 */
async function withAsyncErrorAndWarningCapture(fn) {
  const originalWarn = console.warn;
  const warnings = [];
  const errors = [];

  console.warn = (...args) => {
    warnings.push(args.join(" "));
    // do not call originalWarn any more
    // originalWarn.apply(console, args);
  };

  try {
    const result = await fn();
    return { result, warnings, errors };
  } catch (error) {
    errors.push(error.message);
    return { result: undefined, warnings, errors };
  } finally {
    console.warn = originalWarn;
  }
}
