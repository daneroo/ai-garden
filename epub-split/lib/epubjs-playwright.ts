import { promises as fs } from "node:fs";
import { basename } from "node:path";
import { chromium } from "playwright";
import type { Page } from "playwright";
import { TocEntry, Toc, ParserResult, ParseOptions } from "./types.ts";
import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";

/**
 * @param {string} bookPath
 * @param {ParseOptions} [opts={}]
 * @param {string} [resourceSaveDir="./data/images"] Unused
 * @returns {Promise<ParserResult>}
 */
export async function parse(
  bookPath: string,
  opts: ParseOptions = {},
  resourceSaveDir: string = "./data/images"
): Promise<ParserResult> {
  console.error(`epubjs - invoked on ${basename(bookPath)}`);

  const { verbosity = 0 } = opts;
  const buffer = await fs.readFile(bookPath);
  // console.log(`debug:node:Buffer (${buffer.byteLength}) ${basename(bookPath)}`);
  const base64Buffer = buffer.toString("base64");

  // ok I want to replace the test on base64Buffer.length with a test on buffer.byteLength
  // base64Buffer.length is 4/3 of buffer.byteLength
  // so base64Buffer.length>100Mib => buffer.byteLength>75MiB
  const maxBufferByteLength = 75 * 1024 * 1024;
  console.error(
    ` buffer len test: ${prettySize(buffer.byteLength)} > ${prettySize(
      maxBufferByteLength
    )} : ${buffer.byteLength > maxBufferByteLength}`
  );
  // replaces:if (base64Buffer.length > maxBase64BufferSize) ...
  if (buffer.byteLength > maxBufferByteLength) {
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

  // await page.goto("about:blank");
  // Set up the page with jsSHA,jszip,epubjs libraries
  await page.setContent(`
        <html>
          <head>
            <script src="https://cdn.jsdelivr.net/npm/jssha/dist/sha1.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/jszip@3.1.5/dist/jszip.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js"></script>
          </head>
          <body>
            <input type="file" id="fileInput" />
          </body>
        </html>
      `);

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

  // Moved to setContent above
  // await page.addScriptTag({
  //   url: "https://cdn.jsdelivr.net/npm/jszip@3.1.5/dist/jszip.min.js",
  // });
  // await page.addScriptTag({
  //   url: "https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js",
  // });

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

async function uploadWithSetInputFiles(
  page: Page,
  filePath: string
): Promise<void> {
  await page.setInputFiles("#fileInput", filePath);
}

async function uploadWithBase64Buffer(
  page: Page,
  filePath: string
): Promise<void> {
  const fileBuffer = await readFile(filePath);
  const base64BufferAsString = Buffer.from(fileBuffer).toString("base64");
  const maxBase64Size = 100 * 1024 * 1024; // 100MiB
  if (base64BufferAsString.length > maxBase64Size) {
    const sizeMiB = (base64BufferAsString.length / 1024 / 1024).toFixed(2);
    throw new Error(`base64 upload: ${sizeMiB}MiB > 100MiB`);
  }
  await page.evaluate((base64BufferAsString) => {
    const input = document.getElementById("fileInput") as HTMLInputElement;
    // Convert base64 to Uint8Array in one line - this is very slow
    const bytes = Uint8Array.from(atob(base64BufferAsString), (c) =>
      c.charCodeAt(0)
    );
    // Create a File object from the bytes
    // File constructor takes: (parts, name, options)
    // parts: Array of Blob/ArrayBuffer/Uint8Array
    // name: String filename
    const file = new File([bytes], "upload.epub");
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
  }, base64BufferAsString);
}

async function getClientSize(page: Page): Promise<{ size: number }> {
  return page.evaluate(() => {
    const input = document.getElementById("fileInput") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) throw new Error("No file selected");
    return { size: file.size };
  });
}

async function getClientSHA(page: Page): Promise<string> {
  return page.evaluate(() => {
    const input = document.getElementById("fileInput") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) throw new Error("No file selected");

    return file.arrayBuffer().then((buffer) => {
      // @ts-ignore
      const shaObj = new jsSHA("SHA-1", "ARRAYBUFFER");
      shaObj.update(buffer);
      return shaObj.getHash("HEX");
    });
  });
}

function prettySize(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(2).padStart(6) + " MiB";
}
