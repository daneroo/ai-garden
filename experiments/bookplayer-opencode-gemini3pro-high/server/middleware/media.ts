import { defineEventHandler, createError, setResponseHeader } from "h3";
import fs from "node:fs";
import path from "node:path";
import { db } from "../../src/server/db";

export default defineEventHandler(async (event) => {
  const url = event.path;
  if (!url.startsWith("/api/media/")) return;

  // Basic routing manually
  const parts = url.split("/");
  // /api/media/cover/:id
  // parts: ['', 'api', 'media', 'cover', 'id']

  if (parts.length === 5 && parts[3] === "cover") {
    const id = parts[4];
    await db.init();
    const book = db.getBookById(id);
    if (!book || !book.coverPath) {
      throw createError({ statusCode: 404, statusMessage: "Cover not found" });
    }
    const fullPath = path.join(
      process.env.AUDIOBOOKS_ROOT || "",
      book.coverPath,
    );
    if (!fs.existsSync(fullPath)) {
      throw createError({
        statusCode: 404,
        statusMessage: "File not found on disk",
      });
    }

    // Determine mime type
    const ext = path.extname(fullPath).toLowerCase();
    const mime =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";

    setResponseHeader(event, "Content-Type", mime);
    return new Response(Bun.file(fullPath));
  }

  if (parts.length === 5 && parts[3] === "audio") {
    const id = parts[4];
    await db.init();
    const book = db.getBookById(id);
    if (!book) {
      throw createError({ statusCode: 404, statusMessage: "Book not found" });
    }
    const fullPath = path.join(
      process.env.AUDIOBOOKS_ROOT || "",
      book.dirPath,
      book.audioFile,
    );
    if (!fs.existsSync(fullPath)) {
      throw createError({
        statusCode: 404,
        statusMessage: "Audio file not found",
      });
    }

    setResponseHeader(event, "Content-Type", "audio/mp4"); // .m4b is typically mp4 container
    return new Response(Bun.file(fullPath));
  }

  if (parts.length === 5 && parts[3] === "epub") {
    const id = parts[4];
    await db.init();
    const book = db.getBookById(id);
    if (!book) {
      throw createError({ statusCode: 404, statusMessage: "Book not found" });
    }
    const fullPath = path.join(
      process.env.AUDIOBOOKS_ROOT || "",
      book.dirPath,
      // @ts-expect-error epubFile checked above
      book.epubFile,
    );
    if (!fs.existsSync(fullPath)) {
      throw createError({
        statusCode: 404,
        statusMessage: "Epub file not found",
      });
    }

    setResponseHeader(event, "Content-Type", "application/epub+zip");
    return new Response(Bun.file(fullPath));
  }

  if (parts.length === 5 && parts[3] === "vtt") {
    const id = parts[4];
    await db.init();
    const book = db.getBookById(id);
    if (!book) {
      throw createError({ statusCode: 404, statusMessage: "Book not found" });
    }

    const vttName =
      path.basename(book.audioFile, path.extname(book.audioFile)) + ".vtt";
    const fullPath = path.join(process.env.VTT_DIR || "", vttName);

    if (!fs.existsSync(fullPath)) {
      throw createError({
        statusCode: 404,
        statusMessage: "VTT file not found",
      });
    }

    setResponseHeader(event, "Content-Type", "text/vtt");
    return new Response(Bun.file(fullPath));
  }

  // Not handled here
});
