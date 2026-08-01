from __future__ import annotations

import json
import os
import shutil
import sys
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.crawl.lib.http import HttpClient
from src.crawl.lib.output import data_path
from src.crawl.lib.status import CollectorResult
from src.crawl.lib.validate import ValidationError, validate_items

NAME = "leetCode"
URL = "https://leetcode.cn/graphql/"
PAGE_SIZE = 50
LIST_QUERY = """
query problemsetQuestionList($limit: Int, $skip: Int) {
  problemsetQuestionList(categorySlug: "", limit: $limit, skip: $skip, filters: {}) {
    hasMore total
    questions { acRate difficulty frontendQuestionId paidOnly title titleCn titleSlug }
  }
}
"""
DETAIL_QUERY = """
query questionData($titleSlug: String!) {
  question(titleSlug: $titleSlug) { translatedContent content }
}
"""
DETAIL_FALLBACK = "<p>题目描述暂不可用。</p>"


def _headers() -> dict[str, str]:
    headers = {"Content-Type": "application/json", "Origin": "https://leetcode.cn"}
    cookie = os.environ.get("LEETCODE_COOKIE", "").strip()
    if cookie:
        headers["Cookie"] = cookie
    return headers


def _json(response: object, context: str) -> dict[str, object]:
    try:
        payload = response.json()
    except (json.JSONDecodeError, ValueError) as error:
        raise ValueError(f"LeetCode {context} response is not JSON") from error
    if not isinstance(payload, dict):
        raise ValueError(f"LeetCode {context} response is not an object")
    if payload.get("errors"):
        raise ValueError(f"LeetCode {context} response contains GraphQL errors")
    return payload


def fetch_page(client: HttpClient, skip: int) -> tuple[list[dict[str, object]], bool, int]:
    response = client.post(
        URL,
        headers=_headers(),
        json={
            "operationName": "problemsetQuestionList",
            "query": LIST_QUERY,
            "variables": {"skip": skip, "limit": PAGE_SIZE},
        },
    )
    payload = _json(response, "list")
    container = payload.get("data", {}).get("problemsetQuestionList")
    if not isinstance(container, dict) or not isinstance(container.get("questions"), list):
        raise ValueError("LeetCode list response has no question list")
    return container["questions"], bool(container.get("hasMore")), int(container.get("total") or 0)


def fetch_description(title_slug: str) -> str:
    client = HttpClient(allowed_hostnames=["leetcode.cn"], max_bytes=5_000_000)
    response = client.post(
        URL,
        headers=_headers(),
        json={
            "operationName": "questionData",
            "query": DETAIL_QUERY,
            "variables": {"titleSlug": title_slug},
        },
    )
    question = _json(response, "detail").get("data", {}).get("question")
    if not isinstance(question, dict):
        raise ValueError("LeetCode detail response has no question")
    description = str(question.get("translatedContent") or question.get("content") or "")
    if not description:
        raise ValueError("LeetCode detail response has no usable description")
    return description


def fetch_description_safely(title_slug: str) -> tuple[str, bool]:
    try:
        return fetch_description(title_slug), False
    except Exception:
        return DETAIL_FALLBACK, True


def build_item(index: int, question: dict[str, object], description: str) -> dict[str, object]:
    slug = str(question.get("titleSlug") or "")
    title = str(question.get("titleCn") or question.get("title") or "")
    if not slug or not title or not description:
        raise ValidationError("LeetCode question misses its title, slug, or description")
    rate = float(question.get("acRate") or 0)
    return {
        "problemsName": f" {index}.{title}",
        "hardRate": str(question.get("difficulty") or ""),
        "passRate": f"{rate:.2%}",
        "problemsUrl": f"https://leetcode.cn/problems/{slug}/",
        "solutionsUrl": f"https://leetcode.cn/problems/{slug}/solution",
        "problemsDesc": description,
        "isPlus": bool(question.get("paidOnly")),
    }


