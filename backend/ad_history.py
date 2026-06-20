"""Persist and fetch user generated ad history via Supabase."""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Any
from urllib.parse import quote

import httpx

from supabase_env import get_supabase_service_role_key, get_supabase_url, supabase_configured


_LOCAL_ADS: dict[str, list[dict[str, Any]]] = {}


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


async def save_generated_ad(
    user_id: str,
    product_name: str,
    selected_hook: str,
    video_url: str,
) -> dict[str, Any]:
    record = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "product_name": product_name,
        "selected_hook": selected_hook,
        "video_url": video_url,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    if supabase_configured():
        url = f"{get_supabase_url()}/rest/v1/generated_ads"
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                url,
                headers=_supabase_headers(prefer="return=representation"),
                json={
                    "user_id": user_id,
                    "product_name": product_name,
                    "selected_hook": selected_hook,
                    "video_url": video_url,
                },
            )
            if response.status_code not in (200, 201):
                raise RuntimeError(
                    f"Supabase generated_ads insert failed: {response.status_code} {response.text}"
                )
            rows = response.json()
            if isinstance(rows, list) and rows:
                return rows[0]
        return record

    _LOCAL_ADS.setdefault(user_id, []).insert(0, record)
    return record


async def fetch_generated_ads(user_id: str, *, limit: int = 50) -> list[dict[str, Any]]:
    if not user_id:
        return []

    if supabase_configured():
        url = (
            f"{get_supabase_url()}/rest/v1/generated_ads"
            f"?user_id=eq.{quote(user_id, safe='')}"
            f"&select=id,user_id,product_name,selected_hook,video_url,created_at"
            f"&order=created_at.desc"
            f"&limit={limit}"
        )
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=_supabase_headers())
            if response.status_code != 200:
                raise RuntimeError(
                    f"Supabase generated_ads fetch failed: {response.status_code} {response.text}"
                )
            return response.json()

    return list(_LOCAL_ADS.get(user_id, []))[:limit]
