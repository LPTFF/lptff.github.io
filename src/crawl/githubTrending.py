from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path

from bs4 import BeautifulSoup

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.crawl.lib.http import HttpClient
from src.crawl.lib.runner import run_guarded

NAME = "githubTrending"
OUTPUT = "githubTrending.json"
URL = "https://github.com/trending"


def parse_trending(html: str, now: datetime | None = None) -> list[dict[str, object]]:
    soup = BeautifulSoup(html, "html.parser")
    collected_at = now or datetime.now()
    timestamp = int(collected_at.timestamp() * 1000)
    formatted_time = collected_at.strftime("%Y-%m-%d %H:%M:%S")
    items: list[dict[str, object]] = []
    for article in soup.select("article.Box-row"):
        link = article.select_one("h2 a")
        if not link or not link.get("href"):
            continue
        repository_path = str(link["href"]).strip()
        description = article.select_one("p")
        title = " ".join(link.get_text(" ", strip=True).split())
        desc = description.get_text(" ", strip=True) if description else title
        owner = repository_path.strip("/").split("/", 1)[0]
        image = f"https://github.com/{owner}.png?size=80" if owner else ""
        items.append(
            {
                "time": formatted_time,
                "timestamp": timestamp,
                "title": title,
                "desc": desc or title,
                "image": image,
                "url": f"https://github.com/{repository_path.lstrip('/')}",
                "website": NAME,
            }
        )
    return items


def collect() -> list[dict[str, object]]:
    client = HttpClient(allowed_hostnames=["github.com"], max_bytes=4_000_000)
    response = client.get(URL, expected_content_types=["text/html"])
    return parse_trending(response.text)


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
