/**
 * Server-only VTT functions that require node:fs
 * Import this module only in server-side code.
 */
import { readFile } from "node:fs/promises";
import { parseVtt, type VttCue } from "./vtt";

/**
 * Read and parse a VTT file
 * @param path - Path to the VTT file
 * @returns Array of cues
 */
export async function readVtt(path: string): Promise<VttCue[]> {
  const content = await readFile(path, "utf-8");
  return parseVtt(content);
}
