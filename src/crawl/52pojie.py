from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin

import pytz
from bs4 import BeautifulSoup, Tag

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.crawl.lib.http import HttpClient
from src.crawl.lib.runner import run_guarded

NAME = "52pojie"
OUTPUT = "52pojie.json"
URL = "https://www.52pojie.cn/forum-65-1.html"
BEIJING = pytz.timezone("Asia/Shanghai")


def parse_page(html: str) -> list[dict[str, object]]:
    soup = BeautifulSoup(html, "html.parser")
    table = soup.select_one("table#threadlisttableid")
    if not table:
        return []
    items = []
    for row in table.select("tbody"):
        article = row.select_one("th.new")
        link = article.select_one("a.s.xst") if article else None
        time_node = article.select_one("p.res-ti") if article else None
        if not link or not time_node:
            continue
        raw_time = time_node.get_text(" ", strip=True).split("•")[-1].strip()
        try:
            date = BEIJING.localize(datetime.strptime(raw_time, "%Y-%m-%d %H:%M"))
        except ValueError:
            continue
        title = link.get_text(" ", strip=True)
        items.append(
            {
                "time": date.strftime("%Y-%m-%d %H:%M:%S"),
                "timestamp": int(date.timestamp() * 1000),
                "title": title,
                "desc": title,
                "image": "",
                "url": urljoin(URL, str(link.get("href") or "")),
                "website": NAME,
            }
        )
    return sorted(items, key=lambda item: int(item["timestamp"]), reverse=True)


def collect() -> list[dict[str, object]]:
    response = HttpClient(allowed_hostnames=["www.52pojie.cn"], max_bytes=4_000_000).get(
        URL, expected_content_types=["text/html"]
    )
    response.encoding = response.apparent_encoding or "gbk"
    return parse_page(response.text)


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