def collect_all(*, deadline_seconds: int = 900, workers: int = 8) -> list[dict[str, object]]:
    started = time.monotonic()
    client = HttpClient(allowed_hostnames=["leetcode.cn"], max_bytes=5_000_000)
    questions: list[dict[str, object]] = []
    skip = 0
    expected_total = 0
    while True:
        if time.monotonic() - started > deadline_seconds:
            raise TimeoutError("LeetCode list collection exceeded its deadline")
        page, has_more, total = fetch_page(client, skip)
        if not page:
            raise ValueError("LeetCode returned an empty page before completion")
        questions.extend(page)
        expected_total = max(expected_total, total)
        if not has_more:
            break
        skip += len(page)
    if expected_total and len(questions) != expected_total:
        raise ValidationError("LeetCode list count does not match total")

    descriptions: dict[int, str] = {}
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {
            pool.submit(fetch_description_safely, str(question["titleSlug"])): index
            for index, question in enumerate(questions, start=1)
        }
        fallback_count = 0
        for future in as_completed(futures):
            if time.monotonic() - started > deadline_seconds:
                for pending in futures:
                    pending.cancel()
                raise TimeoutError("LeetCode detail collection exceeded its deadline")
            description, used_fallback = future.result()
            descriptions[futures[future]] = description
            fallback_count += int(used_fallback)
    if fallback_count == len(questions):
        raise ValueError("LeetCode detail source returned no usable descriptions")
    return [
        build_item(index, question, descriptions[index])
        for index, question in enumerate(questions, start=1)
    ]


def normalize_legacy_item(item: object) -> object:
    if not isinstance(item, dict) or item.get("problemsDesc") not in (None, ""):
        return item
    return {**item, "problemsDesc": DETAIL_FALLBACK}


def validate_existing_release(directory: Path) -> int:
    manifest_path = directory / "manifest.json"
    if not manifest_path.is_file():
        chunks = sorted(directory.glob("leetCode_*.json"))
        if not chunks:
            return 0
        try:
            total = 0
            for path in chunks:
                items = [normalize_legacy_item(item) for item in json.loads(path.read_text(encoding="utf-8"))]
                total += len(validate_items(items, kind="leetcode"))
            return total
        except Exception:
            return 0
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        chunks = manifest["chunks"]
        total = 0
        for name in chunks:
            items = [
                normalize_legacy_item(item)
                for item in json.loads((directory / name).read_text(encoding="utf-8"))
            ]
            total += len(validate_items(items, kind="leetcode"))
        return total if total == manifest["total"] else 0
    except Exception:
        return 0


def publish_release(items: list[dict[str, object]], target: Path) -> CollectorResult:
    validate_items(items, kind="leetcode", min_items=1, require_unique="problemsUrl")
    target.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix=".leetcode-", dir=target.parent))
    backup = target.with_name(f".{target.name}.backup")
    try:
        names: list[str] = []
        for index in range(0, len(items), PAGE_SIZE):
            chunk = items[index : index + PAGE_SIZE]
            validate_items(chunk, kind="leetcode")
            name = f"leetCode_{index // PAGE_SIZE + 1}.json"
            (staging / name).write_text(
                json.dumps(chunk, ensure_ascii=False, indent=4) + "\n", encoding="utf-8"
            )
            names.append(name)
        manifest = {"version": 1, "total": len(items), "pageSize": PAGE_SIZE, "chunks": names}
        (staging / "manifest.json").write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        if validate_existing_release(staging) != len(items):
            raise ValidationError("LeetCode staged release is incomplete")
        if backup.exists():
            shutil.rmtree(backup)
        if target.exists():
            os.replace(target, backup)
        try:
            os.replace(staging, target)
        except Exception:
            if backup.exists():
                os.replace(backup, target)
            raise
        if backup.exists():
            shutil.rmtree(backup)
        return CollectorResult(NAME, "success", len(items), str(target))
    finally:
        if staging.exists():
            shutil.rmtree(staging)


def main() -> int:
    target = data_path("leetCode")
    try:
        result = publish_release(collect_all(), target)
    except Exception as error:
        count = validate_existing_release(target)
        result = CollectorResult(
            NAME,
            "preserved" if count else "failed",
            count,
            str(target),
            f"{type(error).__name__}: collector did not publish a complete release",
        )
    print(json.dumps(result.to_dict(), ensure_ascii=False))
    return 0 if result.is_usable else 1


if __name__ == "__main__":
    raise SystemExit(main())
