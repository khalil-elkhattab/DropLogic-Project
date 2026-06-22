"""Local FFmpeg bake: loop source video until voiceover ends + strict 9:16 vertical output."""

from __future__ import annotations

import hashlib
import logging
import os
import random
import secrets
import subprocess
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Optional

from caption_engine import get_media_duration_seconds

logger = logging.getLogger("droplogic.video_baker")

OUTPUT_WIDTH = 1080
OUTPUT_HEIGHT = 1920
OUTPUT_FPS = 30
OUTPUT_SAMPLE_RATE = 44100

# Smartphone metadata presets injected into every anti-ban export.
_SMARTPHONE_PRESETS: tuple[dict[str, str], ...] = (
    {"make": "Apple", "model": "iPhone 15 Pro", "software": "17.4.1"},
    {"make": "Apple", "model": "iPhone 14", "software": "17.2.1"},
    {"make": "Apple", "model": "iPhone 13", "software": "16.7.2"},
    {"make": "Samsung", "model": "SM-S918B", "software": "Android 14"},
    {"make": "Samsung", "model": "SM-S911B", "software": "Android 13"},
    {"make": "Google", "model": "Pixel 8 Pro", "software": "Android 14"},
)


class FFmpegBakeError(Exception):
    """Raised when FFmpeg is missing or the bake command fails."""


@dataclass(frozen=True)
class AntiBanProfile:
    """Per-render uniquification parameters (new values every bake)."""

    enabled: bool
    mirror: bool = True
    video_speed: float = 1.03
    zoom_factor: float = 1.02
    eq_contrast: float = 1.02
    eq_brightness: float = 0.012
    eq_saturation: float = 1.025
    audio_tempo: float = 0.97
    audio_pitch: float = 1.012
    metadata: dict[str, str] = field(default_factory=dict)

    def summary(self) -> str:
        if not self.enabled:
            return "anti-ban=off"
        return (
            f"mirror={self.mirror} speed={self.video_speed:.4f} zoom={self.zoom_factor:.4f} "
            f"eq(c={self.eq_contrast:.3f},b={self.eq_brightness:.4f},s={self.eq_saturation:.3f}) "
            f"audio(tempo={self.audio_tempo:.4f},pitch={self.audio_pitch:.4f})"
        )


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


def _random_creation_time() -> str:
    """ISO-8601 UTC timestamp within the last 45 days (looks like a fresh phone capture)."""
    now = datetime.now(timezone.utc)
    offset_sec = random.randint(0, 45 * 24 * 3600)
    captured = now - timedelta(seconds=offset_sec)
    return captured.strftime("%Y-%m-%dT%H:%M:%S.000000Z")


def _build_smartphone_metadata() -> dict[str, str]:
    preset = random.choice(_SMARTPHONE_PRESETS)
    noise = secrets.token_hex(4)
    return {
        "creation_time": _random_creation_time(),
        "title": "",
        "comment": f"dl-{uuid.uuid4().hex}",
        "encoder": f"Lavf{random.randint(58, 61)}.{random.randint(10, 99)}.{random.randint(100, 999)}",
        "make": preset["make"],
        "model": preset["model"],
        "software": preset["software"],
        "com.apple.quicktime.make": preset["make"],
        "com.apple.quicktime.model": preset["model"],
        "com.apple.quicktime.software": preset["software"],
        "com.android.version": preset["software"],
        "location": (
            f"{random.uniform(-85.0, 85.0):+.6f}"
            f"{random.uniform(-175.0, 175.0):+.6f}"
        ),
        "dl_render_nonce": noise,
    }


def build_anti_ban_profile(
    *,
    enabled: bool,
    video_scale: Optional[float] = None,
) -> AntiBanProfile:
    """
    Build randomized anti-duplication parameters for one bake.

    ``video_scale`` from the API: values > 1.0 are treated as zoom (1.01–1.05).
    Legacy cloud value 0.9 is ignored; a random 1–3% zoom is used instead.
    """
    if not enabled:
        return AntiBanProfile(enabled=False)

    if video_scale is not None and 1.0 < video_scale <= 1.05:
        zoom = float(video_scale)
    else:
        zoom = random.uniform(1.01, 1.03)

    return AntiBanProfile(
        enabled=True,
        mirror=True,
        video_speed=random.uniform(1.018, 1.032),
        zoom_factor=zoom,
        eq_contrast=random.uniform(1.008, 1.028),
        eq_brightness=random.uniform(0.004, 0.022),
        eq_saturation=random.uniform(1.012, 1.038),
        audio_tempo=random.uniform(0.968, 0.982),
        audio_pitch=random.uniform(1.008, 1.018),
        metadata=_build_smartphone_metadata(),
    )


def _vertical_scale_crop_chain() -> str:
    return (
        f"scale={OUTPUT_WIDTH}:{OUTPUT_HEIGHT}:force_original_aspect_ratio=increase,"
        f"crop={OUTPUT_WIDTH}:{OUTPUT_HEIGHT}"
    )


