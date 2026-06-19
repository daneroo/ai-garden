import { readFile } from "node:fs/promises";

import { chromium, type Browser } from "playwright";

import { BROWSER_BUNDLE_PATH } from "./config.ts";
import type {
  BrowserDiagnostic,
  BrowserHarnessResult,
  BrowserRuntime,
  BrowserTransportFailure,
  BrowserTransportSuccess,
  HashedBook,
} from "./types.ts";

interface BookServerState {
  path: string | null;
}

export class BrowserTransport {
  readonly runtime: BrowserRuntime;
  readonly #browser: Browser;
  readonly #origin: string;
  readonly #server: ReturnType<typeof Bun.serve>;
  readonly #serverState: BookServerState;

  private constructor(
    browser: Browser,
    runtime: BrowserRuntime,
    server: ReturnType<typeof Bun.serve>,
    serverState: BookServerState
  ) {
    this.#browser = browser;
    this.runtime = runtime;
    this.#server = server;
    this.#serverState = serverState;
    this.#origin = `http://127.0.0.1:${server.port}`;
  }

  static async launch(): Promise<BrowserTransport> {
    await verifyBrowserBundle();
    const browser = await chromium.launch();
    const [epubtsPackage, playwrightPackage] = await Promise.all([
      readPackageVersion("@likecoin/epub-ts"),
      readPackageVersion("playwright"),
    ]);
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
    return new BrowserTransport(
      browser,
      {
        name: "chromium",
        version: browser.version(),
        packages: {
          epubts: epubtsPackage,
          playwright: playwrightPackage,
        },
      },
      server,
      serverState
    );
  }

  async inspect(
    book: HashedBook
  ): Promise<BrowserTransportSuccess | BrowserTransportFailure> {
    const diagnostics: BrowserDiagnostic[] = [];
    this.#serverState.path = book.absolutePath;
    const context = await this.#browser.newContext();

    try {
      const page = await context.newPage();
      page.on("console", (message) => {
        diagnostics.push({
          source: "console",
          level: message.type(),
          message: message.text(),
        });
      });
      page.on("pageerror", (error) => {
        diagnostics.push({
          source: "page-error",
          level: "error",
          message: error.message,
        });
      });
      await page.goto(this.#origin);
      await page.addScriptTag({ path: BROWSER_BUNDLE_PATH });
      const raw: unknown = await page.evaluate(async () =>
        globalThis.epubInspect.transport("/book.epub")
      );
      const result = validateHarnessResult(raw);

      if (result.byteLength !== book.size || result.sha256 !== book.sha256) {
        return failure(
          "IntegrityMismatch",
          `host:length=${book.size},sha256=${book.sha256} browser:length=${result.byteLength},sha256=${result.sha256}`,
          diagnostics
        );
      }

      return {
        status: "transported",
        parserStatus: "not-implemented",
        byteLength: result.byteLength,
        sha256: result.sha256,
        epubtsVersion: result.epubtsVersion,
        diagnostics,
      };
    } catch (error: unknown) {
      if (!this.#browser.isConnected()) {
        throw new Error("Chromium disconnected during the full run", {
          cause: error,
        });
      }
      return failure(
        error instanceof Error ? error.name : "UnknownError",
        error instanceof Error ? error.message : String(error),
        diagnostics
      );
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
    typeof value.epubtsVersion !== "string"
  ) {
    throw new TypeError("Browser harness returned an invalid transport result");
  }
  return value as BrowserHarnessResult;
}

function failure(
  category: string,
  message: string,
  diagnostics: BrowserDiagnostic[]
): BrowserTransportFailure {
  return {
    status: "transport-failed",
    parserStatus: "not-implemented",
    failure: {
      stage: "browser-transport",
      category,
      message,
    },
    diagnostics,
  };
}

async function verifyBrowserBundle(): Promise<void> {
  const bundle = await readFile(BROWSER_BUNDLE_PATH, "utf8");
  if (/linkedom/i.test(bundle)) {
    throw new Error("Browser bundle unexpectedly contains LinkeDOM");
  }
  if (/require\(["']node:|from ["']node:/.test(bundle)) {
    throw new Error("Browser bundle unexpectedly contains a Node import");
  }
}

async function readPackageVersion(packageName: string): Promise<string> {
  const packageJson = new URL(
    `../node_modules/${packageName}/package.json`,
    import.meta.url
  );
  const parsed = JSON.parse(await readFile(packageJson, "utf8")) as {
    version?: unknown;
  };
  if (typeof parsed.version !== "string") {
    throw new Error(`Package has no string version: ${packageName}`);
  }
  return parsed.version;
}
