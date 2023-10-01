import { promises as fs } from "node:fs";
import { basename, extname } from "node:path";
import { chromium } from "playwright";
import { Book } from "epubjs";

export async function show(bookPath) {
  const toc = await getTOC(bookPath);
  // showWarnings(toc);
  showTOC(toc);
}

// clone of showTOC, but just for warnings
function showWarnings(toc, level = 0) {
  const indent = " ".repeat(level * 2);
  toc.forEach((item) => {
    if (item.warning) {
      console.log(`${indent}- ${item.label.trim()} (${item?.href})`);
      console.log(`${indent} ** ${item.warning}`);
    }
    if (item.subitems) {
      showWarnings(item.subitems, level + 1);
    }
  });
}

function showTOC(toc, level = 0) {
  // {
  //   "id": "8a3b7da4-92e6-45e8-b523-8b018dc12000",
  //   "href": "Text/part0030.html",
  //   "label": "\r\n        COPYRIGHT\r\n      ",
  //   "subitems": []
  //   "parent": "8a3b7da4-92e6-45e8-b523-8b018dc12000" | undefined
  //   "textContent": "..."
  // }
  const indent = " ".repeat(level * 2);
  toc.forEach((item) => {
    // print the indented title of the item *trimmed* (remove leading and trailing whitespace)
    console.log(`${indent}- ${item.label.trim()} (${item?.href})`);
    // if item has textContent, print it
    if (item.textContent) {
      const cleanedContent = item.textContent
        .replace(/\s+/g, " ") // Replace multiple spaces with a single space
        .replace(/\n+/g, "\n") // Replace multiple newlines with a single newline
        .trim(); // Remove leading and trailing whitespace

      console.log(
        `${indent}    ${cleanedContent.slice(0, 80)}${
          cleanedContent.length > 50 ? "..." : ""
        }`
      );
    }
    if (item.warning) {
      console.log(`${indent} ** ${item.warning}`);
    }
    if (item.subitems) {
      showTOC(item.subitems, level + 1);
    }
  });
}

/**
 * Splits the specified book into chapters and saves them as separate files.
 * @param {string} bookPath - The path of the book file to split.
 * @returns {Promise<void>} - A promise that resolves when the book has been split into chapters.
 */
