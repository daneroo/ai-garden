import { parseEpub } from "npm:@gxl/epub-parser@2.0.4";

import { parseHTML } from "./dom.ts";

export async function getHTML(epubPath: string): Promise<string> {
  const epubObj = await parseEpub(epubPath, {
    type: "path",
    expand: false, // false prevents errors when not in browser (image), should help but doesn't seem to
  });

  // epubObj keys: [ "structure", "info", "sections" ]
  // 1 - info
  console.log(`  - epub info: ${JSON.stringify(epubObj.info)}`);

  // 2 - structure, see epub-split/lib/epub-parser.mjs/showTOC
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
  // console.log(`epub structure: ${JSON.stringify(epubObj.structure, null, 2)}`);

  // 3 - sections
  // console.log(`epub sections: ${JSON.stringify(epubObj.sections, null, 2)}`);
  if (epubObj.sections) {
    console.log(`  - |epub sections|: ${epubObj.sections?.length}`);

    const outerDoc = parseHTML("");
    if (!outerDoc) {
      console.error("Failed to create empty doc");
      return `<html><body><h1>Failed to create empty doc</h1></body></html>`;
    }
    epubObj.sections.forEach((section, index) => {
      // console.log(`- section ${index}: ${section.id}`);
      const div = outerDoc.createElement("div");
      // add id and index attribute to div
      div.id = section.id;
      div.setAttribute("index", index.toString());

      // div.innerHTML = section.htmlString;
      const innerDoc = parseHTML(section.htmlString);
      if (!innerDoc) {
        console.error(`Failed to parse section ${index}: ${section.id}`);
      } else {
        // Do Not add body itself, rather , all of it's children
        // div.appendChild(innerDoc.body);

        for (const child of Array.from(innerDoc.body.childNodes)) {
          div.appendChild(child.cloneNode(true));
        }
      }

      outerDoc.body.appendChild(div);
    });
    return outerDoc.body.innerHTML;
  } else {
    console.log("no sections found");
    return `<html><body><h1>no sections found</h1></body></html>`;
  }
}
