import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import type { DigestAlgorithm } from "./types";

const SUPPORTED_ALGOS: DigestAlgorithm[] = ["sha1", "sha256"];

export const assertAlgorithm = (algo: string): DigestAlgorithm => {
  if (SUPPORTED_ALGOS.includes(algo as DigestAlgorithm)) {
    return algo as DigestAlgorithm;
  }

  throw new Error(`Unsupported algorithm: ${algo}`);
};

export const hashFile = async (
  filePath: string,
  algorithm: DigestAlgorithm,
): Promise<string> => {
  const hasher = createHash(algorithm);
  const stream = createReadStream(filePath);

  for await (const chunk of stream) {
    hasher.update(chunk);
  }

  return hasher.digest("hex");
};
