import React, { useState, useEffect } from "react";
import { useKeyboard } from "@opentui/react";
import { scanDirectory } from "../scanner.js";
import { probeFile } from "../prober.js";
import { runWorkerPool } from "../worker-pool.js";
import type { ScanOptions, AudioMetadata } from "../types.js";
import { ResultsTable } from "./ResultsTable.js";
import { ProgressView } from "./ProgressView.js";

interface AppProps {
  options: ScanOptions;
  onExit: () => void;
}

type SortField = "artist" | "title" | "duration" | "bitrate" | "codec" | "path";
type SortOrder = "asc" | "desc";

export function App({ options, onExit }: AppProps) {
  const [status, setStatus] = useState<"scanning" | "probing" | "done">(
    "scanning",
  );
  // Removed unused files state
  const [results, setResults] = useState<AudioMetadata[]>([]);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [inFlight, setInFlight] = useState<string[]>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("path");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  useKeyboard((key) => {
    if (key.name === "q" || key.name === "escape") {
      onExit();
    }
  });

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        // 1. Scan
        setStatus("scanning");
        setStartTime(Date.now());
        const foundFiles = await scanDirectory(options.rootPath);
        if (!mounted) return;

        setProgress({ completed: 0, total: foundFiles.length });

        if (foundFiles.length === 0) {
          setStatus("done");
          return;
        }

        // 2. Probe
        setStatus("probing");
        setStartTime(Date.now()); // Reset for probing phase

        const probedResults = await runWorkerPool(
          foundFiles,
          options.concurrency,
          probeFile,
          {
            onProgress: (completed, total) => {
              if (mounted) {
                setProgress({ completed, total });
              }
            },
            onItemStart: (item) => {
              if (mounted) {
                setInFlight((prev) => [...prev, item.path]);
              }
            },
            onItemFinish: (item) => {
              if (mounted) {
                setInFlight((prev) => prev.filter((p) => p !== item.path));
              }
            },
          },
        );

        if (!mounted) return;
        setResults(probedResults);
        setStatus("done");
      } catch (err: unknown) {
        // Typed as unknown
        if (mounted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [options]);

  if (error) {
    return <text fg="red">Error: {error}</text>;
  }

  if (status !== "done") {
    return (
      <ProgressView
        total={progress.total}
        completed={progress.completed}
        inFlight={inFlight}
        startTime={startTime}
      />
    );
  }

  return (
    <ResultsTable
      data={results}
      sortField={sortField}
      sortOrder={sortOrder}
      onSort={(field) => {
        if (sortField === field) {
          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
          setSortField(field);
          setSortOrder("asc");
        }
      }}
    />
  );
}
