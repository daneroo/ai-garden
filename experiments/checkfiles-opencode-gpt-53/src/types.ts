import type { Stats } from "node:fs";

export type TraversalEvent = "dir-pre" | "dir-post" | "file";

export interface FsNode {
  relativePath: string;
  basename: string;
  xattrs: string[];
  stat: Stats;
}

export type TraverseCallback = (event: TraversalEvent, node: FsNode) => void;
