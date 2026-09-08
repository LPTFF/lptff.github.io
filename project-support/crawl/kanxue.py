from __future__ import annotations

import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin

import pytz
from bs4 import BeautifulSoup

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from crawl.lib.http import HttpClient, decode_response
from crawl.lib.runner import run_guarded

NAME = "kanxue"
URL = "https://bbs.kanxue.com/thread-hotlist-all-3.htm"
BEIJING = pytz.timezone("Asia/Shanghai")


def parse_page(html: str) -> list[dict[str, object]]:
    soup = BeautifulSoup(html, "html.parser")
    items = []
    seen = set()
    for row in soup.select("tbody#arctilelist > tr"):
        cells = row.find_all("td", recursive=False)
        if len(cells) != 4:
            continue
        link = cells[1].find("a", href=re.compile(r"^thread-\d+\.htm$"))
        author = cells[2].find("a", href=re.compile(r"^user-home-\d+\.htm$"))
        if not link or not author:
            continue
        title = link.get_text(" ", strip=True)
        url = urljoin(URL, link["href"])
        try:
            rank = int(cells[0].get_text(strip=True))
            heat = int(cells[3].get_text(strip=True).replace(",", ""))
        except ValueError:
            continue
        if not title or url in seen or rank < 1 or heat < 0:
            continue
        seen.add(url)
        items.append({
            "title": title,
            "desc": title,
            "url": url,
            "website": NAME,
            "image": "",
            "rank": rank,
            "heat": heat,
            "_authorId": int(re.search(r"\d+", author["href"])[0]),
        })
    return sorted(items, key=lambda item: item["rank"])


def author_publication_times(author_id: int, *, deadline: float) -> dict[str, int]:
    client = HttpClient(allowed_hostnames=["bbs.kanxue.com"], max_bytes=4_000_000, retries=1)
    # Public homepage's read-only request, verified in Chrome Network. No login or cookies copied.
    response = client.post(
        "https://bbs.kanxue.com/user-hthread.htm", data={"uid": author_id},
        expected_content_types=["application/json", "text/html"], deadline=deadline,
    )
    payload = response.json()
    if str(payload.get("code")) != "0":
        raise ValueError("public thread list request failed")
    rows = payload.get("message", {}).get("threadlist")
    if not isinstance(rows, list):
        raise ValueError("public thread list is missing")
    times = {}
    for row in rows:
        if not isinstance(row, dict):
            continue
        tid, created = row.get("tid"), row.get("create_date")
        if (isinstance(tid, int) and not isinstance(tid, bool) and tid > 0
                and isinstance(created, int) and not isinstance(created, bool)
                and 0 < created <= time.time() + 300):
            times[f"https://bbs.kanxue.com/thread-{tid}.htm"] = created
    return times


def collect() -> list[dict[str, object]]:
    deadline = time.monotonic() + 200
    response = HttpClient(allowed_hostnames=["bbs.kanxue.com"], max_bytes=4_000_000).get(
        URL, expected_content_types=["text/html"]
    )
    items = parse_page(decode_response(response))
    author_ids = sorted({item["_authorId"] for item in items})
    # Query once per author, retaining only the hotlist's publication fields in the output.
    with ThreadPoolExecutor(max_workers=3) as pool:
        batches = list(pool.map(lambda uid: author_publication_times(uid, deadline=deadline), author_ids))
    times = {url: created for batch in batches for url, created in batch.items()}
    for item in items:
        created = times.get(item["url"])
        if created is None:
            raise ValueError("hotlist thread has no verified publication timestamp")
        item.pop("_authorId")
        item.update({
            "time": datetime.fromtimestamp(created, BEIJING).strftime("%Y-%m-%d %H:%M:%S"),
            "timestamp": created * 1000,
            "timeKind": "published",
            "timeSource": "create_date",
        })
    return items


def main() -> int:
    result = run_guarded(
        collect, name=NAME, output="kanxue.json", kind="article",
        min_items=3, unique_by="url", optional=True,
    )
    print(json.dumps(result.to_dict(), ensure_ascii=False))
    return 0 if result.is_usable else 1


if __name__ == "__main__":
    raise SystemExit(main())
