from __future__ import annotations

import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urljoin, urlparse

import pytz
from bs4 import BeautifulSoup

from crawl.lib.http import HttpClient, decode_response
from crawl.lib.runner import preserve_or_fail, run_guarded

BEIJING = pytz.timezone("Asia/Shanghai")
TUAN_0818_HOSTNAME = "www.0818tuan.com"
TUAN_0818_LIST_URL = f"http://{TUAN_0818_HOSTNAME}/list-1-0.html"


def _safe_0818_link(href: str) -> str:
    link = urljoin(f"http://{TUAN_0818_HOSTNAME}/", href)
    parsed = urlparse(link)
    if (
        parsed.scheme != "http"
        or parsed.hostname != TUAN_0818_HOSTNAME
        or parsed.username
        or parsed.password
        or parsed.query
        or parsed.fragment
    ):
        raise ValueError("0818 item has an unexpected origin URL")
    match = re.fullmatch(r"/xbhd/(\d+)\.html", parsed.path)
    if not match:
        raise ValueError("0818 item is not a supported activity entry")
    return link


def parse_0818(html: str, *, now: datetime | None = None) -> list[dict[str, object]]:
    soup = BeautifulSoup(html, "html.parser")
    container = soup.select_one("div#redtag")
    if not container:
        return []
    items: list[dict[str, object]] = []
    seen_links: set[str] = set()
    for article in container.select("a.list-group-item[href]"):
        title = str(article.get("title") or "").strip()
        badge = article.select_one("span.badge-success.red")
        if not title or "�" in title or not badge:
            continue
        try:
            link = _safe_0818_link(str(article.get("href") or ""))
            published_at = parse_flexible_time(badge.get_text(" ", strip=True), now=now)
        except (TypeError, ValueError):
            continue
        if link in seen_links:
            continue
        seen_links.add(link)
        items.append(
            {
                "link": link,
                "title": title,
                "img_src": "",
                "time": published_at.strftime("%Y-%m-%d %H:%M:%S"),
                "timestamp": int(published_at.timestamp() * 1000),
                "website": "0818tuan",
                "sourceType": "public-http-index",
                "sourceProvider": "0818团",
                "sourceFeed": TUAN_0818_LIST_URL,
                "timestampMeaning": "source-item-published-at",
                "originalHost": TUAN_0818_HOSTNAME,
                "isTop": "0",
            }
        )
    return items


def collect_0818() -> list[dict[str, object]]:
    response = HttpClient(
        allowed_hostnames=[TUAN_0818_HOSTNAME],
        max_bytes=1_000_000,
        retries=1,
        allowed_schemes=["http"],
    ).get(
        TUAN_0818_LIST_URL,
        expected_content_types=["text/html"],
    )
    return parse_0818(decode_response(response, default="utf-8"))


def run_0818_source(*, name: str, output: str, top: bool) -> int:
    if top:
        result = preserve_or_fail(
            name=name,
            output=output,
            kind="welfare",
            reason="collector: no explicit HTTPS top-item evidence",
            min_items=1,
            optional=True,
            unique_by="link",
            allowed_http_hostnames=[TUAN_0818_HOSTNAME],
        )
    else:
        result = run_guarded(
            collect_0818,
            name=name,
            output=output,
            kind="welfare",
            min_items=3,
            unique_by="link",
            allowed_http_hostnames=[TUAN_0818_HOSTNAME],
        )
    print(json.dumps(result.to_dict(), ensure_ascii=False))
    return 0 if result.is_usable else 1


def parse_flexible_time(value: str, now: datetime | None = None) -> datetime:
    current = (now or datetime.now(BEIJING)).astimezone(BEIJING)
    value = value.strip()
    formats = (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
        "%m-%d %H:%M",
        "%m-%d",
        "%H:%M",
    )
    for pattern in formats:
        try:
            parsed = datetime.strptime(value, pattern)
            if pattern.startswith("%m"):
                parsed = parsed.replace(year=current.year)
            elif pattern.startswith("%H"):
                parsed = parsed.replace(year=current.year, month=current.month, day=current.day)
            return BEIJING.localize(parsed)
        except ValueError:
            continue
    match = re.search(r"(\d{1,2})[-月](\d{1,2})日?\s+(\d{1,2}):(\d{2})", value)
    if match:
        month, day, hour, minute = map(int, match.groups())
        return BEIJING.localize(datetime(current.year, month, day, hour, minute))
    day_relative = re.search(r"(\d+)\s*(?:天|日)前", value)
    if day_relative:
        return current - timedelta(days=int(day_relative.group(1)))
    relative = re.search(r"(\d+)\s*(?:分钟|分鐘|分|小时|小時|时|時)前", value)
    if relative:
        amount = int(relative.group(1))
        unit = "hour" if any(marker in value for marker in ("小时", "小時", "时", "時")) else "minute"
        return current - (timedelta(hours=amount) if unit == "hour" else timedelta(minutes=amount))
    if value in {"刚刚", "剛剛"}:
        return current
    if value in {"今天", "今日"}:
        return current.replace(hour=0, minute=0, second=0, microsecond=0)
    if value in {"昨天", "昨日"}:
        return current.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)
    raise ValueError("unsupported welfare timestamp")


def _detail_date(
    client: HttpClient,
    url: str,
    *,
    selector: str,
) -> datetime | None:
    try:
        response = client.get(url, expected_content_types=["text/html"])
        soup = BeautifulSoup(decode_response(response, default="utf-8"), "html.parser")
        nodes = soup.select(selector)
        for node in nodes:
            match = re.search(
                r"\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2}(?::\d{2})?)?",
                node.get_text(" ", strip=True),
            )
            if match:
                return parse_flexible_time(match.group(0))
        return None
    except Exception:
        return None


