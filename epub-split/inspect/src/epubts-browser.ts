import { chromium, type Browser } from "playwright";

import { buildParserOutput } from "./adapter.ts";
import { BROWSER_BUNDLE_PATH } from "./config.ts";
import type { ParserOutput } from "./schema.ts";
import type { BrowserHarnessResult, EntryOpenOutcome } from "./browser/protocol.ts";

const PARSER_VERSION = await (async () => {
  try {
    const pkgPath = Bun.resolveSync("@likecoin/epub-ts/package.json", import.meta.dir);
    return ((await Bun.file(pkgPath).json()) as { version: string }).version;
  } catch {
    return "unknown";
  }
})();

interface BookServerState {
  path: string | null;
}

export class BrowserTransport {
  readonly parserVersion: string;
  readonly browserVersion: string;
  readonly playwrightVersion: string;
  readonly #browser: Browser;
  readonly #origin: string;
  readonly #server: ReturnType<typeof Bun.serve>;
  readonly #serverState: BookServerState;

  private constructor(
    browser: Browser,
    parserVersion: string,
    playwrightVersion: string,
    server: ReturnType<typeof Bun.serve>,
    serverState: BookServerState
  ) {
    this.#browser = browser;
    this.parserVersion = parserVersion;
    this.browserVersion = browser.version();
    this.playwrightVersion = playwrightVersion;
    this.#server = server;
    this.#serverState = serverState;
    this.#origin = `http://127.0.0.1:${server.port}`;
  }

  static async launch(): Promise<BrowserTransport> {
    await verifyBrowserBundle();
    const browser = await chromium.launch();
    const playwrightPkgPath = Bun.resolveSync("playwright/package.json", import.meta.dir);
    const playwrightVersion = ((await Bun.file(playwrightPkgPath).json()) as { version: string }).version;
    const serverState: BookServerState = { path: null };
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch(request) {
        const pathname = new URL(request.url).pathname;
        if (pathname === "/") {
          return new Response("<!doctype html><html><body></body></html>", {
            headers: { "Content-Type": "text/html" },
          });
        }
        if (pathname === "/book.epub" && serverState.path) {
          return new Response(Bun.file(serverState.path), {
            headers: {
              "Cache-Control": "no-store",
              "Content-Type": "application/epub+zip",
            },
          });
        }
        return new Response("Not found", { status: 404 });
      },
    });
    server.unref();
    return new BrowserTransport(browser, PARSER_VERSION, playwrightVersion, server, serverState);
  }

  async open(absolutePath: string, expectedSha256: string, expectedSize: number): Promise<ParserOutput> {
    this.#serverState.path = absolutePath;
    const context = await this.#browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto(this.#origin);
      await page.addScriptTag({ path: BROWSER_BUNDLE_PATH });
      const raw: unknown = await page.evaluate(async () => globalThis.epubInspect.transport("/book.epub"));
      const result = validateHarnessResult(raw);

      if (result.byteLength !== expectedSize || result.sha256 !== expectedSha256) {
        return buildParserOutput("epubts-browser", {
          openStatus: "open-failed",
          parserVersion: PARSER_VERSION,
          openFailure: {
            category: "IntegrityMismatch",
            message: `expected length=${expectedSize} sha256=${expectedSha256}; got length=${result.byteLength} sha256=${result.sha256}`,
          },
        });
      }

      return toParserOutput(result);
    } catch (error: unknown) {
      if (!this.#browser.isConnected()) {
        throw new Error("Chromium disconnected during open", { cause: error });
      }
      return buildParserOutput("epubts-browser", {
        openStatus: "open-failed",
        parserVersion: PARSER_VERSION,
        openFailure: {
          category: error instanceof Error ? error.name : "UnknownError",
          message: error instanceof Error ? error.message : String(error),
        },
      });
    } finally {
      await context.close().catch(() => undefined);
      this.#serverState.path = null;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.#browser.isConnected()) {
        await Promise.race([
          this.#browser.close(),
          new Promise<void>((resolve) => setTimeout(resolve, 5_000)),
        ]);
      }
    } finally {
      this.#server.stop(true);
    }
  }
}

function toParserOutput(result: BrowserHarnessResult): ParserOutput {
  const parserVersion = result.epubtsVersion;
  const open: EntryOpenOutcome = result.open;
  if (open.status === "opened") {
    return buildParserOutput("epubts-browser", {
      openStatus: "opened",
      parserVersion,
      metadata: open.metadata,
      spine: open.spine,
    });
  }
  return buildParserOutput("epubts-browser", {
    openStatus: "open-failed",
    parserVersion,
    openFailure: {
      category: open.category,
      message: open.message,
    },
  });
}

function validateHarnessResult(value: unknown): BrowserHarnessResult {
  if (
    typeof value !== "object" ||
    value === null ||
    !("status" in value) ||
    value.status !== "transported" ||
    !("byteLength" in value) ||
    typeof value.byteLength !== "number" ||
    !("sha256" in value) ||
    typeof value.sha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(value.sha256) ||
    !("epubtsVersion" in value) ||
    typeof value.epubtsVersion !== "string" ||
    !("open" in value) ||
    !isValidOpenOutcome(value.open)
  ) {
    throw new TypeError("Browser harness returned an invalid transport result");
  }
  return value as BrowserHarnessResult;
}

function isValidOpenOutcome(open: unknown): boolean {
  if (typeof open !== "object" || open === null || !("status" in open)) return false;
  if (open.status === "opened") {
    return (
      "metadata" in open && isValidMetadata(open.metadata) &&
      "spine" in open && isValidSpine(open.spine)
    );
  }
  if (open.status === "open-failed") {
    return (
      "category" in open &&
      typeof open.category === "string" &&
      "message" in open &&
      typeof open.message === "string"
    );
  }
  return false;
}

function isValidMetadata(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  if (!("title" in value) || !("creator" in value) || !("date" in value)) return false;
  return (
    (value.title === null || typeof value.title === "string") &&
    (value.creator === null || typeof value.creator === "string") &&
    (value.date === null || typeof value.date === "string")
  );
}

function isValidSpine(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      typeof item.href === "string" &&
      typeof item.linear === "boolean"
  );
}

async function verifyBrowserBundle(): Promise<void> {
  const bundle = await Bun.file(BROWSER_BUNDLE_PATH).text();
  if (/linkedom/i.test(bundle)) {
    throw new Error("Browser bundle unexpectedly contains LinkeDOM");
  }
  if (/require\(["']node:|from ["']node:/.test(bundle)) {
    throw new Error("Browser bundle unexpectedly contains a Node import");
  }
}
