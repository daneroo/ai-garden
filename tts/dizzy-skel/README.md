# dizzy-skel

Generate an audio drama from a screenplay featuring Dizzy (Diziet Sma), Skel
(Skaffen-Amtiskaw), and a Narrator — using Qwen3-TTS voice cloning via
mlx-audio.

## Tasks

- [x] Extract chapter text from the epub (get Chapter One as text)
- [ ] Extract an audio snippet from the m4b at a given timecode (ffmpeg)
- [ ] Re-transcribe an m4b snippet with whisper-cli (verify text matches)
- [ ] Prepare voice samples (narrator, Dizzy, Skel) with matching transcripts
- [ ] Speak a text using a cloned voice
- [ ] Write a screenplay
- [ ] Generate cloned audio per line
- [ ] Stitch parts into one audio file

## Notes

```bash
alias dizzy='uv run --prerelease=allow main.py'
dizzy epub --chapter "One">data/use-of-weapons-chapter-one.txt
```

## Pipeline

- Write a screenplay with speaker labels and lines
- Extract reference audio + text for each speaker from an audiobook
- Clone each speaker's voice to generate audio per line
- Stitch all parts into one audio file

## Voice Preparation

Source material: an audiobook of Use of Weapons (all three voices present) plus
its transcription and the reference ebook for locating passages.

Each speaker needs:

- A short (~15-20s) reference audio clip (WAV, 24kHz mono)
- The matching transcript text

### Locating a passage in the audiobook

- Get chapter text from the epub (by title)
- Get chapter offset in the m4b (by chapter marker title)
- Confirm they match (same chapter name in both)
- Search the VTT around that time offset for the expected text
- Validate the VTT text matches the epub text

Example: Chapter "One" starts at m4b marker 00:26:28, VTT has "She made her way
through the turbine hall" at 00:26:32 — within a few seconds.

### VTT transcription

The full-book VTT is in `data/vtt/`. Generated with whisper-cli (~10 min):

```bash
cd bun-one/apps/whisper
bun run whisper.ts -i "/Volumes/Space/Reading/audiobooks/Iain M. Banks - Culture Novels/Iain M. Banks - Culture 03 - Use Of Weapons/Iain M. Banks - Culture 03 - Use Of Weapons.m4b" -m tiny.en
```

## Expanded Workflow Example

Using Use of Weapons, Chapter One (has all three voices).

### 1. Transcribe the entire audiobook (done elsewhere, once)

```bash
cd bun-one/apps/whisper
bun run whisper.ts -i ".../Iain M. Banks - Culture 03 - Use Of Weapons.m4b" -m tiny.en
```

Result: `data/vtt/Iain M. Banks - Culture 03 - Use Of Weapons.vtt`

### 2. Extract chapter text from the epub

```bash
dizzy epub --chapter "One" > data/use-of-weapons-chapter-one.txt
```

### 3. Identify voice samples (manual / LLM-assisted)

Read the chapter text and the VTT to find passages where each voice speaks
clearly, with enough length (~15-20s) for voice cloning.

Kenny (narrator):

```vtt
00:26:49.000 --> 00:26:55.000
Music filled the echoing space above the ancient gleaming machines, sitting silently amongst

00:26:55.000 --> 00:26:58.000
the chattering throng of gaily dressed partygoers.

00:26:58.000 --> 00:27:03.000
She bowed graciously and smiled to a passing admiral and twirled a delicate black flower
```

Skel (Skaffen-Amtiskaw):

```vtt
00:42:08.840 --> 00:42:13.840
The two men know each other too well for anything other than the real zakawae to work.

00:42:13.840 --> 00:42:18.240
Likewise, soldering bay chai and the political machine throughout the entire system, too many

00:42:18.240 --> 00:42:20.200
memories involved altogether."
```

Dizzy (Diziet Sma):

```vtt
00:45:18.480 --> 00:45:22.760
Make my apologies to the system time's hacks, have them taken back to the city and released,

00:45:22.760 --> 00:45:25.000
give them a bottle of night floor each.

00:45:25.000 --> 00:45:30.680
Council of photographer, give him one still camera and let him take 64 snaps, strictly

00:45:30.680 --> 00:45:32.560
for permission required.

00:45:32.560 --> 00:45:36.200
Have one of the male staff find Railstocks a sep in and invite into my apartments in

00:45:36.200 --> 00:45:37.200
two hours.
```

### 4. Refine timecodes and verify audio

For each voice, use `vtt-search` to confirm the VTT timecodes, `play` to
audition boundaries (jitter start ±1s), and `--verify` to re-transcribe.

Kenny (narrator) — 00:26:49 to ~00:27:08 (~19s):

```bash
dizzy vtt-search --at 00:26:49 --search "gleaming" --verify
dizzy play --start 00:26:49 --duration 3
dizzy play --start 00:26:48 --duration 3
```

