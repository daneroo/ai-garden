import { readFile } from "node:fs/promises";

import { Archive, Book } from "@likecoin/epub-ts/node";

import {
  convertEpubjsManifest,
  convertEpubjsMetadata,
  convertEpubjsSpine,
  convertEpubjsToc,
} from "./epubjs-shared.ts";
import type { Metadata, ParserResult, ParseOptions } from "./types.ts";

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

    const stockMetadata = convertEpubjsMetadata(book.packaging.metadata);
    const metadata = await extractMetadataTextContent(book, bookPath);
    if (JSON.stringify(metadata) !== JSON.stringify(stockMetadata)) {
      warnings.push(
        "Reconstructed metadata from full element textContent for epub-ts/linkedom compatibility"
      );
    }

    if (verbosity > 1) {
      console.error(`- epubts parse duration:${Date.now() - start}ms`);
    }

    return {
      parser: "epubts",
      metadata,
      manifest: convertEpubjsManifest(book.packaging.manifest),
      spine: convertEpubjsSpine(book.spine.spineItems),
      toc: convertEpubjsToc(book.navigation.toc),
      errors: [],
      warnings,
    };
  } finally {
    book.destroy();
  }
}

async function extractMetadataTextContent(
  book: Book,
  bookPath: string
): Promise<Metadata> {
  const packagePath = book.container?.packagePath;
  if (!packagePath || !book.archive) {
    return convertEpubjsMetadata(book.packaging.metadata);
  }

  const document = (await withTimeout(
    book.archive.request(`/${packagePath}`) as Promise<Document>,
    bookPath
  )) as Document;
  const metadataElement = firstElement(document, "metadata");
  const spineElement = firstElement(document, "spine");

  const dcText = (name: string): string => {
    const namespaced = metadataElement.getElementsByTagNameNS(
      "http://purl.org/dc/elements/1.1/",
      name
    );
    const element =
      namespaced[0] ?? metadataElement.getElementsByTagName(`dc:${name}`)[0];
    return element?.textContent ?? "";
  };
  const propertyText = (property: string): string => {
    const elements = metadataElement.getElementsByTagName("meta");
    for (const element of Array.from(elements)) {
      if (element.getAttribute("property") === property) {
        return element.textContent ?? "";
      }
    }
    return "";
  };

  return {
    title: dcText("title"),
    creator: dcText("creator"),
    description: dcText("description"),
    pubdate: dcText("date"),
    publisher: dcText("publisher"),
    identifier: dcText("identifier"),
    language: dcText("language"),
    rights: dcText("rights"),
    modifiedDate: propertyText("dcterms:modified"),
    layout: propertyText("rendition:layout"),
    orientation: propertyText("rendition:orientation"),
    flow: propertyText("rendition:flow"),
    viewport: propertyText("rendition:viewport"),
    mediaActiveClass: propertyText("media:active-class"),
    spread: propertyText("rendition:spread"),
    direction: spineElement.getAttribute("page-progression-direction") ?? "",
  };
}

function firstElement(document: Document, name: string): Element {
  const element = document.getElementsByTagName(name)[0];
  if (!element) throw new Error(`No ${name} element found in package document`);
  return element;
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
