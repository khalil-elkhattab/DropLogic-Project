import logging
import os
import shutil

import numpy as np
from gtts import gTTS
from pedalboard.io import AudioFile

logger = logging.getLogger("droplogic.audio")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MUSIC_DIR = os.path.join(BASE_DIR, "assets", "music")
OUTPUT_DIR = os.path.join(BASE_DIR, "static", "outputs")

# Frontend / API aliases → on-disk stem
MUSIC_STEM_ALIASES = {
    "tiktok_trend_01": "lofi",
    "tiktok_trend_02": "cyberpunk",
    "lofi_chill": "lofi",
}

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(MUSIC_DIR, exist_ok=True)


def generate_voice_over(
    text: str,
    voice_profile: str,
    *,
    job_suffix: str | None = None,
) -> str:
    print(f"[🎙️ TTS ENGINE] Generating voiceover for profile: '{voice_profile}'")
    lang = "en"
    tld = "com"

    if "male" in voice_profile.lower() or "adam" in voice_profile.lower():
        tld = "co.uk"
    elif "oliver" in voice_profile.lower():
        tld = "ca"

    suffix = (job_suffix or os.urandom(4).hex()).strip() or os.urandom(4).hex()
    temp_voice_path = os.path.join(OUTPUT_DIR, f"voice_{suffix}.mp3")
    tts = gTTS(text=text, lang=lang, tld=tld, slow=False)
    tts.save(temp_voice_path)

    print(f"[🟢 TTS COMPLETED] Temporary voice saved at: {temp_voice_path}")
    return temp_voice_path


def _resolve_music_stem(bg_music_type: str) -> str:
    key = (bg_music_type or "none").strip().lower()
    if key in {"", "none"}:
        return "none"
    return MUSIC_STEM_ALIASES.get(key, key)


def _skip_music_mix_fallback(voice_path: str, output_path: str) -> str:
    """
    Use clean voice only when background music cannot be loaded.
    Uses shutil.copyfile when extensions match; otherwise transcodes voice → WAV.
    """
    logger.warning(
        "Skipping background music mix — falling back to voice-only output: %s",
        output_path,
    )

    voice_ext = os.path.splitext(voice_path)[1].lower()
    output_ext = os.path.splitext(output_path)[1].lower()

    try:
        if (
            voice_ext == output_ext
            and os.path.isfile(voice_path)
            and os.path.getsize(voice_path) > 0
        ):
            shutil.copyfile(voice_path, output_path)
            print(f"[⚠️ MIXER] Voice copied without background music: {output_path}")
            return output_path
    except OSError as exc:
        logger.warning("shutil.copyfile voice fallback failed: %s", exc)

    with AudioFile(voice_path) as src:
        voice_audio = src.read(src.frames)
        with AudioFile(output_path, "w", src.samplerate, src.num_channels) as dst:
            dst.write(voice_audio)

    print(f"[⚠️ MIXER] Voice exported without background music: {output_path}")
    return output_path


def mix_voice_and_background(voice_path: str, bg_music_type: str, output_filename: str) -> str:
    print(f"[🎵 AUDIO MIXER] Mixing voice with background music: '{bg_music_type}'")
    final_output_path = os.path.join(OUTPUT_DIR, f"{output_filename}.wav")

    if not os.path.exists(voice_path) or os.path.getsize(voice_path) <= 0:
        print(f"[🚨 MIXER CRITICAL ERROR] Voice path missing or empty: {voice_path}")
        return final_output_path

    stem = _resolve_music_stem(bg_music_type)
    bg_music_path = os.path.join(MUSIC_DIR, f"{stem}.mp3")

    if stem == "none":
        print("[⚠️ MIXER] No background music requested.")
        return _skip_music_mix_fallback(voice_path, final_output_path)

    if not os.path.exists(bg_music_path) or os.path.getsize(bg_music_path) <= 0:
        print(f"[⚠️ MIXER] Background music missing or empty: {bg_music_path}")
        return _skip_music_mix_fallback(voice_path, final_output_path)

    try:
        with AudioFile(voice_path) as voice_file:
            voice_audio = voice_file.read(voice_file.frames)
            sample_rate = voice_file.samplerate
            num_channels = voice_file.num_channels

        with AudioFile(bg_music_path) as bg_file:
            bg_audio = bg_file.read(bg_file.frames)

        bg_audio = bg_audio * 0.12

        if bg_audio.shape[1] < voice_audio.shape[1]:
            repeats = int(np.ceil(voice_audio.shape[1] / bg_audio.shape[1]))
            bg_audio = np.tile(bg_audio, (1, repeats))

        bg_audio = bg_audio[:, : voice_audio.shape[1]]
        mixed_audio = voice_audio + bg_audio

        with AudioFile(final_output_path, "w", sample_rate, num_channels) as out_file:
            out_file.write(mixed_audio)

    except Exception as exc:
        logger.warning(
            "Background music load/mix failed for %r (%s) — using voice-only fallback",
            bg_music_path,
            exc,
        )
        return _skip_music_mix_fallback(voice_path, final_output_path)

    try:
        if os.path.exists(voice_path):
            os.remove(voice_path)
    except OSError as exc:
        print(f"[-] Error cleaning up temp file: {exc}")

    print(f"[🏆 MIXING SUCCESS] Final Master Audio baked perfectly at: {final_output_path}")
    return final_output_path
