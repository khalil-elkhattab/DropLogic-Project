"""Json2Video + Renderform cloud render pipeline with automatic failover."""

from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Any, Callable, Literal
import logging

import httpx
import requests

logger = logging.getLogger("droplogic.cloud_render")

from url_utils import BLOCKED_HOST_FRAGMENTS, normalize_media_url

ProviderName = Literal["json2video", "renderform"]

JSON2VIDEO_MOVIES_URL = "https://api.json2video.com/v2/movies"
RENDERFORM_RENDER_URL = "https://get.renderform.io/api/v1/render"
RENDERFORM_STATUS_URL = "https://get.renderform.io/api/v1/render-status"

POLL_INTERVAL_SEC = 5
POLL_TIMEOUT_SEC = 600


class CloudRenderError(Exception):
    """Raised when all cloud render providers fail."""


@dataclass
class CloudRenderJob:
    provider: ProviderName
    render_id: str
    combined_id: str
    final_video_url: str | None = None
    status: str = "rendering"


def _json2video_key() -> str:
    key = (os.getenv("JSON2VIDEO_API_KEY") or "").strip()
    if not key:
        raise CloudRenderError("JSON2VIDEO_API_KEY is not configured")
    return key


def _renderform_key() -> str:
    key = (os.getenv("RENDERFORM_API_KEY") or "").strip()
    if not key:
        raise CloudRenderError("RENDERFORM_API_KEY is not configured")
    return key


def _combined_id(provider: ProviderName, render_id: str) -> str:
    return f"{provider}_{render_id}"


def _parse_combined_id(combined_id: str) -> tuple[ProviderName, str]:
    if combined_id.startswith("json2video_"):
        return "json2video", combined_id.removeprefix("json2video_")
    if combined_id.startswith("renderform_"):
        return "renderform", combined_id.removeprefix("renderform_")
    raise CloudRenderError(f"Unrecognized cloud render id: {combined_id}")


def _reject_shotstack_artifacts(url: str, response_text: str = "") -> None:
    combined = f"{url}\n{response_text}".lower()
    if "shotstack" in combined:
        raise CloudRenderError(
            "Shotstack is disabled on this deployment. Use Json2Video or Renderform only."
        )
    for fragment in BLOCKED_HOST_FRAGMENTS:
        if fragment in combined:
            raise CloudRenderError(f"Blocked legacy media host ({fragment})")


def _safe_urls(video_url: str, audio_url: str) -> tuple[str, str]:
    try:
        safe_video = normalize_media_url((video_url or "").strip())
        safe_audio = normalize_media_url((audio_url or "").strip())
    except ValueError as exc:
        raise CloudRenderError(f"Invalid render URL: {exc}") from exc
    _reject_shotstack_artifacts(safe_video)
    _reject_shotstack_artifacts(safe_audio)
    return safe_video, safe_audio


def _is_provider_exhausted(status_code: int, response_text: str) -> bool:
    """Detect quota/forbidden responses (incl. legacy Shotstack 0-credits errors)."""
    text = (response_text or "").lower()
    if status_code in (401, 402, 403):
        return True
    return any(
        token in text
        for token in (
            "forbidden",
            "0 credits",
            "no credits",
            "quota",
            "exceeded",
            "shotstack",
            "insufficient",
        )
    )


def submit_json2video(
    *,
    video_url: str,
    audio_url: str,
    product_name: str,
    duration: float,
) -> str:
    video_url, audio_url = _safe_urls(video_url, audio_url)
    logger.info(
        "[Json2Video] Submitting render | video=%s | audio=%s",
        video_url[:160],
        audio_url[:160],
    )
    payload = {
        "comment": f"DropLogic Ad — {product_name}",
        "width": 1080,
        "height": 1920,
        "fps": 30,
        "elements": [
            {
                "type": "video",
                "src": video_url,
                "duration": duration if duration > 0 else -1,
                "loop": True,
                "volume": 0,
            },
            {
                "type": "audio",
                "src": audio_url,
                "mix": True,
            },
        ],
    }
    headers = {
        "X-API-Key": _json2video_key(),
        "Content-Type": "application/json",
    }

    response = requests.post(JSON2VIDEO_MOVIES_URL, json=payload, headers=headers, timeout=30)
    _reject_shotstack_artifacts(JSON2VIDEO_MOVIES_URL, response.text)
    if response.status_code not in (200, 201):
        if _is_provider_exhausted(response.status_code, response.text):
            raise CloudRenderError(
                f"Json2Video unavailable ({response.status_code}): {response.text[:200]}"
            )
        raise CloudRenderError(
            f"Json2Video submit failed ({response.status_code}): {response.text[:300]}"
        )

    data = response.json()
    project_id = data.get("project")
    if not project_id:
        raise CloudRenderError(f"Json2Video response missing project id: {data}")

    print(f"[🟢 Json2Video] Job accepted. project={project_id}")
    return str(project_id)


