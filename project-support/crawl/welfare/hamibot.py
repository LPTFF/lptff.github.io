from __future__ import annotations

import json
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin

import pytz
from bs4 import BeautifulSoup

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from crawl.lib.http import HttpClient, decode_response
from crawl.lib.runner import run_guarded

NAME = "hamibot"
OUTPUT = "welfare/hamibot.json"
SOURCE_URL = "https://hamibot.com/marketplace/category/top-grossing"
API_URL = "https://hamibot.com/api/listings?category=top-grossing"
BEIJING = pytz.timezone("Asia/Shanghai")


def collect() -> list[dict[str, object]]:
    client = HttpClient(
        allowed_hostnames=["hamibot.com"],
        max_bytes=3_000_000,
        retries=1,
        timeout=(5, 10),
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    )
    items: list[dict[str, object]] = []

    # 优先尝试接口直接获取结构化数据
    try:
        response = client.get(API_URL, expected_content_types=["application/json"])
        data = response.json()
        listings = data.get("items") if isinstance(data, dict) else None
        if isinstance(listings, list):
            for idx, entry in enumerate(listings):
                if not isinstance(entry, dict):
                    continue
                slug = str(entry.get("slug") or "").strip()
                name = str(entry.get("name") or "").strip()
                if not slug or not name:
                    continue

                # 优化时间采集：畅销榜展示优先采用详情接口的最新更新日期 (updated: YYYY-MM-DD)
                dt: datetime | None = None
                time.sleep(0.5)
                for attempt in range(2):
                    try:
                        detail_resp = client.get(
                            f"https://hamibot.com/api/listings/{slug}",
                            headers={"Referer": SOURCE_URL},
                        )
                        detail_data = detail_resp.json()
                        updated_str = str(detail_data.get("updated") or "").strip()
                        if updated_str and re.match(r"^\d{4}-\d{2}-\d{2}$", updated_str):
                            base_dt = datetime.strptime(updated_str, "%Y-%m-%d")
                            # 设为 12:00，并以秒数微调保留畅销榜相对次序
                            dt = BEIJING.localize(
                                base_dt.replace(hour=12, minute=0, second=max(0, 59 - idx))
                            )
                            break
                    except Exception:
                        time.sleep(1.0 * (attempt + 1))

                # 回退策略1：从 version 版本号中提取年月（如 26.9.13 / 26.9.AI -> 2026-09）
                if dt is None:
                    ver = str(entry.get("version") or "").strip()
                    m = re.match(r"^(\d{2})\.(\d{1,2})(?:\.(\d{1,2}))?", ver)
                    if m:
                        year = 2000 + int(m.group(1))
                        month = int(m.group(2))
                        day = (
                            int(m.group(3))
                            if m.group(3) and m.group(3).isdigit() and 1 <= int(m.group(3)) <= 31
                            else 1
                        )
                        try:
                            dt = BEIJING.localize(
                                datetime(year, month, day, 12, 0, max(0, 59 - idx))
                            )
                        except Exception:
                            pass

                # 回退策略2：使用当前采集时间（避免使用初期建档的远古 ObjectId）
                if dt is None:
                    dt = datetime.now(BEIJING)

                icon = str(entry.get("icon") or "").strip()
                if icon and not icon.startswith("http"):
                    icon = urljoin("https://hamibot.com/", icon)

                dev = entry.get("developer") if isinstance(entry.get("developer"), dict) else {}
                author = str(dev.get("name") or dev.get("username") or "").strip()
                summary = str(entry.get("shortdesc") or "").strip()

                items.append(
                    {
                        "link": f"https://hamibot.com/marketplace/{slug}",
                        "title": name,
                        "summary": summary[:600],
                        "img_src": icon,
                        "time": dt.strftime("%Y-%m-%d %H:%M:%S"),
                        "timestamp": int(dt.timestamp() * 1000),
                        "website": "hamibot",
                        "authorName": author,
                        "sourceType": "public-http-index",
                        "sourceProvider": "Hamibot",
                        "sourceFeed": SOURCE_URL,
                        "timestampMeaning": "source-item-updated-at",
                        "originalHost": "hamibot.com",
                        "isTop": "0",
                    }
                )
    except Exception:
        items = []

    # 若接口不可用则回退解析服务端渲染 HTML
    if not items:
        response = client.get(SOURCE_URL, expected_content_types=["text/html"])
        html = decode_response(response)
        soup = BeautifulSoup(html, "html.parser")
        seen_links: set[str] = set()
        for a in soup.select('a[href*="/marketplace/"]'):
            href = str(a.get("href") or "").strip()
            if not href or "/marketplace/category/" in href or href in ("/marketplace", "/marketplace/"):
                continue
            link = urljoin("https://hamibot.com/", href)
            if link in seen_links:
                continue
            seen_links.add(link)

            title_node = a.select_one("h2")
            title = title_node.get_text(" ", strip=True) if title_node else a.get_text(" ", strip=True)
            if not title:
                continue

            img = a.select_one("img")
            img_src = ""
            if img:
                img_src = str(img.get("src") or img.get("data-src") or "")
                if img_src and not img_src.startswith("http"):
                    img_src = urljoin("https://hamibot.com/", img_src)

            p_desc = a.select_one("p")
            summary = p_desc.get_text(" ", strip=True) if p_desc else ""

            author_node = a.select_one("span.text-text-02")
            author = author_node.get_text(" ", strip=True) if author_node else ""

            now = datetime.now(BEIJING)
            items.append(
                {
                    "link": link,
                    "title": title,
                    "summary": summary[:600],
                    "img_src": img_src,
                    "time": now.strftime("%Y-%m-%d %H:%M:%S"),
                    "timestamp": int(now.timestamp() * 1000),
                    "website": "hamibot",
                    "authorName": author,
                    "sourceType": "public-http-index",
                    "sourceProvider": "Hamibot",
                    "sourceFeed": SOURCE_URL,
                    "timestampMeaning": "source-item-discovered-at",
                    "originalHost": "hamibot.com",
                    "isTop": "0",
                }
            )

    if not items:
        raise RuntimeError("Hamibot collector returned no usable items")

    unique: dict[str, dict[str, object]] = {}
    for item in items:
        link = str(item["link"])
        if link not in unique:
            unique[link] = item

    return sorted(unique.values(), key=lambda item: int(item["timestamp"]), reverse=True)


def main() -> int:
    result = run_guarded(
        collect,
        name=NAME,
        output=OUTPUT,
        kind="welfare",
        min_items=1,
        unique_by="link",
    )
    print(json.dumps(result.to_dict(), ensure_ascii=False))
    return 0 if result.is_usable else 1


if __name__ == "__main__":
    raise SystemExit(main())
