# /// script
# dependencies = [
#   "mlx-audio>=0.3.1",
#   "soundfile>=0.12.1",
#   "numpy",
#   "mlx",
# ]
# ///

"""
Benchmark Qwen3-TTS model variants: size, quantization, and built-in vs cloned voices.

Loads each model once, generates N iterations with cooldown between tests,
plays first iteration via ffplay, reports median/mean/stddev for gen time and speedup.

Models are cached by HuggingFace in ~/.cache/huggingface/hub/

Usage:
    uv run --prerelease=allow bench-models.py --list
    uv run --prerelease=allow bench-models.py --no-play
    uv run --prerelease=allow bench-models.py --models 0.6b-base-4bit 1.7b-base-4bit
    uv run --prerelease=allow bench-models.py --iters 5 --cooldown 10

Results (Mac Mini M2 Pro, 3 iters, 5s cooldown):

    Model                 Gen (median±sd)  Speedup (median±sd)
    -------------------- ---------------- --------------------
    0.6b-base-bf16            14.11 ±1.80s          0.42 ±0.04x
    0.6b-base-8bit             5.87 ±1.26s          1.20 ±0.06x
    0.6b-base-4bit             5.39 ±0.49s          1.19 ±0.12x
    1.7b-base-bf16            19.72 ±3.11s          0.29 ±0.04x
    1.7b-base-8bit             6.99 ±0.61s          0.92 ±0.08x
    1.7b-base-4bit             5.87 ±0.50s          1.08 ±0.06x
    0.6b-cv-bf16               6.66 ±0.86s          0.94 ±0.12x
    0.6b-cv-8bit               5.69 ±0.84s          1.25 ±0.11x
    0.6b-cv-4bit               7.53 ±1.65s          1.33 ±0.19x
    1.7b-cv-bf16               7.50 ±1.92s          0.70 ±0.12x
    1.7b-cv-8bit               5.10 ±0.57s          1.16 ±0.02x
    1.7b-cv-4bit               5.80 ±0.71s          1.09 ±0.13x

Speedup = audio_duration / gen_time (> 1.0 = faster than realtime).
Quantized models (4bit/8bit) are all near realtime regardless of size or type.
CustomVoice offers no meaningful speedup over Base with quantization — voice
cloning with ref_audio works just as fast.
"""

import argparse
import contextlib
import gc
import io
import os
import statistics
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


@contextlib.contextmanager
def quiet_load():
    """Suppress stdout/stderr noise during model load (print-based warnings)."""
    old_stdout, old_stderr = sys.stdout, sys.stderr
    sys.stdout = io.StringIO()
    sys.stderr = io.StringIO()
    try:
        yield
    finally:
        sys.stdout, sys.stderr = old_stdout, old_stderr


print("** suppressed mlx-audio/transformers startup warnings")

DEFAULT_TEXT = "This is a test of the text-to-speech output, just to validate quality, latency and speed."

# voice cloning reference
VOICE_WAV = "data/voice-samples/kenny.wav"
VOICE_TXT = "data/voice-samples/kenny.txt"

# model registry: short name -> (model_id, mode)
# mode: "clone" = use ref_audio, "builtin" = use first built-in speaker
MODELS = {
    # --- 0.6B Base (clone voice) ---
    "0.6b-base-bf16": ("mlx-community/Qwen3-TTS-12Hz-0.6B-Base-bf16", "clone"),
    "0.6b-base-8bit": ("mlx-community/Qwen3-TTS-12Hz-0.6B-Base-8bit", "clone"),
    "0.6b-base-4bit": ("mlx-community/Qwen3-TTS-12Hz-0.6B-Base-4bit", "clone"),
    # --- 1.7B Base (clone voice) ---
    "1.7b-base-bf16": ("mlx-community/Qwen3-TTS-12Hz-1.7B-Base-bf16", "clone"),
    "1.7b-base-8bit": ("mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit", "clone"),
    "1.7b-base-4bit": ("mlx-community/Qwen3-TTS-12Hz-1.7B-Base-4bit", "clone"),
    # --- 0.6B CustomVoice (built-in speakers) ---
    "0.6b-cv-bf16": ("mlx-community/Qwen3-TTS-12Hz-0.6B-CustomVoice-bf16", "builtin"),
    "0.6b-cv-8bit": ("mlx-community/Qwen3-TTS-12Hz-0.6B-CustomVoice-8bit", "builtin"),
    "0.6b-cv-4bit": ("mlx-community/Qwen3-TTS-12Hz-0.6B-CustomVoice-4bit", "builtin"),
    # --- 1.7B CustomVoice (built-in speakers) ---
    "1.7b-cv-bf16": ("mlx-community/Qwen3-TTS-12Hz-1.7B-CustomVoice-bf16", "builtin"),
    "1.7b-cv-8bit": ("mlx-community/Qwen3-TTS-12Hz-1.7B-CustomVoice-8bit", "builtin"),
    "1.7b-cv-4bit": ("mlx-community/Qwen3-TTS-12Hz-1.7B-CustomVoice-4bit", "builtin"),
}


def load_ref_audio():
    audio, _ = sf.read(VOICE_WAV)
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    return mx.array(audio)


