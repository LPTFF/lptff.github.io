from __future__ import annotations

import json
import re
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import quote, urljoin, urlparse

from bs4 import BeautifulSoup

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from crawl.lib.http import HttpClient, decode_response
from crawl.lib.runner import run_guarded

NAME = "xiaohongshu"
OUTPUT = "xiaohongshu.json"
URL = "https://www.xiaohongshu.com/explore"
NOTE_PATH = re.compile(r"^/explore/[0-9a-f]{24}$")


def parse_page(
    html: str,
    collected_at: datetime | None = None,
) -> list[dict[str, object]]:
    """Read anonymous discovery cards from the server-rendered public page.

    Discovery order is not a hot-search ranking. The page does not provide
    publication dates, so timestamps explicitly describe collection time.
    """
    soup = BeautifulSoup(html, "html.parser")
    collection_time = collected_at or datetime.now().astimezone()
    items: list[dict[str, object]] = []
    seen: set[str] = set()
    for card in soup.select("section.note-item"):
        anchor = card.select_one("a.title[href]")
        if anchor is None:
            continue
        title = " ".join(anchor.stripped_strings).strip()
        parsed = urlparse(urljoin(URL, str(anchor.get("href") or "")))
        if (
            not title
            or parsed.scheme != "https"
            or parsed.hostname != "www.xiaohongshu.com"
            or parsed.username
            or parsed.password
            or not NOTE_PATH.fullmatch(parsed.path)
        ):
            continue
        # Unsigned detail links return /404; signed detail URLs are transient.
        # Keep a stable official title search without publishing access tokens.
        url = f"https://www.xiaohongshu.com/search_result?keyword={quote(title, safe='')}"
        if url in seen:
            continue
        seen.add(url)
        items.append(
            {
                "url": url,
                "noteId": parsed.path.rsplit("/", 1)[-1],
                "title": title,
                "desc": "小红书公开发现页快照 · 卡片时间为采集时间",
                "time": collection_time.strftime("%Y-%m-%d %H:%M:%S"),
                "timestamp": int(collection_time.timestamp() * 1000),
                "timestampType": "collected",
                "website": NAME,
            }
        )
    if not items:
        raise ValueError("Xiaohongshu public discovery page contains no usable cards")
    return items


def collect() -> list[dict[str, object]]:
    client = HttpClient(
        allowed_hostnames=["www.xiaohongshu.com"],
        max_bytes=5_000_000,
        timeout=(5, 20),
        retries=1,
    )
    response = client.get(URL, expected_content_types=("text/html",))
    return parse_page(decode_response(response))


def main() -> int:
    result = run_guarded(
        collect,
        name=NAME,
        output=OUTPUT,
        kind="article",
        min_items=1,
        unique_by="url",
        optional=True,
    )
    print(json.dumps(result.to_dict(), ensure_ascii=False))
    return 0 if result.is_usable else 1


if __name__ == "__main__":
    raise SystemExit(main())
