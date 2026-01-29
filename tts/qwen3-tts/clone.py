# /// script
# dependencies = [
#   "mlx-audio>=0.0.1",
#   "soundfile>=0.12.1",
#   "numpy",
#   "mlx",
# ]
# ///

"""
Qwen3-TTS "Voice Cloning" generator.
Uses the Base model to clone a voice from a reference audio file.

Usage:
    uv run clone.py --ref-audio data/reference/reference_voice.wav --ref-text "Transcript..."
"""
import argparse
import sys
import subprocess
from pathlib import Path
from mlx_audio.tts.utils import load_model

# Default text file
DEFAULT_TEXT_FILE = "these-laurence-edited.txt"
# Default reference audio (extracted from audiobook)
DEFAULT_REF_AUDIO = "data/reference/reference_voice.wav"
# Default reference text (Likely start of Chapter 1)
DEFAULT_REF_TEXT = "In a hole in the ground there lived a hobbit."

def main():
    parser = argparse.ArgumentParser(description="Qwen3-TTS Voice Cloning Generator", formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument("--text-file", type=str, default=DEFAULT_TEXT_FILE, help="Path to target text file")
    parser.add_argument("--ref-audio", type=str, default=DEFAULT_REF_AUDIO, help="Path to reference audio file")
    parser.add_argument("--ref-text", type=str, default=DEFAULT_REF_TEXT, help="Transcript of recurrence audio")
    parser.add_argument("--output", type=str, default="data/outputs/output_clone.wav", help="Output WAV file")
    parser.add_argument("--play", action="store_true", help="Play audio after generation")
    
    args = parser.parse_args()

    # Read target text
    text_path = Path(args.text_file)
    if not text_path.exists():
        print(f"Error: Text file '{text_path}' not found.")
        sys.exit(1)
        
    text = text_path.read_text().strip()
    if not text:
        print(f"Error: Text file '{text_path}' is empty.")
        sys.exit(1)

    # Verify input audio
    ref_audio_path = Path(args.ref_audio)
    if not ref_audio_path.exists():
        print(f"Error: Reference audio '{ref_audio_path}' not found.")
        sys.exit(1)

    print(f"Loading Base model (Qwen3-TTS) for Cloning...")
    print("Warning: Expect warning about tokenizer (possibly because of pre-release)\n")
    # Voice Cloning uses the Base model
    model = load_model("mlx-community/Qwen3-TTS-12Hz-0.6B-Base-bf16")
    
    # Load reference audio
    import soundfile as sf
    import mlx.core as mx
    
    ref_audio_data, _ = sf.read(str(ref_audio_path))
    # Ensure mono
    if ref_audio_data.ndim > 1:
        ref_audio_data = ref_audio_data.mean(axis=1)
    ref_audio_mx = mx.array(ref_audio_data)

    print(f"Generating cloned audio...")
    print(f"Reference: '{args.ref_audio}'")
    print(f"Ref Text: '{args.ref_text[:50]}...'")
    print(f"Target Text: {text[:50]}...")
    
    # Generate with Voice Cloning
    # generate(text, ref_audio, ref_text, voice=None)
    results = list(model.generate(
        text=text,
        ref_audio=ref_audio_mx,
        ref_text=args.ref_text,
        language="English",
    ))
    
    if not results:
        print("Error: No audio generated.")
        return

    audio_array = results[0].audio
    
    # Save
    import soundfile as sf
    import numpy as np
    
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    sf.write(args.output, np.array(audio_array), 24000)
    
    print(f"Output: {args.output}")
    if args.play:
        subprocess.run(["ffplay", "-autoexit", "-nodisp", "-hide_banner", "-loglevel", "error", args.output])
    else:
        print(f"Play with:\nffplay -autoexit -nodisp -hide_banner -loglevel error {args.output}")

if __name__ == "__main__":
    main()
