#!/usr/bin/env bun
/**
 * Whisper Benchmark Runner
 *
 * A data pipeline with clear phase separation:
 * [Read existing JSON] → [Compute missing] → [Execute missing] → [Write new JSON] → [Regenerate presentation]
 *
 * Usage:
 *   bun run scripts/benchmarks/run-bench.ts           # full run
 *   bun run scripts/benchmarks/run-bench.ts --list    # show existing data
 *   bun run scripts/benchmarks/run-bench.ts --dry-run # show missing configs
 */

import { parseArgs } from "util";
import { Glob } from "bun";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import { arch, hostname } from "node:os";
import { z } from "zod";
import {
  createRunWorkDir,
  type ModelShortName,
  type RunConfig,
  runWhisper,
} from "../../lib/runners.ts";
import type { ProvenanceComposition } from "@bun-one/vtt";
import { formatDuration } from "../../lib/duration.ts";

// ============================================================================
// Grid Configuration
// ============================================================================

const GRID = {
  // inputs: ["test/fixtures/roadnottaken.m4b"],
  inputs: ["data/samples/hobbit.m4b", "data/samples/quixote.m4b"],
  models: ["tiny.en", "small.en"] as ModelShortName[],
  durations: [3600, 7200, 10800, 0], // 1h, 2h, 3h // 0 for full
  wordTimestamps: [false],
};

// ============================================================================
// Paths
// ============================================================================

const PACKAGE_ROOT = join(import.meta.dir, "../..");
const REPORTS_DIR = join(PACKAGE_ROOT, "../../reports/benchmarks");
const WORK_DIR_ROOT = join(PACKAGE_ROOT, "data/work");
const OUTPUT_DIR = join(PACKAGE_ROOT, "data/output/benchmarks");

// ============================================================================
// Types
// ============================================================================

/** Keys used to identify a unique benchmark configuration */
interface BenchmarkKey {
  input: string; // basename of input file
  model: ModelShortName;
  duration: number;
  wordTimestamps: boolean;
}

/** Stored benchmark result (compact provenance-centric payload) */
interface BenchmarkRecord {
  benchmarkKey: BenchmarkKey;
  timestamp: string;
  hostname: string;
  arch: string;
  provenance: ProvenanceComposition;
}

/** In-memory record with derived display fields */
interface NormalizedBenchmarkRecord extends BenchmarkRecord {
  processedAudioDurationSec: number;
  elapsedSec: number;
  speedup: string;
}

/** Record with source file tracking (for duplicate detection) */
interface LoadedRecord {
  record: NormalizedBenchmarkRecord;
  sourceFile: string;
}

const BenchmarkKeySchema = z.object({
  input: z.string(),
  model: z.enum(["tiny.en", "base.en", "small.en"]),
  duration: z.number(),
  wordTimestamps: z.boolean(),
});

const ProvenanceCompositionSchema = z
  .object({
    input: z.string(),
    model: z.string(),
    wordTimestamps: z.boolean(),
    generated: z.string(),
    elapsedMs: z.number(),
    segments: z.number(),
    durationSec: z.number(),
  })
  .strict();

const BenchmarkRecordSchema = z
  .object({
    benchmarkKey: BenchmarkKeySchema,
    timestamp: z.string(),
    hostname: z.string(),
    arch: z.string(),
    provenance: ProvenanceCompositionSchema,
  })
  .strict();

// ============================================================================
// Main
// ============================================================================

