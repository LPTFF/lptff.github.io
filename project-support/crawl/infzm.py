from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from crawl.lib.http import HttpClient
from crawl.lib.runner import run_guarded

NAME = "infzm"
OUTPUT = "infzm.json"
URL = "https://www.infzm.com/hot_contents?format=json"


def parse_response(payload: object) -> list[dict[str, object]]:
    data = payload.get("data") if isinstance(payload, dict) else None
    contents = data.get("hot_contents") if isinstance(data, dict) else None
    if not isinstance(contents, list):
        raise ValueError("Infzm response has no hot_contents array")
    items = []
    for entry in contents:
        if not isinstance(entry, dict):
            continue
        try:
            date = datetime.strptime(str(entry.get("publish_time")), "%Y-%m-%d %H:%M:%S")
        except ValueError:
            continue
        covers = entry.get("covers") if isinstance(entry.get("covers"), list) else []
        image = covers[0].get("file_path") if covers and isinstance(covers[0], dict) else ""
        article_id = str(entry.get("id") or "")
        title = str(entry.get("subject") or "")
        if not article_id or not title:
            continue
        items.append(
            {
                "time": entry["publish_time"],
                "timestamp": int(date.timestamp() * 1000),
                "title": title,
                "desc": entry.get("introtext") or title,
                "image": image or "",
                "url": urljoin("https://www.infzm.com/contents/", article_id),
                "website": NAME,
            }
        )
    return sorted(items, key=lambda item: int(item["timestamp"]), reverse=True)


def collect() -> list[dict[str, object]]:
    response = HttpClient(allowed_hostnames=["www.infzm.com"], max_bytes=3_000_000).get(URL)
    return parse_response(response.json())


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
