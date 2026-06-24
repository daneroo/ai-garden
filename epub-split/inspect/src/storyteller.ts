import { buildParserOutput } from "./adapter.ts";
import type { ParserOutput } from "./schema.ts";

const WORKER = `${import.meta.dir}/storyteller-worker.ts`;
const OPEN_TIMEOUT_MS = Number(process.env["STORYTELLER_OPEN_TIMEOUT_MS"]) ||
  5_000;

export const STORYTELLER_VERSION = await (async () => {
  try {
    const pkgPath = Bun.resolveSync(
      "@storyteller-platform/epub/package.json",
      import.meta.dir,
    );
    return ((await Bun.file(pkgPath).json()) as { version: string }).version;
  } catch {
    return "unknown";
  }
})();

interface WorkerResult {
  ok: true | false | "epub2-unsupported";
  metadata?: {
    title: string | null;
    creator: string | null;
    date: string | null;
  };
  spine?: { href: string; linear: boolean }[];
  manifest?: { id: string; href: string; mediaType: string | null }[];
  spineHashes?: { href: string; sha256: string }[];
  category?: string;
  message?: string;
}

export async function openStoryteller(
  absolutePath: string,
): Promise<ParserOutput> {
  const proc = Bun.spawn(["bun", "run", WORKER, absolutePath], {
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
    return buildParserOutput("storyteller", {
      openStatus: "open-failed",
      parserVersion: STORYTELLER_VERSION,
      openFailure: {
        category: "Timeout",
        message: `open did not settle within ${OPEN_TIMEOUT_MS}ms`,
      },
    });
  }

  let parsed: WorkerResult;
  try {
    parsed = JSON.parse(output) as WorkerResult;
  } catch {
    return buildParserOutput("storyteller", {
      openStatus: "open-failed",
      parserVersion: STORYTELLER_VERSION,
      openFailure: {
        category: "WorkerError",
        message: "storyteller worker produced no parsable result",
      },
    });
  }

  if (parsed.ok === "epub2-unsupported") {
    return buildParserOutput("storyteller", {
      openStatus: "epub2-unsupported",
      parserVersion: STORYTELLER_VERSION,
    });
  }

  if (parsed.ok === true && parsed.metadata) {
    return buildParserOutput("storyteller", {
      openStatus: "opened",
      parserVersion: STORYTELLER_VERSION,
      metadata: parsed.metadata,
      spine: parsed.spine ?? [],
      manifest: parsed.manifest ?? [],
      spineHashes: parsed.spineHashes ?? [],
    });
  }

  return buildParserOutput("storyteller", {
    openStatus: "open-failed",
    parserVersion: STORYTELLER_VERSION,
    openFailure: {
      category: typeof parsed.category === "string"
        ? parsed.category
        : "UnknownError",
      message: typeof parsed.message === "string"
        ? parsed.message
        : "storyteller open failed",
    },
  });
}
