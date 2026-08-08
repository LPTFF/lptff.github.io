from __future__ import annotations

import json
import re
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

import pytz
import requests

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from crawl.lib.http import ChallengeError, HttpClient, HttpError
from crawl.lib.runner import run_guarded

NAME = "v2ex"
OUTPUT = "v2ex.json"
URL = "https://www.v2ex.com/api/topics/hot.json"
FALLBACK_URLS = (
    "https://v2ex.com/api/topics/hot.json",
    "https://api.v2ex.com/api/topics/hot.json",
)
ALLOWED_HOSTNAMES = ("www.v2ex.com", "v2ex.com", "api.v2ex.com")
BEIJING = pytz.timezone("Asia/Shanghai")
TOPIC_PATH = re.compile(r"^/t/\d+/?$")


def parse_response(payload: object) -> list[dict[str, object]]:
    if not isinstance(payload, list):
        raise ValueError("V2EX response is not an array")
    items: list[dict[str, object]] = []
    for entry in payload:
        if not isinstance(entry, dict):
            continue
        title = str(entry.get("title") or "").strip()
        url = str(entry.get("url") or "").strip()
        try:
            created = int(entry.get("created"))
        except (TypeError, ValueError):
            continue
        if not title or not url:
            continue
        parsed_url = urlparse(url)
        if (
            parsed_url.scheme != "https"
            or parsed_url.hostname not in ALLOWED_HOSTNAMES
            or not TOPIC_PATH.fullmatch(parsed_url.path)
            or parsed_url.username
            or parsed_url.password
        ):
            continue
        member = entry.get("member") if isinstance(entry.get("member"), dict) else {}
        avatar = str(member.get("avatar_large") or member.get("avatar_normal") or "")
        if avatar.startswith("//"):
            avatar = f"https:{avatar}"
        items.append(
            {
                "url": url,
                "desc": entry.get("content_rendered") or entry.get("content") or title,
                "time": datetime.fromtimestamp(created, BEIJING).strftime("%Y-%m-%d %H:%M:%S"),
                "timestamp": created * 1000,
                "image": avatar,
                "website": NAME,
                "title": title,
            }
        )
    return sorted(items, key=lambda item: int(item["timestamp"]), reverse=True)


def collect() -> list[dict[str, object]]:
    client = HttpClient(
        allowed_hostnames=ALLOWED_HOSTNAMES,
        max_bytes=4_000_000,
        retries=1,
        timeout=(5, 12),
    )
    last_error: Exception | None = None
    for endpoint in (URL, *FALLBACK_URLS):
        try:
            response = client.get(
                endpoint,
                headers={"Accept": "application/json"},
            )
            items = parse_response(response.json())
            if len(items) < 3:
                raise ValueError("V2EX response contains fewer than 3 usable topics")
            return items
        except ChallengeError:
            raise
        except (HttpError, ValueError, requests.exceptions.JSONDecodeError) as error:
            last_error = error
    raise HttpError("all official V2EX endpoints returned unusable responses") from last_error


def main() -> int:
    result = run_guarded(
        collect,
        name=NAME,
        output=OUTPUT,
        kind="article",
        min_items=3,
        unique_by="url",
    )
    print(json.dumps(result.to_dict(), ensure_ascii=False))
    return 0 if result.is_usable else 1


if __name__ == "__main__":
    raise SystemExit(main())
