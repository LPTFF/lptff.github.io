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
CITY_NAMES = {
    "beijing": "北京",
    "shanghai": "上海",
    "tianjin": "天津",
    "xian": "西安",
    "suzhou": "苏州",
    "wuhan": "武汉",
    "nanjing": "南京",
    "zhengzhou": "郑州",
    "qingdao": "青岛",
    "hangzhou": "杭州",
    "xiamen": "厦门",
    "changsha": "长沙",
    "chengdu": "成都",
    "guangzhou": "广州",
    "shenzhen": "深圳",
    "hefei": "合肥",
    "chongqing": "重庆",
    "jinan": "济南",
    "foshan": "佛山",
    "dongguan": "东莞",
    "kunming": "昆明",
    "nanchang": "南昌",
    "shijiazhuang": "石家庄",
    "ningbo": "宁波",
    "fuzhou": "福州",
}
ROLE_MARKERS = (
    # 前端与移动/跨端
    "前端",
    "web前端",
    "web开发",
    "react",
    "vue",
    "javascript",
    "typescript",
    "android",
    "ios",
    "鸿蒙",
    "小程序",
    "flutter",
    "electron",
    "客户端",
    # 后端开发与服务端
    "java",
    "golang",
    "go语言",
    "go开发",
    "go工程师",
    "python",
    "c++",
    "c#",
    "后端",
    "服务端",
    "微服务",
    "架构师",
    "云原生",
    # AI、大模型、算法与数据
    "算法",
    "大模型",
    "ai",
    "人工智能",
    "机器学习",
    "深度学习",
    "nlp",
    "计算机视觉",
    "llm",
    "数据开发",
    "大数据",
    # 全栈与研发工程
    "全栈",
    "研发工程师",
    "软件开发",
    "软件工程师",
    "系统工程师",
    "测试开发",
    "devops",
    "sre",
    "运维开发",
    "嵌入式",
)
SKILL_MARKERS = (
    ("前端", "前端开发"),
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
    ("客户端", "客户端"),
    ("全栈", "全栈"),
    ("java", "Java"),
    ("golang", "Go"),
    ("go开发", "Go"),
    ("go工程师", "Go"),
    ("python", "Python"),
    ("c++", "C++"),
    ("c#", "C#"),
    ("后端", "后端开发"),
    ("服务端", "服务端"),
    ("架构", "架构设计"),
    ("云原生", "云原生"),
    ("微服务", "微服务"),
    ("算法", "算法"),
    ("大模型", "大模型"),
    ("ai", "AI"),
    ("人工智能", "AI"),
    ("机器学习", "机器学习"),
    ("深度学习", "深度学习"),
    ("数据开发", "数据开发"),
    ("大数据", "大数据"),
    ("测试开发", "测试开发"),
    ("devops", "DevOps"),
    ("sre", "SRE"),
    ("嵌入式", "嵌入式"),
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
        skills = list(dict.fromkeys(label for marker, label in SKILL_MARKERS if marker in normalized_title))
        items.append(
            {
                "jobNum": 0,
                "brandLogo": logo_url,
                "brandName": brand_name,
                "bossTitle": title,
                "brandIndustry": company_info or "企业信息以 Boss 职位页为准",
                "salaryDesc": salary,
                "skills": skills or ["技术研发"],
                "job_detail": detail_url,
                "jobDesc": " · ".join(attributes),
                "time": updated_at.strftime("%Y-%m-%d %H:%M:%S"),
                "timestamp": int(updated_at.timestamp() * 1000),
                "website": "zhipin",
                "sourcePage": parsed_source.path,
                "cityName": CITY_NAMES.get(parsed_source.path.strip("/"), ""),
                "capturedAt": datetime.now(BEIJING).strftime("%Y-%m-%d %H:%M:%S"),
                "pageUpdatedAt": updated_at.strftime("%Y-%m-%d %H:%M:%S"),
                "jobPostTime": "",
                "sourceStatus": "active",
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
