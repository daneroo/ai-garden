import { promises as fs } from "node:fs";
import { basename } from "node:path";
import { chromium } from "playwright";

export async function showSummary(bookPath) {
  try {
    const toc = await getTOC(bookPath);
    const warnings = validate(toc);
    const ok = warnings.length === 0;
    console.log(
      `| ${ok ? "✓" : "✗"} | ${warnings.length
        .toString()
        .padStart(5)} | ${basename(bookPath)} |`
    );
  } catch (error) {
    console.log(`| ✗ | ${"-1".padStart(5)} | ${basename(bookPath)} |`);
  }
}

export async function show(bookPath) {
  try {
    const toc = await getTOC(bookPath);
    const warnings = validate(toc);
    if (warnings.length > 0) {
      console.log(`\n## ${basename(bookPath)}\n`);
      warnings.forEach((warning) => console.log(`- ${warning}`));
      console.log("");
    } else {
      console.log(`\n## ${basename(bookPath)}\n`);
      showTOC(toc);
    }
  } catch (error) {
    console.log(`\n## ${basename(bookPath)}\n`);
    console.error(`Error: ${error.message}`);
  }
}

// clone of showTOC, but just for warnings
function validate(toc, level = 0) {
  const warnings = [];
  const indent = " ".repeat(level * 2);
  toc.forEach((item) => {
    if (item.warning) {
      // console.log(`${indent}- ${item.label.trim()} (${item?.href})`);
      // console.log(`${indent} ** ${item.warning}`);
      warnings.push(item.warning);
    }
    if (item.subitems) {
      const subWarnings = validate(item.subitems, level + 1);
      warnings.push(...subWarnings);
    }
  });
  return warnings;
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
  const maxBase64BufferSize = 100 * 1024 * 1024; // 100MiB
  // var book = new Book(bookPath);
  // const bookBuffer = await fs.readFile(bookPath);
  const buffer = await fs.readFile(bookPath);
  // console.log(`debug:node:Buffer (${buffer.byteLength}) ${basename(bookPath)}`);
  const base64Buffer = buffer.toString("base64");
  // console.log(`debug:node:base64Buffer (${base64Buffer.length})`);
  if (base64Buffer.length > maxBase64BufferSize) {
    throw new Error(
      `Base64 encoded file size for ${bookPath} exceeds maximum ${(
        maxBase64BufferSize /
        1024 /
        1024
      ).toFixed(2)}MiB (orig:${(buffer.byteLength / 1024 / 1024).toFixed(
        2
      )} MiB base64:${(base64Buffer.length / 1024 / 1024).toFixed(2)} MiB==${
        base64Buffer.length
      } bytes)`
    );
  }

  const browser = await chromium.launch(/*{ headless: false, slowMo: 50 }*/);
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
  // await page.waitForTimeout(1000); // Adjust as needed, this is just to ensure scripts have time to load
  // This reduced time to process 175 books from 292s to 114s
  await page.waitForFunction(() => typeof ePub !== "undefined");

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

    // get basename from path, just a regex, not thoroughly tested
    function getBasename(path) {
      const match = path.match(/([^\/\\]+)$/);
      return match ? match[0] : "";
    }
    // return the first "fixed href" found in the spineByHref
    function fixHref(href) {
      const spineByHref = book.spine.spineByHref;
      if (spineByHref.hasOwnProperty(href)) {
        return href;
      }
      // 1-Sometimes the href in the spine contains a fragment identifier
      // e.g. href:bm01.xhtml#bm1 is not in the spineByHref, but xhtml/bm01.xhtml is. Also: there is no spine.baseUrl
      // Remove any fragment identifier #id
      const noFragmentIdHref = href.split("#")[0];
      if (spineByHref.hasOwnProperty(noFragmentIdHref)) {
        // console.log(`debug:section:fixHref (noFragmentId) ${noFragmentIdHref}`);
        return noFragmentIdHref;
      }
      // Decode URI:
      // 2-Sometimes the href in the spine contains a URI encoded path
      // e.g. href:Text/Reaper%27s_Gale_042_chapter24.html is not in the spineByHref, but Text/Reaper's_Gale_042_chapter24.html is.
      const decodedHref = decodeURIComponent(href);
      if (spineByHref.hasOwnProperty(decodedHref)) {
        // console.log(`debug:section:fixHref (decodeURI) ${decodedHref}`);
        return decodedHref;
      }
      if (decodedHref.includes("%2C")) {
        console.log(`debug:section:decodedHref`);
        console.log(` - href:${href}`);
        console.log(` - decodedHref:${decodedHref}`);
      }
      const noFragmentIdDecodedHref = decodedHref.split("#")[0];
      if (spineByHref.hasOwnProperty(noFragmentIdDecodedHref)) {
        // console.log(`debug:section:fixHref (noFragmentIdDecoded) ${noFragmentIdDecodedHref}`);
        return noFragmentIdDecodedHref;
      }

      // look for any href in spineByHref that ends with noFragmentIdDecodedHref
      // - e.g. where the href is bm01.xhtml#bm1, but the spineByHref has xhtml/bm01.xhtml
      const keys = Object.keys(spineByHref);
      const foundHref = keys.find((key) =>
        key.endsWith(noFragmentIdDecodedHref)
      );
      if (foundHref) {
        // console.log(`debug:section:fixHref (endsWith) ${foundHref}`);
        return foundHref;
      }
      // browser:debug:section:fixHref (not found) ../Text/01_Cover.xhtml
      const basnameOfNoFragmentIdDecodedHref = getBasename(
        noFragmentIdDecodedHref
      );
      const foundBaseNameOfHref = keys.find((key) =>
        key.endsWith(basnameOfNoFragmentIdDecodedHref)
      );
      if (foundBaseNameOfHref) {
        // console.log(`debug:section:fixHref (basnameNoFragmentIdDecodedHref) ${foundBaseNameOfHref}`);
        return foundBaseNameOfHref;
      }

      console.log(`debug:section:fixHref (not found) ${href}`);
      console.log(
        `- debug:section:fixHref tried noFragmentIdHref:${noFragmentIdHref}`
      );
      console.log(`- debug:section:fixHref tried decodedHref:${decodedHref}`);
      console.log(
        `- debug:section:fixHref tried noFragmentIdDecodedHref:${noFragmentIdDecodedHref}`
      );
      console.log(
        `- debug:section:fixHref tried endsWith:${noFragmentIdDecodedHref}`
      );
      console.log(
        `- debug:section:fixHref tried endsWith:${basnameOfNoFragmentIdDecodedHref}`
      );

      // return undefined if we can't find a fixedHref
    }

    // This will add textContent to each entry in the toc (and it;s children)
    // or a warning if the section is not found
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
        const fixedHref = fixHref(href);
        if (!fixedHref) {
          console.log(`debug:section not found for href:${href} id:${id}`);
          // console.log(`debug:spine.spineItems`, book.spine.spineItems.length);
          // console.log(`debug:spine.baseUrl:|${book.spine.baseUrl}|`);
          console.log(
            `debug:spine.spineByHref`,
            JSON.stringify(Object.keys(book.spine.spineByHref), null, 2)
          );
        }

        // **************************
        // TODO(daneroo): Don;t look up section if we have no fixedHref!

        const section = book.spine.get(fixedHref);
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
          ...(!fixedHref || !section
            ? {
                warning: `section not found for label:${label.trim()} href:${href}`,
              }
            : {}),
        });
      }
      return newEntries;
    }
    const buffer = base64ToArrayBuffer(base64Buffer);
    // console.log(`debug:browser:buffer (${buffer.byteLength})`);

    // wait for secondsToWait seconds
    // const secondsToWait = 50;
    // await new Promise((resolve) => setTimeout(resolve, secondsToWait * 1000));

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
