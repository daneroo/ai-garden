import { z } from "zod";

import type { Manifest, Metadata, Spine, Toc, TocEntry } from "./types.ts";

interface EpubjsMetadata {
  title?: string;
  creator?: string;
  description?: string;
  pubdate?: string;
  publisher?: string;
  identifier?: string;
  language?: string;
  rights?: string;
  modified_date?: string;
  layout?: string;
  orientation?: string;
  flow?: string;
  viewport?: string;
  media_active_class?: string;
  spread?: string;
  direction?: string;
}

export function convertEpubjsMetadata(metadata: EpubjsMetadata): Metadata {
  return {
    title: metadata.title ?? "",
    creator: metadata.creator ?? "",
    description: metadata.description ?? "",
    pubdate: metadata.pubdate ?? "",
    publisher: metadata.publisher ?? "",
    identifier: metadata.identifier ?? "",
    language: metadata.language ?? "",
    rights: metadata.rights ?? "",
    modifiedDate: metadata.modified_date ?? "",
    layout: metadata.layout ?? "",
    orientation: metadata.orientation ?? "",
    flow: metadata.flow ?? "",
    viewport: metadata.viewport ?? "",
    mediaActiveClass: metadata.media_active_class ?? "",
    spread: metadata.spread ?? "",
    direction: metadata.direction ?? "",
  };
}

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

interface EpubjsSpineItem {
  idref?: string;
  href?: string;
  linear?: boolean;
  properties?: string[];
}

export function convertEpubjsSpine(items: EpubjsSpineItem[]): Spine {
  return items.map((item) => ({
    idref: item.idref ?? "",
    href: item.href ?? "",
    linear: item.linear ?? true,
    properties: item.properties ?? [],
  }));
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
