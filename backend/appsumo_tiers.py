"""AppSumo code-stacking tiers, monthly quotas, and profile sync helpers."""

from __future__ import annotations

import os
from typing import Any
from urllib.parse import quote

import httpx

from supabase_env import get_supabase_service_role_key, get_supabase_url, supabase_configured

# AppSumo launch stacking (1 / 2 / 3 codes)
APPSUMO_TIER1_MONTHLY_LIMIT = int(os.getenv("APPSUMO_TIER1_MONTHLY_VIDEO_LIMIT", "30"))
APPSUMO_TIER2_MONTHLY_LIMIT = int(os.getenv("APPSUMO_TIER2_MONTHLY_VIDEO_LIMIT", "100"))
# Tier 3: 600 videos/month hard cap (set APPSUMO_TIER3_MONTHLY_VIDEO_LIMIT=-1 for unlimited).
_tier3_raw = os.getenv("APPSUMO_TIER3_MONTHLY_VIDEO_LIMIT", "600").strip()
APPSUMO_TIER3_MONTHLY_LIMIT = int(_tier3_raw) if _tier3_raw.lstrip("-").isdigit() else 600

UNLIMITED_LIMIT = -1
MAX_STACKED_CODES_FOR_TIER = 3
LIFETIME_PLAN_STATUS = "LTD_AppSumo"

USER_TIERS = frozenset({
    "free",
    "premium",
    "appsumo_tier1",
    "appsumo_tier2",
    "appsumo_tier3",
})


def tier_from_appsumo_codes_count(count: int) -> str:
    """Map stacked code count -> user_tier (caps benefit at tier 3)."""
    if count >= 3:
        return "appsumo_tier3"
    if count == 2:
        return "appsumo_tier2"
    if count >= 1:
        return "appsumo_tier1"
    return "free"


def monthly_video_limit_for_tier(user_tier: str) -> tuple[int, str]:
    """Return (limit, period) for quota enforcement."""
    tier = (user_tier or "free").strip().lower()
    if tier == "appsumo_tier3":
        if APPSUMO_TIER3_MONTHLY_LIMIT == UNLIMITED_LIMIT:
            return UNLIMITED_LIMIT, "unlimited"
        return APPSUMO_TIER3_MONTHLY_LIMIT, "monthly"
    if tier == "appsumo_tier2":
        return APPSUMO_TIER2_MONTHLY_LIMIT, "monthly"
    if tier == "appsumo_tier1":
        return APPSUMO_TIER1_MONTHLY_LIMIT, "monthly"
    return 0, "monthly"


def tier_activation_message(user_tier: str, appsumo_codes_count: int) -> str:
    tier = (user_tier or "free").strip().lower()
    code_word = "code" if appsumo_codes_count == 1 else "codes"

    if tier == "appsumo_tier3":
        if APPSUMO_TIER3_MONTHLY_LIMIT == UNLIMITED_LIMIT:
            limit_text = "unlimited monthly video renders"
        else:
            limit_text = f"{APPSUMO_TIER3_MONTHLY_LIMIT} videos per month"
        return (
            f"AppSumo {code_word} stacked ({appsumo_codes_count} total). "
            f"Tier 3 unlocked — {limit_text}."
        )
    if tier == "appsumo_tier2":
        return (
            f"AppSumo {code_word} stacked ({appsumo_codes_count} total). "
            f"Tier 2 unlocked — {APPSUMO_TIER2_MONTHLY_LIMIT} videos per month."
        )
    if tier == "appsumo_tier1":
        return (
            f"AppSumo {code_word} stacked ({appsumo_codes_count} total). "
            f"Tier 1 unlocked — {APPSUMO_TIER1_MONTHLY_LIMIT} videos per month."
        )
    return "AppSumo code recorded."


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


async def count_redeemed_appsumo_codes(clerk_user_id: str) -> int:
    """Count codes redeemed by this user (source of truth for stacking)."""
    if not supabase_configured():
        return 0

    url = (
        f"{get_supabase_url()}/rest/v1/appsumo_codes"
        f"?used_by_user_id=eq.{quote(clerk_user_id, safe='')}"
        f"&is_used=eq.true"
        f"&select=id"
    )
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_supabase_headers(prefer="count=exact"))
        if response.status_code != 200:
            raise RuntimeError(f"Supabase AppSumo code count failed: {response.status_code}")

        content_range = response.headers.get("content-range", "*/0")
        total = content_range.split("/")[-1]
        if total.isdigit():
            return int(total)
        rows = response.json()
        return len(rows) if isinstance(rows, list) else 0


async def sync_appsumo_stack_profile(
    clerk_user_id: str,
    email: str | None,
    *,
    profile: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Recompute appsumo_codes_count from appsumo_codes rows and set user_tier + LTD plan.
    Call after each successful code redemption.
    """
    if not supabase_configured():
        raise RuntimeError("Supabase is not configured")

    from usage_quota import get_or_create_profile

    base_profile = profile or await get_or_create_profile(clerk_user_id, email)
    redeemed_count = await count_redeemed_appsumo_codes(clerk_user_id)
    new_tier = tier_from_appsumo_codes_count(redeemed_count)

    from datetime import datetime, timezone

    updated_at = datetime.now(timezone.utc).isoformat()
    url = (
        f"{get_supabase_url()}/rest/v1/profiles"
        f"?clerk_user_id=eq.{quote(clerk_user_id, safe='')}"
    )
    payload: dict[str, Any] = {
        "appsumo_codes_count": redeemed_count,
        "user_tier": new_tier,
        "plan_status": LIFETIME_PLAN_STATUS,
        "updated_at": updated_at,
    }
    if email:
        payload["email"] = email

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.patch(
            url,
            headers=_supabase_headers(prefer="return=representation"),
            json=payload,
        )
        if response.status_code not in (200, 204):
            raise RuntimeError(
                f"Supabase profile stack sync failed ({response.status_code}): {response.text[:300]}"
            )
        rows = response.json() if response.content else []

    if rows:
        result = rows[0]
    else:
        result = {**base_profile, **payload}

    result["activation_message"] = tier_activation_message(new_tier, redeemed_count)
    result["monthly_video_limit"] = monthly_video_limit_for_tier(new_tier)[0]
    return result
