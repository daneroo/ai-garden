import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { ScannedFile } from "./types";

const AUDIO_EXTS = new Set([".mp3", ".m4b"]);

function isHiddenName(name: string): boolean {
  return name.startsWith(".");
}

export type ScanProgress = {
  entriesSeen: number;
  audioFound: number;
};

export async function scanForAudioFiles(
  rootpath: string,
  opts?: { onProgress?: (p: ScanProgress) => void },
): Promise<ScannedFile[]> {
  const out: ScannedFile[] = [];
  const rootAbs = path.resolve(rootpath);
  let entriesSeen = 0;
  let audioFound = 0;

  const report = () => {
    opts?.onProgress?.({ entriesSeen, audioFound });
  };

  async function walk(dirAbs: string): Promise<void> {
    const entries = await fs.readdir(dirAbs, { withFileTypes: true });

    for (const entry of entries) {
      if (isHiddenName(entry.name)) continue;
      const absPath = path.join(dirAbs, entry.name);

      entriesSeen += 1;
      report();

      if (entry.isDirectory()) {
        await walk(absPath);
        continue;
      }

      if (!entry.isFile()) continue;

      const ext = path.extname(entry.name).toLowerCase();
      if (!AUDIO_EXTS.has(ext)) continue;

      const st = await fs.stat(absPath);
      audioFound += 1;
      report();
      out.push({
        absPath,
        relPath: path.relative(rootAbs, absPath),
        sizeBytes: st.size,
      });
    }
  }

  await walk(rootAbs);
  return out;
}
