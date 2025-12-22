import { assertEquals } from "@std/assert";
import process from "node:process";
import {
  createConsoleMonitor,
  FFMPEG_AUDIO_PROGRESS_REGEX,
  runTask,
  TaskConfig,
  TaskEvent,
} from "./task.ts";

// Test fixture: jfk.m4b (11 seconds of audio)
const JFK_M4B = "test/fixtures/jfk.m4b";

Deno.test({
  name: "runTask - M4B to WAV conversion emits events",
  // Node streams may not fully close before test ends
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const events: TaskEvent[] = [];
    const monitor = {
      onEvent(event: TaskEvent) {
        events.push({ ...event });
      },
    };

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
        "data/work/jfk_test.wav",
      ],
      stdoutLogPath: "data/work/jfk_test.stdout.log",
      stderrLogPath: "data/work/jfk_test.stderr.log",
      stderrFilter: FFMPEG_AUDIO_PROGRESS_REGEX,
    };

    const result = await runTask(config, monitor);

    // Check result
    assertEquals(result.code, 0);

    // Check lifecycle events
    const startEvents = events.filter((e) => e.type === "start");
    const doneEvents = events.filter((e) => e.type === "done");
    const lineEvents = events.filter((e) => e.type === "line");

    assertEquals(startEvents.length, 1);
    assertEquals(startEvents[0].label, "to-wav");

    assertEquals(doneEvents.length, 1);
    assertEquals(doneEvents[0].result?.code, 0);

    // Should have at least one progress line
    assertEquals(lineEvents.length >= 1, true);
    assertEquals(lineEvents[0].stream, "stderr");
  },
});

Deno.test("createConsoleMonitor - handles lifecycle", () => {
  const originalWrite = process.stderr.write;
  const outputs: string[] = [];

  // Mock stderr.write to capture output instead of printing it
  // @ts-ignore: Mocking for test
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
      finish: (_elapsed: number, _speedup: number, _vttDuration?: string) => {
        outputs.push("finished");
      },
    };
    const monitor = createConsoleMonitor(mockReporter);

    // Should not throw and should write to our mock
    monitor.onEvent({ type: "start", label: "task1" });
    monitor.onEvent({ type: "line", stream: "stderr", line: "progress 50%" });
    monitor.onEvent({ type: "done", result: { code: 0, elapsedMs: 1000 } });

    assertEquals(outputs.length > 0, true);
    assertEquals(
      outputs.some((o) => o.includes("task1")),
      true,
    );
    assertEquals(
      outputs.some((o) => o.includes("progress 50%")),
      true,
    );
  } finally {
    process.stderr.write = originalWrite;
  }
});
