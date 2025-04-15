import { initEpubFile } from "@lingo-reader/epub-parser";
import { promises as fs } from "node:fs";
import { basename } from "node:path";
import assert from "node:assert";
import { JSDOM } from "jsdom";

/**
 * @typedef {import('./types.mjs').TocEntry} TocEntry
 * @typedef {import('./types.mjs').Toc} Toc
 * @typedef {import('./types.mjs').ParserResult} ParserResult
 * @typedef {import('./types.mjs').ParseOptions} ParseOptions
 */

// This is where lingo puts it's unavoidably saved images
const DEFAULT_RESOURCE_SAVE_DIR = "./data/images";
/**
 * @param {string} bookPath
 * @param {string} [resourceSaveDir=DEFAULT_RESOURCE_SAVE_DIR]
 * @param {ParseOptions} [opts={}]
 * @returns {Promise<ParserResult>}
 */
export async function parse(
  bookPath,
  opts = {},
  resourceSaveDir = DEFAULT_RESOURCE_SAVE_DIR
) {
  // intercept console.warn calls and catch errors
  // This is only expected to happen during call to initEpubFile

  // Capture warning
  // - until restore after successful call to initEpubFile
  // - or in the finally clause if initEpubFile throws an error
  const originalWarn = console.warn;
  let warningsRestored = false;
  const warnings = [];
  console.warn = (...args) => {
    warnings.push(args.join(" "));
    // do not call originalWarn any more
    // originalWarn.apply(console, args);
  };
  try {
    console.error(`lingo - invoked on ${basename(bookPath)}`);
    const { verbosity = 0 } = opts;

    console.log(`\n## ${basename(bookPath)}\n`);

    const start = +new Date();
    // Ensure directory exists
    await fs.mkdir(resourceSaveDir, { recursive: true });

    // This is the only function that is expected to throw an error or console.warn

    const epub = await initEpubFile(bookPath, resourceSaveDir);

    // restore original console.warn
    console.warn = originalWarn;
    warningsRestored = true;
    const end = +new Date();
    const duration = end - start;
    debuglog(verbosity, `- initEpubFile duration:${duration}ms`);

    assert(epub, "epub is null - this should never happen");

    const fileInfo = epub.getFileInfo();
    assert(fileInfo, "fileInfo is null - this should never happen");
    debuglog(
      verbosity,
      `- fileInfo ${fileInfo.fileName} : ${fileInfo.mimetype}`
    );

    // const metadata = epub.getMetadata();
    // debuglog(verbosity, `- metadata [${metadata}]`);

    // const guide = epub.getGuide();
    // debuglog(verbosity, `- guide [${guide.length}]`);

    // const manifest: Record<string, ManifestItem> = epub.getManifest()
    const manifest = epub.getManifest();
    debuglog(verbosity, `- manifest [${Object.keys(manifest).length}]`);
    Object.entries(manifest).forEach(([id, item]) => {
      debuglog(verbosity, `  - ${id}: ${JSON.stringify(item)}`);
    });

    const spine = epub.getSpine();
    debuglog(verbosity, `- spine [${spine.length}]`);
    // assert(spine.length > 0, "spine is empty - this should never happen");
    for (const item of spine) {
      debuglog(verbosity, `  - ${item.id}, ${item.href}, ${item.linear}`);
      try {
        const { html, css } = await epub.loadChapter(item.id);
        debuglog(
          verbosity,
          `    - html [${html.length}] lines: ${html.split("\n").length}`
        );
        // console.log(`----------\n${html}\n----------`);
        debuglog(verbosity, `    - css [${css.length}]`);
        for (const cssItem of css) {
          debuglog(verbosity, `      - ${cssItem.id}, ${cssItem.href}`);
        }
      } catch (error) {
        debuglog(
          verbosity,
          `    -error loading chapter ${item.id} ${item.href}: ${error.message}`
        );
      }
    }

    const toc = await epub.getToc();
    debuglog(verbosity, `- toc [${toc.length}]`);
    for (const item of toc) {
      debuglog(
        verbosity,
        `  - ${item.label}: id=${item.id}, href=${item.href}, playOrder=${
          item.playOrder
        } children: ${item?.children?.length ?? 0}`
      );
    }

    // get the start of the dom for each top level toc entry
    debuglog(verbosity, `- toc first html element [${toc.length}]`);
    for (const item of toc) {
      if (!item.id) {
        debuglog(
          verbosity,
          `  - id is null for ${item.label}: id=${item.id}, href=${
            item.href
          }, playOrder=${item.playOrder} children: ${
            item?.children?.length ?? 0
          }`
        );
        continue;
      }

      //  we cannot use the loadChapter because it returns the inside of the <body> tag
      // which is bad if the id in ON the <body id="0-068e12a8c93f4ef.. /> tag

      const { html } = await epub.loadChapter(item.id);

      // // my own loadChapter!
      // const xmlHref = manifest[item.id].href;
      // // console.log(`- xmlHref: ${xmlHref}`);
      // const xhtml = await epub.zip.readFile(xmlHref);
      // careful xhtml may include an <?xml version='1.0' encoding='utf-8'?> declaration
      // // console.log(`- xhtml: ${xhtml}`);

      debuglog(
        verbosity,
        `  - ${item.label}: id=${item.id}, href=${item.href}, playOrder=${
          item.playOrder
        } children: ${item?.children?.length ?? 0}`
      );
      debuglog(verbosity, `    - looking up href:${item.href}`);
      assert(item.href, "item.href is null - this should never happen");

      const { id, selector } = epub.resolveHref(item.href);
      debuglog(verbosity, `    - id:${id}, selector:'${selector}'`);
      assert(
        selector !== null,
        `selector is null - this should never happen href:${item.href} selector:${selector}`
      );

      // Create a new JSDOM instance with the HTML content
      // const dom = new JSDOM(html);
      const dom = new JSDOM(html);
      const document = dom.window.document;

      const element = selector
        ? document.querySelector(selector)
        : document.body;
      if (element) {
        debuglog(verbosity, `    - found element: ${element.tagName}`);
        // Get the text content of the element and its children
        const textContent = element.textContent?.trim();
        debuglog(
          verbosity,
          `    - text content length: ${textContent?.length ?? 0}`
        );
        if (textContent?.length > 0) {
          debuglog(
            verbosity,
            `    - text content snippet: ${snippet(textContent)}`
          );
        } else {
          // If no text content, look for first image's alt text
          const firstImage = element.querySelector("img");
          if (firstImage?.alt) {
            debuglog(
              verbosity,
              `    - image alt text: ${snippet(firstImage.alt)}`
            );
          } else {
            debuglog(
              verbosity,
              `    - no text content or image alt text found`
            );
          }
        }
      } else {
        debuglog(
          verbosity,
          `    - element not found with selector: ${selector}`
        );
        // console.log(`----------\n${html}\n----------`);
        // process.exit(1);
      }
    }

    // Just to show the difference between the different ways to get the html
    // const dom = new JSDOM("<p>Just a paragraph</p>");
    // console.log(
    //   `---dom.serialize(<p/>) -------\n${dom.serialize()}\n----------`
    // );
    // <html><head></head><body><p>Just a paragraph</p></body></html>
    // console.log(
    //   `---dom.window.document.body.innerHTML -------\n${dom.window.document.body.innerHTML}\n----------`
    // );
    // <p>Just a paragraph</p>
    // console.log(
    //   `---dom.window.document.documentElement.outerHTML -------\n${dom.window.document.documentElement.outerHTML}\n----------`
    // );
    // <html><head></head><body><p>Just a paragraph</p></body></html>
    // console.log(
    //   `---dom.window.document.documentElement.innerHTML -------\n${dom.window.document.documentElement.innerHTML}\n----------`
    // );
    // <head></head><body><p>Just a paragraph</p></body>

    return {
      parser: "lingo",
      toc,
      errors: [],
      warnings,
    };
  } catch (error) {
    // throw error;
    if (error instanceof assert.AssertionError) {
      // This is an assertion failure - we might want to handle it differently
      console.error("\n\nAssertion failed:", error.message);
      process.exit(1);
    }
    return {
      parser: "lingo",
      toc: [],
      errors: [error.message],
      warnings: [],
    };
  } finally {
    if (!warningsRestored) {
      console.warn = originalWarn;
    }
  }
}

function snippet(textContent, length = 40) {
  if (textContent) {
    const cleanedContent = textContent
      .replace(/\s+/g, " ") // Replace multiple spaces with a single space
      .replace(/\n+/g, "\n") // Replace multiple newlines with a single newline
      .trim(); // Remove leading and trailing whitespace

    const snippet = cleanedContent.slice(0, length);
    return `${snippet}${cleanedContent.length > length ? "..." : ""}`;
  }
  return "";
}

function debuglog(verbosity, ...args) {
  if (verbosity > 1) {
    // console.log("lingo:", ...args);
    console.log(...args);
  }
}
