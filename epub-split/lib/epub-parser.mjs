import { parseEpub } from "@gxl/epub-parser";

export async function show(bookPath) {
  const toc = await getTOC(bookPath);
  showTOC(toc);
}

function showTOC(toc, level = 0) {
  // These are the (nested elements) of the (await parseEpub())?.structure
  // {
  //   "name": "BOOK THREE",
  //   "path": "Text/part0005.html",
  //   "playOrder": "4",
  //   "children": [
  //     {
  //       "name": "CHAPTER 1: THE DEPARTURE OF BOROMIR",
  //       "path": "Text/part0006.html",
  //       "playOrder": "5"
  //     }
  // }
  if (!toc || !Array.isArray(toc)) {
    return;
  }

  toc.forEach((item) => {
    // print the indented title of the item *trimmed* (remove leading and trailing whitespace)
    const indent = " ".repeat(level * 2);
    console.log(`${indent}- ${item?.name} (#${item?.playOrder})`);
    if (item.children) {
      showTOC(item.children, level + 1);
    }
  });
}

async function getTOC(bookPath) {
  const epubObj = await parseEpub(bookPath, {
    type: "path",
  });
  // console.log("epubObj:", epubObj);
  // console.log("TOC :", epubObj.structure);
  // {
  //   "name": "BOOK THREE",
  //   "path": "Text/part0005.html",
  //   "playOrder": "4",
  //   "children": [
  //     {
  //       "name": "CHAPTER 1: THE DEPARTURE OF BOROMIR",
  //       "path": "Text/part0006.html",
  //       "playOrder": "5"
  //     }
  // }

  // console.log("epubObj", epubObj);

  // ****
  // Exploring the sections and markdown content
  // ****
  // console.log("book info", epubObj.info);
  // console.log("the book has", epubObj.sections.length, "sections");
  // console.log(epubObj.sections);
  // console.log(epubObj.sections[0]);
  // const showSection = (idx) => {
  //   const section = epubObj.sections[idx];
  //   console.log(`-------- section index ${idx} (id=${section?.id}) --------`);
  //   console.log(section);
  //   console.log("toMarkdown");
  //   console.log(epubObj.sections[idx].toMarkdown());
  //   // console.log('toHtmlObjects')
  //   // const htmlObjects = epubObj.sections[idx].toHtmlObjects()
  //   // console.log(htmlObjects)
  // };

  // showSection(2);

  return epubObj?.structure;
}
