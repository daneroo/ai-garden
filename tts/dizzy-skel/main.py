# /// script
# dependencies = [
#   "mlx-audio>=0.3.1",
#   "soundfile>=0.12.1",
#   "numpy",
#   "EbookLib>=0.20",
#   "pyyaml>=6.0",
# ]
# ///

"""
dizzy-skel: audio drama pipeline for Dizzy (Diziet Sma) and Skel (Skaffen-Amtiskaw).

Usage:
    uv run --prerelease=allow main.py epub --list
    uv run --prerelease=allow main.py epub --chapter "One"
    uv run --prerelease=allow main.py vtt-search --at 00:26:28 --search "turbine hall"
    uv run --prerelease=allow main.py vtt-search --at 00:26:28 --search "turbine hall" --verify --play
    uv run --prerelease=allow main.py play --start 00:26:32 --duration 3
    uv run --prerelease=allow main.py validate --voice kenny
    uv run --prerelease=allow main.py validate --voice all
    uv run --prerelease=allow main.py prepare-voice-sample --voice kenny
    uv run --prerelease=allow main.py prepare-voice-sample --voice all
    uv run --prerelease=allow main.py speak --voice kenny --text "Hello from the Culture"
    uv run --prerelease=allow main.py screenplay
    uv run --prerelease=allow main.py screenplay --model 1.7b-8bit --no-play
    uv run --prerelease=allow main.py chat
    uv run --prerelease=allow main.py chat --model 1.7b-8bit --voice skel
"""

import argparse
import html
import re
import subprocess
import sys
from pathlib import Path

import yaml

AUDIOBOOK = "/Volumes/Space/Reading/audiobooks/Iain M. Banks - Culture Novels/Iain M. Banks - Culture 03 - Use Of Weapons/Iain M. Banks - Culture 03 - Use Of Weapons.m4b"
EPUB = "/Volumes/Space/Reading/audiobooks/Iain M. Banks - Culture Novels/Iain M. Banks - Culture 03 - Use Of Weapons/Iain M. Banks - Culture 03 - Use Of Weapons.epub"
VTT = "data/vtt/Iain M. Banks - Culture 03 - Use Of Weapons.vtt"
VOICE_SAMPLES_YAML = "voice-samples.yaml"
TMP_DIR = Path("data/tmp")
WHISPER_MODEL = "../../bun-one/apps/whisper/data/models/ggml-tiny.en.bin"
VOICE_SAMPLE_DIR = Path("data/voice-samples")
OUTPUT_DIR = Path("data/output")
SCREENPLAY_YAML = "screenplay.yaml"
MODEL_ID = "mlx-community/Qwen3-TTS-12Hz-1.7B-Base-bf16"

BASE_MODELS = {
    "0.6b-bf16": "mlx-community/Qwen3-TTS-12Hz-0.6B-Base-bf16",
    "0.6b-8bit": "mlx-community/Qwen3-TTS-12Hz-0.6B-Base-8bit",
    "0.6b-4bit": "mlx-community/Qwen3-TTS-12Hz-0.6B-Base-4bit",
    "1.7b-bf16": "mlx-community/Qwen3-TTS-12Hz-1.7B-Base-bf16",
    "1.7b-8bit": "mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit",
    "1.7b-4bit": "mlx-community/Qwen3-TTS-12Hz-1.7B-Base-4bit",
}


def parse_timestamp(ts: str) -> float:
    """Parse HH:MM:SS.mmm to seconds."""
    parts = ts.split(":")
    h, m = int(parts[0]), int(parts[1])
    s = float(parts[2])
    return h * 3600 + m * 60 + s


