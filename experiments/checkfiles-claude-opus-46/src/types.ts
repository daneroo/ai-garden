// types — data model for filesystem node records and traversal events

import type { Stats } from "node:fs";

export type TraversalEvent = "pre" | "post" | "leaf";

export interface FileNode {
  relativePath: string;
  basename: string;
  stat: Stats;
  xattrs: string[];
}

export type TraversalCallback = (event: TraversalEvent, node: FileNode) => void;
