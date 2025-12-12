# whisper-bench

Experimental area for whisper-related workflows, separate from `../whisper-sh`.

## Purpose

To perform experiments that "look a lot like the code in `../whisper-sh`" but need to be isolated.
We aim to compare multiple Whisper implementations, verify input compatibility, and establish benchmarks.

## Experiments

### 1. Invocation Variants

We need to figure out how to invoke and configure the following four engines:

- `whisper-kit` (CLI)
- `whisper-cpp` (Homebrew installed)
- `whisper-cpp` (Self-compiled)
- `whisper-kit` (Via API/Library)

### 2. Input Compatibility

Previously, `whisper.cpp` was limited to 16kHz WAV files. We need to verify if newer versions support:

- MP3
- M4A
- M4B (Audiobooks)

#### Findings (32-bit Integer Limit)

Current `whisper-cpp` (Homebrew build) uses a signed 32-bit integer for sample counts, leading to an overflow for files longer than **~37 hours, 17 minutes** (at 16kHz).

- **Stalin2.m4b** (49h): **FAILED** (Integer Overflow / Hang)
- **Stalin1.m4b** (38h): **FAILED** (Integer Overflow / Hang)
- **Don Quixote.m4b** (36h 05m): **PASSED** (2,079,233,671 samples < 2,147,483,647 max)
- `samples/quixote.mp3`: 130k seconds (36h 05m). **PASSED**. Scanned successfully, 2.08 billion samples.
  - **Smoke Test**: `whisper-cli ... -d 3600000` (1 hour) PASSED. Generated valid JSON/VTT.

#### Prototype Conversion

If direct input is not supported or files are too large, we convert using `ffmpeg`.
Note: For `.m4b` files with cover art, use `-vn` to strip video streams to avoid hanging.

```bash
# Convert to MP3
ffmpeg -y -hide_banner -loglevel info -i samples/quixote.m4b -vn -c:a libmp3lame -q:a 4 samples/quixote.mp3

# Convert to WAV (16kHz, mono, PCM)
ffmpeg -y -hide_banner -loglevel info -i samples/quixote.m4b -vn -ar 16000 -ac 1 -c:a pcm_s16le samples/quixote.wav
```

### 3. Invocation Variants

Reference for invoking different Whisper implementations.

#### 1. `whisper-cli` (whisper.cpp - Homebrew)

- **Binary**: `whisper-cli`
- **Common Flags**:
  - `-m <model_path>`: Path to GGML/GGUF model file.
  - `-f <audio_file>`: Input file.
  - `-l <lang>`: Language (e.g., `en`).
  - `-t <threads>`: Number of threads (default: 4).
  - `-d <ms>`: Duration to process in milliseconds.
  - `-of <path>`: Output filename prefix (strip extension).
  - `-oj`, `-ovtt`: Output JSON and VTT files.
  - `-pp`: Print progress.
  - `-dtw <model>`: **Important**: Compute token-level timestamps (Dynamic Time Warping). May help with Jitter.

#### 2. `whisper-server` (whisper.cpp - Server)

- **Binary**: `whisper-server`
- **Purpose**: HTTP API server for `whisper.cpp`.
- **Key Flags**:
  - `--host <ip>`: Bind address (default: `127.0.0.1`).
  - `--port <port>`: Port (default: `8080`).
  - `--convert`: Convert audio to WAV (requires ffmpeg on server).
  - `--public <path>`: Path to static files.
  - `-m <model>`: Load model.

#### 3. `whisperkit-cli` (WhisperKit - Swift/Argmax)

- **Binary**: `whisperkit-cli`
- **Subcommands**: `transcribe`, `serve`
- **Common Flags**:
  - `--audio-path <path>`: Input audio file.
  - `--model <name>`: Model name (auto-downloads, e.g., `openai/whisper-tiny`).
  - `--language <lang>`: Language code.
  - `--report-path <dir>`: Directory to save report/output.
  - `--word-timestamps`: Enable word-level timestamps.
  - `--chunking-strategy <type>`: `vad` (default) or `none`.
  - `--concurrent-worker-count <N>`: Parallel inference workers (default: 4).

### 4. Benchmarking

- Measure speed and accuracy across different models and engines.
- Create a comparison matrix similar to `whisper.sh/bench.sh`.

### 5. Parallel Execution (Future)

- Explore performance gains from running multiple concurrent instances.
- Test strategies like splitting audiobooks into 1-hour segments for parallel processing.

#### Findings: Split & Stitch Risks

- **Timestamp Jitter**: Timestamps are not just "drifting" (linear error) but "jittering" (local inaccuracy).
  - **Global Inaccuracy**: Timestamps can be **3-4 seconds off** from the actual audio utterance anywhere in the file.
  - **Constraints**:
    - **Bookmarks**: High precision is needed. 4s error is unacceptable for chapter navigation.
    - **Stitching**: VTT files require **non-decreasing timestamps**. If Segment A ends at `01:00:02` and Segment B (hard-split at 1h) starts effectively at `01:00:00`, concatenating them creates a time regression (`...02` -> `...00`), breaking players. A mere concatenation strategy will fail; we need overlap and monotonicity enforcement.

## Stretch Goals

### Jitter / Timestamp Precision

- Verified: Timestamps are approximate and can drift beyond the strict audio cut-off.
- Need to determine if this error accumulates or is local to the segment boundary.

## Plan

- [ ] **Invocation**: Document CLI switches for all 4 variants
- [ ] **Compatibility**: Test M4B/MP3 direct input on all variants
- [ ] **Smoke Test**: Create a script to run a 10-minute sample on all 4
- [ ] **Benchmark**: Port/Adapt `bench.sh` for cross-engine comparison
- [ ] **Parallel**: Design a split-and-process experiment

### Helper Scripts

#### Find Audiobooks by Duration

Finds all `.m4b` files, extracts their duration, and sorts them to help find test candidates (e.g., just under the 37h limit).

```bash
find /Volumes/Space/Reading/audiobooks/ -name "*.m4b" -exec bash -c '
    file="{}"
    basename="${file##*/}"
    duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$file" 2>/dev/null)
    if [[ -n "$duration" ]]; then
        printf "%010.2f %s\n" "$duration" "$basename"
    fi
' \; | sort -n
```
