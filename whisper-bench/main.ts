import yargs from "yargs";
import process from "node:process";
import {
  createRunWorkDir,
  getRequiredCommands,
  ModelShortName,
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
const DEFAULT_OUTPUT_DIR = "data/output";
const DEFAULT_WORKDIR_ROOT = "data/work";
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
      default: DEFAULT_OUTPUT_DIR,
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
    .option("json", {
      type: "boolean",
      default: false,
      describe: "Output result as JSON instead of pretty summary",
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
    json,
    "word-timestamps": wordTimestamps,
    verbose: verbosity,
  } = argv;

  // Create per-run work directory (depends on: input, tag)
  const runWorkDir = createRunWorkDir({
    workDirRoot: DEFAULT_WORKDIR_ROOT,
    inputPath: input,
    tag,
  });

  // Configuration for runner (iterations handled in main)
  const config: RunConfig = {
    input,
    modelShortName: model as ModelShortName,
    threads,
    startSec: start,
    durationSec: duration,
    outputDir: output,
    runWorkDir,
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

  // Iteration loop
  const results: RunResult[] = [];
  for (let i = 1; i <= iterations; i++) {
    const result = await runWhisper(config);
    results.push(result);

    // Compact result to stderr
    if (!result.dryRun) {
      const iterPart = iterations > 1 ? ` ${i}/${iterations}` : "";
      const vttDur = result.vttSummary
        ? `${result.vttSummary.durationSec}s`
        : "none";
      console.error(
        `[result${iterPart}] elapsed=${result.elapsedSec}s speedup=${result.speedup}x vttDuration=${vttDur}`,
      );
    }

    // Output to STDOUT
    if (json) {
      // Output single-line JSON to stdout for scriptability
      console.log(JSON.stringify(result));
    } else {
      // Pretty summary for human readability
      const label = iterations > 1
        ? `Iteration ${i}/${iterations}:`
        : "Result:";
      const vttDur = result.vttSummary
        ? `${result.vttSummary.durationSec}s`
        : "none";
      console.log(`\n${label}`);
      console.log(`  Runner:    ${result.runner}`);
      console.log(`  Elapsed:   ${result.elapsedSec}s`);
      console.log(`  Speedup:   ${result.speedup}x`);
      console.log(`  Output:    ${result.outputPath}`);
      console.log(`  VTT Dur:   ${vttDur}`);
      console.log(
        `  Logs:      ${result.logFiles.stdout} / ${result.logFiles.stderr}`,
      );
    }
  }
}
