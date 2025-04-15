import { promises as fs } from "node:fs";
import { basename } from "node:path";
import { chromium } from "playwright";

/**
 * @typedef {import('./types.mjs').TocEntry} TocEntry
 * @typedef {import('./types.mjs').Toc} Toc
 * @typedef {import('./types.mjs').ParserResult} ParserResult
 * @typedef {import('./types.mjs').ParseOptions} ParseOptions
 */

/**
 * @param {string} bookPath
 * @param {ParseOptions} [opts={}]
 * @returns {Promise<ParserResult>}
 */
export async function parse(bookPath, opts = {}) {
  console.error(`epubjs - invoked on ${basename(bookPath)}`);

  const { verbosity = 0 } = opts;
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
      warnings: [],
    };
  }

  // we accumulate these from the browser console log
  // we detect and capture these because epubjs logs errors to console instead of throwing them
  const errors: string[] = [];
  const warnings: string[] = [];

  const browser = await chromium.launch(/*{ headless: false, slowMo: 50 }*/);
  const page = await browser.newPage();
  page.on("console", async (msg) => {
    const args = msg.args();
    // evaluate runs the given function in the browser context, where the actual Error object exists
    // This is necessary because args[0] is a JSHandle - a proxy to the browser-side object
    // We're doing this because epubjs logs errors to console instead of throwing them
    // TypeError: t.getElementsByTagName is not a function +... stacktrace
    const isEpubjsLoggedError =
      (await args[0]?.evaluate((obj) => obj instanceof Error)) &&
      args.length === 1;

    const formattedArgs = args.map((arg) => `${arg}`).join(", ");

    if (isEpubjsLoggedError) {
      // Filter out stack trace lines (those starting with whitespace followed by 'at')
      // TypeError: t.getElementsByTagName is not a function +... stacktrace
      const errorMsg = formattedArgs
        .split("\n")
        .filter((line) => !line.match(/^\s+at/))
        .join("\n");
      // console.log(`** SPECIAL CASE 1 DETECTED: ${errorMsg}`);
      errors.push(errorMsg);
      return;
    }
    // second case:
    // if msg.type() is "error"
    if (msg.type() === "error") {
      // console.log(`** SPECIAL CASE 2 DETECTED: args.length:${args.length}`);
      // console.log(`** SPECIAL CASE 2 DETECTED: args[0]:${args[0]}`);
      // {message: File not found in the epub:...
      warnings.push(formattedArgs);
      return;
    }
    // other cases: this is me logging debug stuff mostly
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
  // wait for epubjs to be loaded and available on the window
  await page.waitForFunction(
    () => "ePub" in window && window.ePub !== undefined
  );
  // add the browser-specific code to the page
  await page.addScriptTag({ path: "./lib/epubjs-browser.js" });
  // wait for our script to be loaded and available on the window
  await page.waitForFunction(
    () => "myEpubjsParse" in window && window.myEpubjsParse !== undefined
  );

  const tocOutside = await page.evaluate(async (base64Buffer) => {
    // Type assertion needed because this is client-side code where myEpubjsParse is injected
    return (window as any).myEpubjsParse(base64Buffer);
  }, base64Buffer);

  await browser.close();
  return {
    parser: "epubjs",
    toc: tocOutside,
    errors: errors,
    warnings: warnings,
  };
}
