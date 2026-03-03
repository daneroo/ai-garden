import type { Stats } from "node:fs";

export type TraversalEvent = "dir-pre" | "dir-post" | "file";

export interface FsNode {
  relativePath: string;
  basename: string;
  xattrs: string[];
  stat: Stats;
}

export type TraverseCallback = (event: TraversalEvent, node: FsNode) => void;

export interface InspectedNodeRecord {
  kind: "dir" | "file";
  phase: TraversalEvent;
  status: "in-progress" | "completed";
  relativePath: string;
  basename: string;
  depth: number;
  isHidden: boolean;
  isSymlink: boolean;
  mtimeMs: number | null;
  modePerm: string;
  xattrs: string[];
  modeValid: boolean;
  xattrsValid: boolean;
  violations: string[];
}