def play_audio(audio_np, sample_rate):
    """Pipe raw WAV to ffplay via stdin — no temp file needed."""
    buf = io.BytesIO()
    sf.write(buf, audio_np, sample_rate, format="WAV")
    env = {k: v for k, v in os.environ.items()
           if not k.startswith("MallocStack")}
    subprocess.run(
        ["ffplay", "-autoexit", "-nodisp", "-hide_banner", "-loglevel", "error", "-"],
        input=buf.getvalue(),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        env=env,
    )


def bench_one(name, model_id, mode, text, iters=3, cooldown=5, play=True):
    from mlx_audio.tts.utils import load_model

    print(f"--- {name} ({iters} iters, {cooldown}s cooldown) ---")

    t_load_start = time.perf_counter()
    with quiet_load():
        model = load_model(model_id)
    t_load = time.perf_counter() - t_load_start
    print(f"  Load: {t_load:.2f}s")

    # for builtin mode, pick aiden or first available speaker
    voice = None
    if mode == "builtin":
        speakers = model.get_supported_speakers()
        if speakers:
            voice = "aiden" if "aiden" in speakers else speakers[0]
            print(f"  Speaker: {voice}")
        else:
            print(f"  No built-in speakers, falling back to clone")
            mode = "clone"

    gen_kwargs = dict(text=text, language="English")
    if mode == "clone":
        gen_kwargs["ref_audio"] = load_ref_audio()
        gen_kwargs["ref_text"] = Path(VOICE_TXT).read_text().strip()
    else:
        gen_kwargs["voice"] = voice

    sample_rate = model.sample_rate
    gen_times = []
    speedups = []

    for i in range(iters):
        if i > 0:
            mx.clear_cache()
            time.sleep(cooldown)

        t_gen_start = time.perf_counter()
        results = list(model.generate(**gen_kwargs))
        t_gen = time.perf_counter() - t_gen_start

        if results and hasattr(results[0], "audio"):
            audio = np.array(results[0].audio)
            duration_s = len(audio) / sample_rate
            speedup = duration_s / t_gen if t_gen > 0 else 0
            gen_times.append(t_gen)
            speedups.append(speedup)
            print(f"  [{i+1}/{iters}] Gen: {t_gen:.2f}s  Audio: {duration_s:.2f}s  Speedup: {speedup:.2f}x")
            if play:
                play_audio(audio, sample_rate)
        else:
            print(f"  [{i+1}/{iters}] Gen: {t_gen:.2f}s  (no audio)")

    del model
    gc.collect()
    mx.clear_cache()

    return {
        "name": name,
        "load": t_load,
        "gen_times": gen_times,
        "speedups": speedups,
    }


def fmt_stats(values):
    """Return median ± stddev string."""
    if not values:
        return "n/a"
    med = statistics.median(values)
    if len(values) >= 2:
        sd = statistics.stdev(values)
        return f"{med:.2f} ±{sd:.2f}"
    return f"{med:.2f}"


def main():
    parser = argparse.ArgumentParser(description="Benchmark Qwen3-TTS model variants")
    all_names = ", ".join(MODELS.keys())
    parser.add_argument("--models", nargs="*",
                        help=f"Models: {all_names}; aliases: all, base, cv (default: base)")
    parser.add_argument("--list", action="store_true", help="List available models and exit")
    parser.add_argument("--text", type=str, default=DEFAULT_TEXT, help="Text to synthesize")
    parser.add_argument("--iters", type=int, default=3, help="Iterations per model (default: 3)")
    parser.add_argument("--cooldown", type=int, default=5, help="Seconds between iterations (default: 5)")
    parser.add_argument("--no-play", action="store_true", help="Skip playback")
    args = parser.parse_args()

    if args.list:
        print("Available models:")
        print(f"  {'Name':<20s}  {'Mode':<7s}  {'Model ID'}")
        print(f"  {'-'*20}  {'-'*7}  {'-'*50}")
        for name, (model_id, mode) in MODELS.items():
            print(f"  {name:<20s}  {mode:<7s}  {model_id}")
        print()
        print("Models cached in: ~/.cache/huggingface/hub/")
        return

    ALIASES = {
        "all": list(MODELS.keys()),
        "base": [k for k in MODELS if "base" in k],
        "cv": [k for k in MODELS if "cv" in k],
    }
    raw = args.models or ["base"]
    selected = []
    for m in raw:
        if m in ALIASES:
            selected.extend(ALIASES[m])
        else:
            selected.append(m)
    unknown = [m for m in selected if m not in MODELS]
    if unknown:
        print(f"Unknown models: {unknown}")
        print(f"Available: {list(MODELS.keys())}")
        return

    text = args.text
    print(f"Text: {text}")
    print(f"Models: {selected}")
    print(f"Iters: {args.iters}, Cooldown: {args.cooldown}s")

    results = []
    for idx, name in enumerate(selected):
        if idx > 0:
            time.sleep(args.cooldown)
        model_id, mode = MODELS[name]
        r = bench_one(name, model_id, mode, text, iters=args.iters,
                      cooldown=args.cooldown, play=not args.no_play)
        results.append(r)

    # summary table
    print(f"\n{'='*70}")
    print(f"{'Model':<20s} {'Gen (median±sd)':>16s} {'Speedup (median±sd)':>20s}")
    print(f"{'-'*20} {'-'*16} {'-'*20}")
    for r in results:
        gen_s = fmt_stats(r["gen_times"])
        spd_s = fmt_stats(r["speedups"])
        print(f"{r['name']:<20s} {gen_s:>16s}s {spd_s:>19s}x")


if __name__ == "__main__":
    main()