def _build_video_filter(
    *,
    profile: AntiBanProfile,
    subtitle_path: Optional[str],
) -> str:
    """Assemble video filter chain: mirror, speed, zoom, color grade, 9:16, captions."""
    if profile.enabled:
        zoom_w = max(1, round(OUTPUT_WIDTH * profile.zoom_factor))
        zoom_h = max(1, round(OUTPUT_HEIGHT * profile.zoom_factor))
        chain = _vertical_scale_crop_chain()
        if profile.mirror:
            chain = f"hflip,{chain}"
        chain = f"setpts=PTS*{profile.video_speed:.6f},{chain}"
        chain = (
            f"scale={zoom_w}:{zoom_h}:flags=lanczos,"
            f"crop={OUTPUT_WIDTH}:{OUTPUT_HEIGHT},"
            f"eq=contrast={profile.eq_contrast:.4f}:"
            f"brightness={profile.eq_brightness:.4f}:"
            f"saturation={profile.eq_saturation:.4f},"
            f"setsar=1"
        )
    else:
        chain = f"{_vertical_scale_crop_chain()},setsar=1"

    if subtitle_path and os.path.isfile(subtitle_path):
        esc = _escape_subtitle_path(subtitle_path)
        return f"[0:v]{chain},subtitles='{esc}'[v]"

    return f"[0:v]{chain}[v]"


def _build_audio_filter(profile: AntiBanProfile) -> Optional[str]:
    """
    Micro pitch + tempo shift so audio fingerprinting sees a unique waveform.
    asetrate shifts pitch/speed together; atempo compensates to the target tempo.
    """
    if not profile.enabled:
        return None

    asetrate = max(8000, int(OUTPUT_SAMPLE_RATE * profile.audio_pitch))
    atempo = profile.audio_tempo / profile.audio_pitch
    # FFmpeg atempo accepts ~0.5–2.0 per instance; chain if needed.
    if 0.5 <= atempo <= 2.0:
        tempo_filter = f"atempo={atempo:.6f}"
    elif atempo < 0.5:
        tempo_filter = f"atempo=0.5,atempo={atempo / 0.5:.6f}"
    else:
        tempo_filter = f"atempo=2.0,atempo={atempo / 2.0:.6f}"

    return (
        f"[1:a]asetrate={asetrate},aresample={OUTPUT_SAMPLE_RATE},"
        f"{tempo_filter},aformat=sample_rates={OUTPUT_SAMPLE_RATE}:channel_layouts=stereo[a]"
    )


def _metadata_args(metadata: dict[str, str]) -> list[str]:
    """Strip inherited metadata and inject smartphone-style tags."""
    args = ["-map_metadata", "-1"]
    for key, value in metadata.items():
        if value is not None and str(value).strip() != "":
            args.extend(["-metadata", f"{key}={value}"])
    return args


def _output_md5(path: str) -> str:
    digest = hashlib.md5()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def bake_final_mp4(
    *,
    source_video_path: str,
    audio_path: str,
    output_path: str,
    anti_ban_filter: bool = False,
    video_scale: Optional[float] = None,
    subtitle_path: Optional[str] = None,
) -> str:
    """
    Loop the input video until the mixed AI audio ends (-stream_loop -1 + -shortest).
    Output is H.264/AAC MP4 at 1080x1920 for native TikTok vertical playback.

    When ``anti_ban_filter`` is True, applies mirror, micro-zoom, color grade,
    audio pitch/tempo shift, and unique smartphone metadata (unique MD5 per render).
    """
    if not ffmpeg_available():
        raise FFmpegBakeError("ffmpeg is not installed or not on PATH")

    if not os.path.isfile(source_video_path) or os.path.getsize(source_video_path) < 1024:
        raise FFmpegBakeError(f"Source video missing or empty: {source_video_path}")

    if not os.path.isfile(audio_path) or os.path.getsize(audio_path) < 256:
        raise FFmpegBakeError(f"Audio track missing or empty: {audio_path}")

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    profile = build_anti_ban_profile(enabled=anti_ban_filter, video_scale=video_scale)
    audio_duration = get_media_duration_seconds(audio_path)
    logger.info(
        "[FFmpeg] Baking vertical MP4 | audio=%.2fs | %s | source=%s",
        audio_duration,
        profile.summary(),
        source_video_path,
    )

    video_filter = _build_video_filter(profile=profile, subtitle_path=subtitle_path)
    audio_filter = _build_audio_filter(profile)
    filter_complex = video_filter if not audio_filter else f"{video_filter};{audio_filter}"

    cmd: list[str] = [
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
        "[a]" if audio_filter else "1:a:0",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "23",
        "-pix_fmt",
        "yuv420p",
        "-r",
        str(OUTPUT_FPS),
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-ar",
        str(OUTPUT_SAMPLE_RATE),
        "-shortest",
        "-movflags",
        "+faststart",
    ]

    if profile.enabled and profile.metadata:
        cmd.extend(_metadata_args(profile.metadata))

    cmd.append(output_path)

    result = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        tail = (result.stderr or result.stdout or "")[-2000:]
        raise FFmpegBakeError(f"FFmpeg bake failed (code {result.returncode}): {tail}")

    if not os.path.isfile(output_path) or os.path.getsize(output_path) < 2048:
        raise FFmpegBakeError("FFmpeg produced an empty or missing output file")

    out_md5 = _output_md5(output_path)
    out_duration = get_media_duration_seconds(output_path)
    logger.info(
        "[FFmpeg] Bake complete → %s (%.2fs) md5=%s | %s",
        output_path,
        out_duration,
        out_md5,
        profile.summary(),
    )
    return output_path
