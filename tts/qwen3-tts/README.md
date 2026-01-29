# Qwen3-TTS

Always use `uv` with `--prerelease=allow` (mlx-audio is pre-release).

## Scripts

### `basic.py` — Predefined voices + instruct

Uses the 1.7B CustomVoice model. Supports named voices, optional style/emotion
instruct, text from file, and `--voice all` / `--instruct all` to loop.

```bash
uv run --prerelease=allow basic.py --help
```

### `clone.py` — Voice cloning

Uses the Base model to clone a voice from a reference audio sample.
Preset voices: `serkis`, `kenny`.

```bash
uv run --prerelease=allow clone.py --help

# Setup (run once — extracts reference clips from audiobooks)
./prepare-reference-voices.sh

# Clone
uv run --prerelease=allow clone.py --voice serkis --play
uv run --prerelease=allow clone.py --voice kenny --play
```

Reference audio is **not checked into git** (`data/` is gitignored).

## TODO

- `basic.py`: loops sometimes hang
- Test clone.py with 1.7B Base model (currently uses 0.6B per docs)

## References

- [mlx-audio](https://github.com/Blaizzy/mlx-audio)
- [Qwen3-TTS Documentation](https://github.com/Blaizzy/mlx-audio/blob/main/mlx_audio/tts/models/qwen3_tts/README.md)
- [Simon Willison's Qwen3 TTS Example](https://github.com/simonw/tools/blob/main/python/q3_tts.py)
- [Simon Willison's Blog Post](https://simonwillison.net/2026/Jan/22/qwen3-tts/)
