from __future__ import annotations

import json
import sys
from datetime import datetime
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urljoin
from xml.etree import ElementTree

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from crawl.lib.http import HttpClient, decode_response
from crawl.lib.runner import run_guarded

NAME = "meituanTech"
OUTPUT = "techForum/meituanTech.json"
URL = "https://tech.meituan.com/rss.xml"


def _text(element: ElementTree.Element, name: str) -> str:
    child = element.find(name)
    return child.text.strip() if child is not None and child.text else ""


def parse_feed(xml_text: str) -> list[dict[str, object]]:
    root = ElementTree.fromstring(xml_text)
    items: list[dict[str, object]] = []
    for entry in root.findall("./channel/item"):
        title = _text(entry, "title")
        url = urljoin(URL, _text(entry, "link"))
        desc = _text(entry, "description")
        published = _text(entry, "pubDate") or _text(root.find("./channel"), "pubDate")
        if not title or not url or not published:
            continue
        date = parsedate_to_datetime(published)
        items.append(
            {
                "url": url,
                "desc": desc,
                "time": date.astimezone().strftime("%Y-%m-%d %H:%M:%S"),
                "timestamp": int(date.timestamp() * 1000),
                "image": "",
                "website": "meituan",
                "title": title,
            }
        )
    return sorted(items, key=lambda item: int(item["timestamp"]), reverse=True)


def collect() -> list[dict[str, object]]:
    client = HttpClient(allowed_hostnames=["tech.meituan.com"], max_bytes=3_000_000)
    response = client.get(
        URL,
        expected_content_types=["application/rss+xml", "application/xml", "text/xml"],
    )
    return parse_feed(decode_response(response))


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
