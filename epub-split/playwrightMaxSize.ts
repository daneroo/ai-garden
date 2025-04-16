import { chromium, Page } from "playwright";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { basename } from "node:path";

const filePath =
  "/Volumes/Space/Reading/audiobooks/Mary Beard - Twelve Caesars/Mary Beard - Twelve Caesars.epub";

interface ProcessOptions {
  doDigest?: boolean;
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
  console.log("First run - size only:");
  const result1 = await doOneFile(filePath, { doDigest: false });
  console.log("Result:", result1);

  console.log("\nSecond run - with digest:");
  const result2 = await doOneFile(filePath, { doDigest: true });
  console.log("Result:", result2);
}

async function doOneFile(
  filePath: string,
  options: ProcessOptions = {}
): Promise<ProcessResult> {
  const browser = await chromium.launch();
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
  console.log(`Uploading: ${filePath}`);
  await upload(page, filePath);
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
    await browser.close();
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

  await browser.close();
  return result;
}

async function timeIt<T>(
  fn: () => Promise<T>
): Promise<{ result: T; elapsed: number }> {
  const t0 = +new Date();
  const result = await fn();
  const t1 = +new Date();
  return { result, elapsed: t1 - t0 };
}

async function upload(page: Page, filePath: string): Promise<void> {
  await page.setInputFiles("#fileInput", filePath);
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
      const shaObj = new jsSHA("SHA-1", "ARRAYBUFFER");
      shaObj.update(buffer);
      return shaObj.getHash("HEX");
    });
  });
}

main().catch((err) => {
  console.error("Error:", err);
});
