import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import pLimit from "p-limit";
import type { Book, BookScanResult } from "./types";
import { getAudioMetadata } from "./metadata";

export interface CacheEntry {
  mtime: number;
  size: number;
  book: Book;
}

export interface ScannerOptions {
  cache?: Map<string, CacheEntry>;
  concurrency?: number;
}

async function calculateBookId(basename: string): Promise<string> {
  const hash = crypto.createHash("sha1");
  hash.update(basename);
  return hash.digest("hex").slice(0, 12);
}

export async function scanLibrary(
  root: string,
  options: ScannerOptions = {},
): Promise<BookScanResult> {
  const books: Book[] = [];
  const errors: string[] = [];
  const cache = options.cache || new Map();
  const limit = pLimit(options.concurrency || 8);
  const tasks: Promise<void>[] = [];

  // Walk function needs to be iterative or manage promises correctly.
  async function walk(currentDir: string) {
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Failed to read directory ${currentDir}: ${msg}`);
      return;
    }

    const files = entries.filter((e) => e.isFile());
    const subdirs = entries.filter((e) => e.isDirectory());

    const m4bFiles = files.filter((f) => f.name.endsWith(".m4b"));
    const epubFiles = files.filter((f) => f.name.endsWith(".epub"));
    const coverFiles = files.filter((f) =>
      /^cover\.(jpg|jpeg|png|webp)$/i.test(f.name),
    );

    // Grouping Rule
    if (m4bFiles.length > 0 && coverFiles.length > 0) {
      // Process this directory as a book
      // Add to task queue
      tasks.push(
        limit(async () => {
          const m4b = m4bFiles[0];
          const epub = epubFiles.length > 0 ? epubFiles[0] : undefined;
          const fullPath = path.join(currentDir, m4b.name);

          try {
            const stats = await fs.promises.stat(fullPath);
            const cacheKey = fullPath;
            const cached = cache.get(cacheKey);

            // Cache Hit Check
            if (
              cached &&
              cached.mtime === stats.mtimeMs &&
              cached.size === stats.size
            ) {
              books.push(cached.book);
              return;
            }

            // Cache Miss - Compute
            const m4bName = path.basename(m4b.name, ".m4b");
            if (epub) {
              const epubName = path.basename(epub.name, ".epub");
              if (m4bName !== epubName) {
                console.warn(
                  `Basename mismatch in ${currentDir}: ${m4b.name} vs ${epub.name}`,
                );
              }
            }

            const metadata = await getAudioMetadata(fullPath);
            console.log(`Metadata extracted for ${m4bName}:`, metadata);
            const bookId = await calculateBookId(m4bName);
            const relDir = path.relative(root, currentDir);

            const newBook: Book = {
              id: bookId,
              title: metadata.title || m4bName,
              author: metadata.artist,
              dirPath: relDir,
              coverPath: path.join(relDir, coverFiles[0].name),
              audioFile: m4b.name,
              epubFile: epub ? epub.name : undefined,
              duration: metadata.duration,
              size: metadata.fileSize,
            };

            books.push(newBook);

            // Update Cache
            cache.set(cacheKey, {
              mtime: stats.mtimeMs,
              size: stats.size,
              book: newBook,
            });
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            errors.push(`Failed to process book in ${currentDir}: ${msg}`);
          }
        }),
      );
    }

    // Recurse
    for (const subdir of subdirs) {
      if (subdir.name.startsWith(".") || subdir.name === "node_modules")
        continue;
      await walk(path.join(currentDir, subdir.name));
    }
  }

  await walk(root);
  await Promise.all(tasks);

  return { books, errors };
}
