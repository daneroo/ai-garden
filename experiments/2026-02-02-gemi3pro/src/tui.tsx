import React, { useState, useEffect, useMemo, useRef } from "react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - types might be missing for some exports or explicit re-exports needed
import { useKeyboard, useRenderer, createRoot } from "@opentui/react";
import { createCliRenderer, type KeyEvent } from "@opentui/core";
import { Scanner } from "./scanner";
import { AudiobookMetadata, ScanProgress } from "./types";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const COLUMNS = [
  { key: "artist", label: "Author", width: 20 },
  { key: "title", label: "Title", width: 30 },
  { key: "duration", label: "Duration", width: 10, format: (v: number) => formatDuration(v) },
  { key: "bitrate", label: "Bitrate", width: 8, format: (v: number) => Math.round(v) + "k" },
  { key: "codec", label: "Codec", width: 8 },
  { key: "path", label: "File", width: 40 },
];

type SortKey = keyof AudiobookMetadata;

const App = ({ scanner }: { scanner: Scanner }) => {
  const renderer = useRenderer();
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [results, setResults] = useState<AudiobookMetadata[]>([]);
  const [done, setDone] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("path");
  const [sortDesc, setSortDesc] = useState(false);
  const [scrollIndex, setScrollIndex] = useState(0);
  const viewportHeight = 20;

  const startTimeRef = useRef<number>(Date.now());
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    // Timer for updating elapsed/remaining
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    scanner
      .scan((p) => setProgress(p))
      .then((res) => {
        setResults(res);
        setDone(true);
        clearInterval(timer);
      });

    return () => clearInterval(timer);
  }, [scanner]);

  useKeyboard((key: KeyEvent) => {
    if ((key.name === "c" && key.ctrl) || key.name === "q" || key.name === "escape") {
      renderer.destroy();
      return;
    }
    if (!done) return;

    if (key.name === "down" || key.name === "j") {
      setScrollIndex((prev) => Math.min(prev + 1, Math.max(0, results.length - viewportHeight)));
    }
    if (key.name === "up" || key.name === "k") {
      setScrollIndex((prev) => Math.max(0, prev - 1));
    }
    if (key.name === "g") setScrollIndex(0);
    if (key.name === "G") setScrollIndex(Math.max(0, results.length - viewportHeight));

    if (key.name === "right") {
      const curIdx = COLUMNS.findIndex((c) => c.key === sortKey);
      const nextIdx = (curIdx + 1) % COLUMNS.length;
      setSortKey(COLUMNS[nextIdx].key as SortKey);
    }
    if (key.name === "left") {
      const curIdx = COLUMNS.findIndex((c) => c.key === sortKey);
      const prevIdx = (curIdx - 1 + COLUMNS.length) % COLUMNS.length;
      setSortKey(COLUMNS[prevIdx].key as SortKey);
    }
    if (key.name === "r") {
      setSortDesc((prev) => !prev);
    }
  });

  const sortedResults = useMemo(() => {
    const sorted = [...results].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (typeof valA === "string" && typeof valB === "string") {
        return valA.localeCompare(valB);
      }
      if (typeof valA === "number" && typeof valB === "number") {
        return valA - valB;
      }
      return 0;
    });
    return sortDesc ? sorted.reverse() : sorted;
  }, [results, sortKey, sortDesc]);

  if (!done) {
    if (!progress) return <text>Starting...</text>;

    const elapsed = Math.floor((now - startTimeRef.current) / 1000);
    let estimatedTotal = 0;
    if (progress.processed > 0) {
      // Simple linear extrapolation
      const rate = progress.processed / (now - startTimeRef.current); // items per ms
      if (rate > 0) {
        const remainingFiles = progress.total - progress.processed;
        estimatedTotal = Math.floor(remainingFiles / (rate * 1000));
      }
    }
    const remaining = estimatedTotal;

    return (
      <box flexDirection="column">
        <text fg="green">Scanning...</text>
        <text>
          Found: {progress.total} | Processed: {progress.processed} | Running: {progress.running}
        </text>
        <text>
          Elapsed: {formatDuration(elapsed)} | Remaining:{" "}
          {progress.processed > 0 ? formatDuration(remaining) : "..."}
        </text>
        <box flexDirection="column" marginTop={1}>
          {progress.currentFiles.map((f, i) => (
            <text key={i} fg="#808080">
              {" "}
              - {f}
            </text>
          ))}
        </box>
      </box>
    );
  }

  // Results View
  const visibleRows = sortedResults.slice(scrollIndex, scrollIndex + viewportHeight);

  return (
    <box flexDirection="column">
      <box borderStyle="single" borderColor="cyan">
        <text>Results: {results.length} files. (q to quit)</text>
      </box>

      {/* Header */}
      <box flexDirection="row" borderStyle="single" border={["bottom"]}>
        {COLUMNS.map((col) => (
          <box key={col.key} width={col.width}>
            <text>
              {sortKey === col.key ? <b>{col.label}</b> : col.label}
              {sortKey === col.key ? (sortDesc ? "↓" : "↑") : ""}
            </text>
          </box>
        ))}
      </box>

      {/* Rows */}
      {visibleRows.map((row, i) => (
        <box key={i} flexDirection="row">
          {COLUMNS.map((col) => {
            let val: string | number | undefined = row[col.key as keyof AudiobookMetadata];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (col.format) val = col.format(val as any);
            if (val === undefined) val = "";

            // Truncate logic needed
            let strVal = String(val);
            if (strVal.length > col.width - 2) {
              strVal = strVal.slice(0, col.width - 2) + "…";
            }

            return (
              <box key={col.key} width={col.width}>
                <text>{strVal}</text>
              </box>
            );
          })}
        </box>
      ))}
    </box>
  );
};

export async function renderTui(scanner: Scanner) {
  const renderer = await createCliRenderer();
  const root = createRoot(renderer);
  root.render(<App scanner={scanner} />);

  await new Promise<void>((resolve) => {
    renderer.on("destroy", () => resolve());
  });
}
