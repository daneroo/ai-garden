// traverse — deterministic two-phase filesystem traversal
//
// Not using @std/fs/walk: it yields a flat async stream with no pre/post
// directory hooks. The two-phase visitation and single-record-per-node
// mutation are simpler with direct recursion.

import { basename, join } from "@std/path";
import type { FileNode, TraversalCallback } from "./types.ts";

// ENTRY: traverse root directory, calling cb for each traversal event
export async function traverse(
  rootPath: string,
  cb: TraversalCallback,
): Promise<void> {
  await visitDir(rootPath, ".", cb);
}

async function visitDir(
  root: string,
  rel: string,
  cb: TraversalCallback,
): Promise<void> {
  const abs = rel === "." ? root : join(root, rel);
  const stat = await Deno.lstat(abs);
  const name = rel === "." ? "." : basename(rel);

  const node: FileNode = {
    relativePath: rel,
    basename: name,
    stat,
    xattrs: [],
  };
  cb("pre", node);

  for (const child of await readSortedChildren(abs, rel)) {
    const childStat = await Deno.lstat(join(abs, child.name));
    const skip = child.name.startsWith(".") || childStat.isSymlink;

    if (childStat.isDirectory && !skip) {
      await visitDir(root, child.rel, cb);
    } else {
      // File, symlink, or hidden/symlink dir: emit as leaf, don't recurse
      cb("leaf", {
        relativePath: child.rel,
        basename: child.name,
        stat: childStat,
        xattrs: [],
      });
    }
  }

  cb("post", node);
}

// Read directory children and sort by relative path. Uses locale-independent
// byte-order comparison (JS string < > compares UTF-16 code units),
// guaranteeing deterministic order across runs.
async function readSortedChildren(
  absDir: string,
  parentRel: string,
): Promise<{ name: string; rel: string }[]> {
  const children: { name: string; rel: string }[] = [];
  for await (const entry of Deno.readDir(absDir)) {
    children.push({
      name: entry.name,
      rel: parentRel === "." ? entry.name : `${parentRel}/${entry.name}`,
    });
  }
  return children.sort((a, b) => a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0);
}
