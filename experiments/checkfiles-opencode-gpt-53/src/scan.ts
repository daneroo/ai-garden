import { traverse, type TraverseOptions } from "./traverse.ts";
import type { InspectedNodeRecord, TraverseCallback } from "./types.ts";
import { inspectNode } from "./validate.ts";
import { getXattrNames } from "./xattr.ts";

interface ScanOptions {
  collectXattrs?: TraverseOptions["collectXattrs"];
  onTraverseEvent?: TraverseCallback;
}

export async function scan(
  rootPath: string,
  options?: ScanOptions,
): Promise<InspectedNodeRecord[]> {
  const records: InspectedNodeRecord[] = [];
  const inProgressDirs = new Map<string, InspectedNodeRecord>();

  const collectXattrs = options?.collectXattrs ?? getXattrNames;

  await traverse(
    rootPath,
    (event, node) => {
      options?.onTraverseEvent?.(event, node);
      const next = inspectNode(event, node);

      if (event === "dir-pre") {
        inProgressDirs.set(node.relativePath, next);
        records.push(next);
        return;
      }

      if (event === "dir-post") {
        const existing = inProgressDirs.get(node.relativePath);
        if (!existing) {
          throw new Error(
            `Missing in-progress directory record: ${node.relativePath}`,
          );
        }
        Object.assign(existing, next);
        const idx = records.indexOf(existing);
        if (idx >= 0) {
          records.splice(idx, 1);
          records.push(existing);
        }
        inProgressDirs.delete(node.relativePath);
        return;
      }

      records.push(next);
    },
    { collectXattrs },
  );

  if (inProgressDirs.size > 0) {
    throw new Error("Traversal ended with unfinished directory records");
  }

  return records;
}
