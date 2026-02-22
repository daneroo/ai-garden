import { createServerFn } from "@tanstack/react-start";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseVtt, secondsToVttTime, vttTimeToSeconds } from "@bun-one/vtt";
import type { ClassifiedVttFile, VttCue } from "@bun-one/vtt";

/** Summary returned for the "/" listing */
export interface VttFileSummary {
  filename: string;
  artifactType: ClassifiedVttFile["type"];
  cueCount: number;
  firstCueStart: string;
  lastCueEnd: string;
  formattedDuration: string;
  warningCount: number;
  warnings: string[];
}

/** Detail returned for "/file/$name" */
export interface VttFileDetail {
  filename: string;
  artifactType: ClassifiedVttFile["type"];
  segmentCount?: number;
  cues: VttCue[];
  cueCount: number;
  firstCueStart: string;
  lastCueEnd: string;
  formattedDuration: string;
  warnings: string[];
}

function allCues(classified: ClassifiedVttFile): VttCue[] {
  switch (classified.type) {
    case "composition":
      return classified.value.segments.flatMap((s) => s.cues);
    case "transcription":
    case "raw":
      return classified.value.cues;
  }
}

function cueSpan(cues: VttCue[]) {
  if (cues.length === 0)
    return {
      firstCueStart: "",
      lastCueEnd: "",
      formattedDuration: "00:00:00.000",
    };
  const firstCueStart = cues[0]!.startTime;
  const lastCueEnd = cues[cues.length - 1]!.endTime;
  const durationSec =
    vttTimeToSeconds(lastCueEnd) - vttTimeToSeconds(firstCueStart);
  return {
    firstCueStart,
    lastCueEnd,
    formattedDuration: secondsToVttTime(durationSec),
  };
}

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
        const content = await readFile(join(vttDir, filename), "utf-8");
        const { value: classified, warnings } = parseVtt(content);
        const cues = allCues(classified);
        return {
          filename,
          artifactType: classified.type,
          cueCount: cues.length,
          ...cueSpan(cues),
          warningCount: warnings.length,
          warnings,
        };
      }),
    );

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

export const getVttFile = createServerFn({
  method: "GET",
})
  .inputValidator((name: string) => name)
  .handler(async ({ data: filename }) => {
    const vttDir = process.env.VTT_DIR;
    if (!vttDir) {
      return {
        error: "VTT_DIR environment variable not set",
        detail: null,
      };
    }

    try {
      const content = await readFile(join(vttDir, filename), "utf-8");
      const { value: classified, warnings } = parseVtt(content);
      const cues = allCues(classified);
      const detail: VttFileDetail = {
        filename,
        artifactType: classified.type,
        segmentCount:
          classified.type === "composition"
            ? classified.value.segments.length
            : undefined,
        cues,
        cueCount: cues.length,
        ...cueSpan(cues),
        warnings,
      };
      return { detail, error: null };
    } catch (e) {
      return {
        detail: null,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  });
