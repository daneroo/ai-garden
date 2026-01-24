import { expect, test } from "bun:test";
import process from "node:process";
import {
  createConsoleMonitor,
  FFMPEG_AUDIO_PROGRESS_REGEX,
  runTask,
  type TaskConfig,
  type TaskEvent,
} from "./task.ts";

import { join, resolve } from "node:path";
import { mkdirSync } from "node:fs";

// Resolve paths relative to this file (lib/task_test.ts)
const PKG_ROOT = resolve(import.meta.dirname, "..");
const FIXTURES_DIR = join(PKG_ROOT, "test", "fixtures");
const WORK_DIR = join(PKG_ROOT, "data", "work");

// Ensure work dir exists
mkdirSync(WORK_DIR, { recursive: true });

// Test fixture: jfk.m4b (11 seconds of audio)
const JFK_M4B = join(FIXTURES_DIR, "jfk.m4b");

test("runTask - M4B to WAV conversion emits events", async () => {
  const events: TaskEvent[] = [];
  const monitor = {
    onEvent(event: TaskEvent) {
      events.push({ ...event });
    },
  };

  const stdoutLogPath = join(WORK_DIR, "jfk_test.stdout.log");
  const stderrLogPath = join(WORK_DIR, "jfk_test.stderr.log");
  const wavPath = join(WORK_DIR, "jfk_test.wav");

  const config: TaskConfig = {
    label: "to-wav",
    command: "ffmpeg",
    args: [
      "-y",
      "-hide_banner",
      "-loglevel",
      "info",
      "-i",
      JFK_M4B,
      "-vn",
      "-acodec",
      "pcm_s16le",
      "-ar",
      "16000",
      "-ac",
      "1",
      wavPath,
    ],
    stdoutLogPath,
    stderrLogPath,
    stderrFilter: FFMPEG_AUDIO_PROGRESS_REGEX,
  };

  const result = await runTask(config, monitor);

  // Check result
  expect(result.code).toBe(0);

  // Check lifecycle events
  const startEvents = events.filter((e) => e.type === "start");
  const doneEvents = events.filter((e) => e.type === "done");
  const lineEvents = events.filter((e) => e.type === "line");

  expect(startEvents.length).toBe(1);
  expect(startEvents[0]!.label).toBe("to-wav");

  expect(doneEvents.length).toBe(1);
  expect(doneEvents[0]!.result?.code).toBe(0);

  // Should have at least one progress line
  expect(lineEvents.length >= 1).toBe(true);
  expect(lineEvents[0]!.stream).toBe("stderr");
});

test("createConsoleMonitor - handles lifecycle", () => {
  const originalWrite = process.stderr.write;
  const outputs: string[] = [];

  // Mock stderr.write to capture output instead of printing it
  process.stderr.write = (data: string) => {
    outputs.push(data);
    return true;
  };

  try {
    // Create a mock ProgressReporter that captures updates
    const mockReporter = {
      update: (taskLabel: string, status: string) => {
        outputs.push(`[task=${taskLabel}] : ${status}`);
      },
      finish: () => {
        outputs.push("finished");
      },
    };
    const monitor = createConsoleMonitor(mockReporter);

    // Should not throw and should write to our mock
    monitor.onEvent({ type: "start", label: "task1" });
    monitor.onEvent({ type: "line", stream: "stderr", line: "progress 50%" });
    monitor.onEvent({ type: "done", result: { code: 0, elapsedMs: 1000 } });

    expect(outputs.length > 0).toBe(true);
    expect(outputs.some((o) => o.includes("task1"))).toBe(true);
    expect(outputs.some((o) => o.includes("progress 50%"))).toBe(true);
  } finally {
    process.stderr.write = originalWrite;
  }
});
