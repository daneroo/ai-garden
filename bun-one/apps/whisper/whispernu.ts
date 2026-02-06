/**
 * whispernu - Simplified whisper transcription (single segment only)
 *
 * Usage:
 *   bun run whispernu.ts --input audio.mp3 --model tiny.en
 */

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import process from "node:process";
import yargs from "yargs";

// Simple types
interface TranscribeParams {
  inputPath: string;
  model: string;
  threads: number;
}

interface CachePaths {
  wav: string;
  vtt: string;
}

// Configuration
const MODELS_DIR = join(import.meta.dir, "data", "models");
const CACHE_DIR = join(import.meta.dir, "data", "cache");
const OUTPUT_DIR = join(import.meta.dir, "data", "output");
const WHISPER_EXEC = "whisper-cli";
const DEFAULT_THREADS = 6;

// Entry point
if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : `Unknown error: ${String(error)}`;
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const argv = await yargs(process.argv.slice(2))
    .option("input", {
      alias: "i",
      type: "string",
      demandOption: true,
      describe: "Path to audio file",
    })
    .option("model", {
      alias: "m",
      type: "string",
      default: "tiny.en",
      describe: "Model name",
      choices: ["tiny.en", "base.en", "small.en"],
    })
    .option("threads", {
      type: "number",
      default: DEFAULT_THREADS,
      describe: "Number of threads",
    })
    .help()
    .alias("h", "help")
    .parseAsync();

  const { input, model, threads } = argv;

  // Check input exists
  if (!existsSync(input)) {
    throw new Error(`Input file not found: ${input}`);
  }

  // Compute cache paths
  const inputName = basename(input, extname(input));
  const cachePaths = getCachePaths(inputName, model);

  // Check VTT cache (cache hit? done)
  if (existsSync(cachePaths.vtt)) {
    console.log(`VTT cache hit: ${cachePaths.vtt}`);
    console.log(`Output: ${cachePaths.vtt}`);
    return;
  }

  // Convert to WAV (check WAV cache first)
  const wavPath = await ensureWavExists(input, cachePaths.wav);
  console.log(`WAV: ${wavPath}`);

  // Transcribe
  console.log(`Transcribing with ${model}...`);
  const vttContent = await transcribe({ inputPath: wavPath, model, threads });

  // Write VTT to cache and output
  await mkdir(join(CACHE_DIR, "vtt", model), { recursive: true });
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(cachePaths.vtt, vttContent);

  const outputPath = join(OUTPUT_DIR, `${inputName}.vtt`);
  await writeFile(outputPath, vttContent);

  console.log(`Output: ${outputPath}`);
}

function getCachePaths(inputName: string, model: string): CachePaths {
  const wavCacheDir = join(CACHE_DIR, "wav");
  const vttCacheDir = join(CACHE_DIR, "vtt", model);

  return {
    wav: join(wavCacheDir, `${inputName}.wav`),
    vtt: join(vttCacheDir, `${inputName}.vtt`),
  };
}

async function ensureWavExists(
  inputPath: string,
  wavCachePath: string,
): Promise<string> {
  // Check cache
  if (existsSync(wavCachePath)) {
    console.log(`WAV cache hit: ${wavCachePath}`);
    return wavCachePath;
  }

  // Convert to WAV
  console.log(`Converting to WAV...`);
  await mkdir(join(CACHE_DIR, "wav"), { recursive: true });

  const proc = Bun.spawn([
    "ffmpeg",
    "-i",
    inputPath,
    "-ar",
    "16000",
    "-ac",
    "1",
    "-c:a",
    "pcm_s16le",
    "-y",
    wavCachePath,
  ]);

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`ffmpeg failed with exit code ${exitCode}`);
  }

  return wavCachePath;
}

async function transcribe(params: TranscribeParams): Promise<string> {
  const { inputPath, model, threads } = params;
  const modelPath = join(MODELS_DIR, `ggml-${model}.bin`);

  if (!existsSync(modelPath)) {
    throw new Error(`Model not found: ${modelPath}`);
  }

  // whisper-cli writes to file, so use temp file
  const tmpDir = join(import.meta.dir, "data", "tmp");
  await mkdir(tmpDir, { recursive: true });
  const tmpBasename = `tmp-${Date.now()}`;
  const tmpVtt = join(tmpDir, `${tmpBasename}.vtt`);

  const proc = Bun.spawn(
    [
      WHISPER_EXEC,
      "-m",
      modelPath,
      "-f",
      inputPath,
      "-t",
      threads.toString(),
      "-ovtt",
      "-of",
      tmpBasename,
    ],
    {
      cwd: tmpDir,
    },
  );

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(`whisper-cli failed with exit code ${exitCode}`);
  }

  // Read the generated VTT file
  const output = await Bun.file(tmpVtt).text();

  // Clean up temp file
  await Bun.$`rm -f ${tmpVtt}`.quiet();

  return output;
}
