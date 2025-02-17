#!/usr/bin/env node

import { parseArgs } from "node:util";

import { exec } from "child_process";
import { mkdir, readdir, stat } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

const execAsync = promisify(exec);

// Path related Globals
const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(__filename);
const WHISPER_HOME = path.resolve(SCRIPT_DIR, "../external-repos/whisper.cpp");
const WHISPER_EXEC = `${WHISPER_HOME}/build/bin/whisper-cli`;
const WHISPER_MODELS = `${WHISPER_HOME}/models`;

// Configuration defaults
const DEFAULT_OUTDIR = `${process.env.HOME}/Downloads/WhisperCPPContent`;
const DEFAULT_MODEL_SHORTNAME = "base.en";
const ALLOWED_MODELS = ["tiny.en", "base.en", "small.en", "medium.en"];
const OUTPUT_FORMATS = "--output-vtt";

// Duration constants (in seconds)
const MAX_WAV_DURATION_SECONDS = 133200; // 37 hours
const DEFAULT_MAX_SEGMENT_LENGTH = MAX_WAV_DURATION_SECONDS;

// If this module is the main module, then call the main function
// Note: In Deno we would simply use: if (import.meta.main)
// But Node.js requires checking the URL against argv[1]
const isMainModule = import.meta.url.endsWith(process.argv[1]);
if (isMainModule) {
  await main();
} else {
  console.log("This module is not the main module.");
}

async function main() {
  const { values: args } = parseArgs({
    options: {
      basedir: { type: "string", short: "i" },
      duration: { type: "string", short: "d", default: "0" },
      model: { type: "string", short: "m", default: DEFAULT_MODEL_SHORTNAME },
      outdir: { type: "string", short: "o", default: DEFAULT_OUTDIR },
      "dry-run": { type: "boolean", short: "n", default: false },
      help: { type: "boolean", short: "h" },
      "max-segment-length": {
        type: "string",
        default: DEFAULT_MAX_SEGMENT_LENGTH.toString(),
        description: "Maximum segment length in seconds (default: 37hrs)",
      },
    },
    strict: true,
  });

  if (!args.basedir) {
    console.error("Error: Missing required argument: -i base_directory");
    usage();
  }

  if (args.help || !args.basedir) {
    console.error("Error: Missing stuff.", { args });
    usage();
  }

  const BASEDIR = args.basedir;
  const DURATION = args.duration;
  const MODEL_SHORTNAME = args.model;
  const OUTDIR = args.outdir;
  const DRYRUN = args["dry-run"];
  const MAX_SEGMENT_LENGTH = parseInt(args["max-segment-length"], 10);
  console.error({
    BASEDIR,
    DURATION,
    MODEL_SHORTNAME,
    OUTDIR,
    DRYRUN,
    MAX_SEGMENT_LENGTH,
  });
  await validateInputs({
    BASEDIR,
    DURATION,
    MODEL_SHORTNAME,
    OUTDIR,
    MAX_SEGMENT_LENGTH,
  });
  await processFiles({
    BASEDIR,
    DURATION,
    MODEL_SHORTNAME,
    OUTDIR,
    DRYRUN,
    MAX_SEGMENT_LENGTH,
  });
}

function usage() {
  const exeName = path.basename(__filename);
  console.log(`
Usage: node ${exeName} -i base_directory [-n] [-d duration] [-m model] [-o output_directory] [--max-segment-length seconds]

Parameters:
  --basedir, -i           Base directory (required, no default)
  --dry-run, -n          Dry-run mode (default: false)
  --duration,-d          Duration (default: 0, meaning entire file duration)
  --model,   -m          Model (default: ${DEFAULT_MODEL_SHORTNAME})
  --outdir,  -o          Output (default: ${DEFAULT_OUTDIR})
  --max-segment-length   Maximum segment length in seconds (default: ${DEFAULT_MAX_SEGMENT_LENGTH}, 37hrs)
`);
  process.exit(1);
}

// process.exit(1);
async function validateInputs({
  BASEDIR,
  DURATION,
  MODEL_SHORTNAME,
  MAX_SEGMENT_LENGTH,
  _OUTDIR,
}) {
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

  if (
    MAX_SEGMENT_LENGTH <= 0 ||
    MAX_SEGMENT_LENGTH > MAX_WAV_DURATION_SECONDS
  ) {
    console.error(
      `Error: max-segment-length (${MAX_SEGMENT_LENGTH}) must be between 1 and ${MAX_WAV_DURATION_SECONDS} seconds`
    );
    usage();
  }
}

