import { chromium, Page } from "playwright";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { basename } from "node:path";

const filePath =
  "/Volumes/Space/Reading/audiobooks/Mary Beard - Twelve Caesars/Mary Beard - Twelve Caesars.epub";

interface ProcessOptions {
  doDigest?: boolean;
}

async function main(): Promise<void> {
  console.log("First run - size only:");
  await doOneFile(filePath, { doDigest: false });

  console.log("\nSecond run - with digest:");
  await doOneFile(filePath, { doDigest: true });
}

async function doOneFile(
  filePath: string,
  options: ProcessOptions = {}
): Promise<void> {
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
  const start = +new Date();
  console.log(`Uploading: ${filePath}`);
  await upload(page, filePath);

  const { result: size } = await timeIt(() => getClientSize(page));
  console.log(
    `✓ Browser file size: ${size.size} bytes - in ${+new Date() - start}ms`
  );

  if (options.doDigest) {
    const { result: digest, elapsed } = await timeIt(() => getClientSHA(page));
    console.log(`✓ Browser SHA-1: ${digest} - ${elapsed}ms`);

    // Calculate hash in Node.js for comparison
    const { result: nodeHash, elapsed: nodeTime } = await timeIt(async () => {
      const fileBuffer = await readFile(filePath);
      return createHash("sha1").update(fileBuffer).digest("hex");
    });
    console.log(`✓ Node.js  SHA-1: ${nodeHash} - ${nodeTime}ms`);

    const match = digest === nodeHash;
    console.log(match ? "✓ Hashes match!" : "✗ Hash mismatch!");
  }

  await browser.close();
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
