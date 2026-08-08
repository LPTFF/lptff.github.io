from __future__ import annotations

import json
import os

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


def main() -> int:
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
