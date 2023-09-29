import { promises as fs } from "node:fs";
import { basename, extname } from "node:path";
import { chromium } from "playwright";
import { Book } from "epubjs";

export async function show(bookPath) {
  const toc = await getTOC(bookPath);
  showTOC(toc);
}

function showTOC(toc, level = 0) {
  // {
  //   "id": "8a3b7da4-92e6-45e8-b523-8b018dc12000",
  //   "href": "Text/part0030.html",
  //   "label": "\r\n        COPYRIGHT\r\n      ",
  //   "subitems": []
  //   "parent": "8a3b7da4-92e6-45e8-b523-8b018dc12000" | undefined
  // }
  toc.forEach((item) => {
    // print the indented title of the item *trimmed* (remove leading and trailing whitespace)
    const indent = " ".repeat(level * 2);
    console.log(`${indent}- ${item.label.trim()} (${item?.href})`);
    // if item has .cleanedContent, print it
    if (item.cleanedContent) {
      console.log(
        `${indent}    ${item.cleanedContent.slice(0, 50)}${
          item.cleanedContent.length > 50 ? "..." : ""
        }`
      );
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
    async function augmentEntryAndChildren(entry) {
      // {
      //   "id": "8a3b7da4-92e6-45e8-b523-8b018dc12000",
      //   "href": "Text/part0030.html",
      //   "label": "\r\n        COPYRIGHT\r\n      ",
      //   "subitems": []
      //   "parent": "8a3b7da4-92e6-45e8-b523-8b018dc12000" | undefined
      // }
      const { id, href, label, subitems, parent } = entry;

      const section = book.spine.get(href);
      // console.log(section);
      // Section.load(_request: method?) needs a requestor function
      // and returns a HTMLHtmlElement
      const contents = await section.load(book.load.bind(book));
      const textContent = contents.textContent;
      const cleanedContent = textContent
        .replace(/\s+/g, " ") // Replace multiple spaces with a single space
        .replace(/\n+/g, "\n") // Replace multiple newlines with a single newline
        .trim(); // Remove leading and trailing whitespace

      return {
        id,
        href,
        label,
        subitems,
        parent,
        textContent,
        cleanedContent,
      };
    }
    const buffer = base64ToArrayBuffer(base64Buffer);

    // const book = ePub("https://s3.amazonaws.com/moby-dick/moby-dick.epub");
    // Now use ePub with this ArrayBuffer
    const book = ePub(buffer);

    // ... additional processing ...
    await book.opened;
    await book.loaded.navigation;

    // console.log("book", book);
    // console.log("spine", book.spine);
    // console.log("package", book.package);
    // navigation
    // console.log("navigation", book.navigation);
    // console.log("navigation.toc", JSON.stringify(book.navigation.toc, null, 2));

    // book.navigation.toc is not actually an array, it just has a forEach method
    const toc = [];
    book.navigation.toc.forEach((item) => toc.push(item));

    const newTOC = [];
    for (let chapter of toc) {
      newTOC.push(await augmentEntryAndChildren(chapter));
    }
    return newTOC;
  }, base64Buffer);

  await browser.close();
  return tocOutside;
}
