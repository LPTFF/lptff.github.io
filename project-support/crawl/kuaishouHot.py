from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from crawl.lib.http import HttpClient
from crawl.lib.runner import run_guarded

NAME = "kuaishou"
OUTPUT = "kuaishouHot.json"
URL = "https://www.kuaishou.com/graphql"
REQUEST_HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://www.kuaishou.com/",
    "Content-Type": "application/json",
}
BROWSER_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
)
QUERY = """
query visionHotRank {
  visionHotRank {
    result
    items {
      id
      name
      rank
      hotValue
      photoIds
      poster
    }
  }
}
"""


def parse_response(
    payload: object,
    collected_at: datetime | None = None,
) -> list[dict[str, object]]:
    if not isinstance(payload, dict):
        raise ValueError("Kuaishou response is not an object")
    data = payload.get("data")
    container = data.get("visionHotRank") if isinstance(data, dict) else None
    if not isinstance(container, dict) or container.get("result") not in (1, "1", None):
        raise ValueError("Kuaishou response has no usable visionHotRank envelope")
    items = container.get("items")
    if not isinstance(items, list):
        raise ValueError("Kuaishou response has no items array")

    collection_time = collected_at or datetime.now().astimezone()
    collection_timestamp = int(collection_time.timestamp() * 1000)
    result_items: list[dict[str, object]] = []

    for entry in items:
        if not isinstance(entry, dict):
            continue
        name = str(entry.get("name") or entry.get("id") or "").strip()
        if not name:
            continue
        try:
            rank = int(entry.get("rank") if entry.get("rank") is not None else 0)
        except (TypeError, ValueError):
            rank = 0
        hot_value = str(entry.get("hotValue") or "").strip()
        poster = str(entry.get("poster") or "").strip()

        heat = f" · 热度 {hot_value}" if hot_value else ""
        desc = f"快手热榜第 {rank} 位{heat}" if rank > 0 else f"快手热榜置顶话题{heat}"
        url = f"https://www.kuaishou.com/search/video?searchKey={quote(name, safe='')}"

        result_items.append(
            {
                "url": url,
                "desc": desc,
                "time": collection_time.strftime("%Y-%m-%d %H:%M:%S"),
                "timestamp": collection_timestamp,
                "hotValue": hot_value,
                "website": NAME,
                "title": name,
                "rank": rank,
                "poster": poster,
            }
        )

    return sorted(result_items, key=lambda item: int(item["rank"]))


def collect() -> list[dict[str, object]]:
    client = HttpClient(
        allowed_hostnames=["www.kuaishou.com"],
        max_bytes=3_000_000,
        user_agent=BROWSER_USER_AGENT,
    )
    payload = {
        "operationName": "visionHotRank",
        "query": QUERY,
        "variables": {},
    }
    response = client.post(
        URL,
        headers=REQUEST_HEADERS,
        json=payload,
    )
    return parse_response(response.json())


def main() -> int:
    result = run_guarded(
        collect,
        name=NAME,
        output=OUTPUT,
        kind="article",
        min_items=10,
        unique_by="title",
    )
    print(json.dumps(result.to_dict(), ensure_ascii=False))
    return 0 if result.is_usable else 1


if __name__ == "__main__":
    raise SystemExit(main())
