# Consolidating Whisper

I currently have 2 implementations of my whisper transcription wrapper/workflow:
The main workflow is to produce `.vtt` files from `.m4b` files. When the `.m4b`
files are too large (approx >~37h), they are segmented into smaller files, and
each segment is transcribed separately. and then the results have to be stitched
together to form a single `.vtt` file.

- `./whisper-sh`: initial implementation, has a bash version, and a node.js
  (.mjs) version
- `./whisper-bench`: more recent implementation, using deno

The both have complimentary scripts (I think all bash) which exercise the mains
scripts in each to perform some basic validation and benchmarking.

As this repo is a rather large monorepo, experimenting with many languages and
runtimes (node, deno,bun, elixir,..) It seems that for now the direction is to
use bun! in particular in the `bun-one/` directory, which is a mono-repo of
sorts, itself (workspaces) For context there is also a deno equivalent
experiment in `deno-one/`

SO my goal is to plan a consolidation of the whisper-sh and whisper-bench
scripts into bun/typesecript.

I think I should start with evaluation the two current implementations, to see
how they overlap, determine all the features I want to keep and what I want to
add.

I need to decide if one is complete enough to use as a basis, or if a rewrite
would be better.

In particular:

- whisper-sh has the beginnings of a segmentation phase: stitching has not been
  attempted I think
- whisper-bench has a deno version, with multiple "runners" i.e. underlying too
  for transcption ,and `whispercpp`, `whisperkit`
  - it has been determined that we will NOT use whisperkit, as we have proven it
    has aserious flaw (non-monotonic vtt cue timestamps) - so we will forego the
    multi-engin/runner paradigm - and only support a single runner engine
    (whisper-cpp; whisper-cli is the executable)
- The whisper-bench implementatio has a sophisticated progress reporting system
  (piping stdout/stderr to a progress reporter) which we want to keep in some
  capacity, as well a structured output directory conventions, for temp
  artifacts, which may be too complicated in some ways, and not flexible enough
  in others!

So I think the first task is to gather an inventory of the features of both
implementations, and determine what we want to keep, and what we want to add.

We should first produce a MARKDOWN (WHISPER-MIGRATION.md) document that
documents the features of both implementations. The second phase will be to
select the features we want to keep, and the features we want to add. The third
phase will be to evaluate our opetions for effecting the consolidation; porting
one of them vs a rewrite. The fourth phase will be to implement the
consolidation.

## Executive Summary (Research)

| Aspect             | whisper-sh                                | whisper-bench                          |
| ------------------ | ----------------------------------------- | -------------------------------------- |
| Runtime            | Bash + Node.js (.mjs)                     | Deno + TypeScript                      |
| Lines of Code      | ~1,100 (sh: 281, mjs: 730, bench.sh: 100) | ~1,500 (TS: ~1,200, sh: ~300)          |
| Target Engine      | whisper-cpp only                          | Multi-engine (whisperkit + whispercpp) |
| Segmentation       | Yes (ffmpeg segment muxer)                | No                                     |
| VTT Stitching      | No                                        | No                                     |
| Progress Reporting | Yes (basic)                               | Yes (sophisticated task monitors)      |
| VTT Validation     | Yes (last cue check)                      | Yes (monotonicity check)               |
| Benchmarking       | Yes (JSON + markdown)                     | Yes (JSON + markdown)                  |
| Dry-run Mode       | Yes                                       | Yes                                    |

## Feature Matrix

### Core Workflow

| Feature               | whisper-sh |   whisper-bench   | Notes                               |
| --------------------- | :--------: | :---------------: | ----------------------------------- |
| m4b to vtt pipeline   |    Yes     |        Yes        | Both handle full workflow           |
| m4b to wav conversion | Yes (auto) | Yes (conditional) | whisper-bench only converts .m4b    |
| Direct mp3 input      |     No     |        Yes        | whisper-cpp supports mp3 natively   |
| Duration limit (-d)   |    Yes     |        Yes        | Both support limiting transcription |
| Start offset (-s)     |     No     |        Yes        | whisper-bench supports start offset |
| Model selection (-m)  |    Yes     |        Yes        | tiny.en, base.en, small.en          |
| Thread control        |  Yes (-t)  |  Yes (--threads)  | -                                   |

### Segmentation and Stitching

