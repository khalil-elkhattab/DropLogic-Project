"""Local FFmpeg bake: loop source video until voiceover ends + strict 9:16 vertical output."""

from __future__ import annotations

import logging
import os
import subprocess
from typing import Optional

from caption_engine import get_media_duration_seconds

logger = logging.getLogger("droplogic.video_baker")

OUTPUT_WIDTH = 1080
OUTPUT_HEIGHT = 1920


class FFmpegBakeError(Exception):
    """Raised when FFmpeg is missing or the bake command fails."""


def ffmpeg_available() -> bool:
    try:
        subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True,
            check=True,
            timeout=10,
        )
        return True
    except (FileNotFoundError, subprocess.CalledProcessError, OSError):
        return False


def _escape_subtitle_path(path: str) -> str:
    """Escape path for FFmpeg subtitles filter (Windows-safe)."""
    normalized = os.path.abspath(path).replace("\\", "/")
    return normalized.replace(":", r"\:").replace("'", r"\'")


def _build_video_filter(*, anti_ban_filter: bool, subtitle_path: Optional[str]) -> str:
    """Scale/crop to 1080x1920 (9:16), optional anti-ban + burned captions."""
    chain = (
        f"scale={OUTPUT_WIDTH}:{OUTPUT_HEIGHT}:force_original_aspect_ratio=increase,"
        f"crop={OUTPUT_WIDTH}:{OUTPUT_HEIGHT},setsar=1"
    )
    if anti_ban_filter:
        chain = f"hflip,setpts=PTS*1.03,{chain}"

    if subtitle_path and os.path.isfile(subtitle_path):
        esc = _escape_subtitle_path(subtitle_path)
        return f"[0:v]{chain},subtitles='{esc}'[v]"

    return f"[0:v]{chain}[v]"


def bake_final_mp4(
    *,
    source_video_path: str,
    audio_path: str,
    output_path: str,
    anti_ban_filter: bool = False,
    subtitle_path: Optional[str] = None,
) -> str:
    """
    Loop the input video until the mixed AI audio ends (-stream_loop -1 + -shortest).
    Output is H.264/AAC MP4 at 1080x1920 for native TikTok vertical playback.
    """
    if not ffmpeg_available():
        raise FFmpegBakeError("ffmpeg is not installed or not on PATH")

    if not os.path.isfile(source_video_path) or os.path.getsize(source_video_path) < 1024:
        raise FFmpegBakeError(f"Source video missing or empty: {source_video_path}")

    if not os.path.isfile(audio_path) or os.path.getsize(audio_path) < 256:
        raise FFmpegBakeError(f"Audio track missing or empty: {audio_path}")

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    audio_duration = get_media_duration_seconds(audio_path)
    logger.info(
        "[FFmpeg] Baking vertical MP4 | audio=%.2fs | source=%s",
        audio_duration,
        source_video_path,
    )

    filter_complex = _build_video_filter(
        anti_ban_filter=anti_ban_filter,
        subtitle_path=subtitle_path,
    )

    cmd = [
        "ffmpeg",
        "-y",
        "-stream_loop",
        "-1",
        "-i",
        source_video_path,
        "-i",
        audio_path,
        "-filter_complex",
        filter_complex,
        "-map",
        "[v]",
        "-map",
        "1:a:0",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "23",
        "-pix_fmt",
        "yuv420p",
        "-r",
        "30",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-ar",
        "44100",
        "-shortest",
        "-movflags",
        "+faststart",
        output_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        tail = (result.stderr or result.stdout or "")[-1200:]
        raise FFmpegBakeError(f"FFmpeg bake failed (code {result.returncode}): {tail}")

    if not os.path.isfile(output_path) or os.path.getsize(output_path) < 2048:
        raise FFmpegBakeError("FFmpeg produced an empty or missing output file")

    out_duration = get_media_duration_seconds(output_path)
    logger.info("[FFmpeg] Bake complete → %s (%.2fs)", output_path, out_duration)
    return output_path
