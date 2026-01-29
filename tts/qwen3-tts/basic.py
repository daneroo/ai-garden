# /// script
# dependencies = [
#   "mlx-audio>=0.0.1",
#   "soundfile>=0.12.1",
#   "numpy",
# ]
# ///

"""
Basic Qwen3-TTS generator using the Base model (following official docs).
Includes support for looping through all voices.

Usage:
    uv run --prerelease=allow basic.py --help
    uv run --prerelease=allow basic.py --text "Hello world" --voice "Aiden"
    uv run --prerelease=allow basic.py --voice all
"""
import argparse
import subprocess
from pathlib import Path
from mlx_audio.tts.utils import load_model
import soundfile as sf
import numpy as np

# Default text
DEFAULT_TEXT = "Instrumental Relations in Aristotle’s Intrinsic Teleology by Laurence Lauzon"

# Known voices (derived from model error messages/docs)
AVAILABLE_VOICES = ["Ryan", "Aiden", "Vivian", "Serena", "Uncle_Fu", "Dylan", "Eric", "Ono_Anna", "Sohee"]

def main():
    parser = argparse.ArgumentParser(description="Basic Qwen3-TTS Generator (Base Model)", formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument("--text", type=str, default=DEFAULT_TEXT, help="Text to speak")
    parser.add_argument("--voice", type=str, default="Aiden", help=f"Voice name. Available: {', '.join(AVAILABLE_VOICES)}")
    parser.add_argument("--output", type=str, default="data/outputs/output_basic.wav", help="Output WAV file")
    parser.add_argument("--play", action="store_true", help="Play audio after generation")
    
    args = parser.parse_args()

    print(f"Loading Base model (Qwen3-TTS)...")
    # Base model as per docs
    model = load_model("mlx-community/Qwen3-TTS-12Hz-0.6B-Base-bf16")

    # Determine voices to process
    if args.voice.lower() == "all":
        voices_to_run = AVAILABLE_VOICES
        print(f"Generating for ALL voices: {', '.join(voices_to_run)}")
    else:
        voices_to_run = [args.voice]

    # Process each voice
    for voice in voices_to_run:
        print(f"\n--- Processing Voice: {voice} ---")
        
        # Prepare filename and text
        if args.voice.lower() == "all":
            p = Path(args.output)
            current_output = str(p.parent / f"{p.stem}_{voice}{p.suffix}")
            current_text = f"{voice} says: {args.text}"
        else:
            current_output = args.output
            current_text = args.text
            
        print(f"Voice: {voice}")
        print(f"Generating audio...")
        print(f"Text: {current_text}")
        
        # Generate audio (Strict adherence to docs for Base model)
        try:
            results = list(model.generate(
                text=current_text,
                voice=voice,
                language="English",
            ))
            
            if not results:
                print(f"Error: No audio generated for {voice}.")
                continue

            audio_array = results[0].audio
            
            # Save
            Path(current_output).parent.mkdir(parents=True, exist_ok=True)
            sf.write(current_output, np.array(audio_array), 24000)
            
            print(f"Output: {current_output}")
            if args.play:
                subprocess.run(["ffplay", "-autoexit", "-nodisp", "-hide_banner", "-loglevel", "error", current_output])
            else:
                print(f"Play with:\nffplay -autoexit -nodisp -hide_banner -loglevel error {current_output}")

        except Exception as e:
            print(f"Error processing {voice}: {e}")

if __name__ == "__main__":
    main()
