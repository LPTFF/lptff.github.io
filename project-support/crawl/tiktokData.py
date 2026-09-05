from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import unquote

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from crawl.lib.http import HttpClient, looks_like_challenge
from crawl.lib.runner import preserve_or_fail, run_guarded

NAME = "tiktok"
OUTPUT = "tiktok.json"
PROFILES = (
    (
        "李子栗",
        "https://www.douyin.com/user/MS4wLjABAAAArX12ZxuOajsvfGvjJlscWW4CoRzRGWVQzg3Dl7rTyRk",
    ),
    (
        "独孤十一",
        "https://www.douyin.com/user/MS4wLjABAAAAy2jwiZb2MrkuPrx3Ppp7Mf6wK7-FeUDbhFILKtJ-GKN5DlWlyliPV03MdFKjQr5M",
    ),
)


def parse_video_page(
    html: str,
    *,
    detail_url: str,
    author_name: str,
    author_page: str,
) -> dict[str, object]:
    soup = BeautifulSoup(html, "html.parser")
    script = soup.select_one("script#RENDER_DATA")
    if not script or not script.string:
        raise ValueError("Douyin video page has no render data")
    payload = json.loads(unquote(script.string))
    detail = None
    for value in payload.values() if isinstance(payload, dict) else ():
        candidate = value.get("aweme", {}).get("detail") if isinstance(value, dict) else None
        if isinstance(candidate, dict):
            detail = candidate
            break
    if not detail:
        raise ValueError("Douyin render data has no video detail")
    timestamp = int(detail.get("createTime") or detail.get("create_time") or detail.get("requestTime") or 0)
    if timestamp and timestamp < 10_000_000_000:
        timestamp *= 1000
    videos = detail.get("video") or {}
    cover_urls = videos.get("coverUrlList") or []
    rates = videos.get("bitRateList") or []
    play_addresses = rates[0].get("playAddr") if rates else []
    source = play_addresses[0].get("src") if play_addresses else ""
    if source.startswith("//"):
        source = f"https:{source}"
    if not timestamp or not source:
        raise ValueError("Douyin video detail misses timestamp or video URL")
    stats = detail.get("stats") or {}
    return {
        "captionUrl": cover_urls[0] if cover_urls else "",
        "videoUrl": source,
        "detailUrl": detail_url,
        "desc": detail.get("desc") or "",
        "authorName": author_name,
        "authorPage": author_page,
        "likeCount": stats.get("diggCount") or 0,
        "collectCount": stats.get("collectCount") or 0,
        "timestamp": timestamp,
        "time": datetime.fromtimestamp(timestamp / 1000).strftime("%Y-%m-%d %H:%M:%S"),
        "website": "douyin",
    }


def collect(cookie: str, *, max_scrolls: int = 12, deadline_seconds: int = 150) -> list[dict[str, object]]:
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1440,1200")
    driver = None
    started = time.monotonic()
    try:
        driver = webdriver.Chrome(options=options)
        driver.set_page_load_timeout(30)
        profile_links: list[tuple[str, str, str]] = []
        for author_name, profile_url in PROFILES:
            driver.get(profile_url)
            if looks_like_challenge(driver.page_source):
                raise RuntimeError(f"Douyin returned a login or challenge page for {author_name}")
            stable_scrolls = 0
            last_height = driver.execute_script("return document.documentElement.scrollHeight")
            for _ in range(max_scrolls):
                if time.monotonic() - started > deadline_seconds:
                    raise TimeoutError("Douyin profile collection exceeded its deadline")
                driver.execute_script("window.scrollTo(0, document.documentElement.scrollHeight)")
                time.sleep(1.5)
                height = driver.execute_script("return document.documentElement.scrollHeight")
                stable_scrolls = stable_scrolls + 1 if height == last_height else 0
                last_height = height
                if stable_scrolls >= 2:
                    break
            links = {
                element.get_attribute("href").split("?", 1)[0]
                for element in driver.find_elements(By.CSS_SELECTOR, 'a[href*="/video/"]')
                if element.get_attribute("href")
            }
            profile_links.extend((link, author_name, profile_url) for link in sorted(links)[:50])
    finally:
        if driver is not None:
            driver.quit()

    client = HttpClient(allowed_hostnames=["www.douyin.com"], max_bytes=5_000_000, retries=1)
    headers = {"Cookie": cookie, "Referer": "https://www.douyin.com/"}
    items = []
    for link, author_name, profile_url in profile_links:
        response = client.get(link, headers=headers, expected_content_types=["text/html"])
        items.append(
            parse_video_page(
                response.text,
                detail_url=link,
                author_name=author_name,
                author_page=profile_url,
            )
        )
    unique = {str(item["detailUrl"]): item for item in items}
    return sorted(unique.values(), key=lambda item: int(item["timestamp"]), reverse=True)


def main() -> int:
    cookie = os.environ.get("DOUYIN_COOKIE", "").strip()
    if not cookie:
        result = preserve_or_fail(
            name=NAME,
            output=OUTPUT,
            kind="video",
            reason="DOUYIN_COOKIE is not configured",
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
            unique_by="detailUrl",
            optional=True,
        )
    print(json.dumps(result.to_dict(), ensure_ascii=False))
    return 0 if result.is_usable else 1


if __name__ == "__main__":
    raise SystemExit(main())
