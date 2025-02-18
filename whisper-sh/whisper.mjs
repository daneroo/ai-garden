#!/usr/bin/env node

import { parseArgs } from "node:util";

import { exec, spawn } from "child_process";
import { mkdir, readdir, stat, readFile, access } from "fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

export const execAsync = promisify(exec);

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

// Duration constants (in seconds)
const MAX_WAV_DURATION_SECONDS = 133200; // 37 hours
const DEFAULT_MAX_SEGMENT_LENGTH = MAX_WAV_DURATION_SECONDS;

// If this module is the main module, then call the main function
// Note: In Deno we would simply use: if (import.meta.main)
// But Node.js requires checking the URL against argv[1]
const isMainModule = import.meta.url.endsWith(process.argv[1]);
if (isMainModule) {
  await main();
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
  if (DRYRUN) {
    console.log(`- DRY RUN MODE: Commands will be shown but not executed`);
  }
  if (MAX_SEGMENT_LENGTH !== DEFAULT_MAX_SEGMENT_LENGTH) {
    console.log(`- MAX_SEGMENT_LENGTH: ${MAX_SEGMENT_LENGTH} seconds`);
  }
  console.log(`- WHISPER_HOME: ${WHISPER_HOME}`);
  console.log(`- WHISPER_EXEC: ${WHISPER_EXEC}`);

  await ensureOutputDirectory({ OUTDIR, DRYRUN });

  const files = await readdir(BASEDIR);
  const m4bFiles = files.filter((file) => file.endsWith(".m4b"));

  for (const m4b of m4bFiles) {
    const bookBase = path.basename(m4b, ".m4b");
    const wavFile = path.join(OUTDIR, `${bookBase}.wav`);

    console.log(`\n## Processing ${bookBase}\n`);
    console.log(`### Converting to WAV file\n`);
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

    console.log(`\n### Transcribing to VTT\n`);
    const vttFiles = [];
    for (const wavFile of wavFiles) {
      const vttOutputPath = wavFile.replace(/\.wav$/, ".vtt");
      await whisperTranscribe(wavFile, vttOutputPath, {
        MODEL_SHORTNAME,
        DURATION,
        DRYRUN,
      });
      vttFiles.push(vttOutputPath);
    }

    if (!DRYRUN) {
      const isVttSane = await sanityCheckVtt(m4bPath, wavFiles, vttFiles);
      if (!isVttSane) {
        console.warn("VTT files validation failed");
      }
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
 * @returns {Promise<number>} Duration in seconds as a float, or -1 if file doesn't exist or can't be read
 */
export async function getAudioFileDuration(audioFile) {
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
    console.warn(`Could not get duration of ${audioFile}`);
    return -1; // Return -1 if file doesn't exist or can't be read
  }
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
    let skipBecauseExistsAndEqual = false;
    if (wavFiles.length > 0) {
      const expectedSet = new Set(expectedWavFiles);
      const existingSet = new Set(wavFiles);

      // Modern Set comparison using symmetricDifference
      // If sets are equal, their symmetric difference will be empty
      const areEqual = expectedSet.symmetricDifference(existingSet).size === 0;

      if (areEqual) {
        skipBecauseExistsAndEqual = true;
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

    console.log(`- m4b: ${path.basename(m4bInputPath)}`);
    console.log(`- duration: ${m4bDuration} seconds`);
    console.log(`- wav: ${path.basename(segmentPattern)}`);

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

    if (skipBecauseExistsAndEqual) {
      console.log(
        "  .wav files already exist and match expected pattern. Skipping command:"
      );
      console.log("  " + cmd);
      return expectedWavFiles;
    }
    if (DRYRUN) {
      console.log("- command (dry-run):");
      console.log("  " + cmd);
      return expectedWavFiles;
    }

    console.log("- command:");
    console.log("  " + cmd);
    const start = +new Date();
    await execAsync(cmd);
    const elapsed = ((+new Date() - start) / 1000).toFixed(2);
    console.log(`- elapsed: ${elapsed}s`);

    // Verify that all expected files were created
    for (const expectedFile of expectedWavFiles) {
      try {
        await stat(expectedFile);
      } catch (error) {
        throw new Error(`Expected output file ${expectedFile} was not created`);
      }
    }

    return expectedWavFiles;
  } catch (error) {
    console.error("Error during WAV conversion:", error);
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
  console.log(`\nWAV sanity check\n`);
  console.log(`- M4B duration: ${m4bDuration} seconds`);

  let totalWavDuration = 0;
  for (const wavFile of wavFiles) {
    const duration = await getAudioFileDuration(wavFile);
    console.log(`  - ${path.basename(wavFile)} duration: ${duration} seconds`);
    totalWavDuration += duration;
  }
  console.log(`- WAV duration total: ${totalWavDuration} seconds`);

  // Allow 1 second per file for rounding differences
  const tolerance = wavFiles.length;
  const isDurationMatch = Math.abs(totalWavDuration - m4bDuration) <= tolerance;
  if (!isDurationMatch) {
    console.warn(`- [✗] Duration mismatch!`);
    console.warn(`  - M4B: ${m4bDuration}s`);
    console.warn(`  - WAV total: ${totalWavDuration}s`);
    const delta = Math.abs(totalWavDuration - m4bDuration);
    console.warn(`  - Δ ${delta.toFixed(2)}s`);
    console.warn(`  - tolerance: ${tolerance}s`);
  } else {
    console.log(`- [✓] Durations match`);
  }
  return isDurationMatch;
}

/**
 * Transcribe WAV file to VTT using Whisper
 * @param {string} wavInputPath - Path to input WAV file
 * @param {string} vttOutputPath - Desired output VTT path
 * @param {Object} options - Transcription options
 * @param {string} options.MODEL_SHORTNAME - Model name (e.g., "base.en")
 * @param {number} options.DURATION - Max duration to process (0 for full file)
 * @param {boolean} options.DRYRUN - Whether to do a dry run
 * @returns {Promise<{wav: string, duration: number, elapsed: number}>} Transcription result
 */
export async function whisperTranscribe(
  wavInputPath,
  vttOutputPath,
  { MODEL_SHORTNAME, DURATION, DRYRUN }
) {
  const fullModelName = `${WHISPER_MODELS}/ggml-${MODEL_SHORTNAME}.bin`;
  // -of FNAME, --output-file FNAME: output file path (without file extension)
  const outputFilePrefix = vttOutputPath.replace(/\.vtt$/, "");

  // Build command string directly
  const cmd = [
    `${WHISPER_EXEC}`,
    `-t 4`, //` threads and processes: needs testing:  `-t 8 -p 4`,
    `--print-progress`, // verbosity
    `-f "${wavInputPath}"`, // input wav
    `-m "${fullModelName}"`, // model path
    `--output-vtt`, // output format
    `-of "${outputFilePrefix}"`, // -of FNAME, output file path (without file extension)
    DURATION > 0 ? `-d ${DURATION * 1000}` : "", // whisper expects milliseconds
  ].join(" ");

  // Check if output already exists
  const fileExists = await access(vttOutputPath)
    .then(() => true)
    .catch(() => false);

  if (fileExists) {
    console.log(
      `  .vtt file ${vttOutputPath} already exists. Skipping command:`
    );
    console.log("  " + cmd);
    const audioDuration =
      DURATION > 0 ? DURATION : await getAudioFileDuration(wavInputPath);
    return {
      wav: wavInputPath,
      duration: audioDuration,
      elapsed: 0, // elapsed is 0 for skipped files
    };
  }

  // Output doesn't exist, proceed with transcription
  if (DRYRUN) {
    console.log("- command (dry-run):");
    console.log("  " + cmd);
    const audioDuration =
      DURATION > 0 ? DURATION : await getAudioFileDuration(wavInputPath);
    return {
      wav: wavInputPath,
      duration: audioDuration,
      elapsed: 0, // elapsed is 0 for dry run
    };
  }

  console.log("- command:");
  console.log("  " + cmd);
  const start = +new Date();
  await spawnAsync("bash", ["-c", cmd]);
  const elapsed = (+new Date() - start) / 1000;
  // Use DURATION if specified, otherwise get it from the file
  const audioDuration =
    DURATION > 0 ? DURATION : await getAudioFileDuration(wavInputPath);
  const cost = (elapsed / (audioDuration / 3600)).toFixed(2); // seconds per hour of audio
  const ratio = (audioDuration / elapsed).toFixed(2); // audio duration per second
  console.log(`- elapsed: ${elapsed.toFixed(2)}s`);
  console.log(`- cost: ${cost}s/h of audio`);
  console.log(`- speedup: ${ratio}x realtime`);
  return {
    wav: wavInputPath,
    duration: audioDuration,
    elapsed: elapsed,
  };
}

/**
 * Execute a command and stream its output to console
 * @param {string} command The command to run
 * @param {string[]} args Array of arguments
 * @returns {Promise<void>}
 */
function spawnAsync(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: ["inherit", "pipe", "pipe"], // stdin inherit, stdout/stderr piped
    });

    // Progress tracking state variables
    let lastProgress = "0%";
    let lastCaption = "";

    // Clear line and move cursor to start
    const updateStatus = () => {
      const columns = process.stdout.columns || 80; // fallback to 80 if not in a terminal
      const prefix = `- [${lastProgress}] `;
      // Reserve space for prefix and leave 3 chars for "..."
      const maxCaptionLength = columns - prefix.length - 3;
      const caption =
        lastCaption.length > maxCaptionLength
          ? lastCaption.slice(0, maxCaptionLength) + "..."
          : lastCaption;

      process.stdout.write(`\x1b[2K\r${prefix}${caption}`);
    };

    proc.stdout.on("data", (data) => {
      // this is to avoid empty/extra lines from the data buffer
      const lines = data
        .toString()
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      // Update only the last non-empty caption
      for (const line of lines) {
        lastCaption = line;
        updateStatus();
      }
    });

    proc.stderr.on("data", (data) => {
      const lines = data
        .toString()
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        // Only show lines containing progress information
        .filter((line) => line.includes("whisper_print_progress_callback"));

      // Update progress percentage
      // ERR=> whisper_print_progress_callback: progress =  95%
      for (const line of lines) {
        const match = line.match(/progress\s*=\s*(\d+%)/);
        if (match) {
          lastProgress = match[1];
          updateStatus();
        }
      }
    });

    proc.on("error", (error) => {
      process.stdout.write("\n"); // Ensure we move to next line before error
      reject(error);
    });

    proc.on("close", (code) => {
      process.stdout.write("\n"); // Ensure we move to next line after completion
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

/**
 * Validate VTT files against their corresponding WAV files
 * @param {string} m4bInputPath - Path to the source M4B file
 * @param {string[]} wavFiles - Array of WAV file paths
 * @param {string[]} vttFiles - Array of VTT file paths
 * @returns {Promise<boolean>} True if VTT files are valid
 */
async function sanityCheckVtt(m4bInputPath, wavFiles, vttFiles) {
  console.log(`\nVTT sanity check\n`);

  let isValid = true;

  // First check: 1:1 correspondence between WAV and VTT files
  if (wavFiles.length !== vttFiles.length) {
    console.error(
      `Mismatch in number of files: ${wavFiles.length} WAV files vs ${vttFiles.length} VTT files`
    );
    isValid = false;
  }

  // Check that each VTT file exists and corresponds to a WAV file
  for (let i = 0; i < wavFiles.length; i++) {
    const wavBase = wavFiles[i].replace(/\.wav$/, "");
    const vttBase = vttFiles[i].replace(/\.vtt$/, "");
    if (wavBase !== vttBase) {
      console.error(
        `WAV and VTT file names don't match:\n  WAV: ${wavFiles[i]}\n  VTT: ${vttFiles[i]}`
      );
      isValid = false;
      continue;
    }

    try {
      await stat(vttFiles[i]);
      // Read and parse the VTT file
      const vttContent = await readFile(vttFiles[i], "utf-8");
      const cues = parseVTT(vttContent);
      if (cues.length > 0) {
        const lastCue = cues[cues.length - 1];
        console.log(`- vtt[last cue]: ${path.basename(vttFiles[i])}`);
        console.log(`  - startTime: ${lastCue.startTime}`);
        console.log(`  - endTime: ${lastCue.endTime}`);
        console.log(`  - text: ${lastCue.text}`);

        // Get WAV duration and validate last cue end time
        const wavDuration = await getAudioFileDuration(wavFiles[i]);
        console.log(`- WAV duration: ${wavDuration} seconds`);

        // Convert VTT timestamp (HH:MM:SS.mmm) to seconds
        const [hours, minutes, seconds] = lastCue.endTime.split(":");
        const [secs, millis] = seconds.split(".");
        const endTimeSeconds =
          parseInt(hours) * 3600 +
          parseInt(minutes) * 60 +
          parseInt(secs) +
          parseInt(millis) / 1000;

        console.log(`- last cue endTime (s): ${endTimeSeconds}s`);

        // Allow 1 second tolerance
        const isInRange = endTimeSeconds <= wavDuration + 1;
        console.log(`- last cue is in range: ${isInRange}`);

        if (isInRange) {
          console.log(
            `- [✓] last cue endTime (s) within 1s of WAV duration (s)`
          );
        } else {
          console.error(
            `- [✗] last cue endTime (s) exceeds WAV duration (s): ${endTimeSeconds}s > ${wavDuration}s`
          );
          isValid = false;
        }
      } else {
        console.warn(`No cues found in ${vttFiles[i]}`);
        isValid = false;
      }
    } catch (error) {
      console.error(
        `VTT file not found or error parsing: ${vttFiles[i]}`,
        error
      );
      isValid = false;
    }
  }

  // TODO: Verify cue ordering and continuity
  // TODO: Prepare for future concatenation with proper offsets

  if (isValid) {
    console.log("- [✓] VTT validation passed");
  } else {
    console.log("- [✗] VTT validation failed");
  }
  return isValid;
}

/**
 * Parse a VTT file content into an array of cues
 * @param {string} vtt - The VTT file content as a string
 * @returns {Array<{startTime: string, endTime: string, text: string}>} Array of cues
 */
function parseVTT(vtt) {
  const lines = vtt.split("\n");
  const cues = [];
  let currentCue = {
    startTime: "",
    endTime: "",
    text: "",
  };

  lines.forEach((line) => {
    if (line.startsWith("WEBVTT") || line.startsWith("NOTE")) {
      // Skip the header and notes
      return;
    }
    if (line.includes("-->")) {
      if (currentCue.text) {
        // Push the previous cue and reset
        cues.push(currentCue);
        currentCue = { startTime: "", endTime: "", text: "" };
      }
      const times = line.split("-->");
      currentCue.startTime = times[0].trim();
      currentCue.endTime = times[1].trim();
    } else if (line.trim() === "") {
      if (currentCue.text) {
        // Push the current cue if it has text and reset
        cues.push(currentCue);
        currentCue = { startTime: "", endTime: "", text: "" };
      }
    } else {
      currentCue.text += line.trim() + "\n"; // Append trimmed line and newline to text
    }
  });

  // Push the last cue if it has content
  if (currentCue.text.trim()) {
    cues.push(currentCue);
  }

  // trim the resulting cues
  return cues.map((cue) => ({
    startTime: cue.startTime,
    endTime: cue.endTime,
    text: cue.text.trim(),
  }));
}