async function processFiles({
  BASEDIR,
  DURATION,
  MODEL_SHORTNAME,
  OUTDIR,
  DRYRUN,
  MAX_SEGMENT_LENGTH,
}) {
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
  if (DRYRUN) {
    console.log(`- DRY RUN MODE: Commands will be shown but not executed`);
  }

  await ensureOutputDirectory({ OUTDIR, DRYRUN });

  console.log(`\n# Scanning for .m4b in: ${BASEDIR}\n`);
  const files = await readdir(BASEDIR);
  const m4bFiles = files.filter((file) => file.endsWith(".m4b"));

  for (const m4b of m4bFiles) {
    const bookBase = path.basename(m4b, ".m4b");
    const wavFile = path.join(OUTDIR, `${bookBase}.wav`);

    console.log(`\n## Processing ${bookBase}\n`);
    console.log(`### Converting to WAV file`);
    const m4bPath = path.join(BASEDIR, m4b);

    const wavFiles = await convertToWav(m4bPath, wavFile, {
      DRYRUN,
      MAX_SEGMENT_LENGTH,
    });

    if (!DRYRUN) {
      const isWavSane = await sanityCheckWav(m4bPath, wavFiles);
      if (!isWavSane) {
        console.warn("Proceeding with transcription despite duration mismatch");
      }
    }

    console.log(`\n### Transcribing to VTT`);
    for (const wavFile of wavFiles) {
      const vttOutputPath = wavFile.replace(/\.wav$/, ".vtt");
      await whisperTranscribe(wavFile, vttOutputPath, {
        MODEL_SHORTNAME,
        DURATION,
        DRYRUN,
      });
    }
  }
}

async function ensureOutputDirectory({ OUTDIR, DRYRUN }) {
  try {
    await stat(OUTDIR);
  } catch {
    console.log(`Creating OUTDIR ${OUTDIR}`);
    if (!DRYRUN) {
      await mkdir(OUTDIR, { recursive: true });
    }
  }
}

/**
 * Get the duration of an audio file in seconds using ffprobe
 * @param {string} audioFile - Path to the audio file
 * @returns {Promise<number>} Duration in seconds as a float
 * @throws {Error} If ffprobe fails to get the duration
 */
async function getAudioFileDuration(audioFile) {
  // ffprobe command parameters:
  // -v error           : Only show errors, no other output
  // -show_entries      : Show specific entries from input
  // format=duration    : Get duration from format section
  // -of               : Output format
  // default=          : Default format settings
  // noprint_wrappers=1: Don't print section headers
  // nokey=1           : Don't print key names
  const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioFile}"`;
  try {
    const { stdout } = await execAsync(cmd);
    return parseFloat(stdout);
  } catch (error) {
    console.error(`Error: Could not get duration of ${audioFile}`);
    throw error;
  }
}

/**
 * Check if WAV file(s) duration matches the source M4B file
 * @param {string} m4bInputPath - Path to the source M4B file
 * @param {string[]} wavFiles - Array of WAV file paths
 * @returns {Promise<boolean>} True if durations match within tolerance
 */
async function sanityCheckWav(m4bInputPath, wavFiles) {
  const m4bDuration = await getAudioFileDuration(m4bInputPath);
  console.log(`- M4B duration: ${m4bDuration} seconds`);

  let totalWavDuration = 0;
  for (const wavFile of wavFiles) {
    const duration = await getAudioFileDuration(wavFile);
    console.log(`- ${path.basename(wavFile)} duration: ${duration} seconds`);
    totalWavDuration += duration;
  }
  console.log(`- WAV duration total: ${totalWavDuration} seconds`);

  // Allow 1 second per file for rounding differences
  const tolerance = wavFiles.length;
  const isDurationMatch = Math.abs(totalWavDuration - m4bDuration) <= tolerance;
  if (!isDurationMatch) {
    console.warn(
      `Warning: Duration mismatch! M4B: ${m4bDuration}s, WAV total: ${totalWavDuration}s`
    );
  } else {
    console.log(`- Durations match`);
  }
  return isDurationMatch;
}

/**
 * Convert M4B to WAV file(s), splitting if duration exceeds MAX_SEGMENT_LENGTH
 * @param {string} m4bInputPath - Path to the input M4B file
 * @param {string} wavOutputPath - Path for the output WAV file (or pattern for segments)
 * @param {Object} options - Conversion options
 * @param {boolean} options.DRYRUN - Whether to run in dry-run mode
 * @param {number} options.MAX_SEGMENT_LENGTH - Maximum segment length in seconds
 * @returns {Promise<string[]>} Array of WAV file paths created
 */
