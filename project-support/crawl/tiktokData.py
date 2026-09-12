from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from pathlib import Path

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from crawl.lib.browser_feed import open_browser, read_feed
from crawl.lib.runner import failure_reason, run_guarded
from crawl.lib.output import DATA_ROOT
from crawl.lib.status import CollectorResult

NAME = "tiktok"
OUTPUT = "tiktok.json"
SOURCE_FAILURES = []
PROFILES = tuple((source["name"], f"https://www.douyin.com/user/{source['uid']}")
                 for source in json.loads((Path(__file__).resolve().parents[1] / "extension/lptff-investment-assistant/content-sources.json").read_text(encoding="utf-8"))
                 if source["platform"] == "douyin")


def parse_profile(payload, author_name, profile_url):
    if payload.get("status_code") != 0 or not isinstance(payload.get("aweme_list"), list):
        raise ValueError("Douyin profile feed rejected or invalid")
    items = []
    for video in payload["aweme_list"]:
        author = video.get("author") or {}
        # Exclude recommendations; the display name is not a stable identity.
        if author.get("sec_uid") != profile_url.rsplit("/", 1)[-1]:
            continue
        timestamp = int(video.get("create_time") or 0) * 1000
        video_id = str(video.get("aweme_id") or "")
        if not timestamp or not video_id:
            raise ValueError("Douyin item misses publication time or ID")
        media = video.get("video") or {}
        cover = (media.get("cover") or {}).get("url_list") or []
        playback = (media.get("play_addr") or {}).get("url_list") or []
        detail_url = f"https://www.douyin.com/video/{video_id}"
        stats = video.get("statistics") or {}
        items.append({
            "detailUrl": detail_url,
            "captionUrl": cover[0] if cover else "",
            "videoUrl": playback[0] if playback else detail_url,
            "desc": video.get("desc") or "抖音作者更新",
            "authorName": author.get("nickname") or author_name,
            "authorPage": profile_url,
            "likeCount": stats.get("digg_count") or 0,
            "collectCount": stats.get("collect_count") or 0,
            "timestamp": timestamp,
            "time": datetime.fromtimestamp(timestamp / 1000).strftime("%Y-%m-%d %H:%M:%S"),
            "website": "douyin",
        })
    if not items:
        raise ValueError("Douyin profile returned no usable works")
    return items


def collect(cookie=""):
    SOURCE_FAILURES.clear()
    previous = json.loads((DATA_ROOT / OUTPUT).read_text(encoding="utf-8")) if (DATA_ROOT / OUTPUT).exists() else []
    driver = open_browser()
    items = []
    try:
        for author_name, profile_url in PROFILES:
            retained = [item for item in previous if item.get("authorPage") == profile_url]
            try:
                payload = read_feed(
                    driver, page_url=profile_url, api_host="www.douyin.com",
                    api_path="/aweme/v1/web/aweme/post/", cookie=cookie,
                    query_match={"sec_user_id": profile_url.rsplit("/", 1)[-1]},
                )
                batch = parse_profile(payload, author_name, profile_url)
                latest = max(x["timestamp"] for x in batch)
                if retained and latest < max(x["timestamp"] for x in retained):
                    SOURCE_FAILURES.append(author_name)
                    print(json.dumps({"source": author_name, "state": "preserved", "reason": "public-feed-older-than-snapshot"}, ensure_ascii=False), flush=True)
                merged = {item["detailUrl"]: item for item in retained}
                merged.update({item["detailUrl"]: item for item in batch})
                items.extend(sorted(merged.values(), key=lambda x: x["timestamp"], reverse=True)[:50])
                print(json.dumps({"source": author_name, "state": "success", "count": len(batch),
                                  "maxTimestamp": max(x["timestamp"] for x in batch)}, ensure_ascii=False), flush=True)
            except Exception as error:
                print(json.dumps({"source": author_name, "state": "failed", "reason": failure_reason(error)}, ensure_ascii=False), flush=True)
                SOURCE_FAILURES.append(author_name)
                items.extend(retained)
    finally:
        driver.quit()
    unique = {item["detailUrl"]: item for item in items}
    return sorted(unique.values(), key=lambda item: item["timestamp"], reverse=True)


def main():
    result = run_guarded(
        lambda: collect(os.environ.get("DOUYIN_COOKIE", "").strip()),
        name=NAME, output=OUTPUT, kind="video", min_items=1,
        unique_by="detailUrl", optional=True,
    )
    if SOURCE_FAILURES and result.state == "success":
        result = CollectorResult(NAME, "preserved", result.item_count, result.output,
                                 "incomplete-public-feed: retained latest known works; see source diagnostics")
    print(json.dumps(result.to_dict(), ensure_ascii=False))
    return 0 if result.is_usable else 1


if __name__ == "__main__":
    raise SystemExit(main())
