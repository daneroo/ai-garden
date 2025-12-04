#!/usr/bin/env bun

import { join } from "node:path";
import { parseArgs } from "node:util";
import { file, spawn } from "bun";

// --- Types ---
interface Chapter {
	id: number;
	start: number;
	end: number;
	title: string;
}

interface Metadata {
	chapters: Chapter[];
}

interface Word {
	word: string;
	start: number;
	end: number;
}

// --- CLI Argument Parsing ---
const { values, positionals } = parseArgs({
	args: Bun.argv,
	options: {
		whisper: {
			type: "boolean",
			short: "w",
			default: false,
		},
		play: {
			type: "boolean",
			short: "p",
			default: false,
		},
		dir: {
			type: "string",
			short: "d",
		},
		help: {
			type: "boolean",
			short: "h",
			default: false,
		},
	},
	strict: true,
	allowPositionals: true,
});

if (values.help) {
	console.log(`
Usage: bun validate-chapters.ts [options]

Options:
  -w, --whisper    Run Whisper transcription to find title end (default: false)
  -p, --play       Play audio segments with ffplay (default: false)
  -d, --dir <path> Path to audiobook directory (default: current hardcoded path)
  -h, --help       Show this help message
`);
	process.exit(0);
}

// --- Environment & Configuration ---
const SCRIPT_DIR = import.meta.dir;
const WHISPER_HOME = join(SCRIPT_DIR, "../external-repos/whisper.cpp");
const WHISPER_EXEC = "whisper-cli"; // Assumed to be in PATH or alias
const WHISPER_MODELS = join(WHISPER_HOME, "models");
const WHISPER_MODEL_PATH = join(WHISPER_MODELS, "ggml-base.en.bin");

const AUDIOBOOKS_ROOT =
	process.env.AUDIOBOOKS_ROOT || "/Volumes/Space/Reading/audiobooks";
// Use CLI arg --dir if provided, otherwise fall back to env var or default
const BOOK_DIR =
	values.dir ||
	process.env.BOOK_DIR ||
	join(AUDIOBOOKS_ROOT, "Emad Mostaque - The Last Economy");
const BOOKMARK_DURATION_DEFAULT = process.env.BOOKMARK_DURATION_DEFAULT || "4";

const RUN_FFPLAY = values.play;
const RUN_WHISPER = values.whisper;

const METADATA_FILE = join(BOOK_DIR, "metadata.json");

// --- Main Execution ---

await main();

async function main() {
	console.log("# CHAPTER BOOKMARK VALIDATION (Bun/TS)");
	console.log("");

	// 1. Validate Metadata File
	const metadataFile = file(METADATA_FILE);
	if (!(await metadataFile.exists())) {
		console.error(`Error: metadata.json not found at ${METADATA_FILE}`);
		process.exit(1);
	}

	// 2. Find Audio File
	const audioFile = await findAudioFile(BOOK_DIR);
	if (!audioFile) {
		console.error(`Error: .m4b file not found in ${BOOK_DIR}`);
		process.exit(1);
	}

	console.log(`- Processing: ${BOOK_DIR}`);
	console.log(`- Metadata: ${METADATA_FILE}`);
	console.log(`- Audio: ${audioFile}`);
	console.log("");

	// 3. Parse Metadata
	const metadata = (await metadataFile.json()) as Metadata;

	console.log("## Chapters");
	console.log("");

	for (const chapter of metadata.chapters) {
		const { id, start, end, title } = chapter;

		console.log(`### Chapter ${id}: ${title}`);
		console.log("");
		console.log(`- Start: ${start}s`);
		console.log(`- End: ${end}s`);

		// Process Start & Find Title End
		await playSegment(
			start,
			BOOKMARK_DURATION_DEFAULT,
			`Chapter ${id} Start`,
			audioFile,
		);

		if (RUN_WHISPER) {
			await findTitleEnd(start, title, audioFile);
		} else {
			console.log("  (Set RUN_WHISPER=true to analyze title end)");
		}
		console.log("");
	}
}

// --- Helper Functions (Top-Down Order) ---

async function findAudioFile(dir: string): Promise<string | null> {
	const proc = spawn(["find", dir, "-name", "*.m4b", "-type", "f"], {
		stdout: "pipe",
	});
	if (!proc.stdout) return null;
	const output = await new Response(proc.stdout).text();
	const lines = output.trim().split("\n");
	return lines.length > 0 && lines[0] !== "" ? (lines[0] ?? null) : null;
}

async function playSegment(
	start: number,
	duration: string,
	label: string,
	audioFile: string,
) {
	const ffplayArgs = [
		"ffplay",
		"-ss",
		start.toString(),
		"-t",
		duration,
		"-autoexit",
		"-nodisp",
		"-i",
		audioFile,
	];
	const ffplayCmdStr = `ffplay -ss ${start} -t ${duration} -autoexit -nodisp -i "${audioFile}"`;
	console.log(`- ffplay command (${label}): \`${ffplayCmdStr}\``);

	if (RUN_FFPLAY) {
		console.log(`Playing ${label}...`);
		spawn(ffplayArgs, { stdout: "ignore", stderr: "ignore" });
		console.log("");
	}
}