| Feature                     |         whisper-sh         | whisper-bench | Notes                                |
| --------------------------- | :------------------------: | :-----------: | ------------------------------------ |
| Auto-segment if >37h        |            Yes             |      No       | whisper-sh uses ffmpeg segment muxer |
| Configurable segment length | Yes (--max-segment-length) |      No       | Default: 133200s (37h)               |
| VTT stitching               |             No             |      No       | GAP: Neither implements this         |
| Multiple wav to single vtt  |             No             |      No       | GAP: Needed for segmentation         |

whisper-sh segmentation approach:

```bash
# ffmpeg segment muxer flags
-f segment -segment_time ${SEGMENT_LENGTH}
-force_key_frames "expr:gte(t,n_forced*${SEGMENT_LENGTH})"
-reset_timestamps 1
```

### Progress Reporting

| Feature             |   whisper-sh    |  whisper-bench  | Notes                                     |
| ------------------- | :-------------: | :-------------: | ----------------------------------------- |
| Inline progress     |   Yes (basic)   | Yes (advanced)  | whisper-bench has TaskMonitor system      |
| Multi-task progress |       No        |       Yes       | whisper-bench tracks convert + transcribe |
| Regex-based parsing |       Yes       |       Yes       | Both parse whisper-cpp stderr             |
| Terminal clearing   | Yes (\x1b[2K\r) | Yes (\x1b[2K\r) | Same approach                             |

whisper-bench architecture:

```text
ProgressReporter <- TaskMonitor <- runTask() <- runWhisper()
```

- `ProgressReporter`: Stateful stderr writer (update/finish)
- `TaskMonitor`: Parses events (start/line/done/error)
- Factory monitors: `createWhisperCppMonitor()`, `createFFmpegMonitor()`

### VTT Handling

| Feature              |  whisper-sh  |  whisper-bench   | Notes                           |
| -------------------- | :----------: | :--------------: | ------------------------------- |
| VTT parsing          | Yes (inline) | Yes (lib/vtt.ts) | Similar implementations         |
| Last cue validation  |     Yes      |       Yes        | Check endTime vs audio duration |
| Monotonicity check   |      No      |       Yes        | Detect backward timestamp jumps |
| VTT summary stats    |      No      |       Yes        | cueCount, duration, violations  |
| Timestamp conversion |     Yes      |       Yes        | HH:MM:SS.mmm to seconds         |

### Validation and Sanity Checks

| Feature            |      whisper-sh      |    whisper-bench     | Notes                           |
| ------------------ | :------------------: | :------------------: | ------------------------------- |
| WAV duration check | Yes (sanityCheckWav) |          No          | Compare m4b vs wav durations    |
| VTT completeness   | Yes (sanityCheckVtt) |  Yes (summarizeVtt)  | Different approaches            |
| Preflight checks   |          No          | Yes (preflightCheck) | Check ffmpeg, whisper-cli exist |
| Input validation   |         Yes          |         Yes          | Directory/file existence        |
| Model validation   |         Yes          |         Yes          | Allowed model list              |

### Output and Artifacts

| Feature            | whisper-sh |            whisper-bench            | Notes                             |
| ------------------ | :--------: | :---------------------------------: | --------------------------------- |
| Output directory   | -o (flat)  |           --output (flat)           | Both use single output dir        |
| Work directory     |     No     | Yes (data/work/{name}-{timestamp}/) | Per-run isolation                 |
| Log files          |     No     |    Yes (stdout.log, stderr.log)     | Task execution logs               |
| Config persistence |     No     |        Yes (runconfig.json)         | Reproducibility                   |
| Tagging output     |     No     |             Yes (--tag)             | input.tag.vtt naming              |
| Skip existing      |    Yes     |                 No                  | whisper-sh skips if output exists |

### CLI and UX

| Feature          |    whisper-sh    |      whisper-bench      | Notes                      |
| ---------------- | :--------------: | :---------------------: | -------------------------- |
| Argument parsing | parseArgs (Node) |          yargs          | yargs is more feature-rich |
| Help generation  |  Manual usage()  |    Yes (yargs auto)     | Better DX                  |
| JSON output mode |        No        |      Yes (--json)       | For scripting/piping       |
| Verbosity levels |        No        |      Yes (-v, -vv)      | Progressive detail         |
| Word timestamps  |        No        | Yes (--word-timestamps) | Per-word timing            |
| Iterations       |        No        |   Yes (--iterations)    | Benchmark repeatability    |

### Benchmarking

| Feature             |       whisper-sh       | whisper-bench  | Notes                          |
| ------------------- | :--------------------: | :------------: | ------------------------------ |
| Benchmark script    |     Yes (bench.sh)     | Yes (bench.sh) | Both generate markdown         |
| JSON results        |     Yes (jq-based)     |  Yes (native)  | Both produce structured output |
| Multiple durations  |          Yes           |      Yes       | Test different lengths         |
| Multiple models     |          Yes           |      Yes       | Compare model performance      |
| Speedup calculation |          Yes           |      Yes       | audio_duration / elapsed       |
| Cost metrics        | Yes (whisperBench.mjs) |      Yes       | Prefer speedup (Nx) over s/h   |

## Architecture Comparison

### whisper-sh (Node.js)

```text
whisper.mjs
├── main()              # Entry point, arg parsing
├── processFiles()      # Batch processing loop
├── convertToWav()      # ffmpeg conversion with segmentation
├── sanityCheckWav()    # Duration validation
├── whisperTranscribe() # whisper-cli invocation
├── sanityCheckVtt()    # VTT validation
├── spawnAsync()        # Process execution with progress
└── parseVTT()          # VTT parsing
```

### whisper-bench (Deno/TypeScript)

```text
main.ts                 # Entry point, yargs CLI
lib/
├── runners.ts          # Runner abstraction layer
│   ├── runWhisper()    # Unified entry point
│   ├── runWhisperCpp() # whisper-cpp specific
│   └── runWhisperKit() # whisperkit specific (deprecated)
├── task.ts             # Task execution engine
│   ├── runTask()       # Spawn with monitoring
│   └── TaskMonitor     # Event-based progress
├── progress.ts         # ProgressReporter (stderr output)
├── audio.ts            # getAudioFileDuration()
├── vtt.ts              # VTT parsing + validation
├── preflight.ts        # Dependency checks
└── vtt-compare.ts      # VTT diff tooling (34KB)
```

## Key Technical Differences

### Process Execution

whisper-sh:

```javascript
// Node.js child_process with promisify
const proc = spawn("bash", ["-c", cmd], { stdio: ["inherit", "pipe", "pipe"] });
// Manual progress parsing in data events
```

whisper-bench:

```typescript
// Deno.Command (audio.ts) and Node spawn (task.ts)
// Event-driven TaskMonitor pattern
monitor.onEvent({ type: "line", stream: "stderr", line });
```

### Segmentation (whisper-sh only)

```javascript
// Expected wav files calculated upfront
const numSegments = Math.ceil(m4bDuration / MAX_SEGMENT_LENGTH);
expectedWavFiles = Array.from(
  { length: numSegments },
  (_, i) =>
    path.join(wavDir, `${wavBase}_part_${String(i).padStart(3, "0")}.wav`),
);

// ffmpeg segment muxer
cmd += ` -f segment -segment_time ${MAX_SEGMENT_LENGTH}`;
cmd += ` -force_key_frames "expr:gte(t,n_forced*${MAX_SEGMENT_LENGTH})"`;
```

### Multi-Engine Support (whisper-bench only)

```typescript
// Abstract runner pattern (to be simplified)
export type RunnerName = "whisperkit" | "whispercpp";

if (config.runner === "whispercpp") {
  result = await runWhisperCpp(config, reporter);
} else if (config.runner === "whisperkit") {
  result = await runWhisperKit(config, reporter);
}
```

## Gaps to Address in Consolidation

### Critical

- VTT Stitching: Neither implementation stitches multiple VTT files
  - Need: Offset adjustment for segment VTTs
  - Need: Monotonicity enforcement at boundaries
- Work Directory for whisper-sh: No per-run isolation
  - Risk: Overwriting intermediate files

### Important

- Preflight Checks: whisper-sh lacks dependency verification
- Skip Existing in whisper-bench: No cache/skip logic
- Logging: whisper-sh has no log persistence

### Nice-to-Have

- Word Timestamps: whisper-sh does not support
- Start Offset: whisper-sh does not support
- JSON Output Mode: whisper-sh lacks scripting mode
