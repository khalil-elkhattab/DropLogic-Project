"""Async bake job queue with FFmpeg concurrency limits (Tier A AppSumo hardening)."""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from dataclasses import dataclass, field
from functools import partial
from typing import Any, Literal

import httpx

from ad_history import save_generated_ad
from audio_processor import generate_voice_over, mix_voice_and_background
from caption_engine import generate_burned_captions, get_media_duration_seconds
from cleanup_assets import cleanup_bake_temp_assets
from cloud_render import CloudRenderError, download_rendered_video, render_with_failover
from media_downloader import (
    download_media_to_file,
    probe_media_url,
    resolve_bake_video_url_async,
)
from public_urls import api_public_url, backend_public_origin, static_asset_url
from usage_quota import record_successful_bake
from video_baker import FFmpegBakeError, bake_final_mp4, ffmpeg_available

logger = logging.getLogger("droplogic.bake_jobs")

OUTPUTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "outputs")
JOBS_DIR = os.path.join(OUTPUTS_DIR, ".jobs")

MAX_CONCURRENT_BAKES = max(1, min(2, int(os.getenv("MAX_CONCURRENT_BAKES", "1"))))
BAKE_SEMAPHORE = asyncio.Semaphore(MAX_CONCURRENT_BAKES)
BAKE_JOB_TTL_SEC = int(os.getenv("BAKE_JOB_TTL_SEC", "7200"))
BAKE_JOB_MAX_COUNT = int(os.getenv("BAKE_JOB_MAX_COUNT", "500"))
BAKE_JOB_UNKNOWN_GRACE_SEC = int(os.getenv("BAKE_JOB_UNKNOWN_GRACE_SEC", "90"))

BakeJobStatus = Literal["queued", "rendering", "done", "failed"]

# Legacy render-status lookups (cloud provider ids, older local_* keys)
RENDER_JOBS: dict[str, dict[str, Any]] = {}


class BakePipelineError(Exception):
    """Non-HTTP failure inside the background bake worker."""

    def __init__(self, message: str):
        super().__init__(message)


@dataclass
class BakeJob:
    job_id: str
    status: BakeJobStatus
    request: Any
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    file_path: str = ""
    provider: str = ""
    final_video_url: str | None = None
    error: str | None = None
    marketing_assets: dict[str, Any] | None = None
    message: str | None = None


BAKE_JOBS: dict[str, BakeJob] = {}


def _ensure_jobs_dir() -> None:
    os.makedirs(JOBS_DIR, exist_ok=True)


def _job_record_path(job_id: str) -> str:
    safe_id = os.path.basename(job_id)
    return os.path.join(JOBS_DIR, f"{safe_id}.json")


def _job_to_record(job: BakeJob) -> dict[str, Any]:
    return {
        "job_id": job.job_id,
        "status": job.status,
        "created_at": job.created_at,
        "updated_at": job.updated_at,
        "file_path": job.file_path,
        "provider": job.provider,
        "final_video_url": job.final_video_url,
        "error": job.error,
        "marketing_assets": job.marketing_assets,
        "message": job.message,
    }


def _persist_job(job: BakeJob) -> None:
    try:
        _ensure_jobs_dir()
        record = _job_to_record(job)
        path = _job_record_path(job.job_id)
        tmp_path = f"{path}.tmp"
        with open(tmp_path, "w", encoding="utf-8") as handle:
            json.dump(record, handle)
        os.replace(tmp_path, path)
    except OSError as exc:
        logger.warning("[BAKE JOB] Failed to persist job %s: %s", job.job_id, exc)


def _load_job_from_disk(job_id: str) -> BakeJob | None:
    path = _job_record_path(job_id)
    if not os.path.isfile(path):
        return None
    try:
        with open(path, encoding="utf-8") as handle:
            record = json.load(handle)
        return BakeJob(
            job_id=record["job_id"],
            status=record["status"],
            request=None,
            created_at=float(record.get("created_at") or time.time()),
            updated_at=float(record.get("updated_at") or time.time()),
            file_path=record.get("file_path") or "",
            provider=record.get("provider") or "",
            final_video_url=record.get("final_video_url"),
            error=record.get("error"),
            marketing_assets=record.get("marketing_assets"),
            message=record.get("message"),
        )
    except (OSError, json.JSONDecodeError, KeyError, TypeError, ValueError) as exc:
        logger.warning("[BAKE JOB] Failed to load persisted job %s: %s", job_id, exc)
        return None


