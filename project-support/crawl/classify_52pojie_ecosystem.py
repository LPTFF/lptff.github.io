from __future__ import annotations

import argparse
from collections import Counter
import json
import os
import re
import time
from datetime import UTC, datetime
from pathlib import Path

import requests

if __package__ in (None, ""):
    import sys

    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from crawl.lib.gemini_tracker import GeminiTracker
from crawl.lib.output import DATA_ROOT, write_json_atomically
from crawl.bilibiliData import items_for_tab
from crawl.lib.runner import failure_reason
from crawl.lib.status import report_result
from crawl.sendNotify import notify_ai_results

DEFAULT_MODEL = "gemini-3.5-flash-lite"
REPOSITORY_ROOT = DATA_ROOT.parents[1]
# Keep the existing output and status identifier for deployed consumers and alerts.
SOURCE_PATHS = (DATA_ROOT / "52pojie.json", DATA_ROOT / "kanxue.json")
OUTPUT_PATH = DATA_ROOT / "52pojie-ecosystem.json"
CATEGORIES = (
    "会员与授权绕过",
    "广告与功能限制",
    "移动安全与逆向",
    "加固脱壳与反调试",
    "抓包与协议分析",
    "游戏与作弊生态",
    "工具链与入门",
    "隐私后门与恶意行为",
    "车机与嵌入式系统",
    "AI辅助逆向",
    "其他安全生态",
)
RISK_TYPES = ("normal", "dual_use", "gray_abuse")

# Share analysis prompts and output fields with the local Chrome extension.
ANALYSIS_CONTRACT = json.loads(
    (Path(__file__).resolve().parents[1] / "extension/lptff-investment-assistant/content-analysis.json").read_text(encoding="utf-8")
)["pojie"]
SYSTEM_INSTRUCTION = ANALYSIS_CONTRACT["system"]
RESPONSE_SCHEMA = ANALYSIS_CONTRACT["schema"]


def load_source() -> list[dict[str, object]]:
    items = items_for_tab("pojie")
    for path in SOURCE_PATHS:
        batch = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(batch, list) or not batch:
            raise ValueError("security community source must be a non-empty array")
        if any(not isinstance(item, dict) or not valid_source_url(item.get("url")) or not item.get("title") for item in batch):
            raise ValueError("security community source contains an invalid item")
        items.extend(batch)
    if len({item["url"] for item in items}) != len(items):
        raise ValueError("security community source contains duplicate URLs")
    return items


def valid_source_url(url: object) -> bool:
    return isinstance(url, str) and bool(re.fullmatch(
        r"https://(?:www\.52pojie\.cn/thread-\d+-1-1\.html|bbs\.kanxue\.com/thread-\d+\.htm|www\.bilibili\.com/video/BV[0-9A-Za-z]+/?|t\.bilibili\.com/\d+)", url
    ))


def validate_output(value: object) -> None:
    if not isinstance(value, dict) or value.get("version") != 1:
        raise ValueError("ecosystem output has an invalid version")
    items = value.get("items")
    if not isinstance(items, list):
        raise ValueError("ecosystem output has no items array")
    seen: set[str] = set()
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            raise ValueError(f"ecosystem item {index} must be an object")
        url = item.get("url")
        if not valid_source_url(url) or url in seen:
            raise ValueError(f"ecosystem item {index} has an invalid or duplicate URL")
        seen.add(url)
        if item.get("category") not in CATEGORIES or item.get("riskType") not in RISK_TYPES:
            raise ValueError(f"ecosystem item {index} has an invalid category")
        for field in ("ecosystemValue", "technicalDepth", "trendNovelty"):
            score = item.get(field)
            if not isinstance(score, int) or isinstance(score, bool) or not 0 <= score <= 100:
                raise ValueError(f"ecosystem item {index} has an invalid {field}")
        for field in ("summary", "evolutionNote"):
            if not isinstance(item.get(field), str):
                raise ValueError(f"ecosystem item {index} has an invalid {field}")
        if not item["summary"].strip():
            raise ValueError(f"ecosystem item {index} has an empty summary")
        if item.get("duplicateGroup") is not None and not isinstance(item["duplicateGroup"], str):
            raise ValueError(f"ecosystem item {index} has an invalid duplicate group")
        confidence = item.get("confidence")
        if not isinstance(confidence, (int, float)) or isinstance(confidence, bool) or not 0 <= confidence <= 1:
            raise ValueError(f"ecosystem item {index} has an invalid confidence")


