from __future__ import annotations

import argparse
import json
import os
import re
import time
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

import requests

if __package__ in (None, ""):
    import sys

    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from crawl.lib.gemini_tracker import GeminiTracker
from crawl.bilibiliData import items_for_tab
from crawl.lib.output import DATA_ROOT, write_json_atomically
from crawl.lib.runner import failure_reason
from crawl.lib.status import report_result
from crawl.sendNotify import notify_ai_results

DEFAULT_MODEL = "gemini-3.5-flash-lite"
DEFAULT_BATCH_SIZE = 30
OUTPUT_PATH = DATA_ROOT / "welfare-ecosystem.json"

WELFARE_FILES = (
    "welfare.json",
    "welfare/0818tuan.json",
    "welfare/0818tuanTop.json",
    "welfare/zhuanyes.json",
    "welfare/zhuanyesTop.json",
    "welfare/daydayzhuan.json",
    "welfare/daydayzhuanTop.json",
    "welfare/zhujiceping.json",
    "welfare/keyword-search.json",
    "bilibili.json",
)

# Share analysis prompts and output fields with the local Chrome extension.
ANALYSIS_CONTRACT = json.loads(
    (Path(__file__).resolve().parents[1] / "extension/lptff-investment-assistant/content-analysis.json").read_text(encoding="utf-8")
)["welfare"]
CATEGORIES = tuple(ANALYSIS_CONTRACT["schema"]["properties"]["results"]["items"]["properties"]["category"]["enum"])
SYSTEM_INSTRUCTION = ANALYSIS_CONTRACT["system"]
RESPONSE_SCHEMA = ANALYSIS_CONTRACT["schema"]

# 规则兜底正则
FALLBACK_RULES = (
    ("食品生鲜", re.compile(r"生鲜|蜜薯|水果|牛奶|零食|粮油|大米|鸡蛋|猪肉|牛肉|饮料|饼干")),
    ("美妆个护", re.compile(r"护肤|面霜|护霜|洗面奶|洁面|精华液|面膜|防晒|美妆|口红|洗发|沐浴露|牙膏|神仙水")),
    ("服饰鞋包", re.compile(r"运动鞋|跑鞋|鞋靴|运动服|服饰|箱包|背包|羽绒|安德玛|耐克|阿迪达斯")),
    ("家居日用", re.compile(r"洗衣液|洗衣粉|纸巾|卫生纸|清洁|厨具|锅具|收纳|床品|家电|除螨仪")),
    ("医疗健康", re.compile(r"医用|医疗|药品|维生素|营养保健|黄金搭档")),
    ("电商优惠", re.compile(r"京东plus|plus会员|百亿补贴|跨店|购物津贴|平台通用券|电商促销")),
    (
        "银行优惠",
        re.compile(
            r"银行|信用卡|借记卡|中行|工行|建行|农行|交行|招行|邮储|浦发|广发|光大|兴业|民生|华夏|中信|招商|立减金|云闪付|借记|贷记|掌银|数币|数字人民币"
        ),
    ),
    (
        "话费流量",
        re.compile(r"话费|流量|充值|移动|联通|电信|充值卡|话费券|gb流量|g流量"),
    ),
    (
        "生活外卖",
        re.compile(
            r"美团|饿了么|外卖|闪购|肯德基|麦当劳|星巴克|打车|高德|滴滴|商超|屈臣氏|餐饮|咖啡|茶饮|霸王茶姬|瑞幸|奈雪|加油|电影票|淘票票|买菜|生鲜|超市"
        ),
    ),
    (
        "影音会员",
        re.compile(
            r"腾讯视频|爱奇艺|优酷|芒果|网易云|qq音乐|哔哩哔哩|b站|网盘|夸克|会员|迅雷|115|qq阅读|大会员|vip"
        ),
    ),
    (
        "数码科技",
        re.compile(r"vps|云服务器|域名|主机|服务器|ai|chatgpt|openai|cursor|github|cloudflare"),
    ),
    (
        "抽奖签到",
        re.compile(r"抽奖|转盘|签到|盲盒|打卡|幸运|大转盘|摇一摇|瓜分|红包雨|红包|现金"),
    ),
    (
        "支付立减",
        re.compile(r"微信|支付宝|zfb|wx|财付通|支付|快捷支付|付款码|扫码付|立减|返现|满减|立折"),
    ),
)

