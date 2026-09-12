"""Read a public feed response produced by Chrome, without synthesizing signatures."""
from __future__ import annotations

import base64
import json
import time
from urllib.parse import parse_qs, urlparse

from selenium import webdriver
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium.webdriver.chrome.options import Options


def open_browser():
    options = Options()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1440,1200")
    options.page_load_strategy = "eager"
    options.set_capability("goog:loggingPrefs", {"performance": "ALL"})
    driver = webdriver.Chrome(options=options)
    driver.set_page_load_timeout(25)
    driver.execute_cdp_cmd("Network.enable", {"maxTotalBufferSize": 20_000_000})
    return driver


def read_feed(driver, *, page_url, api_host, api_path, cookie="", timeout=45, query_match=None):
    # Apply only explicitly configured cookies to this temporary source browser.
    if cookie:
        for part in cookie.split(";"):
            name, separator, value = part.strip().partition("=")
            if name and separator:
                driver.execute_cdp_cmd("Network.setCookie", {
                    "name": name, "value": value, "url": page_url, "secure": True,
                    "domain": "." + ".".join(urlparse(page_url).hostname.split(".")[-2:]),
                    "path": "/",
                })
    driver.get_log("performance")
    started = time.monotonic()
    try:
        driver.get(page_url)
    except TimeoutException:
        pass  # Long-lived page resources do not imply that the feed failed.
    pending = set()
    while time.monotonic() - started < timeout:
        for entry in driver.get_log("performance"):
            message = json.loads(entry["message"])["message"]
            params = message.get("params", {})
            if message["method"] == "Network.responseReceived":
                url = urlparse(params["response"]["url"])
                query = parse_qs(url.query)
                if (url.hostname == api_host and url.path == api_path
                        and all(query.get(key) == [value] for key, value in (query_match or {}).items())):
                    pending.add(params["requestId"])
        for request_id in list(pending):
            try:
                response = driver.execute_cdp_cmd("Network.getResponseBody", {"requestId": request_id})
                body = response["body"]
                if response.get("base64Encoded"):
                    body = base64.b64decode(body).decode("utf-8")
                payload = json.loads(body)
                pending.discard(request_id)
                if isinstance(payload, dict):
                    if payload.get("status_code") == 0 and payload.get("aweme_list"):
                        return payload
                    if payload.get("code") == 0 and (payload.get("data") or {}).get("items"):
                        return payload
            except (WebDriverException, ValueError):
                continue
        time.sleep(0.25)
    raise TimeoutError("Public source feed was not available before deadline")
