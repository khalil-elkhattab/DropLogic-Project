#!/usr/bin/env python3
"""
Export DropLogic logo SVG -> 500x500 PNG with transparent background.

Usage (from repo root):
  python web/scripts/export_logo_png.py

Or from web/:
  python scripts/export_logo_png.py

Install one renderer (first available is used):
  pip install pymupdf
  pip install cairosvg
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
WEB_DIR = SCRIPT_DIR.parent
PROJECT_ROOT = WEB_DIR.parent

DEFAULT_SVG = WEB_DIR / "public" / "brand" / "droplogic-logo-mark-500.svg"
DEFAULT_OUTPUT = PROJECT_ROOT / "logo.png"
DEFAULT_SIZE = 500


def export_with_pymupdf(svg_path: Path, output_path: Path, size: int) -> None:
    import fitz  # type: ignore

    document = fitz.open(svg_path)
    try:
        if document.page_count < 1:
            raise RuntimeError(f"No pages in SVG: {svg_path}")
        page = document[0]
        pixmap = page.get_pixmap(width=size, height=size, alpha=True)
        if pixmap.width != size or pixmap.height != size:
            raise RuntimeError(
                f"Unexpected output size {pixmap.width}x{pixmap.height}, expected {size}x{size}"
            )
        output_path.parent.mkdir(parents=True, exist_ok=True)
        pixmap.save(output_path)
    finally:
        document.close()


def export_with_cairosvg(svg_path: Path, output_path: Path, size: int) -> None:
    import cairosvg  # type: ignore

    output_path.parent.mkdir(parents=True, exist_ok=True)
    cairosvg.svg2png(
        url=str(svg_path),
        write_to=str(output_path),
        output_width=size,
        output_height=size,
    )


def export_with_sharp_cli(svg_path: Path, output_path: Path, size: int) -> None:
    npx = shutil.which("npx")
    if not npx:
        raise RuntimeError("npx not found. Install Node.js or use pip install pymupdf.")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    temp_output = output_path.with_suffix(".tmp.png")

    command = [
        npx,
        "--yes",
        "sharp-cli",
        "-i",
        str(svg_path),
        "-o",
        str(temp_output),
        "--",
        f"resize",
        f"{size}",
        f"{size}",
    ]

    result = subprocess.run(command, cwd=WEB_DIR, capture_output=True, text=True)
    if result.returncode != 0:
        # Older sharp-cli builds omit resize flags; default SVG is already 500x500.
        fallback = [
            npx,
            "--yes",
            "sharp-cli",
            "-i",
            str(svg_path),
            "-o",
            str(temp_output),
        ]
        result = subprocess.run(fallback, cwd=WEB_DIR, capture_output=True, text=True)

    if result.returncode != 0:
        stderr = (result.stderr or result.stdout or "").strip()
        raise RuntimeError(f"sharp-cli failed: {stderr or 'unknown error'}")

    if not temp_output.is_file():
        raise RuntimeError("sharp-cli did not produce an output file.")

    temp_output.replace(output_path)


def export_png(svg_path: Path, output_path: Path, size: int) -> str:
    if not svg_path.is_file():
        raise FileNotFoundError(f"SVG not found: {svg_path}")

    errors: list[str] = []

    try:
        export_with_pymupdf(svg_path, output_path, size)
        return "pymupdf"
    except ImportError:
        errors.append("pymupdf not installed (pip install pymupdf)")
    except Exception as exc:
        errors.append(f"pymupdf: {exc}")

    try:
        export_with_cairosvg(svg_path, output_path, size)
        return "cairosvg"
    except ImportError:
        errors.append("cairosvg not installed (pip install cairosvg)")
    except Exception as exc:
        errors.append(f"cairosvg: {exc}")

    try:
        export_with_sharp_cli(svg_path, output_path, size)
        return "sharp-cli (npx)"
    except Exception as exc:
        errors.append(f"sharp-cli: {exc}")

    detail = "\n  - ".join(errors)
    raise SystemExit(
        "Could not export logo. Tried all renderers:\n  - " + detail
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Export DropLogic SVG logo to PNG.")
    parser.add_argument(
        "--svg",
        type=Path,
        default=DEFAULT_SVG,
        help=f"Input SVG (default: {DEFAULT_SVG})",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Output PNG path (default: {DEFAULT_OUTPUT})",
    )
    parser.add_argument(
        "--size",
        type=int,
        default=DEFAULT_SIZE,
        help="Width and height in pixels (default: 500)",
    )
    args = parser.parse_args()

    try:
        renderer = export_png(args.svg.resolve(), args.output.resolve(), args.size)
    except SystemExit:
        raise
    except Exception as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1

    print(f"Renderer: {renderer}")
    print(f"Saved {args.size}x{args.size} PNG -> {args.output.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
