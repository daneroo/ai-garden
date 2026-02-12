import React from "react";
import { TextAttributes } from "@opentui/core";

export interface ProgressState {
  total: number;
  completed: number;
  inFlight: string[];
  startTime: number;
}

export function ProgressView({ state }: { state: ProgressState }) {
  const elapsed = ((Date.now() - state.startTime) / 1000).toFixed(1);
  const pct = state.total > 0 ? Math.round((state.completed / state.total) * 100) : 0;

  return (
    <box flexDirection="column" padding={1}>
      <text>
        <b>Probing audio files...</b>
      </text>
      <text>{"\n"}</text>
      <text>
        {state.completed}/{state.total} ({pct}%) — {elapsed}s elapsed
      </text>
      <text>{"\n"}</text>
      {state.inFlight.length > 0 && (
        <box flexDirection="column">
          <text attributes={TextAttributes.DIM}>In progress:</text>
          {state.inFlight.map((f, i) => (
            <text key={i} fg="cyan">
              {"  "} {f}
            </text>
          ))}
        </box>
      )}
    </box>
  );
}
