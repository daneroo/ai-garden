// scan-state — mutable bridge between traversal callbacks and TUI rendering
//
// Traversal mutates ScanState directly. The React component polls it on a
// timer — no event emitters, no immutable snapshots per callback.

import type { TraversalCallback } from "../types.ts";
import { buildResultRow, type ResultRow } from "./format.ts";

export interface ScanState {
  dirStack: string[]; // relativePaths of in-progress directories
  files: number;
  dirs: number;
  processed: number;
  startedAt: number; // Date.now()
  done: boolean;
  results: ResultRow[];
}

export function createScanState(): ScanState {
  return {
    dirStack: [],
    files: 0,
    dirs: 0,
    processed: 0,
    startedAt: Date.now(),
    done: false,
    results: [],
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
        state.results.push(buildResultRow(node));
        break;
      case "leaf":
        state.files++;
        state.processed++;
        state.results.push(buildResultRow(node));
        break;
    }
  };
}