def _get_job(job_id: str) -> BakeJob | None:
    job = BAKE_JOBS.get(job_id)
    if job:
        return job
    disk_job = _load_job_from_disk(job_id)
    if disk_job:
        BAKE_JOBS[job_id] = disk_job
    return disk_job


def _job_unique_id(job_id: str) -> str:
    return job_id.removeprefix("bake_").removeprefix("local_")


def _output_video_path_for_job(job_id: str) -> str:
    return os.path.join(OUTPUTS_DIR, f"final_video_{_job_unique_id(job_id)}.mp4")


def _completed_output_status(job_id: str) -> dict[str, Any] | None:
    output_path = _output_video_path_for_job(job_id)
    if os.path.isfile(output_path) and os.path.getsize(output_path) > 100 * 1024:
        filename = os.path.basename(output_path)
        return {
            "render_id": job_id,
            "status": "done",
            "final_video_url": static_asset_url(f"outputs/{filename}"),
            "provider": "ffmpeg",
            "message": "Bake completed (recovered from output file).",
        }
    return None


def _prune_bake_jobs() -> None:
    now = time.time()
    expired = [
        job_id
        for job_id, job in BAKE_JOBS.items()
        if now - job.updated_at > BAKE_JOB_TTL_SEC
    ]
    for job_id in expired:
        BAKE_JOBS.pop(job_id, None)
        RENDER_JOBS.pop(job_id, None)
        try:
            os.remove(_job_record_path(job_id))
        except OSError:
            pass

    if len(BAKE_JOBS) <= BAKE_JOB_MAX_COUNT:
        return

    overflow = len(BAKE_JOBS) - BAKE_JOB_MAX_COUNT
    oldest = sorted(BAKE_JOBS.items(), key=lambda item: item[1].created_at)
    for job_id, _job in oldest[:overflow]:
        BAKE_JOBS.pop(job_id, None)
        RENDER_JOBS.pop(job_id, None)


def bake_queue_position(job_id: str) -> int:
    """1-based position among queued jobs (FIFO)."""
    queued = sorted(
        (job for job in BAKE_JOBS.values() if job.status == "queued"),
        key=lambda job: job.created_at,
    )
    for index, job in enumerate(queued, start=1):
        if job.job_id == job_id:
            return index
    return 0


def create_bake_job(request: Any) -> BakeJob:
    _prune_bake_jobs()
    unique_id = os.urandom(4).hex()
    job_id = f"bake_{unique_id}"
    job = BakeJob(job_id=job_id, status="queued", request=request)
    BAKE_JOBS[job_id] = job
    _persist_job(job)
    return job


