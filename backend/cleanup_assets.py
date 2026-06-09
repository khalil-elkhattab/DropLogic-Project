"""Background cleanup for FFmpeg bake intermediates (keeps final deliverables)."""

from __future__ import annotations

import os
from typing import Iterable


def _safe_remove(path: str) -> bool:
    if not path or not os.path.isfile(path):
        return False
    try:
        os.remove(path)
        return True
    except OSError as error:
        print(f"[🗑️ CLEANUP WARN] Could not remove {path}: {error}")
        return False


def cleanup_bake_temp_assets(
    paths: Iterable[str],
    job_id: str = "",
    *,
    preserve_paths: Iterable[str] | None = None,
) -> None:
    """
    Delete intermediate bake files (.mp4 source, .mp3 voice, .wav mix, .ass captions).
    Never deletes paths listed in preserve_paths (e.g. final_video_*.mp4).
    """
    preserve = {os.path.abspath(p) for p in (preserve_paths or []) if p}
    removed: list[str] = []

    for raw_path in paths:
        if not raw_path:
            continue
        absolute_path = os.path.abspath(raw_path)
        if absolute_path in preserve:
            continue
        if _safe_remove(absolute_path):
            removed.append(os.path.basename(absolute_path))

    if removed:
        label = f"job {job_id}" if job_id else "bake pipeline"
        print(f"[🗑️ CLEANUP] {label}: removed {len(removed)} file(s) -> {', '.join(removed)}")
    elif job_id:
        print(f"[🗑️ CLEANUP] job {job_id}: no temporary files left to remove")
