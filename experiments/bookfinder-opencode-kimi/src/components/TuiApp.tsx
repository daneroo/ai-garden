import { useState, useEffect, useCallback } from "react";
import { ProgressView } from "./ProgressView.js";
import { ResultsTable } from "./ResultsTable.js";
import type { AudioMetadata } from "../ffprobe.js";
import type { AudioFile } from "../scanner.js";
import { extractAllMetadata } from "../worker-pool.js";

export interface ProgressState {
  total: number;
  completed: number;
  inFlight: string[];
  startTime: number;
}

type Phase =
  | { kind: "scanning" }
  | { kind: "probing"; progress: ProgressState }
  | { kind: "results"; data: AudioMetadata[] };

interface TuiAppProps {
  initialFiles: AudioFile[];
  concurrency: number;
  onExit: () => void;
}

export function TuiApp({ initialFiles, concurrency, onExit }: TuiAppProps) {
  const [phase, setPhase] = useState<Phase>({
    kind: "probing",
    progress: {
      total: initialFiles.length,
      completed: 0,
      inFlight: [],
      startTime: Date.now(),
    },
  });

  const run = useCallback(async () => {
    const startTime = Date.now();

    const results = await extractAllMetadata(
      initialFiles,
      concurrency,
      (completed, total, _running, inFlightFiles) => {
        setPhase({
          kind: "probing",
          progress: {
            total,
            completed,
            inFlight: inFlightFiles,
            startTime,
          },
        });
      }
    );

    setPhase({ kind: "results", data: results });
  }, [initialFiles, concurrency]);

  useEffect(() => {
    run();
  }, [run]);

  switch (phase.kind) {
    case "probing":
      return <ProgressView state={phase.progress} />;
    case "results":
      return <ResultsTable data={phase.data} onQuit={onExit} />;
    default:
      return null;
  }
}
