import { getSources } from "./lib/sources.mjs";
import { formatSize, SizeFormat } from "./lib/format.mjs";
import { basename } from "node:path";

console.log(`# Sanity Check for Sources\n`);
const verbose = 1;
const maxDocs = 999;
// iterate over entries in sources.mjs
for (const [sourceNickname, source] of Object.entries(getSources())) {
  console.log(`- ${source.name} nickName: ${sourceNickname}`);
  if (verbose > 0) {
    // load the source, count the docs, show total length, and snippet of first document
    const { name, loader } = source;
    const docs = await loader.load();
    const totalSize = docs.reduce(
      (acc, doc) => acc + doc.pageContent.length,
      0
    );
    console.log(
      `  - fetched ${docs.length} document(s) total size: ${formatSize(
        totalSize
      )}`
    );
    if (verbose > 1) {
      for (const [i, doc] of Array.from(docs.entries()).slice(0, maxDocs)) {
        const source = basename(doc.metadata.source);
        const size = formatSize(doc.pageContent.length);
        console.log(`    - document ${i}: size: ${size}  source: ${source}:`);
        // snip
        const snip = doc.pageContent.substring(0, 100).replace(/\n/g, " ");
        console.log(`      ${snip}...`);
        // full
        // console.log(doc.pageContent);
      }
    }
  }
}
