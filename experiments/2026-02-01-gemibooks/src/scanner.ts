import { readdir, stat } from "node:fs/promises";
import { join, relative, extname } from "node:path";
import type { AudioFile } from "./types.js";

const VALID_EXTENSIONS = new Set([".m4b", ".mp3"]);

export async function scanDirectory(
  rootPath: string,
  dirPath: string = rootPath,
): Promise<AudioFile[]> {
  const files: AudioFile[] = [];
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);

    if (entry.name.startsWith(".")) {
      continue; // Skip hidden files/dirs
    }

    if (entry.isDirectory()) {
      const subFiles = await scanDirectory(rootPath, fullPath);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (VALID_EXTENSIONS.has(ext)) {
        const stats = await stat(fullPath);
        files.push({
          path: relative(rootPath, fullPath),
          absolutePath: fullPath,
          size: stats.size,
        });
      }
    }
  }

  // Sort by relative path ascending
  return files.sort((a, b) => a.path.localeCompare(b.path));
}
