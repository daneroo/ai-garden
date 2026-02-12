import React, { useState, useMemo } from "react";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { TextAttributes } from "@opentui/core";
import { basename, extname } from "node:path";
import { formatDuration } from "../probe.ts";
import type { AudioMetadata } from "../probe.ts";
import { parseBookFilename } from "../parse-filename.ts";

interface DisplayRow {
  author: string;
  title: string;
  series: string;
  duration: number;
  bitrate: number;
  codec: string;
  file: string;
}

function toDisplayRow(row: AudioMetadata): DisplayRow {
  const parsed = parseBookFilename(row.relativePath);
  const file = basename(row.relativePath, extname(row.relativePath));
  return {
    author: row.artist ?? parsed.author,
    title: row.title ?? parsed.title,
    series: parsed.series
      ? parsed.number
        ? `${parsed.series} #${parsed.number}`
        : parsed.series
      : "",
    duration: row.duration,
    bitrate: row.bitrate,
    codec: row.codec,
    file,
  };
}

const COLUMNS = ["Author", "Title", "Duration", "Series", "Bitrate", "File"] as const;
type Column = (typeof COLUMNS)[number];

function endTruncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  if (maxLen <= 1) return "…";
  return str.slice(0, maxLen - 1) + "…";
}

function getCellValue(row: DisplayRow, col: Column): string {
  switch (col) {
    case "Author":
      return row.author;
    case "Title":
      return row.title;
    case "Series":
      return row.series;
    case "Duration":
      return formatDuration(row.duration);
    case "Bitrate":
      return `${row.bitrate}kbps`;
    case "File":
      return row.file;
  }
}

function getSortValue(row: DisplayRow, col: Column): string | number {
  switch (col) {
    case "Author":
      return row.author.toLowerCase();
    case "Title":
      return row.title.toLowerCase();
    case "Series":
      return row.series.toLowerCase();
    case "Duration":
      return row.duration;
    case "Bitrate":
      return row.bitrate;
    case "File":
      return row.file.toLowerCase();
  }
}

export function ResultsTable({
  data,
  errors,
  onQuit,
}: {
  data: AudioMetadata[];
  errors: string[];
  onQuit: () => void;
}) {
  const { height } = useTerminalDimensions();
  const [sortCol, setSortCol] = useState(0);
  const [sortReversed, setSortReversed] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);

  const displayRows = useMemo(() => data.map(toDisplayRow), [data]);

  // header(1) + separator(1) + status(1) + error?(1)
  const chrome = 3 + (errors.length > 0 ? 1 : 0);
  const pageSize = Math.max(1, height - chrome);

  const sorted = useMemo(() => {
    const col = COLUMNS[sortCol]!;
    const copy = [...displayRows];
    copy.sort((a, b) => {
      const va = getSortValue(a, col);
      const vb = getSortValue(b, col);
      if (typeof va === "number" && typeof vb === "number") {
        return sortReversed ? vb - va : va - vb;
      }
      const cmp = String(va).localeCompare(String(vb));
      return sortReversed ? -cmp : cmp;
    });
    return copy;
  }, [displayRows, sortCol, sortReversed]);

  const maxScroll = Math.max(0, sorted.length - pageSize);

  useKeyboard((key) => {
    switch (key.name) {
      case "q":
      case "escape":
        onQuit();
        break;
      case "left":
        setSortCol((c) => (c - 1 + COLUMNS.length) % COLUMNS.length);
        setScrollOffset(0);
        break;
      case "right":
        setSortCol((c) => (c + 1) % COLUMNS.length);
        setScrollOffset(0);
        break;
      case "r":
        setSortReversed((r) => !r);
        break;
      case "up":
      case "k":
        setScrollOffset((o) => Math.max(0, o - 1));
        break;
      case "down":
      case "j":
        setScrollOffset((o) => Math.min(maxScroll, o + 1));
        break;
      case "pageup":
        setScrollOffset((o) => Math.max(0, o - pageSize));
        break;
      case "pagedown":
        setScrollOffset((o) => Math.min(maxScroll, o + pageSize));
        break;
      case "g":
        setScrollOffset(0);
        break;
      case "G":
      case "shift-g":
        setScrollOffset(maxScroll);
        break;
    }
  });

  const visible = sorted.slice(scrollOffset, scrollOffset + pageSize);

  // Hard max widths per column — simple and predictable
  const MAX_WIDTHS: Record<Column, number> = {
    Author: 20,
    Title: 25,
    Duration: 8,
    Series: 15,
    Bitrate: 7,
    File: 30,
  };

  const colWidths = COLUMNS.map((col, i) => {
    let natural = col.length;
    for (const row of sorted) {
      natural = Math.max(natural, getCellValue(row, COLUMNS[i]!).length);
    }
    return Math.min(natural, MAX_WIDTHS[col]);
  });

  function formatRow(cells: string[]): string {
    return cells.map((c, i) => endTruncate(c, colWidths[i]!).padEnd(colWidths[i]!)).join("  ");
  }

  const arrow = sortReversed ? "↓" : "↑";
  const headerStr = COLUMNS.map((col, i) => {
    const label = i === sortCol ? `${col} ${arrow}` : col;
    return endTruncate(label, colWidths[i]!).padEnd(colWidths[i]!);
  }).join("  ");
  const sepStr = colWidths.map((w) => "─".repeat(w)).join("──");
  const posIndicator =
    sorted.length > 0
      ? `${scrollOffset + 1}-${Math.min(scrollOffset + pageSize, sorted.length)}/${sorted.length}`
      : "0/0";
  const statusLine = `${posIndicator}  │  q:quit  ←→:sort  r:reverse  j/k:scroll`;

  return (
    <box flexDirection="column">
      <text>{headerStr}</text>
      <text attributes={TextAttributes.DIM}>{sepStr}</text>
      {visible.map((row, i) => (
        <text key={scrollOffset + i}>
          {formatRow(COLUMNS.map((col) => getCellValue(row, col)))}
        </text>
      ))}
      <text attributes={TextAttributes.DIM}>{statusLine}</text>
      {errors.length > 0 && (
        <text fg="yellow">
          {errors.length} file{errors.length === 1 ? "" : "s"} failed to probe
        </text>
      )}
    </box>
  );
}
