import { parseArgs } from "util";
import { access } from "node:fs/promises";
import { assertAlgorithm } from "./hash";
import { createManifestWriter } from "./manifest";
import { finalizeProgress, updateProgress } from "./progress";
import { scanRecords } from "./scan";
import type { ScanStats } from "./types";
import { verifyRecords } from "./verify";

const usage = `Directory Digester

Usage:
  bun run src/cli.ts --source <dir> --algo <sha1|sha256> --json [--output <file>]
  bun run src/cli.ts --source <dir> --algo <sha1|sha256> --verify <manifest.jsonl>

Options:
  --source   Directory to scan
  --algo     Digest algorithm (sha1, sha256)
  --json     Emit JSONL manifest output
  --output   Write manifest to file instead of stdout
  --verify   Verify against manifest JSONL file
  --help     Show this help
`;

const parseOptions = () => {
  const { values } = parseArgs({
    args: Bun.argv,
    options: {
      source: { type: "string" },
      algo: { type: "string" },
      json: { type: "boolean" },
      output: { type: "string" },
      verify: { type: "string" },
      help: { type: "boolean" },
    },
    strict: true,
    allowPositionals: true,
  });

  return values;
};

const ensureReadable = async (path: string) => {
  await access(path);
};

const run = async () => {
  const options = parseOptions();

  if (options.help) {
    process.stdout.write(`${usage}\n`);
    return;
  }

  if (!options.source || !options.algo) {
    throw new Error("Both --source and --algo are required.");
  }

  const algorithm = assertAlgorithm(options.algo);
  const stats: ScanStats = {
    files: 0,
    bytes: 0,
    mismatches: 0,
    missing: 0,
    extra: 0,
    startTime: new Date(),
    endTime: new Date(),
  };

  await ensureReadable(options.source);

  if (options.verify) {
    await ensureReadable(options.verify);
    const records = scanRecords(options.source, algorithm, updateProgress, stats);
    const results = await verifyRecords(
      records,
      options.verify,
      algorithm,
      updateProgress,
      stats,
    );

    finalizeProgress(results, "Verify");
    if (results.mismatches || results.missing || results.extra) {
      process.exitCode = 1;
    }
    return;
  }

  if (!options.json) {
    throw new Error("Manifest output requires --json.");
  }

  if (options.output && options.verify) {
    throw new Error("--output is not supported with --verify.");
  }

  const writer = createManifestWriter(options.output);
  const records = scanRecords(options.source, algorithm, updateProgress, stats);

  for await (const record of records) {
    writer.write(record);
  }

  stats.endTime = new Date();
  await writer.close();
  finalizeProgress(stats, "Scan");
};

run().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
  process.exitCode = 1;
});
