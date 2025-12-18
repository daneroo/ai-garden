import yargs from "yargs";
import process from "node:process";
import {
  getRequiredCommands,
  ModelShortName,
  ProgressInfo,
  RunCallbacks,
  RunConfig,
  RUNNER_NAMES,
  RunnerName,
  RunResult,
  runWhisper,
} from "./lib/runners.ts";
import { preflightCheck } from "./lib/preflight.ts";

// Configuration defaults
const DEFAULT_INPUT = "samples/hobbit-30m.mp3";
const DEFAULT_MODEL = "tiny.en";
const DEFAULT_OUTPUT = "output";
const DEFAULT_THREADS = 6;
const DEFAULT_START_SECS = 0; // Starting offset in seconds
const DEFAULT_DURATION_SECS = 0; // 0 = entire file
const DEFAULT_ITERATIONS = 1;

if (import.meta.main) {
  await main();
}

async function main(): Promise<void> {
  const argv = await yargs(process.argv.slice(2))
    .option("input", {
      alias: "i",
      type: "string",
      default: DEFAULT_INPUT,
      describe: "Path to the audio file to transcribe",
    })
    .option("model", {
      alias: "m",
      type: "string",
      default: DEFAULT_MODEL,
      describe: "Model shortname (tiny.en, base.en, small.en)",
      choices: ["tiny.en", "base.en", "small.en"],
    })
    .option("iterations", {
      type: "number",
      default: DEFAULT_ITERATIONS,
      describe: "Number of iterations for each test",
    })
    .option("threads", {
      alias: "t",
      type: "number",
      default: DEFAULT_THREADS,
      describe: "Number of threads for whisper-cpp",
    })
    .option("start", {
      alias: "s",
      type: "number",
      default: DEFAULT_START_SECS,
      describe: "Starting offset in seconds",
    })
    .option("duration", {
      alias: "d",
      type: "number",
      default: DEFAULT_DURATION_SECS,
      describe: "Duration in seconds (0 = entire file)",
    })
    .option("output", {
      alias: "o",
      type: "string",
      default: DEFAULT_OUTPUT,
      describe: "Output directory for results",
    })
    .option("runner", {
      alias: "r",
      type: "string",
      choices: RUNNER_NAMES,
      default: RUNNER_NAMES[0],
      describe: "Which whisper runner to use",
    })
    .option("dry-run", {
      alias: "n",
      type: "boolean",
      default: false,
      describe: "Show commands without executing",
    })
    .option("word-timestamps", {
      type: "boolean",
      default: false,
      describe: "Enable word-level timestamps",
    })
    .count("verbose")
    .alias("v", "verbose")
    .help()
    .alias("h", "help")
    .parseAsync();

  const {
    input,
    model,
    iterations,
    threads,
    start,
    duration,
    output,
    runner,
    "dry-run": dryRun,
    "word-timestamps": wordTimestamps,
    verbose: verbosity,
  } = argv;

  // Configuration for runner (iterations handled in main)
  const config: RunConfig = {
    input,
    modelShortName: model as ModelShortName,
    threads,
    startSec: start,
    durationSec: duration,
    outputDir: output,
    verbosity,
    dryRun,
    wordTimestamps,
    runner: runner as RunnerName,
  };

  // Preflight check
  const requiredCommands = getRequiredCommands(config);

  const { missing } = preflightCheck(requiredCommands);

  if (missing.length > 0) {
    console.error(`Error: Required commands not found: ${missing.join(", ")}`);
    process.exit(1);
  }

  console.log("");
  console.log("# Global Configuration");
  console.log("");
  console.log(`- Input: ${input}`);
  console.log(`- Model: ${model}`);
  if (start > 0) {
    console.log(`- Start: ${start}s`);
  }
  console.log(`- Duration: ${duration === 0 ? "entire file" : `${duration}s`}`);
  if (iterations > 1) {
    console.log(`- Iterations: ${iterations}`);
  }
  if (dryRun) {
    console.log("- Mode: DRY RUN");
  }

  // Callbacks for console output
  const callbacks: RunCallbacks = {
    onProgress: (info: ProgressInfo) => {
      const suffix = info.elapsed
        ? ` | Elapsed: ${info.elapsed} | Remaining: ${info.remaining}`
        : "";
      process.stdout.write(`\x1b[2K\r- [${info.percent}]${suffix}`);
    },
    onComplete: (result: RunResult) => {
      process.stdout.write("\x1b[2K\r");
      console.log(
        `✓ Done in ${result.elapsedSec}s. Speedup: ${result.speedup}x.`,
      );
    },
  };

  // Print runner header
  const label = runner === "whispercpp" ? "WhisperCPP" : "WhisperKit";
  console.log("");
  console.log(`## ${label}`);

  // Iteration loop (now handled in main)
  const results: RunResult[] = [];
  for (let i = 1; i <= iterations; i++) {
    if (iterations > 1 && !dryRun) {
      console.log(`\n### Iteration ${i}/${iterations}`);
    }
    const result = await runWhisper(config, callbacks);
    results.push(result);

    // Handle dry-run output after return
    if (result.dryRun) {
      console.log("");
      console.log("```");
      console.log(result.command);
      console.log("```");
    }
  }
}
