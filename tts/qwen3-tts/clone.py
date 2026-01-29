# /// script
# dependencies = [
#   "mlx-audio>=0.0.1",
#   "soundfile>=0.12.1",
#   "numpy",
#   "mlx",
# ]
# ///

"""
Qwen3-TTS voice cloning generator.
Uses the Base model to clone a voice from a reference audio sample.

Usage:
    uv run --prerelease=allow clone.py --help
    uv run --prerelease=allow clone.py --voice serkis --play
    uv run --prerelease=allow clone.py --voice kenny --play
    uv run --prerelease=allow clone.py --ref-audio my.wav --ref-text "transcript..."
"""
import argparse
import sys
import subprocess
from pathlib import Path
from mlx_audio.tts.utils import load_model

DEFAULT_TEXT_FILE = "these-laurence-edited.txt"

# Preset voices: name -> (audio_path, whisper-cli transcription)
# Reference audio is NOT checked into git (data/ is gitignored).
# See README.md for extraction instructions.
VOICES = {
    "serkis": (
        "data/reference/reference_voice_serkis.wav",
        "In a hole, in the ground, they lived a hobbit, not a nasty, dirty, wet hole "
        "filled with the ends of worms and an oozy smell, knowing it a dry, bare, sandy "
        "hole with nothing in it to sit down on or to eat. It was a hobbit hole.",
    ),
    "kenny": (
        "data/reference/reference_voice_kenny.wav",
        "This is the story of a man who went far away for a long time, just to play a game. "
        "The man is a game player called Gergig. "
        "The story starts with a battle that is not a battle, and ends with a game that is not a game.",
    ),
}

def main():
    class Formatter(argparse.ArgumentDefaultsHelpFormatter, argparse.RawDescriptionHelpFormatter):
        pass

    parser = argparse.ArgumentParser(
        description="Qwen3-TTS Voice Cloning Generator (Base model)",
        epilog=f"""\
preset voices: {', '.join(VOICES.keys())}

setup (extract reference clips — run once):
  ./prepare-reference-voices.sh

examples:
  uv run --prerelease=allow clone.py --voice serkis --play
  uv run --prerelease=allow clone.py --voice kenny --play
  uv run --prerelease=allow clone.py --ref-audio my.wav --ref-text "transcript..." """,
        formatter_class=Formatter,
    )
    parser.add_argument("--text-file", type=str, default=DEFAULT_TEXT_FILE, help="Path to target text file")
    parser.add_argument("--voice", type=str, default=None, help=f"Preset voice: {', '.join(VOICES.keys())}")
    parser.add_argument("--ref-audio", type=str, default=None, help="Path to reference audio file")
    parser.add_argument("--ref-text", type=str, default=None, help="Transcript of reference audio")
    parser.add_argument("--output", type=str, default="data/outputs/output_clone.wav", help="Output WAV file")
    parser.add_argument("--play", action="store_true", help="Play audio after generation")

    args = parser.parse_args()

    # Check if preset reference files exist
    missing = [name for name, (path, _) in VOICES.items() if not Path(path).exists()]
    if missing:
        print(f"Missing reference audio for: {', '.join(missing)}")
        print("Run: ./prepare-reference-voices.sh")
        if not args.ref_audio:
            sys.exit(1)

    # Resolve voice preset vs manual ref-audio/ref-text
    if args.voice:
        if args.voice.lower() not in VOICES:
            print(f"Error: Unknown voice '{args.voice}'. Available: {', '.join(VOICES.keys())}")
            sys.exit(1)
        ref_audio_path, ref_text = VOICES[args.voice.lower()]
        ref_audio_path = Path(ref_audio_path)
        # Default output includes voice name
        if args.output == "data/outputs/output_clone.wav":
            p = Path(args.output)
            args.output = str(p.parent / f"{p.stem}_{args.voice.lower()}{p.suffix}")
        print(f"Using preset voice: {args.voice}")
    elif args.ref_audio and args.ref_text:
        ref_audio_path = Path(args.ref_audio)
        ref_text = args.ref_text
    else:
        print("Error: Provide --voice <preset> or both --ref-audio and --ref-text.")
        sys.exit(1)

    # Read target text
    text_path = Path(args.text_file)
    if not text_path.exists():
        print(f"Error: Text file '{text_path}' not found.")
        sys.exit(1)

    text = text_path.read_text().strip()
    if not text:
        print(f"Error: Text file '{text_path}' is empty.")
        sys.exit(1)

    # Verify reference audio
    if not ref_audio_path.exists():
        print(f"Error: Reference audio '{ref_audio_path}' not found.")
        print("See README.md for extraction instructions.")
        sys.exit(1)

    print(f"Loading Base model (Qwen3-TTS) for cloning...")
    print("Warning: Expect warning about tokenizer (possibly because of pre-release)\n")
    model = load_model("mlx-community/Qwen3-TTS-12Hz-0.6B-Base-bf16")

    # Load reference audio
    import soundfile as sf
    import numpy as np
    import mlx.core as mx

    ref_audio_data, _ = sf.read(str(ref_audio_path))
    if ref_audio_data.ndim > 1:
        ref_audio_data = ref_audio_data.mean(axis=1)
    ref_audio_mx = mx.array(ref_audio_data)

    print(f"Generating cloned audio...")
    print(f"Reference: {ref_audio_path}")
    print(f"Ref text: {ref_text[:80]}...")
    print(f"Target text: {text[:80]}...")

    results = list(model.generate(
        text=text,
        ref_audio=ref_audio_mx,
        ref_text=ref_text,
        language="English",
    ))

    if not results:
        print("Error: No audio generated.")
        return

    audio_array = results[0].audio

    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    sf.write(args.output, np.array(audio_array), model.sample_rate)
    
    print(f"Output: {args.output}")
    print(f"ffplay -autoexit -nodisp -hide_banner -loglevel error {args.output}")
    if args.play:
        subprocess.run(["ffplay", "-autoexit", "-nodisp", "-hide_banner", "-loglevel", "error", args.output])

if __name__ == "__main__":
    main()
