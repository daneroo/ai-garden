// Some real books drive @likecoin/epub-ts/node's default DOM parser (LinkeDOM)
// into a synchronous busy loop that never returns. A synchronous hang blocks the
// event loop, so an in-process timer cannot interrupt it. Each book is therefore
// opened in a dedicated subprocess the parent can hard-kill. A true hang spins
// forever, so a generous deadline catches it deterministically while leaving
// every legitimate parse (the largest books open well within it) far from the
// bound.
//
// On a LinkeDOM timeout the book is retried once in a fresh subprocess with jsdom
// injected as the parser (jsdom opens every book LinkeDOM hangs on). The
// domParser that succeeded is recorded so the fallback is visible in the report.
import { buildParserOutput } from "./adapter.ts";
import type { ParserOutput } from "./schema.ts";

const WORKER = `${import.meta.dir}/epubts-node-worker.ts`;
const OPEN_TIMEOUT_MS = Number(process.env["NODE_OPEN_TIMEOUT_MS"]) || 5_000;

// Read the epub.ts library version once at module load; passed to workers as an
// arg so each subprocess does not repeat the resolution.
const PARSER_VERSION = await (async () => {
  try {
    const pkgPath = Bun.resolveSync(
      "@likecoin/epub-ts/package.json",
      import.meta.dir,
    );
    return ((await Bun.file(pkgPath).json()) as { version: string }).version;
  } catch {
    return "unknown";
  }
})();

type DomParser = "linkedom" | "jsdom";

interface WorkerSuccess {
  ok: true;
  parserVersion: string;
  domParser: DomParser;
  metadata: {
    title: string | null;
    creator: string | null;
    date: string | null;
  };
  spine: { href: string; linear: boolean }[];
  manifest: { id: string; href: string; mediaType: string | null }[];
}
interface WorkerFailure {
  ok: false;
  category: string;
  message: string;
}
type WorkerResult = WorkerSuccess | WorkerFailure;

async function runWorker(
  absolutePath: string,
  domParser: DomParser,
): Promise<{ timedOut: boolean; output: string }> {
  const proc = Bun.spawn([
    "bun",
    "run",
    WORKER,
    absolutePath,
    domParser,
    PARSER_VERSION,
  ], {
    stdout: "pipe",
    stderr: "ignore",
  });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    proc.kill(9);
  }, OPEN_TIMEOUT_MS);
  let output = "";
  try {
    output = await new Response(proc.stdout).text();
    await proc.exited;
  } finally {
    clearTimeout(timer);
  }
  return { timedOut, output };
}

function parseWorkerOutput(output: string): WorkerResult {
  try {
    return JSON.parse(output) as WorkerResult;
  } catch {
    return {
      ok: false,
      category: "WorkerError",
      message: "worker produced no parsable result",
    };
  }
}

function toParserOutput(result: WorkerResult): ParserOutput {
  if (result.ok) {
    return buildParserOutput("epubts-node", {
      openStatus: "opened",
      parserVersion: result.parserVersion,
      domParser: result.domParser,
      metadata: result.metadata,
      spine: result.spine,
      manifest: result.manifest,
    });
  }
  return buildParserOutput("epubts-node", {
    openStatus: "open-failed",
    parserVersion: PARSER_VERSION,
    openFailure: { category: result.category, message: result.message },
  });
}

export async function openNode(absolutePath: string): Promise<ParserOutput> {
  const linkedomRun = await runWorker(absolutePath, "linkedom");
  if (!linkedomRun.timedOut) {
    return toParserOutput(parseWorkerOutput(linkedomRun.output));
  }

  // LinkeDOM hung — retry once with jsdom, which opens every book LinkeDOM hangs on.
  const jsdomRun = await runWorker(absolutePath, "jsdom");
  if (jsdomRun.timedOut) {
    return buildParserOutput("epubts-node", {
      openStatus: "open-failed",
      parserVersion: PARSER_VERSION,
      openFailure: {
        category: "Timeout",
        message:
          `linkedom and jsdom fallback both exceeded ${OPEN_TIMEOUT_MS}ms`,
      },
    });
  }
  const result = parseWorkerOutput(jsdomRun.output);
  if (result.ok) return toParserOutput(result);
  return buildParserOutput("epubts-node", {
    openStatus: "open-failed",
    parserVersion: PARSER_VERSION,
    openFailure: {
      category: result.category,
      message: `linkedom timed out; jsdom fallback failed: ${result.message}`,
    },
  });
}
