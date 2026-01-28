# /// script
# dependencies = [
#   "mlx-audio>=0.0.1",
#   "soundfile>=0.12.1",
#   "numpy",
# ]
# ///

"""
Qwen3-TTS "Voice Design" generator.
Uses the larger VoiceDesign model to generate audio based on a text prompt.

Usage:
    uv run speak.py --prompt "motivated, classical academic"
    uv run speak.py --text-file my_text.txt --output my_audio.wav
"""
import argparse
import sys
import subprocess
from pathlib import Path
from mlx_audio.tts.utils import load_model

# Default text file
DEFAULT_TEXT_FILE = "these-laurence-edited.txt"
# Default prompt
DEFAULT_PROMPT = "motivated, classical academic"

def main():
    parser = argparse.ArgumentParser(description="Qwen3-TTS Voice Design Generator")
    parser.add_argument("--text-file", type=str, default=DEFAULT_TEXT_FILE, help="Path to text file")
    parser.add_argument("--prompt", type=str, default=DEFAULT_PROMPT, help="Voice description prompt")
    parser.add_argument("--output", type=str, default="data/outputs/output_speak.wav", help="Output WAV file")
    parser.add_argument("--play", action="store_true", help="Play audio after generation")
    
    args = parser.parse_args()

    # Read text
    text_path = Path(args.text_file)
    if not text_path.exists():
        print(f"Error: Text file '{text_path}' not found.")
        sys.exit(1)
        
    text = text_path.read_text().strip()
    if not text:
        print(f"Error: Text file '{text_path}' is empty.")
        sys.exit(1)

    print(f"Loading VoiceDesign model (Qwen3-TTS)...")
    # Voice Design model (1.7B)
    model = load_model("mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-bf16")

    print(f"Generating audio...")
    print(f"Prompt: '{args.prompt}'")
    print(f"Input Text ({len(text)} chars): {text[:50]}...")
    
    # Generate with Voice Design
    # The method is generate_voice_design(text, language, instruct, verbose)
    # Note: Using hardcoded language="English" for now
    results = list(model.generate_voice_design(
        text=text,
        language="English",
        instruct=args.prompt,
        verbose=True
    ))
    
    if not results:
        print("Error: No audio generated.")
        return

    audio_array = results[0].audio
    
    # Save
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
