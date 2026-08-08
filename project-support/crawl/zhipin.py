from __future__ import annotations

import json
import re
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin, urlparse

import pytz
from bs4 import BeautifulSoup

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from crawl.lib.http import HttpClient, decode_response
from crawl.lib.runner import run_guarded

NAME = "zhipin"
OUTPUT = "zhipin.json"
HOSTNAME = "www.zhipin.com"
BEIJING = pytz.timezone("Asia/Shanghai")
PUBLIC_CITY_PAGES = (
    "beijing",
    "shanghai",
    "tianjin",
    "xian",
    "suzhou",
    "wuhan",
    "nanjing",
    "zhengzhou",
    "qingdao",
    "hangzhou",
    "xiamen",
    "changsha",
    "chengdu",
    "guangzhou",
    "shenzhen",
    "hefei",
    "chongqing",
    "jinan",
    "foshan",
    "dongguan",
    "kunming",
    "nanchang",
    "shijiazhuang",
    "ningbo",
    "fuzhou",
)
ROLE_MARKERS = (
    "前端开发",
    "web前端",
    "web开发",
    "react",
    "vue",
    "javascript",
    "typescript",
    "android",
    "ios开发",
    "鸿蒙开发",
    "小程序开发",
    "客户端开发",
    "flutter",
    "electron",
    "全栈",
)
SKILL_MARKERS = (
    ("前端开发", "前端开发"),
    ("web", "Web"),
    ("react", "React"),
    ("vue", "Vue"),
    ("javascript", "JavaScript"),
    ("typescript", "TypeScript"),
    ("android", "Android"),
    ("ios", "iOS"),
    ("鸿蒙", "鸿蒙"),
    ("小程序", "小程序"),
    ("flutter", "Flutter"),
    ("electron", "Electron"),
    ("全栈", "全栈"),
)
JOB_PATH = re.compile(r"^/job_detail/(?!l)[A-Za-z0-9_~-]+\.html$")
CITY_PATH = re.compile(r"^/[a-z]+/$")


def parse_updated_at(soup: BeautifulSoup) -> datetime:
    for element in soup.select('script[type="application/ld+json"]'):
        try:
            payload = json.loads(element.get_text())
        except (TypeError, ValueError):
            continue
        values = payload if isinstance(payload, list) else [payload]
        for value in values:
            if not isinstance(value, dict):
                continue
            raw = value.get("upDate") or value.get("dateModified")
            if not isinstance(raw, str) or not raw.strip():
                continue
            parsed = datetime.fromisoformat(raw.strip().replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                return BEIJING.localize(parsed)
            return parsed.astimezone(BEIJING)
    raise ValueError("Boss public page has no update timestamp")


def _text(element: object, selector: str) -> str:
    found = element.select_one(selector)
    return found.get_text(" ", strip=True) if found else ""


def _company_container(link: object) -> object:
    company_jobs = link.find_parent("ul", class_="company-job-list")
    if company_jobs is not None and company_jobs.parent is not None:
        return company_jobs.parent
    item = link.find_parent("li")
    return item if item is not None else link


def parse_public_page(html: str, *, source_url: str) -> list[dict[str, object]]:
    parsed_source = urlparse(source_url)
    if (
        parsed_source.scheme != "https"
        or parsed_source.hostname != HOSTNAME
        or parsed_source.username
        or parsed_source.password
        or parsed_source.query
        or parsed_source.fragment
        or not CITY_PATH.fullmatch(parsed_source.path)
    ):
        raise ValueError("Boss source page URL is not an allowed public city page")

    soup = BeautifulSoup(html, "html.parser")
    updated_at = parse_updated_at(soup)
    items: list[dict[str, object]] = []
    for link in soup.select('a.job-info[href*="/job_detail/"]'):
        title = _text(link, ".name")
        normalized_title = title.lower()
        if not title or not any(marker in normalized_title for marker in ROLE_MARKERS):
            continue

        detail_url = urljoin(source_url, str(link.get("href") or ""))
        parsed_detail = urlparse(detail_url)
        if (
            parsed_detail.scheme != "https"
            or parsed_detail.hostname != HOSTNAME
            or parsed_detail.username
            or parsed_detail.password
            or not JOB_PATH.fullmatch(parsed_detail.path)
        ):
            continue
        detail_url = parsed_detail._replace(query="", fragment="").geturl()

        company = _company_container(link)
        brand_name = _text(company, ".company-info h3") or _text(company, ".user-info .name")
        if not brand_name:
            continue
        company_info = _text(company, ".company-info p") or _text(
            company, ".sub-li-bottom-commany-info"
        )
        logo = company.select_one(".company-img img") or company.select_one(".user-info img")
        logo_url = ""
        if logo is not None:
            logo_url = str(logo.get("data-src") or logo.get("src") or "").strip()
            parsed_logo = urlparse(logo_url)
            if parsed_logo.scheme != "https" or parsed_logo.hostname != "img.bosszhipin.com":
                logo_url = ""

        attributes = [
            element.get_text(" ", strip=True)
            for element in link.select(".job-text span")
            if element.get_text(" ", strip=True)
        ]
        salary = _text(link, ".salary") or "薪资以 Boss 职位页为准"
        skills = [label for marker, label in SKILL_MARKERS if marker in normalized_title]
        items.append(
            {
                "jobNum": 0,
                "brandLogo": logo_url,
                "brandName": brand_name,
                "bossTitle": title,
                "brandIndustry": company_info or "企业信息以 Boss 职位页为准",
                "salaryDesc": salary,
                "skills": skills or ["前端工程"],
                "job_detail": detail_url,
                "jobDesc": " · ".join(attributes),
                "time": updated_at.strftime("%Y-%m-%d %H:%M:%S"),
                "timestamp": int(updated_at.timestamp() * 1000),
                "website": "zhipin",
                "sourcePage": parsed_source.path,
            }
        )
    return items


def collect() -> list[dict[str, object]]:
    client = HttpClient(
        allowed_hostnames=[HOSTNAME],
        max_bytes=1_000_000,
        retries=1,
        timeout=(5, 20),
    )
    items: list[dict[str, object]] = []
    for city in PUBLIC_CITY_PAGES:
        source_url = f"https://{HOSTNAME}/{city}/"
        response = client.get(source_url, headers={"Accept": "text/html"})
        items.extend(parse_public_page(decode_response(response), source_url=source_url))

    unique = {str(item["job_detail"]): item for item in items}
    ordered = sorted(
        unique.values(),
        key=lambda item: (-int(item["timestamp"]), str(item["job_detail"])),
    )
    for index, item in enumerate(ordered, start=1):
        item["jobNum"] = index
    return ordered


def main() -> int:
    result = run_guarded(
        collect,
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
