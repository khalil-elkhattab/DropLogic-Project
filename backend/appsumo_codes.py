"""AppSumo code generation, storage, and tiered-plan redemption via Supabase."""

from __future__ import annotations

import logging
import re
import secrets
import string
from datetime import datetime, timezone
from typing import Any
from urllib.parse import quote, urlparse

import httpx

from appsumo_tiers import sync_appsumo_stack_profile
from supabase_env import get_supabase_service_role_key, get_supabase_url, supabase_configured

logger = logging.getLogger("droplogic.appsumo")

CODE_PREFIX = "DROPLOGIC-AS-"
CODE_SUFFIX_LENGTH = 5
CODE_ALPHABET = string.ascii_uppercase + string.digits
CODE_PATTERN = re.compile(rf"^{re.escape(CODE_PREFIX)}[A-Z0-9]{{{CODE_SUFFIX_LENGTH}}}$")


class AppSumoServiceError(Exception):
    """Base error for AppSumo Supabase operations."""


class AppSumoNotConfiguredError(AppSumoServiceError):
    """Supabase credentials are missing."""


class AppSumoCodeNotFoundError(AppSumoServiceError):
    """The supplied code does not exist."""


class AppSumoCodeAlreadyUsedError(AppSumoServiceError):
    """The code has already been redeemed."""


def _supabase_headers(*, prefer: str | None = None) -> dict[str, str]:
    service_role_key = get_supabase_service_role_key()
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    return headers


def normalize_appsumo_code(raw_code: str) -> str:
    return (raw_code or "").strip().upper()


def is_valid_code_format(code: str) -> bool:
    return bool(CODE_PATTERN.match(code))


def generate_unique_codes(count: int, *, existing: set[str] | None = None) -> list[str]:
    """Generate unique codes in DROPLOGIC-AS-XXXXX format."""
    if count <= 0:
        return []

    seen = set(existing or ())
    codes: list[str] = []
    attempts = 0
    max_attempts = count * 50

    while len(codes) < count and attempts < max_attempts:
        attempts += 1
        suffix = "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_SUFFIX_LENGTH))
        code = f"{CODE_PREFIX}{suffix}"
        if code in seen:
            continue
        seen.add(code)
        codes.append(code)

    if len(codes) < count:
        raise AppSumoServiceError(f"Could only generate {len(codes)} unique codes (requested {count})")

    return codes


def insert_codes_bulk(codes: list[str], *, batch_size: int = 100) -> int:
    """Insert codes into appsumo_codes. Returns number of rows inserted."""
    if not supabase_configured():
        raise AppSumoNotConfiguredError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")

    inserted = 0
    url = f"{get_supabase_url()}/rest/v1/appsumo_codes"

    with httpx.Client(timeout=60.0) as client:
        for start in range(0, len(codes), batch_size):
            batch = [{"code": code} for code in codes[start : start + batch_size]]
            response = client.post(
                url,
                headers=_supabase_headers(prefer="return=minimal"),
                json=batch,
            )
            if response.status_code not in (200, 201):
                raise AppSumoServiceError(
                    f"Supabase insert failed ({response.status_code}): {response.text[:300]}"
                )
            inserted += len(batch)

    return inserted


async def _fetch_code_row(code: str) -> dict[str, Any] | None:
    url = (
        f"{get_supabase_url()}/rest/v1/appsumo_codes"
        f"?code=eq.{quote(code, safe='')}&select=*&limit=1"
    )
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_supabase_headers())
        if response.status_code != 200:
            raise AppSumoServiceError(f"Supabase code lookup failed: {response.status_code}")
        rows = response.json()
        return rows[0] if rows else None


async def redeem_appsumo_code(code: str, clerk_user_id: str) -> dict[str, Any]:
    """
    Atomically mark a code as used (only when is_used=false).
    Raises AppSumoCodeNotFoundError or AppSumoCodeAlreadyUsedError on failure.
    """
    if not supabase_configured():
        raise AppSumoNotConfiguredError("AppSumo redemption is not configured on this server")

    redeemed_at = datetime.now(timezone.utc).isoformat()
    supabase_url = get_supabase_url()
    url = (
        f"{supabase_url}/rest/v1/appsumo_codes"
        f"?code=eq.{quote(code, safe='')}&is_used=eq.false"
    )
    payload = {
        "is_used": True,
        "used_by_user_id": clerk_user_id,
        "used_at": redeemed_at,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.patch(
                url,
                headers=_supabase_headers(prefer="return=representation"),
                json=payload,
            )
        except httpx.ConnectError as exc:
            logger.error(
                "[APPSUMO] Supabase connect failed host=%s url=%s error=%s",
                urlparse(supabase_url).hostname,
                supabase_url,
                exc,
            )
            raise AppSumoServiceError(
                f"Cannot reach Supabase at {supabase_url}. Check SUPABASE_URL in backend/.env."
            ) from exc
        if response.status_code not in (200, 204):
            raise AppSumoServiceError(
                f"Supabase code redeem failed ({response.status_code}): {response.text[:300]}"
            )

        rows = response.json() if response.content else []
        if rows:
            return rows[0]

    existing = await _fetch_code_row(code)
    if not existing:
        raise AppSumoCodeNotFoundError(f"Code {code!r} was not found")
    if existing.get("is_used"):
        raise AppSumoCodeAlreadyUsedError(f"Code {code!r} has already been redeemed")
    raise AppSumoServiceError(f"Code {code!r} could not be redeemed")


async def upgrade_user_appsumo_tier(clerk_user_id: str, email: str | None) -> dict[str, Any]:
    """
    Recompute stack from redeemed appsumo_codes rows and set user_tier:
      1 code  -> appsumo_tier1 (30/mo)
      2 codes -> appsumo_tier2 (100/mo)
      3+ codes -> appsumo_tier3 (600/mo hard cap)
    """
    if not supabase_configured():
        raise AppSumoNotConfiguredError("Supabase is not configured")

    try:
        return await sync_appsumo_stack_profile(clerk_user_id, email)
    except RuntimeError as exc:
        raise AppSumoServiceError(str(exc)) from exc


# Backward-compatible alias for imports that still reference the old name.
upgrade_user_to_lifetime_plan = upgrade_user_appsumo_tier
