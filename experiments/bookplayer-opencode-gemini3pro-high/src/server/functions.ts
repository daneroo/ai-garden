import { createServerFn } from "@tanstack/react-start";
import { db } from "./db";

export const scanLibraryFn = createServerFn({ method: "POST" }).handler(
  async () => {
    await db.refresh();
    return { success: true, count: db.getAllBooks().length };
  },
);

export const getBooksFn = createServerFn({ method: "GET" }).handler(
  async () => {
    console.log("getBooksFn called");
    // Ensure init on first call
    // Accessing private property is ugly, let's just call init which is idempotent-ish or check public method
    // DB init is async.
    // Ideally, DB init happens on server start, but for dev it might be lazy.
    // I will add public isInitialized getter to db.ts
    await db.init();
    const books = db.getAllBooks();
    console.log(`getBooksFn returning ${books.length} books`);
    return books;
  },
);

export const getBookFn = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    await db.init();
    return db.getBookById(id);
  });
