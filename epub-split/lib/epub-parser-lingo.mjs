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
      const { html } = await epub.loadChapter(item.id);
      debuglog(
        verbosity,
        `  - ${item.label}: id=${item.id}, href=${item.href}, playOrder=${
          item.playOrder
        } children: ${item?.children?.length ?? 0}`
      );
      debuglog(verbosity, `    - looking up href:${item.href}`);
      const { id, selector } = epub.resolveHref(item.href);
      debuglog(verbosity, `    - id:${id}, selector:${selector}`);

      // Create a new JSDOM instance with the HTML content
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Find the element using the selector
      const element = document.querySelector(selector);
      if (element) {
        debuglog(verbosity, `    - found element: ${element.tagName}`);
        // Get the text content of the element and its children
        const textContent = element.textContent?.trim();
        debuglog(
          verbosity,
          `    - text content length: ${textContent?.length ?? 0}`
        );
      } else {
        debuglog(
          verbosity,
          `    - element not found with selector: ${selector}`
        );
      }
    }

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

function debuglog(verbosity, ...args) {
  if (verbosity > 1) {
    // console.log("lingo:", ...args);
    console.log(...args);
  }
}
