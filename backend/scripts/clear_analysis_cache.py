#!/usr/bin/env python3
"""Clear keyword(s) from the droplet in-memory analysis cache via the API."""

from __future__ import annotations

import argparse
import os
import sys

import httpx

DEFAULT_BASE = (os.getenv("SERVER_PUBLIC_URL") or "http://164.90.235.14:8001").rstrip("/")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Clear DropLogic global analysis cache on the backend droplet",
    )
    parser.add_argument(
        "keyword",
        nargs="?",
        default="neck massager",
        help="Keyword to clear (default: neck massager)",
    )
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE,
        help=f"Backend base URL (default: {DEFAULT_BASE})",
    )
    parser.add_argument(
        "--clear-all",
        action="store_true",
        help="Clear the entire analysis cache",
    )
    args = parser.parse_args()

    url = f"{args.base_url.rstrip('/')}/api/analysis-cache"
    params = {"clear_all": "true"} if args.clear_all else {"keyword": args.keyword}

    try:
        response = httpx.delete(url, params=params, timeout=20.0)
    except httpx.RequestError as exc:
        print(f"Request failed: {exc}", file=sys.stderr)
        return 1

    print(f"HTTP {response.status_code}")
    print(response.text)
    return 0 if response.is_success else 1


if __name__ == "__main__":
    raise SystemExit(main())