const { values: args } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    list: { type: "boolean", short: "l", default: false },
    "dry-run": { type: "boolean", short: "n", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

if (args.help) {
  console.log(`
Whisper Benchmark Runner

Usage:
  bun run scripts/benchmarks/run-bench.ts [options]

Options:
  -l, --list   Show existing benchmark data, flag duplicates, then exit
  --dry-run    Show missing configurations, flag duplicates, then exit
  -h, --help   Show this help message

Without options: Execute missing benchmarks and regenerate summary.
`);
  process.exit(0);
}

await main();

async function main(): Promise<void> {
  // Phase 1: Inventory - load existing data
  const existing = await loadExistingData();

  // Phase 2: Compute missing and check data quality
  const grid = generateGrid();
  const missing = computeMissing(grid, existing);
  const duplicates = findDuplicates(existing);
  const extraneous = findExtraneous(grid, existing);

  if (args.list) {
    // --list: show existing data
    console.log("\n=== Existing Benchmark Data ===\n");
    if (existing.length === 0) {
      console.log("No existing data found.");
    } else {
      printDataTable(existing);
    }
    printDataWarnings(duplicates, extraneous);
    return;
  }

  if (args["dry-run"]) {
    // --dry-run: show what would be executed
    console.log("\n=== Dry Run: Missing Configurations ===\n");
    if (missing.length === 0) {
      console.log("All configurations already have data.");
    } else {
      console.log(`Missing ${missing.length} configuration(s):\n`);
      for (const key of missing) {
        console.log(`  - ${keyToString(key)}`);
      }
    }
    printDataWarnings(duplicates, extraneous);
    return;
  }

  // Full run: execute missing and regenerate presentation
  console.log("\n=== Whisper Benchmark Runner ===\n");
  console.log(`Grid: ${grid.length} configurations`);
  console.log(`Existing: ${existing.length} data points`);
  console.log(`Missing: ${missing.length} to execute\n`);

  if (missing.length > 0) {
    // Phase 3: Execute missing benchmarks (results written immediately)
    await executeBenchmarks(missing);
  }

  // Phase 4: Regenerate presentation
  const allData = await loadExistingData();
  await generateSummary(allData);

  console.log("\n✓ Done");
}

// ============================================================================
// Phase 1: Inventory
// ============================================================================

async function loadExistingData(): Promise<LoadedRecord[]> {
  await mkdir(REPORTS_DIR, { recursive: true });

  const records: LoadedRecord[] = [];
  const glob = new Glob("*.json");

  for await (const file of glob.scan(REPORTS_DIR)) {
    const path = join(REPORTS_DIR, file);
    try {
      const content = await readFile(path, "utf-8");
      const parsed = BenchmarkRecordSchema.safeParse(
        JSON.parse(content) as BenchmarkRecord,
      );
      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0];
        const reason = firstIssue
          ? `${firstIssue.path.join(".") || "root"}: ${firstIssue.message}`
          : "schema mismatch";
        console.error(
          `Warning: Skipping non-provenance benchmark record ${file} (${reason})`,
        );
        continue;
      }
      const record = normalizeRecord(parsed.data);
      records.push({ record, sourceFile: file });
    } catch (e) {
      console.error(`Warning: Failed to parse ${file}: ${e}`);
    }
  }

  return records;
}

function normalizeRecord(record: BenchmarkRecord): NormalizedBenchmarkRecord {
  const processedAudioDurationSec = record.provenance.durationSec ?? 0;
  const elapsedSec = Math.round(record.provenance.elapsedMs / 1000);
  const speedupValue =
    elapsedSec > 0 && processedAudioDurationSec > 0
      ? processedAudioDurationSec / elapsedSec
      : 0;
  const speedup = speedupValue > 0 ? speedupValue.toFixed(1) : "0";

  return {
    ...record,
    processedAudioDurationSec,
    elapsedSec,
    speedup,
  };
}

// ============================================================================
// Phase 2: Compute Missing
// ============================================================================

function generateGrid(): BenchmarkKey[] {
  const keys: BenchmarkKey[] = [];

  for (const inputPath of GRID.inputs) {
    for (const model of GRID.models) {
      for (const duration of GRID.durations) {
        for (const wordTimestamps of GRID.wordTimestamps) {
          keys.push({
            input: basename(inputPath),
            model,
            duration,
            wordTimestamps,
          });
        }
      }
    }
  }

  return keys;
}

function computeMissing(
  grid: BenchmarkKey[],
  existing: LoadedRecord[],
): BenchmarkKey[] {
  const existingSet = new Set(
    existing.map((r) => keyToString(r.record.benchmarkKey)),
  );
  return grid.filter((key) => !existingSet.has(keyToString(key)));
}

function findDuplicates(
  records: LoadedRecord[],
): Array<{ key: BenchmarkKey; files: string[] }> {
  const groups = new Map<string, { key: BenchmarkKey; files: string[] }>();

  for (const { record, sourceFile } of records) {
    const keyStr = keyToString(record.benchmarkKey);
    const entry = groups.get(keyStr);
    if (entry) {
      entry.files.push(sourceFile);
    } else {
      groups.set(keyStr, { key: record.benchmarkKey, files: [sourceFile] });
    }
  }

  return Array.from(groups.values()).filter((e) => e.files.length > 1);
}

function keyToString(key: BenchmarkKey): string {
  return `${key.input}|${key.model}|${key.duration}|${key.wordTimestamps}`;
}

function findExtraneous(
  grid: BenchmarkKey[],
  existing: LoadedRecord[],
): BenchmarkKey[] {
  const gridSet = new Set(grid.map(keyToString));
  const seen = new Set<string>();
  const extraneous: BenchmarkKey[] = [];

  for (const { record } of existing) {
    const keyStr = keyToString(record.benchmarkKey);
    if (!gridSet.has(keyStr) && !seen.has(keyStr)) {
      extraneous.push(record.benchmarkKey);
      seen.add(keyStr);
    }
  }

  return extraneous;
}

