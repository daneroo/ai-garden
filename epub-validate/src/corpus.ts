import { createHash } from "node:crypto";
import { opendir, readFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";

import type { RootConfig, RootName } from "./config.ts";

interface DiscoveredBook {
  root: RootName;
  rootPath: string;
  absolutePath: string;
  relativePath: string;
}

async function discoverBooks(root: RootConfig): Promise<DiscoveredBook[]> {
  const rootStat = await stat(root.path).catch(() => undefined);
  if (!rootStat?.isDirectory()) {
    throw new Error(`Corpus root is not a directory: ${root.name}`);
  }

  const absolutePaths: string[] = [];
  await collectEpubPaths(root.path, absolutePaths);
  absolutePaths.sort((left, right) => left.localeCompare(right, "en"));

  return absolutePaths.map((absolutePath) => ({
    root: root.name,
    rootPath: root.path,
    absolutePath,
    relativePath: toPortablePath(relative(root.path, absolutePath)),
  }));
}

async function collectEpubPaths(
  directoryPath: string,
  output: string[]
): Promise<void> {
  const directory = await opendir(directoryPath);
  for await (const entry of directory) {
    const entryPath = join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      await collectEpubPaths(entryPath, output);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".epub")) {
      output.push(entryPath);
    }
  }
}

async function hashBook(book: DiscoveredBook): Promise<DiscoveredBook & { size: number; sha256: string }> {
  const bytes = await readFile(book.absolutePath);
  return {
    ...book,
    size: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

function toPortablePath(path: string): string {
  return sep === "/" ? path : path.split(sep).join("/");
}

// ── Content-addressed inventory ─────────────────────────────────────────────
//
// Identity is the full sha256 of the bytes: identical bytes ⇒ identical parse,
// so each distinct content is one CorpusEntry regardless of how many roots hold
// a copy. The occurrence-vs-distinct distinction lives only here (and in the
// rendered inventory); it never reaches a parser or comparison output.
//
// `deduplicate` (the collapse mode) is deferred to Gate 7. The default is
// occurrence-level: every occurrence is counted, and the per-root found/
// deduped/distinct accounting follows config scan order (test, space, drop) so
// the later root absorbs cross-root duplicates.

interface CorpusOccurrence {
  root: RootName;
  relativePath: string; // portable, relative to its root
}

export interface CorpusEntry {
  sha256: string;
  size: number;
  // All occurrences in scan order; occurrences[0] is the first-seen copy, which
  // determines the root a book is grouped under and the filename used to sort
  // and label it in human reports. shortSha is derived at display time, not here.
  occurrences: CorpusOccurrence[];
}

interface RootDiscovery {
  name: RootName;
  found: number; // .epub files under this root
  deduped: number; // whose sha256 was already seen earlier in scan order
  distinct: number; // found - deduped
}

export interface CorpusInventory {
  roots: RootDiscovery[]; // scan order
  entries: CorpusEntry[]; // one per sha256, sorted by sha256
}

export interface HashedOccurrence extends CorpusOccurrence {
  size: number;
  sha256: string;
}

// Pure: groups occurrences (supplied in scan order) by sha256 and tallies the
// per-root found/deduped/distinct accounting. No IO, so tests drive it with
// synthetic data. `rootOrder` fixes the scan order and lets a root with zero
// books still appear in the table.
export function buildInventory(
  rootOrder: readonly RootName[],
  occurrences: readonly HashedOccurrence[]
): CorpusInventory {
  const discovery = new Map<RootName, RootDiscovery>(
    rootOrder.map((name) => [name, { name, found: 0, deduped: 0, distinct: 0 }])
  );
  const entries = new Map<string, CorpusEntry>();

  for (const occurrence of occurrences) {
    const root = discovery.get(occurrence.root);
    if (!root) {
      throw new Error(`Occurrence root not in scan order: ${occurrence.root}`);
    }
    root.found++;

    const existing = entries.get(occurrence.sha256);
    if (existing) {
      root.deduped++;
      existing.occurrences.push({
        root: occurrence.root,
        relativePath: occurrence.relativePath,
      });
    } else {
      root.distinct++;
      entries.set(occurrence.sha256, {
        sha256: occurrence.sha256,
        size: occurrence.size,
        occurrences: [
          { root: occurrence.root, relativePath: occurrence.relativePath },
        ],
      });
    }
  }

  return {
    roots: rootOrder.map((name) => {
      const stats = discovery.get(name);
      if (!stats) throw new Error(`Missing discovery stats for ${name}`);
      return stats;
    }),
    entries: [...entries.values()].sort((left, right) =>
      left.sha256.localeCompare(right.sha256, "en")
    ),
  };
}

// IO wrapper for the runner (Gates 3+): discover + hash every root in scan
// order, then build the inventory. Gate 2 does not run this; the unit tests
// exercise buildInventory directly with synthetic occurrences.
export async function discoverInventory(
  roots: readonly RootConfig[]
): Promise<CorpusInventory> {
  const occurrences: HashedOccurrence[] = [];
  for (const root of roots) {
    for (const book of await discoverBooks(root)) {
      const hashed = await hashBook(book);
      occurrences.push({
        root: book.root,
        relativePath: book.relativePath,
        size: hashed.size,
        sha256: hashed.sha256,
      });
    }
  }
  return buildInventory(
    roots.map((root) => root.name),
    occurrences
  );
}
