// ResultsTable — scrollable results with keyboard navigation and violations filter

import { useState, useMemo } from "react";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import {
  displayPath,
  formatXattrCell,
  sortByPath,
  filterViolations,
  type ResultRow,
} from "./format.ts";

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
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showViolationsOnly, setShowViolationsOnly] = useState(false);

  const filtered = useMemo(
    () => (showViolationsOnly ? filterViolations(rows) : rows),
    [rows, showViolationsOnly],
  );

  const sorted = useMemo(() => {
    const copy = [...filtered].sort(sortByPath);
    if (sortDir === "desc") copy.reverse();
    return copy;
  }, [filtered, sortDir]);

  // Set of violation paths for dimming ancestors
  const violationPathSet = useMemo(() => {
    if (!showViolationsOnly) return null;
    return new Set(
      rows.filter((r) => r.violations.length > 0).map((r) => r.relativePath),
    );
  }, [rows, showViolationsOnly]);

  const clamp = (idx: number) => Math.max(0, Math.min(idx, sorted.length - 1));

  const moveCursor = (next: number) => {
    const clamped = clamp(next);
    setCursor(clamped);
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
      case "home":
        moveCursor(0);
        break;
      case "end":
        moveCursor(sorted.length - 1);
        break;
      case "r":
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        break;
      case "v":
        setShowViolationsOnly((v) => !v);
        setCursor(0);
        setOffset(0);
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
  const arrow = sortDir === "asc" ? " \u2191" : " \u2193";

  // Column widths
  const modeWidth = 11; // "-rw-r--r--@"
  const xattrWidth = 24;

  return (
    <box flexDirection="column">
      {/* Column headers */}
      <text>
        {"MODE".padEnd(modeWidth + 1)}
        {"XATTRS".padEnd(xattrWidth)}
        {`PATH${arrow}`}
      </text>
      <text fg="#666666">
        {"─".repeat(Math.min(80, modeWidth + xattrWidth + 40))}
      </text>

      {/* Rows */}
      {visible.map((row, i) => {
        const idx = offset + i;
        const bg = idx === cursor ? "#333333" : undefined;
        const red = "#ff4444";
        const dim = "#666666";
        const isAncestor =
          violationPathSet !== null && !violationPathSet.has(row.relativePath);

        const modePart = row.mode.padEnd(modeWidth + 1);
        const xattrPart = formatXattrCell(row.xattrs, xattrWidth).padEnd(
          xattrWidth,
        );
        const pathPart = displayPath(row.depth, row.basename);

        const modeFg = isAncestor ? dim : row.modeViolation ? red : undefined;
        const xattrFg = isAncestor ? dim : row.xattrViolation ? red : undefined;
        const pathFg = isAncestor ? dim : row.pathViolation ? red : undefined;

        return (
          <text key={row.relativePath} bg={bg}>
            <span fg={modeFg}>{modePart}</span>
            <span fg={xattrFg}>{xattrPart}</span>
            <span fg={pathFg}>{pathPart}</span>
          </text>
        );
      })}

      {/* Legend */}
      <text> </text>
      <text fg="#666666">
        ↑↓ navigate | shift-↑↓/r reverse | v violations | g/G top/bottom | q
        quit
      </text>
    </box>
  );
}
