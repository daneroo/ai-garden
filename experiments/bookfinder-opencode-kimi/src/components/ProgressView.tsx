import type { ProgressState } from "./TuiApp.js";

interface ProgressViewProps {
  state: ProgressState;
}

export function ProgressView({ state }: ProgressViewProps) {
  const { total, completed, inFlight, startTime } = state;
  const elapsedMs = Date.now() - startTime;
  const elapsed = (elapsedMs / 1000).toFixed(1);
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const remaining =
    completed > 0 ? ((elapsedMs / 1000 / completed) * (total - completed)).toFixed(1) : "0.0";

  return (
    <box flexDirection="column" padding={1}>
      <box height={1}>
        <text>Extracting metadata...</text>
      </box>

      <box height={1} marginTop={1}>
        <text>
          {completed}/{total} ({percentage}%) — {elapsed}s elapsed — {remaining}s remaining
        </text>
      </box>

      {inFlight.length > 0 && (
        <box flexDirection="column" marginTop={1}>
          <text>In progress:</text>
          {inFlight.slice(0, 10).map((f, i) => (
            <box key={i} height={1}>
              <text> {f.length > 70 ? "..." + f.slice(-67) : f}</text>
            </box>
          ))}
        </box>
      )}
    </box>
  );
}
