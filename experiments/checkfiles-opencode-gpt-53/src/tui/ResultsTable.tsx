import { useMemo, useState } from "react";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import type { InspectedNodeRecord } from "../types.ts";
import {
  displayPath,
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

  const sorted = useMemo(() => {
    const copy = [...rows].sort(sortByPath);
    if (sortDir === "desc") copy.reverse();
    return copy;
  }, [rows, sortDir]);

  function move(next: number) {
    const clamped = Math.max(0, Math.min(next, sorted.length - 1));
    setCursor(clamped);
    if (clamped < offset) setOffset(clamped);
    if (clamped >= offset + viewport) setOffset(clamped - viewport + 1);
  }

  useKeyboard((key) => {
    switch (key.name) {
      case "up":
        if (key.shift) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else if (key.meta) move(0);
        else move(cursor - 1);
        break;
      case "down":
        if (key.shift) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else if (key.meta) move(sorted.length - 1);
        else move(cursor + 1);
        break;
      case "home":
        move(0);
        break;
      case "end":
        move(sorted.length - 1);
        break;
      case "g":
        if (key.shift) move(sorted.length - 1);
        else move(0);
        break;
      case "r":
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
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

        return (
          <text
            key={`${row.relativePath}:${idx}`}
            bg={selected ? "#333333" : undefined}
          >
            <span fg={row.modeValid ? undefined : "#ff4444"}>{modeText}</span>
            <span fg={row.xattrsValid ? undefined : "#ff4444"}>
              {xattrText}
            </span>
            <span fg={row.isHidden || row.isSymlink ? "#ff4444" : undefined}>
              {pathText}
            </span>
          </text>
        );
      })}
      <text> </text>
      <text fg="#666666">
        ↑↓ move | shift-↑↓/r reverse | g/G top/bottom | q quit
      </text>
    </box>
  );
}
