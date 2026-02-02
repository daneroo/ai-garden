import React, { useEffect, useState } from "react";
import { TextAttributes } from "@opentui/core";

interface ProgressViewProps {
  total: number;
  completed: number;
  inFlight: string[];
  startTime: number;
}

export function ProgressView({
  total,
  completed,
  inFlight,
  startTime,
}: ProgressViewProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, []);

  const elapsedMs = now - startTime;
  const rate = completed > 0 ? completed / elapsedMs : 0; // items/ms
  const remaining = total - completed;
  const estimatedRemainingMs = rate > 0 ? remaining / rate : 0;

  const formatTime = (ms: number) => {
    if (!Number.isFinite(ms) || ms < 0) return "--:--";
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const percent = total > 0 ? Math.floor((completed / total) * 100) : 0;
  const progressBarWidth = 40;
  const filled = Math.min(
    progressBarWidth,
    Math.max(0, Math.floor((percent / 100) * progressBarWidth)),
  );
  const bar = "█".repeat(filled) + "░".repeat(progressBarWidth - filled);

  return (
    <box flexDirection="column" padding={1}>
      <text attributes={TextAttributes.BOLD} fg="blue" marginBottom={1}>
        Scanning & Probing...
      </text>

      <box marginBottom={1}>
        <text>
          Progress: [{bar}] {percent}%
        </text>
      </box>

      <box marginBottom={1} flexDirection="row">
        <text marginRight={2}>
          Processed: {completed}/{total}
        </text>
        <text marginRight={2}>In-flight: {inFlight.length}</text>
      </box>

      <box flexDirection="row" marginBottom={1}>
        <text marginRight={2}>Elapsed: {formatTime(elapsedMs)}</text>
        <text>ETA: {formatTime(estimatedRemainingMs)}</text>
      </box>

      <box flexDirection="column">
        <text fg="gray">Processing:</text>
        {inFlight.slice(0, 5).map((f, i) => (
          <text key={i} truncate>
            {f}
          </text>
        ))}
      </box>
    </box>
  );
}