async function getTOC(bookPath) {
  // var book = new Book(bookPath);
  // const bookBuffer = await fs.readFile(bookPath);
  const buffer = await fs.readFile(bookPath);
  // console.log(`debug:node:Buffer (${buffer.byteLength}) ${basename(bookPath)}`);
  const base64Buffer = buffer.toString("base64");
  // console.log(`debug:node:base64Buffer (${base64Buffer.length})`);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on("console", (msg) => {
    const args = msg
      .args()
      .map((arg) => `${arg}`)
      .join(", ");
    console.log(`browser:${args}`);
  });

  await page.goto("about:blank");
  await page.addScriptTag({
    url: "https://cdn.jsdelivr.net/npm/jszip@3.1.5/dist/jszip.min.js",
  });
  await page.addScriptTag({
    url: "https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js",
  });

  // timeout: arbitrary and brittle, wait for something else?
  // await page.waitForFunction(() => typeof EPUB !== 'undefined');
  await page.waitForTimeout(1000); // Adjust as needed, this is just to ensure scripts have time to load

  const tocOutside = await page.evaluate(async (base64Buffer) => {
    // The following code runs in the browser context.
    // You should have access to any browser-specific features here.
    function base64ToArrayBuffer(base64) {
      // console.log(`debug:base64 (${base64.length})`);
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      // console.log(`debug:buffer (${bytes.buffer.byteLength})`);
      return bytes.buffer;
    }

    // This will add textContent to each entry in the toc (and it;s children)
    // TODO(daneroo): standardize shape of returned entry?
    async function augmentEntriesAndChildren(entries) {
      // {
      //   "id": "8a3b7da4-92e6-45e8-b523-8b018dc12000",
      //   "href": "Text/part0030.html",
      //   "label": "\r\n        COPYRIGHT\r\n      ",
      //   "subitems": []
      //   "parent": "8a3b7da4-92e6-45e8-b523-8b018dc12000" | undefined
      // }
      const newEntries = [];
      for (let entry of entries) {
        const { id, href, label, subitems, parent } = entry;

        // console.log(`debug:augmenting ${label.trim()} href:${href} id:${id}`);
        // preventative check for href
        let fixedHref = href;
        if (!book.spine.spineByHref.hasOwnProperty(href)) {
          // For an old version of Pax, href:bm01.xhtml#bm1 is not in the spineByHref, but xhtml/bm01.xhtml is. Also: there is no spine.baseUrl
          // Let's clean the fragment
          fixedHref = href.split("#")[0];
          // const pathname = new URL(href, book.spine.baseUrl).pathname; // and remove leading slash
          // console.log(`debug:section:fixedHref ${href} -> ${fixedHref}`);
          if (!book.spine.spineByHref.hasOwnProperty(fixedHref)) {
            // console.log(`debug:section:fixedHref ${fixedHref} still not found`);
            // check if any key in spineByHref ends with fixedHref
            const keys = Object.keys(book.spine.spineByHref);
            const foundHref = keys.find((key) => key.endsWith(fixedHref));
            if (foundHref) {
              // console.log(`debug:section:fixedHref ${foundHref}`);
              fixedHref = foundHref;
            }
          }
        }

        const section = book.spine.get(fixedHref);
        // This might have been another option to get the section (by Id)
        // const section = book.spine.get(`#${id}`);
        // console.log(`debug:section ${section}`);
        if (!section) {
          console.log(`debug:section not found for href:${href} id:${id}`);
          // console.log(`debug:spine.spineItems`, book.spine.spineItems.length);
          // console.log(`debug:spine.baseUrl:|${book.spine.baseUrl}|`);
          // console.log(
          //   `debug:spine.spineByHref`,
          //   Object.keys(book.spine.spineByHref)
          // );
          // console.log(
          //   `debug:spine.spineById`,
          //   Object.keys(book.spine.spineById)
          // );
        }
        // Section.load(_request: method?) needs a requestor function
        // and returns a HTMLHtmlElement
        const contents = section
          ? await section.load(book.load.bind(book))
          : undefined;

        // contents is a HTMLHtmlElement | undefined
        // if contents has a body, use that, otherwise use contents direclty
        const bodyElement = contents?.querySelector("body");
        const textContent = bodyElement
          ? bodyElement.textContent
          : contents
          ? contents.textContent
          : undefined;

        newSubitems = await augmentEntriesAndChildren(subitems);
        newEntries.push({
          id,
          href,
          label,
          subitems: newSubitems,
          parent,
          textContent,
          ...(!section ? { warning: `section not found for ${href}` } : {}),
        });
      }
      return newEntries;
    }
    const buffer = base64ToArrayBuffer(base64Buffer);

    // const book = ePub("https://s3.amazonaws.com/moby-dick/moby-dick.epub");
    // Now use ePub with this ArrayBuffer
    const book = ePub(buffer);

    await book.opened;
    // there are other states we can await; spine,cover,metadata,..
    await book.loaded.navigation;
    await book.loaded.spine;

    // console.log("debug:spine");
    // book.spine.each((item) => {
    //   // [idref, linear, properties, index, href, url, canonical, next, prev, cfiBase, hooks, document, contents, output]
    //   const { idref, href, url, canonical } = item;
    //   console.log(
    //     "debug:spine:item",
    //     JSON.stringify({ idref, href, url, canonical }, null, 2)
    //   );
    // });
    // book.navigation.toc is not actually an array, it just has a forEach method
    const toc = [];
    book.navigation.toc.forEach((item) => toc.push(item));

    const newTOC = await augmentEntriesAndChildren(toc);
    return newTOC;
  }, base64Buffer);

  await browser.close();
  return tocOutside;
}
