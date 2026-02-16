# /// script
# dependencies = [
#   "mlx-audio>=0.3.1",
#   "soundfile>=0.12.1",
#   "numpy",
#   "mlx",
# ]
# ///

"""
Interactive chat loop with voice cloning — type text, hear it spoken back.

Usage:
    uv run --prerelease=allow chat.py
    uv run --prerelease=allow chat.py --model 1.7b-base-8bit --voice skel
    uv run --prerelease=allow chat.py --no-play
"""

import argparse
import contextlib
import io
import os
import subprocess
import sys
import time
import warnings
from pathlib import Path

import mlx.core as mx
import numpy as np
import soundfile as sf

# suppress noisy warnings
warnings.filterwarnings("ignore", message=".*model of type qwen3_tts.*")
warnings.filterwarnings("ignore", message=".*incorrect regex pattern.*")
os.environ["TRANSFORMERS_VERBOSITY"] = "error"
os.environ.pop("MallocStackLogging", None)
os.environ.pop("MallocStackLoggingNoCompact", None)

VOICE_SAMPLE_DIR = Path("data/voice-samples")

MODELS = {
    "0.6b-bf16": "mlx-community/Qwen3-TTS-12Hz-0.6B-Base-bf16",
    "0.6b-8bit": "mlx-community/Qwen3-TTS-12Hz-0.6B-Base-8bit",
    "0.6b-4bit": "mlx-community/Qwen3-TTS-12Hz-0.6B-Base-4bit",
    "1.7b-bf16": "mlx-community/Qwen3-TTS-12Hz-1.7B-Base-bf16",
    "1.7b-8bit": "mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit",
    "1.7b-4bit": "mlx-community/Qwen3-TTS-12Hz-1.7B-Base-4bit",
}


@contextlib.contextmanager
def quiet_load():
    old_stdout, old_stderr = sys.stdout, sys.stderr
    sys.stdout = io.StringIO()
    sys.stderr = io.StringIO()
    try:
        yield
    finally:
        sys.stdout, sys.stderr = old_stdout, old_stderr


def available_voices():
    return sorted(p.stem for p in VOICE_SAMPLE_DIR.glob("*.wav")
                  if (VOICE_SAMPLE_DIR / f"{p.stem}.txt").exists())


def load_voice(name):
    wav_path = VOICE_SAMPLE_DIR / f"{name}.wav"
    txt_path = VOICE_SAMPLE_DIR / f"{name}.txt"
    audio, _ = sf.read(str(wav_path))
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    ref_text = txt_path.read_text().strip()
    return mx.array(audio), ref_text


def play_audio(audio_np, sample_rate):
    buf = io.BytesIO()
    sf.write(buf, audio_np, sample_rate, format="WAV")
    env = {k: v for k, v in os.environ.items() if not k.startswith("MallocStack")}
    subprocess.run(
        ["ffplay", "-autoexit", "-nodisp", "-hide_banner", "-loglevel", "error", "-"],
        input=buf.getvalue(),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        env=env,
    )


def main():
    voices = available_voices()
    model_names = ", ".join(MODELS.keys())

    parser = argparse.ArgumentParser(description="Interactive voice chat loop")
    parser.add_argument("--model", default="0.6b-4bit",
                        help=f"Model: {model_names} (default: 0.6b-4bit)")
    parser.add_argument("--voice", default="kenny",
                        help=f"Voice: {', '.join(voices)} (default: kenny)")
    parser.add_argument("--no-play", action="store_true", help="Skip playback")
    args = parser.parse_args()

    if args.model not in MODELS:
        print(f"Unknown model '{args.model}'. Available: {model_names}")
        return
    if args.voice not in voices:
        print(f"Unknown voice '{args.voice}'. Available: {', '.join(voices)}")
        return

    # load model
    from mlx_audio.tts.utils import load_model

    model_id = MODELS[args.model]
    print(f"Loading {args.model} ({model_id})...")
    t0 = time.perf_counter()
    with quiet_load():
        model = load_model(model_id)
    print(f"Loaded in {time.perf_counter() - t0:.2f}s")

    # load voice
    ref_audio, ref_text = load_voice(args.voice)
    print(f"Voice: {args.voice}")
    print(f"Type text and press Enter. Ctrl-C to quit.\n")

    while True:
        try:
            user_input = input("> ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nBye!")
            break

        if not user_input:
            continue

        reply = f"Sure, {user_input}"
        print(f"  [{args.voice}]: {reply}")

        t_gen_start = time.perf_counter()
        results = list(model.generate(
            text=reply,
            ref_audio=ref_audio,
            ref_text=ref_text,
            language="English",
        ))
        t_gen = time.perf_counter() - t_gen_start

        if results and hasattr(results[0], "audio"):
            audio = np.array(results[0].audio)
            duration_s = len(audio) / model.sample_rate
            speedup = duration_s / t_gen if t_gen > 0 else 0
            print(f"  Gen: {t_gen:.2f}s  Audio: {duration_s:.2f}s  Speedup: {speedup:.2f}x")
            mx.clear_cache()
            if not args.no_play:
                play_audio(audio, model.sample_rate)
        else:
            print(f"  Gen: {t_gen:.2f}s (no audio)")


if __name__ == "__main__":
    main()
