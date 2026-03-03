// ProgressView — polls ScanState and renders live progress

import { useState, useEffect } from "react";
import type { ScanState } from "./scan-state.ts";

interface Snapshot {
  dirStack: string[];
  files: number;
  dirs: number;
  processed: number;
  total: number;
  elapsed: number;
  done: boolean;
}

function snap(state: ScanState): Snapshot {
  const now = Date.now();
  return {
    dirStack: [...state.dirStack],
    files: state.files,
    dirs: state.dirs,
    processed: state.processed,
    total: state.files + state.dirs,
    elapsed: now - state.startedAt,
    done: state.done,
  };
}

function formatElapsed(ms: number): string {
  const secs = Math.floor(ms / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function ProgressView({ scanState }: { scanState: ScanState }) {
  const [s, setS] = useState(() => snap(scanState));

  useEffect(() => {
    const id = setInterval(() => setS(snap(scanState)), 100);
    return () => clearInterval(id);
  }, [scanState]);

  const remaining = s.total - s.processed;
  const rate = s.elapsed > 0 ? Math.round((s.processed / s.elapsed) * 1000) : 0;
  const eta = rate > 0 ? formatElapsed((remaining / rate) * 1000) : "--";

  return (
    <box flexDirection="column" padding={1}>
      <text>
        <b>checkfiles</b>
        {s.done ? " — scan complete" : " — scanning..."}
      </text>
      <text> </text>

      {/* Directory stack */}
      {s.dirStack.map((rel) => {
        const label = rel === "." ? "." : (rel.split("/").pop() ?? rel);
        const indent = "  ".repeat(Math.min(s.dirStack.indexOf(rel), 8));
        return (
          <text key={rel} fg="#666666">
            {indent}
            {label}/
          </text>
        );
      })}

      <text> </text>
      {/* Summary line */}
      <text>
        items: {s.total} (F:{s.files} D:{s.dirs}) | done: {s.processed} |
        remaining: {remaining} | {formatElapsed(s.elapsed)} | {rate}/s | ETA:{" "}
        {s.done ? "--" : eta}
      </text>
    </box>
  );
}
