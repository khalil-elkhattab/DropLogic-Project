"""AppSumo review proof submission and permanent monthly quota upgrades."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
from urllib.parse import quote

import httpx

from usage_quota import (
    PRO_MONTHLY_REVIEWED_LIMIT,
    get_or_create_profile,
    set_local_review_state,
    supabase_configured,
    _supabase_headers,
)
from supabase_env import get_supabase_url

logger = logging.getLogger("droplogic.review_rewards")


class ReviewProofError(Exception):
    """Base error for review proof submission."""


class ReviewAlreadyClaimedError(ReviewProofError):
    """User has already claimed the review upgrade."""


class ReviewProofInvalidError(ReviewProofError):
    """Review proof text is missing or too short."""


async def submit_review_proof(
    clerk_user_id: str,
    email: str | None,
    proof: str,
) -> dict[str, Any]:
    """
    Mark profile as reviewed and permanently set monthly_video_limit to 50.
    """
    clean_proof = (proof or "").strip()
    if len(clean_proof) < 2:
        raise ReviewProofInvalidError("Review proof must be an AppSumo username or screenshot link.")

    profile = await get_or_create_profile(clerk_user_id, email)

    if profile.get("has_reviewed"):
        raise ReviewAlreadyClaimedError("Review upgrade already claimed for this account.")

    if not supabase_configured():
        state = {
            "has_reviewed": True,
            "review_proof": clean_proof,
            "monthly_video_limit": PRO_MONTHLY_REVIEWED_LIMIT,
        }
        set_local_review_state(clerk_user_id, state)
        return {
            "clerk_user_id": clerk_user_id,
            **state,
        }

    updated_at = datetime.now(timezone.utc).isoformat()
    url = (
        f"{get_supabase_url()}/rest/v1/profiles"
        f"?clerk_user_id=eq.{quote(clerk_user_id, safe='')}"
    )
    payload = {
        "has_reviewed": True,
        "review_proof": clean_proof,
        "monthly_video_limit": PRO_MONTHLY_REVIEWED_LIMIT,
        "updated_at": updated_at,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.patch(
            url,
            headers=_supabase_headers(prefer="return=representation"),
            json=payload,
        )
        if response.status_code not in (200, 204):
            raise ReviewProofError(
                f"Supabase review upgrade failed ({response.status_code}): {response.text[:300]}"
            )
        rows = response.json() if response.content else []

    if rows:
        return rows[0]

    return {**profile, **payload}
