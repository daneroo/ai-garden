import { mkdir, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { existsSync } from "node:fs";

/**
 * Configuration for a whisper benchmark run
 */
export interface RunConfig {
  source: string;
  model: string;
  modelBin: string; // Path to ggml model file for whisper-cpp
  iterations: number;
  threads: number;
  durationMs: number; // Duration in milliseconds for whisper-cpp (0 = entire file)
  durationSec: number; // Duration in seconds (0 = entire file)
  outputDir: string; // Base output dir, engine subdir will be created
  verbosity: number;
  dryRun: boolean;
}

/**
 * Check if a command exists in PATH or as a file
 */
export function commandExists(cmd: string): boolean {
  if (existsSync(cmd)) return true;
  try {
    const result = new Deno.Command("which", { args: [cmd] }).outputSync();
    return result.code === 0;
  } catch {
    return false;
  }
}

/**
 * Get ISO timestamp for filenames (no colons)
 */
function getTimestamp(): string {
  return new Date().toISOString().replace(/:/g, "-").slice(0, 19) + "Z";
}

/**
 * Run a command and return when complete
 */
async function runCommand(
  command: string,
  args: string[],
  logFile: string,
): Promise<number> {
  const cmd = new Deno.Command(command, {
    args,
    stdout: "piped",
    stderr: "piped",
  });

  const process = cmd.spawn();
  const { code, stdout, stderr } = await process.output();

  const decoder = new TextDecoder();
  const output = decoder.decode(stdout) + decoder.decode(stderr);
  await writeFile(logFile, output, { flag: "a" });

  return code;
}

/**
 * Run whisper-cpp benchmark (brew or self-compiled)
 */
export async function runWhisperCpp(
  exec: string,
  label: string,
  flavor: string,
  config: RunConfig,
): Promise<void> {
  const fileLabel = basename(config.source, ".mp3");
  const engineDir = `${config.outputDir}/${flavor}`;

  console.log("");
  console.log(
    "----------------------------------------------------------------",
  );
  console.log(`Running: ${label}`);
  console.log(`Binary: ${exec}`);
  console.log(`Output: ${engineDir}/`);
  console.log(
    "----------------------------------------------------------------",
  );

  if (!commandExists(exec)) {
    console.log(`▲ Binary not found: ${exec}. Skipping.`);
    return;
  }

  if (!config.dryRun) {
    await mkdir(engineDir, { recursive: true });
  }

  for (let i = 1; i <= config.iterations; i++) {
    const timestamp = getTimestamp();
    const logFile = `${engineDir}/${fileLabel}-${timestamp}.log`;
    const outPrefix = `${engineDir}/${fileLabel}`;

    // Build args - only include -d if duration > 0
    const args = [
      "-t",
      String(config.threads),
      "-m",
      config.modelBin,
      "-f",
      config.source,
      "--print-progress",
      "--output-json",
      "--output-vtt",
      "-of",
      outPrefix,
    ];

    // Add duration flag only if specified (0 = entire file)
    if (config.durationMs > 0) {
      args.push("-d", String(config.durationMs));
    }

    const cmdStr = `${exec} ${args.join(" ")}`;

    if (config.dryRun) {
      console.log(`Command (dry-run): ${cmdStr}`);
      continue;
    }

    await writeFile(logFile, `Command: ${cmdStr}\n`);

    const start = Date.now();
    await runCommand(exec, args, logFile);
    const elapsed = Math.round((Date.now() - start) / 1000);

    const speedup = config.durationSec > 0
      ? (config.durationSec / elapsed).toFixed(1)
      : "?";

    const result = `✓ Done in ${elapsed}s. Speedup: ${speedup}x.`;
    console.log(result);
    await writeFile(logFile, result + "\n", { flag: "a" });
  }
}

/**
 * Run whisperkit-cli benchmark
 */
export async function runWhisperKit(
  exec: string,
  label: string,
  flavor: string,
  config: RunConfig,
): Promise<void> {
  const fileLabel = basename(config.source, ".mp3");
  const engineDir = `${config.outputDir}/${flavor}`;

  console.log("");
  console.log(
    "----------------------------------------------------------------",
  );
  console.log(`Running: ${label}`);
  console.log(`Binary: ${exec}`);
  console.log(`Output: ${engineDir}/`);
  console.log(
    "----------------------------------------------------------------",
  );

  if (!commandExists(exec)) {
    console.log(`▲ Binary not found: ${exec}. Skipping.`);
    return;
  }

  if (!config.dryRun) {
    await mkdir(engineDir, { recursive: true });
  }

  for (let i = 1; i <= config.iterations; i++) {
    const timestamp = getTimestamp();
    const logFile = `${engineDir}/${fileLabel}-${timestamp}.log`;

    // Build args - handle duration 0 = entire file
    const args = [
      "transcribe",
      "--audio-path",
      config.source,
      "--model",
      config.model,
      "--report",
      "--report-path",
      engineDir,
      "--verbose",
    ];

    // Add clip-timestamps only if duration > 0
    if (config.durationSec > 0) {
      args.push("--clip-timestamps", "0", String(config.durationSec));
    }

    const cmdStr = `${exec} ${args.join(" ")}`;

    if (config.dryRun) {
      console.log(`Command (dry-run): ${cmdStr}`);
      continue;
    }

    await writeFile(logFile, `Command: ${cmdStr}\n`);

    const start = Date.now();
    await runCommand(exec, args, logFile);
    const elapsed = Math.round((Date.now() - start) / 1000);

    // Convert SRT to VTT using ffmpeg if SRT exists
    const srtPath = `${engineDir}/${fileLabel}.srt`;
    const vttPath = `${engineDir}/${fileLabel}.vtt`;
    if (existsSync(srtPath) && commandExists("ffmpeg")) {
      await runCommand(
        "ffmpeg",
        ["-y", "-hide_banner", "-loglevel", "error", "-i", srtPath, vttPath],
        logFile,
      );
    }

    const speedup = config.durationSec > 0
      ? (config.durationSec / elapsed).toFixed(1)
      : "?";

    const result = `✓ Done in ${elapsed}s. Speedup: ${speedup}x.`;
    console.log(result);
    await writeFile(logFile, result + "\n", { flag: "a" });
  }
}
