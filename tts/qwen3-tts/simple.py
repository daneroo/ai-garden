# /// script
# dependencies = [
#   "mlx-audio>=0.0.1",
#   "soundfile>=0.12.1",
#   "numpy",
# ]
# ///

"""
Simple Qwen3-TTS generator using the CustomVoice model.
Usage:
    uv run simple.py --help
    uv run simple.py --text "Hello world" --voice "Aiden"
"""
import argparse
import sys
import subprocess
from pathlib import Path
from mlx_audio.tts.utils import load_model

# Default text: Title of the thesis
DEFAULT_TEXT = "Instrumental Relations in Aristotle’s Intrinsic Teleology by Laurence Lauzon"

# Known voices for the Base/CustomVoice models
# Source: Derived from model error message
AVAILABLE_VOICES = ["Ryan", "Aiden", "Vivian", "Serena", "Uncle_Fu", "Dylan", "Eric", "Ono_Anna", "Sohee"]

def main():
    parser = argparse.ArgumentParser(description="Simple Qwen3-TTS Generator", formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument("--text", type=str, default=DEFAULT_TEXT, help="Text to speak")
    parser.add_argument("--voice", type=str, default="Aiden", help=f"Voice name. Available: {', '.join(AVAILABLE_VOICES)}")
    parser.add_argument("--output", type=str, default="data/outputs/output_simple.wav", help="Output WAV file")
    parser.add_argument("--play", action="store_true", help="Play audio after generation")
    
    args = parser.parse_args()

    print(f"Loading CustomVoice model (Qwen3-TTS)...")
    print("Warning: Expect warning about tokenizer (possibly because of pre-release)\n")
    # CustomVoice model supports predefined voices
    model = load_model("mlx-community/Qwen3-TTS-12Hz-0.6B-CustomVoice-bf16")

    # Determine voices to process
    if args.voice.lower() == "all":
        voices_to_run = AVAILABLE_VOICES
        print(f"Generating for ALL voices: {', '.join(voices_to_run)}")
    else:
        voices_to_run = [args.voice]

    # Process each voice
    for voice in voices_to_run:
        print(f"\n--- Processing Voice: {voice} ---")
        
        # Prepare filename and print text
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
        
        # Generate audio
        results = list(model.generate(
            text=current_text,
            voice=voice,
            language="English",
            temperature=0.7,  # Lower temperature for stability
            repetition_penalty=1.1,  # Increase penalty to prevent loops
        ))
        
        if not results:
            print(f"Error: No audio generated for {voice}.")
            continue

        audio_array = results[0].audio
        
        # Save using soundfile (requires numpy)
        import soundfile as sf
        import numpy as np

        Path(current_output).parent.mkdir(parents=True, exist_ok=True)
        sf.write(current_output, np.array(audio_array), 24000)
        
        print(f"Output: {current_output}")
        if args.play:
            subprocess.run(["ffplay", "-autoexit", "-nodisp", "-hide_banner", "-loglevel", "error", current_output])
        else:
            print(f"Play with:\nffplay -autoexit -nodisp -hide_banner -loglevel error {current_output}")

if __name__ == "__main__":
    main()