async function convertToWav(
  m4bInputPath,
  wavOutputPath,
  { DRYRUN, MAX_SEGMENT_LENGTH }
) {
  const wavDir = path.dirname(wavOutputPath);
  const wavBase = path.basename(wavOutputPath, ".wav");

  try {
    // Get input file duration first - we need this to decide on segmentation
    const m4bDuration = await getAudioFileDuration(m4bInputPath);
    console.log(`- M4B duration: ${m4bDuration} seconds`);

    const needsSegmentation = m4bDuration > MAX_SEGMENT_LENGTH;
    let expectedWavFiles;

    if (needsSegmentation) {
      // Calculate number of segments needed (round up)
      const numSegments = Math.ceil(m4bDuration / MAX_SEGMENT_LENGTH);
      // e.g. ["path/to/wav/book_name_part_000.wav", "path/to/wav/book_name_part_001.wav",..]
      expectedWavFiles = Array.from({ length: numSegments }, (_, i) =>
        path.join(wavDir, `${wavBase}_part_${String(i).padStart(3, "0")}.wav`)
      );
      console.log(`Expecting ${numSegments} segments`);
    } else {
      expectedWavFiles = [wavOutputPath];
    }

    // Check if output already exists
    const existingFiles = await readdir(wavDir);
    const wavFiles = existingFiles
      .filter((f) => f.endsWith(".wav") && f.startsWith(wavBase))
      .map((f) => path.join(wavDir, f));

    // If we have existing wav files, check if they exactly match what we expect
    if (wavFiles.length > 0) {
      const expectedSet = new Set(expectedWavFiles);
      const existingSet = new Set(wavFiles);

      // Modern Set comparison using symmetricDifference
      // If sets are equal, their symmetric difference will be empty
      const areEqual = expectedSet.symmetricDifference(existingSet).size === 0;

      if (areEqual) {
        console.log(
          ".wav files already exist and match expected pattern. Skipping conversion..."
        );
        return expectedWavFiles;
      } else {
        console.error("Unexpected WAV files found!");
        console.error("Expected:", [...expectedSet]);
        console.error("Found:", [...existingSet]);
        throw new Error("Unexpected WAV files found");
      }
    }

    const segmentPattern = needsSegmentation
      ? `${wavDir}/${wavBase}_part_%03d.wav`
      : wavOutputPath;

    console.log(`Converting\n  ${m4bInputPath}\nto\n  ${segmentPattern}`);

    // Base ffmpeg command parameters:
    // -y                    : Overwrite output files without asking
    // -hide_banner         : Hide ffmpeg compilation info
    // -loglevel panic      : Only show fatal errors
    // -i                   : Input file
    // -ar 16000           : Set audio sampling rate to 16kHz
    // -ac 1               : Set number of audio channels to 1 (mono)
    // -c:a pcm_s16le      : Set audio codec to 16-bit little-endian PCM
    // -af "asetpts=N/SR/TB": Reset timestamps based on frame index (N), sample rate (SR), and time base (TB)
    // -reset_timestamps 1  : Reset timestamps for each segment to start at zero
    let cmd = `ffmpeg -y -hide_banner -loglevel panic -i "${m4bInputPath}" -ar 16000 -ac 1 -c:a pcm_s16le -af "asetpts=N/SR/TB" -reset_timestamps 1`;

    if (needsSegmentation) {
      // Additional parameters for segmentation:
      // -f segment         : Use the segment muxer
      // -segment_time     : Set the segment duration
      // -force_key_frames : Force keyframes at segment boundaries
      cmd += ` -f segment -segment_time ${MAX_SEGMENT_LENGTH}`;
      cmd += ` -force_key_frames "expr:gte(t,n_forced*${MAX_SEGMENT_LENGTH})"`;
    }

    cmd += ` "${segmentPattern}"`;

    if (DRYRUN) {
      console.log("Dry-run: Would convert with command");
      console.log(cmd);
      return expectedWavFiles;
    } else {
      console.log("Converting with command");
      console.log(cmd);
      const start = +new Date();
      await execAsync(cmd);
      const elapsed = ((+new Date() - start) / 1000).toFixed(2);
      console.log(`Conversion completed in ${elapsed}s`);

      // Verify that all expected files were created
      for (const expectedFile of expectedWavFiles) {
        try {
          await stat(expectedFile);
        } catch (error) {
          throw new Error(
            `Expected output file ${expectedFile} was not created`
          );
        }
      }

      return expectedWavFiles;
    }
  } catch (error) {
    console.error("Error during conversion:", error);
    throw error;
  }
}

async function whisperTranscribe(
  wavInputPath,
  vttOutputPath,
  { MODEL_SHORTNAME, DURATION, DRYRUN }
) {
  const fullModelName = `${WHISPER_MODELS}/ggml-${MODEL_SHORTNAME}.bin`;
  const outputFilePrefix = vttOutputPath.replace(/\.vtt$/, "");
  // this need to be optimized with testing!
  const processFlags = "-t 8 -p 4";
  const verbosity = "--print-progress";
  let cmd = `${WHISPER_EXEC} ${processFlags} ${verbosity} -f "${wavInputPath}" -m ${fullModelName} ${OUTPUT_FORMATS} -of "${outputFilePrefix}"`;
  if (DURATION > 0) {
    cmd += ` -d ${DURATION}`;
  }

  try {
    await stat(vttOutputPath);
    console.log(
      `Transcription file ${vttOutputPath} already exists, skipping processing.`
    );
  } catch {
    if (DRYRUN) {
      console.log("Dry-run: Would transcribe with command");
      console.log(cmd);
    } else {
      console.log("Transcribing with command");
      console.log(cmd);
      const start = +new Date();
      await execAsync(cmd);
      const elapsed = ((+new Date() - start) / 1000).toFixed(2);
      console.log(`Transcription completed in ${elapsed}s`);
    }
  }
}
