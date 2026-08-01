from __future__ import annotations

import json
import time
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import urlencode, urljoin

import pytz
from bs4 import BeautifulSoup

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.crawl.lib.http import HttpClient, decode_response
from src.crawl.lib.runner import run_guarded

NAME = "welfare"
OUTPUT = "welfare.json"
BEIJING = pytz.timezone("Asia/Shanghai")
HXM5_URL = "https://www.hxm5.com/xianbao/0/json/"
HXM5_GUARD_SALT = "hxm5-json-guard-v1"
HXM5_GUARD_WINDOW_SECONDS = 180


def _hxm5_hash(value: str) -> str:
    result = 2_166_136_261
    for character in value:
        result ^= ord(character)
        result = (result * 16_777_619) & 0xFFFFFFFF
    alphabet = "0123456789abcdefghijklmnopqrstuvwxyz"
    encoded = ""
    while result:
        result, remainder = divmod(result, 36)
        encoded = alphabet[remainder] + encoded
    return encoded or "0"


def hxm5_request_body(now: float | None = None) -> dict[str, str]:
    fields = {
        "r": "list",
        "type": "index",
        "jt": str(int((now or time.time()) // HXM5_GUARD_WINDOW_SECONDS)),
    }
    unsigned = urlencode(fields)
    fields["jx"] = _hxm5_hash(f"/xianbao/0/json/|{unsigned}|{HXM5_GUARD_SALT}")
    return fields


def parse_hxm5_response(payload: object) -> list[dict[str, object]]:
    if not isinstance(payload, dict) or payload.get("code") != 200:
        raise ValueError("hxm5 response is not successful")
    data = payload.get("data")
    source = data.get("list") if isinstance(data, dict) else None
    if not isinstance(source, list):
        raise ValueError("hxm5 response has no list")
    items: list[dict[str, object]] = []
    for entry in source:
        if not isinstance(entry, dict):
            continue
        item_id = str(entry.get("ID") or "").strip()
        title = str(entry.get("Title") or "").strip()
        try:
            date = BEIJING.localize(datetime.strptime(str(entry.get("time") or ""), "%Y-%m-%d %H:%M"))
        except ValueError:
            continue
        if not item_id or not title or "�" in title:
            continue
        images = entry.get("img") if isinstance(entry.get("img"), list) else []
        image_url = str(images[0]) if images else ""
        if not image_url.startswith("https://www.hxm5.com/"):
            image_url = ""
        items.append(
            {
                "link": f"https://www.hxm5.com/t/{item_id}",
                "title": title,
                "img_src": image_url,
                "time": date.strftime("%Y-%m-%d %H:%M:%S"),
                "timestamp": int(date.timestamp() * 1000),
                "website": "hxm5",
            }
        )
    return items


def parse_hxm5(html: str) -> list[dict[str, object]]:
    soup = BeautifulSoup(html, "html.parser")
    items: list[dict[str, object]] = []
    for row in soup.select("ul.rk_ulist li"):
        link = row.select_one("a.title_name")
        time_node = row.select_one("span#rktime")
        if not link or not time_node:
            continue
        try:
            timestamp = int(time_node.get("data")) * 1000
        except (TypeError, ValueError):
            continue
        image = row.select_one("img.lazyli")
        image_url = str(image.get("data-original") or "") if image else ""
        if image_url.startswith("//"):
            image_url = f"https:{image_url}"
        items.append(
            {
                "link": urljoin("https://www.hxm5.com/", str(link.get("href") or "")),
                "title": str(link.get("title") or link.get_text(" ", strip=True)),
                "img_src": image_url,
                "time": time_node.get_text(" ", strip=True),
                "timestamp": timestamp,
                "website": "hxm5",
            }
        )
    return items


def parse_mutouxb(html: str) -> list[dict[str, object]]:
    soup = BeautifulSoup(html, "html.parser")
    items: list[dict[str, object]] = []
    for article in soup.select("main#main article"):
        link = article.select_one("header a.u-url")
        time_node = article.select_one("time.dt-published")
        if not link or not time_node or not time_node.get("datetime"):
            continue
        try:
            date = datetime.fromisoformat(str(time_node["datetime"]).replace("Z", "+00:00"))
        except ValueError:
            continue
        items.append(
            {
                "link": str(link.get("href") or ""),
                "title": link.get_text(" ", strip=True),
                "img_src": "",
                "time": date.strftime("%Y-%m-%d %H:%M:%S"),
                "timestamp": int(date.timestamp() * 1000),
                "website": "mutouxb",
            }
        )
    return items


def parse_yqhd8(html: str, now: datetime | None = None) -> list[dict[str, object]]:
    soup = BeautifulSoup(html, "html.parser")
    today = (now or datetime.now(BEIJING)).astimezone(BEIJING).date()
    items: list[dict[str, object]] = []
    for link in soup.select("div.li-t a.top-five.copy"):
        title = link.select_one("p.today-tittle")
        time_node = link.select_one("p.today-time")
        if not title or not time_node:
            continue
        try:
            parsed_time = datetime.strptime(time_node.get_text(strip=True), "%H:%M").time()
            date = BEIJING.localize(datetime.combine(today, parsed_time))
        except ValueError:
            continue
        items.append(
            {
                "link": urljoin("https://www.yqhd8.com/", str(link.get("href") or "")),
                "title": title.get_text(" ", strip=True),
                "img_src": "",
                "time": date.strftime("%Y-%m-%d %H:%M:%S"),
                "timestamp": int(date.timestamp() * 1000),
                "website": "yqhd8",
            }
        )
    return items


def collect_hxm5() -> list[dict[str, object]]:
    response = HttpClient(
        allowed_hostnames=["www.hxm5.com"],
        max_bytes=3_000_000,
        retries=1,
    ).post(
        HXM5_URL,
        expected_content_types=["application/json"],
        headers={
            "Origin": "https://www.hxm5.com",
            "Referer": "https://www.hxm5.com/",
            "X-HXM5-JSON": "1",
            "X-Requested-With": "XMLHttpRequest",
        },
        data=hxm5_request_body(),
    )
    return parse_hxm5_response(response.json())


def collect() -> list[dict[str, object]]:
    sources = (
        collect_hxm5,
        lambda: parse_mutouxb(
            decode_response(
                HttpClient(
                    allowed_hostnames=["www.mutouxb.com"],
                    max_bytes=3_000_000,
                    retries=1,
                ).get("https://www.mutouxb.com/", expected_content_types=["text/html"])
            )
        ),
        lambda: parse_yqhd8(
            decode_response(
                HttpClient(
                    allowed_hostnames=["www.yqhd8.com"],
                    max_bytes=3_000_000,
                    retries=1,
                ).get("https://www.yqhd8.com/xb", expected_content_types=["text/html"])
            )
        ),
    )
    items: list[dict[str, object]] = []
    successful_sources = 0
    for source in sources:
        try:
            parsed = source()
            if parsed:
                successful_sources += 1
                items.extend(parsed)
        except Exception:
            continue
    if not successful_sources:
        raise RuntimeError("all welfare sources failed or returned unusable data")
    unique: dict[str, dict[str, object]] = {}
    priority = {"hxm5": 3, "mutouxb": 2, "yqhd8": 1}
    for item in items:
        title = str(item["title"])
        existing = unique.get(title)
        if not existing or priority[str(item["website"])] > priority[str(existing["website"])]:
            unique[title] = item
    return sorted(unique.values(), key=lambda item: int(item["timestamp"]), reverse=True)


def main() -> int:
    result = run_guarded(
        collect,
        name=NAME,
        output=OUTPUT,
        kind="welfare",
        min_items=3,
        unique_by="link",
    )
    print(json.dumps(result.to_dict(), ensure_ascii=False))
    return 0 if result.is_usable else 1


if __name__ == "__main__":
    raise SystemExit(main())
