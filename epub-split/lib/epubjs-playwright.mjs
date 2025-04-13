import { promises as fs } from "node:fs";
import { basename } from "node:path";
import { chromium } from "playwright";

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
  const maxBase64BufferSize = 100 * 1024 * 1024; // 100MiB
  const buffer = await fs.readFile(bookPath);
  // console.log(`debug:node:Buffer (${buffer.byteLength}) ${basename(bookPath)}`);
  const base64Buffer = buffer.toString("base64");
  // console.log(`debug:node:base64Buffer (${base64Buffer.length})`);
  if (base64Buffer.length > maxBase64BufferSize) {
    // const maxSizeMiB = (maxBase64BufferSize / 1024 / 1024).toFixed(2);
    const base64SizeMiB = (base64Buffer.length / 1024 / 1024).toFixed(2);
    const errorMessage = `Max file size exceeded: ${base64SizeMiB}MiB`;
    return {
      parser: "epubjs",
      toc: [],
      errors: [errorMessage],
    };
  }

  // we accumulate these from the browser console log
  // we detect and capture these because epubjs logs errors to console instead of throwing them
  const errors = [];

  const browser = await chromium.launch(/*{ headless: false, slowMo: 50 }*/);
  const page = await browser.newPage();
  page.on("console", async (msg) => {
    const args = msg.args();
    // evaluate runs the given function in the browser context, where the actual Error object exists
    // This is necessary because args[0] is a JSHandle - a proxy to the browser-side object
    // We're doing this because epubjs logs errors to console instead of throwing them
    const isEpubjsLoggedError =
      (await args[0]?.evaluate((obj) => obj instanceof Error)) &&
      args.length === 1;

    const formattedArgs = args.map((arg) => `${arg}`).join(", ");

    if (isEpubjsLoggedError) {
      // Filter out stack trace lines (those starting with whitespace followed by 'at')
      const errorMsg = formattedArgs
        .split("\n")
        .filter((line) => !line.match(/^\s+at/))
        .join("\n");
      // console.log(`** SPECIAL CASE DETECTED: ${errorMsg}`);
      errors.push(errorMsg);
      return;
    }
    // second case:
    // if msg.type() is "error"
    if (msg.type() === "error") {
      // errors.push(args[0].message);
      // console.log(`** SPECIAL CASE DETECTED: args.length:${args.length}`);
      // console.log(`** SPECIAL CASE DETECTED: args[0]:${args[0]}`);
      errors.push(formattedArgs);
      return;
    }
    console.log(
      `[${basename(bookPath)}][${msg.type()}] browser:${formattedArgs}`
    );
  });

  await page.goto("about:blank");
  await page.addScriptTag({
    url: "https://cdn.jsdelivr.net/npm/jszip@3.1.5/dist/jszip.min.js",
  });
  await page.addScriptTag({
    url: "https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js",
  });

  await page.waitForFunction(() => typeof ePub !== "undefined");

  const tocOutside = await page.evaluate(async (base64Buffer) => {
    const DEBUG_IN_PLAYWRIGHT = false;
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
        return noFragmentIdHref;
      }
      // Decode URI:
      // 2-Sometimes the href in the spine contains a URI encoded path
      // e.g. href:Text/Reaper%27s_Gale_042_chapter24.html is not in the spineByHref, but Text/Reaper's_Gale_042_chapter24.html is.
      const decodedHref = decodeURIComponent(href);
      if (spineByHref.hasOwnProperty(decodedHref)) {
        return decodedHref;
      }
      if (decodedHref.includes("%2C")) {
        console.log(`debug:section:decodedHref`);
        console.log(` - href:${href}`);
        console.log(` - decodedHref:${decodedHref}`);
      }
      const noFragmentIdDecodedHref = decodedHref.split("#")[0];
      if (spineByHref.hasOwnProperty(noFragmentIdDecodedHref)) {
        return noFragmentIdDecodedHref;
      }

      // look for any href in spineByHref that ends with noFragmentIdDecodedHref
      // - e.g. where the href is bm01.xhtml#bm1, but the spineByHref has xhtml/bm01.xhtml
      const keys = Object.keys(spineByHref);
      const foundEndsWithNoFragmentIdDecodedHref = keys.find((key) =>
        key.endsWith(noFragmentIdDecodedHref)
      );
      if (foundEndsWithNoFragmentIdDecodedHref) {
        return foundEndsWithNoFragmentIdDecodedHref;
      }
      const basenameOfNoFragmentIdDecodedHref = getBasename(
        noFragmentIdDecodedHref
      );
      const foundEndsWithBasenameOfNoFragmentIdDecodedHref = keys.find((key) =>
        key.endsWith(basenameOfNoFragmentIdDecodedHref)
      );
      if (foundEndsWithBasenameOfNoFragmentIdDecodedHref) {
        return foundEndsWithBasenameOfNoFragmentIdDecodedHref;
      }

      if (DEBUG_IN_PLAYWRIGHT) {
        console.log(`debug:section:fixHref (not found) ${href}`);
        console.log(`- debug:section:fixHref tried href:${href}`);
        console.log(
          `- debug:section:fixHref tried noFragmentIdHref:${noFragmentIdHref}`
        );
        console.log(`- debug:section:fixHref tried decodedHref:${decodedHref}`);
        console.log(
          `- debug:section:fixHref tried noFragmentIdDecodedHref:${noFragmentIdDecodedHref}`
        );
        console.log(
          `- debug:section:fixHref tried endsWith:noFragmentIdDecodedHref:${noFragmentIdDecodedHref}`
        );
        console.log(
          `- debug:section:fixHref tried endsWith:basenameOfNoFragmentIdDecodedHref:${basenameOfNoFragmentIdDecodedHref}`
        );
      }

      // return undefined if we can't find a fixedHref
    }

    // This will add textContent to each entry in the toc (and it;s children)
    // or a warning if the section is not found
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
        const { id, href, label, subitems } = entry;

        // console.log(`debug:augmenting ${label.trim()} href:${href} id:${id}`);
        // preventative check for href
        const shouldGetContent = true;
        let fixedHref;
        let section;
        let textContent;
        if (shouldGetContent) {
          fixedHref = fixHref(href);
          if (!fixedHref && DEBUG_IN_PLAYWRIGHT) {
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

          section = book.spine.get(fixedHref);
          // Section.load(_request: method?) needs a requestor function
          // and returns a HTMLHtmlElement
          const contents = section
            ? await section.load(book.load.bind(book))
            : undefined;

          // contents is a HTMLHtmlElement | undefined
          // if contents has a body, use that, otherwise use contents direclty
          const bodyElement = contents?.querySelector("body");
          textContent = bodyElement
            ? bodyElement.textContent
            : contents
            ? contents.textContent
            : undefined;
        }
        const children = await augmentEntriesAndChildren(subitems);
        newEntries.push({
          id,
          href,
          label,
          children,
          // Only include textContent if it has a truthy value (empty string is falsy)
          ...(textContent ? { textContent } : {}),
          ...(shouldGetContent && (!fixedHref || !section)
            ? {
                warning: `section not found for label:${label.trim()} href:${href} id:${id}`,
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
  return {
    parser: "epubjs",
    toc: tocOutside,
    errors: errors,
  };
}
