from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlparse

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.crawl.lib.runner import run_guarded

NAME = "zhipin"
OUTPUT = "zhipin.json"
BASE_URL = "https://www.zhipin.com/web/geek/job"
QUERY = {
    "city": "101020100",
    "experience": "104,105",
    "degree": "204,203",
    "position": "100901,100208",
    "jobType": "1901",
    "salary": "406",
}


def chrome_options() -> Options:
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1440,1200")
    options.add_argument("user-agent=lptff.github.io collector/1.0")
    return options


def _text(element: object, selector: str) -> str:
    try:
        return element.find_element(By.CSS_SELECTOR, selector).text.strip()
    except Exception:
        return ""


def is_challenge_page(current_url: str, title: str, source: str) -> bool:
    parsed = urlparse(current_url)
    query = parse_qs(parsed.query)
    redirected_from = " ".join(query.get("fromUrl", []))
    normalized = f"{title}\n{source[:200_000]}".lower()
    return (
        parsed.path.startswith("/web/user")
        or "_security_check" in current_url
        or "_security_check" in redirected_from
        or any(
            marker in normalized
            for marker in (
                "captcha",
                "security check",
                "安全验证",
                "访问验证",
                "验证码登录/注册",
                "app扫码登录",
            )
        )
    )


def parse_cards(driver: webdriver.Chrome, page: int) -> list[dict[str, object]]:
    jobs: list[dict[str, object]] = []
    for index, card in enumerate(driver.find_elements(By.CSS_SELECTOR, ".job-card-wrapper")):
        try:
            link = card.find_element(By.CSS_SELECTOR, ".job-card-left").get_attribute("href")
            logo = card.find_element(By.CSS_SELECTOR, ".company-logo img").get_attribute("src")
            skills = [item.text.strip() for item in card.find_elements(By.CSS_SELECTOR, ".job-card-footer li")]
        except Exception:
            continue
        title = _text(card, ".info-public em")
        brand = _text(card, ".company-name")
        salary = _text(card, ".job-info.clearfix span")
        if not title or not brand or not salary or not link:
            continue
        jobs.append(
            {
                "jobNum": page * 30 + index + 1,
                "brandLogo": logo or "",
                "brandName": brand,
                "bossTitle": title,
                "brandIndustry": _text(card, ".company-tag-list li"),
                "salaryDesc": salary,
                "skills": skills,
                "job_detail": link,
                "jobDesc": "",
            }
        )
    return jobs


def collect(*, max_pages: int = 3, deadline_seconds: int = 150) -> list[dict[str, object]]:
    driver = None
    started = time.monotonic()
    jobs: list[dict[str, object]] = []
    signatures: set[tuple[str, ...]] = set()
    empty_pages = 0
    try:
        driver = webdriver.Chrome(options=chrome_options())
        driver.set_page_load_timeout(30)
        for page in range(1, max_pages + 1):
            if time.monotonic() - started > deadline_seconds:
                raise TimeoutError("Boss collection exceeded its deadline")
            url = f"{BASE_URL}?{urlencode(QUERY | {'page': str(page)})}"
            driver.get(url)
            source = driver.page_source
            if is_challenge_page(driver.current_url, driver.title, source):
                raise RuntimeError("Boss returned a login or challenge page")
            try:
                WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".job-card-wrapper"))
                )
            except Exception:
                if is_challenge_page(driver.current_url, driver.title, driver.page_source):
                    raise RuntimeError("Boss returned a login or challenge page")
                empty_pages += 1
                if empty_pages >= 2:
                    break
                continue
            page_jobs = parse_cards(driver, page - 1)
            signature = tuple(str(job["job_detail"]) for job in page_jobs)
            if not page_jobs:
                empty_pages += 1
                if empty_pages >= 2:
                    break
                continue
            if signature in signatures:
                break
            signatures.add(signature)
            jobs.extend(page_jobs)
    finally:
        if driver is not None:
            driver.quit()
    return jobs


def main() -> int:
    max_pages = max(1, min(int(os.environ.get("ZHIPIN_MAX_PAGES", "3")), 10))
    result = run_guarded(
        lambda: collect(max_pages=max_pages),
        name=NAME,
        output=OUTPUT,
        kind="job",
        min_items=3,
        unique_by="job_detail",
    )
    print(json.dumps(result.to_dict(), ensure_ascii=False))
    return 0 if result.is_usable else 1


if __name__ == "__main__":
    raise SystemExit(main())
