import { assignReportNames, discoverBooks, hashBook } from "./books.ts";
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
await generateReports(books, rootInventory);

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
  if (!process.stderr.isTTY) return;
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
