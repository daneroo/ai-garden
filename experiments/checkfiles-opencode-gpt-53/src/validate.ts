import type { FsNode, InspectedNodeRecord, TraversalEvent } from "./types.ts";

export function inspectNode(
  event: TraversalEvent,
  node: FsNode,
): InspectedNodeRecord {
  const kind: "dir" | "file" = node.stat.isDirectory() ? "dir" : "file";
  const depth =
    node.relativePath === "." ? 0 : node.relativePath.split("/").length - 1;
  const isHidden = node.relativePath !== "." && node.basename.startsWith(".");
  const isSymlink = node.stat.isSymbolicLink();
  const modePerm = octalPerm(node.stat.mode);
  const expectedPerm = kind === "dir" ? "755" : "644";
  const modeValid = isSymlink || modePerm === expectedPerm;
  const xattrsValid = node.xattrs.length === 0;
  const violations: string[] = [];

  if (isHidden) {
    violations.push("hidden entry");
  }
  if (isSymlink) {
    violations.push("symlink");
  }
  if (!modeValid) {
    violations.push(`mode ${modePerm} expected ${expectedPerm}`);
  }
  if (!xattrsValid) {
    violations.push(`has xattrs: ${node.xattrs.join(", ")}`);
  }

  return {
    kind,
    phase: event,
    status: event === "dir-pre" ? "in-progress" : "completed",
    relativePath: node.relativePath,
    basename: node.basename,
    depth,
    isHidden,
    isSymlink,
    mtimeMs: Number.isFinite(node.stat.mtimeMs) ? node.stat.mtimeMs : null,
    modePerm,
    xattrs: [...node.xattrs],
    modeValid,
    xattrsValid,
    violations,
  };
}

function octalPerm(mode: number): string {
  return (mode & 0o777).toString(8).padStart(3, "0");
}
