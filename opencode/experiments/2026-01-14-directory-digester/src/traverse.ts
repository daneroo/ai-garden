import { lstat, readdir, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const normalizePath = (filePath: string) => filePath.split(sep).join("/");

export const toRelativePath = (root: string, filePath: string) =>
  normalizePath(relative(root, filePath));

export const getFileInfo = async (filePath: string) => {
  const info = await stat(filePath);

  return {
    size: info.size,
    mtime: info.mtime.toISOString(),
  };
};

export async function* walkFiles(root: string): AsyncGenerator<string> {
  const entries = await readdir(root, { withFileTypes: true });
  const sorted = entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of sorted) {
    const fullPath = join(root, entry.name);
    const info = await lstat(fullPath);

    if (info.isSymbolicLink()) {
      throw new Error(`Symlink encountered: ${fullPath}`);
    }

    if (info.isDirectory()) {
      yield* walkFiles(fullPath);
      continue;
    }

    if (info.isFile()) {
      yield fullPath;
    }
  }
}
