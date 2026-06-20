import type {
  DeclaredVersion,
  HashedBook,
  DOMParserImpl,
  MetadataFields,
  NodeOpenOutcome,
} from "./types.ts";

// Some real books drive @likecoin/epub-ts/node's default DOM parser (LinkeDOM)
// into a synchronous busy loop that never returns. A synchronous hang blocks the
// event loop, so an in-process timer cannot interrupt it. Each book is therefore
// opened in a dedicated subprocess the parent can hard-kill. A true hang spins
// forever, so a generous deadline catches it deterministically while leaving
// every legitimate parse (the largest books open well within it) far from the
// bound.
//
// On a LinkeDOM timeout the book is retried once in a fresh subprocess with jsdom
// injected as the parser (Gate 4C: jsdom opens every book LinkeDOM hangs on). The
// engine that succeeded is recorded so the fallback is visible in the report.
const WORKER = `${import.meta.dir}/node-open-one.ts`;
const OPEN_TIMEOUT_MS = Number(process.env["NODE_OPEN_TIMEOUT_MS"]) || 10_000;

interface WorkerResult {
  ok?: boolean;
  version?: DeclaredVersion;
  engine?: DOMParserImpl;
  metadata?: MetadataFields;
  category?: string;
  message?: string;
}

interface WorkerRun {
  timedOut: boolean;
  output: string;
}

async function runWorker(
  book: HashedBook,
  engine: DOMParserImpl
): Promise<WorkerRun> {
  const proc = Bun.spawn(["bun", "run", WORKER, book.absolutePath, engine], {
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

function parseResult(output: string, engine: DOMParserImpl): NodeOpenOutcome {
  let parsed: WorkerResult;
  try {
    parsed = JSON.parse(output) as WorkerResult;
  } catch {
    return {
      status: "node-open-failed",
      stage: "node-open",
      category: "WorkerError",
      message: "node open worker produced no parsable result",
    };
  }

  if (parsed.ok === true && parsed.version && parsed.metadata) {
    return { status: "node-opened", version: parsed.version, engine, metadata: parsed.metadata };
  }
  return {
    status: "node-open-failed",
    stage: "node-open",
    category: typeof parsed.category === "string"
      ? parsed.category
      : "UnknownError",
    message: typeof parsed.message === "string"
      ? parsed.message
      : "node open failed",
  };
}

export async function inspectNode(book: HashedBook): Promise<NodeOpenOutcome> {
  const linkedom = await runWorker(book, "linkedom");
  if (!linkedom.timedOut) return parseResult(linkedom.output, "linkedom");

  // LinkeDOM hung. Retry once with jsdom, which opens these books.
  const jsdom = await runWorker(book, "jsdom");
  if (jsdom.timedOut) {
    return {
      status: "node-open-failed",
      stage: "node-open",
      category: "Timeout",
      message: `linkedom and jsdom fallback both exceeded ${OPEN_TIMEOUT_MS}ms`,
    };
  }

  const result = parseResult(jsdom.output, "jsdom");
  if (result.status === "node-opened") return result;
  return {
    ...result,
    message: `linkedom timed out; jsdom fallback failed: ${result.message}`,
  };
}
