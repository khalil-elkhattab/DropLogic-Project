#!/usr/bin/env python3
"""
Generate AppSumo cover image (1500x1000) for DropLogic.

Usage (from repo root):
  pip install pillow
  python web/scripts/generate_cover_png.py

Output:
  cover.png  (repo root, 1500x1000 RGBA)
"""

from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
WEB_DIR = SCRIPT_DIR.parent
PROJECT_ROOT = WEB_DIR.parent

DEFAULT_OUTPUT = PROJECT_ROOT / "cover.png"
WIDTH = 1500
HEIGHT = 1000

# Brand palette
BG_TOP = (24, 24, 27)       # zinc-900
BG_BOTTOM = (9, 9, 11)      # zinc-950
VIOLET = (167, 139, 250)    # violet-400
VIOLET_DEEP = (139, 92, 246)  # violet-500
WHITE = (250, 250, 250)
MUTED = (161, 161, 170)     # zinc-400


def _load_font(size: int, bold: bool = False):
    from PIL import ImageFont

    candidates = []
    if bold:
        candidates = [
            "C:/Windows/Fonts/segoeuib.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
            "C:/Windows/Fonts/calibrib.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        ]
    else:
        candidates = [
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/arial.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/System/Library/Fonts/Supplemental/Arial.ttf",
        ]

    for path in candidates:
        if Path(path).is_file():
            return ImageFont.truetype(path, size=size)

    return ImageFont.load_default()


def _vertical_gradient(width: int, height: int):
    from PIL import Image

    base = Image.new("RGB", (width, height))
    pixels = base.load()
    for y in range(height):
        t = y / max(height - 1, 1)
        r = int(BG_TOP[0] * (1 - t) + BG_BOTTOM[0] * t)
        g = int(BG_TOP[1] * (1 - t) + BG_BOTTOM[1] * t)
        b = int(BG_TOP[2] * (1 - t) + BG_BOTTOM[2] * t)
        for x in range(width):
            pixels[x, y] = (r, g, b)
    return base.convert("RGBA")


def _draw_radial_glow(canvas, cx: int, cy: int, radius: int, color: tuple[int, int, int, int]):
    from PIL import Image, ImageDraw

    glow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    steps = 48
    for i in range(steps, 0, -1):
        t = i / steps
        alpha = int(color[3] * (t**2) * 0.08)
        r = int(radius * t)
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(color[0], color[1], color[2], alpha))
    canvas.alpha_composite(glow)


def _draw_grid(canvas, spacing: int = 80, alpha: int = 18):
    from PIL import ImageDraw

    draw = ImageDraw.Draw(canvas)
    line = (255, 255, 255, alpha)
    for x in range(0, WIDTH, spacing):
        draw.line((x, 0, x, HEIGHT), fill=line, width=1)
    for y in range(0, HEIGHT, spacing):
        draw.line((0, y, WIDTH, y), fill=line, width=1)


