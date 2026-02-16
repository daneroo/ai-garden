import {
  defineEventHandler,
  createError,
  setResponseHeader,
  getRequestHeader,
  setResponseStatus,
} from "h3";
import fs from "node:fs";
import path from "node:path";

export default defineEventHandler(async (event) => {
  const url = event.path;
  if (!url.startsWith("/api/media/")) return;

  const { db } = await import("../../src/server/db");

  const parts = url.split("/");

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

    const stat = fs.statSync(fullPath);
    const fileSize = stat.size;
    const range = getRequestHeader(event, "range");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = Bun.file(fullPath);

      setResponseStatus(event, 206);
      setResponseHeader(
        event,
        "Content-Range",
        `bytes ${start}-${end}/${fileSize}`,
      );
      setResponseHeader(event, "Accept-Ranges", "bytes");
      setResponseHeader(event, "Content-Length", chunksize.toString());
      setResponseHeader(event, "Content-Type", "audio/mp4");

      return new Response(file.slice(start, end + 1));
    } else {
      setResponseHeader(event, "Content-Length", fileSize.toString());
      setResponseHeader(event, "Content-Type", "audio/mp4");
      setResponseHeader(event, "Accept-Ranges", "bytes");
      return new Response(Bun.file(fullPath));
    }
  }

  if (parts.length === 5 && parts[3] === "epub") {
    const filename = parts[4];
    const id = filename.endsWith(".epub") ? filename.slice(0, -5) : filename;
    const { db } = await import("../../src/server/db");
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
    // EPUBs might benefit from ranges too, but less critical than audio
    setResponseHeader(event, "Accept-Ranges", "bytes");
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
});
