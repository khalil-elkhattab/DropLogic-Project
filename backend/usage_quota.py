"""Video bake quota enforcement backed by Supabase (with in-memory dev fallback)."""

from __future__ import annotations

import logging
import os
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
from urllib.parse import quote, urlparse

import httpx

from supabase_env import (
    get_supabase_service_role_key,
    get_supabase_url,
    supabase_configured as _supabase_configured,
)

FREE_LIFETIME_LIMIT = int(os.getenv("FREE_TIER_VIDEO_LIMIT", "5"))
PREMIUM_MONTHLY_LIMIT = int(os.getenv("PREMIUM_MONTHLY_VIDEO_LIMIT", "200"))
APPSUMO_TIER1_MONTHLY_LIMIT = int(os.getenv("APPSUMO_TIER1_MONTHLY_VIDEO_LIMIT", "100"))
APPSUMO_TIER2_MONTHLY_LIMIT = int(os.getenv("APPSUMO_TIER2_MONTHLY_VIDEO_LIMIT", "300"))

# Sentinel: tier3 bypasses all limit checks.
UNLIMITED_LIMIT = -1

USER_TIERS = frozenset({
    "free",
    "premium",
    "appsumo_tier1",
    "appsumo_tier2",
    "appsumo_tier3",
})

# Dev fallback when Supabase is not configured
_LOCAL_USAGE: dict[str, list[float]] = {}
_LOCAL_REVIEW_STATE: dict[str, dict[str, Any]] = {}

logger = logging.getLogger("droplogic.quota")


@dataclass
class QuotaStatus:
    allowed: bool
    plan_status: str
    user_tier: str
    limit: int
    used: int
    period: str  # "lifetime" | "monthly" | "unlimited"
    message: str
    has_reviewed: bool = False
    appsumo_codes_count: int = 0


class QuotaExceededError(Exception):
    def __init__(self, status: QuotaStatus):
        super().__init__(status.message)
        self.status = status


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


def _month_start_utc() -> datetime:
    now = datetime.now(timezone.utc)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _normalize_plan(plan_status: str | None) -> str:
    return (plan_status or "free").strip().lower()


def tier_from_appsumo_codes_count(count: int) -> str:
    if count >= 3:
        return "appsumo_tier3"
    if count == 2:
        return "appsumo_tier2"
    if count >= 1:
        return "appsumo_tier1"
    return "free"


def resolve_user_tier(profile: dict[str, Any]) -> str:
    tier = (profile.get("user_tier") or "").strip().lower()
    if tier in USER_TIERS:
        return tier

    plan = _normalize_plan(profile.get("plan_status"))
    appsumo_count = int(profile.get("appsumo_codes_count") or 0)
    if appsumo_count > 0:
        return tier_from_appsumo_codes_count(appsumo_count)
    if plan in {"pro", "credits"}:
        return "premium"
    if plan == "ltd":
        return "appsumo_tier1"
    return "free"


def _limits_for_profile(profile: dict[str, Any]) -> tuple[int, str]:
    tier = resolve_user_tier(profile)

    if tier == "appsumo_tier3":
        return UNLIMITED_LIMIT, "unlimited"
    if tier == "free":
        return FREE_LIFETIME_LIMIT, "lifetime"
    if tier == "appsumo_tier1":
        return APPSUMO_TIER1_MONTHLY_LIMIT, "monthly"
    if tier == "appsumo_tier2":
        return APPSUMO_TIER2_MONTHLY_LIMIT, "monthly"
    if tier == "premium":
        return PREMIUM_MONTHLY_LIMIT, "monthly"
    return FREE_LIFETIME_LIMIT, "lifetime"


async def _supabase_get_profile(clerk_user_id: str) -> dict[str, Any] | None:
    url = (
        f"{get_supabase_url()}/rest/v1/profiles"
        f"?clerk_user_id=eq.{quote(clerk_user_id, safe='')}&select=*&limit=1"
    )
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_supabase_headers())
        if response.status_code != 200:
            raise RuntimeError(f"Supabase profile lookup failed: {response.status_code}")
        rows = response.json()
        return rows[0] if rows else None