def submit_renderform(
    *,
    video_url: str,
    audio_url: str,
    product_name: str,
    duration: float,
) -> str:
    video_url, audio_url = _safe_urls(video_url, audio_url)
    template_id = (os.getenv("RENDERFORM_TEMPLATE_ID") or "").strip()
    payload: dict[str, Any] = {
        "canvas": {"width": 1080, "height": 1920},
        "data": {
            "background_video.src": video_url,
            "voiceover_audio.src": audio_url,
            "product_name.text": product_name,
        },
    }
    if template_id:
        payload["template"] = template_id

    headers = {
        "X-API-KEY": _renderform_key(),
        "Content-Type": "application/json",
    }

    response = requests.post(RENDERFORM_RENDER_URL, json=payload, headers=headers, timeout=30)
    _reject_shotstack_artifacts(RENDERFORM_RENDER_URL, response.text)
    if response.status_code not in (200, 201):
        if _is_provider_exhausted(response.status_code, response.text):
            raise CloudRenderError(
                f"Renderform unavailable ({response.status_code}): {response.text[:200]}"
            )
        raise CloudRenderError(
            f"Renderform submit failed ({response.status_code}): {response.text[:300]}"
        )

    data = response.json()
    render_id = data.get("request_id") or data.get("id")
    if not render_id:
        raise CloudRenderError(f"Renderform response missing request id: {data}")

    print(f"[🟢 Renderform] Job accepted. request_id={render_id}")
    return str(render_id)


def poll_json2video(project_id: str) -> CloudRenderJob:
    headers = {"X-API-Key": _json2video_key()}
    response = requests.get(
        JSON2VIDEO_MOVIES_URL,
        params={"project": project_id},
        headers=headers,
        timeout=30,
    )
    if response.status_code != 200:
        _reject_shotstack_artifacts(JSON2VIDEO_MOVIES_URL, response.text)
        raise CloudRenderError(
            f"Json2Video status failed ({response.status_code}): {response.text[:300]}"
        )

    _reject_shotstack_artifacts(JSON2VIDEO_MOVIES_URL, response.text)
    movie = response.json().get("movie") or {}
    status = str(movie.get("status", "running")).lower()
    combined = _combined_id("json2video", project_id)

    if status == "done":
        url = movie.get("url")
        if not url:
            raise CloudRenderError("Json2Video reported done but returned no url")
        return CloudRenderJob("json2video", project_id, combined, url, "done")

    if status in {"error", "timeout"}:
        message = movie.get("message") or status
        raise CloudRenderError(f"Json2Video render failed: {message}")

    return CloudRenderJob("json2video", project_id, combined, None, "rendering")


def poll_renderform(request_id: str) -> CloudRenderJob:
    headers = {"X-API-KEY": _renderform_key()}
    response = requests.get(
        RENDERFORM_STATUS_URL,
        params={"request_id": request_id},
        headers=headers,
        timeout=30,
    )
    if response.status_code != 200:
        _reject_shotstack_artifacts(RENDERFORM_STATUS_URL, response.text)
        raise CloudRenderError(
            f"Renderform status failed ({response.status_code}): {response.text[:300]}"
        )

    _reject_shotstack_artifacts(RENDERFORM_STATUS_URL, response.text)
    data = response.json()
    status = str(data.get("status", "processing")).lower()
    combined = _combined_id("renderform", request_id)

    if status in {"finished", "done", "completed"}:
        url = data.get("href") or data.get("url")
        if not url:
            raise CloudRenderError("Renderform reported finished but returned no url")
        return CloudRenderJob("renderform", request_id, combined, url, "done")

    if status in {"failed", "error", "cancelled"}:
        raise CloudRenderError(f"Renderform render failed: {data.get('message', status)}")

    return CloudRenderJob("renderform", request_id, combined, None, "rendering")


def poll_provider(provider: ProviderName, render_id: str) -> CloudRenderJob:
    if provider == "json2video":
        return poll_json2video(render_id)
    return poll_renderform(render_id)


