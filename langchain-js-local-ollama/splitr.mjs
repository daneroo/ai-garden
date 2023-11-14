import { basename } from "node:path";
import { getSource } from "./lib/sources.mjs";

import {
  RecursiveCharacterTextSplitter,
  TokenTextSplitter,
} from "langchain/text_splitter";

const sourceNickname = "neon-shadows.txt"; // neon-shadows.txt, hero-of-ages.epub
const { name, loader } = getSource(sourceNickname);

console.log(`\n# Load/Splitter\n`);

console.log(`\n## Load document (${name})\n`);

const docs = await loader.load();
console.log(`  - fetched ${docs.length} document(s)`);
// for (const [i, doc] of docs.entries()) {
for (const [i, doc] of Array.from(docs.entries()).slice(0, 10)) {
  const source = basename(doc.metadata.source);
  console.log(
    `    - document ${i} length: ${doc.pageContent.length} characters source: ${source}:`
  );
  // snip
  const snip = doc.pageContent.substring(0, 100).replace(/\n/g, " ");
  console.log(`      ${snip}...`);
  // full
  // console.log(doc.pageContent);
}

console.log(`\n## Split document (${name})\n`);

const splitters = [
  {
    name: "RecursiveCharacterTextSplitter",
    splitter: new RecursiveCharacterTextSplitter({
      chunkSize: 700,
      chunkOverlap: 200,
    }),
  },
  {
    name: "TokenTextSplitter",
    splitter: new TokenTextSplitter({
      // encodingName: "gpt2",
      chunkSize: 100,
      chunkOverlap: 10,
    }),
  },
];

for (const { name, splitter } of splitters) {
  console.log(`\n### Split method (${name})\n`);

  const splitDocuments = await splitter.splitDocuments(docs);

  console.log(`  - split into ${splitDocuments.length} document chunks`);
  // for (const [i, doc] of splitDocuments.entries()) {
  for (const [i, doc] of Array.from(splitDocuments.entries()).slice(0, 10)) {
    const source = basename(doc.metadata.source);

    const loc = `${doc.metadata.loc.lines.from} - ${doc.metadata.loc.lines.to}`;
    console.log(
      `    - chunk ${i} length: ${doc.pageContent.length} characters source: ${source} - loc: ${loc}:`
    );
    // snip
    const snip = doc.pageContent.substring(0, 100).replace(/\n/g, " ");
    console.log(`        ${snip}...`);
    // full
    // console.log(doc.pageContent);
  }
}
