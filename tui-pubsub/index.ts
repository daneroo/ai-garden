import { exit } from "node:process";
import { fizzbuzz } from "./lib/fizbuzz.ts";
import yargs from "yargs";

// Wrap in IIFE to support top-level await in CommonJS context (tsx default)
(async () => {
  try {
    await main();
    exit(0);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error:", message);
    exit(1);
  }
})();

async function main() {
  const argv = await yargs(process.argv.slice(2))
    .option("pubsub", {
      alias: "p",
      type: "string",
      choices: ["jsonl", "nats"],
      default: "jsonl",
      describe: "pubsub transport",
    })
    .option("seconds", {
      alias: "s",
      type: "number",
      default: 600,
      describe: "Number of seconds to run",
    })
    .count("verbose")
    .alias("v", "verbose")
    .help()
    .alias("h", "help")
    .parseAsync();

  // destructure arguments
  const { pubsub, seconds, verbose: verbosity } = argv;

  let secondsElapsed = 0;

  console.error("Starting clock...");
  while (secondsElapsed < seconds) {
    const tickMillis = Date.now();
    const result = fizzbuzz(tickMillis);
    console.log(JSON.stringify(result));
    await delay(1000);
    secondsElapsed++;
  }
  console.error("Clock finished");
}

async function delay(millis: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, millis));
}
