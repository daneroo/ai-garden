import { basename, join } from "node:path";
import { lstat, readdir } from "node:fs/promises";
import type { FsNode, TraverseCallback } from "./types.ts";

export interface TraverseOptions {
  collectXattrs?: (absPath: string) => Promise<string[]>;
}

export async function traverse(
  rootPath: string,
  cb: TraverseCallback,
  options?: TraverseOptions,
): Promise<void> {
  const collectXattrs = options?.collectXattrs ?? (async () => []);
  await visitDir(rootPath, ".", cb, collectXattrs);
}

async function visitDir(
  rootPath: string,
  relativePath: string,
  cb: TraverseCallback,
  collectXattrs: (absPath: string) => Promise<string[]>,
): Promise<void> {
  const absPath =
    relativePath === "." ? rootPath : join(rootPath, relativePath);
  const stat = await lstat(absPath);
  const dirNode = await buildNode(relativePath, absPath, stat, collectXattrs);

  cb("dir-pre", dirNode);

  const children = await readSortedChildren(absPath, relativePath);
  for (const child of children) {
    const childAbsPath = join(absPath, child.basename);
    const childStat = await lstat(childAbsPath);
    const isHidden = child.basename.startsWith(".");
    const isSymlink = childStat.isSymbolicLink();

    if (childStat.isDirectory() && !isHidden && !isSymlink) {
      await visitDir(rootPath, child.relativePath, cb, collectXattrs);
      continue;
    }

    const leafNode = await buildNode(
      child.relativePath,
      childAbsPath,
      childStat,
      collectXattrs,
    );
    cb("file", leafNode);
  }

  cb("dir-post", dirNode);
}

interface ChildEntry {
  basename: string;
  relativePath: string;
}

async function readSortedChildren(
  absDir: string,
  parentRelativePath: string,
): Promise<ChildEntry[]> {
  const names = await readdir(absDir);
  const children = names.map((name) => ({
    basename: name,
    relativePath:
      parentRelativePath === "." ? name : `${parentRelativePath}/${name}`,
  }));

  // Locale-independent lexical compare over canonical relativePath ensures
  // deterministic ordering across runs for unchanged trees.
  return children.sort((a, b) =>
    a.relativePath < b.relativePath
      ? -1
      : a.relativePath > b.relativePath
        ? 1
        : 0,
  );
}

async function buildNode(
  relativePath: string,
  absPath: string,
  stat: FsNode["stat"],
  collectXattrs: (absPath: string) => Promise<string[]>,
): Promise<FsNode> {
  const xattrs = await collectXattrs(absPath);

  return {
    relativePath,
    basename: relativePath === "." ? "." : basename(relativePath),
    xattrs,
    stat,
  };
}
