import { createServerFn } from "@tanstack/react-start";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { formatTimestamp, summarizeVtt, type VttSummary } from "@bun-one/vtt";
import { readVtt } from "@bun-one/vtt/server";

/**
 * Extended summary with filename and pre-formatted duration
 * (pre-formatted to avoid importing node:fs in client bundle)
 */
export interface VttFileSummary extends VttSummary {
  filename: string;
  formattedDuration: string;
}

/**
 * Feature B: Server function to read VTT directory and return summaries
 */
export const getVttSummaries = createServerFn({
  method: "GET",
}).handler(async () => {
  const vttDir = process.env.VTT_DIR;

  if (!vttDir) {
    return { error: "VTT_DIR environment variable not set", summaries: [] };
  }

  try {
    const files = await readdir(vttDir);
    const vttFiles = files.filter((f) => f.endsWith(".vtt"));

    const summaries: VttFileSummary[] = await Promise.all(
      vttFiles.map(async (filename) => {
        const cues = await readVtt(join(vttDir, filename));
        const summary = summarizeVtt(cues);
        return {
          filename,
          ...summary,
          formattedDuration: formatTimestamp(summary.durationSec),
        };
      }),
    );

    // Sort alphabetically by filename
    summaries.sort((a, b) => a.filename.localeCompare(b.filename));

    return { summaries, error: null, resolvedPath: vttDir };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : String(e),
      summaries: [],
      resolvedPath: vttDir,
    };
  }
});

/**
 * Feature C: Server function to read a specific VTT file
 */
export const getVttFile = createServerFn({
  method: "GET",
})
  .inputValidator((name: string) => name)
  .handler(async ({ data: filename }) => {
    const vttDir = process.env.VTT_DIR;

    if (!vttDir) {
      return {
        error: "VTT_DIR environment variable not set",
        cues: [],
        summary: null,
      };
    }

    try {
      const cues = await readVtt(join(vttDir, filename));
      const summary = summarizeVtt(cues);
      return { filename, cues, summary, error: null };
    } catch (e) {
      return {
        filename,
        cues: [],
        summary: null,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  });
