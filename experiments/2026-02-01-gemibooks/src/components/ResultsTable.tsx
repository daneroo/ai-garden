import React, { useState, useMemo } from "react";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { TextAttributes } from "@opentui/core";
import type { AudioMetadata } from "../types.js";

type SortField = "artist" | "title" | "duration" | "bitrate" | "codec" | "path";
type SortOrder = "asc" | "desc";

interface ResultsTableProps {
  data: AudioMetadata[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

const COLUMNS: { id: SortField; label: string; width: number }[] = [
  { id: "artist", label: "Author", width: 20 },
  { id: "title", label: "Title", width: 30 },
  { id: "duration", label: "Duration", width: 10 },
  { id: "bitrate", label: "Bitrate", width: 8 },
  { id: "codec", label: "Codec", width: 8 },
  { id: "path", label: "File", width: 40 }, // Last column takes remaining usually, but fixed for now
];

export function ResultsTable({
  data,
  sortField,
  sortOrder,
  onSort,
}: ResultsTableProps) {
  const { width: stdoutColumns, height: stdoutRows } = useTerminalDimensions();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Layout calculations
  const headerHeight = 2; // Header + Separator
  const footerHeight = 1; // Status bar
  const visibleRows = Math.max(1, stdoutRows - headerHeight - footerHeight);

  // Sort data
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let valA: any = a[sortField];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let valB: any = b[sortField];

      // Handle missing/undefined
      if (valA === undefined) valA = "";
      if (valB === undefined) valB = "";

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortOrder]);

  // Input handling
  useKeyboard((key) => {
    if (key.name === "j" || key.name === "down") {
      setSelectedIndex((prev) => Math.min(prev + 1, sortedData.length - 1));
      if (selectedIndex >= scrollOffset + visibleRows - 1) {
        setScrollOffset((prev) =>
          Math.min(prev + 1, sortedData.length - visibleRows),
        );
      }
    }
    if (key.name === "k" || key.name === "up") {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
      if (selectedIndex <= scrollOffset) {
        setScrollOffset((prev) => Math.max(prev - 1, 0));
      }
    }
    if (key.name === "pageup") {
      setSelectedIndex((prev) => {
        const newIdx = Math.max(0, prev - visibleRows);
        setScrollOffset(Math.max(0, newIdx - Math.floor(visibleRows / 2)));
        return newIdx;
      });
    }
    if (key.name === "pagedown") {
      setSelectedIndex((prev) => {
        const newIdx = Math.min(sortedData.length - 1, prev + visibleRows);
        setScrollOffset((currentOffset) => {
          // Try to keep selection centered-ish or just ensure visibility
          if (newIdx >= currentOffset + visibleRows) {
            return Math.min(
              sortedData.length - visibleRows,
              newIdx - Math.floor(visibleRows / 2),
            );
          }
          return currentOffset;
        });
        return newIdx;
      });
    }
    if (key.name === "g") {
      setSelectedIndex(0);
      setScrollOffset(0);
    }
    if (key.name === "G" && key.shift) {
      setSelectedIndex(sortedData.length - 1);
      setScrollOffset(Math.max(0, sortedData.length - visibleRows));
    }
    // Sorting controls
    if (key.name === "right") {
      const currIdx = COLUMNS.findIndex((c) => c.id === sortField);
      const nextIdx = (currIdx + 1) % COLUMNS.length;
      handleSort(COLUMNS[nextIdx].id);
    }
    if (key.name === "left") {
      const currIdx = COLUMNS.findIndex((c) => c.id === sortField);
      const prevIdx = (currIdx - 1 + COLUMNS.length) % COLUMNS.length;
      handleSort(COLUMNS[prevIdx].id);
    }
    if (key.name === "r") {
      // Toggle order
      handleSort(sortField);
    }
  });

  const handleSort = (field: SortField) => {
    onSort(field);
    setSelectedIndex(0);
    setScrollOffset(0);
  };

  // Formatting helpers
  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const truncate = (str: string | undefined, width: number) => {
    if (!str) return "".padEnd(width);
    if (str.length <= width) return str.padEnd(width);
    return str.slice(0, width - 1) + "…";
  };

  // Special case for file path: show end? Req: "Show beginning of value, except filename, where the end is more important"
  const truncatePath = (str: string, width: number) => {
    if (str.length <= width) return str.padEnd(width);
    return "…" + str.slice(-(width - 1));
  };

  // Render Rows
  const rows = sortedData.slice(scrollOffset, scrollOffset + visibleRows);

  return (
    <box flexDirection="column">
      {/* Header */}
      <box flexDirection="row">
        {COLUMNS.map((col) => {
          const isSorted = sortField === col.id;
          const arrow = isSorted ? (sortOrder === "asc" ? "↑" : "↓") : " ";
          // Reserve 2 chars for space + arrow
          const labelWidth = col.width - 2;
          const label = truncate(col.label, labelWidth).trimEnd();
          // Pad the rest to fill width
          const content = (label + " " + arrow).padEnd(col.width);

          return (
            <text
              key={col.id}
              attributes={isSorted ? TextAttributes.BOLD : 0}
              fg={isSorted ? "green" : "white"}
            >
              {content}
            </text>
          );
        })}
      </box>
      <box>
        <text fg="gray">{"-".repeat(stdoutColumns)}</text>
      </box>

      {/* Body */}
      {rows.map((item, idx) => {
        const globalIdx = scrollOffset + idx;
        const isSelected = globalIdx === selectedIndex;

        return (
          <box key={item.absolutePath}>
            <text
              bg={isSelected ? "blue" : undefined}
              fg={isSelected ? "white" : undefined}
            >
              {truncate(item.artist, COLUMNS[0].width)}
              {truncate(item.title, COLUMNS[1].width)}
              {truncate(formatDuration(item.duration), COLUMNS[2].width)}
              {truncate(item.bitrate.toString(), COLUMNS[3].width)}
              {truncate(item.codec, COLUMNS[4].width)}
              {truncatePath(item.path, COLUMNS[5].width)}
            </text>
          </box>
        );
      })}

      {/* Status Footer */}
      <box marginTop={Math.max(0, visibleRows - rows.length)}>
        <text fg="gray">
          Total: {data.length} | Selected: {selectedIndex + 1} | Sort:{" "}
          {sortField} ({sortOrder}) | q: quit
        </text>
      </box>
    </box>
  );
}
