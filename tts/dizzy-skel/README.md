# dizzy-skel

Generate an audio drama from a screenplay featuring Dizzy (Diziet Sma), Skel
(Skaffen-Amtiskaw), and a Narrator — using Qwen3-TTS voice cloning via
mlx-audio.

## Tasks

- [x] Extract chapter text from the epub (get Chapter One as text)
- [ ] Extract an audio snippet from the m4b at a given timecode (ffmpeg)
- [ ] Re-transcribe an m4b snippet with whisper-cli (verify text matches)
- [ ] Prepare voice samples (narrator, Dizzy, Skel) with matching transcripts
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
