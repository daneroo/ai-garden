// ProgressView — renders directory stack during scan

import type { ScanState } from "./scan-state.ts";

export interface Snapshot {
  dirStack: string[];
  files: number;
  dirs: number;
  processed: number;
  violations: number;
  total: number;
  elapsed: number;
  done: boolean;
}

export function snap(state: ScanState): Snapshot {
  const now = Date.now();
  return {
    dirStack: [...state.dirStack],
    files: state.files,
    dirs: state.dirs,
    processed: state.processed,
    violations: state.violations,
    total: state.files + state.dirs,
    elapsed: now - state.startedAt,
    done: state.done,
  };
}

export function formatElapsed(ms: number): string {
  const secs = Math.floor(ms / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function ProgressView({ dirStack }: { dirStack: string[] }) {
  return (
    <box flexDirection="column">
      {dirStack.map((rel) => {
        const label = rel === "." ? "." : (rel.split("/").pop() ?? rel);
        const indent = "  ".repeat(Math.min(dirStack.indexOf(rel), 8));
        return (
          <text key={rel} fg="#666666">
            {indent}
            {label}/
          </text>
        );
      })}
    </box>
  );
}
