from __future__ import annotations

import argparse
import json
import os
import re
from pathlib import Path

import requests


def send_notification(key: str, message: dict[str, object]) -> dict[str, object]:
    response = requests.post(
        "https://qyapi.weixin.qq.com/cgi-bin/webhook/send",
        params={"key": key},
        json=message,
        timeout=(5, 15),
    )
    response.raise_for_status()
    payload = response.json()
    if payload.get("errcode") != 0:
        raise RuntimeError(f"WeCom rejected the notification with errcode {payload.get('errcode')}")
    return {"state": "success", "provider": "wecom"}


AI_MODULES = {
    "keywordSearch": "关键词福利筛选",
    "zhujiceping": "主机优惠筛选",
    "welfare-filter": "银行福利筛选",
    "52pojie-ecosystem": "52pojie 生态分析",
}
AI_STATES = {"success", "degraded", "preserved", "skipped", "failed"}


def _safe_ai_reason(result: dict[str, object]) -> str:
    reason = str(result.get("reason") or "")
    if re.search(r"GEMINI_API_KEY\s+is\s+(?:not configured|required)", reason, re.IGNORECASE):
        return "AI 密钥未配置；请检查 GEMINI_API_KEY。"
    status = re.search(r"\bHTTP\s*[:=]?\s*(\d{3})\b", reason, re.IGNORECASE)
    if status:
        code = int(status.group(1))
        if code == 400:
            return "HTTP 400：请求被拒绝；请检查密钥、模型及请求配置。"
        if code in {401, 403}:
            return f"HTTP {code}：凭据或权限被拒绝；请检查密钥是否有效及服务权限。"
        if code == 404:
            return "HTTP 404：请求的模型或接口不可用；请检查模型配置。"
        if code == 429:
            return "HTTP 429：额度不足或请求受限；请检查配额和调用频率。"
        if 500 <= code <= 599:
            return f"HTTP {code}：AI 服务异常；请稍后重试并检查服务状态。"
    if result.get("timedOut") is True or re.search(r"timeout|timed\s*out", reason, re.IGNORECASE):
        return "网络或采集超时；请检查网络和任务耗时，暂不能判定密钥失效。"
    return "原因未分类；请检查本次运行记录，暂不能判定密钥失效。"


def _run_url() -> str | None:
    server = os.environ.get("GITHUB_SERVER_URL", "")
    repository = os.environ.get("GITHUB_REPOSITORY", "")
    run_id = os.environ.get("GITHUB_RUN_ID", "")
    if (
        server != "https://github.com"
        or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]*/[A-Za-z0-9][A-Za-z0-9_.-]*", repository)
        or not re.fullmatch(r"[1-9][0-9]*", run_id)
    ):
        return None
    return f"{server.rstrip('/')}/{repository}/actions/runs/{run_id}"


def _warning(message: str) -> None:
    # Callers pass fixed messages only; never place exception text in annotations.
    print(f"::warning title=AI availability notification::{message}", flush=True)


def notify_ai_results(results: list[dict[str, object]]) -> int:
    """Send at most one sanitized alert for this run; no cross-run state is kept."""
    problems: dict[str, dict[str, object]] = {}
    for result in results:
        name = result.get("name")
        if not isinstance(name, str) or name not in AI_MODULES or result.get("state") == "success":
            continue
        if (
            str(result.get("reason") or "").strip().lower() in {"validationerror: invalid-candidate", "no-eligible-items"}
            and result.get("timedOut") is not True
        ):
            continue
        problems[str(name)] = result
    if not problems:
        print(json.dumps({"state": "skipped", "reason": "no-ai-failures", "affectedCount": 0}))
        return 0

    key = os.environ.get("QYWX_KEY", "").strip()
    if not key:
        _warning("AI failures were detected, but QYWX_KEY is not configured. No notification was sent.")
        print(json.dumps({"state": "failed", "reason": "notification-key-missing", "affectedCount": len(problems)}))
        return 1

    lines = ["AI 辅助能力异常"]
    for name, result in problems.items():
        state = result.get("state")
        effect = "已退回保守规则" if state == "degraded" else (
            "已保留旧数据，内容可能过期" if state == "preserved" else (
                "本轮已跳过更新，现有内容可能过期" if state == "skipped" else "本轮更新未完成"
            )
        )
        lines.append(f"• {AI_MODULES[name]}：{effect}。{_safe_ai_reason(result)}")
    lines.append("以上为本轮合并告警；故障持续时，下一轮会再次提醒。")
    run_url = _run_url()
    if run_url:
        lines.append(f"运行记录：{run_url}")
    try:
        send_notification(key, {"msgtype": "text", "text": {"content": "\n".join(lines)}})
    except Exception:
        _warning("AI failures were detected, but the notification was not accepted. Check the notification configuration.")
        print(json.dumps({"state": "failed", "reason": "notification-not-accepted", "affectedCount": len(problems)}))
        return 1
    print(json.dumps({"state": "success", "provider": "wecom", "affectedCount": len(problems)}))
    return 0


def _notify_ai_status_files(paths: list[Path]) -> int:
    results: list[dict[str, object]] = []
    invalid_count = 0
    for path in paths:
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(payload, dict):
                raise ValueError("invalid status")
            rows = payload.get("collectors", [payload])
            if not isinstance(rows, list) or any(
                not isinstance(row, dict)
                or not isinstance(row.get("name"), str)
                or not isinstance(row.get("state"), str)
                or row.get("state") not in AI_STATES
                for row in rows
            ):
                raise ValueError("invalid status")
            results.extend(rows)
        except FileNotFoundError:
            continue
        except (OSError, UnicodeDecodeError, json.JSONDecodeError, ValueError):
            invalid_count += 1
    if invalid_count:
        _warning("Some AI status summaries could not be read or validated; AI health is not fully known.")
    exit_code = notify_ai_results(results)
    if invalid_count:
        print(json.dumps({"state": "failed", "reason": "invalid-ai-status-summary", "invalidSummaryCount": invalid_count}))
        return 1
    return exit_code


def main() -> int:
    parser = argparse.ArgumentParser(description="Send site updates or consolidated AI availability alerts")
    parser.add_argument("--ai-status", type=Path, action="append", help="AI or collector status JSON from this run; repeat for multiple files")
    args = parser.parse_args()
    if args.ai_status is not None:
        return _notify_ai_status_files(args.ai_status)
    key = os.environ.get("QYWX_KEY", "").strip()
    if not key:
        print(json.dumps({"state": "skipped", "reason": "QYWX_KEY is not configured"}))
        return 0
    message = {
        "msgtype": "news",
        "news": {
            "articles": [
                {
                    "title": "随风而逝",
                    "description": "GitHub个人网站更新了",
                    "url": "https://lptff.github.io/",
                    "picurl": "https://avatars.githubusercontent.com/u/31006738?v=4",
                }
            ]
        },
    }
    try:
        print(json.dumps(send_notification(key, message), ensure_ascii=False))
        return 0
    except Exception as error:
        print(
            json.dumps(
                {"state": "failed", "reason": f"{type(error).__name__}: notification was not accepted"},
                ensure_ascii=False,
            )
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