BANK_IDENTITY = re.compile(
    r"银行|信用卡|借记卡|中行|工行|建行|农行|交行|招行|邮储|浦发|广发|光大|兴业|民生|华夏|中信|招商|南京|苏州|华瑞微"
)

# 重试参数
_MAX_ATTEMPTS = 5
_BACKOFF_BASE = 10.0
_MIN_BATCH_SIZE = 5


@dataclass(frozen=True)
class WelfareEntry:
    identifier: str
    link: str
    title: str
    summary: str


def _validate_ecosystem_output(value: object) -> None:
    if not isinstance(value, dict) or value.get("version") != 1:
        raise ValueError("welfare ecosystem output has an invalid version")
    items = value.get("items")
    if not isinstance(items, list):
        raise ValueError("welfare ecosystem output has no items array")
    seen_links: set[str] = set()
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            raise ValueError(f"ecosystem item {index} must be an object")
        link = item.get("link")
        if not isinstance(link, str) or not link.strip() or link in seen_links:
            raise ValueError(f"ecosystem item {index} has an invalid or duplicate link")
        seen_links.add(link)
        if item.get("category") not in CATEGORIES:
            raise ValueError(f"ecosystem item {index} has an invalid category")
        for field in ("welfareValue", "difficulty"):
            score = item.get(field)
            if not isinstance(score, int) or isinstance(score, bool) or not 0 <= score <= 100:
                raise ValueError(f"ecosystem item {index} has an invalid {field}")
        if not isinstance(item.get("isBankOffer"), bool):
            raise ValueError(f"ecosystem item {index} has an invalid isBankOffer")
        confidence = item.get("confidence")
        if not isinstance(confidence, (int, float)) or isinstance(confidence, bool) or not 0 <= confidence <= 1:
            raise ValueError(f"ecosystem item {index} has an invalid confidence")


def load_entries() -> list[WelfareEntry]:
    entries: list[WelfareEntry] = []
    seen_links: set[str] = set()
    for relative_path in WELFARE_FILES:
        path = DATA_ROOT / relative_path
        if not path.is_file():
            continue
        try:
            value = items_for_tab("welfare") if relative_path == "bilibili.json" else json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue
        if not isinstance(value, list):
            continue
        for item in value:
            if not isinstance(item, dict):
                continue
            link = str(item.get("link") or item.get("url") or "").strip()
            title = str(item.get("title") or "").strip()
            if not link or not title or link in seen_links:
                continue
            seen_links.add(link)
            summary = str(item.get("summary") or "").strip()
            entries.append(
                WelfareEntry(
                    identifier=str(len(entries)),
                    link=link,
                    title=title,
                    summary=summary[:600],
                )
            )
    return entries