async def _supabase_upsert_profile(clerk_user_id: str, email: str | None) -> dict[str, Any]:
    payload = {
        "clerk_user_id": clerk_user_id,
        "email": email or f"{clerk_user_id}@users.droplogic.local",
        "plan_status": "free",
        "user_tier": "free",
        "appsumo_codes_count": 0,
    }
    url = f"{get_supabase_url()}/rest/v1/profiles?on_conflict=clerk_user_id"
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            url,
            headers=_supabase_headers(prefer="resolution=merge-duplicates,return=representation"),
            json=payload,
        )
        if response.status_code not in (200, 201):
            raise RuntimeError(f"Supabase profile upsert failed: {response.status_code} {response.text}")
        rows = response.json()
        return rows[0] if isinstance(rows, list) and rows else payload


async def _supabase_count_usage(clerk_user_id: str, since: datetime | None = None) -> int:
    query = f"clerk_user_id=eq.{quote(clerk_user_id, safe='')}&select=id"
    if since is not None:
        query += f"&created_at=gte.{since.isoformat()}"

    url = f"{get_supabase_url()}/rest/v1/video_usage?{query}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            url,
            headers=_supabase_headers(prefer="count=exact"),
        )
        if response.status_code != 200:
            raise RuntimeError(f"Supabase usage count failed: {response.status_code}")

        content_range = response.headers.get("content-range", "*/0")
        total = content_range.split("/")[-1]
        return int(total) if total.isdigit() else len(response.json())


async def _supabase_insert_usage(
    clerk_user_id: str,
    email: str | None,
    job_id: str,
    product_name: str,
) -> None:
    payload = {
        "clerk_user_id": clerk_user_id,
        "email": email,
        "job_id": job_id,
        "product_name": product_name,
    }
    supabase_url = get_supabase_url()
    url = f"{supabase_url}/rest/v1/video_usage"
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.post(url, headers=_supabase_headers(), json=payload)
        except httpx.ConnectError as exc:
            logger.error(
                "Supabase usage insert connect failed host=%s url=%s error=%s",
                urlparse(supabase_url).hostname,
                supabase_url,
                exc,
            )
            raise
        if response.status_code not in (200, 201):
            raise RuntimeError(f"Supabase usage insert failed: {response.status_code} {response.text}")


def _local_count_usage(clerk_user_id: str, since: datetime | None = None) -> int:
    timestamps = _LOCAL_USAGE.get(clerk_user_id, [])
    if since is None:
        return len(timestamps)
    since_ts = since.timestamp()
    return sum(1 for ts in timestamps if ts >= since_ts)


def _local_record_usage(clerk_user_id: str) -> None:
    _LOCAL_USAGE.setdefault(clerk_user_id, []).append(time.time())


def supabase_configured() -> bool:
    return _supabase_configured()


def get_local_review_state(clerk_user_id: str) -> dict[str, Any] | None:
    return _LOCAL_REVIEW_STATE.get(clerk_user_id)


def set_local_review_state(clerk_user_id: str, state: dict[str, Any]) -> None:
    _LOCAL_REVIEW_STATE[clerk_user_id] = state


async def get_or_create_profile(clerk_user_id: str, email: str | None) -> dict[str, Any]:
    if not _supabase_configured():
        local_review = get_local_review_state(clerk_user_id) or {}
        return {
            "clerk_user_id": clerk_user_id,
            "email": email,
            "plan_status": "free",
            "user_tier": "free",
            "appsumo_codes_count": 0,
            **local_review,
        }

    try:
        profile = await _supabase_get_profile(clerk_user_id)
        if profile:
            return profile
        return await _supabase_upsert_profile(clerk_user_id, email)
    except Exception as exc:
        logger.warning(
            "Supabase profile unavailable for %s — using local free tier fallback: %s",
            clerk_user_id,
            exc,
        )
        return {
            "clerk_user_id": clerk_user_id,
            "email": email,
            "plan_status": "free",
            "user_tier": "free",
            "appsumo_codes_count": 0,
        }