Skel (Skaffen-Amtiskaw) — 00:42:08.8 to ~00:42:20 (~12s):

```bash
dizzy vtt-search --at 00:42:08 --search "zakawae" --verify
dizzy play --start 00:42:08 --duration 3
dizzy play --start 00:42:07 --duration 3
```

Dizzy (Diziet Sma) — 00:45:18.5 to ~00:45:37 (~19s):

```bash
dizzy vtt-search --at 00:45:18 --window 25 --verify
dizzy play --start 00:45:18 --duration 3
dizzy play --start 00:45:17 --duration 3
```

### 5. Prepare voice samples with canonical text

Once timecodes are confirmed, extract the sample with canonical text from the
epub (not whisper output — whisper gets names and words wrong).

Kenny (narrator):

```bash
dizzy prepare-voice-sample --start 00:26:49 --duration 19 --name kenny \
  --text "Music filled the echoing space above the ancient, gleaming machines, sitting silently amongst the chattering throng of gaily dressed partygoers. She bowed graciously and smiled to a passing admiral and twirled a delicate black flower in her hand, putting the bloom to her nose to draw in its heady fragrance."
```

Skel (Skaffen-Amtiskaw):

```bash
dizzy prepare-voice-sample --start 00:42:08.8 --duration 12 --name skel \
  --text "The two men know each other too well for anything other than the real Zakalwe to work . . . likewise Tsoldrin Beychae and the political machine throughout the entire system. Too many memories involved altogether."
```

Dizzy (Diziet Sma):

```bash
dizzy prepare-voice-sample --start 00:45:18.5 --duration 19 --name dizzy \
  --text "Make my apologies to the System Times hacks, have them taken back to the city and released; give them a bottle of nightflor each. Cancel the photographer, give him one still camera and let him take sixty-four snaps, strictly full permission required. Have one of the male staff find Relstoch Sussepin and invite him to my apartments in two hours."
```

Result: `data/voice-samples/{kenny,skel,dizzy}.wav` + `.txt`

### 6. Speak using cloned voices

```bash
dizzy speak --voice kenny --text "Hello from the Culture" --play
dizzy speak --voice skel --text "I'm afraid I can't do that, Dizzy." --play
dizzy speak --voice dizzy --text "Skel, turn on the espresso machine." --play
```

### 7. (TODO) Write screenplay, generate, stitch

## Benchmark: model variants

`bench-models.py` compares all Qwen3-TTS model variants (0.6B/1.7B,
Base/CustomVoice, bf16/8bit/4bit) for generation speed with voice cloning vs
built-in speakers.

Results (Mac Mini M2 Pro, 3 iters, 5s cooldown). Speedup = audio_duration /
gen_time (> 1.0 = faster than realtime):

| Model     | Base Gen     | Base Speedup | CV Gen      | CV Speedup  |
| --------- | ------------ | ------------ | ----------- | ----------- |
| 0.6B bf16 | 14.11 ±1.80s | 0.42 ±0.04x  | 6.66 ±0.86s | 0.94 ±0.12x |
| 0.6B 8bit | 5.87 ±1.26s  | 1.20 ±0.06x  | 5.69 ±0.84s | 1.25 ±0.11x |
| 0.6B 4bit | 5.39 ±0.49s  | 1.19 ±0.12x  | 7.53 ±1.65s | 1.33 ±0.19x |
| 1.7B bf16 | 19.72 ±3.11s | 0.29 ±0.04x  | 7.50 ±1.92s | 0.70 ±0.12x |
| 1.7B 8bit | 6.99 ±0.61s  | 0.92 ±0.08x  | 5.10 ±0.57s | 1.16 ±0.02x |
| 1.7B 4bit | 5.87 ±0.50s  | 1.08 ±0.06x  | 5.80 ±0.71s | 1.09 ±0.13x |

Conclusion: quantized models (4bit/8bit) all run near realtime regardless of
size. CustomVoice (built-in speakers) is NOT necessary — voice cloning with Base
models performs equally well when quantized.

## Dependencies

- [mlx-audio](https://github.com/Blaizzy/mlx-audio) >= 0.3.1
- uv (with `--prerelease=allow` due to transitive `transformers==5.0.0rc3` pin)
- ffmpeg (audio extraction and stitching)

## References

- [mlx-audio Qwen3-TTS docs](https://github.com/Blaizzy/mlx-audio/blob/main/mlx_audio/tts/models/qwen3_tts/README.md)
- [../qwen3-tts](../qwen3-tts/) — earlier experiments with voice cloning and
  custom voices
- [chapter-marks-match/validate-chapters.ts](../../chapter-marks-match/validate-chapters.ts)
  — aligns epub chapter titles to spoken audio via VTT timecodes; similar
  pattern for locating dialogue passages
