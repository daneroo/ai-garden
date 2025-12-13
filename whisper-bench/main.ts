import yargs from "yargs";
import process from "node:process";
import { RunConfig, runWhisperCpp, runWhisperKit } from "./lib/runners.ts";
import { preflightCheck } from "./lib/preflight.ts";

// Configuration defaults
const DEFAULT_INPUT = "samples/hobbit-30m.mp3";
const DEFAULT_MODEL = "tiny.en";
const DEFAULT_OUTPUT = "output";
const DEFAULT_THREADS = 6;
const DEFAULT_START_SECS = 0; // Starting offset in seconds
const DEFAULT_DURATION_SECS = 0; // 0 = entire file
const DEFAULT_ITERATIONS = 1;

// Model directory for whisper-cpp
const WHISPER_CPP_MODELS = "models";

// Runner definitions
const RUNNERS = {
  brew: {
    exec: "whisper-cli",
    label: "WhisperCPP (brew)",
    type: "cpp" as const,
  },
  self: {
    exec: "../external-repos/whisper.cpp/build/bin/whisper-cli",
    label: "WhisperCPP (self)",
    type: "cpp" as const,
  },
  kit: {
    exec: "whisperkit-cli",
    label: "WhisperKit",
    type: "kit" as const,
  },
};

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
      describe: "Model shortname (tiny.en, base.en, small.en, medium.en)",
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
      choices: ["brew", "self", "kit", "all"],
      default: "all",
      describe: "Which whisper runner to use",
    })
    .option("dry-run", {
      alias: "n",
      type: "boolean",
      default: false,
      describe: "Show commands without executing",
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
    verbose: verbosity,
  } = argv;

  // Determine which runners to execute
  const runnersToExecute = runner === "all"
    ? (Object.keys(RUNNERS) as (keyof typeof RUNNERS)[])
    : [runner as keyof typeof RUNNERS];

  // Preflight check
  const { missing, warnings } = preflightCheck(
    runnersToExecute.map((k) => RUNNERS[k]),
  );

  if (missing.length > 0) {
    console.error(`Error: Required commands not found: ${missing.join(", ")}`);
    process.exit(1);
  }

  // Build model path for whisper-cpp from shortname
  const modelBin = `${WHISPER_CPP_MODELS}/ggml-${model}.bin`;

  console.log("");
  console.log("# Global Configuration");
  console.log("");
  console.log(`- Input: ${input}`);
  console.log(`- Model: ${model}`);
  if (start > 0) {
    console.log(`- Start: ${start}s`);
  }
  console.log(`- Duration: ${duration === 0 ? "entire file" : `${duration}s`}`);
  if (dryRun) {
    console.log("- Mode: DRY RUN");
  }
  if (warnings.length > 0) {
    console.log("");
    console.log("⚠ Missing runners (will be skipped):");
    for (const w of warnings) {
      console.log(`  - ${w}`);
    }
  }

  const config: RunConfig = {
    input,
    model,
    modelBin,
    iterations,
    threads,
    startSec: start,
    durationSec: duration,
    outputDir: output,
    verbosity,
    dryRun,
  };

  for (const key of runnersToExecute) {
    const r = RUNNERS[key];
    if (r.type === "cpp") {
      await runWhisperCpp(r.exec, r.label, key, config);
    } else {
      await runWhisperKit(r.exec, r.label, key, config);
    }
  }
}
