import type { FsNode, TraversalEvent } from "../types.ts";
import type { InspectedNodeRecord } from "../types.ts";

export interface ScanState {
  dirStack: string[];
  files: number;
  dirs: number;
  processed: number;
  results: InspectedNodeRecord[];
  startedAt: number;
  done: boolean;
}

export interface ScanSnapshot {
  dirStack: string[];
  files: number;
  dirs: number;
  processed: number;
  total: number;
  remaining: number;
  elapsedMs: number;
  etaMs: number | null;
  violations: number;
  done: boolean;
}

export function createScanState(): ScanState {
  return {
    dirStack: [],
    files: 0,
    dirs: 0,
    processed: 0,
    results: [],
    startedAt: Date.now(),
    done: false,
  };
}

export function applyTraverseEvent(
  state: ScanState,
  event: TraversalEvent,
  node: FsNode,
): void {
  if (event === "dir-pre") {
    state.dirs += 1;
    state.dirStack.push(node.relativePath);
    return;
  }

  if (event === "dir-post") {
    state.processed += 1;
    const index = state.dirStack.lastIndexOf(node.relativePath);
    if (index >= 0) {
      state.dirStack.splice(index, 1);
    }
    return;
  }

  state.files += 1;
  state.processed += 1;
}

export function snapshot(state: ScanState, now = Date.now()): ScanSnapshot {
  const total = state.files + state.dirs;
  const remaining = Math.max(0, total - state.processed);
  const elapsedMs = Math.max(0, now - state.startedAt);
  const rate = elapsedMs > 0 ? state.processed / (elapsedMs / 1000) : 0;
  const etaMs = rate > 0 ? Math.round((remaining / rate) * 1000) : null;

  return {
    dirStack: [...state.dirStack],
    files: state.files,
    dirs: state.dirs,
    processed: state.processed,
    total,
    remaining,
    elapsedMs,
    etaMs,
    violations: state.results.filter((row) => row.violations.length > 0).length,
    done: state.done,
  };
}

export function formatElapsed(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return minutes > 0 ? `${minutes}m ${rem}s` : `${rem}s`;
}
