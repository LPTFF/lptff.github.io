from __future__ import annotations

import json
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import parse_qs, quote, urlparse

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from crawl.lib.http import HttpClient, decode_response
from crawl.lib.output import data_path
from crawl.lib.runner import run_guarded

NAME = "xianyu"
OUTPUT = "welfare/xianyu.json"
ITEM_SELECTOR = 'a[class*="feeds-item-wrap--"][href*="/item?"]'
TITLE_SELECTOR = '[class*="row1-wrap-title--"]'
PRICE_SELECTOR = '[class*="row3-wrap-price--"]'
LOGIN_LIMIT = re.compile(r"登录后|请先登录|登录查看更多|扫码登录|被挤爆啦")
SEARCH_TARGETS = (
    (
        "membership-115",
        "115 网盘会员",
        "115网盘会员",
        re.compile(r"(?:115.{0,10}(?:会员|充值|年卡|月卡))|(?:(?:会员|充值|年卡|月卡).{0,10}115)", re.I),
    ),
    (
        "membership-xunlei",
        "迅雷会员",
        "迅雷会员",
        re.compile(r"(?:迅雷.{0,10}(?:会员|充值|年卡|月卡))|(?:(?:会员|充值|年卡|月卡).{0,10}迅雷)", re.I),
    ),
    (
        "qq-reading",
        "QQ 阅读充值",
        "QQ阅读充值优惠",
        re.compile(r"(?:QQ阅读|qq阅读).{0,12}(?:充值|书币|阅点|会员|优惠)|(?:充值|书币|阅点|会员|优惠).{0,12}(?:QQ阅读|qq阅读)", re.I),
    ),
)
TARGET_IDS = {target[0] for target in SEARCH_TARGETS}

_collection_note = ""


def search_url(query: str) -> str:
    return f"https://www.goofish.com/search?q={quote(query)}"


def preflight_public_pages() -> None:
    client = HttpClient(
        allowed_hostnames=["www.goofish.com"],
        max_bytes=500_000,
        retries=1,
        timeout=(10, 25),
    )
    for url in (search_url(target[2]) for target in SEARCH_TARGETS):
        response = client.get(url, expected_content_types=["text/html"])
        html = decode_response(response)
        if "__ICE_APP_CONTEXT__" not in html:
            raise RuntimeError("Xianyu public page no longer exposes the expected application shell")


def normalized_item_url(raw_url: str) -> str:
    parsed = urlparse(raw_url)
    if parsed.scheme != "https" or parsed.hostname != "www.goofish.com" or parsed.path != "/item":
        return ""
    item_id = (parse_qs(parsed.query).get("id") or [""])[0]
    if not item_id.isdigit():
        return ""
    return f"https://www.goofish.com/item?id={item_id}"


def wait_for_cards(driver: webdriver.Chrome, timeout: float = 12.0) -> list[WebElement]:
    deadline = time.monotonic() + timeout
    cards: list[WebElement] = []
    while time.monotonic() < deadline:
        cards = driver.find_elements(By.CSS_SELECTOR, ITEM_SELECTOR)
        if cards:
            return cards
        time.sleep(0.5)
    return cards


def read_card(card: WebElement) -> dict[str, str] | None:
    try:
        title = (card.find_element(By.CSS_SELECTOR, TITLE_SELECTOR).get_attribute("textContent") or "").strip()
        price = (card.find_element(By.CSS_SELECTOR, PRICE_SELECTOR).get_attribute("textContent") or "").strip()
        link = normalized_item_url(card.get_attribute("href") or "")
    except Exception:
        return None
    if not title or not price or not link or re.search(r"求购|回收", title):
        return None
    image_url = ""
    images = card.find_elements(By.CSS_SELECTOR, "img")
    if images:
        candidate = (images[0].get_attribute("src") or "").strip()
        if candidate.startswith("https://"):
            image_url = candidate
    return {"title": title[:180], "price": price[:40], "link": link, "img_src": image_url}


