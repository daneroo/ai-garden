/**
 * Timer - A Preact countdown timer component.
 *
 * This package uses Preact for JSX rendering. The Preact dependency is
 * inherited from the root deno.jsonc to ensure all workspace members
 * share the same version.
 *
 * @module
 */
import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";

export interface TimerProps {
  /** Initial time in seconds (default: 300 = 5 minutes) */
  initialSeconds?: number;
}

/**
 * A countdown timer component with pause/resume functionality.
 *
 * - Starts at `initialSeconds` (default: 5 minutes)
 * - Click to pause/resume
 * - Turns green when complete
 */
export function Timer({ initialSeconds = 300 }: TimerProps): JSX.Element {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const isComplete = secondsLeft === 0;

  useEffect(() => {
    if (!isRunning || isComplete) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isComplete]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const handleClick = () => {
    if (!isComplete) {
      setIsRunning(!isRunning);
    }
  };

  // Styling constants
  const MIN_WIDTH = "min-w-[7em]";
  const COLOR_COMPLETE = "text-green-600";
  const COLOR_RUNNING = "text-red-600";
  const COLOR_PAUSED = "text-red-400";

  // Derived display values
  const statusText = isComplete
    ? "Complete!"
    : isRunning
    ? "Running"
    : "Paused";
  const timerColor = isComplete
    ? COLOR_COMPLETE
    : isRunning
    ? COLOR_RUNNING
    : COLOR_PAUSED;

  return (
    <div
      onClick={handleClick}
      class={`px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 text-sm cursor-pointer select-none text-center ${MIN_WIDTH}`}
    >
      <span class="block text-gray-400 text-xs uppercase tracking-wide font-semibold">
        {statusText}
      </span>
      <span
        class={`font-mono font-bold text-lg transition-colors ${timerColor}`}
      >
        {display}
      </span>
    </div>
  );
}
