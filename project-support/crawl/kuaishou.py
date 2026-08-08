from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from pathlib import Path

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from crawl.lib.http import HttpClient
from crawl.lib.runner import preserve_or_fail, run_guarded

NAME = "kuaishou"
OUTPUT = "kuaishouData.json"
URL = "https://www.kuaishou.com/graphql"
USER_IDS = ("3x2fq6my5mmrvak", "3xqrberfqg2r95g")
QUERY = """
query visionProfilePhotoList($pcursor: String, $userId: String, $page: String) {
  visionProfilePhotoList(pcursor: $pcursor, userId: $userId, page: $page) {
    result
    feeds {
      photo { id caption originCaption likeCount viewCount coverUrl photoUrl timestamp }
    }
  }
}
"""


def parse_response(payload: object) -> list[dict[str, object]]:
    if not isinstance(payload, dict):
        raise ValueError("Kuaishou response is not an object")
    container = payload.get("data", {}).get("visionProfilePhotoList")
    if not isinstance(container, dict) or container.get("result") not in (1, "1", None):
        raise ValueError("Kuaishou response has no usable data envelope")
    feeds = container.get("feeds")
    if not isinstance(feeds, list):
        raise ValueError("Kuaishou response has no feeds array")
    items: list[dict[str, object]] = []
    for feed in feeds:
        photo = feed.get("photo") if isinstance(feed, dict) else None
        if not isinstance(photo, dict):
            continue
        timestamp = photo.get("timestamp")
        video_url = photo.get("photoUrl")
        if not isinstance(timestamp, (int, float)) or not video_url:
            continue
        items.append(
            {
                "captionUrl": photo.get("coverUrl") or "",
                "videoUrl": video_url,
                "originCaption": photo.get("originCaption") or photo.get("caption") or "",
                "likeCount": photo.get("likeCount") or 0,
                "viewCount": photo.get("viewCount") or 0,
                "timestamp": int(timestamp),
                "time": datetime.fromtimestamp(timestamp / 1000).strftime("%Y-%m-%d %H:%M:%S"),
                "website": NAME,
            }
        )
    return items


def collect(cookie: str) -> list[dict[str, object]]:
    client = HttpClient(allowed_hostnames=["www.kuaishou.com"], max_bytes=5_000_000)
    headers = {
        "Content-Type": "application/json",
        "Cookie": cookie,
        "Origin": "https://www.kuaishou.com",
        "Referer": "https://www.kuaishou.com/",
    }
    items: list[dict[str, object]] = []
    for user_id in USER_IDS:
        response = client.post(
            URL,
            headers=headers,
            json={
                "operationName": "visionProfilePhotoList",
                "query": QUERY,
                "variables": {"userId": user_id, "pcursor": "", "page": "profile"},
            },
        )
        items.extend(parse_response(response.json()))
    unique = {str(item["videoUrl"]): item for item in items}
    return sorted(unique.values(), key=lambda item: int(item["timestamp"]), reverse=True)


def main() -> int:
    cookie = os.environ.get("KUAISHOU_COOKIE", "").strip()
    if not cookie:
        result = preserve_or_fail(
            name=NAME,
            output=OUTPUT,
            kind="video",
            reason="KUAISHOU_COOKIE is not configured",
            optional=True,
            missing_configuration=True,
        )
    else:
        result = run_guarded(
            lambda: collect(cookie),
            name=NAME,
            output=OUTPUT,
            kind="video",
            min_items=1,
            unique_by="videoUrl",
            optional=True,
        )
    print(json.dumps(result.to_dict(), ensure_ascii=False))
    return 0 if result.is_usable else 1


if __name__ == "__main__":
    raise SystemExit(main())
