import type {
  DeclaredVersion,
  HashedBook,
  MetadataFields,
  StorytellerOpenOutcome,
} from "./types.ts";

// Storyteller (@storyteller-platform/epub) is opened in a dedicated subprocess
// the parent can hard-kill, matching the epubts-node path: a synchronous hang in
// any parser must not be able to freeze the whole run. A true hang spins
// forever, so a generous deadline catches it deterministically while leaving
// every legitimate open far from the bound.
const WORKER = `${import.meta.dir}/storyteller-worker.ts`;
const OPEN_TIMEOUT_MS =
  Number(process.env["STORYTELLER_OPEN_TIMEOUT_MS"]) || 10_000;

interface WorkerResult {
  ok?: boolean;
  version?: DeclaredVersion;
  metadata?: MetadataFields;
  category?: string;
  message?: string;
}

export async function inspectStoryteller(
  book: HashedBook
): Promise<StorytellerOpenOutcome> {
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
      status: "storyteller-open-failed",
      stage: "storyteller-open",
      category: "Timeout",
      message: `open did not settle within ${OPEN_TIMEOUT_MS}ms`,
    };
  }

  let parsed: WorkerResult;
  try {
    parsed = JSON.parse(output) as WorkerResult;
  } catch {
    return {
      status: "storyteller-open-failed",
      stage: "storyteller-open",
      category: "WorkerError",
      message: "storyteller open worker produced no parsable result",
    };
  }

  if (parsed.ok === true && parsed.version && parsed.metadata) {
    return { status: "storyteller-opened", version: parsed.version, metadata: parsed.metadata };
  }
  return {
    status: "storyteller-open-failed",
    stage: "storyteller-open",
    category: typeof parsed.category === "string"
      ? parsed.category
      : "UnknownError",
    message: typeof parsed.message === "string"
      ? parsed.message
      : "storyteller open failed",
  };
}
