# /// script
# dependencies = [
#   "mlx-audio>=0.0.1",
#   "soundfile>=0.12.1",
#   "numpy",
# ]
# ///

"""
Qwen3-TTS generator using the 1.7B CustomVoice model.
Supports named voices, optional instruct for style/emotion, and text from file.
Use --voice all and/or --instruct all to loop through combinations.

Usage:
    uv run --prerelease=allow basic.py --help
    uv run --prerelease=allow basic.py --text "Hello world" --voice "Aiden"
    uv run --prerelease=allow basic.py --voice all
    uv run --prerelease=allow basic.py --voice Aiden --instruct "cheerful and energetic"
    uv run --prerelease=allow basic.py --voice all --instruct all --play
    uv run --prerelease=allow basic.py --text-file speech.txt --voice Ryan
"""
import argparse
import re
import subprocess
import sys
from pathlib import Path
from mlx_audio.tts.utils import load_model
import soundfile as sf
import numpy as np

# =============================================================================
# MODEL — 1.7B CustomVoice supports named voices + instruct
# =============================================================================
# WARNING: Do NOT use 0.6B-CustomVoice or any Base model here.
#   - 0.6B-CustomVoice silently accepts unknown voices (no validation)
#   - Base models (0.6B AND 1.7B) have empty spk_id — voice param is ignored
#     (1.7B-Base tested and confirmed: get_supported_speakers() returns [])
#   - Only 1.7B-CustomVoice validates voices AND honors speaker embeddings
# =============================================================================
MODEL_ID = "mlx-community/Qwen3-TTS-12Hz-1.7B-CustomVoice-bf16"

DEFAULT_TEXT = "Instrumental Relations in Aristotle's Intrinsic Teleology by Laurence Lauzon"

AVAILABLE_VOICES = ["Ryan", "Aiden", "Vivian", "Serena", "Uncle_Fu", "Dylan", "Eric", "Ono_Anna", "Sohee"]

AVAILABLE_INSTRUCTS = [
    "serious and authoritative",
    "whispering, secretive",
]

def main():
    class Formatter(argparse.ArgumentDefaultsHelpFormatter, argparse.RawDescriptionHelpFormatter):
        pass

    parser = argparse.ArgumentParser(
        description="Qwen3-TTS Generator (1.7B CustomVoice)",
        epilog="""\
examples:
  uv run --prerelease=allow basic.py --text "Hello world" --voice "Aiden"
  uv run --prerelease=allow basic.py --voice all
  uv run --prerelease=allow basic.py --voice Aiden --instruct "cheerful and energetic"
  uv run --prerelease=allow basic.py --voice all --instruct all --play
  uv run --prerelease=allow basic.py --text-file these-laurence-edited.txt --voice Ryan""",
        formatter_class=Formatter,
    )
    text_group = parser.add_mutually_exclusive_group()
    text_group.add_argument("--text", type=str, default=None, help="Text to speak")
    text_group.add_argument("--text-file", type=str, default=None, help="Read text from file")
    parser.add_argument("--voice", type=str, default="Aiden", help=f"Voice name or 'all'. Available: {', '.join(AVAILABLE_VOICES)}")
    parser.add_argument("--instruct", type=str, default=None, help=f"Style/emotion instruction or 'all'. Examples: {', '.join(repr(i) for i in AVAILABLE_INSTRUCTS[:3])}")
    parser.add_argument("--output", type=str, default="data/outputs/output_basic.wav", help="Output WAV file")
    parser.add_argument("--play", action="store_true", help="Play audio after generation")

    args = parser.parse_args()

    # Resolve text input
    if args.text_file:
        text_path = Path(args.text_file)
        if not text_path.exists():
            print(f"Error: Text file '{text_path}' not found.")
            sys.exit(1)
        base_text = text_path.read_text().strip()
        if not base_text:
            print(f"Error: Text file '{text_path}' is empty.")
            sys.exit(1)
    else:
        base_text = args.text or DEFAULT_TEXT

    print(f"Loading model: {MODEL_ID}")
    print("Warning: Expect warning about tokenizer (possibly because of pre-release)\n")
    model = load_model(MODEL_ID)

    supported = model.get_supported_speakers()
    print(f"Model-supported speakers: {supported}")

    # Validate voice early (before expensive generation)
    if args.voice.lower() != "all" and args.voice.lower() not in supported:
        print(f"Error: Unknown voice '{args.voice}'. Available: {supported}")
        return

    # Determine voices and instructs to process
    voices_to_run = AVAILABLE_VOICES if args.voice.lower() == "all" else [args.voice]
    if args.instruct and args.instruct.lower() == "all":
        instructs_to_run = AVAILABLE_INSTRUCTS
    else:
        instructs_to_run = [args.instruct]  # [None] when not specified

    print(f"Voices: {', '.join(voices_to_run)}")
    if instructs_to_run != [None]:
        print(f"Instructs: {', '.join(instructs_to_run)}")

    # Process each voice × instruct combination
    for voice in voices_to_run:
        for instruct in instructs_to_run:
            label = voice
            if instruct:
                label += f" [{instruct}]"
            print(f"\n--- {label} ---")

            # Prepare text
            if len(voices_to_run) > 1:
                current_text = f"{voice} says: {base_text}"
            else:
                current_text = base_text

            # Prepare output filename
            p = Path(args.output)
            parts = [p.stem]
            if len(voices_to_run) > 1:
                parts.append(voice)
            if instruct:
                slug = re.sub(r'[^a-z0-9]+', '-', instruct.lower()).strip('-')
                parts.append(slug)
            if len(parts) > 1:
                current_output = str(p.parent / f"{'_'.join(parts)}{p.suffix}")
            else:
                current_output = args.output

            print(f"Text: {current_text[:80]}{'...' if len(current_text) > 80 else ''}")
            if instruct:
                print(f"Instruct: {instruct}")
            print(f"Generating audio...")

            results = list(model.generate(
                text=current_text,
                voice=voice,
                language="English",
                instruct=instruct,
            ))

            if not results:
                print(f"Error: No audio generated for {label}.")
                continue

            audio_array = results[0].audio

            Path(current_output).parent.mkdir(parents=True, exist_ok=True)
            sf.write(current_output, np.array(audio_array), model.sample_rate)

            print(f"Output: {current_output}")
            print(f"ffplay -autoexit -nodisp -hide_banner -loglevel error {current_output}")
            if args.play:
                subprocess.run(["ffplay", "-autoexit", "-nodisp", "-hide_banner", "-loglevel", "error", current_output])

if __name__ == "__main__":
    main()
