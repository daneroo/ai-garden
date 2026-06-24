import { readFile } from "node:fs/promises";
import { extname } from "node:path";

import { Archive, Book } from "@likecoin/epub-ts/node";

import {
  convertEpubjsManifest,
  convertEpubjsMetadata,
  convertEpubjsSpine,
  convertEpubjsToc,
} from "./epubjs-shared.ts";
import type {
  Chapters,
  Metadata,
  ParseOptions,
  ParserResult,
} from "./types.ts";

const PARSE_TIMEOUT_MS = 5_000;

export async function parse(
  bookPath: string,
  _opts: ParseOptions = {},
): Promise<ParserResult> {
  const data = await readFile(bookPath);
  const arrayBuffer = data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength,
  ) as ArrayBuffer;
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
        "Normalized legacy opf: element prefixes for epub-ts/linkedom compatibility",
      );
    }
    await withTimeout(book.loaded.manifest, bookPath);
    await withTimeout(book.loaded.navigation, bookPath);
    await withTimeout(book.loaded.spine, bookPath);

    const stockMetadata = convertEpubjsMetadata(book.packaging.metadata);
    const metadata = await extractMetadataTextContent(book, bookPath);
    if (JSON.stringify(metadata) !== JSON.stringify(stockMetadata)) {
      warnings.push(
        "Reconstructed metadata from full element textContent for epub-ts/linkedom compatibility",
      );
    }
    const chapters = await extractChapters(book, bookPath);

    return {
      parser: "epubts",
      metadata,
      manifest: convertEpubjsManifest(book.packaging.manifest),
      spine: convertEpubjsSpine(book.spine.spineItems),
      chapters,
      toc: convertEpubjsToc(book.navigation.toc),
      errors: [],
      warnings,
    };
  } finally {
    book.destroy();
  }
}

async function extractChapters(
  book: Book,
  bookPath: string,
): Promise<Chapters> {
  const chapters: Chapters = [];

  for (const section of book.spine.spineItems) {
    try {
      const extensionless = extname(section.href ?? "") === "";
      const { xhtml, contents } = extensionless
        ? await extractExtensionlessChapter(book, section.url, bookPath)
        : await extractRenderedChapter(book, section, bookPath);
      chapters.push({
        idref: section.idref ?? "",
        href: section.href ?? "",
        xhtml,
        canonicalXhtml: canonicalizeNode(contents),
        text: contents?.textContent ?? "",
      });
    } catch (error: unknown) {
      chapters.push({
        idref: section.idref ?? "",
        href: section.href ?? "",
        xhtml: "",
        canonicalXhtml: "",
        text: "",
        failure: error instanceof Error ? error.message : String(error),
      });
    } finally {
      section.unload();
    }
  }
  return chapters;
}

async function extractRenderedChapter(
  book: Book,
  section: Book["spine"]["spineItems"][number],
  bookPath: string,
): Promise<{ xhtml: string; contents: Element | undefined }> {
  const xhtml = await withTimeout(
    section.render(book.load.bind(book)),
    bookPath,
  );
  return { xhtml, contents: section.contents };
}

async function extractExtensionlessChapter(
  book: Book,
  sectionUrl: string | undefined,
  bookPath: string,
): Promise<{ xhtml: string; contents: Element }> {
  if (!book.archive) throw new Error("EPUB archive is unavailable");
  if (!sectionUrl) throw new Error("Spine section has no resource URL");
  const xhtml = (await withTimeout(
    book.archive.request(sectionUrl, "text") as Promise<string>,
    bookPath,
  )) as string;
  const document = new DOMParser().parseFromString(
    xhtml,
    "application/xhtml+xml",
  );
  return { xhtml, contents: document.documentElement };
}

function canonicalizeNode(node: Node | undefined): string {
  if (!node) return "";
  if (node.nodeType === 3) return node.nodeValue ?? "";
  if (node.nodeType === 8) return `<!--${node.nodeValue ?? ""}-->`;
  if (node.nodeType !== 1) return "";

  const element = node as Element;
  if (element.tagName.toLowerCase() === "base") return "";
  const attributes = Array.from(element.attributes)
    .map((attribute) => [attribute.name, attribute.value] as const)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => ` ${name}=${JSON.stringify(value)}`)
    .join("");
  const children = Array.from(element.childNodes)
    .map(canonicalizeNode)
    .join("");
  return `<${element.tagName}${attributes}>${children}</${element.tagName}>`;
}

async function extractMetadataTextContent(
  book: Book,
  bookPath: string,
): Promise<Metadata> {
  const packagePath = book.container?.packagePath;
  if (!packagePath || !book.archive) {
    return convertEpubjsMetadata(book.packaging.metadata);
  }

  const document = (await withTimeout(
    book.archive.request(`/${packagePath}`) as Promise<Document>,
    bookPath,
  )) as Document;
  const metadataElement = firstElement(document, "metadata");
  const spineElement = firstElement(document, "spine");

  const dcText = (name: string): string => {
    const namespaced = metadataElement.getElementsByTagNameNS(
      "http://purl.org/dc/elements/1.1/",
      name,
    );
    const element = namespaced[0] ??
      metadataElement.getElementsByTagName(`dc:${name}`)[0];
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
  arrayBuffer: ArrayBuffer,
): Promise<ArrayBuffer> {
  const archive = new Archive();
  try {
    const zip = await archive.open(arrayBuffer);
    const opfFiles = Object.values(zip.files).filter(
      (file) => !file.dir && file.name.toLowerCase().endsWith(".opf"),
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
        "No Metadata Found and no legacy opf: element prefixes were present",
      );
    }
    return await zip.generateAsync({ type: "arraybuffer" });
  } finally {
    archive.destroy();
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  bookPath: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                `epubts parse timed out after ${PARSE_TIMEOUT_MS}ms: ${bookPath}`,
              ),
            ),
          PARSE_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
