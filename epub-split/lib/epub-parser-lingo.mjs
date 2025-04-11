import { initEpubFile } from "@lingo-reader/epub-parser";

/**
 * @typedef {import('./types.mjs').TocEntry} TocEntry
 * @typedef {import('./types.mjs').Toc} Toc
 */

/**
 * @param {string} bookPath
 * @returns {Promise<Toc>}
 */
export async function getTOC(bookPath) {
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
  return toc;
}
