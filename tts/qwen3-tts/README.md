# Qwen3-TTS

Always use `uv` with `--prerelease=allow` (mlx-audio is pre-release).

## TODO

- Could we use `qwen3-tts` for long-form narration (epub)?
  - custom model caching, runtime characteristics, with content length
- Compare 0.6B vs 1.7B clone quality (both work, 1.7B is default)
- `basic.py`: loops sometimes hang

## Usage

### `basic.py` — Predefined voices + instruct

Uses the 1.7B CustomVoice model. Supports named voices, optional style/emotion
instruct, text from file, and `--voice all` / `--instruct all` to loop.

```bash
uv run --prerelease=allow basic.py --help
```

### `clone.py` — Voice cloning

Uses a Base model to clone a voice from a reference audio sample. Both 0.6B and
1.7B Base models work (1.7B is default). Preset voices: `serkis`, `kenny`.

```bash
uv run --prerelease=allow clone.py --help

# Setup (run once — extracts reference clips from audiobooks)
./prepare-reference-voices.sh

# Clone
uv run --prerelease=allow clone.py --voice serkis --play
uv run --prerelease=allow clone.py --voice kenny --play
```

Reference audio is **not checked into git** (`data/` is gitignored).

## References

- [mlx-audio](https://github.com/Blaizzy/mlx-audio)
- [Qwen3-TTS Documentation](https://github.com/Blaizzy/mlx-audio/blob/main/mlx_audio/tts/models/qwen3_tts/README.md)
- [Simon Willison's Qwen3 TTS Example](https://github.com/simonw/tools/blob/main/python/q3_tts.py)
- [Simon Willison's Blog Post](https://simonwillison.net/2026/Jan/22/qwen3-tts/)
