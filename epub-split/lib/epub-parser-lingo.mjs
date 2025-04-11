import { initEpubFile } from "@lingo-reader/epub-parser";
// import type { EpubToc } from "@lingo-reader/epub-parser";
import { basename } from "node:path";

export async function show(bookPath) {
  console.log(`\n## ${basename(bookPath)}\n`);
  const toc = await getTOC(bookPath);
  showTOC(toc);
}

function showTOC(toc, level = 0) {
  if (!toc || !Array.isArray(toc)) {
    return;
  }

  toc.forEach((item) => {
    // print the indented title of the item *trimmed* (remove leading and trailing whitespace)
    const indent = " ".repeat(level * 2);
    console.log(
      `${indent}- ${item?.label} (#${item?.playOrder}) [id=${item?.id} href=${item?.href}]`
    );

    if (item.children) {
      showTOC(item.children, level + 1);
    }
  });
}

async function getTOC(bookPath) {
  const epub = await initEpubFile(bookPath);

  // const fileInfo = epub.getFileInfo();
  // console.log("fileInfo", fileInfo);

  // const spine = epub.getSpine();
  // console.log("### spine");
  // spine.forEach((item) =>
  //   console.log(`${item.id}, ${item.href}, ${item.linear}`)
  // );

  const toc = epub.getToc();
  return toc;
}
