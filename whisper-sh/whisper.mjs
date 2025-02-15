#!/usr/bin/env node

import { parseArgs } from "node:util";

import { exec } from "child_process";
import { mkdir, readdir, stat } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(__filename);
const WHISPER_HOME = path.resolve(SCRIPT_DIR, "../external-repos/whisper.cpp");
const WHISPER_EXEC = `${WHISPER_HOME}/build/bin/whisper-cli`;
const WHISPER_MODELS = `${WHISPER_HOME}/models`;
const DEFAULT_OUTDIR = `${process.env.HOME}/Downloads/WhisperCPPContent`;
const DEFAULT_MODEL_SHORTNAME = "base.en";
const ALLOWED_MODELS = ["tiny.en", "base.en", "small.en", "medium.en"];
const OUTPUT_FORMATS = "--output-vtt";

const usage = () => {
  const exeName = path.basename(__filename);
  console.log(`
Usage: node ${exeName} -i base_directory [-d duration] [-m model] [-o output_directory]

Parameters:
  --basedir, -i  Base directory (required, no default)
  --duration,-d  Duration (default: 0, meaning entire file duration)
  --model,   -m  Model (default: ${DEFAULT_MODEL_SHORTNAME})
  --outdir,  -o  Output (default: ${DEFAULT_OUTDIR})
`);
  process.exit(1);
};

const { values: args } = parseArgs({
  options: {
    basedir: { type: "string", short: "i" },
    duration: { type: "string", short: "d", default: "0" },
    model: { type: "string", short: "m", default: DEFAULT_MODEL_SHORTNAME },
    outdir: { type: "string", short: "o", default: DEFAULT_OUTDIR },
    help: { type: "boolean", short: "h" },
  },
  strict: true,
});

if (args.help || !args.basedir) {
  console.error("Error: Missing stuff.", { args });
  usage();
}

const BASEDIR = args.basedir;
const DURATION = args.duration;
const MODEL_SHORTNAME = args.model;
const OUTDIR = args.outdir;
console.error({ BASEDIR, DURATION, MODEL_SHORTNAME, OUTDIR });

// process.exit(1);
async function validateInputs() {
  try {
    const baseDirStat = await stat(BASEDIR);
    if (!baseDirStat.isDirectory()) throw new Error();
  } catch {
    console.error(`Error: Invalid input directory: ${BASEDIR}`);
    usage();
  }

  if (DURATION && isNaN(DURATION)) {
    console.error(`Error: Duration (${DURATION}) must be a positive integer.`);
    usage();
  }

  if (!ALLOWED_MODELS.includes(MODEL_SHORTNAME)) {
    console.error(
      `Error: Invalid model shortname. Allowed values are: ${ALLOWED_MODELS.join(
        ", "
      )}`
    );
    usage();
  }
}

async function ensureOutputDirectory() {
  try {
    await stat(OUTDIR);
  } catch {
    console.log(`Creating OUTDIR ${OUTDIR}`);
    await mkdir(OUTDIR, { recursive: true });
  }
}

async function convertToWav(m4b, wav) {
  try {
    await stat(wav);
    console.log(".wav already exists. Skipping conversion...");
  } catch {
    console.log(`Converting\n  ${m4b}\nto\n  ${wav}`);
    const start = +new Date();
    await execAsync(
      `ffmpeg -y -hide_banner -loglevel panic -i "${m4b}" -ar 16000 -ac 1 -c:a pcm_s16le "${wav}"`
    );
    const elapsed = ((+new Date() - start) / 1000).toFixed(2);
    console.log(`Conversion completed in ${elapsed}s`);
  }
}

async function whisperTranscribe(wav, prefix) {
  let cmd = `${WHISPER_EXEC} -f "${wav}" -m ${WHISPER_MODELS}/ggml-${MODEL_SHORTNAME}.bin ${OUTPUT_FORMATS} -of "${prefix}"`;
  if (DURATION > 0) {
    cmd += ` -d ${DURATION}`;
  }

  try {
    await stat(`${prefix}.vtt`);
    console.log("Transcription files already exist, skipping processing.");
  } catch {
    console.log("Launching whisper transcribe...");
    const start = +new Date();
    console.log(`CMD: ${cmd}`);
    await execAsync(cmd);
    const elapsed = ((+new Date() - start) / 1000).toFixed(2);
    console.log(`Transcription completed in ${elapsed}s`);
  }
}

async function convertAndTranscribe(m4b, prefix) {
  let whisperCmd = `${WHISPER_EXEC} -f - -m ${WHISPER_MODELS}/ggml-${MODEL_SHORTNAME}.bin ${OUTPUT_FORMATS} -of "${prefix}"`;
  if (DURATION > 0) {
    whisperCmd += ` -d ${DURATION}`;
  }
  const ffmpegCmd = `ffmpeg -hide_banner -loglevel panic -i "${m4b}" -ar 16000 -ac 1 -c:a pcm_s16le -f wav -`;

  console.log("Starting conversion and transcription...");
  const start = +new Date();
  try {
    await execAsync(`${ffmpegCmd} | ${whisperCmd}`);
    const elapsed = ((+new Date() - start) / 1000).toFixed(2);
    console.log(`Conversion and transcription completed in ${elapsed}s`);
  } catch (error) {
    console.error("Error during conversion and transcription:", error);
  }
}

async function processFiles() {
  console.log(`# Whisper Transcription\n`);
  console.log(`## Configuration\n`);
  console.log(`- BASEDIR (input for m4b's): ${BASEDIR}`);
  console.log(`- MODEL_SHORTNAME: ${MODEL_SHORTNAME}`);
  if (DURATION > 0) {
    console.log(`- DURATION: ${DURATION} seconds`);
  }
  console.log(`- OUTDIR: ${OUTDIR}`);
  console.log(`- SCRIPT_DIR: ${SCRIPT_DIR}`);
  console.log(`- WHISPER_HOME: ${WHISPER_HOME}`);
  console.log(`- WHISPER_EXEC: ${WHISPER_EXEC}`);

  await ensureOutputDirectory();

  console.log(`\n# Scanning for .m4b in: ${BASEDIR}\n`);
  const files = await readdir(BASEDIR);
  const m4bFiles = files.filter((file) => file.endsWith(".m4b"));

  for (const m4b of m4bFiles) {
    const bookBase = path.basename(m4b, ".m4b");
    const wavFile = path.join(OUTDIR, `${bookBase}.wav`);
    const whisperPfx = path.join(OUTDIR, bookBase);

    console.log(`\n## Processing ${bookBase}\n`);
    // console.log(`### Converting to WAV file`);
    // await convertToWav(path.join(BASEDIR, m4b), wavFile);
    // console.log(`\n### Transcribing to SRT/VTT/JSON`);
    // await whisperTranscribe(wavFile, whisperPfx);
    console.log(`\n### Converting and Transcribing`);
    await convertAndTranscribe(path.join(BASEDIR, m4b), whisperPfx);
  }
}

await validateInputs();
await processFiles();
