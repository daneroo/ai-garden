import { promises as fs } from "node:fs";
import { basename } from "node:path";
import { chromium } from "playwright";
import type { Page } from "playwright";
import { TocEntry, Toc, ParserResult, ParseOptions } from "./types.ts";
import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import assert from "node:assert";

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
  // optional upload integrity checks on size and sha - well tested and not necessary
  const checkIntegrity = false;

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

  // wait for epubjs to be loaded and available on the window
  await page.waitForFunction(
    () => "ePub" in window && window.ePub !== undefined
  );

  // add the browser-specific code to the page
  await page.addScriptTag({ path: "./lib/epubjs-browser.js" });
  // wait for our script to be loaded and available on the window
  await page.waitForFunction(
    () =>
      "parseEpubFromInputFiles" in window &&
      window.parseEpubFromInputFiles !== undefined
  );

  // step 1 of replacing base64Buffer with ArrayBuffer
  // upload the file
  await uploadWithSetInputFiles(page, bookPath);

  // compare the size and sha digest of the uploaded file with the original file
  if (checkIntegrity) {
    await checkClientUploadIntegrity(page, bookPath, verbosity);
  }

  const tocOutside = await page.evaluate(async () => {
    // Calling parseEpubFromInputFiles() implies that:
    //  - the file is already uploaded with uploadWithSetInputFiles
    // Type assertion needed because this is client-side code where parseEpubFromInputFiles is injected
    return (window as any).parseEpubFromInputFiles();
  });

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

async function checkClientUploadIntegrity(
  page: Page,
  bookPath: string,
  verbosity: number
): Promise<void> {
  // compare the size of the uploaded file with the original file
  const clientSize = await getClientSize(page);
  const serverSize = await getServerSize(bookPath);
  if (serverSize !== clientSize) {
    console.error(`size mismatch: server=${serverSize} client=${clientSize}`);
  } else {
    if (verbosity > 0) {
      console.error(`- size match: server=${serverSize} client=${clientSize}`);
    }
  }
  assert.equal(
    serverSize,
    clientSize,
    `size mismatch: server=${serverSize} client=${clientSize}`
  );

  const clientSHA = await getClientSHA(page);
  const serverSHA = await getServerSHA(bookPath);
  if (serverSHA !== clientSHA) {
    console.error(`sha mismatch: server=${serverSHA} client=${clientSHA}`);
  } else {
    if (verbosity > 0) {
      console.error(`- sha match: server=${serverSHA} client=${clientSHA}`);
    }
  }
  assert.equal(
    serverSHA,
    clientSHA,
    `sha mismatch: server=${serverSHA} client=${clientSHA}`
  );
}
async function getServerSize(filePath: string): Promise<number> {
  const fileBuffer = await readFile(filePath);
  return fileBuffer.length;
}

async function getClientSize(page: Page): Promise<number> {
  return page.evaluate(() => {
    const input = document.getElementById("fileInput") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) throw new Error("No file selected");
    return file.size;
  });
}

async function getServerSHA(filePath: string): Promise<string> {
  const fileBuffer = await readFile(filePath);
  return createHash("sha1").update(fileBuffer).digest("hex");
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
  return (bytes / 1024 / 1024).toFixed(2).padStart(6) + "MiB";
}

async function timeIt<T>(
  fn: () => Promise<T>
): Promise<{ result: T; elapsed: number }> {
  const t0 = +new Date();
  const result = await fn();
  const t1 = +new Date();
  return { result, elapsed: t1 - t0 };
}
