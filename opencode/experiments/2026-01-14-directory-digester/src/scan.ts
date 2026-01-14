import type { DigestAlgorithm, DigestRecord, ScanStats } from "./types";
import { getFileInfo, toRelativePath, walkFiles } from "./traverse";
import { hashFile } from "./hash";

export const createRecord = async (
  root: string,
  filePath: string,
  algorithm: DigestAlgorithm,
): Promise<DigestRecord> => {
  const info = await getFileInfo(filePath);
  const digest = await hashFile(filePath, algorithm);

  return {
    path: toRelativePath(root, filePath),
    digest: `${algorithm}:${digest}`,
    size: info.size,
    mtime: info.mtime,
  };
};

export const scanRecords = async function* (
  root: string,
  algorithm: DigestAlgorithm,
  onProgress: (message: string) => void,
  stats: ScanStats,
): AsyncGenerator<DigestRecord> {
  for await (const filePath of walkFiles(root)) {
    const record = await createRecord(root, filePath, algorithm);

    stats.files += 1;
    stats.bytes += record.size;

    onProgress(`Hashing ${stats.files} files...`);
    yield record;
  }
};
