"""Normalize media URLs before httpx download / cloud render requests."""

from __future__ import annotations

import re
from urllib.parse import parse_qs, unquote, urlparse

BLOCKED_HOST_FRAGMENTS = (
    "shotstack.io",
    "shotstack.com",
    "api.shotstack",
)


def _backend_public_origin(public_url: str) -> str:
    origin = (public_url or "http://164.90.235.14:8001").strip().rstrip("/")
    if origin.endswith("/api"):
        origin = origin[:-4]
    return origin


def _reject_blocked_hosts(url: str) -> None:
    lowered = url.lower()
    for fragment in BLOCKED_HOST_FRAGMENTS:
        if fragment in lowered:
            raise ValueError(f"Legacy Shotstack URLs are disabled: {url}")


def normalize_media_url(raw_url: str) -> str:
    """
    Ensure an absolute http(s) URL suitable for httpx and cloud render APIs.

    - ``//cdn.tiktok.com/...`` → ``https://cdn.tiktok.com/...``
    - ``http:/host/...`` → ``http://host/...``
    - ``v16-webapp.tiktok.com/...`` → ``https://v16-webapp.tiktok.com/...``
    """
    url = (raw_url or "").strip()
    if not url:
        raise ValueError("Video URL is empty")

    if url.startswith("//"):
        url = f"https:{url}"

    url = re.sub(r"^(https?):/([^/])", r"\1://\2", url, count=1)

    if not re.match(r"^https?://", url, re.IGNORECASE):
        url = f"https://{url.lstrip('/')}"

    _reject_blocked_hosts(url)
    return url


def sanitize_download_url(raw_url: str, *, backend_public_url: str) -> str:
    """
    Full bake/analysis sanitizer: resolves proxy paths, unwraps nested ``url`` params,
    then normalizes to a protocol-safe absolute URL.
    """
    url = (raw_url or "").strip()
    if not url:
        raise ValueError("Video URL is empty")

    if url.startswith("/") and not url.startswith("//"):
        url = f"{_backend_public_origin(backend_public_url)}{url}"

    url = normalize_media_url(url)

    parsed = urlparse(url)
    if "proxy-video" in parsed.path:
        nested = parse_qs(parsed.query).get("url", [None])[0]
        if nested:
            return sanitize_download_url(unquote(nested), backend_public_url=backend_public_url)

    return url


def sanitize_asset_video_url(raw_url: str, *, backend_public_url: str = "") -> str | None:
    """Best-effort normalization for scraped assets; returns None if invalid."""
    try:
        if backend_public_url:
            return sanitize_download_url(raw_url, backend_public_url=backend_public_url)
        return normalize_media_url(raw_url)
    except ValueError:
        return None


_TIKTOK_PAGE_PATH = re.compile(
    r"^/(?:@[^/]+/video/\d+|t/[A-Za-z0-9]+)",
    re.IGNORECASE,
)
_TIKTOK_SHORT_HOST = re.compile(r"^(?:vm|vt)\.tiktok\.com$", re.IGNORECASE)


def is_likely_direct_video_cdn_url(url: str) -> bool:
    """True when the URL already points at TikTok CDN bytes (not a share/page link)."""
    lowered = (url or "").lower()
    if not lowered.startswith(("http://", "https://")):
        return False
    if "tiktokcdn" in lowered:
        return True
    if "/video/tos/" in lowered:
        return True
    if re.search(r"v\d+[-.].*\.tiktok", lowered) and "mime_type=video" in lowered:
        return True
    if lowered.endswith(".mp4"):
        return True
    return False


def is_tiktok_page_url(url: str) -> bool:
    """
    True for TikTok share/page links that must be resolved via the scraper API
    before httpx can download raw MP4 bytes.
    """
    text = (url or "").strip()
    if not text:
        return False
    if is_likely_direct_video_cdn_url(text):
        return False

    try:
        parsed = urlparse(normalize_media_url(text))
    except ValueError:
        return False

    host = (parsed.netloc or "").lower()
    if _TIKTOK_SHORT_HOST.match(host):
        return True

    if "tiktok.com" not in host:
        return False

    return bool(_TIKTOK_PAGE_PATH.match(parsed.path or ""))
