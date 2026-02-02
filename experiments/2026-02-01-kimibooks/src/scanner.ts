import { readdirSync, statSync } from "fs";
import { join, relative, extname } from "path";

const AUDIO_EXTENSIONS = new Set([".m4b", ".mp3"]);

export interface AudioFile {
  path: string;
  relativePath: string;
  size: number;
}

export function isHidden(name: string): boolean {
  return name.startsWith(".");
}

export function isAudioFile(name: string): boolean {
  return AUDIO_EXTENSIONS.has(extname(name).toLowerCase());
}

export function* walkDirectory(dir: string, rootDir: string): Generator<AudioFile> {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (isHidden(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      yield* walkDirectory(fullPath, rootDir);
    } else if (entry.isFile() && isAudioFile(entry.name)) {
      const stats = statSync(fullPath);
      yield {
        path: fullPath,
        relativePath: relative(rootDir, fullPath),
        size: stats.size,
      };
    }
  }
}

export function scanForAudioFiles(rootDir: string, limit?: number): AudioFile[] {
  const files: AudioFile[] = [];

  for (const file of walkDirectory(rootDir, rootDir)) {
    files.push(file);
    if (limit !== undefined && files.length >= limit) {
      break;
    }
  }

  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
