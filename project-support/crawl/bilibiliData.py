from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from crawl.lib.http import HttpClient
from crawl.lib.browser_feed import open_browser, read_feed
from crawl.lib.runner import failure_reason, run_guarded
from crawl.lib.output import DATA_ROOT

NAME = "bilibili"
OUTPUT = "bilibili.json"
SOURCES = [source for source in json.loads((Path(__file__).resolve().parents[1] / "extension/lptff-investment-assistant/content-sources.json").read_text(encoding="utf-8")) if source["platform"] == "bilibili"]


def normalize_space(value: str) -> tuple[str, str]:
    value = str(value).strip()
    if value.isdecimal():
        uid = value
    else:
        parsed = urlparse(value)
        parts = parsed.path.strip("/").split("/")
        if (parsed.scheme != "https" or parsed.hostname != "space.bilibili.com"
                or parsed.username or parsed.password or parsed.port
                or len(parts) > 2 or (len(parts) == 2 and parts[1] != "dynamic")):
            raise ValueError("Invalid Bilibili space URL")
        uid = parts[0]
    if not uid.isascii() or not uid.isdecimal() or int(uid) <= 0:
        raise ValueError("Invalid Bilibili UID")
    uid = str(int(uid))
    return uid, f"https://space.bilibili.com/{uid}/dynamic"


SPACES = tuple((source["name"], *normalize_space(source["uid"])) for source in SOURCES)
SOURCE_FAILURES = []


def items_for_tab(tab):
    uids = {source["uid"] for source in SOURCES if source["tab"] == tab}
    items = json.loads((DATA_ROOT / OUTPUT).read_text(encoding="utf-8"))
    return [{**item, "title": item["desc"], "url": item["detailUrl"], "link": item["detailUrl"]}
            for item in items if normalize_space(item["authorPage"])[0] in uids]


def fetch_payload(client, url, headers, space_url, cookie, browser):
    try:
        response = client.get(url, headers=headers, expected_content_types=["application/json"])
        payload = response.json()
        if payload.get("code") == 0 and isinstance((payload.get("data") or {}).get("items"), list):
            return payload
    except Exception as error:
        print(json.dumps({"stage": "bilibili-http", "reason": failure_reason(error)}), flush=True)
    # The normal page supplies the public API parameters when a bare request is rejected.
    return read_feed(browser(), page_url=space_url, api_host="api.bilibili.com",
                     api_path="/x/polymer/web-dynamic/v1/feed/space", cookie=cookie,
                     query_match={"host_mid": normalize_space(space_url)[0]})


def collect(cookie: str) -> list[dict[str, object]]:
    driver = None
    def browser():
        nonlocal driver
        if driver is None:
            driver = open_browser()
        return driver
    try:
        return collect_spaces(cookie, browser)
    finally:
        if driver is not None:
            driver.quit()


def collect_spaces(cookie, browser):
    SOURCE_FAILURES.clear()
    previous = json.loads((DATA_ROOT / OUTPUT).read_text(encoding="utf-8")) if (DATA_ROOT / OUTPUT).exists() else []
    client = HttpClient(
        allowed_hostnames=["api.bilibili.com", "space.bilibili.com"],
        max_bytes=5_000_000,
        retries=0,
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
            payload = fetch_payload(client, url, headers, space_url, cookie, browser)
            if payload.get("code") != 0 or not isinstance((payload.get("data") or {}).get("items"), list):
                raise ValueError("Bilibili feed rejected or invalid")
            items_raw = payload.get("data", {}).get("items", [])
            items: list[dict[str, object]] = []
            for item in items_raw:
                dyn = item.get("modules", {}).get("module_dynamic", {})
                author = item.get("modules", {}).get("module_author", {})
                stat = item.get("modules", {}).get("module_stat", {})
                archive = (dyn.get("major") or {}).get("archive") or {}
                # Welfare/security follow dynamics too, not just video uploads.
                if not archive:
                    if host_mid == "1259252171":
                        continue
                    opus = (dyn.get("major") or {}).get("opus") or {}
                    title = (dyn.get("desc") or {}).get("text") or (opus.get("summary") or {}).get("text") or opus.get("title")
                    if not title or not item.get("id_str"):
                        continue
                    archive = {"title": title, "jump_url": f"https://t.bilibili.com/{item['id_str']}"}
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
                detail_url = f"https://www.bilibili.com/video/{bvid}" if bvid else jump_url
                pub_ts = int(author.get("pub_ts") or 0) * 1000
                if not pub_ts or not detail_url or not title:
                    raise ValueError("Bilibili item misses publication time, URL or title")
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
            if not items:
                raise ValueError("Bilibili source returned no usable entries")
            print(json.dumps({"uid": host_mid, "state": "success", "count": len(items)}, ensure_ascii=False), flush=True)
        except Exception as error:
            print(json.dumps({"uid": host_mid, "state": "failed", "reason": failure_reason(error)}), flush=True)
            SOURCE_FAILURES.append(host_mid)
            by_author[author_name] = [entry for entry in previous
                                      if normalize_space(entry["authorPage"])[0] == host_mid]

    unique: dict[str, dict[str, object]] = {}
    for author_name, _, _ in SPACES:
        for entry in by_author.get(author_name, []):
            v_url = str(entry.get("videoUrl") or "")
            if v_url and v_url not in unique:
                unique[v_url] = entry
    return sorted(unique.values(), key=lambda item: int(item.get("timestamp") or 0), reverse=True)


def main() -> int:
    cookie = os.environ.get("BILIBILI_COOKIE", "").strip()
    result = run_guarded(
        lambda: collect(cookie), name=NAME, output=OUTPUT, kind="video",
        min_items=1, unique_by="videoUrl", optional=True,
    )
    if SOURCE_FAILURES and result.state == "success":
        from crawl.lib.status import CollectorResult
        result = CollectorResult(NAME, "preserved", result.item_count, result.output,
                                 f"partial-source-failure: {','.join(SOURCE_FAILURES)}; retained available snapshots")
    print(json.dumps(result.to_dict(), ensure_ascii=False))
    return 0 if result.is_usable else 1


if __name__ == "__main__":
    raise SystemExit(main())