def request_analysis(
    source: list[dict[str, object]],
    *,
    api_key: str,
    model: str,
    timeout: float,
    tracker: GeminiTracker | None = None,
) -> list[dict[str, object]]:
    inputs = [
        {
            "id": str(index),
            "title": str(item["title"])[:240],
            "time": str(item.get("time") or ""),
            "source": str(item.get("website") or ""),
            "timeKind": str(item.get("timeKind") or "published"),
        }
        for index, item in enumerate(source)
    ]
    payload = {
        "systemInstruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": "请把这些帖子作为同一批次分析，识别主题聚类和版本演化：\n"
                        + json.dumps(inputs, ensure_ascii=False, separators=(",", ":"))
                    }
                ],
            }
        ],
        "generationConfig": {
            "temperature": 0,
            "responseMimeType": "application/json",
            "responseJsonSchema": RESPONSE_SCHEMA,
        },
    }
    payload_bytes = len(json.dumps(payload, ensure_ascii=False).encode("utf-8"))
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    last_error: Exception | None = None
    for attempt in range(3):
        started = time.monotonic()
        if tracker:
            started = tracker.log_batch_start(
                1, 1, len(source), attempt=attempt + 1, max_attempts=3, payload_bytes=payload_bytes
            )
        try:
            response = requests.post(
                endpoint,
                headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
                json=payload,
                timeout=timeout,
            )
            duration = time.monotonic() - started
            if response.status_code == 429 or response.status_code >= 500:
                raise RuntimeError(f"Gemini temporarily unavailable (HTTP {response.status_code})")
            if not response.ok:
                raise RuntimeError(f"Gemini request failed (HTTP {response.status_code})")
            body = response.json()
            text = body["candidates"][0]["content"]["parts"][0]["text"]
            result = json.loads(text)
            analyses = result.get("results") if isinstance(result, dict) else None
            if not isinstance(analyses, list):
                raise ValueError("Gemini response has no results array")
            returned_ids = [item.get("id") for item in analyses if isinstance(item, dict)]
            expected_ids = {str(index) for index in range(len(source))}
            if len(returned_ids) != len(source) or set(returned_ids) != expected_ids:
                raise ValueError("Gemini response ids do not match the input")
            if len(returned_ids) != len(set(returned_ids)):
                raise ValueError("Gemini response contains duplicate ids")
            if tracker:
                tracker.log_batch_success(
                    1,
                    1,
                    len(source),
                    duration,
                    response_body=body,
                    status_code=response.status_code,
                    attempts=attempt + 1,
                    extra_info=f"有效解析条目: {len(analyses)}/{len(source)}",
                )
                for item in analyses:
                    tracker.record_item_result(
                        category=str(item.get("category") or ""),
                        confidence=float(item.get("confidence") or 0.95),
                    )
            by_id = {str(item["id"]): item for item in analyses}
            return [
                {**{k: v for k, v in by_id[str(index)].items() if k in RESPONSE_SCHEMA["properties"]["results"]["items"]["properties"] and k != "id"}, "url": source[index]["url"]}
                for index in range(len(source))
            ]
        except (KeyError, IndexError, TypeError, ValueError, requests.RequestException, RuntimeError) as error:
            last_error = error
            delay = 2**attempt
            if tracker and attempt < 2:
                tracker.log_batch_retry(1, 1, attempt=attempt + 1, max_attempts=3, error=error, delay=delay)
            if attempt < 2:
                time.sleep(delay)
    if tracker:
        tracker.record_failure()
    raise RuntimeError(f"Gemini ecosystem analysis failed after 3 attempts: {last_error}") from last_error


def existing_output_is_valid() -> bool:
    try:
        output = json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
        validate_output(output)
        return bool(output["items"])
    except (OSError, UnicodeDecodeError, json.JSONDecodeError, ValueError):
        return False


def load_api_key() -> str:
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if api_key:
        return api_key
    local_env = REPOSITORY_ROOT / ".env.local"
    try:
        for raw_line in local_env.read_text(encoding="utf-8").splitlines():
            key, separator, value = raw_line.partition("=")
            if separator and key.strip() == "GEMINI_API_KEY":
                return value.strip().strip('"').strip("'")
    except OSError:
        pass
    return ""


def main() -> int:
    parser = argparse.ArgumentParser(description="Analyze 52pojie and Kanxue as a security ecosystem radar")
    parser.add_argument("--model", default=os.environ.get("GEMINI_MODEL", DEFAULT_MODEL))
    parser.add_argument("--timeout", type=float, default=150.0)
    parser.add_argument("--summary", type=Path, help="Write this run's status for a combined AI alert")
    args = parser.parse_args()
    api_key = load_api_key()
    if not api_key:
        result = {"name": "52pojie-ecosystem", "state": "preserved" if existing_output_is_valid() else "skipped", "reason": "GEMINI_API_KEY is not configured"}
        report_result(result, args.summary)
        if args.summary is None:
            notify_ai_results([result])
        return 0

    tracker: GeminiTracker | None = None
    try:
        source = load_source()
        tracker = GeminiTracker("52pojie-ecosystem", model=args.model, total_items=len(source))
        tracker.log_start(expected_batches=1)
        analyses = request_analysis(source, api_key=api_key, model=args.model, timeout=args.timeout, tracker=tracker)
        output = {
            "version": 1,
            "generatedAt": datetime.now(UTC).isoformat(),
            "model": args.model,
            "items": analyses,
        }
        validate_output(output)
        write_json_atomically(OUTPUT_PATH, output, validate=validate_output)

        risk_counts = dict(Counter(str(item.get("riskType") or "normal") for item in analyses))
        dup_groups = len({str(item.get("duplicateGroup")) for item in analyses if item.get("duplicateGroup")})
        tracker.record_custom_metric("安全风险分布", risk_counts)
        tracker.record_custom_metric("演化重复组数", dup_groups)
        tracker.print_summary()

        report_result({
            "name": "52pojie-ecosystem",
            "state": "success",
            "model": args.model,
            "itemCount": len(analyses),
            "telemetry": tracker.to_dict(),
        }, args.summary)
    except Exception as error:
        if tracker:
            tracker.print_summary(title="Gemini 追踪监控汇总 (执行异常)")
        state = "preserved" if existing_output_is_valid() else "skipped"
        result = {
            "name": "52pojie-ecosystem",
            "state": state,
            "reason": failure_reason(error),
            "telemetry": tracker.to_dict() if tracker else None,
        }
        report_result(result, args.summary)
        if args.summary is None:
            notify_ai_results([result])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
