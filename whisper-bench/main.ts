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
import { getAudioFileDuration } from "./lib/audio.ts";

// Configuration defaults
const DEFAULT_INPUT = "data/samples/hobbit-30m.mp3";
const DEFAULT_MODEL = "tiny.en";
const DEFAULT_OUTPUT = "data/output";
const DEFAULT_WORK = "data/work";
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
    .option("tag", {
      alias: "t",
      type: "string",
      describe:
        "Tag appended to output filename (e.g., 'kit-tiny' → input.kit-tiny.vtt)",
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
    tag,
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
    workDir: DEFAULT_WORK,
    tag,
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

  // Calculate effective duration for display
  let effectiveDuration: number;
  if (duration > 0) {
    effectiveDuration = duration;
  } else {
    const fileDuration = await getAudioFileDuration(input);
    effectiveDuration = Math.round(fileDuration - start);
  }

  // Build compact config string
  const configParts = [
    `input=${input}`,
    `model=${model}`,
    `runner=${runner}`,
    `duration=${effectiveDuration}s`,
  ];
  if (start > 0) configParts.push(`start=${start}s`);
  if (iterations > 1) configParts.push(`iterations=${iterations}`);
  if (dryRun) configParts.push("dry-run");

  const configStr = configParts.join(" ");
  console.error(`[config] ${configStr}`);

  // Callbacks: progress to stderr
  const callbacks: RunCallbacks = {
    onProgress: (info: ProgressInfo) => {
      const suffix = info.elapsed
        ? ` | ${info.elapsed} | ${info.remaining}`
        : "";
      process.stderr.write(`\x1b[2K\r[${info.percent}]${suffix}`);
    },
    onComplete: () => {
      process.stderr.write("\x1b[2K\r");
    },
  };

  // Iteration loop
  const results: RunResult[] = [];
  for (let i = 1; i <= iterations; i++) {
    const result = await runWhisper(config, callbacks);
    results.push(result);

    // Compact result to stderr
    if (!result.dryRun) {
      const iterPart = iterations > 1 ? ` ${i}/${iterations}` : "";
      const vttDur = result.vttSummary?.durationSec ?? "none";
      console.error(
        `[result${iterPart}] elapsed=${result.elapsedSec}s speedup=${result.speedup}x vttDuration=${vttDur}s`,
      );
    }

    // Output single-line JSON to stdout
    console.log(JSON.stringify(result));
  }
}