async def _execute_bake_pipeline(
    request: Any,
    job_id: str,
) -> tuple[dict[str, Any], list[str], str]:
    """Run the full bake pipeline. Returns (response_payload, temp_paths, output_video_path)."""
    raw_video_input = (request.video_url or "").strip()
    unique_id = job_id.removeprefix("bake_").removeprefix("local_")
    temp_cleanup_paths: list[str] = []

    logger.info(
        "[BAKE START] FFmpeg-first pipeline for: %s (job=%s)",
        request.product_name,
        job_id,
    )

    source_video_url = await resolve_bake_video_url_async(
        raw_video_input,
        backend_public_url=backend_public_origin(),
    )
    if not source_video_url:
        raise BakePipelineError(
            "Source video URL is invalid, blocked, or could not be resolved from a TikTok page link. "
            "Paste a TikTok video URL or a direct CDN link. "
            f"Received: {raw_video_input[:120]!r}"
        )

    probed_url = await probe_media_url(
        source_video_url,
        backend_public_url=backend_public_origin(),
    )
    if probed_url:
        source_video_url = probed_url
    else:
        logger.warning(
            "Source video probe failed for %r - continuing with sanitized URL",
            request.video_url[:160],
        )

    full_custom_script = f"{request.final_hook} {request.final_body} {request.final_cta}"
    temp_source_video = os.path.join(OUTPUTS_DIR, f"temp_source_{unique_id}.mp4")
    temp_cleanup_paths.append(temp_source_video)

    output_video_filename = f"final_video_{unique_id}.mp4"
    output_video_path = os.path.join(OUTPUTS_DIR, output_video_filename)

    logger.info("[BAKE] Parallel voice synthesis + source video download")
    try:
        temp_voice_file, downloaded = await asyncio.gather(
            asyncio.to_thread(
                partial(
                    generate_voice_over,
                    full_custom_script,
                    request.selected_voice,
                    job_suffix=unique_id,
                ),
            ),
            download_media_to_file(
                source_video_url,
                temp_source_video,
                backend_public_url=backend_public_origin(),
            ),
        )
    except Exception as voice_err:
        raise BakePipelineError(f"Voice synthesis failed: {voice_err}") from voice_err

    temp_cleanup_paths.append(temp_voice_file)

    if not downloaded or not os.path.isfile(temp_source_video):
        raise BakePipelineError(
            "Could not download source video for baking. Re-run analysis to refresh cached clips."
        )

    try:
        mix_voice_and_background(
            voice_path=temp_voice_file,
            bg_music_type=request.selected_bg_music,
            output_filename=f"mix_{unique_id}",
        )
    except Exception as mix_err:
        raise BakePipelineError(f"Audio mixing failed: {mix_err}") from mix_err

    final_audio_path = os.path.join(OUTPUTS_DIR, f"mix_{unique_id}.wav")
    temp_cleanup_paths.append(final_audio_path)
    public_audio_url = static_asset_url(f"outputs/mix_{unique_id}.wav")
    audio_duration = get_media_duration_seconds(final_audio_path) or float(request.video_duration or 15.0)

    ass_path: str | None = None
    if request.burn_captions:
        ass_output = os.path.join(OUTPUTS_DIR, f"caps_{unique_id}.ass")
        ass_path = generate_burned_captions(
            request.final_hook,
            request.final_body,
            request.final_cta,
            final_audio_path,
            ass_output,
            fallback_duration=audio_duration,
        )
        if ass_path:
            temp_cleanup_paths.append(ass_path)

    active_job_id = job_id
    provider = "ffmpeg"
    bake_message = "Local FFmpeg bake completed (9:16 vertical, video looped to audio length)."

    if ffmpeg_available():
        RENDER_JOBS[active_job_id] = {
            "status": "rendering",
            "file_path": output_video_path,
            "provider": provider,
        }
        try:
            await asyncio.to_thread(
                bake_final_mp4,
                source_video_path=temp_source_video,
                audio_path=final_audio_path,
                output_path=output_video_path,
                anti_ban_filter=request.anti_ban_filter,
                video_scale=request.video_scale,
                subtitle_path=ass_path,
            )
        except FFmpegBakeError as ffmpeg_err:
            logger.warning("[FFmpeg] Local bake failed, falling back to cloud render: %s", ffmpeg_err)
            provider = None
        else:
            RENDER_JOBS[active_job_id] = {
                "status": "done",
                "file_path": output_video_path,
                "provider": provider,
            }
    else:
        logger.warning("[FFmpeg] Not available on server - using cloud render fallback")
        provider = None

    if provider is None:
        cloud_job = await asyncio.to_thread(
            render_with_failover,
            video_url=source_video_url,
            audio_url=public_audio_url,
            product_name=request.product_name,
            duration=audio_duration,
        )
        active_job_id = cloud_job.combined_id
        provider = cloud_job.provider
        bake_message = f"Cloud render completed via {provider} with automatic failover support."
        RENDER_JOBS[active_job_id] = {
            "status": "rendering",
            "file_path": output_video_path,
            "provider": provider,
        }
        await download_rendered_video(cloud_job.final_video_url, output_video_path)
        RENDER_JOBS[active_job_id] = {
            "status": "done",
            "file_path": output_video_path,
            "provider": provider,
        }

    final_video_url = static_asset_url(f"outputs/{output_video_filename}")

    if request.clerk_user_id:
        try:
            await record_successful_bake(
                request.clerk_user_id,
                request.email,
                active_job_id,
                request.product_name,
            )
        except Exception as usage_err:
            logger.warning(
                "[WARN USAGE] Bake succeeded but usage record failed for %s: %s",
                request.clerk_user_id,
                usage_err,
            )
        try:
            await save_generated_ad(
                user_id=request.clerk_user_id,
                product_name=request.product_name,
                selected_hook=request.final_hook,
                video_url=final_video_url,
            )
        except Exception as history_err:
            logger.warning("[WARN AD HISTORY] Failed to persist ad record: %s", history_err)

    clean_tags = request.product_name.replace(" ", "").lower()
    payload = {
        "success": True,
        "message": bake_message,
        "render_id": active_job_id,
        "provider": provider,
        "final_video_url": final_video_url,
        "check_status_url": api_public_url(f"video-studio/render-status/{active_job_id}"),
        "marketing_assets": {
            "video_caption": f"{request.final_hook} 🤫✨",
            "primary_ad_copy": (
                f"Stop scrolling! 🚨 Viral {request.product_name} completely flips your setup upside down. "
                f"Get 50% OFF tonight only. Free Worldwide Shipping included! {request.final_cta}"
            ),
            "trending_hashtags": (
                f"#dropshipping #viralproduct #tiktokmademebuyit #amazonfinds #{clean_tags} #ecommerce"
            ),
        },
    }
    return payload, temp_cleanup_paths, output_video_path


