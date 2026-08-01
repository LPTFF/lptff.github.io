from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.crawl.lib.http import HttpClient
from src.crawl.lib.runner import run_guarded

NAME = "weibo"
OUTPUT = "weibo.json"
URL = "https://weibo.com/ajax/side/hotSearch"
REQUEST_HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://weibo.com/hot/search",
    "X-Requested-With": "XMLHttpRequest",
}
BROWSER_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
)


def parse_response(
    payload: object,
    collected_at: datetime | None = None,
) -> list[dict[str, object]]:
    if not isinstance(payload, dict):
        raise ValueError("Weibo response is not an object")
    data = payload.get("data")
    if payload.get("ok") != 1:
        raise ValueError("Weibo response is not successful")
    hot_list = data.get("realtime") if isinstance(data, dict) else None
    if not isinstance(hot_list, list):
        raise ValueError("Weibo response has no realtime list")
    items: list[dict[str, object]] = []
    collection_time = collected_at or datetime.now().astimezone()
    collection_timestamp = int(collection_time.timestamp())
    for entry in hot_list:
        if not isinstance(entry, dict) or entry.get("ad_type"):
            continue
        title = str(entry.get("note") or "").strip()
        word = str(entry.get("word_scheme") or entry.get("word") or title).strip()
        try:
            timestamp = int(entry.get("onboard_time") or collection_timestamp)
        except (TypeError, ValueError):
            continue
        if not title or not word:
            continue
        items.append(
            {
                "url": f"https://s.weibo.com/weibo?q={quote(word, safe='')}",
                "desc": "",
                "time": datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S"),
                "timestamp": timestamp * 1000,
                "image": {
                    "small_icon_desc": entry.get("small_icon_desc") or "",
                    "small_icon_desc_color": entry.get("small_icon_desc_color") or "",
                },
                "website": NAME,
                "title": title,
            }
        )
    return sorted(items, key=lambda item: int(item["timestamp"]), reverse=True)


def collect() -> list[dict[str, object]]:
    client = HttpClient(
        allowed_hostnames=["weibo.com"],
        max_bytes=3_000_000,
        user_agent=BROWSER_USER_AGENT,
    )
    response = client.get(URL, headers=REQUEST_HEADERS)
    return parse_response(response.json())


def main() -> int:
    result = run_guarded(
        collect,
        name=NAME,
        output=OUTPUT,
        kind="article",
        min_items=5,
        unique_by="url",
    )
    print(json.dumps(result.to_dict(), ensure_ascii=False))
    return 0 if result.is_usable else 1


if __name__ == "__main__":
    raise SystemExit(main())
