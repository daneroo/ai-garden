import { useEffect, useState } from "react";
import { useKeyboard } from "@opentui/react";
import { ProgressView } from "./ProgressView.tsx";
import {
  formatElapsed,
  snapshot,
  type ScanSnapshot,
  type ScanState,
} from "./scan-state.ts";

export function App({
  scanState,
  onQuit,
}: {
  scanState: ScanState;
  onQuit: () => void;
}) {
  const [s, setS] = useState<ScanSnapshot>(() => snapshot(scanState));

  useEffect(() => {
    if (s.done) return;
    const timer = setInterval(() => setS(snapshot(scanState)), 100);
    return () => clearInterval(timer);
  }, [scanState, s.done]);

  useKeyboard((key) => {
    if (key.name === "q" || key.name === "escape") {
      onQuit();
    }
  });

  return (
    <box flexDirection="column" padding={1}>
      <text>
        <b>checkfiles</b>
        {s.done ? " - scan complete" : " - scanning"}
      </text>
      <text>
        items: {s.total} (F:{s.files} D:{s.dirs}) | processed: {s.processed} |
        remaining: {s.remaining} | elapsed: {formatElapsed(s.elapsedMs)} | eta:{" "}
        {s.etaMs === null ? "--" : formatElapsed(s.etaMs)}
      </text>
      <text> </text>
      <ProgressView dirStack={s.dirStack} />
      <text> </text>
      <text fg="#666666">q/esc quit</text>
    </box>
  );
}