def _draw_logo_mark(canvas, center: tuple[int, int], size: int):
    """Simplified brand mark: rounded square + package/zap/cog accents."""
    from PIL import Image, ImageDraw

    cx, cy = center
    half = size // 2
    x0, y0 = cx - half, cy - half
    x1, y1 = cx + half, cy + half
    radius = int(size * 0.28)

    mark = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(mark)

    draw.rounded_rectangle(
        (x0, y0, x1, y1),
        radius=radius,
        fill=(18, 18, 20, 240),
        outline=(255, 255, 255, 35),
        width=max(2, size // 80),
    )

    # Package box (center)
    box = int(size * 0.28)
    bx0, by0 = cx - box // 2, cy - box // 2
    bx1, by1 = cx + box // 2, cy + box // 2
    draw.rectangle((bx0, by0, bx1, by1), outline=(244, 244, 245, 220), width=max(2, size // 60))
    draw.line((bx0, by0, bx1, by0), fill=(244, 244, 245, 180), width=max(2, size // 70))
    draw.line((bx0, by0, bx0, by1), fill=(244, 244, 245, 140), width=max(2, size // 70))

    # Zap (top-right)
    zx, zy = x1 - size // 6, y0 + size // 7
    zap = [
        (zx - size // 18, zy + size // 12),
        (zx, zy - size // 10),
        (zx - size // 28, zy),
        (zx + size // 16, zy),
        (zx - size // 20, zy + size // 9),
    ]
    draw.polygon(zap, fill=VIOLET + (255,))

    # Cog hint (bottom-left)
    gx, gy = x0 + size // 6, y1 - size // 7
    gr = size // 14
    draw.ellipse((gx - gr, gy - gr, gx + gr, gy + gr), outline=VIOLET_DEEP + (180,), width=max(2, size // 80))

    canvas.alpha_composite(mark)


def generate_cover(output_path: Path) -> None:
    try:
        from PIL import Image, ImageDraw
    except ImportError as exc:
        raise SystemExit("Missing dependency. Install with:\n  pip install pillow") from exc

    canvas = _vertical_gradient(WIDTH, HEIGHT)
    _draw_grid(canvas)
    _draw_radial_glow(canvas, 1180, 220, 520, VIOLET + (255,))
    _draw_radial_glow(canvas, 260, 780, 420, VIOLET_DEEP + (255,))

    # Logo mark (left)
    _draw_logo_mark(canvas, (300, HEIGHT // 2 - 20), 220)

    draw = ImageDraw.Draw(canvas)

    title_font = _load_font(118, bold=True)
    subtitle_font = _load_font(44, bold=False)
    badge_font = _load_font(22, bold=True)

    title = "DropLogic"
    subtitle = "Create Viral AI Videos In Seconds!"

    title_x = 470
    title_y = HEIGHT // 2 - 120

    # Title shadow
    draw.text((title_x + 3, title_y + 4), title, font=title_font, fill=(0, 0, 0, 120))
    draw.text((title_x, title_y), title, font=title_font, fill=WHITE)

    # Violet dot accent after title
    bbox = draw.textbbox((title_x, title_y), title, font=title_font)
    dot_x = bbox[2] + 6
    dot_y = title_y + 18
    draw.ellipse((dot_x, dot_y, dot_x + 18, dot_y + 18), fill=VIOLET + (255,))

    # Subtitle
    sub_y = title_y + 130
    draw.text((title_x + 2, sub_y + 2), subtitle, font=subtitle_font, fill=(0, 0, 0, 90))
    draw.text((title_x, sub_y), subtitle, font=subtitle_font, fill=MUTED)

    # Feature pills
    pills = ["AI Script Engine", "UGC Video Studio", "Dropshipping Intel"]
    pill_x = title_x
    pill_y = sub_y + 90
    for label in pills:
        pad_x, pad_y = 18, 10
        tb = draw.textbbox((0, 0), label, font=badge_font)
        tw, th = tb[2] - tb[0], tb[3] - tb[1]
        w, h = tw + pad_x * 2, th + pad_y * 2
        draw.rounded_rectangle(
            (pill_x, pill_y, pill_x + w, pill_y + h),
            radius=14,
            fill=(139, 92, 246, 40),
            outline=(167, 139, 250, 90),
            width=1,
        )
        draw.text((pill_x + pad_x, pill_y + pad_y - 2), label, font=badge_font, fill=VIOLET + (255,))
        pill_x += w + 16

    # Bottom accent line
    draw.rounded_rectangle(
        (80, HEIGHT - 36, WIDTH - 80, HEIGHT - 30),
        radius=4,
        fill=VIOLET + (120,),
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path, format="PNG", optimize=True)

    if canvas.size != (WIDTH, HEIGHT):
        raise RuntimeError(f"Unexpected size {canvas.size}, expected {WIDTH}x{HEIGHT}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate DropLogic AppSumo cover image.")
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Output PNG path (default: {DEFAULT_OUTPUT})",
    )
    args = parser.parse_args()

    try:
        generate_cover(args.output.resolve())
    except Exception as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1

    print(f"Saved {WIDTH}x{HEIGHT} cover -> {args.output.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