def fallback_classify_entry(entry: WelfareEntry) -> dict[str, object]:
    text = f"{entry.title} {entry.summary}".lower()
    matched_category = "待分类"
    for cat, pattern in FALLBACK_RULES:
        if pattern.search(text):
            matched_category = cat
            break
    if BANK_IDENTITY.search(text):
        matched_category = "银行优惠"

    # 提取辨识标签（避免与 category 重复）
    signals: list[str] = []
    if bool(BANK_IDENTITY.search(text)) and matched_category != "银行优惠":
        signals.append("银行优惠")
    if re.search(r"立减金", text):
        signals.append("立减金")
    elif re.search(r"立减|返现|满减", text):
        signals.append("支付满减")
    if re.search(r"红包|现金", text) and matched_category != "抽奖签到":
        signals.append("现金红包")
    if re.search(r"话费", text) and matched_category != "话费流量":
        signals.append("话费充值")
    if re.search(r"秒到|直接领|无门槛", text):
        signals.append("秒到")
    if re.search(r"抽奖|转盘", text) and matched_category != "抽奖签到":
        signals.append("抽奖")
    if re.search(r"zfb|支付宝", text):
        signals.append("支付宝")
    if re.search(r"微信|wx", text):
        signals.append("微信")

    signals = [s for s in signals if s != matched_category][:4]

    # 计算福利价值分
    welfare_value = 75
    if re.search(r"大毛|秒到|必中|大额|免费|0元", text):
        welfare_value = 88
    elif re.search(r"抽奖|概率|随机", text):
        welfare_value = 65

    # 计算难度门槛
    difficulty = 40
    if re.search(r"秒到|直接领|无门槛", text):
        difficulty = 15
    elif re.search(r"办卡|开户|新户|高额", text):
        difficulty = 75

    is_bank = bool(BANK_IDENTITY.search(text))
    clean_summary = entry.summary if entry.summary else entry.title

    return {
        "link": entry.link,
        "category": matched_category,
        "welfareValue": welfare_value,
        "difficulty": difficulty,
        "signals": signals,
        "isBankOffer": is_bank,
        "summary": clean_summary[:120],
        "confidence": 0.8,
    }


