import { traverse, type TraverseOptions } from "./traverse.ts";
import type { InspectedNodeRecord } from "./types.ts";
import { inspectNode } from "./validate.ts";
import { getXattrNames } from "./xattr.ts";

export async function scan(
  rootPath: string,
  options?: TraverseOptions,
): Promise<InspectedNodeRecord[]> {
  const records: InspectedNodeRecord[] = [];
  const inProgressDirs = new Map<string, InspectedNodeRecord>();

  const collectXattrs = options?.collectXattrs ?? getXattrNames;

  await traverse(
    rootPath,
    (event, node) => {
      if (event === "dir-pre") {
        const record = inspectNode(event, node);
        inProgressDirs.set(node.relativePath, record);
        records.push(record);
        return;
      }

      if (event === "dir-post") {
        const existing = inProgressDirs.get(node.relativePath);
        if (!existing) {
          throw new Error(
            `Missing in-progress directory record: ${node.relativePath}`,
          );
        }
        const completed = inspectNode(event, node);
        Object.assign(existing, completed);
        const idx = records.indexOf(existing);
        if (idx >= 0) {
          records.splice(idx, 1);
          records.push(existing);
        }
        inProgressDirs.delete(node.relativePath);
        return;
      }

      records.push(inspectNode(event, node));
    },
    { collectXattrs },
  );

  if (inProgressDirs.size > 0) {
    throw new Error("Traversal ended with unfinished directory records");
  }

  return records;
}
