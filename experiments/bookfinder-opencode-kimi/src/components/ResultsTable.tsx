import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { useState, useMemo } from "react";
import type { AudioMetadata } from "../ffprobe.js";

interface ResultsTableProps {
  data: AudioMetadata[];
  onQuit: () => void;
}

const GAP = "  "; // 2 spaces between columns

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// Truncate from end (keep beginning) - for Author/Title
function truncEnd(str: string | undefined, len: number): string {
  if (!str) return "".padEnd(len);
  if (str.length <= len) return str.padEnd(len);
  return str.slice(0, len - 1) + "…";
}

// Truncate from front (keep end) - for File
function truncFront(str: string | undefined, len: number): string {
  if (!str) return "".padEnd(len);
  if (str.length <= len) return str.padEnd(len);
  return "…" + str.slice(-(len - 1));
}

function calculateWidths(termWidth: number) {
  // Account for gaps (5 gaps between 6 columns)
  const availWidth = Math.max(80, termWidth) - 10;

  // Fixed minimums for numeric columns
  const wDuration = 10;
  const wBitrate = 7;
  const wCodec = 6;

  // Remaining for flexible columns
  const flexWidth = availWidth - wDuration - wBitrate - wCodec;
  const wAuthor = Math.max(15, Math.floor(flexWidth * 0.35));
  const wTitle = Math.max(20, Math.floor(flexWidth * 0.4));
  const wFile = Math.max(15, flexWidth - wAuthor - wTitle);

  return { wAuthor, wTitle, wDuration, wBitrate, wCodec, wFile };
}

export function ResultsTable({ data, onQuit }: ResultsTableProps) {
  const { width, height } = useTerminalDimensions();
  const [sortColumn, setSortColumn] = useState<number>(0);
  const [sortAscending, setSortAscending] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const widths = useMemo(() => calculateWidths(width), [width]);
  const { wAuthor, wTitle, wDuration, wBitrate, wCodec, wFile } = widths;

  const headers = ["Author", "Title", "Duration", "Bitrate", "Codec", "File"];
  const colWidths = [wAuthor, wTitle, wDuration, wBitrate, wCodec, wFile];

  useKeyboard((key) => {
    switch (key.name) {
      case "q":
      case "escape":
        onQuit();
        break;
      case "left":
        setSortColumn((prev) => (prev - 1 + headers.length) % headers.length);
        break;
      case "right":
        setSortColumn((prev) => (prev + 1) % headers.length);
        break;
      case "r":
        setSortAscending((prev) => !prev);
        break;
      case "up":
      case "k":
        setSelectedIndex((prev) => Math.max(0, prev - 1));
        break;
      case "down":
      case "j":
        setSelectedIndex((prev) => Math.min(data.length - 1, prev + 1));
        break;
      case "pageup":
        setSelectedIndex((prev) => Math.max(0, prev - (height - 5)));
        break;
      case "pagedown":
        setSelectedIndex((prev) => Math.min(data.length - 1, prev + (height - 5)));
        break;
      case "g":
        if (!key.shift) setSelectedIndex(0);
        break;
      case "G":
        setSelectedIndex(data.length - 1);
        break;
    }
  });

  const sortedData = useMemo(() => {
    const keys: (keyof AudioMetadata)[] = [
      "artist",
      "title",
      "duration",
      "bitrate",
      "codec",
      "relativePath",
    ];
    const key = keys[sortColumn];
    if (!key) return data;
    return [...data].sort((a, b) => {
      const aVal = String(a[key] ?? "");
      const bVal = String(b[key] ?? "");
      return sortAscending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [data, sortColumn, sortAscending]);

  const visibleRows = Math.max(0, height - 4);
  const scrollOffset = Math.max(
    0,
    Math.min(selectedIndex - Math.floor(visibleRows / 2), data.length - visibleRows)
  );
  const visibleData = sortedData.slice(scrollOffset, scrollOffset + visibleRows);

  // Build header row
  const headerRow = headers
    .map((h, i) => {
      const label = i === sortColumn ? (sortAscending ? "↑ " : "↓ ") + h : "  " + h;
      return truncEnd(label, colWidths[i] ?? 10);
    })
    .join(GAP);

  // Calculate table width for separator
  const tableWidth = colWidths.reduce((a, b) => a + b, 0) + GAP.length * 5;

  return (
    <box flexDirection="column" width={width} height={height}>
      <box height={1}>
        <text> Kimibooks - Audiobook Scanner Results </text>
      </box>

      <box height={1}>
        <text>{headerRow}</text>
      </box>

      <box height={1}>
        <text>{"─".repeat(Math.min(tableWidth, width - 1))}</text>
      </box>

      <box flexDirection="column" flexGrow={1}>
        {visibleData.map((item, idx) => {
          const actualIndex = scrollOffset + idx;
          const isSelected = actualIndex === selectedIndex;

          // Build data row as single formatted string
          const row = [
            truncEnd(item.artist, wAuthor),
            truncEnd(item.title, wTitle),
            truncEnd(formatDuration(item.duration), wDuration),
            truncEnd(`${item.bitrate}k`, wBitrate),
            truncEnd(item.codec, wCodec),
            truncFront(item.relativePath, wFile),
          ].join(GAP);

          return (
            <box key={item.path} height={1} backgroundColor={isSelected ? "#414868" : undefined}>
              <text>{row}</text>
            </box>
          );
        })}
      </box>

      <box height={1}>
        <text>
          {`${selectedIndex + 1}/${data.length} | Sort: ${headers[sortColumn]} (${sortAscending ? "asc" : "desc"}) | ←→:sort r:reverse ↑↓:nav q:quit`}
        </text>
      </box>
    </box>
  );
}
