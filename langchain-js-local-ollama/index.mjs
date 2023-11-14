import { basename } from "node:path";
import yargs from "yargs";
import { getSources, getSource } from "./lib/sources.mjs";
import { formatSize, formatDuration } from "./lib/format.mjs";

await main();
async function main() {
  const startTime = +new Date();
  await processYargs();
  // await sourceSanity();
  const elapsed = formatDuration(+new Date() - startTime);
  console.log(`\nCompleted in ${elapsed}`);
}

async function sourceSanity(argv) {
  console.log(`# Sanity Check for Sources\n`);
  // console.log(`- argv: ${JSON.stringify(argv, null, 2)}`);
  const {
    // model, // not used
    doc: docs, // option is doc, but always an array
    verbose: verbosity,
  } = argv;
  const maxDocs = 999;
  // iterate over entries in sources.mjs - or docs array
  const sourceNicknames = docs ? docs : Object.keys(getSources());
  // iterate over sourceNicknames
  for (const sourceNickname of sourceNicknames) {
    const source = getSource(sourceNickname);
    console.log(`- ${source.name} nickName: ${sourceNickname}`);
    if (verbosity > 0) {
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
      if (verbosity > 1) {
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
}

async function processYargs() {
  await yargs(process.argv.slice(2))
    // global flags
    .option("model", {
      alias: "m",
      type: "string",
      choices: ["llama2", "mistral"], // Limit the options to 'llama2' and 'mistral'
      default: "llama2",
      describe: "Select the model to use for the (Ollama) LLM.",
    })
    .count("verbose")
    .alias("v", "verbose")
    .alias("h", "help")
    .command(
      "check-sources",
      "Verifies sources are available and can be loaded.",
      (yargs) => {
        // Command-specific flag
        return yargs.option("doc", {
          alias: "d",
          // type: "string",
          choices: Object.keys(getSources()), // Limit the options to the key in sources.mjs
          array: true,
          description: "include the document (by nickname)",
        });
      }, // the handler function
      async (argv) => {
        return sourceSanity(argv);
      }
    )
    // ... other commands and options ...
    .demandCommand()
    .help()
    .parseAsync();
}