def page_cards(driver: webdriver.Chrome, url: str) -> tuple[list[dict[str, str]], bool]:
    driver.get(url)
    cards = [item for card in wait_for_cards(driver) if (item := read_card(card))]
    body_text = driver.find_element(By.TAG_NAME, "body").get_attribute("textContent") or ""
    return cards, bool(LOGIN_LIMIT.search(body_text))


def previous_items() -> dict[str, dict[str, object]]:
    path = data_path(OUTPUT)
    try:
        items = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return {}
    if not isinstance(items, list):
        return {}
    return {
        str(item["link"]): item
        for item in items
        if isinstance(item, dict)
        and item.get("website") == NAME
        and item.get("queryId") in TARGET_IDS
        and isinstance(item.get("link"), str)
    }


def build_item(
    card: dict[str, str],
    *,
    query_id: str,
    query_label: str,
    collected_at: datetime,
    previous: dict[str, dict[str, object]],
) -> dict[str, object]:
    earlier = previous.get(card["link"], {})
    timestamp = earlier.get("timestamp")
    formatted_time = earlier.get("time")
    if not isinstance(timestamp, (int, float)) or timestamp <= 0 or not isinstance(formatted_time, str):
        timestamp = int(collected_at.timestamp() * 1000)
        formatted_time = collected_at.strftime("%Y-%m-%d %H:%M:%S")
    return {
        "link": card["link"],
        "title": card["title"],
        "img_src": card["img_src"],
        "time": formatted_time,
        "timestamp": timestamp,
        "timestampType": "collected",
        "website": NAME,
        "queryId": query_id,
        "queryLabel": query_label,
        "price": card["price"],
    }


def collect() -> list[dict[str, object]]:
    global _collection_note
    _collection_note = ""
    preflight_public_pages()
    previous = previous_items()
    collected_at = datetime.now().astimezone()
    options = Options()
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1440,1200")
    options.add_argument("--lang=zh-CN")
    if sys.platform == "win32":
        options.add_argument("--window-position=-32000,-32000")
    driver = None
    items: list[dict[str, object]] = []
    limited_targets: list[str] = []
    try:
        driver = webdriver.Chrome(options=options)
        driver.set_page_load_timeout(35)
        for query_id, query_label, query, pattern in SEARCH_TARGETS:
            cards, login_limited = page_cards(driver, search_url(query))
            matches = [card for card in cards if pattern.search(card["title"])][:10]
            if not matches and login_limited:
                limited_targets.append(query_label)
                items.extend(
                    item
                    for item in previous.values()
                    if item.get("queryId") == query_id
                )
                continue
            items.extend(
                build_item(
                    card,
                    query_id=query_id,
                    query_label=query_label,
                    collected_at=collected_at,
                    previous=previous,
                )
                for card in matches
            )
    finally:
        if driver is not None:
            driver.quit()

    deduplicated = {str(item["link"]): item for item in items}
    result = sorted(deduplicated.values(), key=lambda item: int(item["timestamp"]), reverse=True)
    if not result:
        if limited_targets:
            _collection_note = "targeted Xianyu searches require login; no matching retained listings"
            raise RuntimeError("Xianyu targeted public searches currently require login")
        _collection_note = "targeted Xianyu searches returned no matching listings"
        raise RuntimeError("Xianyu targeted searches returned no matching listings")
    _collection_note = (
        "some targeted Xianyu searches require login; accessible results refreshed"
        if limited_targets
        else ""
    )
    return result


def main() -> int:
    result = run_guarded(
        collect,
        name=NAME,
        output=OUTPUT,
        kind="welfare",
        min_items=1,
        unique_by="link",
        optional=True,
    )
    payload = result.to_dict()
    if _collection_note:
        payload["reason"] = _collection_note
    print(json.dumps(payload, ensure_ascii=False))
    return 0 if result.is_usable else 1


if __name__ == "__main__":
    raise SystemExit(main())
