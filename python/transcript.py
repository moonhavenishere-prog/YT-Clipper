#!/usr/bin/env python3
"""Fetch a YouTube transcript and write it as clean, timestamped JSON.

Responsibility (per CLAUDE.md): this script ONLY fetches transcripts and
outputs clean JSON. It does not select clips, download video, or touch
FFmpeg/Remotion.

Usage:
    python python/transcript.py <youtube_url_or_video_id> [--output data/transcript.json]
"""

import argparse
import json
import re
import sys
from pathlib import Path

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import CouldNotRetrieveTranscript

VIDEO_ID_RE = re.compile(
    r"(?:v=|\/shorts\/|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{11})"
)


def extract_video_id(url_or_id: str) -> str:
    """Accept a raw video ID or any common YouTube URL shape."""
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", url_or_id):
        return url_or_id
    match = VIDEO_ID_RE.search(url_or_id)
    if not match:
        raise ValueError(f"Could not extract a video ID from: {url_or_id}")
    return match.group(1)


def fetch_transcript(video_id: str) -> list[dict]:
    """Return a list of {start, duration, text} segments."""
    raw_segments = YouTubeTranscriptApi().fetch(video_id)
    return [
        {
            "start": round(segment.start, 2),
            "duration": round(segment.duration, 2),
            "text": segment.text.strip(),
        }
        for segment in raw_segments
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", help="YouTube URL or 11-character video ID")
    parser.add_argument(
        "--output",
        default="data/transcript.json",
        help="Path to write the transcript JSON (default: data/transcript.json)",
    )
    args = parser.parse_args()

    try:
        video_id = extract_video_id(args.source)
        segments = fetch_transcript(video_id)
    except (ValueError, CouldNotRetrieveTranscript) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps({"video_id": video_id, "segments": segments}, indent=2),
        encoding="utf-8",
    )

    print(f"Wrote {len(segments)} segments to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
