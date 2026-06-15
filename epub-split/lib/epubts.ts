import { readFile } from "node:fs/promises";

import { Archive, Book } from "@likecoin/epub-ts/node";

import {
  convertEpubjsManifest,
  convertEpubjsToc,
} from "./epubjs-shared.ts";
import type { ParserResult, ParseOptions } from "./types.ts";

const PARSE_TIMEOUT_MS = 10_000;

export async function parse(
  bookPath: string,
  opts: ParseOptions = {}
): Promise<ParserResult> {
  const { verbosity = 0 } = opts;
  const data = await readFile(bookPath);
  const arrayBuffer = data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength
  ) as ArrayBuffer;
  const start = Date.now();
  const warnings: string[] = [];
  let book = new Book({ replacements: "none" });

  try {
    try {
      await withTimeout(book.open(arrayBuffer), bookPath);
    } catch (error: unknown) {
      if (!(error instanceof Error) || error.message !== "No Metadata Found") {
        throw error;
      }
      book.destroy();
      book = new Book({ replacements: "none" });
      const normalized = await normalizeLegacyOpfPrefixes(arrayBuffer);
      await withTimeout(book.open(normalized), bookPath);
      warnings.push(
        "Normalized legacy opf: element prefixes for epub-ts/linkedom compatibility"
      );
    }
    await withTimeout(book.loaded.manifest, bookPath);
    await withTimeout(book.loaded.navigation, bookPath);
    await withTimeout(book.loaded.spine, bookPath);

    if (verbosity > 1) {
      console.error(`- epubts parse duration:${Date.now() - start}ms`);
    }

    return {
      parser: "epubts",
      manifest: convertEpubjsManifest(book.packaging.manifest),
      toc: convertEpubjsToc(book.navigation.toc),
      errors: [],
      warnings,
    };
  } finally {
    book.destroy();
  }
}

async function normalizeLegacyOpfPrefixes(
  arrayBuffer: ArrayBuffer
): Promise<ArrayBuffer> {
  const archive = new Archive();
  try {
    const zip = await archive.open(arrayBuffer);
    const opfFiles = Object.values(zip.files).filter(
      (file) => !file.dir && file.name.toLowerCase().endsWith(".opf")
    );
    let changed = false;
    for (const file of opfFiles) {
      const source = await file.async("string");
      const normalized = source.replace(/<(\/?)(?:opf):/gi, "<$1");
      if (normalized !== source) {
        zip.file(file.name, normalized);
        changed = true;
      }
    }
    if (!changed) {
      throw new Error(
        "No Metadata Found and no legacy opf: element prefixes were present"
      );
    }
    return await zip.generateAsync({ type: "arraybuffer" });
  } finally {
    archive.destroy();
  }
}

async function withTimeout<T>(promise: Promise<T>, bookPath: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`epubts parse timed out after ${PARSE_TIMEOUT_MS}ms: ${bookPath}`)),
          PARSE_TIMEOUT_MS
        );
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
