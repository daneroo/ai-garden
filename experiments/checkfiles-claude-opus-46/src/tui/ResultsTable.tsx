// ResultsTable — scrollable results with keyboard navigation and column sorting

import { useState, useMemo } from "react";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import {
  displayPath,
  compactXattr,
  commonXattrPrefix,
  sortByPath,
  sortByXattrs,
  type ResultRow,
} from "./format.ts";

type SortColumn = "path" | "xattrs";
type SortDir = "asc" | "desc";

// Lines reserved: App header (title+summary+blank=3) + table header (columns+separator=2) + footer (blank+legend=2) + padding (2)
const RESERVED_LINES = 9;

export function ResultsTable({
  rows,
  onQuit,
}: {
  rows: ResultRow[];
  onQuit: () => void;
}) {
  const { height } = useTerminalDimensions();
  const viewportSize = Math.max(1, height - RESERVED_LINES);

  const [cursor, setCursor] = useState(0);
  const [offset, setOffset] = useState(0);
  const [sortCol, setSortCol] = useState<SortColumn>("path");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const xattrPrefix = useMemo(() => commonXattrPrefix(rows), [rows]);

  const sorted = useMemo(() => {
    const cmp = sortCol === "path" ? sortByPath : sortByXattrs;
    const copy = [...rows].sort(cmp);
    if (sortDir === "desc") copy.reverse();
    return copy;
  }, [rows, sortCol, sortDir]);

  const clamp = (idx: number) => Math.max(0, Math.min(idx, sorted.length - 1));

  const moveCursor = (next: number) => {
    const clamped = clamp(next);
    setCursor(clamped);
    // Adjust viewport to keep cursor visible
    if (clamped < offset) setOffset(clamped);
    else if (clamped >= offset + viewportSize)
      setOffset(clamped - viewportSize + 1);
  };

  useKeyboard((key) => {
    switch (key.name) {
      case "up":
        if (key.shift) {
          setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else if (key.meta) {
          moveCursor(0);
        } else {
          moveCursor(cursor - 1);
        }
        break;
      case "down":
        if (key.shift) {
          setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else if (key.meta) {
          moveCursor(sorted.length - 1);
        } else {
          moveCursor(cursor + 1);
        }
        break;
      case "left":
        setSortCol((c) => (c === "path" ? "xattrs" : "path"));
        break;
      case "right":
        setSortCol((c) => (c === "path" ? "xattrs" : "path"));
        break;
      case "home":
        moveCursor(0);
        break;
      case "end":
        moveCursor(sorted.length - 1);
        break;
      case "r":
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        break;
      case "g":
        if (!key.shift) moveCursor(0);
        else moveCursor(sorted.length - 1); // G
        break;
      case "q":
      case "escape":
        onQuit();
        break;
    }
  });

  const visible = sorted.slice(offset, offset + viewportSize);
  const arrow = (col: SortColumn) =>
    sortCol === col ? (sortDir === "asc" ? " \u2191" : " \u2193") : "";

  // Column widths
  const modeWidth = 11; // "-rw-r--r--@"
  const xattrWidth = 24;

  return (
    <box flexDirection="column">
      {/* Column headers */}
      <text>
        {"MODE".padEnd(modeWidth + 1)}
        {"XATTRS".padEnd(xattrWidth)}
        {`PATH${arrow("path")}`}
        {sortCol === "xattrs" ? `  [xattrs${arrow("xattrs")}]` : ""}
      </text>
      <text fg="#666666">
        {"─".repeat(Math.min(80, modeWidth + xattrWidth + 40))}
      </text>

      {/* Rows */}
      {visible.map((row, i) => {
        const idx = offset + i;
        const bg = idx === cursor ? "#333333" : undefined;
        const red = "#ff4444";

        const modePart = row.mode.padEnd(modeWidth + 1);
        const xattrPart = (
          row.xattrs.length > 0
            ? row.xattrs.map((x) => compactXattr(x, xattrPrefix)).join(",")
            : "—"
        ).padEnd(xattrWidth);
        const pathPart = displayPath(row.depth, row.basename);

        return (
          <text key={row.relativePath} bg={bg}>
            <span fg={row.modeViolation ? red : undefined}>{modePart}</span>
            <span fg={row.xattrViolation ? red : undefined}>{xattrPart}</span>
            <span fg={row.pathViolation ? red : undefined}>{pathPart}</span>
          </text>
        );
      })}

      {/* Legend */}
      <text> </text>
      <text fg="#666666">
        ↑↓ navigate | ←→ sort column | r reverse | g/G top/bottom | q quit
      </text>
    </box>
  );
}
