import { assignReportNames, discoverBooks, hashBook } from "./corpus.ts";
import { BrowserTransport } from "./epubts-browser.ts";
import { ROOTS } from "./config.ts";
import { inspectNode } from "./epubts-node.ts";
import { generateReports, reportPathForDisplay } from "./reports.ts";
import { inspectStoryteller } from "./storyteller.ts";
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
const browserRuntime = browser.runtime;
try {
  console.error(`- Browser transport: ${books.length} books`);
  for (let index = 0; index < books.length; index++) {
    const book = books[index];
    if (!book) throw new Error(`Missing hashed book at index ${index}`);
    writeProgress("browser", index + 1, books.length, book.relativePath);
    book.parserAttempts["epubts-browser"] = await browser.inspect(book);
  }
  clearProgress();
} finally {
  await browser.close();
}

// The node phase runs only after the browser, its localhost server, and all
// Playwright handles are fully torn down, keeping the LinkeDOM parser isolated
// from the browser runtime.
console.error(`- Node epub.ts: ${books.length} books`);
for (let index = 0; index < books.length; index++) {
  const book = books[index];
  if (!book) throw new Error(`Missing hashed book at index ${index}`);
  writeProgress("node", index + 1, books.length, book.relativePath);
  book.parserAttempts["epubts-node"] = await inspectNode(book);
}
clearProgress();

// Storyteller runs last, in its own hard-killable subprocess per book, for the
// same reason as the node path: a synchronous parser hang must not freeze the run.
console.error(`- Storyteller: ${books.length} books`);
for (let index = 0; index < books.length; index++) {
  const book = books[index];
  if (!book) throw new Error(`Missing hashed book at index ${index}`);
  writeProgress("storyteller", index + 1, books.length, book.relativePath);
  book.parserAttempts["storyteller"] = await inspectStoryteller(book);
}
clearProgress();

await generateReports(books, rootInventory, browserRuntime);

console.log(`Inspected ${books.length} EPUB files.`);
for (const root of rootInventory) {
  console.log(`- ${root.name}: ${root.count}`);
}
console.log(`Reports: ${reportPathForDisplay()}`);

// Force a clean exit: a parser that left a pending promise or timer must not
// keep the process alive after reports are written.
process.exit(0);

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
