#!/usr/bin/env python3
"""Apply review-rewards migration (006) to Supabase Postgres."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

MIGRATION_FILE = (
    Path(__file__).resolve().parents[2] / "web" / "supabase" / "migrations" / "006_review_rewards.sql"
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Apply 006_review_rewards.sql to Supabase")
    parser.add_argument(
        "--database-url",
        default=os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL"),
        help="Postgres connection string (Settings → Database → Connection string → URI)",
    )
    parser.add_argument("--print-only", action="store_true", help="Print SQL and exit")
    args = parser.parse_args()

    sql = MIGRATION_FILE.read_text(encoding="utf-8")
    if args.print_only or not args.database_url:
        print("=== Run this in Supabase Dashboard -> SQL Editor ===\n")
        print(sql)
        if not args.database_url:
            print(
                "\nNo DATABASE_URL set. Either:\n"
                "  1. Paste the SQL above in Supabase -> SQL Editor -> Run\n"
                "  2. Or: set DATABASE_URL and re-run this script\n"
                "     python backend/scripts/apply_review_migration.py",
                file=sys.stderr,
            )
            return 0 if args.print_only else 1
        return 0

    try:
        import psycopg2
    except ImportError:
        print("Install psycopg2-binary: pip install psycopg2-binary", file=sys.stderr)
        return 1

    conn = psycopg2.connect(args.database_url)
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            cur.execute(sql)
        print("Migration 006_review_rewards applied successfully.")
        return 0
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
