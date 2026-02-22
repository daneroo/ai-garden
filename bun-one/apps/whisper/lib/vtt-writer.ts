/**
 * Serialize typed @bun-one/vtt artifacts to canonical VTT text format.
 *
 * Format: WEBVTT\n\nNOTE Provenance\n{JSON}\n\n...cues...
 *
 * This lives in apps/whisper/lib/ until proven general enough
 * to move into packages/vtt.
 */

import { writeFile } from "node:fs/promises";
import type {
  Provenance,
  VttComposition,
  VttCue,
  VttTranscription,
} from "@bun-one/vtt";

// ENTRY POINTS

/** Format a VttTranscription to canonical VTT text and write to disk. */
export async function writeVttTranscription(
  path: string,
  transcription: VttTranscription,
): Promise<void> {
  await writeFile(path, formatTranscription(transcription), "utf-8");
}

/** Format a VttComposition to canonical VTT text and write to disk. */
export async function writeVttComposition(
  path: string,
  composition: VttComposition,
): Promise<void> {
  await writeFile(path, formatComposition(composition), "utf-8");
}

// FORMATTERS

/** Format a VttTranscription as VTT text. */
export function formatTranscription(transcription: VttTranscription): string {
  const lines = ["WEBVTT", ""];
  addProvenanceNote(lines, transcription.provenance);
  addCues(lines, transcription.cues);
  return lines.join("\n");
}

/** Format a VttComposition as VTT text. */
export function formatComposition(composition: VttComposition): string {
  const lines = ["WEBVTT", ""];
  addProvenanceNote(lines, composition.provenance);
  for (const segment of composition.segments) {
    addProvenanceNote(lines, segment.provenance);
    addCues(lines, segment.cues);
  }
  return lines.join("\n");
}

// HELPERS

function addProvenanceNote(lines: string[], provenance: Provenance): void {
  lines.push("NOTE Provenance");
  lines.push(JSON.stringify(provenance));
  lines.push("");
}

function addCues(lines: string[], cues: VttCue[]): void {
  for (const cue of cues) {
    lines.push(`${cue.startTime} --> ${cue.endTime}`);
    lines.push(cue.text);
    lines.push("");
  }
}
