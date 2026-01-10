import { App, staticFiles } from "fresh";
import Home from "./routes/index.tsx";
import {
  formatTimestamp,
  readVtt,
  summarizeVtt,
  type VttSummary,
} from "@prosidio/vtt";
import { join, resolve } from "@std/path";

import Detail from "./routes/detail.tsx";

export const app = new App();

app.use(staticFiles());

app.get("/file/:name", async (ctx) => {
  const filename = ctx.params.name;
  const vttDirEnv = Deno.env.get("VTT_DIR");

  if (!vttDirEnv) {
    return new Response("VTT_DIR not set", { status: 500 });
  }

  try {
    const resolvedPath = resolve(Deno.cwd(), vttDirEnv);
    const filePath = join(resolvedPath, filename);

    // Basic security check to prevent directory traversal
    if (!filePath.startsWith(resolvedPath)) {
      return new Response("Invalid file path", { status: 403 });
    }

    const cues = await readVtt(filePath);
    const summary = summarizeVtt(cues);

    return ctx.render(
      <Detail summary={summary} filename={filename} cues={cues} />,
    );
  } catch (e) {
    return new Response(`Error reading file: ${e}`, { status: 500 });
  }
});

app.get("/", async (ctx) => {
  const time = formatTimestamp(3661.5);
  const vttDirEnv = Deno.env.get("VTT_DIR");

  const summaries: (VttSummary & { filename: string })[] = [];
  let error: string | null = null;
  let resolvedPath = "";

  if (vttDirEnv) {
    try {
      resolvedPath = resolve(Deno.cwd(), vttDirEnv);
      for await (const dirEntry of Deno.readDir(resolvedPath)) {
        if (dirEntry.isFile && dirEntry.name.endsWith(".vtt")) {
          try {
            const cues = await readVtt(join(resolvedPath, dirEntry.name));
            const summary = summarizeVtt(cues);
            summaries.push({ ...summary, filename: dirEntry.name });
          } catch (e) {
            console.error(`Failed to parse ${dirEntry.name}:`, e);
          }
        }
      }
      summaries.sort((a, b) => a.filename.localeCompare(b.filename));
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      if (!resolvedPath && vttDirEnv) {
        resolvedPath = vttDirEnv + " (resolution failed)";
      }
    }
  } else {
    error = "VTT_DIR environment variable is not set.";
  }

  return ctx.render(
    <Home
      time={time}
      summaries={summaries}
      resolvedPath={resolvedPath}
      error={error}
    />,
  );
});

export default { fetch: app.handler() };
