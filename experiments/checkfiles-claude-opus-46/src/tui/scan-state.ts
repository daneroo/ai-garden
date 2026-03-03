// scan-state — mutable bridge between traversal callbacks and TUI rendering
//
// Traversal mutates ScanState directly. The React component polls it on a
// timer — no event emitters, no immutable snapshots per callback.

import type { TraversalCallback } from "../types.ts";

export interface ScanState {
  dirStack: string[]; // relativePaths of in-progress directories
  files: number;
  dirs: number;
  processed: number;
  startedAt: number; // Date.now()
  done: boolean;
}

export function createScanState(): ScanState {
  return {
    dirStack: [],
    files: 0,
    dirs: 0,
    processed: 0,
    startedAt: Date.now(),
    done: false,
  };
}

// Returns a TraversalCallback that mutates the given ScanState
export function makeScanCallback(state: ScanState): TraversalCallback {
  return (event, node) => {
    switch (event) {
      case "pre":
        state.dirs++;
        state.dirStack.push(node.relativePath);
        break;
      case "post":
        state.processed++;
        state.dirStack = state.dirStack.filter((p) => p !== node.relativePath);
        break;
      case "leaf":
        state.files++;
        state.processed++;
        break;
    }
  };
}