async function findTitleEnd(
	start: number,
	expectedTitle: string,
	audioFile: string,
) {
	// Transcribe 15s
	const vttOutput = await runWhisper(start, "15", audioFile);
	if (!vttOutput) return;

	const words = parseVtt(vttOutput);

	const endTime = findTitleEndTimestamp(expectedTitle, words);

	if (endTime !== null) {
		console.log(
			`  > Title End Found: ${endTime.toFixed(3)}s (Duration: ${(endTime).toFixed(3)}s from start)`,
		);
	} else {
		console.log(`  > Title End NOT Found. Expected: "${expectedTitle}"`);
		console.log("  > Transcribed words:");
		console.log(
			words
				.map((w) => `    [${w.start.toFixed(2)}-${w.end.toFixed(2)}] ${w.word}`)
				.join("\n"),
		);
	}
}

async function runWhisper(
	start: number,
	duration: string,
	audioFile: string,
): Promise<string> {
	const ffmpegArgs = [
		"ffmpeg",
		"-v",
		"error",
		"-ss",
		start.toString(),
		"-t",
		duration,
		"-i",
		audioFile,
		"-ar",
		"16000",
		"-ac",
		"1",
		"-c:a",
		"pcm_s16le",
		"-f",
		"wav",
		"-",
	];

	const whisperArgs = [
		WHISPER_EXEC,
		"-m",
		WHISPER_MODEL_PATH,
		"-f",
		"-",
		"--max-len",
		"1",
		"--split-on-word",
		"--output-vtt",
	];

	if (!RUN_WHISPER) return "";

	const ffmpegProc = spawn(ffmpegArgs, { stdout: "pipe", stderr: "ignore" });
	const whisperProc = spawn(whisperArgs, {
		stdin: ffmpegProc.stdout,
		stdout: "pipe",
		stderr: "ignore",
	});

	const output = await new Response(whisperProc.stdout).text();
	await whisperProc.exited;
	return output;
}

function parseVtt(vtt: string): Word[] {
	const lines = vtt.split("\n");
	const words: Word[] = [];
	let currentStart = 0;
	let currentEnd = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		// Timestamp line: 00:00:00.000 --> 00:00:00.100
		const timeMatch = line.match(
			/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/,
		);
		if (timeMatch?.[1] && timeMatch[2]) {
			currentStart = parseTime(timeMatch[1]);
			currentEnd = parseTime(timeMatch[2]);
		} else if (line && !line.startsWith("WEBVTT")) {
			// Text line (word)
			words.push({ word: line, start: currentStart, end: currentEnd });
		}
	}
	return words;
}

function parseTime(timeStr: string): number {
	const [h, m, s] = timeStr.split(":");
	return parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s);
}

function findTitleEndTimestamp(title: string, words: Word[]): number | null {
	const titleWords = title
		.split(/\s+/)
		.map(normalize)
		.filter((w) => w.length > 0);
	const transWords = words.map((w) => normalize(w.word));

	if (titleWords.length === 0 || transWords.length === 0) return null;

	// Sliding window approach
	let bestWindowIndex = -1;
	let minDistance = Infinity;

	// We slide a window of size titleWords.length over the transcribed words
	for (let i = 0; i <= transWords.length - titleWords.length; i++) {
		let currentDistance = 0;
		for (let j = 0; j < titleWords.length; j++) {
			const tWord = titleWords[j];
			const wWord = transWords[i + j];
			if (tWord && wWord) {
				currentDistance += levenshtein(tWord, wWord);
			}
		}

		if (currentDistance < minDistance) {
			minDistance = currentDistance;
			bestWindowIndex = i;
		}
	}

	// Calculate average distance per word to determine if it's a "good enough" match
	const totalLength = titleWords.reduce((sum, w) => sum + w.length, 0);
	const threshold = totalLength * 0.4;

	if (bestWindowIndex !== -1 && minDistance <= threshold) {
		// Found a match!
		// Return the end time of the last word in the window
		const lastWordIndex = bestWindowIndex + titleWords.length - 1;
		if (lastWordIndex >= 0 && lastWordIndex < words.length) {
			const lastWord = words[lastWordIndex];
			return lastWord.end;
		}
	}

	return null;
}

function normalize(s: string) {
	return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function levenshtein(a: string, b: string): number {
	const matrix = [];

	for (let i = 0; i <= b.length; i++) {
		matrix[i] = [i];
	}

	for (let j = 0; j <= a.length; j++) {
		matrix[0][j] = j;
	}

	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1, // substitution
					Math.min(
						matrix[i][j - 1] + 1, // insertion
						matrix[i - 1][j] + 1, // deletion
					),
				);
			}
		}
	}

	return matrix[b.length][a.length];
}
