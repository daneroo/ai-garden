import type { DeclaredVersion, HashedBook, NodeOpenOutcome } from "./types.ts";

// Some real books drive @likecoin/epub-ts/node (LinkeDOM) into a synchronous
// busy loop that never returns. A synchronous hang blocks the event loop, so an
// in-process timer cannot interrupt it. Each book is therefore opened in a
// dedicated subprocess the parent can hard-kill. A true hang spins forever, so
// a generous deadline catches it deterministically while leaving every
// legitimate parse (the largest books open well within it) far from the bound.
const WORKER = `${import.meta.dir}/node-open-one.ts`;
const OPEN_TIMEOUT_MS = Number(process.env["NODE_OPEN_TIMEOUT_MS"]) || 10_000;

interface WorkerResult {
  ok?: boolean;
  version?: DeclaredVersion;
  category?: string;
  message?: string;
}

export async function inspectNode(book: HashedBook): Promise<NodeOpenOutcome> {
  const proc = Bun.spawn(["bun", "run", WORKER, book.absolutePath], {
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

  if (timedOut) {
    return {
      status: "node-open-failed",
      stage: "node-open",
      category: "Timeout",
      message: `open did not settle within ${OPEN_TIMEOUT_MS}ms`,
    };
  }

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

  if (parsed.ok === true && parsed.version) {
    return { status: "node-opened", version: parsed.version };
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
