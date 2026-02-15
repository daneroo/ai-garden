import type { Book } from "./types";
import { scanLibrary, type CacheEntry } from "./scanner";
import { config } from "./config";
import fs from "node:fs";
import path from "node:path";

const CACHE_FILE = path.join(process.cwd(), ".book-cache.json");

class Database {
  private static instance: Database;
  private books: Book[] = [];
  private index: Map<string, Book> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private isScanning = false;
  private isInitialized = false;

  private constructor() {
    this.loadCache();
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private loadCache() {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const raw = fs.readFileSync(CACHE_FILE, "utf-8");
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          this.cache = new Map(data);
        }
      }
    } catch (e) {
      console.warn("Failed to load cache:", e);
    }
  }

  private saveCache() {
    try {
      const data = Array.from(this.cache.entries());
      fs.writeFileSync(CACHE_FILE, JSON.stringify(data));
    } catch (e) {
      console.warn("Failed to save cache:", e);
    }
  }

  async init() {
    if (this.isInitialized) return;
    await this.refresh();
  }

  async refresh() {
    if (this.isScanning) {
      console.log("Scan already in progress, skipping request.");
      return;
    }

    this.isScanning = true;
    try {
      console.log(`Scanning library at: ${config.AUDIOBOOKS_ROOT}`);
      const result = await scanLibrary(config.AUDIOBOOKS_ROOT, {
        cache: this.cache,
      });

      this.books = result.books;
      this.index.clear();
      for (const book of this.books) {
        this.index.set(book.id, book);
      }

      this.saveCache();
      this.isInitialized = true;
      console.log(`Library scan complete. Found ${this.books.length} books.`);

      if (result.errors.length > 0) {
        console.warn("Scan errors:", result.errors);
      }
    } finally {
      this.isScanning = false;
    }
  }

  getAllBooks(): Book[] {
    return this.books;
  }

  getBookById(id: string): Book | undefined {
    return this.index.get(id);
  }
}

export const db = Database.getInstance();
