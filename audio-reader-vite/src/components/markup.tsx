import { useEffect, useState } from "react";

import ePub, { type Book } from "epubjs";

import { useMedia } from "../hooks/useMedia";

// epubjs un-importable types!
type Spine = Book["spine"];
type Section = ReturnType<Spine["get"]>;
type NavItem = Book["navigation"]["toc"][0];

export function Markup() {
  const { selectedMedia } = useMedia();
  const [markupContent, setMarkupContent] = useState("");

  useEffect(() => {
    if (selectedMedia.markupFile) {
      fetchMarkup(selectedMedia.markupFile).then((markup) => {
        setMarkupContent(markup);
      });
    }
  }, [selectedMedia.markupFile]); // Empty dependency array means this effect runs once on mount

  return (
    <>
      <h5>Markup for {selectedMedia.markupFile}</h5>
      <pre>Markup content length {markupContent.length}</pre>
      <div
        dangerouslySetInnerHTML={{
          // __html: markupContent,
          __html: markupContent,
        }}
      />
    </>
  );
}

async function fetchMarkup(markupFile: string) {
  console.log("fetchMarkup", markupFile);
  // get the file name extension from markupFile
  const ext = markupFile.split(".").pop();
  // if (ext !== "epub") {
  //   console.error("Invalid markup file extension", ext);
  //   return `<p>Invalid markup file extension (${ext}) for ${markupFile}</p>`;
  // }
  // swap extension to .epub
  const epubFile = markupFile.replace(ext || "", "epub");
  try {
    const html = await parseEpubFile(epubFile);
    const htmlDoc = new DOMParser().parseFromString(html, "text/html");
    return htmlDoc.body.innerHTML;
  } catch (error) {
    console.error(error);
    return `<p>Failed to load markup for ${epubFile}</p>`;
  }
}

async function parseEpubFile(epubFile: string): Promise<string> {
  console.log(`parseEpubFile ${epubFile} with epubjs`);
  try {
    const book: Book = ePub(epubFile);
    await book.opened;
    console.log("book", book);

    // const navigation = await book.loaded.navigation;
    await book.loaded.navigation;
    const toc = book.navigation.toc;
    // {
    //   "id": "8a3b7da4-92e6-45e8-b523-8b018dc12000",
    //   "href": "Text/part0030.html",
    //   "label": "\r\n        COPYRIGHT\r\n      ",
    //   "subitems": []
    //   "parent": "8a3b7da4-92e6-45e8-b523-8b018dc12000" | undefined
    // }
    console.log("TOC", toc);
    // console.log(
    //   "toc",
    //   toc.map((item) => item.label.trim())
    // );

    // Instead of traversing TOC, which hierarchical, traverse spine

    {
      await book.loaded.spine;
      const spine: Spine = book.spine;
      console.log("spine", spine);

      const sections = await getSectionsFromSpine(spine);
      console.log("sections", sections);

      const outerDoc = new DOMParser().parseFromString("", "text/html");

      for (const section of sections) {
        const tocLabel = findHrefInToc(toc, section.href);
        if (!tocLabel) {
          console.warn(
            ` Section ${section.index} id:${section.idref} TOC!:${section.href}`
          );
        } else {
          console.log(
            ` Section ${section.index} id:${section.idref} TOC:${tocLabel}`
          );
        }
        const div = outerDoc.createElement("div");
        // add id and index attribute to div
        div.id = section.idref; // matches what we did with wpu-parser
        div.setAttribute("index", section.index.toString());
        div.setAttribute("href", section.href.toString());

        const html = await getHTMLFromSectionInBook(section, book);
        div.innerHTML = html;

        div.innerHTML =
          `<h2 style="color:green">` +
          `Spine ${section.index} - ` +
          `<span style="color:${tocLabel ? "blue" : "red"}">${
            tocLabel || "Not In TOC"
          }</span>` +
          `</h2>` +
          `<div style="color:grey; font-size:12px;">${section.href}</div>` +
          div.innerHTML;
        outerDoc.body.appendChild(div);
      }
      return outerDoc.body.innerHTML;
    }
    return `<p>Parsing ${epubFile}</p>`;
  } catch (error) {
    console.error(error);
    return `<p>Failed to parse ${epubFile}</p>`;
  }
}

function getSectionsFromSpine(spine: Spine) {
  const sections: Section[] = [];
  for (let i = 0; ; i++) {
    const section = spine.get(i) as Section;
    if (!section) {
      console.log("getSectionsFromSpine - break", i, section);
      break;
    }
    sections.push(section);
  }
  return sections;
}

async function getHTMLFromSectionInBook(
  section: Section,
  book: Book
): Promise<string> {
  // Section.load(_request: method?) needs a requestor function
  // and returns a HTMLHtmlElement
  const contents = section
    ? await section.load(book.load.bind(book))
    : undefined;
  // contents is a HTMLHtmlElement | undefined
  // if contents has a body, use that for the innerHTML
  const bodyElement = contents?.querySelector("body");
  return bodyElement ? bodyElement.innerHTML : "";
}

function findHrefInToc(toc: NavItem[], href: string): string {
  for (const item of toc) {
    if (item.href === href) {
      return item.label.trim();
    }
    if (item.subitems) {
      const found = findHrefInToc(item.subitems, href);
      if (found) {
        return found;
      }
    }
  }
  return "";
}
