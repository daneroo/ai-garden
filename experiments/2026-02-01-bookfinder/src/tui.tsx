import { createCliRenderer } from "@opentui/core";
import { createRoot, useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/react";
import { useEffect, useMemo, useState } from "react";
import { probeFileWithFfprobe } from "./ffprobe";
import { formatBitrateKbps, formatDurationHMS, formatElapsedShort } from "./format";
import { concurrentMap } from "./promisePool";
import { scanForAudioFiles } from "./scanner";
import type { ProbedFile } from "./types";

type TuiState = {
  phase: "scan" | "probe" | "results";
  entriesSeen: number;
  audioFound: number;
  total: number;
  processed: number;
  running: number;
  maxRunning: number;
  elapsedSec: number;
  remainingSec: number;
  warnings: string[];
  runningFiles: string[];
  results: ProbedFile[];
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  scroll: number;
};

type SortKey = "file" | "duration" | "bitrate" | "codec" | "title";

const FFPROBE_TIMEOUT_MS = 30_000;

function clampWarnings(list: string[], max = 4): string[] {
  if (list.length <= max) return list;
  return list.slice(list.length - max);
}

function truncate(text: string, maxWidth: number): string {
  if (maxWidth <= 0) return "";
  if (text.length <= maxWidth) return text;
  if (maxWidth <= 3) return ".".repeat(maxWidth);
  return `${text.slice(0, maxWidth - 3)}...`;
}

function padRight(text: string, width: number): string {
  if (text.length >= width) return text;
  return text + " ".repeat(width - text.length);
}

function sortResults(results: ProbedFile[], key: SortKey, dir: "asc" | "desc"): ProbedFile[] {
  const mult = dir === "asc" ? 1 : -1;
  const get = (f: ProbedFile): string | number => {
    switch (key) {
      case "file":
        return f.relPath;
      case "duration":
        return f.durationSeconds ?? 0;
      case "bitrate":
        return f.bitrateKbps ?? 0;
      case "codec":
        return f.codec ?? "";
      case "title":
        return f.title ?? "";
    }
  };

  return [...results].sort((a, b) => {
    const av = get(a);
    const bv = get(b);
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * mult;
    return String(av).localeCompare(String(bv)) * mult;
  });
}

function App(props: {
  rootAbs: string;
  concurrency: number;
  onExit: () => void;
  onError: (err: Error) => void;
}) {
  const { rootAbs, concurrency, onExit, onError } = props;
  const renderer = useRenderer();
  const { width, height } = useTerminalDimensions();
  const [state, setState] = useState<TuiState>({
    phase: "scan",
    entriesSeen: 0,
    audioFound: 0,
    total: 0,
    processed: 0,
    running: 0,
    maxRunning: 0,
    elapsedSec: 0,
    remainingSec: 0,
    warnings: [],
    runningFiles: [],
    results: [],
    sortKey: "file",
    sortDir: "asc",
    scroll: 0,
  });

  useKeyboard((key) => {
    if (key.name === "escape" || key.name === "q") {
      renderer.destroy();
      onExit();
      return;
    }

    if (state.phase !== "results") return;

    const tableRows = Math.max(3, height - 8);
    const maxScroll = Math.max(0, state.results.length - tableRows);

    const scrollBy = (delta: number) => {
      setState((prev) => ({
        ...prev,
        scroll: Math.max(0, Math.min(maxScroll, prev.scroll + delta)),
      }));
    };

    if (key.name === "up" || key.name === "k") return void scrollBy(-1);
    if (key.name === "down" || key.name === "j") return void scrollBy(1);
    if (key.name === "pageup") return void scrollBy(-tableRows);
    if (key.name === "pagedown") return void scrollBy(tableRows);
    if (key.name === "home" || key.name === "g") {
      setState((prev) => ({ ...prev, scroll: 0 }));
      return;
    }
    if (key.name === "end" || key.name === "G") {
      setState((prev) => ({ ...prev, scroll: maxScroll }));
      return;
    }

    const sortKeys: SortKey[] = ["file", "duration", "bitrate", "codec", "title"];
    if (key.name === "right") {
      setState((prev) => {
        const idx = sortKeys.indexOf(prev.sortKey);
        const nextKey = sortKeys[(idx + 1) % sortKeys.length];
        return { ...prev, sortKey: nextKey, scroll: 0 };
      });
      return;
    }

    if (key.name === "left") {
      setState((prev) => {
        const idx = sortKeys.indexOf(prev.sortKey);
        const nextKey = sortKeys[(idx - 1 + sortKeys.length) % sortKeys.length];
        return { ...prev, sortKey: nextKey, scroll: 0 };
      });
      return;
    }

    if (key.name === "r") {
      setState((prev) => ({
        ...prev,
        sortDir: prev.sortDir === "asc" ? "desc" : "asc",
        scroll: 0,
      }));
      return;
    }
  });

  useEffect(() => {
    let cancelled = false;

    const addWarning = (text: string) => {
      setState((prev) => ({
        ...prev,
        warnings: clampWarnings([...prev.warnings, text]),
      }));
    };

    const updateProbeTiming = (processed: number, total: number, startMs: number) => {
      const elapsedSec = (Date.now() - startMs) / 1000;
      const secPerFile = processed > 0 ? elapsedSec / processed : 0;
      const remainingSec = secPerFile * Math.max(0, total - processed);
      return { elapsedSec, remainingSec };
    };

    const run = async () => {
      try {
        const scanned = await scanForAudioFiles(rootAbs, {
          onProgress: ({ entriesSeen, audioFound }) => {
            if (cancelled) return;
            setState((prev) => ({
              ...prev,
              phase: "scan",
              entriesSeen,
              audioFound,
            }));
          },
        });

        if (cancelled) return;

        const total = scanned.length;
        const probeStartMs = Date.now();

        setState((prev) => ({
          ...prev,
          phase: "probe",
          total,
          processed: 0,
          running: 0,
          maxRunning: 0,
          elapsedSec: 0,
          remainingSec: 0,
          runningFiles: [],
        }));

        const probed = await concurrentMap(scanned, concurrency, async (file) => {
          let running = 0;
          let processed = 0;
          let maxRunning = 0;

          setState((prev) => {
            running = prev.running + 1;
            processed = prev.processed;
            maxRunning = Math.max(prev.maxRunning, running);
            const timing = updateProbeTiming(processed, total, probeStartMs);
            return {
              ...prev,
              phase: "probe",
              running,
              maxRunning,
              runningFiles: [...prev.runningFiles, file.relPath],
              ...timing,
            };
          });

          try {
            const meta = await probeFileWithFfprobe(file.absPath, FFPROBE_TIMEOUT_MS);
            const out: ProbedFile = { ...file, ...meta };
            return out;
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            addWarning(`[warn] ffprobe failed for ${file.relPath}: ${msg}`);
            return null;
          } finally {
            setState((prev) => {
              processed = prev.processed + 1;
              const timing = updateProbeTiming(processed, total, probeStartMs);
              return {
                ...prev,
                processed,
                running: Math.max(0, prev.running - 1),
                runningFiles: prev.runningFiles.filter((name) => name !== file.relPath),
                ...timing,
              };
            });
          }
        });

        if (cancelled) return;
        const ok = probed.filter((x): x is ProbedFile => x != null);
        ok.sort((a, b) => a.relPath.localeCompare(b.relPath));

        setState((prev) => ({
          ...prev,
          phase: "results",
          running: 0,
          runningFiles: [],
          results: ok,
        }));
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        onError(error);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [rootAbs, concurrency, onError]);

  const effectiveConcurrency = Math.min(concurrency, state.total);
  const progressPct = state.total > 0 ? Math.round((state.processed / state.total) * 100) : 0;
  const progressWidth = `${progressPct}%` as `${number}%`;

  const phaseLabel =
    state.phase === "scan" ? "Scanning" : state.phase === "probe" ? "Probing" : "Results";

  const timing =
    state.phase === "probe" && state.processed > 0
      ? `elapsed ${formatElapsedShort(state.elapsedSec)} remaining ${formatElapsedShort(state.remainingSec)}`
      : state.phase === "results" && state.processed > 0
        ? `elapsed ${formatElapsedShort(state.elapsedSec)}`
        : "";

  const infoLine =
    state.phase === "scan"
      ? `entries ${state.entriesSeen} | audio files ${state.audioFound}`
      : `files ${state.total} | processed ${state.processed}/${state.total} | running ${state.running}/${effectiveConcurrency}`;

  const warnings = useMemo(() => state.warnings, [state.warnings]);
  const runningFiles = useMemo(() => state.runningFiles, [state.runningFiles]);
  const sortedResults = useMemo(
    () => sortResults(state.results, state.sortKey, state.sortDir),
    [state.results, state.sortKey, state.sortDir],
  );

  const innerWidth = Math.max(40, width - 2);
  const durationW = 10;
  const bitrateW = 9;
  const codecW = 8;
  const titleW = Math.min(30, Math.max(10, Math.floor(innerWidth * 0.25)));
  const separators = 4 * 3;
  const fileW = Math.max(12, innerWidth - (durationW + bitrateW + codecW + titleW + separators));

  const renderRow = (f: ProbedFile) => {
    const file = padRight(truncate(f.relPath, fileW), fileW);
    const duration = padRight(formatDurationHMS(f.durationSeconds), durationW);
    const bitrate = padRight(formatBitrateKbps(f.bitrateKbps), bitrateW);
    const codec = padRight(truncate(f.codec ?? "-", codecW), codecW);
    const title = padRight(truncate(f.title ?? "-", titleW), titleW);
    return `${file} | ${duration} | ${bitrate} | ${codec} | ${title}`;
  };

  const headerCell = (label: string, width: number, key: SortKey) => {
    const isSorted = state.sortKey === key;
    const arrow = isSorted ? (state.sortDir === "asc" ? " ↑" : " ↓") : "";
    const maxLabelWidth = Math.max(1, width - arrow.length);
    const labelText = truncate(label, maxLabelWidth);
    const content = padRight(`${labelText}${arrow}`, width);
    return isSorted ? (
      <text>
        <strong>{content}</strong>
      </text>
    ) : (
      <text>{content}</text>
    );
  };

  const rule = `${"-".repeat(fileW)}-+-${"-".repeat(durationW)}-+-${"-".repeat(bitrateW)}-+-${"-".repeat(codecW)}-+-${"-".repeat(titleW)}`;
  const tableRows = Math.max(3, height - 10);
  const maxScroll = Math.max(0, sortedResults.length - tableRows);
  const scroll = Math.min(state.scroll, maxScroll);
  const visibleRows = sortedResults.slice(scroll, scroll + tableRows);

  return (
    <box style={{ padding: 1, flexDirection: "column", gap: 1 }}>
      <text fg="#6ad5ff">Bookfinder</text>
      <text>{`${phaseLabel} | ${infoLine}${timing ? ` | ${timing}` : ""}`}</text>

      {state.phase !== "scan" ? (
        <box style={{ backgroundColor: "#2a2a2a", height: 1 }}>
          <box style={{ width: progressWidth, height: 1, backgroundColor: "#3fb950" }} />
        </box>
      ) : null}

      {warnings.length > 0 ? (
        <box style={{ flexDirection: "column", gap: 0 }}>
          <text fg="#f0883e">Warnings</text>
          {warnings.map((w, i) => (
            <text key={`${w}-${i}`} fg="#f0b37e">
              {w}
            </text>
          ))}
        </box>
      ) : null}

      {state.phase === "probe" && runningFiles.length > 0 ? (
        <box style={{ flexDirection: "column", gap: 0 }}>
          <text fg="#8cc84b">In Flight</text>
          {runningFiles.map((name, i) => (
            <text key={`${name}-${i}`} fg="#c7f0a8">
              {name}
            </text>
          ))}
        </box>
      ) : null}

      {state.phase === "results" ? (
        <box style={{ flexDirection: "column", gap: 0 }}>
          <box style={{ height: 1 }}>
            <text fg="#8bb9ff">Results</text>
          </box>
          <box style={{ flexDirection: "row", height: 1 }}>
            {headerCell("File", fileW, "file")}
            <text> | </text>
            {headerCell("Duration", durationW, "duration")}
            <text> | </text>
            {headerCell("Bitrate", bitrateW, "bitrate")}
            <text> | </text>
            {headerCell("Codec", codecW, "codec")}
            <text> | </text>
            {headerCell("Title", titleW, "title")}
          </box>
          <box style={{ height: 1 }}>
            <text fg="#444444">{rule}</text>
          </box>
          {visibleRows.map((f) => (
            <text key={f.relPath}>{renderRow(f)}</text>
          ))}
          <text fg="#888888">
            {`Sort: ${state.sortKey} (${state.sortDir}) | Scroll: ${scroll + 1}-${Math.min(scroll + tableRows, sortedResults.length)}/${sortedResults.length} | Keys: j/k up/down pgup/pgdn g/G | left/right sort r reverse | q to quit`}
          </text>
        </box>
      ) : null}
    </box>
  );
}

export async function runTuiProgress(options: {
  rootAbs: string;
  concurrency: number;
}): Promise<void> {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    targetFps: 30,
    useAlternateScreen: true,
  });

  return await new Promise<void>((resolve, reject) => {
    const root = createRoot(renderer);
    root.render(
      <App
        rootAbs={options.rootAbs}
        concurrency={options.concurrency}
        onExit={() => resolve()}
        onError={(err) => {
          renderer.destroy();
          reject(err);
        }}
      />,
    );
  });
}
