"""Video bake quota enforcement backed by Supabase (with in-memory dev fallback)."""

from __future__ import annotations

import logging
import os
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
from urllib.parse import quote

import httpx

SUPABASE_URL = (os.getenv("SUPABASE_URL") or "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""

FREE_LIFETIME_LIMIT = int(os.getenv("FREE_TIER_VIDEO_LIMIT", "1"))
PRO_MONTHLY_BASE_LIMIT = int(os.getenv("PRO_MONTHLY_BASE_LIMIT", "30"))
PRO_MONTHLY_REVIEWED_LIMIT = int(os.getenv("PRO_MONTHLY_REVIEWED_LIMIT", "50"))
PRO_MONTHLY_LIMIT = int(os.getenv("PRO_MONTHLY_VIDEO_LIMIT", str(PRO_MONTHLY_BASE_LIMIT)))
LTD_MONTHLY_LIMIT = int(os.getenv("LTD_MONTHLY_VIDEO_LIMIT", str(PRO_MONTHLY_BASE_LIMIT)))

PRO_PLAN_STATUSES = {"pro", "ltd", "credits"}

# Dev fallback when Supabase is not configured
_LOCAL_USAGE: dict[str, list[float]] = {}
_LOCAL_REVIEW_STATE: dict[str, dict[str, Any]] = {}

logger = logging.getLogger("droplogic.quota")


@dataclass
class QuotaStatus:
    allowed: bool
    plan_status: str
    limit: int
    used: int
    period: str  # "lifetime" | "monthly"
    message: str
    has_reviewed: bool = False


class QuotaExceededError(Exception):
    def __init__(self, status: QuotaStatus):
        super().__init__(status.message)
        self.status = status


def _supabase_configured() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)


def _supabase_headers(*, prefer: str | None = None) -> dict[str, str]:
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
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


def _limits_for_profile(profile: dict[str, Any]) -> tuple[int, str]:
    plan = _normalize_plan(profile.get("plan_status"))
    if plan == "free":
        return FREE_LIFETIME_LIMIT, "lifetime"

    explicit_limit = profile.get("monthly_video_limit")
    if isinstance(explicit_limit, int) and explicit_limit > 0:
        return explicit_limit, "monthly"

    if profile.get("has_reviewed"):
        return PRO_MONTHLY_REVIEWED_LIMIT, "monthly"

    if plan == "ltd":
        return LTD_MONTHLY_LIMIT, "monthly"
    if plan in PRO_PLAN_STATUSES:
        return PRO_MONTHLY_BASE_LIMIT, "monthly"
    return FREE_LIFETIME_LIMIT, "lifetime"


def _limits_for_plan(plan_status: str) -> tuple[int, str]:
    return _limits_for_profile({"plan_status": plan_status, "has_reviewed": False})


async def _supabase_get_profile(clerk_user_id: str) -> dict[str, Any] | None:
    url = (
        f"{SUPABASE_URL}/rest/v1/profiles"
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
    }
    url = f"{SUPABASE_URL}/rest/v1/profiles?on_conflict=clerk_user_id"
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

    url = f"{SUPABASE_URL}/rest/v1/video_usage?{query}"
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
    url = f"{SUPABASE_URL}/rest/v1/video_usage"
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, headers=_supabase_headers(), json=payload)
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
        return {"clerk_user_id": clerk_user_id, "email": email, "plan_status": "free"}


async def evaluate_quota(clerk_user_id: str, email: str | None) -> QuotaStatus:
    profile = await get_or_create_profile(clerk_user_id, email)
    plan_status = _normalize_plan(profile.get("plan_status"))
    has_reviewed = bool(profile.get("has_reviewed"))
    limit, period = _limits_for_profile(profile)
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
    if remaining <= 0:
        if plan_status == "free":
            message = (
                f"Free tier limit reached ({FREE_LIFETIME_LIMIT} video total). "
                "Upgrade to Pro for more renders."
            )
        else:
            message = (
                f"Monthly video limit reached ({limit}/{limit} used). "
                "Resets on the 1st of next month or upgrade your plan."
            )
        return QuotaStatus(
            allowed=False,
            plan_status=plan_status,
            limit=limit,
            used=used,
            period=period,
            message=message,
            has_reviewed=has_reviewed,
        )

    return QuotaStatus(
        allowed=True,
        plan_status=plan_status,
        limit=limit,
        used=used,
        period=period,
        message=f"{remaining} video render(s) remaining on your {plan_status} plan.",
        has_reviewed=has_reviewed,
    )


async def enforce_bake_quota(clerk_user_id: str | None, email: str | None) -> QuotaStatus:
    if not clerk_user_id:
        raise QuotaExceededError(
            QuotaStatus(
                allowed=False,
                plan_status="unknown",
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
        await _supabase_insert_usage(clerk_user_id, email, job_id, product_name)
    else:
        _local_record_usage(clerk_user_id)
