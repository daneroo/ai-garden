# Qwen3 TTS Example

## TODO (remove when all is done)

- Tune voice prompt (e.g. "motivated, classical academic").
- Cache generated voice model (generation is time consuming).
- [x] Add `ffplay` integration or instructions for immediate playback.
- Create an integrated script for all examples.

A first example of using Qwen3 TTS to generate audio from text. This model is
quite powerful, featuring capabilities for **Voice Cloning** and **Voice
Design** (prompted voice styles).

## References

- [mlx-audio](https://github.com/Blaizzy/mlx-audio)
- [Qwen3-TTS Documentation](https://github.com/Blaizzy/mlx-audio/blob/main/mlx_audio/tts/models/qwen3_tts/README.md)
- [Simon Willison's Qwen3 TTS Example](https://github.com/simonw/tools/blob/main/python/q3_tts.py)
- [Simon Willison's Blog Post](https://simonwillison.net/2026/Jan/22/qwen3-tts/)

## Usage

We provide two scripts: `simple.py` for predefined voices and `speak.py` for
prompted Voice Design.

### Predefined Voices (`simple.py`)

Uses the `Base` model to generate speech with one of the built-in voices.

```bash
# List available voices
uv run --prerelease=allow simple.py --list-voices

# Generate audio (Default: "Aiden", speaks Thesis Title)
# Output: data/outputs/output_simple.wav
# Use --play to automatically play the result with ffplay
uv run --prerelease=allow simple.py --play

# Custom usage
uv run --prerelease=allow simple.py --text "Hello world" --voice "Vivian" --output data/outputs/hello.wav
```

**Available Voices:**

- **English:** Ryan, Aiden
- **Chinese:** Vivian, Serena, Uncle_Fu, Dylan, Eric

### Voice Design (`speak.py`)

Uses the `VoiceDesign` model (1.7B) to generate a voice based on a text prompt.

```bash
# Generate audio with default prompt ("motivated, classical academic")
# Output: data/outputs/output_speak.wav
uv run --prerelease=allow speak.py --play

# Custom prompt
uv run --prerelease=allow speak.py --prompt "A cheerful, energetic young narrator"
```

**Note:** The `--prerelease=allow` flag is currently required because
`mlx-audio` depends on a pre-release version of `transformers`.

### Voice Cloning (`clone.py`)

Uses the `Base` model to clone a voice from a reference audio file (`.wav`).

1. **Extract Reference:** You need a short audio clip (single speaker).
2. **Transcribe:** You need the exact text spoken in the clip.

```bash
# Auto-setup (using default sample at data/reference/reference_voice.wav)
uv run --prerelease=allow clone.py --ref-text "In a hole in the ground there lived a hobbit." --play
```

**Note:** For best results, ensuring the `ref-text` matches the audio exactly is
crucial. **Note:** All scripts support the `--play` flag to immediately play the
generated audio using `ffplay`.

## Listening to the Output

We recommend using `ffplay` (part of `ffmpeg`) for a quiet playback experience:

```bash
ffplay -autoexit -nodisp -hide_banner -loglevel error data/outputs/output_simple.wav
```

## Model Caching

Models are automatically downloaded and cached by Hugging Face libraries.
Location: `~/.cache/huggingface/hub/models--Qwen--Qwen3-TTS...`

These models can be large (approx. 4.3 GB). You can inspect the cache size with:

```bash
du -hd1 ~/.cache/huggingface/hub/
```
