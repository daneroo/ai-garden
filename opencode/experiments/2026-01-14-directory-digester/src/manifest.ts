import { createWriteStream } from "node:fs";
import type { DigestRecord } from "./types";

export type ManifestWriter = {
  write: (record: DigestRecord) => void;
  close: () => Promise<void>;
};

export const createManifestWriter = (outputPath?: string): ManifestWriter => {
  if (!outputPath) {
    return {
      write: (record) => {
        process.stdout.write(`${JSON.stringify(record)}\n`);
      },
      close: async () => undefined,
    };
  }

  const stream = createWriteStream(outputPath, { encoding: "utf8" });

  return {
    write: (record) => {
      stream.write(`${JSON.stringify(record)}\n`);
    },
    close: () =>
      new Promise((resolve, reject) => {
        stream.end(() => resolve());
        stream.on("error", reject);
      }),
  };
};
