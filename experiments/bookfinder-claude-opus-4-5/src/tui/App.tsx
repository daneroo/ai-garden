import React, { useState, useEffect, useCallback } from "react";
import { ProgressView, type ProgressState } from "./ProgressView.tsx";
import { ResultsTable } from "./ResultsTable.tsx";
import { probeFiles, type AudioMetadata } from "../probe.ts";
import { scanDirectory, type ScannedFile } from "../scanner.ts";

type Phase =
  | { kind: "scanning" }
  | { kind: "probing"; progress: ProgressState }
  | { kind: "results"; data: AudioMetadata[]; errors: string[] };

export function App({
  rootPath,
  concurrency,
  onExit,
}: {
  rootPath: string;
  concurrency: number;
  onExit: () => void;
}) {
  const [phase, setPhase] = useState<Phase>({ kind: "scanning" });

  const run = useCallback(async () => {
    const files: ScannedFile[] = await scanDirectory(rootPath);

    if (files.length === 0) {
      setPhase({ kind: "results", data: [], errors: [] });
      return;
    }

    const startTime = Date.now();
    setPhase({
      kind: "probing",
      progress: { total: files.length, completed: 0, inFlight: [], startTime },
    });

    const { results, errors } = await probeFiles(
      files,
      concurrency,
      (completed, total, inFlight) => {
        setPhase({
          kind: "probing",
          progress: { total, completed, inFlight, startTime },
        });
      },
    );

    setPhase({ kind: "results", data: results, errors });
  }, [rootPath, concurrency]);

  useEffect(() => {
    run();
  }, [run]);

  switch (phase.kind) {
    case "scanning":
      return (
        <box padding={1}>
          <text>Scanning {rootPath} for audiobooks...</text>
        </box>
      );
    case "probing":
      return <ProgressView state={phase.progress} />;
    case "results":
      return <ResultsTable data={phase.data} errors={phase.errors} onQuit={onExit} />;
  }
}
