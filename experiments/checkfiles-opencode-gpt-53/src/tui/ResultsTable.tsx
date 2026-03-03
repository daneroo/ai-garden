import { useMemo, useState } from "react";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import type { InspectedNodeRecord } from "../types.ts";
import {
  displayPath,
  filterViolations,
  formatMode,
  formatXattrCell,
  sortByPath,
} from "./format.ts";

type SortDir = "asc" | "desc";

const RESERVED_ROWS = 8;

export function ResultsTable({
  rows,
  onQuit,
}: {
  rows: InspectedNodeRecord[];
  onQuit: () => void;
}) {
  const { height } = useTerminalDimensions();
  const viewport = Math.max(1, height - RESERVED_ROWS);
  const [cursor, setCursor] = useState(0);
  const [offset, setOffset] = useState(0);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showViolationsOnly, setShowViolationsOnly] = useState(false);

  const reverseSort = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

  const filtered = useMemo(
    () => (showViolationsOnly ? filterViolations(rows) : rows),
    [rows, showViolationsOnly],
  );

  const sorted = useMemo(() => {
    const copy = [...filtered].sort(sortByPath);
    if (sortDir === "desc") copy.reverse();
    return copy;
  }, [filtered, sortDir]);

  const violationPathSet = useMemo(() => {
    if (!showViolationsOnly) return null;
    return new Set(
      rows
        .filter((row) => row.violations.length > 0)
        .map((row) => row.relativePath),
    );
  }, [rows, showViolationsOnly]);

  function move(next: number) {
    const clamped = Math.max(0, Math.min(next, sorted.length - 1));
    setCursor(clamped);
    if (clamped < offset) setOffset(clamped);
    if (clamped >= offset + viewport) setOffset(clamped - viewport + 1);
  }

  function jumpTop() {
    move(0);
  }

  function jumpBottom() {
    move(sorted.length - 1);
  }

  useKeyboard((key) => {
    switch (key.name) {
      case "up":
        if (key.shift) reverseSort();
        else if (key.meta) jumpTop();
        else move(cursor - 1);
        break;
      case "down":
        if (key.shift) reverseSort();
        else if (key.meta) jumpBottom();
        else move(cursor + 1);
        break;
      case "home":
        jumpTop();
        break;
      case "end":
        jumpBottom();
        break;
      case "g":
        if (key.shift) jumpBottom();
        else jumpTop();
        break;
      case "r":
        reverseSort();
        break;
      case "v":
        setShowViolationsOnly((prev) => !prev);
        setCursor(0);
        setOffset(0);
        break;
      case "q":
      case "escape":
        onQuit();
        break;
    }
  });

  const visible = sorted.slice(offset, offset + viewport);
  const arrow = sortDir === "asc" ? "↑" : "↓";
  const modeWidth = 11;
  const xattrWidth = 22;

  return (
    <box flexDirection="column">
      <text>
        {"MODE".padEnd(modeWidth + 1)}
        {"XATTRS".padEnd(xattrWidth)}
        {`PATH ${arrow}`}
      </text>
      <text fg="#666666">{"─".repeat(80)}</text>
      {visible.map((row, idx) => {
        const absoluteIndex = offset + idx;
        const selected = absoluteIndex === cursor;
        const modeText = formatMode(row).padEnd(modeWidth + 1);
        const xattrText = formatXattrCell(row.xattrs, xattrWidth).padEnd(
          xattrWidth,
        );
        const pathText = displayPath(row.depth, row.basename);
        const isContextRow =
          violationPathSet !== null && !violationPathSet.has(row.relativePath);
        const dim = "#666666";
        const red = "#ff4444";

        return (
          <text
            key={`${row.relativePath}:${idx}`}
            bg={selected ? "#333333" : undefined}
          >
            <span fg={isContextRow ? dim : row.modeValid ? undefined : red}>
              {modeText}
            </span>
            <span fg={isContextRow ? dim : row.xattrsValid ? undefined : red}>
              {xattrText}
            </span>
            <span
              fg={
                isContextRow
                  ? dim
                  : row.isHidden || row.isSymlink
                    ? red
                    : undefined
              }
            >
              {pathText}
            </span>
          </text>
        );
      })}
      <text> </text>
      <text fg="#666666">
        ↑↓ move | shift-↑↓/r reverse | v violations | g/G top/bottom | q quit
      </text>
    </box>
  );
}
