import { z } from "zod";

import type { Manifest, Toc, TocEntry } from "./types.ts";

const manifestItemSchema = z.object({
  href: z.string(),
  type: z.string(),
  overlay: z.string().optional(),
  properties: z.array(z.string()).optional(),
});

const manifestSchema = z.record(manifestItemSchema).transform((data) => {
  const result: Manifest = {};
  for (const [id, item] of Object.entries(data)) {
    result[id] = {
      id,
      href: item.href,
      mediaType: item.type,
      mediaOverlay: item.overlay || undefined,
      properties: item.properties?.join(",") || undefined,
    };
  }
  return result;
});

interface EpubjsTocEntry {
  id: string;
  href: string;
  label: string;
  subitems?: EpubjsTocEntry[];
}

export function convertEpubjsManifest(manifest: unknown): Manifest {
  return manifestSchema.parse(manifest);
}

export function convertEpubjsToc(entries: EpubjsTocEntry[]): Toc {
  return entries.map(convertEpubjsTocEntry);
}

function convertEpubjsTocEntry(entry: EpubjsTocEntry): TocEntry {
  return {
    id: entry.id,
    href: entry.href,
    label: entry.label,
    children: convertEpubjsToc(entry.subitems ?? []),
  };
}
