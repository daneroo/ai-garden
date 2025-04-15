import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const filePath =
  "/Volumes/Space/Reading/audiobooks/Mary Beard - Twelve Caesars/Mary Beard - Twelve Caesars.epub";

async function main(): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setContent(`
    <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/jssha/dist/sha1.min.js"></script>
      </head>
      <body>
        <input type="file" id="fileInput" />
        <script>
          document.getElementById('fileInput').addEventListener('change', async (e) => {
            try {
              const file = e.target.files[0];
              const t0 = performance.now();
              const buffer = await file.arrayBuffer();
              const shaObj = new jsSHA("SHA-1", "ARRAYBUFFER");
              shaObj.update(buffer);
              const hash = shaObj.getHash("HEX");
              const t1 = performance.now();
              console.log("HASH", file.name, buffer.byteLength, hash, Math.round(t1 - t0));
            } catch (err) {
              console.log("FAILED TO READ FILE", err?.message ?? err);
            }
          });
        </script>
      </body>
    </html>
  `);

  const hashPromise = new Promise<{ hash: string; time: number }>((resolve) => {
    page.on("console", async (msg) => {
      const values = await Promise.all(
        msg.args().map((arg) => arg.jsonValue())
      );
      const text = values.join(" ");
      console.log("[browser]", ...values);
      if (text.startsWith("HASH")) {
        resolve({ hash: values[3], time: values[4] });
      }
    });
  });

  console.log(`Uploading: ${filePath}`);
  await page.setInputFiles("#fileInput", filePath);

  const { hash: browserHash, time: browserTime } = await hashPromise;
  console.log(`✓ Browser SHA-1: ${browserHash} - ${browserTime}ms`);

  const nodeStart = Date.now();
  const fileBuffer = await readFile(filePath);
  const nodeHash = createHash("sha1").update(fileBuffer).digest("hex");
  const nodeTime = Date.now() - nodeStart;
  console.log(`✓ Node.js  SHA-1: ${nodeHash} - ${nodeTime}ms`);

  const match = browserHash === nodeHash;
  console.log(match ? "✅ Hashes match!" : "❌ Hash mismatch!");

  await browser.close();
}

main().catch((err) => {
  console.error("Error:", err);
});