def wait_for_render(provider: ProviderName, render_id: str) -> CloudRenderJob:
    deadline = time.time() + POLL_TIMEOUT_SEC
    while time.time() < deadline:
        job = poll_provider(provider, render_id)
        if job.status == "done" and job.final_video_url:
            return job
        time.sleep(POLL_INTERVAL_SEC)

    raise CloudRenderError(f"{provider} render timed out after {POLL_TIMEOUT_SEC}s")


def _submit_handlers() -> list[tuple[ProviderName, Callable[..., str]]]:
    return [
        ("json2video", submit_json2video),
        ("renderform", submit_renderform),
    ]


def submit_with_failover(
    *,
    video_url: str,
    audio_url: str,
    product_name: str,
    duration: float,
    preferred: ProviderName | None = None,
) -> tuple[ProviderName, str]:
    handlers = _submit_handlers()
    if preferred:
        handlers = [item for item in handlers if item[0] == preferred] + [
            item for item in handlers if item[0] != preferred
        ]

    errors: list[str] = []
    for provider, submit_fn in handlers:
        try:
            print(f"[☁️ CLOUD] Submitting render via {provider}...")
            render_id = submit_fn(
                video_url=video_url,
                audio_url=audio_url,
                product_name=product_name,
                duration=duration,
            )
            return provider, render_id
        except CloudRenderError as exc:
            err_text = str(exc).lower()
            if "shotstack" in err_text:
                logger.warning("[%s] Skipping legacy Shotstack artifact: %s", provider, exc)
            else:
                logger.warning("[%s] Submit failed: %s", provider, exc)
            errors.append(f"{provider}: {exc}")
        except Exception as exc:
            logger.warning("[%s] Submit failed: %s", provider, exc)
            errors.append(f"{provider}: {exc}")

    raise CloudRenderError("All cloud providers failed to accept render. " + " | ".join(errors))


def render_with_failover(
    *,
    video_url: str,
    audio_url: str,
    product_name: str,
    duration: float,
) -> CloudRenderJob:
    """
    Submit to Json2Video, failover to Renderform on submit/poll/render errors.
    If the first provider fails during polling, automatically resubmits on the other.
    """
    tried: set[ProviderName] = set()
    last_error: Exception | None = None
    attempts = 0

    while len(tried) < 2 and attempts < 2:
        attempts += 1
        preferred = None
        if tried:
            preferred = "renderform" if "json2video" in tried else "json2video"

        try:
            provider, render_id = submit_with_failover(
                video_url=video_url,
                audio_url=audio_url,
                product_name=product_name,
                duration=duration,
                preferred=preferred,
            )
            tried.add(provider)
            job = wait_for_render(provider, render_id)
            return job
        except CloudRenderError as exc:
            last_error = exc
            if "shotstack" in str(exc).lower():
                logger.warning("[FAILOVER] Ignoring legacy Shotstack error: %s", exc)
            else:
                logger.warning("[FAILOVER] %s", exc)
            if not tried:
                tried.update({"json2video", "renderform"})
        except Exception as exc:
            last_error = exc
            logger.warning("[FAILOVER] %s", exc)
            if not tried:
                tried.update({"json2video", "renderform"})

        if len(tried) < 2:
            logger.info("[FAILOVER] Switching to alternate cloud render provider...")

    raise CloudRenderError(
        f"Cloud render failed on all providers. Last error: {last_error}"
    ) from last_error


def fetch_cloud_render_status(combined_id: str) -> dict[str, Any]:
    provider, render_id = _parse_combined_id(combined_id)
    job = poll_provider(provider, render_id)
    return {
        "render_id": combined_id,
        "status": "done" if job.status == "done" else "rendering",
        "final_video_url": job.final_video_url,
        "provider": provider,
    }


async def download_rendered_video(remote_url: str, output_path: str) -> None:
    safe_url = normalize_media_url(remote_url)
    _reject_shotstack_artifacts(safe_url)
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=120.0) as client:
            response = await client.get(safe_url)
            if response.status_code != 200:
                raise CloudRenderError(
                    f"Failed to download rendered video ({response.status_code})"
                )
            with open(output_path, "wb") as handle:
                handle.write(response.content)
    except httpx.UnsupportedProtocol as exc:
        raise CloudRenderError(f"Invalid rendered video URL protocol: {exc}") from exc
    except httpx.ConnectError as exc:
        raise CloudRenderError(
            f"Could not download rendered video from {safe_url[:160]}: {exc}"
        ) from exc
    except httpx.ConnectError as exc:
        host = getattr(getattr(exc, "request", None), "url", None)
        host_label = getattr(host, "host", None) or safe_url
        raise CloudRenderError(
            f"Could not download rendered video — DNS/connect failed for {host_label}: {exc}"
        ) from exc
