import { basename } from "node:path";
import type { Manifest } from "./types.ts";

/**
 * Displays the table of contents in a hierarchical format
 * @param toc - The table of contents to display
 * @param level - The current indentation level (default: 0)
 */
export function showManifest(manifest: Manifest) {
  for (const [id, item] of Object.entries(manifest)) {
    console.log(`- ${id} href:${item.href} mediaType:${item.mediaType}`);
  }
}
