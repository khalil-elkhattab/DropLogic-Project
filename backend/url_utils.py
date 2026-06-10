"""Normalize asset URLs before httpx download requests."""

from __future__ import annotations

import re
from urllib.parse import parse_qs, unquote, urlparse


def _backend_public_origin(public_url: str) -> str:
    origin = (public_url or "http://164.90.235.14:8000").strip().rstrip("/")
    if origin.endswith("/api"):
        origin = origin[:-4]
    return origin


def sanitize_download_url(raw_url: str, *, backend_public_url: str) -> str:
    """
    Ensure a fully qualified http(s) URL for httpx.

    - ``//cdn.example.com/...`` → ``https://cdn.example.com/...``
    - ``http:/host/...`` → ``http://host/...``
    - ``/api/proxy-video?url=...`` → resolved against backend public origin, then unwrapped
    - Proxy URLs with embedded ``url`` query → inner TikTok/CDN source URL
    """
    url = (raw_url or "").strip()
    if not url:
        raise ValueError("Video URL is empty")

    if url.startswith("//"):
        url = f"https:{url}"

    url = re.sub(r"^(https?):/([^/])", r"\1://\2", url, count=1)

    if url.startswith("/"):
        url = f"{_backend_public_origin(backend_public_url)}{url}"

    if not re.match(r"^https?://", url, re.IGNORECASE):
        url = f"https://{url.lstrip('/')}"

    parsed = urlparse(url)
    if "proxy-video" in parsed.path:
        nested = parse_qs(parsed.query).get("url", [None])[0]
        if nested:
            return sanitize_download_url(unquote(nested), backend_public_url=backend_public_url)

    return url
