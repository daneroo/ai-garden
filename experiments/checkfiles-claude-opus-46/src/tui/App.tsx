// App — top-level TUI component: persistent header, progress or results below

import { useState, useEffect, useMemo } from "react";
import { ProgressView, snap, formatElapsed } from "./ProgressView.tsx";
import { ResultsTable } from "./ResultsTable.tsx";
import type { ScanState } from "./scan-state.ts";

export function App({
  scanState,
  onQuit,
}: {
  scanState: ScanState;
  onQuit: () => void;
}) {
  const [s, setS] = useState(() => snap(scanState));

  useEffect(() => {
    if (s.done) return; // stop polling once scan finishes
    const id = setInterval(() => {
      const next = snap(scanState);
      setS(next);
    }, 100);
    return () => clearInterval(id);
  }, [scanState, s.done]);

  const violationCount = useMemo(
    () => scanState.results.filter((r) => r.violations.length > 0).length,
    [scanState.results],
  );

  const remaining = s.total - s.processed;
  const rate = s.elapsed > 0 ? Math.round((s.processed / s.elapsed) * 1000) : 0;
  const eta =
    s.done || remaining === 0
      ? "--"
      : rate > 0
        ? formatElapsed((remaining / rate) * 1000)
        : "--";

  return (
    <box flexDirection="column" padding={1}>
      {/* Title */}
      <text>
        <b>checkfiles</b>
        {s.done ? " — scan complete" : " — scanning..."}
      </text>

      {/* Summary line */}
      {s.done ? (
        <text>
          items: {s.total} (F:{s.files} D:{s.dirs}) | violations:{" "}
          {violationCount} | {formatElapsed(s.elapsed)} | {rate}/s
        </text>
      ) : (
        <text>
          items: {s.total} (F:{s.files} D:{s.dirs}) | done: {s.processed} |
          remaining: {remaining} | {formatElapsed(s.elapsed)} | {rate}/s | ETA:{" "}
          {eta}
        </text>
      )}
      <text> </text>

      {/* Body */}
      {s.done ? (
        <ResultsTable rows={scanState.results} onQuit={onQuit} />
      ) : (
        <ProgressView dirStack={s.dirStack} />
      )}
    </box>
  );
}
