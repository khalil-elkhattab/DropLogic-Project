"""Public URL helpers — static assets must use the Droplet origin, not the Vercel frontend."""

from __future__ import annotations

import os
import re
from urllib.parse import urlparse

DEFAULT_DROPLET_ORIGIN = "http://164.90.235.14:8001"

# Hosts that serve the Next.js app, not FastAPI /static files.
FRONTEND_HOST_MARKERS = (
    "droplogicai.com",
    "vercel.app",
    "localhost:3000",
    "127.0.0.1:3000",
)


def _normalize_origin(raw: str) -> str:
    origin = (raw or "").strip().rstrip("/")
    if origin.endswith("/api"):
        origin = origin[:-4]
    origin = re.sub(r"^(https?):/([^/])", r"\1://\2", origin, count=1)
    if not re.match(r"^https?://", origin, re.IGNORECASE):
        origin = f"http://{origin.lstrip('/')}"
    return origin


def _is_frontend_host(hostname: str | None) -> bool:
    if not hostname:
        return False
    host = hostname.lower()
    return any(marker in host for marker in FRONTEND_HOST_MARKERS)


def backend_public_origin() -> str:
    """
    Origin where FastAPI exposes ``/static`` and ``/api`` for external fetchers
    (Json2Video, Renderform, direct downloads).

    Priority:
    1. BACKEND_PUBLIC_URL / DROPLET_PUBLIC_URL / FASTAPI_PUBLIC_URL
    2. SERVER_PUBLIC_URL only when it is NOT a frontend (Vercel) domain
    3. DEFAULT_DROPLET_ORIGIN
    """
    for env_key in (
        "BACKEND_PUBLIC_URL",
        "DROPLET_PUBLIC_URL",
        "FASTAPI_PUBLIC_URL",
    ):
        raw = (os.getenv(env_key) or "").strip()
        if raw:
            return _normalize_origin(raw)

    server_public = (os.getenv("SERVER_PUBLIC_URL") or "").strip()
    if server_public:
        normalized = _normalize_origin(server_public)
        if not _is_frontend_host(urlparse(normalized).hostname):
            return normalized

    return DEFAULT_DROPLET_ORIGIN


def static_asset_url(relative_path: str) -> str:
    """Build an absolute URL for a file under ``/static/...`` on the Droplet."""
    path = relative_path if relative_path.startswith("/") else f"/{relative_path}"
    if not path.startswith("/static/"):
        path = f"/static/{path.lstrip('/')}"
    return f"{backend_public_origin()}{path}"


def api_public_url(path: str) -> str:
    """Build an absolute URL for a FastAPI route on the Droplet."""
    clean = path if path.startswith("/") else f"/{path}"
    if not clean.startswith("/api/"):
        clean = f"/api/{clean.lstrip('/')}"
    return f"{backend_public_origin()}{clean}"
