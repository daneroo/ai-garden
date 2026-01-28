# /// script
# dependencies = [
#   "mlx-audio>=0.0.1",
#   "soundfile>=0.12.1",
#   "numpy",
# ]
# ///

"""
Simple Qwen3-TTS generator using the Base model.
Usage:
    uv run simple.py --list-voices
    uv run simple.py --text "Hello world" --voice "Aiden"
"""
import argparse
import sys
import subprocess
from mlx_audio.tts.utils import load_model

# Default text: Title of the thesis
DEFAULT_TEXT = "Instrumental Relations in Aristotle’s Intrinsic Teleology by Laurence Lauzon"

# Known voices for the Base/CustomVoice models (from README)
# Chinese: Vivian, Serena, Uncle_Fu, Dylan, Eric
# English: Ryan, Aiden
AVAILABLE_VOICES = ["Ryan", "Aiden", "Vivian", "Serena", "Uncle_Fu", "Dylan", "Eric"]

def main():
    parser = argparse.ArgumentParser(description="Simple Qwen3-TTS Generator")
    parser.add_argument("--text", type=str, default=DEFAULT_TEXT, help="Text to speak")
    parser.add_argument("--voice", type=str, default="Aiden", help="Voice name (e.g. Aiden, Ryan)")
    parser.add_argument("--list-voices", action="store_true", help="List available default voices")
    parser.add_argument("--output", type=str, default="data/outputs/output_simple.wav", help="Output WAV file")
    parser.add_argument("--play", action="store_true", help="Play audio after generation")
    
    args = parser.parse_args()

    if args.list_voices:
        print("Available Voices:")
        for v in AVAILABLE_VOICES:
            print(f" - {v}")
        return

    print(f"Loading Base model (Qwen3-TTS)...")
    # Base model is sufficient for predefined voices
    model = load_model("mlx-community/Qwen3-TTS-12Hz-0.6B-Base-bf16")

    print(f"Generating audio for voice '{args.voice}'...")
    print(f"Text: {args.text}")
    
    # Generate audio
    # The generate method returns a generator of results
    results = list(model.generate(
        text=args.text,
        voice=args.voice,
        language="English", # Hardcoded for now, assuming English usage
    ))
    
    if not results:
        print("Error: No audio generated.")
        return

    audio_array = results[0].audio
    
    # Save using soundfile (requires numpy)
    import soundfile as sf
    import numpy as np
    
    sf.write(args.output, np.array(audio_array), 24000)
    
    print(f"Output: {args.output}")
    if args.play:
        subprocess.run(["ffplay", "-autoexit", "-nodisp", "-hide_banner", "-loglevel", "error", args.output])
    else:
        print(f"Play with:\nffplay -autoexit -nodisp -hide_banner -loglevel error {args.output}")

if __name__ == "__main__":
    main()
