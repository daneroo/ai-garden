import { initEpubFile } from "@lingo-reader/epub-parser";

/**
 * @typedef {import('./types.mjs').TocEntry} TocEntry
 * @typedef {import('./types.mjs').Toc} Toc
 * @typedef {import('./types.mjs').ParserResult} ParserResult
 */

/**
 * @param {string} bookPath
 * @returns {Promise<ParserResult>}
 */
export async function parse(bookPath) {
  const { result: epub, messages: initMessages } =
    await withAsyncErrorAndWarningCapture(async () => initEpubFile(bookPath));

  if (!epub) {
    return {
      parser: "lingo",
      toc: [],
      errors: initMessages,
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
  const { result: toc, messages: tocMessages } =
    await withAsyncErrorAndWarningCapture(async () => epub.getToc());
  // toc might be empty, undefined or empty?
  return {
    parser: "lingo",
    toc,
    errors: [...initMessages, ...tocMessages],
  };
}

/**
 * Intercepts console.warn calls and catches errors during the execution of an async function.
 * Warnings are prefixed with 'warning:' and errors with 'error:' in the messages array.
 * @param {() => Promise<any>} fn - The async function to execute
 * @returns {Promise<{result: any, messages: string[]}>} Object containing the function result and collected messages
 */
async function withAsyncErrorAndWarningCapture(fn) {
  const originalWarn = console.warn;
  const messages = [];

  console.warn = (...args) => {
    messages.push(`warning: ${args.join(" ")}`);
    // do not call originalWarn any more
    // originalWarn.apply(console, args);
  };

  try {
    const result = await fn();
    return { result, messages };
  } catch (error) {
    messages.push(`error: ${error.message}`);
    return { result: undefined, messages };
  } finally {
    console.warn = originalWarn;
  }
}
