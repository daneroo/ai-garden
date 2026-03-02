// types — data model for filesystem node records and traversal events

export type TraversalEvent = "pre" | "post" | "leaf";

export interface FileNode {
  relativePath: string;
  basename: string;
  stat: Deno.FileInfo;
  xattrs: string[];
}

export type TraversalCallback = (event: TraversalEvent, node: FileNode) => void;
