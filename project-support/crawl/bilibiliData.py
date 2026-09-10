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

NAME = "bilibili"
OUTPUT = "bilibili.json"
SPACES = (
    ("百科老王", "3663555", "https://space.bilibili.com/3663555/dynamic"),
    ("杨博士说AI", "1259252171", "https://space.bilibili.com/1259252171/dynamic"),
)


def collect(cookie: str) -> list[dict[str, object]]:
    client = HttpClient(
        allowed_hostnames=["api.bilibili.com", "space.bilibili.com"],
        max_bytes=5_000_000,
        retries=2,
    )
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
        ),
        "Cookie": cookie,
        "Referer": "https://space.bilibili.com/",
        "Origin": "https://space.bilibili.com",
    }
    by_author: dict[str, list[dict[str, object]]] = {}
    for author_name, host_mid, space_url in SPACES:
        url = f"https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?host_mid={host_mid}"
        try:
            response = client.get(url, headers=headers, expected_content_types=["application/json"])
            payload = response.json()
            items_raw = payload.get("data", {}).get("items", [])
            items: list[dict[str, object]] = []
            for item in items_raw:
                dyn = item.get("modules", {}).get("module_dynamic", {})
                author = item.get("modules", {}).get("module_author", {})
                stat = item.get("modules", {}).get("module_stat", {})
                archive = dyn.get("major", {}).get("archive")
                if not archive or not isinstance(archive, dict):
                    continue
                bvid = archive.get("bvid")
                title = archive.get("title")
                cover = archive.get("cover") or ""
                if cover.startswith("//"):
                    cover = f"https:{cover}"
                elif cover.startswith("http://"):
                    cover = f"https://{cover[7:]}"
                jump_url = archive.get("jump_url") or ""
                if jump_url.startswith("//"):
                    jump_url = f"https:{jump_url}"
                detail_url = jump_url or (f"https://www.bilibili.com/video/{bvid}" if bvid else "")
                pub_ts = int(author.get("pub_ts") or 0) * 1000 if author.get("pub_ts") else int(datetime.now().timestamp() * 1000)
                items.append(
                    {
                        "captionUrl": cover,
                        "videoUrl": detail_url,
                        "detailUrl": detail_url,
                        "bvid": bvid or "",
                        "desc": title or "",
                        "authorName": author.get("name") or author_name,
                        "authorPage": space_url,
                        "playCount": archive.get("stat", {}).get("play") or "",
                        "danmakuCount": archive.get("stat", {}).get("danmaku") or "",
                        "likeCount": stat.get("like", {}).get("count") or 0,
                        "replyCount": stat.get("comment", {}).get("count") or 0,
                        "duration": archive.get("duration_text") or "",
                        "timestamp": pub_ts,
                        "time": datetime.fromtimestamp(pub_ts / 1000).strftime("%Y-%m-%d %H:%M:%S"),
                        "website": NAME,
                    }
                )
            by_author[author_name] = items
        except Exception:
            by_author[author_name] = []

    unique: dict[str, dict[str, object]] = {}
    for author_name, _, _ in SPACES:
        for entry in by_author.get(author_name, []):
            v_url = str(entry.get("videoUrl") or "")
            if v_url and v_url not in unique:
                unique[v_url] = entry
    return sorted(unique.values(), key=lambda item: int(item.get("timestamp") or 0), reverse=True)


def main() -> int:
    cookie = os.environ.get("BILIBILI_COOKIE", "").strip()
    if not cookie:
        result = preserve_or_fail(
            name=NAME,
            output=OUTPUT,
            kind="video",
            reason="BILIBILI_COOKIE is not configured",
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
