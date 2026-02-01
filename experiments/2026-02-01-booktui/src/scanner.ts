import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const AUDIO_EXTENSIONS = new Set([".m4b", ".mp3"]);

export interface ScannedFile {
  absolutePath: string;
  relativePath: string;
  size: number;
}

function isHidden(name: string): boolean {
  return name.startsWith(".");
}

function isAudioFile(name: string): boolean {
  const dot = name.lastIndexOf(".");
  if (dot === -1) return false;
  return AUDIO_EXTENSIONS.has(name.slice(dot).toLowerCase());
}

async function walkDir(dir: string, rootPath: string, results: ScannedFile[]): Promise<void> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Warning: could not read directory ${dir}: ${msg}`);
    return;
  }

  for (const entry of entries) {
    if (isHidden(entry.name)) continue;

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await walkDir(fullPath, rootPath, results);
    } else if (entry.isFile() && isAudioFile(entry.name)) {
      try {
        const info = await stat(fullPath);
        results.push({
          absolutePath: fullPath,
          relativePath: relative(rootPath, fullPath),
          size: info.size,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Warning: could not stat file ${fullPath}: ${msg}`);
      }
    }
  }
}

export async function scanDirectory(rootPath: string): Promise<ScannedFile[]> {
  const results: ScannedFile[] = [];
  await walkDir(rootPath, rootPath, results);
  results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return results;
}