function printDataWarnings(
  duplicates: Array<{ key: BenchmarkKey; files: string[] }>,
  extraneous: BenchmarkKey[],
): void {
  if (duplicates.length > 0) {
    console.log(`\nWARNING: Duplicates found: ${duplicates.length}`);
    for (const dup of duplicates) {
      console.log(`  ${keyToString(dup.key)}`);
      for (const file of dup.files) {
        console.log(`    - ${file}`);
      }
    }
  }
  if (extraneous.length > 0) {
    console.log(`\nWARNING: Extraneous (not in grid): ${extraneous.length}`);
    for (const key of extraneous) {
      console.log(`  - ${keyToString(key)}`);
    }
  }
}

// ============================================================================
// Phase 3: Execute
// ============================================================================

async function executeBenchmarks(
  missing: BenchmarkKey[],
): Promise<NormalizedBenchmarkRecord[]> {
  const results: NormalizedBenchmarkRecord[] = [];

  for (const key of missing) {
    console.log(`Running: ${keyToString(key)}`);

    const inputPath = GRID.inputs.find((p) => basename(p) === key.input);
    if (!inputPath) {
      console.error(`Warning: Input not found in grid: ${key.input}`);
      continue;
    }

    const fullInputPath = join(PACKAGE_ROOT, inputPath);
    if (!existsSync(fullInputPath)) {
      console.error(`Warning: Input file not found: ${fullInputPath}`);
      continue;
    }

    const runWorkDir = createRunWorkDir({
      workDirRoot: WORK_DIR_ROOT,
      inputPath: fullInputPath,
      tag: `bench-${key.model}`,
    });

    const config: RunConfig = {
      input: fullInputPath,
      modelShortName: key.model,
      threads: 6,
      durationSec: key.duration,
      outputDir: OUTPUT_DIR,
      runWorkDir,
      tag: `bench-${key.model}-d${formatDuration(key.duration)}-${
        key.wordTimestamps ? "wt1" : "wt0" // like the cache naming convention
      }`,
      verbosity: 0,
      dryRun: false,
      wordTimestamps: key.wordTimestamps,
      cache: true,
      quiet: false, // Show progress
      segmentSec: 0,
    };

    await mkdir(OUTPUT_DIR, { recursive: true });

    const result = await runWhisper(config);
    if (!result.vttResult) {
      throw new Error(
        `runWhisper returned no vttResult for ${keyToString(key)}`,
      );
    }

    const record: BenchmarkRecord = {
      benchmarkKey: key,
      timestamp: new Date().toISOString(),
      hostname: hostname(),
      arch: arch(),
      provenance: result.vttResult.value.provenance,
    };

    const normalized = normalizeRecord(record);

    // Write result immediately (don't lose data if later benchmarks fail)
    await writeResult(record);

    results.push(normalized);
    console.log(
      `  ✓ ${normalized.elapsedSec}s elapsed, ${normalized.speedup}x speedup`,
    );
  }

  return results;
}

async function writeResult(record: BenchmarkRecord): Promise<void> {
  await mkdir(REPORTS_DIR, { recursive: true });

  // Use full ISO8601 timestamp (colons replaced for filesystem compatibility)
  const ts = record.timestamp.replace(/:/g, "-");
  const model = record.benchmarkKey.model;
  const input = record.benchmarkKey.input.replace(/\.[^.]+$/, ""); // Remove extension
  const dur =
    record.benchmarkKey.duration === 0
      ? "full"
      : `${record.benchmarkKey.duration}s`;

  const filename = `${ts}-${input}-${model}-${dur}.json`;
  const path = join(REPORTS_DIR, filename);

  await writeFile(path, JSON.stringify(record, null, 2));
  console.log(`  Wrote: ${filename}`);
}

// ============================================================================
// Phase 4: Presentation
// ============================================================================

