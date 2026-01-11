import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { readFileSync } from "node:fs";
import process from "node:process";
import { formatTimestamp, parseVtt } from "@bun-one/vtt";
// import { getMetadata } from "@bun-one/epub"; // TODO: Port epub package

async function main() {
  await yargs(hideBin(process.argv))
    .scriptName("cli")
    .command(
      "vtt <file>",
      "Parse a VTT file",
      (yargs) => {
        return yargs.positional("file", {
          type: "string",
          demandOption: true,
          describe: "Path to VTT file",
        });
      },
      (argv) => {
        const content = readFileSync(argv.file, "utf-8");
        const cues = parseVtt(content);
        console.log(`Parsed ${cues.length} cues`);
      },
    )
    .command(
      "epub <file>",
      "Get EPUB metadata (Not implemented yet)",
      {},
      () => {
        console.log("EPUB support coming in future phase");
        // const meta = getMetadata(argv.file);
        // console.log(`Title: ${meta.title}, Author: ${meta.author}`);
      },
    )
    .command(
      "time <seconds>",
      "Format timestamp",
      (yargs) => {
        return yargs.positional("seconds", {
          type: "string",
          demandOption: true,
          describe: "Seconds to format",
        });
      },
      (argv) => {
        console.log(formatTimestamp(Number(argv.seconds)));
      },
    )
    .demandCommand(1)
    .help()
    .parse();
}

main().catch(console.error);
