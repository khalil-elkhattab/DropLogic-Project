"""Burned-in TikTok / Alex Hormozi style caption generator (ASS subtitles for FFmpeg)."""

from __future__ import annotations

import os
import re
import subprocess
from dataclasses import dataclass


@dataclass
class CaptionCue:
    text: str
    start: float
    end: float
    style: str


def get_media_duration_seconds(media_path: str) -> float:
    if not os.path.exists(media_path):
        return 0.0

    result = subprocess.run(
        [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            media_path,
        ],
        capture_output=True,
        text=True,
        check=False,
    )

    try:
        return max(float(result.stdout.strip()), 0.0)
    except ValueError:
        return 0.0


def _normalize_text(text: str) -> str:
    cleaned = re.sub(r'\s+', ' ', text or '').strip()
    return cleaned.upper()


def _chunk_phrases(text: str, max_words: int = 5) -> list[str]:
    words = _normalize_text(text).split()
    if not words:
        return []

    chunks: list[str] = []
    for index in range(0, len(words), max_words):
        chunks.append(' '.join(words[index:index + max_words]))
    return chunks


def _format_ass_time(seconds: float) -> str:
    seconds = max(0.0, seconds)
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    return f'{hours}:{minutes:02d}:{secs:05.2f}'


def _escape_ass(text: str) -> str:
    return (
        text.replace('\\', r'\\')
        .replace('{', r'\{')
        .replace('}', r'\}')
        .replace('\n', r'\N')
    )


def build_caption_cues(
    hook: str,
    body: str,
    cta: str,
    duration_seconds: float,
) -> list[CaptionCue]:
    """Split hook/body/cta across the timeline proportional to word count."""
    sections = [
        ('TikTokYellow', hook),
        ('TikTokGreen', body),
        ('TikTokYellow', cta),
    ]

    weighted_chunks: list[tuple[str, str, int]] = []
    for style, text in sections:
        for phrase in _chunk_phrases(text):
            weighted_chunks.append((style, phrase, max(len(phrase.split()), 1)))

    if not weighted_chunks:
        return []

    total_weight = sum(weight for _, _, weight in weighted_chunks)
    timeline: list[CaptionCue] = []
    cursor = 0.0

    for index, (style, phrase, weight) in enumerate(weighted_chunks):
        if index == len(weighted_chunks) - 1:
            end = duration_seconds
        else:
            segment = duration_seconds * (weight / total_weight)
            end = min(cursor + segment, duration_seconds)

        if end - cursor >= 0.35:
            timeline.append(CaptionCue(text=phrase, start=cursor, end=end, style=style))

        cursor = end

    if timeline:
        timeline[-1].end = duration_seconds

    return timeline


def write_ass_subtitle(cues: list[CaptionCue], output_path: str) -> str:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    header = """[Script Info]
Title: DropLogic Captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: TikTokYellow,Arial Black,82,&H0000FFFF,&H000000FF,&H00000000,&H96000000,-1,0,0,0,100,100,0,0,1,5,1,2,50,50,340,1
Style: TikTokGreen,Arial Black,82,&H0000FF00,&H000000FF,&H00000000,&H96000000,-1,0,0,0,100,100,0,0,1,5,1,2,50,50,340,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    lines = [header]
    for cue in cues:
        lines.append(
            'Dialogue: 0,{start},{end},{style},,0,0,0,,{text}'.format(
                start=_format_ass_time(cue.start),
                end=_format_ass_time(cue.end),
                style=cue.style,
                text=_escape_ass(cue.text),
            )
        )

    with open(output_path, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(lines))

    return output_path


def generate_burned_captions(
    hook: str,
    body: str,
    cta: str,
    audio_path: str,
    output_path: str,
    fallback_duration: float = 15.0,
) -> str | None:
    duration = get_media_duration_seconds(audio_path) or fallback_duration
    cues = build_caption_cues(hook, body, cta, duration)

    if not cues:
        return None

    return write_ass_subtitle(cues, output_path)
