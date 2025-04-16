import { chromium, Page } from "playwright";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { basename } from "node:path";
import fg from "fast-glob";

const rootPath = "/Volumes/Space/Reading/audiobooks";
const filePath =
  "/Volumes/Space/Reading/audiobooks/Mary Beard - Twelve Caesars/Mary Beard - Twelve Caesars.epub";

interface ProcessOptions {
  doDigest?: boolean;
  useBase64?: boolean;
}

interface ProcessResult {
  size: {
    client: number;
    server: number;
    elapsed: number; // upload time
  };
  digest: {
    client: string;
    server: string;
    elapsed: number; // total digest time (client + server)
  };
}

async function main(): Promise<void> {
  const doDigest = false;
  // const useBase64 = true;
  // const files = [filePath, filePath, filePath, filePath, filePath];
  const files = await fg(`${rootPath}/**/*.epub`);
  console.log("| ✓/✗ | elapsed | size | digest | file |");
  console.log("|-----|---------|------|--------|------|");

  let totalElapsed = 0;
  let totalSize = 0;
  let allMatch = true;

  for (const filePath of files) {
    for (const useBase64 of [true, false]) {
      try {
        const result = await doOneFile(filePath, { doDigest, useBase64 });
        const sizeMatch = result.size.client === result.size.server;
        const digestMatch = result.digest.client === result.digest.server;
        const match = sizeMatch && digestMatch;
        allMatch = allMatch && match;

        totalElapsed += result.size.elapsed;
        totalSize += result.size.client;

        console.log(
          `| ${match ? "✓" : "✗"} | ${result.size.elapsed
            .toString()
            .padStart(6)}ms | ${prettySize(
            result.size.client
          )} | ${result.digest.client.padStart(40)} | ${basename(filePath)} ${
            useBase64 ? "(base64)" : ""
          }|`
        );
      } catch (error) {
        const errorMsg = error.message.padStart(40);
        console.log(
          `| ✗ |       - | ${"      -".padStart(10)} | ${errorMsg} | ${basename(
            filePath
          )} ${useBase64 ? "(base64)" : ""}|`
        );
      }
    }
  }

  // Summary row
  const avgElapsed = Math.round(totalElapsed / files.length);
  const avgSize = totalSize / files.length;
  console.log("|-----|---------|------|--------|------|");
  console.log(
    `| ${allMatch ? "✓" : "✗"} | ${avgElapsed
      .toString()
      .padStart(6)}ms | ${prettySize(avgSize)} | - | ${files.length} files |`
  );
}

function prettySize(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(2).padStart(6) + " MiB";
}

async function doOneFile(
  filePath: string,
  options: ProcessOptions = {}
): Promise<ProcessResult> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();

    // Set up the page with jsSHA library
    await page.setContent(`
      <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/jssha/dist/sha1.min.js"></script>
        </head>
        <body>
          <input type="file" id="fileInput" />
        </body>
      </html>
    `);

    // Upload and process file
    const uploadStart = +new Date();
    if (options.useBase64) {
      await uploadWithBase64Buffer(page, filePath);
    } else {
      await uploadWithSetInputFiles(page, filePath);
    }
    const uploadTime = +new Date() - uploadStart;

    const { result: clientSize } = await timeIt(() => getClientSize(page));
    const { result: serverSize } = await timeIt(async () => {
      const stats = await stat(filePath);
      return stats.size;
    });

    const result: ProcessResult = {
      size: {
        client: clientSize.size,
        server: serverSize,
        elapsed: uploadTime,
      },
      digest: {
        client: "none",
        server: "none",
        elapsed: 0,
      },
    };

    if (!options.doDigest) {
      return result;
    }

    const digestStart = +new Date();
    const { result: clientDigest } = await timeIt(() => getClientSHA(page));
    const { result: serverDigest } = await timeIt(async () => {
      const fileBuffer = await readFile(filePath);
      return createHash("sha1").update(fileBuffer).digest("hex");
    });
    const digestTime = +new Date() - digestStart;

    result.digest = {
      client: clientDigest,
      server: serverDigest,
      elapsed: digestTime,
    };

    return result;
  } finally {
    await browser.close();
  }
}

async function timeIt<T>(
  fn: () => Promise<T>
): Promise<{ result: T; elapsed: number }> {
  const t0 = +new Date();
  const result = await fn();
  const t1 = +new Date();
  return { result, elapsed: t1 - t0 };
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
  const maxBase64BufferSize = 100 * 1024 * 1024; // 100MiB
  if (fileBuffer.length > maxBase64BufferSize) {
    const sizeMiB = (fileBuffer.length / 1024 / 1024).toFixed(2);
    throw new Error(`base64 upload: ${sizeMiB}MiB > 100MiB`);
  }
  const base64BufferAsString = Buffer.from(fileBuffer).toString("base64");
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

main().catch((err) => {
  console.error("Error:", err);
});
