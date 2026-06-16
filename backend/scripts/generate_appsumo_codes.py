#!/usr/bin/env python3
"""Generate 1,000 AppSumo codes, insert into Supabase, and export appsumo_codes.csv."""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

load_dotenv(BACKEND_DIR / ".env")

from appsumo_codes import (  # noqa: E402
    AppSumoNotConfiguredError,
    AppSumoServiceError,
    generate_unique_codes,
    insert_codes_bulk,
    supabase_configured,
)

DEFAULT_CODE_COUNT = 1000
DEFAULT_CSV_PATH = BACKEND_DIR / "appsumo_codes.csv"


def export_codes_csv(codes: list[str], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["code"])
        for code in codes:
            writer.writerow([code])


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate and store AppSumo lifetime codes")
    parser.add_argument(
        "--count",
        type=int,
        default=DEFAULT_CODE_COUNT,
        help=f"Number of codes to generate (default: {DEFAULT_CODE_COUNT})",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_CSV_PATH,
        help=f"CSV export path (default: {DEFAULT_CSV_PATH})",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Generate codes and CSV only — do not insert into Supabase",
    )
    args = parser.parse_args()

    if args.count <= 0:
        print("Count must be greater than zero.", file=sys.stderr)
        return 1

    if not args.dry_run and not supabase_configured():
        raise AppSumoNotConfiguredError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env"
        )

    print(f"Generating {args.count} unique codes (DROPLOGIC-AS-XXXXX)...")
    codes = generate_unique_codes(args.count)
    export_codes_csv(codes, args.output)
    print(f"Exported CSV → {args.output.resolve()}")

    if args.dry_run:
        print("Dry run complete — no database inserts performed.")
        return 0

    print("Inserting codes into appsumo_codes table...")
    inserted = insert_codes_bulk(codes)
    print(f"Done. Inserted {inserted} codes into Supabase.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AppSumoNotConfiguredError as exc:
        print(f"Configuration error: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
    except AppSumoServiceError as exc:
        print(f"AppSumo generation failed: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
