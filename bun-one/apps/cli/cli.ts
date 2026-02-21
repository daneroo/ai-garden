import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { readFileSync } from "node:fs";
import process from "node:process";
import { parseVtt, secondsToVttTime } from "@bun-one/vtt";

async function main() {
  await yargs(hideBin(process.argv))
    .scriptName("cli")
    .command(
      "vtt <file>",
      "Parse and inspect a VTT file",
      (yargs) => {
        return yargs.positional("file", {
          type: "string",
          demandOption: true,
          describe: "Path to VTT file",
        });
      },
      (argv) => {
        const content = readFileSync(argv.file, "utf-8");
        const { value: classified, warnings } = parseVtt(content);

        switch (classified.type) {
          case "composition": {
            const { segments } = classified.value;
            const cueCount = segments.reduce((n, s) => n + s.cues.length, 0);
            console.log(
              `Composition: ${segments.length} segments, ${cueCount} cues`,
            );
            for (const seg of segments) {
              console.log(
                `  Segment ${seg.provenance.segment}: ${seg.cues.length} cues`,
              );
            }
            break;
          }
          case "transcription":
            console.log(`Transcription: ${classified.value.cues.length} cues`);
            break;
          case "raw":
            console.log(`Raw: ${classified.value.cues.length} cues`);
            break;
        }

        if (warnings.length > 0) {
          console.log(`Warnings:`);
          for (const w of warnings) {
            console.log(`  ${w}`);
          }
        }
      },
    )
    .command(
      "epub <file>",
      "Get EPUB metadata (Not implemented yet)",
      {},
      () => {
        console.log("EPUB support coming in future phase");
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
        console.log(secondsToVttTime(Number(argv.seconds)));
      },
    )
    .demandCommand(1)
    .help()
    .parse();
}

main().catch(console.error);
