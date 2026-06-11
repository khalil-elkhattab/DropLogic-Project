"""Resilient media URL validation and probing — never crashes the HTTP handler."""

from __future__ import annotations

import logging
from typing import Any

import httpx

from url_utils import normalize_media_url, sanitize_download_url

logger = logging.getLogger("droplogic.media")

BLOCKED_MEDIA_HOST_FRAGMENTS = (
    "shotstack.io",
    "shotstack.com",
    "api.shotstack",
)

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "*/*",
    "Referer": "https://www.tiktok.com/",
}


def is_blocked_media_host(url: str) -> bool:
    lowered = (url or "").lower()
    return any(fragment in lowered for fragment in BLOCKED_MEDIA_HOST_FRAGMENTS)


def resolve_bake_video_url(raw_url: str, *, backend_public_url: str) -> str | None:
    """
    Best-effort resolver for bake requests: unwraps proxy paths, fixes //cdn URLs,
    returns None instead of raising.
    """
    if raw_url is None:
        return None
    return coerce_media_url(str(raw_url).strip(), backend_public_url=backend_public_url)


def coerce_media_url(raw_url: str, *, backend_public_url: str) -> str | None:
    """
    Normalize any scraped/proxied URL to https/http.
    Returns None instead of raising when invalid or blocked (e.g. legacy Shotstack).
    """
    text = str(raw_url or "").strip()
    if not text or text.lower() in {"null", "undefined", "none"}:
        return None
    raw_url = text

    if is_blocked_media_host(str(raw_url)):
        logger.warning("Blocked legacy Shotstack URL (skipped): %r", raw_url)
        return None

    try:
        safe = sanitize_download_url(str(raw_url), backend_public_url=backend_public_url)
    except ValueError as exc:
        logger.warning("Invalid media URL %r: %s", raw_url, exc)
        return None

    if is_blocked_media_host(safe):
        logger.warning("Blocked legacy Shotstack URL after sanitize (skipped): %r", safe)
        return None

    return safe


async def probe_media_url(raw_url: str, *, backend_public_url: str) -> str | None:
    """HEAD/GET probe — returns sanitized URL if reachable, else None."""
    safe_url = coerce_media_url(raw_url, backend_public_url=backend_public_url)
    if not safe_url:
        return None

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=20.0) as client:
            response = await client.head(safe_url, headers=DEFAULT_HEADERS)
            if response.status_code >= 400:
                response = await client.get(
                    safe_url,
                    headers={**DEFAULT_HEADERS, "Range": "bytes=0-1"},
                )
            if response.status_code >= 400:
                logger.warning(
                    "Media probe failed (%s) for %s",
                    response.status_code,
                    safe_url[:160],
                )
                return None
        return safe_url
    except httpx.UnsupportedProtocol as exc:
        logger.warning("Unsupported protocol for %r: %s", raw_url, exc)
        return None
    except Exception as exc:
        logger.warning("Media probe error for %r: %s", raw_url, exc, exc_info=True)
        return None


async def download_media_to_file(
    raw_url: str,
    output_path: str,
    *,
    backend_public_url: str,
) -> bool:
    """Download a single asset; returns False on any failure without raising."""
    safe_url = coerce_media_url(raw_url, backend_public_url=backend_public_url)
    if not safe_url:
        return False

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
            response = await client.get(safe_url, headers=DEFAULT_HEADERS)
            if response.status_code != 200:
                logger.warning(
                    "Download failed (%s) for %s",
                    response.status_code,
                    safe_url[:160],
                )
                return False
            with open(output_path, "wb") as handle:
                handle.write(response.content)
        return True
    except Exception as exc:
        logger.warning("Download error for %r: %s", raw_url, exc, exc_info=True)
        return False


def sanitize_asset_record(asset: dict[str, Any], *, backend_public_url: str) -> dict[str, Any] | None:
    """Return a copy of an asset dict with a safe video_url, or None to skip."""
    if not isinstance(asset, dict):
        return None

    cleaned = dict(asset)
    raw_video = (
        cleaned.get("video_url")
        or cleaned.get("videoUrl")
        or cleaned.get("play")
        or cleaned.get("wmplay")
        or ""
    )
    safe_video = coerce_media_url(str(raw_video), backend_public_url=backend_public_url)
    if not safe_video:
        return None

    cleaned["video_url"] = safe_video
    return cleaned
