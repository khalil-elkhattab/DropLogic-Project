"""Resolve and normalize Supabase URL + service role key from environment."""

from __future__ import annotations

import os
from urllib.parse import urlparse

DEFAULT_SUPABASE_URL = "https://hlifddtiptsevnueasu.supabase.co"

_INVALID_LITERALS = {
    "",
    "undefined",
    "null",
    "none",
    "your-supabase-url",
    "your_project_url",
}


def _clean_env(raw: str | None) -> str:
    return (raw or "").strip().strip('"').strip("'")


def normalize_supabase_url(raw: str | None) -> str:
    """
    Normalize SUPABASE_URL from .env / process environment.
    Handles quoted values, missing scheme, and bare project refs (adds .supabase.co).
    """
    cleaned = _clean_env(raw)
    if not cleaned or cleaned.lower() in _INVALID_LITERALS:
        cleaned = DEFAULT_SUPABASE_URL

    candidate = cleaned.rstrip("/")

    if not candidate.startswith(("http://", "https://")):
        candidate = f"https://{candidate.lstrip('/')}"

    parsed = urlparse(candidate)
    host = parsed.hostname or ""

    if host and "." not in host:
        host = f"{host}.supabase.co"
        candidate = f"https://{host}"

    parsed = urlparse(candidate)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise ValueError(
            f"Invalid SUPABASE_URL {raw!r}. Expected https://<project-ref>.supabase.co"
        )

    return f"{parsed.scheme}://{parsed.hostname}"


def get_supabase_url() -> str:
    return normalize_supabase_url(os.getenv("SUPABASE_URL"))


def get_supabase_service_role_key() -> str:
    key = _clean_env(os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
    if not key or key.lower() in _INVALID_LITERALS:
        return ""
    return key


def supabase_configured() -> bool:
    return bool(get_supabase_url() and get_supabase_service_role_key())
