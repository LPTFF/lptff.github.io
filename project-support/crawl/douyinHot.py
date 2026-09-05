from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import quote, urlparse

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from crawl.lib.http import looks_like_challenge
from crawl.lib.runner import run_guarded

NAME = "douyinHot"
OUTPUT = "douyinHot.json"
URL = "https://www.douyin.com/hot"
HOT_API_PATH = "/aweme/v1/web/hot/search/list/"


def topic_url(sentence_id: object, word: str) -> str:
    return f"https://www.douyin.com/hot/{sentence_id}/{quote(word, safe='')}"


def parse_response(
    payload: object,
    collected_at: datetime | None = None,
) -> list[dict[str, object]]:
    data = payload.get("data") if isinstance(payload, dict) else None
    word_list = data.get("word_list") if isinstance(data, dict) else None
    if not isinstance(word_list, list):
        raise ValueError("Douyin hot response has no word_list")

    collection_time = collected_at or datetime.now().astimezone()
    collection_timestamp = int(collection_time.timestamp())
    items: list[dict[str, object]] = []
    for entry in word_list:
        if not isinstance(entry, dict):
            continue
        word = str(entry.get("word") or "").strip()
        sentence_id = str(entry.get("sentence_id") or "").strip()
        if not word or not sentence_id:
            continue
        try:
            event_timestamp = int(entry.get("event_time") or collection_timestamp)
            hot_value = int(entry.get("hot_value") or 0)
        except (TypeError, ValueError):
            continue
        try:
            rank = int(entry["position"]) if entry.get("position") is not None else None
        except (TypeError, ValueError):
            rank = None
        heat = f" · 热度 {hot_value:,}" if hot_value > 0 else ""
        description = f"抖音热榜第 {rank} 位{heat}" if rank else f"抖音热榜置顶话题{heat}"
        item: dict[str, object] = {
            "url": topic_url(sentence_id, word),
            "desc": description,
            "time": datetime.fromtimestamp(event_timestamp).strftime("%Y-%m-%d %H:%M:%S"),
            "timestamp": event_timestamp * 1000,
            "hotValue": hot_value,
            "website": NAME,
            "title": word,
        }
        if rank:
            item["rank"] = rank
        items.append(item)
    if not items:
        raise ValueError("Douyin hot response contains no usable topics")
    return items


def parse_page(driver: webdriver.Chrome) -> list[dict[str, object]]:
    collection_time = datetime.now().astimezone()
    timestamp = int(collection_time.timestamp() * 1000)
    items: list[dict[str, object]] = []
    seen: set[str] = set()
    for anchor in driver.find_elements(By.CSS_SELECTOR, 'a[href*="/hot/"]'):
        href = (anchor.get_attribute("href") or "").split("?", 1)[0]
        parsed = urlparse(href)
        parts = [part for part in parsed.path.split("/") if part]
        if parsed.hostname != "www.douyin.com" or len(parts) < 3 or parts[0] != "hot":
            continue
        try:
            title = anchor.find_element(By.CSS_SELECTOR, "h3").text.strip()
        except Exception:
            continue
        if not title or href in seen:
            continue
        seen.add(href)
        rank = len(items) + 1
        items.append(
            {
                "url": href,
                "desc": f"抖音热榜第 {rank} 位 · 公开页面降级采集",
                "time": collection_time.strftime("%Y-%m-%d %H:%M:%S"),
                "timestamp": timestamp,
                "rank": rank,
                "hotValue": 0,
                "website": NAME,
                "title": title,
            }
        )
    if not items:
        raise ValueError("Douyin hot page contains no usable topics")
    return items


def collect() -> list[dict[str, object]]:
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1440,1200")
    options.add_argument("--lang=zh-CN")
    options.page_load_strategy = "eager"
    options.set_capability("goog:loggingPrefs", {"performance": "ALL"})

    driver = webdriver.Chrome(options=options)
    try:
        driver.set_page_load_timeout(35)
        driver.execute_cdp_cmd("Network.enable", {})
        driver.get(URL)
        if looks_like_challenge(driver.page_source):
            raise RuntimeError("Douyin returned a login or challenge page")
        WebDriverWait(driver, 25).until(
            lambda current: len(current.find_elements(By.CSS_SELECTOR, 'a[href*="/hot/"] h3')) >= 5
        )

        for record in driver.get_log("performance"):
            message = json.loads(record["message"])["message"]
            if message.get("method") != "Network.responseReceived":
                continue
            response = message.get("params", {}).get("response", {})
            response_url = str(response.get("url") or "")
            if HOT_API_PATH not in response_url or int(response.get("status") or 0) != 200:
                continue
            body = driver.execute_cdp_cmd(
                "Network.getResponseBody",
                {"requestId": message["params"]["requestId"]},
            )
            return parse_response(json.loads(body["body"]))
        return parse_page(driver)
    finally:
        driver.quit()


def main() -> int:
    result = run_guarded(
        collect,
        name=NAME,
        output=OUTPUT,
        kind="article",
        min_items=5,
        unique_by="url",
        optional=True,
    )
    print(json.dumps(result.to_dict(), ensure_ascii=False))
    return 0 if result.is_usable else 1


if __name__ == "__main__":
    raise SystemExit(main())
