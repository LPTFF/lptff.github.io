from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from pathlib import Path

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.crawl.lib.http import HttpClient
from src.crawl.lib.runner import run_guarded

NAME = "juejin"
OUTPUT = "juejin.json"
URL = "https://api.juejin.cn/recommend_api/v1/article/recommend_cate_feed"


def parse_response(payload: object) -> list[dict[str, object]]:
    if not isinstance(payload, dict) or payload.get("err_no") not in (0, None):
        raise ValueError("Juejin response has an error envelope")
    data = payload.get("data")
    if not isinstance(data, list):
        raise ValueError("Juejin response has no data array")
    items: list[dict[str, object]] = []
    for entry in data:
        info = entry.get("article_info") if isinstance(entry, dict) else None
        if not isinstance(info, dict):
            continue
        article_id = str(info.get("article_id") or "")
        title = str(info.get("title") or "").strip()
        try:
            modified = int(info.get("mtime"))
        except (TypeError, ValueError):
            continue
        if not article_id or not title:
            continue
        items.append(
            {
                "url": f"https://juejin.cn/post/{article_id}",
                "desc": info.get("brief_content") or title,
                "time": datetime.fromtimestamp(modified).strftime("%Y-%m-%d %H:%M:%S"),
                "timestamp": modified * 1000,
                "image": info.get("cover_image") or "",
                "title": title,
                "articleId": article_id,
                "website": NAME,
            }
        )
    return sorted(items, key=lambda item: int(item["timestamp"]), reverse=True)


def collect() -> list[dict[str, object]]:
    client = HttpClient(allowed_hostnames=["api.juejin.cn"], max_bytes=4_000_000)
    headers = {"Content-Type": "application/json", "Origin": "https://juejin.cn"}
    cookie = os.environ.get("JUEJIN_COOKIE", "").strip()
    if cookie:
        headers["Cookie"] = cookie
    response = client.post(
        URL,
        headers=headers,
        params={"aid": "2608", "spider": "0"},
        json={
            "cate_id": "6809637767543259144",
            "cursor": "0",
            "id_type": 2,
            "limit": 20,
            "sort_type": 200,
        },
    )
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
