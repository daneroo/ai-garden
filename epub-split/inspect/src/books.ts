import { createHash } from "node:crypto";
import { opendir, readFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";

import type {
  DiscoveredBook,
  HashedBook,
  RootConfig,
} from "./types.ts";

export async function discoverBooks(root: RootConfig): Promise<DiscoveredBook[]> {
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

export async function hashBook(book: DiscoveredBook): Promise<HashedBook> {
  const bytes = await readFile(book.absolutePath);
  return {
    ...book,
    size: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    shortSha: "",
    reportFilename: "",
    parserAttempts: {},
  };
}

export function assignReportNames(books: HashedBook[]): void {
  const distinctHashes = [...new Set(books.map((book) => book.sha256))].sort();
  const prefixLengths = new Map<string, number>();

  for (const hash of distinctHashes) {
    let length = 7;
    while (
      distinctHashes.some(
        (candidate) =>
          candidate !== hash &&
          candidate.startsWith(hash.slice(0, length))
      )
    ) {
      length++;
    }
    prefixLengths.set(hash, length);
  }

  const filenames = new Set<string>();
  for (const book of books) {
    const prefixLength = prefixLengths.get(book.sha256);
    if (prefixLength === undefined) {
      throw new Error(`Missing prefix length for ${book.sha256}`);
    }
    book.shortSha = book.sha256.slice(0, prefixLength);

    const normalizedPath = normalizeReportPath(book.relativePath);
    let filename = `${book.shortSha}--${book.root}--${normalizedPath}.json`;
    if (filenames.has(filename)) {
      const pathHash = createHash("sha256")
        .update(book.relativePath)
        .digest("hex")
        .slice(0, 7);
      filename = `${book.shortSha}--${book.root}--${normalizedPath}--path-${pathHash}.json`;
    }
    if (filenames.has(filename)) {
      throw new Error(`Unable to create unique report filename: ${filename}`);
    }
    filenames.add(filename);
    book.reportFilename = filename;
  }
}

function normalizeReportPath(relativePath: string): string {
  const normalized = relativePath
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (normalized.length <= 190) return normalized;

  const pathHash = createHash("sha256")
    .update(relativePath)
    .digest("hex")
    .slice(0, 7);
  return `${normalized.slice(0, 180).replace(/-+$/g, "")}--${pathHash}`;
}

function toPortablePath(path: string): string {
  return sep === "/" ? path : path.split(sep).join("/");
}
