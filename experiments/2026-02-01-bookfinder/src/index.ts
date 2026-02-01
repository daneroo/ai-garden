#!/usr/bin/env bun
import { Command, InvalidArgumentError } from "commander";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { ensureFfprobeAvailable, probeFileWithFfprobe } from "./ffprobe";
import { concurrentMap } from "./promisePool";
import { scanForAudioFiles } from "./scanner";
import type { ProbedFile } from "./types";
import { runTuiProgress } from "./tui";

const FFPROBE_TIMEOUT_MS = 30_000;

function parsePositiveInt(input: string): number {
  const n = Number.parseInt(input, 10);
  if (!Number.isFinite(n) || n < 1) {
    throw new InvalidArgumentError(`Expected a positive integer, got: ${input}`);
  }
  return n;
}

async function assertReadableDirectory(rootpath: string): Promise<string> {
  const abs = path.resolve(rootpath);
  const st = await fs.stat(abs);
  if (!st.isDirectory()) {
    throw new Error(`rootpath is not a directory: ${abs}`);
  }
  return abs;
}

async function main() {
  const program = new Command();
  program
    .name("bookfinder")
    .description("Scan audio files and extract metadata via ffprobe")
    .option("-r, --rootpath <path>", "Root directory to scan (required)")
    .option("--rootPath <path>", "Alias for --rootpath")
    .option(
      "-c, --concurrency <n>",
      "Max parallel ffprobe processes (default: 8)",
      parsePositiveInt,
      8,
    )
    .option("--json", "Output JSON instead of table", false)
    .parse(process.argv);

  const opts = program.opts<{
    rootpath?: string;
    rootPath?: string;
    concurrency: number;
    json: boolean;
  }>();
  const rootpath = opts.rootpath ?? opts.rootPath;
  if (!rootpath) {
    program.error("error: required option '--rootpath <path>' not specified");
    return;
  }

  const rootAbs = await assertReadableDirectory(rootpath);

  await ensureFfprobeAvailable();

  if (opts.json) {
    const scanned = await scanForAudioFiles(rootAbs);
    const probed = await concurrentMap(scanned, opts.concurrency, async (file) => {
      try {
        const meta = await probeFileWithFfprobe(file.absPath, FFPROBE_TIMEOUT_MS);
        return { ...file, ...meta } satisfies ProbedFile;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[warn] ffprobe failed for ${file.relPath}: ${msg}`);
        return null;
      }
    });

    const ok = probed.filter((x): x is ProbedFile => x != null);
    ok.sort((a, b) => a.relPath.localeCompare(b.relPath));
    const json = ok.map((f) => ({
      path: f.relPath,
      sizeBytes: f.sizeBytes,
      durationSeconds: f.durationSeconds,
      bitrateKbps: f.bitrateKbps,
      codec: f.codec,
      title: f.title,
      artist: f.artist,
    }));
    process.stdout.write(JSON.stringify(json, null, 2) + "\n");
    return;
  }

  await runTuiProgress({ rootAbs, concurrency: opts.concurrency });
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[fatal] ${msg}`);
  process.exitCode = 1;
});