def format_timestamp(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"


def parse_vtt(path: str):
    """Parse VTT file into list of (start_seconds, end_seconds, text)."""
    cues = []
    with open(path) as f:
        lines = f.read().split("\n")
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if "-->" in line:
            parts = line.split("-->")
            start = parse_timestamp(parts[0].strip())
            end = parse_timestamp(parts[1].strip())
            text_lines = []
            i += 1
            while i < len(lines) and lines[i].strip():
                text_lines.append(lines[i].strip())
                i += 1
            cues.append((start, end, " ".join(text_lines)))
        i += 1
    return cues


def strip_html(content: bytes) -> str:
    """Strip HTML tags, decode entities, collapse whitespace."""
    text = content.decode("utf-8", errors="replace")
    text = re.sub(r"<br\s*/?>", "\n", text)
    text = re.sub(r"</p>", "\n\n", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def load_voice_samples():
    """Load voice sample definitions from YAML."""
    with open(VOICE_SAMPLES_YAML) as f:
        return yaml.safe_load(f)


def resolve_voices(voice_arg, samples):
    """Resolve --voice arg to list of (name, sample) pairs."""
    if voice_arg.lower() == "all":
        return list(samples.items())
    if voice_arg not in samples:
        print(f"Unknown voice '{voice_arg}'. Available: {', '.join(samples.keys())}", file=sys.stderr)
        sys.exit(1)
    return [(voice_arg, samples[voice_arg])]


def extract_audio(start: float, duration: float, output: Path, sample_rate: int = 16000):
    """Extract audio segment from the m4b using ffmpeg."""
    output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([
        "ffmpeg", "-ss", str(start), "-t", str(duration),
        "-i", AUDIOBOOK, "-ac", "1", "-ar", str(sample_rate), "-y", str(output),
        "-hide_banner", "-loglevel", "error",
    ], check=True)


def play_audio(wav_path: Path):
    subprocess.run(["ffplay", "-autoexit", "-nodisp", "-hide_banner", "-loglevel", "error", str(wav_path)])


def play_audio_pipe(audio_np, sample_rate):
    """Pipe audio to ffplay via stdin — no temp file."""
    import io
    import os
    import soundfile as sf

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


def suppress_tts_warnings():
    """Suppress noisy mlx-audio/transformers warnings."""
    import os
    import warnings
    warnings.filterwarnings("ignore", message=".*model of type qwen3_tts.*")
    warnings.filterwarnings("ignore", message=".*incorrect regex pattern.*")
    os.environ["TRANSFORMERS_VERBOSITY"] = "error"


def load_tts_model(model_name):
    """Validate model name and load with suppressed output."""
    import contextlib
    import io as _io
    from mlx_audio.tts.utils import load_model

    if model_name not in BASE_MODELS:
        print(f"Unknown model '{model_name}'. Available: {', '.join(BASE_MODELS.keys())}", file=sys.stderr)
        sys.exit(1)
    model_id = BASE_MODELS[model_name]

    # suppress print-based warnings during load
    old_stdout, old_stderr = sys.stdout, sys.stderr
    sys.stdout = _io.StringIO()
    sys.stderr = _io.StringIO()
    try:
        model = load_model(model_id)
    finally:
        sys.stdout, sys.stderr = old_stdout, old_stderr

    return model, model_id


def load_voice_ref(name):
    """Load voice sample WAV + text for voice cloning. Returns (mx_array, ref_text)."""
    import mlx.core as mx
    import soundfile as sf

    wav_path = VOICE_SAMPLE_DIR / f"{name}.wav"
    txt_path = VOICE_SAMPLE_DIR / f"{name}.txt"
    if not wav_path.exists() or not txt_path.exists():
        print(f"Voice sample not found: {wav_path}", file=sys.stderr)
        print(f"Run: main.py prepare-voice-sample --voice {name}", file=sys.stderr)
        sys.exit(1)
    audio, _ = sf.read(str(wav_path))
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    return mx.array(audio), txt_path.read_text().strip()


def transcribe(wav_path: Path) -> str:
    """Run whisper-cli on a wav file, return the transcribed text."""
    result = subprocess.run(
        ["whisper-cli", "-m", WHISPER_MODEL, str(wav_path)],
        capture_output=True, text=True,
    )
    lines = []
    for line in result.stdout.splitlines():
        if line.startswith("["):
            text = line.split("]", 1)[1].strip()
            lines.append(text)
    return " ".join(lines)


# --- epub ---

def cmd_epub(args):
    from ebooklib import epub

    book = epub.read_epub(args.epub, {"ignore_ncx": True})
    items = list(book.get_items_of_type(9))  # 9 = ITEM_DOCUMENT

    if args.list:
        for i, item in enumerate(items):
            body = strip_html(item.get_content())
            preview = body[:80].replace("\n", " ")
            print(f"{i:3d}  {item.get_name():40s}  {preview}...")
        return

    if args.chapter:
        target = args.chapter.lower()
        for item in items:
            body = strip_html(item.get_content())
            first_lines = body[:200].lower()
            if target in first_lines:
                print(body)
                return
        print(f"No chapter matching '{args.chapter}' found.", file=sys.stderr)
        sys.exit(1)


# --- vtt-search ---

def cmd_vtt_search(args):
    cues = parse_vtt(args.vtt)
    at = parse_timestamp(args.at)
    window = args.window

    nearby = [(s, e, t) for s, e, t in cues if abs(s - at) <= window]

    if args.search:
        target = args.search.lower()
        nearby = [(s, e, t) for s, e, t in nearby if target in t.lower()]

    if not nearby:
        print(f"No cues found near {args.at} (±{window}s)", file=sys.stderr)
        sys.exit(1)

    for start, end, text in nearby:
        print(f"{format_timestamp(start)} --> {format_timestamp(end)}")
        print(f"  VTT: {text}")
        print()

    if (args.verify or args.play) and nearby:
        span_start = max(0, nearby[0][0] - 1)
        span_end = nearby[-1][1] + 1
        duration = span_end - span_start

        tmp_wav = TMP_DIR / "vtt_search.wav"
        print(f"Extracting {duration:.1f}s from {format_timestamp(span_start)}...")
        extract_audio(span_start, duration, tmp_wav)

        if args.verify:
            print(f"Transcribing with whisper-cli...")
            whisper_text = transcribe(tmp_wav)
            print(f"  Whisper: {whisper_text}")
            print()

        if args.play:
            play_audio(tmp_wav)

        tmp_wav.unlink(missing_ok=True)


# --- play ---

def cmd_play(args):
    """Play a short clip from the audiobook at a given timecode."""
    start = parse_timestamp(args.start)
    duration = args.duration

    tmp_wav = TMP_DIR / "play.wav"
    print(f"Playing {duration}s from {args.start}...")
    extract_audio(start, duration, tmp_wav)
    play_audio(tmp_wav)
    tmp_wav.unlink(missing_ok=True)


# --- validate ---

def cmd_validate(args):
    """Show voice sample summary, optionally play and verify with whisper."""
    samples = load_voice_samples()
    voices = resolve_voices(args.voice, samples)

    for name, sample in voices:
        r = sample["range"]
        start = parse_timestamp(r["start"])
        end = parse_timestamp(r["end"])
        duration = end - start
        text = sample["text"].strip()

        print(f"=== {name} ===")
        print(f"  Range: {r['start']} --> {r['end']} ({duration:.1f}s)")
        print(f"  Text:  {text[:80]}{'...' if len(text) > 80 else ''}")

        wav = VOICE_SAMPLE_DIR / f"{name}.wav"
        if wav.exists():
            print(f"  Sample: {wav} (exists)")
        else:
            print(f"  Sample: not yet prepared")

        if args.play:
            tmp_wav = TMP_DIR / f"validate_{name}.wav"
            extract_audio(start, duration, tmp_wav)
            print(f"  Playing...")
            play_audio(tmp_wav)
            tmp_wav.unlink(missing_ok=True)

        if args.verify:
            tmp_wav = TMP_DIR / f"validate_{name}.wav"
            if not tmp_wav.exists():
                extract_audio(start, duration, tmp_wav)
            print(f"  Transcribing with whisper-cli...")
            whisper_text = transcribe(tmp_wav)
            print(f"  Whisper: {whisper_text}")
            tmp_wav.unlink(missing_ok=True)

        print()


# --- prepare-voice-sample ---

def cmd_prepare_voice_sample(args):
    """Extract voice samples (24kHz mono WAV) with canonical text, from YAML definitions."""
    samples = load_voice_samples()
    voices = resolve_voices(args.voice, samples)

    for name, sample in voices:
        r = sample["range"]
        start = parse_timestamp(r["start"])
        end = parse_timestamp(r["end"])
        duration = end - start
        text = sample["text"].strip()

        # 24kHz mono for qwen3-tts speaker encoder
        output = VOICE_SAMPLE_DIR / f"{name}.wav"
        print(f"Extracting {duration:.1f}s from {r['start']} -> {output}")
        extract_audio(start, duration, output, sample_rate=24000)

        txt_output = VOICE_SAMPLE_DIR / f"{name}.txt"
        txt_output.write_text(text + "\n")

        print(f"  Text: {text[:80]}{'...' if len(text) > 80 else ''}")
        print(f"  Saved: {output} + {txt_output}")
        print()


# --- speak ---

def speak_one(name, text, model, play=False):
    """Generate speech for one voice."""
    import numpy as np
    import soundfile as sf
    import mlx.core as mx

    voice_wav = VOICE_SAMPLE_DIR / f"{name}.wav"
    voice_txt = VOICE_SAMPLE_DIR / f"{name}.txt"
    if not voice_wav.exists() or not voice_txt.exists():
        print(f"Voice sample not found: {voice_wav}", file=sys.stderr)
        print(f"Run: main.py prepare-voice-sample --voice {name} first", file=sys.stderr)
        return

    ref_text = voice_txt.read_text().strip()
    ref_audio, _ = sf.read(str(voice_wav))
    if ref_audio.ndim > 1:
        ref_audio = ref_audio.mean(axis=1)
    ref_audio_mx = mx.array(ref_audio)

    print(f"Voice: {name}")
    print(f"Text: {text[:80]}{'...' if len(text) > 80 else ''}")
    print(f"Generating...")

    results = list(model.generate(
        text=text,
        ref_audio=ref_audio_mx,
        ref_text=ref_text,
        language="English",
    ))

    if not results:
        print("Error: No audio generated.", file=sys.stderr)
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output = OUTPUT_DIR / f"speak_{name}.wav"
    sf.write(str(output), np.array(results[0].audio), model.sample_rate)

    print(f"Output: {output}")
    print(f"ffplay -autoexit -nodisp -hide_banner -loglevel error {output}")
    if play:
        play_audio(output)
    print()


def cmd_speak(args):
    from mlx_audio.tts.utils import load_model

    samples = load_voice_samples()
    voices = resolve_voices(args.voice, samples)

    if args.text_file:
        text_override = Path(args.text_file).read_text().strip()
    else:
        text_override = args.text

    print(f"Loading model: {MODEL_ID}")
    model = load_model(MODEL_ID)

    for name, sample in voices:
        fullname = sample.get("fullname", name)
        text = text_override or f"I am {name}, {fullname}, and now you can hear me!"
        speak_one(name, text, model, play=args.play)


# --- screenplay ---

def load_screenplay(path=SCREENPLAY_YAML):
    """Load screenplay YAML — list of {voice: text} mappings."""
    with open(path) as f:
        lines = yaml.safe_load(f)
    result = []
    for entry in lines:
        if not isinstance(entry, dict) or len(entry) != 1:
            print(f"Bad screenplay entry: {entry}", file=sys.stderr)
            sys.exit(1)
        voice, text = next(iter(entry.items()))
        result.append((voice, text))
    return result


def cmd_screenplay(args):
    import time
    import numpy as np
    import soundfile as sf
    import mlx.core as mx

    suppress_tts_warnings()

    lines = load_screenplay(args.screenplay)
    samples = load_voice_samples()

    # validate all voices exist
    voices_needed = sorted(set(v for v, _ in lines))
    for v in voices_needed:
        if v not in samples:
            print(f"Unknown voice '{v}' in screenplay. Available: {', '.join(samples.keys())}", file=sys.stderr)
            sys.exit(1)

    # load model
    print(f"Loading model: {args.model}")
    model, model_id = load_tts_model(args.model)

    # preload all voice references
    voice_cache = {v: load_voice_ref(v) for v in voices_needed}

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Lines: {len(lines)}, Voices: {', '.join(voices_needed)}")
    print()

    for i, (voice, text) in enumerate(lines):
        ref_audio, ref_text = voice_cache[voice]

        print(f"  [{i+1:2d}/{len(lines)}] {voice}: {text[:60]}{'...' if len(text) > 60 else ''}")

        t0 = time.perf_counter()
        results = list(model.generate(
            text=text,
            ref_audio=ref_audio,
            ref_text=ref_text,
            language="English",
        ))
        t_gen = time.perf_counter() - t0

        if not results or not hasattr(results[0], "audio"):
            print(f"         (no audio)")
            continue

        audio = np.array(results[0].audio)
        # pad 0.2s silence to avoid abrupt cutoff
        audio = np.concatenate([audio, np.zeros(int(model.sample_rate * 0.2))])
        duration_s = len(audio) / model.sample_rate
        speedup = duration_s / t_gen if t_gen > 0 else 0
        print(f"         Gen: {t_gen:.2f}s  Audio: {duration_s:.2f}s  Speedup: {speedup:.2f}x")

        if args.no_play:
            out_path = OUTPUT_DIR / f"screenplay_{i:03d}_{voice}.wav"
            sf.write(str(out_path), audio, model.sample_rate)
        else:
            play_audio_pipe(audio, model.sample_rate)

        mx.clear_cache()

    if args.no_play:
        print(f"\nOutput: {OUTPUT_DIR}/screenplay_*.wav")
        print(f"Play with:")
        print(f"  for f in {OUTPUT_DIR}/screenplay_*.wav; do ffplay -autoexit -nodisp \"$f\"; done")


# --- chat ---

def cmd_chat(args):
    import time
    import numpy as np
    import mlx.core as mx

    suppress_tts_warnings()

    print(f"Loading model: {args.model}")
    model, model_id = load_tts_model(args.model)

    ref_audio, ref_text = load_voice_ref(args.voice)
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

        t0 = time.perf_counter()
        results = list(model.generate(
            text=reply,
            ref_audio=ref_audio,
            ref_text=ref_text,
            language="English",
        ))
        t_gen = time.perf_counter() - t0

        if results and hasattr(results[0], "audio"):
            audio = np.array(results[0].audio)
            audio = np.concatenate([audio, np.zeros(int(model.sample_rate * 0.2))])
            duration_s = len(audio) / model.sample_rate
            speedup = duration_s / t_gen if t_gen > 0 else 0
            print(f"  Gen: {t_gen:.2f}s  Audio: {duration_s:.2f}s  Speedup: {speedup:.2f}x")
            mx.clear_cache()
            if not args.no_play:
                play_audio_pipe(audio, model.sample_rate)
        else:
            print(f"  Gen: {t_gen:.2f}s (no audio)")


# --- main ---

def main():
    parser = argparse.ArgumentParser(description="dizzy-skel audio drama pipeline")
    sub = parser.add_subparsers(dest="command")

    # epub
    p_epub = sub.add_parser("epub", help="Extract text from the epub")
    p_epub.add_argument("--epub", default=EPUB, help="Path to epub file")
    p_epub.add_argument("--list", action="store_true", help="List all document items")
    p_epub.add_argument("--chapter", type=str, help="Extract chapter by title match")

    # vtt-search
    p_vtt = sub.add_parser("vtt-search", help="Search the VTT around a timecode")
    p_vtt.add_argument("--vtt", default=VTT, help="Path to VTT file")
    p_vtt.add_argument("--at", required=True, help="Timecode to search around (HH:MM:SS)")
    p_vtt.add_argument("--window", type=int, default=30, help="Seconds ± to search")
    p_vtt.add_argument("--search", type=str, help="Filter cues containing this text")
    p_vtt.add_argument("--verify", action="store_true", help="Re-transcribe matched cues with whisper-cli")
    p_vtt.add_argument("--play", action="store_true", help="Play the matched audio segment")

    # play
    p_play = sub.add_parser("play", help="Play a short clip from the audiobook")
    p_play.add_argument("--start", required=True, help="Start timecode (HH:MM:SS)")
    p_play.add_argument("--duration", type=float, default=3, help="Duration in seconds")

    # validate
    p_val = sub.add_parser("validate", help="Show voice sample summary from YAML")
    p_val.add_argument("--voice", required=True, help="Voice name or 'all'")
    p_val.add_argument("--play", action="store_true", help="Play the audio for each voice")
    p_val.add_argument("--verify", action="store_true", help="Re-transcribe and compare with whisper-cli")

    # prepare-voice-sample
    p_pvs = sub.add_parser("prepare-voice-sample", help="Extract voice sample(s) from YAML definitions")
    p_pvs.add_argument("--voice", required=True, help="Voice name or 'all'")

    # speak
    available = ", ".join(load_voice_samples().keys())
    p_speak = sub.add_parser("speak", help="Generate speech using a cloned voice")
    p_speak.add_argument("--voice", required=True, help=f"Voice name or 'all' (available: {available})")
    text_group_speak = p_speak.add_mutually_exclusive_group()
    text_group_speak.add_argument("--text", type=str, help="Text to speak (default: 'I am <voice>, and now you can hear me!')")
    text_group_speak.add_argument("--text-file", type=str, help="Read text from file")
    p_speak.add_argument("--play", action="store_true", help="Play audio after generation")

    # screenplay
    model_names = ", ".join(BASE_MODELS.keys())
    p_sp = sub.add_parser("screenplay", help="Generate audio drama from screenplay YAML")
    p_sp.add_argument("--screenplay", default=SCREENPLAY_YAML,
                       help=f"Path to screenplay YAML (default: {SCREENPLAY_YAML})")
    p_sp.add_argument("--model", default="0.6b-4bit",
                       help=f"Model: {model_names} (default: 0.6b-4bit)")
    p_sp.add_argument("--no-play", action="store_true",
                       help="Save WAVs instead of playing (data/output/screenplay_NNN_voice.wav)")

    # chat
    available = ", ".join(load_voice_samples().keys())
    p_chat = sub.add_parser("chat", help="Interactive voice chat loop")
    p_chat.add_argument("--model", default="0.6b-4bit",
                         help=f"Model: {model_names} (default: 0.6b-4bit)")
    p_chat.add_argument("--voice", default="kenny",
                         help=f"Voice: {available} (default: kenny)")
    p_chat.add_argument("--no-play", action="store_true", help="Skip playback")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)

    commands = {
        "epub": cmd_epub,
        "vtt-search": cmd_vtt_search,
        "play": cmd_play,
        "validate": cmd_validate,
        "prepare-voice-sample": cmd_prepare_voice_sample,
        "speak": cmd_speak,
        "screenplay": cmd_screenplay,
        "chat": cmd_chat,
    }
    commands[args.command](args)


if __name__ == "__main__":
    main()