def _request_batch(
    session: requests.Session,
    *,
    api_key: str,
    model: str,
    entries: list[WelfareEntry],
    timeout: float,
    batch_index: int = 1,
    total_batches: int = 1,
    tracker: GeminiTracker | None = None,
) -> list[dict[str, object]]:
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    input_items = [
        {
            "id": entry.identifier,
            "title": entry.title,
            "summary": entry.summary[:400],
        }
        for entry in entries
    ]
    payload = {
        "systemInstruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": "请对以下优惠福利资讯逐条进行标签与价值分析：\n"
                        + json.dumps(input_items, ensure_ascii=False, separators=(",", ":"))
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
    expected_ids = {entry.identifier for entry in entries}
    payload_bytes = len(json.dumps(payload, ensure_ascii=False).encode("utf-8"))
    last_error: Exception | None = None
    timeout_count = 0

    for attempt in range(_MAX_ATTEMPTS):
        started = time.monotonic()
        if tracker:
            started = tracker.log_batch_start(
                batch_index, total_batches, len(entries), attempt=attempt + 1, max_attempts=_MAX_ATTEMPTS, payload_bytes=payload_bytes
            )
        try:
            response = session.post(
                endpoint,
                headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
                json=payload,
                timeout=timeout,
            )
            duration = time.monotonic() - started
            if response.status_code == 429 or response.status_code >= 500:
                raise RuntimeError(f"Gemini temporarily unavailable (HTTP {response.status_code})")
            if not response.ok:
                response.raise_for_status()
            body = response.json()
            text = body["candidates"][0]["content"]["parts"][0]["text"]
            classified = json.loads(text)
            results = classified.get("results") if isinstance(classified, dict) else None
            if not isinstance(results, list):
                raise ValueError("Gemini response has no results array")
            returned_ids = [str(item.get("id")) for item in results if isinstance(item, dict)]
            if len(returned_ids) != len(results) or set(returned_ids) != expected_ids:
                raise ValueError("Gemini response ids do not match the input batch")
            by_id = {str(item["id"]): item for item in results}
            if tracker:
                tracker.log_batch_success(
                    batch_index,
                    total_batches,
                    len(entries),
                    duration,
                    response_body=body,
                    status_code=response.status_code,
                    attempts=attempt + 1,
                    extra_info=f"有效解析条目: {len(results)}/{len(entries)}",
                )
            batch_classified: list[dict[str, object]] = []
            for entry in entries:
                item_ai = by_id[entry.identifier]
                cat = item_ai["category"]
                sigs = [str(s) for s in item_ai.get("signals", []) if s != cat][:4]
                conf = float(item_ai.get("confidence", 0.95))
                if tracker:
                    tracker.record_item_result(category=cat, confidence=conf)
                batch_classified.append(
                    {
                        "link": entry.link,
                        "category": cat,
                        "welfareValue": int(item_ai["welfareValue"]),
                        "difficulty": int(item_ai["difficulty"]),
                        "signals": sigs,
                        "isBankOffer": bool(item_ai.get("isBankOffer", False)),
                        "summary": str(item_ai.get("summary") or entry.title)[:160],
                        "confidence": conf,
                    }
                )
            return batch_classified
        except requests.exceptions.Timeout as error:
            last_error = error
            timeout_count += 1
            if timeout_count >= 2 and len(entries) > _MIN_BATCH_SIZE:
                mid = len(entries) // 2
                if tracker:
                    tracker.log_batch_split(batch_index, total_batches, mid, len(entries) - mid)
                else:
                    print(f"[filter_welfare] 批次超时，对半拆分至 {mid} 条重试…", flush=True)
                left = _request_batch(
                    session,
                    api_key=api_key,
                    model=model,
                    entries=entries[:mid],
                    timeout=timeout,
                    batch_index=batch_index,
                    total_batches=total_batches,
                    tracker=tracker,
                )
                right = _request_batch(
                    session,
                    api_key=api_key,
                    model=model,
                    entries=entries[mid:],
                    timeout=timeout,
                    batch_index=batch_index,
                    total_batches=total_batches,
                    tracker=tracker,
                )
                return left + right
            sleep_secs = _BACKOFF_BASE * (2**attempt)
            if tracker:
                tracker.log_batch_retry(batch_index, total_batches, attempt + 1, _MAX_ATTEMPTS, "请求超时", sleep_secs)
            else:
                print(f"[filter_welfare] 超时（第 {attempt + 1} 次），{sleep_secs:.0f}s 后重试…", flush=True)
            time.sleep(sleep_secs)
        except (KeyError, IndexError, TypeError, ValueError, requests.RequestException, RuntimeError) as error:
            last_error = error
            if isinstance(error, requests.HTTPError) and error.response is not None:
                status = error.response.status_code
                if 400 <= status < 500 and status not in (408, 429):
                    if tracker:
                        tracker.record_failure()
                    raise RuntimeError(f"Gemini unavailable (HTTP {status})") from error
            if attempt < _MAX_ATTEMPTS - 1:
                sleep_secs = _BACKOFF_BASE * (2**attempt)
                if tracker:
                    tracker.log_batch_retry(batch_index, total_batches, attempt + 1, _MAX_ATTEMPTS, failure_reason(error), sleep_secs)
                else:
                    print(
                        f"[filter_welfare] 请求失败（第 {attempt + 1} 次）：{failure_reason(error)}，{sleep_secs:.0f}s 后重试…",
                        flush=True,
                    )
                time.sleep(sleep_secs)
    if tracker:
        tracker.record_failure()
    raise RuntimeError(f"Gemini classification failed after {_MAX_ATTEMPTS} attempts: {last_error}") from last_error


def classify_entries(
    entries: list[WelfareEntry],
    *,
    api_key: str,
    model: str,
    batch_size: int,
    timeout: float,
    session: requests.Session | None = None,
    tracker: GeminiTracker | None = None,
) -> list[dict[str, object]]:
    classified: list[dict[str, object]] = []
    client = session or requests.Session()
    total_batches = (len(entries) + batch_size - 1) // batch_size if entries else 0
    for batch_idx, start in enumerate(range(0, len(entries), batch_size), start=1):
        chunk = entries[start : start + batch_size]
        classified.extend(
            _request_batch(
                client,
                api_key=api_key,
                model=model,
                entries=chunk,
                timeout=timeout,
                batch_index=batch_idx,
                total_batches=total_batches,
                tracker=tracker,
            )
        )
    return classified


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Classify and tag welfare deals using Gemini or rule fallback"
    )
    parser.add_argument("--require-key", action="store_true", help="Fail on a missing key")
    parser.add_argument("--model", default=os.environ.get("GEMINI_MODEL", DEFAULT_MODEL))
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE)
    parser.add_argument("--timeout", type=float, default=120.0)
    parser.add_argument("--summary", type=Path, help="Write this run's status for a combined AI alert")
    args = parser.parse_args()
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        local_env = Path(__file__).resolve().parents[2] / ".env.local"
        if local_env.is_file():
            for line in local_env.read_text(encoding="utf-8").splitlines():
                if line.strip().startswith("GEMINI_API_KEY="):
                    api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    if not api_key and args.require_key:
        raise SystemExit("GEMINI_API_KEY is required for welfare tagging")
    if args.batch_size < 1 or args.batch_size > 100:
        parser.error("--batch-size must be between 1 and 100")

    entries = load_entries()
    ai_items: list[dict[str, object]] | None = None
    fallback_reason = ""
    tracker = GeminiTracker("welfare-filter", model=args.model, total_items=len(entries))
    if entries and api_key:
        tracker.log_start(expected_batches=(len(entries) + args.batch_size - 1) // args.batch_size)

    if entries:
        try:
            if not api_key:
                raise RuntimeError("GEMINI_API_KEY is not configured")
            ai_items = classify_entries(
                entries,
                api_key=api_key,
                model=args.model,
                batch_size=args.batch_size,
                timeout=args.timeout,
                tracker=tracker,
            )
        except RuntimeError as exc:
            fallback_reason = failure_reason(exc)
            warn_msg = f"Gemini 不可用，使用规则提取标签。原因：{fallback_reason}"
            print(f"[filter_welfare] 警告：{warn_msg}", flush=True)

    # 组合输出条目：AI 成功时用 AI 结果；异常或无 Key 时用本地规则兜底
    if ai_items is not None:
        items = ai_items
        bank_offers = sum(1 for item in items if item.get("isBankOffer"))
        avg_val = round(sum(int(item.get("welfareValue") or 0) for item in items) / len(items), 1) if items else 0
        avg_diff = round(sum(int(item.get("difficulty") or 0) for item in items) / len(items), 1) if items else 0
        tracker.record_custom_metric("银行专属活动数", f"{bank_offers} 条")
        tracker.record_custom_metric("平均福利价值分", f"{avg_val} / 100")
        tracker.record_custom_metric("平均参与门槛分", f"{avg_diff} / 100")
        tracker.print_summary()
    else:
        items = [fallback_classify_entry(e) for e in entries]
        for item in items:
            tracker.record_item_result(category=str(item.get("category") or "待分类"))
        tracker.print_summary(degraded=True, degraded_reason=fallback_reason or "GEMINI_API_KEY 未配置")

    payload = {
        "version": 1,
        "generatedAt": datetime.now(UTC).isoformat(),
        "model": args.model if ai_items is not None else "rule-fallback",
        "items": items,
    }

    write_json_atomically(OUTPUT_PATH, payload, validate=_validate_ecosystem_output)

    category_counts: dict[str, int] = {}
    for item in items:
        cat = str(item.get("category") or "待分类")
        category_counts[cat] = category_counts.get(cat, 0) + 1

    result = {
        "name": "welfare-filter",
        "state": "degraded" if ai_items is None else "success",
        "filterMode": "rules" if ai_items is None else "gemini",
        "reason": fallback_reason or None,
        "model": args.model if ai_items is not None else None,
        "inputCount": len(entries),
        "analyzedCount": len(items),
        "categoryCounts": category_counts,
        "telemetry": tracker.to_dict() if ai_items is not None else None,
    }
    report_result(result, args.summary)
    if args.summary is None and ai_items is None and fallback_reason and "not configured" not in fallback_reason:
        notify_ai_results([result])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
