import { createReadStream } from "node:fs";
import readline from "node:readline";
import type { DigestAlgorithm, DigestRecord, ScanStats } from "./types";

type ManifestRecord = DigestRecord & { algo: DigestAlgorithm; value: string };

const parseDigest = (digest: string, expectedAlgo: DigestAlgorithm) => {
  const [algo, value] = digest.split(":", 2);

  if (algo !== expectedAlgo) {
    throw new Error(
      `Manifest algorithm ${algo} does not match expected ${expectedAlgo}`,
    );
  }

  return { algo: algo as DigestAlgorithm, value };
};

async function* readManifest(
  manifestPath: string,
  algorithm: DigestAlgorithm,
): AsyncGenerator<ManifestRecord> {
  const stream = createReadStream(manifestPath, { encoding: "utf8" });
  const reader = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of reader) {
    if (!line.trim()) {
      continue;
    }

    const record = JSON.parse(line) as DigestRecord;
    const { algo, value } = parseDigest(record.digest, algorithm);

    yield { ...record, algo, value };
  }
}

export const verifyRecords = async (
  currentRecords: AsyncGenerator<DigestRecord>,
  manifestPath: string,
  algorithm: DigestAlgorithm,
  onProgress: (message: string) => void,
  stats: ScanStats,
): Promise<ScanStats> => {
  const manifestIterator = readManifest(manifestPath, algorithm);
  let manifestResult = await manifestIterator.next();
  let manifestRecord = manifestResult.value ?? null;

  for await (const record of currentRecords) {
    while (manifestRecord && manifestRecord.path < record.path) {
      process.stderr.write(
        `Missing file: ${manifestRecord.path} (present in manifest only)\n`,
      );
      stats.missing += 1;
      manifestResult = await manifestIterator.next();
      manifestRecord = manifestResult.value ?? null;
    }

    if (!manifestRecord || manifestRecord.path > record.path) {
      process.stderr.write(
        `Extra file: ${record.path} (not present in manifest)\n`,
      );
      stats.extra += 1;
    } else if (manifestRecord.value !== record.digest.split(":")[1]) {
      process.stderr.write(`Mismatch: ${record.path}\n`);
      stats.mismatches += 1;
      manifestResult = await manifestIterator.next();
      manifestRecord = manifestResult.value ?? null;
    } else {
      manifestResult = await manifestIterator.next();
      manifestRecord = manifestResult.value ?? null;
    }

    onProgress(`Verifying ${stats.files} files...`);
  }

  while (manifestRecord) {
    process.stderr.write(
      `Missing file: ${manifestRecord.path} (present in manifest only)\n`,
    );
    stats.missing += 1;
    manifestResult = await manifestIterator.next();
    manifestRecord = manifestResult.value ?? null;
  }

  stats.endTime = new Date();
  return stats;
};