def _quota_message(
    *,
    allowed: bool,
    user_tier: str,
    limit: int,
    used: int,
    remaining: int,
) -> str:
    if user_tier == "appsumo_tier3":
        return "Unlimited video renders on your AppSumo Tier 3 plan."

    if not allowed:
        if user_tier == "free":
            return (
                f"Free tier limit reached ({FREE_LIFETIME_LIMIT} videos total). "
                "Upgrade to Premium or stack AppSumo codes for more renders."
            )
        return (
            f"Monthly video limit reached ({limit}/{limit} used). "
            "Resets on the 1st of next month or stack another AppSumo code."
        )

    return f"{remaining} video render(s) remaining on your {user_tier.replace('_', ' ')} plan."


async def evaluate_quota(clerk_user_id: str, email: str | None) -> QuotaStatus:
    profile = await get_or_create_profile(clerk_user_id, email)
    plan_status = _normalize_plan(profile.get("plan_status"))
    user_tier = resolve_user_tier(profile)
    has_reviewed = bool(profile.get("has_reviewed"))
    appsumo_codes_count = int(profile.get("appsumo_codes_count") or 0)
    limit, period = _limits_for_profile(profile)

    if limit == UNLIMITED_LIMIT:
        used = 0
        if _supabase_configured():
            try:
                used = await _supabase_count_usage(clerk_user_id, _month_start_utc())
            except Exception as exc:
                logger.warning(
                    "Supabase usage count failed for %s — using local fallback: %s",
                    clerk_user_id,
                    exc,
                )
                used = _local_count_usage(clerk_user_id, _month_start_utc())
        else:
            used = _local_count_usage(clerk_user_id, _month_start_utc())

        return QuotaStatus(
            allowed=True,
            plan_status=plan_status,
            user_tier=user_tier,
            limit=UNLIMITED_LIMIT,
            used=used,
            period=period,
            message=_quota_message(
                allowed=True,
                user_tier=user_tier,
                limit=limit,
                used=used,
                remaining=UNLIMITED_LIMIT,
            ),
            has_reviewed=has_reviewed,
            appsumo_codes_count=appsumo_codes_count,
        )

    since = _month_start_utc() if period == "monthly" else None

    used = 0
    if _supabase_configured():
        try:
            used = await _supabase_count_usage(clerk_user_id, since)
        except Exception as exc:
            logger.warning(
                "Supabase usage count failed for %s — using local fallback: %s",
                clerk_user_id,
                exc,
            )
            used = _local_count_usage(clerk_user_id, since)
    else:
        used = _local_count_usage(clerk_user_id, since)

    remaining = max(limit - used, 0)
    allowed = remaining > 0

    return QuotaStatus(
        allowed=allowed,
        plan_status=plan_status,
        user_tier=user_tier,
        limit=limit,
        used=used,
        period=period,
        message=_quota_message(
            allowed=allowed,
            user_tier=user_tier,
            limit=limit,
            used=used,
            remaining=remaining,
        ),
        has_reviewed=has_reviewed,
        appsumo_codes_count=appsumo_codes_count,
    )


async def enforce_bake_quota(clerk_user_id: str | None, email: str | None) -> QuotaStatus:
    if not clerk_user_id:
        raise QuotaExceededError(
            QuotaStatus(
                allowed=False,
                plan_status="unknown",
                user_tier="free",
                limit=0,
                used=0,
                period="lifetime",
                message="Authentication required. Sign in before baking a video.",
            )
        )

    status = await evaluate_quota(clerk_user_id, email)
    if not status.allowed:
        raise QuotaExceededError(status)
    return status


async def record_successful_bake(
    clerk_user_id: str,
    email: str | None,
    job_id: str,
    product_name: str,
) -> None:
    if _supabase_configured():
        try:
            await _supabase_insert_usage(clerk_user_id, email, job_id, product_name)
        except httpx.ConnectError as exc:
            logger.warning(
                "Supabase usage insert unreachable (host=%s) — using local fallback: %s",
                get_supabase_url(),
                exc,
            )
            _local_record_usage(clerk_user_id)
        except Exception as exc:
            logger.warning(
                "Supabase usage insert failed — using local fallback: %s",
                exc,
            )
            _local_record_usage(clerk_user_id)
    else:
        _local_record_usage(clerk_user_id)
