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
    uv run --prerelease=allow main.py vtt --at 00:26:28 --window 30
    uv run --prerelease=allow main.py vtt --at 00:26:28 --search "turbine hall"
"""

import argparse
import html
import re
import sys
from pathlib import Path

AUDIOBOOK = "/Volumes/Space/Reading/audiobooks/Iain M. Banks - Culture Novels/Iain M. Banks - Culture 03 - Use Of Weapons/Iain M. Banks - Culture 03 - Use Of Weapons.m4b"
EPUB = "/Volumes/Space/Reading/audiobooks/Iain M. Banks - Culture Novels/Iain M. Banks - Culture 03 - Use Of Weapons/Iain M. Banks - Culture 03 - Use Of Weapons.epub"
VTT = "data/vtt/Iain M. Banks - Culture 03 - Use Of Weapons.vtt"


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
    # collapse runs of blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


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
        # search for a chapter by matching the start of its text content
        target = args.chapter.lower()
        for item in items:
            body = strip_html(item.get_content())
            # chapter titles tend to appear in the first few lines
            first_lines = body[:200].lower()
            if target in first_lines:
                print(body)
                return
        print(f"No chapter matching '{args.chapter}' found.", file=sys.stderr)
        sys.exit(1)


def cmd_vtt(args):
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
        print(f"  {text}")
        print()


def main():
    parser = argparse.ArgumentParser(description="dizzy-skel audio drama pipeline")
    sub = parser.add_subparsers(dest="command")

    # epub
    p_epub = sub.add_parser("epub", help="Extract text from the epub")
    p_epub.add_argument("--epub", default=EPUB, help="Path to epub file")
    p_epub.add_argument("--list", action="store_true", help="List all document items")
    p_epub.add_argument("--chapter", type=str, help="Extract chapter by title match")

    # vtt
    p_vtt = sub.add_parser("vtt", help="Search the VTT around a timecode")
    p_vtt.add_argument("--vtt", default=VTT, help="Path to VTT file")
    p_vtt.add_argument("--at", required=True, help="Timecode to search around (HH:MM:SS)")
    p_vtt.add_argument("--window", type=int, default=30, help="Seconds ± to search")
    p_vtt.add_argument("--search", type=str, help="Filter cues containing this text")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)

    commands = {"epub": cmd_epub, "vtt": cmd_vtt}
    commands[args.command](args)


if __name__ == "__main__":
    main()
