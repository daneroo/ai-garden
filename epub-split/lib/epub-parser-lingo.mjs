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
  const epub = await initEpubFile(bookPath);

  // const fileInfo = epub.getFileInfo();
  // console.log("fileInfo", fileInfo);

  // const spine = epub.getSpine();
  // console.log("### spine");
  // spine.forEach((item) =>
  //   console.log(`${item.id}, ${item.href}, ${item.linear}`)
  // );

  // Note: lingo-reader's EpubToc type is compatible with our Toc type
  // Both use 'children' for nested entries and have the same structure
  const toc = epub.getToc();
  return {
    parser: "lingo",
    toc,
    errors: [],
  };
}
