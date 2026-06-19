import { assignReportNames, discoverBooks, hashBook } from "./books.ts";
import { BrowserTransport } from "./browser-transport.ts";
import { ROOTS } from "./config.ts";
import { generateReports, reportPathForDisplay } from "./reports.ts";
import type { HashedBook, RootInventory } from "./types.ts";

if (process.argv.length > 2) {
  throw new Error("epub-inspect takes no arguments; every run processes all roots");
}

const books: HashedBook[] = [];
const rootInventory: RootInventory[] = [];

for (const root of ROOTS) {
  const discovered = await discoverBooks(root);
  rootInventory.push({ name: root.name, count: discovered.length });
  console.error(`- Inspecting ${root.name}: ${discovered.length} books`);

  for (let index = 0; index < discovered.length; index++) {
    const book = discovered[index];
    if (!book) throw new Error(`Missing discovered book at index ${index}`);
    writeProgress(root.name, index + 1, discovered.length, book.relativePath);
    books.push(await hashBook(book));
  }
  clearProgress();
}

assignReportNames(books);

const browser = await BrowserTransport.launch();
try {
  console.error(`- Browser transport: ${books.length} books`);
  for (let index = 0; index < books.length; index++) {
    const book = books[index];
    if (!book) throw new Error(`Missing hashed book at index ${index}`);
    writeProgress("browser", index + 1, books.length, book.relativePath);
    book.parserAttempts["epubts-browser"] = await browser.inspect(book);
  }
  clearProgress();
  await generateReports(books, rootInventory, browser.runtime);
} finally {
  await browser.close();
}

console.log(`Inspected ${books.length} EPUB files.`);
for (const root of rootInventory) {
  console.log(`- ${root.name}: ${root.count}`);
}
console.log(`Reports: ${reportPathForDisplay()}`);

function writeProgress(
  root: string,
  current: number,
  total: number,
  relativePath: string
): void {
  if (!process.stderr.isTTY) {
    if (current === 1 || current === total || current % 100 === 0) {
      console.error(`  ${root}: ${current}/${total}`);
    }
    return;
  }
  const width = Math.max(20, (process.stderr.columns ?? 100) - 35);
  const name =
    relativePath.length > width
      ? `${relativePath.slice(0, Math.max(1, width - 1))}…`
      : relativePath;
  process.stderr.write(`\r\u001b[2K${root} ${current}/${total} ${name}`);
}

function clearProgress(): void {
  if (process.stderr.isTTY) process.stderr.write("\r\u001b[2K");
}