def _hydrate_top_dates(
    items: list[dict[str, object]],
    *,
    hostname: str,
    selector: str,
) -> list[dict[str, object]]:
    client = HttpClient(allowed_hostnames=[hostname], max_bytes=3_000_000, retries=1)
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {
            executor.submit(_detail_date, client, str(item["link"]), selector=selector): item
            for item in items
        }
        for future in as_completed(futures):
            date = future.result()
            if not date:
                continue
            item = futures[future]
            item["time"] = date.strftime("%Y-%m-%d %H:%M:%S")
            item["timestamp"] = int(date.timestamp() * 1000)
    return [item for item in items if item.get("timestamp")]


def parse_daydayzhuan(html: str, *, top: bool) -> list[dict[str, object]]:
    soup = BeautifulSoup(html, "html.parser")
    items = []
    for article in soup.select("article.layui-row.title-li"):
        link = article.select_one("a[href]")
        is_top = bool(article.select_one("i.icon-zhiding"))
        if not link or is_top != top:
            continue
        time_node = article.select_one("time")
        if not time_node:
            continue
        try:
            date = parse_flexible_time(time_node.get_text(" ", strip=True))
        except ValueError:
            continue
        title = str(link.get("title") or link.get_text(" ", strip=True)).strip()
        if not title or "�" in title:
            continue
        items.append(
            {
                "link": urljoin("https://www.daydayzhuan.com/", str(link.get("href") or "")),
                "title": title,
                "img_src": "",
                "time": date.strftime("%Y-%m-%d %H:%M:%S"),
                "timestamp": int(date.timestamp() * 1000),
                "website": "daydayzhuan",
                "isTop": "1" if top else "0",
            }
        )
    return items


def parse_daydayzhuan_top_candidates(html: str) -> list[dict[str, object]]:
    soup = BeautifulSoup(html, "html.parser")
    items: list[dict[str, object]] = []
    for article in soup.select("article.layui-row.title-li"):
        link = article.select_one("a[href]")
        if not link or not article.select_one("i.icon-zhiding"):
            continue
        title = str(link.get("title") or link.get_text(" ", strip=True)).strip()
        url = urljoin("https://www.daydayzhuan.com/", str(link.get("href") or ""))
        if title and url.startswith("https://www.daydayzhuan.com/") and "�" not in title:
            items.append(
                {
                    "link": url,
                    "title": title,
                    "img_src": "",
                    "website": "daydayzhuan",
                    "isTop": "1",
                }
            )
    return items


def parse_zhuanyes_top_candidates(html: str) -> list[dict[str, object]]:
    soup = BeautifulSoup(html, "html.parser")
    items: list[dict[str, object]] = []
    for article in soup.select("div.pbm li"):
        link = article.select_one("a[href^='https://www.zhuanyes.com/xianbao/'], a[href^='/xianbao/']")
        if not link:
            continue
        title = str(link.get("title") or link.get_text(" ", strip=True)).strip()
        url = urljoin("https://www.zhuanyes.com/", str(link.get("href") or ""))
        if title and "�" not in title:
            items.append(
                {
                    "link": url,
                    "title": title,
                    "img_src": "",
                    "website": "zhuanyes",
                    "isTop": "1",
                }
            )
    return items


def parse_zhuanyes(html: str, *, top: bool) -> list[dict[str, object]]:
    soup = BeautifulSoup(html, "html.parser")
    articles = soup.select("div.pbm li") if top else soup.select("div.bm_c.py0 div.thread.bbs")
    items = []
    for article in articles:
        link = article.select_one("a.xst") or article.select_one("a[href]")
        time_node = article.select_one("em")
        if not link or not time_node:
            continue
        raw_time = time_node.get_text(" ", strip=True).replace("发表于", "").strip()
        try:
            date = parse_flexible_time(raw_time)
        except ValueError:
            continue
        items.append(
            {
                "link": urljoin("https://www.zhuanyes.com/", str(link.get("href") or "")),
                "title": link.get_text(" ", strip=True),
                "img_src": "",
                "time": date.strftime("%Y-%m-%d %H:%M:%S"),
                "timestamp": int(date.timestamp() * 1000),
                "website": "zhuanyes",
                "isTop": "1" if top else "0",
            }
        )
    return items


def run_source(
    *,
    name: str,
    output: str,
    url: str,
    hostname: str,
    parser: object,
    top: bool,
) -> int:
    def collect() -> list[dict[str, object]]:
        response = HttpClient(allowed_hostnames=[hostname], max_bytes=3_000_000).get(
            url, expected_content_types=["text/html"]
        )
        html = decode_response(response, default="utf-8")
        if top and name == "daydayzhuanTop":
            return _hydrate_top_dates(
                parse_daydayzhuan_top_candidates(html),
                hostname=hostname,
                selector="i.layui-icon-date, .article-otherinfo",
            )
        if top and name == "zhuanyesTop":
            return _hydrate_top_dates(
                parse_zhuanyes_top_candidates(html),
                hostname=hostname,
                selector="em",
            )
        return parser(html, top=top)

    result = run_guarded(
        collect,
        name=name,
        output=output,
        kind="welfare",
        min_items=1,
        unique_by="link",
    )
    print(json.dumps(result.to_dict(), ensure_ascii=False))
    return 0 if result.is_usable else 1