async def run_bake_background(job_id: str) -> None:
    job = _get_job(job_id)
    if not job:
        return

    request = job.request
    if request is None:
        job.status = "failed"
        job.error = "Bake request payload was lost after server restart. Please start a new bake."
        job.updated_at = time.time()
        _persist_job(job)
        return

    temp_cleanup_paths: list[str] = []
    output_video_path = ""

    try:
        job.status = "queued"
        job.updated_at = time.time()
        _persist_job(job)
        logger.info(
            "[BAKE QUEUE] job_id=%s queued (max_concurrent=%s, waiting=%s)",
            job_id,
            MAX_CONCURRENT_BAKES,
            bake_queue_position(job_id),
        )

        async with BAKE_SEMAPHORE:
            job.status = "rendering"
            job.updated_at = time.time()
            _persist_job(job)
            logger.info("[BAKE QUEUE] job_id=%s acquired slot - starting pipeline", job_id)

            payload, temp_cleanup_paths, output_video_path = await _execute_bake_pipeline(
                job.request,
                job_id,
            )

            job.status = "done"
            job.final_video_url = payload["final_video_url"]
            job.provider = payload.get("provider", "")
            job.message = payload.get("message")
            job.marketing_assets = payload.get("marketing_assets")
            job.file_path = output_video_path
            _persist_job(job)
            logger.info("[BAKE JOB] job_id=%s completed", job_id)

    except BakePipelineError as exc:
        job.status = "failed"
        job.error = str(exc)
        _persist_job(job)
        logger.warning("[BAKE JOB] job_id=%s failed: %s", job_id, exc)
    except CloudRenderError as exc:
        job.status = "failed"
        job.error = str(exc)
        _persist_job(job)
        logger.error("[BAKE JOB] cloud render failed job_id=%s: %s", job_id, exc)
    except httpx.UnsupportedProtocol as exc:
        job.status = "failed"
        job.error = f"Invalid video URL protocol: {exc}"
        _persist_job(job)
    except httpx.ConnectError as exc:
        job.status = "failed"
        job.error = f"Network/DNS error during bake: {exc}"
        _persist_job(job)
    except Exception as exc:
        job.status = "failed"
        job.error = f"Internal baking pipeline failed: {exc}"
        _persist_job(job)
        logger.error("[BAKE JOB] job_id=%s unexpected error: %s", job_id, exc, exc_info=True)
    finally:
        job.updated_at = time.time()
        _persist_job(job)
        if temp_cleanup_paths:
            cleanup_bake_temp_assets(
                temp_cleanup_paths,
                job_id,
                preserve_paths=[output_video_path] if output_video_path else [],
            )


def bake_status_response(job_id: str) -> dict[str, Any] | None:
    job = _get_job(job_id)
    if not job:
        recovered = _completed_output_status(job_id)
        if recovered:
            return recovered
        return None

    if job.status == "queued":
        return {
            "render_id": job_id,
            "status": "queued",
            "queue_position": bake_queue_position(job_id),
            "max_concurrent_bakes": MAX_CONCURRENT_BAKES,
            "final_video_url": None,
        }

    if job.status == "rendering":
        return {
            "render_id": job_id,
            "status": "rendering",
            "final_video_url": None,
            "provider": job.provider or None,
        }

    if job.status == "done":
        recovered = _completed_output_status(job_id)
        final_video_url = job.final_video_url or (recovered or {}).get("final_video_url")
        return {
            "render_id": job_id,
            "status": "done",
            "final_video_url": final_video_url,
            "provider": job.provider,
            "message": job.message,
            "marketing_assets": job.marketing_assets,
        }

    return {
        "render_id": job_id,
        "status": "failed",
        "final_video_url": None,
        "error": job.error or "Bake failed",
    }


def bake_status_or_unknown(job_id: str) -> dict[str, Any]:
    """Resolve bake job status, including graceful unknown-job handling."""
    status = bake_status_response(job_id)
    if status:
        return status

    recovered = _completed_output_status(job_id)
    if recovered:
        return recovered

    if job_id.startswith("bake_"):
        return {
            "render_id": job_id,
            "status": "not_found",
            "final_video_url": None,
            "error": (
                "Bake job not found on this server. It may have expired, failed during a restart, "
                "or never started. Please start a new bake."
            ),
        }

    return {
        "render_id": job_id,
        "status": "rendering",
        "final_video_url": None,
    }
