import yargs from "yargs";
import process from "node:process";
import { formatTimestamp, parseVtt } from "@prosidio/vtt";
import { getMetadata } from "@prosidio/epub";

if (import.meta.main) {
  await main();
}

async function main(): Promise<void> {
  await yargs(process.argv.slice(2))
    // Deno's $0 resolves to 'deno' not the script name; .scriptName() is the official yargs fix
    .scriptName("cli")
    .command(
      "vtt <file>",
      "Parse a VTT file",
      {},
      (argv: { file: string | URL }) => {
        const cues = parseVtt(Deno.readTextFileSync(argv.file));
        console.log(`Parsed ${cues.length} cues`);
      },
    )
    .command(
      "epub <file>",
      "Get EPUB metadata",
      {},
      (argv: { file: string }) => {
        const meta = getMetadata(argv.file);
        console.log(`Title: ${meta.title}, Author: ${meta.author}`);
      },
    )
    .command(
      "time <seconds>",
      "Format timestamp",
      {},
      (argv: { seconds: string }) => {
        console.log(formatTimestamp(Number(argv.seconds)));
      },
    )
    .demandCommand(1)
    .help()
    .parseAsync();
}
