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
import {
  createRunWorkDir,
  type ModelShortName,
  type RunConfig,
  type RunResult,
  runWhisper,
} from "../../lib/runners.ts";

// ============================================================================
// Grid Configuration
// ============================================================================

const GRID = {
  inputs: ["test/fixtures/roadnottaken.m4b"],
  models: ["tiny.en", "small.en"] as ModelShortName[],
  durations: [45, 0], // 0 = full file
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

/** Stored benchmark result (RunResult + key fields for identification) */
interface BenchmarkRecord extends RunResult {
  // Added by benchmark runner for identification
  benchmarkKey: BenchmarkKey;
  timestamp: string;
  hostname: string;
  arch: string;
}

/** Record with source file tracking (for duplicate detection) */
interface LoadedRecord {
  record: BenchmarkRecord;
  sourceFile: string;
}

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
    // Phase 3: Execute missing benchmarks
    const newResults = await executeBenchmarks(missing);

    // Write new results
    await writeResults(newResults);
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
      const record = JSON.parse(content) as BenchmarkRecord;
      records.push({ record, sourceFile: file });
    } catch (e) {
      console.error(`Warning: Failed to parse ${file}: ${e}`);
    }
  }

  return records;
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
): Promise<BenchmarkRecord[]> {
  const results: BenchmarkRecord[] = [];

  for (const key of missing) {
    console.log(`Running: ${keyToString(key)}`);

    const inputPath = GRID.inputs.find((p) => basename(p) === key.input);
    if (!inputPath) {
      console.error(`  ⚠️  Input not found in grid: ${key.input}`);
      continue;
    }

    const fullInputPath = join(PACKAGE_ROOT, inputPath);
    if (!existsSync(fullInputPath)) {
      console.error(`  ⚠️  Input file not found: ${fullInputPath}`);
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
      startSec: 0,
      durationSec: key.duration,
      outputDir: OUTPUT_DIR,
      runWorkDir,
      tag: `bench-${key.model}`,
      verbosity: 0,
      dryRun: false,
      wordTimestamps: key.wordTimestamps,
      quiet: false, // Show progress
    };

    await mkdir(OUTPUT_DIR, { recursive: true });

    const result = await runWhisper(config);

    const record: BenchmarkRecord = {
      ...result,
      benchmarkKey: key,
      timestamp: new Date().toISOString(),
      hostname: hostname(),
      arch: arch(),
    };

    results.push(record);
    console.log(
      `  ✓ ${result.elapsedSec}s elapsed, ${result.speedup}x speedup`,
    );
  }

  return results;
}

async function writeResults(records: BenchmarkRecord[]): Promise<void> {
  await mkdir(REPORTS_DIR, { recursive: true });

  for (const record of records) {
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

  const summaryPath = join(REPORTS_DIR, "summary.md");
  await writeFile(summaryPath, lines.join("\n"));
  console.log(`\nGenerated: summary.md`);

  // Format outputs with Prettier
  await formatOutputs();
}

async function formatOutputs(): Promise<void> {
  const proc = Bun.spawn(["bunx", "prettier", "--write", REPORTS_DIR], {
    stdout: "ignore",
    stderr: "inherit",
  });
  await proc.exited;
}

// ============================================================================
// Helpers
// ============================================================================

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
