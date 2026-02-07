import yargs from "yargs";
import process from "node:process";
import {
  createRunWorkDir,
  getRequiredCommands,
  type ModelShortName,
  type RunConfig,
  type RunResult,
  runWhisper,
} from "./lib/runners.ts";
import { preflightCheck } from "./lib/preflight.ts";
import { parseDuration } from "./lib/duration.ts";

// Configuration defaults
const DEFAULT_INPUT = "data/samples/hobbit-30m.mp3";
const DEFAULT_MODEL = "tiny.en";
const DEFAULT_OUTPUT_DIR = "data/output";
const DEFAULT_WORKDIR_ROOT = "data/work";
const DEFAULT_THREADS = 6;
const DEFAULT_DURATION_SECS = 0; // 0 = entire file
const DEFAULT_ITERATIONS = 1;

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : `Unknown error: ${String(error)}`;
    console.error(`Error: ${message}`);
    process.exit(1);
  }
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
    .option("cache", {
      type: "boolean",
      default: true,
      describe: "Enable WAV and VTT caching (use --no-cache to disable)",
    })
    .option("tag", {
      alias: "t",
      type: "string",
      describe:
        "Tag appended to output filename (e.g., 'kit-tiny' → input.kit-tiny.vtt)",
    })
    .option("segment", {
      alias: "S",
      type: "string",
      describe:
        "Segment duration for long files (e.g., 1h, 30m). Must be <= 37h.",
      coerce: (val: string) => {
        const secs = parseDuration(val);
        const maxSecs = 37 * 3600;
        if (secs > maxSecs) {
          throw new Error(`Segment duration must be <= 37h, got ${val}`);
        }
        return secs;
      },
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
    duration,
    output,
    tag,
    segment,
    "dry-run": dryRun,
    json,
    "word-timestamps": wordTimestamps,
    cache,
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
    durationSec: duration,
    outputDir: output,
    runWorkDir,
    tag,
    verbosity,
    dryRun,
    wordTimestamps,
    cache,
    segmentSec: segment ?? 0,
  };

  // Preflight check
  const requiredCommands = getRequiredCommands();

  const { missing } = preflightCheck(requiredCommands);

  if (missing.length > 0) {
    console.error(`Error: Required commands not found: ${missing.join(", ")}`);
    process.exit(1);
  }

  // Iteration loop
  const results: RunResult[] = [];
  for (let i = 1; i <= iterations; i++) {
    const result = await runWhisper(config);
    results.push(result);

    // Output to STDOUT
    if (json) {
      // JSON output for bench.sh (result already includes elapsedSec/speedup)
      console.log(JSON.stringify(result));
    } else {
      // Pretty summary for human readability
      const label =
        iterations > 1 ? `Iteration ${i}/${iterations}:` : "Result:";
      const vttDur = result.vttSummary
        ? `${result.vttSummary.durationSec}s`
        : "none";
      console.log(`\n${label}`);
      console.log(`  Processed: ${result.processedAudioDurationSec}s audio`);
      console.log(`  Elapsed:   ${result.elapsedSec}s (wall-clock)`);
      console.log(`  Speedup:   ${result.speedup}x`);
      console.log(`  Output:    ${result.outputPath}`);
      console.log(`  VTT Dur:   ${vttDur}`);

      // Detailed task breakdown
      console.log("  Tasks:");
      for (const task of result.tasks) {
        const timePart =
          task.elapsedMs != null
            ? ` (${Math.round(task.elapsedMs / 1000)}s)`
            : " (dry-run)";
        console.log(`    - ${task.label}: ${task.description}${timePart}`);
      }
    }
  }
}