async function generateSummary(records: LoadedRecord[]): Promise<void> {
  if (records.length === 0) {
    console.log("\nNo data for summary.");
    return;
  }

  // Sort by input, model, duration
  const sorted = [...records].sort((a, b) => {
    const ka = a.record.benchmarkKey;
    const kb = b.record.benchmarkKey;
    return (
      ka.input.localeCompare(kb.input) ||
      ka.model.localeCompare(kb.model) ||
      ka.duration - kb.duration
    );
  });

  const lines: string[] = [
    "# Whisper Benchmark Results",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Results",
    "",
    "| Input | Model | Duration | Elapsed | Speedup | Timestamp |",
    "|-------|-------|----------|---------|---------|-----------|",
  ];

  for (const { record: r } of sorted) {
    const k = r.benchmarkKey;
    const dur = k.duration === 0 ? "full" : `${k.duration}s`;

    lines.push(
      `| ${k.input} | ${k.model} | ${dur} | ${r.elapsedSec}s | ${r.speedup}x | ${r.timestamp} |`,
    );
  }

  lines.push("");

  // Side-by-side plots (scaled 40%)
  lines.push("## Plots (side-by-side)");
  lines.push("");
  lines.push("<!-- markdownlint-disable MD033 -->");
  lines.push("<table><tr>");
  lines.push(
    '<td><img alt="Execution Time" src="execution-time.png" width="400"></td>',
  );
  lines.push('<td><img alt="Speedup" src="speedup.png" width="400"></td>');
  lines.push("</tr></table>");
  lines.push("");

  // Sequential plots (full size)
  lines.push("## Execution Time");
  lines.push("");
  lines.push("![Execution Time](execution-time.png)");
  lines.push("");
  lines.push("## Speedup");
  lines.push("");
  lines.push("![Speedup](speedup.png)");
  lines.push("");

  const summaryPath = join(REPORTS_DIR, "summary.md");
  await writeFile(summaryPath, lines.join("\n"));
  console.log(`\nGenerated: summary.md`);

  // Generate plots
  await generatePlots(records);

  // Format outputs with Prettier
  await formatOutputs();
}

async function generatePlots(records: LoadedRecord[]): Promise<void> {
  if (records.length === 0) return;

  // Prepare data for plotting: group by input+model
  const plotData = records.map(({ record: r }) => ({
    input: r.benchmarkKey.input.replace(/\.[^.]+$/, ""), // Remove extension
    model: r.benchmarkKey.model,
    duration: r.processedAudioDurationSec,
    elapsed: r.elapsedSec,
    speedup: parseFloat(r.speedup),
  }));

  const pythonScript = `
import json
import sys
import matplotlib.pyplot as plt

data = json.loads(sys.argv[1])
output_dir = sys.argv[2]

# Group by input+model, rescaling to human units up front
series = {}
for d in data:
    key = f"{d['input']} {d['model']}"
    if key not in series:
        series[key] = {'duration_h': [], 'elapsed': [], 'speedup': []}
    series[key]['duration_h'].append(d['duration'] / 3600)
    series[key]['elapsed'].append(d['elapsed'])
    series[key]['speedup'].append(d['speedup'])

# Plot 1: Execution Time vs Duration
plt.figure(figsize=(10, 6))
for label, values in sorted(series.items()):
    pairs = sorted(zip(values['duration_h'], values['elapsed']))
    durations, elapsed = zip(*pairs) if pairs else ([], [])
    plt.plot(durations, elapsed, 'o-', label=label, markersize=8)

plt.xlabel('Audio Duration (hours)')
plt.ylabel('Execution Time (seconds)')
plt.ylim(bottom=0)
plt.title('Whisper Execution Time vs Audio Duration')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(f'{output_dir}/execution-time.png', dpi=150)
plt.close()
print('Generated: execution-time.png')

# Plot 2: Speedup vs Duration
plt.figure(figsize=(10, 6))
for label, values in sorted(series.items()):
    pairs = sorted(zip(values['duration_h'], values['speedup']))
    durations, speedup = zip(*pairs) if pairs else ([], [])
    plt.plot(durations, speedup, 'o-', label=label, markersize=8)

plt.xlabel('Audio Duration (hours)')
plt.ylabel('Speedup (x realtime)')
plt.ylim(bottom=0)
plt.title('Whisper Speedup vs Audio Duration')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(f'{output_dir}/speedup.png', dpi=150)
plt.close()
print('Generated: speedup.png')
`;

  const proc = Bun.spawn(
    [
      "uvx",
      "--with",
      "matplotlib",
      "python",
      "-c",
      pythonScript,
      JSON.stringify(plotData),
      REPORTS_DIR,
    ],
    {
      stdout: "inherit",
      stderr: "inherit",
    },
  );
  await proc.exited;
}

async function formatOutputs(): Promise<void> {
  const proc = Bun.spawn(["bunx", "prettier", "--write", REPORTS_DIR], {
    stdout: "ignore",
    stderr: "inherit",
  });
  await proc.exited;
}

function printDataTable(records: LoadedRecord[]): void {
  console.log("| Input | Model | Duration | Elapsed | Speedup | Timestamp |");
  console.log("|-------|-------|----------|---------|---------|-----------|");

  for (const { record: r } of records) {
    const k = r.benchmarkKey;
    const dur = k.duration === 0 ? "full" : `${k.duration}s`;

    console.log(
      `| ${k.input} | ${k.model} | ${dur} | ${r.elapsedSec}s | ${r.speedup}x | ${r.timestamp} |`,
    );
  }
}
