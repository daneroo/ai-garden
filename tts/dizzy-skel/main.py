# /// script
# dependencies = [
#   "mlx-audio>=0.3.1",
#   "soundfile>=0.12.1",
#   "numpy",
#   "EbookLib>=0.20",
# ]
# ///

"""
dizzy-skel: audio drama pipeline for Dizzy (Diziet Sma) and Skel (Skaffen-Amtiskaw).

Usage:
    uv run --prerelease=allow main.py epub --list
    uv run --prerelease=allow main.py epub --chapter "One"
    uv run --prerelease=allow main.py vtt-search --at 00:26:28 --search "turbine hall"
    uv run --prerelease=allow main.py vtt-search --at 00:26:28 --search "turbine hall" --verify
    uv run --prerelease=allow main.py vtt-search --at 00:26:28 --search "turbine hall" --play
    uv run --prerelease=allow main.py play --start 00:26:32 --duration 3
    uv run --prerelease=allow main.py prepare-voice-sample --start 00:26:49 --duration 15 --name kenny --text "Music filled..."
    uv run --prerelease=allow main.py speak --voice kenny --text "Hello from the Culture"
"""

import argparse
import html
import re
import subprocess
import sys
from pathlib import Path

AUDIOBOOK = "/Volumes/Space/Reading/audiobooks/Iain M. Banks - Culture Novels/Iain M. Banks - Culture 03 - Use Of Weapons/Iain M. Banks - Culture 03 - Use Of Weapons.m4b"
EPUB = "/Volumes/Space/Reading/audiobooks/Iain M. Banks - Culture Novels/Iain M. Banks - Culture 03 - Use Of Weapons/Iain M. Banks - Culture 03 - Use Of Weapons.epub"
VTT = "data/vtt/Iain M. Banks - Culture 03 - Use Of Weapons.vtt"
TMP_DIR = Path("data/tmp")
WHISPER_MODEL = "../../bun-one/apps/whisper/data/models/ggml-tiny.en.bin"
VOICE_SAMPLE_DIR = Path("data/voice-samples")
OUTPUT_DIR = Path("data/output")
MODEL_ID = "mlx-community/Qwen3-TTS-12Hz-1.7B-Base-bf16"


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


# --- prepare-voice-sample ---

def cmd_prepare_voice_sample(args):
    """Save a voice sample (24kHz mono WAV) with canonical text from the epub."""
    start = parse_timestamp(args.start)
    duration = args.duration
    name = args.name

    if not args.text and not args.text_file:
        print("Canonical text required (use --text or --text-file)", file=sys.stderr)
        sys.exit(1)

    if args.text_file:
        text = Path(args.text_file).read_text().strip()
    else:
        text = args.text

    # 24kHz mono for qwen3-tts speaker encoder
    output = VOICE_SAMPLE_DIR / f"{name}.wav"
    print(f"Extracting {duration}s from {args.start} -> {output}")
    extract_audio(start, duration, output, sample_rate=24000)

    txt_output = VOICE_SAMPLE_DIR / f"{name}.txt"
    txt_output.write_text(text.strip() + "\n")

    print(f"Text: {text[:80]}{'...' if len(text) > 80 else ''}")
    print(f"Saved: {output} + {txt_output}")
    print(f"ffplay -autoexit -nodisp -hide_banner -loglevel error {output}")


# --- speak ---

def cmd_speak(args):
    import numpy as np
    import soundfile as sf
    import mlx.core as mx
    from mlx_audio.tts.utils import load_model

    voice_wav = VOICE_SAMPLE_DIR / f"{args.voice}.wav"
    voice_txt = VOICE_SAMPLE_DIR / f"{args.voice}.txt"
    if not voice_wav.exists() or not voice_txt.exists():
        print(f"Voice sample not found: {voice_wav}", file=sys.stderr)
        print(f"Run: main.py prepare-voice-sample --name {args.voice} ... first", file=sys.stderr)
        sys.exit(1)

    ref_text = voice_txt.read_text().strip()

    if args.text_file:
        text = Path(args.text_file).read_text().strip()
    else:
        text = args.text

    if not text:
        print("No text provided (use --text or --text-file)", file=sys.stderr)
        sys.exit(1)

    print(f"Loading model: {MODEL_ID}")
    model = load_model(MODEL_ID)

    ref_audio, _ = sf.read(str(voice_wav))
    if ref_audio.ndim > 1:
        ref_audio = ref_audio.mean(axis=1)
    ref_audio_mx = mx.array(ref_audio)

    print(f"Voice: {args.voice}")
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
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output = OUTPUT_DIR / f"speak_{args.voice}.wav"
    sf.write(str(output), np.array(results[0].audio), model.sample_rate)

    print(f"Output: {output}")
    print(f"ffplay -autoexit -nodisp -hide_banner -loglevel error {output}")
    if args.play:
        play_audio(output)


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

    # prepare-voice-sample
    p_pvs = sub.add_parser("prepare-voice-sample", help="Extract voice sample (24kHz mono) with canonical text")
    p_pvs.add_argument("--start", required=True, help="Start timecode (HH:MM:SS)")
    p_pvs.add_argument("--duration", type=float, default=20, help="Duration in seconds")
    p_pvs.add_argument("--name", required=True, help="Speaker name (used for output filenames)")
    text_group_pvs = p_pvs.add_mutually_exclusive_group()
    text_group_pvs.add_argument("--text", type=str, help="Canonical text from the book")
    text_group_pvs.add_argument("--text-file", type=str, help="Read canonical text from file")

    # speak
    p_speak = sub.add_parser("speak", help="Generate speech using a cloned voice")
    p_speak.add_argument("--voice", required=True, help="Voice name (must have sample in data/voice-samples/)")
    text_group_speak = p_speak.add_mutually_exclusive_group()
    text_group_speak.add_argument("--text", type=str, help="Text to speak")
    text_group_speak.add_argument("--text-file", type=str, help="Read text from file")
    p_speak.add_argument("--play", action="store_true", help="Play audio after generation")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)

    commands = {
        "epub": cmd_epub,
        "vtt-search": cmd_vtt_search,
        "play": cmd_play,
        "prepare-voice-sample": cmd_prepare_voice_sample,
        "speak": cmd_speak,
    }
    commands[args.command](args)


if __name__ == "__main__":
    main()
